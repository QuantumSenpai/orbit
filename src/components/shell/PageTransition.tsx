"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useOrbit } from "@/context/OrbitContext";

gsap.registerPlugin(useGSAP);

/**
 * Coordinates unified clipped-title + staggered section reveals across ALL 8 Orbit routes.
 * Stationary sidebar and topbar remain mounted outside this stage.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { effectiveReducedMotion, showWelcomeIntro, sessionAuthMode } = useOrbit();
  const stageRef = useRef<HTMLDivElement>(null);
  const lastAnimatedPathRef = useRef<string | null>(null);

  useGSAP(
    () => {
      const root = stageRef.current;
      if (!root) return;

      const titleTargets = root.querySelectorAll(".orbit-page-title-inner");
      const sectionTargets = Array.from(
        root.querySelectorAll(".orbit-page-section")
      ).slice(0, 6);

      // Kill any residual tweens immediately so rapid switching never queues overlapping timelines
      gsap.killTweensOf([...Array.from(titleTargets), ...sectionTargets]);

      if (effectiveReducedMotion) {
        gsap.set([...Array.from(titleTargets), ...sectionTargets], {
          clearProps: "transform,opacity,willChange",
        });
        return;
      }

      // Hold dashboard elements cleanly at opacity 0 while Welcome Hero / Demo Login is active
      // so exiting the hero never causes a 1 -> 0 -> 1 flash.
      if (showWelcomeIntro || sessionAuthMode === "demo_login") {
        gsap.set(titleTargets, { yPercent: 100, opacity: 0 });
        gsap.set(sectionTargets, { y: 10, opacity: 0 });
        return;
      }

      lastAnimatedPathRef.current = pathname;

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set([...Array.from(titleTargets), ...sectionTargets], {
            clearProps: "willChange,transform",
          });
        },
      });

      if (titleTargets.length > 0) {
        tl.fromTo(
          titleTargets,
          { yPercent: 100, opacity: 0, willChange: "transform, opacity" },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.36,
            stagger: 0.04,
            ease: "power3.out",
            force3D: true,
          },
          0
        );
      }

      if (sectionTargets.length > 0) {
        tl.fromTo(
          sectionTargets,
          { y: 10, opacity: 0, willChange: "transform, opacity" },
          {
            y: 0,
            opacity: 1,
            duration: 0.32,
            stagger: 0.036,
            ease: "power2.out",
            force3D: true,
          },
          0.06
        );
      }
    },
    {
      scope: stageRef,
      dependencies: [pathname, effectiveReducedMotion, showWelcomeIntro, sessionAuthMode],
      revertOnUpdate: true,
    }
  );

  // Move focus cleanly to main landmark after client route transitions
  useEffect(() => {
    if (showWelcomeIntro || sessionAuthMode === "demo_login") return;
    const main = stageRef.current?.closest("main");
    if (main && lastAnimatedPathRef.current === pathname) {
      main.focus({ preventScroll: true });
    }
  }, [pathname, showWelcomeIntro, sessionAuthMode]);

  return (
    <div ref={stageRef} className="orbit-page-stage min-h-full">
      {children}
    </div>
  );
}
