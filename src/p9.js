
/* ---------- desktop & web server host bridge ---------- */
const DESKTOP_HOST=window.atlasHost?Object.assign({},window.atlasHost):null;
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
  async save(text,force){
    const url=WEB_BASE+'/api/store?base='+encodeURIComponent(HC.updatedAt||0)+(force?'&force=1':'');
    const r=await fetch(url,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:text});
    const j=await r.json().catch(()=>null);
    if(r.status===409&&j&&j.conflict){
      U.conflict={data:j.data,updatedAt:j.updatedAt};
      if(j.backups)HC.backups=j.backups;
      setSync('Conflict — newer save on server');
      render();
      return false;
    }
    if(!r.ok||!j||j.ok===false)throw new Error((j&&j.error)||('HTTP '+r.status));
    HC.updatedAt=j.updatedAt||Date.now();
    if(j.backups)HC.backups=j.backups;
    return true;
  },
  saveSync(text){
    try{return !!(navigator.sendBeacon&&navigator.sendBeacon(WEB_BASE+'/api/store?base='+encodeURIComponent(HC.updatedAt||0),new Blob([text],{type:'application/json'})))}catch(e){return false}
  },
  async restoreBackup(name){
    const j=await webFetchJson(WEB_BASE+'/api/backups/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
    HC.updatedAt=j.updatedAt||Date.now();
    HC.backups=j.backups||HC.backups||[];
    return j.data;
  },
}:null;

const HOST=DESKTOP_HOST||WEB_HOST;

const hostCanvasCard=()=>DESKTOP_HOST?`<div class="card kpi-card kpi-acc" style="margin-bottom:16px"><h2>One-click Portal Sync (Read-only)</h2><p class="small muted" style="margin:-6px 0 12px">Atlas opens your university portals in isolated windows where you sign in normally. Once signed in, Atlas reads your Canvas courses/scores and automatically reads PSCS Course History + Live Weekly Schedule in one pass. Passwords are never stored and no changes are ever made to your portals.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-a="hostsyncall" ${U.hostBusy?'disabled':''}>${U.hostBusy==='all'?'Syncing Canvas & PSCS…':'✦ Sync All (Canvas + PSCS)'}</button><button type="button" class="btn" data-a="hostcanvas" ${U.hostBusy?'disabled':''}>${U.hostBusy==='canvas'?'Waiting for Canvas…':'Canvas only'}</button><button type="button" class="btn" data-a="hostpscs" ${U.hostBusy?'disabled':''}>${U.hostBusy==='pscs'?'Reading PSCS…':'PSCS (Grades + Live Schedule)'}</button></div></div>`:'';
const hostCard=()=>`<div class="sec"><h2>This computer &amp; server sync</h2><div class="card">
  <div class="small muted" style="margin-bottom:12px">Your plan is saved in a file on this computer, with a backup copy kept at most once an hour.<br><span class="mono">${esc(HC.dataPath||'')}</span></div>
  <div class="row" style="margin-bottom:18px"><button class="btn" data-a="hostfolder">Open the data folder</button></div>
  <h3 style="margin-bottom:8px">Starserver sync</h3>
  <div class="fgrid" style="margin-bottom:12px"><label class="f"><span>Sync server URL</span><input data-c="hostcfg" data-f="serverUrl" value="${esc(HC.serverUrl||'')}" placeholder="https://starserver.tailbf777f.ts.net/atlas"></label></div>
  <div class="row" style="margin-bottom:18px"><button class="btn soft" data-a="hostserversync">Sync with server now</button><span class="small muted">${HC.updatedAt?'Last server timestamp: '+esc(new Date(HC.updatedAt).toLocaleString()):'Optional — syncs desktop & phone automatically'}</span></div>
  <h3 style="margin-bottom:8px">Portal page reports</h3>
  <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn" data-a="hostopen" data-v="pscs">Open PSCS</button><button class="btn" data-a="hostopen" data-v="syllabus">Open Simple Syllabus</button><button class="btn" data-a="hostreport" data-v="pscs">Save a PSCS page report</button><button class="btn" data-a="hostreport" data-v="syllabus">Save a Simple Syllabus page report</button></div>
  <p class="small muted" style="margin:10px 0 0">A page report lists the headings, tables, buttons and fields on the page you have open in that window, plus the text on it. Field values are excluded, though table text may show grades or names.</p></div></div>`;

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
  const _origSave=DESKTOP_HOST.save.bind(DESKTOP_HOST);
  DESKTOP_HOST.save=async function(text,force){
    await _origSave(text);
    if(HC.serverUrl&&DESKTOP_HOST.serverSync){
      const r=await DESKTOP_HOST.serverSync({method:'POST',body:text,base:HC.updatedAt||0,force:!!force});
      if(r&&r.conflict){
        U.conflict={data:r.data,updatedAt:r.updatedAt};
        setSync('Conflict — newer save on server');render();return false;
      }
      if(r&&r.ok&&r.updatedAt)HC.updatedAt=r.updatedAt;
    }
    return true;
  };
  Object.assign(ACT2,{
    async hostcanvas(){if(U.hostBusy)return;U.hostBusy='canvas';U.cvErr='';render();
      try{const raw=await DESKTOP_HOST.canvasExport();U.hostBusy='';handleIncomingImport(raw)}
      catch(e){U.hostBusy='';U.cvErr=String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,'');render()}},
    async hostpscs(){if(U.hostBusy)return;if(!DESKTOP_HOST.pscsExport)return toast('Update desktop app to use PSCS auto-sync');U.hostBusy='pscs';U.cvErr='';render();
      try{const raw=await DESKTOP_HOST.pscsExport();U.hostBusy='';handleIncomingImport(raw)}
      catch(e){U.hostBusy='';U.cvErr=String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,'');render()}},
    async hostsyncall(){if(U.hostBusy)return;U.hostBusy='all';U.cvErr='';render();
      const errs=[];let gotCv=false,gotPscs=false;
      try{const rawCv=await DESKTOP_HOST.canvasExport();if(rawCv){const j=JSON.parse(rawCv);if(j&&Array.isArray(j.courses)){U.cv=j.courses.map(cv=>Object.assign({},cv,{teachers:cv.teachers||[],groups:cv.groups||[],target:cvMatch(cv)||'__new__'}));gotCv=true}}}catch(e){errs.push('Canvas: '+String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,''))}
      if(DESKTOP_HOST.pscsExport){
        try{const rawPs=await DESKTOP_HOST.pscsExport();if(rawPs){const j=JSON.parse(rawPs);const diffs=parsePscsGrades(j.history||j);const sched=parsePscsSchedule(j.schedule||j);if(diffs.length)U.pscsDiff=diffs;if(sched&&sched.items&&sched.items.length){U.pscsSched=sched;U.pscsApplySched=true}if(diffs.length||(sched&&sched.items.length))gotPscs=true}}catch(e){errs.push('PSCS: '+String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,''))}
      }
      U.hostBusy='';
      if(errs.length)U.cvErr=errs.join(' · ');
      location.hash='canvas';render();
      if(gotCv||gotPscs)toast('Portals read — review & apply below');
    },
    async hostserversync(){
      if(!HC.serverUrl)return toast('Set your server URL first');
      try{
        const j=await DESKTOP_HOST.serverSync({method:'GET'});
        if(j&&j.ok&&j.data&&(!HC.updatedAt||j.updatedAt>HC.updatedAt)){
          HC.updatedAt=j.updatedAt;
          const o=JSON.parse(j.data);
          if(o&&Array.isArray(o.terms)&&!o.sample){adopt(o);await _origSave(JSON.stringify(S));try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}render();return toast('Pulled newer plan from server')}
        }
        const p=await DESKTOP_HOST.serverSync({method:'POST',body:JSON.stringify(S),base:HC.updatedAt||0});
        if(p&&p.conflict){U.conflict={data:p.data,updatedAt:p.updatedAt};setSync('Conflict — newer save on server');render();return}
        if(p&&p.ok){HC.updatedAt=p.updatedAt||Date.now();setSync('Synced with server');toast('Synced with server')}
        else toast((p&&p.error)||'Could not sync with server');
      }catch(e){toast('Could not reach server')}
    },
    conflictTheirs(){
      if(!U.conflict)return;
      try{
        const o=JSON.parse(U.conflict.data);
        if(o&&Array.isArray(o.terms)){
          HC.updatedAt=U.conflict.updatedAt||Date.now();U.conflict=null;adopt(o);
          _origSave(JSON.stringify(S)).catch(()=>{});
          try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
          setSync('Synced with server');render();toast('Loaded newer plan from server');
        }
      }catch(e){toast('Could not load server plan')}
    },
    async conflictMine(){
      if(!U.conflict)return;
      const ok=await DESKTOP_HOST.save(JSON.stringify(S),true);
      if(ok){U.conflict=null;setSync('Synced with server');render();toast('Kept your changes and pushed to server')}
    },
    hostopen(e,d){DESKTOP_HOST.openPortal(d.v).catch(x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostreport(e,d){DESKTOP_HOST.pageReport(d.v).then(r=>toast(r&&r.saved?'Report saved':'Nothing was saved'),x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostfolder(){DESKTOP_HOST.openDataFolder()},
  });
  Object.assign(CHG2,{hostcfg(e,d,v){HC[d.f]=v.trim();DESKTOP_HOST.setConfig({[d.f]:v.trim()}).then(c=>{HC=c}).catch(err=>toast(err&&err.message||'Invalid URL'))}});
  window.addEventListener('beforeunload',()=>{if(U.touched&&DESKTOP_HOST.saveSync)try{DESKTOP_HOST.saveSync(JSON.stringify(S))}catch(e){}});
  setTimeout(async()=>{
    if(HC.serverUrl&&DESKTOP_HOST.serverSync){
      try{const j=await DESKTOP_HOST.serverSync({method:'GET'});if(j&&j.ok){if(!HC.updatedAt)HC.updatedAt=j.updatedAt||0;if(j.data&&j.updatedAt>HC.updatedAt&&!U.touched){const o=JSON.parse(j.data);if(o&&Array.isArray(o.terms)&&!o.sample){HC.updatedAt=j.updatedAt;adopt(o);await _origSave(JSON.stringify(S));render()}}}}catch(e){}
    }
    if(S.ui&&S.ui.modules&&S.ui.modules.canvas!==false&&DESKTOP_HOST.canvasSilent){
      try{const r=await DESKTOP_HOST.canvasSilent();if(r&&r.ok&&r.data&&typeof cvAutoSync==='function')cvAutoSync(r.data)}catch(e){}
    }
  },2500);
  const _vs=vSettings;vSettings=function(){return _vs()+((U.setTab==='data')?hostCard():'')};
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
    conflictTheirs(){
      if(!U.conflict)return;
      try{
        const o=JSON.parse(U.conflict.data);
        if(o&&Array.isArray(o.terms)){
          HC.updatedAt=U.conflict.updatedAt||Date.now();
          U.conflict=null;
          adopt(o);
          try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
          setSync('Synced with server');render();toast('Loaded newer plan from server');
        }
      }catch(e){toast('Could not load server plan')}
    },
    async conflictMine(){
      if(!U.conflict)return;
      try{
        const ok=await WEB_HOST.save(JSON.stringify(S),true);
        if(ok){U.conflict=null;setSync('Synced with server');render();toast('Kept your changes and synced')}
      }catch(e){toast('Could not save to server')}
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
  const _vs=vSettings;vSettings=function(){return _vs()+((U.setTab==='data')?webServerCard():'')};
}