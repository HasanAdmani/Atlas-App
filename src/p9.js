
/* ---------- desktop app bridge (only present inside the Atlas desktop app) ---------- */
const HOST=window.atlasHost||null;
let HC={};
const hostCanvasCard=()=>`<div class="card" style="margin-bottom:16px"><h2>Sign in and sync</h2><p class="small muted" style="margin:-6px 0 12px">Atlas opens ${esc(HC.canvasUrl||'your Canvas')} in its own window. Sign in the way you normally do. Atlas then reads your courses, scores and due dates, and the window closes. Your password is never stored.</p><div class="row"><button class="btn primary" data-a="hostcanvas">${U.hostBusy==='canvas'?'Waiting for you to sign in…':'Sign in to Canvas'}</button></div></div>`;
const hostCard=()=>`<div class="sec"><h2>This computer</h2><div class="card">
  <div class="small muted" style="margin-bottom:12px">Your plan is saved in a file on this computer, with a backup copy kept at most once an hour.<br><span class="mono">${esc(HC.dataPath||'')}</span></div>
  <div class="row" style="margin-bottom:18px"><button class="btn" data-a="hostfolder">Open the data folder</button></div>
  <h3 style="margin-bottom:8px">Portals</h3>
  <div class="fgrid"><label class="f"><span>Canvas address</span><input data-c="hostcfg" data-f="canvasUrl" value="${esc(HC.canvasUrl||'')}" placeholder="https://hulms.instructure.com"></label><label class="f"><span>PSCS address</span><input data-c="hostcfg" data-f="pscsUrl" value="${esc(HC.pscsUrl||'')}" placeholder="https://…"></label><label class="f"><span>Simple Syllabus address</span><input data-c="hostcfg" data-f="syllabusUrl" value="${esc(HC.syllabusUrl||'')}" placeholder="https://…"></label></div>
  <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn" data-a="hostopen" data-v="pscs">Open PSCS</button><button class="btn" data-a="hostopen" data-v="syllabus">Open Simple Syllabus</button><button class="btn" data-a="hostreport" data-v="pscs">Save a PSCS page report</button><button class="btn" data-a="hostreport" data-v="syllabus">Save a Simple Syllabus page report</button></div>
  <p class="small muted" style="margin:10px 0 0">A page report lists the headings, tables, buttons and fields on the page you have open in that window, plus the text on it. It is how new importers get written. It can contain your grades or name, so read it and remove anything private before sharing it.</p></div></div>`;
if(HOST){
  Object.assign(ACT2,{
    async hostcanvas(){if(U.hostBusy)return;U.hostBusy='canvas';U.cvErr='';render();
      try{U.cvText=await HOST.canvasExport();U.hostBusy='';ACT2.cvread()}
      catch(e){U.hostBusy='';U.cvErr=String((e&&e.message)||e).replace(/^Error invoking remote method '[^']*': (Error: )?/,'');render()}},
    hostopen(e,d){HOST.openPortal(d.v).catch(x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostreport(e,d){HOST.pageReport(d.v).then(r=>toast(r&&r.saved?'Report saved':'Nothing was saved'),x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')))},
    hostfolder(){HOST.openDataFolder()},
  });
  Object.assign(CHG2,{hostcfg(e,d,v){HC[d.f]=v.trim();HOST.setConfig({[d.f]:v.trim()}).then(c=>{HC=c})}});
  window.addEventListener('beforeunload',()=>{if(U.touched&&HOST.saveSync)try{HOST.saveSync(JSON.stringify(S))}catch(e){}});
  const _vs=vSettings;vSettings=function(){return _vs()+hostCard()};
}
