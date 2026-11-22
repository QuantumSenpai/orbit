"use client";

import React from "react";
import { useOrbit } from "@/context/OrbitContext";
import { IconClose } from "@/components/ui/OrbitIcons";

export function ToastStack() {
  const { toasts, dismissToast } = useOrbit();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-4 right-4 z-[75] flex flex-col gap-2 max-w-[360px] w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 border ${
            toast.tone === "error"
              ? "border-[#FA3600] bg-[#282828] text-[#F5F5ED]"
              : "border-[#282828] bg-[#282828] text-[#F5F5ED]"
          }`}
        >
          <span className="font-mono text-[11px] leading-snug">{toast.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {toast.undoLabel && toast.onUndo && (
              <button
                type="button"
                onClick={() => {
                  toast.onUndo?.();
                  dismissToast(toast.id);
                }}
                className="px-2 py-0.5 border border-[#FA3600] text-[#FA3600] font-mono text-[10px] uppercase tracking-[0.06em] hover:bg-[#FA3600] hover:text-white cursor-pointer"
              >
                {toast.undoLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-0.5 text-[#B3B3AF] hover:text-white cursor-pointer"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
