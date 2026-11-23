"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useOrbit } from "@/context/OrbitContext";
import { formatTimeInZone } from "@/lib/storage";
import {
  IconArrowRight,
  IconClose,
  IconMenu,
  IconPlus,
  IconSearch,
  IconSettings,
  OrbitWordmark,
} from "@/components/ui/OrbitIcons";
import { OrbitButton, useDitherFillState } from "@/components/ui/OrbitPrimitives";
import { WelcomeEntrance } from "@/components/welcome/WelcomeEntrance";
import { CommandPalette } from "./CommandPalette";
import { QuickAddModal } from "./QuickAddModal";
import { ToastStack } from "./ToastStack";
import { PageTransition } from "./PageTransition";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PRIMARY_NAV = [
  { href: "/", label: "Today", code: "01" },
  { href: "/projects", label: "Projects", code: "02" },
  { href: "/inbox", label: "Inbox", code: "03" },
  { href: "/ideas", label: "Ideas", code: "04" },
  { href: "/library", label: "Library", code: "05" },
  { href: "/opportunities", label: "Opportunities", code: "06" },
  { href: "/cv-studio", label: "CV Studio", code: "07" },
];

/** Isolated 1-second clock component so ticks never re-render the rest of the shell */
const LiveClock = memo(function LiveClock({
  timezone,
  compact = false,
}: {
  timezone: string;
  compact?: boolean;
}) {
  const [clockText, setClockText] = useState<{
    time: string;
    dateLong: string;
    dateShort: string;
    tzShort: string;
  } | null>(null);

  useEffect(() => {
    setClockText(formatTimeInZone(timezone));
    const timer = window.setInterval(() => {
      setClockText(formatTimeInZone(timezone));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timezone]);

  if (compact) {
    return (
      <div className="px-4 py-2 border-b border-[#B3B3AF] flex items-center justify-between font-mono text-[11px] text-[#5C5C59]">
        <span>{clockText?.dateShort ?? "—"}</span>
        <span>
          {clockText ? `${clockText.time} ${clockText.tzShort}` : "--:--:--"}
        </span>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-4 min-w-0">
      <span className="orbit-mono-label text-[#5C5C59]">
        {clockText?.dateLong ?? "—"}
      </span>
      <span className="h-3.5 w-px bg-[#B3B3AF]" aria-hidden="true" />
      <span className="font-mono text-[12px] font-medium tabular-nums text-[#282828]">
        {clockText ? `${clockText.time} ${clockText.tzShort}` : "--:--:--"}
      </span>
    </div>
  );
});

function SidebarNavLink({
  href,
  label,
  code,
  active,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  code?: string;
  active: boolean;
  icon?: React.ReactNode;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const { bind } = useDitherFillState();

  return (
    <Link
      href={href}
      onClick={(e) => onNavigate(e, href)}
      aria-current={active ? "page" : undefined}
      data-selected={active ? "true" : "false"}
      {...bind}
      className={`orbit-dither-control relative flex items-center justify-between px-4 py-3 text-[13px] font-medium uppercase tracking-[0.02em] ${
        active
          ? "bg-[#282828] text-[#F5F5ED]"
          : "text-[#282828]"
      }`}
    >
      {/* Active orange vertical marker */}
      {active && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FA3600] z-20"
          aria-hidden="true"
        />
      )}
      <span className="orbit-dither-bg" aria-hidden="true" />

      <span className="relative z-10 flex items-center gap-3 min-w-0">
        {icon ? (
          <span className={active ? "text-[#FA3600]" : "text-current"}>
            {icon}
          </span>
        ) : (
          <span
            className={`font-mono text-[10px] ${
              active ? "text-[#FA3600]" : "text-[#C82A00]"
            }`}
          >
            {code}
          </span>
        )}
        <span className="orbit-roll-label">
          <span>{label}</span>
          <span aria-hidden="true">{label}</span>
        </span>
      </span>

      <span className="relative z-10 flex items-center gap-2 shrink-0">
        {active ? (
          <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
        ) : (
          <span className="orbit-roll-icon w-3.5 h-3.5" aria-hidden="true">
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    effectiveReducedMotion,
    showWelcomeIntro,
    sessionAuthMode,
    sessionChecked,
    welcomeExitedCount,
    openDemoLogin,
    logout,
    setCommandPaletteOpen,
    openQuickAdd,
  } = useOrbit();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const navSeqRef = useRef(0);
  const searchDither = useDitherFillState();

  // Reflect reduced motion attribute on <html> for CSS transitions
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduced-motion",
      effectiveReducedMotion ? "true" : "false"
    );
  }, [effectiveReducedMotion]);

  // Clear optimistic pending route when pathname updates (including Back/Forward)
  useEffect(() => {
    navSeqRef.current += 1;
    setPendingHref(null);
    setMobileMenuOpen(false);
    if (mainRef.current) {
      gsap.killTweensOf(mainRef.current);
      gsap.set(mainRef.current, { clearProps: "opacity,transform" });
    }
  }, [pathname]);

  // Coordinated shell reveal immediately after Welcome Hero exits (without shifting sticky layout)
  useGSAP(
    () => {
      if (effectiveReducedMotion) {
        gsap.set(".shell-coord-group", { clearProps: "opacity,willChange" });
        return;
      }
      // Hold the shell back until the session verdict is known, and keep it
      // hidden for the whole duration of the welcome briefing.
      if (!sessionChecked || showWelcomeIntro || sessionAuthMode === "unauthenticated") {
        gsap.set(".shell-coord-group", { opacity: 0 });
        return;
      }
      // No welcome briefing played (e.g. welcome preference = "never").
      // Reveal immediately so the shell is never left stuck at opacity 0.
      if (welcomeExitedCount === 0) {
        gsap.set(".shell-coord-group", { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(".shell-coord-group", { clearProps: "opacity,willChange" });
        },
      });
      tl.fromTo(
        ".shell-coord-group",
        { opacity: 0, willChange: "opacity" },
        { opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" },
        0
      );
    },
    {
      scope: shellRef,
      dependencies: [welcomeExitedCount, showWelcomeIntro, sessionAuthMode, sessionChecked, effectiveReducedMotion],
      revertOnUpdate: true,
    }
  );

  // Scroll-triggered footer reveal
  useGSAP(
    () => {
      if (!footerRef.current || effectiveReducedMotion) return;
      gsap.fromTo(
        ".footer-reveal-item",
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.38,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 94%",
            once: true,
          },
        }
      );
    },
    { scope: footerRef, dependencies: [pathname, effectiveReducedMotion], revertOnUpdate: true }
  );

  // Brief outgoing transition (~130ms) before App Router push; aborted cleanly on rapid clicks
  const handleShellNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }
      const normalizedTarget = href === "/" ? "/" : href.replace(/\/+$/, "");
      const normalizedCurr = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
      if (normalizedTarget === normalizedCurr) return;

      e.preventDefault();
      setPendingHref(href);
      const token = ++navSeqRef.current;

      if (effectiveReducedMotion || !mainRef.current) {
        router.push(href);
        return;
      }

      gsap.killTweensOf(mainRef.current);
      gsap.to(mainRef.current, {
        opacity: 0.15,
        y: -4,
        duration: 0.13,
        ease: "power2.in",
        onComplete: () => {
          if (navSeqRef.current === token) {
            router.push(href);
          }
        },
      });
    },
    [pathname, effectiveReducedMotion, router]
  );

  const activePath = pendingHref ?? pathname;
  const activeTasksCount = state.tasks.filter((t) => !t.completed).length;

  /**
   * The personal access screen is a standalone surface. Rendering the full
   * workspace chrome behind it would leak private navigation into the
   * accessibility tree and the tab order, so the chrome is omitted entirely.
   */
  const isAccessRoute =
    pathname === "/login" || pathname.startsWith("/login/");

  if (isAccessRoute) {
    return (
      <div
        ref={shellRef}
        className="orbit-paper-surface min-h-screen text-[#282828]"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className="orbit-paper-surface min-h-screen flex flex-col lg:flex-row text-[#282828]"
    >
      <WelcomeEntrance />
      <CommandPalette />
      <QuickAddModal />
      <ToastStack />

      {/* Stationary Desktop Navigation Rail */}
      <aside
        inert={showWelcomeIntro || !sessionChecked || sessionAuthMode === "unauthenticated"}
        aria-label="Primary Workspace Navigation"
        className="shell-coord-group no-print hidden lg:flex lg:flex-col lg:w-[232px] lg:shrink-0 border-r border-[#B3B3AF] sticky top-0 h-screen justify-between"
      >
        <div>
          <div className="h-[56px] px-4 flex items-center justify-between border-b border-[#B3B3AF]">
            <Link
              href="/"
              onClick={(e) => handleShellNavigate(e, "/")}
              className="focus-visible:outline-2 focus-visible:outline-[#FA3600]"
            >
              <OrbitWordmark />
            </Link>
            <span className="font-mono text-[10px] text-[#5C5C59]">v1.0</span>
          </div>

          <div className="px-4 py-2.5 border-b border-[#B3B3AF] flex items-center justify-between">
            <span className="orbit-mono-label text-[#5C5C59]">Workspace</span>
            <span className="font-mono text-[10px] font-semibold text-[#C82A00]">
              {activeTasksCount} OPEN
            </span>
          </div>

          <nav className="flex flex-col divide-y divide-[#B3B3AF]/70 border-b border-[#B3B3AF]">
            {PRIMARY_NAV.map((item) => {
              const active =
                item.href === "/"
                  ? activePath === "/"
                  : activePath.startsWith(item.href);
              return (
                <SidebarNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  code={item.code}
                  active={active}
                  onNavigate={handleShellNavigate}
                />
              );
            })}
          </nav>
        </div>

        {/* Bottom Settings + Local Status & Auth Actions */}
        <div className="border-t border-[#B3B3AF]">
          <div className="border-b border-[#B3B3AF]">
            <SidebarNavLink
              href="/settings"
              label="Settings"
              active={activePath.startsWith("/settings")}
              icon={<IconSettings className="w-4 h-4" />}
              onNavigate={handleShellNavigate}
            />
          </div>

          <div className="px-4 py-3 bg-[#ECEBE2]/45 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="orbit-mono-label text-[#5C5C59]">
                {sessionAuthMode === "unauthenticated" ? "Local Session" : "Authenticated"}
              </p>
              <p className="font-mono text-[11px] text-[#282828] mt-0.5 truncate">
                {state.preferences.name} · {state.preferences.timezone}
              </p>
            </div>
            {sessionAuthMode === "unauthenticated" ? (
              <button
                type="button"
                onClick={openDemoLogin}
                title="Open login screen"
                className="px-2 py-1 border border-[#B3B3AF] font-mono text-[9px] uppercase tracking-[0.06em] text-[#282828] hover:border-[#FA3600] hover:text-[#C82A00] cursor-pointer shrink-0"
              >
                Login
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="px-2 py-1 border border-[#B3B3AF] font-mono text-[9px] uppercase tracking-[0.06em] text-[#282828] hover:border-[#FA3600] hover:text-[#C82A00] cursor-pointer shrink-0"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div inert={showWelcomeIntro || !sessionChecked || sessionAuthMode === "unauthenticated"} className="flex-1 min-w-0 flex flex-col">
        {/* Stationary Top Utility Header */}
        <header className="shell-coord-group no-print sticky top-0 z-30 orbit-paper-surface border-b border-[#B3B3AF]">
          <div className="h-[56px] px-4 lg:px-6 flex items-center justify-between gap-3">
            {/* Mobile brand + menu trigger */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2 border border-[#B3B3AF] text-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
              >
                {mobileMenuOpen ? (
                  <IconClose className="w-4 h-4" />
                ) : (
                  <IconMenu className="w-4 h-4" />
                )}
              </button>
              <Link href="/" onClick={(e) => handleShellNavigate(e, "/")}>
                <OrbitWordmark />
              </Link>
            </div>

            {/* Isolated Desktop Live Clock + Preview Label */}
            <div className="hidden lg:flex items-center gap-4 min-w-0">
              <LiveClock timezone={state.preferences.timezone} />
              <span className="h-3.5 w-px bg-[#B3B3AF]" aria-hidden="true" />
              <span className="px-2 py-0.5 border border-[#FA3600] text-[#C82A00] bg-[#FA3600]/8 font-mono text-[10px] uppercase tracking-[0.06em]">
                Frontend Preview
              </span>
            </div>

            {/* Utility Controls: Search & Quick Add */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open global search (Cmd or Ctrl + K)"
                data-compact="true"
                {...searchDither.bind}
                className="orbit-dither-control inline-flex items-center gap-2.5 px-3 py-2 border border-[#B3B3AF] bg-transparent cursor-pointer"
              >
                <span className="orbit-dither-bg" aria-hidden="true" />
                <span className="relative z-10 inline-flex items-center gap-2.5">
                  <IconSearch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline orbit-roll-label font-mono text-[11px] uppercase tracking-[0.06em]">
                    <span>Search</span>
                    <span aria-hidden="true">Search</span>
                  </span>
                  <kbd className="hidden md:inline font-mono text-[10px] px-1.5 py-0.5 border border-current/40">
                    ⌘K
                  </kbd>
                </span>
              </button>

              <OrbitButton
                type="button"
                label="Quick Add"
                size="sm"
                variant="accent"
                onClick={() => openQuickAdd("task")}
                className="hidden sm:inline-flex"
              />
              <button
                type="button"
                onClick={() => openQuickAdd("task")}
                aria-label="Quick Add"
                className="sm:hidden p-2 bg-[#FA3600] text-white border border-[#FA3600] cursor-pointer"
              >
                <IconPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Collapsible Navigation */}
          {mobileMenuOpen && (
            <nav
              id="mobile-nav-drawer"
              aria-label="Mobile Navigation"
              className="lg:hidden border-t border-[#B3B3AF] orbit-paper-surface"
            >
              <LiveClock timezone={state.preferences.timezone} compact />
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#B3B3AF]">
                {[...PRIMARY_NAV, { href: "/settings", label: "Settings", code: "08" }].map(
                  (item) => {
                    const active =
                      item.href === "/"
                        ? activePath === "/"
                        : activePath.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleShellNavigate(e, item.href)}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center justify-between px-3.5 py-3 border-r border-b border-[#B3B3AF] text-[12px] font-medium uppercase tracking-[0.03em] ${
                          active
                            ? "bg-[#282828] text-[#F5F5ED]"
                            : "text-[#282828] hover:bg-[#ECEBE2]"
                        }`}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FA3600]"
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.label}</span>
                        <span
                          className={`font-mono text-[10px] ${
                            active ? "text-[#FA3600]" : "text-[#C82A00]"
                          }`}
                        >
                          {item.code}
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </nav>
          )}
        </header>

        {/* Construction & Frontend Preview Notice */}
        {!noticeDismissed && (
          <div
            role="note"
            aria-label="Frontend preview construction notice"
            className="no-print border-b border-[#B3B3AF] bg-[#ECEBE2]/65 px-4 lg:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#FA3600] text-[#C82A00] bg-[#F5F5ED] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] shrink-0">
                <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
                Frontend Preview
              </span>
              <p className="text-[12.5px] text-[#282828] leading-snug">
                <strong className="font-semibold">Orbit is under construction.</strong>{" "}
                <span className="text-[#414140]">
                  Your private workspace. AI agents and connected services are coming soon.
                </span>{" "}
                <span className="font-mono text-[10.5px] text-[#5C5C59]">
                  (Local edits save in browser storage.)
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              aria-label="Hide construction notice"
              className="self-start sm:self-center px-2 py-0.5 border border-[#B3B3AF] font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59] hover:border-[#282828] hover:text-[#282828] cursor-pointer shrink-0"
            >
              Hide
            </button>
          </div>
        )}

        {/* Main Workspace Content with Coordinated Page Transitions */}
        <main ref={mainRef} tabIndex={-1} className="flex-1 min-w-0 outline-none">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Ruled Architectural Footer */}
        <footer
          ref={footerRef}
          className="no-print border-t border-[#B3B3AF] bg-[#ECEBE2]/45 px-4 lg:px-6 py-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="footer-reveal-item flex items-center gap-3">
              <OrbitWordmark />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#C82A00]">
                Frontend Preview
              </span>
            </div>
            <div className="footer-reveal-item font-mono text-[11px] text-[#5C5C59]">
              Private, server-verified access. AI agents &amp; connected services coming soon.
            </div>
            <div className="footer-reveal-item flex flex-wrap md:justify-end gap-4 font-mono text-[11px] uppercase tracking-[0.06em]">
              <Link
                href="/projects"
                onClick={(e) => handleShellNavigate(e, "/projects")}
                className="underline hover:text-[#C82A00]"
              >
                Projects
              </Link>
              <Link
                href="/opportunities"
                onClick={(e) => handleShellNavigate(e, "/opportunities")}
                className="underline hover:text-[#C82A00]"
              >
                Opportunities
              </Link>
              <Link
                href="/cv-studio"
                onClick={(e) => handleShellNavigate(e, "/cv-studio")}
                className="underline hover:text-[#C82A00]"
              >
                CV Studio
              </Link>
              <Link
                href="/settings"
                onClick={(e) => handleShellNavigate(e, "/settings")}
                className="underline hover:text-[#C82A00]"
              >
                Settings
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
