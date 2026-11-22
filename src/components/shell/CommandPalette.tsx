"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import { IconArrowUpRight, IconClose, IconSearch } from "@/components/ui/OrbitIcons";

interface PaletteEntry {
  id: string;
  section: string;
  title: string;
  meta: string;
  href?: string;
  action?: () => void;
}

const ROUTES: PaletteEntry[] = [
  { id: "nav-today", section: "Navigate", title: "Today", meta: "Daily overview & Earth", href: "/" },
  { id: "nav-projects", section: "Navigate", title: "Projects", meta: "Milestones & tasks", href: "/projects" },
  { id: "nav-inbox", section: "Navigate", title: "Inbox", meta: "Files, notes & links", href: "/inbox" },
  { id: "nav-ideas", section: "Navigate", title: "Ideas", meta: "Concepts & polish", href: "/ideas" },
  { id: "nav-library", section: "Navigate", title: "Library", meta: "Bookmarks, fonts & palettes", href: "/library" },
  { id: "nav-opps", section: "Navigate", title: "Opportunities", meta: "Internships & freelance", href: "/opportunities" },
  { id: "nav-cv", section: "Navigate", title: "CV Studio", meta: "LaTeX & resume versions", href: "/cv-studio" },
  { id: "nav-settings", section: "Navigate", title: "Settings", meta: "Preferences & mock status", href: "/settings" },
];

export function CommandPalette() {
  const router = useRouter();
  const {
    state,
    commandPaletteOpen,
    setCommandPaletteOpen,
    openQuickAdd,
  } = useOrbit();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const actions: PaletteEntry[] = [
      {
        id: "act-task",
        section: "Quick Add",
        title: "New Task",
        meta: "Add to Today priorities",
        action: () => openQuickAdd("task"),
      },
      {
        id: "act-link",
        section: "Quick Add",
        title: "Save Bookmark / Link",
        meta: "Add to Library",
        action: () => openQuickAdd("link"),
      },
      {
        id: "act-idea",
        section: "Quick Add",
        title: "Capture Idea",
        meta: "Add to Ideas",
        action: () => openQuickAdd("idea"),
      },
      {
        id: "act-project",
        section: "Quick Add",
        title: "Create Project",
        meta: "Add to Projects",
        action: () => openQuickAdd("project"),
      },
    ];

    const dynamicEntries: PaletteEntry[] = [
      ...state.projects.map((p) => ({
        id: `p-${p.id}`,
        section: "Projects",
        title: p.name,
        meta: `${p.status} · Due ${p.deadline}`,
        href: `/projects?selected=${p.id}`,
      })),
      ...state.tasks.map((t) => ({
        id: `t-${t.id}`,
        section: "Tasks",
        title: t.title,
        meta: `${t.completed ? "Done" : "Open"} · ${t.dueLabel}`,
        href: "/",
      })),
      ...state.inbox.map((i) => ({
        id: `inb-${i.id}`,
        section: "Inbox",
        title: i.title,
        meta: `${i.kind.toUpperCase()} · ${i.source}`,
        href: `/inbox?selected=${i.id}`,
      })),
      ...state.ideas.map((idItem) => ({
        id: `idea-${idItem.id}`,
        section: "Ideas",
        title: idItem.title,
        meta: idItem.pinnedToToday ? "Pinned to Today" : "Idea",
        href: "/ideas",
      })),
      ...state.library.map((l) => ({
        id: `lib-${l.id}`,
        section: "Library",
        title: l.title,
        meta: `${l.category} · ${l.domain}`,
        href: `/library?selected=${l.id}`,
      })),
      ...state.opportunities.map((o) => ({
        id: `opp-${o.id}`,
        section: "Opportunities",
        title: `${o.companyOrClient} — ${o.roleOrProject}`,
        meta: `${o.status} · ${o.location}`,
        href: `/opportunities?selected=${o.id}`,
      })),
      ...state.cvVersions.map((cv) => ({
        id: `cv-${cv.id}`,
        section: "CV Studio",
        title: cv.name,
        meta: cv.targetRole,
        href: `/cv-studio?cv=${cv.id}`,
      })),
    ];

    const all = [...ROUTES, ...actions, ...dynamicEntries];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 14);
    return all
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.meta.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [query, state, openQuickAdd]);

  const executeEntry = (entry: PaletteEntry) => {
    setCommandPaletteOpen(false);
    if (entry.action) {
      entry.action();
    } else if (entry.href) {
      router.push(entry.href);
    }
  };

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setCommandPaletteOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          entries.length === 0 ? 0 : (prev + 1) % entries.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          entries.length === 0 ? 0 : (prev - 1 + entries.length) % entries.length
        );
      } else if (e.key === "Enter" && entries[activeIndex]) {
        e.preventDefault();
        executeEntry(entries[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-4 bg-[#282828]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Global workspace search"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div className="orbit-modal-panel orbit-paper-surface w-full max-w-[640px] border border-[#282828] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#B3B3AF]">
          <IconSearch className="w-4 h-4 text-[#5C5C59] shrink-0" />
          <label htmlFor="orbit-cmd-input" className="sr-only">
            Search workspace
          </label>
          <input
            ref={inputRef}
            id="orbit-cmd-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Jump to screen, project, bookmark, opportunity, or quick action..."
            className="w-full bg-transparent text-[15px] text-[#282828] placeholder:text-[#5C5C59] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            aria-label="Close command palette"
            className="p-1.5 border border-[#B3B3AF] text-[#282828] hover:bg-[#282828] hover:text-[#F5F5ED] cursor-pointer"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto divide-y divide-[#B3B3AF]/60">
          {entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="orbit-mono-label text-[#5C5C59]">
                No matches found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => executeEntry(entry)}
                  className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors cursor-pointer ${
                    active ? "bg-[#282828] text-[#F5F5ED]" : "hover:bg-[#ECEBE2]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 border ${
                          active
                            ? "border-[#FA3600] text-[#FA3600]"
                            : "border-[#B3B3AF] text-[#5C5C59]"
                        }`}
                      >
                        {entry.section}
                      </span>
                      <span className="font-medium text-[14px] truncate">
                        {entry.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-[11px] hidden sm:inline ${
                        active ? "text-[#B3B3AF]" : "text-[#5C5C59]"
                      }`}
                    >
                      {entry.meta}
                    </span>
                    <IconArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[#B3B3AF] bg-[#ECEBE2]/70 font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
          <span>↑↓ Navigate · Enter Open · Esc Close</span>
          <span>Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
