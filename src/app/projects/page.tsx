"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import { computeProjectProgress } from "@/lib/storage";
import {
  IconCheck,
  IconGrid,
  IconList,
  IconPlus,
  IconSearch,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitDrawer,
  OrbitField,
  OrbitFilterButton,
  OrbitIconControl,
  OrbitSectionHeading,
  OrbitStatusBadge,
} from "@/components/ui/OrbitPrimitives";
import { ProjectStatus } from "@/types/orbit";

const STATUS_OPTIONS: { value: "all" | ProjectStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

function ProjectsContent() {
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get("selected");
  const {
    state,
    openQuickAdd,
    updateProject,
    toggleProjectTask,
    addProjectTask,
    toggleProjectMilestone,
    pushToast,
  } = useOrbit();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl);
  const [newProjTask, setNewProjTask] = useState("");

  useEffect(() => {
    if (selectedFromUrl) setSelectedId(selectedFromUrl);
  }, [selectedFromUrl]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.clientOrType.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      );
    });
  }, [state.projects, query, statusFilter]);

  const selectedProject = useMemo(
    () => state.projects.find((p) => p.id === selectedId) ?? null,
    [state.projects, selectedId]
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newProjTask.trim()) return;
    addProjectTask(selectedProject.id, newProjTask);
    setNewProjTask("");
  };

  return (
    <div className="w-full">
      {/* Header Band */}
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
            <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
            02 / PROJECTS &amp; MILESTONES
          </p>
          <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="orbit-page-title-inner">Projects</span>
            </span>
          </h1>
          <p className="text-[14px] text-[#414140] mt-2 max-w-[54ch]">
            Progress is calculated directly from completed project tasks. GitHub commit feeds below use clearly labelled simulated data.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrbitButton
            label="New Project"
            variant="accent"
            onClick={() => openQuickAdd("project")}
          />
        </div>
      </section>

      {/* Filter & View Bar */}
      <section className="orbit-page-section border-b border-[#B3B3AF] grid grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 px-4 py-3 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <IconSearch className="w-4 h-4 text-[#5C5C59] shrink-0" />
          <label htmlFor="proj-search" className="sr-only">
            Search projects
          </label>
          <input
            id="proj-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by project name, client, or summary..."
            className="w-full bg-transparent text-[14px] text-[#282828] placeholder:text-[#5C5C59] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          {STATUS_OPTIONS.map((opt) => (
            <OrbitFilterButton
              key={opt.value}
              label={opt.label}
              active={statusFilter === opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className="border-r last:border-r-0 border-[#B3B3AF]"
            />
          ))}
        </div>

        <div className="flex items-center justify-end px-3 py-2 gap-1.5">
          <OrbitIconControl
            label="Grid view"
            active={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className="p-2"
          >
            <IconGrid className="w-4 h-4" />
          </OrbitIconControl>
          <OrbitIconControl
            label="List view"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className="p-2"
          >
            <IconList className="w-4 h-4" />
          </OrbitIconControl>
        </div>
      </section>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="orbit-page-section p-12 text-center border-b border-[#B3B3AF]">
          <p className="orbit-mono-label text-[#5C5C59]">
            No projects match your current filter.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <section className="orbit-page-section grid grid-cols-1 md:grid-cols-2 border-b border-[#B3B3AF]">
          {filteredProjects.map((proj, idx) => {
            const prog = computeProjectProgress(proj);
            return (
              <article
                key={proj.id}
                className={`orbit-interactive-row p-6 flex flex-col justify-between border-b border-[#B3B3AF] ${
                  idx % 2 === 0 ? "md:border-r" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="orbit-mono-label text-[#5C5C59]">
                      {proj.clientOrType}
                    </span>
                    <OrbitStatusBadge
                      tone={proj.status === "active" ? "accent" : "neutral"}
                    >
                      {proj.status}
                    </OrbitStatusBadge>
                  </div>

                  <h2 className="orbit-display text-[24px] text-[#282828] mt-3">
                    {proj.name}
                  </h2>
                  <p className="text-[14px] text-[#414140] mt-2 leading-relaxed">
                    {proj.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#B3B3AF]/70">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#282828]">
                    <span>
                      TASK COMPLETION ({prog.completed}/{prog.total})
                    </span>
                    <span className="font-semibold tabular-nums text-[#C82A00]">
                      {prog.percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-[#ECEBE2] border border-[#B3B3AF]">
                    <div
                      className="h-full bg-[#282828] transition-all duration-300"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] text-[#5C5C59]">
                      Deadline: {proj.deadline}
                    </span>
                    <OrbitButton
                      label="Inspect"
                      size="sm"
                      onClick={() => setSelectedId(proj.id)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="orbit-page-section divide-y divide-[#B3B3AF] border-b border-[#B3B3AF]">
          {filteredProjects.map((proj) => {
            const prog = computeProjectProgress(proj);
            return (
              <div
                key={proj.id}
                className="orbit-interactive-row px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[16px] font-bold uppercase tracking-[-0.01em] text-[#282828]">
                      {proj.name}
                    </h2>
                    <OrbitStatusBadge
                      tone={proj.status === "active" ? "accent" : "neutral"}
                    >
                      {proj.status}
                    </OrbitStatusBadge>
                  </div>
                  <p className="font-mono text-[11px] text-[#5C5C59] mt-1">
                    {proj.clientOrType} · Repo: {proj.repoName} · Due{" "}
                    {proj.deadline}
                  </p>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="w-32">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>
                        {prog.completed}/{prog.total}
                      </span>
                      <span className="text-[#C82A00] font-semibold">
                        {prog.percent}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-[#ECEBE2] border border-[#B3B3AF]">
                      <div
                        className="h-full bg-[#282828]"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </div>
                  <OrbitButton
                    label="Open"
                    size="sm"
                    onClick={() => setSelectedId(proj.id)}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Detail Drawer */}
      <OrbitDrawer
        open={Boolean(selectedProject)}
        onClose={() => setSelectedId(null)}
        title={selectedProject?.name ?? ""}
        subtitle={selectedProject?.clientOrType}
      >
        {selectedProject && (
          <div className="space-y-6">
            {/* Status & Deadline Editors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-[#B3B3AF] p-4 bg-[#ECEBE2]/40">
              <div>
                <label
                  htmlFor="proj-status-select"
                  className="block orbit-mono-label text-[#5C5C59] mb-1.5"
                >
                  Status
                </label>
                <select
                  id="proj-status-select"
                  value={selectedProject.status}
                  onChange={(e) => {
                    updateProject(selectedProject.id, {
                      status: e.target.value as ProjectStatus,
                    });
                    pushToast("Project status updated.", { tone: "success" });
                  }}
                  className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 font-mono text-[12px] text-[#282828]"
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="proj-deadline-input"
                  className="block orbit-mono-label text-[#5C5C59] mb-1.5"
                >
                  Target Deadline
                </label>
                <input
                  id="proj-deadline-input"
                  type="date"
                  value={selectedProject.deadline}
                  onChange={(e) => {
                    updateProject(selectedProject.id, {
                      deadline: e.target.value,
                    });
                    pushToast("Project deadline updated.", { tone: "success" });
                  }}
                  className="w-full border border-[#B3B3AF] bg-[#F5F5ED] px-3 py-2 font-mono text-[12px] text-[#282828]"
                />
              </div>
            </div>

            {/* Summary & Progress */}
            <div>
              <p className="text-[14px] text-[#414140] leading-relaxed">
                {selectedProject.summary}
              </p>
              {(() => {
                const prog = computeProjectProgress(selectedProject);
                return (
                  <div className="mt-4 p-3 border border-[#B3B3AF]">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>CALCULATED PROGRESS</span>
                      <span className="text-[#C82A00] font-semibold">
                        {prog.completed}/{prog.total} TASKS ({prog.percent}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-[#ECEBE2] border border-[#B3B3AF]">
                      <div
                        className="h-full bg-[#FA3600] transition-all duration-300"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Milestones */}
            <div className="border border-[#B3B3AF]">
              <OrbitSectionHeading code="M1" title="Milestones" />
              <ul className="divide-y divide-[#B3B3AF]/75">
                {selectedProject.milestones.map((ms) => (
                  <li
                    key={ms.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleProjectMilestone(selectedProject.id, ms.id)
                      }
                      className="flex items-center gap-3 text-left cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                          ms.done
                            ? "bg-[#282828] border-[#282828] text-white"
                            : "border-[#282828]"
                        }`}
                      >
                        {ms.done && <IconCheck className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-[13px] ${
                          ms.done
                            ? "line-through text-[#5C5C59]"
                            : "text-[#282828] font-medium"
                        }`}
                      >
                        {ms.title}
                      </span>
                    </button>
                    <span className="font-mono text-[10px] text-[#5C5C59] shrink-0">
                      {ms.targetDate}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Project Tasks */}
            <div className="border border-[#B3B3AF]">
              <OrbitSectionHeading code="T1" title="Project" accentWord="Tasks" />
              <form
                onSubmit={handleAddTask}
                className="flex items-stretch border-b border-[#B3B3AF]"
              >
                <OrbitField
                  id="proj-add-task"
                  label="Add task to project"
                  value={newProjTask}
                  onChange={(e) => setNewProjTask(e.target.value)}
                  className="flex-1 border-b-0"
                />
                <button
                  type="submit"
                  aria-label="Add project task"
                  className="px-4 border-l border-[#B3B3AF] bg-[#282828] text-[#F5F5ED] hover:bg-[#FA3600] transition-colors cursor-pointer"
                >
                  <IconPlus className="w-4 h-4" />
                </button>
              </form>
              <ul className="divide-y divide-[#B3B3AF]/75">
                {selectedProject.tasks.map((task) => (
                  <li key={task.id} className="px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        toggleProjectTask(selectedProject.id, task.id)
                      }
                      className="w-full flex items-center gap-3 text-left cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                          task.done
                            ? "bg-[#282828] border-[#282828] text-white"
                            : "border-[#282828]"
                        }`}
                      >
                        {task.done && <IconCheck className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-[13px] ${
                          task.done
                            ? "line-through text-[#5C5C59]"
                            : "text-[#282828]"
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock GitHub Activity */}
            <div className="border border-[#B3B3AF] bg-[#ECEBE2]/35">
              <OrbitSectionHeading
                code="GH"
                title="GitHub"
                accentWord="Activity"
                rightSlot={<OrbitStatusBadge tone="muted">DEMO · COMING SOON</OrbitStatusBadge>}
              />
              <ul className="divide-y divide-[#B3B3AF]/75">
                {selectedProject.githubActivity.map((act) => (
                  <li key={act.id} className="px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="text-[#C82A00] font-semibold">
                        {act.commitHash}
                      </span>
                      <span className="text-[#5C5C59]">
                        {act.branch} · {act.timestamp}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#282828] mt-1">
                      {act.message}
                    </p>
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 orbit-mono-label">Loading Projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
