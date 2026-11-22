"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrbit } from "@/context/OrbitContext";
import {
  IconArrowUpRight,
  IconCopy,
  IconSearch,
  IconStar,
  IconTrash,
} from "@/components/ui/OrbitIcons";
import {
  OrbitButton,
  OrbitDrawer,
  OrbitField,
  OrbitFilterButton,
  OrbitIconControl,
  OrbitStatusBadge,
  OrbitTextarea,
} from "@/components/ui/OrbitPrimitives";
import { LibraryCategory, LibraryItem } from "@/types/orbit";

const CATEGORIES: ("All" | LibraryCategory)[] = [
  "All",
  "Websites",
  "Fonts",
  "Palettes",
  "Tools",
  "Reading",
];

function LibraryThumbnail({ item }: { item: LibraryItem }) {
  if (item.paletteHexes && item.paletteHexes.length > 0) {
    return (
      <div className="h-[112px] w-full grid grid-cols-5 border-b border-[#B3B3AF]">
        {item.paletteHexes.slice(0, 5).map((hex) => (
          <div
            key={hex}
            className="h-full border-r last:border-r-0 border-[#B3B3AF]/60 flex items-end p-1.5"
            style={{ backgroundColor: hex }}
          >
            <span className="px-1 py-0.5 bg-[#F5F5ED]/95 text-[#282828] font-mono text-[9px] uppercase">
              {hex}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-[112px] w-full border-b border-[#B3B3AF] bg-[#ECEBE2]/65 relative overflow-hidden flex items-center justify-between px-5">
      <svg
        viewBox="0 0 120 64"
        className="absolute right-0 top-0 h-full w-auto opacity-30 pointer-events-none"
        aria-hidden="true"
      >
        <line x1="20" y1="0" x2="20" y2="64" stroke="#282828" strokeWidth="0.7" />
        <line x1="60" y1="0" x2="60" y2="64" stroke="#282828" strokeWidth="0.7" />
        <line x1="100" y1="0" x2="100" y2="64" stroke="#282828" strokeWidth="0.7" />
        <line x1="0" y1="32" x2="120" y2="32" stroke="#282828" strokeWidth="0.7" />
        <circle cx="60" cy="32" r="18" fill="none" stroke="#FA3600" strokeWidth="0.9" />
      </svg>
      <div className="relative z-10">
        <span className="orbit-mono-label text-[#C82A00] block">
          {`${item.category} // ${item.domain}`}
        </span>
        <span className="orbit-display text-[24px] text-[#282828] mt-1 block">
          {item.specimenText || item.domain.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get("selected");

  const {
    state,
    openQuickAdd,
    updateLibraryItem,
    toggleLibraryFavorite,
    deleteLibraryItem,
    pushToast,
  } = useOrbit();

  const [category, setCategory] = useState<"All" | LibraryCategory>("All");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);

  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (initialSelected) setSelectedId(initialSelected);
  }, [initialSelected]);

  const selectedItem = useMemo(
    () => state.library.find((i) => i.id === selectedId) ?? null,
    [state.library, selectedId]
  );

  useEffect(() => {
    if (selectedItem) {
      setEditTitle(selectedItem.title);
      setEditUrl(selectedItem.url);
      setEditDesc(selectedItem.description);
      setEditTags(selectedItem.tags.join(", "));
      setUrlError("");
    }
  }, [selectedItem]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.library.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (favoritesOnly && !item.favorite) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.library, category, favoritesOnly, query]);

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      pushToast(`Copied ${hex} to clipboard.`, { tone: "success" });
    } catch {
      pushToast(`Hex value: ${hex}`, { tone: "neutral" });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!editTitle.trim()) {
      setUrlError("Title cannot be empty.");
      return;
    }
    if (!/^https?:\/\//i.test(editUrl.trim())) {
      setUrlError("Bookmark URL must begin with http:// or https://");
      return;
    }
    updateLibraryItem(selectedItem.id, {
      title: editTitle.trim(),
      url: editUrl.trim(),
      description: editDesc.trim(),
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    pushToast("Bookmark updated.", { tone: "success" });
    setSelectedId(null);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <section className="p-5 sm:p-8 border-b border-[#B3B3AF] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 orbit-mono-label text-[#C82A00] mb-2">
            <span className="w-1.5 h-1.5 bg-[#FA3600]" aria-hidden="true" />
            05 / LIBRARY &amp; REFERENCES
          </p>
          <h1 className="orbit-display text-[34px] sm:text-[44px] text-[#FA3600]">
            <span className="orbit-line-mask">
              <span className="orbit-page-title-inner">Library</span>
            </span>
          </h1>
          <p className="text-[14px] text-[#414140] mt-2 max-w-[54ch]">
            Curated websites, typefaces, copyable colour palettes, developer tools, and reading notes. Preserves exact URLs locally.
          </p>
        </div>

        <OrbitButton
          label="Add Bookmark"
          variant="accent"
          onClick={() => openQuickAdd("link")}
        />
      </section>

      {/* Filters */}
      <section className="orbit-page-section border-b border-[#B3B3AF] grid grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 px-4 py-3 border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          <IconSearch className="w-4 h-4 text-[#5C5C59] shrink-0" />
          <label htmlFor="lib-search" className="sr-only">
            Search library
          </label>
          <input
            id="lib-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks, domains, tags..."
            className="w-full bg-transparent text-[14px] text-[#282828] placeholder:text-[#5C5C59] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap border-b lg:border-b-0 lg:border-r border-[#B3B3AF]">
          {CATEGORIES.map((cat) => (
            <OrbitFilterButton
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
              className="border-r last:border-r-0 border-[#B3B3AF]"
            />
          ))}
        </div>

        <button
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`px-4 py-3 inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] cursor-pointer transition-colors ${
            favoritesOnly
              ? "bg-[#FA3600] text-white"
              : "hover:bg-[#ECEBE2] text-[#282828]"
          }`}
        >
          <IconStar className="w-3.5 h-3.5" filled={favoritesOnly} />
          <span>Favorites</span>
        </button>
      </section>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="orbit-page-section p-12 text-center border-b border-[#B3B3AF]">
          <p className="orbit-mono-label text-[#5C5C59]">
            No library bookmarks match your current filters.
          </p>
        </div>
      ) : (
        <section className="orbit-page-section grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-b border-[#B3B3AF]">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="orbit-interactive-row border-b border-r border-[#B3B3AF] flex flex-col justify-between bg-[#F5F5ED]"
            >
              <div>
                <LibraryThumbnail item={item} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C5C59]">
                      {item.domain} · {item.savedAt}
                    </span>
                    <OrbitIconControl
                      label={
                        item.favorite
                          ? `Remove ${item.title} from favorites`
                          : `Favorite ${item.title}`
                      }
                      active={item.favorite}
                      onClick={() => toggleLibraryFavorite(item.id)}
                    >
                      <IconStar className="w-3.5 h-3.5" filled={item.favorite} />
                    </OrbitIconControl>
                  </div>

                  <h2 className="text-[17px] font-bold text-[#282828] mt-1.5 leading-snug">
                    {item.title}
                  </h2>

                  <p className="text-[13px] text-[#414140] mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Copyable Palette Swatches */}
                  {item.paletteHexes && item.paletteHexes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.paletteHexes.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => copyHex(hex)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 border border-[#B3B3AF] hover:border-[#282828] hover:bg-[#ECEBE2] font-mono text-[10px] cursor-pointer"
                        >
                          <span
                            className="w-2.5 h-2.5 border border-[#282828]/40"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{hex}</span>
                          <IconCopy className="w-3 h-3 text-[#5C5C59]" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map((tag) => (
                      <OrbitStatusBadge key={tag} tone="neutral">
                        {tag}
                      </OrbitStatusBadge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[#B3B3AF]/75 flex items-center justify-between gap-2 bg-[#ECEBE2]/35">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.06em] underline hover:text-[#C82A00] truncate max-w-[180px]"
                >
                  <span className="truncate">{item.domain}</span>
                  <IconArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </a>
                <div className="flex items-center gap-2">
                  <OrbitButton
                    type="button"
                    size="sm"
                    variant="subtle"
                    showArrow={false}
                    label="Details"
                    onClick={() => setSelectedId(item.id)}
                  />
                  <OrbitIconControl
                    label={`Delete ${item.title}`}
                    tone="danger"
                    onClick={() => deleteLibraryItem(item.id)}
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </OrbitIconControl>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Detail / Edit Drawer */}
      <OrbitDrawer
        open={Boolean(selectedItem)}
        onClose={() => setSelectedId(null)}
        title="Bookmark Details"
        subtitle={selectedItem?.category}
      >
        {selectedItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="border border-[#B3B3AF]">
              <OrbitField
                id="lib-edit-title"
                label="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <OrbitField
                id="lib-edit-url"
                label="Preserved URL"
                value={editUrl}
                onChange={(e) => {
                  setEditUrl(e.target.value);
                  if (urlError) setUrlError("");
                }}
                error={urlError}
              />
              <OrbitTextarea
                id="lib-edit-desc"
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
              <OrbitField
                id="lib-edit-tags"
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
                onClick={() => setSelectedId(null)}
              />
              <OrbitButton type="submit" variant="accent" label="Save Bookmark" />
            </div>
          </form>
        )}
      </OrbitDrawer>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 orbit-mono-label">Loading Library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
