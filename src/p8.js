
/* ---------- this term: goals and what each course needs ---------- */
function termPlan(){
  const t=S.terms.find(x=>x.status==='current');if(!t||t.cr)return null;
  const cs=S.courses.filter(c=>c.term===t.id);if(!cs.length)return null;
  const cum=cumulative(),o=outlook(),maxP=o.maxP,tg=S.settings.targetGpa;
  const sc=S.settings.scale.slice().sort((a,b)=>a.p-b.p||a.min-b.min);
  const rows=cs.map(c=>{const st=standing(c),has=st.W>0;
    const fl=has?(pointsOf(letterFor(st.floor))||0):0,ce=has?(pointsOf(letterFor(st.ceil)))||0:maxP;
    return{c,st,has,fl,ce,ceL:has?letterFor(st.ceil):null};});
  const crT=rows.reduce((a,r)=>a+r.c.credits,0);
  const need=cum.cr>0?(tg*(cum.cr+crT)-cum.pts)/crT:tg;
  const T=need*crT,lo=rows.reduce((a,r)=>a+r.c.credits*r.fl,0),hi=rows.reduce((a,r)=>a+r.c.credits*r.ce,0);
  const state=T<=lo+1e-9?'secured':T>hi+1e-9?'out':'plan';
  let L=0;
  if(state==='plan'){let a=0,b=maxP;for(let i=0;i<40;i++){const m=(a+b)/2,f=rows.reduce((s,r)=>s+r.c.credits*Math.min(r.ce,Math.max(r.fl,m)),0);if(f<T)a=m;else b=m}L=b}
  rows.forEach(r=>{
    r.aimP=state==='plan'?Math.min(r.ce,Math.max(r.fl,L)):state==='secured'?r.fl:r.ce;
    const aim=sc.find(x=>x.p>=r.aimP-1e-9&&x.p>0)||sc[sc.length-1];r.aim=aim.l;r.aimMin=aim.min;
    const g=r.c.goal&&sc.find(x=>x.l===r.c.goal);r.goal=g?g.l:'';r.goalMin=g?g.min:null;
    const tgtMin=g?g.min:aim.min;r.need=r.has?needed(r.c,tgtMin):null;
    r.pts=g?g.p:r.aimP;
  });
  const sum=rows.reduce((a,r)=>a+r.c.credits*r.pts,0),proj=sum/crT,after=(cum.pts+sum)/(cum.cr+crT);
  return{t,rows,need,state,crT,proj,after,cum,maxP,tg,best:(hi/crT)};
}
function termPlanSection(){
  const p=termPlan();if(!p)return'';
  const scPass=S.settings.scale.filter(x=>x.p>0);
  const head1=p.state==='secured'?`Your target of ${fmt(p.tg)} is already safe this term, even if the unmarked work goes badly.`:
    p.state==='out'?`Reaching ${fmt(p.tg)} overall would take an average of ${fmt(p.need)} this term, and even your best case is ${fmt(p.best)}. Aim for the grades below and your overall target moves out to later terms.`:
    `To be on track for ${fmt(p.tg)} overall you need about <b>${fmt(p.need)}</b> across this term. The grades under “Aim for” are the lightest way to get there, given how much of each course is left to mark.`;
  const rowsH=p.rows.map(r=>{
    const lim=r.has?`max <b>${esc(r.ceL)}</b>`:'no breakdown';
    const nd=r.need==null?'–':r.need<=0?'<span style="color:var(--good)">secured</span>':r.need>100?'<span style="color:var(--bad)">out of reach</span>':`<b>${fmt(r.need,0)}%</b> on ${fmt(r.st.rem,0)}%`;
    const goalSel=`<select class="sel-pill ${r.goal?'acc':''}" data-c="goal" data-id="${r.c.id}" aria-label="Goal for ${esc(r.c.code)}"><option value="">Auto (${esc(r.aim)})</option>${scPass.map(x=>`<option value="${esc(x.l)}" ${r.goal===x.l?'selected':''}>${esc(x.l)}</option>`).join('')}</select>`;
    return`<tr><td style="min-width:170px"><a href="#" data-a="open" data-id="${r.c.id}" style="text-decoration:none;color:inherit"><b>${esc(r.c.code)}</b> <span class="meta-txt">${r.c.credits} cr${r.st.pct!=null?' · '+fmt(r.st.pct,0)+'%':''}</span><div class="small muted">${esc(r.c.title)}</div></a></td><td class="small muted" style="white-space:nowrap">${lim}</td><td>${lpill(r.aim)}</td><td>${goalSel}</td><td class="small r" style="white-space:nowrap">${nd}</td></tr>`}).join('');
  return`<div class="sec" style="margin-top:0"><h2>${esc(p.t.name)}: what each course needs</h2><div class="card"><p class="small" style="margin:0 0 10px">${head1}</p><div class="scroll"><table class="t"><thead><tr><th>Course</th><th>Reach</th><th>Aim</th><th>Your goal</th><th class="r">Needed</th></tr></thead><tbody>${rowsH}</tbody></table></div>
  <div class="row between" style="padding-top:12px;border-top:1px solid var(--line);margin-top:6px;flex-wrap:wrap;gap:8px"><span class="small muted">If you land your goals (or the aim where set to Auto)</span><div class="row" style="gap:6px"><span class="pill">Term ${fmt(p.proj)}</span><span class="pill acc">Overall ${fmt(p.after)}</span></div></div></div></div>`;
}

/* ---------- what if, one term at a time ---------- */
function whatIf(cum){
  const over=U.whatif,terms=S.terms.filter(t=>t.status!=='done'&&S.courses.some(c=>c.term===t.id));
  if(!terms.length)return`<div class="empty">Schedule current or planned courses to try grades on them.</div>`;
  let sel=U.wiTerm;if(sel!=='all'&&!terms.some(t=>t.id===sel))sel=(terms.find(t=>t.status==='current')||terms[0]).id;
  const shown=sel==='all'?terms:terms.filter(t=>t.id===sel),lab=S.courses.filter(c=>terms.some(t=>t.id===c.term));
  const pr=gpaOf(doneCourses().concat(lab),true,over);
  const quickGrades=S.settings.scale.filter(x=>x.p>=3).slice(0,4);
  const opts=v=>['<option value="">Auto</option>'].concat(S.settings.scale.map(x=>`<option ${v===x.l?'selected':''}>${esc(x.l)}</option>`)).join('');
  const row=c=>{
    const run=c.grade||standing(c).letter,cur=over[c.id]||'';
    const qp=quickGrades.map(x=>`<button type="button" class="opt-pill ${cur===x.l?'on '+gradeCls(x.l):''}" data-a="wiset" data-id="${c.id}" data-v="${esc(x.l)}">${esc(x.l)}</button>`).join('');
    return`<div class="li" style="flex-wrap:wrap"><div style="min-width:0;flex:1 1 180px"><span class="code">${esc(c.code)} · ${c.credits} cr${status(c)==='current'&&run?' · now '+esc(run):''}</span><h3>${esc(c.title)}</h3></div><div class="row" style="gap:6px;flex-wrap:nowrap;justify-content:flex-end"><div class="opt-pills compact">${qp}</div><select class="sel-pill ${cur?gradeCls(cur):''}" data-c="wi" data-id="${c.id}" aria-label="Grade for ${esc(c.code)}">${opts(cur)}</select></div></div>`;
  };
  const strip=`<div class="tabs" style="margin-bottom:14px">${terms.map(t=>`<a href="#" data-a="witerm" data-v="${t.id}" ${sel===t.id?'aria-current="page"':''}>${esc(t.name)}</a>`).join('')}<a href="#" data-a="witerm" data-v="all" ${sel==='all'?'aria-current="page"':''}>All terms</a></div>`;
  const block=t=>{const cs=S.courses.filter(c=>c.term===t.id),tg=gpaOf(cs,t.status==='current',over);
    return`<div><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">${esc(t.name)}</h3><span class="meta-txt">term GPA <b>${tg.gpa==null?'–':fmt(tg.gpa)}</b></span></div><div class="card" style="padding:4px 16px">${cs.map(row).join('')}</div></div>`};
  const single=shown.length===1?gpaOf(S.courses.filter(c=>c.term===shown[0].id),shown[0].status==='current',over):null;
  const delta=(cum.gpa!=null&&pr.gpa!=null)?pr.gpa-cum.gpa:null;
  const setAllBar=`<div class="row" style="gap:6px"><select class="sel-pill" data-c="wiall" aria-label="Set the whole term to"><option value="">Set all to…</option>${S.settings.scale.map(x=>`<option>${esc(x.l)}</option>`).join('')}</select><button type="button" class="btn ghost sm" data-a="wireset">Reset</button></div>`;
  return`<div class="row between" style="margin-bottom:10px;gap:10px;flex-wrap:wrap">${strip}${setAllBar}</div>
  <div class="grid g2" style="align-items:start"><div style="display:flex;flex-direction:column;gap:16px">${shown.map(block).join('')}</div>
  <div class="card" style="position:sticky;top:20px"><div class="row between"><div class="lbl">Projected cumulative</div>${delta!=null?`<span class="pill ${delta>=0?'good':'bad'}">${delta>=0?'+':''}${fmt(delta)}</span>`:''}</div><div class="num" style="margin:12px 0 8px">${fmt(pr.gpa)}</div><div class="small muted">${pr.cr} credits counted.${single?` This term alone: <b class="mono">${single.gpa==null?'–':fmt(single.gpa)}</b>.`:''} Unset courses use their running grade.</div></div></div>`;
}
Object.assign(ACT2,{witerm(e,d){U.wiTerm=d.v;render()}});
Object.assign(CHG2,{goal(e,d,v){const c=getC(d.id);if(c)c.goal=v||null}});

/* ---------- enrollment ---------- */
const DAYN=['M','T','W','Th','F','Sa','Su'],DAYL={M:'Mon',T:'Tue',W:'Wed',Th:'Thu',F:'Fri',Sa:'Sat',Su:'Sun'};
const hm=m=>{const h=Math.floor(m/60),mm=m%60;return(h%12||12)+':'+String(mm).padStart(2,'0')+(h<12?'a':'p')};
function toMin(v){
  if(v==null||v==='')return null;
  if(v instanceof Date)return v.getHours()*60+v.getMinutes();
  if(typeof v==='number')return Math.round((v%1)*1440);
  const m=String(v).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);if(!m)return null;
  let h=+m[1];if(m[3]){const p=m[3].toLowerCase();if(p==='pm'&&h<12)h+=12;if(p==='am'&&h===12)h=0}return h*60+(+m[2]);
}

/* flexible column index: tries exact match first, then alias map */
function colIx(hdr){
  const map={};hdr.forEach((h,i)=>map[h]=i);
  function ix(name){
    if(map[name]!=null)return map[name];
    const aliases={
      'semester':['term'],'term':['semester'],
      'day':['day(s)','days'],'day(s)':['day','days'],
      'tot enrl':['total enrolled','enrollment','enrl tot'],
      'offering program':['program','prog'],
      'class nbr':['class number','classnbr'],
      'course title':['title','course_title'],
    };
    const al=aliases[name]||[];
    for(const a of al)if(map[a]!=null)return map[a];
    /* partial match as last resort — both sides must be at least 3 chars */
    if(name.length>=3)for(const h of hdr)if(h.length>=3&&(h.includes(name)||name.includes(h)))return map[h];
    return -1;
  }
  return ix;
}

function parseOffers(rows){
  const hdr=rows[0].map(x=>String(x||'').trim().toLowerCase()),ix=colIx(hdr);
  const I={sem:ix('semester'),sub:ix('subject'),cat:ix('catalog'),title:ix('course title'),sec:ix('section'),tot:ix('tot enrl'),nbr:ix('class nbr'),day:ix('day'),ins:ix('instructor'),room:ix('room'),st:ix('start time'),en:ix('end time'),prog:ix('offering program')};
  if(I.sub<0||I.cat<0||I.title<0||I.nbr<0)throw new Error('columns');
  const map={};let term='';
  rows.slice(1).forEach(r=>{
    if(!r||r[I.nbr]==null||r[I.nbr]==='')return;
    const k=String(r[I.nbr]);term=term||String(r[I.sem>=0?I.sem:0]||'');
    const s=map[k]||(map[k]={k,code:(String(r[I.sub]||'').trim()+' '+String(r[I.cat]||'').trim()).trim(),title:String(r[I.title]||'').trim(),sec:String(r[I.sec]||'').trim(),tot:I.tot>=0?(+r[I.tot]||0):0,ins:String(r[I.ins>=0?I.ins:0]||'').trim(),prog:I.prog>=0?String(r[I.prog]||'').trim():'',meets:[]});
    const dayCol=I.day>=0?I.day:I.st;
    const days=String(r[I.day>=0?I.day:0]||'').match(/Th|Sa|Su|M|T|W|F/g)||[],a=toMin(r[I.st>=0?I.st:0]),b=toMin(r[I.en>=0?I.en:0]);
    if(a!=null&&b!=null)days.forEach(d=>{if(!s.meets.some(m=>m.d===d&&m.s===a&&m.e===b))s.meets.push({d,s:a,e:b,r:String(r[I.room>=0?I.room:0]||'')})});
  });
  const list=Object.values(map);if(!list.length)throw new Error('empty');
  return{term,at:todayStr(),sections:list,picks:{}};
}
const parseCsvRows=text=>String(text||'').split(/\r?\n/).filter(Boolean).map(l=>l.match(/(\"([^\"]|\"\")*\"|[^,]*)(,|$)/g).map(x=>x.replace(/,$/,'').replace(/^\"|\"$/g,'').replace(/\"\"/g,'"')));
async function onOffers(e){
  const f=(e.target.files||[])[0];if(!f)return;U.enrMsg='';
  try{
    let rows;
    if(/\.csv$/i.test(f.name)){rows=parseCsvRows(await f.text())}
    else{if(!window.XLSX)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      const wb=window.XLSX.read(await f.arrayBuffer(),{type:'array'});rows=window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:''})}
    const keep=(S.enroll&&S.enroll.picks)||{};const o=parseOffers(rows);
    o.picks=preserveEnrollPicks(keep,o.sections);
    S.enroll=o;persist();
  }catch(err){U.enrMsg=err&&(err.message==='columns'||err.message==='empty')?'That file does not look like a schedule of classes. It needs the columns Subject, Catalog, Course Title, Class Nbr, Day, Start Time and End Time.':'The file could not be read ('+(err&&err.message||'unknown')+')';}
  render();
}
const COMP_NAMES={L:'Lecture',S:'Seminar',R:'Recitation',T:'Lab / Tutorial',D:'Studio',C:'Capstone'};
const COMP_ORD=['L','D','S','R','T','C'];
const secPrefix=s=>{const m=String((s&&s.sec)||'').trim().match(/^([A-Za-z]+)/);return m?m[1].toUpperCase():'SEC'};
const compLabel=p=>COMP_NAMES[p]||('Component '+p);
function secComponents(sections){
  const map={};
  (sections||[]).forEach(s=>{const p=secPrefix(s);(map[p]=map[p]||[]).push(s)});
  return Object.keys(map).sort((a,b)=>{
    const ia=COMP_ORD.indexOf(a),ib=COMP_ORD.indexOf(b);
    return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b);
  }).map(p=>({comp:p,label:compLabel(p),sections:map[p]}));
}
function getCoursePickMap(courseId){
  const raw=(S.enroll&&S.enroll.picks||{})[courseId];
  if(!raw)return{};
  if(typeof raw==='string'){
    const sec=((S.enroll&&S.enroll.sections)||[]).find(s=>s.k===raw);
    return sec?{[secPrefix(sec)]:raw}:{SEC:raw};
  }
  return typeof raw==='object'?Object.assign({},raw):{};
}
function setCoursePick(courseId,comp,secKey){
  if(!S.enroll)return;
  S.enroll.picks=S.enroll.picks||{};
  const c=getC(courseId);
  const comps=c?secComponents(offered(c)):[];
  if(comps.length<=1){
    if(secKey)S.enroll.picks[courseId]=secKey;
    else delete S.enroll.picks[courseId];
    return;
  }
  const map=getCoursePickMap(courseId);
  if(secKey){
    map[comp]=secKey;
    /* Auto-select any required sibling component that has only 1 option (e.g. Hikma's single common Lecture L1) */
    comps.forEach(g=>{if(g.comp!==comp&&!map[g.comp]&&g.sections.length===1)map[g.comp]=g.sections[0].k});
  }else{
    delete map[comp];
  }
  if(Object.keys(map).length)S.enroll.picks[courseId]=map;
  else delete S.enroll.picks[courseId];
}
function preserveEnrollPicks(keep,sections){
  const out={},has=k=>sections.some(s=>s.k===k);
  Object.keys(keep||{}).forEach(id=>{
    const v=keep[id];
    if(typeof v==='string'){if(has(v))out[id]=v}
    else if(v&&typeof v==='object'){
      const m={};Object.keys(v).forEach(p=>{if(has(v[p]))m[p]=v[p]});
      if(Object.keys(m).length)out[id]=m;
    }
  });
  return out;
}
const offered=c=>{const mine=aliases(c.code);const t=nn(c.title);return((S.enroll&&S.enroll.sections)||[]).filter(s=>aliases(s.code).some(a=>mine.indexOf(a)>=0)||(t&&nn(s.title)===t))};
function cleanInsList(raw){
  const seen=new Set(),out=[];
  String(raw||'').split(';').forEach(x=>{
    const s=x.replace(/,\s*/g,', ').replace(/\s+/g,' ').trim();
    if(!s)return;
    const k=s.toLowerCase();if(seen.has(k))return;seen.add(k);out.push(s);
  });
  return out;
}
function fmtIns(raw,maxShow){
  const list=cleanInsList(raw);
  if(!list.length)return'TBA';
  const lim=maxShow||2;
  if(list.length<=lim)return list.join('; ');
  return list[0]+' +'+(list.length-1)+' others';
}
function fmtEnrollTerm(raw){
  const s=String(raw||'').trim();if(!s)return'Schedule';
  const m=s.match(/^(\d{2})([123])\d$/);
  if(m){const yr=2000+parseInt(m[1],10),sea=m[2]==='1'?'Spring':m[2]==='2'?'Summer':'Fall';return`${sea} ${yr}`}
  return s;
}
const secLabel=s=>`${s.sec} · ${fmtIns(s.ins,1)} · ${s.meets.length?groupMeets(s.meets):'time TBA'}${s.tot?' · '+s.tot+' enrolled':''}`;
function groupMeets(ms){const g={};ms.forEach(m=>{const k=m.s+'-'+m.e;(g[k]=g[k]||{s:m.s,e:m.e,d:[]}).d.push(m.d)});return Object.values(g).map(x=>x.d.sort((a,b)=>DAYN.indexOf(a)-DAYN.indexOf(b)).join('')+' '+hm(x.s)+'–'+hm(x.e)).join(', ')}
function enrollTerm(){const ts=S.terms.filter(t=>t.status!=='done'),ci=S.terms.findIndex(t=>t.status==='current');
  return S.terms.find(t=>t.id===U.enrTerm)||S.terms.find((t,i)=>t.status==='planned'&&i>ci)||ts[0]||S.terms[0]}
function picked(){
  const E=S.enroll||{},out=[],secs=E.sections||[];
  Object.keys(E.picks||{}).forEach(id=>{
    const c=getC(id);if(!c)return;
    const raw=E.picks[id];
    const keys=typeof raw==='string'?[raw]:(raw&&typeof raw==='object'?Object.values(raw):[]);
    keys.forEach(k=>{const s=secs.find(x=>x.k===k);if(s)out.push({c,s,comp:secPrefix(s)})});
  });
  return out;
}
function clashes(list){
  const out=[];
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)list[i].s.meets.forEach(a=>list[j].s.meets.forEach(b=>{if(a.d===b.d&&a.s<b.e&&b.s<a.e)out.push({a:list[i],b:list[j],d:a.d,at:Math.max(a.s,b.s)})}));
  return out;
}
function liveScheduleList(){
  const sch=S.schedule;
  if(!sch||!Array.isArray(sch.items)||!sch.items.length)return[];
  return sch.items.map((it,i)=>({c:{id:'live-'+i,code:it.code||'',title:it.title||''},s:{k:'live-'+i,sec:it.sec||'',meets:it.meets||[]}}));
}
function pickedTermInfo(){
  const pk=picked();if(!pk.length)return null;
  const tid=pk[0].c&&pk[0].c.term;
  const t=tid?termOf(tid):enrollTerm();
  return t||null;
}
function weekGrid(list,bad){
  const ms=[];list.forEach(x=>x.s.meets.forEach(m=>ms.push(m)));if(!ms.length)return'';
  const a=Math.floor(Math.min.apply(null,ms.map(m=>m.s))/60),b=Math.ceil(Math.max.apply(null,ms.map(m=>m.e))/60),H=46,days=DAYN.filter(d=>d!=='Su'&&(d!=='Sa'||ms.some(m=>m.d==='Sa')));
  const badIds={};bad.forEach(x=>{badIds[x.a.c.id+':'+x.a.s.k]=1;badIds[x.b.c.id+':'+x.b.s.k]=1});
  const hours=[];for(let h=a;h<b;h++)hours.push(h);
  return`<div class="wk" style="grid-template-columns:44px repeat(${days.length},minmax(0,1fr))"><div></div>${days.map(d=>`<div class="wkh">${DAYL[d]}</div>`).join('')}<div style="position:relative;height:${(b-a)*H}px">${hours.map(h=>`<span class="wkt" style="top:${(h-a)*H}px">${hm(h*60)}</span>`).join('')}</div>${days.map(d=>`<div class="wkc" style="height:${(b-a)*H}px">${hours.map(h=>`<i style="top:${(h-a)*H}px"></i>`).join('')}${list.map(x=>x.s.meets.filter(m=>m.d===d).map(m=>`<div class="wkb${badIds[x.c.id+':'+x.s.k]?' bad':''}" style="top:${(m.s/60-a)*H}px;height:${Math.max(18,(m.e-m.s)/60*H-2)}px"><b>${esc(x.c.code)}</b> ${esc(x.s.sec)}<br><span>${hm(m.s)} ${esc(m.r)}</span></div>`).join('')).join('')}</div>`).join('')}</div>`;
}

/* ---------- seat reservations (hardcoded from Spring 2027 PDF) ---------- */
const RESERVES={
  '1191':{label:'EE 213 L1',res:[{who:'EE Freshman',seats:21}],cap:25},
  '1192':{label:'EE 213 L2',res:[{who:'EE Freshman',seats:21}],cap:25},
  '1198':{label:'EE/CE 211 L1',res:[{who:'EE Sophomore',seats:21}],cap:25},
  '1199':{label:'EE/CE 211 L2',res:[{who:'EE Sophomore',seats:20}],cap:25},
  '1200':{label:'EE/CE 211L T1',res:[{who:'EE Sophomore',seats:16}],cap:25},
  '1201':{label:'EE/CE 211L T2',res:[{who:'EE Sophomore',seats:25}],cap:25},
  '1208':{label:'EE/CE 354 L1',res:[{who:'CE Sophomore',seats:15},{who:'EE Sophomore',seats:10}],cap:25},
  '1209':{label:'EE/CE 354 L2',res:[{who:'CE Sophomore',seats:12},{who:'EE Sophomore',seats:10}],cap:25},
  '1210':{label:'EE/CE 354 L3',res:[{who:'CE Sophomore',seats:14},{who:'EE Sophomore',seats:10}],cap:25},
  '1211':{label:'EE/CE 354 L4',res:[{who:'CE Sophomore',seats:12},{who:'EE Sophomore',seats:11}],cap:25},
  '1212':{label:'EE/CE 361 L1',res:[{who:'EE Sophomore',seats:14}],cap:25},
  '1213':{label:'EE/CE 361 L2',res:[{who:'EE Sophomore',seats:13}],cap:25},
  '1214':{label:'EE/CE 361 L3',res:[{who:'EE Sophomore',seats:14}],cap:25},
  '1215':{label:'EE/CE 361L T1',res:[{who:'EE Sophomore',seats:25}],cap:25},
  '1216':{label:'EE/CE 361L T2',res:[{who:'EE Junior',seats:10}],cap:25},
  '1217':{label:'EE/CE 361L T3',res:[{who:'EE Sophomore',seats:16},{who:'EE Junior',seats:9}],cap:25},
  '1219':{label:'EE/CE 376 L1',res:[{who:'CE Sophomore',seats:14},{who:'EE Sophomore',seats:10}],cap:25},
  '1220':{label:'EE/CE 376 L2',res:[{who:'CE Sophomore',seats:14},{who:'EE Sophomore',seats:10}],cap:25},
  '1221':{label:'EE/CE 376 L3',res:[{who:'CE Sophomore',seats:12},{who:'EE Sophomore',seats:10}],cap:25},
  '1222':{label:'EE/CE 376 L4',res:[{who:'CE Sophomore',seats:13},{who:'EE Sophomore',seats:10}],cap:25},
  '1223':{label:'EE/CE 376L T1',res:[{who:'EE Sophomore',seats:25}],cap:25},
  '1224':{label:'EE/CE 376L T2',res:[{who:'CE Sophomore',seats:19}],cap:25},
  '1225':{label:'EE/CE 376L T3',res:[{who:'EE Sophomore',seats:16},{who:'CE Sophomore',seats:9}],cap:25},
  '1226':{label:'EE/CE 376L T4',res:[{who:'CE Sophomore',seats:25}],cap:25},
  '1077':{label:'CORE 106 L1',res:[{who:'CE Sophomore',seats:14},{who:'EE Sophomore',seats:10}],cap:25},
  '1078':{label:'CORE 106 L2',res:[{who:'CE Sophomore',seats:14},{who:'EE Sophomore',seats:10}],cap:25},
  '1079':{label:'CORE 106 L3',res:[{who:'CE Sophomore',seats:13},{who:'EE Sophomore',seats:10}],cap:25},
  '1080':{label:'CORE 106 L4',res:[{who:'CE Sophomore',seats:12},{who:'EE Sophomore',seats:11}],cap:25},
};
function resInfo(section){
  const r=RESERVES[section.k];if(!r)return null;
  const ee=r.res.filter(x=>/^EE/i.test(x.who));
  const mySeats=ee.reduce((a,x)=>a+x.seats,0);
  return{res:r.res,cap:r.cap,mySeats,isGood:mySeats>0};
}
function resBadge(section){
  const ri=resInfo(section);if(!ri)return'';
  const ee=ri.res.filter(x=>/^EE/i.test(x.who));
  if(ee.length)return`<span class="pill good" title="Phase I: ${ee.map(x=>x.who+': '+x.seats).join(', ')}" style="cursor:help">EE: ${ri.mySeats} seats</span>`;
  const other=ri.res;
  return other.length?`<span class="pill warn" title="${other.map(x=>x.who+': '+x.seats).join(', ')}" style="cursor:help">reserved for others</span>`:'';
}

/* ---------- auto-schedule generator ---------- */
function autoSchedule(courseList,sections){
  /* courseList: [{c,options:[section,...]},...] */
  const n=courseList.length;if(!n)return[];
  const results=[],cur=[];
  function clash2(sa,sb){
    for(const a of sa.meets)for(const b of sb.meets)if(a.d===b.d&&a.s<b.e&&b.s<a.e)return true;
    return false;
  }
  function clashWith(sec){
    for(let i=0;i<cur.length;i++)if(clash2(cur[i],sec))return true;
    return false;
  }
  function solve(i){
    if(results.length>=50)return; /* cap at 50 to avoid slowness */
    if(i===n){results.push(cur.slice());return}
    const opts=courseList[i].options;
    for(let j=0;j<opts.length;j++){
      if(!clashWith(opts[j])){cur.push(opts[j]);solve(i+1);cur.pop()}
    }
  }
  solve(0);
  return results;
}

function scoreSchedule(combo,prefs){
  let score=0;
  const pref=prefs||{};
  combo.forEach(sec=>{
    /* time preference: prefer mornings (before 2pm), penalise late (after 5pm) */
    sec.meets.forEach(m=>{
      if(pref.time==='morning'){score+=m.s<14*60?2:m.s<17*60?0:-2}
      else if(pref.time==='afternoon'){score+=m.s>=12*60&&m.s<17*60?2:0}
      else if(pref.time==='evening'){score+=m.s>=16*60?2:0}
    });
    /* instructor preference */
    if(pref.prefInstructor&&sec.ins){
      const prI=pref.prefInstructor.toLowerCase();
      if(sec.ins.toLowerCase().includes(prI))score+=5;
    }
    if(pref.avoidInstructor&&sec.ins){
      const avI=pref.avoidInstructor.toLowerCase();
      if(sec.ins.toLowerCase().includes(avI))score-=5;
    }
    /* EE reserved seats bonus */
    const ri=resInfo(sec);
    if(ri&&ri.mySeats>0)score+=3;
    if(ri&&ri.mySeats>=15)score+=2;
    /* prefer fewer gaps in the day */
  });
  return score;
}

function enrollSlots(cs){
  const slots=[];
  cs.forEach(c=>{
    const comps=secComponents(offered(c));
    comps.forEach(g=>{
      const opts=g.sections.filter(s=>s.meets.length);
      if(opts.length)slots.push({c,comp:g.comp,label:g.label,multi:comps.length>1,options:opts});
    });
  });
  return slots;
}
function findSchedules(){
  const E=S.enroll;if(!E)return[];
  const t=enrollTerm();if(!t)return[];
  const cs=S.courses.filter(c=>c.term===t.id);
  const courseList=enrollSlots(cs);
  if(!courseList.length)return[];
  const combos=autoSchedule(courseList);
  const prefs=U.enrPrefs||{};
  const scored=combos.map(combo=>{
    const items=combo.map((sec,i)=>({c:courseList[i].c,comp:courseList[i].comp,s:sec}));
    const sc=scoreSchedule(combo,prefs);
    return{items,score:sc};
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0,10);
}

function applySchedule(idx){
  const scheds=findSchedules();
  if(!scheds[idx])return;
  const E=S.enroll;
  E.picks={};
  scheds[idx].items.forEach(x=>{setCoursePick(x.c.id,x.comp||secPrefix(x.s),x.s.k)});
  persist();render();
}

/* ---------- shopping cart / class numbers ---------- */
function cartSection(){
  const pk=picked();if(!pk.length)return'';
  const nums=pk.map(x=>x.s.k);
  const cartHTML=pk.map(x=>{
    const rb=resBadge(x.s);
    const fullIns=cleanInsList(x.s.ins).join('; ');
    return`<div class="kv"><span title="${esc(fullIns)}"><b>${esc(x.c.code)}</b> ${esc(x.s.sec)} · ${esc(fmtIns(x.s.ins,1))}</span><span class="row" style="gap:8px;flex:none;justify-content:flex-end">${rb}<span class="mono" style="min-width:44px;text-align:right;font-weight:600">${esc(x.s.k)}</span></span></div>`;
  }).join('');
  return`<div class="sec"><h2>Shopping cart</h2><div class="card" style="padding:4px 16px">${cartHTML}
  <div class="row between" style="padding:10px 0;border-top:1px solid var(--line);margin-top:6px"><div><div class="lbl">Class numbers for PSCS</div><div class="mono" style="margin-top:4px;user-select:all">${nums.join(', ')}</div></div><button class="btn" data-a="copycart" style="flex:none">Copy</button></div></div></div>`;
}

/* ---------- backup sections ---------- */
function backupSection(){
  const pk=picked();if(!pk.length)return'';
  const E=S.enroll;if(!E)return'';
  const rows=pk.map(x=>{
    const comp=secPrefix(x.s);
    const all=offered(x.c).filter(s=>s.k!==x.s.k&&secPrefix(s)===comp&&s.meets.length);
    if(!all.length)return'';
    const others=pk.filter(p=>!(p.c.id===x.c.id&&p.s.k===x.s.k));
    const alts=all.map(s=>{
      const ok=!others.some(o=>o.s.meets.some(a=>s.meets.some(b=>a.d===b.d&&a.s<b.e&&b.s<a.e)));
      const rb=resBadge(s);
      return`<div class="small" style="padding:3px 0"><span class="${ok?'':'muted'}" style="${ok?'':'text-decoration:line-through'}">${esc(s.sec)} · ${esc(fmtIns(s.ins,1))} · ${groupMeets(s.meets)} · #${esc(s.k)} ${rb}</span> ${ok?'<span class="pill good">fits</span>':'<span class="pill warn">clashes</span>'}</div>`;
    }).join('');
    return`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(x.c.code)}</b> <span class="muted small">if ${esc(x.s.sec)} is full:</span>${alts}</div>`;
  }).filter(Boolean).join('');
  if(!rows)return'';
  return`<div>${rows}</div><p class="small muted" style="margin:10px 0 0">Sections marked “fits” do not clash with your rest of week.</p>`;
}

/* ---------- auto-schedule UI ---------- */
function autoScheduleSection(){
  const E=S.enroll;if(!E)return'';
  const t=enrollTerm();if(!t)return'';
  const cs=S.courses.filter(c=>c.term===t.id);
  const courseList=enrollSlots(cs);
  if(courseList.length<2)return'';
  const uniqueCourses=new Set(courseList.map(x=>x.c.id)).size;

  const prefs=U.enrPrefs||{};
  const timeSeg=[['','Any'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening']].map(([k,l])=>`<button type="button" class="${(prefs.time||'')===k?'on':''}" data-a="enrtime" data-v="${k}">${l}</button>`).join('');
  const prefsUI=`<div style="margin-bottom:12px">
  <div class="f" style="margin-bottom:10px"><span class="lbl">Preferred times</span><div class="seg">${timeSeg}</div></div>
  <div class="fgrid" style="gap:10px">
    <label class="f"><span>Prefer instructor</span><input data-c="enrpref" data-f="prefInstructor" value="${esc(prefs.prefInstructor||'')}" placeholder="Partial name"></label>
    <label class="f"><span>Avoid instructor</span><input data-c="enrpref" data-f="avoidInstructor" value="${esc(prefs.avoidInstructor||'')}" placeholder="Partial name"></label>
  </div></div>`;

  if(!U.showAutoSched)return`${prefsUI}<button type="button" class="btn primary sm" data-a="autosched">Find clash-free schedules</button><p class="small muted" style="margin:8px 0 0">${uniqueCourses} course${uniqueCourses===1?'':'s'} (${courseList.length} section component${courseList.length===1?'':'s'}) ready.</p>`;

  const scheds=findSchedules();
  if(!scheds.length)return`${prefsUI}<div class="empty" style="padding:16px">No clash-free combination found.</div><button type="button" class="btn sm" data-a="autosched" style="margin-top:10px">Try again</button>`;

  const rows=scheds.slice(0,5).map((sch,idx)=>`<div style="padding:10px 0;border-top:1px solid var(--line)"><div class="row between" style="margin-bottom:6px"><b>Option ${idx+1} <span class="meta-txt">score ${sch.score}</span></b><button type="button" class="btn primary sm" data-a="applysched" data-v="${idx}">Use this</button></div>
    <div class="small" style="line-height:1.55">${sch.items.map(x=>`<b>${esc(x.c.code)}</b> ${esc(x.s.sec)} · ${esc(fmtIns(x.s.ins,1))} · #${esc(x.s.k)}`).join('<br>')}</div></div>`).join('');

  return`${prefsUI}<div class="row between" style="margin-bottom:8px"><span class="meta-txt">${scheds.length} clash-free options</span><button type="button" class="btn ghost sm" data-a="autosched">Refresh</button></div>${rows}`;
}

/* ---------- main enrollment view ---------- */
function renderSectionPicker(c,g,cur){
  const selSec=g.sections.find(s=>s.k===cur),key=c.id+':'+g.comp;
  const many=g.sections.length>4,showChips=!many||!!(U.enrExpand&&U.enrExpand[key]);
  const ctl=many?`<div class="row" style="gap:6px;flex-wrap:nowrap;max-width:100%"><select class="sel-pill enr-sel ${cur?'acc':''}" data-c="enrpick" data-id="${c.id}" data-comp="${esc(g.comp)}" aria-label="${esc(g.label)} for ${esc(c.code)}"><option value="">Choose ${esc(g.label)} (${g.sections.length})</option>${g.sections.map(s=>`<option value="${s.k}" ${cur===s.k?'selected':''}>${esc(secLabel(s))}</option>`).join('')}</select><button type="button" class="btn ghost sm" data-a="enrexpand" data-k="${esc(key)}" style="flex:none">${showChips?'Hide':'All '+g.sections.length}</button></div>`:'';
  const chips=showChips?`<div class="sec-chips">${g.sections.map(s=>{const on=cur===s.k;const fullIns=cleanInsList(s.ins).join('; ');return`<button type="button" class="sec-chip ${on?'on':''}" data-a="picksec" data-id="${c.id}" data-comp="${esc(g.comp)}" data-v="${esc(s.k)}" title="${esc(fullIns)}"><span class="sc-top">${esc(s.sec)} <span class="muted" style="font-weight:400">#${esc(s.k)}</span> ${resBadge(s)}</span><span class="sc-sub">${esc(fmtIns(s.ins,1))} · ${esc(s.meets.length?groupMeets(s.meets):'time TBA')}</span></button>`}).join('')}</div>`:'';
  return{ctl,chips,selSec};
}
function vEnroll(){
  const E=S.enroll,t=enrollTerm(),eTermLabel=E?fmtEnrollTerm(E.term):'';
  const isWeb=typeof location!=='undefined'&&/^https?:$/i.test(location.protocol);
  if(!E){
    const srvBtn=isWeb?`<div class="row" style="margin-top:12px"><button type="button" class="btn soft sm" data-a="loadsrvsched">Load Spring 2027 schedule from server</button></div>`:'';
    return`<div class="card"><h3 style="margin-bottom:6px">Import course offerings</h3><p class="small muted" style="margin:0 0 14px">Drop the registrar’s schedule spreadsheet (.xlsx or .csv). Atlas matches your planned courses, splits multi-component Lectures &amp; Seminars, and checks for clashes.</p>
    <label class="dropzone"><input type="file" accept=".xlsx,.xls,.csv" data-c="enrf" aria-label="Schedule of classes" hidden><span class="dz-title">Choose schedule spreadsheet</span><span class="dz-sub">Supports .xlsx, .xls, and .csv exports from PSCS</span></label>${srvBtn}
    ${U.enrMsg?`<div class="small" style="color:var(--bad);margin-top:10px">${esc(U.enrMsg)}</div>`:''}</div>`;
  }
  const topBar=`<div class="enr-bar"><div class="row" style="gap:8px"><span class="small"><b>${esc(eTermLabel)}</b> offerings</span><span class="meta-txt">${E.sections.length} sections</span><select class="sel-pill" data-c="enrterm" aria-label="Term">${S.terms.filter(x=>x.status!=='done').map(x=>`<option value="${x.id}" ${t&&t.id===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="row" style="gap:6px"><label class="btn sm" style="cursor:pointer">Replace file<input type="file" accept=".xlsx,.xls,.csv" data-c="enrf" hidden></label>${isWeb?`<button type="button" class="btn ghost sm" data-a="loadsrvsched">Reload Spring 2027</button>`:''}</div></div>${U.enrMsg?`<div class="banner" style="background:var(--bad-soft);border-color:var(--bad-border);color:var(--bad)">${esc(U.enrMsg)}</div>`:''}`;
  const cs=t?S.courses.filter(c=>c.term===t.id):[];
  const pk=picked(),bad=clashes(pk);
  const rowsH=cs.map(c=>{
    const ss=offered(c),comps=secComponents(ss),pmap=getCoursePickMap(c.id);
    if(!ss.length){
      return`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="row between" style="gap:10px;flex-wrap:wrap"><div style="min-width:0;flex:1 1 180px"><span class="code">${esc(c.code)} · ${c.credits} cr</span><h3>${esc(c.title)}</h3></div><span class="meta-txt">Not offered</span></div></div>`;
    }
    if(comps.length===1){
      const g=comps[0],cur=pmap[g.comp]||'',p=renderSectionPicker(c,g,cur);
      return`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="row between" style="gap:10px;flex-wrap:wrap"><div style="min-width:0;flex:1 1 180px"><span class="code">${esc(c.code)} · ${c.credits} cr</span><h3>${esc(c.title)}</h3></div><div style="min-width:0;max-width:100%">${p.ctl}</div></div>${p.chips}${p.selSec?resDetail(p.selSec):''}${p.selSec&&p.selSec.meets.length?`<div class="small muted" style="margin-top:6px">${esc(groupMeets(p.selSec.meets))} · ${esc(p.selSec.meets[0].r)}</div>`:''}</div>`;
    }
    const pickedCnt=comps.filter(g=>!!pmap[g.comp]).length;
    const statusPill=pickedCnt===comps.length?`<span class="pill good">${pickedCnt}/${comps.length} picked</span>`:`<span class="pill warn">Pick ${comps.map(g=>g.label).join(' + ')} (${pickedCnt}/${comps.length})</span>`;
    const compBlocks=comps.map(g=>{
      const cur=pmap[g.comp]||'',p=renderSectionPicker(c,g,cur);
      return`<div class="comp-box"><div class="comp-head"><span class="comp-title">${esc(g.label)}${g.sections.length===1?' · common':''}</span>${p.ctl}</div>${p.chips}${p.selSec?resDetail(p.selSec):''}</div>`;
    }).join('');
    return`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="row between" style="gap:10px;flex-wrap:wrap"><div style="min-width:0;flex:1 1 180px"><span class="code">${esc(c.code)} · ${c.credits} cr</span><h3>${esc(c.title)}</h3></div>${statusPill}</div>${compBlocks}</div>`;
  }).join('');
  const clashH=bad.length?`<div class="card" style="border-color:var(--bad);background:var(--bad-soft);margin-bottom:14px;padding:12px 14px"><b style="color:var(--bad)">Schedule Clashes</b><div class="small" style="margin-top:4px">${bad.map(x=>`${esc(x.a.c.code)} ${esc(x.a.s.sec)} &amp; ${esc(x.b.c.code)} ${esc(x.b.s.sec)} overlap ${DAYL[x.d]} ${hm(x.at)}`).join('<br>')}</div></div>`:'';

  const tab=U.enrTab||'week';
  const rTabs=[['week','Week'],['cart','Cart'+(pk.length?' ('+pk.length+')':'')],['backups','Backups'],['auto','Auto'],['search','Search']];
  let rightBody='';
  if(tab==='week'){
    rightBody=pk.length?weekGrid(pk,bad):'<div class="empty">Pick sections on the left to see your weekly timetable.</div>';
  }else if(tab==='cart'){
    rightBody=pk.length?`<div style="margin:-4px 0">${pk.map(x=>{const rb=resBadge(x.s);return`<div class="kv"><span title="${esc(cleanInsList(x.s.ins).join('; '))}"><b>${esc(x.c.code)}</b> ${esc(x.s.sec)} · ${esc(fmtIns(x.s.ins,1))}</span><span class="row" style="gap:8px;flex:none">${rb}<span class="mono" style="min-width:44px;text-align:right;font-weight:600">${esc(x.s.k)}</span></span></div>`}).join('')}</div><div class="row between" style="padding-top:12px;border-top:1px solid var(--line);margin-top:10px"><div><div class="lbl">PSCS class numbers</div><div class="mono small" style="margin-top:4px;user-select:all">${pk.map(x=>x.s.k).join(', ')}</div></div><button type="button" class="btn primary sm" data-a="copycart">Copy</button></div>`:'<div class="empty">Pick sections to fill your PSCS shopping cart.</div>';
  }else if(tab==='backups'){
    rightBody=backupSection()||'<div class="empty">Pick sections first to see clash-free backup alternatives.</div>';
  }else if(tab==='auto'){
    rightBody=autoScheduleSection()||'<div class="empty">Add at least 2 offered courses to generate clash-free schedules.</div>';
  }else{
    const q=(U.enrQ||'').trim().toLowerCase(),found=q.length>1?E.sections.filter(s=>(s.code+' '+s.title+' '+s.ins+' '+s.prog).toLowerCase().includes(q)).slice(0,30):[];
    rightBody=`<input id="enr-q" data-c="enrq" placeholder="Search code, title, instructor, or program…" value="${esc(U.enrQ||'')}" style="width:100%;margin-bottom:10px">${found.length?found.map(s=>`<div class="kv"><span><b>${esc(s.code)}</b> ${esc(s.title)} <span class="meta-txt">${esc(s.sec)}</span></span><span class="meta-txt">${esc(fmtIns(s.ins,1))} · ${esc(s.meets.length?groupMeets(s.meets):'TBA')}</span></div>`).join(''):`<div class="small muted" style="padding:8px 0">${q.length>1?'Nothing matched.':'Type at least two letters to search all '+E.sections.length+' sections.'}</div>`}`;
  }
  const open=[];S.minors.forEach(mn=>minorStat(mn).open.forEach(r=>{const opts=(r.sl.opts||[]);const hits=opts.map(o=>({o,n:E.sections.filter(s=>aliases(o).some(a=>aliases(s.code).indexOf(a)>=0)).length}));open.push({mn,r,hits})}));
  const minorH=open.filter(x=>x.hits.length).length?`<details class="card" style="margin-top:16px"><summary>Minor courses on offer</summary>${open.filter(x=>x.hits.length).map(x=>`<div class="kv"><span>${esc(x.mn.name)} · ${esc(slotName(x.r.sl))}</span><span class="mono small">${x.hits.map(h=>esc(primary(h.o))+(h.n?' ✓':' ✗')).join('  ')}</span></div>`).join('')}</details>`:'';
  return topBar+clashH+`<div class="grid g2" style="align-items:start"><div class="card" style="padding:4px 16px;min-width:0">${rowsH||'<div class="empty" style="margin:12px 0">No courses are planned in this term.</div>'}</div><div class="card" style="position:sticky;top:20px;min-width:0"><div class="enr-pane-tabs">${rTabs.map(([k,l])=>`<button type="button" class="${tab===k?'on':''}" data-a="enrtab" data-v="${k}">${l}</button>`).join('')}</div>${rightBody}</div></div>${minorH}`;
}

function resDetail(section){
  const ri=resInfo(section);if(!ri)return'';
  return`<div class="small" style="margin-top:6px;padding:6px 10px;background:var(--surface-2);border:1px solid var(--line);border-radius:7px">${ri.res.map(x=>`<span style="margin-right:10px">${esc(x.who)}: <b>${x.seats}</b></span>`).join('')}<span class="muted">cap: ${ri.cap}</span></div>`;
}

Object.assign(ACT2,{
  copycart(){const pk=picked();if(!pk.length)return;const txt=pk.map(x=>x.s.k).join(', ');
    if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('Class numbers copied'),()=>toast('Could not copy'));else toast('Select and copy: '+txt)},
  autosched(){U.showAutoSched=true;render()},
  applysched(e,d){applySchedule(+d.v);U.showAutoSched=false;U.enrTab='week';toast('Schedule applied');render()},
  enrtab(e,d){U.enrTab=d.v;render()},
  enrexpand(e,d){U.enrExpand=U.enrExpand||{};U.enrExpand[d.k]=!U.enrExpand[d.k];render()},
  enrtime(e,d){U.enrPrefs=U.enrPrefs||{};U.enrPrefs.time=d.v;render()},
  picksec(e,d){const comp=d.comp||'SEC',cur=getCoursePickMap(d.id)[comp]||'';setCoursePick(d.id,comp,cur===d.v?'':d.v);persist();render()},
  async loadsrvsched(){U.enrMsg='';try{const b=(typeof WEB_BASE==='string'?WEB_BASE:'');const r=await fetch(b+'/api/offerings/default');if(!r.ok)throw new Error('HTTP '+r.status);const rows=parseCsvRows(await r.text());const keep=(S.enroll&&S.enroll.picks)||{};const o=parseOffers(rows);o.picks=preserveEnrollPicks(keep,o.sections);S.enroll=o;persist();toast('Loaded '+fmtEnrollTerm(o.term)+' ('+o.sections.length+' sections)')}catch(err){U.enrMsg='Could not load server schedule ('+(err&&err.message||'error')+')'}render()},
});
Object.assign(CHG2,{
  enrpick(e,d,v){setCoursePick(d.id,d.comp||'SEC',v||'')},
  enrterm(e,d,v){U.enrTerm=v},
  enrq(e,d,v){U.enrQ=v},
  enrpref(e,d,v){U.enrPrefs=U.enrPrefs||{};U.enrPrefs[d.f]=v},
});
