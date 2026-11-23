"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { OrbitMark } from "@/components/ui/OrbitIcons";
import { OrbitButton, OrbitField } from "@/components/ui/OrbitPrimitives";

type SubmitState = "idle" | "submitting" | "error";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState("/");

  const inputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const requestIdRef = useRef(0);

  const isSubmitting = submitState === "submitting";

  // Read the post-login destination without `useSearchParams` so the route
  // stays statically renderable (no client-side bailout / Suspense requirement).
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("redirect");
    // Only allow same-origin relative paths — never an absolute URL.
    if (target && target.startsWith("/") && !/[\\\x00-\x20]/.test(target) &&
      new URL(target, window.location.origin).origin === window.location.origin) {
      setRedirectTo(target);
    }
  }, []);

  // Field is usable immediately: focus it once the entrance has settled.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSubmitting) return;

      const requestId = ++requestIdRef.current;
      setSubmitState("submitting");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ password }),
        });

        const data: { error?: string } = await response.json().catch(() => ({}));

        // Ignore stale responses from superseded submissions.
        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          setSubmitState("error");
          setErrorMessage(
            data.error ??
              (response.status === 429
                ? "Too many attempts. Wait a moment and try again."
                : "Incorrect password. Please try again.")
          );
          inputRef.current?.focus();
          return;
        }

        setSubmitState("idle");

        // Flag a fresh successful login so the welcome choreography plays once.
        try {
          window.sessionStorage.setItem("orbit_fresh_login", "1");
        } catch {
          // Ignore storage restrictions — the dashboard still opens normally.
        }

        // A full navigation (rather than a client-side route change) is
        // required: the workspace provider is already mounted on this route,
        // so only a fresh document re-reads the session cookie and boots the
        // welcome choreography for a newly authenticated session.
        window.location.assign(redirectTo);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSubmitState("error");
        setErrorMessage("Could not reach Orbit. Check your connection and retry.");
      }
    },
    [isSubmitting, password, redirectTo]
  );

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible((prev) => {
      const next = !prev;
      // Keep caret in the field so password managers and keyboard users stay put.
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        const len = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(len, len);
      });
      return next;
    });
  }, []);

  return (
    <main className="orbit-access-root orbit-paper-surface" aria-label="Orbit personal access">
      {/* Fine ruled grid */}
      <div className="orbit-access-grid" aria-hidden="true" />

      {/* Construction lines that establish the architectural frame */}
      <div className="absolute inset-4 sm:inset-8 pointer-events-none" aria-hidden="true">
        <span
          className="orbit-access-rule"
          data-axis="x"
          style={{ top: "14%", left: 0, right: 0, height: 1, animationDelay: "80ms" }}
        />
        <span
          className="orbit-access-rule"
          data-axis="x"
          style={{ top: "30%", left: 0, right: 0, height: 1, animationDelay: "130ms" }}
        />
        <span
          className="orbit-access-rule"
          data-axis="x"
          style={{ bottom: "30%", left: 0, right: 0, height: 1, animationDelay: "180ms" }}
        />
        <span
          className="orbit-access-rule"
          data-axis="x"
          style={{ bottom: "14%", left: 0, right: 0, height: 1, animationDelay: "230ms" }}
        />
        <span
          className="orbit-access-rule"
          data-axis="y"
          style={{ left: "20%", top: 0, bottom: 0, width: 1, animationDelay: "110ms" }}
        />
        <span
          className="orbit-access-rule"
          data-axis="y"
          style={{ right: "20%", top: 0, bottom: 0, width: 1, animationDelay: "160ms" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[430px] px-5 py-10 sm:py-14">
        {/* Step 1 — Orbit symbol */}
        <div className="flex justify-center mb-7">
          <span className="orbit-access-mark text-[#FA3600] block">
            <OrbitMark className="w-12 h-12 sm:w-14 sm:h-14" accent />
          </span>
        </div>

        {/* Step 3 — heading reveals upward through a clipped mask */}
        <div className="text-center mb-3">
          <h1 className="orbit-display text-[30px] sm:text-[40px] text-[#282828]">
            <span className="orbit-access-mask">
              <span style={{ animationDelay: "260ms" }}>ORBIT</span>
            </span>
          </h1>
          <p className="orbit-mono-label text-[#C82A00] mt-1.5">
            <span className="orbit-access-mask">
              <span style={{ animationDelay: "320ms" }}>PERSONAL WORKSPACE</span>
            </span>
          </p>
        </div>

        <p
          className="text-center text-[16px] sm:text-[17px] text-[#414140] mb-9 leading-relaxed orbit-access-rise"
          style={{ animationDelay: "380ms" }}
        >
          &ldquo;Your space. Your pace.&rdquo;
        </p>

        {/* Step 4 — password field & button enter with a small stagger */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isSubmitting}
          className="orbit-access-rise"
          style={{ animationDelay: "420ms" }}
        >
          <OrbitField
            ref={inputRef}
            id="orbit-password"
            name="password"
            label="Password"
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errorMessage ?? undefined}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Enter password"
            required
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between gap-3 mt-2.5">
            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              className="orbit-dither-control inline-flex items-center px-2 py-1 border border-[#B3B3AF] bg-transparent cursor-pointer font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59] hover:border-[#FA3600] hover:text-[#C82A00] transition-colors"
            >
              <span className="orbit-dither-bg" aria-hidden="true" />
              <span className="relative z-10 orbit-roll-label">
                <span>{passwordVisible ? "Hide" : "Show"}</span>
                <span aria-hidden="true">{passwordVisible ? "Hide" : "Show"}</span>
              </span>
            </button>

            <span className="orbit-mono-label text-[#5C5C59]">Private access</span>
          </div>

          <div className="mt-6">
            <OrbitButton
              ref={submitButtonRef}
              type="submit"
              variant="accent"
              label={isSubmitting ? "Verifying" : "Enter Workspace"}
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center"
            />
          </div>

          {/* Accessible status region for loading / error feedback */}
          <p
            role="status"
            aria-live="polite"
            className="sr-only font-mono text-[11px]"
          >
            {isSubmitting
              ? "Verifying password"
              : errorMessage
                ? `Access denied. ${errorMessage}`
                : "Orbit personal access. Enter your password to continue."}
          </p>
        </form>

        <p
          className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-[#B3B3AF] mt-10 orbit-access-rise"
          style={{ animationDelay: "500ms" }}
        >
          Single-user workspace · Server-verified session
        </p>
      </div>
    </main>
  );
}
