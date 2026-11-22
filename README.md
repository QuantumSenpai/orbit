# ORBIT

A space-inspired personal AI workspace for daily priorities, projects, ideas, inbox captures, curated references, opportunities, and tailored LaTeX resumes.

## Live Preview

**Live Website:** [https://getorbitdesk.vercel.app](https://getorbitdesk.vercel.app)

> **Status — Frontend Preview (Under Construction):**  
> This deployment is an interactive **frontend-only preview**. The backend, user accounts, live AI agents, and external service integrations (Gmail, Google Calendar, GitHub sync, cloud storage) are **under construction and coming soon**.  
> All edits, tasks, pins, projects, bookmarks, opportunities, and CV configurations currently run locally in your browser using `localStorage` with realistic demo data.

---

## Included Screens

- **Today (`/`)** — Timezone-aware daily greeting, interactive 3D Earth centerpiece (with static SVG fallback), daily metrics, priorities checklist, demo schedule, pinned ideas, and follow-up summary.
- **Projects (`/projects`)** — Grid/list views, status & search filters, milestones, task-driven completion calculation, and demo GitHub activity feed.
- **Inbox (`/inbox`)** — Mixed captures, local file metadata picker/dropzone, clearly labelled demo analysis, and one-click conversion to Today tasks or Ideas.
- **Ideas (`/ideas`)** — Capture rough thoughts, pin to Today, preview demo polishing, and convert ideas into Projects.
- **Library (`/library`)** — Categorized bookmarks (`Websites`, `Fonts`, `Palettes`, `Tools`, `Reading`) with copyable hex palettes and URL preservation.
- **Opportunities (`/opportunities`)** — Internships and Freelance tracks with list & 6-stage pipeline views, CV version mapping, application preview, and follow-up reminders.
- **CV Studio (`/cv-studio`)** — Split LaTeX source & printable HTML resume preview, verified project toggles, section ordering, `.tex` download, and browser PDF print export.
- **Settings (`/settings`)** — Configurable user name, timezone, motion preferences (`System`, `Full Motion`, `Reduced`), welcome replay, demo login flow, simulated integration/provider status, JSON export, and mock-data reset.

---

## Local Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification Scripts

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + custom editorial grid & dither-mask CSS tokens
- **Motion:** GSAP (`@gsap/react` + ScrollTrigger)
- **3D Scene:** React Three Fiber + Three.js + Public Domain Natural Earth 110m (`world-atlas`, `topojson-client`)
- **Typography:** Self-hosted Archivo + Geist Mono (`@fontsource/archivo`, `@fontsource/geist-mono`, SIL-OFL)

## License

[MIT](./LICENSE)
