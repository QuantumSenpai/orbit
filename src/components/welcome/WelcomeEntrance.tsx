"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useOrbit } from "@/context/OrbitContext";
import { getTimeAwareGreeting } from "@/lib/storage";
import { OrbitMark } from "@/components/ui/OrbitIcons";
import { EarthCenterpiece } from "@/components/earth/EarthCenterpiece";

gsap.registerPlugin(useGSAP);

interface WelcomeMessageVariant {
  greeting: string;
  message: string;
  period: "morning" | "afternoon" | "evening" | "night";
}

export function WelcomeEntrance() {
  const {
    state,
    showWelcomeIntro,
    effectiveReducedMotion,
    dismissWelcomeIntro,
  } = useOrbit();

  const rootRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const isExitingRef = useRef(false);
  const [heroAssetsReady, setHeroAssetsReady] = useState(false);
  const [welcomeVariant, setWelcomeVariant] = useState<WelcomeMessageVariant | null>(null);

  // Generate welcome variant once per session
  useEffect(() => {
    if (!showWelcomeIntro) {
      setWelcomeVariant(null);
      return;
    }
    if (showWelcomeIntro && !welcomeVariant) {
      const greetingData = getTimeAwareGreeting(
        state.preferences.name,
        state.preferences.timezone
      );
      setWelcomeVariant({
        greeting: greetingData.greeting,
        message: greetingData.message,
        period: greetingData.period,
      });
    }
  }, [showWelcomeIntro, welcomeVariant, state.preferences.name, state.preferences.timezone]);

  // Mark hero assets ready immediately after first paint
  useEffect(() => {
    if (!showWelcomeIntro) {
      setHeroAssetsReady(false);
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
      if (e.key === "Tab") {
        e.preventDefault();
        skipBtnRef.current?.focus();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleSmoothExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showWelcomeIntro, welcomeVariant, handleSmoothExit]);

  // Coordinated Post-Login Hero Timeline (~2.5s total)
  useGSAP(
    () => {
      if (!showWelcomeIntro || !heroAssetsReady || !rootRef.current || !welcomeVariant) return;

      if (effectiveReducedMotion) {
        const timer = window.setTimeout(() => {
          if (!isExitingRef.current) {
            isExitingRef.current = true;
            dismissWelcomeIntro();
          }
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

      // 1. Orbit symbol transitions from grey to orange-red
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

      // 5. Supporting message with slight delay
      tl.fromTo(
        ".welcome-supporting-line",
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
          force3D: true,
        },
        0.72
      );

      // Orbital annotation appears
      tl.fromTo(
        ".welcome-orbital-note",
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out", force3D: true },
        0.95
      );

      // 6. Smooth GPU-only fade + slight lift out into the dashboard
      tl.to(
        rootRef.current,
        {
          opacity: 0,
          y: -10,
          duration: 0.38,
          ease: "power2.inOut",
          force3D: true,
        },
        2.15
      );
    },
    {
      scope: rootRef,
      dependencies: [showWelcomeIntro, heroAssetsReady, effectiveReducedMotion, welcomeVariant],
      revertOnUpdate: true,
    }
  );

  if (!showWelcomeIntro || !welcomeVariant) return null;

  const { greeting, message, period } = welcomeVariant;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Orbit workspace"
      style={{ willChange: "transform, opacity", backgroundColor: period === "night" ? "#ECEBE2" : "#F5F5ED" }}
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
        <div className="lg:col-span-7 space-y-3">
          <div className="orbit-line-mask">
            <span className="welcome-hero-line font-mono text-[11px] uppercase tracking-[0.1em] text-[#C82A00]">
              ● SESSION AUTHENTICATED
            </span>
          </div>

          <h1 className="orbit-display text-[38px] sm:text-[52px] lg:text-[62px] text-[#FA3600] leading-[0.95]">
            <span className="orbit-line-mask">
              <span className="welcome-hero-line">{greeting}</span>
            </span>
          </h1>

          <p className="text-[18px] sm:text-[22px] text-[#282828] max-w-[38ch] leading-snug">
            <span className="orbit-line-mask">
              <span className="welcome-supporting-line">{message}</span>
            </span>
          </p>

          {/* Orbital annotation - subtle period indicator */}
          <div className="orbit-mono-label text-[#5C5C59] welcome-orbital-note" style={{ opacity: effectiveReducedMotion ? 1 : 0, transform: effectiveReducedMotion ? "none" : "scale(0.9)" }}>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FA3600] rounded-full" aria-hidden="true" />
              <span>{period.toUpperCase()} ORBIT</span>
              <span className="text-[#B3B3AF]">{"//"}</span>
              <span className="font-mono text-[10px]">{state.preferences.timezone}</span>
            </span>
          </div>
        </div>

        <div className="welcome-earth-stage lg:col-span-5 h-[240px] sm:h-[310px] w-full">
          <EarthCenterpiece
            reducedMotion={effectiveReducedMotion}
            // Keep cold WebGL/shader initialization out of the brief intro.
            forceStatic
          />
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
