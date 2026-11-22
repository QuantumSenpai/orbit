"use client";

import React, { useEffect, useState } from "react";
import { QuickAddKind, useOrbit } from "@/context/OrbitContext";
import { IconClose } from "@/components/ui/OrbitIcons";
import { OrbitButton, OrbitField, OrbitTextarea } from "@/components/ui/OrbitPrimitives";
import { LibraryCategory } from "@/types/orbit";

const TABS: { key: QuickAddKind; label: string }[] = [
  { key: "task", label: "Task" },
  { key: "link", label: "Link" },
  { key: "idea", label: "Idea" },
  { key: "project", label: "Project" },
];

export function QuickAddModal() {
  const {
    state,
    quickAddOpen,
    quickAddKind,
    openQuickAdd,
    setQuickAddOpen,
    addTask,
    addLibraryItem,
    addIdea,
    addProject,
  } = useOrbit();

  const [title, setTitle] = useState("");
  const [secondary, setSecondary] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState<LibraryCategory>("Websites");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (quickAddOpen) {
      setTitle("");
      setSecondary("");
      setDetail("");
      setProjectId("");
      setError("");
    }
  }, [quickAddOpen, quickAddKind]);

  useEffect(() => {
    if (!quickAddOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickAddOpen, setQuickAddOpen]);

  if (!quickAddOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title before saving.");
      return;
    }

    if (quickAddKind === "task") {
      addTask({
        title,
        projectId: projectId || undefined,
        dueLabel: secondary || "Today",
        priority: "normal",
      });
    } else if (quickAddKind === "link") {
      const urlValue = secondary.trim();
      if (!/^https?:\/\//i.test(urlValue)) {
        setError("Enter a valid http:// or https:// URL to preserve the bookmark.");
        return;
      }
      addLibraryItem({
        title: title.trim(),
        url: urlValue,
        category,
        description: detail.trim() || "Saved via Quick Add.",
        tags: [category],
        favorite: false,
      });
    } else if (quickAddKind === "idea") {
      addIdea({
        title,
        description: detail || "Captured from Quick Add.",
        tags: secondary
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        source: "Quick Add",
      });
    } else if (quickAddKind === "project") {
      addProject({
        name: title,
        clientOrType: secondary || "Personal",
        deadline: detail || "2026-12-30",
        summary: "Created via Quick Add.",
      });
    }

    setQuickAddOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-[#282828]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Add"
      onClick={(e) => {
        if (e.target === e.currentTarget) setQuickAddOpen(false);
      }}
    >
      <div className="orbit-modal-panel orbit-paper-surface w-full max-w-[540px] border border-[#282828]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#B3B3AF]">
          <div>
            <p className="orbit-mono-label text-[#5C5C59]">Workspace Capture</p>
            <h2 className="orbit-display text-[22px] text-[#282828]">Quick Add</h2>
          </div>
          <button
            type="button"
            onClick={() => setQuickAddOpen(false)}
            aria-label="Close Quick Add"
            className="p-2 border border-[#B3B3AF] text-[#282828] hover:bg-[#282828] hover:text-[#F5F5ED] cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Kind tabs */}
        <div className="grid grid-cols-4 border-b border-[#B3B3AF]" role="tablist">
          {TABS.map((tab) => {
            const active = tab.key === quickAddKind;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => openQuickAdd(tab.key)}
                className={`py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] border-r last:border-r-0 border-[#B3B3AF] cursor-pointer transition-colors ${
                  active
                    ? "bg-[#282828] text-[#F5F5ED]"
                    : "bg-transparent text-[#282828] hover:bg-[#ECEBE2]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <OrbitField
            id="qa-title"
            label={
              quickAddKind === "project"
                ? "Project Name"
                : quickAddKind === "link"
                  ? "Bookmark Title"
                  : quickAddKind === "idea"
                    ? "Idea Title"
                    : "Task Title"
            }
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            autoFocus
          />

          <OrbitField
            id="qa-secondary"
            label={
              quickAddKind === "task"
                ? "Due Label (e.g. Today · 16:00)"
                : quickAddKind === "link"
                  ? "URL (https://...)"
                  : quickAddKind === "idea"
                    ? "Tags (comma-separated)"
                    : "Client or Type"
            }
            value={secondary}
            onChange={(e) => {
              setSecondary(e.target.value);
              if (error) setError("");
            }}
          />

          {quickAddKind === "task" && (
            <div className="px-4 py-3 border-b border-[#B3B3AF]">
              <label
                htmlFor="qa-proj"
                className="block orbit-mono-label text-[#5C5C59] mb-1.5"
              >
                Link to Project (Optional)
              </label>
              <select
                id="qa-proj"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 text-[14px] text-[#282828]"
              >
                <option value="">No project</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {quickAddKind === "link" && (
            <div className="px-4 py-3 border-b border-[#B3B3AF]">
              <label
                htmlFor="qa-cat"
                className="block orbit-mono-label text-[#5C5C59] mb-1.5"
              >
                Category
              </label>
              <select
                id="qa-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as LibraryCategory)}
                className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 text-[14px] text-[#282828]"
              >
                {(["Websites", "Fonts", "Palettes", "Tools", "Reading"] as const).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {quickAddKind !== "task" && (
            <OrbitTextarea
              id="qa-detail"
              label={
                quickAddKind === "project"
                  ? "Target Deadline (YYYY-MM-DD)"
                  : "Short Description"
              }
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          )}

          {error && (
            <p className="px-4 py-2.5 font-mono text-[11px] text-[#FA3600] border-b border-[#B3B3AF]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 p-4">
            <OrbitButton
              type="button"
              variant="subtle"
              label="Cancel"
              showArrow={false}
              onClick={() => setQuickAddOpen(false)}
            />
            <OrbitButton type="submit" variant="accent" label={`Save ${quickAddKind}`} />
          </div>
        </form>
      </div>
    </div>
  );
}
