// Atlas Companion background service worker: syncs Canvas payloads directly to Atlas /api/store.
const DEFAULT_SERVER = 'https://starserver.tailbf777f.ts.net/atlas';

const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, '0');
const dstr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const nn = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').replace(/([a-z])0+(\d)/g, '$1$2').replace(/parti$/, 'part1');
const cvBase = (n) => String(n || '').replace(/-[A-Za-z0-9,\s]*$/, '');
const KW = [['quiz', 'Quiz'], ['lab', 'Lab'], ['home', 'Assignment'], ['assign', 'Assignment'], ['hw', 'Assignment'], ['mid', 'Midterm'], ['test', 'Midterm'], ['exam', 'Final'], ['final', 'Final'], ['project', 'Project'], ['present', 'Project'], ['discuss', 'Assignment'], ['particip', 'Participation']];

function cvGuessType(n) {
  const l = String(n).toLowerCase();
  for (const [k, ty] of KW) if (l.includes(k)) return ty;
  return 'Other';
}

function matchCourse(S, cv) {
  const mapped = S.links && S.links.canvas && S.links.canvas.map && S.links.canvas.map[cv.id];
  if (mapped && (S.courses || []).some((c) => c.id === mapped)) return mapped;
  const termById = {};
  (S.terms || []).forEach((t) => { termById[t.id] = t; });
  const b = nn(cvBase(cv.name)), code = nn(cv.code);
  let best = '', bs = 0;
  (S.courses || []).forEach((c) => {
    let sc = 0;
    const t = nn(c.title);
    if (b && t === b) sc = 100;
    else if (b && (t.startsWith(b) || b.startsWith(t)) && Math.abs(t.length - b.length) <= 6) sc = 60;
    if (code && nn(c.code) && code.includes(nn(c.code))) sc = Math.max(sc, 80);
    if (sc > 0 && termById[c.term] && termById[c.term].status === 'current') sc += 5;
    if (sc > bs) { bs = sc; best = c.id; }
  });
  return bs >= 60 ? best : '';
}

function applyCanvasToState(S, payload) {
  let upd = 0, add = 0;
  S.links = S.links || { canvas: { at: 0, map: {} }, pscs: { at: 0 } };
  S.links.canvas = S.links.canvas || { at: 0, map: {} };
  S.links.canvas.map = S.links.canvas.map || {};
  const byId = {};
  (S.courses || []).forEach((c) => { byId[c.id] = c; });

  const cvItem = (a) => {
    const sc = a.score == null ? null : +a.score;
    return {
      id: uid(),
      n: String(a.name || '').replace(/[\u{1F000}-\u{1FAFF}☀-➿]/gu, '').trim() || 'Item',
      s: sc,
      m: a.max == null ? null : +a.max,
      due: a.due ? dstr(new Date(a.due)) : '',
      st: a.excused ? 'excused' : sc != null ? '' : (a.state === 'submitted' || a.state === 'pending_review') ? 'submitted' : a.missing ? 'missing' : '',
      late: !!a.late,
    };
  };

  const cvFind = (c, name) => {
    const k = nn(name.replace(/[\u{1F000}-\u{1FAFF}☀-➿]/gu, ''));
    const kk = k === 'oel' ? 'openendedlab' : k;
    for (const g of c.assess || []) for (const it of g.items || []) if (nn(it.n) === kk) return it;
    return null;
  };

  const cvGroup = (c, name) => {
    const n = name.toLowerCase();
    let best = null, bs = 0;
    (c.assess || []).forEach((g) => {
      let sc = 0;
      const gn = String(g.n).toLowerCase();
      KW.forEach(([k, ty]) => { if (n.includes(k)) { if (gn.includes(k)) sc += 3; if (g.type === ty) sc += 1; } });
      if (sc > bs) { bs = sc; best = g; }
    });
    return bs >= 3 ? best : null;
  };

  (payload.courses || []).forEach((cv) => {
    const cid = matchCourse(S, cv);
    const c = byId[cid];
    if (!c) return;
    if (cv.id) { S.links.canvas.map[cv.id] = c.id; c.canvasId = cv.id; }
    if (!c.instructor && cv.teachers && cv.teachers.length) c.instructor = cv.teachers.join(', ');
    if (!(c.assess || []).length) {
      c.assess = (cv.groups || []).filter((g) => g.items.length).map((g) => ({
        id: uid(), n: g.name, type: cvGuessType(g.name), w: +g.weight || 0, cnt: g.items.length, drop: 0, items: g.items.map(cvItem),
      }));
      add += c.assess.reduce((a, g) => a + g.items.length, 0);
      return;
    }
    (cv.groups || []).forEach((g) => (g.items || []).forEach((a) => {
      const it = cvItem(a), old = cvFind(c, a.name);
      if (old) {
        old.s = it.s != null ? it.s : old.s;
        old.m = it.m != null ? it.m : old.m;
        old.due = it.due || old.due;
        old.st = it.s != null ? '' : it.st || old.st;
        old.late = it.late;
        upd++;
      } else {
        let grp = cvGroup(c, a.name);
        if (!grp) {
          grp = c.assess.find((x) => x.n === 'Unsorted from Canvas');
          if (!grp) { grp = { id: uid(), n: 'Unsorted from Canvas', type: 'Other', w: 0, cnt: 1, drop: 0, items: [] }; c.assess.push(grp); }
        }
        grp.items.push(it);
        add++;
      }
    }));
  });

  S.links.canvas.at = Date.now();
  return { upd, add };
}

async function fetchCanvasFromBackground() {
  const fetchAll = async (u) => {
    let out = [];
    while (u) {
      const r = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('Canvas HTTP ' + r.status);
      const text = (await r.text()).replace(/^while\(1\);/, '');
      out = out.concat(JSON.parse(text));
      const link = r.headers.get('Link');
      const m = link && link.match(/<([^>]+)>;\s*rel="next"/);
      u = m ? m[1] : null;
    }
    return out;
  };
  const selfRes = await fetch('https://hulms.instructure.com/api/v1/users/self', { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!selfRes.ok) throw new Error('Not signed in to Canvas in this browser');
  const cs = await fetchAll('https://hulms.instructure.com/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term&per_page=100');
  const courses = [];
  for (const c of cs) {
    if (!c.name) continue;
    const gs = await fetchAll('https://hulms.instructure.com/api/v1/courses/' + c.id + '/assignment_groups?include[]=assignments&include[]=submission&per_page=100');
    courses.push({
      id: c.id, name: c.name, code: c.course_code || '', term: (c.term || {}).name || '',
      teachers: (c.teachers || []).map((t) => t.display_name),
      groups: gs.map((g) => ({
        name: g.name, weight: g.group_weight || 0,
        items: (g.assignments || []).map((a) => {
          const s = a.submission || {};
          return { name: a.name, max: a.points_possible, due: a.due_at, score: s.score == null ? null : s.score, state: s.workflow_state || '', late: !!s.late, missing: !!s.missing, excused: !!s.excused };
        }),
      })),
    });
  }
  return { v: 2, kind: 'canvas', at: Date.now(), courses };
}

async function syncToAtlas(payload) {
  const cfg = await chrome.storage.local.get(['atlasServerUrl']);
  const srv = (cfg.atlasServerUrl || DEFAULT_SERVER).replace(/\/+$/, '');
  const getRes = await fetch(srv + '/api/store', { cache: 'no-store' });
  const getJson = await getRes.json();
  if (!getRes.ok || !getJson || !getJson.data) throw new Error('Could not load plan from Atlas server');
  const S = JSON.parse(getJson.data);
  const res = applyCanvasToState(S, payload);
  const postRes = await fetch(srv + '/api/store?base=' + encodeURIComponent(getJson.updatedAt || 0), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(S),
  });
  const postJson = await postRes.json();
  if (!postRes.ok || !postJson.ok) throw new Error((postJson && postJson.error) || 'Failed to save to Atlas server');
  await chrome.storage.local.set({
    lastSyncAt: Date.now(),
    lastSyncStatus: `Synced: ${res.upd} updated, ${res.add} added`,
  });
  return res;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return false;
  if (msg.type === 'ATLAS_CANVAS_DATA' && msg.payload) {
    syncToAtlas(msg.payload)
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  if (msg.type === 'SYNC_CANVAS_NOW') {
    fetchCanvasFromBackground()
      .then((payload) => syncToAtlas(payload))
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  return false;
});
