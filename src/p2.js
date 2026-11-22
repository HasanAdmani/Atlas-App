<script>
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,'0');
const dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayStr=()=>dstr(new Date());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return dstr(d)};
const daysUntil=s=>Math.round((new Date(s+'T00:00:00')-new Date(todayStr()+'T00:00:00'))/864e5);
const fmt=(n,d)=>(n==null||isNaN(n))?'–':Number(n).toFixed(d==null?2:d);
const NC=c=>String(c||'').toUpperCase().replace(/[\s\-_.]+/g,'');
const num=v=>{const n=parseFloat(v);return isNaN(n)?null:n};

const DEF_SCALE=[['A',4,93],['A-',3.67,90],['B+',3.33,87],['B',3,83],['B-',2.67,80],['C+',2.33,77],['C',2,73],['C-',1.67,70],['D+',1.33,67],['D',1,60],['F',0,0]].map(x=>({l:x[0],p:x[1],min:x[2]}));
const ATYPES=['Quiz','Assignment','Lab','Project','Midterm','Final','Participation','Other'];
const CAT_COLORS=['#2945B8','#16794F','#B86B11','#7C3AED','#C02669','#0284C7','#4F46E5','#64748B'];
const DEF_PORTALS=[
  {id:'canvas',name:'Canvas LMS',short:'C',url:'https://hulms.instructure.com',on:true,kind:'canvas',color:'#E13F2B'},
  {id:'pscs',name:'PSCS Portal',short:'P',url:'https://pscs.habib.edu.pk/psc/CSPROD/EMPLOYEE/SA/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL',on:true,kind:'pscs',color:'#1E5A99'},
  {id:'syllabus',name:'Simple Syllabus',short:'S',url:'https://habib.simplesyllabus.com',on:true,kind:'syllabus',color:'#16794F'},
  {id:'mail',name:'Student Mail',short:'M',url:'https://outlook.office.com',on:false,kind:'link',color:'#0078D4'}
];
function defUi(){
  return{
    dash:{
      desktop:[
        {w:'gpa',size:'s',on:true},{w:'term',size:'s',on:true},{w:'credits',size:'s',on:true},{w:'target',size:'s',on:true},
        {w:'inprog',size:'m',on:true},{w:'duenext',size:'m',on:true},{w:'week',size:'m',on:true},{w:'trend',size:'m',on:true},
        {w:'attention',size:'m',on:true},{w:'reqs',size:'m',on:true},{w:'portals',size:'s',on:false},{w:'note',size:'s',on:false}
      ],
      mobile:[
        {w:'gpa',size:'s',on:true},{w:'term',size:'s',on:true},{w:'credits',size:'s',on:true},{w:'target',size:'s',on:true},
        {w:'duenext',size:'m',on:true},{w:'inprog',size:'m',on:true},{w:'week',size:'m',on:true},{w:'attention',size:'m',on:true}
      ],
      note:''
    },
    plan:{layout:'years',density:'auto',minDensity:'compact',colorBy:'status',collapseDone:false,trayOpen:false},
    modules:{minors:true,enroll:true,roadmap:true,whatif:true,portals:true,canvas:true},
    accent:'blue',
    density:'comfortable'
  };
}

function blank(){return{v:5,sample:false,settings:{program:'',school:'',totalCredits:120,maxLoad:18,targetGpa:3.5,scale:DEF_SCALE.map(x=>Object.assign({},x)),cats:[{k:'core',n:'Core and foundation',req:30,color:CAT_COLORS[0]},{k:'major',n:'Major',req:60,color:CAT_COLORS[1]},{k:'gened',n:'General education',req:15,color:CAT_COLORS[2]},{k:'free',n:'Free electives',req:15,color:CAT_COLORS[3]}],portals:DEF_PORTALS.map(x=>Object.assign({},x))},terms:[],courses:[],minors:[],ui:defUi(),links:{canvas:{at:0,map:{}},pscs:{at:0}}}}

/* Dossier loader: clean degree templates bundled from dossiers/ at build time (zero personal data). */
const HABIB_SCALE=[['A+',4,95],['A',4,90],['A-',3.67,85],['B+',3.33,80],['B',3,75],['B-',2.67,70],['C+',2.33,67],['C',2,63],['C-',1.67,60],['F',0,0]].map(x=>({l:x[0],p:x[1],min:x[2]}));
function getDossiers(){return Array.isArray(window.__ATLAS_DOSSIERS__)?window.__ATLAS_DOSSIERS__:[]}
function loadDossier(id,doneCount){
  const list=getDossiers();
  const entry=list.find(d=>d.id===id)||list[0];
  if(!entry||!entry.data)return blank();
  const b=blank();
  const raw=JSON.parse(JSON.stringify(entry.data));
  const st=Object.assign(b,raw,{settings:Object.assign(b.settings,raw.settings||{})});
  st.sample=false;
  const dn=Math.max(0,parseInt(doneCount,10)||0);
  let regIdx=0;
  st.terms=(st.terms||[]).map(t=>{
    const isSum=/^sum/i.test(t.name||'');
    if(isSum)return Object.assign({},t,{status:regIdx<=dn?'done':'planned'});
    const status=regIdx<dn?'done':regIdx===dn?'current':'planned';
    regIdx++;
    return Object.assign({},t,{status});
  });
  return st;
}

let S=blank();
const U={route:'overview',course:null,tab:'assess',whatif:{},sel:null,busy:false,syl:{text:'',files:[],out:null,err:'',loading:false,term:''},toast:'',toastUndo:false,canUndo:false,conflict:null};
const UNDO=[];
function pushUndo(label){try{const snap=JSON.stringify(S);if(UNDO.length&&UNDO[UNDO.length-1].state===snap)return;UNDO.push({label:label||'Change',state:snap});if(UNDO.length>30)UNDO.shift();U.canUndo=UNDO.length>0}catch(e){}}
let persist=function(){};
function mut(fn,label){pushUndo(label);fn();persist();if(label)toast(label,true);else render()}
const catColor=k=>{const i=S.settings.cats.findIndex(c=>c.k===k),x=S.settings.cats[i];return(x&&x.color)||CAT_COLORS[(i>=0?i:0)%CAT_COLORS.length]};

/* ---------- calculations ---------- */
const termOf=id=>S.terms.find(t=>t.id===id);
const termIdx=id=>S.terms.findIndex(t=>t.id===id);
const byCode=()=>{const m={};S.courses.slice().sort((a,b)=>termIdx(a.term)-termIdx(b.term)).forEach(c=>m[NC(c.code)]=c);return m};
/* a retaken course: the old attempt stops counting toward credits, and (if the setting is on) toward GPA once the retake has a grade */
const counts=c=>!S.courses.some(o=>o.retakeOf===c.id);
const replaced=c=>S.settings.retakeReplaces!==false&&S.courses.some(o=>o.retakeOf===c.id&&o.grade&&o.grade!=='W');
const getC=id=>S.courses.find(c=>c.id===id);
function status(c){const t=termOf(c.term);return t?t.status:'catalog'}
const pointsOf=l=>{const e=S.settings.scale.find(x=>x.l===l);return e?e.p:null};
function letterFor(pct){const sc=S.settings.scale.slice().sort((a,b)=>b.min-a.min);for(const e of sc)if(pct>=e.min)return e.l;return sc.length?sc[sc.length-1].l:null}
const ipct=it=>(it.s!=null&&it.s!==''&&+it.m>0&&it.st!=='excused')?(+it.s)/(+it.m)*100:null;
/* one grading group, like "Quizzes 20%, best 8 of 10". Ungraded items are left out, and the lowest ones are dropped once there are more than count minus drop. */
function gstat(g){
  const items=g.items||[],n=Math.max(+g.cnt||0,items.length,1),k=Math.max(1,n-(+g.drop||0));
  const ps=items.map(ipct).filter(p=>p!=null).sort((a,b)=>b-a),used=ps.slice(0,k),portion=used.length/k;
  const mean=used.length?used.reduce((a,b)=>a+b,0)/used.length:null,w=+g.w||0;
  return{n,k,graded:ps.length,used:used.length,mean,portion,gw:w*portion,ew:mean==null?0:w*portion*mean/100};
}
function standing(c){
  const as=c.assess||[],gs=as.map(gstat);
  const W=as.reduce((a,g)=>a+(+g.w||0),0),gw=gs.reduce((a,x)=>a+x.gw,0),earned=gs.reduce((a,x)=>a+x.ew,0);
  const pct=gw>0?earned/gw*100:null;
  return{W,gw,earned,pct,rem:W-gw,letter:pct==null?null:letterFor(pct),floor:W>0?earned/W*100:null,ceil:W>0?(earned+(W-gw))/W*100:null};
}
function needed(c,target){const st=standing(c);if(st.W<=0||st.rem<=0)return null;return (target/100*st.W-st.earned)/st.rem*100}
function effLetter(c){if(c.grade)return c.grade;const st=standing(c);return st.letter}
function gpaOf(list,useRunning,over){
  let pts=0,cr=0;
  list.forEach(c=>{
    if(replaced(c)||(over&&S.settings.retakeReplaces!==false&&S.courses.some(o=>o.retakeOf===c.id&&over[o.id])))return;
    let l=over&&over[c.id]?over[c.id]:(c.grade||(useRunning?standing(c).letter:null));
    if(!l||l==='W')return;const p=pointsOf(l);if(p==null)return;pts+=p*c.credits;cr+=c.credits;
  });
  return{gpa:cr?pts/cr:null,pts,cr};
}
const doneCourses=()=>S.courses.filter(c=>status(c)==='done');
const curCourses=()=>S.courses.filter(c=>status(c)==='current');
const planCourses=()=>S.courses.filter(c=>status(c)==='planned');
function cumulative(){return gpaOf(doneCourses(),false)}
const passed=c=>!c.grade||c.grade==='CR'||(c.grade!=='W'&&c.grade!=='NC'&&(pointsOf(c.grade)||0)>0);
function earnedCredits(){return doneCourses().filter(counts).filter(passed).reduce((a,c)=>a+c.credits,0)}
function termGpa(t){return gpaOf(S.courses.filter(c=>c.term===t.id),t.status==='current')}
function trend(){
  const out=[];let pts=0,cr=0;
  S.terms.forEach(t=>{
    if(t.status==='planned')return;
    const cs=S.courses.filter(c=>c.term===t.id);
    const g=gpaOf(cs,t.status==='current');
    pts+=g.pts;cr+=g.cr;
    if(g.cr)out.push({name:t.name,term:g.gpa,cum:pts/cr,cur:t.status==='current'});
  });
  return out;
}
function prereqIssues(c){
  const m=byCode(),out=[],ti=c.term?termIdx(c.term):-1;
  (c.prereqs||[]).forEach(code=>{
    const p=m[NC(code)];
    if(!p){out.push({code,kind:'missing'});return}
    if(!c.term)return;
    const pi=p.term?termIdx(p.term):-1;
    if(!p.term)out.push({code:p.code,kind:'unscheduled'});
    else if(pi>=ti)out.push({code:p.code,kind:pi===ti?'same':'after'});
  });
  (c.coreqs||[]).forEach(code=>{const p=m[NC(code)];if(!p){out.push({code,kind:'missing'});return}if(!c.term)return;const pi=p.term?termIdx(p.term):-1;if(!p.term)out.push({code:p.code,kind:'unscheduled'});else if(pi>ti)out.push({code:p.code,kind:'after'})});
  return out;
}
function depth(c,m,seen){
  seen=seen||{};if(seen[c.id])return 0;seen[c.id]=1;
  let d=0;(c.prereqs||[]).forEach(code=>{const p=m[NC(code)];if(p)d=Math.max(d,1+depth(p,m,Object.assign({},seen)))});
  return d;
}
function nodeState(c,m){
  const st=status(c);
  if(st==='done')return'done';if(st==='current')return'current';if(st==='planned')return'planned';
  const ok=(c.prereqs||[]).every(code=>{const p=m[NC(code)];return !p||status(p)==='done'||status(p)==='current'});
  return ok?'open':'locked';
}
function catProgress(){
  return S.settings.cats.map(k=>{
    const cs=S.courses.filter(c=>c.cat===k.k&&counts(c));
    const e=cs.filter(c=>status(c)==='done'&&passed(c)).reduce((a,c)=>a+c.credits,0);
    const cu=cs.filter(c=>status(c)==='current').reduce((a,c)=>a+c.credits,0);
    const pl=cs.filter(c=>status(c)==='planned').reduce((a,c)=>a+c.credits,0);
    return{k,e,cu,pl,left:Math.max(0,k.req-e-cu-pl),over:Math.max(0,e+cu+pl-k.req)};
  });
}
function deadlines(){
  const out=[];
  curCourses().forEach(c=>(c.assess||[]).forEach(g=>{
    const k=Math.max(1,Math.max(+g.cnt||0,(g.items||[]).length,1)-(+g.drop||0));
    (g.items||[]).forEach(it=>{if(it.due&&(it.s==null||it.s==='')&&!it.st){const d=daysUntil(it.due.slice(0,10));if(d>=0)out.push({c,a:{n:it.n,w:(+g.w||0)/k,due:it.due.slice(0,10)},d})}});
  }));
  return out.sort((x,y)=>x.d-y.d);
}
function termCredits(id){return S.courses.filter(c=>c.term===id).reduce((a,c)=>a+c.credits,0)}
