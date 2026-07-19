const url = process.argv[2];

if (!url) throw new Error("Usage: node scripts/check-csp.mjs <url>");

const response = await fetch(url);
const csp = response.headers.get("content-security-policy") || "";
const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
const html = await response.text();
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
	.map((match) => match[1])
	.filter((attributes) => !/\bsrc=/.test(attributes));

if (!response.ok) throw new Error(`HTTP ${response.status}`);
if (!nonce) throw new Error("CSP nonce is missing");
if (!inlineScripts.length) throw new Error("No inline Next.js scripts found");
if (inlineScripts.some((attributes) => !attributes.includes(`nonce="${nonce}"`))) {
	throw new Error("An inline script is missing the CSP nonce");
}

console.log(`CSP nonce verified on ${inlineScripts.length} inline scripts`);
