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

function blank(){return{v:4,sample:false,settings:{program:'',school:'',totalCredits:120,maxLoad:18,targetGpa:3.5,scale:DEF_SCALE.map(x=>Object.assign({},x)),cats:[{k:'core',n:'Core and foundation',req:30},{k:'major',n:'Major',req:60},{k:'gened',n:'General education',req:15},{k:'free',n:'Free electives',req:15}]},terms:[],courses:[],minors:[]}}

/* Starting plan: EE Class of 2029 dossier grid, edited for the retake and moved courses. Scores come from Canvas. */
const HABIB_SCALE=[['A+',4,95],['A',4,90],['A-',3.67,85],['B+',3.33,80],['B',3,75],['B-',2.67,70],['C+',2.33,67],['C',2,63],['C-',1.67,60],['F',0,0]].map(x=>({l:x[0],p:x[1],min:x[2]}));
function seed(){
  const s=blank();
  Object.assign(s.settings,{name:'Muhammad Hasan Admani',program:'B.S. Electrical Engineering, Class of 2029',school:'Habib University',unit:'DSSE',totalCredits:134,maxLoad:20,targetGpa:3.3,scale:HABIB_SCALE.map(x=>Object.assign({},x)),
    cats:[{k:'core',n:'Habib Liberal Core',req:32},{k:'math',n:'Math and computing',req:27},{k:'ee',n:'Electrical engineering core',req:45},{k:'design',n:'Design and professional',req:12},{k:'elec',n:'Electives',req:18}]});
  const nm=['Fall 2025','Spring 2026','Fall 2026','Spring 2027','Fall 2027','Spring 2028','Fall 2028','Spring 2029'];
  s.terms=nm.map((n,i)=>({id:'t'+(i+1),name:n,status:i<2?'done':i==2?'current':'planned',cr:i===0}));
  /* item: name, score, out of, due, status, late */
  const I=(n,sc,m,due,st,late)=>({id:uid(),n,s:sc==null?null:sc,m:m==null?100:m,due:due||'',st:st||'',late:!!late});
  const G=(n,type,w,cnt,drop,items)=>({id:uid(),n,type,w,cnt:cnt||(items||[]).length||1,drop:drop||0,items:items||[]});
  const pend=(pre,a,b,m)=>{const o=[];for(let i=a;i<=b;i++)o.push(I(pre+' '+i,null,m));return o};
  const ids={};
  const c=(t,code,title,cr,cat,pre,as,extra)=>{const o=Object.assign({id:uid(),code,title,credits:cr,term:'t'+t,cat,prereqs:pre||[],coreqs:[],grade:t===1?'CR':null,assess:as||[],notes:'',instructor:''},extra||{});s.courses.push(o);ids[code+(extra&&extra.retakeOf?'r':'')]=o.id;return o};
  /* Fall 2025: credit / no credit, so every course shows CR */
  c(1,'CORE 101','Rhetoric and Communication',4,'core');
  c(1,'CS 101','Algorithmic Problem Solving',3,'math');
  c(1,'CS 101L','Algorithmic Problem Solving Lab',1,'math',[],[],{coreqs:['CS 101']});
  c(1,'PLAY 113','Design Your Habib Experience',1,'design');
  c(1,'MATH 101','Calculus I',3,'math');
  c(1,'EE 100','Introduction to Electrical and Computer Engineering',2,'ee',[],[],{coreqs:['CS 101']});
  c(1,'EE 112','Electric Circuits I',2,'ee',[],[],{coreqs:['EE 100']});
  /* Spring 2026 (enter final grades) */
  c(2,'CORE 102','What is Modernity?',4,'core');
  c(2,'ENGR 291','Engineering Workshop and Design',1,'design');
  c(2,'EE 213','Electric Circuits II',3,'ee',['EE 112']);
  c(2,'MATH 102','Calculus II',3,'math',['MATH 101']);
  c(2,'EE 172','Digital Logic and Design',3,'ee');
  c(2,'EE 172L','Digital Logic and Design Lab',1,'ee',[],[],{coreqs:['EE 172']});
  c(2,'CS 102','Data Structures and Algorithms',3,'math',['CS 101']);
  c(2,'CS 102L','Data Structures and Algorithms Lab',1,'math',[],[],{coreqs:['CS 102']});
  /* Fall 2026, this term */
  c(3,'ENVS SDP 251','Water: Science, Society, and Policy',3,'core',[],[
    G('Water footprint journal','Assignment',15,1,0,[I('Water footprint journal',12.75,15,'2026-10-02','',true)]),
    G('Assignment','Assignment',10,1,0,[I('Word problem assignment',null,10,'2026-11-15')]),
    G('Discussion groups','Assignment',20,2,0,[I('Global water perspective (DG1)',9.5,10,'2026-10-15'),I('Current water issues (DG2)',null,10,'2026-11-17')]),
    G('Quizzes','Quiz',20,4,0,[I('Quiz 1',2.75,5,'2026-09-10'),I('Quiz 2',4,5,'2026-10-08'),I('Quiz 3',null,5,'2026-11-10'),I('Quiz 4',null,5,'2026-11-26')]),
    G('Lab day','Lab',5,1,0,[I('Lab day results',3,5,'2026-09-21')]),
    G('Research project','Project',30,3,0,[I('Proposal',null,null),I('Mid semester presentation',4,5,'2026-10-22'),I('Final presentation and report',null,null)])
  ],{instructor:'Hadiqa Maqsood',notes:'Counts as the Natural Science elective in the Habib Liberal Core. No final exam. Late work loses 20% per day.'});
  c(3,'EE 252','Signals and Systems',3,'ee',['MATH 102'],[
    G('Quizzes','Quiz',20,4,0,[I('Quiz 1',27,100,'2026-09-24'),I('Quiz 2',80,100,'2026-10-05'),I('Quiz 3',null,100),I('Quiz 4',null,100)]),
    G('Assignments','Assignment',10,2,0,[I('Homework 1',null,100,'2026-09-16'),I('Homework 2',null,100,'2026-10-27')]),
    G('Midterm','Midterm',25,1,0,[I('Midterm',null,100)]),
    G('Course project','Project',15,1,0,[I('Course project',null,100)]),
    G('Final exam','Final',30,1,0,[I('Final exam',null,100)])
  ],{instructor:'Syed Arsalan Jawed',notes:'Late work loses 4% per day, and nothing is accepted after five days.'});
  c(3,'EE 252L','Signals and Systems Lab',1,'ee',['MATH 102'],[
    G('Labs','Lab',60,12,0,[I('Lab 1',95,100,'2026-09-02'),I('Lab 2',null,100,'2026-09-09','submitted'),I('Lab 3',84,100,'2026-09-16','',true),I('Lab 4',0,100,'2026-09-23'),I('Lab 5',62,80,'2026-09-30','',true),I('Lab 6',null,100,'2026-10-07','submitted',true),I('Lab 7',67,70,'2026-10-14','',true),I('Lab 8',75,80,'2026-10-21','',true),I('Lab 9',80,80,'2026-10-22'),I('Lab 10 part 1',null,100,'2026-11-05','submitted'),I('Lab 10 complete',null,120,'2026-11-12'),I('Lab 11',null,100)]),
    G('Lab exams','Final',40,2,0,[I('Mid-lab exam',null,50,'2026-10-29','submitted'),I('Final lab exam',null,100)])
  ],{instructor:'Zareen Tabassum',notes:'Labs 1 to 12 count 5% each. The lab exam is in week 14.'});
  c(3,'EE 371','Computer Architecture',3,'ee',['EE 172'],[
    G('Assignments','Assignment',20,4,0,[I('Assignment 1',5,5,'2026-09-07'),I('Assignment 2',4.88,5,'2026-09-28'),I('Assignment 3',null,5),I('Assignment 4',null,5)]),
    G('Quizzes','Quiz',20,4,0,[I('Quiz 1',2.75,5,'2026-09-07'),I('Quiz 2',null,5),I('Quiz 3',null,5),I('Quiz 4',null,5)]),
    G('Course project','Project',10,1,0,[I('Course project',null,100)]),
    G('Midterm','Midterm',25,1,0,[I('Midterm',17.25,25,'2026-10-16')]),
    G('Final exam','Final',25,1,0,[I('Final exam',null,100)])
  ],{instructor:'Sarah Faisal, Husain Parvez',notes:'Late work loses 20% per day.'});
  c(3,'EE 371L','Computer Architecture Lab',1,'ee',['EE 172'],[
    G('Lab experiments','Lab',60,10,0,[I('Lab 1',83,100,'2026-08-27'),I('Lab 2',87,100,'2026-09-03'),I('Lab 3',100,100,'2026-09-10'),I('Lab 4',0,100,'2026-09-17'),I('Lab 5',89,100,'2026-09-24'),I('Lab 6',100,100,'2026-10-01'),I('Lab 7',70,100,'2026-10-08'),I('Lab 8',null,100,'2026-10-20','submitted'),I('Lab 9',null,100,'2026-10-23','submitted'),I('Lab 10',null,100,'2026-10-30','submitted')]),
    G('Open ended lab','Lab',10,1,0,[I('Open ended lab',null,100,'2026-11-12')]),
    G('Project','Project',30,1,0,[I('Project',null,100,'2026-11-26')])
  ],{instructor:'Hadia Mahmood',notes:'Late work loses 5% per day. The project is in groups of 3.'});
  c(3,'MATH 202','Engineering Mathematics',3,'math',['MATH 102'],[
    G('Homework','Assignment',15,5,0,[I('Homework 1',14,20,'2026-09-30'),I('Homework 2',20,20,'2026-10-20'),I('Homework 3',null,20),I('Homework 4',null,20),I('Homework 5',null,20)]),
    G('Quizzes','Quiz',20,10,2,[I('Quiz 1',7,10,'2026-09-11'),I('Quiz 2',9,10,'2026-09-18'),I('Quiz 3',null,10,'2026-10-02','missing')]),
    G('Class participation','Participation',5,1,0,[I('Class participation',null,100)]),
    G('Project','Project',5,1,0,[I('Project',null,100)]),
    G('Tests','Midterm',30,2,0,[I('Test 1',13,30,'2026-10-10'),I('Test 2',null,30)]),
    G('Final exam','Final',25,1,0,[I('Final exam',null,100)])
  ],{instructor:'Rameez Ragheb',notes:'The best 8 quizzes count (n-2). Late work loses 10% per day.'});
  /* Spring 2027: Circuits II retake, so Linear Algebra moves to Spring 2028 */
  c(4,'CORE 1XX','Economics: Foundations of Economic Systems',3,'core');
  c(4,'EE 354','Introduction to Probability and Statistics',3,'math',['MATH 102']);
  c(4,'EE 361','Principles of Feedback Control',3,'ee',['EE 252']);
  c(4,'EE 361L','Principles of Feedback Control Lab',1,'ee',[],[],{coreqs:['EE 361']});
  c(4,'EE 376','Microcontrollers and Interfacing',1,'ee',['EE 172']);
  c(4,'EE 376L','Microcontrollers and Interfacing Lab',1,'ee',[],[],{coreqs:['EE 376']});
  c(4,'EE 211','Basic Electronics',3,'ee',['EE 112']);
  c(4,'EE 211L','Basic Electronics Lab',1,'ee',[],[],{coreqs:['EE 211']});
  c(4,'EE 213','Electric Circuits II',3,'ee',['EE 112'],[],{retakeOf:ids['EE 213']});
  c(4,'EE 213L','Electric Circuits Lab',1,'ee',[],[],{coreqs:['EE 100','EE 213']});
  /* Fall 2027 */
  c(5,'CORE 201','PAMSA',4,'core');
  c(5,'CORE 2XX','Polities: Forms of Government',3,'core');
  c(5,'EE 241','Electromagnetic Theory',3,'ee',['MATH 202']);
  c(5,'EE 322','Analog and Digital Communication',3,'ee',['EE 252']);
  c(5,'EE 322L','Analog and Digital Communication Lab',1,'ee',[],[],{coreqs:['EE 322']});
  c(5,'EE 391L','Engineering Design and Innovation Lab',2,'design',['CS 101']);
  c(5,'ENGR 302','Systems Engineering and Project Management',2,'design');
  /* Spring 2028 */
  c(6,'CORE 202','Hikma',4,'core');
  c(6,'EE 331','Electrical Machines',3,'ee',['EE 213','EE 213L','EE 241']);
  c(6,'EE 331L','Electrical Machines Lab',1,'ee',[],[],{coreqs:['EE 331']});
  c(6,'EE 335','Power Generation, Transmission and Distribution',3,'ee',['EE 213','EE 213L','EE 211']);
  c(6,'EE 335L','Power Generation Lab',1,'ee',[],[],{coreqs:['EE 335']});
  c(6,'MATH 205','Linear Algebra',3,'math',['MATH 102']);
  c(6,'EE 490','Project Design',2,'design',['ENGR 291','EE 376','EE 391L']);
  c(6,'EE Elective 1','EE elective',3,'elec');
  /* Fall 2028 */
  c(7,'CORE 2XX D','Design Course',3,'core');
  c(7,'CS 224','Object-Oriented Programming and Design Methodologies',3,'math',['CS 102']);
  c(7,'CS 224L','Object-Oriented Programming Lab',1,'math',[],[],{coreqs:['CS 224']});
  c(7,'EE 491','Capstone Design Project I',2,'design',['EE 490']);
  c(7,'EE Elective 2','EE elective',3,'elec');
  c(7,'EE Elective 3','EE elective',3,'elec');
  /* Spring 2029 */
  c(8,'CORE 121','Jehan-e-Urdu',4,'core');
  c(8,'EE 492','Capstone Design Project II',2,'design',['EE 491']);
  c(8,'EE Elective 4','EE elective',3,'elec');
  c(8,'IDEE','Interdisciplinary engineering elective',3,'elec');
  c(8,'Free Elective','Free elective',3,'elec');
  return s;
}

let S=blank();
const U={route:'overview',course:null,tab:'assess',whatif:{},sel:null,busy:false,syl:{text:'',files:[],out:null,err:'',loading:false,term:''},toast:''};
let persist=function(){};
function mut(fn){fn();persist();render()}

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
