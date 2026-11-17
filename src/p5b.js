
/* ---------- shell and render ---------- */
const ROUTES=[['overview','Overview','#overview'],['courses','Courses','#courses'],['plan','Plan','#grid'],['gpa','GPA lab','#gpa'],['settings','Settings','#settings']];
const VIEWS={overview:vOverview,courses:vCourses,plan:vPlan,gpa:vGpa,add:vAdd,canvas:vCanvas,settings:vSettings};
function render(){
  const app=$('#app');if(!app)return;
  const sy=window.scrollY,dr=$('.drawer'),dy=dr?dr.scrollTop:0,ae=document.activeElement;
  let view='';try{view=(VIEWS[U.route]||vOverview)()}catch(e){view='<div class="empty">Something in your data could not be shown. Download a backup from Settings and restore it, or erase and start again.<br><small>'+esc(e&&e.message)+'</small></div>';console.error(e)}
  app.innerHTML=`<div class="shell"><aside class="side"><div class="brand"><i>Atlas</i><small>${esc(S.settings.school||'Degree planner')}</small></div><nav class="nav" aria-label="Sections">${ROUTES.map(r=>`<a href="${r[2]}" ${U.route===r[0]||(r[0]==='courses'&&(U.route==='add'||U.route==='canvas'))?'aria-current="page"':''}>${r[1]}</a>`).join('')}</nav><div class="sidefoot">${esc(U.sync||'')}</div></aside><main class="main">${view}</main></div>${U.course?drawer():''}${U.toast?`<div class="toast" role="status">${esc(U.toast)}</div>`:''}`;
  window.scrollTo(0,sy);const nd=$('.drawer');if(nd)nd.scrollTop=dy;
}
function toast(t){U.toast=t;render();clearTimeout(toast.t);toast.t=setTimeout(()=>{U.toast='';render()},2200)}
function routeFromHash(){const h=(location.hash||'').replace('#','');
  if(h==='grid'||h==='roadmap'||h==='req'||h==='enroll'){U.route='plan';U.planTab=h}else U.route=VIEWS[h]?h:'overview';
  U.course=null;render();window.scrollTo(0,0)}

/* ---------- helpers that work inside Claude and in a downloaded copy ---------- */
const cap=n=>{try{return window.claude&&window.claude.use?Promise.resolve(window.claude.use(n)).catch(()=>null):Promise.resolve(null)}catch(e){return Promise.resolve(null)}};
const LSAI='course-atlas.ai';let AI={key:'',model:'gemini-2.5-flash'};
async function saveFile(name,data){
  if(window.atlasHost&&window.atlasHost.saveFile){const r=await window.atlasHost.saveFile(name,data);if(r&&r.canceled)throw{code:'declined'};return}
  const dl=await cap('downloads');
  if(dl){await dl.save({filename:name,data});return}
  const type=/\.pdf$/.test(name)?'application/pdf':/\.csv$/.test(name)?'text/csv':'application/json';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
const b64=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(f)});
async function callAI(prompt,images){
  if(U.hasSample){const sp=await cap('sample');return await sp.json(prompt,images.length?{images}:{})}
  if(AI.key){
    const parts=[{text:prompt}];
    for(const f of images)parts.push({inline_data:{mime_type:f.type||'image/jpeg',data:await b64(f)}});
    let r;
    try{r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(AI.model||'gemini-2.5-flash')+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':AI.key},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:0}})})}catch(e){throw{code:'network'}}
    if(!r.ok){let m='';try{m=((await r.json()).error||{}).message||''}catch(x){}if(r.status===400&&/api key|API_KEY/i.test(m)||r.status===403)throw{code:'bad_key',status:r.status};throw{code:r.status===429?'rate_limited':'upstream_error',status:r.status,message:m}}
    const j=await r.json(),ps=(((j.candidates||[])[0]||{}).content||{}).parts||[],t=ps.map(p=>p.text||'').join('');
    try{return JSON.parse(t)}catch(e){const m=t.match(/[\{\[][\s\S]*[\}\]]/);if(m){try{return JSON.parse(m[0])}catch(x){}}throw{code:'invalid_json'}}
  }
  throw{code:'no_ai'};
}

/* ---------- actions ---------- */
const splitList=v=>String(v||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():''};
function termNames(first,season,n){const out=[];let y=first,s=season;for(let i=0;i<n;i++){out.push(s+' '+y);if(s==='Fall'){s='Spring';y++}else s='Fall'}return out}
function nextCatKey(){return 'c'+uid()}
const ACT={
  go(e,d){location.hash=d.v},
  open(e,d){U.course=d.id;U.tab='assess';render()},
  close(){U.course=null;render()},
  closebg(e){if(e.target.classList.contains('veil')){U.course=null;render()}},
  tab(e,d){e.preventDefault();U.tab=d.v;render()},
  sel(e,d){U.sel=(d.id&&U.sel!==d.id)?d.id:null;render()},
  hidedone(){U.hideDone=!U.hideDone;render()},
  allterms(){U.allTerms=!U.allTerms;render()},
  cview(e,d){U.cview=d.v;render()},
  setup(){
    const n=Math.max(2,Math.min(14,parseInt(val('su-n'))||8)),dn=Math.max(0,Math.min(n,parseInt(val('su-done'))||0));
    const names=termNames(parseInt(val('su-year'))||new Date().getFullYear(),val('su-season')||'Fall',n);
    const base=blank();base.settings.program=val('su-prog');base.settings.school=val('su-school');base.settings.totalCredits=parseInt(val('su-cr'))||130;
    base.terms=names.map((nm,i)=>({id:'t'+uid(),name:nm,status:i<dn?'done':i===dn?'current':'planned'}));
    S=base;persist();render();
  },
  loadsample(){S=seed();persist();render()},
  addgroup(e,d){mut(()=>{getC(d.id).assess.push({id:uid(),n:'New group',type:'Assignment',w:0,cnt:1,drop:0,items:[]})})},
  delgroup(e,d){mut(()=>{const c=getC(d.id);c.assess=c.assess.filter(g=>g.id!==d.gid)})},
  additem(e,d){mut(()=>{const g=getC(d.id).assess.find(x=>x.id===d.gid);g.items.push({id:uid(),n:g.n+' '+(g.items.length+1),s:null,m:100,due:'',st:'',late:false})})},
  delitem(e,d){mut(()=>{const g=getC(d.id).assess.find(x=>x.id===d.gid);g.items=g.items.filter(i=>i.id!==d.iid)})},
  delcourse(e,d){mut(()=>{S.courses=S.courses.filter(c=>c.id!==d.id);U.course=null})},
  wireset(){U.whatif={};render()},
  addterm(){mut(()=>S.terms.push({id:'t'+uid(),name:'New term',status:'planned'}))},
  delterm(e,d){mut(()=>{S.courses.forEach(c=>{if(c.term===d.id)c.term=null});S.terms=S.terms.filter(t=>t.id!==d.id)})},
  termUp(e,d){mut(()=>{const i=termIdx(d.id);if(i>0){const t=S.terms.splice(i,1)[0];S.terms.splice(i-1,0,t)}})},
  addcat(){mut(()=>S.settings.cats.push({k:nextCatKey(),n:'New category',req:0}))},
  delcat(e,d){mut(()=>{S.settings.cats=S.settings.cats.filter(k=>k.k!==d.id)})},
  addgrade(){mut(()=>S.settings.scale.push({l:'?',p:0,min:0}))},
  delgrade(e,d){mut(()=>S.settings.scale.splice(+d.i,1))},
  resetscale(){mut(()=>{S.settings.scale=DEF_SCALE.map(x=>Object.assign({},x))})},
  askreset(){U.confirmReset=true;render()},noreset(){U.confirmReset=false;render()},
  resetall(){U.confirmReset=false;S=blank();U.course=null;persist();location.hash='overview';render()},
  manual(){
    const code=val('ma-code'),title=val('ma-title');if(!code||!title)return toast('Add a code and a title');
    const c={id:uid(),code,title,credits:num(val('ma-cr'))||3,term:val('ma-term')||null,cat:val('ma-cat'),prereqs:splitList(val('ma-pre')),grade:null,assess:[],notes:'',instructor:''};
    mut(()=>S.courses.push(c));U.course=c.id;U.tab='assess';render();
  },
  async export(){
    try{await saveFile('course-atlas-backup.json',JSON.stringify(S,null,2));toast('Backup saved')}catch(e){if(!e||e.code!=='declined')toast('The backup could not be saved')}
  },
  sylClearImg(){U.syl.files=[];render()},
  sylDiscard(){U.syl.out=null;render()},
  sylDel(e,d){U.syl.out.assessments.splice(+d.i,1);render()},
  sylRow(){U.syl.out.assessments.push({name:'',type:'Assignment',weight:0,count:1,drop:0});render()},
  sylAdd(){
    const o=U.syl.out;if(!o.code||!o.title)return toast('The course needs a code and a title');
    const c={id:uid(),code:o.code,title:o.title,credits:o.credits||3,term:o.term||null,cat:o.cat||S.settings.cats[0].k,prereqs:o.prereqs,grade:null,instructor:o.instructor||'',notes:o.notes||'',assess:o.assessments.filter(a=>a.name||a.weight).map(a=>{const n=Math.max(1,+a.count||1);return{id:uid(),n:a.name||'Group',type:a.type,w:+a.weight||0,cnt:n,drop:+a.drop||0,items:Array.from({length:n},(_,i)=>({id:uid(),n:n>1?(a.name||'Item')+' '+(i+1):(a.name||'Item'),s:null,m:100,due:'',st:'',late:false}))}})};
    S.courses.push(c);U.syl={text:'',files:[],out:null,err:'',loading:false,term:U.syl.term,msg:''};persist();U.course=c.id;U.tab='assess';render();
  },
  async sylRead(){
    const y=U.syl;y.text=($('#syl-text')||{}).value||y.text;y.term=val('syl-term');
    if(!y.text.trim()&&!y.files.length){y.err='Paste the syllabus text or attach a file first.';return render()}
    y.err='';y.loading=true;y.out=null;render();
    const prompt=`You are reading a university course syllabus and turning it into data. Reply with only one JSON object, no other text, shaped exactly like:
{"code":"EE 301","title":"Electronics","credits":3,"instructor":"","prereqs":["EE 202"],"assessments":[{"name":"Quizzes","type":"Quiz","weight":20,"count":4,"drop":0}],"notes":""}
Rules:
- "type" must be one of: ${ATYPES.join(', ')}.
- Each assessment is one group of similar items, for example all quizzes. "weight" is the TOTAL percentage of the course grade for the whole group, not per item.
- "count" is how many items are in the group (for example 4 quizzes). Use 1 for a single exam or project. If the syllabus says the lowest scores are dropped, or only the best N count (often written n-2), put the number dropped in "drop".
- "prereqs" lists course codes only. Use an empty array when none are stated.
- "credits" is a number. If the syllabus gives contact hours but no credits, use 3.
- "notes" is one short sentence on grading policies that change the maths (drop lowest, best of, late penalties, attendance rules). Empty string if none.
- Never invent a value the syllabus does not support. Use an empty string or 0.
${y.files.length?'The attached images are pages of the syllabus.\n':''}
SYLLABUS TEXT:
${y.text.slice(0,120000)||'(see the attached images)'}`;
    try{
      const o=await callAI(prompt,y.files);
      if(!o||typeof o!=='object'||Array.isArray(o))throw {code:'invalid_json'};
      const cur=S.settings.cats;
      y.out={code:String(o.code||'').trim(),title:String(o.title||'').trim(),credits:num(o.credits)||3,instructor:String(o.instructor||''),notes:String(o.notes||''),
        prereqs:Array.isArray(o.prereqs)?o.prereqs.map(String):splitList(o.prereqs),cat:cur[0]?cur[0].k:'',term:y.term||'',
        assessments:(Array.isArray(o.assessments)?o.assessments:[]).map(a=>({name:String(a.name||''),type:ATYPES.includes(a.type)?a.type:'Other',weight:num(a.weight)||0,count:Math.max(1,Math.round(num(a.count)||1)),drop:Math.max(0,Math.round(num(a.drop)||0))}))};
      if(!y.out.assessments.length)y.err='No grading breakdown was found. You can add rows by hand below.';
    }catch(e){
      const c=e&&e.code;y.err=c==='no_ai'?'No syllabus reader is set up. Add a Gemini key in Settings, or add the course by hand.':c==='bad_key'?'Gemini did not accept the key. Check it in Settings.':c==='network'?'Could not reach Gemini. This works from the downloaded file, not inside Claude’s page.':c==='not_granted'?'Claude is not allowed on this page, so the syllabus could not be read. You can still add the course by hand.':c==='rate_limited'?'Too many requests just now. Try again in a minute.':c==='invalid_json'?'The reply could not be turned into a course. Try again, or paste only the grading and schedule sections.':c==='image_rejected'?'One of the images could not be used. Try a clearer photo.':'The syllabus could not be read'+(c?' ('+(typeof c==='string'?c:'error')+(e&&e.status?' '+e.status:'')+')':e&&e.message?' ('+e.message+')':'')+'. If you are inside Claude’s page this is usually because outside requests are blocked there. Try the downloaded copy of Atlas, or add the course by hand.';
    }
    y.loading=false;render();
  }
};
function parseCoursesField(c,f,v){
  if(f==='credits'){c.credits=num(v)||0}
  else if(f==='term'){c.term=v||null}
  else if(f==='prereqs'){c.prereqs=splitList(v)}
  else if(f==='coreqs'){c.coreqs=splitList(v)}
  else if(f==='grade'){c.grade=v||null}
  else if(f==='code'){const old=c.code;c.code=v.trim()||old;S.courses.forEach(o=>{o.prereqs=(o.prereqs||[]).map(p=>NC(p)===NC(old)?c.code:p)});S.minors.forEach(mn=>(mn.slots||[]).forEach(sl=>{sl.opts=(sl.opts||[]).map(p=>NC(p)===NC(old)?c.code:p)}))}
  else c[f]=v;
}
const CHG={
  gr(e,d,v){const g=getC(d.id).assess.find(x=>x.id===d.gid);g[d.f]=['w','cnt','drop'].includes(d.f)?(num(v)||0):v},
  it(e,d,v){const g=getC(d.id).assess.find(x=>x.id===d.gid),it=g.items.find(x=>x.id===d.iid);if(d.f==='s')it.s=num(v);else if(d.f==='m')it.m=num(v);else it[d.f]=v},
  cf(e,d,v){const c=getC(d.id);parseCoursesField(c,d.f,v)},
  set(e,d,v){S.settings[d.f]=['totalCredits','maxLoad'].includes(d.f)?(parseInt(v)||0):d.f==='targetGpa'?(num(v)||0):d.f==='retakeReplaces'?(v!=='no'):d.f==='capOwn'?(v==='yes'):v},
  tf(e,d,v){termOf(d.id)[d.f]=d.f==='cr'?v==='1':v},
  kf(e,d,v){const k=S.settings.cats.find(x=>x.k===d.id);k[d.f]=d.f==='req'?(num(v)||0):v},
  sf(e,d,v){const g=S.settings.scale[+d.i];g[d.f]=d.f==='l'?v.trim():(num(v)||0)},
  syl(e,d,v){const o=U.syl.out;o[d.f]=d.f==='credits'?(num(v)||0):d.f==='prereqs'?splitList(v):v},
  sylA(e,d,v){const a=U.syl.out.assessments[+d.i];a[d.f]=['weight','count','drop'].includes(d.f)?(num(v)||0):v},
  wi(e,d,v){if(v)U.whatif[d.id]=v;else delete U.whatif[d.id]},
  wiall(e,d,v){if(v){curCourses().concat(planCourses()).filter(c=>!U.wiTerm||U.wiTerm==='all'||c.term===U.wiTerm).forEach(c=>U.whatif[c.id]=v)}},
};
async function onFiles(e){
  const files=Array.from(e.target.files||[]),y=U.syl;let msg=[];
  for(const f of files){
    try{
      if(/^image\//.test(f.type)){if(y.files.length<(U.imgMax||0))y.files.push(f);else msg.push('Too many images; kept the first '+U.imgMax)}
      else if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){try{y.text+=(y.text?'\n\n':'')+await pdfText(f)}catch(pe){if(AI.key&&!U.hasSample){y.files.push(f.type?f:new File([f],f.name,{type:'application/pdf'}));msg.push(f.name+' will be sent to Gemini as a PDF.')}else throw pe}}
      else y.text+=(y.text?'\n\n':'')+await f.text();
    }catch(err){msg.push('Could not read '+f.name+(err&&err.message?' ('+err.message+')':'')+(/pdf/i.test(f.name)?'. Copy the text out of the PDF and paste it instead.':''))}
  }
  y.msg=msg.join(' ');render();
}
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load'));document.head.appendChild(s)})}
async function pdfText(file){
  const B='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  if(!window.pdfjsLib)await loadScript(B+'pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=B+'pdf.worker.min.js';
  const doc=await Promise.race([window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,new Promise((_,r)=>setTimeout(()=>r(new Error('slow')),25000))]);
  let out='';for(let i=1;i<=Math.min(doc.numPages,25);i++){const p=await doc.getPage(i);const t=await p.getTextContent();out+=t.items.map(x=>x.str).join(' ')+'\n'}
  if(out.replace(/\s/g,'').length<80)throw new Error('empty');return out;
}
async function onImport(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  try{const o=JSON.parse(await f.text());if(!o||!Array.isArray(o.terms)||!Array.isArray(o.courses)||!o.settings)throw 0;
    const b=blank();S=Object.assign(b,o,{settings:Object.assign(b.settings,o.settings)});S.sample=!!o.sample;persist();render();toast('Backup restored')}
  catch(err){toast('That file is not an Atlas backup')}
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  if(e.target.closest('select,input,textarea'))return;
  const el=e.target.closest('[data-a]');if(!el)return;
  const f=ACT[el.dataset.a]||ACT2[el.dataset.a];if(!f)return;
  if(el.dataset.a==='closebg'&&e.target!==el)return;
  if(el.tagName==='A'&&el.getAttribute('href')==='#')e.preventDefault();
  f(e,el.dataset);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&U.course){U.course=null;render()}
  if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('g.nd')){e.preventDefault();ACT.sel(e,e.target.closest('g.nd').dataset)}
});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.c==='syltext')U.syl.text=e.target.value});
document.addEventListener('change',e=>{
  const t=e.target,k=t.dataset&&t.dataset.c;if(!k)return;
  if(k==='syltext'){U.syl.text=t.value;return}
  if(k==='sylf'){onFiles(e);return}
  if(k==='impf'){onImport(e);return}
  if(k==='enrf'){onOffers(e);return}
  if(k==='ai'){AI[t.dataset.f]=t.value.trim();try{localStorage.setItem(LSAI,JSON.stringify(AI))}catch(x){}U.imgMax=U.hasSample?U.imgMax:(AI.key?8:0);render();return}
  const f=CHG[k]||CHG2[k];if(!f)return;
  try{f(e,t.dataset,t.value)}catch(err){console.error(err);return}
  if(k==='syl'||k==='sylA'||k==='wi'||k==='wiall'||k==='enrterm'||k==='enrq'||k==='mpick'||k==='enrpref'){render();return}
  persist();render();
});
let dragId=null;
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('[data-drag]');if(!c)return;dragId=c.dataset.drag;try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(x){}});
document.addEventListener('dragover',e=>{const t=e.target.closest&&e.target.closest('[data-drop]');if(!t||!dragId)return;e.preventDefault();document.querySelectorAll('.term.over').forEach(x=>{if(x!==t)x.classList.remove('over')});t.classList.add('over')});
document.addEventListener('drop',e=>{const t=e.target.closest&&e.target.closest('[data-drop]');document.querySelectorAll('.term.over').forEach(x=>x.classList.remove('over'));if(!t||!dragId)return;e.preventDefault();const c=getC(dragId);dragId=null;if(c){c.term=t.dataset.drop||null;persist();render()}});
document.addEventListener('dragend',()=>{dragId=null;document.querySelectorAll('.term.over').forEach(x=>x.classList.remove('over'))});
window.addEventListener('hashchange',routeFromHash);

/* ---------- saving ---------- */
const LS='course-atlas.v1';
let dbDoc=null,timer=null,saving=false,pendingSave=false;
function setSync(t){U.sync=t;const f=$('.sidefoot');if(f)f.textContent=t}
persist=function(){
  U.touched=true;
  try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
  if(HOST){setSync('Saving…');clearTimeout(timer);timer=setTimeout(()=>HOST.save(JSON.stringify(S)).then(()=>setSync('Saved on this computer'),()=>setSync('Could not save to the data file')),400);return}
  if(!dbDoc){setSync('Saved in this browser');return}
  setSync('Saving…');clearTimeout(timer);timer=setTimeout(flush,700);
};
async function flush(){
  if(!dbDoc)return;
  if(saving){pendingSave=true;return}
  saving=true;
  try{await dbDoc.set({state:JSON.stringify(S),at:Date.now()});setSync('Saved to your account')}
  catch(e){setSync('Saved in this browser only')}
  saving=false;if(pendingSave){pendingSave=false;flush()}
}
function migrateCourse(c){c.assess=(c.assess||[]).map(a=>a.items?a:{id:a.id||uid(),n:a.n,type:a.type||'Other',w:+a.w||0,cnt:1,drop:0,items:[{id:uid(),n:a.n,s:a.s==null?null:+a.s,m:100,due:a.due||'',st:'',late:false}]});if(!c.coreqs)c.coreqs=[]}
function migrateMinor(m){
  if(Array.isArray(m.slots)){m.slots.forEach(s=>{if(!s.ids){s.ids=s.courseId?[s.courseId]:[];delete s.courseId}});return m}
  return{id:m.id||uid(),name:m.name,unit:'',credits:+m.credits||0,minGrade:'',note:'',slots:(m.codes||[]).map(c=>({id:uid(),label:'',opts:[c],cr:3,pick:0,ids:[]}))};
}
function upgrade(o){
  const b=blank(),st=Object.assign(b,o,{settings:Object.assign(b.settings,o.settings||{})});
  if(!o.v||o.v<3){
    /* older saved plans are rebuilt from the current starting plan, keeping any final grades and settings you had entered */
    const old={};(o.courses||[]).forEach(c=>{const t=(o.terms||[]).find(x=>x.id===c.term);if(c.grade)old[NC(c.code)+'|'+(t?t.name:'')]=c.grade});
    const ns=seed();ns.courses.forEach(c=>{const t=ns.terms.find(x=>x.id===c.term),g=old[NC(c.code)+'|'+(t?t.name:'')];if(g&&!c.grade)c.grade=g});
    if(o.settings&&o.settings.targetGpa)ns.settings.targetGpa=o.settings.targetGpa;
    return ns;
  }
  st.courses.forEach(migrateCourse);
  st.minors=(st.minors||[]).map(migrateMinor);
  if(st.minors.length)ensureMinorCat(st.settings);
  if(!st.settings.unit&&/habib/i.test(st.settings.school||''))st.settings.unit='DSSE';
  st.v=4;return st;
}
function adopt(o){S=upgrade(o);S.sample=false}
async function boot(){
  let local=null;try{const r=localStorage.getItem(LS);if(r)local=JSON.parse(r)}catch(e){}
  if(HOST){try{HC=await HOST.config()}catch(e){}try{const r=await HOST.load();if(r){const o=JSON.parse(r);if(o&&Array.isArray(o.terms)&&!o.sample)local=o}}catch(e){}}
  try{const a=localStorage.getItem(LSAI);if(a)AI=Object.assign(AI,JSON.parse(a))}catch(e){}
  if(local&&Array.isArray(local.terms)&&!local.sample){const was=local.v;adopt(local);if(!was||was<3)try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}setSync(HOST?'Saved on this computer':'Saved in this browser');if(HOST)HOST.save(JSON.stringify(S))}
  else{S=seed();try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}setSync(HOST?'Saved on this computer':'Saved in this browser');if(HOST)HOST.save(JSON.stringify(S))}
  routeFromHash();
  try{const sp=await cap('sample');U.hasSample=!!sp;if(sp&&sp.limits){const l=await sp.limits().catch(()=>null);U.imgMax=l&&l.images?l.images.maxCount:0}else U.imgMax=AI.key?8:0}catch(e){}
  render();
  try{
    const [db,user]=await Promise.all([cap('db'),cap('user')]);
    const id=user?await user.id():null;
    if(!db||!id)return;
    const ref=db.doc('data/users/'+id+'/planner');
    const snap=await Promise.race([ref.get(),new Promise((_,r)=>setTimeout(()=>r(new Error('slow')),10000))]);
    dbDoc=ref;
    let o=null;if(snap.exists&&snap.data().state){try{o=JSON.parse(snap.data().state)}catch(e){}}
    if(o&&!o.sample&&Array.isArray(o.terms)){if(!U.touched){adopt(o);setSync('Saved to your account');render();if(!o.v||o.v<3)flush()}else flush()}
    else flush();
  }catch(e){setSync('Saved in this browser')}
}
boot();
})();
</script>
