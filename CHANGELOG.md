# Changelog

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
