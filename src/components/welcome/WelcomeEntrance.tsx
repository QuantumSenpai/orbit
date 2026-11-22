"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useOrbit } from "@/context/OrbitContext";
import { getTimeAwareGreeting } from "@/lib/storage";
import { OrbitMark, OrbitWordmark } from "@/components/ui/OrbitIcons";
import { OrbitButton, OrbitField } from "@/components/ui/OrbitPrimitives";
import { EarthCenterpiece } from "@/components/earth/EarthCenterpiece";

gsap.registerPlugin(useGSAP);

export function WelcomeEntrance() {
  const {
    state,
    sessionAuthMode,
    showWelcomeIntro,
    effectiveReducedMotion,
    dismissWelcomeIntro,
    completeDemoLogin,
    updatePreferences,
  } = useOrbit();

  const rootRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const isExitingRef = useRef(false);
  const [heroAssetsReady, setHeroAssetsReady] = useState(false);
  const [heroEarthFrozen, setHeroEarthFrozen] = useState(false);
  const [loginName, setLoginName] = useState(state.preferences.name);

  useEffect(() => {
    setLoginName(state.preferences.name);
  }, [state.preferences.name]);

  // Mark hero assets ready immediately after first paint (zero artificial delay)
  useEffect(() => {
    if (!showWelcomeIntro) {
      setHeroAssetsReady(false);
      setHeroEarthFrozen(false);
      isExitingRef.current = false;
      return;
    }
    const raf = window.requestAnimationFrame(() => setHeroAssetsReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [showWelcomeIntro]);

  // Smooth manual exit (Skip / Escape) without abrupt pop
  const handleSmoothExit = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setHeroEarthFrozen(true);

    if (effectiveReducedMotion || !rootRef.current) {
      dismissWelcomeIntro();
      return;
    }

    gsap.killTweensOf(rootRef.current);
    gsap.to(rootRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.28,
      ease: "power2.inOut",
      force3D: true,
      onComplete: () => {
        dismissWelcomeIntro();
      },
    });
  }, [effectiveReducedMotion, dismissWelcomeIntro]);

  // Keyboard shortcut during Welcome Hero
  useEffect(() => {
    if (!showWelcomeIntro) return;
    skipBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSmoothExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showWelcomeIntro, handleSmoothExit]);

  // Coordinated Post-Login Hero Timeline (~2.45s total)
  useGSAP(
    () => {
      if (!showWelcomeIntro || !heroAssetsReady || !rootRef.current) return;

      if (effectiveReducedMotion) {
        const timer = window.setTimeout(() => {
          dismissWelcomeIntro();
        }, 650);
        return () => window.clearTimeout(timer);
      }

      const tl = gsap.timeline({
        onComplete: () => {
          if (!isExitingRef.current) {
            isExitingRef.current = true;
            dismissWelcomeIntro();
          }
        },
      });

      // 1. Orbit symbol transitions from grey (#B3B3AF) to orange-red (#FA3600)
      tl.fromTo(
        ".welcome-hero-mark",
        { color: "#B3B3AF", scale: 0.92, opacity: 0.5 },
        {
          color: "#FA3600",
          scale: 1,
          opacity: 1,
          duration: 0.42,
          ease: "power2.out",
          force3D: true,
        },
        0
      );

      // 2. Thin construction lines establish the architectural grid
      tl.fromTo(
        ".welcome-rule-h",
        { scaleX: 0, opacity: 0.35 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
          force3D: true,
        },
        0.05
      );
      tl.fromTo(
        ".welcome-rule-v",
        { scaleY: 0, opacity: 0.35 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
          force3D: true,
        },
        0.07
      );

      // 3. Earth composition settles into place
      tl.fromTo(
        ".welcome-earth-stage",
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.58, ease: "power3.out", force3D: true },
        0.22
      );

      // 4. Time-aware greeting & personal line reveal upward through clipped masks
      tl.fromTo(
        ".welcome-hero-line",
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.44,
          stagger: 0.08,
          ease: "power3.out",
          force3D: true,
        },
        0.52
      );

      // Freeze Earth loop right before exit fade so GPU composites smoothly at 60fps
      tl.call(
        () => {
          setHeroEarthFrozen(true);
        },
        undefined,
        2.02
      );

      // 5. Smooth GPU-only fade + slight lift out into the dashboard
      tl.to(
        rootRef.current,
        {
          opacity: 0,
          y: -10,
          duration: 0.38,
          ease: "power2.inOut",
          force3D: true,
        },
        2.06
      );
    },
    {
      scope: rootRef,
      dependencies: [showWelcomeIntro, heroAssetsReady, effectiveReducedMotion],
      revertOnUpdate: true,
    }
  );

  // Demo Login Gate (triggered from Settings or Demo Lock to preview Login -> Welcome -> Dashboard)
  if (sessionAuthMode === "demo_login") {
    const handleDemoSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginName.trim()) {
        updatePreferences({ name: loginName.trim() });
      }
      completeDemoLogin();
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Demo Workspace Entry"
        className="fixed inset-0 z-[85] bg-[#F5F5ED] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="orbit-modal-panel w-full max-w-[480px] border border-[#282828] bg-[#F5F5ED]">
          <div className="p-6 border-b border-[#B3B3AF] flex items-center justify-between">
            <OrbitWordmark />
            <span className="px-2 py-0.5 border border-[#FA3600] text-[#C82A00] font-mono text-[10px] uppercase tracking-[0.06em]">
              DEMO ENTRY
            </span>
          </div>

          <div className="p-6 border-b border-[#B3B3AF]">
            <p className="orbit-mono-label text-[#C82A00] mb-2">
              LOCAL SESSION // NO BACKEND AUTH
            </p>
            <h1 className="orbit-display text-[30px] text-[#FA3600]">
              Enter Orbit
            </h1>
            <p className="text-[14px] text-[#414140] mt-2 leading-relaxed">
              This demo login triggers the post-login Earth welcome choreography before transitioning into your local workspace.
            </p>
          </div>

          <form onSubmit={handleDemoSubmit}>
            <OrbitField
              id="demo-login-name"
              label="Workspace Display Name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <div className="p-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase text-[#5C5C59]">
                Timezone: {state.preferences.timezone}
              </span>
              <OrbitButton
                type="submit"
                variant="accent"
                label="Enter Workspace (Demo)"
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!showWelcomeIntro) return null;

  const greeting = getTimeAwareGreeting(
    state.preferences.name,
    state.preferences.timezone
  );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Orbit workspace"
      style={{ willChange: "transform, opacity" }}
      className="fixed inset-0 z-[80] bg-[#F5F5ED] flex flex-col justify-between p-4 sm:p-8 overflow-hidden"
    >
      {/* Architectural construction lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 sm:inset-6 border border-[#B3B3AF]/60"
      >
        <div className="welcome-rule-h origin-center absolute top-[18%] left-0 right-0 h-px bg-[#B3B3AF]" />
        <div className="welcome-rule-h origin-center absolute bottom-[18%] left-0 right-0 h-px bg-[#B3B3AF]" />
        <div className="welcome-rule-v origin-center absolute left-[34%] top-0 bottom-0 w-px bg-[#B3B3AF] hidden md:block" />
        <div className="welcome-rule-v origin-center absolute right-[34%] top-0 bottom-0 w-px bg-[#B3B3AF] hidden md:block" />
      </div>

      {/* Top row: Orbit emblem & telemetry */}
      <div className="relative z-10 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-3">
          <div className="welcome-hero-mark text-[#FA3600]">
            <OrbitMark className="w-8 h-8" accent />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#282828]">
            ORBIT // POST-LOGIN BRIEFING
          </span>
        </div>

        <button
          ref={skipBtnRef}
          type="button"
          onClick={handleSmoothExit}
          className="px-3 py-1.5 border border-[#282828] bg-[#F5F5ED] font-mono text-[11px] uppercase tracking-[0.06em] text-[#282828] hover:bg-[#282828] hover:text-[#F5F5ED] transition-colors cursor-pointer"
        >
          Skip / Continue →
        </button>
      </div>

      {/* Center composition: Earth + Clipped Greeting */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 max-w-[1120px] w-full mx-auto my-auto px-2">
        <div className="lg:col-span-7 space-y-4">
          <div className="orbit-line-mask">
            <span className="welcome-hero-line font-mono text-[11px] uppercase tracking-[0.1em] text-[#C82A00]">
              ● SESSION AUTHENTICATED (LOCAL DEMO)
            </span>
          </div>

          <h1 className="orbit-display text-[38px] sm:text-[52px] lg:text-[62px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="welcome-hero-line">{greeting}</span>
            </span>
          </h1>

          <p className="text-[18px] sm:text-[22px] text-[#282828] max-w-[38ch] leading-snug">
            <span className="orbit-line-mask">
              <span className="welcome-hero-line">
                Make a little progress. Find a wider orbit.
              </span>
            </span>
          </p>
        </div>

        <div className="welcome-earth-stage lg:col-span-5 h-[240px] sm:h-[310px] w-full">
          <EarthCenterpiece reducedMotion={effectiveReducedMotion || heroEarthFrozen} />
        </div>
      </div>

      {/* Bottom status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5C5C59]">
        <span>ORBITAL TERMINATOR // SAT-01 TRACKING</span>
        <span>PRESS ESC OR CLICK CONTINUE TO ENTER WORKSPACE</span>
      </div>
    </div>
  );
}
