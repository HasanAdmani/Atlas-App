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

## Server API Endpoints (`server.js`)
- `GET /api/health` — Returns `{ ok: true, service: 'atlas', updatedAt }`
- `GET /api/store` — Returns `{ ok: true, data, updatedAt, backups }` from `userData/atlas-data.json`
- `POST /api/store` — Validates JSON (`terms` & `courses` arrays), triggers hourly backup rotation, writes `userData/atlas-data.json` atomically
- `POST /api/backups/restore` — Validates backup filename (`atlas-YYYYMMDD-HHMM.json`), restores atomically
- `GET /api/offerings/default` — Serves `spring2027.csv` for one-tap mobile schedule loading

## Routing & PWA Notes
- **Subpath Handling**: `CADDY_ROUTE=/atlas` proxies `/atlas` and `/atlas/*` (with `uri strip_prefix /atlas`) to `127.0.0.1:3000`. `server.js` also strips an optional `/atlas` prefix, and `<head>` in `app/index.html` normalizes `/atlas` → `/atlas/` before resolving `manifest.webmanifest`, `icon.svg`, and `sw.js`.
- **Root Service Worker Coexistence**: The root domain (`https://starserver.tailbf777f.ts.net/`) serves CoffeeOS (`127.0.0.1:8000`), whose `/sw.js` covers scope `/` and must exclude `/atlas` from its `NavigationRoute` so personal browsers route `/atlas/` to Caddy rather than CoffeeOS.

## Quick Commands
- **Local Web/PWA Dev**: `npm run serve` (`http://127.0.0.1:3000`)
- **Build Bundle + PWA Assets**: `npm run build:page`
- **Electron Desktop**: `npm start`
- **Deploy on Starserver**: `ssh hasan@100.66.215.100 "~/ops/deploy.sh atlas"`
