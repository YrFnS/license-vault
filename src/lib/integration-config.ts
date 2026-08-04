import crypto from "node:crypto";
import { z } from "zod";
import { assertSafeWebhookUrl } from "@/lib/safe-webhook-url";

const PREFIX = "integration:enc:v1";

export const integrationConfigSchema = z.object({
  apiKey: z.string().trim().min(8).max(4_000),
  baseUrl: z.string().trim().url().max(2_000),
  syncFrequency: z.enum(["realtime", "hourly", "daily", "weekly"]).default("daily"),
  mappings: z.record(z.string().max(100), z.boolean()).default({}),
});

export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

function getEncryptionKey(): Buffer {
  const source =
    process.env.INTEGRATION_CONFIG_ENCRYPTION_KEY ||
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET;
  if (!source) {
    throw new Error(
      "INTEGRATION_CONFIG_ENCRYPTION_KEY, WEBHOOK_SECRET_ENCRYPTION_KEY, or NEXTAUTH_SECRET is required",
    );
  }
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptIntegrationConfig(config: IntegrationConfig): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(config), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptIntegrationConfig(value: string | null): IntegrationConfig | null {
  if (!value) return null;

  let raw = value;
  if (value.startsWith(`${PREFIX}:`)) {
    const [, , , ivValue, tagValue, ciphertextValue] = value.split(":");
    if (!ivValue || !tagValue || !ciphertextValue) {
      throw new Error("Stored integration configuration is invalid");
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    raw = Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Compatibility with the old UI, which stored a masked key. Such records
    // remain disconnected until the user provides a real credential.
    if (parsed.apiKey === "••••••••" || parsed.apiKey === null) return null;
    return integrationConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function getSafeIntegrationConfig(config: IntegrationConfig | null) {
  if (!config) {
    return {
      baseUrl: null,
      syncFrequency: "daily",
      mappings: {},
      credentialConfigured: false,
    };
  }
  return {
    baseUrl: config.baseUrl,
    syncFrequency: config.syncFrequency,
    mappings: config.mappings,
    credentialConfigured: true,
  };
}

export interface IntegrationConnectionResult {
  success: boolean;
  message: string;
  status?: number;
  latencyMs?: number;
}

/**
 * Performs a real reachability/authentication check against a user-supplied
 * public HTTPS endpoint. It does not claim provider-specific functionality or
 * data-sync support.
 */
export async function testIntegrationConnection(
  config: IntegrationConfig,
): Promise<IntegrationConnectionResult> {
  let url: URL;
  try {
    url = await assertSafeWebhookUrl(config.baseUrl);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message.replaceAll("Webhook", "Integration endpoint")
          : "Integration endpoint is not allowed",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const startedAt = Date.now();

  try {
    let response = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "X-API-Key": config.apiKey,
        Accept: "application/json",
      },
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "X-API-Key": config.apiKey,
          Accept: "application/json",
          Range: "bytes=0-0",
        },
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
      });
    }
    await response.body?.cancel().catch(() => undefined);

    const latencyMs = Date.now() - startedAt;
    if (response.status >= 300 && response.status < 400) {
      return {
        success: false,
        status: response.status,
        latencyMs,
        message: "The endpoint redirected the request. Use the final HTTPS API URL.",
      };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        status: response.status,
        latencyMs,
        message: "The endpoint rejected the supplied credentials.",
      };
    }
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        latencyMs,
        message: `The endpoint returned HTTP ${response.status}.`,
      };
    }

    return {
      success: true,
      status: response.status,
      latencyMs,
      message: `Endpoint verified successfully in ${latencyMs} ms.`,
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - startedAt,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "The connection test timed out."
          : "The endpoint could not be reached securely.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Provider adapters are not shipped yet; connection health is supported. */
export function hasAutomaticSyncAdapter(_type: string): boolean {
  return false;
}
