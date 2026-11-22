# Changelog

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
