// Simple in-memory rate limiter using Map

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Track total hits for stats
let totalRateLimitHits = 0;

export function getRateLimitHits(): number {
  return totalRateLimitHits;
}

export function rateLimit(options: {
  windowMs?: number; // time window in milliseconds (default: 60000 = 1 min)
  maxRequests?: number; // max requests per window (default: 60)
  key?: string; // optional custom key prefix
}): {
  check: (identifier: string) => { allowed: boolean; remaining: number; resetIn: number };
} {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 60;
  const keyPrefix = options.key || 'rl';

  return {
    check(identifier: string) {
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();
      const entry = rateLimitMap.get(key);

      if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
      }

      if (entry.count >= maxRequests) {
        totalRateLimitHits++;
        return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
      }

      entry.count++;
      return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetTime - now };
    },
  };
}

// Pre-configured limiters
export const apiLimiter = rateLimit({ windowMs: 60000, maxRequests: 60 });
export const authLimiter = rateLimit({ windowMs: 900000, maxRequests: 5 }); // 5 per 15 min for auth
export const publicApiLimiter = rateLimit({ windowMs: 60000, maxRequests: 30 }); // 30 per min for public API

// Get limiter stats for the security dashboard
export function getRateLimiterStats() {
  return {
    apiLimiter: { windowMs: 60000, maxRequests: 60, label: 'API Endpoints' },
    authLimiter: { windowMs: 900000, maxRequests: 5, label: 'Authentication' },
    publicApiLimiter: { windowMs: 60000, maxRequests: 30, label: 'Public API' },
    totalHits: totalRateLimitHits,
  };
}
