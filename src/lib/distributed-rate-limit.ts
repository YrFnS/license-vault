interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  source: "redis" | "memory";
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`;

function checkMemoryLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetIn: windowMs,
      source: "memory",
    };
  }

  entry.count += 1;

  if (memoryStore.size > 5_000) {
    for (const [storedKey, storedEntry] of memoryStore.entries()) {
      if (now >= storedEntry.resetAt) memoryStore.delete(storedKey);
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetIn: Math.max(0, entry.resetAt - now),
    source: "memory",
  };
}

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function checkRedisLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const config = getRedisConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        RATE_LIMIT_SCRIPT,
        1,
        `license-vault:rate-limit:${key}`,
        windowMs,
      ]),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      result?: [number | string, number | string];
      error?: string;
    };
    if (payload.error || !Array.isArray(payload.result)) return null;

    const count = Number(payload.result[0]);
    const ttl = Number(payload.result[1]);
    if (!Number.isFinite(count)) return null;

    const resetIn = Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs;
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetIn,
      source: "redis",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Uses Upstash Redis REST when configured so limits are shared across edge
 * instances. Development and temporary Redis failures fall back to a bounded
 * in-memory limiter instead of disabling protection entirely.
 */
export async function checkDistributedRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return (
    (await checkRedisLimit(key, maxRequests, windowMs)) ??
    checkMemoryLimit(key, maxRequests, windowMs)
  );
}
