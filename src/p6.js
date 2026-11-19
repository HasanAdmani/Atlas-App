
/* ---------- Canvas sync, PSCS reconciliation & universal bookmarklet ---------- */
const atlasBaseUrl=()=>{
  if(typeof IS_WEB!=='undefined'&&IS_WEB)return location.origin+(typeof WEB_BASE==='string'?WEB_BASE:'')+'/';
  return (typeof HC!=='undefined'&&HC&&HC.serverUrl)?HC.serverUrl.replace(/\/+$/,'')+'/':'https://starserver.tailbf777f.ts.net/atlas/';
};
const UNIVERSAL_BOOKMARK_FN=async(ATLAS_URL)=>{try{
  const isCanvas=/instructure\.com$/i.test(location.hostname)||!!(window.ENV&&(window.ENV.COURSE_ID||window.ENV.current_user_id));
  let payload;
  if(isCanvas){
    const J=async u=>{let o=[];while(u){const r=await fetch(u,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Canvas answered '+r.status);const t=(await r.text()).replace(/^while\(1\);/,'');o=o.concat(JSON.parse(t));const l=r.headers.get('Link'),m=l&&l.match(/<([^>]+)>;\s*rel="next"/);u=m?m[1]:null}return o};
    const cs=await J('/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term&per_page=100');
    const out=[];
    for(const c of cs){if(!c.name)continue;
      const gs=await J('/api/v1/courses/'+c.id+'/assignment_groups?include[]=assignments&include[]=submission&per_page=100');
      out.push({id:c.id,name:c.name,code:c.course_code||'',term:(c.term||{}).name||'',teachers:(c.teachers||[]).map(t=>t.display_name),groups:gs.map(g=>({name:g.name,weight:g.group_weight||0,items:(g.assignments||[]).map(a=>{const s=a.submission||{};return{name:a.name,max:a.points_possible,due:a.due_at,score:s.score==null?null:s.score,state:s.workflow_state||'',late:!!s.late,missing:!!s.missing,excused:!!s.excused}})}))});
    }
    payload={v:2,kind:'canvas',at:Date.now(),courses:out};
  }else{
    const docs=[document];
    Array.from(document.querySelectorAll('iframe')).forEach(f=>{try{if(f.contentDocument)docs.push(f.contentDocument)}catch(e){}});
    const t=s=>(s||'').replace(/\s+/g,' ').trim();
    const tables=[],texts=[];
    docs.forEach(doc=>{
      Array.from(doc.querySelectorAll('table')).slice(0,25).forEach(tb=>{
        const rows=Array.from(tb.rows).slice(0,150).map(r=>Array.from(r.cells).map(c=>t(c.innerText).slice(0,120)));
        if(rows.length)tables.push({id:tb.id||'',rows});
      });
      if(doc.body&&doc.body.innerText)texts.push(doc.body.innerText.slice(0,20000));
    });
    const kind=/pscs|peoplesoft/i.test(location.href)?'pscs':'syllabus';
    payload={v:2,kind,at:Date.now(),url:location.origin+location.pathname,title:document.title,tables,text:texts.join('\n')};
  }
  const j=JSON.stringify(payload);
  const b64=btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const target=ATLAS_URL+'#import/'+b64;
  try{await navigator.clipboard.writeText(j)}catch(e){}
  if(b64.length<120000){try{window.open(target,'_blank')}catch(e){}}
  const d=document.createElement('div');d.style.cssText='position:fixed;z-index:99999;right:18px;top:18px;width:min(420px,90vw);background:#fff;color:#111;padding:16px;border:2px solid #2945B8;border-radius:12px;font:14px system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)';
  d.innerHTML='<b>Sent to Atlas</b><p style="margin:6px 0 10px;font-size:13px;color:#444">If Atlas did not open automatically, click below or copy the export text.</p>'+(b64.length<120000?'<p><a href="'+target+'" target="_blank" style="display:inline-block;padding:8px 14px;background:#2945B8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open in Atlas →</a></p>':'')+'<textarea style="width:100%;height:110px;font:12px monospace"></textarea><p style="margin:8px 0 0"><button>Close</button></p>';
  document.body.appendChild(d);const ta=d.querySelector('textarea');ta.value=j;ta.select();d.querySelector('button').onclick=()=>d.remove();
}catch(e){alert('Atlas export failed: '+e.message)}};
const bmCode=()=>'javascript:('+UNIVERSAL_BOOKMARK_FN.toString().replace(/\s*\n\s*/g,' ')+')('+JSON.stringify(atlasBaseUrl())+')';

const nn=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'').replace(/([a-z])0+(\d)/g,'$1$2').replace(/parti$/,'part1');
const cvBase=n=>String(n||'').replace(/-[A-Za-z0-9,\s]*$/,'');
function cvMatch(cv){
  const mapped=S.links&&S.links.canvas&&S.links.canvas.map&&S.links.canvas.map[cv.id];
  if(mapped&&getC(mapped))return mapped;
  const b=nn(cvBase(cv.name)),code=nn(cv.code);let best='',bs=0;
  S.courses.forEach(c=>{let sc=0;const t=nn(c.title);
    if(b&&t===b)sc=100;else if(b&&(t.startsWith(b)||b.startsWith(t))&&Math.abs(t.length-b.length)<=6)sc=60;
    if(code&&nn(c.code)&&code.includes(nn(c.code)))sc=Math.max(sc,80);
    if(sc>0&&status(c)==='current')sc+=5;
    if(sc>bs){bs=sc;best=c.id}});
  return bs>=60?best:'';
}
function cvItem(a){
  const sc=a.score==null?null:+a.score;
  return{id:uid(),n:String(a.name||'').replace(/[\u{1F000}-\u{1FAFF}☀-➿]/gu,'').trim()||'Item',s:sc,m:a.max==null?null:+a.max,due:a.due?dstr(new Date(a.due)):'',
    st:a.excused?'excused':sc!=null?'':(a.state==='submitted'||a.state==='pending_review')?'submitted':a.missing?'missing':'',late:!!a.late};
}
function cvFind(c,name){const k=nn(name.replace(/[\u{1F000}-\u{1FAFF}☀-➿]/gu,''));const al={oel:'openendedlab'};const kk=al[k]||k;
  for(const g of c.assess||[])for(const it of g.items||[])if(nn(it.n)===kk)return it;return null}
const KW=[['quiz','Quiz'],['lab','Lab'],['home','Assignment'],['assign','Assignment'],['hw','Assignment'],['mid','Midterm'],['test','Midterm'],['exam','Final'],['final','Final'],['project','Project'],['present','Project'],['discuss','Assignment'],['particip','Participation']];
function cvGroup(c,name){
  const n=name.toLowerCase();let best=null,bs=0;
  (c.assess||[]).forEach(g=>{let sc=0;const gn=String(g.n).toLowerCase();KW.forEach(([k,ty])=>{if(n.includes(k)){if(gn.includes(k))sc+=3;if(g.type===ty)sc+=1}});if(sc>bs){bs=sc;best=g}});
  return bs>=3?best:null;
}
function cvGuessType(n){const l=String(n).toLowerCase();for(const [k,ty] of KW)if(l.includes(k))return ty;return 'Other'}
function cvApply(){
  let upd=0,add=0,un=0;
  S.links=S.links||{canvas:{at:0,map:{}},pscs:{at:0}};
  S.links.canvas=S.links.canvas||{at:0,map:{}};
  S.links.canvas.map=S.links.canvas.map||{};
  (U.cv||[]).forEach(cv=>{const c=getC(cv.target);if(!c)return;
    if(cv.id){S.links.canvas.map[cv.id]=c.id;c.canvasId=cv.id}
    if(!c.instructor&&cv.teachers&&cv.teachers.length)c.instructor=cv.teachers.join(', ');
    if(!(c.assess||[]).length){
      c.assess=cv.groups.filter(g=>g.items.length).map(g=>({id:uid(),n:g.name,type:cvGuessType(g.name),w:+g.weight||0,cnt:g.items.length,drop:0,items:g.items.map(cvItem)}));
      add+=c.assess.reduce((a,g)=>a+g.items.length,0);return;
    }
    cv.groups.forEach(g=>g.items.forEach(a=>{
      const it=cvItem(a),old=cvFind(c,a.name);
      if(old){old.s=it.s!=null?it.s:old.s;old.m=it.m!=null?it.m:old.m;old.due=it.due||old.due;old.st=it.s!=null?'':it.st||old.st;old.late=it.late;upd++}
      else{let grp=cvGroup(c,a.name);if(!grp){grp=c.assess.find(x=>x.n==='Unsorted from Canvas');if(!grp){grp={id:uid(),n:'Unsorted from Canvas',type:'Other',w:0,cnt:1,drop:0,items:[]};c.assess.push(grp)}un++}
        grp.items.push(it);add++}
    }));
  });
  S.links.canvas.at=Date.now();
  return{upd,add,un};
}
function cvAutoSync(rawJson){
  try{
    const j=JSON.parse(String(rawJson||'').trim());
    if(!j||!Array.isArray(j.courses)||!j.courses.length)return;
    U.cv=j.courses.map(cv=>Object.assign({},cv,{teachers:cv.teachers||[],groups:cv.groups||[],target:cvMatch(cv)})).filter(cv=>cv.target);
    if(!U.cv.length)return;
    const r=cvApply();U.cv=[];persist();render();
    if(r.upd+r.add>0)toast(`Canvas synced automatically (${r.upd} updated, ${r.add} added)`);
  }catch(e){}
}
function parsePscsGrades(obj){
  const valid=new Set(['CR','NC','W','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']);
  (S.settings.scale||[]).forEach(x=>{if(x.l)valid.add(String(x.l).toUpperCase())});
  const codeRe=/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/i;
  const gradeTok=s=>{const u=String(s||'').trim().toUpperCase();return valid.has(u)?u:''};
  const found={};
  const consider=(codeStr,gStr,rowText)=>{
    if(!codeStr||!gStr)return;
    const key=NC(codeStr);
    const cands=S.courses.filter(c=>NC(c.code)===key);
    if(!cands.length)return;
    const c=cands.find(x=>rowText&&termOf(x.term)&&rowText.toLowerCase().includes((termOf(x.term).name||'').toLowerCase()))||cands.find(x=>status(x)==='done')||cands[0];
    found[c.id]={id:c.id,code:c.code,title:c.title,term:(termOf(c.term)||{}).name||'Catalog',curGrade:c.grade||'',pscsGrade:gStr,status:!c.grade?'new':(c.grade===gStr?'match':'diff'),apply:!c.grade||c.grade!==gStr};
  };
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{
    const cells=r.map(x=>String(x||'').trim());
    let code='';let g='';
    cells.forEach(cell=>{
      if(!code){const m=cell.match(codeRe);if(m)code=m[1]+' '+m[2]}
      const gt=gradeTok(cell);if(gt)g=gt;
    });
    if(code&&g)consider(code,g,cells.join(' '));
  }));
  if(!Object.keys(found).length&&obj&&obj.text){
    String(obj.text).split(/\r?\n/).forEach(line=>{
      const m=line.match(codeRe);if(!m)return;
      const toks=line.trim().split(/[\s\t,|]+/);
      for(let i=toks.length-1;i>=0;i--){const gt=gradeTok(toks[i]);if(gt){consider(m[1]+' '+m[2],gt,line);break}}
    });
  }
  return Object.values(found);
}
function parseSyllabusDeterministic(obj){
  const textLines=[];
  if(obj.title)textLines.push(obj.title);
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{const line=r.map(x=>String(x||'').trim()).filter(Boolean).join(' · ');if(line)textLines.push(line)}));
  if(obj.text)textLines.push(obj.text);
  const fullText=textLines.join('\n').slice(0,120000);
  const codeM=fullText.match(/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/);
  const code=codeM?(codeM[1]+' '+codeM[2]):'';
  const assessments=[];
  const seen=new Set();
  const scanRow=(label,wStr)=>{
    const w=parseFloat(wStr),nm=String(label||'').replace(/\b\d+(?:\.\d+)?\s*%/g,'').replace(/[:\-–·]+$/,'').trim();
    if(!nm||isNaN(w)||w<=0||w>=100||/^total\b/i.test(nm))return;
    const k=nm.toLowerCase();if(seen.has(k))return;seen.add(k);
    assessments.push({name:nm.slice(0,60),type:cvGuessType(nm),weight:w,count:1,drop:0});
  };
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{
    const pctCell=r.find(c=>/\b(\d{1,3}(?:\.\d+)?)\s*%/.test(String(c||'')));
    if(!pctCell)return;
    const m=String(pctCell).match(/\b(\d{1,3}(?:\.\d+)?)\s*%/);
    const lbl=r.find(c=>c!==pctCell&&String(c||'').trim().length>1)||'';
    if(m&&lbl)scanRow(lbl,m[1]);
  }));
  if(!assessments.length){
    fullText.split(/\r?\n/).forEach(line=>{
      const m=line.match(/^(.{2,50}?)\s+(\d{1,3}(?:\.\d+)?)\s*%/);
      if(m)scanRow(m[1],m[2]);
    });
  }
  return{fullText,code,title:String(obj.title||'').replace(/\s*[-|].*$/,'').trim(),assessments};
}
function routeImportedObj(j,rawStr){
  if(j&&Array.isArray(j.courses)){
    U.pscsDiff=null;
    U.cv=j.courses.map(cv=>Object.assign({},cv,{teachers:cv.teachers||[],groups:cv.groups||[],target:cvMatch(cv)}));
    render();return true;
  }
  if(j&&(j.kind==='pscs'||/pscs|peoplesoft/i.test(j.url||''))){
    U.cv=[];
    const diffs=parsePscsGrades(j);
    if(!diffs.length){U.pscsDiff=null;U.cvErr='No matching course grades found in that PSCS page. Open Academic Records → Course History or Grades first.';render();return true}
    U.pscsDiff=diffs;U.cvErr='';render();return true;
  }
  if(j&&(j.kind==='syllabus'||/syllabus/i.test((j.url||'')+(j.title||'')))){
    const parsed=parseSyllabusDeterministic(j);
    U.syl.text=parsed.fullText;
    U.syl.err='';
    if(!AI.key&&parsed.assessments.length){
      const cur=S.settings.cats;
      U.syl.out={code:parsed.code,title:parsed.title,credits:3,instructor:'',notes:'',prereqs:[],cat:cur[0]?cur[0].k:'',term:(S.terms.find(t=>t.status==='current')||{}).id||'',assessments:parsed.assessments};
    }
    location.hash='add';
    toast('Syllabus imported — review and add');
    return true;
  }
  return false;
}
function handleIncomingImport(jsonStr){
  U.cvText=jsonStr;U.cvErr='';U.pscsDiff=null;
  try{
    const j=JSON.parse(String(jsonStr||'').trim());
    if(routeImportedObj(j,jsonStr))return;
  }catch(e){}
  ACT2.cvread();
}
function vCanvas(){
  const y=U.cvText||'',list=U.cv||[],pscs=U.pscsDiff||[],lastAt=S.links&&S.links.canvas&&S.links.canvas.at;
  const opts=sel=>`<option value="">Skip this one</option>`+S.courses.filter(c=>status(c)!=='done'||c.id===sel).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.code)} · ${esc(c.title)}</option>`).join('');
  return head('Sync & Import','Sync scores from Canvas, reconcile PSCS grades, or import a syllabus in one click.',`<button class="btn" data-a="go" data-v="courses">Back to courses</button>`)+
  (DESKTOP_HOST?hostCanvasCard():'')+`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">One-click “Send to Atlas” bookmark</h2><span class="pill">Last Canvas sync: ${lastAt?esc(new Date(lastAt).toLocaleString()):'Never'}</span></div>
  <p class="small muted" style="margin:0 0 12px">Drag this button onto your browser Bookmarks bar once. Then whenever you are signed into Canvas, PSCS, or Simple Syllabus, click it once to send the page straight into Atlas without copy/pasting.</p>
  <div class="row" style="margin-bottom:12px"><a class="btn primary" href="${esc(bmCode())}" onclick="event.preventDefault();alert('Drag this button onto your Bookmarks bar, then click it on Canvas, PSCS, or Simple Syllabus!')">✦ Send to Atlas (Drag to Bookmarks Bar)</a><button class="btn" data-a="copybm">Copy bookmark code</button></div>
  <details><summary>Manual code</summary><textarea id="bm-code" rows="3" readonly class="mono small">${esc(bmCode())}</textarea></details></div>
  <div class="card" style="margin-top:16px"><h2>Paste export or page report</h2><textarea id="cv-text" rows="4" data-c="cvtext" placeholder="Paste Canvas JSON, a PSCS report/table, or a Simple Syllabus report here">${esc(y)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-a="cvread">Read export</button><span class="small" style="color:var(--bad)">${esc(U.cvErr||'')}</span></div></div>`+
  (list.length?`<div class="card" style="margin-top:16px"><h2>Match Canvas courses</h2><div class="scroll"><table class="t"><thead><tr><th>In Canvas</th><th class="r">Items</th><th>Your course</th></tr></thead><tbody>${list.map((cv,i)=>`<tr><td>${esc(cv.name)}</td><td class="r mono">${cv.groups.reduce((a,g)=>a+g.items.length,0)}</td><td><select data-c="cvmap" data-i="${i}">${opts(cv.target)}</select></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><button class="btn primary" data-a="cvapply">Import into the matched courses</button></div><p class="small muted">Your course matching is remembered for next time. Items that do not fit a group go into “Unsorted from Canvas” with no weight.</p></div>`:'')+
  (pscs.length?`<div class="card" style="margin-top:16px"><h2>PSCS grade reconciliation</h2><p class="small muted" style="margin:-4px 0 12px">Found ${pscs.length} matching course${pscs.length===1?'':'s'}. Review differences before applying.</p><div class="scroll"><table class="t"><thead><tr><th>Apply</th><th>Course</th><th>Term</th><th>Atlas</th><th>PSCS</th><th>Status</th></tr></thead><tbody>${pscs.map((r,i)=>`<tr><td><input type="checkbox" data-c="pscsrow" data-i="${i}" ${r.apply?'checked':''}></td><td><b>${esc(r.code)}</b> <span class="small muted">${esc(r.title)}</span></td><td class="small muted">${esc(r.term)}</td><td>${lpill(r.curGrade)}</td><td>${lpill(r.pscsGrade)}</td><td><span class="pill ${r.status==='match'?'good':r.status==='diff'?'warn':'acc'}">${r.status==='match'?'Matches':r.status==='diff'?'Differs':'New'}</span></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><button type="button" class="btn primary" data-a="pscsapply">Apply selected grades</button></div></div>`:'')+
  `<div class="card" style="margin-top:16px"><h2>Calendar feed &amp; companion extension</h2><p class="small muted" style="margin:-4px 0 12px">Subscribe Apple/Google Calendar to your live Atlas due dates over Tailscale, or load the unpacked companion browser extension for background Canvas auto-sync.</p>
  <div class="row"><button type="button" class="btn" data-a="calics">Download .ics calendar</button><button type="button" class="btn soft" data-a="copycalurl">Copy calendar subscription URL</button></div>
  <details style="margin-top:12px"><summary>Browser extension setup (Edge / Chrome)</summary><ol class="small muted" style="margin:6px 0 0;padding-left:20px;line-height:1.6"><li>Open <code>edge://extensions</code> (or <code>chrome://extensions</code>) and enable <b>Developer mode</b>.</li><li>Click <b>Load unpacked</b> and pick the <code>extension</code> folder inside your Atlas repo.</li><li>Open the Atlas Companion icon to set your server URL (<code>https://starserver.tailbf777f.ts.net/atlas</code>) and sync Canvas automatically whenever you browse Canvas.</li></ol></details></div>`;
}
const icsEsc=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
function calendarIcs(){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Atlas Degree Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Atlas'];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  S.courses.forEach(c=>{
    if(status(c)==='done')return;
    (c.assess||[]).forEach(g=>(g.items||[]).forEach(it=>{
      const due=String(it.due||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(due))return;
      const dt=due.replace(/-/g,''),st=it.s!=null?`Scored ${it.s}/${it.m}`:(it.st||'Upcoming');
      lines.push('BEGIN:VEVENT','UID:atlas-due-'+(it.id||uid())+'@atlas','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+dt,'SUMMARY:'+icsEsc(c.code+': '+it.n),'DESCRIPTION:'+icsEsc(c.code+' — '+c.title+'\nGroup: '+g.n+' ('+g.w+'%)\nStatus: '+st),'END:VEVENT');
    }));
  });
  return lines.concat(['END:VCALENDAR']).join('\r\n')+'\r\n';
}
const ACT2={
  copybm(){const t=$('#bm-code');if(!t)return;t.select();let ok=false;try{ok=navigator.clipboard&&navigator.clipboard.writeText(t.value)}catch(e){}Promise.resolve(ok).then(()=>toast('Code copied'),()=>toast('Press Ctrl+C to copy the selected code'))},
  cvread(){
    const t=($('#cv-text')||{}).value||U.cvText||'';U.cvText=t;U.cvErr='';U.pscsDiff=null;
    try{
      const j=JSON.parse(t.trim());
      if(routeImportedObj(j,t))return;
      throw 0;
    }catch(e){
      const diffs=parsePscsGrades({tables:[],text:t});
      if(diffs.length){U.cv=[];U.pscsDiff=diffs;render();return}
      U.cv=[];U.cvErr='That does not look like a Canvas export, PSCS grade report, or Simple Syllabus export.';
    }
    render();
  },
  cvapply(){const r=cvApply();U.cv=[];U.cvText='';persist();toast(`Updated ${r.upd} items, added ${r.add}${r.un?`, ${r.un} unsorted`:''}`);render()},
  pscsapply(){
    const list=(U.pscsDiff||[]).filter(r=>r.apply);
    if(!list.length)return toast('No grades selected');
    pushUndo('PSCS grade import');
    let n=0;
    list.forEach(r=>{const c=getC(r.id);if(c){c.grade=r.pscsGrade;n++}});
    S.links=S.links||{canvas:{at:0,map:{}},pscs:{at:0}};
    S.links.pscs=S.links.pscs||{at:0};S.links.pscs.at=Date.now();
    U.pscsDiff=null;U.cvText='';persist();toast(`Applied ${n} PSCS grade${n===1?'':'s'}`,true);
  },
  calics(){saveFile('atlas-calendar.ics',calendarIcs()).then(()=>toast('Calendar saved'),e=>{if(!e||e.code!=='declined')toast('Could not save calendar')})},
  copycalurl(){
    const u=atlasBaseUrl().replace(/\/+$/,'')+'/api/calendar.ics';
    if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>toast('Calendar subscription URL copied'),()=>toast(u));
    else toast(u);
  },
};
const CHG2={cvmap(e,d,v){U.cv[+d.i].target=v},cvtext(e,d,v){U.cvText=v},pscsrow(e,d){const r=(U.pscsDiff||[])[+d.i];if(r)r.apply=!!e.target.checked}};

/* ---------- transcript ---------- */
function transcript(){
  const out=[];let done=[];
  S.terms.forEach(t=>{
    if(t.status==='planned')return;const cs=S.courses.filter(c=>c.term===t.id);if(!cs.length)return;
    if(t.status==='done')done=done.concat(cs);
    const rows=cs.map(c=>{const g=c.grade||(t.status==='current'?standing(c).letter:'');return{code:c.code,title:c.title,cr:c.credits,grade:g?(t.status==='current'&&!c.grade?g+' (so far)':g):(t.status==='current'?'In progress':'–'),pts:c.grade&&pointsOf(c.grade)!=null?pointsOf(c.grade):null,note:c.retakeOf?'Retake':S.courses.some(o=>o.retakeOf===c.id)?'Retaken':''}});
    out.push({name:t.name,status:t.status,cr:!!t.cr,rows,credits:cs.reduce((a,c)=>a+c.credits,0),tg:t.status==='done'&&!t.cr?gpaOf(cs,false).gpa:null,cg:t.status==='done'?gpaOf(done,false).gpa:null});
  });
  return out;
}
const csvQ=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
function transcriptCsv(){
  const T=transcript(),L=[['Term','Code','Title','Credits','Grade','Grade points','Note'].map(csvQ).join(',')];
  T.forEach(t=>{t.rows.forEach(r=>L.push([t.name+(t.cr?' (credit/no credit)':''),r.code,r.title,r.cr,r.grade,r.pts==null?'':r.pts,r.note].map(csvQ).join(',')));
    L.push([t.name,'','Term summary',t.credits,t.tg==null?'':fmt(t.tg),'',t.cg==null?'':'Cumulative '+fmt(t.cg)].map(csvQ).join(','))});
  return L.join('\n');
}
async function transcriptPdf(){
  if(!window.jspdf)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const doc=new window.jspdf.jsPDF({unit:'pt',format:'a4'}),T=transcript(),cum=cumulative();
  const M=44,W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();let y=M;
  const need=n=>{if(y+n>H-M){doc.addPage();y=M}};
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('Unofficial transcript',M,y);y+=22;
  doc.setFont('helvetica','normal');doc.setFontSize(10);
  [S.settings.name,S.settings.program,S.settings.school,'Generated '+todayStr()+' with Atlas. Not an official record.'].filter(Boolean).forEach(l=>{doc.text(l,M,y);y+=14});
  y+=6;
  T.forEach(t=>{need(60);
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(t.name+(t.cr?'  (credit / no credit)':t.status==='current'?'  (in progress)':''),M,y);y+=6;doc.setDrawColor(150);doc.line(M,y,W-M,y);y+=13;
    doc.setFont('helvetica','normal');doc.setFontSize(9.5);
    t.rows.forEach(r=>{need(16);doc.text(r.code,M,y);doc.text(r.title.length>58?r.title.slice(0,57)+'…':r.title,M+78,y);doc.text(String(r.cr),W-M-110,y,{align:'right'});doc.text(r.grade+(r.note?'  '+r.note:''),W-M-90,y);y+=14});
    need(18);doc.setFont('helvetica','bold');doc.text('Credits '+t.credits+(t.tg!=null?'    Term GPA '+fmt(t.tg):'')+(t.cg!=null?'    Cumulative GPA '+fmt(t.cg):''),M,y+2);y+=24;
  });
  need(30);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Cumulative GPA '+(cum.gpa==null?'–':fmt(cum.gpa))+'     Credits earned '+earnedCredits(),M,y);
  return doc.output('arraybuffer');
}
function transcriptSection(){
  const T=transcript();
  return`<details id="tr-details" class="card sec"><summary>Transcript</summary><div class="row" style="margin-bottom:14px"><button class="btn" data-a="trcsv">Download CSV</button><button class="btn" data-a="trpdf">Download PDF</button><button class="btn" data-a="trprint">Print / Save PDF</button></div>${T.map(t=>`<div style="margin-bottom:16px"><div class="row between"><h3>${esc(t.name)}${t.cr?' <span class="pill">credit / no credit</span>':t.status==='current'?' <span class="pill acc">in progress</span>':''}</h3><span class="mono small muted">${t.credits} cr${t.tg!=null?' · GPA '+fmt(t.tg):''}${t.cg!=null?' · cumulative '+fmt(t.cg):''}</span></div><div class="scroll"><table class="t"><tbody>${t.rows.map(r=>`<tr><td class="mono small" style="white-space:nowrap">${esc(r.code)}</td><td>${esc(r.title)}${r.note?` <span class="pill">${r.note}</span>`:''}</td><td class="r mono">${r.cr}</td><td class="r mono">${esc(r.grade)}</td></tr>`).join('')}</tbody></table></div></div>`).join('')||'<div class="empty">Finished and current terms appear here.</div>'}</details>`;
}
Object.assign(ACT2,{
  trcsv(){saveFile('atlas-transcript.csv',transcriptCsv()).then(()=>toast('Transcript saved'),e=>{if(!e||e.code!=='declined')toast('The file could not be saved')})},
  async trpdf(){try{const buf=await transcriptPdf();await saveFile('atlas-transcript.pdf',buf);toast('Transcript saved')}catch(e){if(!e||e.code!=='declined')toast('The PDF could not be made. Try Print / Save PDF or CSV.')}},
  trprint(){const el=$('#tr-details');if(el)el.open=true;document.body.classList.add('print-tr');setTimeout(()=>{window.print();setTimeout(()=>document.body.classList.remove('print-tr'),400)},50)},
});
