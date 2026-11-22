"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useOrbit } from "@/context/OrbitContext";
import {
  IconArrowUpRight,
  IconPin,
  IconTrash,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitDrawer,
  OrbitField,
  OrbitIconControl,
  OrbitSectionHeading,
  OrbitStatusBadge,
  OrbitTextarea,
} from "@/components/ui/OrbitPrimitives";
import { IdeaItem } from "@/types/orbit";

export default function IdeasPage() {
  const {
    state,
    addIdea,
    updateIdea,
    deleteIdea,
    toggleIdeaPin,
    generateIdeaPolishPreview,
    convertIdeaToProject,
  } = useOrbit();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [source, setSource] = useState("");
  const [formError, setFormError] = useState("");

  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError("Please enter both a short idea title and description.");
      return;
    }
    addIdea({
      title,
      description,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: source || "Morning notebook",
    });
    setTitle("");
    setDescription("");
    setTagsText("");
    setSource("");
    setFormError("");
  };

  const openEdit = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditDesc(idea.description);
    setEditTags(idea.tags.join(", "));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !editTitle.trim()) return;
    updateIdea(editingIdea.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditingIdea(null);
  };

  return (
    <div className="w-full">
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF]">
        <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
          <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
          04 / IDEAS &amp; CONCEPTS
        </p>
        <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
          <span className="orbit-line-mask">
            <span className="orbit-page-title-inner">Ideas</span>
          </span>
        </h1>
        <p className="text-[14px] text-[#414140] mt-2 max-w-[54ch]">
          Capture rough thoughts, pin active concepts to Today, preview labelled demo polishing, or promote an idea straight into a tracked Project.
        </p>
      </section>

      <section className="orbit-page-section grid grid-cols-1 lg:grid-cols-12 border-b border-[#B3B3AF]">
        {/* Capture Form */}
        <form
          onSubmit={handleCreate}
          noValidate
          className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#B3B3AF] flex flex-col justify-between"
        >
          <div>
            <OrbitSectionHeading
              code="NEW"
              title="Capture"
              accentWord="Thought"
              className="bg-[#ECEBE2]/45"
            />

            <OrbitField
              id="idea-title"
              label="Idea Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError("");
              }}
            />

            <OrbitTextarea
              id="idea-desc"
              label="One or Two Sentence Concept"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formError) setFormError("");
              }}
            />

            <OrbitField
              id="idea-tags"
              label="Tags (Comma Separated)"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />

            <OrbitField
              id="idea-source"
              label="Source (Optional)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />

            {formError && (
              <p className="px-4 py-2.5 font-mono text-[11px] text-[#C82A00] border-b border-[#B3B3AF]">
                {formError}
              </p>
            )}
          </div>

          <div className="p-4 flex justify-end">
            <OrbitButton type="submit" variant="accent" label="Save Idea" />
          </div>
        </form>

        {/* Ideas Grid */}
        <div className="lg:col-span-8">
          {state.ideas.length === 0 ? (
            <div className="p-12 text-center">
              <p className="orbit-mono-label text-[#5C5C59]">
                No ideas saved yet. Add one on the left.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#B3B3AF]">
              {state.ideas.map((idea) => (
                <article
                  key={idea.id}
                  className="orbit-interactive-row p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {idea.pinnedToToday && (
                          <OrbitStatusBadge tone="accent">
                            Pinned to Today
                          </OrbitStatusBadge>
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
                          {idea.source} · {idea.createdAt}
                        </span>
                      </div>
                      <h2 className="orbit-display text-[22px] text-[#282828] pt-1">
                        {idea.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleIdeaPin(idea.id)}
                        aria-label={
                          idea.pinnedToToday
                            ? `Unpin ${idea.title} from Today`
                            : `Pin ${idea.title} to Today`
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-[0.06em] cursor-pointer transition-colors ${
                          idea.pinnedToToday
                            ? "border-[#FA3600] text-[#C82A00] bg-[#FA3600]/8"
                            : "border-[#B3B3AF] text-[#282828] hover:border-[#282828] hover:bg-[#ECEBE2]"
                        }`}
                      >
                        <IconPin className="w-3.5 h-3.5" filled={idea.pinnedToToday} />
                        <span>{idea.pinnedToToday ? "Pinned" : "Pin"}</span>
                      </button>

                      <OrbitButton
                        type="button"
                        size="sm"
                        variant="subtle"
                        showArrow={false}
                        label="Edit"
                        onClick={() => openEdit(idea)}
                      />

                      <OrbitIconControl
                        label={`Delete ${idea.title}`}
                        tone="danger"
                        onClick={() => deleteIdea(idea.id)}
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </OrbitIconControl>
                    </div>
                  </div>

                  <p className="text-[14px] text-[#414140] mt-2.5 leading-relaxed max-w-[68ch]">
                    {idea.description}
                  </p>

                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {idea.tags.map((tag) => (
                        <OrbitStatusBadge key={tag} tone="neutral">
                          {tag}
                        </OrbitStatusBadge>
                      ))}
                    </div>
                  )}

                  {idea.polishPreview && (
                    <div className="mt-4 p-3.5 border border-[#B3B3AF] bg-[#ECEBE2]/55">
                      <p className="orbit-mono-label text-[#C82A00] mb-1">
                        Demo Polish Output (Simulated)
                      </p>
                      <p className="text-[13px] text-[#282828] leading-relaxed">
                        {idea.polishPreview}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#B3B3AF]/60 flex flex-wrap items-center gap-3">
                    <OrbitButton
                      type="button"
                      size="sm"
                      variant="subtle"
                      label="Polish Preview (Demo)"
                      onClick={() => generateIdeaPolishPreview(idea.id)}
                    />
                    {idea.convertedProjectId ? (
                      <Link
                        href={`/projects?selected=${idea.convertedProjectId}`}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] underline text-[#C82A00]"
                      >
                        <span>Open Converted Project</span>
                        <IconArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <OrbitButton
                        type="button"
                        size="sm"
                        label="Convert to Project"
                        onClick={() => convertIdeaToProject(idea.id)}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Edit Idea Drawer */}
      <OrbitDrawer
        open={Boolean(editingIdea)}
        onClose={() => setEditingIdea(null)}
        title="Edit Idea"
        subtitle={editingIdea?.source}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="border border-[#B3B3AF]">
            <OrbitField
              id="edit-idea-title"
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <OrbitTextarea
              id="edit-idea-desc"
              label="Description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <OrbitField
              id="edit-idea-tags"
              label="Tags (Comma Separated)"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="border-b-0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <OrbitButton
              type="button"
              variant="subtle"
              label="Cancel"
              showArrow={false}
              onClick={() => setEditingIdea(null)}
            />
            <OrbitButton type="submit" variant="accent" label="Save Changes" />
          </div>
        </form>
      </OrbitDrawer>
    </div>
  );
}
