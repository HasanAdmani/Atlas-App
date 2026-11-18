// Atlas Node.js web & multi-device sync server.
// Serves the compiled PWA in app/ and persists degree data atomically in userData/.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_BODY = 20 * 1024 * 1024;

const APP_DIR = path.join(__dirname, 'app');
const DATA_DIR = path.join(__dirname, 'userData');
const DATA_FILE = path.join(DATA_DIR, 'atlas-data.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const SEED_BACKUP = path.join(__dirname, 'course-atlas-backup.json');
const DEFAULT_CSV = path.join(__dirname, 'spring2027.csv');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
};

function writeAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

function backup() {
  if (!fs.existsSync(DATA_FILE)) return;
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const files = fs.readdirSync(BACKUPS_DIR).filter((x) => x.endsWith('.json')).sort();
  const last = files[files.length - 1];
  const lastTime = last ? fs.statSync(path.join(BACKUPS_DIR, last)).mtimeMs : 0;
  if (Date.now() - lastTime < 3600e3) return;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const name = `atlas-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
  fs.copyFileSync(DATA_FILE, path.join(BACKUPS_DIR, name));
  files.slice(0, Math.max(0, files.length + 1 - 15)).forEach((x) => {
    try { fs.unlinkSync(path.join(BACKUPS_DIR, x)); } catch (e) {}
  });
}

function listBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  return fs.readdirSync(BACKUPS_DIR)
    .filter((x) => /^atlas-\d{8}-\d{4}\.json$/.test(x))
    .sort()
    .reverse()
    .map((name) => {
      const st = fs.statSync(path.join(BACKUPS_DIR, name));
      return { name, mtimeMs: st.mtimeMs, size: st.size };
    });
}

function getUpdatedAt() {
  try {
    return fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).mtimeMs : 0;
  } catch (e) {
    return 0;
  }
}

function seedFromWorkspace() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE) && fs.existsSync(SEED_BACKUP)) {
    try {
      const raw = fs.readFileSync(SEED_BACKUP, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.terms) && Array.isArray(parsed.courses)) {
        writeAtomic(DATA_FILE, raw);
        console.log('Seeded userData/atlas-data.json from course-atlas-backup.json');
      }
    } catch (e) {
      console.warn('Could not seed from course-atlas-backup.json:', e.message);
    }
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let len = 0;
    req.on('data', (chunk) => {
      len += chunk.length;
      if (len > MAX_BODY) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function handleApi(req, res, reqPath, query) {
  if (req.method === 'GET' && reqPath === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'atlas', updatedAt: getUpdatedAt() });
  }

  if (req.method === 'GET' && reqPath === '/api/store') {
    const exists = fs.existsSync(DATA_FILE);
    const data = exists ? fs.readFileSync(DATA_FILE, 'utf8') : null;
    return sendJson(res, 200, {
      ok: true,
      data,
      updatedAt: getUpdatedAt(),
      backups: listBackups(),
    });
  }

  if (req.method === 'POST' && reqPath === '/api/store') {
    return readBody(req)
      .then((text) => {
        if (!text || typeof text !== 'string') {
          return sendJson(res, 400, { ok: false, error: 'Empty body' });
        }
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
        }
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.terms) || !Array.isArray(parsed.courses)) {
          return sendJson(res, 400, { ok: false, error: 'Payload must contain terms and courses arrays' });
        }
        const base = query ? parseFloat(query.get('base') || '0') : 0;
        const force = query && query.get('force') === '1';
        const curUpdated = getUpdatedAt();
        if (!force && base > 0 && curUpdated > base + 50 && fs.existsSync(DATA_FILE)) {
          return sendJson(res, 409, {
            ok: false,
            conflict: true,
            error: 'Plan was updated on another device',
            data: fs.readFileSync(DATA_FILE, 'utf8'),
            updatedAt: curUpdated,
            backups: listBackups(),
          });
        }
        backup();
        writeAtomic(DATA_FILE, text);
        return sendJson(res, 200, { ok: true, updatedAt: getUpdatedAt(), backups: listBackups() });
      })
      .catch((err) => sendJson(res, err.message === 'Payload too large' ? 413 : 500, { ok: false, error: err.message }));
  }

  if (req.method === 'POST' && reqPath === '/api/backups/restore') {
    return readBody(req)
      .then((text) => {
        let body;
        try {
          body = JSON.parse(text || '{}');
        } catch (e) {
          return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
        }
        const name = String(body.name || '').trim();
        if (!/^atlas-\d{8}-\d{4}\.json$/.test(name)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid backup filename' });
        }
        const target = path.join(BACKUPS_DIR, name);
        if (!fs.existsSync(target)) {
          return sendJson(res, 404, { ok: false, error: 'Backup not found' });
        }
        const raw = fs.readFileSync(target, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.terms) || !Array.isArray(parsed.courses)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid backup contents' });
        }
        backup();
        writeAtomic(DATA_FILE, raw);
        return sendJson(res, 200, { ok: true, data: raw, updatedAt: getUpdatedAt(), backups: listBackups() });
      })
      .catch((err) => sendJson(res, 500, { ok: false, error: err.message }));
  }

  if (req.method === 'GET' && reqPath === '/api/offerings/default') {
    if (!fs.existsSync(DEFAULT_CSV)) {
      return sendJson(res, 404, { ok: false, error: 'No default offerings file on server' });
    }
    const csv = fs.readFileSync(DEFAULT_CSV, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    return res.end(csv);
  }

  return sendJson(res, 404, { ok: false, error: 'API route not found' });
}

function serveStatic(req, res, reqPath) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }
  const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
  let filePath = path.resolve(APP_DIR, rel);
  if (filePath !== APP_DIR && !filePath.startsWith(APP_DIR + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(APP_DIR, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(500);
    return res.end('app/index.html missing — run npm run build:page');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).pipe(res);
}

seedFromWorkspace();

const server = http.createServer((req, res) => {
  const u = new URL(req.url || '/', 'http://localhost');
  const rawPath = u.pathname;
  const reqPath = rawPath.replace(/^\/atlas(?=\/|$)/, '') || '/';
  if (reqPath.startsWith('/api/')) {
    return handleApi(req, res, reqPath, u.searchParams);
  }
  return serveStatic(req, res, reqPath);
});

server.listen(PORT, HOST, () => {
  console.log(`Atlas server listening at http://${HOST}:${PORT}`);
});
