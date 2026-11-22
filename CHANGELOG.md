# Changelog

## 2026-11-23 — Streamlined UI Overhaul, Live PSCS Schedule & 1-Click Multi-Portal Sync
### Summary
- **UI Simplification & Visual Polish** (`src/p1.html`, `src/p2.js`, `src/p3.js`, `src/p4a.js`, `src/p4b.js`, `src/p5a.js`, `src/p5b.js`, `src/p6.js`, `src/p8.js`):
  - Slimmed sidebar (16 → 7 controls) with `+ Add course` CTA, 5 nav tabs (`Home`, `Courses`, `Plan`, `GPA`, `Sync`), horizontal Portals icon strip, and compact footer (`Settings`, `Guide`, single theme toggle, sync dot).
  - Replaced Home's 4 separate KPI cards with a unified 4-metric Stats Strip (`v: 6` schema upgrade), added 1-click inline score entry (`Log`) on **Up Next**, and hid empty `Worth a look` / compact empty `Weekly schedule` bars.
  - Added centered inline **`+ Add course`** modal (`Quick add` | `From syllabus`) over any page, simplified Course Drawer top summary & 4-column assessment rows with collapsible `⚙` group settings, added Four-Year Grid `View ▾` popover, split GPA Lab into 3 tabs (`Target` · `What-if` · `Transcript`), and converted Enrollment into a compact 1-line offerings bar + smart chip/dropdown threshold + sticky 5-tab right pane (`Week` · `Cart` · `Backups` · `Auto` · `Search`).
  - Redesigned fresh-install Welcome into a calm 3-card chooser.
- **Live PSCS Weekly Schedule vs. Future Enrollment** (`src/p2.js`, `src/p3.js`, `src/p6.js`, `src/p8.js`, `src/p5b.js`): Added `S.schedule` for live PSCS weekly schedules so future-term drafts label honestly as `Planned · <Term>` (`Future term`) instead of `"This week"`, with a `[This week | <Planned>]` toggle when both exist.
- **1-Click Read-Only Multi-Portal Sync (Canvas + PSCS)** (`connectors/pscs.js`, `main.js`, `preload.js`, `src/p9.js`, `src/p6.js`, `extension/*`): Added Electron `pscs:export` + **✦ Sync All (Canvas + PSCS)**, upgraded the **Atlas Companion** Chrome/Edge extension (`v1.1.0`) with **✦ Sync All Portals** (read-only `GET` for Canvas + PSCS Course History + PSCS Live Weekly Schedule), and upgraded the universal bookmarklet to bundle PSCS Course History + Weekly Schedule from any PSCS page.

### Rollback Steps
1. Check out commit `cc3e88c` on Starserver (`~/apps/atlas`) and run `~/ops/deploy.sh atlas`.
2. Existing `~/apps/atlas/userData/atlas-data.json` is git-ignored and backwards-compatible (hourly rolling backups in `~/apps/atlas/userData/backups/`).

## 2026-11-22 — Quick Course Actions, Multi-Component Enrollment, Simple Syllabus Linking & Tour
### Summary
- **Universal Course Context Menu & Quick Actions** (`src/p3.js`, `src/p4a.js`, `src/p4b.js`, `src/p5b.js`, `src/p1.html`): Added `⋮` quick-action buttons and right-click context menus across Courses (cards & table), Overview, Four-Year Grid, and Requirements chips with viewport-clamped upward flipping, 1-click final grade pills, Move to term, **Retake (Copy & Link)**, **Duplicate**, Open/Edit, and undoable Delete. Added inline final grading on current courses, drawer header quick-grade + Retake controls, 1-click Retake buttons in GPA Lab, and `+` quick-add buttons on Four-Year Grid term headers.
- **Multi-Component Enrollment** (`src/p8.js`, `src/p1.html`): Grouped offered sections by component prefix (`L` Lecture, `S` Seminar, `R` Recitation, `T` Lab/Tutorial, `D` Studio, `C` Capstone) with backwards-compatible multi-pick storage, auto-pairing of single-option common lectures (e.g., `CORE 202` Hikma `L1` + `S3`), multi-component clash detection, Shopping Cart numbers, per-component Backup Sections, and multi-component Auto-Schedule. Added instructor deduplication/truncation (`fmtIns`) and human-readable PSCS term decoding (`2711` → `Spring 2027`).
- **Simple Syllabus Linking & Offline Parsing** (`src/p6.js`, `src/p5a.js`, `src/p5b.js`, `main.js`): Preserved full `location.href` in the universal bookmarklet, upgraded deterministic syllabus parser (no AI key required), added Simple Syllabus course-matching & link preview card in Sync & Import, fixed Add Course preview without Gemini key, and populated default PSCS/Simple Syllabus URLs in `main.js`.
- **One-Click Canvas Auto-Build, PSCS Fix & Interactive Tour** (`src/p6.js`, `src/p3.js`, `src/p5b.js`): Unmatched Canvas courses now default to `+ Create new course` with Habib scale & current term auto-initialization and smart category inference (`guessCat`). Fixed PSCS plain-text paste misrouting (`CORE 101` collision with Stellic), fixed `change`-vs-`click` first-click swallow on `#canvas` `Read export`, added the 5-step `#tour` walkthrough and live Setup Progress checklist, refined GPA Lab ceiling math, dark-mode toasts, and mobile Plan tab layout.

### Rollback Steps
1. Check out the previous commit on Starserver (`~/apps/atlas`) and run `~/ops/deploy.sh atlas`.
2. Existing `~/apps/atlas/userData/atlas-data.json` is git-ignored and backwards-compatible (legacy single-string enrollment picks remain supported).

## 2026-11-22 — Clean Dossiers, 3-Path Setup Guide & Stellic/PSCS Auto-Build
### Summary
- Removed hardcoded personal data (`seed()`) from `src/p2.js`, `src/p5b.js`, and `src/p6.js`; `boot()` now starts from `blank()` on fresh clones.
- Added `dossiers/` (`index.json`, `habib-ee-2029.json`, `habib-cs-2029.json`) and updated `build-page.js` to bundle them into `window.__ATLAS_DOSSIERS__` inside `app/index.html` for offline `file://`, Web/PWA, and Electron use.
- Added the `#setup` **Setup Guide & Tour** (`src/p3.js`, `src/p5b.js`) with Path A (University Dossiers), Path B (Stellic + PSCS + Canvas auto-build), and Path C (Custom Degree).
- Upgraded `src/p6.js` with `parseStellicAudit()` / `applyStellicImport()` and PSCS Course History term/course creation.
- Added optional `ATLAS_DATA_DIR` env override in `server.js` for isolated local testing.

### Rollback Steps
1. Check out the previous commit on Starserver (`~/apps/atlas`) and run `~/ops/deploy.sh atlas`.
2. Existing `~/apps/atlas/userData/atlas-data.json` is git-ignored and untouched.

## 2026-11-18 — Node.js Web Server, PWA Port & UI Revamp
### Summary
- Revamped the full UI & design system across `src/` (`p1.html`, `p3.js`, `p4a.js`, `p4b.js`, `p5a.js`, `p7.js`, `p8.js`, `p5b.js`) with light/dark themes, custom select pills, segmented controls, interactive grade/section pickers, and mobile bottom navigation bar.
- Added zero-dependency Node.js web & sync server (`server.js`) with `/api/health`, `/api/store`, `/api/backups/restore`, and `/api/offerings/default` endpoints, atomic writes, and 15 rolling hourly backups.
- Updated `build-page.js` to emit PWA assets (`app/manifest.webmanifest`, `app/sw.js`, `app/icon.svg`) and mobile/PWA meta tags + `/atlas` trailing-slash normalization.
- Updated `src/p9.js` and `src/p5b.js` with `WEB_HOST` multi-device sync, `visibilitychange` refresh, Settings backup restore UI, and offline `localStorage` fallback while preserving Electron (`window.atlasHost`) support.
- Configured Starserver deployment manifest (`deploy.env` on port `3000`, route `/atlas`, `START_SERVICE=true`) and `.gitattributes` (LF line endings).

### Rollback Steps
1. On Starserver, check out the previous commit in `~/apps/atlas`, set `START_SERVICE=false` in `deploy.env`, and run `~/ops/deploy.sh atlas` to remove the Caddy route and stop PM2.
2. Restore any pre-change data snapshot from `~/apps/atlas/userData/backups/` if needed.
