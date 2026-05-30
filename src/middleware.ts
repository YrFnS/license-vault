import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const AI_DOMAIN = process.env.AI_API_URL ? new URL(process.env.AI_API_URL).hostname : (process.env.AI_DOMAIN || 'openrouter.ai');

// ── In-memory rate limit store (Edge-compatible) ────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 60000);
}

// Rate limit configurations
const AUTH_LIMIT = { max: 10, window: 15 * 60 * 1000 };       // 10 req / 15 min
const PUBLIC_API_LIMIT = { max: 60, window: 60 * 1000 };      // 60 req / min
const GENERAL_API_LIMIT = { max: 120, window: 60 * 1000 };    // 120 req / min

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API Routes: Rate Limiting + Security Headers ──────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);

    // Select rate limit tier based on route
    let limitResult: { allowed: boolean; remaining: number; resetIn: number };
    if (pathname.startsWith('/api/auth/')) {
      limitResult = checkRateLimit(`auth:${ip}`, AUTH_LIMIT.max, AUTH_LIMIT.window);
    } else if (pathname.startsWith('/api/v1/')) {
      limitResult = checkRateLimit(`public:${ip}`, PUBLIC_API_LIMIT.max, PUBLIC_API_LIMIT.window);
    } else {
      limitResult = checkRateLimit(`api:${ip}`, GENERAL_API_LIMIT.max, GENERAL_API_LIMIT.window);
    }

    if (!limitResult.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(limitResult.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + limitResult.resetIn),
          },
        }
      );
    }

    // ── CSRF Protection for mutation requests ──────────────────────────────
    // Edge-compatible approach: validate Origin/Referer header for same-origin requests
    const method = request.method;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isAuthRoute = pathname.startsWith('/api/auth/');
    const isPublicApiRoute = pathname.startsWith('/api/v1/');
    const isCronRoute = pathname.startsWith('/api/cron/');
    const isPlatformRoute = pathname.startsWith('/api/platform/');
    const isFileRoute = pathname.startsWith('/api/files/');
    const isSendScheduledRoute = pathname.startsWith('/api/reports/send-scheduled');

    if (isMutation && !isAuthRoute && !isPublicApiRoute && !isCronRoute && !isPlatformRoute && !isSendScheduledRoute) {
      // Origin-based CSRF check: ensure the request comes from the same origin
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const host = request.headers.get('host');

      // Allow requests with valid same-origin header
      const devPort = process.env.DEV_PORT || '3000';
      const allowedOrigins = [host, `localhost:${request.nextUrl.port || devPort}`];
      const requestOrigin = origin || (referer ? new URL(referer).host : '');

      const isSameOrigin = requestOrigin && allowedOrigins.some(allowed =>
        requestOrigin === allowed || requestOrigin.endsWith(allowed)
      );

      // Also allow Bearer token authenticated requests (API users)
      const hasBearerToken = (request.headers.get('authorization') || '').startsWith('Bearer ');

      if (!isSameOrigin && !hasBearerToken) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF check failed. Request origin not allowed.' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Apply response with rate limit and security headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(limitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(Date.now() + limitResult.resetIn));

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    return response;
  }

  // ── Non-API Routes: Intl + Security Headers ─────────────────────────────
  const response = intlMiddleware(request);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://${AI_DOMAIN}; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  );

  return response;
}

export const config = {
  matcher: ['/', '/(en|ar)/:path*', '/api/:path*'],
};
