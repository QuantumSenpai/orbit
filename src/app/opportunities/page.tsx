"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import {
  IconArrowUpRight,
  IconCalendar,
  IconGrid,
  IconList,
  IconSearch,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitDrawer,
  OrbitFilterButton,
  OrbitIconControl,
  OrbitSectionHeading,
  OrbitStatusBadge,
  OrbitTextarea,
} from "@/components/ui/OrbitPrimitives";
import { OpportunityStatus, OpportunityTrack } from "@/types/orbit";

const PIPELINE_STAGES: OpportunityStatus[] = [
  "Saved",
  "Preparing",
  "Applied/Sent",
  "Reply",
  "Interview/Meeting",
  "Won/Offer",
];

const ALL_STATUSES: ("All" | OpportunityStatus)[] = [
  "All",
  ...PIPELINE_STAGES,
  "Closed",
];

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get("selected");
  const {
    state,
    updateOpportunity,
    setOpportunityStatus,
    addOpportunityFollowUpTask,
    pushToast,
  } = useOrbit();

  const [track, setTrack] = useState<OpportunityTrack>("internships");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OpportunityStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [notesDraft, setNotesDraft] = useState("");
  const [showPreviewApp, setShowPreviewApp] = useState(false);

  useEffect(() => {
    if (!initialSelected) return;
    setSelectedId(initialSelected);
    const match = state.opportunities.find((o) => o.id === initialSelected);
    if (match) setTrack(match.track);
  }, [initialSelected, state.opportunities]);

  const selectedOpp = useMemo(
    () => state.opportunities.find((o) => o.id === selectedId) ?? null,
    [state.opportunities, selectedId]
  );

  useEffect(() => {
    if (selectedOpp) {
      setNotesDraft(selectedOpp.notes);
      setShowPreviewApp(false);
    }
  }, [selectedOpp]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.opportunities.filter((o) => {
      if (o.track !== track) return false;
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.companyOrClient.toLowerCase().includes(q) ||
        o.roleOrProject.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        o.matchExplanation.toLowerCase().includes(q)
      );
    });
  }, [state.opportunities, track, statusFilter, query]);

  const cvName = (cvId: string) =>
    state.cvVersions.find((c) => c.id === cvId)?.name ?? "Default CV";

  return (
    <div className="w-full">
      {/* Header */}
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
            <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
            06 / OPPORTUNITIES PIPELINE
          </p>
          <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="orbit-page-title-inner">Opportunities</span>
            </span>
          </h1>
          <p className="text-[14px] text-[#414140] mt-2 max-w-[58ch]">
            Track internship applications and freelance client leads with matched CV versions and follow-up reminders. No external messages or applications are sent in this frontend phase.
          </p>
        </div>

        <div className="flex items-center border border-[#282828] shrink-0">
          {(["internships", "freelance"] as const).map((t) => {
            const count = state.opportunities.filter((o) => o.track === t).length;
            return (
              <OrbitFilterButton
                key={t}
                label={`${t} (${count})`}
                active={track === t}
                onClick={() => setTrack(t)}
                className="border-r last:border-r-0 border-[#282828]"
              />
            );
          })}
        </div>
      </section>

      {/* Search, Status Filter, View Toggle */}
      <section className="orbit-page-section border-b border-[#B3B3AF] grid grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 px-4 py-3 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <IconSearch className="w-4 h-4 text-[#5C5C59] shrink-0" />
          <label htmlFor="opp-search" className="sr-only">
            Search opportunities
          </label>
          <input
            id="opp-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by company, client, role, or location..."
            className="w-full bg-transparent text-[14px] text-[#282828] placeholder:text-[#5C5C59] focus:outline-none"
          />
        </div>

        <div className="px-3 py-2 border-b lg:border-b-0 lg:border-r border-[#B3B3AF] flex items-center gap-2">
          <label htmlFor="opp-status-filter" className="orbit-mono-label text-[#5C5C59]">
            Stage:
          </label>
          <select
            id="opp-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "All" | OpportunityStatus)
            }
            className="border border-[#B3B3AF] bg-[#F5F5ED] px-2.5 py-1.5 font-mono text-[11px] text-[#282828]"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end px-3 py-2 gap-1.5">
          <OrbitIconControl
            label="List view"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className="px-3 py-1.5 gap-1.5 font-mono text-[11px] uppercase"
          >
            <IconList className="w-3.5 h-3.5" />
            <span>List</span>
          </OrbitIconControl>
          <OrbitIconControl
            label="Pipeline view"
            active={viewMode === "pipeline"}
            onClick={() => setViewMode("pipeline")}
            className="px-3 py-1.5 gap-1.5 font-mono text-[11px] uppercase"
          >
            <IconGrid className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </OrbitIconControl>
        </div>
      </section>

      {/* Main Content */}
      {filtered.length === 0 ? (
        <div className="orbit-page-section p-12 text-center border-b border-[#B3B3AF]">
          <p className="orbit-mono-label text-[#5C5C59]">
            No opportunities match your filter in {track}.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <section className="orbit-page-section divide-y divide-[#B3B3AF] border-b border-[#B3B3AF]">
          {filtered.map((opp) => (
            <article
              key={opp.id}
              className="orbit-interactive-row p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
            >
              <div className="lg:col-span-5">
                <div className="flex flex-wrap items-center gap-2">
                  <OrbitStatusBadge
                    tone={
                      opp.status === "Reply" || opp.status === "Won/Offer"
                        ? "accent"
                        : opp.status === "Closed"
                          ? "muted"
                          : "ink"
                    }
                  >
                    {opp.status}
                  </OrbitStatusBadge>
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
                    {opp.location} · {opp.feeStatus}
                  </span>
                </div>
                <h2 className="orbit-display text-[22px] text-[#282828] mt-2">
                  {opp.companyOrClient}
                </h2>
                <p className="text-[15px] font-medium text-[#414140] mt-0.5">
                  {opp.roleOrProject}
                </p>
                <p className="font-mono text-[11px] text-[#C82A00] mt-1.5">
                  {opp.compensation} · Deadline: {opp.deadline}
                </p>
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <p className="text-[13px] text-[#414140] leading-relaxed">
                  {opp.matchExplanation}
                </p>
                <p className="font-mono text-[11px] text-[#282828]">
                  CV:{" "}
                  <Link
                    href={`/cv-studio?cv=${opp.cvVersionId}`}
                    className="underline hover:text-[#C82A00]"
                  >
                    {cvName(opp.cvVersionId)}
                  </Link>
                </p>
                <p className="font-mono text-[10px] text-[#5C5C59]">
                  Last activity: {opp.lastActivity} · Next follow-up:{" "}
                  {opp.nextFollowUp}
                </p>
              </div>

              <div className="lg:col-span-3 flex flex-wrap lg:justify-end items-center gap-2">
                <a
                  href={opp.listingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#B3B3AF] font-mono text-[10px] uppercase tracking-[0.06em] hover:border-[#282828] hover:bg-[#ECEBE2]"
                >
                  <span>Listing</span>
                  <IconArrowUpRight className="w-3 h-3" />
                </a>
                <OrbitButton
                  label="Inspect"
                  size="sm"
                  onClick={() => setSelectedId(opp.id)}
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="orbit-page-section overflow-x-auto border-b border-[#B3B3AF]">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 min-w-0 divide-y md:divide-y-0 md:divide-x divide-[#B3B3AF]">
            {PIPELINE_STAGES.map((stage) => {
              const items = filtered.filter((o) => o.status === stage);
              return (
                <div key={stage} className="flex flex-col min-h-[300px]">
                  <div className="px-3.5 py-3 border-b border-[#B3B3AF] bg-[#ECEBE2]/55 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#282828]">
                      {stage}
                    </span>
                    <span className="font-mono text-[10px] text-[#C82A00] font-semibold">
                      {items.length}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2.5 flex-1">
                    {items.map((opp) => (
                      <button
                        key={opp.id}
                        type="button"
                        onClick={() => setSelectedId(opp.id)}
                        className="orbit-interactive-row w-full text-left p-3 border border-[#B3B3AF] bg-[#F5F5ED] hover:border-[#282828] cursor-pointer"
                      >
                        <p className="font-mono text-[10px] uppercase text-[#C82A00]">
                          Due {opp.deadline}
                        </p>
                        <p className="text-[14px] font-bold text-[#282828] mt-1">
                          {opp.companyOrClient}
                        </p>
                        <p className="text-[12px] text-[#414140] mt-0.5 line-clamp-2">
                          {opp.roleOrProject}
                        </p>
                        <p className="font-mono text-[10px] text-[#5C5C59] mt-2 truncate">
                          {cvName(opp.cvVersionId)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.some((o) => o.status === "Closed") && (
            <div className="p-4 border-t border-[#B3B3AF] bg-[#ECEBE2]/35">
              <p className="orbit-mono-label text-[#5C5C59] mb-2">Closed</p>
              <div className="flex flex-wrap gap-2">
                {filtered
                  .filter((o) => o.status === "Closed")
                  .map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => setSelectedId(opp.id)}
                      className="px-3 py-1.5 border border-[#B3B3AF] font-mono text-[11px] hover:border-[#282828] cursor-pointer"
                    >
                      {opp.companyOrClient} — {opp.roleOrProject}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Opportunity Detail Drawer */}
      <OrbitDrawer
        open={Boolean(selectedOpp)}
        onClose={() => setSelectedId(null)}
        title={selectedOpp?.companyOrClient ?? ""}
        subtitle={selectedOpp?.roleOrProject}
      >
        {selectedOpp && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 border border-[#B3B3AF] divide-y divide-x divide-[#B3B3AF] text-[12px]">
              <div className="p-3">
                <span className="orbit-mono-label text-[#5C5C59] block">
                  Location
                </span>
                <span className="font-medium mt-0.5 block">
                  {selectedOpp.location}
                </span>
              </div>
              <div className="p-3">
                <span className="orbit-mono-label text-[#5C5C59] block">
                  Compensation
                </span>
                <span className="font-medium mt-0.5 block">
                  {selectedOpp.compensation}
                </span>
              </div>
              <div className="p-3">
                <span className="orbit-mono-label text-[#5C5C59] block">
                  Deadline
                </span>
                <span className="font-mono mt-0.5 block text-[#C82A00]">
                  {selectedOpp.deadline}
                </span>
              </div>
              <div className="p-3">
                <span className="orbit-mono-label text-[#5C5C59] block">
                  App Fee Status
                </span>
                <span className="font-mono mt-0.5 block">
                  {selectedOpp.feeStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-[#B3B3AF] p-4 bg-[#ECEBE2]/40">
              <div>
                <label
                  htmlFor="opp-detail-status"
                  className="block orbit-mono-label text-[#5C5C59] mb-1.5"
                >
                  Pipeline Stage
                </label>
                <select
                  id="opp-detail-status"
                  value={selectedOpp.status}
                  onChange={(e) =>
                    setOpportunityStatus(
                      selectedOpp.id,
                      e.target.value as OpportunityStatus
                    )
                  }
                  className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 font-mono text-[12px]"
                >
                  {[...PIPELINE_STAGES, "Closed"].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="opp-detail-cv"
                  className="block orbit-mono-label text-[#5C5C59] mb-1.5"
                >
                  Selected CV Version
                </label>
                <select
                  id="opp-detail-cv"
                  value={selectedOpp.cvVersionId}
                  onChange={(e) => {
                    updateOpportunity(
                      selectedOpp.id,
                      { cvVersionId: e.target.value },
                      `Switched CV version to ${cvName(e.target.value)}.`
                    );
                    pushToast("CV version updated.", { tone: "success" });
                  }}
                  className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 font-mono text-[12px]"
                >
                  {state.cvVersions.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 border border-[#B3B3AF]">
              <p className="orbit-mono-label text-[#C82A00] mb-1">
                Match Explanation
              </p>
              <p className="text-[13px] text-[#282828] leading-relaxed">
                {selectedOpp.matchExplanation}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <OrbitButton
                type="button"
                size="sm"
                label="Preview Application"
                onClick={() => setShowPreviewApp((v) => !v)}
              />
              {selectedOpp.status !== "Applied/Sent" && (
                <OrbitButton
                  type="button"
                  size="sm"
                  variant="accent"
                  label="Mark as Applied"
                  onClick={() =>
                    setOpportunityStatus(selectedOpp.id, "Applied/Sent")
                  }
                />
              )}
              <OrbitButton
                type="button"
                size="sm"
                variant="subtle"
                showArrow={false}
                label="Create Follow-up Reminder"
                onClick={() => addOpportunityFollowUpTask(selectedOpp.id)}
              />
            </div>

            {showPreviewApp && (
              <div className="p-4 border border-[#282828] bg-[#ECEBE2]/65 space-y-2">
                <p className="orbit-mono-label text-[#C82A00]">
                  Local Application Preview (No Submission Sent)
                </p>
                <p className="text-[13px] text-[#282828]">
                  <strong>Target:</strong> {selectedOpp.companyOrClient} —{" "}
                  {selectedOpp.roleOrProject}
                </p>
                <p className="text-[13px] text-[#282828]">
                  <strong>Attached Resume:</strong>{" "}
                  {cvName(selectedOpp.cvVersionId)}
                </p>
                <p className="text-[12px] text-[#414140]">
                  Listing URL:{" "}
                  <a
                    href={selectedOpp.listingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {selectedOpp.listingUrl}
                  </a>
                </p>
                <Link
                  href={`/cv-studio?cv=${selectedOpp.cvVersionId}`}
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase underline text-[#282828] hover:text-[#C82A00]"
                >
                  <span>Open in CV Studio</span>
                  <IconArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            <div className="border border-[#B3B3AF]">
              <OrbitTextarea
                id="opp-notes"
                label="Private Notes"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="border-b-0"
              />
              <div className="px-3 py-2 border-t border-[#B3B3AF] flex justify-end">
                <OrbitButton
                  type="button"
                  size="sm"
                  label="Save Notes"
                  onClick={() => {
                    updateOpportunity(
                      selectedOpp.id,
                      { notes: notesDraft },
                      "Updated private notes."
                    );
                    pushToast("Opportunity notes saved.", { tone: "success" });
                  }}
                />
              </div>
            </div>

            <div className="border border-[#B3B3AF]">
              <OrbitSectionHeading
                code="LOG"
                title="Application"
                accentWord="History"
              />
              <ul className="divide-y divide-[#B3B3AF]/75">
                {selectedOpp.history.map((entry) => (
                  <li key={entry.id} className="px-3.5 py-2.5 flex items-start gap-2.5">
                    <IconCalendar className="w-3.5 h-3.5 text-[#C82A00] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-mono text-[10px] text-[#5C5C59]">
                        {entry.date}
                      </span>
                      <p className="text-[13px] text-[#282828] mt-0.5">
                        {entry.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </OrbitDrawer>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={<div className="p-8 orbit-mono-label">Loading Opportunities...</div>}
    >
      <OpportunitiesContent />
    </Suspense>
  );
}
