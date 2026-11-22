
/* ---------- shared view bits ---------- */
const lpill=l=>{if(!l)return'<span class="pill">–</span>';const p=pointsOf(l);const cl=p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad';return`<span class="pill ${cl}">${esc(l)}</span>`};
const gradeCls=l=>{if(!l||l==='W'||l==='NC')return'';if(l==='CR')return'good';const p=pointsOf(l);return p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad'};
const stPill=c=>{const s=status(c);return s==='done'?'<span class="pill good">done</span>':s==='current'?'<span class="pill acc">in progress</span>':s==='planned'?'<span class="pill">planned</span>':'<span class="pill">not scheduled</span>'};
const catName=k=>{const x=S.settings.cats.find(c=>c.k===k);return x?x.n:k||'Uncategorised'};
let INNER=false;
const cmdBtn=()=>`<button type="button" class="btn ghost sm cmd-trig" data-a="opencmd" title="Search & commands (Ctrl+K)">${ICONS.search}<span class="mono small">⌘K</span></button>`;
const head=(t,sub,right)=>INNER
  ?`<div class="row between toolbar-inner" style="margin-bottom:14px;align-items:center;gap:10px">${sub?`<span class="small muted">${sub}</span>`:'<span></span>'}${right?`<div class="row" style="gap:8px">${right}</div>`:''}</div>`
  :`<div class="head"><div class="head-left"><h1>${t}</h1>${(U.route==='overview'||U.route==='setup'||U.route==='tour')&&sub?`<p class="sub">${sub}</p>`:''}</div><div class="row head-right" style="gap:8px">${right||''}${cmdBtn()}</div></div>`;

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

function setupChecklist(onTour){
  const hasPlan=S.courses.length>0;
  const hasCanvas=!!(S.links&&S.links.canvas&&S.links.canvas.at);
  const hasGrades=doneCourses().some(c=>!!c.grade);
  const hasSyl=S.courses.some(c=>!!c.syllabusUrl);
  const hasEnroll=!!(S.enroll&&Object.keys(S.enroll.picks||{}).length);
  const steps=[
    {done:hasPlan,title:'1. Build your courses',sub:hasPlan?`${S.courses.length} courses in your plan`:'Connect Canvas once (auto-builds your term) or load a Dossier below.',act:DESKTOP_HOST?`<button type="button" class="btn primary sm" data-a="quickcanvas">Sign in to Canvas</button>`:`<a class="btn primary sm" href="#canvas">Link Canvas</a>`},
    {done:hasCanvas,title:'2. Sync live Canvas grades & due dates',sub:hasCanvas?`Last synced ${new Date(S.links.canvas.at).toLocaleDateString()}`:'Pulls assignments, weights, scores, and upcoming deadlines automatically.',act:`<a class="btn sm" href="#canvas">Sync Canvas</a>`},
    {done:hasGrades,title:'3. Import past grades (PSCS)',sub:hasGrades?'Official finished grades recorded':'Send your PSCS Course History once to populate past terms & cumulative GPA.',act:`<a class="btn sm" href="#canvas">Import PSCS</a>`},
    {done:hasSyl,title:'4. Link Simple Syllabus',sub:hasSyl?'Syllabus links attached to courses':'Open any course on Simple Syllabus and click “Send to Atlas” to grab its URL & weights.',act:`<a class="btn sm" href="#canvas">Link Syllabus</a>`},
    {done:hasEnroll,title:'5. Pick enrollment sections',sub:hasEnroll?'Weekly timetable configured':'Drop the registrar schedule CSV to pick Lectures, Seminars/Labs & check clashes.',act:`<a class="btn sm" href="#enroll">Enrollment</a>`},
  ];
  const nextIdx=steps.findIndex(x=>!x.done);
  const doneCnt=steps.filter(x=>x.done).length;
  return`<div class="card" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:10px"><h2 style="margin:0">Your setup progress</h2><div class="row" style="gap:6px"><span class="pill ${doneCnt===steps.length?'good':'acc'}">${doneCnt} / ${steps.length} done</span>${onTour?'':`<a class="btn sm soft" href="#tour">Take the 1-min Tour →</a>`}</div></div>
    <div class="check-list">${steps.map((st,i)=>{const isNext=i===nextIdx;return`<div class="check-row ${st.done?'done':isNext?'next':''}"><div class="row" style="gap:10px;flex-wrap:nowrap;min-width:0"><span class="check-mark">${st.done?'✓':(i+1)}</span><div style="min-width:0"><b class="small">${st.title}</b><div class="small muted">${st.sub}</div></div></div>${st.done?'<span class="pill good">Done</span>':st.act}</div>`}).join('')}</div>
  </div>`;
}
function setupPanel(isGuide){
  const y=new Date().getFullYear(),ds=getDossiers(),mode=U.welcomeMode||'';
  const hero=!isGuide?`<div class="welcome-hero"><h1>Welcome to Atlas</h1><p>Pick one way to start — your grades, roadmap, and enrollment come together automatically.</p><div class="row" style="justify-content:center;margin-top:12px"><a class="btn sm soft" href="#tour">Take the 1-min Tour →</a></div></div>`:'';
  const cards=`<div class="welcome-grid">
    <div class="w-card featured">
      <div><span class="pill acc">Recommended</span><h3>1-Click Portal Sync</h3><p class="small muted" style="margin:0">Sign in to Canvas &amp; PSCS normally, then let Atlas read your courses, scores, past grades, and live weekly schedule automatically (read-only, zero passwords).</p></div>
      <div class="row" style="gap:6px">
        ${DESKTOP_HOST?`<button type="button" class="btn primary sm" data-a="hostsyncall">${U.hostBusy?'Syncing portals…':'✦ Sync All (Canvas + PSCS)'}</button>`:`<a class="btn primary sm" href="#canvas">Set up 1-Click Sync →</a>`}
        ${DESKTOP_HOST?`<button type="button" class="btn sm" data-a="quickcanvas">Canvas only</button>`:`<a class="btn sm" href="${esc(bmCode())}" onclick="event.preventDefault();alert('Drag this button onto your Bookmarks bar, then click it once on Canvas or PSCS!')">Bookmarklet</a>`}
      </div>
    </div>
    <div class="w-card">
      <div><span class="pill">4-year grid</span><h3>Load a Habib Dossier</h3><p class="small muted" style="margin:0">Start with an official EE or CS Class of 2029 curriculum grid with zero manual entry.</p></div>
      <div class="row" style="gap:6px"><button type="button" class="btn ${mode==='dossier'?'primary':''} sm" data-a="welcomemode" data-v="${mode==='dossier'?'':'dossier'}">${mode==='dossier'?'Hide dossiers':'Choose dossier'}</button></div>
    </div>
    <div class="w-card">
      <div><span class="pill">Any batch</span><h3>PSCS, Stellic, or Blank</h3><p class="small muted" style="margin:0">Paste your PSCS Course History, Stellic audit, or configure a custom degree for any university.</p></div>
      <div class="row" style="gap:6px"><button type="button" class="btn ${mode==='import'?'primary':''} sm" data-a="welcomemode" data-v="${mode==='import'?'':'import'}">Paste export</button><button type="button" class="btn ghost sm" data-a="welcomemode" data-v="${mode==='custom'?'':'custom'}">Custom</button></div>
    </div>
  </div>`;

  const dossierBox=(mode==='dossier'||isGuide)?`<div class="card" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:10px"><h2 style="margin:0">University Dossiers</h2><label class="row small muted" style="gap:6px">Finished terms: <input id="su-d-done" type="number" min="0" max="12" value="0" style="width:62px;padding:4px 8px"></label></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
      ${ds.map(d=>`<div class="card" style="margin:0;padding:14px;background:var(--surface-2);box-shadow:none">
        <div class="row between" style="margin-bottom:4px"><b>${esc(d.short||d.program)}</b><span class="meta-txt">${esc(d.credits)} cr</span></div>
        <div class="small muted" style="margin-bottom:10px">${esc(d.school)} · ${esc(d.courses)} courses</div>
        <button type="button" class="btn primary sm" data-a="loaddossier" data-id="${esc(d.id)}">Load ${esc(d.short||'Dossier')}</button>
      </div>`).join('')||'<div class="small muted">No bundled dossiers found.</div>'}
    </div>
  </div>`:'';

  const importBox=(mode==='import')?`<div class="card" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Paste from PSCS, Canvas, Simple Syllabus, or Stellic</h2><a class="btn sm ghost" href="#canvas">Full Sync page →</a></div>
    <textarea id="su-portal-text" rows="3" placeholder="Paste Canvas JSON, PSCS Course History, Simple Syllabus report, or Stellic audit here…"></textarea>
    <div class="row" style="margin-top:10px"><button type="button" class="btn primary sm" data-a="suimport">Import &amp; Build</button><span class="small" style="color:var(--bad)">${esc(U.cvErr||'')}</span></div>
  </div>`:'';

  const customBox=(mode==='custom'||isGuide)?`<details class="card" ${mode==='custom'?'open':''} style="margin-bottom:16px"><summary>Build a custom degree (any university)</summary>
    <div class="fgrid" style="margin-top:6px">
      <label class="f"><span>Programme</span><input id="su-prog" placeholder="B.S. Electrical Engineering"></label>
      <label class="f"><span>University</span><input id="su-school" placeholder="Your university"></label>
      <label class="f"><span>Grading scale</span><select id="su-scale"><option value="habib">Habib University (A+ 95, A 90, …)</option><option value="us">Standard US 4.0 (A 93, A- 90, …)</option></select></label>
      <label class="f"><span>First term</span><div class="row" style="gap:6px;flex-wrap:nowrap"><select id="su-season"><option>Fall</option><option>Spring</option></select><input id="su-year" type="number" value="${y-1}" style="width:86px"></div></label>
      <label class="f"><span>Terms finished</span><input id="su-done" type="number" min="0" max="12" value="0"></label>
      <label class="f"><span>Total terms</span><input id="su-n" type="number" min="2" max="14" value="8"></label>
      <label class="f"><span>Credits to graduate</span><input id="su-cr" type="number" value="134"></label>
    </div>
    <div class="row" style="margin-top:16px"><button type="button" class="btn primary" data-a="setup">Create my terms</button>${isGuide&&S.terms.length?`<a class="btn" href="#overview">Back to Home</a>`:''}</div>
  </details>`:'';

  return hero+cards+dossierBox+importBox+customBox+(isGuide?setupChecklist():'');
}
function vSetup(){
  return head('Setup Guide','Link Canvas once to auto-build your term, load a university dossier, or import from PSCS & Simple Syllabus.',`<a class="btn soft" href="#tour">Interactive Tour</a>`)+setupPanel(true);
}
const TOUR_STEPS=[
  {k:'start',lbl:'Step 1',title:'1-Click Read-Only Setup',badge:'Zero manual entry',
    body:'Sign in to <b>Canvas</b> and <b>PSCS</b> normally — Atlas never sees or stores your passwords and never modifies your portals. One click reads your Canvas courses, assignment weights, and due dates, plus PSCS Course History and your live weekly schedule.',
    tips:['<b>Desktop app</b>: click <b>✦ Sync All (Canvas + PSCS)</b> — sign in normally and Atlas reads everything automatically.','<b>Chrome / Edge Web</b>: load the bundled <b>Atlas Companion</b> extension once, then click <b>✦ Sync All Portals</b> from the toolbar icon (no bookmarklet hopping!).','Or start from a <b>Habib Dossier</b> (EE/CS 2029) for a full 4-year grid immediately.'],
    cta:`<a class="btn primary" href="#setup">Go to Setup Guide</a><a class="btn" href="#canvas">Open Sync &amp; Import</a>`},
  {k:'quick',lbl:'Step 2',title:'Quick Course Actions',badge:'1-click grading & retakes',
    body:'Common actions are always 1 click away — no digging through drawers. Click the <b>⋮</b> button or <b>right-click</b> any course card, list row, table row, or 4-Year Grid card.',
    tips:['<b>Set Final Grade</b> right from the popup pills (works for finished and current courses).','<b>Retake Course (Copy &amp; Link)</b> clones every detail without old scores, links it as a retake, and schedules it in your next term.','Log upcoming assignment scores directly from Home’s <b>Up next</b> card with 1 click.'],
    cta:`<a class="btn primary" href="#courses">Try on Courses</a><a class="btn" href="#gpa">Check GPA</a>`},
  {k:'plan',lbl:'Step 3',title:'4-Year Plan & Roadmap',badge:'Drag, drop & prereqs',
    body:'Organize your entire degree in <b>Plan → Four years</b>. Drag courses between terms (or tap ⇄ on mobile) — Atlas highlights valid, warning, and prerequisite-conflict drops in real time.',
    tips:['Click <b>+</b> on any term header to pop open the inline Add Course modal pre-set to that semester.','Switch to <b>Roadmap</b> to trace prerequisite chains left-to-right and see which courses unlock the most later courses.','Track <b>Minors</b> and degree credit categories under <b>Requirements</b>.'],
    cta:`<a class="btn primary" href="#grid">Open Four-Year Plan</a><a class="btn" href="#roadmap">View Roadmap</a>`},
  {k:'enroll',lbl:'Step 4',title:'Live Schedule vs. Future Enrollment',badge:'Lectures + Seminars/Labs',
    body:'Home shows your real <b>This week</b> schedule synced from PSCS (including room changes and extra classes), while <b>Plan → Enrollment</b> lets you draft future semesters cleanly without confusing them with this week.',
    tips:['Multi-component courses (like <b>Hikma</b> <code>L1</code> + <code>S3</code>, or <b>Calculus</b> <code>L</code> + <code>R</code>) split into separate pickers and auto-pair single common lectures.','Use the sticky right tabs (<b>Week · Cart · Backups · Auto · Search</b>) to compare clash-free combinations and copy PSCS class numbers.'],
    cta:`<a class="btn primary" href="#enroll">Open Enrollment</a>`},
  {k:'sync',lbl:'Step 5',title:'Canvas, PSCS & Simple Syllabus',badge:'100% read-only sync',
    body:'Whether you use the <b>Desktop App</b>, the <b>Atlas Companion extension</b>, or the <b>✦ Send to Atlas</b> bookmarklet, everything stays read-only and private on your own device/server.',
    tips:['<b>Canvas</b>: syncs active courses, weights, scores, and upcoming due dates.','<b>PSCS</b>: reads both Course History (past terms &amp; grades) and your live Weekly Schedule automatically in one click — no menu hunting!','<b>Simple Syllabus</b>: grabs the exact syllabus URL, instructor, and grading breakdown and links them straight to your existing course.'],
    cta:`<a class="btn primary" href="#canvas">Open Sync &amp; Import</a><a class="btn" href="#overview">Go to Home</a>`}
];
function vTour(){
  const idx=Math.max(0,Math.min(TOUR_STEPS.length-1,U.tourStep||0));
  const st=TOUR_STEPS[idx];
  const tabs=`<div class="tour-steps">${TOUR_STEPS.map((x,i)=>`<button type="button" class="tour-tab ${i===idx?'on':''}" data-a="tourstep" data-v="${i}"><span>${x.lbl}</span><b>${x.title}</b></button>`).join('')}</div>`;
  const card=`<div class="card kpi-card kpi-acc">
    <div class="row between" style="margin-bottom:10px"><span class="pill acc">${st.lbl} of ${TOUR_STEPS.length}</span><span class="pill">${st.badge}</span></div>
    <h1 style="font-size:clamp(24px,3vw,34px);margin-bottom:10px">${st.title}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;max-width:68ch">${st.body}</p>
    <div class="card" style="background:var(--surface-2);padding:14px 16px;margin-bottom:18px;box-shadow:none">
      <div class="lbl" style="margin-bottom:8px">How it works</div>
      <ul class="small" style="margin:0;padding-left:18px;line-height:1.7">${st.tips.map(t=>`<li>${t}</li>`).join('')}</ul>
    </div>
    <div class="row between" style="padding-top:12px;border-top:1px solid var(--line);gap:10px;flex-wrap:wrap">
      <div class="row" style="gap:8px">${st.cta}</div>
      <div class="row" style="gap:6px">
        <button type="button" class="btn sm" data-a="tourstep" data-v="${idx-1}" ${idx===0?'disabled':''}>← Previous</button>
        ${idx<TOUR_STEPS.length-1?`<button type="button" class="btn primary sm" data-a="tourstep" data-v="${idx+1}">Next →</button>`:`<button type="button" class="btn primary sm" data-a="go" data-v="setup">Finish &amp; Set Up →</button>`}
      </div>
    </div>
  </div>`;
  return head('Welcome to Atlas','A 1-minute interactive tour of how Atlas keeps your grades, 4-year plan, and enrollment effortless.',`<a class="btn" href="#setup">Setup Guide</a>`)+tabs+card+`<div class="sec">${setupChecklist(true)}</div>`;
}

/* ---------- views & customizable widgets ---------- */
const WIDGETS={
  summary:{title:'Overview strip',render(){
    const cum=cumulative(),tg=S.settings.targetGpa,d=cum.gpa==null?null:cum.gpa-tg;
    const cur=curCourses(),cg=gpaOf(cur,true),curCr=cur.reduce((a,c)=>a+c.credits,0),ct=S.terms.find(t=>t.status==='current');
    const er=earnedCredits(),tot=S.settings.totalCredits||1,pct=Math.round(Math.min(100,er/tot*100));
    const p=typeof termPlan==='function'?termPlan():null;
    const tVal=!p?'–':p.state==='secured'?'Safe':p.state==='out'?fmt(p.best):fmt(p.need);
    const tSub=!p?'Add current courses':p.state==='secured'?`Target ${fmt(tg)} secured`:p.state==='out'?`Max term ${fmt(p.best)} (need ${fmt(p.need)})`:`Need this term for ${fmt(tg)}`;
    return`<div class="stats-strip">
      <div class="stat-cell"><span class="lbl">Cumulative GPA</span><div class="stat-val">${fmt(cum.gpa)}${d!=null?`<span class="pill ${d>=0?'good':'bad'}">${d>=0?'+':''}${fmt(d)}</span>`:''}</div><span class="stat-sub">${cum.cr?`${cum.cr} graded cr · target ${fmt(tg)}`:'Add finished grades'}</span></div>
      <div class="stat-cell"><span class="lbl">${esc(ct?ct.name:'This term')}</span><div class="stat-val">${fmt(cg.gpa)}</div><span class="stat-sub">${cur.length} courses · ${curCr} cr</span></div>
      <div class="stat-cell"><span class="lbl">Credits earned</span><div class="stat-val">${er}<span class="muted" style="font-size:16px">/ ${tot}</span></div><span class="stat-sub">${pct}% complete · ${curCr} in progress</span></div>
      <div class="stat-cell"><span class="lbl">Target pace</span><div class="stat-val">${tVal}${p&&p.state==='secured'?'<span class="pill good">on track</span>':''}</div><span class="stat-sub">${tSub}</span></div>
    </div>`;
  }},
  gpa:{title:'Cumulative GPA',render(){
    const cum=cumulative(),tg=S.settings.targetGpa,d=cum.gpa==null?null:cum.gpa-tg;
    return`<div class="card kpi-card ${d==null?'kpi-acc':d>=0?'kpi-good':'kpi-warn'}">
      <div class="row between"><div class="lbl">Cumulative GPA</div>${d!=null?`<span class="pill ${d>=0?'good':'bad'}">${d>=0?'+':''}${fmt(d)} vs target</span>`:''}</div>
      <div class="num" style="margin:10px 0 8px">${fmt(cum.gpa)}</div>
      <div class="small muted">${d==null?'Enter final grades for finished courses':`Target ${fmt(tg)} across ${cum.cr} graded credits`}</div>
    </div>`;
  }},
  term:{title:'This term so far',render(){
    const cur=curCourses(),cg=gpaOf(cur,true),proj=gpaOf(doneCourses().concat(cur),true),cum=cumulative();
    const curCr=cur.reduce((a,c)=>a+c.credits,0),ct=S.terms.find(t=>t.status==='current');
    return`<div class="card kpi-card kpi-acc">
      <div class="row between"><div class="lbl">This term so far</div>${ct?`<span class="pill acc">${esc(ct.name)}</span>`:''}</div>
      <div class="num" style="margin:10px 0 8px">${fmt(cg.gpa)}</div>
      <div class="small muted">${cur.length} courses · ${curCr} cr${proj.gpa!=null&&cum.gpa!=null?` · cum <b class="mono">${fmt(proj.gpa)}</b>`:''}</div>
    </div>`;
  }},
  credits:{title:'Credits earned',render(){
    const er=earnedCredits(),tot=S.settings.totalCredits||1,curCr=curCourses().reduce((a,c)=>a+c.credits,0);
    const planCr=planCourses().filter(counts).reduce((a,c)=>a+c.credits,0),pct=Math.min(100,er/tot*100);
    return`<div class="card kpi-card kpi-good" style="flex-direction:row;align-items:center;gap:14px;justify-content:flex-start">
      <div class="ring" style="--p:${pct.toFixed(1)}"><div>${Math.round(pct)}%</div></div>
      <div style="min-width:0"><div class="lbl">Credits earned</div><div class="mono" style="font-size:22px;font-weight:600;margin:6px 0 4px">${er}<span class="muted" style="font-weight:400"> / ${tot}</span></div><div class="small muted">${curCr} now · ${planCr} planned</div></div>
    </div>`;
  }},
  target:{title:'Target tracker',render(){
    const p=typeof termPlan==='function'?termPlan():null;
    if(!p)return`<div class="card kpi-card kpi-acc"><div class="row between"><div class="lbl">Target tracker</div><a class="btn ghost sm" href="#gpa">GPA lab</a></div><div class="small muted" style="margin-top:10px">Add courses to your current term to track target grades.</div></div>`;
    const main=p.state==='secured'?'Safe':p.state==='out'?fmt(p.best):fmt(p.need);
    const sub=p.state==='secured'?`Target ${fmt(p.tg)} secured this term`:p.state==='out'?`Max ${fmt(p.best)} this term (need ${fmt(p.need)} for ${fmt(p.tg)})`:`Needed this term for ${fmt(p.tg)} overall`;
    const aims=p.rows.slice(0,3).map(r=>`<span class="pill" style="font-size:10.5px">${esc(r.c.code)}: <b>${esc(r.goal||r.aim)}</b></span>`).join(' ');
    return`<div class="card kpi-card ${p.state==='out'?'kpi-warn':p.state==='secured'?'kpi-good':'kpi-acc'}">
      <div class="row between"><div class="lbl">Target tracker</div><a class="btn ghost sm" href="#gpa" style="padding:2px 6px;font-size:11.5px">Details ›</a></div>
      <div class="num" style="margin:8px 0 6px;font-size:clamp(30px,3vw,42px)">${main}</div>
      <div class="small muted" style="margin-bottom:8px">${sub}</div>
      <div class="row" style="gap:4px">${aims}</div>
    </div>`;
  }},
  inprog:{title:'In progress',render(){
    const cur=curCourses();
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">In progress</h2><a class="btn ghost sm" href="#courses">All ›</a></div>${cur.length?`<div class="list">${cur.map(c=>{const st=standing(c);return`<div class="li click" data-a="open" data-id="${c.id}" data-cid="${c.id}"><div style="min-width:0;flex:1"><span class="code">${esc(c.code)} · ${c.credits} cr</span><h3>${esc(c.title)}</h3><div class="bar" style="margin-top:7px;width:min(220px,100%);height:5px"><i class="d" style="width:${st.W?st.gw/st.W*100:0}%"></i></div></div><div class="row" style="gap:6px;flex:none"><div style="text-align:right"><div class="mono small" style="margin-bottom:3px;font-weight:500">${st.pct==null?'–':fmt(st.pct,1)+'%'}</div>${lpill(c.grade||st.letter)}</div><button type="button" class="ctx-btn" data-a="ctx" data-id="${c.id}" title="Quick actions" aria-label="Actions for ${esc(c.code)}">⋮</button></div></div>`}).join('')}</div>`:'<div class="empty">No course is in progress. Move courses into your current term on the Plan page.</div>'}</div>`;
  }},
  duenext:{title:'Up next',render(){
    const dl=deadlines().slice(0,5);
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Up next</h2><span class="meta-txt">${dl.length?dl.length+' upcoming':''}</span></div>${dl.length?`<div class="list">${dl.map(x=>{
      const key=x.c.id+':'+x.gid+':'+x.iid,editing=U.dueEdit===key;
      const right=editing
        ?`<span class="due-score"><input id="due-in" type="number" step="any" placeholder="Score" aria-label="Score for ${esc(x.a.n)}"><span class="meta-txt">/ ${x.max}</span><button type="button" class="btn primary sm" data-a="duesave" data-id="${x.c.id}" data-gid="${x.gid}" data-iid="${x.iid}">Save</button><button type="button" class="btn ghost sm" data-a="duecancel" aria-label="Cancel">✕</button></span>`
        :`<div class="row" style="gap:6px;justify-content:flex-end;flex:none"><span class="pill ${x.d<0?'bad':x.d<=3?'warn':''}">${x.d<0?Math.abs(x.d)+'d late':x.d===0?'today':'in '+x.d+'d'}</span><span class="meta-txt">${fmt(x.a.w,0)}%</span><button type="button" class="btn ghost sm" data-a="dueedit" data-k="${esc(key)}" title="Log score right here">Log</button></div>`;
      return`<div class="li click" data-a="open" data-id="${x.c.id}"><div class="row" style="flex-wrap:nowrap;gap:12px;min-width:0">${dateBadge(x.a.due,x.d)}<div style="min-width:0"><span class="code">${esc(x.c.code)}</span><h3>${esc(x.a.n)}</h3></div></div>${right}</div>`;
    }).join('')}</div>`:'<div class="empty" style="padding:20px">Nothing dated yet. Add due dates in a course or sync Canvas.</div>'}</div>`;
  }},
  week:{title:'Weekly schedule',render(){
    const live=typeof liveScheduleList==='function'?liveScheduleList():[];
    const pk=typeof picked==='function'?picked():[];
    const pkTerm=typeof pickedTermInfo==='function'?pickedTermInfo():null;
    const isFuturePlan=!!(pkTerm&&pkTerm.status==='planned');
    const hasLive=live.length>0,hasPk=pk.length>0;
    if(!hasLive&&!hasPk){
      if(!U.dashEdit){
        return`<div class="card" style="padding:14px 18px"><div class="row between" style="gap:10px;flex-wrap:wrap"><div><h2 style="margin:0 0 3px">Weekly schedule</h2><span class="small muted">Sync your live schedule from PSCS, or draft a future term in Enrollment.</span></div><div class="row" style="gap:6px"><a class="btn soft sm" href="#canvas">Sync PSCS</a><a class="btn sm" href="#enroll">Plan enrollment</a></div></div></div>`;
      }
      return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Weekly schedule</h2><a class="btn ghost sm" href="#enroll">Enrollment ›</a></div><div class="empty" style="padding:20px 14px">No schedule synced or planned yet.</div></div>`;
    }
    const mode=(hasLive&&hasPk)?(U.weekMode||'live'):(hasLive?'live':'plan');
    const showLive=mode==='live';
    const list=showLive?live:pk;
    const bad=clashes(list);
    const planLbl=pkTerm?esc(pkTerm.name):'Planned';
    const title=showLive?'This week':(isFuturePlan?`Planned · ${planLbl}`:`This week · ${planLbl}`);
    const badge=showLive
      ?`<span class="pill good" title="${S.schedule&&S.schedule.at?'Synced '+esc(new Date(S.schedule.at).toLocaleString()):''}">Live PSCS</span>`
      :(isFuturePlan?`<span class="pill">Future term</span>`:'');
    const sw=(hasLive&&hasPk)
      ?`<div class="seg" style="padding:2px"><button type="button" style="padding:3px 7px;font-size:11px" class="${showLive?'on':''}" data-a="weekmode" data-v="live">This week</button><button type="button" style="padding:3px 7px;font-size:11px" class="${!showLive?'on':''}" data-a="weekmode" data-v="plan">${planLbl}</button></div>`
      :'';
    const rightAction=showLive
      ?`<a class="btn ghost sm" href="#canvas">Sync ›</a>`
      :`<a class="btn ghost sm" href="#enroll">Edit ›</a>`;
    return`<div class="card"><div class="row between" style="margin-bottom:8px;gap:8px;flex-wrap:wrap"><div class="row" style="gap:8px"><h2 style="margin:0">${title}</h2>${badge}</div><div class="row" style="gap:6px">${sw}${rightAction}</div></div>${weekGrid(list,bad)}${!showLive&&isFuturePlan&&!hasLive?`<div class="small muted" style="margin-top:8px">Showing your planned <b>${planLbl}</b> sections. <a href="#canvas">Sync PSCS</a> to show your real current-term weekly schedule instead.</div>`:''}</div>`;
  }},
  trend:{title:'GPA by term',render(){
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">GPA by term</h2><a class="btn ghost sm" href="#gpa">GPA ›</a></div>${spark(trend())}</div>`;
  }},
  attention:{title:'Worth a look',render(){
    const att=attention().slice(0,5);
    if(!att.length&&!U.dashEdit)return'';
    return`<div class="card"><h2 style="margin-bottom:8px">Worth a look</h2>${att.length?`<div class="list">${att.map(a=>`<div class="li click" ${a.course?`data-a="open" data-id="${a.course}"`:`data-a="go" data-v="${a.to}"`}><span class="row" style="flex-wrap:nowrap;gap:10px"><span class="pill ${a.t}" style="flex:none">${a.t==='bad'?'grade':a.t==='warn'?'plan':'note'}</span><span class="small">${a.x}</span></span><span class="muted" style="font-size:18px;line-height:1">›</span></div>`).join('')}</div>`:'<div class="empty" style="padding:20px">Nothing needs attention right now.</div>'}</div>`;
  }},
  reqs:{title:'Requirements',render(){
    const cp=catProgress().filter(x=>!(x.k.k==='minor'&&!S.courses.some(c=>c.cat==='minor')));
    return`<div class="card"><div class="row between" style="margin-bottom:10px"><h2 style="margin:0">Requirements</h2><a class="btn ghost sm" href="#req">Details ›</a></div><div style="display:flex;flex-direction:column;gap:10px">${cp.map(x=>{const req=x.k.req||0,pct=req>0?Math.min(100,(x.e+x.cu+x.pl)/req*100):100;return`<div><div class="row between small"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(catColor(x.k.k))};margin-right:6px"></i><b>${esc(x.k.n)}</b></span><span class="mono muted">${x.e+x.cu+x.pl}${req>0?' / '+req:''} cr</span></div>${req>0?`<div class="bar" style="height:5px;margin-top:4px"><i class="d" style="width:${Math.min(100,x.e/req*100)}%"></i><i style="width:${Math.min(100,x.cu/req*100)}%"></i><i class="p" style="width:${Math.min(100,x.pl/req*100)}%"></i></div>`:''}</div>`}).join('')}</div></div>`;
  }},
  portals:{title:'Portals & sync',render(){
    const ps=(S.settings.portals||[]).filter(p=>p.on),at=S.links&&S.links.canvas&&S.links.canvas.at;
    return`<div class="card"><div class="row between" style="margin-bottom:10px"><h2 style="margin:0">Portals &amp; sync</h2><button type="button" class="btn soft sm" data-a="quickcanvas">Sync Canvas</button></div><div class="more-grid" style="margin-bottom:10px">${ps.map(p=>`<button type="button" class="more-tile" data-a="openportal" data-id="${esc(p.id)}"><span class="p-tile" style="--pc:${esc(p.color||'#2945B8')}">${esc((p.short||p.name||'P').slice(0,2))}</span><span>${esc(p.name)}</span></button>`).join('')}</div><div class="small muted">Canvas sync: ${at?esc(new Date(at).toLocaleString()):'Not synced yet'}</div></div>`;
  }},
  note:{title:'Quick notes',render(){
    const v=(S.ui&&S.ui.dash&&S.ui.dash.note)||'';
    return`<div class="card"><h2 style="margin-bottom:8px">Quick notes</h2><textarea id="dash-note" data-c="dashnote" rows="5" placeholder="Advising notes, enrollment reminders…">${esc(v)}</textarea></div>`;
  }}
};
function vOverview(){
  if(!S.terms.length)return setupPanel(false);
  const ct=S.terms.find(t=>t.status==='current'),mods=(S.ui&&S.ui.modules)||{};
  const isMob=typeof window!=='undefined'&&window.innerWidth<=860;
  const devMode=U.dashEdit?(U.dashEditMode||(isMob?'mobile':'desktop')):(isMob?'mobile':'desktop');
  const rawList=(S.ui&&S.ui.dash&&S.ui.dash[devMode])||defUi().dash[devMode];
  const visible=rawList.filter(x=>{
    if(!WIDGETS[x.w])return false;
    if(x.w==='week'&&mods.enroll===false)return false;
    if(x.w==='portals'&&mods.portals===false)return false;
    return U.dashEdit||x.on!==false;
  });
  const editBtn=`<button type="button" class="btn ghost sm ${U.dashEdit?'primary':''}" data-a="dashedit">${U.dashEdit?'Done':'Customize'}</button>`;
  const editBar=U.dashEdit?`<div class="dash-edit-bar"><div class="row" style="gap:8px"><b class="small">Editing layout:</b><div class="seg"><button type="button" class="${devMode==='desktop'?'on':''}" data-a="dashmode" data-v="desktop">Desktop</button><button type="button" class="${devMode==='mobile'?'on':''}" data-a="dashmode" data-v="mobile">Mobile</button></div></div><div class="row" style="gap:8px"><button type="button" class="btn sm" data-a="dashreset">Reset default</button><button type="button" class="btn sm primary" data-a="dashedit">Done</button></div></div>`:'';
  const cards=visible.map((x,i)=>{
    const w=WIDGETS[x.w],sz=x.size||'m',html=w.render();
    if(!html&&!U.dashEdit)return'';
    const ctrl=U.dashEdit?`<div class="w-ctrl"><button type="button" class="btn sm ${x.on!==false?'soft':'ghost'}" data-a="wvis" data-w="${x.w}">${x.on!==false?'Shown':'Hidden'}</button><div class="seg">${['s','m','l'].map(s=>`<button type="button" class="${sz===s?'on':''}" data-a="wsize" data-w="${x.w}" data-v="${s}">${s.toUpperCase()}</button>`).join('')}</div><div class="row" style="gap:3px"><button type="button" class="btn sm ghost" data-a="wmove" data-w="${x.w}" data-dir="-1" ${i===0?'disabled':''} aria-label="Move earlier">←</button><button type="button" class="btn sm ghost" data-a="wmove" data-w="${x.w}" data-dir="1" ${i===visible.length-1?'disabled':''} aria-label="Move later">→</button></div></div>`:'';
    return`<div class="dash-w w-${sz}${x.on===false?' w-off':''}">${ctrl}${html}</div>`;
  }).join('');
  return head(esc(S.settings.program||'Your degree'),esc(S.settings.school||'')+(ct?(S.settings.school?' · ':'')+esc(ct.name):''),editBtn)+editBar+`<div class="dash-grid">${cards}</div>`;
}

const canvasPortalUrl=()=>{const p=(S.settings.portals||[]).find(x=>x.id==='canvas'||x.kind==='canvas');return((p&&p.url)||'https://hulms.instructure.com').replace(/\/+$/,'')};
function courseRow(c){
  const st=standing(c),is=prereqIssues(c).filter(i=>i.kind!=='missing'),l=effLetter(c),s=status(c);
  const rt=S.courses.find(o=>o.retakeOf===c.id);
  const gcls=gradeCls(c.grade);
  const gsel=`<select class="sel-pill ${gcls}" data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade for ${esc(c.code)}">${gradeOpts(c).map(g=>`<option value="${esc(g)}" ${(c.grade||'')===g?'selected':''}>${g===''?(s==='current'&&st.letter?'Now '+st.letter:'Grade'):g}</option>`).join('')}</select>`;
  return`<div class="li click" data-a="open" data-id="${c.id}" data-cid="${c.id}"><div style="min-width:0"><span class="code row" style="gap:6px"><i class="cat-dot" style="background:${esc(catColor(c.cat))}" title="${esc(catName(c.cat))}"></i>${esc(c.code)} · ${c.credits} cr</span><h3>${esc(c.title)}</h3></div><div class="row" style="gap:6px;justify-content:flex-end">${c.retakeOf?'<span class="pill acc">retake</span>':''}${c.was?`<span class="pill">in place of ${esc(c.was.code)}</span>`:''}${rt?`<span class="pill">retaken ${esc((termOf(rt.term)||{}).name||'')}</span>`:''}${is.length?'<span class="pill warn">prereq order</span>':''}${s==='current'&&st.pct!=null?`<span class="mono small muted">${fmt(st.pct,1)}%</span>`:''}${(s==='done'||s==='current')?gsel:(l?lpill(l):stPill(c))}<button type="button" class="ctx-btn" data-a="ctx" data-id="${c.id}" title="Quick actions (grade, retake, copy, delete)" aria-label="Actions for ${esc(c.code)}">⋮</button></div></div>`;
}
function courseTableRow(c){
  const st=standing(c),l=effLetter(c),s=status(c),t=termOf(c.term);
  const gcls=gradeCls(c.grade);
  const gsel=`<select class="sel-pill ${gcls}" data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade for ${esc(c.code)}">${gradeOpts(c).map(g=>`<option value="${esc(g)}" ${(c.grade||'')===g?'selected':''}>${g===''?(s==='current'&&st.letter?'Now '+st.letter:'Grade'):g}</option>`).join('')}</select>`;
  const stand=s==='current'&&st.pct!=null?`<span class="mono small">${fmt(st.pct,1)}%</span> ${gsel}`:(s==='done'||s==='current'?gsel:(l?lpill(l):stPill(c)));
  return`<tr class="click" data-a="open" data-id="${c.id}" data-cid="${c.id}" style="cursor:pointer"><td class="mono small" style="white-space:nowrap"><b>${esc(c.code)}</b></td><td><b>${esc(c.title)}</b>${c.instructor?`<div class="small muted">${esc(c.instructor)}</div>`:''}</td><td class="small muted" style="white-space:nowrap">${esc(t?t.name:'Catalog')}</td><td class="small" style="white-space:nowrap"><i class="cat-dot" style="background:${esc(catColor(c.cat))};margin-right:6px"></i>${esc(catName(c.cat))}</td><td class="r mono">${c.credits}</td><td class="r" style="white-space:nowrap">${stand} <button type="button" class="ctx-btn" data-a="ctx" data-id="${c.id}" title="Quick actions" aria-label="Actions for ${esc(c.code)}">⋮</button></td></tr>`;
}
function vCourses(){
  const add=`<button type="button" class="btn primary sm" data-a="openadd">+ Add course</button>`,mods=(S.ui&&S.ui.modules)||{};
  const syncBtn=mods.canvas!==false?`<button type="button" class="btn sm" data-a="go" data-v="canvas">Sync</button>`:'';
  if(!S.courses.length)return head('Courses','Every course with its grading breakdown.',add)+'<div class="empty">No courses yet. Add one from a syllabus or by hand.</div>';
  const T=S.terms,ci=T.findIndex(t=>t.status==='current');
  const ni=T.findIndex((t,i)=>t.status==='planned'&&i>ci);
  let li=-1;T.forEach((t,i)=>{if(t.status==='done'&&(ci<0||i<ci))li=i});
  if(li<0)T.forEach((t,i)=>{if(t.status==='done')li=i});
  const view=U.cview&&(U.cview==='all'||T.some(t=>t.id===U.cview))?U.cview:'now';
  let shown=view==='all'?T.slice():view==='now'?T.filter((t,i)=>i===li||i===ci||i===ni):T.filter(t=>t.id===view);
  if(!shown.length)shown=T.slice(0,2);
  const q=(U.courseQ||'').trim().toLowerCase(),ck=U.courseCat||'',mode=U.courseMode||'cards';
  const match=c=>(!ck||c.cat===ck)&&(!q||(c.code+' '+c.title+' '+(c.instructor||'')).toLowerCase().includes(q));
  const strip=`<div class="tabs" style="margin-bottom:10px"><a href="#" data-a="cview" data-v="now" ${view==='now'?'aria-current="page"':''}>Now</a>${T.map(t=>`<a href="#" data-a="cview" data-v="${t.id}" ${view===t.id?'aria-current="page"':''}>${esc(t.name)}</a>`).join('')}<a href="#" data-a="cview" data-v="all" ${view==='all'?'aria-current="page"':''}>All</a></div>`;
  const ctrl=`<div class="grid-bar"><div class="grid-bar-grp"><input id="course-q" type="search" data-c="courseq" value="${esc(U.courseQ||'')}" placeholder="Search code, title, instructor…" style="width:220px;padding:5px 10px;font-size:13px"><select class="sel-pill" data-c="coursecat" aria-label="Filter by category"><option value="">All categories</option>${S.settings.cats.map(k=>`<option value="${esc(k.k)}" ${ck===k.k?'selected':''}>${esc(k.n)}</option>`).join('')}</select></div><div class="seg" role="group" aria-label="View mode"><button type="button" class="${mode==='cards'?'on':''}" data-a="cmode" data-v="cards">Cards</button><button type="button" class="${mode==='table'?'on':''}" data-a="cmode" data-v="table">Table</button></div></div>`;
  const cat=S.courses.filter(c=>!termOf(c.term)&&match(c));
  let body='';
  if(mode==='table'){
    const list=shown.flatMap(t=>S.courses.filter(c=>c.term===t.id&&match(c))).concat((view==='now'||view==='all')?cat:[]);
    body=list.length?`<div class="card scroll" style="padding:6px 14px"><table class="t"><thead><tr><th>Code</th><th>Title</th><th>Term</th><th>Category</th><th class="r">Cr</th><th class="r">Standing / Grade</th></tr></thead><tbody>${list.map(courseTableRow).join('')}</tbody></table></div>`:'<div class="empty">No matching courses in the selected terms.</div>';
  }else{
    const blocks=`<div class="cols" style="margin-top:4px">`+shown.map(t=>{
      const cs=S.courses.filter(c=>c.term===t.id&&match(c)),g=termGpa(t);
      const stBadge=`<span class="pill ${t.status==='done'?'good':t.status==='current'?'acc':''}">${t.status==='done'?'finished':t.status==='current'?'current':'planned'}</span>`;
      return`<div class="sec"><div class="row between" style="margin-bottom:10px"><div class="row" style="gap:8px"><h2 style="margin:0;font-size:13px;color:var(--ink)">${esc(t.name)}</h2>${stBadge}</div><span class="meta-txt">${cs.reduce((a,c)=>a+c.credits,0)} cr${g.gpa!=null?' · GPA '+fmt(g.gpa):''}</span></div>${cs.length?`<div class="card list" style="padding:4px 16px">${cs.map(courseRow).join('')}</div>`:'<div class="empty">No matching courses</div>'}</div>`;
    }).join('')+`</div>`;
    body=blocks+(cat.length&&(view==='now'||view==='all')?`<div class="sec" style="margin-top:26px"><h2>Not in a term yet</h2><div class="card list" style="padding:4px 16px">${cat.map(courseRow).join('')}</div></div>`:'');
  }
  return head('Courses','',add+syncBtn)+strip+ctrl+body;
}

const gradeOpts=c=>{const t=termOf(c.term);return t&&t.cr?['','CR','NC']:['',...S.settings.scale.map(x=>x.l),'W']};
const STOPT=[['','Flag'],['submitted','Submitted'],['missing','Missing'],['excused','Excused']];
const FLAG_NEXT={'':'submitted',submitted:'missing',missing:'excused',excused:''};
function groupCard(c,g){
  const gs=gstat(g),A=`data-id="${c.id}" data-gid="${g.id}"`,openMeta=!!(U.openGrps&&U.openGrps[g.id]);
  const rows=(g.items||[]).map(it=>{const p=ipct(it),B=`${A} data-iid="${it.id}"`;
    const fl=it.st||'';const fLbl=fl?fl[0].toUpperCase()+fl.slice(1):'·';
    return`<div class="ir-clean"><input class="nm" data-c="it" data-f="n" ${B} value="${esc(it.n)}" aria-label="Item name"><input type="number" step="any" data-c="it" data-f="s" ${B} value="${it.s==null?'':it.s}" placeholder="–" aria-label="Score"><span class="ir-slash">/</span><input type="number" step="any" data-c="it" data-f="m" ${B} value="${it.m==null?'':it.m}" aria-label="Out of"><span class="mono small muted ir-pct">${p==null?'':fmt(p,0)+'%'}</span><input type="date" data-c="it" data-f="due" ${B} value="${esc((it.due||'').slice(0,10))}" aria-label="Due date"><span class="row" style="gap:3px;flex-wrap:nowrap;justify-content:flex-end"><button type="button" class="flag-btn ${fl}" data-a="cycleflag" ${B} title="Cycle status: none / submitted / missing / excused">${fLbl}</button><button type="button" class="btn ghost danger sm" data-a="delitem" ${B} aria-label="Remove item" style="padding:3px 5px">✕</button></span></div>`}).join('');
  const metaBar=openMeta?`<div class="g-meta-bar"><label class="row" style="gap:5px">Type <select class="sel-pill" data-c="gr" data-f="type" ${A} aria-label="Type">${ATYPES.map(t=>`<option ${g.type===t?'selected':''}>${t}</option>`).join('')}</select></label><label class="row" style="gap:5px">Items <input class="w" type="number" min="1" data-c="gr" data-f="cnt" ${A} value="${gs.n}" style="width:52px;padding:4px 6px"></label><label class="row" style="gap:5px">Drop lowest <input class="w" type="number" min="0" data-c="gr" data-f="drop" ${A} value="${g.drop||0}" style="width:52px;padding:4px 6px"></label></div>`:'';
  return`<div class="gc"><div class="gh"><input data-c="gr" data-f="n" ${A} value="${esc(g.n)}" aria-label="Group name" style="flex:1 1 140px;font-weight:600;padding:5px 9px"><label class="row small muted" style="gap:4px"><input class="w" type="number" step="any" data-c="gr" data-f="w" ${A} value="${g.w}" style="width:58px;padding:5px 7px;text-align:right">%</label><button type="button" class="btn ghost sm ${openMeta?'soft':''}" data-a="togglegrp" data-gid="${g.id}" title="Group settings (type, count, drop lowest)">⚙</button><button type="button" class="btn ghost danger sm" data-a="delgroup" ${A} aria-label="Remove group">✕</button></div>${metaBar}
  ${rows?`<div class="ir-clean ih"><span>Item</span><span>Score</span><span></span><span>Max</span><span></span><span>Due</span><span></span></div>${rows}`:'<div class="small muted" style="padding:4px 2px 8px">No items yet.</div>'}
  <div class="row between" style="margin-top:8px"><button type="button" class="btn ghost sm" data-a="additem" ${A}>+ Add item</button><span class="meta-txt">${esc(g.type)} · ${gs.used?`<b>${fmt(gs.mean,0)}%</b> avg · `:''}best ${gs.k} of ${gs.n}</span></div></div>`;
}
function gradesTab(c,st){
  const sc=S.settings.scale,tgt=sc.filter(x=>x.p>0);
  const needRows=tgt.map(x=>{const n=needed(c,x.min);let v,cl='';
    if(n==null)v='–';else if(n<=0){v='secured';cl='good'}else if(n>100){v='out of reach';cl='bad'}else{v=fmt(n,1)+'%';cl=n>90?'warn':''}
    return`<div class="kv"><span>To finish with ${lpill(x.l)} <span class="muted small">(${x.min}%)</span></span><span class="mono" style="font-weight:600;${cl?`color:var(--${cl})`:''}">${v}</span></div>`}).join('');
  const goalSel=`<select class="sel-pill ${c.goal?'acc':''}" data-c="goal" data-id="${c.id}" aria-label="Goal grade"><option value="">Goal: Auto</option>${sc.map(x=>`<option value="${esc(x.l)}" ${c.goal===x.l?'selected':''}>Goal: ${esc(x.l)}</option>`).join('')}</select>`;
  const gOpts=gradeOpts(c);
  const finalSel=`<select class="sel-pill ${gradeCls(c.grade)}" data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade">${gOpts.map(l=>`<option value="${esc(l)}" ${(c.grade||'')===l?'selected':''}>${l===''?'Final: Unset':'Final: '+l}</option>`).join('')}</select>`;
  return`<div class="dr-summary">
    <div class="dr-sum-top">
      <div><div class="lbl">Standing now</div><div class="row" style="gap:10px;margin-top:6px"><span class="num" style="font-size:44px">${st.pct==null?'–':fmt(st.pct,1)}<span class="muted" style="font-size:20px">%</span></span>${lpill(st.letter)}</div></div>
      <div style="text-align:right"><div class="meta-txt">${fmt(st.gw,0)} of ${fmt(st.W,0)}% marked</div>${st.W?`<div class="small muted" style="margin-top:3px">Range <b class="mono">${fmt(st.floor,1)}%</b> – <b class="mono">${fmt(st.ceil,1)}%</b></div>`:''}</div>
    </div>
    <div class="bar" style="height:5px"><i class="d" style="width:${st.W?Math.min(100,st.gw/st.W*100):0}%"></i></div>
    <div class="dr-sum-controls">${goalSel}${finalSel}<span class="meta-txt" style="margin-left:auto">Total weight ${fmt(st.W,0)}%</span></div>
  </div>
  <div class="row between" style="margin-bottom:10px"><h2 style="margin:0">Grading breakdown</h2><button type="button" class="btn sm" data-a="addgroup" data-id="${c.id}">+ Add group</button></div>
  ${(c.assess||[]).map(g=>groupCard(c,g)).join('')||'<div class="empty">No grading groups yet. Add one above or import a syllabus.</div>'}
  ${st.rem>0&&st.W?`<details class="card" style="margin-top:18px;padding:14px 16px"><summary>What you need on the remaining ${fmt(st.rem,0)}%</summary>${needRows}</details>`:''}`;
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
    <label class="f" style="margin-bottom:14px"><span>Syllabus link (optional https://…)</span><input data-c="cf" data-f="syllabusUrl" data-id="${c.id}" value="${esc(c.syllabusUrl||'')}" placeholder="https://…"></label>
    <label class="f" style="margin-bottom:18px"><span>Notes</span><textarea rows="4" data-c="cf" data-f="notes" data-id="${c.id}">${esc(c.notes||'')}</textarea></label>
    ${dep.length?`<h2>Unlocks</h2><div class="row" style="margin-bottom:22px">${dep.map(o=>`<button class="btn sm" data-a="open" data-id="${o.id}">${esc(o.code)}</button>`).join('')}</div>`:''}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn soft" data-a="retakecourse" data-id="${c.id}">Retake (copy &amp; link)</button><button type="button" class="btn" data-a="dupcourse" data-id="${c.id}">Duplicate</button><button type="button" class="btn danger" data-a="delcourse" data-id="${c.id}">Delete this course</button></div>`;
  }
  const cvLink=c.canvasId?`<a class="btn sm soft" href="${esc(canvasPortalUrl()+'/courses/'+c.canvasId)}" target="_blank" rel="noopener">Canvas ↗</a>`:'';
  const sylLink=c.syllabusUrl?`<a class="btn sm" href="${esc(c.syllabusUrl)}" target="_blank" rel="noopener">Syllabus ↗</a>`:'';
  const hdrGrade=`<select class="sel-pill ${gradeCls(c.grade)}" data-c="cf" data-f="grade" data-id="${c.id}" aria-label="Final grade for ${esc(c.code)}">${gradeOpts(c).map(g=>`<option value="${esc(g)}" ${(c.grade||'')===g?'selected':''}>${g===''?'Final grade…':g}</option>`).join('')}</select>`;
  return`<div class="veil" data-a="closebg"><div class="drawer" role="dialog" aria-label="${esc(c.code)}"><div class="row between" style="align-items:flex-start;margin-bottom:8px"><div><span class="code">${esc(c.code)} · ${c.credits} credits · ${esc(catName(c.cat))}</span><h1 style="margin-top:6px">${esc(c.title)}</h1></div><button class="btn ghost" data-a="close" aria-label="Close">✕</button></div><div class="row" style="margin:10px 0 18px;gap:8px">${stPill(c)}${hdrGrade}<button type="button" class="btn sm" data-a="retakecourse" data-id="${c.id}" title="Copy &amp; link as a retake">Retake</button>${c.instructor?`<span class="pill">${esc(c.instructor)}</span>`:''}${cvLink}${sylLink}</div>${tabs}${body}</div></div>`;
}

/* ---------- quick action / context menu ---------- */
function ctxMenu(){
  const ctx=U.ctx;if(!ctx)return'';
  const c=getC(ctx.id);if(!c)return'';
  const vw=typeof window!=='undefined'?window.innerWidth:1200,vh=typeof window!=='undefined'?window.innerHeight:800;
  const mw=268,mh=360;
  const left=Math.max(8,Math.min(ctx.x,vw-mw-8));
  const top=Math.max(8,Math.min(ctx.y,vh-mh-8));
  const gOpts=gradeOpts(c);
  const gPills=gOpts.map(l=>{const on=(c.grade||'')===l;const cl=l?gradeCls(l):'subtle';return`<button type="button" class="opt-pill ${on?'on '+cl:''}" data-a="ctxgrade" data-id="${c.id}" data-v="${esc(l)}">${l===''?'Clear':esc(l)}</button>`}).join('');
  const termOpts=`<option value="">Catalog (unscheduled)</option>`+S.terms.map(t=>`<option value="${t.id}" ${c.term===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  return`<div class="ctx-backdrop" data-a="closectx"></div><div class="ctx-menu" role="menu" aria-label="Actions for ${esc(c.code)}" style="left:${left}px;top:${top}px">
    <div class="ctx-head"><b>${esc(c.code)} · ${c.credits} cr</b><span>${esc(c.title)}</span></div>
    <div class="ctx-sec"><span class="lbl">Quick final grade</span><div class="ctx-grades">${gPills}</div></div>
    <div class="ctx-sec"><span class="lbl">Move to term</span><select class="sel-pill" style="width:100%" data-c="ctxmove" data-id="${c.id}" aria-label="Move ${esc(c.code)} to term">${termOpts}</select></div>
    <button type="button" class="ctx-item" data-a="retakecourse" data-id="${c.id}"><span>Retake course</span><small>copy &amp; link</small></button>
    <button type="button" class="ctx-item" data-a="dupcourse" data-id="${c.id}"><span>Duplicate course</span><small>copy</small></button>
    <div class="ctx-sep"></div>
    <button type="button" class="ctx-item" data-a="ctxopen" data-id="${c.id}" data-v="assess"><span>Open grades</span><small>breakdown</small></button>
    <button type="button" class="ctx-item" data-a="ctxopen" data-id="${c.id}" data-v="details"><span>Edit details</span><small>prereqs, notes</small></button>
    <div class="ctx-sep"></div>
    <button type="button" class="ctx-item danger" data-a="ctxdel" data-id="${c.id}"><span>Delete course</span><small>undoable</small></button>
  </div>`;
}