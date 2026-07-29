import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;

  const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

/**
 * Rejects webhook targets that could reach loopback, private networks, local
 * services, or cloud metadata endpoints. This is called both at creation time
 * and immediately before each delivery.
 */
export async function assertSafeWebhookUrl(value: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Webhook URL is invalid");
  }

  if (url.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS");
  }
  if (url.username || url.password) {
    throw new Error("Webhook URL must not include credentials");
  }
  if (url.port && url.port !== "443") {
    throw new Error("Webhook URL must use the standard HTTPS port");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Webhook URL cannot target a local hostname");
  }

  if (isIP(hostname) && isPrivateAddress(hostname)) {
    throw new Error("Webhook URL cannot target a private network");
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Webhook URL resolves to a private or unsupported address");
  }

  return url;
}
