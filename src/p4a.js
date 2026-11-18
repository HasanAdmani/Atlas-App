
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
function gcard(c){
  const is=prereqIssues(c).filter(i=>i.kind!=='missing'),l=effLetter(c);
  return`<div class="cc ${status(c)} ${is.length?'warn':''}" draggable="true" data-drag="${c.id}" data-a="open" data-id="${c.id}" title="${is.length?'A prerequisite is not finished before this course':'Drag to another term, or tap to edit'}"><div class="t1"><span class="code">${esc(c.code)}</span><span class="mono small" style="font-size:11px;color:var(--muted)">${c.credits} cr${l?' · <b style="color:var(--ink)">'+esc(l)+'</b>':''}</span></div><div class="t2">${esc(c.title)}</div></div>`;
}
function vGrid(){
  if(!S.terms.length)return head('Four years','Every term at a glance.')+setupPanel();
  const cat=S.courses.filter(c=>!termOf(c.term)),maxLoad=S.settings.maxLoad||18;
  const cols=S.terms.map(t=>{const cs=S.courses.filter(c=>c.term===t.id),cr=loadOf(t.id),all=termCredits(t.id),g=termGpa(t);
    const over=cr>maxLoad&&t.status!=='done';
    const barW=Math.min(100,cr/maxLoad*100);
    return`<div class="term" data-drop="${t.id}"><header><b>${esc(t.name)}</b><span class="mono small" style="color:var(--${over?'warn':'muted'})">${cr}${all>cr?`+${all-cr}`:''}/${maxLoad} cr</span></header>
    <div class="bar" style="height:4px;margin-bottom:10px"><i class="${over?'w':t.status==='done'?'d':''}" style="width:${barW}%"></i></div>
    <div class="row" style="margin:0 0 10px;gap:6px"><span class="pill ${t.status==='done'?'good':t.status==='current'?'acc':''}">${t.status==='done'?'finished':t.status==='current'?'current':'planned'}</span>${g.gpa!=null?`<span class="pill">GPA ${fmt(g.gpa)}</span>`:''}</div>${cs.map(gcard).join('')}${cs.length?'':'<div class="small muted" style="padding:14px 4px;text-align:center;border:1px dashed var(--line);border-radius:8px">Drop courses here</div>'}</div>`}).join('');
  const tot=S.courses.filter(c=>termOf(c.term)&&counts(c)).reduce((a,c)=>a+c.credits,0);
  return head('Four years','Drag a course to move it between terms. On a phone, tap a course and pick its term. A dashed outline means a prerequisite is not finished before that course.',`<span class="pill acc">${tot} of ${S.settings.totalCredits} credits placed</span>`)+
  `<div class="termwrap"><div class="term" data-drop=""><header><b>Catalog</b><span class="mono small muted">${cat.reduce((a,c)=>a+c.credits,0)} cr</span></header><div class="small muted" style="margin:-2px 0 10px">Not in a term yet</div>${cat.map(gcard).join('')||'<div class="small muted" style="padding:14px 4px;text-align:center;border:1px dashed var(--line);border-radius:8px">Nothing waiting</div>'}</div>${cols}</div>`;
}