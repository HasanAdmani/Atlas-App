
/* ---------- shared view bits ---------- */
const lpill=l=>{if(!l)return'<span class="pill">–</span>';const p=pointsOf(l);const cl=p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad';return`<span class="pill ${cl}">${esc(l)}</span>`};
const stPill=c=>{const s=status(c);return s==='done'?'<span class="pill good">done</span>':s==='current'?'<span class="pill acc">in progress</span>':s==='planned'?'<span class="pill">planned</span>':'<span class="pill">not scheduled</span>'};
const catName=k=>{const x=S.settings.cats.find(c=>c.k===k);return x?x.n:k||'Uncategorised'};
let INNER=false;
const head=(t,sub,right)=>INNER?`<div class="row between" style="margin-bottom:16px;align-items:flex-start">${sub?`<p class="sub" style="margin:0">${sub}</p>`:'<span></span>'}${right?`<div class="row">${right}</div>`:''}</div>`:`<div class="head"><div><h1>${t}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div>${right?`<div class="row">${right}</div>`:''}</div>`;

function spark(tr){
  if(tr.length<1)return'<div class="empty">The GPA curve appears once a term has graded courses.</div>';
  const W=600,H=170,L=34,R=18,T=14,B=26,max=Math.max.apply(null,S.settings.scale.map(x=>x.p))||4;
  const x=i=>tr.length===1?(L+W-R)/2:L+(W-L-R)*i/(tr.length-1),y=v=>T+(H-T-B)*(1-v/max);
  let g='';for(let v=0;v<=max+0.01;v+=1)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" style="fill:var(--muted);font:11px var(--f-mono)">${v}</text>`;
  const line=k=>tr.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p[k]).toFixed(1)).join(' ');
  const area=line('cum')+` L${x(tr.length-1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  let dots='';tr.forEach((p,i)=>{dots+=`<circle cx="${x(i)}" cy="${y(p.term)}" r="3" style="fill:var(--surface);stroke:var(--muted)" stroke-width="1.5"/>`;dots+=`<circle cx="${x(i)}" cy="${y(p.cum)}" r="${i===tr.length-1?5:3}" style="fill:var(--accent)"/>`;
    dots+=`<text x="${x(i)}" y="${H-8}" text-anchor="${i===0&&tr.length>1?'start':i===tr.length-1&&tr.length>1?'end':'middle'}" style="fill:var(--muted);font:10px var(--f-mono)">${esc(p.name)}</text>`});
  const last=tr[tr.length-1];
  return`<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="GPA by term">${g}<path d="${area}" style="fill:var(--accent);opacity:.09"/><path d="${line('term')}" fill="none" style="stroke:var(--muted)" stroke-width="1.4" stroke-dasharray="3 3"/><path d="${line('cum')}" fill="none" style="stroke:var(--accent)" stroke-width="2.2"/>${dots}<text x="${Math.min(x(tr.length-1),W-R)}" y="${y(last.cum)-11}" text-anchor="end" style="fill:var(--accent);font:500 12px var(--f-mono)">${fmt(last.cum)}</text></svg>
  <div class="legend" style="margin-top:6px"><span><i style="background:var(--accent);border-color:var(--accent)"></i>Cumulative</span><span><i style="border-radius:99px"></i>Term</span></div>`;
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
  return`<div class="card" style="max-width:640px"><h2>Set up your degree</h2><p class="sub" style="margin:0 0 16px">Tell Atlas how long your degree runs and where you are in it. Everything else (courses, grading breakdowns, prerequisites) comes from your syllabi and catalog.</p>
  <div class="fgrid"><label class="f"><span>Programme</span><input id="su-prog" placeholder="B.S. Electrical Engineering"></label>
  <label class="f"><span>University</span><input id="su-school" placeholder="Your university"></label>
  <label class="f"><span>First term</span><div class="row" style="gap:6px;flex-wrap:nowrap"><select id="su-season"><option>Fall</option><option>Spring</option></select><input id="su-year" type="number" value="${y-1}" style="width:80px"></div></label>
  <label class="f"><span>Terms finished so far</span><input id="su-done" type="number" min="0" max="12" value="2"></label>
  <label class="f"><span>Terms in the degree</span><input id="su-n" type="number" min="2" max="14" value="8"></label>
  <label class="f"><span>Credits to graduate</span><input id="su-cr" type="number" value="130"></label></div>
  <div class="row" style="margin-top:16px"><button class="btn primary" data-a="setup">Create my terms</button><button class="btn" data-a="loadsample">Load the Habib EE grid</button></div></div>`;
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
    <div class="card"><div class="lbl">Cumulative GPA</div><div class="num" style="margin:10px 0 8px">${fmt(cum.gpa)}</div>
      <div class="small muted">${d==null?'Enter final grades for finished courses':`Target ${fmt(tg)} · <span style="color:var(--${d>=0?'good':'bad'})">${d>=0?'+':''}${fmt(d)}</span>`}</div></div>
    <div class="card"><div class="lbl">This term so far</div><div class="num" style="margin:10px 0 8px">${fmt(cg.gpa)}</div>
      <div class="small muted">${cur.length} courses, ${curCr} credits${proj.gpa!=null&&cum.gpa!=null?` · cumulative would be <b class="mono">${fmt(proj.gpa)}</b>`:''}</div></div>
    <div class="card row" style="flex-wrap:nowrap;gap:18px"><div class="ring" style="--p:${pct.toFixed(1)}"><div>${Math.round(pct)}%</div></div>
      <div><div class="lbl">Credits earned</div><div class="mono" style="font-size:22px;margin:6px 0 2px">${er}<span class="muted"> / ${tot}</span></div><div class="small muted">${curCr} now · ${planCr} planned</div></div></div>
  </div>
  <div class="grid g2 sec">
    <div><h2>In progress</h2>${cur.length?`<div class="card list" style="padding:4px 16px">${cur.map(c=>{const st=standing(c);return`<div class="li click" data-a="open" data-id="${c.id}"><div style="min-width:0"><span class="code">${esc(c.code)}</span><h3>${esc(c.title)}</h3><div class="bar" style="margin-top:7px;width:min(220px,100%)"><i class="d" style="width:${st.W?st.gw/st.W*100:0}%"></i></div></div><div style="text-align:right"><div class="mono">${st.pct==null?'–':fmt(st.pct,1)+'%'}</div>${lpill(st.letter)}</div></div>`}).join('')}</div>`:'<div class="empty">No course is in progress. Move courses into your current term on the Plan page.</div>'}</div>
    <div><h2>Due next</h2>${dl.length?`<div class="card list" style="padding:4px 16px">${dl.map(x=>`<div class="li click" data-a="open" data-id="${x.c.id}"><div style="min-width:0"><span class="code">${esc(x.c.code)}</span><h3>${esc(x.a.n)}</h3></div><div style="text-align:right"><div class="mono">${esc(x.a.due)}</div><span class="pill ${x.d<0?'bad':x.d<=3?'warn':''}">${x.d<0?Math.abs(x.d)+' days late':x.d===0?'today':'in '+x.d+' days'}</span> <span class="pill acc">${fmt(x.a.w,0)}%</span></div></div>`).join('')}</div>`:'<div class="empty">Nothing dated yet. Add due dates in a course, or from its syllabus.</div>'}</div>
  </div>
  <div class="grid g2 sec">
    <div><h2>GPA by term</h2><div class="card">${spark(trend())}</div></div>
    <div><h2>Worth a look</h2>${att.length?`<div class="card list" style="padding:4px 16px">${att.map(a=>`<div class="li click" ${a.course?`data-a="open" data-id="${a.course}"`:`data-a="go" data-v="${a.to}"`}><span class="row" style="flex-wrap:nowrap;gap:10px"><span class="pill ${a.t}" style="flex:none">${a.t==='bad'?'grade':a.t==='warn'?'plan':'note'}</span><span>${a.x}</span></span><span class="muted">›</span></div>`).join('')}</div>`:'<div class="empty">Nothing needs attention right now.</div>'}</div>
  </div>`;
}

function courseRow(c){
  const st=standing(c),is=prereqIssues(c).filter(i=>i.kind!=='missing'),l=effLetter(c),s=status(c);
  const rt=S.courses.find(o=>o.retakeOf===c.id);
  const gsel=`<select data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade for ${esc(c.code)}">${gradeOpts(c).map(g=>`<option value="${esc(g)}" ${(c.grade||'')===g?'selected':''}>${g===''?'Grade':g}</option>`).join('')}</select>`;
  return`<div class="li click" data-a="open" data-id="${c.id}"><div style="min-width:0"><span class="code">${esc(c.code)} · ${c.credits} cr · ${esc(catName(c.cat))}</span><h3>${esc(c.title)}</h3></div><div class="row" style="gap:6px;justify-content:flex-end">${c.retakeOf?'<span class="pill acc">retake</span>':''}${c.was?`<span class="pill">in place of ${esc(c.was.code)}</span>`:''}${rt?`<span class="pill">retaken ${esc((termOf(rt.term)||{}).name||'')}</span>`:''}${is.length?'<span class="pill warn">prereq order</span>':''}${s==='current'&&st.pct!=null?`<span class="mono small muted">${fmt(st.pct,1)}%</span>`:''}${s==='done'?gsel:(l?lpill(l):stPill(c))}</div></div>`;
}
function vCourses(){
  const add=`<button class="btn primary" data-a="go" data-v="add">Add a course</button>`;
  if(!S.courses.length)return head('Courses','Every course with its grading breakdown.',add)+'<div class="empty">No courses yet. Add one from a syllabus or by hand.</div>';
  const T=S.terms,ci=T.findIndex(t=>t.status==='current');
  const ni=T.findIndex((t,i)=>t.status==='planned'&&i>ci);
  let li=-1;T.forEach((t,i)=>{if(t.status==='done'&&(ci<0||i<ci))li=i});
  const view=U.cview&&(U.cview==='all'||T.some(t=>t.id===U.cview))?U.cview:'now';
  let shown=view==='all'?T.slice():view==='now'?T.filter((t,i)=>i===li||i===ci||i===ni):T.filter(t=>t.id===view);
  if(!shown.length)shown=T.slice(0,2);
  const strip=`<div class="tabs"><a href="#" data-a="cview" data-v="now" ${view==='now'?'aria-current="page"':''}>Now</a>${T.map(t=>`<a href="#" data-a="cview" data-v="${t.id}" ${view===t.id?'aria-current="page"':''}>${esc(t.name)}</a>`).join('')}<a href="#" data-a="cview" data-v="all" ${view==='all'?'aria-current="page"':''}>All</a></div>`;
  const blocks=`<div class="cols" style="margin-top:22px">`+shown.map(t=>{
    const cs=S.courses.filter(c=>c.term===t.id),g=termGpa(t);
    return`<div class="sec"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0;font-size:15px">${esc(t.name)} · ${t.status==='done'?'finished':t.status==='current'?'current':'planned'}</h2><span class="mono small muted">${cs.reduce((a,c)=>a+c.credits,0)} cr${g.gpa!=null?' · '+fmt(g.gpa):''}</span></div>${cs.length?`<div class="card list" style="padding:2px 14px">${cs.map(courseRow).join('')}</div>`:'<div class="empty">Empty term</div>'}</div>`;
  }).join('')+`</div>`;
  const cat=S.courses.filter(c=>!termOf(c.term));
  return head('Courses','Your current term, the next one and the last one you finished. Pick any term above to see it alone and enter its final grades.',add+`<button class="btn" data-a="go" data-v="canvas">Sync from Canvas</button>`)+strip+blocks+(cat.length&&(view==='now'||view==='all')?`<div class="sec" style="margin-top:26px"><h2>Not in a term yet</h2><div class="card list" style="padding:2px 16px">${cat.map(courseRow).join('')}</div></div>`:'');
}

const gradeOpts=c=>{const t=termOf(c.term);return t&&t.cr?['','CR','NC']:['',...S.settings.scale.map(x=>x.l),'W']};
const STOPT=[['','No flag'],['submitted','Submitted'],['missing','Missing'],['excused','Excused']];
function groupCard(c,g){
  const gs=gstat(g),A=`data-id="${c.id}" data-gid="${g.id}"`;
  const rows=(g.items||[]).map(it=>{const p=ipct(it),B=`${A} data-iid="${it.id}"`;
    return`<div class="ir"><input class="nm" data-c="it" data-f="n" ${B} value="${esc(it.n)}" aria-label="Item name"><input type="number" step="any" data-c="it" data-f="s" ${B} value="${it.s==null?'':it.s}" placeholder="–" aria-label="Score"><input type="number" step="any" data-c="it" data-f="m" ${B} value="${it.m==null?'':it.m}" aria-label="Out of"><span class="mono small muted">${p==null?'':fmt(p,0)+'%'}</span><input type="date" data-c="it" data-f="due" ${B} value="${esc((it.due||'').slice(0,10))}" aria-label="Due date"><select data-c="it" data-f="st" ${B} aria-label="Flag">${STOPT.map(o=>`<option value="${o[0]}" ${(it.st||'')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select><button class="btn ghost danger" data-a="delitem" ${B} aria-label="Remove item">✕</button></div>`}).join('');
  return`<div class="gc"><div class="gh"><input data-c="gr" data-f="n" ${A} value="${esc(g.n)}" aria-label="Group name" style="flex:1 1 140px;font-weight:600"><select data-c="gr" data-f="type" ${A} aria-label="Type">${ATYPES.map(t=>`<option ${g.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="btn ghost danger" data-a="delgroup" ${A} aria-label="Remove group">✕</button></div>
  <div class="gh small muted"><label class="row" style="gap:6px">Weight <input class="w" type="number" step="any" data-c="gr" data-f="w" ${A} value="${g.w}" style="width:64px"> %</label><label class="row" style="gap:6px">Items <input class="w" type="number" min="1" data-c="gr" data-f="cnt" ${A} value="${gs.n}" style="width:52px"></label><label class="row" style="gap:6px">Drop lowest <input class="w" type="number" min="0" data-c="gr" data-f="drop" ${A} value="${g.drop||0}" style="width:52px"></label></div>
  <div class="ir ih"><span>Item</span><span>Score</span><span>Out of</span><span></span><span>Due</span><span>Flag</span><span></span></div>${rows}
  <div class="row between" style="margin-top:8px"><button class="btn" data-a="additem" ${A}>Add item</button><span class="small muted">${gs.used?`${fmt(gs.mean,0)}% across the best ${gs.used} · `:'No scores yet · '}counts ${gs.k} of ${gs.n}</span></div></div>`;
}
function gradesTab(c,st){
  const sc=S.settings.scale,tgt=sc.filter(x=>x.p>0);
  const needRows=tgt.map(x=>{const n=needed(c,x.min);let v,cl='';
    if(n==null)v='–';else if(n<=0){v='secured';cl='good'}else if(n>100){v='out of reach';cl='bad'}else{v=fmt(n,1)+'%';cl=n>90?'warn':''}
    return`<div class="kv"><span>To finish with ${lpill(x.l)} <span class="muted small">(${x.min}%)</span></span><span class="mono" style="${cl?`color:var(--${cl})`:''}">${v}</span></div>`}).join('');
  const go=gradeOpts(c).map(l=>`<option value="${esc(l)}" ${(c.grade||'')===l?'selected':''}>${l===''?'No final grade yet':l==='W'?'W (withdrawn)':l==='CR'?'CR (credit)':l==='NC'?'NC (no credit)':l}</option>`).join('');
  return`<div class="grid g2" style="margin-bottom:22px"><div class="card"><div class="lbl">Standing now</div><div class="row" style="gap:12px;margin-top:8px"><span class="num" style="font-size:52px">${st.pct==null?'–':fmt(st.pct,1)}<span class="muted" style="font-size:24px">%</span></span>${lpill(st.letter)}</div><div class="small muted" style="margin-top:6px">${fmt(st.gw,0)} of ${fmt(st.W,0)}% of the grade is marked${st.W?`. Final lands between <b class="mono">${fmt(st.floor,1)}%</b> and <b class="mono">${fmt(st.ceil,1)}%</b>.`:'.'}</div></div>
  <div class="card"><div class="lbl">Goal grade</div><select data-c="goal" data-id="${c.id}" style="margin:8px 0 14px;width:100%"><option value="">No goal set</option>${S.settings.scale.map(x=>`<option ${c.goal===x.l?'selected':''}>${esc(x.l)}</option>`).join('')}</select><div class="lbl">Final grade</div><select data-c="cf" data-f="grade" data-id="${c.id}" style="margin-top:8px;width:100%">${go}</select><div class="small muted" style="margin-top:8px">Set this when the registrar posts it. It feeds your GPA.</div></div></div>
  <h2>Grading breakdown</h2>${(c.assess||[]).map(g=>groupCard(c,g)).join('')||'<div class="empty">No grading groups yet. Add one, or read a syllabus.</div>'}
  <div class="row between" style="margin:4px 0 26px"><button class="btn" data-a="addgroup" data-id="${c.id}">Add a group</button><span class="small mono" style="${Math.abs(st.W-100)>0.01&&st.W?'color:var(--warn)':''}">Total weight ${fmt(st.W,0)}%</span></div>
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
    ${dep.length?`<h2>Unlocks</h2><div class="row" style="margin-bottom:22px">${dep.map(o=>`<button class="btn" data-a="open" data-id="${o.id}">${esc(o.code)}</button>`).join('')}</div>`:''}
    <button class="btn danger" data-a="delcourse" data-id="${c.id}">Delete this course</button>`;
  }
  return`<div class="veil" data-a="closebg"><div class="drawer" role="dialog" aria-label="${esc(c.code)}"><div class="row between" style="align-items:flex-start;margin-bottom:6px"><div><span class="code">${esc(c.code)} · ${c.credits} credits · ${esc(catName(c.cat))}</span><h1 style="margin-top:6px">${esc(c.title)}</h1></div><button class="btn ghost" data-a="close" aria-label="Close">✕</button></div><div style="margin:10px 0 18px">${stPill(c)}</div>${tabs}${body}</div></div>`;
}
