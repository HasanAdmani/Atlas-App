# AGENTS.md — Atlas Developer & Agent Guide

This document provides essential architectural context, conventions, execution instructions, and hard constraints for AI agents and human developers working in this repository. For current server status and history, also see [PROJECT_STATE.md](PROJECT_STATE.md), [CHANGELOG.md](CHANGELOG.md), and [deploy.env](deploy.env).

---

## 1. Project Overview & Architecture

**Atlas** is a local-first degree planner designed primarily for Habib University students (with adaptable curriculum schemas), running as both an **Electron desktop application** (`main.js`) and a **Node.js + PWA web app** (`server.js`, deployed on Starserver at `/atlas/`). It consolidates grades, GPA calculations, target projections, curriculum roadmaps, minor degree tracking, weekly timetables, and enrollment planning.

### Key Architectural Characteristics
- **Local-First & Multi-Device Sync**: In Electron, data is saved locally in `app.getPath('userData')/atlas-data.json`. In Web/PWA mode (`server.js`), data is stored privately on your own server in `userData/atlas-data.json` and synced across phone and desktop via `/api/store` with offline `localStorage` fallback. No student data is sent to third-party servers.
- **Portal Session Scraping**: In Electron desktop mode, connects to university systems (Canvas LMS, PSCS, Simple Syllabus) using isolated browser sessions where users authenticate directly; Atlas reads page data or APIs via session cookies without ever handling or storing passwords. (In Web/PWA mode, Canvas sync uses the read-only bookmarklet paste workflow.)
- **Zero-Dependency Renderer**: The client-side UI uses pure Vanilla JavaScript, CSS custom properties, and standard DOM APIs without React, Vue, Svelte, Tailwind, or bundling overhead.
- **File Concatenation Build Pipeline**: Source files in `src/` are concatenated by `build-page.js` in a strict order into `app/index.html`, along with generated PWA assets (`manifest.webmanifest`, `sw.js`, `icon.svg`).

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Desktop Runtime** | Electron `^33.2.0` | Main process, preload bridge, isolated portal windows |
| **Web / PWA Server** | Node.js `http` (`server.js`) | Zero-dependency HTTP/sync server, PWA manifest & network-first `sw.js` |
| **Packaging / Dist** | electron-builder `25.1.8` | Windows portable executable target (`win: { target: "portable" }`) |
| **Frontend Language** | Vanilla ES6+ JavaScript | Strict mode, IIFE scoped, no transpiler |
| **Templating / UI** | Custom template literals | Functional HTML generation with sanitized interpolated strings |
| **Styling** | Vanilla CSS3 | CSS variables (`:root`), light/dark themes, responsive flex/grid |
| **Typography** | Google Fonts | *Hanken Grotesk* (body), *IBM Plex Mono* (code/numbers), *Instrument Serif* (display) |
| **Data Storage** | Local JSON file & `localStorage` | Atomic write pattern with hourly backups (up to 15 rolling versions) |

---

## 3. Directory & File Structure

```
Atlas-App/
├── .gitignore                      # Ignores node_modules/, dist/, userData/, and personal backups
├── .gitattributes                  # Enforces LF line endings for deploy.env and scripts
├── AGENTS.md                       # This guide
├── PROJECT_STATE.md                # Living state & Starserver deployment overview
├── CHANGELOG.md                    # Change log with rollback steps
├── README.md                       # User-facing onboarding documentation
├── package.json                    # Project configuration, scripts, dependencies
├── package-lock.json               # Locked dependency tree
├── build-page.js                   # Concatenation script assembling src/ into app/index.html & PWA assets
├── server.js                       # Zero-dependency Node.js web & atomic sync server (PWA / Starserver)
├── deploy.env                      # Starserver deployment manifest (port 3000, route /atlas)
├── main.js                         # Electron main process (lifecycle, IPC, storage, portals)
├── preload.js                      # Context-isolated bridge exposing window.atlasHost
│
├── src/                            # MODULAR SOURCE CODE (EDIT HERE)
│   ├── p1.html                     # HTML head, Google Fonts, theme CSS, #app container
│   ├── p2.js                       # Opens <script>(function(){ 'use strict'; utilities, grading scales, seed data
│   ├── p3.js                       # Shared UI components (pills, badges, headers, SVG sparklines)
│   ├── p4a.js                    # Roadmap view & prerequisite dependency graph walker
│   ├── p4b.js                    # GPA Lab, outlook scenarios, target GPA calculator
│   ├── p5a.js                    # Course creation, course modal drawer, syllabus preview
│   ├── p6.js                       # Canvas sync connector client UI & bookmarklet script
│   ├── p7.js                       # Habib University Minor degree catalog & slot requirements
│   ├── p8.js                       # Term goals, standing projections, weekly schedule grid
│   ├── p9.js                       # Dual host bridge: Electron (window.atlasHost) & Web/PWA (/api/store)
│   └── p5b.js                    # Router, render loop, actions, persistence, migrations, closes })();</script>
│
├── app/                            # RUNTIME / OUTPUT DIRECTORY (DO NOT EDIT DIRECTLY)
│   ├── index.html                  # Generated single-page application compiled by build-page.js
│   ├── manifest.webmanifest        # PWA manifest generated by build-page.js
│   ├── sw.js                       # Network-first PWA service worker generated by build-page.js
│   └── icon.svg                    # SVG app icon generated by build-page.js
│
├── connectors/                     # SCRIPTS INJECTED INTO PORTAL BROWSER WINDOWS
│   ├── canvas.js                   # Canvas LMS API reader (courses, assignments, submissions, scores)
│   └── report.js                   # Structural DOM scraper for extracting page schemas (PSCS / Syllabus)
│
├── dist/                           # PACKAGED OUTPUT (Generated by electron-builder)
│   ├── win-unpacked/               # Unpacked portable binaries
│   └── Atlas <version>.exe         # Standalone portable Windows executable
│
├── _old/                           # Legacy reference files, prototypes, and historical archives
└── *.json / *.csv                  # Sample data, backups, and schedules (e.g. spring2027.csv)
```

---

## 4. How to Run and Build the Application

### 1. Prerequisites
- **Node.js**: LTS version (v18+ or v20+ recommended)
- **npm**: Standard npm installed with Node.js
- **OS**: Windows (primary target for portable builds)

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Frontend HTML Bundle
To concatenate files in `src/` into `app/index.html`:
```bash
npm run build:page
# Or directly:
node build-page.js
```

### 4. Run Development App
Runs `build-page.js` and launches Electron:
```bash
npm start
```

Or run the Node.js web/PWA server (`http://127.0.0.1:3000`, also used on Starserver at `/atlas`):
```bash
npm run serve
```

### 5. Build Portable Windows Executable (.exe)
Compiles `app/index.html` and packages a standalone executable into `dist/`:
```bash
npm run dist
```
The output executable will be created in `dist/Atlas <version>.exe`. No installer is required.

---

## 5. Architecture & Code Conventions

### 1. The Concatenation Pipeline Boundary
Files in `src/` are concatenated by `build-page.js` into one continuous file in this exact sequence:
```javascript
['p1.html', 'p2.js', 'p3.js', 'p4a.js', 'p4b.js', 'p5a.js', 'p6.js', 'p7.js', 'p8.js', 'p9.js', 'p5b.js']
```
- `src/p1.html`: Contains `<head>`, CSS `<style>`, and ends with `<div id="app"></div>`.
- `src/p2.js`: Begins with `<script>\n(function(){\n'use strict';`.
- `src/p3.js` through `src/p9.js`: Pure JavaScript snippets sharing the top-level scope of the IIFE.
- `src/p5b.js`: Contains routing, event handling, calls `boot()`, and closes with `})();\n</script>`.

> **Note on Naming**: `p5b.js` is placed at the end of the chain despite its name because it depends on functions declared across `p6.js`, `p7.js`, `p8.js`, and `p9.js`.

### 2. State Management & Reactivity
- **Persistent State (`S`)**: Holds degree data: `settings`, `terms`, `courses`, `minors`, and schema version `v`.
- **Ephemeral UI State (`U`)**: Holds transient UI states such as `route`, `planTab`, `course` (opened drawer ID), `tab`, `toast`, and `hostBusy`.
- **Re-render Pattern**: Atlas uses a declarative single-function re-render: `render()`. When state changes, call `render()`. It replaces `#app.innerHTML` while preserving window scroll (`window.scrollY`) and drawer scroll (`$('.drawer').scrollTop`).
- **Action Handling**: Handled via data attributes (`data-a="actionName"` and `data-d="jsonPayload"`) or direct event listeners routed through the `ACT` dictionary in `p5b.js`.

### 3. Data Persistence & Backup Lifecycle
- **Electron (`main.js`)**: Manages persistence in `app.getPath('userData')` (`atlas-data.json`, `config.json`, `backups/atlas-YYYYMMDD-HHMM.json`).
- **Node.js Web / PWA Server (`server.js`)**: Manages persistence in `<repo>/userData/` (`atlas-data.json` and `backups/atlas-YYYYMMDD-HHMM.json`), seeding from `course-atlas-backup.json` on first start if present.
- **Hourly Backup Rotation**: Both `main.js` and `server.js` automatically create a backup if more than 1 hour has elapsed since the last backup, retaining the 15 most recent backups.
- **Atomic File Writes**: `writeAtomic()` writes data to a temporary file (`.tmp`) before renaming it, guaranteeing that crashes or power cuts never corrupt existing JSON.
- **Renderer Sync (`p9.js` & `p5b.js`)**: `HOST` resolves to `DESKTOP_HOST` (`window.atlasHost`) in Electron or `WEB_HOST` (`/api/store`) when served over HTTP/HTTPS. Mutations call `persist()`, which saves to `localStorage` immediately and debounces `HOST.save(...)` (400ms), while `visibilitychange` refreshes newer server state when switching devices and `beforeunload` flushes via `saveSync` / `sendBeacon`.

### 4. IPC & Preload Security
- `preload.js` bridges renderer and main process via `contextBridge.exposeInMainWorld('atlasHost', { ... })`.
- Main process enforces strict web preferences:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - Navigation restricted strictly to local `file://` URLs.
  - External links (`https://`) intercepted and delegated to the default operating system browser via `shell.openExternal`.

---

## 6. Things You Should NEVER Change

When modifying or refactoring this codebase, strictly observe these rules:

1. **NEVER edit `app/index.html` directly**:
   `app/index.html` is an ephemeral artifact generated by `build-page.js`. Any manual changes will be wiped on the next `npm start` or `npm run dist`. Always edit the corresponding file in `src/`.

2. **NEVER break the `<script>` IIFE boundary across `src/` files**:
   - `src/p2.js` MUST open `<script>\n(function(){\n'use strict';`.
   - `src/p5b.js` MUST terminate the script with `boot();\n})();\n</script>`.
   - Never insert standalone `<script>` or `</script>` tags inside intermediate files (`p3.js` through `p9.js`).

3. **NEVER alter the concatenation order in `build-page.js` without resolving dependencies**:
   `p5b.js` relies on definitions from `p6.js`, `p7.js`, `p8.js`, and `p9.js`. Changing the order will cause runtime `ReferenceError`s during page initialization.

4. **NEVER disable Electron security settings**:
   - Do not set `nodeIntegration: true`.
   - Do not set `contextIsolation: false`.
   - Do not disable `sandbox: true` for the main window or portal windows.
   - Do not allow unvetted remote navigation in the main window.

5. **NEVER store, cache, or transmit student credentials or passwords**:
   Atlas's security model guarantees that portal authentication (Canvas, PSCS) occurs solely within the user's interactive session in a partition-isolated `BrowserWindow`. Never introduce credential fields, scrapers for password inputs, or network transmission of session cookies.

6. **NEVER bypass `writeAtomic()` or the backup rotation in `main.js`**:
   Student degree plans represent years of academic records. Writes must always remain atomic (`.tmp` -> `renameSync`) and backups must be created before overwriting data.

7. **NEVER break backwards compatibility in `upgrade()`**:
   When introducing new schema properties or changing the data structure of `courses`, `terms`, `minors`, or `settings`, you must update the migration logic inside `upgrade(o)` in `src/p5b.js` to ensure older user backup files load without loss of course history or grades.

8. **NEVER introduce npm dependencies into the frontend renderer**:
   The frontend runtime must remain zero-dependency. Do not add module bundlers, polyfill libraries, or CDN script dependencies that would compromise the offline capability of the desktop application.
