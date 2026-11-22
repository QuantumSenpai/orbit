"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import { computeProjectProgress, generateLatexSource } from "@/lib/storage";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconPrinter,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitField,
  OrbitSectionHeading,
  OrbitStatusBadge,
  OrbitTextarea,
} from "@/components/ui/OrbitPrimitives";
import { CVSectionKey } from "@/types/orbit";

const SECTION_LABELS: Record<CVSectionKey, string> = {
  summary: "Summary",
  projects: "Selected Projects",
  experience: "Experience",
  skills: "Technical Skills",
  education: "Education",
};

function CVStudioContent() {
  const searchParams = useSearchParams();
  const cvFromUrl = searchParams.get("cv");

  const {
    state,
    setActiveCvId,
    updateCvProfile,
    updateCvVersion,
    runDemoCvTailoring,
    pushToast,
  } = useOrbit();

  useEffect(() => {
    if (cvFromUrl && state.cvVersions.some((c) => c.id === cvFromUrl)) {
      setActiveCvId(cvFromUrl);
    }
  }, [cvFromUrl, state.cvVersions, setActiveCvId]);

  const activeCv = useMemo(
    () =>
      state.cvVersions.find((c) => c.id === state.activeCvId) ??
      state.cvVersions[0],
    [state.cvVersions, state.activeCvId]
  );

  const [mobilePane, setMobilePane] = useState<"preview" | "source">("preview");

  const latexSource = useMemo(() => {
    if (!activeCv) return "";
    return generateLatexSource(state.cvProfile, activeCv, state.projects);
  }, [state.cvProfile, activeCv, state.projects]);

  if (!activeCv) return null;

  const selectedProjects = activeCv.selectedProjectIds
    .map((id) => state.projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const toggleProjectInCv = (projectId: string) => {
    const exists = activeCv.selectedProjectIds.includes(projectId);
    const next = exists
      ? activeCv.selectedProjectIds.filter((id) => id !== projectId)
      : [...activeCv.selectedProjectIds, projectId];
    updateCvVersion(activeCv.id, { selectedProjectIds: next });
  };

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= activeCv.sectionsOrder.length) return;
    const next = [...activeCv.sectionsOrder];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updateCvVersion(activeCv.id, { sectionsOrder: next });
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexSource], { type: "application/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeSlug = activeCv.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `${safeSlug}.tex`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    pushToast(`Downloaded ${safeSlug}.tex`, { tone: "success" });
  };

  const handleCopyTex = async () => {
    try {
      await navigator.clipboard.writeText(latexSource);
      pushToast("Copied LaTeX source to clipboard.", { tone: "success" });
    } catch {
      pushToast("Clipboard access unavailable in this browser context.", {
        tone: "error",
      });
    }
  };

  const handleBrowserPrint = () => {
    pushToast(
      "Opening browser print dialog (HTML resume preview export, not LaTeX compilation).",
      { tone: "neutral" }
    );
    window.print();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <section className="no-print p-5 sm:p-8 border-b border-[#B3B3AF] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
            <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
            07 / CV STUDIO &amp; LATEX SOURCE
          </p>
          <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="orbit-page-title-inner">CV Studio</span>
            </span>
          </h1>
          <p className="text-[14px] text-[#414140] mt-2 max-w-[60ch]">
            Select verified projects, reorder sections, inspect live LaTeX source, and download <code className="font-mono text-[12px]">.tex</code>. Browser print exports the HTML preview directly and is not live TeX compilation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTex}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-[#B3B3AF] font-mono text-[11px] uppercase tracking-[0.06em] hover:border-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
          >
            <IconCopy className="w-3.5 h-3.5" />
            <span>Copy .tex</span>
          </button>

          <OrbitButton
            type="button"
            label="Download .tex"
            size="sm"
            onClick={handleDownloadTex}
          />

          <button
            type="button"
            onClick={handleBrowserPrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-[#282828] bg-[#282828] text-[#F5F5ED] font-mono text-[11px] uppercase tracking-[0.06em] hover:bg-[#FA3600] hover:border-[#FA3600] transition-colors cursor-pointer"
          >
            <IconPrinter className="w-3.5 h-3.5" />
            <span>Print / PDF (Browser)</span>
          </button>
        </div>
      </section>

      {/* Version Tabs */}
      <section className="no-print orbit-page-section border-b border-[#B3B3AF] flex flex-wrap">
        {state.cvVersions.map((cv) => {
          const active = cv.id === activeCv.id;
          return (
            <button
              key={cv.id}
              type="button"
              onClick={() => setActiveCvId(cv.id)}
              className={`relative px-4 py-3 text-left border-r border-[#B3B3AF] cursor-pointer transition-colors ${
                active
                  ? "bg-[#282828] text-[#F5F5ED]"
                  : "hover:bg-[#ECEBE2] text-[#282828]"
              }`}
            >
              {active && (
                <span
                  className="absolute top-0 left-0 right-0 h-[3px] bg-[#FA3600]"
                  aria-hidden="true"
                />
              )}
              <span className="block font-mono text-[11px] uppercase tracking-[0.06em] font-semibold">
                {cv.name}
              </span>
              <span
                className={`block font-mono text-[10px] mt-0.5 ${
                  active ? "text-[#B3B3AF]" : "text-[#5C5C59]"
                }`}
              >
                {cv.targetRole}
              </span>
            </button>
          );
        })}
      </section>

      {/* Configuration Controls */}
      <section className="no-print orbit-page-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]">
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#B3B3AF] flex flex-col justify-between">
          <div>
            <OrbitSectionHeading
              code="PR"
              title="Target Role &"
              accentWord="Profile"
              className="bg-[#ECEBE2]/45"
              rightSlot={<OrbitStatusBadge tone="muted">VERIFIED DATA ONLY</OrbitStatusBadge>}
            />
            <OrbitField
              id="cv-profile-headline"
              label="Profile Headline"
              value={state.cvProfile.headline}
              onChange={(e) => updateCvProfile({ headline: e.target.value })}
            />
            <OrbitTextarea
              id="cv-role-desc"
              label="Role / Job Description Notes"
              value={activeCv.roleDescriptionInput}
              onChange={(e) =>
                updateCvVersion(activeCv.id, {
                  roleDescriptionInput: e.target.value,
                })
              }
            />
          </div>

          <div className="p-4 space-y-3 bg-[#ECEBE2]/30">
            <p className="font-mono text-[11px] text-[#414140]">
              {activeCv.demoTailoredNote}
            </p>
            <OrbitButton
              type="button"
              size="sm"
              variant="accent"
              label="Run Demo Tailoring"
              onClick={() => runDemoCvTailoring(activeCv.id)}
            />
          </div>
        </div>

        {/* Verified Project Selection */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <OrbitSectionHeading
            code="VP"
            title="Verified"
            accentWord="Projects"
            className="bg-[#ECEBE2]/45"
          />
          <ul className="divide-y divide-[#B3B3AF]/75">
            {state.projects.map((proj) => {
              const checked = activeCv.selectedProjectIds.includes(proj.id);
              const prog = computeProjectProgress(proj);
              return (
                <li key={proj.id} className="px-4 py-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleProjectInCv(proj.id)}
                    className="w-full flex items-start gap-3 text-left cursor-pointer"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-[#282828] border-[#282828] text-[#F5F5ED]"
                          : "border-[#282828]"
                      }`}
                    >
                      {checked && <IconCheck className="w-3 h-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#282828]">
                        {proj.name}
                      </p>
                      <p className="font-mono text-[10px] text-[#5C5C59]">
                        {proj.clientOrType} · {prog.completed}/{prog.total} tasks
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section Ordering */}
        <div className="lg:col-span-3">
          <OrbitSectionHeading
            code="OR"
            title="Section"
            accentWord="Order"
            className="bg-[#ECEBE2]/45"
          />
          <ul className="divide-y divide-[#B3B3AF]/75">
            {activeCv.sectionsOrder.map((secKey, idx) => (
              <li
                key={secKey}
                className="px-4 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.05em]">
                  <span className="text-[#C82A00] font-semibold">{idx + 1}.</span>{" "}
                  {SECTION_LABELS[secKey]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    aria-label={`Move ${SECTION_LABELS[secKey]} up`}
                    className="px-2 py-0.5 border border-[#B3B3AF] font-mono text-[10px] disabled:opacity-35 hover:border-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === activeCv.sectionsOrder.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    aria-label={`Move ${SECTION_LABELS[secKey]} down`}
                    className="px-2 py-0.5 border border-[#B3B3AF] font-mono text-[10px] disabled:opacity-35 hover:border-[#282828] hover:bg-[#ECEBE2] cursor-pointer"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mobile Pane Toggle */}
      <div className="no-print lg:hidden grid grid-cols-2 border-b border-[#B3B3AF]">
        <button
          type="button"
          onClick={() => setMobilePane("preview")}
          className={`py-2.5 font-mono text-[11px] uppercase border-r border-[#B3B3AF] ${
            mobilePane === "preview" ? "bg-[#282828] text-[#F5F5ED]" : ""
          }`}
        >
          Resume Preview
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("source")}
          className={`py-2.5 font-mono text-[11px] uppercase ${
            mobilePane === "source" ? "bg-[#282828] text-[#F5F5ED]" : ""
          }`}
        >
          LaTeX Source
        </button>
      </div>

      {/* Split Source / Preview */}
      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-2">
        <div
          className={`no-print border-b lg:border-b-0 lg:border-r border-[#B3B3AF] bg-[#ECEBE2]/30 flex flex-col ${
            mobilePane === "source" ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="px-5 py-3 border-b border-[#B3B3AF] flex items-center justify-between">
            <span className="orbit-mono-label text-[#C82A00]">
              LATEX SOURCE (.TEX)
            </span>
            <button
              type="button"
              onClick={handleDownloadTex}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] underline hover:text-[#C82A00] cursor-pointer"
            >
              <IconDownload className="w-3 h-3" />
              <span>Export .tex</span>
            </button>
          </div>
          <pre className="p-5 font-mono text-[11.5px] leading-[1.6] text-[#282828] overflow-x-auto whitespace-pre-wrap break-words">
            {latexSource}
          </pre>
        </div>

        <div
          className={`p-4 sm:p-8 bg-[#ECEBE2]/55 ${
            mobilePane === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="no-print mb-3 flex items-center justify-between">
            <span className="orbit-mono-label text-[#C82A00]">
              HTML RESUME PREVIEW (PRINTABLE)
            </span>
            <span className="font-mono text-[10px] text-[#5C5C59]">
              Updated {activeCv.updatedAt}
            </span>
          </div>

          <article className="print-only-sheet bg-[#FFFFFF] border border-[#B3B3AF] p-6 sm:p-9 text-[#1D1D1B] space-y-5">
            <header className="border-b border-[#282828] pb-3.5">
              <h2 className="text-[24px] font-bold tracking-[-0.02em] uppercase">
                {state.cvProfile.fullName}
              </h2>
              <p className="text-[13px] text-[#414140] mt-0.5">
                {state.cvProfile.headline}
              </p>
              <p className="font-mono text-[10.5px] text-[#5C5C59] mt-2">
                {state.cvProfile.location} · {state.cvProfile.email} ·{" "}
                {state.cvProfile.website} · {state.cvProfile.github}
              </p>
            </header>

            {activeCv.sectionsOrder.map((secKey) => {
              if (secKey === "summary") {
                return (
                  <section key="summary">
                    <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5C5C59] border-b border-[#B3B3AF] pb-1 mb-2">
                      Summary
                    </h3>
                    <p className="text-[13px] leading-relaxed text-[#282828]">
                      {state.cvProfile.summary}
                    </p>
                  </section>
                );
              }
              if (secKey === "projects") {
                return (
                  <section key="projects">
                    <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5C5C59] border-b border-[#B3B3AF] pb-1 mb-2">
                      Selected Projects
                    </h3>
                    {selectedProjects.length === 0 ? (
                      <p className="font-mono text-[11px] text-[#5C5C59]">
                        Select verified projects on the left to include them.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedProjects.map((proj) => {
                          const prog = computeProjectProgress(proj);
                          return (
                            <div key={proj.id}>
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <strong className="text-[13.5px] font-semibold">
                                  {proj.name}{" "}
                                  <span className="font-normal text-[#5C5C59]">
                                    — {proj.clientOrType}
                                  </span>
                                </strong>
                                <span className="font-mono text-[10.5px] text-[#5C5C59]">
                                  {proj.repoName}
                                </span>
                              </div>
                              <p className="text-[12.5px] text-[#282828] mt-0.5 leading-snug">
                                {proj.summary} ({prog.completed}/{prog.total} tracked tasks completed)
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              }
              if (secKey === "experience") {
                return (
                  <section key="experience">
                    <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5C5C59] border-b border-[#B3B3AF] pb-1 mb-2">
                      Experience
                    </h3>
                    <div className="space-y-3">
                      {state.cvProfile.experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <strong className="text-[13.5px] font-semibold">
                              {exp.role} · {exp.org}
                            </strong>
                            <span className="font-mono text-[10.5px] text-[#5C5C59]">
                              {exp.period}
                            </span>
                          </div>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-[12.5px] text-[#282828]">
                            {exp.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }
              if (secKey === "skills") {
                return (
                  <section key="skills">
                    <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5C5C59] border-b border-[#B3B3AF] pb-1 mb-2">
                      Technical Skills
                    </h3>
                    <div className="space-y-1 text-[12.5px]">
                      {state.cvProfile.skills.map((grp) => (
                        <p key={grp.group}>
                          <strong>{grp.group}:</strong> {grp.items.join(", ")}
                        </p>
                      ))}
                    </div>
                  </section>
                );
              }
              return (
                <section key="education">
                  <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5C5C59] border-b border-[#B3B3AF] pb-1 mb-2">
                    Education
                  </h3>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-[13.5px] font-semibold">
                      {state.cvProfile.education.institution}
                    </strong>
                    <span className="font-mono text-[10.5px] text-[#5C5C59]">
                      {state.cvProfile.education.period}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#282828]">
                    {state.cvProfile.education.degree}
                  </p>
                  <p className="text-[11.5px] text-[#5C5C59] mt-0.5">
                    {state.cvProfile.education.detail}
                  </p>
                </section>
              );
            })}
          </article>
        </div>
      </section>
    </div>
  );
}

export default function CVStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 orbit-mono-label">Loading CV Studio...</div>}>
      <CVStudioContent />
    </Suspense>
  );
}
