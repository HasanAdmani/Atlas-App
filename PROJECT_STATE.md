# Atlas — Project & Server State

Living state document for **Atlas** deployed on Starserver (`100.66.215.100`).

---

## Architecture Overview
- **Dual Runtime**:
  - **Web / PWA Server (`server.js`)**: Zero-dependency Node.js HTTP server (`127.0.0.1:3000`) serving compiled `app/` static & PWA files (`index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`) and atomic JSON persistence (`userData/atlas-data.json` + hourly rolling backups in `userData/backups/`).
  - **Desktop App (`main.js` + `preload.js`)**: Electron desktop shell preserved intact (`npm start`, `npm run dist`).
- **Frontend (`src/` -> `app/index.html`)**: Vanilla JS/CSS compiled via `node build-page.js`. Uses `DESKTOP_HOST` (`window.atlasHost`) in Electron or `WEB_HOST` (`/api/store`) when running over HTTP/HTTPS, with offline `localStorage` fallback and Service Worker caching.

## Starserver Deployment Config (`deploy.env`)
- **App Name**: `atlas`
- **Service Mode**: `START_SERVICE=true` (PM2 process running `node server.js`)
- **Listening Address**: `127.0.0.1:3000`
- **Caddy Route**: `/atlas` -> `https://starserver.tailbf777f.ts.net/atlas/` (with trailing-slash normalization in `app/index.html` `<head>` and `/atlas` prefix stripping in both Caddy and `server.js`)
- **Persistent Data**: `~/apps/atlas/userData/atlas-data.json` (git-ignored, atomic writes, 15 rolling hourly backups)

## Quick Commands
- **Local Web/PWA Dev**: `npm run serve` (`http://127.0.0.1:3000`)
- **Build Bundle + PWA Assets**: `npm run build:page`
- **Electron Desktop**: `npm start`
- **Deploy on Starserver**: `ssh hasan@100.66.215.100 "~/ops/deploy.sh atlas"`
