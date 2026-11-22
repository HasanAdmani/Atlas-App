
/* ---------- Canvas sync, PSCS reconciliation & universal bookmarklet ---------- */
const atlasBaseUrl=()=>{
  if(typeof IS_WEB!=='undefined'&&IS_WEB)return location.origin+(typeof WEB_BASE==='string'?WEB_BASE:'')+'/';
  return (typeof HC!=='undefined'&&HC&&HC.serverUrl)?HC.serverUrl.replace(/\/+$/,'')+'/':'';
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
      if(doc.body&&doc.body.innerText)texts.push(doc.body.innerText.slice(0,30000));
    });
    const loc=location.hostname+' '+location.href;
    const kind=/stellic/i.test(loc)?'stellic':/pscs|peoplesoft/i.test(loc)?'pscs':'syllabus';
    payload={v:2,kind,at:Date.now(),url:location.href,title:document.title,tables,text:texts.join('\n')};
  }
  const j=JSON.stringify(payload);
  const b64=btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const target=ATLAS_URL?(ATLAS_URL+'#import/'+b64):'';
  try{await navigator.clipboard.writeText(j)}catch(e){}
  if(target&&b64.length<120000){try{window.open(target,'_blank')}catch(e){}}
  const d=document.createElement('div');d.style.cssText='position:fixed;z-index:99999;right:18px;top:18px;width:min(420px,90vw);background:#fff;color:#111;padding:16px;border:2px solid #2945B8;border-radius:12px;font:14px system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)';
  d.innerHTML='<b>Exported for Atlas ('+payload.kind+')</b><p style="margin:6px 0 10px;font-size:13px;color:#444">'+(target?'If Atlas did not open automatically, click below or copy the export text.':'Copied to clipboard! Paste the export text below into Atlas → Setup Guide or Sync &amp; Import.')+'</p>'+(target&&b64.length<120000?'<p><a href="'+target+'" target="_blank" style="display:inline-block;padding:8px 14px;background:#2945B8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open in Atlas →</a></p>':'')+'<textarea style="width:100%;height:110px;font:12px monospace"></textarea><p style="margin:8px 0 0"><button>Close</button></p>';
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
function guessCat(code){
  const cats=S.settings.cats||[];if(!cats.length)return 'core';
  const sub=(String(code||'').trim().match(/^([A-Za-z]+)/)||['',''])[1].toUpperCase();
  const findKey=rxs=>{for(const rx of rxs){const hit=cats.find(c=>rx.test((c.k||'')+' '+(c.n||'')));if(hit)return hit.k}return''};
  if(/^(CORE|HUM|HIST|URDU|ISLM|PHIL|ARAB|LIT|REL)$/.test(sub))return findKey([/\bcore\b|habib|liberal/i,/\bgen/i])||cats[0].k;
  if(/^(SOC|ANTH|ECON|POL|SDP|COM|CND|DES|ART)$/.test(sub))return findKey([/\bgen/i,/hum|soc|design/i,/\belec/i,/\bcore\b/i])||cats[0].k;
  if(/^(MATH|MTH|PHY|BIO|CHEM)$/.test(sub))return findKey([/\bmath\b|science|computing/i,/\bmajor\b/i,/tech|eng/i])||cats[0].k;
  if(/^(EE|CE|CS|ENGR|DS|ME)$/.test(sub))return findKey([new RegExp('\\b'+sub+'\\b','i'),/\bmajor\b/i,/engineering|computing|tech/i])||cats[0].k;
  return cats[0].k;
}
function cvParseCode(cv){
  const src=(cv.code||'')+' '+(cv.name||'');
  const m=src.match(/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/i);
  if(m)return (m[1]+' '+m[2]).toUpperCase();
  const c=String(cv.code||'').trim().split(/[-–—]/)[0].trim();
  return c?c.slice(0,14):'COURSE';
}
function cvCleanTitle(cv,code){
  let t=String(cvBase(cv.name||'')||cv.name||'').trim();
  if(code){const re=new RegExp('^'+code.replace(/\s+/g,'\\s*[- ]?')+'\\s*[:\\-–—·]*\\s*','i');t=t.replace(re,'').trim()}
  return t||cv.name||code||'Untitled Course';
}
function cvApply(){
  let upd=0,add=0,un=0,crt=0;
  S.links=S.links||{canvas:{at:0,map:{}},pscs:{at:0}};
  S.links.canvas=S.links.canvas||{at:0,map:{}};
  S.links.canvas.map=S.links.canvas.map||{};
  const creating=(U.cv||[]).some(cv=>cv.target==='__new__');
  if(creating&&!S.terms.length){
    if(!S.settings.school)S.settings.school='Habib University';
    if(!S.settings.program)S.settings.program='My Degree Plan';
    if(/habib/i.test(S.settings.school))S.settings.scale=HABIB_SCALE.map(x=>Object.assign({},x));
  }
  (U.cv||[]).forEach(cv=>{
    let c=null;
    if(cv.target==='__new__'){
      const code=cvParseCode(cv),title=cvCleanTitle(cv,code);
      const tName=parseTermTok(cv.term||cv.name||'')||('Current Term');
      const t=ensureTerm(tName,'current');
      const isLab=/\d{3}L\b|\blab\b/i.test(code+' '+title);
      c={id:uid(),code,title,credits:isLab?1:3,term:t?t.id:null,cat:guessCat(code),prereqs:[],coreqs:[],grade:null,assess:[],notes:'',instructor:(cv.teachers||[]).join(', '),canvasId:cv.id||''};
      S.courses.push(c);crt++;
    }else{
      c=getC(cv.target);
    }
    if(!c)return;
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
  return{upd,add,un,crt};
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
function parseTermTok(s){
  const m=String(s||'').match(/\b(Fall|Spring|Summer)\s+(\d{4})\b/i);
  return m?(m[1][0].toUpperCase()+m[1].slice(1).toLowerCase()+' '+m[2]):'';
}
function termSortKey(name){
  const m=String(name||'').match(/\b(Spring|Summer|Fall)\s+(\d{4})\b/i);
  if(!m)return 999999;
  const ord={spring:1,summer:2,fall:3}[m[1].toLowerCase()]||0;
  return parseInt(m[2],10)*10+ord;
}
function ensureTerm(name,defaultStatus){
  const nm=String(name||'').trim();if(!nm)return null;
  let t=S.terms.find(x=>String(x.name||'').toLowerCase()===nm.toLowerCase());
  if(!t){
    t={id:'t'+uid(),name:nm,status:defaultStatus||'planned'};
    S.terms.push(t);
    S.terms.sort((a,b)=>termSortKey(a.name)-termSortKey(b.name));
  }
  return t;
}
function parsePscsGrades(obj){
  const valid=new Set(['CR','NC','W','IP','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']);
  (S.settings.scale||[]).forEach(x=>{if(x.l)valid.add(String(x.l).toUpperCase())});
  const codeRe=/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/i;
  const gradeTok=s=>{const u=String(s||'').trim().toUpperCase();return valid.has(u)?u:''};
  const found={};
  const consider=(codeStr,gStr,rowText,cells)=>{
    if(!codeStr||!gStr)return;
    const normCode=codeStr.toUpperCase().replace(/\s+/,' ');
    const key=NC(normCode);
    const termGuess=parseTermTok(rowText);
    const cands=S.courses.filter(c=>NC(c.code)===key);
    if(cands.length){
      const c=cands.find(x=>termGuess&&termOf(x.term)&&(termOf(x.term).name||'').toLowerCase()===termGuess.toLowerCase())||cands.find(x=>status(x)==='done')||cands[0];
      const gradeVal=gStr==='IP'?'':gStr;
      found[c.id]={id:c.id,code:c.code,title:c.title,term:(termOf(c.term)||{}).name||'Catalog',curGrade:c.grade||'',pscsGrade:gradeVal,status:!c.grade&&gradeVal?'new':(c.grade===gradeVal?'match':'diff'),apply:!!gradeVal&&(!c.grade||c.grade!==gradeVal),create:false};
      return;
    }
    const crMatch=rowText.match(/\b([0-6](?:\.\d+)?)\s*(?:cr|credits?|units?)\b/i)||(cells||[]).map(x=>x.match(/^[0-6](?:\.0+)?$/)).find(Boolean);
    const cr=crMatch?parseFloat(crMatch[1]||crMatch[0]):3;
    let title=(cells||[]).filter(c=>c&&!codeRe.test(c)&&!gradeTok(c)&&!/^[0-6](?:\.\d+)?$/.test(c)&&!parseTermTok(c)&&!/^(taken|transferred|in progress|enrolled)$/i.test(c)).sort((a,b)=>b.length-a.length)[0]||'';
    if(!title){
      title=rowText.replace(codeRe,'').replace(/\b(Fall|Spring|Summer)\s+\d{4}\b/gi,'').replace(/\b[0-6](?:\.\d+)?(?:\s*(?:cr|credits?|units?))?\b/gi,'').replace(new RegExp('\\b'+gStr.replace('+','\\+')+'\\b','gi'),'').replace(/\s+/g,' ').trim();
    }
    title=title||normCode;
    const tName=termGuess||'Imported Term';
    const uidKey='new:'+key+':'+tName.toLowerCase();
    found[uidKey]={id:uidKey,code:normCode,title:title.slice(0,80),credits:isNaN(cr)?3:cr,term:tName,curGrade:'',pscsGrade:gStr==='IP'?'':gStr,status:'create',apply:true,create:true};
  };
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{
    const cells=r.map(x=>String(x||'').trim());
    let code='';let g='';
    cells.forEach(cell=>{
      if(!code){const m=cell.match(codeRe);if(m)code=m[1]+' '+m[2]}
      const gt=gradeTok(cell);if(gt)g=gt;
    });
    if(code&&g)consider(code,g,cells.join(' '),cells);
  }));
  if(!Object.keys(found).length&&obj&&obj.text){
    let curTerm='';
    String(obj.text).split(/\r?\n/).forEach(line=>{
      const tm=parseTermTok(line);if(tm&&!codeRe.test(line))curTerm=tm;
      const m=line.match(codeRe);if(!m)return;
      const toks=line.trim().split(/[\s\t,|]+/);
      for(let i=toks.length-1;i>=0;i--){const gt=gradeTok(toks[i]);if(gt){consider(m[1]+' '+m[2],gt,line+(curTerm?' '+curTerm:''),line.split(/\t|\s{2,}/).map(x=>x.trim()));break}}
    });
  }
  return Object.values(found);
}
function parseStellicAudit(obj){
  const codeRe=/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/;
  const validG=new Set(['CR','NC','W','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']);
  const cats=[],courses=[],seenCourse=new Set();
  let curCat='core',curCatIdx=0;
  const addCat=(name,req)=>{
    const clean=String(name||'').replace(/\s+/g,' ').trim().slice(0,60);
    if(!clean||cats.some(c=>c.n.toLowerCase()===clean.toLowerCase()))return cats.find(c=>c.n.toLowerCase()===clean.toLowerCase()).k;
    const k='c'+cats.length+'_'+uid().slice(0,4);
    cats.push({k,n:clean,req:req||0,color:CAT_COLORS[curCatIdx++%CAT_COLORS.length]});
    return k;
  };
  const scanLine=(line,cells)=>{
    const s=String(line||'').trim();if(!s)return;
    const reqM=s.match(/^([A-Za-z][A-Za-z0-9 &\/\-–,]{3,55}?)\s*(?:\(|·|-|:)?\s*(\d{1,3})\s*(?:credits?|cr)\b/i);
    if(reqM&&!codeRe.test(s)){curCat=addCat(reqM[1],parseInt(reqM[2],10));return}
    const m=s.match(codeRe);if(!m)return;
    const code=(m[1]+' '+m[2]).toUpperCase();
    const termName=parseTermTok(s)||'Planned';
    const key=NC(code)+'|'+termName.toLowerCase();
    if(seenCourse.has(key))return;seenCourse.add(key);
    const crM=s.match(/\b([0-6](?:\.\d+)?)\s*(?:cr|credits?|units?)\b/i);
    const cr=crM?parseFloat(crM[1]):3;
    const toks=s.split(/[\s\t,|]+/);
    let grade='';for(let i=toks.length-1;i>=0;i--){const u=toks[i].toUpperCase();if(validG.has(u)){grade=u;break}}
    const st=/in[\s-]*progress|\bIP\b|enrolled/i.test(s)?'current':(/completed|passed|\bCR\b/i.test(s)||grade)?'done':'planned';
    let title=(cells&&cells.length>1?cells.find(x=>x&&!codeRe.test(x)&&!/^\d/.test(x)&&!parseTermTok(x)):s.replace(codeRe,'').replace(/\b\d+(?:\.\d+)?\s*(?:cr|credits?|units?)\b/gi,'').replace(/\b(Fall|Spring|Summer)\s+\d{4}\b/gi,'').replace(/^[\s\-–·:]+|[\s\-–·:]+$/g,''))||code;
    if(!cats.length)curCat=addCat('Degree Requirements',0);
    courses.push({code,title:String(title).trim().slice(0,80)||code,credits:isNaN(cr)?3:cr,termName,status:st,grade:grade||null,cat:curCat});
  };
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{const cells=r.map(x=>String(x||'').trim());scanLine(cells.join(' · '),cells)}));
  if(obj&&obj.text)String(obj.text).split(/\r?\n/).forEach(l=>scanLine(l,null));
  const totalCr=cats.reduce((a,c)=>a+(c.req||0),0)||courses.reduce((a,c)=>a+(c.credits||0),0)||134;
  return{title:String((obj&&obj.title)||'Stellic Degree Audit').replace(/\s*[-|].*$/,'').trim(),totalCredits:totalCr,cats,courses};
}
function applyStellicImport(prev){
  if(!prev||!prev.courses||!prev.courses.length)return 0;
  pushUndo('Stellic degree audit import');
  if(!S.terms.length){
    S.settings.program=prev.title||S.settings.program||'Degree Plan';
    S.settings.school=S.settings.school||'Habib University';
    S.settings.scale=HABIB_SCALE.map(x=>Object.assign({},x));
    S.settings.totalCredits=prev.totalCredits||134;
    if(prev.cats&&prev.cats.length)S.settings.cats=prev.cats;
  }else if(prev.cats&&prev.cats.length){
    prev.cats.forEach(c=>{if(!S.settings.cats.some(x=>x.n.toLowerCase()===c.n.toLowerCase()))S.settings.cats.push(c)});
  }
  let added=0;
  prev.courses.forEach(item=>{
    const t=ensureTerm(item.termName,item.status);
    const exists=S.courses.some(c=>NC(c.code)===NC(item.code)&&(!t||c.term===t.id));
    if(exists)return;
    S.courses.push({id:uid(),code:item.code,title:item.title,credits:item.credits,term:t?t.id:'',cat:item.cat||(S.settings.cats[0]&&S.settings.cats[0].k)||'core',prereqs:[],coreqs:[],grade:item.grade,assess:[],notes:'',instructor:''});
    added++;
  });
  return added;
}
function matchCourseByCodeOrTitle(code,title){
  const k=NC(code),t=nn(title);
  if(k){
    const hits=S.courses.filter(c=>NC(c.code)===k);
    if(hits.length)return (hits.find(c=>status(c)==='current')||hits.find(c=>status(c)==='planned')||hits[0]).id;
  }
  if(t){
    const hit=S.courses.find(c=>nn(c.title)===t||nn(c.title).includes(t)||t.includes(nn(c.title)));
    if(hit)return hit.id;
  }
  return '';
}
function parseSyllabusDeterministic(obj){
  const textLines=[];
  if(obj.title)textLines.push(obj.title);
  ((obj&&obj.tables)||[]).forEach(tb=>(tb.rows||[]).forEach(r=>{const line=r.map(x=>String(x||'').trim()).filter(Boolean).join(' · ');if(line)textLines.push(line)}));
  if(obj.text)textLines.push(obj.text);
  const fullText=textLines.join('\n').slice(0,120000);
  const codeM=fullText.match(/\b([A-Z]{2,5})\s*[- ]?(\d{3}[A-Z]?)\b/);
  const code=codeM?(codeM[1]+' '+codeM[2]).toUpperCase():'';
  const crM=fullText.match(/\b(?:credit(?:s|\s*hours?)?|units?)\s*[:\-–]?\s*([0-6](?:\.\d+)?)\b/i)||fullText.match(/\b([0-6](?:\.\d+)?)\s*(?:credit(?:s|\s*hours?)?|cr\.?)\b/i);
  const credits=crM?parseFloat(crM[1]):(/\d{3}L\b/i.test(code)?1:3);
  const insM=fullText.match(/(?:instructor|faculty|professor|taught by)\s*[:\-–]\s*([A-Z][A-Za-z .,'\-]{2,50})/i);
  const instructor=insM?insM[1].replace(/\s*(?:email|office|hours|phone|room).*$/i,'').trim():'';
  const assessments=[];
  const seen=new Set();
  const scanRow=(label,wStr)=>{
    const w=parseFloat(wStr),nm=String(label||'').replace(/\b\d+(?:\.\d+)?\s*%/g,'').replace(/[()\[\]]/g,'').replace(/^[:\-–·\s•*]+|[:\-–·\s]+$/g,'').trim();
    if(!nm||nm.length<2||isNaN(w)||w<=0||w>=100||/^(total|sum|grading|scale|grade|letter|percentage|weight|component)\b/i.test(nm))return;
    const k=nm.toLowerCase();if(seen.has(k))return;seen.add(k);
    assessments.push({name:nm.slice(0,60),type:cvGuessType(nm),weight:w,count:1,drop:0});
  };
  ((obj&&obj.tables)||[]).forEach(tb=>{
    const rows=tb.rows||[];if(!rows.length)return;
    const hdr=rows[0].map(c=>String(c||'').toLowerCase());
    const wCol=hdr.findIndex(h=>/weight|%|percent/.test(h));
    const nCol=hdr.findIndex(h=>/assess|component|item|category|grading|deliverable|type|name/.test(h));
    rows.forEach((r,ri)=>{
      if(ri===0&&wCol>=0)return;
      const pctCell=r.find(c=>/\b(\d{1,3}(?:\.\d+)?)\s*%/.test(String(c||'')));
      if(pctCell){
        const m=String(pctCell).match(/\b(\d{1,3}(?:\.\d+)?)\s*%/);
        const lbl=(nCol>=0&&r[nCol]&&r[nCol]!==pctCell?r[nCol]:r.find(c=>c!==pctCell&&String(c||'').trim().length>1&&!/^\d+(?:\.\d+)?$/.test(String(c||'').trim())))||'';
        if(m&&lbl)scanRow(lbl,m[1]);
      }else if(wCol>=0&&r[wCol]){
        const m=String(r[wCol]).trim().match(/^(\d{1,3}(?:\.\d+)?)\s*%?$/);
        const lbl=r[nCol>=0?nCol:0]||'';
        if(m&&lbl)scanRow(lbl,m[1]);
      }
    });
  });
  if(!assessments.length){
    fullText.split(/\r?\n/).forEach(line=>{
      const s=line.trim();if(!s||s.length>100)return;
      const m=s.match(/^([A-Za-z][A-Za-z0-9 &\/\-,'()]{1,48}?)\s*(?:[:\-–|·]|\s+)\s*\(?(\d{1,3}(?:\.\d+)?)\s*%\)?/);
      if(m)scanRow(m[1],m[2]);
    });
  }
  const cleanTitle=String(obj.title||'').replace(/\s*[-|–—]\s*(?:Simple\s*Syllabus|Syllabus).*$/i,'').replace(code?new RegExp('^'+code.replace(/\s+/g,'\\s*[- ]?')+'\\s*[:\\-–—·]*\\s*','i'):/^$/,'').trim();
  const syllabusUrl=/^https?:\/\//i.test(String(obj.url||''))?String(obj.url).trim():'';
  return{fullText,code,title:cleanTitle||code,credits:isNaN(credits)?3:credits,instructor,syllabusUrl,assessments};
}
function routeImportedObj(j,rawStr){
  if(j&&Array.isArray(j.courses)){
    U.pscsDiff=null;U.stellicPrev=null;U.sylImport=null;
    U.cv=j.courses.map(cv=>{
      const m=cvMatch(cv);
      return Object.assign({},cv,{teachers:cv.teachers||[],groups:cv.groups||[],target:m||'__new__'});
    });
    location.hash='canvas';render();return true;
  }
  if(j&&(j.kind==='stellic'||/stellic/i.test((j.url||'')+(j.title||'')))){
    U.cv=[];U.pscsDiff=null;U.sylImport=null;
    const prev=parseStellicAudit(j);
    if(!prev.courses.length){U.stellicPrev=null;U.cvErr='No courses or requirements found in that Stellic export. Open your Degree Audit / Progress page first.';render();return true}
    U.stellicPrev=prev;U.cvErr='';location.hash='canvas';render();return true;
  }
  if(j&&(j.kind==='pscs'||/pscs|peoplesoft/i.test(j.url||''))){
    U.cv=[];U.stellicPrev=null;U.sylImport=null;
    const diffs=parsePscsGrades(j);
    if(!diffs.length){U.pscsDiff=null;U.cvErr='No course grades found in that PSCS page. Open Academic Records → Course History or Grades first.';render();return true}
    U.pscsDiff=diffs;U.cvErr='';location.hash='canvas';render();return true;
  }
  if(j&&(j.kind==='syllabus'||/syllabus/i.test((j.url||'')+(j.title||'')))){
    U.cv=[];U.pscsDiff=null;U.stellicPrev=null;
    const parsed=parseSyllabusDeterministic(j);
    const targetId=matchCourseByCodeOrTitle(parsed.code,parsed.title);
    U.sylImport=Object.assign({},parsed,{target:targetId||'__new__',applyWeights:parsed.assessments.length>0});
    U.syl.text=parsed.fullText;U.syl.err='';
    U.cvErr='';location.hash='canvas';
    toast(targetId?'Simple Syllabus matched — review & link':'Simple Syllabus read — pick a course or create new');
    render();return true;
  }
  return false;
}
function handleIncomingImport(jsonStr){
  U.cvText=jsonStr;U.cvErr='';U.pscsDiff=null;U.stellicPrev=null;
  try{
    const j=JSON.parse(String(jsonStr||'').trim());
    if(routeImportedObj(j,jsonStr))return;
  }catch(e){}
  ACT2.cvread();
}
function vCanvas(){
  const y=U.cvText||'',list=U.cv||[],pscs=U.pscsDiff||[],st=U.stellicPrev||null,syl=U.sylImport||null,lastAt=S.links&&S.links.canvas&&S.links.canvas.at;
  const baseHint=atlasBaseUrl().replace(/\/+$/,'')||'http://127.0.0.1:3000';
  const opts=sel=>`<option value="">Skip this one</option><option value="__new__" ${sel==='__new__'?'selected':''}>+ Create new course</option>`+S.courses.filter(c=>status(c)!=='done'||c.id===sel).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.code)} · ${esc(c.title)}</option>`).join('');
  const allOpts=sel=>`<option value="__new__" ${sel==='__new__'?'selected':''}>+ Create new course</option>`+S.courses.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.code)} · ${esc(c.title)} (${esc((termOf(c.term)||{}).name||'Catalog')})</option>`).join('');
  const sylCard=syl?`<div class="card kpi-card kpi-good" style="margin-top:16px">
    <div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Simple Syllabus link &amp; grading breakdown</h2>${syl.syllabusUrl?`<a class="btn sm soft" href="${esc(syl.syllabusUrl)}" target="_blank" rel="noopener">Open syllabus ↗</a>`:''}</div>
    <p class="small muted" style="margin:0 0 12px">Detected <b>${esc(syl.code||'Course')}</b>${syl.title?' — '+esc(syl.title):''}${syl.instructor?' · '+esc(syl.instructor):''}. Pick which course to link it to, or create a new one.</p>
    <div class="fgrid" style="margin-bottom:12px">
      <label class="f"><span>Link to course</span><select data-c="sylimp" data-f="target">${allOpts(syl.target)}</select></label>
      <label class="f"><span>Syllabus URL</span><input data-c="sylimp" data-f="syllabusUrl" value="${esc(syl.syllabusUrl||'')}" placeholder="https://habib.simplesyllabus.com/…"></label>
    </div>
    ${syl.assessments.length?`<div class="scroll" style="margin-bottom:10px"><table class="t"><thead><tr><th>Grading group</th><th>Type</th><th class="r">Weight</th></tr></thead><tbody>${syl.assessments.map(a=>`<tr><td><b>${esc(a.name)}</b></td><td class="small muted">${esc(a.type)}</td><td class="r mono">${fmt(a.weight,0)}%</td></tr>`).join('')}</tbody></table></div>
    <label class="row small" style="margin-bottom:12px;cursor:pointer"><input type="checkbox" data-c="sylimp" data-f="applyWeights" ${syl.applyWeights?'checked':''}> Apply these grading weights to the course</label>`:'<p class="small muted">No weight table was detected on this page — linking will still save the Syllabus URL and instructor.</p>'}
    <div class="row"><button type="button" class="btn primary" data-a="sylimportapply">${syl.target==='__new__'?'Create course with syllabus':'Link syllabus to course'}</button><button type="button" class="btn" data-a="sylimportedit">Edit in Add Course…</button><button type="button" class="btn ghost" data-a="sylimportclear">Dismiss</button></div>
  </div>`:'';
  return head('Sync & Import','Sync scores from Canvas, import PSCS Course History, build from Stellic, or link Simple Syllabus.',`<a class="btn" href="#setup">Setup Guide</a><a class="btn soft" href="#tour">Tour</a>`)+
  (DESKTOP_HOST?hostCanvasCard():'')+`<div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">One-click “Send to Atlas” bookmark</h2><span class="pill">Last Canvas sync: ${lastAt?esc(new Date(lastAt).toLocaleString()):'Never'}</span></div>
  <p class="small muted" style="margin:0 0 12px">Drag this button onto your browser Bookmarks bar once. Then whenever you are signed into <b>Canvas</b>, <b>PSCS</b>, <b>Simple Syllabus</b>, or <b>Stellic</b>, click it once to send the page straight to Atlas.</p>
  <div class="row" style="margin-bottom:12px"><a class="btn primary" href="${esc(bmCode())}" onclick="event.preventDefault();alert('Drag this button onto your Bookmarks bar, then click it on Canvas, PSCS, Simple Syllabus, or Stellic!')">✦ Send to Atlas (Drag to Bookmarks Bar)</a><button class="btn" data-a="copybm">Copy bookmark code</button></div>
  <details><summary>Manual code</summary><textarea id="bm-code" rows="3" readonly class="mono small">${esc(bmCode())}</textarea></details></div>
  <div class="card" style="margin-top:16px"><h2>Paste export or page report</h2><textarea id="cv-text" rows="4" data-c="cvtext" placeholder="Paste Canvas JSON, PSCS Course History/Grades, Simple Syllabus report, or Stellic Degree Audit here">${esc(y)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-a="cvread">Read export</button><span class="small" style="color:var(--bad)">${esc(U.cvErr||'')}</span></div></div>`+
  sylCard+
  (st?`<div class="card" style="margin-top:16px"><h2>Stellic degree audit preview</h2><p class="small muted" style="margin:-4px 0 12px">Detected <b>${st.courses.length}</b> courses across <b>${st.cats.length}</b> requirement categories (${st.totalCredits} cr).</p><div class="scroll"><table class="t"><thead><tr><th>Course</th><th>Title</th><th>Term</th><th class="r">Cr</th><th>Grade</th></tr></thead><tbody>${st.courses.slice(0,40).map(c=>`<tr><td class="mono small"><b>${esc(c.code)}</b></td><td>${esc(c.title)}</td><td class="small muted">${esc(c.termName)}</td><td class="r mono">${c.credits}</td><td>${lpill(c.grade)}</td></tr>`).join('')}</tbody></table></div>${st.courses.length>40?`<p class="small muted">Showing first 40 of ${st.courses.length} courses.</p>`:''}<div class="row" style="margin-top:14px"><button type="button" class="btn primary" data-a="stellicapply">Build / Merge into Atlas</button></div></div>`:'')+
  (list.length?`<div class="card kpi-card kpi-acc" style="margin-top:16px"><h2>Match or create Canvas courses</h2><p class="small muted" style="margin:-4px 0 12px">Existing courses update automatically; unmatched Canvas courses default to <b>+ Create new course</b> so your term builds itself in one click.</p><div class="scroll"><table class="t"><thead><tr><th>In Canvas</th><th class="r">Items</th><th>Action / Course</th></tr></thead><tbody>${list.map((cv,i)=>`<tr><td><b>${esc(cv.name)}</b>${cv.term?`<div class="small muted">${esc(cv.term)}</div>`:''}</td><td class="r mono">${cv.groups.reduce((a,g)=>a+g.items.length,0)}</td><td><select data-c="cvmap" data-i="${i}">${opts(cv.target)}</select></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><button class="btn primary" data-a="cvapply">Import into Atlas</button></div><p class="small muted">Your course matching is remembered for next time. Items that do not fit a group go into “Unsorted from Canvas” with no weight.</p></div>`:'')+
  (pscs.length?`<div class="card" style="margin-top:16px"><h2>PSCS grade &amp; history import</h2><p class="small muted" style="margin:-4px 0 12px">Found ${pscs.length} course${pscs.length===1?'':'s'}. Existing courses update grades; new courses auto-create their terms.</p><div class="scroll"><table class="t"><thead><tr><th>Apply</th><th>Course</th><th>Term</th><th>Atlas</th><th>PSCS</th><th>Status</th></tr></thead><tbody>${pscs.map((r,i)=>`<tr><td><input type="checkbox" data-c="pscsrow" data-i="${i}" ${r.apply?'checked':''}></td><td><b>${esc(r.code)}</b> <span class="small muted">${esc(r.title)}</span></td><td class="small muted">${esc(r.term)}</td><td>${lpill(r.curGrade)}</td><td>${lpill(r.pscsGrade)}</td><td><span class="pill ${r.status==='match'?'good':r.status==='diff'?'warn':'acc'}">${r.status==='match'?'Matches':r.status==='diff'?'Differs':r.status==='create'?'Create':'New'}</span></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><button type="button" class="btn primary" data-a="pscsapply">Apply selected</button></div></div>`:'')+
  `<div class="card" style="margin-top:16px"><h2>Calendar feed &amp; companion extension</h2><p class="small muted" style="margin:-4px 0 12px">Export an .ics file for Apple/Google Calendar, or load the unpacked companion browser extension for background Canvas auto-sync.</p>
  <div class="row"><button type="button" class="btn" data-a="calics">Download .ics calendar</button>${typeof IS_WEB!=='undefined'&&IS_WEB?`<button type="button" class="btn soft" data-a="copycalurl">Copy calendar subscription URL</button>`:''}</div>
  <details style="margin-top:12px"><summary>Browser extension setup (Edge / Chrome)</summary><ol class="small muted" style="margin:6px 0 0;padding-left:20px;line-height:1.6"><li>Open <code>edge://extensions</code> (or <code>chrome://extensions</code>) and enable <b>Developer mode</b>.</li><li>Click <b>Load unpacked</b> and pick the <code>extension</code> folder inside your Atlas repo.</li><li>Open the Atlas Companion icon to set your server URL (<code>${esc(baseHint)}</code>) and sync Canvas automatically whenever you browse Canvas.</li></ol></details></div>`;
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
  cvread(rawOverride){
    const t=typeof rawOverride==='string'?rawOverride:(($('#cv-text')||{}).value||U.cvText||'');
    U.cvText=t;U.cvErr='';U.pscsDiff=null;U.stellicPrev=null;U.sylImport=null;
    try{
      const j=JSON.parse(t.trim());
      if(routeImportedObj(j,t))return;
      throw 0;
    }catch(e){
      const isExplicitStellic=/\bstellic\b|degree\s+audit|requirement(?:s)?\s+(?:met|unmet|progress)|\b\d+\s*\/\s*\d+\s*credits?\b/i.test(t)&&!/grade\s*points/i.test(t);
      if(isExplicitStellic){
        const prev=parseStellicAudit({tables:[],text:t});
        if(prev.courses.length>=2){U.cv=[];U.stellicPrev=prev;location.hash='canvas';render();return}
      }
      const diffs=parsePscsGrades({tables:[],text:t});
      if(diffs.length){U.cv=[];U.pscsDiff=diffs;location.hash='canvas';render();return}
      const prev=parseStellicAudit({tables:[],text:t});
      if(prev.courses.length>=2){U.cv=[];U.stellicPrev=prev;location.hash='canvas';render();return}
      const syl=parseSyllabusDeterministic({tables:[],text:t,title:''});
      if(syl.assessments.length){
        const targetId=matchCourseByCodeOrTitle(syl.code,syl.title);
        U.cv=[];U.sylImport=Object.assign({},syl,{target:targetId||'__new__',applyWeights:true});
        location.hash='canvas';render();return;
      }
      U.cv=[];U.cvErr='That does not look like a Canvas, PSCS, Simple Syllabus, or Stellic export.';
    }
    render();
  },
  cvapply(){const r=cvApply();U.cv=[];U.cvText='';persist();const msg=(r.crt?`Created ${r.crt} course${r.crt>1?'s':''}, `:'')+`updated ${r.upd} items, added ${r.add}${r.un?`, ${r.un} unsorted`:''}`;if(r.crt)location.hash='overview';toast(msg,true);render()},
  sylimportapply(){
    const s=U.sylImport;if(!s)return;
    pushUndo('Link Simple Syllabus');
    let c=null;
    if(s.target&&s.target!=='__new__')c=getC(s.target);
    if(!c){
      const curTerm=(S.terms.find(t=>t.status==='current')||S.terms[0]||{}).id||null;
      c={id:uid(),code:s.code||'NEW 101',title:s.title||s.code||'Untitled Course',credits:s.credits||3,term:curTerm,cat:guessCat(s.code),prereqs:[],coreqs:[],grade:null,assess:[],notes:'',instructor:s.instructor||'',syllabusUrl:s.syllabusUrl||''};
      S.courses.push(c);
    }else{
      if(s.syllabusUrl)c.syllabusUrl=s.syllabusUrl;
      if(s.instructor&&!c.instructor)c.instructor=s.instructor;
    }
    if(s.applyWeights&&s.assessments&&s.assessments.length){
      const existingByName=n=>(c.assess||[]).find(g=>nn(g.n)===nn(n));
      if(!(c.assess||[]).length){
        c.assess=s.assessments.map(a=>({id:uid(),n:a.name,type:a.type||'Other',w:+a.weight||0,cnt:a.count||1,drop:a.drop||0,items:[]}));
      }else{
        s.assessments.forEach(a=>{
          const g=existingByName(a.name);
          if(g)g.w=+a.weight||g.w;
          else c.assess.push({id:uid(),n:a.name,type:a.type||'Other',w:+a.weight||0,cnt:a.count||1,drop:a.drop||0,items:[]});
        });
      }
    }
    U.sylImport=null;U.cvText='';persist();U.course=c.id;U.tab='assess';
    toast('Syllabus linked to '+c.code,true);render();
  },
  sylimportedit(){
    const s=U.sylImport;if(!s)return;
    const cur=S.settings.cats;
    U.syl.out={code:s.code,title:s.title,credits:s.credits||3,instructor:s.instructor||'',syllabusUrl:s.syllabusUrl||'',notes:'',prereqs:[],cat:cur[0]?cur[0].k:'',term:(S.terms.find(t=>t.status==='current')||{}).id||'',targetId:s.target!=='__new__'?s.target:'',assessments:s.assessments||[]};
    U.sylImport=null;location.hash='add';render();
  },
  sylimportclear(){U.sylImport=null;render()},
  stellicapply(){
    const n=applyStellicImport(U.stellicPrev);
    if(!n)return toast('No new courses to add');
    U.stellicPrev=null;U.cvText='';persist();location.hash='overview';toast(`Imported ${n} courses from Stellic`,true);
  },
  pscsapply(){
    const list=(U.pscsDiff||[]).filter(r=>r.apply);
    if(!list.length)return toast('No courses selected');
    pushUndo('PSCS import');
    let upd=0,crt=0;
    if(!S.settings.school)S.settings.school='Habib University';
    if(!S.settings.program)S.settings.program='Degree Plan (from PSCS)';
    list.forEach(r=>{
      if(r.create){
        const t=ensureTerm(r.term,r.pscsGrade?'done':'current');
        if(!S.courses.some(c=>NC(c.code)===NC(r.code)&&(!t||c.term===t.id))){
          S.courses.push({id:uid(),code:r.code,title:r.title||r.code,credits:r.credits||3,term:t?t.id:'',cat:guessCat(r.code),prereqs:[],coreqs:[],grade:r.pscsGrade||null,assess:[],notes:'',instructor:''});
          crt++;
        }
      }else{
        const c=getC(r.id);if(c){c.grade=r.pscsGrade;upd++}
      }
    });
    S.links=S.links||{canvas:{at:0,map:{}},pscs:{at:0}};
    S.links.pscs=S.links.pscs||{at:0};S.links.pscs.at=Date.now();
    U.pscsDiff=null;U.cvText='';persist();if(crt&&U.route==='overview')render();else{location.hash='overview';render()}
    toast(`PSCS: ${upd} updated, ${crt} created`,true);
  },
  calics(){saveFile('atlas-calendar.ics',calendarIcs()).then(()=>toast('Calendar saved'),e=>{if(!e||e.code!=='declined')toast('Could not save calendar')})},
  copycalurl(){
    const u=atlasBaseUrl().replace(/\/+$/,'')+'/api/calendar.ics';
    if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>toast('Calendar subscription URL copied'),()=>toast(u));
    else toast(u);
  },
};
const CHG2={cvmap(e,d,v){U.cv[+d.i].target=v},cvtext(e,d,v){U.cvText=v},pscsrow(e,d){const r=(U.pscsDiff||[])[+d.i];if(r)r.apply=!!e.target.checked},sylimp(e,d,v){if(!U.sylImport)return;if(d.f==='applyWeights')U.sylImport.applyWeights=!!e.target.checked;else U.sylImport[d.f]=v}};

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
