// Atlas Companion content script: silently reads Canvas when signed in (at most once every 30 min),
// and responds to on-demand scrape requests from the popup.
(() => {
  const MIN_INTERVAL_MS = 30 * 60 * 1000;

  async function scrapeCanvas() {
    const fetchAll = async (u) => {
      let out = [];
      while (u) {
        const r = await fetch(u, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('Canvas HTTP ' + r.status);
        const text = (await r.text()).replace(/^while\(1\);/, '');
        out = out.concat(JSON.parse(text));
        const link = r.headers.get('Link');
        const m = link && link.match(/<([^>]+)>;\s*rel="next"/);
        u = m ? m[1] : null;
      }
      return out;
    };
    const selfCheck = await fetch('/api/v1/users/self', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!selfCheck.ok) return null;
    const cs = await fetchAll('/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term&per_page=100');
    const courses = [];
    for (const c of cs) {
      if (!c.name) continue;
      const gs = await fetchAll('/api/v1/courses/' + c.id + '/assignment_groups?include[]=assignments&include[]=submission&per_page=100');
      courses.push({
        id: c.id,
        name: c.name,
        code: c.course_code || '',
        term: (c.term || {}).name || '',
        teachers: (c.teachers || []).map((t) => t.display_name),
        groups: gs.map((g) => ({
          name: g.name,
          weight: g.group_weight || 0,
          items: (g.assignments || []).map((a) => {
            const s = a.submission || {};
            return {
              name: a.name,
              max: a.points_possible,
              due: a.due_at,
              score: s.score == null ? null : s.score,
              state: s.workflow_state || '',
              late: !!s.late,
              missing: !!s.missing,
              excused: !!s.excused,
            };
          }),
        })),
      });
    }
    return { v: 2, kind: 'canvas', at: Date.now(), courses };
  }

  async function maybeAutoSync() {
    try {
      const cfg = await chrome.storage.local.get(['lastAutoSync', 'autoEnabled']);
      if (cfg.autoEnabled === false) return;
      if (cfg.lastAutoSync && Date.now() - cfg.lastAutoSync < MIN_INTERVAL_MS) return;
      const payload = await scrapeCanvas();
      if (!payload || !payload.courses.length) return;
      await chrome.storage.local.set({ lastAutoSync: Date.now() });
      chrome.runtime.sendMessage({ type: 'ATLAS_CANVAS_DATA', payload });
    } catch (e) {}
  }

  maybeAutoSync();
})();
