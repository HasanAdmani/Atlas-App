
/* ---------- shared view bits ---------- */
const lpill=l=>{if(!l)return'<span class="pill">–</span>';const p=pointsOf(l);const cl=p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad';return`<span class="pill ${cl}">${esc(l)}</span>`};
const gradeCls=l=>{if(!l||l==='W'||l==='NC')return'';if(l==='CR')return'good';const p=pointsOf(l);return p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad'};
const stPill=c=>{const s=status(c);return s==='done'?'<span class="pill good">done</span>':s==='current'?'<span class="pill acc">in progress</span>':s==='planned'?'<span class="pill">planned</span>':'<span class="pill">not scheduled</span>'};
const catName=k=>{const x=S.settings.cats.find(c=>c.k===k);return x?x.n:k||'Uncategorised'};
let INNER=false;
const head=(t,sub,right)=>INNER?`<div class="row between" style="margin-bottom:18px;align-items:flex-start">${sub?`<p class="sub" style="margin:0">${sub}</p>`:'<span></span>'}${right?`<div class="row">${right}</div>`:''}</div>`:`<div class="head"><div><h1>${t}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div>${right?`<div class="row">${right}</div>`:''}</div>`;

const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateBadge(iso,d){
  const parts=String(iso||'').split('-');
  const mon=parts[1]?MONTHS[+parts[1]-1]||'':'';
  const day=parts[2]?parseInt(parts[2],10):'';
  const cls=d<0?'late':d<=3?'urgent':'';
  return`<div class="date-badge ${cls}"><b>${esc(day||'–')}</b><span>${esc(mon)}</span></div>`;
}

function spark(tr){
  if(tr.length<1)return'<div class="empty">The GPA curve appears once a term has graded courses.</div>';
  const W=600,H=184,L=34,R=20,T=16,B=28,max=Math.max.apply(null,S.settings.scale.map(x=>x.p))||4;
  const x=i=>tr.length===1?(L+W-R)/2:L+(W-L-R)*i/(tr.length-1),y=v=>T+(H-T-B)*(1-v/max);
  let g='';for(let v=0;v<=max+0.01;v+=1)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" style="fill:var(--muted);font:10.5px var(--f-mono)">${v}</text>`;
  const tg=S.settings.targetGpa;
  let tgtLine='';
  if(tg>0&&tg<=max){
    const ty=y(tg);
    tgtLine=`<line x1="${L}" x2="${W-R}" y1="${ty.toFixed(1)}" y2="${ty.toFixed(1)}" style="stroke:var(--good)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".65"/><text x="${W-R}" y="${(ty-5).toFixed(1)}" text-anchor="end" style="fill:var(--good);font:500 10px var(--f-mono)">target ${fmt(tg)}</text>`;
  }
  const line=k=>tr.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p[k]).toFixed(1)).join(' ');
  const area=line('cum')+` L${x(tr.length-1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  let dots='';tr.forEach((p,i)=>{
    dots+=`<circle cx="${x(i)}" cy="${y(p.term)}" r="3.5" style="fill:var(--surface);stroke:var(--muted)" stroke-width="1.75"/>`;
    dots+=`<circle cx="${x(i)}" cy="${y(p.cum)}" r="${i===tr.length-1?5.5:3.8}" style="fill:var(--accent);stroke:var(--surface)" stroke-width="1.5"/>`;
    dots+=`<text x="${x(i)}" y="${H-8}" text-anchor="${i===0&&tr.length>1?'start':i===tr.length-1&&tr.length>1?'end':'middle'}" style="fill:var(--muted);font:10px var(--f-mono)">${esc(p.name)}</text>`;
  });
  const last=tr[tr.length-1];
  return`<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="GPA by term">
  <defs><linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--accent);stop-opacity:.22"/><stop offset="100%" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>
  ${g}${tgtLine}<path d="${area}" fill="url(#spark-grad)"/><path d="${line('term')}" fill="none" style="stroke:var(--muted)" stroke-width="1.5" stroke-dasharray="3 3"/><path d="${line('cum')}" fill="none" style="stroke:var(--accent)" stroke-width="2.4" stroke-linecap="round"/>${dots}<text x="${Math.min(x(tr.length-1),W-R)}" y="${y(last.cum)-11}" text-anchor="end" style="fill:var(--accent);font:600 12px var(--f-mono)">${fmt(last.cum)}</text></svg>
  <div class="legend" style="margin-top:8px"><span><i style="background:var(--accent);border-color:var(--accent)"></i>Cumulative</span><span><i style="border-radius:99px"></i>Term</span>${tg>0&&tg<=max?`<span><i style="border-color:var(--good);border-style:dashed"></i>Target ${fmt(tg)}</span>`:''}</div>`;
}

function attention(){
  const out=[],m=byCode();
  let conf=0;S.courses.forEach(c=>{if(c.term&&prereqIssues(c).some(i=>i.kind!=='missing'))conf++});
  if(conf)out.push({t:'warn',x:`${conf} course${conf>1?'s are':' is'} scheduled before a prerequisite is finished`,to:'grid'});
  S.terms.forEach(t=>{const cr=loadOf(t.id);if(t.status!=='done'&&cr>S.settings.maxLoad)out.push({t:'warn',x:`${t.name} carries ${cr} credits, above your ${S.settings.maxLoad} credit limit`,to:'grid'})});
  const tg=S.settings.targetGpa;
  curCourses().forEach(c=>{const st=standing(c);if(st.pct!=null){const p=pointsOf(st.letter);if(p!=null&&p<tg-0.7)out.push({t:'bad',x:`${esc(c.code)} is at ${fmt(st.pct,1)}% (${esc(st.letter)}), well under your target`,course:c.id});}
    if(st.W&&Math.abs(st.W-100)>0.01)out.push({t:'warn',x:`${esc(c.code)} assessment weights add up to ${fmt(st.W,0)}%, not 100%`,course:c.id});
    if(!c.assess.length)out.push({t:'',x:`${esc(c.code)} has no assessments yet. Add them from its syllabus.`,course:c.id});});
  const placed=S.courses.filter(c=>termOf(c.term)&&counts(c)).reduce((a,c)=>a+c.credits,0),un=S.settings.totalCredits-placed;
  if(S.terms.length&&un>0)out.push({t:'',x:`${un} credits of your ${S.settings.totalCredits} are not in any term yet`,to:'req'});
  else if(S.terms.length&&un<0)out.push({t:'',x:`Your plan holds ${-un} credits beyond the ${S.settings.totalCredits} your degree needs, which is normal with a minor`,to:'req'});
  const ung=doneCourses().filter(c=>!c.grade&&counts(c)).length;
  if(ung)out.unshift({t:'',x:`${ung} finished courses have no final grade yet. Add them to see your GPA.`,to:'courses'});
  return out;
}

function setupPanel(){
  const y=new Date().getFullYear();
  return`<div class="card" style="max-width:660px"><h2>Set up your degree</h2><p class="sub" style="margin:0 0 18px">Tell Atlas how long your degree runs and where you are in it. Everything else (courses, grading breakdowns, prerequisites) comes from your syllabi and catalog.</p>
  <div class="fgrid"><label class="f"><span>Programme</span><input id="su-prog" placeholder="B.S. Electrical Engineering"></label>
  <label class="f"><span>University</span><input id="su-school" placeholder="Your university"></label>
  <label class="f"><span>First term</span><div class="row" style="gap:6px;flex-wrap:nowrap"><select id="su-season"><option>Fall</option><option>Spring</option></select><input id="su-year" type="number" value="${y-1}" style="width:86px"></div></label>
  <label class="f"><span>Terms finished so far</span><input id="su-done" type="number" min="0" max="12" value="2"></label>
  <label class="f"><span>Terms in the degree</span><input id="su-n" type="number" min="2" max="14" value="8"></label>
  <label class="f"><span>Credits to graduate</span><input id="su-cr" type="number" value="130"></label></div>
  <div class="row" style="margin-top:20px"><button class="btn primary" data-a="setup">Create my terms</button><button class="btn" data-a="loadsample">Load the Habib EE grid</button></div></div>`;
}

/* ---------- views ---------- */
function vOverview(){
  if(!S.terms.length)return head('Atlas','One place for your grades, your roadmap and your four years.')+setupPanel();
  const cum=cumulative(),er=earnedCredits(),tot=S.settings.totalCredits,tg=S.settings.targetGpa;
  const cur=curCourses(),cg=gpaOf(cur,true),proj=gpaOf(doneCourses().concat(cur),true);
  const curCr=cur.reduce((a,c)=>a+c.credits,0),planCr=planCourses().filter(counts).reduce((a,c)=>a+c.credits,0);
  const pct=Math.min(100,er/tot*100),d=cum.gpa==null?null:cum.gpa-tg;
  const dl=deadlines().slice(0,5),att=attention().slice(0,4);
  const ct=S.terms.find(t=>t.status==='current');
  return head(esc(S.settings.program||'Your degree'),esc(S.settings.school||'')+(ct?(S.settings.school?' · ':'')+'now in '+esc(ct.name):''))+`
  <div class="grid g3">
    <div class="card kpi-card ${d==null?'kpi-acc':d>=0?'kpi-good':'kpi-warn'}">
      <div class="row between"><div class="lbl">Cumulative GPA</div>${d!=null?`<span class="pill ${d>=0?'good':'bad'}">${d>=0?'+':''}${fmt(d)} vs target</span>`:''}</div>
      <div class="num" style="margin:12px 0 10px">${fmt(cum.gpa)}</div>
      <div class="small muted">${d==null?'Enter final grades for finished courses':`Target ${fmt(tg)} across ${cum.cr} graded credits`}</div>
    </div>
    <div class="card kpi-card kpi-acc">
      <div class="row between"><div class="lbl">This term so far</div>${ct?`<span class="pill acc">${esc(ct.name)}</span>`:''}</div>
      <div class="num" style="margin:12px 0 10px">${fmt(cg.gpa)}</div>
      <div class="small muted">${cur.length} courses · ${curCr} credits${proj.gpa!=null&&cum.gpa!=null?` · projected cum <b class="mono">${fmt(proj.gpa)}</b>`:''}</div>
    </div>
    <div class="card kpi-card kpi-good" style="flex-direction:row;align-items:center;gap:18px;justify-content:flex-start">
      <div class="ring" style="--p:${pct.toFixed(1)}"><div>${Math.round(pct)}%</div></div>
      <div style="min-width:0"><div class="lbl">Credits earned</div><div class="mono" style="font-size:24px;font-weight:600;margin:6px 0 4px">${er}<span class="muted" style="font-weight:400"> / ${tot}</span></div><div class="small muted">${curCr} in progress · ${planCr} planned</div></div>
    </div>
  </div>
  <div class="grid g2 sec">
    <div><h2>In progress</h2>${cur.length?`<div class="card list" style="padding:4px 16px">${cur.map(c=>{const st=standing(c);return`<div class="li click" data-a="open" data-id="${c.id}"><div style="min-width:0;flex:1"><div class="row" style="gap:6px;margin-bottom:2px"><span class="code">${esc(c.code)}</span><span class="pill" style="padding:2px 7px;font-size:10px">${c.credits} cr</span></div><h3>${esc(c.title)}</h3><div class="bar" style="margin-top:8px;width:min(240px,100%)"><i class="d" style="width:${st.W?st.gw/st.W*100:0}%"></i></div></div><div style="text-align:right;flex:none"><div class="mono small" style="margin-bottom:4px;font-weight:500">${st.pct==null?'–':fmt(st.pct,1)+'%'}</div>${lpill(st.letter)}</div></div>`}).join('')}</div>`:'<div class="empty">No course is in progress. Move courses into your current term on the Plan page.</div>'}</div>
    <div><h2>Due next</h2>${dl.length?`<div class="card list" style="padding:4px 16px">${dl.map(x=>`<div class="li click" data-a="open" data-id="${x.c.id}"><div class="row" style="flex-wrap:nowrap;gap:12px;min-width:0">${dateBadge(x.a.due,x.d)}<div style="min-width:0"><span class="code">${esc(x.c.code)}</span><h3>${esc(x.a.n)}</h3></div></div><div class="row" style="gap:6px;justify-content:flex-end;flex:none"><span class="pill ${x.d<0?'bad':x.d<=3?'warn':''}">${x.d<0?Math.abs(x.d)+'d late':x.d===0?'today':'in '+x.d+'d'}</span><span class="pill acc">${fmt(x.a.w,0)}%</span></div></div>`).join('')}</div>`:'<div class="empty">Nothing dated yet. Add due dates in a course, or from its syllabus.</div>'}</div>
  </div>
  <div class="grid g2 sec">
    <div><h2>GPA by term</h2><div class="card">${spark(trend())}</div></div>
    <div><h2>Worth a look</h2>${att.length?`<div class="card list" style="padding:4px 16px">${att.map(a=>`<div class="li click" ${a.course?`data-a="open" data-id="${a.course}"`:`data-a="go" data-v="${a.to}"`}><span class="row" style="flex-wrap:nowrap;gap:10px"><span class="pill ${a.t}" style="flex:none">${a.t==='bad'?'grade':a.t==='warn'?'plan':'note'}</span><span class="small">${a.x}</span></span><span class="muted" style="font-size:18px;line-height:1">›</span></div>`).join('')}</div>`:'<div class="empty">Nothing needs attention right now.</div>'}</div>
  </div>`;
}

function courseRow(c){
  const st=standing(c),is=prereqIssues(c).filter(i=>i.kind!=='missing'),l=effLetter(c),s=status(c);
  const rt=S.courses.find(o=>o.retakeOf===c.id);
  const gcls=gradeCls(c.grade);
  const gsel=`<select class="sel-pill ${gcls}" data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade for ${esc(c.code)}">${gradeOpts(c).map(g=>`<option value="${esc(g)}" ${(c.grade||'')===g?'selected':''}>${g===''?'Grade':g}</option>`).join('')}</select>`;
  return`<div class="li click" data-a="open" data-id="${c.id}"><div style="min-width:0"><span class="code">${esc(c.code)} · ${c.credits} cr · ${esc(catName(c.cat))}</span><h3>${esc(c.title)}</h3></div><div class="row" style="gap:6px;justify-content:flex-end">${c.retakeOf?'<span class="pill acc">retake</span>':''}${c.was?`<span class="pill">in place of ${esc(c.was.code)}</span>`:''}${rt?`<span class="pill">retaken ${esc((termOf(rt.term)||{}).name||'')}</span>`:''}${is.length?'<span class="pill warn">prereq order</span>':''}${s==='current'&&st.pct!=null?`<span class="mono small muted">${fmt(st.pct,1)}%</span>`:''}${s==='done'?gsel:(l?lpill(l):stPill(c))}</div></div>`;
}
function vCourses(){
  const add=`<button class="btn primary" data-a="go" data-v="add">+ Add course</button>`;
  if(!S.courses.length)return head('Courses','Every course with its grading breakdown.',add)+'<div class="empty">No courses yet. Add one from a syllabus or by hand.</div>';
  const T=S.terms,ci=T.findIndex(t=>t.status==='current');
  const ni=T.findIndex((t,i)=>t.status==='planned'&&i>ci);
  let li=-1;T.forEach((t,i)=>{if(t.status==='done'&&(ci<0||i<ci))li=i});
  const view=U.cview&&(U.cview==='all'||T.some(t=>t.id===U.cview))?U.cview:'now';
  let shown=view==='all'?T.slice():view==='now'?T.filter((t,i)=>i===li||i===ci||i===ni):T.filter(t=>t.id===view);
  if(!shown.length)shown=T.slice(0,2);
  const strip=`<div class="tabs"><a href="#" data-a="cview" data-v="now" ${view==='now'?'aria-current="page"':''}>Now</a>${T.map(t=>`<a href="#" data-a="cview" data-v="${t.id}" ${view===t.id?'aria-current="page"':''}>${esc(t.name)}</a>`).join('')}<a href="#" data-a="cview" data-v="all" ${view==='all'?'aria-current="page"':''}>All</a></div>`;
  const blocks=`<div class="cols" style="margin-top:4px">`+shown.map(t=>{
    const cs=S.courses.filter(c=>c.term===t.id),g=termGpa(t);
    const stBadge=`<span class="pill ${t.status==='done'?'good':t.status==='current'?'acc':''}">${t.status==='done'?'finished':t.status==='current'?'current':'planned'}</span>`;
    return`<div class="sec"><div class="row between" style="margin-bottom:10px"><div class="row" style="gap:8px"><h2 style="margin:0;font-size:13px;color:var(--ink)">${esc(t.name)}</h2>${stBadge}</div><div class="row" style="gap:6px"><span class="pill">${cs.reduce((a,c)=>a+c.credits,0)} cr</span>${g.gpa!=null?`<span class="pill acc">GPA ${fmt(g.gpa)}</span>`:''}</div></div>${cs.length?`<div class="card list" style="padding:4px 16px">${cs.map(courseRow).join('')}</div>`:'<div class="empty">Empty term</div>'}</div>`;
  }).join('')+`</div>`;
  const cat=S.courses.filter(c=>!termOf(c.term));
  return head('Courses','Your current term, the next one and the last one you finished. Pick any term below to focus on it or enter final grades.',add+`<button class="btn" data-a="go" data-v="canvas">Sync from Canvas</button>`)+strip+blocks+(cat.length&&(view==='now'||view==='all')?`<div class="sec" style="margin-top:26px"><h2>Not in a term yet</h2><div class="card list" style="padding:4px 16px">${cat.map(courseRow).join('')}</div></div>`:'');
}

const gradeOpts=c=>{const t=termOf(c.term);return t&&t.cr?['','CR','NC']:['',...S.settings.scale.map(x=>x.l),'W']};
const STOPT=[['','No flag'],['submitted','Submitted'],['missing','Missing'],['excused','Excused']];
function groupCard(c,g){
  const gs=gstat(g),A=`data-id="${c.id}" data-gid="${g.id}"`;
  const rows=(g.items||[]).map(it=>{const p=ipct(it),B=`${A} data-iid="${it.id}"`;
    const fcls=it.st==='submitted'?'acc':it.st==='missing'?'bad':it.st==='excused'?'warn':'';
    return`<div class="ir"><input class="nm" data-c="it" data-f="n" ${B} value="${esc(it.n)}" aria-label="Item name"><input type="number" step="any" data-c="it" data-f="s" ${B} value="${it.s==null?'':it.s}" placeholder="–" aria-label="Score"><input type="number" step="any" data-c="it" data-f="m" ${B} value="${it.m==null?'':it.m}" aria-label="Out of"><span class="mono small muted">${p==null?'':fmt(p,0)+'%'}</span><input type="date" data-c="it" data-f="due" ${B} value="${esc((it.due||'').slice(0,10))}" aria-label="Due date"><select class="sel-pill ${fcls}" data-c="it" data-f="st" ${B} aria-label="Flag">${STOPT.map(o=>`<option value="${o[0]}" ${(it.st||'')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select><button class="btn ghost danger" data-a="delitem" ${B} aria-label="Remove item">✕</button></div>`}).join('');
  return`<div class="gc"><div class="gh"><input data-c="gr" data-f="n" ${A} value="${esc(g.n)}" aria-label="Group name" style="flex:1 1 150px;font-weight:600"><select class="sel-pill" data-c="gr" data-f="type" ${A} aria-label="Type">${ATYPES.map(t=>`<option ${g.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="btn ghost danger" data-a="delgroup" ${A} aria-label="Remove group">✕</button></div>
  <div class="gh small muted"><label class="row" style="gap:6px">Weight <input class="w" type="number" step="any" data-c="gr" data-f="w" ${A} value="${g.w}" style="width:64px"> %</label><label class="row" style="gap:6px">Items <input class="w" type="number" min="1" data-c="gr" data-f="cnt" ${A} value="${gs.n}" style="width:54px"></label><label class="row" style="gap:6px">Drop lowest <input class="w" type="number" min="0" data-c="gr" data-f="drop" ${A} value="${g.drop||0}" style="width:54px"></label></div>
  <div class="ir ih"><span>Item</span><span>Score</span><span>Out of</span><span></span><span>Due</span><span>Flag</span><span></span></div>${rows}
  <div class="row between" style="margin-top:10px"><button class="btn sm" data-a="additem" ${A}>+ Add item</button><span class="small muted">${gs.used?`<b>${fmt(gs.mean,0)}%</b> across best ${gs.used} · `:'No scores yet · '}counts ${gs.k} of ${gs.n}</span></div></div>`;
}
function gradesTab(c,st){
  const sc=S.settings.scale,tgt=sc.filter(x=>x.p>0);
  const needRows=tgt.map(x=>{const n=needed(c,x.min);let v,cl='';
    if(n==null)v='–';else if(n<=0){v='secured';cl='good'}else if(n>100){v='out of reach';cl='bad'}else{v=fmt(n,1)+'%';cl=n>90?'warn':''}
    return`<div class="kv"><span>To finish with ${lpill(x.l)} <span class="muted small">(${x.min}%)</span></span><span class="mono" style="font-weight:600;${cl?`color:var(--${cl})`:''}">${v}</span></div>`}).join('');
  const goalPills=`<div class="opt-pills compact" style="margin-top:6px"><button type="button" class="opt-pill ${!c.goal?'on subtle':''}" data-a="pickgoal" data-id="${c.id}" data-v="">None</button>${sc.map(x=>`<button type="button" class="opt-pill ${c.goal===x.l?'on':''}" data-a="pickgoal" data-id="${c.id}" data-v="${esc(x.l)}">${esc(x.l)}</button>`).join('')}</div>`;
  const gOpts=gradeOpts(c);
  const gradePills=`<div class="opt-pills compact" style="margin-top:6px">${gOpts.map(l=>{const on=(c.grade||'')===l;const cl=l?gradeCls(l):'subtle';return`<button type="button" class="opt-pill ${on?'on '+cl:''}" data-a="pickgrade" data-id="${c.id}" data-v="${esc(l)}">${l===''?'Unset':esc(l)}</button>`}).join('')}</div>`;
  return`<div class="grid g2" style="margin-bottom:22px">
    <div class="card"><div class="lbl">Standing now</div><div class="row" style="gap:12px;margin-top:10px"><span class="num" style="font-size:52px">${st.pct==null?'–':fmt(st.pct,1)}<span class="muted" style="font-size:24px">%</span></span>${lpill(st.letter)}</div>
    <div class="bar" style="margin:12px 0 8px"><i class="d" style="width:${st.W?Math.min(100,st.gw/st.W*100):0}%"></i></div>
    <div class="small muted">${fmt(st.gw,0)} of ${fmt(st.W,0)}% marked${st.W?` · Final between <b class="mono">${fmt(st.floor,1)}%</b> and <b class="mono">${fmt(st.ceil,1)}%</b>`:'.'}</div></div>
    <div class="card" style="display:flex;flex-direction:column;gap:14px">
      <div><div class="lbl">Goal grade</div>${goalPills}</div>
      <div style="border-top:1px solid var(--line);padding-top:12px"><div class="lbl">Final grade</div>${gradePills}<div class="small muted" style="margin-top:8px">Set once posted by the registrar. Feeds your GPA.</div></div>
    </div>
  </div>
  <h2>Grading breakdown</h2>${(c.assess||[]).map(g=>groupCard(c,g)).join('')||'<div class="empty">No grading groups yet. Add one, or read a syllabus.</div>'}
  <div class="row between" style="margin:8px 0 26px"><button class="btn" data-a="addgroup" data-id="${c.id}">+ Add a group</button><span class="pill ${Math.abs(st.W-100)>0.01&&st.W?'warn':'good'}">Total weight ${fmt(st.W,0)}%</span></div>
  <h2>What you need on the rest</h2>${st.rem>0&&st.W?`<div class="card" style="padding:4px 16px">${needRows}</div><p class="small muted">Average needed across the ${fmt(st.rem,0)}% still to be marked.</p>`:'<div class="empty">Everything is marked, or no weights are set.</div>'}`;
}

/* ---------- course drawer ---------- */
function drawer(){
  const c=getC(U.course);if(!c)return'';
  const st=standing(c);
  const dep=S.courses.filter(o=>(o.prereqs||[]).some(p=>NC(p)===NC(c.code)));
  const is=prereqIssues(c);
  const termOpts=`<option value="">Not scheduled</option>`+S.terms.map(t=>`<option value="${t.id}" ${c.term===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  const catOpts=S.settings.cats.map(k=>`<option value="${esc(k.k)}" ${c.cat===k.k?'selected':''}>${esc(k.n)}</option>`).join('');
  const tabs=`<div class="tabs"><a href="#" data-a="tab" data-v="assess" ${U.tab==='assess'?'aria-current="page"':''}>Grades</a><a href="#" data-a="tab" data-v="details" ${U.tab==='details'?'aria-current="page"':''}>Details</a></div>`;
  let body='';
  if(U.tab==='assess'){
    body=gradesTab(c,st);
  }else{
    body=`<div class="fgrid" style="margin-bottom:16px">
    <label class="f"><span>Code</span><input data-c="cf" data-f="code" data-id="${c.id}" value="${esc(c.code)}"></label>
    <label class="f"><span>Credits</span><input type="number" step="any" data-c="cf" data-f="credits" data-id="${c.id}" value="${c.credits}"></label>
    <label class="f"><span>Term</span><select data-c="cf" data-f="term" data-id="${c.id}">${termOpts}</select></label>
    <label class="f"><span>Counts toward</span><select data-c="cf" data-f="cat" data-id="${c.id}">${catOpts}</select></label></div>
    <label class="f" style="margin-bottom:14px"><span>Title</span><input data-c="cf" data-f="title" data-id="${c.id}" value="${esc(c.title)}"></label>
    <label class="f" style="margin-bottom:14px"><span>Prerequisites (course codes, comma separated)</span><input data-c="cf" data-f="prereqs" data-id="${c.id}" value="${esc((c.prereqs||[]).join(', '))}"></label>
    <label class="f" style="margin-bottom:14px"><span>Co-requisites (can be taken in the same term)</span><input data-c="cf" data-f="coreqs" data-id="${c.id}" value="${esc((c.coreqs||[]).join(', '))}"></label>
    ${is.length?`<div class="banner">${is.map(i=>i.kind==='missing'?`${esc(i.code)} is not in your course list yet.`:i.kind==='unscheduled'?`${esc(i.code)} is not scheduled in any term.`:i.kind==='same'?`${esc(i.code)} is in the same term.`:`${esc(i.code)} comes after this course.`).join(' ')}</div>`:''}
    <label class="f" style="margin-bottom:14px"><span>This course is a retake of</span><select data-c="cf" data-f="retakeOf" data-id="${c.id}"><option value="">Not a retake</option>${S.courses.filter(o=>o.id!==c.id).map(o=>`<option value="${o.id}" ${c.retakeOf===o.id?'selected':''}>${esc(o.code)} · ${esc((termOf(o.term)||{}).name||'no term')}</option>`).join('')}</select></label>
    <label class="f" style="margin-bottom:14px"><span>Instructor</span><input data-c="cf" data-f="instructor" data-id="${c.id}" value="${esc(c.instructor||'')}"></label>
    <label class="f" style="margin-bottom:18px"><span>Notes</span><textarea rows="4" data-c="cf" data-f="notes" data-id="${c.id}">${esc(c.notes||'')}</textarea></label>
    ${dep.length?`<h2>Unlocks</h2><div class="row" style="margin-bottom:22px">${dep.map(o=>`<button class="btn sm" data-a="open" data-id="${o.id}">${esc(o.code)}</button>`).join('')}</div>`:''}
    <button class="btn danger" data-a="delcourse" data-id="${c.id}">Delete this course</button>`;
  }
  return`<div class="veil" data-a="closebg"><div class="drawer" role="dialog" aria-label="${esc(c.code)}"><div class="row between" style="align-items:flex-start;margin-bottom:8px"><div><span class="code">${esc(c.code)} · ${c.credits} credits · ${esc(catName(c.cat))}</span><h1 style="margin-top:6px">${esc(c.title)}</h1></div><button class="btn ghost" data-a="close" aria-label="Close">✕</button></div><div class="row" style="margin:10px 0 18px;gap:8px">${stPill(c)}${c.instructor?`<span class="pill">${esc(c.instructor)}</span>`:''}</div>${tabs}${body}</div></div>`;
}