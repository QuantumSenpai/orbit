# ORBIT

A space-inspired personal AI workspace for daily priorities, projects, ideas, inbox captures, curated references, opportunities, and tailored LaTeX resumes.

## Live Preview

**Live Website:** [https://getorbitdesk.vercel.app](https://getorbitdesk.vercel.app)

> **Status — Personal Workspace (Under Construction):**
> Orbit uses server-verified password access. AI agents and external integrations (Gmail, Google Calendar, GitHub sync, cloud storage) remain demos or coming soon.
> Workspace edits still save locally in this browser using `localStorage`, starting with demo data. Authentication does not add cloud sync or encrypt browser storage.

---

## Included Screens

- **Today (`/`)** — Timezone-aware daily greeting, interactive 3D Earth centerpiece (with static SVG fallback), daily metrics, priorities checklist, demo schedule, pinned ideas, and follow-up summary.
- **Projects (`/projects`)** — Grid/list views, status & search filters, milestones, task-driven completion calculation, and demo GitHub activity feed.
- **Inbox (`/inbox`)** — Mixed captures, local file metadata picker/dropzone, clearly labelled demo analysis, and one-click conversion to Today tasks or Ideas.
- **Ideas (`/ideas`)** — Capture rough thoughts, pin to Today, preview demo polishing, and convert ideas into Projects.
- **Library (`/library`)** — Categorized bookmarks (`Websites`, `Fonts`, `Palettes`, `Tools`, `Reading`) with copyable hex palettes and URL preservation.
- **Opportunities (`/opportunities`)** — Internships and Freelance tracks with list & 6-stage pipeline views, CV version mapping, application preview, and follow-up reminders.
- **CV Studio (`/cv-studio`)** — Split LaTeX source & printable HTML resume preview, verified project toggles, section ordering, `.tex` download, and browser PDF print export.
- **Access (`/login`)** — One password, show/hide control, inline errors, password-manager support, and safe return to the requested workspace route.
- **Settings (`/settings`)** — Configurable name, timezone, motion and welcome preferences, welcome replay, logout, simulated integration/provider status, JSON export, and mock-data reset.

---

## Local Development

```bash
pnpm install
cp .env.example .env.local
node scripts/generate-auth-secrets.mjs
# Paste the generated base64 password hash and session secret into .env.local.
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:motion
```

The browser check starts its own local production server on port 3120 with temporary credentials, verifies access protection, login/logout, welcome replay, redirect safety, concurrent throttling, responsive layouts, and reduced motion, then stops that server. It uses installed Chromium via `playwright-core`; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed. Screenshots are saved in the system temporary directory under `orbit-auth-qa`. The motion check runs a cold login at 4× CPU throttling, records frame gaps and long tasks, and rejects WebGL initialization during the intro.

## Personal Access and PWA

Set `ORBIT_PASSWORD_HASH` and `ORBIT_SESSION_SECRET` on the server; neither is a `NEXT_PUBLIC_` variable. Use the base64 hash in `.env` files to avoid dollar-sign expansion, or the raw bcrypt hash in a host secret manager. The generator uses bcrypt with cost 12 and a random 32-byte signing secret. Keep real credentials out of Git and chat transcripts.

Sessions use signed HS256 cookies with a 14-day expiry, HttpOnly, and SameSite=Lax. HTTPS requests receive Secure cookies; use HTTPS for a hosted workspace. Middleware protects pages and private APIs, checks cross-origin writes, and prevents public caching. Logout deletes this browser's cookie. As with stateless sessions, a copied token stays valid until expiry; rotate the signing secret to revoke all sessions.

Login allows five attempts per 15-minute window and reserves attempts before password verification to cover concurrent requests. The application counter is in memory and protects one process only. On Vercel, configure a project firewall rule for POST `/api/auth/login`, keyed by IP, with a fixed window of 600 seconds, five requests, and a 429 response. This supplies an edge limit shared across instances within each region; Vercel's counters are regional. Other multi-instance hosts need an equivalent edge or shared-store limiter. Configure the reverse proxy to overwrite client IP and protocol headers.

Fresh sign-ins play a roughly 2.6-second, timezone-aware Earth welcome. Settings offers Always (once per browser session), Once (fresh sign-ins only), Never, and manual Replay Welcome. Reduced motion shortens it to a still briefing. Internal route changes do not replay it. Existing browser data is migrated when the welcome preference is missing.

The intro animates the existing SVG Earth so cold 3D chunk evaluation, texture upload, and shader compilation cannot interrupt its timeline. The interactive globe initializes 700ms after the intro exits, once the dashboard's longest staggered reveal (560ms) has finished. Texture disposal follows the texture's lifetime, independent of readiness callbacks, and the WebGL capability probe releases its temporary context. On the local Chromium 4× CPU check, the largest intro frame gap fell from 83.2ms to 16.8ms; long tasks fell from two to zero. These are desktop throttling measurements, not a guarantee for every device.

The web manifest and icons support installation on compatible browsers over HTTPS (or localhost). The production service worker caches only the explicit branding assets and manifest. Pages, React Server Component payloads, login/session APIs, and other responses stay on the network. Private workspace access requires a network connection; there is no offline workspace or background sync.

Dependency audit, 2026-11-23: the workspace overrides Next.js's transitive PostCSS to 8.5.33, resolving the previous four advisories. `pnpm audit --prod --json` reports no known production vulnerabilities. The override stays in the lockfile and is verified by the production build.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + custom editorial grid & dither-mask CSS tokens
- **Motion:** GSAP (`@gsap/react` + ScrollTrigger)
- **3D Scene:** React Three Fiber + Three.js + Public Domain Natural Earth 110m (`world-atlas`, `topojson-client`)
- **Typography:** Self-hosted Archivo + Geist Mono (`@fontsource/archivo`, `@fontsource/geist-mono`, SIL-OFL)

## License

[MIT](./LICENSE)
