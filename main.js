// Atlas desktop app: main process.
// Keeps your plan in a file, opens portal windows where you sign in yourself, and reads pages with that session.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULTS = {
  canvasUrl: 'https://hulms.instructure.com',
  pscsUrl: 'https://pscs.habib.edu.pk/psc/CSPROD/EMPLOYEE/SA/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL',
  syllabusUrl: 'https://habib.simplesyllabus.com',
  serverUrl: '',
};
const SOURCES = { canvas: 'canvasUrl', pscs: 'pscsUrl', syllabus: 'syllabusUrl' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let win = null;
const portals = {};

const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'atlas-data.json');
const cfgFile = () => path.join(dataDir(), 'config.json');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeAtomic(file, text) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}
function config() {
  return Object.assign({}, DEFAULTS, readJson(cfgFile(), {}), { dataPath: dataFile() });
}

/* ---------- plan file, with a backup copy kept at most once an hour ---------- */
function backup() {
  const file = dataFile();
  if (!fs.existsSync(file)) return;
  const dir = path.join(dataDir(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort();
  const last = files[files.length - 1];
  const lastTime = last ? fs.statSync(path.join(dir, last)).mtimeMs : 0;
  if (Date.now() - lastTime < 3600e3) return;
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const name = `atlas-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
  fs.copyFileSync(file, path.join(dir, name));
  files.slice(0, Math.max(0, files.length + 1 - 15)).forEach((x) => fs.unlinkSync(path.join(dir, x)));
}
function saveStore(text) {
  if (typeof text !== 'string' || text.length > 20e6) throw new Error('Nothing to save');
  JSON.parse(text); // refuse anything that is not valid JSON
  backup();
  writeAtomic(dataFile(), text);
}
ipcMain.handle('store:load', () => (fs.existsSync(dataFile()) ? fs.readFileSync(dataFile(), 'utf8') : null));
ipcMain.handle('store:save', (e, text) => { saveStore(text); return true; });
ipcMain.on('store:saveSync', (e, text) => { try { saveStore(text); e.returnValue = true; } catch (x) { e.returnValue = false; } });

/* ---------- settings ---------- */
ipcMain.handle('cfg:get', () => config());
ipcMain.handle('cfg:set', (e, patch) => {
  const cur = readJson(cfgFile(), {});
  Object.keys(SOURCES).forEach((s) => {
    const k = SOURCES[s], v = patch && typeof patch[k] === 'string' ? patch[k].trim() : null;
    if (v === null) return;
    if (v && !/^https:\/\/[^\s]+$/i.test(v)) throw new Error('The address must start with https://');
    cur[k] = v;
  });
  if (patch && typeof patch.serverUrl === 'string') {
    const sv = patch.serverUrl.trim().replace(/\/+$/, '');
    if (sv && !/^https?:\/\/[^\s]+$/i.test(sv)) throw new Error('Server address must start with http:// or https://');
    cur.serverUrl = sv;
  }
  writeAtomic(cfgFile(), JSON.stringify(cur, null, 1));
  return config();
});

/* ---------- saving files the page makes (transcript, backup) ---------- */
ipcMain.handle('file:save', async (e, name, data) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.basename(String(name || 'atlas.txt')) });
  if (r.canceled || !r.filePath) return { canceled: true };
  fs.writeFileSync(r.filePath, typeof data === 'string' ? data : Buffer.from(data));
  return { canceled: false };
});
ipcMain.handle('folder:open', () => shell.openPath(dataDir()));

/* ---------- portal windows ---------- */
function portalUrl(source) {
  if (source && typeof source === 'object') {
    const u = String(source.url || '').trim();
    if (!/^https:\/\/[^\s]+$/i.test(u)) throw new Error('Portal address must start with https://');
    return u;
  }
  const key = SOURCES[source];
  if (!key) throw new Error('Unknown portal');
  const url = config()[key];
  if (!/^https:\/\//i.test(url || '')) throw new Error('Add the address in Settings first');
  return url;
}
function portalWindow(source, show) {
  const safeId = String(source || 'portal').replace(/[^a-z0-9_-]/gi, '') || 'portal';
  let w = portals[safeId];
  if (w && !w.isDestroyed()) { if (show) { w.show(); w.focus(); } return w; }
  w = new BrowserWindow({
    width: 1100, height: 820, show: !!show, title: 'Atlas: ' + safeId,
    webPreferences: { partition: 'persist:' + safeId, contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  w.setMenuBarVisibility(false);
  portals[safeId] = w;
  w.on('closed', () => { delete portals[safeId]; });
  return w;
}
ipcMain.handle('portal:open', async (e, source) => {
  const id = source && typeof source === 'object' ? source.id : source;
  const url = portalUrl(source), w = portalWindow(id, true);
  if (!w.webContents.getURL() || (source && typeof source === 'object')) await w.loadURL(url).catch(() => {});
  return true;
});
ipcMain.handle('portal:report', async (e, source) => {
  const w = portals[source];
  if (!w || w.isDestroyed()) throw new Error('Open that portal first, go to the page you want described, then try again');
  const script = fs.readFileSync(path.join(__dirname, 'connectors', 'report.js'), 'utf8');
  const text = await w.webContents.executeJavaScript(script);
  const r = await dialog.showSaveDialog(win, { defaultPath: `atlas-${source}-page-report.json` });
  if (r.canceled || !r.filePath) return { saved: false };
  fs.writeFileSync(r.filePath, text);
  return { saved: true };
});

/* ---------- Canvas: wait for your sign-in, then read your courses ---------- */
ipcMain.handle('canvas:export', async () => {
  const url = portalUrl('canvas'), host = new URL(url).hostname;
  const w = portalWindow('canvas', false);
  await w.loadURL(url).catch(() => {});
  const started = Date.now();
  let shown = false;
  while (Date.now() - started < 5 * 60e3) {
    if (w.isDestroyed()) throw new Error('The Canvas window was closed');
    let onCanvas = false;
    try { onCanvas = new URL(w.webContents.getURL()).hostname === host; } catch (x) { /* still loading */ }
    let signedIn = false;
    if (onCanvas) {
      signedIn = await w.webContents.executeJavaScript(
        "fetch('/api/v1/users/self',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok).catch(()=>false)"
      ).catch(() => false);
    }
    if (signedIn) {
      const script = fs.readFileSync(path.join(__dirname, 'connectors', 'canvas.js'), 'utf8');
      const json = await w.webContents.executeJavaScript(script);
      w.close();
      return json;
    }
    if (!shown && Date.now() - started > 2500) { w.show(); shown = true; }
    await sleep(1500);
  }
  if (!w.isDestroyed()) w.close();
  throw new Error('Timed out waiting for you to sign in');
});

/* ---------- Canvas silent background check ---------- */
ipcMain.handle('canvas:silent', async () => {
  let url, host;
  try { url = portalUrl('canvas'); host = new URL(url).hostname; } catch (e) { return { ok: false }; }
  const w = portalWindow('canvas', false);
  try {
    await w.loadURL(url).catch(() => {});
    for (let i = 0; i < 4; i++) {
      if (w.isDestroyed()) return { ok: false };
      let onCanvas = false;
      try { onCanvas = new URL(w.webContents.getURL()).hostname === host; } catch (x) {}
      if (onCanvas) {
        const signedIn = await w.webContents.executeJavaScript(
          "fetch('/api/v1/users/self',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok).catch(()=>false)"
        ).catch(() => false);
        if (signedIn) {
          const script = fs.readFileSync(path.join(__dirname, 'connectors', 'canvas.js'), 'utf8');
          const json = await w.webContents.executeJavaScript(script);
          if (!w.isDestroyed()) w.close();
          return { ok: true, data: json };
        }
      }
      await sleep(1500);
    }
  } catch (e) {}
  if (!w.isDestroyed()) w.close();
  return { ok: false };
});

/* ---------- PSCS: wait for your sign-in, then read Course History + Weekly Schedule (read-only) ---------- */
ipcMain.handle('pscs:export', async () => {
  const url = portalUrl('pscs'), host = new URL(url).hostname;
  const w = portalWindow('pscs', false);
  await w.loadURL(url).catch(() => {});
  const started = Date.now();
  let shown = false;
  while (Date.now() - started < 5 * 60e3) {
    if (w.isDestroyed()) throw new Error('The PSCS window was closed');
    let curUrl = '';
    try { curUrl = w.webContents.getURL(); } catch (x) {}
    let onPscs = false;
    try { onPscs = new URL(curUrl).hostname === host; } catch (x) {}
    let signedIn = false;
    if (onPscs && /\/(psc|psp)\//i.test(curUrl) && !/cmd=login|signin/i.test(curUrl)) {
      signedIn = await w.webContents.executeJavaScript(
        "!document.querySelector('input[type=\"password\"]') && /homepage|student|academic|classes|schedule|peoplesoft/i.test(document.title + ' ' + ((document.body && document.body.innerText) || '').slice(0, 1500))"
      ).catch(() => false);
    }
    if (signedIn) {
      await sleep(800);
      const script = fs.readFileSync(path.join(__dirname, 'connectors', 'pscs.js'), 'utf8');
      const json = await w.webContents.executeJavaScript(script);
      if (!w.isDestroyed()) w.close();
      return json;
    }
    if (!shown && Date.now() - started > 2500) { w.show(); shown = true; }
    await sleep(1500);
  }
  if (!w.isDestroyed()) w.close();
  throw new Error('Timed out waiting for you to sign in to PSCS');
});

/* ---------- Starserver sync bridge ---------- */
ipcMain.handle('server:sync', async (e, payload) => {
  const srv = (config().serverUrl || '').trim().replace(/\/+$/, '');
  if (!srv) return { ok: false, unconfigured: true };
  try {
    const method = payload && payload.method === 'POST' ? 'POST' : 'GET';
    if (method === 'GET') {
      const r = await fetch(srv + '/api/store', { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      return Object.assign({ status: r.status }, j || { ok: false, error: 'Invalid response' });
    }
    const base = payload.base || 0;
    const force = payload.force ? '&force=1' : '';
    const r = await fetch(srv + '/api/store?base=' + encodeURIComponent(base) + force, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: String(payload.body || ''),
    });
    const j = await r.json().catch(() => null);
    return Object.assign({ status: r.status }, j || { ok: false, error: 'Invalid response' });
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

/* ---------- main window ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 600, title: 'Atlas',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.on('closed', () => { win = null; Object.values(portals).forEach((w) => { if (!w.isDestroyed()) w.close(); }); });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
