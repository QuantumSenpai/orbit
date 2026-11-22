import React from "react";

export function OrbitMark({
  className = "w-7 h-7",
  accent = false,
}: {
  className?: string;
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Crisp architectural frame + tilted orbital ellipse + satellite node */}
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse
        cx="16"
        cy="16"
        rx="12.5"
        ry="4.8"
        transform="rotate(-28 16 16)"
        stroke={accent ? "#FA3600" : "currentColor"}
        strokeWidth="1.4"
      />
      <rect
        x="23.5"
        y="8.5"
        width="3.2"
        height="3.2"
        fill="#FA3600"
      />
    </svg>
  );
}

export function OrbitWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <OrbitMark className="w-6 h-6 text-[#282828]" accent />
      <span className="font-sans font-bold tracking-[-0.03em] text-[18px] leading-none uppercase text-[#282828]">
        ORBIT
      </span>
    </span>
  );
}

type IconProps = { className?: string };

export function IconArrowRight({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 8H13.5M13.5 8L9 3.5M13.5 8L9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconArrowUpRight({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 11.5L11.5 4.5M11.5 4.5H5.5M11.5 4.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconSearch({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconPlus({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconClose({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconCheck({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

export function IconPin({ className = "w-4 h-4", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.5 2.5H10.5V6L12.5 8.5V10H8.5V14H7.5V10H3.5V8.5L5.5 6V2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function IconGrid({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconList({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 4H13.5M2.5 8H13.5M2.5 12H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconTrash({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 4.5H13.5M6 2.5H10M4.5 4.5V13.5H11.5V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

export function IconDownload({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 2.5V10.5M8 10.5L4.5 7M8 10.5L11.5 7M2.5 13.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconCopy({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 5.5V2.5H2.5V10.5H5.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconPrinter({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 5.5V2.5H11.5V5.5M4.5 11.5H2.5V6.5H13.5V11.5H11.5M4.5 9.5H11.5V13.5H4.5V9.5Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconStar({ className = "w-4 h-4", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 2L9.8 5.8L14 6.4L11 9.3L11.7 13.5L8 11.5L4.3 13.5L5 9.3L2 6.4L6.2 5.8L8 2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function IconMenu({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function IconCalendar({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 6.5H13.5M5.5 2V4.5M10.5 2V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

export function IconFile({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.5 2H10L12.5 4.5V14H3.5V2Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 2V5H12.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconSettings({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 2V3.8M8 12.2V14M2 8H3.8M12.2 8H14M3.7 3.7L5 5M11 11L12.3 12.3M12.3 3.7L11 5M5 11L3.7 12.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}
