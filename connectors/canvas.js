// Runs inside the Canvas page, using your own signed-in session. It only reads.
(async () => {
  const J = async (u) => {
    let out = [];
    while (u) {
      const r = await fetch(u, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('Canvas answered ' + r.status);
      const t = (await r.text()).replace(/^while\(1\);/, '');
      out = out.concat(JSON.parse(t));
      const l = r.headers.get('Link'), m = l && l.match(/<([^>]+)>;\s*rel="next"/);
      u = m ? m[1] : null;
    }
    return out;
  };
  const cs = await J('/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term&per_page=100');
  const out = [];
  for (const c of cs) {
    if (!c.name) continue;
    const gs = await J('/api/v1/courses/' + c.id + '/assignment_groups?include[]=assignments&include[]=submission&per_page=100');
    out.push({
      id: c.id, name: c.name, code: c.course_code || '', term: (c.term || {}).name || '',
      teachers: (c.teachers || []).map((t) => t.display_name),
      groups: gs.map((g) => ({
        name: g.name, weight: g.group_weight || 0,
        items: (g.assignments || []).map((a) => {
          const s = a.submission || {};
          return { name: a.name, max: a.points_possible, due: a.due_at, score: s.score == null ? null : s.score,
            state: s.workflow_state || '', late: !!s.late, missing: !!s.missing, excused: !!s.excused };
        }),
      })),
    });
  }
  return JSON.stringify({ v: 1, courses: out });
})()
