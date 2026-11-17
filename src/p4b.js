
/* ---------- GPA lab ---------- */
/* What the rest of the degree has to average. Retaken courses drop their old grade, CR courses carry no points, and credits not yet in a term still count as future work. */
function outlook(){
  const sc=S.settings.scale,maxP=Math.max.apply(null,sc.map(x=>x.p)),tg=S.settings.targetGpa,tot=S.settings.totalCredits,rp=S.settings.retakeReplaces!==false;
  const hasRt=c=>rp&&S.courses.some(o=>o.retakeOf===c.id),crTerm=c=>!!(termOf(c.term)||{}).cr;
  const base=gpaOf(doneCourses().filter(c=>!hasRt(c)),false);
  const rest=S.courses.filter(c=>status(c)!=='done'&&counts(c)&&!crTerm(c)).reduce((a,c)=>a+c.credits,0);
  const ung=doneCourses().filter(c=>counts(c)&&!c.grade&&!crTerm(c)).reduce((a,c)=>a+c.credits,0);
  const R=rest+ung+Math.max(0,tot-placedCredits()),N=base.cr+R;
  const need=R>0?(tg*N-base.pts)/R:null,best=R>0?(base.pts+maxP*R)/N:base.gpa;
  const retaken=S.courses.filter(c=>hasRt(c)&&c.grade);
  const cands=doneCourses().filter(c=>counts(c)&&!hasRt(c)&&c.grade&&!crTerm(c)&&pointsOf(c.grade)!=null&&pointsOf(c.grade)<maxP).map(c=>{
    const p=pointsOf(c.grade),w=rp?(base.pts-p*c.credits+maxP*(R+c.credits))/N:(base.pts+maxP*(R+c.credits))/(N+c.credits);
    return{c,p,gain:w-best};}).filter(x=>x.gain>=0.005).sort((a,b)=>b.gain-a.gain).slice(0,4);
  const retakes=S.courses.filter(o=>o.retakeOf&&getC(o.retakeOf));
  return{maxP,tg,R,N,base,need,best,cands,retakes,ung};
}
function vGpa(){
  const cum=cumulative(),o=outlook(),tg=o.tg,maxP=o.maxP;
  const lab=curCourses().concat(planCourses());
  const over=U.whatif;
  const pr=gpaOf(doneCourses().concat(lab),true,over);
  const ladder=[maxP,3.7,3.3,3,2.7].map(x=>({x,f:o.R>0?(o.base.pts+x*o.R)/o.N:cum.gpa}));
  const tr=trend();
  const curCr=curCourses().filter(c=>!(termOf(c.term)||{}).cr).reduce((a,c)=>a+c.credits,0);
  const thisNeed=curCr>0&&cum.cr>0?(tg*(cum.cr+curCr)-cum.pts)/curCr:null;
  const thisBest=curCr>0&&cum.cr>0?(cum.pts+maxP*curCr)/(cum.cr+curCr):null;
  const opts=sel=>['<option value="">–</option>'].concat(S.settings.scale.map(x=>`<option ${sel===x.l?'selected':''}>${x.l}</option>`)).join('');
  const far=o.need!=null&&o.need>maxP+1e-6,farT=thisNeed!=null&&thisNeed>maxP+1e-6;
  const rtNote=o.retakes.length?` It counts your retake${o.retakes.length>1?'s':''} of ${o.retakes.map(r=>esc((getC(r.retakeOf)||{}).code||r.code)).join(', ')}, which replace${o.retakes.length>1?'':'s'} the old grade.`:'';
  const card2=o.need==null?`<div class="num" style="margin:10px 0 6px">–</div><div class="small muted">Every degree credit is graded.</div>`:
    far?`<div class="num" style="margin:10px 0 6px;color:var(--bad);font-size:34px;line-height:1.35">Out of reach</div><div class="small muted">It would take an average of ${fmt(o.need)}, and the top grade is ${fmt(maxP,1)}. The best you can finish at is <b>${fmt(o.best)}</b> with straight ${fmt(maxP,1)}s from here.${rtNote}</div>`:
    `<div class="num" style="margin:10px 0 6px">${o.need<=0?'0.00':fmt(o.need)}</div><div class="small muted">${o.need<=0?'Already secured.':`average over the remaining ${o.R} credits. The best you can finish at is ${fmt(o.best)}.`}${rtNote}</div>`;
  const card3=thisNeed==null?`<div class="num" style="margin:10px 0 6px">–</div><div class="small muted">No graded credits yet.</div>`:
    farT?`<div class="num" style="margin:10px 0 6px;color:var(--bad);font-size:34px;line-height:1.35">Not this term</div><div class="small muted">Even straight ${fmt(maxP,1)}s only lift you to <b>${fmt(thisBest)}</b> this term. ${fmt(tg)} is a goal for later terms.</div>`:
    `<div class="num" style="margin:10px 0 6px">${thisNeed<=0?'0.00':fmt(thisNeed)}</div><div class="small muted">to sit at ${fmt(tg)} when this term posts. Straight ${fmt(maxP,1)}s would give ${fmt(thisBest)}.</div>`;
  return head('GPA lab','See where your GPA stands, what the rest of the degree has to average to reach your target, and what a few grades would do.')+
  `<div class="grid g3"><div class="card"><div class="lbl">Cumulative now</div><div class="num" style="margin:10px 0 6px">${fmt(cum.gpa)}</div><div class="small muted">${cum.cr} graded credits</div></div>
  <div class="card"><div class="lbl">Needed for ${fmt(tg)} at graduation</div>${card2}</div>
  <div class="card"><div class="lbl">Needed this term</div>${card3}</div></div>
  <div class="grid g2 sec"><div><h2>If you average…</h2><div class="card" style="padding:4px 16px">${ladder.map(l=>`<div class="kv"><span>${fmt(l.x,1)} on the remaining ${o.R} credits</span><span class="mono" style="color:var(--${l.f>=tg?'good':'bad'})">${fmt(l.f)}</span></div>`).join('')}${o.ung?`<div class="small muted" style="padding:8px 0">Includes ${o.ung} credits of finished courses with no grade entered yet.</div>`:''}</div>
  ${o.cands.length?`<h2 style="margin-top:22px">Worth retaking</h2><div class="card" style="padding:4px 16px">${o.cands.map(x=>`<div class="kv"><span>${esc(x.c.code)} · ${esc(x.c.grade)} · ${x.c.credits} cr</span><span class="mono" style="color:var(--good)">+${fmt(x.gain)}</span></div>`).join('')}<div class="small muted" style="padding:8px 0">How much higher you could finish if you retook it and earned ${fmt(maxP,1)}.</div></div>`:''}</div>
  <div><h2>By term</h2><div class="card scroll" style="padding:4px 16px"><table class="t"><thead><tr><th>Term</th><th class="r">Credits</th><th class="r">GPA</th><th class="r">Cumulative</th></tr></thead><tbody>${tr.map(r=>{const t=S.terms.find(x=>x.name===r.name);return`<tr><td>${esc(r.name)}${r.cur?' <span class="pill acc">so far</span>':''}</td><td class="r mono">${t?termCredits(t.id):''}</td><td class="r mono">${fmt(r.term)}</td><td class="r mono">${fmt(r.cum)}</td></tr>`}).join('')||'<tr><td colspan="4" class="muted">No graded terms yet</td></tr>'}</tbody></table></div></div></div>
`+termPlanSection()+whatIf(cum)+transcriptSection();
}

/* ---------- requirements and minors ---------- */
function vReq(){
  const cp=catProgress().filter(x=>!(x.k.k==='minor'&&!S.courses.some(c=>c.cat==='minor')));
  const placed=placedCredits(),tot=S.settings.totalCredits,diff=tot-placed;
  const chips=k=>S.courses.filter(c=>c.cat===k).map(c=>`<button class="pill ${status(c)==='done'?'good':status(c)==='current'?'acc':''}" data-a="open" data-id="${c.id}" style="border:0;cursor:pointer">${esc(c.code)}</button>`).join(' ');
  const state=x=>x.k.req<=0?`<span class="mono small muted">${x.e+x.cu+x.pl} cr</span>`:`<span class="mono small muted">${x.e} earned · ${x.cu} now · ${x.pl} planned · ${x.over>0?`<b style="color:var(--warn)">${x.over} over</b>`:x.left>0?`<b style="color:var(--warn)">${x.left} not yet in a term</b>`:'<b style="color:var(--good)">fully planned</b>'}</span>`;
  const free=S.courses.filter(c=>isFree(c)&&isPh(c));
  return head('Requirements','Credits by category, and how a minor would fit around them.')+
  `<div class="grid g2"><div class="card" style="display:flex;flex-direction:column;gap:18px">${cp.map(x=>`<div><div class="row between"><h3>${esc(x.k.n)}</h3>${state(x)}</div>${x.k.req>0?`<div class="bar" style="margin:8px 0 10px"><i class="d" style="width:${Math.min(100,x.e/x.k.req*100)}%"></i><i style="width:${Math.min(100,x.cu/x.k.req*100)}%"></i><i class="p" style="width:${Math.min(100,x.pl/x.k.req*100)}%"></i></div>`:'<div style="height:8px"></div>'}<div class="row" style="gap:6px">${chips(x.k.k)||'<span class="small muted">No courses yet</span>'}</div></div>`).join('')}<p class="small muted" style="margin:0">“Not yet in a term” means the category still needs that many credits and no course for them is in any term. “Over” means you have planned more than it asks for.</p></div>
  <div class="card"><div class="lbl">Credits planned</div><div class="num" style="margin:10px 0 6px">${placed}<span class="muted" style="font-size:22px"> / ${tot}</span></div><div class="small muted">${diff>0?`${diff} credits of the degree are not in any term yet.`:diff===0?'Every credit of your degree has a place in a term, so the plan is full. A minor course either takes the place of a free elective, or goes on top and adds to your total.':`Your plan holds ${-diff} credits beyond the ${tot} your degree needs. That is normal with a minor. It only matters if a term goes over its credit limit.`}${free.length?` Free elective slots left: ${free.length}.`:''}</div></div></div>`+minorsSection();
}

function vPlan(){
  const t=U.planTab||'grid',tabs=[['grid','Four years'],['roadmap','Roadmap'],['req','Requirements'],['enroll','Enrollment']];
  let v='';INNER=true;try{v=({grid:vGrid,roadmap:vRoadmap,req:vReq,enroll:vEnroll})[t]()}finally{INNER=false}
  return head('Plan','Where every course sits, how they connect, and what the degree still needs.')+`<div class="tabs">${tabs.map(x=>`<a href="#${x[0]}" ${t===x[0]?'aria-current="page"':''}>${x[1]}</a>`).join('')}</div>`+v;
}
