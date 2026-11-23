import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const SESSION_COOKIE_NAME = "orbit_session";

/**
 * Paths that must remain reachable without a session.
 * `/login` is the personal access screen itself — protecting it would loop forever.
 */
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/session"];

/**
 * Server-only assets that never contain private data.
 * Everything else (including `/api/*`) requires a valid session.
 */
const PUBLIC_ASSETS = [
  "/icon.svg",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/sw.js",
];

function getSessionSecret(): Uint8Array {
  const secret = process.env.ORBIT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ORBIT_SESSION_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      requiredClaims: ["exp"],
    });
    return payload?.authenticated === true;
  } catch {
    return false;
  }
}

/** Headers applied to every response — private content must never be cached publicly. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

function withPrivateHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== request.nextUrl.origin)) {
      return withPrivateHeaders(NextResponse.json({ error: "Invalid request origin." }, { status: 403 }));
    }
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    // The access screen is public. It must not be cached with a redirect target
    // baked in, but it is also not private content.
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "same-origin");
    return response;
  }

  if (PUBLIC_ASSETS.includes(pathname)) {
    // Immutable build output and branding assets keep normal browser caching.
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Private API endpoints answer with 401 JSON, never a redirect.
  if (pathname.startsWith("/api/")) {
    if (!sessionToken || !(await verifySession(sessionToken))) {
      return withPrivateHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    return withPrivateHeaders(NextResponse.next());
  }

  if (!sessionToken || !(await verifySession(sessionToken))) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    }
    const response = NextResponse.redirect(loginUrl);
    if (sessionToken) response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return withPrivateHeaders(response);
  }

  return withPrivateHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match every request path except Next.js build output and obvious static
     * files. Private API routes and pages are all covered by this matcher.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
