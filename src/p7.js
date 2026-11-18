
/* ---------- minors ---------- */
/* Read from habib.edu.pk/academics/minors (Class of 2023 and later versions). Credits per course are estimates where the page gives only a total. */
const mk=(label,opts,cr,n)=>Array.from({length:n||1},()=>({label,opts:opts||[],cr:cr||3}));
const MINOR_CATALOG=[
 {id:'mus',name:'South Asian Music',unit:'SAHSS',credits:15,minGrade:'C+',note:'Needs three semesters of music tutorials (1 credit each) ending in a recital. Link each tutorial course as you take it.',
  slots:[].concat(mk('Foundations of Musicianship',['MUS 102']),mk('Sound and Subjectivity',['MUS 222']),mk('History of South Asian Music',['MUS/HIS 221/253']),mk('Elective: one of these',['MUS 300','RL/MS/AT 333','LIT/MUS 319']),[Object.assign(mk('Music tutorials, one credit each over three semesters',[],1)[0],{n:3})])},
 {id:'cl',name:'Comparative Literature',unit:'SAHSS',credits:18,not:/comparative humanities/i,note:'The last course may not come from the Liberal Core.',
  slots:[].concat(mk('What is World Literature',['LIT 104']),mk('Introduction to Literary Theory and Criticism',['LIT 225']),mk('Jehan-e-Urdu',['CORE 121']),mk('LIT elective, 300/400 level',[],3,2),mk('Comparative Humanities course (HUM, HIST, LIT, PHIL, RELS or MUS)',[]))},
 {id:'phil',name:'Philosophy',unit:'SAHSS',credits:15,not:/comparative humanities/i,note:'The intermediate course needs approval from the program.',
  slots:[].concat(mk('Introduction to philosophy',['PHIL 200','PHIL 122']),mk('Hikma I, or formal reasoning (not both)',['CORE 202','CORE 111','CS 101']),mk('Epistemology or ontology, 200 level or higher',[]),mk('PHIL elective, 300/400 level',[],3,2))},
 {id:'rels',name:'Religious Studies',unit:'SAHSS',credits:15,not:/comparative humanities/i,note:'CORE 302 (Hikma II) can count as an elective if the Liberal Core is not already using it.',
  slots:[].concat(mk('World Religions',['REL 122','RELS 122']),mk('Hikma I',['CORE 202']),mk('Approaches to the study of religion',['REL 223','RELS 223']),mk('RELS elective, 300/400 level',[],3,2))},
 {id:'hist',name:'History',unit:'SAHSS',credits:15,not:/comparative humanities/i,note:'',
  slots:[].concat(mk('Global Histories course',[]),mk('Pakistan and Modern South Asia',['CORE 201']),mk('Understanding Histories',['HIST 227']),mk('HIST elective, 300/400 level',[],3,2))},
 {id:'comm',name:'Communication',unit:'SAHSS',credits:19,not:/communication and design/i,note:'For the Class of 2025 and later.',
  slots:[].concat(mk('Intro to Design and Media',['CND 103'],5),mk('Production Fundamentals I',['COM 201'],5),mk('Elements of Aesthetics I',['COM 204']),mk('COM elective, 100/200 level',[]),mk('COM elective, 300/400 level',[]))},
 {id:'des',name:'Design',unit:'SAHSS',credits:18,not:/communication and design/i,note:'For the Class of 2025 and later.',
  slots:[].concat(mk('Intro to Design and Media',['CND 103'],5),mk('Designing for and with People',['DES 203'],5),mk('Design and Social Change, or Research in Design',['DES 302','DES 204'],2),mk('DES elective, 100/200 level',[]),mk('DES elective, 300/400 level',[]))},
 {id:'sdp',name:'Social Development and Policy',unit:'SAHSS',credits:18,not:/social development/i,note:'',
  slots:[].concat(mk('Development and Social Change',['SDP 101'],4),mk('Research methods',['SDP 201','SDP 202'],4),mk('Public policy',['SDP 204','SDP 301'],4),mk('SDP elective, any level',[]),mk('SDP elective, 300/400 level',[]))},
 {id:'phy',name:'Physics',unit:'DSSE',credits:20,minGrade:'C',note:'C or higher in the foundation courses. Electives run only when enough students sign up. ME 432 is also on the EE degree’s interdisciplinary elective list.',
  slots:[].concat(mk('Mechanics and Thermodynamics',['PHY 101']),mk('Mechanics and Thermodynamics Lab',['PHY 101L'],1),mk('Modern Physics',['PHY 201']),mk('Advanced Physics Lab',['PHY 102L'],1),mk('Quantum Mechanics',['PHY 202']),mk('Electromagnetic Theory',['PHY 241']),mk('Elective, 300 level or above',['ME 432','PHY 301','PHY/MATH 302','PHY 351','PHY 401','PHY/EE 441','PHY 360','PHY 300/CS 314'],3,3))},
 {id:'math',name:'Mathematics',unit:'DSSE',credits:20,minGrade:'C',note:'C or higher in the four foundation courses. At least two electives at 300 level or above. Electives run only when enough students sign up.',
  slots:[].concat(mk('Calculus II',['MATH 102']),mk('Engineering Mathematics',['MATH 202']),mk('Linear Algebra',['MATH 205']),mk('Probability and Statistics',['MATH 310/EE 354']),mk('Mathematics elective, 300 level or above',[],3,3))},
 {id:'bio',name:'Bioscience',unit:'DSSE',credits:17,note:'',
  slots:[].concat(mk('Cell Biology and Public Health',['BIO 101']),mk('Cell Biology and Public Health Lab',['BIO 101L'],1),mk('Understanding the Human Body',['BIO 211']),mk('Understanding the Human Body Lab',['BIO 211L'],1),mk('Upper-level elective',['BIO 301']))},
 {id:'cs',name:'Computer Science',unit:'DSSE',credits:21,not:/computer science/i,note:'Up to four courses can count toward both your major and this minor (Class of 2025 and later). Credits include labs. The page lists AI as CS 353, your degree grid calls it CS 351.',
  slots:[].concat(mk('Programming Fundamentals',['CS 101']),mk('Discrete Mathematics',['CS 113']),mk('Data Structures and Algorithms',['CS 102'],4),mk('Kernel course, 200 level or above',['CS 201','CS 224','CS 212','CS 232','CS 355','CS 412','CS 353','CS 351'],3,2),mk('CS elective, 200 level or above',['CS 261','CS 262','CS 222'],3,2))}
];
const eligibleMinors=()=>MINOR_CATALOG.filter(m=>!(m.not&&m.not.test(S.settings.program||'')));
const ensureMinorCat=set=>{set=set||S.settings;if(!set.cats.some(k=>k.k==='minor'))set.cats.push({k:'minor',n:'Minor courses, on top of the degree',req:0})};

/* "MUS/HIS 221/253" means one course listed under several codes, so it matches any of MUS 221, MUS 253, HIS 221, HIS 253 */
function aliases(s){const t=String(s||'').toUpperCase(),d=t.match(/[A-Z]{2,5}/g)||[],n=t.match(/\d{3,4}[A-Z]?/g)||[],o=[];d.forEach(a=>n.forEach(b=>o.push(a+b)));return o}
function primary(s){const t=String(s||'').toUpperCase(),d=t.match(/[A-Z]{2,5}/g),n=t.match(/\d{3,4}[A-Z]?/g);return d&&n?d[0]+' '+n[0]:String(s||'')}
const slotName=sl=>sl.label||(sl.opts||[]).join(' or ')||'Course';
const slotIds=sl=>sl.ids||(sl.courseId?[sl.courseId]:[]);
const isPh=c=>/elective|^idee\b|\dxx|\bxx\b/i.test(c.code)&&counts(c)&&status(c)!=='done'&&!c.was&&!S.minors.some(m=>(m.slots||[]).some(s=>slotIds(s).indexOf(c.id)>=0));
const isFree=c=>/^free elective/i.test(c.code);
const termNm=c=>(termOf(c.term)||{}).name||'no term';
/* credits in a term that count against the limit. Courses from another school can be left out if you turn that on. */
const outside=c=>{const u=(S.settings.unit||'').trim().toUpperCase();if(!u)return false;return S.minors.some(m=>(m.slots||[]).some(s=>slotIds(s).indexOf(c.id)>=0)&&m.unit&&m.unit.toUpperCase()!==u)};
const loadOf=id=>S.courses.filter(c=>c.term===id&&!(S.settings.capOwn&&outside(c))).reduce((a,c)=>a+c.credits,0);

function minorRows(mn){
  const used={},rank={done:0,current:1,planned:2,catalog:3},cells=[];
  (mn.slots||[]).forEach(sl=>slotIds(sl).forEach(id=>{if(getC(id))used[id]=1}));
  (mn.slots||[]).forEach(sl=>{
    const n=Math.max(1,+sl.n||1),own=slotIds(sl).map(getC).filter(Boolean),cs=own.slice();
    if(cs.length<n){const cand=[];(sl.opts||[]).forEach(o=>aliases(o).forEach(a=>S.courses.forEach(x=>{if(NC(x.code)===a&&!used[x.id]&&counts(x)&&cand.indexOf(x)<0)cand.push(x)})));
      cand.sort((a,b)=>rank[status(a)]-rank[status(b)]);for(const x of cand){if(cs.length>=n)break;cs.push(x);used[x.id]=1}}
    for(let i=0;i<n;i++){const c=cs[i]||null,st=c?(termOf(c.term)?status(c):'catalog'):'none';
      cells.push({sl,c,st,cr:c?c.credits:(+sl.cr||3),linked:!!c&&own.indexOf(c)>=0,n})}
  });
  return cells;
}
function minorStat(mn){
  const rows=minorRows(mn),ok=r=>r.c&&r.st!=='none'&&r.st!=='catalog',sum=f=>rows.filter(f).reduce((a,r)=>a+r.cr,0);
  const need=Math.max(+mn.credits||0,rows.reduce((a,r)=>a+r.cr,0)),have=sum(ok),done=sum(r=>ok(r)&&r.st==='done'),cur=sum(r=>ok(r)&&r.st==='current');
  return{rows,need,have,done,cur,pl:have-done-cur,left:Math.max(0,need-have),extra:sum(r=>ok(r)&&r.c.cat==='minor'),open:rows.filter(r=>!ok(r)),waiting:sum(r=>r.c&&r.st==='catalog')};
}
const placedCredits=()=>S.courses.filter(c=>termOf(c.term)&&counts(c)).reduce((a,c)=>a+c.credits,0);

function planSelect(mn,sl){
  const phs=S.courses.filter(isPh),terms=S.terms.filter(t=>t.status!=='done');
  const have=S.courses.filter(c=>counts(c)&&!isPh(c)&&!/\dxx/i.test(c.code)&&slotIds(sl).indexOf(c.id)<0).sort((a,b)=>termIdx(a.term)-termIdx(b.term));
  return`<select data-c="mplan" data-m="${mn.id}" data-s="${sl.id}" aria-label="Plan ${esc(slotName(sl))}"><option value="">Plan it…</option><option value="cat:">Add to my catalog, place it in the grid later</option>`+
   (phs.length?`<optgroup label="Take the place of a slot you already have">${phs.map(p=>`<option value="ph:${p.id}">${esc(p.code)} · ${esc(termNm(p))}</option>`).join('')}</optgroup>`:'')+
   `<optgroup label="Add on top, in a term">${terms.map(t=>`<option value="term:${t.id}">${esc(t.name)} · ${loadOf(t.id)} cr now</option>`).join('')}</optgroup>`+
   `<optgroup label="Use a course already in your plan">${have.map(c=>`<option value="use:${c.id}">${esc(c.code)} · ${esc(termNm(c))}</option>`).join('')}</optgroup></select>`;
}
function minorCard(mn){
  const t=minorStat(mn),pc=x=>Math.min(100,x/t.need*100);
  const free=S.courses.filter(c=>isFree(c)&&isPh(c)),freeCr=free.reduce((a,c)=>a+c.credits,0);
  const openCr=t.open.filter(r=>!r.c).reduce((a,r)=>a+r.cr,0),spill=Math.max(0,openCr+t.waiting-freeCr);
  const slots=[],seen={};t.rows.forEach(r=>{if(!seen[r.sl.id]){seen[r.sl.id]=[];slots.push(r.sl)}seen[r.sl.id].push(r)});
  const rows=slots.map(sl=>{
    const cells=seen[sl.id],n=cells.length,placed=cells.filter(r=>r.c);
    const chips=placed.map(r=>{const mg=mn.minGrade&&r.c.grade&&r.c.grade!=='CR'&&(pointsOf(r.c.grade)||0)<(pointsOf(mn.minGrade)||0);
      const cls=r.st==='done'?'good':r.st==='current'?'acc':'';
      return`<span class="row" style="gap:4px"><button class="pill ${cls}" data-a="open" data-id="${r.c.id}" style="cursor:pointer">${esc(r.c.code)} · ${r.st==='catalog'?'in catalog':esc(termNm(r.c))}</button>${mg?`<span class="pill warn">below ${esc(mn.minGrade)}</span>`:''}${r.linked?`<button class="btn ghost sm" data-a="munlink" data-m="${mn.id}" data-s="${sl.id}" data-c2="${r.c.id}" aria-label="Unlink ${esc(r.c.code)}">✕</button>`:''}</span>`}).join('');
    const openCells=cells.length-placed.length,ctl=openCells>0?`${(sl.opts||[]).length>1?`<select class="sel-pill" data-c="mpick" data-m="${mn.id}" data-s="${sl.id}" aria-label="Which course">${sl.opts.map((o,i)=>`<option value="${i}" ${(sl.pick||0)===i?'selected':''}>${esc(primary(o))}</option>`).join('')}</select>`:''}${planSelect(mn,sl)}`:'';
    return`<div style="padding:11px 0;border-bottom:1px solid var(--line)"><div style="min-width:0"><span class="code">${esc((sl.label&&(sl.opts||[]).length)?sl.opts.join(' or '):(placed.length?'':'pick any course'))}${n>1?` · ${placed.length} of ${n}`:''}</span><h3 style="margin-top:2px">${esc(slotName(sl))}</h3></div><div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${chips}${ctl}</div></div>`}).join('');
  const waitH=t.waiting?` ${t.waiting} credits are in your catalog waiting for a term, so drag them into the grid.`:'';
  const msg=t.open.length===0?'<b style="color:var(--good)">Every requirement has a course in your plan.</b>':
    `<b>${t.open.filter(r=>!r.c).reduce((a,r)=>a+r.cr,0)} credits</b> still need a course.${waitH} You have ${free.length?`${free.length} free elective slot${free.length>1?'s':''} (${freeCr} credits) that can take any course`:'no free elective slots left'}${spill>0?`, so about <b>${spill} credits</b> would sit on top of the ${S.settings.totalCredits} your degree needs. That is fine as long as no term goes over its credit limit.`:', so this fits inside your degree.'}`;
  return`<div class="card"><div class="row between" style="align-items:flex-start"><div><div class="row" style="gap:8px"><h3 style="font-size:19px">${esc(mn.name)}</h3>${mn.unit?`<span class="pill acc">${esc(mn.unit)}</span>`:''}${mn.minGrade?`<span class="pill">min ${esc(mn.minGrade)}</span>`:''}</div><div class="small muted" style="margin-top:4px">${t.have} of ${t.need} credits planned${t.extra?` · ${t.extra} on top of your degree`:''}</div></div><button class="btn ghost danger sm" data-a="delminor" data-id="${mn.id}" aria-label="Remove minor">✕</button></div>
  <div class="bar" style="margin:12px 0"><i class="d" style="width:${pc(t.done)}%"></i><i style="width:${pc(t.cur)}%"></i><i class="p" style="width:${pc(t.pl)}%"></i></div>
  <div class="small" style="margin-bottom:8px">${msg}</div>
  <div style="border:1px solid var(--line);border-radius:10px;background:var(--surface-2);padding:2px 14px;margin:12px 0">${rows}</div>
  ${mn.note?`<p class="small muted" style="margin:0 0 12px">${esc(mn.note)}</p>`:''}
  <div class="row"><input id="ms-${mn.id}" placeholder="Add a requirement, e.g. PHIL 300" style="flex:1;min-width:180px"><button class="btn" data-a="addslot" data-id="${mn.id}">Add</button></div></div>`;
}
function minorsSection(){
  const el=eligibleMinors();
  return`<div class="sec"><div class="row between" style="margin-bottom:14px"><h2 style="margin:0">Minors</h2></div>
  <div class="grid g2" style="align-items:start">${S.minors.map(minorCard).join('')||'<div class="empty">No minors tracked yet. Pick one below.</div>'}</div>
  <div class="card" style="margin-top:16px"><h3 style="margin-bottom:6px">Track a minor</h3><p class="small muted" style="margin:0 0 14px">These come from the Habib minors page. Ones you cannot take with your major are left out.</p>
   <div class="row"><select id="mn-cat" aria-label="Minor" style="min-width:260px">${el.map(m=>`<option value="${m.id}">${esc(m.name)} · ${m.unit} · ${m.credits} cr</option>`).join('')}</select><button class="btn primary" data-a="addcatminor">Track minor</button></div>
   <details style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line)"><summary class="small" style="cursor:pointer">Build your own minor</summary><div class="fgrid" style="margin-top:10px"><label class="f"><span>Name</span><input id="mn-name" placeholder="Economics"></label><label class="f"><span>School offering it</span><input id="mn-unit" placeholder="SAHSS"></label></div>
   <label class="f" style="margin-top:12px"><span>Requirements, one per line. Put “or” between alternatives. Add “x2” for two of the same.</span><textarea id="mn-reqs" rows="5" placeholder="ECO 101&#10;ECO 201 or ECO 202&#10;ECO elective, 300 level x2"></textarea></label>
   <div class="row" style="margin-top:12px"><label class="f" style="width:140px"><span>Credits each</span><input id="mn-cr" type="number" value="3"></label><button class="btn primary" data-a="addminor" style="align-self:flex-end">Add minor</button></div></details></div></div>`;
}
function parseReq(text,cr){
  const out=[];
  String(text||'').split(/\n/).forEach(raw=>{
    const lines=/\s+or\s+/i.test(raw)?[raw]:raw.split(',');
    lines.map(x=>x.trim()).filter(Boolean).forEach(line=>{
      let n=1;const m=line.match(/\s+x\s*(\d)$/i);if(m){n=+m[1];line=line.slice(0,m.index).trim()}
      const alts=line.split(/\s+or\s+|;|\|/i).map(x=>x.trim()).filter(Boolean),coded=alts.filter(a=>aliases(a).length);
      for(let i=0;i<n;i++)out.push(coded.length?{id:uid(),label:'',opts:alts,cr,pick:0,ids:[]}:{id:uid(),label:line,opts:[],cr,pick:0,ids:[]});
    });
  });
  return out;
}
function unlinkCourse(sl,id){
  sl.ids=slotIds(sl).filter(x=>x!==id);delete sl.courseId;
  const c=getC(id);if(c&&c.was){c.code=c.was.code;c.title=c.was.title;c.credits=c.was.credits;c.notes=String(c.notes||'').replace(/\s*Counts toward the .* minor\./,'').trim();delete c.was}
}
Object.assign(ACT2,{
  addcatminor(){const m=MINOR_CATALOG.find(x=>x.id===val('mn-cat'));if(!m)return;if(S.minors.some(x=>x.cid===m.id))return toast('That minor is already tracked');
    S.minors.push({id:uid(),cid:m.id,name:m.name,unit:m.unit,credits:m.credits,minGrade:m.minGrade||'',note:m.note||'',slots:m.slots.map(s=>({id:uid(),label:s.label,opts:s.opts.slice(),cr:s.cr,n:s.n||1,pick:0,ids:[]}))});ensureMinorCat();persist();render()},
  addminor(){const n=val('mn-name');if(!n)return toast('Give the minor a name first');const cr=parseInt(val('mn-cr'))||3,sl=parseReq(val('mn-reqs'),cr);
    S.minors.push({id:uid(),name:n,unit:val('mn-unit'),credits:0,minGrade:'',note:'',slots:sl});ensureMinorCat();persist();render()},
  delminor(e,d){mut(()=>{S.minors.forEach(m=>m.id===d.id&&(m.slots||[]).forEach(s=>slotIds(s).slice().forEach(id=>unlinkCourse(s,id))));S.minors=S.minors.filter(x=>x.id!==d.id)})},
  munlink(e,d){const mn=S.minors.find(x=>x.id===d.m),sl=mn&&mn.slots.find(x=>x.id===d.s);if(sl){unlinkCourse(sl,d.c2);persist();render()}},
  addslot(e,d){const mn=S.minors.find(x=>x.id===d.id),t=val('ms-'+d.id);if(!mn||!t)return;mn.slots=(mn.slots||[]).concat(parseReq(t,3));persist();render()},
});
Object.assign(CHG2,{
  mpick(e,d,v){const mn=S.minors.find(x=>x.id===d.m),sl=mn&&mn.slots.find(x=>x.id===d.s);if(sl)sl.pick=+v||0},
  mplan(e,d,v){
    const mn=S.minors.find(x=>x.id===d.m),sl=mn&&mn.slots.find(x=>x.id===d.s);if(!sl||!v)return;
    const i=v.indexOf(':'),k=v.slice(0,i),id=v.slice(i+1),o=(sl.opts||[]).length?sl.opts[Math.min(sl.pick||0,sl.opts.length-1)]:'';
    const code=o?primary(o):String(sl.label||'Course').split(',')[0],title=sl.label||code,note='Counts toward the '+mn.name+' minor.';
    const link=cid=>{sl.ids=slotIds(sl).concat(cid);delete sl.courseId};
    const mkc=term=>{const c={id:uid(),code,title,credits:+sl.cr||3,term:term||null,cat:'minor',prereqs:[],coreqs:[],grade:null,assess:[],notes:note,instructor:''};S.courses.push(c);link(c.id);ensureMinorCat()};
    if(k==='use')link(id);
    else if(k==='ph'){const p=getC(id);if(!p)return;p.was={code:p.code,title:p.title,credits:p.credits};p.code=code;p.title=title;p.credits=+sl.cr||p.credits;p.notes=((p.notes||'')+' '+note).trim();link(p.id)}
    else if(k==='term')mkc(id);
    else if(k==='cat')mkc(null);
  },
});
