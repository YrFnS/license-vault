import crypto from "node:crypto";

const PREFIX = "enc:v1";

function getEncryptionKey(): Buffer {
  const source =
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!source) {
    throw new Error(
      "WEBHOOK_SECRET_ENCRYPTION_KEY or NEXTAUTH_SECRET is required",
    );
  }
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptWebhookSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
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

export function decryptWebhookSecret(value: string): string {
  if (!value.startsWith(`${PREFIX}:`)) {
    // Backward compatibility for existing plaintext rows. New rows are encrypted.
    return value;
  }

  const [, , ivValue, tagValue, ciphertextValue] = value.split(":");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Stored webhook secret is invalid");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
