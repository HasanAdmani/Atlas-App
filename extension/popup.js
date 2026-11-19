const DEFAULT_SERVER = 'https://starserver.tailbf777f.ts.net/atlas';
const srvEl = document.getElementById('srv');
const autoEl = document.getElementById('auto');
const statusEl = document.getElementById('status');
const syncBtn = document.getElementById('sync-cv');
const sendBtn = document.getElementById('send-tab');
const openBtn = document.getElementById('open-atlas');

async function loadState() {
  const st = await chrome.storage.local.get(['atlasServerUrl', 'autoEnabled', 'lastSyncAt', 'lastSyncStatus']);
  srvEl.value = st.atlasServerUrl || DEFAULT_SERVER;
  autoEl.checked = st.autoEnabled !== false;
  if (st.lastSyncStatus) {
    const when = st.lastSyncAt ? ' (' + new Date(st.lastSyncAt).toLocaleTimeString() + ')' : '';
    statusEl.textContent = st.lastSyncStatus + when;
  }
}

srvEl.addEventListener('change', () => {
  chrome.storage.local.set({ atlasServerUrl: srvEl.value.trim().replace(/\/+$/, '') || DEFAULT_SERVER });
});
autoEl.addEventListener('change', () => {
  chrome.storage.local.set({ autoEnabled: autoEl.checked });
});

syncBtn.addEventListener('click', () => {
  syncBtn.disabled = true;
  statusEl.textContent = 'Syncing from Canvas…';
  chrome.runtime.sendMessage({ type: 'SYNC_CANVAS_NOW' }, (resp) => {
    syncBtn.disabled = false;
    if (resp && resp.ok) {
      statusEl.textContent = `Synced: ${resp.res.upd} updated, ${resp.res.add} added`;
    } else {
      statusEl.textContent = 'Error: ' + ((resp && resp.error) || 'Could not sync');
    }
  });
});

sendBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  const srv = (srvEl.value.trim().replace(/\/+$/, '') || DEFAULT_SERVER) + '/';
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const docs = [document];
        Array.from(document.querySelectorAll('iframe')).forEach((f) => {
          try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
        });
        const t = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const tables = [], texts = [];
        docs.forEach((doc) => {
          Array.from(doc.querySelectorAll('table')).slice(0, 25).forEach((tb) => {
            const rows = Array.from(tb.rows).slice(0, 150).map((r) => Array.from(r.cells).map((c) => t(c.innerText).slice(0, 120)));
            if (rows.length) tables.push({ id: tb.id || '', rows });
          });
          if (doc.body && doc.body.innerText) texts.push(doc.body.innerText.slice(0, 20000));
        });
        const kind = /pscs|peoplesoft/i.test(location.href) ? 'pscs' : 'syllabus';
        return JSON.stringify({ v: 2, kind, at: Date.now(), url: location.origin + location.pathname, title: document.title, tables, text: texts.join('\n') });
      },
    });
    const b64 = btoa(unescape(encodeURIComponent(result))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    chrome.tabs.create({ url: srv + '#import/' + b64 });
  } catch (e) {
    statusEl.textContent = 'Error reading tab: ' + e.message;
  }
});

openBtn.addEventListener('click', () => {
  const srv = (srvEl.value.trim().replace(/\/+$/, '') || DEFAULT_SERVER) + '/';
  chrome.tabs.create({ url: srv });
});

loadState();
