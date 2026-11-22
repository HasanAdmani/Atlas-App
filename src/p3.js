
/* ---------- shared view bits ---------- */
const lpill=l=>{if(!l)return'<span class="pill">–</span>';const p=pointsOf(l);const cl=p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad';return`<span class="pill ${cl}">${esc(l)}</span>`};
const gradeCls=l=>{if(!l||l==='W'||l==='NC')return'';if(l==='CR')return'good';const p=pointsOf(l);return p==null?'':p>=3.3?'good':p>=2.3?'acc':p>=1?'warn':'bad'};
const stPill=c=>{const s=status(c);return s==='done'?'<span class="pill good">done</span>':s==='current'?'<span class="pill acc">in progress</span>':s==='planned'?'<span class="pill">planned</span>':'<span class="pill">not scheduled</span>'};
const catName=k=>{const x=S.settings.cats.find(c=>c.k===k);return x?x.n:k||'Uncategorised'};
let INNER=false;
const cmdBtn=()=>`<button type="button" class="btn ghost sm cmd-trig" data-a="opencmd" title="Search & commands (Ctrl+K)">${ICONS.search}<span class="mono small">⌘K</span></button>`;
const head=(t,sub,right)=>INNER
  ?`<div class="row between toolbar-inner" style="margin-bottom:14px;align-items:center;gap:10px">${sub?`<span class="small muted">${sub}</span>`:'<span></span>'}${right?`<div class="row" style="gap:8px">${right}</div>`:''}</div>`
  :`<div class="head"><div class="head-left"><div class="row" style="gap:8px;align-items:center"><h1>${t}</h1>${sub?`<button type="button" class="btn ghost sm help-trig ${U.showHelp?'on':''}" data-a="togglehelp" title="About this page" aria-label="Page info">${ICONS.info}</button>`:''}</div>${U.route==='overview'&&sub?`<p class="sub">${sub}</p>`:''}</div><div class="row head-right" style="gap:8px">${right||''}${cmdBtn()}</div></div>${U.showHelp&&sub?`<div class="help-pop"><span>${sub}</span><button type="button" class="btn ghost sm" data-a="togglehelp" aria-label="Dismiss">✕</button></div>`:''}`;

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
  const y=new Date().getFullYear(),ds=getDossiers();
  const fastTrack=`<div class="card kpi-card kpi-acc" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Fastest Start · Link Canvas Once</h2><span class="pill acc">Recommended</span></div>
    <p class="sub" style="margin:0 0 14px">Don’t want to set up terms and courses by hand? Connect Canvas once and Atlas automatically creates your current term, courses, instructors, assignment groups, weights, and due dates.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${DESKTOP_HOST?`<button type="button" class="btn primary" data-a="quickcanvas">${U.hostBusy==='canvas'?'Waiting for Canvas sign-in…':'Sign in to Canvas & Build Plan'}</button>`:`<a class="btn primary" href="${esc(bmCode())}" onclick="event.preventDefault();alert('Drag this button onto your Bookmarks bar, then click it once while signed into Canvas!')">✦ Send to Atlas (Drag to Bookmarks Bar)</a>`}
      <a class="btn" href="#canvas">Open Sync &amp; Import</a>
      <a class="btn soft" href="#tour">Interactive Tour →</a>
    </div>
  </div>`;

  const pathA=`<div class="card" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Path A · Load from a University Dossier</h2><span class="pill">Full 4-year grid</span></div>
    <p class="sub" style="margin:0 0 12px">Start with an official curriculum grid (no personal data or grades). Pick how many regular semesters you have already finished:</p>
    <div class="row" style="margin-bottom:14px;gap:10px"><label class="f" style="max-width:220px"><span>Terms finished so far</span><input id="su-d-done" type="number" min="0" max="12" value="0"></label></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">
      ${ds.map(d=>`<div class="card" style="margin:0;padding:14px;background:var(--bg-soft,var(--surface))">
        <div class="row between" style="margin-bottom:6px"><b>${esc(d.short||d.program)}</b><span class="pill">${esc(d.credits)} cr</span></div>
        <div class="small muted" style="margin-bottom:10px">${esc(d.school)} · ${esc(d.courses)} courses<br>${esc(d.notes||'')}</div>
        <button type="button" class="btn primary sm" data-a="loaddossier" data-id="${esc(d.id)}">Load ${esc(d.short||'Dossier')}</button>
      </div>`).join('')||'<div class="small muted">No bundled dossiers found. Run <code>npm run build:page</code> to bundle <code>dossiers/</code>.</div>'}
    </div>
  </div>`;

  const pathB=`<div class="card" style="margin-bottom:16px">
    <div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Path B · Import from PSCS, Simple Syllabus, or Stellic</h2><span class="pill acc">Any batch</span></div>
    <p class="sub" style="margin:0 0 12px">The same <b>✦ Send to Atlas</b> bookmarklet works on <b>Canvas</b>, <b>PSCS</b> (Course History / Grades), <b>Simple Syllabus</b> (links + grading weights), and <b>Stellic</b> (Degree Audit). Click it on any portal or paste the export below.</p>
    <div class="row" style="margin-bottom:12px;gap:8px;flex-wrap:wrap">
      <a class="btn primary" href="${esc(bmCode())}" onclick="event.preventDefault();alert('Drag this button onto your Bookmarks bar, then click it while viewing Canvas, PSCS, Simple Syllabus, or Stellic!')">✦ Send to Atlas (Drag to Bookmarks Bar)</a>
      <a class="btn" href="#canvas">Open Sync &amp; Import →</a>
    </div>
    <textarea id="su-portal-text" rows="3" placeholder="Paste a Canvas JSON, PSCS Course History, Simple Syllabus report, or Stellic Degree Audit here…"></textarea>
    <div class="row" style="margin-top:10px"><button type="button" class="btn primary" data-a="suimport">Import &amp; Build</button><span class="small" style="color:var(--bad)">${esc(U.cvErr||'')}</span></div>
  </div>`;

  const pathC=`<details class="card"><summary>Path C · Build Custom Degree (Any University)</summary>
    <p class="sub" style="margin:0 0 16px">Tell Atlas how your degree runs, pick a grading scale, and add courses manually or from syllabi.</p>
    <div class="fgrid">
      <label class="f"><span>Programme</span><input id="su-prog" placeholder="B.S. Electrical Engineering"></label>
      <label class="f"><span>University</span><input id="su-school" placeholder="Your university"></label>
      <label class="f"><span>Grading scale</span><select id="su-scale"><option value="habib">Habib University (A+ 95, A 90, …)</option><option value="us">Standard US 4.0 (A 93, A- 90, …)</option></select></label>
      <label class="f"><span>First term</span><div class="row" style="gap:6px;flex-wrap:nowrap"><select id="su-season"><option>Fall</option><option>Spring</option></select><input id="su-year" type="number" value="${y-1}" style="width:86px"></div></label>
      <label class="f"><span>Terms finished so far</span><input id="su-done" type="number" min="0" max="12" value="0"></label>
      <label class="f"><span>Terms in the degree</span><input id="su-n" type="number" min="2" max="14" value="8"></label>
      <label class="f"><span>Credits to graduate</span><input id="su-cr" type="number" value="134"></label>
    </div>
    <div class="row" style="margin-top:18px"><button type="button" class="btn primary" data-a="setup">Create my terms</button>${isGuide&&S.terms.length?`<a class="btn" href="#overview">Back to Overview</a>`:''}</div>
  </details>`;

  return fastTrack+setupChecklist()+pathA+pathB+pathC;
}
function vSetup(){
  return head('Setup Guide','Link Canvas once to auto-build your term, load a university dossier, or import from PSCS & Simple Syllabus.',`<a class="btn soft" href="#tour">Interactive Tour</a>`)+setupPanel(true);
}
const TOUR_STEPS=[
  {k:'start',lbl:'Step 1',title:'One-Click Setup',badge:'Zero manual entry',
    body:'New to Atlas? You don’t need to type your courses one by one. Link <b>Canvas</b> once and Atlas automatically builds your current term, courses, instructors, assignment weights, and due dates. Add a <b>Dossier</b> for a full 4-year roadmap or send <b>PSCS Course History</b> for past grades.',
    tips:['Desktop app: click <b>Sign in to Canvas</b> — sign in normally and Atlas reads your courses privately.','Web / PWA: drag <b>✦ Send to Atlas</b> to your Bookmarks bar and click it once on Canvas.','Your passwords are never seen or stored by Atlas.'],
    cta:`<a class="btn primary" href="#setup">Go to Setup Guide</a><a class="btn" href="#canvas">Open Sync &amp; Import</a>`},
  {k:'quick',lbl:'Step 2',title:'Quick Course Actions',badge:'1-click grading & retakes',
    body:'Common actions are always 1 click away — no digging through drawers. Click the <b>⋮</b> button or <b>right-click</b> any course card, list row, table row, or 4-Year Grid card.',
    tips:['<b>Set Final Grade</b> right from the popup pills (works for finished and current courses).','<b>Retake Course (Copy &amp; Link)</b> clones every detail without old scores, links it as a retake, and schedules it in your next term.','<b>Duplicate</b>, <b>Move to term</b>, or <b>Delete</b> with instant Undo (<code>Ctrl+Z</code>).'],
    cta:`<a class="btn primary" href="#courses">Try on Courses</a><a class="btn" href="#gpa">Check GPA Lab</a>`},
  {k:'plan',lbl:'Step 3',title:'4-Year Plan & Roadmap',badge:'Drag, drop & prereqs',
    body:'Organize your entire degree in <b>Plan → Four years</b>. Drag courses between terms (or tap ⇄ on mobile) — Atlas highlights valid, warning, and prerequisite-conflict drops in real time.',
    tips:['Click <b>+</b> on any term header to add a course straight into that semester.','Switch to <b>Roadmap</b> to trace prerequisite chains left-to-right and see which courses unlock the most later courses.','Track <b>Minors</b> and degree credit categories under <b>Requirements</b>.'],
    cta:`<a class="btn primary" href="#grid">Open Four-Year Plan</a><a class="btn" href="#roadmap">View Roadmap</a>`},
  {k:'enroll',lbl:'Step 4',title:'Enrollment & Multi-Component Courses',badge:'Lectures + Seminars/Labs',
    body:'Drop the registrar’s schedule spreadsheet (.csv or .xlsx) into <b>Plan → Enrollment</b> to build a clash-free weekly timetable and PSCS shopping cart.',
    tips:['Courses with multiple components (like <b>Hikma</b> with Lecture <code>L1</code> + Seminar <code>S3</code>, or <b>Calculus</b> with <code>L</code> + <code>R</code>) automatically split into separate pickers so you can select both.','If a component has only one common section (like Hikma’s <code>L1</code>), picking your Seminar automatically selects the Lecture too.','Use <b>Auto-schedule</b> to generate clash-free combinations ranked by time, instructor, and seat reservations.'],
    cta:`<a class="btn primary" href="#enroll">Open Enrollment</a>`},
  {k:'sync',lbl:'Step 5',title:'Canvas, PSCS & Simple Syllabus',badge:'One universal bookmarklet',
    body:'One single <b>✦ Send to Atlas</b> bookmarklet understands all four Habib portals automatically — no separate tools to juggle.',
    tips:['<b>Canvas</b>: syncs live scores, weights, and upcoming due dates.','<b>PSCS</b>: reads Course History / Grades and updates or creates finished terms.','<b>Simple Syllabus</b>: grabs the exact syllabus URL, instructor, and grading breakdown and links them straight to your existing course.','<b>Stellic</b>: imports degree audit requirements for any batch.'],
    cta:`<a class="btn primary" href="#canvas">Set up Bookmarklet</a><a class="btn" href="#overview">Go to Overview</a>`}
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
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">In progress</h2><a class="btn ghost sm" href="#courses">All ›</a></div>${cur.length?`<div class="list">${cur.map(c=>{const st=standing(c);return`<div class="li click" data-a="open" data-id="${c.id}" data-cid="${c.id}"><div style="min-width:0;flex:1"><div class="row" style="gap:6px;margin-bottom:2px"><span class="code">${esc(c.code)}</span><span class="pill" style="padding:2px 7px;font-size:10px">${c.credits} cr</span></div><h3>${esc(c.title)}</h3><div class="bar" style="margin-top:7px;width:min(240px,100%)"><i class="d" style="width:${st.W?st.gw/st.W*100:0}%"></i></div></div><div class="row" style="gap:6px;flex:none"><div style="text-align:right"><div class="mono small" style="margin-bottom:4px;font-weight:500">${st.pct==null?'–':fmt(st.pct,1)+'%'}</div>${lpill(c.grade||st.letter)}</div><button type="button" class="ctx-btn" data-a="ctx" data-id="${c.id}" title="Quick actions" aria-label="Actions for ${esc(c.code)}">⋮</button></div></div>`}).join('')}</div>`:'<div class="empty">No course is in progress. Move courses into your current term on the Plan page.</div>'}</div>`;
  }},
  duenext:{title:'Due next',render(){
    const dl=deadlines().slice(0,5);
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Due next</h2></div>${dl.length?`<div class="list">${dl.map(x=>`<div class="li click" data-a="open" data-id="${x.c.id}"><div class="row" style="flex-wrap:nowrap;gap:12px;min-width:0">${dateBadge(x.a.due,x.d)}<div style="min-width:0"><span class="code">${esc(x.c.code)}</span><h3>${esc(x.a.n)}</h3></div></div><div class="row" style="gap:6px;justify-content:flex-end;flex:none"><span class="pill ${x.d<0?'bad':x.d<=3?'warn':''}">${x.d<0?Math.abs(x.d)+'d late':x.d===0?'today':'in '+x.d+'d'}</span><span class="pill acc">${fmt(x.a.w,0)}%</span></div></div>`).join('')}</div>`:'<div class="empty">Nothing dated yet. Add due dates in a course or sync Canvas.</div>'}</div>`;
  }},
  week:{title:'This week',render(){
    const pk=typeof picked==='function'?picked():[];
    if(!pk.length){
      const srv=typeof IS_WEB!=='undefined'&&IS_WEB?`<button type="button" class="btn soft sm" data-a="loadsrvsched">Load Spring 2027</button>`:'';
      return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">This week</h2><a class="btn ghost sm" href="#enroll">Enrollment ›</a></div><div class="empty" style="padding:20px 14px">No sections picked yet.<div class="row" style="justify-content:center;margin-top:10px"><a class="btn sm" href="#enroll">Pick sections</a>${srv}</div></div></div>`;
    }
    const bad=clashes(pk);
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">This week</h2><a class="btn ghost sm" href="#enroll">Edit ›</a></div>${weekGrid(pk,bad)}</div>`;
  }},
  trend:{title:'GPA by term',render(){
    return`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">GPA by term</h2><a class="btn ghost sm" href="#gpa">GPA lab ›</a></div>${spark(trend())}</div>`;
  }},
  attention:{title:'Worth a look',render(){
    const att=attention().slice(0,5);
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
  if(!S.terms.length)return head('Atlas','One place for your grades, your roadmap and your four years.')+setupPanel();
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
  const editBtn=`<button type="button" class="btn sm ${U.dashEdit?'primary':''}" data-a="dashedit">${U.dashEdit?'Done':'Customize'}</button>`;
  const editBar=U.dashEdit?`<div class="dash-edit-bar"><div class="row" style="gap:8px"><b class="small">Editing layout:</b><div class="seg"><button type="button" class="${devMode==='desktop'?'on':''}" data-a="dashmode" data-v="desktop">Desktop</button><button type="button" class="${devMode==='mobile'?'on':''}" data-a="dashmode" data-v="mobile">Mobile</button></div></div><div class="row" style="gap:8px"><button type="button" class="btn sm" data-a="dashreset">Reset default</button><button type="button" class="btn sm primary" data-a="dashedit">Done</button></div></div>`:'';
  const cards=visible.map((x,i)=>{
    const w=WIDGETS[x.w],sz=x.size||'m';
    const ctrl=U.dashEdit?`<div class="w-ctrl"><button type="button" class="btn sm ${x.on!==false?'soft':'ghost'}" data-a="wvis" data-w="${x.w}">${x.on!==false?'Shown':'Hidden'}</button><div class="seg">${['s','m','l'].map(s=>`<button type="button" class="${sz===s?'on':''}" data-a="wsize" data-w="${x.w}" data-v="${s}">${s.toUpperCase()}</button>`).join('')}</div><div class="row" style="gap:3px"><button type="button" class="btn sm ghost" data-a="wmove" data-w="${x.w}" data-dir="-1" ${i===0?'disabled':''} aria-label="Move earlier">←</button><button type="button" class="btn sm ghost" data-a="wmove" data-w="${x.w}" data-dir="1" ${i===visible.length-1?'disabled':''} aria-label="Move later">→</button></div></div>`:'';
    return`<div class="dash-w w-${sz}${x.on===false?' w-off':''}">${ctrl}${w.render()}</div>`;
  }).join('');
  return head(esc(S.settings.program||'Your degree'),esc(S.settings.school||'')+(ct?(S.settings.school?' · ':'')+'now in '+esc(ct.name):''),editBtn)+editBar+`<div class="dash-grid">${cards}</div>`;
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
  const add=`<button class="btn primary" data-a="go" data-v="add">+ Add course</button>`,mods=(S.ui&&S.ui.modules)||{};
  const syncBtn=mods.canvas!==false?`<button class="btn" data-a="go" data-v="canvas">Sync Canvas</button>`:'';
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
      return`<div class="sec"><div class="row between" style="margin-bottom:10px"><div class="row" style="gap:8px"><h2 style="margin:0;font-size:13px;color:var(--ink)">${esc(t.name)}</h2>${stBadge}</div><div class="row" style="gap:6px"><span class="pill">${cs.reduce((a,c)=>a+c.credits,0)} cr</span>${g.gpa!=null?`<span class="pill acc">GPA ${fmt(g.gpa)}</span>`:''}</div></div>${cs.length?`<div class="card list" style="padding:4px 16px">${cs.map(courseRow).join('')}</div>`:'<div class="empty">No matching courses</div>'}</div>`;
    }).join('')+`</div>`;
    body=blocks+(cat.length&&(view==='now'||view==='all')?`<div class="sec" style="margin-top:26px"><h2>Not in a term yet</h2><div class="card list" style="padding:4px 16px">${cat.map(courseRow).join('')}</div></div>`:'');
  }
  return head('Courses','Your current term, the next one and the last one you finished. Pick any term below to focus on it or enter final grades.',add+syncBtn)+strip+ctrl+body;
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