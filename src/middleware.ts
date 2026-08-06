import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { checkDistributedRateLimit } from "./lib/distributed-rate-limit";

const intlMiddleware = createMiddleware(routing);

function getAiDomain(): string {
  try {
    return process.env.AI_API_URL
      ? new URL(process.env.AI_API_URL).hostname
      : process.env.AI_DOMAIN || "openrouter.ai";
  } catch {
    return "openrouter.ai";
  }
}

const AI_DOMAIN = getAiDomain();
const AUTH_LIMIT = { max: 10, window: 15 * 60 * 1000 };
const PUBLIC_API_LIMIT = { max: 60, window: 60 * 1000 };
const GENERAL_API_LIMIT = { max: 120, window: 60 * 1000 };

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>([request.nextUrl.origin]);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "");

  if (host) origins.add(`${protocol}://${host}`);

  const configured = [
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ];
  for (const value of configured) {
    const origin = parseOrigin(value?.trim() || null);
    if (origin) origins.add(origin);
  }

  return origins;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const isAuthAttempt = pathname.startsWith("/api/auth/") && request.method !== "GET";
    const limit = isAuthAttempt
      ? AUTH_LIMIT
      : pathname.startsWith("/api/v1/")
        ? PUBLIC_API_LIMIT
        : GENERAL_API_LIMIT;
    const prefix = isAuthAttempt
      ? "auth"
      : pathname.startsWith("/api/v1/")
        ? "public"
        : "api";
    const limitResult = await checkDistributedRateLimit(
      `${prefix}:${ip}`,
      limit.max,
      limit.window,
    );

    if (!limitResult.allowed) {
      const response = applySecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(limitResult.resetIn / 1000)),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Date.now() + limitResult.resetIn),
              "X-RateLimit-Source": limitResult.source,
            },
          },
        ),
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
    const isExemptRoute =
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/v1/") ||
      pathname.startsWith("/api/cron/") ||
      pathname.startsWith("/api/platform/") ||
      pathname.startsWith("/api/reports/send-scheduled");

    if (isMutation && !isExemptRoute) {
      const origin = parseOrigin(request.headers.get("origin"));
      const refererOrigin = parseOrigin(request.headers.get("referer"));
      const requestOrigin = origin || refererOrigin;
      const hasBearerToken = request.headers
        .get("authorization")
        ?.startsWith("Bearer ");

      if ((!requestOrigin || !getAllowedOrigins(request).has(requestOrigin)) && !hasBearerToken) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: "CSRF check failed. Request origin not allowed." },
            { status: 403 },
          ),
        );
      }
    }

    const response = applySecurityHeaders(NextResponse.next());
    response.headers.set("X-RateLimit-Remaining", String(limitResult.remaining));
    response.headers.set("X-RateLimit-Reset", String(Date.now() + limitResult.resetIn));
    response.headers.set("X-RateLimit-Source", limitResult.source);
    response.headers.set("Cache-Control", "no-store");
    response.headers.append("Vary", "Authorization");
    response.headers.append("Vary", "Cookie");
    return response;
  }

  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://${AI_DOMAIN}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = applySecurityHeaders(
    intlMiddleware(new NextRequest(request, { headers: requestHeaders })),
  );
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ["/", "/(en|ar)/:path*", "/api/:path*"],
};
