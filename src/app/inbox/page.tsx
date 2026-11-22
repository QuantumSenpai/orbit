"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import {
  IconArrowUpRight,
  IconFile,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitFilterButton,
  OrbitIconControl,
  OrbitSectionHeading,
  OrbitStatusBadge,
} from "@/components/ui/OrbitPrimitives";
import { InboxKind } from "@/types/orbit";

const KIND_FILTERS: { value: "all" | InboxKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Docs" },
  { value: "image", label: "Images" },
  { value: "note", label: "Notes" },
  { value: "link", label: "Links" },
];

function InboxContent() {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get("selected");
  const {
    state,
    addInboxFileItems,
    runSimulatedAnalysis,
    convertInboxSuggestion,
    deleteInboxItem,
  } = useOrbit();

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | InboxKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelected ?? state.inbox[0]?.id ?? null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSelected) setSelectedId(initialSelected);
  }, [initialSelected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.inbox.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.inbox, query, kindFilter]);

  const selectedItem = useMemo(
    () =>
      state.inbox.find((i) => i.id === selectedId) ?? filtered[0] ?? null,
    [state.inbox, selectedId, filtered]
  );

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const metas = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    addInboxFileItems(metas);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
            <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
            03 / INBOX &amp; CAPTURES
          </p>
          <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="orbit-page-title-inner">Inbox</span>
            </span>
          </h1>
          <p className="text-[14px] text-[#414140] mt-2 max-w-[58ch]">
            Saved PDFs, notes, images, and links. Local file dropzone records metadata only in this frontend phase; analysis actions display clearly labelled simulated output.
          </p>
        </div>

        {/* Local File Picker Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border border-dashed px-4 py-3 flex items-center gap-3 transition-colors ${
            isDragging
              ? "border-[#FA3600] bg-[#FA3600]/8"
              : "border-[#282828] bg-[#ECEBE2]/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#282828]">
              Drop local files (metadata only)
            </p>
            <p className="font-mono text-[10px] text-[#5C5C59]">
              No binary upload or server parsing
            </p>
          </div>
          <OrbitButton
            type="button"
            label="Choose File"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          />
        </div>
      </section>

      {/* Search & Kind Filters */}
      <section className="orbit-page-section border-b border-[#B3B3AF] grid grid-cols-1 lg:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3 px-4 py-3 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <IconSearch className="w-4 h-4 text-[#5C5C59] shrink-0" />
          <label htmlFor="inbox-search" className="sr-only">
            Search inbox items
          </label>
          <input
            id="inbox-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved files, tags, or summaries..."
            className="w-full bg-transparent text-[14px] text-[#282828] placeholder:text-[#5C5C59] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap">
          {KIND_FILTERS.map((f) => (
            <OrbitFilterButton
              key={f.value}
              label={f.label}
              active={kindFilter === f.value}
              onClick={() => setKindFilter(f.value)}
              className="border-r last:border-r-0 border-[#B3B3AF]"
            />
          ))}
        </div>
      </section>

      {/* Split List + Detail Inspector */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="orbit-mono-label text-[#5C5C59]">
                No inbox items match this filter.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#B3B3AF]/75">
              {filtered.map((item) => {
                const isSel = selectedItem?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-selected={isSel ? "true" : "false"}
                      onClick={() => setSelectedId(item.id)}
                      className={`orbit-interactive-row w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                        isSel
                          ? "bg-[#282828] text-[#F5F5ED]"
                          : "text-[#282828]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                          <IconFile
                            className={`w-3.5 h-3.5 ${
                              isSel ? "text-[#FA3600]" : "text-[#C82A00]"
                            }`}
                          />
                          <span>{item.kind}</span>
                          {item.fileSize && <span>· {item.fileSize}</span>}
                        </span>
                        <span
                          className={`font-mono text-[10px] ${
                            isSel ? "text-[#B3B3AF]" : "text-[#5C5C59]"
                          }`}
                        >
                          {item.savedAt}
                        </span>
                      </div>
                      <p className="text-[14px] font-semibold mt-1.5 break-words">
                        {item.title}
                      </p>
                      <p
                        className={`text-[12px] mt-1 line-clamp-2 ${
                          isSel ? "text-[#ECEBE2]/85" : "text-[#414140]"
                        }`}
                      >
                        {item.summary}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail Pane */}
        <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between">
          {!selectedItem ? (
            <div className="m-auto text-center">
              <p className="orbit-mono-label text-[#5C5C59]">
                Select an inbox item to inspect details.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#B3B3AF]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <OrbitStatusBadge tone="ink">
                      {selectedItem.kind}
                    </OrbitStatusBadge>
                    <OrbitStatusBadge tone="muted">
                      {selectedItem.analysisStatus === "simulated_done"
                        ? "Simulated Analysis Ready"
                        : selectedItem.analysisStatus === "simulated_analyzing"
                          ? "Simulating..."
                          : "Demo Preview"}
                    </OrbitStatusBadge>
                  </div>
                  <h2 className="orbit-display text-[22px] sm:text-[26px] text-[#282828] break-words">
                    {selectedItem.title}
                  </h2>
                  <p className="font-mono text-[11px] text-[#5C5C59] mt-1.5">
                    Source: {selectedItem.source} · Saved: {selectedItem.savedAt}
                    {selectedItem.fileSize ? ` · Size: ${selectedItem.fileSize}` : ""}
                  </p>
                </div>

                <OrbitIconControl
                  label={`Remove ${selectedItem.title}`}
                  tone="danger"
                  onClick={() => deleteInboxItem(selectedItem.id)}
                  className="p-2 shrink-0"
                >
                  <IconTrash className="w-4 h-4" />
                </OrbitIconControl>
              </div>

              {selectedItem.url && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border border-[#B3B3AF] bg-[#ECEBE2]/45">
                  <span className="font-mono text-[12px] truncate text-[#282828]">
                    {selectedItem.url}
                  </span>
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase underline text-[#C82A00] shrink-0"
                  >
                    <span>Open</span>
                    <IconArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map((tag) => (
                  <OrbitStatusBadge key={tag} tone="neutral">
                    {tag}
                  </OrbitStatusBadge>
                ))}
              </div>

              {/* Summary & Simulated Analysis Trigger */}
              <div className="border border-[#B3B3AF] p-4 bg-[#ECEBE2]/35">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00]">
                    <span className="w-[3px] h-3.5 bg-[#FA3600]" aria-hidden="true" />
                    Demo Summary · AI Agents Coming Soon
                  </span>
                  <OrbitButton
                    type="button"
                    size="sm"
                    label={
                      selectedItem.analysisStatus === "simulated_analyzing"
                        ? "Simulating..."
                        : "Run Simulated Analysis"
                    }
                    disabled={selectedItem.analysisStatus === "simulated_analyzing"}
                    onClick={() => runSimulatedAnalysis(selectedItem.id)}
                  />
                </div>
                <p className="text-[14px] text-[#282828] leading-relaxed">
                  {selectedItem.summary}
                </p>
              </div>

              {/* Suggested Action Items -> Convert to Task or Idea */}
              <div className="border border-[#B3B3AF]">
                <OrbitSectionHeading
                  code="ACT"
                  title="Suggested"
                  accentWord="Actions"
                />
                <ul className="divide-y divide-[#B3B3AF]/75">
                  {selectedItem.suggestedActions.map((act) => (
                    <li
                      key={act.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <span className="text-[14px] text-[#282828]">
                        {act.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {act.convertedTo ? (
                          <OrbitStatusBadge tone="accent">
                            Converted to {act.convertedTo}
                          </OrbitStatusBadge>
                        ) : (
                          <>
                            <OrbitButton
                              type="button"
                              size="sm"
                              label="To Task"
                              onClick={() =>
                                convertInboxSuggestion(
                                  selectedItem.id,
                                  act.id,
                                  "task"
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                convertInboxSuggestion(
                                  selectedItem.id,
                                  act.id,
                                  "idea"
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#B3B3AF] font-mono text-[10px] uppercase tracking-[0.06em] hover:border-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
                            >
                              <IconPlus className="w-3 h-3" />
                              <span>To Idea</span>
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="p-8 orbit-mono-label">Loading Inbox...</div>}>
      <InboxContent />
    </Suspense>
  );
}
