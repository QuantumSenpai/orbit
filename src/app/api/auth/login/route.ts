import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  isSecureRequest,
} from "@/lib/auth";

/**
 * Login attempt throttling.
 *
 * The limiter is an in-process sliding window keyed by client IP. It is a
 * shortcut: this counter protects one process only; use a shared store before
 * deploying multiple instances or relying on throttling on a serverless host.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // lockout length after exceeding the window

interface AttemptRecord {
  /** Timestamps (ms) of failed attempts inside the current window. */
  failures: number[];
  /** Epoch ms until which further attempts are refused. */
  blockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();

/** Guard against unbounded memory growth from spoofed source IPs. */
const MAX_TRACKED_KEYS = 5000;

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "local";
}

function prune(now: number) {
  for (const [key, record] of attempts) {
    if (record.blockedUntil < now && record.failures.every((t) => now - t > WINDOW_MS)) {
      attempts.delete(key);
    }
  }
  if (attempts.size > MAX_TRACKED_KEYS) {
    const oldest = [...attempts.entries()].sort(
      (a, b) => a[1].blockedUntil - b[1].blockedUntil
    )[0];
    if (oldest) attempts.delete(oldest[0]);
  }
}

function getRetryAfterSeconds(record: AttemptRecord, now: number): number {
  if (record.blockedUntil > now) {
    return Math.ceil((record.blockedUntil - now) / 1000);
  }
  if (record.failures.length > 0) {
    const oldest = record.failures[0];
    return Math.ceil(Math.max(0, WINDOW_MS - (now - oldest)) / 1000);
  }
  return 0;
}

/**
 * Check whether the request is allowed to attempt a login.
 * Returns null when allowed, or the number of retry-after seconds when blocked.
 */
function checkAllowed(key: string, now: number): number | null {
  const record = attempts.get(key);
  if (!record) return null;

  if (record.blockedUntil > now) {
    return getRetryAfterSeconds(record, now);
  }

  const recent = record.failures.filter((t) => now - t <= WINDOW_MS);
  record.failures = recent;
  if (recent.length >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
    return getRetryAfterSeconds(record, now);
  }
  return null;
}

/** Record a failed attempt and apply the lockout when the budget is spent. */
function recordFailure(key: string, now: number): void {
  const record = attempts.get(key) ?? { failures: [], blockedUntil: 0 };
  record.failures.push(now);
  if (record.failures.length >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
  }
  attempts.set(key, record);
}

/** Clear the failure history after a successful authentication. */
function recordSuccess(key: string): void {
  attempts.delete(key);
}

export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }
  const now = Date.now();
  prune(now);

  const clientKey = getClientKey(request);

  const retryAfter = checkAllowed(clientKey, now);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let password: unknown;
  try {
    const body = await request.json();
    password = (body as { password?: unknown })?.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Cap the payload we will ever hash so a hostile client cannot force a
  // long-running bcrypt comparison.
  if (password.length > 256) {
    recordFailure(clientKey, now);
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Reserve the attempt before bcrypt yields so concurrent requests share the budget.
  recordFailure(clientKey, now);
  let isValid = false;
  try {
    isValid = await verifyPassword(password);
  } catch (error) {
    // Missing server configuration — fail closed without leaking details.
    console.error(
      "Orbit login failed: server auth configuration is invalid.",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!isValid) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const token = await createSessionToken();
    await setSessionCookie(token, isSecureRequest(request));
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  recordSuccess(clientKey);

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
