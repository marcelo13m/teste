/* Núcleo puro (sem DOM): ciclos, metas, estatísticas, migração. Testável em Node. */
(function(g){'use strict';
const DAY=864e5,DEF=[1,3,7,15,30,60,90,180,365,500,730];
const NAMES={1:'Primeiro dia',3:'Três dias',7:'Uma semana',15:'Quinzena',30:'Um mês',60:'Dois meses',90:'Três meses',180:'Seis meses',365:'Um ano',500:'500 dias',730:'Dois anos'};
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const cur=c=>{const r=c.runs[c.runs.length-1];return r&&r.end==null?r:null};
const dur=(r,now)=>Math.max(0,(r.end==null?now:r.end)-r.start);
function stats(c,now){const d=c.runs.map(r=>dur(r,now)),r=cur(c);return{current:r?dur(r,now):0,longest:Math.max(0,...d),total:d.reduce((a,b)=>a+b,0),cycles:c.runs.length,occ:c.events.length}}
function unlocked(c,now){const m={};for(const g of c.goals){let b=null;for(const r of c.runs)if(dur(r,now)>=g*DAY){const t=r.start+g*DAY;if(b==null||t<b)b=t}if(b!=null)m[g]=b}return m}
function nextGoal(c,now){const r=cur(c),e=r?dur(r,now):0,g=c.goals.find(x=>x*DAY>e);return g?{goal:g,pct:Math.min(100,e/(g*DAY)*100),left:Math.ceil((g*DAY-e)/DAY)}:null}
function overlap(c,a,b,now){let t=0;for(const r of c.runs){const s=Math.max(a,r.start),e=Math.min(b,r.end==null?now:r.end);if(e>s)t+=e-s}return t/DAY}
function occurrence(c,when,note,now){const r=cur(c);if(!r)return'Acompanhamento inválido.';if(!Number.isFinite(when))return'Informe uma data e um horário válidos.';if(when>now+6e4)return'A data não pode estar no futuro.';if(when<r.start)return'A data precisa ser posterior ao início do ciclo atual.';r.end=when;c.runs.push({start:when,end:null});c.events.push({id:uid(),date:when,note:String(note||'').trim().slice(0,500)});return null}
function setStart(c,ms,now){const r=cur(c),p=c.runs[c.runs.length-2];if(!Number.isFinite(ms))return'Informe uma data e um horário válidos.';if(ms>now)return'O início não pode estar no futuro.';if(p&&ms<p.end)return'O início não pode ser anterior ao fim do ciclo anterior.';r.start=ms;return null}
function parseGoals(s){const a=[...new Set(String(s).split(/[\s,;]+/).filter(Boolean).map(Number))];if(!a.length||a.length>40||a.some(n=>!Number.isInteger(n)||n<1||n>36500))return null;return a.sort((x,y)=>x-y)}
function normalize(d){
 const S=Object.assign({theme:'dark',accent:'#f0b667',goals:DEF.slice()},d.settings&&typeof d.settings==='object'?d.settings:{});
 if(!['dark','light','system'].includes(S.theme))S.theme='dark';
 if(!/^#[0-9a-f]{6}$/i.test(S.accent))S.accent='#f0b667';
 if(!Array.isArray(S.goals)||!S.goals.length)S.goals=DEF.slice();
 const counters=(Array.isArray(d.counters)?d.counters:[]).filter(c=>c&&Array.isArray(c.runs)).map(c=>{
  const runs=c.runs.map(r=>({start:+r.start,end:r.end==null?null:+r.end})).filter(r=>Number.isFinite(r.start)&&(r.end==null||Number.isFinite(r.end)));
  if(!runs.length)return null;runs[runs.length-1].end=null;
  const goals=(Array.isArray(c.goals)?c.goals:S.goals).map(Number).filter(n=>Number.isInteger(n)&&n>0).sort((a,b)=>a-b);
  return{id:String(c.id||uid()),name:String(c.name||'Acompanhamento').slice(0,40),icon:String(c.icon||'sun'),created:+c.created||Date.now(),goals:goals.length?[...new Set(goals)]:DEF.slice(),seen:Array.isArray(c.seen)?c.seen.map(Number):[],runs,
   events:(Array.isArray(c.events)?c.events:[]).map(e=>({id:String(e.id||uid()),date:+e.date,note:String(e.note||'').slice(0,500)})).filter(e=>Number.isFinite(e.date))}}).filter(Boolean);
 const notes=(Array.isArray(d.notes)?d.notes:[]).map(n=>({id:String(n.id||uid()),counterId:String(n.counterId||''),date:+n.date,text:String(n.text||'').slice(0,2000)})).filter(n=>Number.isFinite(n.date)&&n.text);
 const active=counters.some(c=>c.id===d.active)?d.active:(counters[0]?counters[0].id:null);
 return{v:2,settings:S,active,counters,notes}}
function migrate(raw){
 raw=raw&&typeof raw==='object'?raw:{};
 if(raw.v===2)return normalize(raw);
 if(Array.isArray(raw.counters)){ /* v1 (localStorage): datas de ciclos antigos foram sobrescritas; só o ciclo atual é conhecido */
  const counters=raw.counters.map(c=>{const s=Date.parse(c.start),g=DEF.slice();if(Number.isInteger(c.goal)&&c.goal>0&&!g.includes(c.goal))g.push(c.goal);
   return{id:c.id,name:c.name,icon:'sun',created:Date.parse(c.created)||Date.now(),goals:g.sort((a,b)=>a-b),runs:[{start:s,end:null}],
    events:(c.events||[]).filter(e=>e.type==='reset').map(e=>({id:e.id,date:Date.parse(e.date),note:e.note}))}});
  const o=normalize({v:2,active:raw.activeId,counters,notes:(raw.diary||[]).map(x=>({id:x.id,counterId:x.counterId,date:Date.parse(x.date),text:x.text}))});
  o.counters.forEach(c=>c.seen=Object.keys(unlocked(c,Date.now())).map(Number));return o}
 return normalize({});
}
const api={DAY,DEF,NAMES,uid,cur,dur,stats,unlocked,nextGoal,overlap,occurrence,setStart,parseGoals,normalize,migrate};
if(typeof module!=='undefined')module.exports=api;else g.Core=api;
})(this);
