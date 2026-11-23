import "server-only";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "orbit_session";
export const SESSION_DURATION = 60 * 60 * 24 * 14; // 14 days

interface SessionPayload extends JWTPayload {
  authenticated: boolean;
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.ORBIT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ORBIT_SESSION_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Resolve the stored password hash.
 *
 * bcrypt hashes start with `$2b$` — and Next.js's dotenv-expand treats `$`
 * as a variable reference, silently collapsing a raw hash to an empty string
 * inside a `.env` file. To stay usable in both places we accept two forms:
 *
 *   - a raw bcrypt hash  (`$2b$12$...`)  — typical when set via a host's
 *     secret manager, which performs no shell-style expansion.
 *   - a base64-encoded hash (`JDJiJDEyJC...`) — required inside `.env` files.
 *
 * Exactly one of them is required; never both.
 */
function getPasswordHash(): string {
  const raw = process.env.ORBIT_PASSWORD_HASH;
  if (!raw) {
    throw new Error("ORBIT_PASSWORD_HASH is not set");
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("ORBIT_PASSWORD_HASH is empty");
  }

  if (trimmed.startsWith("$2")) {
    return trimmed;
  }

  // Base64 form.
  let decoded: string;
  try {
    decoded = Buffer.from(trimmed, "base64").toString("utf8");
  } catch {
    throw new Error("ORBIT_PASSWORD_HASH is not a valid bcrypt hash");
  }

  if (!decoded.startsWith("$2")) {
    throw new Error(
      "ORBIT_PASSWORD_HASH must be a bcrypt hash, base64-encoded when stored in a .env file"
    );
  }

  return decoded;
}

/**
 * Verify a plaintext password against the stored hash.
 * Runs only on the server.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = getPasswordHash();
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed session token.
 */
export async function createSessionToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    authenticated: true,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION)
    .sign(getSessionSecret());
}

/**
 * Verify a session token and return the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      requiredClaims: ["exp"],
    });
    if (!payload || payload.authenticated !== true) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie.
 *
 * `secure` is derived from the request protocol rather than NODE_ENV, so the
 * cookie is marked Secure behind an HTTPS proxy (x-forwarded-proto) while
 * still working over plain HTTP on localhost / a LAN address during local
 * development and self-hosted testing.
 */
export async function setSessionCookie(
  token: string,
  secure: boolean
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Determine whether the incoming request reached us over HTTPS.
 * Honours the standard reverse-proxy header used by Vercel, Nginx and friends.
 */
export function isSecureRequest(request: {
  headers: Headers;
  nextUrl: { protocol: string };
}): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }
  return request.nextUrl.protocol === "https:";
}

/**
 * Get the session token from cookies.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(secure: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Check if the current request has a valid session.
 * Returns the session payload if authenticated, null otherwise.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Require authentication — throws if not authenticated.
 * Use in server components and server actions that need protection.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
