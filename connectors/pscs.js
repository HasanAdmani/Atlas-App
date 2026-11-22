// Runs inside the PSCS page using your own signed-in session. Strictly read-only (GET only).
(async () => {
  const origin = location.origin;
  const baseMatch = location.pathname.match(/^\/(psc|psp)\/([^/]+)\/([^/]+)\/([^/]+)/i);
  const site = baseMatch ? baseMatch[2] : 'CSPROD';
  const portal = baseMatch ? baseMatch[3] : 'EMPLOYEE';
  const node = baseMatch ? baseMatch[4] : 'SA';
  const prefix = `${origin}/psc/${site}/${portal}/${node}/c/`;

  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const extractDoc = (doc, url) => {
    const tables = [];
    const texts = [];
    if (!doc) return { url, title: '', tables, text: '' };
    Array.from(doc.querySelectorAll('table')).slice(0, 35).forEach((tb) => {
      const rows = Array.from(tb.rows || [])
        .slice(0, 200)
        .map((r) => Array.from(r.cells || []).map((c) => clean(c.innerText || c.textContent).slice(0, 140)))
        .filter((r) => r.some(Boolean));
      if (rows.length) tables.push({ id: tb.id || '', rows });
    });
    if (doc.body) texts.push(clean(doc.body.innerText || doc.body.textContent).slice(0, 35000));
    return { url, title: doc.title || '', tables, text: texts.join('\n') };
  };

  const fetchPage = async (comp) => {
    const url = prefix + comp;
    try {
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok) return null;
      const html = await r.text();
      if (!html || /sign\s*in|ps_login|userid/i.test(html.slice(0, 4000)) && !/<table/i.test(html)) return null;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return extractDoc(doc, url);
    } catch (e) {
      return null;
    }
  };

  const mergePages = (pages) => {
    const valid = pages.filter(Boolean);
    return {
      url: valid[0] ? valid[0].url : location.href,
      title: valid[0] ? valid[0].title : document.title,
      tables: valid.flatMap((p) => p.tables || []),
      text: valid.map((p) => p.text || '').filter(Boolean).join('\n'),
    };
  };

  // Current document + same-origin iframes (in case user already navigated to a specific page)
  const curDocs = [document];
  Array.from(document.querySelectorAll('iframe')).forEach((f) => {
    try { if (f.contentDocument) curDocs.push(f.contentDocument); } catch (e) {}
  });
  const activePages = curDocs.map((d) => extractDoc(d, location.href));

  // Read-only fetch of standard PeopleSoft Campus Solutions pages
  const [histClassic, histFluid, gradesClassic, schedList, schedGrid, schedFluid] = await Promise.all([
    fetchPage('SA_LEARNER_SERVICES.SSS_MY_CRSEHIST.GBL'),
    fetchPage('SSR_STUDENT_FL.SSR_CRSE_HIST_FL.GBL'),
    fetchPage('SA_LEARNER_SERVICES.SSR_SSENRL_GRADE.GBL'),
    fetchPage('SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL'),
    fetchPage('SA_LEARNER_SERVICES.SSR_SSENRL_SCHD_W.GBL'),
    fetchPage('SSR_STUDENT_FL.SSR_VW_CLASS_FL.GBL'),
  ]);

  const history = mergePages([histClassic, histFluid, gradesClassic, ...activePages]);
  const schedule = mergePages([schedList, schedGrid, schedFluid, ...activePages]);

  return JSON.stringify({
    v: 2,
    kind: 'pscs-bundle',
    at: Date.now(),
    url: location.href,
    title: document.title,
    history,
    schedule,
    tables: history.tables,
    text: history.text,
  });
})();
