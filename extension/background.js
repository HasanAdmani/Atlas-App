// Atlas Companion background service worker: read-only Canvas + PSCS sync to your private Atlas server.
const DEFAULT_SERVER = 'https://starserver.tailbf777f.ts.net/atlas';

const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, '0');
const dstr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const NC = (c) => String(c || '').toUpperCase().replace(/[\s\-_.]+/g, '');
const nn = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').replace(/([a-z])0+(\d)/g, '$1$2').replace(/parti$/, 'part1');
const cvBase = (n) => String(n || '').replace(/-[A-Za-z0-9,\s]*$/, '');
const KW = [['quiz', 'Quiz'], ['lab', 'Lab'], ['home', 'Assignment'], ['assign', 'Assignment'], ['hw', 'Assignment'], ['mid', 'Midterm'], ['test', 'Midterm'], ['exam', 'Final'], ['final', 'Final'], ['project', 'Project'], ['present', 'Project'], ['discuss', 'Assignment'], ['particip', 'Participation']];
const HABIB_SCALE = [['A+', 4, 95], ['A', 4, 90], ['A-', 3.67, 85], ['B+', 3.33, 80], ['B', 3, 75], ['B-', 2.67, 70], ['C+', 2.33, 67], ['C', 2, 63], ['C-', 1.67, 60], ['F', 0, 0]].map((x) => ({ l: x[0], p: x[1], min: x[2] }));

function cvGuessType(n) {
  const l = String(n).toLowerCase();
  for (const [k, ty] of KW) if (l.includes(k)) return ty;
  return 'Other';
}
function parseTermTok(s) {
  const m = String(s || '').match(/\b(Fall|Spring|Summer)\s+(\d{4})\b/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2] : '';
}
function termSortKey(name) {
  const m = String(name || '').match(/\b(Spring|Summer|Fall)\s+(\d{4})\b/i);
  if (!m) return 999999;
  const ord = { spring: 1, summer: 2, fall: 3 }[m[1].toLowerCase()] || 0;
  return parseInt(m[2], 10) * 10 + ord;
}
function ensureTerm(S, name, defaultStatus) {
  const nm = String(name || '').trim();
  if (!nm) return null;
  S.terms = S.terms || [];
  let t = S.terms.find((x) => String(x.name || '').toLowerCase() === nm.toLowerCase());
  if (!t) {
    t = { id: 't' + uid(), name: nm, status: defaultStatus || 'planned' };
    S.terms.push(t);
    S.terms.sort((a, b) => termSortKey(a.name) - termSortKey(b.name));
  }
  return t;
}
function guessCat(S, code) {
  const cats = (S.settings && S.settings.cats) || [];
  if (!cats.length) return 'core';
  const sub = (String(code || '').trim().match(/^([A-Za-z]+)/) || ['', ''])[1].toUpperCase();
  const findKey = (rxs) => {
    for (const rx of rxs) {
      const hit = cats.find((c) => rx.test((c.k || '') + ' ' + (c.n || '')));
      if (hit) return hit.k;
    }
    return '';
  };
  if (/^(CORE|HUM|HIST|URDU|ISLM|PHIL|ARAB|LIT|REL)$/.test(sub)) return findKey([/\bcore\b|habib|liberal/i, /\bgen/i]) || cats[0].k;
  if (/^(SOC|ANTH|ECON|POL|SDP|COM|CND|DES|ART)$/.test(sub)) return findKey([/\bgen/i, /hum|soc|design/i, /\belec/i, /\bcore\b/i]) || cats[0].k;
  if (/^(MATH|MTH|PHY|BIO|CHEM)$/.test(sub)) return findKey([/\bmath\b|science|computing/i, /\bmajor\b/i, /tech|eng/i]) || cats[0].k;
  if (/^(EE|CE|CS|ENGR|DS|ME)$/.test(sub)) return findKey([new RegExp('\\b' + sub + '\\b', 'i'), /\bmajor\b/i, /engineering|computing|tech/i]) || cats[0].k;
  return cats[0].k;
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
  let upd = 0, add = 0, crt = 0;
  S.courses = S.courses || [];
  S.terms = S.terms || [];
  S.settings = S.settings || {};
  S.links = S.links || { canvas: { at: 0, map: {} }, pscs: { at: 0 } };
  S.links.canvas = S.links.canvas || { at: 0, map: {} };
  S.links.canvas.map = S.links.canvas.map || {};

  if (!S.terms.length && (payload.courses || []).length) {
    S.settings.school = S.settings.school || 'Habib University';
    S.settings.program = S.settings.program || 'My Degree Plan';
    if (!S.settings.scale || !S.settings.scale.length) S.settings.scale = HABIB_SCALE.map((x) => Object.assign({}, x));
  }

  const byId = {};
  S.courses.forEach((c) => { byId[c.id] = c; });

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
    let c = byId[cid];
    if (!c && !S.courses.length) {
      const m = ((cv.code || '') + ' ' + (cv.name || '')).match(/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/i);
      const code = m ? (m[1] + ' ' + m[2]).toUpperCase() : String(cv.code || 'COURSE').slice(0, 14);
      const title = String(cvBase(cv.name || '') || cv.name || code).replace(new RegExp('^' + code.replace(/\s+/g, '\\s*[- ]?') + '\\s*[:\\-–—·]*\\s*', 'i'), '').trim() || code;
      const t = ensureTerm(S, parseTermTok(cv.term || cv.name || '') || 'Current Term', 'current');
      c = { id: uid(), code, title, credits: /\d{3}L\b|\blab\b/i.test(code + ' ' + title) ? 1 : 3, term: t ? t.id : null, cat: guessCat(S, code), prereqs: [], coreqs: [], grade: null, assess: [], notes: '', instructor: (cv.teachers || []).join(', '), canvasId: cv.id || '' };
      S.courses.push(c);
      byId[c.id] = c;
      crt++;
    }
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
  return { upd, add, crt };
}

/* ---------- Lightweight HTML table & text extractor for MV3 service worker (read-only) ---------- */
function decodeHtml(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}
function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function extractHtmlTables(html) {
  const tables = [];
  const tbRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tbRe.exec(html)) && tables.length < 40) {
    const rows = [];
    const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rm;
    while ((rm = trRe.exec(tm[1])) && rows.length < 200) {
      const cells = [];
      const tdRe = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cm;
      while ((cm = tdRe.exec(rm[1]))) cells.push(stripTags(cm[1]).slice(0, 140));
      if (cells.some(Boolean)) rows.push(cells);
    }
    if (rows.length) tables.push({ id: '', rows });
  }
  return { tables, text: stripTags(html).slice(0, 35000) };
}

function toMin(v) {
  const m = String(v || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  if (m[3]) {
    const p = m[3].toLowerCase();
    if (p === 'pm' && h < 12) h += 12;
    if (p === 'am' && h === 12) h = 0;
  }
  return h * 60 + (+m[2]);
}
function parseDays(str) {
  const s = String(str || '');
  const map = [[/\bMon(?:day)?\b|Mo/gi, 'M'], [/\bTue(?:sday)?\b|Tu/gi, 'T'], [/\bWed(?:nesday)?\b|We/gi, 'W'], [/\bThu(?:rsday)?\b|Th/gi, 'Th'], [/\bFri(?:day)?\b|Fr/gi, 'F'], [/\bSat(?:urday)?\b|Sa/gi, 'Sa'], [/\bSun(?:day)?\b|Su/gi, 'Su']];
  const out = [];
  map.forEach(([rx, d]) => { if (rx.test(s) && !out.includes(d)) out.push(d); });
  if (!out.length) {
    (s.match(/Th|Sa|Su|M|T|W|F/g) || []).forEach((d) => { if (!out.includes(d)) out.push(d); });
  }
  return out;
}

function applyPscsBundleToState(S, bundle) {
  S.courses = S.courses || [];
  S.terms = S.terms || [];
  S.settings = S.settings || {};
  S.links = S.links || { canvas: { at: 0, map: {} }, pscs: { at: 0 } };
  S.links.pscs = S.links.pscs || { at: 0 };

  const valid = new Set(['CR', 'NC', 'W', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']);
  const codeRe = /\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/i;
  const gradeTok = (s) => { const u = String(s || '').trim().toUpperCase(); return valid.has(u) ? u : ''; };
  let gradesUpd = 0, gradesCrt = 0;

  // 1. Apply Course History / Grades
  ((bundle.history && bundle.history.tables) || []).forEach((tb) => {
    (tb.rows || []).forEach((cells) => {
      let code = '', g = '';
      cells.forEach((cell) => {
        if (!code) { const m = cell.match(codeRe); if (m) code = (m[1] + ' ' + m[2]).toUpperCase(); }
        const gt = gradeTok(cell); if (gt) g = gt;
      });
      if (!code || !g) return;
      const rowText = cells.join(' ');
      const termGuess = parseTermTok(rowText);
      const key = NC(code);
      const cands = S.courses.filter((c) => NC(c.code) === key);
      if (cands.length) {
        const c = cands.find((x) => termGuess && S.terms.find((t) => t.id === x.term && t.name.toLowerCase() === termGuess.toLowerCase())) || cands[0];
        if (c && c.grade !== g) { c.grade = g; gradesUpd++; }
      } else if (termGuess) {
        const t = ensureTerm(S, termGuess, 'done');
        const crM = rowText.match(/\b([0-6](?:\.\d+)?)\s*(?:cr|credits?|units?)\b/i) || cells.map((x) => x.match(/^[0-6](?:\.0+)?$/)).find(Boolean);
        const cr = crM ? parseFloat(crM[1] || crM[0]) : 3;
        const title = cells.filter((c) => c && !codeRe.test(c) && !gradeTok(c) && !/^[0-6](?:\.0+)?$/.test(c) && !parseTermTok(c) && !/^(taken|transferred|in progress|enrolled)$/i.test(c)).sort((a, b) => b.length - a.length)[0] || code;
        S.courses.push({ id: uid(), code, title: title.slice(0, 80), credits: isNaN(cr) ? 3 : cr, term: t ? t.id : '', cat: guessCat(S, code), prereqs: [], coreqs: [], grade: g, assess: [], notes: '', instructor: '' });
        gradesCrt++;
      }
    });
  });

  // 2. Parse Live Weekly Schedule
  const schedItems = [];
  const byKey = {};
  const timeRe = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i;
  let curCode = '', curTitle = '', curSec = '', schedTerm = parseTermTok((bundle.schedule && bundle.schedule.text) || '') || '';
  const allSchedRows = ((bundle.schedule && bundle.schedule.tables) || []).flatMap((tb) => tb.rows || []);
  allSchedRows.forEach((cells) => {
    const joined = cells.join(' ');
    const cm = joined.match(codeRe);
    if (cm) {
      curCode = (cm[1] + ' ' + cm[2]).toUpperCase();
      const secM = joined.match(/\b([LSRTDC]\d{1,2})\b/);
      if (secM) curSec = secM[1];
      const tCell = cells.find((x) => x && !codeRe.test(x) && !timeRe.test(x) && x.length > 4 && !/^\d+$/.test(x));
      if (tCell) curTitle = tCell.slice(0, 80);
    }
    const tm = joined.match(timeRe);
    if (tm && curCode) {
      const a = toMin(tm[1]), b = toMin(tm[2]);
      const days = parseDays(joined.slice(0, tm.index + 12) + ' ' + joined);
      if (a != null && b != null && b > a && days.length) {
        const roomCell = cells.find((x) => /\b([A-Z]{1,3}-\d{2,4}|FF-[A-Z]\d{3}|GF-[A-Z]\d{3}|LG\d+|Room\s+\S+|Lab\s+\S+)\b/i.test(x)) || '';
        const k = curCode + '|' + (curSec || 'SEC');
        if (!byKey[k]) {
          byKey[k] = { code: curCode, title: curTitle || curCode, sec: curSec || '', ins: '', meets: [] };
          schedItems.push(byKey[k]);
        }
        days.forEach((d) => {
          if (!byKey[k].meets.some((m) => m.d === d && m.s === a && m.e === b)) {
            byKey[k].meets.push({ d, s: a, e: b, r: roomCell.slice(0, 32) });
          }
        });
      }
    }
  });
  if (schedItems.length) {
    S.schedule = { at: Date.now(), term: schedTerm || 'Current Term', source: 'pscs', items: schedItems };
  }
  S.links.pscs.at = Date.now();
  return { gradesUpd, gradesCrt, schedCount: schedItems.length };
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
  if (!selfRes.ok) throw new Error('Not signed in to Canvas');
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

async function fetchPscsFromBackground() {
  const prefix = 'https://pscs.habib.edu.pk/psc/CSPROD/EMPLOYEE/SA/c/';
  const getComp = async (comp) => {
    try {
      const r = await fetch(prefix + comp, { credentials: 'include' });
      if (!r.ok) return null;
      const html = await r.text();
      if (!html || (/sign\s*in|ps_login|userid/i.test(html.slice(0, 4000)) && !/<table/i.test(html))) return null;
      return extractHtmlTables(html);
    } catch (e) {
      return null;
    }
  };
  const [histClassic, histFluid, gradesClassic, schedList, schedGrid, schedFluid] = await Promise.all([
    getComp('SA_LEARNER_SERVICES.SSS_MY_CRSEHIST.GBL'),
    getComp('SSR_STUDENT_FL.SSR_CRSE_HIST_FL.GBL'),
    getComp('SA_LEARNER_SERVICES.SSR_SSENRL_GRADE.GBL'),
    getComp('SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL'),
    getComp('SA_LEARNER_SERVICES.SSR_SSENRL_SCHD_W.GBL'),
    getComp('SSR_STUDENT_FL.SSR_VW_CLASS_FL.GBL'),
  ]);
  const validAny = [histClassic, histFluid, gradesClassic, schedList, schedGrid, schedFluid].filter(Boolean);
  if (!validAny.length) throw new Error('Not signed in to PSCS');
  const merge = (arr) => {
    const v = arr.filter(Boolean);
    return { tables: v.flatMap((x) => x.tables || []), text: v.map((x) => x.text || '').join('\n') };
  };
  return {
    v: 2,
    kind: 'pscs-bundle',
    at: Date.now(),
    history: merge([histClassic, histFluid, gradesClassic]),
    schedule: merge([schedList, schedGrid, schedFluid]),
  };
}

async function loadAtlasStore() {
  const cfg = await chrome.storage.local.get(['atlasServerUrl']);
  const srv = (cfg.atlasServerUrl || DEFAULT_SERVER).replace(/\/+$/, '');
  const getRes = await fetch(srv + '/api/store', { cache: 'no-store' });
  const getJson = await getRes.json();
  if (!getRes.ok || !getJson) throw new Error('Could not reach Atlas server');
  const S = getJson.data ? JSON.parse(getJson.data) : { v: 6, settings: {}, terms: [], courses: [], minors: [], links: {} };
  return { srv, S, updatedAt: getJson.updatedAt || 0 };
}
async function saveAtlasStore(srv, S, updatedAt) {
  const postRes = await fetch(srv + '/api/store?base=' + encodeURIComponent(updatedAt || 0), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(S),
  });
  const postJson = await postRes.json();
  if (!postRes.ok || !postJson.ok) throw new Error((postJson && postJson.error) || 'Failed to save to Atlas server');
}

async function syncCanvasToAtlas(payload) {
  const { srv, S, updatedAt } = await loadAtlasStore();
  const res = applyCanvasToState(S, payload);
  await saveAtlasStore(srv, S, updatedAt);
  const summary = `Canvas: ${res.crt ? res.crt + ' new, ' : ''}${res.upd} upd, ${res.add} added`;
  await chrome.storage.local.set({ lastSyncAt: Date.now(), lastSyncStatus: summary });
  return Object.assign({ summary }, res);
}

async function syncPscsToAtlas() {
  const bundle = await fetchPscsFromBackground();
  const { srv, S, updatedAt } = await loadAtlasStore();
  const res = applyPscsBundleToState(S, bundle);
  await saveAtlasStore(srv, S, updatedAt);
  const summary = `PSCS: ${res.gradesUpd + res.gradesCrt} grades, ${res.schedCount} classes`;
  await chrome.storage.local.set({ lastSyncAt: Date.now(), lastSyncStatus: summary });
  return Object.assign({ summary }, res);
}

async function syncAllToAtlas() {
  const { srv, S, updatedAt } = await loadAtlasStore();
  const parts = [];
  const errors = [];
  try {
    const cvPayload = await fetchCanvasFromBackground();
    const r = applyCanvasToState(S, cvPayload);
    parts.push(`Canvas (${r.crt ? r.crt + ' new, ' : ''}${r.upd} upd, ${r.add} items)`);
  } catch (e) {
    errors.push(e.message || 'Canvas unavailable');
  }
  try {
    const pscsBundle = await fetchPscsFromBackground();
    const r = applyPscsBundleToState(S, pscsBundle);
    parts.push(`PSCS (${r.gradesUpd + r.gradesCrt} grades, ${r.schedCount} live classes)`);
  } catch (e) {
    errors.push(e.message || 'PSCS unavailable');
  }
  if (!parts.length) throw new Error(errors.join(' · ') || 'Sign in to Canvas or PSCS first');
  await saveAtlasStore(srv, S, updatedAt);
  const summary = parts.join(' · ') + (errors.length ? ` (skipped: ${errors.join(', ')})` : '');
  await chrome.storage.local.set({ lastSyncAt: Date.now(), lastSyncStatus: summary });
  return { summary, parts, errors };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return false;
  if (msg.type === 'ATLAS_CANVAS_DATA' && msg.payload) {
    syncCanvasToAtlas(msg.payload)
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  if (msg.type === 'SYNC_CANVAS_NOW') {
    fetchCanvasFromBackground()
      .then((payload) => syncCanvasToAtlas(payload))
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  if (msg.type === 'SYNC_PSCS_NOW') {
    syncPscsToAtlas()
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  if (msg.type === 'SYNC_ALL_NOW') {
    syncAllToAtlas()
      .then((res) => sendResponse({ ok: true, res }))
      .catch(async (err) => {
        await chrome.storage.local.set({ lastSyncStatus: 'Error: ' + err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  return false;
});
