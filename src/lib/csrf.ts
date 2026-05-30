import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CsrfToken {
  token: string;
  expiresAt: number;
}

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map<string, CsrfToken>();

// Stats tracking
let tokensGenerated = 0;
let tokensValidated = 0;
let validationFailures = 0;

export function getCsrfStats() {
  return {
    tokensGenerated,
    tokensValidated,
    validationFailures,
    activeTokens: csrfTokenStore.size,
  };
}

export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  csrfTokenStore.set(`${sessionId}:${token}`, {
    token,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
  });

  tokensGenerated++;

  // Clean up expired tokens periodically
  if (csrfTokenStore.size > 10000) {
    const now = Date.now();
    for (const [key, value] of csrfTokenStore.entries()) {
      if (value.expiresAt < now) csrfTokenStore.delete(key);
    }
  }

  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const entry = csrfTokenStore.get(`${sessionId}:${token}`);
  if (!entry) {
    validationFailures++;
    return false;
  }

  // Check expiry
  if (entry.expiresAt < Date.now()) {
    csrfTokenStore.delete(`${sessionId}:${token}`);
    validationFailures++;
    return false;
  }

  // One-time use - delete after validation
  csrfTokenStore.delete(`${sessionId}:${token}`);
  tokensValidated++;
  return true;
}
