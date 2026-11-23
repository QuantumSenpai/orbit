"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconClose } from "./OrbitIcons";

/** Hook for clean, non-accumulating hover/focus dither state */
export function useDitherFillState() {
  const [fillState, setFillState] = useState<"idle" | "active" | "exiting">("idle");

  const bind = {
    "data-fill": fillState,
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setFillState("active");
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") {
        setFillState((prev) => (prev === "active" ? "exiting" : "idle"));
      }
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (e.currentTarget.matches(":focus-visible")) setFillState("active");
    },
    onBlur: () => {
      setFillState((prev) => (prev === "active" ? "exiting" : "idle"));
    },
  };

  return { fillState, setFillState, bind };
}

interface OrbitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "default" | "accent" | "subtle";
  showArrow?: boolean;
  size?: "sm" | "md" | "lg";
}

export const OrbitButton = React.forwardRef<
  HTMLButtonElement,
  OrbitButtonProps
>(function OrbitButton(
  {
    label,
    variant = "default",
    showArrow = true,
    size = "md",
    className = "",
    disabled,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const { bind, setFillState } = useDitherFillState();

  useEffect(() => {
    if (disabled) setFillState("idle");
  }, [disabled, setFillState]);

  const padding =
    size === "sm"
      ? "px-3 py-1.5 text-[11px]"
      : size === "lg"
        ? "px-5 py-3.5 text-[13px]"
        : "px-4 py-2.5 text-[12px]";

  if (variant === "subtle") {
    return (
      <button
        {...rest}
        ref={ref}
        disabled={disabled}
        data-fill={bind["data-fill"]}
        data-compact="true"
        data-bg-tone="paper-deep"
        onPointerEnter={(e) => {
          bind.onPointerEnter(e);
          onPointerEnter?.(e);
        }}
        onPointerLeave={(e) => {
          bind.onPointerLeave(e);
          onPointerLeave?.(e);
        }}
        onFocus={(e) => {
          bind.onFocus(e);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          bind.onBlur();
          onBlur?.(e);
        }}
        className={`orbit-dither-control inline-flex items-center justify-between gap-2.5 border border-[#B3B3AF] bg-transparent text-[#282828] font-mono uppercase tracking-[0.06em] whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${padding} ${className}`}
      >
        <span className="orbit-dither-bg" aria-hidden="true" />
        <span className="orbit-roll-label text-left">
          <span>{label}</span>
          <span aria-hidden="true">{label}</span>
        </span>
        {showArrow && (
          <span className="orbit-roll-icon w-3.5 h-3.5 shrink-0" aria-hidden="true">
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      {...rest}
      ref={ref}
      disabled={disabled}
      data-variant={variant === "accent" ? "accent" : undefined}
      data-fill={bind["data-fill"]}
      onPointerEnter={(e) => {
        bind.onPointerEnter(e);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        bind.onPointerLeave(e);
        onPointerLeave?.(e);
      }}
      onFocus={(e) => {
        bind.onFocus(e);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        bind.onBlur();
        onBlur?.(e);
      }}
      className={`orbit-btn-fill font-mono uppercase tracking-[0.06em] font-medium cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${padding} gap-3 ${className}`}
    >
      <span className="orbit-btn-fill-bg" aria-hidden="true" />
      <span className="orbit-btn-fill-label text-left">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
      {showArrow && (
        <span className="pl-2.5 border-l border-current/25 flex items-center" aria-hidden="true">
          <span className="orbit-btn-fill-icon w-3.5 h-3.5">
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
            <span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
          </span>
        </span>
      )}
    </button>
  );
});

/** Section action link ("OPEN ->", "ALL IDEAS ->", etc.) with dither wash + vertical roll */
export function OrbitActionLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const { bind } = useDitherFillState();
  return (
    <Link
      href={href}
      {...bind}
      data-compact="true"
      className={`orbit-dither-control inline-flex items-center gap-2 px-2.5 py-1 border border-[#B3B3AF] font-mono text-[10px] uppercase tracking-[0.06em] text-[#282828] whitespace-nowrap ${className}`}
    >
      <span className="orbit-dither-bg" aria-hidden="true" />
      <span className="orbit-roll-label">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
      <span className="orbit-roll-icon w-3 h-3" aria-hidden="true">
        <span>
          <IconArrowRight className="w-3 h-3" />
        </span>
        <span>
          <IconArrowRight className="w-3 h-3" />
        </span>
      </span>
    </Link>
  );
}

/** Reusable compact dither-roll tab / filter button */
export function OrbitFilterButton({
  label,
  active,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const { bind } = useDitherFillState();
  return (
    <button
      type="button"
      aria-pressed={active}
      data-selected={active ? "true" : "false"}
      data-compact="true"
      {...bind}
      onClick={onClick}
      className={`orbit-dither-control px-3.5 py-3 font-mono text-[11px] uppercase tracking-[0.06em] cursor-pointer whitespace-nowrap ${
        active
          ? "bg-[#282828] text-[#F5F5ED]"
          : "bg-transparent text-[#282828]"
      } ${className}`}
    >
      <span className="orbit-dither-bg" aria-hidden="true" />
      <span className="orbit-roll-label flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5">
          {active && <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />}
          {label}
        </span>
        <span aria-hidden="true">{label}</span>
      </span>
    </button>
  );
}

/** Compact icon action control (Pin, Edit, Delete, Close, etc.) with restrained dither wash */
export function OrbitIconControl({
  label,
  active = false,
  tone = "default",
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  const { bind } = useDitherFillState();
  return (
    <button
      type="button"
      aria-label={label}
      data-compact="true"
      data-selected={active ? "true" : "false"}
      data-bg-tone={tone === "danger" ? "accent" : undefined}
      {...bind}
      {...rest}
      className={`orbit-dither-control inline-flex items-center justify-center p-1.5 border border-[#B3B3AF] cursor-pointer ${
        active
          ? "border-[#FA3600] text-[#FA3600] bg-[#FA3600]/8"
          : "text-[#282828]"
      } ${className}`}
    >
      <span className="orbit-dither-bg" aria-hidden="true" />
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

/** Consistent section heading: narrow #FA3600 rule + #C82A00 code/keyword + charcoal title */
export function OrbitSectionHeading({
  code,
  title,
  accentWord,
  rightSlot,
  className = "",
}: {
  code?: string;
  title: string;
  accentWord?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-3 border-b border-[#B3B3AF] flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-[3px] h-4 bg-[#FA3600] shrink-0"
          aria-hidden="true"
        />
        {code && (
          <span className="font-mono text-[11px] font-semibold text-[#C82A00] shrink-0">
            {code}
          </span>
        )}
        <h2 className="orbit-display text-[17px] sm:text-[19px] text-[#282828] truncate">
          {title}
          {accentWord && (
            <>
              {" "}
              <span className="text-[#FA3600]">{accentWord}</span>
            </>
          )}
        </h2>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}

interface OrbitFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const OrbitField = React.forwardRef<HTMLInputElement, OrbitFieldProps>(
  function OrbitField(
    { label, id, value, error, className = "", ...rest },
    ref
  ) {
    const hasValue =
      value !== undefined && value !== null && String(value).length > 0;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div
        className={`orbit-field ${className}`}
        data-active={hasValue ? "true" : "false"}
        data-invalid={error ? "true" : "false"}
      >
        <label htmlFor={id} className="orbit-field-label">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          value={value}
          className="orbit-field-control"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...rest}
        />
        <div className="orbit-field-underline" aria-hidden="true" />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="px-4 pb-2 font-mono text-[11px] text-[#C82A00]"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

interface OrbitTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
}

export function OrbitTextarea({
  label,
  id,
  value,
  error,
  className = "",
  ...rest
}: OrbitTextareaProps) {
  const hasValue =
    value !== undefined && value !== null && String(value).length > 0;

  return (
    <div
      className={`orbit-field ${className}`}
      data-active={hasValue ? "true" : "false"}
    >
      <label htmlFor={id} className="orbit-field-label">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        className="orbit-field-control resize-y min-h-[88px]"
        {...rest}
      />
      <div className="orbit-field-underline" aria-hidden="true" />
      {error && (
        <p className="px-4 pb-2 font-mono text-[11px] text-[#C82A00]">{error}</p>
      )}
    </div>
  );
}

export function OrbitStatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ink" | "muted";
}) {
  const styles =
    tone === "accent"
      ? "border-[#FA3600] text-[#C82A00] bg-[#FA3600]/8"
      : tone === "ink"
        ? "border-[#282828] bg-[#282828] text-[#F5F5ED]"
        : tone === "muted"
          ? "border-[#B3B3AF] text-[#5C5C59] bg-transparent"
          : "border-[#B3B3AF] text-[#282828] bg-[#ECEBE2]/60";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border font-mono text-[10px] uppercase tracking-[0.06em] whitespace-nowrap ${styles}`}
    >
      {children}
    </span>
  );
}

interface OrbitDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function OrbitDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: OrbitDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#282828]/35"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="orbit-drawer-panel orbit-paper-surface w-full max-w-[540px] h-full border-l border-[#B3B3AF] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#B3B3AF]">
          <div>
            {subtitle && (
              <p className="orbit-mono-label text-[#C82A00] mb-1">{subtitle}</p>
            )}
            <h2 className="orbit-display text-[22px] text-[#282828]">{title}</h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-2 border border-[#B3B3AF] text-[#282828] hover:bg-[#282828] hover:text-[#F5F5ED] transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
