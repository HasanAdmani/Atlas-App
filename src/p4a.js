
/* ---------- roadmap ---------- */
const ORD=['Entry courses','Second step','Third step','Fourth step','Fifth step','Sixth step','Seventh step','Eighth step'];
function chain(id,m,dir){
  const res={};
  (function walk(i){
    const c=getC(i);if(!c)return;
    const nxt=dir==='up'?(c.prereqs||[]).map(p=>m[NC(p)]).filter(Boolean):S.courses.filter(o=>(o.prereqs||[]).some(p=>NC(p)===NC(c.code)));
    nxt.forEach(n=>{if(!res[n.id]){res[n.id]=1;walk(n.id)}});
  })(id);
  return res;
}
function vRoadmap(){
  if(!S.courses.length)return head('Roadmap','How your courses build on each other.')+'<div class="empty">Add courses with their prerequisites and the map draws itself.</div>';
  const m=byCode(),NW=164,NH=52,GX=64,GY=14,PX=20,PY=38;
  let list=S.courses.filter(counts);
  if(U.hideDone)list=list.filter(c=>status(c)!=='done');
  const dep={};list.forEach(c=>dep[c.id]=depth(c,m));
  const maxD=Math.max.apply(null,list.map(c=>dep[c.id]).concat([0]));
  const cols=[];for(let i=0;i<=maxD;i++)cols.push(list.filter(c=>dep[c.id]===i).sort((a,b)=>(termIdx(a.term)<0?99:termIdx(a.term))-(termIdx(b.term)<0?99:termIdx(b.term))||a.code.localeCompare(b.code)));
  const pos={};cols.forEach((cs,i)=>cs.forEach((c,j)=>pos[c.id]={x:PX+i*(NW+GX),y:PY+j*(NH+GY)}));
  const W=PX*2+(maxD+1)*NW+maxD*GX,H=PY+Math.max.apply(null,cols.map(c=>c.length))*(NH+GY)+12;
  const up=U.sel?chain(U.sel,m,'up'):{},down=U.sel?chain(U.sel,m,'down'):{};
  const on=id=>!U.sel||id===U.sel||up[id]||down[id];
  let ed='';
  list.forEach(c=>(c.prereqs||[]).forEach(code=>{const p=m[NC(code)];if(!p||!pos[p.id]||!pos[c.id])return;
    const a=pos[p.id],b=pos[c.id],x1=a.x+NW,y1=a.y+NH/2,x2=b.x,y2=b.y+NH/2,mx=(x1+x2)/2;
    const hi=U.sel&&on(p.id)&&on(c.id);
    ed+=`<path class="ed ${hi?'hi':U.sel?'dim':''}" marker-end="url(#${hi?'arrow-hi':'arrow'})" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2-2} ${y2}"/>`}));
  let nd='';
  list.forEach(c=>{const p=pos[c.id],ns=nodeState(c,m);
    const title=c.title.length>21?c.title.slice(0,20)+'…':c.title;
    nd+=`<g class="nd ${ns} ${on(c.id)?'':'dim'}" data-a="sel" data-id="${c.id}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(c.code+' '+c.title)}"><rect width="${NW}" height="${NH}" rx="9"/><text class="c" x="11" y="20">${esc(c.code)}${U.sel===c.id?'  ●':''}</text><text class="c" x="${NW-11}" y="20" text-anchor="end">${c.credits} cr</text><text class="n" x="11" y="39">${esc(title)}</text></g>`});
  let hd='';cols.forEach((cs,i)=>{if(cs.length)hd+=`<text class="colh" x="${PX+i*(NW+GX)}" y="20">${esc((ORD[i]||'Step '+(i+1)).toUpperCase())}</text>`});
  const s=U.sel?getC(U.sel):null;
  const upList=Object.keys(up).map(getC).filter(Boolean);
  const downList=Object.keys(down).map(getC).filter(Boolean);
  const info=s?`<div class="card" style="margin-top:16px;border-color:var(--accent-border)"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><span class="code">${esc(s.code)} · ${s.credits} cr · ${esc(catName(s.cat))}</span><h3>${esc(s.title)}</h3><div class="small muted" style="margin-top:4px">Needs ${upList.length} course${upList.length===1?'':'s'} before it · opens the way to ${downList.length}</div></div><div class="row">${stPill(s)}<button class="btn primary sm" data-a="open" data-id="${s.id}">Open</button><button class="btn ghost sm" data-a="sel" data-id="">Clear</button></div></div>${(upList.length||downList.length)?`<div class="grid g2" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line);gap:12px"><div><div class="lbl" style="margin-bottom:6px">Prerequisites</div><div class="opt-pills compact">${upList.length?upList.map(x=>`<button type="button" class="opt-pill" data-a="sel" data-id="${x.id}">${esc(x.code)}</button>`).join(''):'<span class="small muted">None</span>'}</div></div><div><div class="lbl" style="margin-bottom:6px">Unlocks</div><div class="opt-pills compact">${downList.length?downList.map(x=>`<button type="button" class="opt-pill" data-a="sel" data-id="${x.id}">${esc(x.code)}</button>`).join(''):'<span class="small muted">None</span>'}</div></div></div>`:''}</div>`:'';
  const open=S.courses.filter(c=>counts(c)&&nodeState(c,m)==='open').map(c=>({c,n:Object.keys(chain(c.id,m,'down')).length})).sort((a,b)=>b.n-a.n||a.c.code.localeCompare(b.c.code));
  return head('Roadmap','Read left to right. Each course sits one step after the longest chain of prerequisites that leads to it. Select a course to trace what it needs and what it opens.',`<button class="btn" data-a="hidedone">${U.hideDone?'Show finished courses':'Hide finished courses'}</button>`)+
  `<div class="map"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0 1L7 4L0 7Z" style="fill:var(--muted)" opacity=".55"/></marker>
    <marker id="arrow-hi" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L7 4L0 7Z" style="fill:var(--accent)"/></marker>
  </defs>${hd}${ed}${nd}</svg></div>
  <div class="legend" style="margin-top:12px"><span><i style="background:var(--good-soft);border-color:var(--good)"></i>Finished</span><span><i style="background:var(--accent-soft);border-color:var(--accent)"></i>This term</span><span><i style="border-style:dashed"></i>Planned</span><span><i style="border-color:var(--accent);border-style:dotted"></i>Ready to take, not scheduled</span><span><i></i>Locked behind a prerequisite</span></div>${info}
  <div class="sec"><h2>Good next picks</h2>${open.length?`<div class="card list" style="padding:4px 16px">${open.slice(0,8).map(o=>`<div class="li click" data-a="open" data-id="${o.c.id}"><div><span class="code">${esc(o.c.code)} · ${o.c.credits} cr</span><h3>${esc(o.c.title)}</h3></div><span class="pill acc">opens ${o.n}</span></div>`).join('')}</div><p class="small muted">Courses you could schedule today, ranked by how many later courses depend on them.</p>`:'<div class="empty">Every unscheduled course is still waiting on a prerequisite, or everything is scheduled.</div>'}</div>`;
}

/* ---------- four-year grid ---------- */
function canDropTerm(courseId,targetTermId){
  if(!targetTermId)return'ok';
  const c=getC(courseId);if(!c)return'ok';
  const m=byCode(),ti=termIdx(targetTermId);if(ti<0)return'ok';
  let sev='ok';
  const bump=s=>{if(s==='bad')sev='bad';else if(s==='warn'&&sev==='ok')sev='warn'};
  (c.prereqs||[]).forEach(code=>{
    const p=m[NC(code)];if(!p)return;
    if(!p.term){bump('warn');return}
    const pi=termIdx(p.term);
    if(pi>ti)bump('bad');else if(pi===ti)bump('warn');
  });
  (c.coreqs||[]).forEach(code=>{
    const p=m[NC(code)];if(!p||!p.term)return;
    if(termIdx(p.term)>ti)bump('bad');
  });
  S.courses.forEach(d=>{
    if(!d.term||d.id===c.id)return;
    if((d.prereqs||[]).some(x=>NC(x)===NC(c.code))){
      const di=termIdx(d.term);
      if(ti>di)bump('bad');else if(ti===di)bump('warn');
    }
  });
  if(c.term!==targetTermId){
    const t=termOf(targetTermId);
    if(t&&t.status!=='done'){
      const add=(S.settings.capOwn&&outside(c))?0:c.credits;
      if(loadOf(targetTermId)+add>(S.settings.maxLoad||18))bump('warn');
    }
  }
  return sev;
}
function groupTermsByYear(terms){
  const years=[];
  terms.forEach(t=>{
    const nm=String(t.name||'');
    const isFall=/^fall/i.test(nm),isSummer=/^sum/i.test(nm);
    const cur=years[years.length-1];
    if(!cur||isFall){years.push({terms:[t]});return}
    if(isSummer||cur.terms.length<2){cur.terms.push(t);return}
    years.push({terms:[t]});
  });
  return years;
}
function gcard(c,P){
  P=P||{colorBy:'status'};
  const is=prereqIssues(c).filter(i=>i.kind!=='missing'),l=effLetter(c);
  const gcls=P.colorBy==='grade'&&l?('g-'+(gradeCls(l)||'')):'';
  const catStyle=P.colorBy==='cat'?` style="border-left:3.5px solid ${esc(catColor(c.cat))};border-left-style:solid"`:'';
  const cls=P.colorBy==='status'?status(c):gcls;
  const mv=U.moveCourseId===c.id?'moving':'';
  const tip=(c.title||'')+(is.length?' · Prerequisite order warning':'')+' · Drag or click to open';
  return`<div class="cc ${cls} ${is.length?'warn':''} ${mv}"${catStyle} draggable="true" data-drag="${c.id}" data-a="open" data-id="${c.id}" title="${esc(tip)}"><div class="t1"><span class="code">${esc(c.code)}</span><span class="row" style="gap:3px;flex-wrap:nowrap"><span class="mono small" style="font-size:11px;color:var(--muted)">${c.credits}${l?' · <b style="color:var(--ink)">'+esc(l)+'</b>':''}</span><button type="button" class="cc-mv" data-a="startmove" data-id="${c.id}" title="Move to another term" aria-label="Move ${esc(c.code)}">⇄</button></span></div><div class="t2">${esc(c.title)}</div></div>`;
}
function termBoxHtml(t,P,isYear){
  const maxLoad=S.settings.maxLoad||18;
  const cs=S.courses.filter(c=>c.term===t.id),cr=loadOf(t.id),all=termCredits(t.id),g=termGpa(t);
  const over=cr>maxLoad&&t.status!=='done',barW=Math.min(100,cr/maxLoad*100);
  const mvBtn=U.moveCourseId?`<button type="button" class="btn sm mv-here mv-${canDropTerm(U.moveCourseId,t.id)}" data-a="moveto" data-term="${t.id}">Place</button>`:'';
  const cardsCls=isYear?'term-cards':'';
  return`<div class="term ${isYear?'term-yr':''}" data-drop="${t.id}"><header><b>${esc(t.name)}</b><span class="row" style="gap:6px;flex-wrap:nowrap"><span class="mono small" style="color:var(--${over?'warn':'muted'})">${cr}${all>cr?`+${all-cr}`:''}/${maxLoad} cr</span>${mvBtn}</span></header>
  <div class="bar" style="height:4px;margin-bottom:8px"><i class="${over?'w':t.status==='done'?'d':''}" style="width:${barW}%"></i></div>
  <div class="row" style="margin:0 0 8px;gap:5px"><span class="pill ${t.status==='done'?'good':t.status==='current'?'acc':''}">${t.status==='done'?'finished':t.status==='current'?'current':'planned'}</span>${g.gpa!=null?`<span class="pill">GPA ${fmt(g.gpa)}</span>`:''}</div>
  <div class="${cardsCls}">${cs.map(c=>gcard(c,P)).join('')||'<div class="small muted" style="padding:12px 4px;text-align:center;border:1px dashed var(--line);border-radius:8px">Drop courses here</div>'}</div></div>`;
}
function catalogTrayHtml(cat,P){
  const catCr=cat.reduce((a,c)=>a+c.credits,0);
  const open=!!(P.trayOpen||U.moveCourseId);
  if(!open){
    return`<div class="cat-bar" data-drop=""><div class="row" style="gap:8px"><b>Catalog</b><span class="pill">${cat.length} unscheduled · ${catCr} cr</span><span class="small muted">Drop a course here to unschedule</span></div><button type="button" class="btn sm" data-a="toggletray">Open catalog</button></div>`;
  }
  const q=(U.catQ||'').trim().toLowerCase(),ck=U.catCat||'';
  const shown=cat.filter(c=>(!ck||c.cat===ck)&&(!q||(c.code+' '+c.title).toLowerCase().includes(q)));
  const mvBtn=U.moveCourseId?`<button type="button" class="btn sm mv-here mv-ok" data-a="moveto" data-term="">Place in Catalog</button>`:'';
  return`<div class="cat-tray" data-drop=""><div class="cat-tray-head"><div class="row" style="gap:8px"><b>Catalog</b><span class="pill">${cat.length} unscheduled · ${catCr} cr</span>${mvBtn}</div><div class="row" style="gap:8px"><input type="search" id="cat-q" data-c="catq" value="${esc(U.catQ||'')}" placeholder="Search catalog…" style="width:170px;padding:4px 9px;font-size:13px"><select class="sel-pill" data-c="catcat" aria-label="Filter category"><option value="">All categories</option>${S.settings.cats.map(k=>`<option value="${esc(k.k)}" ${ck===k.k?'selected':''}>${esc(k.n)}</option>`).join('')}</select><button type="button" class="btn ghost sm" data-a="toggletray">Hide</button></div></div>
  <div class="term-cards">${shown.map(c=>gcard(c,P)).join('')||'<div class="small muted" style="padding:12px;grid-column:1/-1;text-align:center">No matching unscheduled courses.</div>'}</div></div>`;
}
function vGridYears(terms,cat,P){
  const years=groupTermsByYear(terms);
  const densCls=P.density==='mini'?'dens-mini':P.density==='comfort'?'':'dens-compact';
  const body=years.map((yr,idx)=>{
    const yts=yr.terms,ycs=yts.flatMap(t=>S.courses.filter(c=>c.term===t.id));
    const ycr=ycs.reduce((a,c)=>a+c.credits,0),yg=gpaOf(ycs,yts.some(t=>t.status==='current'));
    const allDone=yts.every(t=>t.status==='done'),isCur=yts.some(t=>t.status==='current');
    const exp=U.expandedYears&&U.expandedYears[idx];
    if(P.collapseDone&&allDone&&!exp){
      return`<div class="year-collapsed"><div class="row" style="gap:8px"><b>Year ${idx+1}</b><span class="pill good">finished</span><span class="small muted">${yts.map(t=>esc(t.name)).join(' · ')}</span><span class="mono small muted">${ycr} cr${yg.gpa!=null?' · GPA '+fmt(yg.gpa):''}</span></div><div class="row" style="gap:6px">${yts.map(t=>`<span class="pill" data-drop="${t.id}" title="Drop onto ${esc(t.name)}">${esc(t.name)}</span>`).join('')}<button type="button" class="btn sm ghost" data-a="expandyear" data-i="${idx}">Expand</button></div></div>`;
    }
    return`<section class="year-block"><div class="year-head"><div class="row" style="gap:8px"><h3 style="font-size:15px">Year ${idx+1}</h3>${isCur?'<span class="pill acc">current year</span>':allDone?'<span class="pill good">finished</span>':''}<span class="mono small muted">${ycr} cr${yg.gpa!=null?' · GPA '+fmt(yg.gpa):''}</span></div>${P.collapseDone&&allDone?`<button type="button" class="btn sm ghost" data-a="expandyear" data-i="${idx}">Collapse</button>`:''}</div><div class="year-terms">${yts.map(t=>termBoxHtml(t,P,true)).join('')}</div></section>`;
  }).join('');
  return catalogTrayHtml(cat,P)+`<div class="years-wrap ${densCls}">${body}</div>`;
}
function vGridTimeline(terms,cat,P){
  const done=terms.filter(t=>t.status==='done');
  const shown=P.collapseDone?terms.filter(t=>t.status!=='done'):terms;
  const effDens=P.density==='auto'?(shown.length>=7?'compact':'comfort'):P.density;
  const doneStrip=P.collapseDone&&done.length?`<div class="cat-bar" style="border-style:solid;margin-bottom:12px"><div class="row" style="gap:8px"><span class="small muted"><b>Finished:</b></span>${done.map(t=>{const g=termGpa(t);return`<span class="pill good" data-drop="${t.id}">${esc(t.name)} · ${loadOf(t.id)} cr${g.gpa!=null?' · '+fmt(g.gpa):''}</span>`}).join('')}</div><button type="button" class="btn sm ghost" data-a="plancfg" data-f="collapseDone" data-v="0">Show all</button></div>`:'';
  const grid=shown.length?`<div class="termwrap timeline dens-${effDens}" style="grid-template-columns:repeat(${shown.length},minmax(134px,1fr))">${shown.map(t=>termBoxHtml(t,P,false)).join('')}</div>`:'<div class="empty">All terms are finished and collapsed. Click "Show all" above to view them.</div>';
  return catalogTrayHtml(cat,P)+doneStrip+grid;
}
function vGrid(){
  if(!S.terms.length)return head('Four years','Every term at a glance.')+setupPanel();
  const P=(S.ui&&S.ui.plan)||{layout:'years',density:'auto',colorBy:'status',collapseDone:false,trayOpen:false};
  const cat=S.courses.filter(c=>!termOf(c.term));
  const tot=S.courses.filter(c=>termOf(c.term)&&counts(c)).reduce((a,c)=>a+c.credits,0);
  const laySeg=`<div class="seg" role="group" aria-label="Grid layout">${[['years','Years'],['timeline','Timeline']].map(([k,l])=>`<button type="button" class="${P.layout===k?'on':''}" data-a="plancfg" data-f="layout" data-v="${k}">${l}</button>`).join('')}</div>`;
  const densSeg=`<div class="seg" role="group" aria-label="Card density">${[['auto','Auto'],['comfort','Comfort'],['compact','Compact'],['mini','Mini']].map(([k,l])=>`<button type="button" class="${P.density===k?'on':''}" data-a="plancfg" data-f="density" data-v="${k}">${l}</button>`).join('')}</div>`;
  const colorSel=`<select class="sel-pill" data-c="plancfg" data-f="colorBy" aria-label="Color cards by">${[['status','Color: Status'],['cat','Color: Category'],['grade','Color: Grade']].map(([k,l])=>`<option value="${k}" ${P.colorBy===k?'selected':''}>${l}</option>`).join('')}</select>`;
  const bar=`<div class="grid-bar"><div class="grid-bar-grp">${laySeg}${densSeg}${colorSel}<button type="button" class="btn sm ${P.collapseDone?'soft':''}" data-a="plancfg" data-f="collapseDone" data-v="${P.collapseDone?'0':'1'}">${P.collapseDone?'Show finished':'Collapse done'}</button></div><div class="grid-bar-grp"><button type="button" class="btn sm ${P.trayOpen?'soft':''}" data-a="toggletray">Catalog (${cat.length})</button><span class="pill acc">${tot} / ${S.settings.totalCredits} cr</span></div></div>`;
  const mc=U.moveCourseId?getC(U.moveCourseId):null;
  const mvBar=mc?`<div class="move-bar"><span>Moving <b>${esc(mc.code)}</b> — tap <b>Place</b> on a term</span><div class="row" style="gap:8px"><button type="button" class="btn sm" data-a="moveto" data-term="">Move to Catalog</button><button type="button" class="btn sm ghost" data-a="cancelmove">Cancel</button></div></div>`:'';
  return bar+(P.layout==='timeline'?vGridTimeline(S.terms,cat,P):vGridYears(S.terms,cat,P))+mvBar;
}