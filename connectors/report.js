// Describes the page that is open: headings, tables, fields, buttons, links and text. Field values are not included.
(() => {
  const t = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const q = (sel) => Array.from(document.querySelectorAll(sel));
  return JSON.stringify({
    url: location.origin + location.pathname,
    title: document.title,
    headings: q('h1,h2,h3,h4').slice(0, 40).map((h) => t(h.innerText).slice(0, 120)),
    tables: q('table').slice(0, 20).map((tb) => ({
      id: tb.id, class: String(tb.className).slice(0, 80),
      rows: Array.from(tb.rows).slice(0, 10).map((r) => Array.from(r.cells).map((c) => t(c.innerText).slice(0, 80))),
      totalRows: tb.rows.length,
    })),
    fields: q('input,select,textarea').slice(0, 60).map((f) => ({
      tag: f.tagName.toLowerCase(), type: f.type || '', name: f.name || '', id: f.id || '',
      label: t((f.labels && f.labels[0] && f.labels[0].innerText) || f.getAttribute('aria-label') || f.placeholder || '').slice(0, 80),
    })),
    buttons: q('button,[role=button],input[type=submit]').slice(0, 60).map((b) => t(b.innerText || b.value).slice(0, 60)).filter(Boolean),
    links: q('a[href]').slice(0, 80).map((a) => ({ text: t(a.innerText).slice(0, 60), path: a.getAttribute('href').split('?')[0].slice(0, 100) })),
    frames: q('iframe').slice(0, 10).map((f) => (f.src || '').split('?')[0]),
    text: t(document.body.innerText).slice(0, 6000),
  }, null, 1);
})()
