"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrbit } from "@/context/OrbitContext";
import {
  computeProjectProgress,
  formatTimeInZone,
  getTimeAwareGreeting,
} from "@/lib/storage";
import { EarthCenterpiece } from "@/components/earth/EarthCenterpiece";
import {
  IconArrowUpRight,
  IconCheck,
  IconPin,
  IconTrash,
} from "@/components/ui/OrbitIcons";
import {
  OrbitActionLink,
  OrbitButton,
  OrbitField,
  OrbitIconControl,
  OrbitSectionHeading,
  OrbitStatusBadge,
} from "@/components/ui/OrbitPrimitives";

const TodayLocalClock = memo(function TodayLocalClock({
  timezone,
}: {
  timezone: string;
}) {
  const [formatted, setFormatted] = useState<{
    time: string;
    dateLong: string;
  } | null>(null);

  useEffect(() => {
    setFormatted(formatTimeInZone(timezone));
    const id = window.setInterval(() => {
      setFormatted(formatTimeInZone(timezone));
    }, 30000);
    return () => window.clearInterval(id);
  }, [timezone]);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#5C5C59]">
      <span>LOCAL: {formatted?.dateLong ?? "—"}</span>
      <span aria-hidden="true">·</span>
      <span>
        {formatted?.time ?? "--:--:--"} ({timezone})
      </span>
    </div>
  );
});

export default function TodayPage() {
  const {
    state,
    effectiveReducedMotion,
    showWelcomeIntro,
    sessionAuthMode,
    toggleTask,
    addTask,
    deleteTask,
    toggleIdeaPin,
  } = useOrbit();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskError, setTaskError] = useState("");
  const [forceStaticEarth, setForceStaticEarth] = useState(false);
  const [dashboardWebglReady, setDashboardWebglReady] = useState(false);
  const [greeting, setGreeting] = useState(
    `Welcome, ${state.preferences.name.trim() || "there"}.`
  );

  // The longest staggered dashboard reveal takes 560ms; initialize WebGL after it.
  useEffect(() => {
    if (showWelcomeIntro || sessionAuthMode === "unauthenticated") {
      setDashboardWebglReady(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setDashboardWebglReady(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [showWelcomeIntro, sessionAuthMode]);

  useEffect(() => {
    setGreeting(
      getTimeAwareGreeting(
        state.preferences.name,
        state.preferences.timezone,
        new Date()
      ).greeting
    );
  }, [state.preferences.name, state.preferences.timezone]);

  const openTasks = useMemo(
    () => state.tasks.filter((t) => !t.completed),
    [state.tasks]
  );
  const activeProjects = useMemo(
    () => state.projects.filter((p) => p.status === "active"),
    [state.projects]
  );
  const pinnedIdeas = useMemo(
    () => state.ideas.filter((i) => i.pinnedToToday),
    [state.ideas]
  );
  const followUpsDue = useMemo(
    () =>
      state.opportunities.filter(
        (o) => o.status !== "Closed" && o.status !== "Won/Offer"
      ),
    [state.opportunities]
  );

  const urgentItems = useMemo(() => {
    const items: { id: string; label: string; meta: string; href: string }[] = [];
    state.opportunities.forEach((opp) => {
      if (opp.status === "Reply") {
        items.push({
          id: `u-reply-${opp.id}`,
          label: `${opp.companyOrClient} replied (${opp.roleOrProject})`,
          meta: "Needs scheduling reply",
          href: `/opportunities?selected=${opp.id}`,
        });
      } else if (opp.status === "Preparing") {
        items.push({
          id: `u-prep-${opp.id}`,
          label: `${opp.companyOrClient} application due ${opp.deadline}`,
          meta: `CV: ${state.cvVersions.find((c) => c.id === opp.cvVersionId)?.name ?? "Assigned"}`,
          href: `/opportunities?selected=${opp.id}`,
        });
      }
    });
    return items;
  }, [state.opportunities, state.cvVersions]);

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setTaskError("Enter a task title first.");
      return;
    }
    addTask({ title: newTaskTitle, dueLabel: "Today", priority: "normal" });
    setNewTaskTitle("");
    setTaskError("");
  };

  return (
    <div className="w-full">
      {/* Welcome & Compact Earth Hero Band */}
      <section
        aria-label="Daily Welcome"
        className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]"
      >
        {/* Left: Greeting & Daily Telemetry */}
        <div className="lg:col-span-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <span className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00]">
                <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
                01 / TODAY OVERVIEW
              </span>
              {state.preferences.demoWeatherEnabled && (
                <OrbitStatusBadge tone="neutral">
                  DEMO WEATHER · 22°C CLEAR · SIMULATED
                </OrbitStatusBadge>
              )}
            </div>

            <h1 className="orbit-display text-[36px] sm:text-[48px] xl:text-[56px] text-[#FA3600] max-w-[16ch]">
              <span className="orbit-line-mask">
                <span className="orbit-page-title-inner">{greeting}</span>
              </span>
            </h1>

            <p className="mt-4 text-[17px] sm:text-[19px] text-[#282828] max-w-[44ch] leading-snug">
              <span className="orbit-line-mask">
                <span className="orbit-page-title-inner">
                  Make a little progress. Find a wider orbit.
                </span>
              </span>
            </p>

            <TodayLocalClock timezone={state.preferences.timezone} />
          </div>

          {/* Daily Counts Strip */}
          <div className="orbit-page-section grid grid-cols-2 sm:grid-cols-4 border-t border-[#B3B3AF]">
            <div className="p-4 border-r border-b sm:border-b-0 border-[#B3B3AF]">
              <p className="orbit-mono-label text-[#5C5C59]">Open Tasks</p>
              <p className="orbit-display text-[28px] mt-1 tabular-nums text-[#282828]">
                {String(openTasks.length).padStart(2, "0")}
              </p>
            </div>
            <div className="p-4 sm:border-r border-b sm:border-b-0 border-[#B3B3AF]">
              <p className="orbit-mono-label text-[#5C5C59]">Active Projects</p>
              <p className="orbit-display text-[28px] mt-1 tabular-nums text-[#282828]">
                {String(activeProjects.length).padStart(2, "0")}
              </p>
            </div>
            <div className="p-4 border-r border-[#B3B3AF]">
              <p className="orbit-mono-label text-[#5C5C59]">Follow-ups</p>
              <p className="orbit-display text-[28px] mt-1 tabular-nums text-[#C82A00]">
                {String(followUpsDue.length).padStart(2, "0")}
              </p>
            </div>
            <div className="p-4">
              <p className="orbit-mono-label text-[#5C5C59]">Inbox Items</p>
              <p className="orbit-display text-[28px] mt-1 tabular-nums text-[#282828]">
                {String(state.inbox.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Compact Earth Centerpiece */}
        <div className="orbit-page-section lg:col-span-5 flex flex-col justify-between bg-[#ECEBE2]/35">
          <div className="px-4 py-2.5 border-b border-[#B3B3AF] flex items-center justify-between">
            <span className="orbit-mono-label text-[#5C5C59]">
              ORBITAL GEOMETRY // TERMINATOR
            </span>
            <button
              type="button"
              onClick={() => setForceStaticEarth((v) => !v)}
              className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 border border-[#B3B3AF] text-[#282828] hover:border-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
            >
              {forceStaticEarth ? "View 3D" : "Static View"}
            </button>
          </div>
          <div className="h-[260px] sm:h-[300px] lg:h-[330px] w-full">
            <EarthCenterpiece
              reducedMotion={effectiveReducedMotion}
              forceStatic={forceStaticEarth || !dashboardWebglReady}
            />
          </div>
          <div className="px-4 py-2.5 border-t border-[#B3B3AF] flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
            <span>SAT-01 · INCLINATION 24°</span>
            <span className="text-[#C82A00] font-semibold">● TRACKING</span>
          </div>
        </div>
      </section>

      {/* Conditional "Needs Your Attention" Strip */}
      {urgentItems.length > 0 && (
        <section
          aria-label="Needs your attention"
          className="orbit-page-section border-b border-[#B3B3AF] bg-[#FA3600]/[0.06]"
        >
          <div className="px-5 py-3 border-b border-[#B3B3AF] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-[3px] h-4 bg-[#FA3600]" aria-hidden="true" />
              <h2 className="orbit-mono-label font-semibold text-[#C82A00]">
                Needs Your Attention ({urgentItems.length})
              </h2>
            </div>
            <OrbitActionLink href="/opportunities" label="Review Pipeline" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#B3B3AF]">
            {urgentItems.map((u) => (
              <Link
                key={u.id}
                href={u.href}
                className="orbit-interactive-row flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#282828] truncate">
                    {u.label}
                  </p>
                  <p className="font-mono text-[11px] text-[#5C5C59] mt-0.5">
                    {u.meta}
                  </p>
                </div>
                <IconArrowUpRight className="w-4 h-4 text-[#FA3600] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Core Workspace Grid: Priorities + Schedule / Projects */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]">
        {/* Today's Priorities */}
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#B3B3AF] flex flex-col">
          <OrbitSectionHeading
            code="01"
            title="Today's"
            accentWord="Priorities"
            rightSlot={
              <span className="orbit-mono-label text-[#5C5C59]">
                {state.tasks.filter((t) => t.completed).length}/{state.tasks.length} DONE
              </span>
            }
          />

          <form
            onSubmit={handleQuickTaskSubmit}
            className="grid grid-cols-1 sm:grid-cols-[1fr_auto] border-b border-[#B3B3AF]"
            noValidate
          >
            <OrbitField
              id="today-new-task"
              label="Add a priority for today"
              value={newTaskTitle}
              error={taskError}
              onChange={(e) => {
                setNewTaskTitle(e.target.value);
                if (taskError) setTaskError("");
              }}
              className="border-b-0"
            />
            <div className="p-3 sm:border-l border-t sm:border-t-0 border-[#B3B3AF] flex items-center justify-end">
              <OrbitButton type="submit" label="Add Task" size="sm" />
            </div>
          </form>

          {state.tasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="orbit-mono-label text-[#5C5C59]">
                All clear. Add a priority above to begin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#B3B3AF]/75">
              {state.tasks.map((task) => {
                const linkedProj = state.projects.find(
                  (p) => p.id === task.projectId
                );
                return (
                  <li
                    key={task.id}
                    className="orbit-interactive-row flex items-start justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.completed}
                        aria-label={`Mark "${task.title}" as ${
                          task.completed ? "incomplete" : "complete"
                        }`}
                        onClick={() => toggleTask(task.id)}
                        className={`mt-0.5 w-5 h-5 shrink-0 border flex items-center justify-center transition-colors cursor-pointer ${
                          task.completed
                            ? "bg-[#282828] border-[#282828] text-[#F5F5ED]"
                            : "bg-transparent border-[#282828] hover:border-[#FA3600]"
                        }`}
                      >
                        {task.completed && <IconCheck className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-[14px] leading-snug transition-colors ${
                            task.completed
                              ? "line-through text-[#5C5C59]"
                              : "text-[#282828] font-medium"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
                            {task.dueLabel}
                          </span>
                          {task.priority === "high" && !task.completed && (
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#C82A00]">
                              · Priority
                            </span>
                          )}
                          {linkedProj && (
                            <Link
                              href={`/projects?selected=${linkedProj.id}`}
                              className="font-mono text-[10px] uppercase tracking-[0.06em] underline text-[#414140] hover:text-[#C82A00]"
                            >
                              {linkedProj.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <OrbitIconControl
                      label={`Delete task ${task.title}`}
                      tone="danger"
                      onClick={() => deleteTask(task.id)}
                      className="shrink-0"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </OrbitIconControl>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Upcoming Schedule & Pinned Idea */}
        <div className="lg:col-span-5 flex flex-col">
          <OrbitSectionHeading
            code="02"
            title="Schedule &"
            accentWord="Reminders"
            rightSlot={<OrbitStatusBadge tone="muted">DEMO FEED</OrbitStatusBadge>}
          />
          <ul className="divide-y divide-[#B3B3AF]/75 border-b border-[#B3B3AF]">
            {state.events.map((evt) => (
              <li
                key={evt.id}
                className="px-5 py-3.5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <span className="font-mono text-[12px] font-semibold tabular-nums text-[#282828] pt-0.5">
                    {evt.time}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[#282828]">
                      {evt.title}
                    </p>
                    <p className="font-mono text-[11px] text-[#5C5C59] mt-0.5">
                      {evt.location} · {evt.duration}
                    </p>
                  </div>
                </div>
                <OrbitStatusBadge
                  tone={evt.kind === "deadline" ? "accent" : "neutral"}
                >
                  {evt.kind}
                </OrbitStatusBadge>
              </li>
            ))}
          </ul>

          {/* Pinned Idea Block */}
          <OrbitSectionHeading
            code="03"
            title="Pinned"
            accentWord="Idea"
            className="bg-[#ECEBE2]/40"
            rightSlot={<OrbitActionLink href="/ideas" label="All Ideas" />}
          />

          {pinnedIdeas.length === 0 ? (
            <div className="p-5 font-mono text-[12px] text-[#5C5C59]">
              No idea pinned yet. Pin any thought in{" "}
              <Link href="/ideas" className="underline text-[#C82A00]">
                Ideas
              </Link>{" "}
              to keep it visible here.
            </div>
          ) : (
            <div className="divide-y divide-[#B3B3AF]/75">
              {pinnedIdeas.map((idea) => (
                <div key={idea.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-[#282828]">
                      {idea.title}
                    </h3>
                    <OrbitIconControl
                      label={`Unpin ${idea.title} from Today`}
                      active
                      onClick={() => toggleIdeaPin(idea.id)}
                    >
                      <IconPin className="w-3.5 h-3.5" filled />
                    </OrbitIconControl>
                  </div>
                  <p className="text-[13px] text-[#414140] mt-1.5 leading-relaxed">
                    {idea.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom 3-Column Strip: Active Projects, Recent Captures, Opportunity Follow-ups */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#B3B3AF]">
        {/* Active Project Progress */}
        <div className="flex flex-col">
          <OrbitSectionHeading
            code="04"
            title="Active"
            accentWord="Projects"
            rightSlot={<OrbitActionLink href="/projects" label="Open" />}
          />
          <div className="divide-y divide-[#B3B3AF]/75">
            {activeProjects.slice(0, 3).map((proj) => {
              const prog = computeProjectProgress(proj);
              return (
                <Link
                  key={proj.id}
                  href={`/projects?selected=${proj.id}`}
                  className="orbit-interactive-row block px-5 py-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[#282828]">
                      {proj.name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-[#C82A00]">
                      {prog.percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#ECEBE2] border border-[#B3B3AF]">
                    <div
                      className="h-full bg-[#282828]"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-[#5C5C59] mt-1.5">
                    {prog.completed}/{prog.total} tasks · Due {proj.deadline}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Saved Items */}
        <div className="flex flex-col">
          <OrbitSectionHeading
            code="05"
            title="Recent"
            accentWord="Captures"
            rightSlot={<OrbitActionLink href="/inbox" label="Inbox" />}
          />
          <div className="divide-y divide-[#B3B3AF]/75">
            {state.inbox.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/inbox?selected=${item.id}`}
                className="orbit-interactive-row block px-5 py-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[#282828] truncate">
                    {item.title}
                  </span>
                  <OrbitStatusBadge tone="neutral">{item.kind}</OrbitStatusBadge>
                </div>
                <p className="font-mono text-[10px] text-[#5C5C59] mt-1">
                  {item.source} · {item.savedAt}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Opportunity Follow-ups */}
        <div className="flex flex-col">
          <OrbitSectionHeading
            code="06"
            title="Follow-ups"
            accentWord="Due"
            rightSlot={<OrbitActionLink href="/opportunities" label="Pipeline" />}
          />
          <div className="divide-y divide-[#B3B3AF]/75">
            {followUpsDue.slice(0, 3).map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities?selected=${opp.id}`}
                className="orbit-interactive-row block px-5 py-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[#282828] truncate">
                    {opp.companyOrClient}
                  </span>
                  <OrbitStatusBadge
                    tone={opp.status === "Reply" ? "accent" : "neutral"}
                  >
                    {opp.status}
                  </OrbitStatusBadge>
                </div>
                <p className="text-[12px] text-[#414140] mt-0.5 truncate">
                  {opp.roleOrProject}
                </p>
                <p className="font-mono text-[10px] text-[#5C5C59] mt-1">
                  Next follow-up: {opp.nextFollowUp}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
