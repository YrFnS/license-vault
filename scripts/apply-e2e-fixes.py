from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != expected:
        raise RuntimeError(
            f"{path}: expected {expected} occurrence(s), found {count}: {old[:120]!r}"
        )
    file_path.write_text(text.replace(old, new))
    print(f"updated {path}: {count} replacement(s)")


replace_exact(
    "src/app/[locale]/page.tsx",
    't("features.title").split(" ").slice(0, 2).join(" ")',
    't("footer.features")',
    expected=2,
)
replace_exact(
    "src/app/[locale]/page.tsx",
    't("pricing.title").split(" ").slice(0, 2).join(" ")',
    't("footer.pricing")',
    expected=2,
)

replace_exact(
    "src/app/api/subcontractors/[id]/portal/route.ts",
    '      portalExpiresAt: { gt: new Date() },\n',
    "",
)

missing_portal = '''    if (!subcontractor) {
      return NextResponse.json(
        { error: "This portal link is invalid or has expired." },
        { status: 404 },
      );
    }

'''
classified_portal = '''    if (!subcontractor) {
      return NextResponse.json(
        { error: "This portal link is invalid or has been removed." },
        { status: 404 },
      );
    }
    if (
      !subcontractor.portalExpiresAt ||
      subcontractor.portalExpiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "This portal link has expired." },
        { status: 410 },
      );
    }

'''
replace_exact(
    "src/app/api/subcontractors/[id]/portal/route.ts",
    missing_portal,
    classified_portal,
    expected=2,
)

old_management_check = '''async function testManagementApis(context, account, expectedStatus) {
  return runPageCheck(context, `${account.label} management authorization`, async (page) => {
    await gotoPath(page, "/en/dashboard");
    const team = await browserFetch(page, "/api/team");
    const adminStats = await browserFetch(page, "/api/admin/stats");
    assert(team.status === expectedStatus, `/api/team expected ${expectedStatus}, received ${team.status}`);
    assert(adminStats.status === expectedStatus, `/api/admin/stats expected ${expectedStatus}, received ${adminStats.status}`);
    return { teamStatus: team.status, adminStatsStatus: adminStats.status };
  }, { allowConsoleErrors: expectedStatus !== 200 });
}
'''
new_management_check = '''async function testManagementApis(
  context,
  account,
  expectedTeamStatus,
  expectedAdminStatsStatus,
) {
  return runPageCheck(context, `${account.label} management authorization`, async (page) => {
    await gotoPath(page, "/en/dashboard");
    const team = await browserFetch(page, "/api/team");
    const adminStats = await browserFetch(page, "/api/admin/stats");
    assert(
      team.status === expectedTeamStatus,
      `/api/team expected ${expectedTeamStatus}, received ${team.status}`,
    );
    assert(
      adminStats.status === expectedAdminStatsStatus,
      `/api/admin/stats expected ${expectedAdminStatsStatus}, received ${adminStats.status}`,
    );
    return { teamStatus: team.status, adminStatsStatus: adminStats.status };
  }, { allowConsoleErrors: expectedTeamStatus !== 200 || expectedAdminStatsStatus !== 200 });
}
'''
replace_exact(
    "scripts/e2e-production.mjs",
    old_management_check,
    new_management_check,
)
replace_exact(
    "scripts/e2e-production.mjs",
    "      await testManagementApis(context, account, 200);\n",
    "      await testManagementApis(context, account, 200, 200);\n",
    expected=2,
)
replace_exact(
    "scripts/e2e-production.mjs",
    "      await testManagementApis(context, account, 403);\n",
    "      await testManagementApis(context, account, 200, 403);\n",
)
replace_exact(
    "scripts/e2e-production.mjs",
    '''        await gotoPath(page, "/en/admin");
        const text = await bodyText(page);
''',
    '''        await gotoPath(page, "/en/admin");
        await waitForText(page, "You don't have permission to access this page");
        const text = await bodyText(page);
''',
)
