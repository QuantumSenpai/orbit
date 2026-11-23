"use client";

import { useEffect } from "react";

/**
 * Registers the Orbit service worker (install + offline shell basics).
 *
 * The worker deliberately caches nothing private — see /public/sw.js for the
 * security contract. Registration is skipped in development so hot reload
 * stays predictable.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Installation is a progressive enhancement — ignore failures silently.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
