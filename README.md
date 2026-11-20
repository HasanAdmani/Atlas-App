# Atlas 🧭

> **Local-first desktop & installable PWA degree planner, GPA forecaster, and enrollment manager for university students.**

Atlas consolidates academic history, GPA forecasting, target projections, curriculum roadmaps, minor degree tracking, weekly timetables, and enrollment planning into a single fast application—available both as a **desktop app (Electron)** and an **installable Node.js PWA** for phone and desktop browsers.

Built with privacy at its core: user data is stored strictly on your local machine or private server (`userData/atlas-data.json`). No student credentials, grades, or transcripts are ever transmitted to external third-party servers.

---

## ✨ Key Features

- **📊 Comprehensive GPA Lab & Forecasting**: Calculate semester and cumulative GPA, model hypothetical outlook scenarios ("What if I get a B+?"), and determine target grades needed to graduate with your desired GPA.
- **🗺️ Interactive Curriculum Roadmap**: Visualize your entire degree roadmap with an automated prerequisite and corequisite dependency graph walker.
- **🎓 Minor Degree Tracker**: Track slot requirements and requirements for academic minors (e.g., Mathematics, Music, Philosophy, History).
- **📅 Weekly Schedule & Timetable Grid**: Import term offerings (`.csv` or `.xlsx`) to test enrollment schedules, pick sections, and detect timetable conflicts and overlaps.
- **🔄 University Portal Integration**:
  - **Canvas LMS Sync**: Isolated session window connects to Canvas to pull courses, assignments, submission statuses, and scores directly without storing credentials.
  - **PSCS & Simple Syllabus Scrapers**: Extract syllabus content and portal schema data into structured JSON reports.
- **🔒 100% Local-First & Private**: Atomic writes and hourly automated backups (retaining up to the 15 most recent versions) protect against data loss.
- **⚡ Zero-Dependency Frontend**: Pure Vanilla ES6+ JavaScript, CSS custom properties, and standard DOM APIs—no heavy frontend frameworks or web bloat.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Desktop Runtime** | Electron `^33.2.0` | Main process, preload bridge, isolated portal sessions |
| **Web / PWA Server** | Node.js `http` (`server.js`) | Zero-dependency HTTP/sync server, PWA manifest & service worker (`app/sw.js`) |
| **Packaging** | electron-builder `25.1.8` | Standalone Windows portable executable |
| **Frontend UI** | Vanilla ES6+ JavaScript | Strict mode, IIFE scoped, custom template literals |
| **Styling** | Vanilla CSS3 | Responsive flex/grid, CSS custom properties, light & dark themes |
| **Data Storage** | Local JSON File | Atomic `.tmp -> rename` pattern with automated hourly rotations |

### Source Structure
The frontend UI is split into modular components inside `src/` and compiled into `app/index.html` via `build-page.js`:
```
Atlas-App/
├── src/
│   ├── p1.html       # HTML head, styles, CSS variables, root layout
│   ├── p2.js         # IIFE opening, utilities, grading scales, seed data
│   ├── p3.js         # Shared UI components (pills, badges, SVG sparklines)
│   ├── p4a.js        # Roadmap view & prerequisite graph
│   ├── p4b.js        # GPA Lab, outlook scenarios, target GPA calculator
│   ├── p5a.js        # Course modal drawer & syllabus preview
│   ├── p6.js         # Canvas sync client UI & transcript export
│   ├── p7.js         # Minor degree catalog & requirements
│   ├── p8.js         # Term goals & weekly schedule grid
│   ├── p9.js         # Dual host bridge: Electron (window.atlasHost) & Web/PWA (/api/store)
│   └── p5b.js        # Router, state actions, persistence & IIFE closure
├── app/              # Runtime bundle & PWA assets (index.html, manifest.webmanifest, sw.js, icon.svg)
├── connectors/       # Scripts injected into portal sessions (Canvas, PSCS)
├── server.js         # Zero-dependency Node.js web & multi-device sync server
├── deploy.env        # Starserver deployment manifest (port 3000, route /atlas)
├── main.js           # Electron main process & IPC handlers
├── preload.js        # Context-isolated secure preload bridge
└── build-page.js     # Concatenation pipeline assembling src/ into app/ & PWA files
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ LTS recommended for running the desktop app)
- Supported platforms: macOS, Windows, Linux

### Installation & Launch

#### Method 1: Instant Offline Browser (Easiest — No Node.js Required)
1. Download or clone this repository.
2. Open the `app/` folder and double-click `index.html` in Safari, Chrome, or any browser.
3. *On macOS*: In Safari, click **File → Add to Dock** to use it as a standalone desktop app in your Dock!

#### Method 2: Native Desktop App (macOS & Windows via Electron)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/HasanAdmani/Atlas-App.git
   cd Atlas-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   - **Desktop App (Electron)**:
     ```bash
     npm start
     ```
     *(Builds `app/index.html` from `src/` and launches a native desktop window on macOS or Windows).*
   - **Web / PWA Server (Phone & Browser Access)**:
     ```bash
     npm run serve
     ```
     *(Starts `server.js` at `http://127.0.0.1:3000`, also deployed behind Caddy at `/atlas/` on Starserver).*

---

## 📦 Building Standalone Portable Executable (.exe)

To generate a standalone portable `.exe` that runs without an installer or Node.js environment:

```bash
npm run dist
```

The output file will be generated in `dist/` (e.g., `dist/Atlas 1.1.0.exe`).

---

## 🛠️ Usage Guide

### Starter Plan (Habib University — EE Class of 2029)
If you are an Electrical Engineering student (Class of 2029) at Habib University:
1. Open Atlas (desktop or browser).
2. Go to **Settings → Restore from a backup**.
3. Select [`starter-ee-class-of-2029.json`](starter-ee-class-of-2029.json) from the repository root.
4. Your complete 4-year curriculum (all 44 courses, 134 credits, prerequisites, corequisites, and Habib Liberal Core categories) will load instantly with a clean slate for you to enter your own grades and plan electives!

### Moving Data From Web Version / Backups
- **Web to Desktop**: In the web version, go to **Settings → Download a backup**. In Atlas desktop, open **Settings → Restore from a backup** and select the `.json` file.
- **Backup Locations**: Atlas automatically keeps rolling hourly backups under your operating system's `userData` folder. Click **Settings → This computer** to view or open the directory.

### Canvas LMS Sync
1. Navigate to **Courses → Sync from Canvas → Sign in to Canvas**.
2. An isolated login window will open. Sign in securely with your student credentials.
3. Atlas reads course lists, assignments, due dates, and scores directly from the active session. Atlas never stores or inspects your password.

### Schedule Enrollment & Conflict Checking
- When your university publishes the schedule of classes, drag and drop the `.csv` or `.xlsx` file into the **Enrollment** tab.
- Atlas matches your planned courses, displays available sections, and warns you of scheduling clashes or room conflicts.

### Developing & Modifying Code
- Always edit files inside `src/`. Never edit `app/index.html` directly, as it is dynamically assembled.
- Run `npm run build:page` (or `node build-page.js`) to recompile after changes.

---

## 🔒 Security & Privacy

- **Local Storage Only**: All degree plans, grades, and notes remain on your machine.
- **Context Isolation & Sandboxing**: Electron runs with `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`.
- **Portal Isolation**: Portal logins (Canvas, PSCS) run in partitioned browser windows and do not share credentials with the renderer process.
