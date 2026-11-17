
/* ---------- Canvas sync ---------- */
/* This function is never run on this page. It is copied into a bookmark and run on your Canvas page,
   where your own login lets it read your own courses, grades and due dates. It only reads, and it only shows the result on screen. */
const CANVAS_EXPORT=async()=>{try{
  const J=async u=>{let o=[];while(u){const r=await fetch(u,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Canvas answered '+r.status);const t=(await r.text()).replace(/^while\(1\);/,'');o=o.concat(JSON.parse(t));const l=r.headers.get('Link'),m=l&&l.match(/<([^>]+)>;\s*rel="next"/);u=m?m[1]:null}return o};
  const cs=await J('/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term&per_page=100');
  const out=[];
  for(const c of cs){if(!c.name)continue;
    const gs=await J('/api/v1/courses/'+c.id+'/assignment_groups?include[]=assignments&include[]=submission&per_page=100');
    out.push({id:c.id,name:c.name,code:c.course_code||'',term:(c.term||{}).name||'',teachers:(c.teachers||[]).map(t=>t.display_name),groups:gs.map(g=>({name:g.name,weight:g.group_weight||0,items:(g.assignments||[]).map(a=>{const s=a.submission||{};return{name:a.name,max:a.points_possible,due:a.due_at,score:s.score==null?null:s.score,state:s.workflow_state||'',late:!!s.late,missing:!!s.missing,excused:!!s.excused}})}))});
  }
  const j=JSON.stringify({v:1,courses:out});
  const d=document.createElement('div');d.style.cssText='position:fixed;z-index:99999;left:8%;right:8%;top:8%;background:#fff;color:#111;padding:16px;border:2px solid #333;border-radius:8px;font:14px sans-serif';
  d.innerHTML='<b>Atlas export</b><p>Copy everything below and paste it into Atlas. It was copied for you if your browser allowed it.</p><textarea style="width:100%;height:240px"></textarea><p><button>Close</button></p>';
  document.body.appendChild(d);const ta=d.querySelector('textarea');ta.value=j;ta.select();d.querySelector('button').onclick=()=>d.remove();
  try{await navigator.clipboard.writeText(j)}catch(e){}
}catch(e){alert('Atlas export failed: '+e.message)}};
const bmCode=()=>'javascript:('+CANVAS_EXPORT.toString().replace(/\s*\n\s*/g,' ')+')()';

const nn=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'').replace(/([a-z])0+(\d)/g,'$1$2').replace(/parti$/,'part1');
const cvBase=n=>String(n||'').replace(/-[A-Za-z0-9,\s]*$/,'');
function cvMatch(cv){
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
  (U.cv||[]).forEach(cv=>{const c=getC(cv.target);if(!c)return;
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
  return{upd,add,un};
}
function vCanvas(){
  const y=U.cvText||'',list=U.cv||[];
  const opts=sel=>`<option value="">Skip this one</option>`+S.courses.filter(c=>status(c)!=='done'||c.id===sel).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.code)} · ${esc(c.title)}</option>`).join('');
  return head('Sync from Canvas','Pull your scores, due dates and instructors from Canvas in one go. Nothing leaves your browser except what you paste here.',`<button class="btn" data-a="go" data-v="courses">Back to courses</button>`)+
  (HOST?hostCanvasCard():'')+`<div class="card"><h2>${HOST?'Or use the bookmark':'One-time setup'}</h2><p class="small muted" style="margin:-6px 0 12px">Canvas blocks access tokens at Habib, so this uses your own login on the Canvas page instead. It only reads, and it only shows the result on screen.</p>
  <ol class="small" style="margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li>Copy the code below.</li><li>In your computer’s browser, bookmark any page, then edit the bookmark and paste this code as its address. Name it “Atlas export”.</li><li>Open hulms.instructure.com while signed in and click that bookmark.</li><li>Copy the box that appears and paste it below.</li></ol>
  <textarea id="bm-code" rows="3" readonly class="mono small">${esc(bmCode())}</textarea><div class="row" style="margin-top:8px"><button class="btn" data-a="copybm">Copy code</button></div></div>
  <div class="card" style="margin-top:16px"><h2>Paste the export</h2><textarea id="cv-text" rows="5" data-c="cvtext" placeholder="Paste here">${esc(y)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-a="cvread">Read export</button><span class="small" style="color:var(--bad)">${esc(U.cvErr||'')}</span></div></div>`+
  (list.length?`<div class="card" style="margin-top:16px"><h2>Match to your courses</h2><div class="scroll"><table class="t"><thead><tr><th>In Canvas</th><th class="r">Items</th><th>Your course</th></tr></thead><tbody>${list.map((cv,i)=>`<tr><td>${esc(cv.name)}</td><td class="r mono">${cv.groups.reduce((a,g)=>a+g.items.length,0)}</td><td><select data-c="cvmap" data-i="${i}">${opts(cv.target)}</select></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><button class="btn primary" data-a="cvapply">Import into the matched courses</button></div><p class="small muted">Scores and dates you already have are kept when Canvas has nothing newer. Items that do not fit a group go into “Unsorted from Canvas” with no weight, so they never change your grade until you move them.</p></div>`:'');
}
const ACT2={
  copybm(){const t=$('#bm-code');if(!t)return;t.select();let ok=false;try{ok=navigator.clipboard&&navigator.clipboard.writeText(t.value)}catch(e){}Promise.resolve(ok).then(()=>toast('Code copied'),()=>toast('Press Ctrl+C to copy the selected code'))},
  cvread(){
    const t=($('#cv-text')||{}).value||U.cvText||'';U.cvText=t;U.cvErr='';
    try{const j=JSON.parse(t.trim());if(!j||!Array.isArray(j.courses)||!j.courses.length)throw 0;U.cv=j.courses.map(cv=>Object.assign({},cv,{teachers:cv.teachers||[],groups:cv.groups||[],target:cvMatch(cv)}))}
    catch(e){U.cv=[];U.cvErr='That does not look like an Atlas export. Copy the whole box again.'}
    render();
  },
  cvapply(){const r=cvApply();U.cv=[];U.cvText='';persist();toast(`Updated ${r.upd} items, added ${r.add}${r.un?`, ${r.un} unsorted`:''}`);render()},
};
const CHG2={cvmap(e,d,v){U.cv[+d.i].target=v},cvtext(e,d,v){U.cvText=v}};

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
  return`<details class="card sec"><summary>Transcript</summary><div class="row" style="margin-bottom:14px"><button class="btn" data-a="trcsv">Download CSV</button><button class="btn" data-a="trpdf">Download PDF</button></div>${T.map(t=>`<div style="margin-bottom:16px"><div class="row between"><h3>${esc(t.name)}${t.cr?' <span class="pill">credit / no credit</span>':t.status==='current'?' <span class="pill acc">in progress</span>':''}</h3><span class="mono small muted">${t.credits} cr${t.tg!=null?' · GPA '+fmt(t.tg):''}${t.cg!=null?' · cumulative '+fmt(t.cg):''}</span></div><div class="scroll"><table class="t"><tbody>${t.rows.map(r=>`<tr><td class="mono small" style="white-space:nowrap">${esc(r.code)}</td><td>${esc(r.title)}${r.note?` <span class="pill">${r.note}</span>`:''}</td><td class="r mono">${r.cr}</td><td class="r mono">${esc(r.grade)}</td></tr>`).join('')}</tbody></table></div></div>`).join('')||'<div class="empty">Finished and current terms appear here.</div>'}</details>`;
}
Object.assign(ACT2,{
  trcsv(){saveFile('atlas-transcript.csv',transcriptCsv()).then(()=>toast('Transcript saved'),e=>{if(!e||e.code!=='declined')toast('The file could not be saved')})},
  async trpdf(){try{const buf=await transcriptPdf();await saveFile('atlas-transcript.pdf',buf);toast('Transcript saved')}catch(e){if(!e||e.code!=='declined')toast('The PDF could not be made. Try the CSV.')}},
});
