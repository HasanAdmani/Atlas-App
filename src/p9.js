
/* ---------- desktop & web server host bridge ---------- */
const DESKTOP_HOST=window.atlasHost||null;
const IS_WEB=!DESKTOP_HOST&&typeof location!=='undefined'&&/^https?:$/i.test(location.protocol);
const WEB_BASE=(()=>{
  if(!IS_WEB)return'';
  if(location.pathname==='/atlas'){
    try{history.replaceState(null,'','/atlas/'+location.search+location.hash)}catch(e){}
    return'/atlas';
  }
  return location.pathname.replace(/\/index\.html$/i,'').replace(/\/+$/,'');
})();
let HC={};

async function webFetchJson(url,opts){
  const r=await fetch(url,Object.assign({cache:'no-store'},opts||{}));
  const j=await r.json().catch(()=>null);
  if(!r.ok||!j||j.ok===false)throw new Error((j&&j.error)||('HTTP '+r.status));
  return j;
}

const WEB_HOST=IS_WEB?{
  async config(){return{mode:'web',base:WEB_BASE,backups:HC.backups||[],updatedAt:HC.updatedAt||0}},
  async load(){
    const j=await webFetchJson(WEB_BASE+'/api/store');
    HC.backups=j.backups||[];HC.updatedAt=j.updatedAt||0;
    return j.data||null;
  },
  async save(text){
    const j=await webFetchJson(WEB_BASE+'/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:text});
    HC.updatedAt=j.updatedAt||Date.now();
    if(j.backups)HC.backups=j.backups;
    return true;
  },
  saveSync(text){
    try{return !!(navigator.sendBeacon&&navigator.sendBeacon(WEB_BASE+'/api/store',new Blob([text],{type:'application/json'})))}catch(e){return false}
  },
  async restoreBackup(name){
    const j=await webFetchJson(WEB_BASE+'/api/backups/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
    HC.updatedAt=j.updatedAt||Date.now();
    HC.backups=j.backups||HC.backups||[];
    return j.data;
  },
}:null;

const HOST=DESKTOP_HOST||WEB_HOST;

const hostCanvasCard=()=>DESKTOP_HOST?`<div class="card" style="margin-bottom:16px"><h2>Sign in and sync</h2><p class="small muted" style="margin:-6px 0 12px">Atlas opens ${esc(HC.canvasUrl||'your Canvas')} in its own window. Sign in the way you normally do. Atlas then reads your courses, scores and due dates, and the window closes. Your password is never stored.</p><div class="row"><button class="btn primary" data-a="hostcanvas">${U.hostBusy==='canvas'?'Waiting for you to sign in…':'Sign in to Canvas'}</button></div></div>`:'';
const hostCard=()=>`<div class="sec"><h2>This computer</h2><div class="card">
  <div class="small muted" style="margin-bottom:12px">Your plan is saved in a file on this computer, with a backup copy kept at most once an hour.<br><span class="mono">${esc(HC.dataPath||'')}</span></div>
  <div class="row" style="margin-bottom:18px"><button class="btn" data-a="hostfolder">Open the data folder</button></div>
  <h3 style="margin-bottom:8px">Portals</h3>
  <div class="fgrid"><label class="f"><span>Canvas address</span><input data-c="hostcfg" data-f="canvasUrl" value="${esc(HC.canvasUrl||'')}" placeholder="https://hulms.instructure.com"></label><label class="f"><span>PSCS address</span><input data-c="hostcfg" data-f="pscsUrl" value="${esc(HC.pscsUrl||'')}" placeholder="https://…"></label><label class="f"><span>Simple Syllabus address</span><input data-c="hostcfg" data-f="syllabusUrl" value="${esc(HC.syllabusUrl||'')}" placeholder="https://…"></label></div>
  <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn" data-a="hostopen" data-v="pscs">Open PSCS</button><button class="btn" data-a="hostopen" data-v="syllabus">Open Simple Syllabus</button><button class="btn" data-a="hostreport" data-v="pscs">Save a PSCS page report</button><button class="btn" data-a="hostreport" data-v="syllabus">Save a Simple Syllabus page report</button></div>
  <p class="small muted" style="margin:10px 0 0">A page report lists the headings, tables, buttons and fields on the page you have open in that window, plus the text on it. It is how new importers get written. It can contain your grades or name, so read it and remove anything private before sharing it.</p></div></div>`;

const fmtBackupOpt=b=>{
  const dt=b.mtimeMs?new Date(b.mtimeMs).toLocaleString():b.name;
  const kb=b.size?Math.round(b.size/1024)+' KB':'';
  return`<option value="${esc(b.name)}">${esc(b.name)} · ${esc(dt)}${kb?' ('+kb+')':''}</option>`;
};
const webServerCard=()=>{
  const bks=HC.backups||[];
  const ts=HC.updatedAt?new Date(HC.updatedAt).toLocaleString():'Not synced yet';
  return`<div class="sec"><h2>Server &amp; multi-device sync</h2><div class="card">
    <div class="row between" style="margin-bottom:12px;align-items:flex-start">
      <div><h3 style="margin-bottom:4px">Connected to Atlas Server</h3><div class="small muted">Changes sync automatically across your phone and computer. Last server save: <span class="mono">${esc(ts)}</span></div></div>
      <button class="btn soft sm" data-a="websync">Sync now</button>
    </div>
    <div class="small muted" style="padding:10px 12px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;margin-bottom:14px">
      <b>Install as an app (PWA):</b> On iPhone/iPad Safari tap <b>Share → Add to Home Screen</b>. On Android or Desktop Chrome/Edge open the browser menu and select <b>Install Atlas</b>.
    </div>
    ${bks.length?`<div class="row"><select id="web-bk" aria-label="Hourly server backup" style="flex:1;min-width:220px">${bks.map(fmtBackupOpt).join('')}</select><button class="btn" data-a="webrestore">Restore server backup</button></div>`:'<div class="small muted">Hourly server backups will appear here automatically once edits are saved.</div>'}
  </div></div>`;
};

if(DESKTOP_HOST){
  Object.assign(ACT2,{
    async hostcanvas(){if(U.hostBusy)return;U.hostBusy='canvas';U.cvErr='';render();
      try{U.cvText=await DESKTOP_HOST.canvasExport();U.hostBusy='';ACT2.cvread()}
      catch(e){U.hostBusy='';U.cvErr=String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,'');render()}},
    hostopen(e,d){DESKTOP_HOST.openPortal(d.v).catch(x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostreport(e,d){DESKTOP_HOST.pageReport(d.v).then(r=>toast(r&&r.saved?'Report saved':'Nothing was saved'),x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostfolder(){DESKTOP_HOST.openDataFolder()},
  });
  Object.assign(CHG2,{hostcfg(e,d,v){HC[d.f]=v.trim();DESKTOP_HOST.setConfig({[d.f]:v.trim()}).then(c=>{HC=c})}});
  window.addEventListener('beforeunload',()=>{if(U.touched&&DESKTOP_HOST.saveSync)try{DESKTOP_HOST.saveSync(JSON.stringify(S))}catch(e){}});
  const _vs=vSettings;vSettings=function(){return _vs()+hostCard()};
}else if(WEB_HOST){
  if(typeof navigator!=='undefined'&&'serviceWorker' in navigator){
    try{navigator.serviceWorker.register((WEB_BASE||'')+'/sw.js').catch(()=>{})}catch(e){}
  }
  Object.assign(ACT2,{
    async websync(){
      try{
        const j=await webFetchJson(WEB_BASE+'/api/store');
        HC.backups=j.backups||[];
        if(j.data&&(!HC.updatedAt||j.updatedAt>HC.updatedAt)){
          HC.updatedAt=j.updatedAt;
          const o=JSON.parse(j.data);
          if(o&&Array.isArray(o.terms)&&!o.sample){adopt(o);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
        }else{
          await WEB_HOST.save(JSON.stringify(S));
        }
        setSync('Synced with server');render();toast('Synced with server');
      }catch(e){setSync('Saved on device (offline)');toast('Could not reach server')}
    },
    async webrestore(){
      const sel=val('web-bk');if(!sel)return;
      try{
        const raw=await WEB_HOST.restoreBackup(sel);
        const o=JSON.parse(raw);
        if(o&&Array.isArray(o.terms)){adopt(o);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}setSync('Synced with server');render();toast('Restored '+sel)}
      }catch(e){toast('Could not restore backup')}
    },
  });
  document.addEventListener('visibilitychange',async()=>{
    if(document.visibilityState!=='visible'||U.hostBusy||timer)return;
    try{
      const j=await webFetchJson(WEB_BASE+'/api/store');
      HC.backups=j.backups||HC.backups||[];
      if(j.data&&j.updatedAt&&j.updatedAt>(HC.updatedAt||0)&&!timer){
        HC.updatedAt=j.updatedAt;
        const o=JSON.parse(j.data);
        if(o&&Array.isArray(o.terms)&&!o.sample){
          adopt(o);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
          setSync('Synced with server');render();
        }
      }
    }catch(e){}
  });
  window.addEventListener('beforeunload',()=>{if(U.touched&&WEB_HOST.saveSync)try{WEB_HOST.saveSync(JSON.stringify(S))}catch(e){}});
  const _vs=vSettings;vSettings=function(){return _vs()+webServerCard()};
}