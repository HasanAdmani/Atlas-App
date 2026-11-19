
/* ---------- shell and render ---------- */
const ICONS={
  overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  courses:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  gpa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  sync:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  collapse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 9l-3 3 3 3"/></svg>',
  expand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M13 9l3 3-3 3"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
  undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
  external:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  table:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18M9 3v18"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  portal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
};
const ROUTES=[['overview','Overview','#overview'],['courses','Courses','#courses'],['plan','Plan','#grid'],['gpa','GPA lab','#gpa'],['settings','Settings','#settings']];
const VIEWS={overview:vOverview,courses:vCourses,plan:vPlan,gpa:vGpa,add:vAdd,canvas:vCanvas,settings:vSettings};
const LSTHEME='course-atlas.theme';
const LSRAIL='course-atlas.rail';
function applyTheme(t){U.theme=t||'';if(U.theme)document.documentElement.dataset.theme=U.theme;else delete document.documentElement.dataset.theme}
function applyUiPrefs(){
  const ui=(S&&S.ui)||{};
  if(ui.accent&&ui.accent!=='blue')document.documentElement.dataset.accent=ui.accent;
  else delete document.documentElement.dataset.accent;
  if(ui.density==='compact')document.documentElement.dataset.density='compact';
  else delete document.documentElement.dataset.density;
}
function cmdItems(q){
  const s=String(q||'').trim().toLowerCase(),mods=(S.ui&&S.ui.modules)||{};
  const all=[
    {id:'r:overview',lbl:'Overview',sub:'Dashboard',act:()=>location.hash='overview'},
    {id:'r:courses',lbl:'Courses',sub:'Terms & grades',act:()=>location.hash='courses'},
    {id:'r:grid',lbl:'Plan · Four years',sub:'Course schedule grid',act:()=>location.hash='grid'},
    mods.roadmap!==false?{id:'r:roadmap',lbl:'Plan · Roadmap',sub:'Prerequisite dependency map',act:()=>location.hash='roadmap'}:null,
    {id:'r:req',lbl:'Plan · Requirements',sub:'Degree categories & minors',act:()=>location.hash='req'},
    mods.enroll!==false?{id:'r:enroll',lbl:'Plan · Enrollment',sub:'Sections & weekly timetable',act:()=>location.hash='enroll'}:null,
    {id:'r:gpa',lbl:'GPA lab',sub:'Target calculator & what-if',act:()=>location.hash='gpa'},
    {id:'r:add',lbl:'Add course',sub:'From syllabus or manually',act:()=>location.hash='add'},
    mods.canvas!==false?{id:'r:canvas',lbl:'Sync from Canvas',sub:'Import scores & due dates',act:()=>location.hash='canvas'}:null,
    {id:'r:settings',lbl:'Settings',sub:'Degree, portals, appearance & sync',act:()=>location.hash='settings'},
  ].filter(Boolean);
  if(mods.portals!==false)(S.settings.portals||[]).filter(p=>p.on).forEach(p=>all.push({id:'p:'+p.id,lbl:'Open '+p.name,sub:'Portal · '+p.url,act:()=>ACT.openportal(null,{id:p.id})}));
  all.push(
    {id:'a:years',lbl:'Grid layout: Years',sub:'Plan setting',act:()=>{S.ui.plan.layout='years';persist();location.hash='grid';render()}},
    {id:'a:timeline',lbl:'Grid layout: Timeline',sub:'Plan setting',act:()=>{S.ui.plan.layout='timeline';persist();location.hash='grid';render()}},
    {id:'a:rail',lbl:'Toggle sidebar rail',sub:'Collapse or expand navigation',act:()=>ACT.togglerail()},
    {id:'a:theme',lbl:'Cycle theme (Auto / Light / Dark)',sub:'Appearance',act:()=>ACT.cycletheme()},
    UNDO.length?{id:'a:undo',lbl:'Undo last change',sub:UNDO[UNDO.length-1].label,act:()=>ACT.undo()}:null,
    {id:'a:export',lbl:'Download backup JSON',sub:'Data export',act:()=>ACT.export()}
  );
  S.courses.forEach(c=>all.push({id:'c:'+c.id,lbl:c.code+' · '+c.title,sub:((termOf(c.term)||{}).name||'Catalog')+' · '+c.credits+' cr'+(c.instructor?' · '+c.instructor:''),act:()=>{U.course=c.id;U.tab='assess';render()}}));
  const clean=all.filter(Boolean);
  if(!s)return clean.slice(0,16);
  return clean.filter(x=>(x.lbl+' '+x.sub).toLowerCase().includes(s)).slice(0,18);
}
function cmdListHtml(items){
  if(!items.length)return'<div class="small muted" style="padding:14px">No matches found.</div>';
  const ix=Math.min(U.cmdIdx||0,items.length-1);
  return items.map((x,i)=>`<button type="button" class="cmd-item ${i===ix?'on':''}" data-a="cmdrun" data-i="${i}"><span>${esc(x.lbl)}</span><small>${esc(x.sub)}</small></button>`).join('');
}
function cmdModal(){
  const items=cmdItems(U.cmdQ||'');
  return`<div class="veil cmd-veil" data-a="closecmdbg"><div class="cmd-box" role="dialog" aria-label="Command palette"><div class="cmd-in">${ICONS.search}<input id="cmd-q" type="search" value="${esc(U.cmdQ||'')}" placeholder="Jump to a course, page, portal, or action…" autocomplete="off"><kbd class="mono small muted">Esc</kbd></div><div id="cmd-list" class="cmd-list">${cmdListHtml(items)}</div></div></div>`;
}
function moreSheet(){
  const mods=(S.ui&&S.ui.modules)||{};
  const portals=mods.portals!==false?(S.settings.portals||[]).filter(p=>p.on):[];
  const th=U.theme||'';
  return`<div class="veil more-veil" data-a="closemorebg"><div class="more-sheet" role="dialog" aria-label="More options">
    <div class="row between"><h3 style="margin:0;font-size:17px">More</h3><button type="button" class="btn ghost sm" data-a="togglemore" aria-label="Close">✕</button></div>
    ${portals.length?`<div><div class="lbl" style="margin-bottom:8px">Portals</div><div class="more-grid">${portals.map(p=>`<button type="button" class="more-tile" data-a="openportal" data-id="${esc(p.id)}"><span class="p-tile" style="--pc:${esc(p.color||'#2945B8')}">${esc((p.short||p.name||'P').slice(0,2))}</span><span>${esc(p.name)}</span></button>`).join('')}</div></div>`:''}
    <div><div class="lbl" style="margin-bottom:8px">Actions</div><div class="more-grid">
      <a class="more-tile" href="#add" data-a="closemore">${ICONS.plus}<span>Add course</span></a>
      ${mods.canvas!==false?`<a class="more-tile" href="#canvas" data-a="closemore">${ICONS.sync}<span>Sync Canvas</span></a>`:''}
      <button type="button" class="more-tile" data-a="opencmd">${ICONS.search}<span>Search (⌘K)</span></button>
      <a class="more-tile" href="#settings" data-a="closemore">${ICONS.settings}<span>Settings</span></a>
      ${UNDO.length?`<button type="button" class="more-tile" data-a="undo">${ICONS.undo}<span>Undo</span></button>`:''}
    </div></div>
    <div><div class="lbl" style="margin-bottom:8px">Theme</div><div class="theme-seg" role="group" aria-label="Theme">${[['','Auto'],['light','Light'],['dark','Dark']].map(([v,l])=>`<button type="button" class="${th===v?'on':''}" data-a="theme" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="sidefoot"><span class="sync-dot ${/offline|could not|conflict/i.test(U.sync||'')?'warn':''}"></span><span>${esc(U.sync||'Ready')}</span></div>
  </div></div>`;
}
function render(){
  applyUiPrefs();
  const app=$('#app');if(!app)return;
  const sy=window.scrollY,dr=$('.drawer'),dy=dr?dr.scrollTop:0;
  let view='';try{view=(VIEWS[U.route]||vOverview)()}catch(e){view='<div class="empty">Something in your data could not be shown. Download a backup from Settings and restore it, or erase and start again.<br><small>'+esc(e&&e.message)+'</small></div>';console.error(e)}
  const th=U.theme||'',mods=(S.ui&&S.ui.modules)||{};
  const mobTheme=th==='dark'?'Dark':th==='light'?'Light':'Auto';
  const dotCls=/offline|could not|conflict/i.test(U.sync||'')?'warn':'';
  const themeSeg=`<div class="theme-seg" role="group" aria-label="Theme">${[['','Auto'],['light','Light'],['dark','Dark']].map(([v,l])=>`<button type="button" class="${th===v?'on':''}" data-a="theme" data-v="${v}">${l}</button>`).join('')}</div>`;
  const deskRoutes=ROUTES;
  const navLinks=deskRoutes.map(r=>`<a href="${r[2]}" class="${r[0]==='settings'?'nav-settings':''}" title="${r[1]}" ${U.route===r[0]||(r[0]==='courses'&&(U.route==='add'||U.route==='canvas'))?'aria-current="page"':''}>${ICONS[r[0]]||''}<span>${r[1]}</span></a>`).join('')+
    `<button type="button" class="nav-more ${U.moreOpen||U.route==='settings'||U.route==='add'||U.route==='canvas'?'on':''}" data-a="togglemore" aria-label="More">${ICONS.more}<span>More</span></button>`;
  const portals=mods.portals!==false?(S.settings.portals||[]).filter(p=>p.on):[];
  const dockHtml=portals.length?`<div class="side-dock"><div class="side-lbl">Portals</div>${portals.map(p=>`<div class="dock-row"><button type="button" class="dock-btn" data-a="openportal" data-id="${esc(p.id)}" title="Open ${esc(p.name)}"><span class="p-tile" style="--pc:${esc(p.color||'#2945B8')}">${esc((p.short||p.name||'P').slice(0,2))}</span><span class="dock-name">${esc(p.name)}</span></button>${p.kind==='canvas'&&mods.canvas!==false?`<button type="button" class="dock-act" data-a="quickcanvas" title="Sync Canvas" aria-label="Sync Canvas">${ICONS.sync}</button>`:''}</div>`).join('')}</div>`:'';
  const side=`<aside class="side"><div class="side-card">
    <div class="brand"><div class="brand-top"><div class="brand-row"><span class="brand-mark">A</span><span class="brand-name">Atlas</span></div><button type="button" class="rail-btn" data-a="togglerail" title="${U.railCollapsed?'Expand sidebar':'Collapse sidebar'}" aria-label="Toggle sidebar">${U.railCollapsed?ICONS.expand:ICONS.collapse}</button><div class="mob-util"><button type="button" class="btn sm" data-a="opencmd" aria-label="Search">${ICONS.search}</button><a class="btn sm" href="#add">+ Add</a><button type="button" class="btn sm" data-a="cycletheme" aria-label="Cycle theme">${mobTheme}</button><span class="sync-dot ${dotCls}" title="${esc(U.sync||'Ready')}"></span></div></div><small>${esc(S.settings.school||'Degree planner')}</small></div>
    <nav class="nav" aria-label="Sections">${navLinks}</nav>
    ${dockHtml}
    <div class="side-quick"><div class="side-lbl">Quick actions</div><a class="side-btn" href="#add" title="Add course" ${U.route==='add'?'aria-current="page"':''}>${ICONS.plus}<span>Add course</span></a>${mods.canvas!==false?`<a class="side-btn" href="#canvas" title="Sync Canvas" ${U.route==='canvas'?'aria-current="page"':''}>${ICONS.sync}<span>Sync Canvas</span></a>`:''}</div>
    <div class="side-foot">${themeSeg}<div class="sidefoot" title="${esc(U.sync||'Ready')}"><span class="sync-dot ${dotCls}"></span><span>${esc(U.sync||'Ready')}</span></div></div>
  </div></aside>`;
  const conflictHtml=U.conflict?`<div class="banner" style="background:var(--bad-soft);border-color:var(--bad-border)"><div class="row" style="gap:10px"><b>Sync conflict</b><span class="small">Your plan changed on another device${U.conflict.updatedAt?' ('+esc(new Date(U.conflict.updatedAt).toLocaleString())+')':''}.</span></div><div class="row" style="gap:8px"><button type="button" class="btn sm primary" data-a="conflictTheirs">Use theirs</button><button type="button" class="btn sm" data-a="conflictMine">Keep mine</button></div></div>`:'';
  app.innerHTML=`<div class="shell${U.railCollapsed?' rail-c':''}">${side}<main class="main">${conflictHtml}${view}</main></div>${U.course?drawer():''}${U.cmdOpen?cmdModal():''}${U.moreOpen?moreSheet():''}${U.toast?`<div class="toast" role="status"><span>${esc(U.toast)}</span>${U.toastUndo&&UNDO.length?`<button type="button" class="toast-btn" data-a="undo">Undo</button>`:''}</div>`:''}`;
  window.scrollTo(0,sy);const nd=$('.drawer');if(nd)nd.scrollTop=dy;
}
function toast(t,withUndo){U.toast=t;U.toastUndo=!!withUndo;render();clearTimeout(toast.t);toast.t=setTimeout(()=>{U.toast='';U.toastUndo=false;render()},withUndo?4000:2200)}
function routeFromHash(){const h=(location.hash||'').replace('#','');
  if(h.startsWith('import/')){
    const raw=h.slice(7);
    try{
      const b64=raw.replace(/-/g,'+').replace(/_/g,'/');
      const padLen=(4-b64.length%4)%4;
      const json=decodeURIComponent(escape(atob(b64+'='.repeat(padLen))));
      try{history.replaceState(null,'','#canvas')}catch(e){}
      U.route='canvas';U.course=null;U.showHelp=false;U.moreOpen=false;
      if(typeof handleIncomingImport==='function')handleIncomingImport(json);
      else{U.cvText=json;render()}
      window.scrollTo(0,0);return;
    }catch(e){toast('Could not read incoming import link')}
  }
  if(h==='grid'||h==='roadmap'||h==='req'||h==='enroll'){U.route='plan';U.planTab=h}else U.route=VIEWS[h]?h:'overview';
  U.course=null;U.showHelp=false;U.moreOpen=false;render();window.scrollTo(0,0)}

/* ---------- file export & Gemini syllabus reader ---------- */
const LSAI='course-atlas.ai';let AI={key:'',model:'gemini-2.5-flash'};
async function saveFile(name,data){
  if(window.atlasHost&&window.atlasHost.saveFile){const r=await window.atlasHost.saveFile(name,data);if(r&&r.canceled)throw{code:'declined'};return}
  const type=/\.pdf$/.test(name)?'application/pdf':/\.csv$/.test(name)?'text/csv':'application/json';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
const b64=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(f)});
async function callAI(prompt,images){
  if(AI.key){
    const parts=[{text:prompt}];
    for(const f of images)parts.push({inline_data:{mime_type:f.type||'image/jpeg',data:await b64(f)}});
    let r;
    try{r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(AI.model||'gemini-2.5-flash')+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':AI.key},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:0}})})}catch(e){throw{code:'network'}}
    if(!r.ok){let m='';try{m=((await r.json()).error||{}).message||''}catch(x){}if(r.status===400&&/api key|API_KEY/i.test(m)||r.status===403)throw{code:'bad_key',status:r.status};throw{code:r.status===429?'rate_limited':'upstream_error',status:r.status,message:m}}
    const j=await r.json(),ps=(((j.candidates||[])[0]||{}).content||{}).parts||[],t=ps.map(p=>p.text||'').join('');
    try{return JSON.parse(t)}catch(e){const m=t.match(/[\{\[][\s\S]*[\}\]]/);if(m){try{return JSON.parse(m[0])}catch(x){}}throw{code:'invalid_json'}}
  }
  throw{code:'no_ai'};
}

/* ---------- actions ---------- */
const splitList=v=>String(v||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():''};
function termNames(first,season,n){const out=[];let y=first,s=season;for(let i=0;i<n;i++){out.push(s+' '+y);if(s==='Fall'){s='Spring';y++}else s='Fall'}return out}
function nextCatKey(){return 'c'+uid()}
const ACT={
  togglerail(){U.railCollapsed=!U.railCollapsed;try{localStorage.setItem(LSRAIL,U.railCollapsed?'1':'0')}catch(e){}render()},
  togglehelp(){U.showHelp=!U.showHelp;render()},
  togglemore(){U.moreOpen=!U.moreOpen;render()},
  closemore(){U.moreOpen=false},
  closemorebg(e){if(e.target.classList.contains('more-veil')){U.moreOpen=false;render()}},
  opencmd(){U.cmdOpen=true;U.cmdQ='';U.cmdIdx=0;U.moreOpen=false;render();setTimeout(()=>{const el=$('#cmd-q');if(el)el.focus()},0)},
  closecmdbg(e){if(e.target.classList.contains('cmd-veil')){U.cmdOpen=false;render()}},
  cmdrun(e,d){const items=cmdItems(U.cmdQ||'');const it=items[+d.i];U.cmdOpen=false;if(it&&it.act)it.act();else render()},
  openportal(e,d){
    const p=(S.settings.portals||[]).find(x=>x.id===d.id);if(!p||!p.url)return toast('Set a URL for '+((p&&p.name)||d.id)+' in Settings');
    U.moreOpen=false;
    if(DESKTOP_HOST){
      DESKTOP_HOST.openPortal(p.id,p.url).catch(x=>toast(String((x&&x.message)||x).replace(/^Error invoking remote method '[^']*': (Error: )?/,'')));
    }else{
      window.open(p.url,'_blank','noopener,noreferrer');
    }
    render();
  },
  quickcanvas(){U.moreOpen=false;if(DESKTOP_HOST&&ACT2.hostcanvas){ACT2.hostcanvas()}else{location.hash='canvas';render()}},
  plancfg(e,d){const f=d.f;if(!f)return;S.ui.plan[f]=f==='collapseDone'?(d.v==='1'):d.v;persist();render()},
  toggletray(){S.ui.plan.trayOpen=!S.ui.plan.trayOpen;persist();render()},
  expandyear(e,d){U.expandedYears=U.expandedYears||{};U.expandedYears[+d.i]=!U.expandedYears[+d.i];render()},
  startmove(e,d){U.moveCourseId=(U.moveCourseId===d.id?null:d.id);render()},
  cancelmove(){U.moveCourseId=null;render()},
  moveto(e,d){const c=getC(U.moveCourseId);U.moveCourseId=null;if(c){pushUndo('Moved '+c.code);c.term=d.term||null;persist();toast('Moved '+c.code,true)}else render()},
  dashedit(){U.dashEdit=!U.dashEdit;if(U.dashEdit&&!U.dashEditMode)U.dashEditMode=(typeof window!=='undefined'&&window.innerWidth<=860)?'mobile':'desktop';render()},
  dashmode(e,d){U.dashEditMode=d.v;render()},
  dashreset(){const m=U.dashEditMode||'desktop';S.ui.dash[m]=defUi().dash[m];persist();toast('Reset '+m+' layout');render()},
  wvis(e,d){const m=U.dashEditMode||'desktop',it=(S.ui.dash[m]||[]).find(x=>x.w===d.w);if(it){it.on=(it.on===false);persist();render()}},
  wsize(e,d){const m=U.dashEditMode||'desktop',it=(S.ui.dash[m]||[]).find(x=>x.w===d.w);if(it){it.size=d.v;persist();render()}},
  wmove(e,d){const m=U.dashEditMode||'desktop',arr=S.ui.dash[m]||[];const i=arr.findIndex(x=>x.w===d.w),j=i+(+d.dir||0);if(i>=0&&j>=0&&j<arr.length){const tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;persist();render()}},
  go(e,d){location.hash=d.v},
  open(e,d){U.course=d.id;U.tab='assess';render()},
  close(){U.course=null;render()},
  closebg(e){if(e.target.classList.contains('veil')){U.course=null;render()}},
  tab(e,d){e.preventDefault();U.tab=d.v;render()},
  sel(e,d){U.sel=(d.id&&U.sel!==d.id)?d.id:null;render()},
  hidedone(){U.hideDone=!U.hideDone;render()},
  allterms(){U.allTerms=!U.allTerms;render()},
  cview(e,d){U.cview=d.v;render()},
  cmode(e,d){U.courseMode=d.v;render()},
  settab(e,d){e.preventDefault();U.setTab=d.v;render()},
  modtoggle(e,d){S.ui.modules[d.f]=(S.ui.modules[d.f]===false);persist();render()},
  portaltoggle(e,d){const p=S.settings.portals[+d.i];if(p){p.on=!p.on;persist();render()}},
  addportal(){S.settings.portals=S.settings.portals||[];S.settings.portals.push({id:'p'+uid(),name:'Custom link',short:'L',url:'https://',on:true,kind:'link',color:'#4F46E5'});persist();render()},
  delportal(e,d){S.settings.portals.splice(+d.i,1);persist();render()},
  setaccent(e,d){S.ui.accent=d.v;persist();render()},
  setdensity(e,d){S.ui.density=d.v;persist();render()},
  editdash(){U.dashEdit=true;U.dashEditMode=(typeof window!=='undefined'&&window.innerWidth<=860)?'mobile':'desktop';location.hash='overview';render()},
  termDown(e,d){mut(()=>{const i=termIdx(d.id);if(i>=0&&i<S.terms.length-1){const t=S.terms.splice(i,1)[0];S.terms.splice(i+1,0,t)}})},
  setup(){
    const n=Math.max(2,Math.min(14,parseInt(val('su-n'))||8)),dn=Math.max(0,Math.min(n,parseInt(val('su-done'))||0));
    const names=termNames(parseInt(val('su-year'))||new Date().getFullYear(),val('su-season')||'Fall',n);
    const base=blank();base.settings.program=val('su-prog');base.settings.school=val('su-school');base.settings.totalCredits=parseInt(val('su-cr'))||130;
    base.terms=names.map((nm,i)=>({id:'t'+uid(),name:nm,status:i<dn?'done':i===dn?'current':'planned'}));
    S=base;persist();render();
  },
  loadsample(){S=seed();persist();render()},
  addgroup(e,d){mut(()=>{getC(d.id).assess.push({id:uid(),n:'New group',type:'Assignment',w:0,cnt:1,drop:0,items:[]})})},
  delgroup(e,d){mut(()=>{const c=getC(d.id);c.assess=c.assess.filter(g=>g.id!==d.gid)})},
  additem(e,d){mut(()=>{const g=getC(d.id).assess.find(x=>x.id===d.gid);g.items.push({id:uid(),n:g.n+' '+(g.items.length+1),s:null,m:100,due:'',st:'',late:false})})},
  delitem(e,d){mut(()=>{const g=getC(d.id).assess.find(x=>x.id===d.gid);g.items=g.items.filter(i=>i.id!==d.iid)})},
  delcourse(e,d){mut(()=>{S.courses=S.courses.filter(c=>c.id!==d.id);U.course=null})},
  wireset(){U.whatif={};render()},
  theme(e,d){applyTheme(d.v);try{if(d.v)localStorage.setItem(LSTHEME,d.v);else localStorage.removeItem(LSTHEME)}catch(x){}render()},
  cycletheme(){const nxt=U.theme===''?'light':U.theme==='light'?'dark':'';ACT.theme(null,{v:nxt})},
  undo(){
    const last=UNDO.pop();if(!last)return;
    U.canUndo=UNDO.length>0;
    try{S=JSON.parse(last.state);persist();toast('Undone: '+last.label)}
    catch(e){toast('Could not undo')}
  },
  pickgoal(e,d){const c=getC(d.id);if(c){pushUndo('Goal for '+c.code);c.goal=d.v||null;persist();toast('Goal for '+c.code,true)}},
  pickgrade(e,d){const c=getC(d.id);if(c){pushUndo('Grade for '+c.code);c.grade=d.v||null;persist();toast('Grade for '+c.code,true)}},
  wiset(e,d){if(U.whatif[d.id]===d.v)delete U.whatif[d.id];else if(d.v)U.whatif[d.id]=d.v;else delete U.whatif[d.id];render()},
  wisetall(e,d){if(d.v){curCourses().concat(planCourses()).filter(c=>!U.wiTerm||U.wiTerm==='all'||c.term===U.wiTerm).forEach(c=>U.whatif[c.id]=d.v);render()}},
  setopt(e,d){if(d.f==='capOwn')S.settings.capOwn=(d.v==='yes');else if(d.f==='retakeReplaces')S.settings.retakeReplaces=(d.v!=='no');persist();render()},
  addterm(){mut(()=>S.terms.push({id:'t'+uid(),name:'New term',status:'planned'}))},
  addsummer(){
    mut(()=>{
      let insIdx=S.terms.length,year=new Date().getFullYear();
      const curIdx=S.terms.findIndex(t=>t.status==='current');
      for(let i=Math.max(0,curIdx);i<S.terms.length;i++){
        const m=String(S.terms[i].name||'').match(/spring\s+(\d{4})/i);
        if(m&&!/^sum/i.test(String((S.terms[i+1]&&S.terms[i+1].name)||''))){year=+m[1];insIdx=i+1;break}
      }
      if(insIdx===S.terms.length){
        for(let i=0;i<S.terms.length;i++){
          const m=String(S.terms[i].name||'').match(/spring\s+(\d{4})/i);
          if(m&&!/^sum/i.test(String((S.terms[i+1]&&S.terms[i+1].name)||''))){year=+m[1];insIdx=i+1;break}
        }
      }
      S.terms.splice(insIdx,0,{id:'t'+uid(),name:'Summer '+year,status:'planned'});
    },'Added Summer term');
  },
  delterm(e,d){mut(()=>{S.courses.forEach(c=>{if(c.term===d.id)c.term=null});S.terms=S.terms.filter(t=>t.id!==d.id)})},
  termUp(e,d){mut(()=>{const i=termIdx(d.id);if(i>0){const t=S.terms.splice(i,1)[0];S.terms.splice(i-1,0,t)}})},
  addcat(){mut(()=>S.settings.cats.push({k:nextCatKey(),n:'New category',req:0}))},
  delcat(e,d){mut(()=>{S.settings.cats=S.settings.cats.filter(k=>k.k!==d.id)})},
  addgrade(){mut(()=>S.settings.scale.push({l:'?',p:0,min:0}))},
  delgrade(e,d){mut(()=>S.settings.scale.splice(+d.i,1))},
  resetscale(){mut(()=>{S.settings.scale=DEF_SCALE.map(x=>Object.assign({},x))})},
  askreset(){U.confirmReset=true;render()},noreset(){U.confirmReset=false;render()},
  resetall(){U.confirmReset=false;S=blank();U.course=null;persist();location.hash='overview';render()},
  manual(){
    const code=val('ma-code'),title=val('ma-title');if(!code||!title)return toast('Add a code and a title');
    const c={id:uid(),code,title,credits:num(val('ma-cr'))||3,term:val('ma-term')||null,cat:val('ma-cat'),prereqs:splitList(val('ma-pre')),grade:null,assess:[],notes:'',instructor:''};
    mut(()=>S.courses.push(c));U.course=c.id;U.tab='assess';render();
  },
  async export(){
    try{await saveFile('course-atlas-backup.json',JSON.stringify(S,null,2));toast('Backup saved')}catch(e){if(!e||e.code!=='declined')toast('The backup could not be saved')}
  },
  sylClearImg(){U.syl.files=[];render()},
  sylDiscard(){U.syl.out=null;render()},
  sylDel(e,d){U.syl.out.assessments.splice(+d.i,1);render()},
  sylRow(){U.syl.out.assessments.push({name:'',type:'Assignment',weight:0,count:1,drop:0});render()},
  sylAdd(){
    const o=U.syl.out;if(!o.code||!o.title)return toast('The course needs a code and a title');
    const c={id:uid(),code:o.code,title:o.title,credits:o.credits||3,term:o.term||null,cat:o.cat||S.settings.cats[0].k,prereqs:o.prereqs,grade:null,instructor:o.instructor||'',notes:o.notes||'',assess:o.assessments.filter(a=>a.name||a.weight).map(a=>{const n=Math.max(1,+a.count||1);return{id:uid(),n:a.name||'Group',type:a.type,w:+a.weight||0,cnt:n,drop:+a.drop||0,items:Array.from({length:n},(_,i)=>({id:uid(),n:n>1?(a.name||'Item')+' '+(i+1):(a.name||'Item'),s:null,m:100,due:'',st:'',late:false}))}})};
    S.courses.push(c);U.syl={text:'',files:[],out:null,err:'',loading:false,term:U.syl.term,msg:''};persist();U.course=c.id;U.tab='assess';render();
  },
  async sylRead(){
    const y=U.syl;y.text=($('#syl-text')||{}).value||y.text;y.term=val('syl-term');
    if(!y.text.trim()&&!y.files.length){y.err='Paste the syllabus text or attach a file first.';return render()}
    y.err='';y.loading=true;y.out=null;render();
    const prompt=`You are reading a university course syllabus and turning it into data. Reply with only one JSON object, no other text, shaped exactly like:
{"code":"EE 301","title":"Electronics","credits":3,"instructor":"","prereqs":["EE 202"],"assessments":[{"name":"Quizzes","type":"Quiz","weight":20,"count":4,"drop":0}],"notes":""}
Rules:
- "type" must be one of: ${ATYPES.join(', ')}.
- Each assessment is one group of similar items, for example all quizzes. "weight" is the TOTAL percentage of the course grade for the whole group, not per item.
- "count" is how many items are in the group (for example 4 quizzes). Use 1 for a single exam or project. If the syllabus says the lowest scores are dropped, or only the best N count (often written n-2), put the number dropped in "drop".
- "prereqs" lists course codes only. Use an empty array when none are stated.
- "credits" is a number. If the syllabus gives contact hours but no credits, use 3.
- "notes" is one short sentence on grading policies that change the maths (drop lowest, best of, late penalties, attendance rules). Empty string if none.
- Never invent a value the syllabus does not support. Use an empty string or 0.
${y.files.length?'The attached images are pages of the syllabus.\n':''}
SYLLABUS TEXT:
${y.text.slice(0,120000)||'(see the attached images)'}`;
    try{
      const o=await callAI(prompt,y.files);
      if(!o||typeof o!=='object'||Array.isArray(o))throw {code:'invalid_json'};
      const cur=S.settings.cats;
      y.out={code:String(o.code||'').trim(),title:String(o.title||'').trim(),credits:num(o.credits)||3,instructor:String(o.instructor||''),notes:String(o.notes||''),
        prereqs:Array.isArray(o.prereqs)?o.prereqs.map(String):splitList(o.prereqs),cat:cur[0]?cur[0].k:'',term:y.term||'',
        assessments:(Array.isArray(o.assessments)?o.assessments:[]).map(a=>({name:String(a.name||''),type:ATYPES.includes(a.type)?a.type:'Other',weight:num(a.weight)||0,count:Math.max(1,Math.round(num(a.count)||1)),drop:Math.max(0,Math.round(num(a.drop)||0))}))};
      if(!y.out.assessments.length)y.err='No grading breakdown was found. You can add rows by hand below.';
    }catch(e){
      const c=e&&e.code;y.err=c==='no_ai'?'No syllabus reader is set up. Add a Gemini key in Settings, or add the course by hand.':c==='bad_key'?'Gemini did not accept the key. Check it in Settings.':c==='network'?'Could not reach Gemini. Check your connection and try again.':c==='rate_limited'?'Too many requests just now. Try again in a minute.':c==='invalid_json'?'The reply could not be turned into a course. Try again, or paste only the grading and schedule sections.':c==='image_rejected'?'One of the images could not be used. Try a clearer photo.':'The syllabus could not be read'+(c?' ('+(typeof c==='string'?c:'error')+(e&&e.status?' '+e.status:'')+')':e&&e.message?' ('+e.message+')':'')+'. You can try again or add the course by hand.';
    }
    y.loading=false;render();
  }
};
function parseCoursesField(c,f,v){
  if(f==='credits'){c.credits=num(v)||0}
  else if(f==='term'){c.term=v||null}
  else if(f==='prereqs'){c.prereqs=splitList(v)}
  else if(f==='coreqs'){c.coreqs=splitList(v)}
  else if(f==='grade'){c.grade=v||null}
  else if(f==='code'){const old=c.code;c.code=v.trim()||old;S.courses.forEach(o=>{o.prereqs=(o.prereqs||[]).map(p=>NC(p)===NC(old)?c.code:p)});S.minors.forEach(mn=>(mn.slots||[]).forEach(sl=>{sl.opts=(sl.opts||[]).map(p=>NC(p)===NC(old)?c.code:p)}))}
  else c[f]=v;
}
const CHG={
  gr(e,d,v){const g=getC(d.id).assess.find(x=>x.id===d.gid);g[d.f]=['w','cnt','drop'].includes(d.f)?(num(v)||0):v},
  it(e,d,v){const g=getC(d.id).assess.find(x=>x.id===d.gid),it=g.items.find(x=>x.id===d.iid);if(d.f==='s')it.s=num(v);else if(d.f==='m')it.m=num(v);else it[d.f]=v},
  cf(e,d,v){const c=getC(d.id);if(c){pushUndo('Edited '+c.code);parseCoursesField(c,d.f,v)}},
  set(e,d,v){S.settings[d.f]=['totalCredits','maxLoad'].includes(d.f)?(parseInt(v)||0):d.f==='targetGpa'?(num(v)||0):d.f==='retakeReplaces'?(v!=='no'):d.f==='capOwn'?(v==='yes'):v},
  tf(e,d,v){termOf(d.id)[d.f]=d.f==='cr'?v==='1':v},
  kf(e,d,v){const k=S.settings.cats.find(x=>x.k===d.id);if(k)k[d.f]=d.f==='req'?(num(v)||0):v},
  pf(e,d,v){const p=(S.settings.portals||[])[+d.i];if(p)p[d.f]=d.f==='short'?v.trim().slice(0,2).toUpperCase():v.trim()},
  coursecat(e,d,v){U.courseCat=v},
  courseq(e,d,v){U.courseQ=v},
  sf(e,d,v){const g=S.settings.scale[+d.i];g[d.f]=d.f==='l'?v.trim():(num(v)||0)},
  syl(e,d,v){const o=U.syl.out;o[d.f]=d.f==='credits'?(num(v)||0):d.f==='prereqs'?splitList(v):v},
  sylA(e,d,v){const a=U.syl.out.assessments[+d.i];a[d.f]=['weight','count','drop'].includes(d.f)?(num(v)||0):v},
  wi(e,d,v){if(v)U.whatif[d.id]=v;else delete U.whatif[d.id]},
  wiall(e,d,v){if(v){curCourses().concat(planCourses()).filter(c=>!U.wiTerm||U.wiTerm==='all'||c.term===U.wiTerm).forEach(c=>U.whatif[c.id]=v)}},
  plancfg(e,d,v){S.ui.plan[d.f]=v},
  catcat(e,d,v){U.catCat=v},
  dashnote(e,d,v){S.ui.dash.note=v},
};
async function onFiles(e){
  const files=Array.from(e.target.files||[]),y=U.syl;let msg=[];
  for(const f of files){
    try{
      if(/^image\//.test(f.type)){if(y.files.length<(U.imgMax||0))y.files.push(f);else msg.push('Too many images; kept the first '+U.imgMax)}
      else if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){try{y.text+=(y.text?'\n\n':'')+await pdfText(f)}catch(pe){if(AI.key){y.files.push(f.type?f:new File([f],f.name,{type:'application/pdf'}));msg.push(f.name+' will be sent to Gemini as a PDF.')}else throw pe}}
      else y.text+=(y.text?'\n\n':'')+await f.text();
    }catch(err){msg.push('Could not read '+f.name+(err&&err.message?' ('+err.message+')':'')+(/pdf/i.test(f.name)?'. Copy the text out of the PDF and paste it instead.':''))}
  }
  y.msg=msg.join(' ');render();
}
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load'));document.head.appendChild(s)})}
async function pdfText(file){
  const B='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  if(!window.pdfjsLib)await loadScript(B+'pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=B+'pdf.worker.min.js';
  const doc=await Promise.race([window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,new Promise((_,r)=>setTimeout(()=>r(new Error('slow')),25000))]);
  let out='';for(let i=1;i<=Math.min(doc.numPages,25);i++){const p=await doc.getPage(i);const t=await p.getTextContent();out+=t.items.map(x=>x.str).join(' ')+'\n'}
  if(out.replace(/\s/g,'').length<80)throw new Error('empty');return out;
}
async function onImport(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  try{const o=JSON.parse(await f.text());if(!o||!Array.isArray(o.terms)||!Array.isArray(o.courses)||!o.settings)throw 0;
    const b=blank();S=Object.assign(b,o,{settings:Object.assign(b.settings,o.settings)});S.sample=!!o.sample;persist();render();toast('Backup restored')}
  catch(err){toast('That file is not an Atlas backup')}
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  if(e.target.closest('select,input,textarea'))return;
  const el=e.target.closest('[data-a]');if(!el)return;
  const f=ACT[el.dataset.a]||ACT2[el.dataset.a];if(!f)return;
  if(el.dataset.a==='closebg'&&e.target!==el)return;
  if(el.tagName==='A'&&el.getAttribute('href')==='#')e.preventDefault();
  f(e,el.dataset);
});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(U.cmdOpen){U.cmdOpen=false;render()}else ACT.opencmd();return}
  if(U.cmdOpen){
    const items=cmdItems(U.cmdQ||'');
    if(e.key==='Escape'){e.preventDefault();U.cmdOpen=false;render();return}
    if(e.key==='ArrowDown'){e.preventDefault();if(items.length){U.cmdIdx=((U.cmdIdx||0)+1)%items.length;const cl=$('#cmd-list');if(cl){cl.innerHTML=cmdListHtml(items);const on=cl.querySelector('.cmd-item.on');if(on)on.scrollIntoView({block:'nearest'})}}return}
    if(e.key==='ArrowUp'){e.preventDefault();if(items.length){U.cmdIdx=((U.cmdIdx||0)-1+items.length)%items.length;const cl=$('#cmd-list');if(cl){cl.innerHTML=cmdListHtml(items);const on=cl.querySelector('.cmd-item.on');if(on)on.scrollIntoView({block:'nearest'})}}return}
    if(e.key==='Enter'){e.preventDefault();const it=items[Math.min(U.cmdIdx||0,items.length-1)];U.cmdOpen=false;if(it&&it.act)it.act();else render();return}
  }
  if(e.key==='Escape'&&U.moreOpen){U.moreOpen=false;render();return}
  if(e.key==='Escape'&&U.course){U.course=null;render()}
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('.ir input[data-f="s"]')){
    e.preventDefault();
    const list=Array.from(document.querySelectorAll('.drawer .ir input[data-f="s"]'));
    const ix=list.indexOf(e.target);
    e.target.dispatchEvent(new Event('change',{bubbles:true}));
    if(ix>=0&&ix+1<list.length)setTimeout(()=>{const nx=document.querySelectorAll('.drawer .ir input[data-f="s"]')[ix+1];if(nx){nx.focus();nx.select&&nx.select()}},0);
    return;
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&!e.target.closest('input,textarea,select')){e.preventDefault();ACT.undo()}
  if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('g.nd')){e.preventDefault();ACT.sel(e,e.target.closest('g.nd').dataset)}
});
document.addEventListener('input',e=>{
  if(e.target.id==='cmd-q'){U.cmdQ=e.target.value;U.cmdIdx=0;const cl=$('#cmd-list');if(cl)cl.innerHTML=cmdListHtml(cmdItems(U.cmdQ));return}
  if(e.target.id==='course-q'){U.courseQ=e.target.value;const pos=e.target.selectionStart;render();const el=$('#course-q');if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(x){}}return}
  if(e.target.id==='cat-q'){U.catQ=e.target.value;const pos=e.target.selectionStart;render();const el=$('#cat-q');if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(x){}}return}
  if(e.target.dataset&&e.target.dataset.c==='dashnote'){S.ui.dash.note=e.target.value;return}
  if(e.target.dataset&&e.target.dataset.c==='syltext')U.syl.text=e.target.value;
});
document.addEventListener('change',e=>{
  const t=e.target,k=t.dataset&&t.dataset.c;if(!k)return;
  if(k==='syltext'){U.syl.text=t.value;return}
  if(k==='sylf'){onFiles(e);return}
  if(k==='impf'){onImport(e);return}
  if(k==='enrf'){onOffers(e);return}
  if(k==='ai'){AI[t.dataset.f]=t.value.trim();try{localStorage.setItem(LSAI,JSON.stringify(AI))}catch(x){}U.imgMax=AI.key?8:0;render();return}
  const f=CHG[k]||CHG2[k];if(!f)return;
  try{f(e,t.dataset,t.value)}catch(err){console.error(err);return}
  if(k==='syl'||k==='sylA'||k==='wi'||k==='wiall'||k==='enrterm'||k==='enrq'||k==='mpick'||k==='enrpref'||k==='catcat'||k==='coursecat'||k==='courseq'||k==='pscsrow'){render();return}
  persist();render();
});
let dragId=null;
function clearDropMarks(){document.querySelectorAll('[data-drop]').forEach(x=>x.classList.remove('over','drop-ok','drop-warn','drop-bad'))}
document.addEventListener('dragstart',e=>{
  const c=e.target.closest&&e.target.closest('[data-drag]');if(!c)return;
  dragId=c.dataset.drag;
  try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(x){}
  document.querySelectorAll('[data-drop]').forEach(t=>{const st=canDropTerm(dragId,t.dataset.drop||'');t.classList.add('drop-'+st)});
});
document.addEventListener('dragover',e=>{const t=e.target.closest&&e.target.closest('[data-drop]');if(!t||!dragId)return;e.preventDefault();document.querySelectorAll('[data-drop].over').forEach(x=>{if(x!==t)x.classList.remove('over')});t.classList.add('over')});
document.addEventListener('drop',e=>{const t=e.target.closest&&e.target.closest('[data-drop]');clearDropMarks();if(!t||!dragId)return;e.preventDefault();const c=getC(dragId);dragId=null;if(c){pushUndo('Moved '+c.code);c.term=t.dataset.drop||null;persist();toast('Moved '+c.code,true)}});
document.addEventListener('dragend',()=>{dragId=null;clearDropMarks()});
window.addEventListener('hashchange',routeFromHash);

/* ---------- saving ---------- */
const LS='course-atlas.v1';
let timer=null;
function setSync(t){
  U.sync=t;
  const cls=/offline|could not|conflict/i.test(t||'')?'warn':'';
  const f=$('.sidefoot');
  if(f)f.innerHTML='<span class="sync-dot '+cls+'"></span><span>'+esc(t)+'</span>';
  const md=$('.mob-util .sync-dot');
  if(md){md.className='sync-dot'+(cls?' '+cls:'');md.title=t||''}
}
persist=function(){
  U.touched=true;
  try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
  if(HOST){
    setSync('Saving…');clearTimeout(timer);
    const okMsg=DESKTOP_HOST?'Saved on this computer':'Synced with server';
    const offMsg=DESKTOP_HOST?'Could not save to the data file':'Saved on device (offline)';
    timer=setTimeout(()=>{timer=null;HOST.save(JSON.stringify(S)).then(ok=>{if(ok!==false)setSync(okMsg)},()=>setSync(offMsg))},400);
    return;
  }
  setSync('Saved in this browser');
};
function migrateCourse(c){c.assess=(c.assess||[]).map(a=>a.items?a:{id:a.id||uid(),n:a.n,type:a.type||'Other',w:+a.w||0,cnt:1,drop:0,items:[{id:uid(),n:a.n,s:a.s==null?null:+a.s,m:100,due:a.due||'',st:'',late:false}]});if(!c.coreqs)c.coreqs=[]}
function migrateMinor(m){
  if(Array.isArray(m.slots)){m.slots.forEach(s=>{if(!s.ids){s.ids=s.courseId?[s.courseId]:[];delete s.courseId}});return m}
  return{id:m.id||uid(),name:m.name,unit:'',credits:+m.credits||0,minGrade:'',note:'',slots:(m.codes||[]).map(c=>({id:uid(),label:'',opts:[c],cr:3,pick:0,ids:[]}))};
}
function upgrade(o){
  const b=blank(),st=Object.assign(b,o,{settings:Object.assign(b.settings,o.settings||{})});
  if(!o.v||o.v<3){
    /* older saved plans are rebuilt from the current starting plan, keeping any final grades and settings you had entered */
    const old={};(o.courses||[]).forEach(c=>{const t=(o.terms||[]).find(x=>x.id===c.term);if(c.grade)old[NC(c.code)+'|'+(t?t.name:'')]=c.grade});
    const ns=seed();ns.courses.forEach(c=>{const t=ns.terms.find(x=>x.id===c.term),g=old[NC(c.code)+'|'+(t?t.name:'')];if(g&&!c.grade)c.grade=g});
    if(o.settings&&o.settings.targetGpa)ns.settings.targetGpa=o.settings.targetGpa;
    return ns;
  }
  st.courses.forEach(migrateCourse);
  st.minors=(st.minors||[]).map(migrateMinor);
  if(st.minors.length)ensureMinorCat(st.settings);
  if(!st.settings.unit&&/habib/i.test(st.settings.school||''))st.settings.unit='DSSE';
  (st.settings.cats||[]).forEach((c,i)=>{if(!c.color)c.color=CAT_COLORS[i%CAT_COLORS.length]});
  if(!Array.isArray(st.settings.portals)||!st.settings.portals.length){
    st.settings.portals=DEF_PORTALS.map(x=>Object.assign({},x));
  }
  if(typeof HC!=='undefined'&&HC){
    const mergeUrl=(id,val)=>{if(!val)return;const p=st.settings.portals.find(x=>x.id===id);if(p)p.url=val};
    mergeUrl('canvas',HC.canvasUrl);mergeUrl('pscs',HC.pscsUrl);mergeUrl('syllabus',HC.syllabusUrl);
  }
  const du=defUi(),ou=o.ui||{};
  const mergeWidgets=(defList,curList)=>{
    if(!Array.isArray(curList)||!curList.length)return defList;
    const out=curList.filter(x=>x&&x.w).map(x=>({w:x.w,size:x.size||'m',on:x.on!==false}));
    defList.forEach(d=>{if(!out.some(x=>x.w===d.w))out.push(Object.assign({},d))});
    return out;
  };
  st.ui={
    dash:{
      desktop:mergeWidgets(du.dash.desktop,ou.dash&&ou.dash.desktop),
      mobile:mergeWidgets(du.dash.mobile,ou.dash&&ou.dash.mobile),
      note:String((ou.dash&&ou.dash.note)||'')
    },
    plan:Object.assign({},du.plan,ou.plan||{}),
    modules:Object.assign({},du.modules,ou.modules||{}),
    accent:ou.accent||'blue',
    density:ou.density||'comfortable'
  };
  const ol=o.links||{};
  st.links={canvas:Object.assign({at:0,map:{}},ol.canvas||{}),pscs:Object.assign({at:0},ol.pscs||{})};
  st.v=5;return st;
}
function adopt(o){S=upgrade(o);S.sample=false}
async function boot(){
  try{applyTheme(localStorage.getItem(LSTHEME)||'')}catch(e){}
  try{U.railCollapsed=localStorage.getItem(LSRAIL)==='1'}catch(e){}
  let local=null;try{const r=localStorage.getItem(LS);if(r)local=JSON.parse(r)}catch(e){}
  let serverHad=false;
  if(HOST){try{HC=await HOST.config()}catch(e){}try{const r=await HOST.load();if(r){const o=JSON.parse(r);if(o&&Array.isArray(o.terms)&&!o.sample){local=o;serverHad=true}}}catch(e){}}
  try{const a=localStorage.getItem(LSAI);if(a)AI=Object.assign(AI,JSON.parse(a))}catch(e){}
  U.imgMax=AI.key?8:0;
  const okMsg=DESKTOP_HOST?'Saved on this computer':(HOST?'Synced with server':'Saved in this browser');
  const offMsg=DESKTOP_HOST?'Could not save to the data file':'Saved on device (offline)';
  if(local&&Array.isArray(local.terms)&&!local.sample){
    const was=local.v;adopt(local);
    if(!was||was<5)try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
    if(HOST){
      if(DESKTOP_HOST||!serverHad||!was||was<3)HOST.save(JSON.stringify(S)).then(()=>{setSync(okMsg)},()=>setSync(offMsg));
      else setSync(okMsg);
    }else setSync(okMsg);
  }else{
    S=seed();try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
    if(HOST)HOST.save(JSON.stringify(S)).then(()=>{setSync(okMsg)},()=>setSync(offMsg));
    else setSync(okMsg);
  }
  routeFromHash();
  render();
}
boot();
})();
</script>
