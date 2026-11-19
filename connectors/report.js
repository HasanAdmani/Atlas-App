// Describes the page that is open (including accessible same-origin iframes): headings, tables, fields, buttons, links and text. Field values are never included.
(() => {
  const t = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const docs = [document];
  Array.from(document.querySelectorAll('iframe')).forEach((f) => {
    try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
  });
  const q = (sel) => docs.flatMap((d) => Array.from(d.querySelectorAll(sel)));
  return JSON.stringify({
    v: 2,
    url: location.origin + location.pathname,
    title: document.title,
    headings: q('h1,h2,h3,h4').slice(0, 60).map((h) => t(h.innerText).slice(0, 120)),
    tables: q('table').slice(0, 30).map((tb) => ({
      id: tb.id || '',
      class: String(tb.className || '').slice(0, 80),
      rows: Array.from(tb.rows).slice(0, 150).map((r) => Array.from(r.cells).map((c) => t(c.innerText).slice(0, 100))),
      totalRows: tb.rows.length,
    })),
    fields: q('input,select,textarea').slice(0, 80).map((f) => ({
      tag: f.tagName.toLowerCase(), type: f.type || '', name: f.name || '', id: f.id || '',
      label: t((f.labels && f.labels[0] && f.labels[0].innerText) || f.getAttribute('aria-label') || f.placeholder || '').slice(0, 80),
    })),
    buttons: q('button,[role=button],input[type=submit]').slice(0, 80).map((b) => t(b.innerText || b.value).slice(0, 60)).filter(Boolean),
    links: q('a[href]').slice(0, 100).map((a) => ({ text: t(a.innerText).slice(0, 60), path: String(a.getAttribute('href') || '').split('?')[0].slice(0, 100) })),
    frames: Array.from(document.querySelectorAll('iframe')).slice(0, 15).map((f) => (f.src || '').split('?')[0]),
    text: docs.map((d) => (d.body ? t(d.body.innerText) : '')).filter(Boolean).join('\n').slice(0, 24000),
  }, null, 1);
})()
