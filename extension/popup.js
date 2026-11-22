const DEFAULT_SERVER = 'https://starserver.tailbf777f.ts.net/atlas';
const srvEl = document.getElementById('srv');
const autoEl = document.getElementById('auto');
const statusEl = document.getElementById('status');
const syncAllBtn = document.getElementById('sync-all');
const syncCvBtn = document.getElementById('sync-cv');
const syncPscsBtn = document.getElementById('sync-pscs');
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

function setBusy(busy, label) {
  [syncAllBtn, syncCvBtn, syncPscsBtn, sendBtn].forEach((b) => { b.disabled = busy; });
  if (label) statusEl.textContent = label;
}

function runSync(type, label) {
  setBusy(true, label);
  chrome.runtime.sendMessage({ type }, (resp) => {
    setBusy(false);
    if (resp && resp.ok) {
      statusEl.textContent = (resp.res && resp.res.summary) || 'Synced!';
    } else {
      statusEl.textContent = 'Error: ' + ((resp && resp.error) || 'Could not sync. Make sure you are signed in.');
    }
  });
}

syncAllBtn.addEventListener('click', () => runSync('SYNC_ALL_NOW', 'Reading Canvas + PSCS (grades & live schedule)…'));
syncCvBtn.addEventListener('click', () => runSync('SYNC_CANVAS_NOW', 'Syncing from Canvas…'));
syncPscsBtn.addEventListener('click', () => runSync('SYNC_PSCS_NOW', 'Reading PSCS grades & live weekly schedule…'));

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
          Array.from(doc.querySelectorAll('table')).slice(0, 30).forEach((tb) => {
            const rows = Array.from(tb.rows).slice(0, 180).map((r) => Array.from(r.cells).map((c) => t(c.innerText).slice(0, 140)));
            if (rows.length) tables.push({ id: tb.id || '', rows });
          });
          if (doc.body && doc.body.innerText) texts.push(doc.body.innerText.slice(0, 30000));
        });
        const loc = location.hostname + ' ' + location.href;
        const kind = /stellic/i.test(loc) ? 'stellic' : /pscs|peoplesoft/i.test(loc) ? 'pscs' : 'syllabus';
        return JSON.stringify({ v: 2, kind, at: Date.now(), url: location.href, title: document.title, tables, text: texts.join('\n') });
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
