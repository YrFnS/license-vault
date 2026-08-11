import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = (process.env.BASE_URL || "https://license-vault-self.vercel.app").replace(/\/$/, "");
const CHROME_PATH = process.env.CHROME_PATH;
const DEMO_PASSWORD = process.env.E2E_PASSWORD || "DemoPass123!";
const RUN_ID = process.env.GITHUB_RUN_ID || String(Date.now());
const OUTPUT_DIR = path.resolve(process.env.E2E_OUTPUT_DIR || "artifacts/e2e");
const DEFAULT_TIMEOUT = 30_000;

if (!CHROME_PATH) {
  throw new Error("CHROME_PATH is required");
}

await mkdir(OUTPUT_DIR, { recursive: true });

const results = [];
const routeCoverage = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function absoluteUrl(relativePath) {
  return new URL(relativePath, `${BASE_URL}/`).toString();
}

function errorMessage(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

async function bodyText(page) {
  return page.$eval("body", (element) => element.innerText);
}

async function waitForText(page, text, timeout = DEFAULT_TIMEOUT) {
  await page.waitForFunction(
    (expected) => document.body?.innerText.includes(expected),
    { timeout },
    text,
  );
}

async function gotoPath(page, relativePath, options = {}) {
  const response = await page.goto(absoluteUrl(relativePath), {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_TIMEOUT,
  });
  assert(response, `No HTTP response received for ${relativePath}`);
  assert(response.status() < 500, `${relativePath} returned HTTP ${response.status()}`);
  await sleep(options.settleMs ?? 750);
  return response;
}

async function browserFetch(page, relativePath, options = {}) {
  return page.evaluate(
    async ({ requestPath, requestOptions }) => {
      const response = await fetch(requestPath, {
        ...requestOptions,
        credentials: "same-origin",
      });
      const raw = await response.text();
      let body = raw;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        // Preserve non-JSON response bodies for diagnostics.
      }
      return {
        status: response.status,
        body,
        headers: Object.fromEntries(response.headers.entries()),
      };
    },
    { requestPath: relativePath, requestOptions: options },
  );
}

function attachDiagnostics(page, label) {
  const diagnostics = {
    label,
    pageErrors: [],
    consoleErrors: [],
    requestFailures: [],
    serverErrors: [],
  };

  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(errorMessage(error));
  });

  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "unknown failure";
    const type = request.resourceType();
    if (failure.includes("ERR_ABORTED")) return;
    if (!["document", "script", "stylesheet", "xhr", "fetch"].includes(type)) return;
    diagnostics.requestFailures.push(`${request.method()} ${request.url()} (${type}): ${failure}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      diagnostics.serverErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  return diagnostics;
}

function actionableConsoleErrors(messages) {
  const ignored = [
    /Failed to load resource: the server responded with a status of (401|403|404|409|410)/i,
    /favicon/i,
  ];
  return messages.filter((message) => !ignored.some((pattern) => pattern.test(message)));
}

async function capture(page, name) {
  const fileName = `${safeName(name)}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    return fileName;
  } catch {
    return null;
  }
}

async function runPageCheck(context, name, operation, options = {}) {
  const startedAt = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(DEFAULT_TIMEOUT);
  page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
  await page.setViewport(options.viewport || { width: 1440, height: 1000, deviceScaleFactor: 1 });
  const diagnostics = attachDiagnostics(page, name);

  try {
    const details = (await operation(page)) || {};
    await sleep(250);

    const seriousConsoleErrors = options.allowConsoleErrors
      ? []
      : actionableConsoleErrors(diagnostics.consoleErrors);
    const browserFailures = [
      ...diagnostics.pageErrors,
      ...seriousConsoleErrors,
      ...diagnostics.requestFailures,
      ...diagnostics.serverErrors,
    ];
    assert(browserFailures.length === 0, `Browser diagnostics: ${browserFailures.join(" | ")}`);

    const screenshot = options.screenshot ? await capture(page, name) : null;
    const result = {
      name,
      status: "passed",
      durationMs: Date.now() - startedAt,
      details,
      diagnostics,
      screenshot,
    };
    results.push(result);
    console.log(`PASS ${name}`);
    return { ok: true, value: details };
  } catch (error) {
    const screenshot = await capture(page, `${name}-failure`);
    const result = {
      name,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: errorMessage(error),
      diagnostics,
      screenshot,
      url: page.url(),
    };
    results.push(result);
    console.error(`FAIL ${name}: ${result.error}`);
    return { ok: false, error };
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function smokeRoute(context, role, relativePath) {
  return runPageCheck(context, `${role} route ${relativePath}`, async (page) => {
    const response = await gotoPath(page, relativePath, { settleMs: 1_000 });
    const text = await bodyText(page);
    assert(text.trim().length > 20, `${relativePath} rendered an empty page`);
    assert(!/Application error|Internal Server Error|Unhandled Runtime Error/i.test(text), `${relativePath} rendered an application error`);
    routeCoverage.push({ role, path: relativePath, status: response.status() });
    return {
      httpStatus: response.status(),
      finalPath: new URL(page.url()).pathname,
      heading: await page.$eval("h1, h2", (element) => element.textContent?.trim() || "").catch(() => ""),
    };
  });
}

async function loginContext(browser, account) {
  const context = await browser.createBrowserContext();
  const login = await runPageCheck(
    context,
    `${account.label} login`,
    async (page) => {
      await gotoPath(page, "/en/login");
      await page.type("#email", account.email);
      await page.type("#password", DEMO_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        () => window.location.pathname.includes("/dashboard"),
        { timeout: DEFAULT_TIMEOUT },
      );
      await waitForText(page, "Dashboard");

      const session = await browserFetch(page, "/api/auth/session");
      assert(session.status === 200, `Session endpoint returned ${session.status}`);
      assert(session.body?.user?.email === account.email, `Session email mismatch for ${account.label}`);
      assert(session.body?.user?.role === account.role, `Expected role ${account.role}, received ${session.body?.user?.role}`);
      assert(session.body?.user?.activeOrgId, `${account.label} session has no active organization`);

      return {
        email: session.body.user.email,
        role: session.body.user.role,
        activeOrgId: session.body.user.activeOrgId,
      };
    },
    { screenshot: true },
  );

  if (!login.ok) {
    await context.close();
    return null;
  }
  return context;
}

async function testManagementApis(context, account, expectedStatus) {
  return runPageCheck(context, `${account.label} management authorization`, async (page) => {
    await gotoPath(page, "/en/dashboard");
    const team = await browserFetch(page, "/api/team");
    const adminStats = await browserFetch(page, "/api/admin/stats");
    assert(team.status === expectedStatus, `/api/team expected ${expectedStatus}, received ${team.status}`);
    assert(adminStats.status === expectedStatus, `/api/admin/stats expected ${expectedStatus}, received ${adminStats.status}`);
    return { teamStatus: team.status, adminStatsStatus: adminStats.status };
  }, { allowConsoleErrors: expectedStatus !== 200 });
}

async function testLicenseCrud(context, account) {
  return runPageCheck(context, `${account.label} license CRUD`, async (page) => {
    await gotoPath(page, "/en/licenses");
    const suffix = `${RUN_ID}-${account.role}-${Date.now()}`;
    const payload = {
      name: `E2E Browser License ${suffix}`,
      type: "E2E Test Credential",
      licenseNumber: `E2E-${suffix}`,
      issuedBy: "Automated Browser Verification",
      state: "Iraq",
      issueDate: "2026-01-15",
      expirationDate: "2027-01-15",
      notes: "Temporary record created by the production browser E2E suite.",
    };

    let licenseId = null;
    let cleanupStatus = null;
    try {
      const created = await browserFetch(page, "/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      assert(created.status === 201, `Create license returned ${created.status}: ${JSON.stringify(created.body)}`);
      licenseId = created.body?.license?.id;
      assert(licenseId, "Create license response did not include an id");

      const fetched = await browserFetch(page, `/api/licenses/${licenseId}`);
      assert(fetched.status === 200, `Read license returned ${fetched.status}`);
      assert(fetched.body?.license?.licenseNumber === payload.licenseNumber, "Created license could not be read back correctly");

      const updated = await browserFetch(page, `/api/licenses/${licenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated and verified by browser E2E." }),
      });
      assert(updated.status === 200, `Update license returned ${updated.status}: ${JSON.stringify(updated.body)}`);
      assert(updated.body?.license?.notes === "Updated and verified by browser E2E.", "License update was not persisted");

      const search = await browserFetch(page, `/api/licenses?search=${encodeURIComponent(payload.licenseNumber)}`);
      assert(search.status === 200, `License search returned ${search.status}`);
      assert(search.body?.licenses?.some((license) => license.id === licenseId), "Created license was not returned by search");
    } finally {
      if (licenseId) {
        const deleted = await browserFetch(page, `/api/licenses/${licenseId}`, { method: "DELETE" });
        cleanupStatus = deleted.status;
      }
    }

    assert(cleanupStatus === 200, `Temporary license cleanup returned ${cleanupStatus}`);
    const afterDelete = await browserFetch(page, `/api/licenses/${licenseId}`);
    assert(afterDelete.status === 404, `Deleted license remained accessible with status ${afterDelete.status}`);
    return { created: true, updated: true, deleted: true, licenseNumber: payload.licenseNumber };
  });
}

async function testMemberWriteDenial(context) {
  return runPageCheck(context, "member license write denial", async (page) => {
    await gotoPath(page, "/en/licenses");
    const response = await browserFetch(page, "/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "E2E Forbidden License",
        type: "E2E Test Credential",
        licenseNumber: `E2E-FORBIDDEN-${RUN_ID}`,
        issuedBy: "Automated Browser Verification",
        issueDate: "2026-01-15",
        expirationDate: "2027-01-15",
      }),
    });
    assert(response.status === 403, `Member create expected 403, received ${response.status}`);

    const addLicenseActions = await page.$$eval("button, a", (elements) =>
      elements.filter((element) => {
        const text = element.textContent?.trim();
        const rect = element.getBoundingClientRect();
        return text === "Add License" && rect.width > 0 && rect.height > 0;
      }).length,
    );
    assert(addLicenseActions === 0, "Member UI exposed the Add License action");
    return { createStatus: response.status, addLicenseActionVisible: false };
  }, { allowConsoleErrors: true });
}

async function writeSummary() {
  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const summary = {
    baseUrl: BASE_URL,
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
    totals: { passed, failed, total: results.length },
    routeCoverage,
    results,
  };
  await writeFile(path.join(OUTPUT_DIR, "results.json"), `${JSON.stringify(summary, null, 2)}\n`);

  const lines = [
    "# LicenseVault browser E2E",
    "",
    `- Base URL: ${BASE_URL}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Total checks: ${results.length}`,
    `- Authenticated route checks: ${routeCoverage.length}`,
    "",
    "## Results",
    "",
    "| Status | Check | Duration | Details |",
    "|---|---|---:|---|",
  ];

  for (const result of results) {
    const status = result.status === "passed" ? "PASS" : "FAIL";
    const details = result.status === "passed"
      ? JSON.stringify(result.details || {}).replace(/\|/g, "\\|")
      : String(result.error || "Unknown error").replace(/\|/g, "\\|");
    lines.push(`| ${status} | ${result.name} | ${result.durationMs} ms | ${details} |`);
  }
  lines.push("");
  await writeFile(path.join(OUTPUT_DIR, "summary.md"), `${lines.join("\n")}\n`);

  console.log(`E2E complete: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ],
});

try {
  const publicContext = await browser.createBrowserContext();

  await runPageCheck(publicContext, "public English landing page", async (page) => {
    const response = await gotoPath(page, "/en");
    await waitForText(page, "Never Miss a License Renewal");
    const navLabels = await page.$$eval("header nav a", (elements) =>
      elements.map((element) => element.textContent?.trim()).filter(Boolean),
    );
    assert(navLabels.includes("Features"), `Expected Features navigation label, received ${JSON.stringify(navLabels)}`);
    assert(navLabels.includes("How It Works"), `Expected How It Works navigation label, received ${JSON.stringify(navLabels)}`);
    assert(navLabels.includes("Pricing"), `Expected Pricing navigation label, received ${JSON.stringify(navLabels)}`);
    const text = await bodyText(page);
    assert(text.includes("$0"), "Free plan price was not rendered as $0");
    assert(text.includes("$29"), "Pro plan price was not rendered as $29");
    return { httpStatus: response.status(), navLabels };
  }, { screenshot: true });

  await runPageCheck(publicContext, "public Arabic RTL landing page", async (page) => {
    await gotoPath(page, "/ar");
    const direction = await page.$eval("html", (element) => element.getAttribute("dir"));
    const text = await bodyText(page);
    const navLabels = await page.$$eval("header nav a", (elements) =>
      elements.map((element) => element.textContent?.trim()).filter(Boolean),
    );
    assert(direction === "rtl", `Arabic page expected dir=rtl, received ${direction}`);
    assert(/[\u0600-\u06FF]/.test(text), "Arabic landing page did not render Arabic text");
    assert(navLabels.length === 3, `Arabic navigation expected 3 links, received ${navLabels.length}`);
    return { direction, navLabels };
  }, { screenshot: true });

  await runPageCheck(publicContext, "public login page", async (page) => {
    const response = await gotoPath(page, "/en/login");
    assert(await page.$("#email"), "Email field is missing");
    assert(await page.$("#password"), "Password field is missing");
    assert(await page.$('button[type="submit"]'), "Login submit button is missing");
    return { httpStatus: response.status() };
  });

  await runPageCheck(publicContext, "anonymous dashboard redirect", async (page) => {
    await gotoPath(page, "/en/dashboard");
    await page.waitForFunction(() => window.location.pathname.endsWith("/login"), { timeout: DEFAULT_TIMEOUT });
    assert(new URL(page.url()).pathname === "/en/login", `Expected /en/login, received ${page.url()}`);
    return { finalPath: new URL(page.url()).pathname };
  });

  await runPageCheck(publicContext, "public compliance share", async (page) => {
    await gotoPath(page, "/en/compliance/demo-compliance-share");
    await waitForText(page, "Acme Construction");
    const text = await bodyText(page);
    assert(text.includes("Compliance Rate"), "Compliance share did not render its score");
    return { organization: "Acme Construction" };
  }, { screenshot: true });

  await runPageCheck(publicContext, "invalid compliance share", async (page) => {
    await gotoPath(page, "/en/compliance/e2e-invalid-token");
    await waitForText(page, "Compliance link not found or expired");
    return { invalidStateRendered: true };
  }, { allowConsoleErrors: true });

  await runPageCheck(publicContext, "active subcontractor portal", async (page) => {
    await gotoPath(page, "/subcontractor-portal/demo-portal-active");
    await waitForText(page, "Desert Sun Electric");
    const text = await bodyText(page);
    assert(text.includes("Subcontractor Portal"), "Subcontractor portal heading is missing");
    return { company: "Desert Sun Electric" };
  }, { screenshot: true });

  await runPageCheck(publicContext, "expired subcontractor portal", async (page) => {
    await gotoPath(page, "/subcontractor-portal/demo-portal-expired");
    await waitForText(page, "Portal Link Expired");
    return { expiredStateRendered: true };
  }, { allowConsoleErrors: true });

  await runPageCheck(publicContext, "pending signature request", async (page) => {
    await gotoPath(page, "/en/sign/demo-sign-pending");
    await waitForText(page, "Compliance Attestation");
    const text = await bodyText(page);
    assert(text.includes("Sign Document"), "Pending signature page did not expose the signing flow");
    return { document: "Compliance Attestation" };
  }, { screenshot: true });

  await runPageCheck(publicContext, "completed signature request", async (page) => {
    await gotoPath(page, "/en/sign/demo-sign-signed");
    await waitForText(page, "Document Signed");
    const text = await bodyText(page);
    assert(text.includes("Signed Renewal"), "Signed document title is missing");
    return { document: "Signed Renewal", state: "signed" };
  });

  await runPageCheck(publicContext, "expired password reset token", async (page) => {
    await gotoPath(page, "/en/reset-password?token=demo-reset-valid");
    await page.type("#new-password", "E2eExpired123!").catch(async () => {
      const inputs = await page.$$('input[type="password"]');
      assert(inputs.length >= 2, "Reset password fields are missing");
      await inputs[0].type("E2eExpired123!");
      await inputs[1].type("E2eExpired123!");
    });
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      const confirmationValue = await passwordInputs[1].evaluate((input) => input.value);
      if (!confirmationValue) await passwordInputs[1].type("E2eExpired123!");
    }
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => document.body?.innerText.toLowerCase().includes("expired"),
      { timeout: DEFAULT_TIMEOUT },
    );
    const text = (await bodyText(page)).toLowerCase();
    assert(text.includes("expired"), "Expired reset token did not render an expired state");
    return { expiredStateRendered: true };
  }, { allowConsoleErrors: true });

  await publicContext.close();

  const accounts = [
    { label: "owner", email: "owner@licensevault.com", role: "owner" },
    { label: "admin", email: "admin@licensevault.com", role: "admin" },
    { label: "member", email: "member@licensevault.com", role: "member" },
    { label: "demo owner", email: "demo@licensevault.com", role: "owner" },
  ];

  const ownerRoutes = [
    "/en/dashboard",
    "/en/licenses",
    "/en/projects",
    "/en/compliance",
    "/en/insurance",
    "/en/subcontractors",
    "/en/qualifiers",
    "/en/ce-tracking",
    "/en/approvals",
    "/en/workflows",
    "/en/documents/generate",
    "/en/signatures",
    "/en/alerts",
    "/en/regulatory-alerts",
    "/en/analytics",
    "/en/reports",
    "/en/ai-chat",
    "/en/team",
    "/en/integrations",
    "/en/settings",
    "/en/settings/api",
    "/en/audit-log",
    "/en/admin"
  ];

  for (const account of accounts) {
    const context = await loginContext(browser, account);
    if (!context) continue;

    if (account.label === "owner") {
      for (let index = 0; index < ownerRoutes.length; index += 1) {
        await smokeRoute(context, account.label, ownerRoutes[index]);
        if ((index + 1) % 8 === 0) await sleep(2_000);
      }
      await testManagementApis(context, account, 200);
      await testLicenseCrud(context, account);
    } else if (account.label === "admin") {
      for (const route of ["/en/dashboard", "/en/licenses", "/en/team", "/en/settings/api", "/en/audit-log", "/en/admin"]) {
        await smokeRoute(context, account.label, route);
      }
      await testManagementApis(context, account, 200);
      await testLicenseCrud(context, account);
    } else if (account.label === "member") {
      for (const route of ["/en/dashboard", "/en/licenses", "/en/projects", "/en/compliance", "/en/settings"]) {
        await smokeRoute(context, account.label, route);
      }
      await testManagementApis(context, account, 403);
      await testMemberWriteDenial(context);
      await runPageCheck(context, "member admin page denial", async (page) => {
        await gotoPath(page, "/en/admin");
        const text = await bodyText(page);
        assert(text.includes("You don't have permission to access this page"), "Member did not receive the admin access-denied state");
        return { denied: true };
      }, { screenshot: true, allowConsoleErrors: true });
    } else {
      await smokeRoute(context, account.label, "/en/dashboard");
    }

    await context.close();
  }
} finally {
  await browser.close();
  await writeSummary();
}
