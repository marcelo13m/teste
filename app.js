(()=>{'use strict';
const C=window.Core,$=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',leaf:'<path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l8-8"/>',moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',wave:'<path d="M2 9c3-3 5 3 10 0s7 3 10 0M2 16c3-3 5 3 10 0s7 3 10 0"/>',peak:'<path d="M3 20l7-13 4 7 2-3 5 9z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',bolt:'<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
home:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',cal:'<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',book:'<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM5 16a4 4 0 0 1 4-4h10"/>',tune:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/>',plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',l:'<path d="M15 5l-7 7 7 7"/>',r:'<path d="M9 5l7 7-7 7"/>'};
const ICONSET=['sun','leaf','moon','wave','peak','star','heart','bolt'];
const ic=(n,s=20)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||P.sun}</svg>`;
const pad=n=>String(n).padStart(2,'0');
const split=ms=>{let s=Math.floor(ms/1e3);const d=Math.floor(s/86400);s%=86400;return{d,h:Math.floor(s/3600),m:Math.floor(s%3600/60),s:s%60}};
const lenTxt=ms=>{const t=split(ms);return t.d?`${t.d} ${t.d===1?'dia':'dias'} e ${t.h} h`:`${t.h} h ${t.m} min`};
const shortTxt=ms=>{const t=split(ms);return t.d?`${t.d} d`:`${t.h} h`};
const fmtDT=ms=>new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtD=ms=>new Date(ms).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const fmtT=ms=>new Date(ms).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const toInput=ms=>{const d=new Date(ms);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
const gname=g=>C.NAMES[g]||`${g} dias`,dias=n=>`${n} ${n===1?'dia':'dias'}`;
let S,tab='home',month=new Date(),selDay=null,deferred=null,persisted=null,snaps=[],lastKey='';
const A=()=>S.counters.find(c=>c.id===S.active)||S.counters[0]||null;
const dlg=$('#dlg'),err=m=>{const e=$('.err',dlg);if(e)e.textContent=m};
let tt;function toast(m,k=''){const t=$('#toast');t.className='toast show '+k;t.innerHTML=m;clearTimeout(tt);tt=setTimeout(()=>t.className='toast',3400)}
async function flush(){try{await DB.set('state',S);return true}catch(e){toast('Não foi possível salvar neste aparelho. Exporte um backup agora.','err');return false}}
async function commit(){await flush();render()}
const markSeen=c=>{c.seen=Object.keys(C.unlocked(c,Date.now())).map(Number)};
/* ---------- diálogos ---------- */
function openD(html){dlg.onclose=null;dlg.returnValue='';dlg.innerHTML=html;if(!dlg.open)dlg.showModal();const i=$('input:not([type=radio]):not([type=hidden]),textarea',dlg);return $('form',dlg)}
function confirmD(t,msg,ok='Confirmar',danger){return new Promise(res=>{openD(`<form method="dialog"><h2>${t}</h2><p class="mu">${msg}</p><div class="row"><button class="btn ghost" value="n">Cancelar</button><button class="btn${danger?' dng':''}" value="y">${ok}</button></div></form>`);dlg.onclose=()=>res(dlg.returnValue==='y')})}
const cancelBtn='<button type="button" class="btn ghost" data-act="close">Cancelar</button>';
function counterD(c){const nw=!c,now=Date.now();
 const f=openD(`<form id="f" novalidate><h2>${nw?'Novo acompanhamento':'Editar acompanhamento'}</h2>
 <label>Nome<input name="name" maxlength="40" required autocomplete="off" value="${c?esc(c.name):''}" placeholder="Um nome discreto"></label>
 <fieldset><legend>Ícone</legend><div class="icons">${ICONSET.map(k=>`<label class="ico"><input type="radio" name="icon" value="${k}"${(c?c.icon:'sun')===k?' checked':''}><span>${ic(k,22)}</span></label>`).join('')}</div></fieldset>
 <label>Data e horário de início<input type="datetime-local" name="start" required max="${toInput(now)}" value="${toInput(c?C.cur(c).start:now)}"></label>
 <label>Metas em dias<input name="goals" inputmode="numeric" autocomplete="off" value="${(c?c.goals:S.settings.goals).join(', ')}"><small>Separe por vírgula. Ex.: 1, 7, 30, 100</small></label>
 <p class="err" role="alert"></p><div class="row">${cancelBtn}<button class="btn">Salvar</button></div>${c?`<button type="button" class="btn ghost wide" data-act="delc">${ic('trash',16)} Excluir acompanhamento</button>`:''}</form>`);
 f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f),name=d.get('name').trim(),start=new Date(d.get('start')).getTime(),gs=C.parseGoals(d.get('goals')),t=Date.now();
  if(!name)return err('Informe um nome.');if(!Number.isFinite(start))return err('Informe a data e o horário de início.');if(start>t)return err('O início não pode estar no futuro.');if(!gs)return err('Informe metas em dias, inteiras e separadas por vírgula (ex.: 1, 7, 30).');
  if(nw){c={id:C.uid(),name,icon:d.get('icon'),created:t,goals:gs,seen:[],runs:[{start,end:null}],events:[]};S.counters.push(c);S.active=c.id}
  else{const m=C.setStart(c,start,t);if(m)return err(m);Object.assign(c,{name,icon:d.get('icon'),goals:gs})}
  markSeen(c);dlg.close();await commit();toast(nw?'Acompanhamento criado.':'Alterações salvas.')}}
function occD(c,v){const r=C.cur(c),now=Date.now();v=v||{when:now,note:''};
 const f=openD(`<form id="f" novalidate><h2>Registrar uma ocorrência</h2><p class="mu">Sem julgamentos: este registro apenas marca o fim do ciclo atual e inicia um novo. Todo o histórico anterior é mantido.</p>
 <label>Data e horário<input type="datetime-local" name="when" required min="${toInput(r.start)}" max="${toInput(now)}" value="${toInput(v.when)}"></label>
 <label>Observação (opcional)<textarea name="note" rows="3" maxlength="500" placeholder="Se quiser, anote o contexto.">${esc(v.note)}</textarea></label>
 <p class="err" role="alert"></p><div class="row">${cancelBtn}<button class="btn">Revisar</button></div></form>`);
 f.onsubmit=e=>{e.preventDefault();const d=new FormData(f),when=new Date(d.get('when')).getTime(),note=d.get('note').trim(),t=Date.now();
  if(!Number.isFinite(when))return err('Informe uma data e um horário válidos.');if(when>t)return err('A data não pode estar no futuro.');if(when<r.start)return err('A data precisa ser posterior ao início do ciclo atual.');
  const f2=openD(`<form id="f"><h2>Confirmar registro?</h2><p>Ciclo atual: <b>${lenTxt(when-r.start)}</b>. Ele será guardado no histórico e um novo ciclo começa em <b>${fmtDT(when)}</b>.</p>${note?`<p class="mu">“${esc(note)}”</p>`:''}<div class="row"><button type="button" class="btn ghost" data-act="occback">Voltar</button><button class="btn">Salvar registro</button></div></form>`);
  $('[data-act=occback]',dlg).onclick=()=>occD(c,{when,note});
  f2.onsubmit=async e=>{e.preventDefault();const m=C.occurrence(c,when,note,Date.now());if(m){dlg.close();return toast(m,'err')}dlg.close();await commit();toast('Registro salvo. Um novo ciclo começou; o histórico foi mantido.')}}}
function noteD(n){const nw=!n,sel=n?n.counterId:S.active;
 const f=openD(`<form id="f"><h2>${nw?'Nova anotação':'Editar anotação'}</h2><label>Acompanhamento<select name="c"><option value="">Nenhum</option>${S.counters.map(c=>`<option value="${c.id}"${sel===c.id?' selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
 <label>Anotação<textarea name="t" rows="6" maxlength="2000" required>${n?esc(n.text):''}</textarea></label>${nw?'<small>Data e horário são registrados automaticamente.</small>':''}
 <p class="err" role="alert"></p><div class="row">${cancelBtn}<button class="btn">Salvar</button></div></form>`);
 f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f),text=d.get('t').trim();if(!text)return err('Escreva algo para salvar.');
  if(nw)S.notes.push({id:C.uid(),counterId:d.get('c'),date:Date.now(),text});else{n.counterId=d.get('c');n.text=text}dlg.close();await commit();toast('Anotação salva.')}}
/* ---------- telas ---------- */
const noC=()=>`<section class="card empty"><h1>Nada por aqui ainda</h1><p>Crie um acompanhamento para ver esta tela.</p><button class="btn" data-act="newc">Criar acompanhamento</button></section>`;
function homeV(){const c=A();let h=`<div class="chips">${S.counters.map(x=>`<button class="chip${x===c?' on':''}" data-act="pick" data-id="${x.id}">${ic(x.icon,16)}<span>${esc(x.name)}</span></button>`).join('')}<button class="chip" data-act="newc" aria-label="Novo acompanhamento">${ic('plus',16)}</button></div>`;
 if(!c)return h+`<section class="card empty"><h1>Comece quando quiser</h1><p>Crie um acompanhamento para contar o tempo desde uma data e um horário. Tudo fica salvo só neste aparelho.</p><button class="btn" data-act="newc">Criar acompanhamento</button></section>`;
 const now=Date.now(),r=C.cur(c),st=C.stats(c,now),un=Object.keys(C.unlocked(c,now)).length;lastKey='';
 return h+`<section class="card hero"><div class="hrow"><span class="tag">${ic(c.icon,16)}${esc(c.name)}</span><button class="ib" data-act="editc" aria-label="Editar acompanhamento">${ic('edit',18)}</button></div>
 <div class="ringwrap"><svg viewBox="0 0 220 220" class="ring" aria-hidden="true"><circle class="rt" cx="110" cy="110" r="100"/><circle id="rp" class="rf" cx="110" cy="110" r="100" transform="rotate(-90 110 110)"/></svg><div class="center"><div class="big" id="dd"></div><div class="lbl" id="dl"></div></div></div>
 <div class="units" role="timer" aria-label="Tempo decorrido"><div><b id="uh"></b><small>horas</small></div><div><b id="um"></b><small>minutos</small></div><div><b id="us"></b><small>segundos</small></div></div>
 <p class="since">Desde ${fmtDT(r.start)}</p></section><section class="card" id="nx"></section>
 <section class="card"><h2>Resumo</h2><div class="mini"><div><b>${shortTxt(st.longest)}</b><small>maior sequência</small></div><div><b>${un}/${c.goals.length}</b><small>metas concluídas</small></div><div><b>${st.occ}</b><small>ocorrências</small></div></div>
 <button class="btn ghost wide" data-act="occ">Registrar uma ocorrência</button></section>`}
function paint(){const c=A();if(!c||tab!=='home'||!$('#dd'))return;const now=Date.now(),t=split(now-C.cur(c).start),n=C.nextGoal(c,now);
 $('#dd').textContent=t.d;$('#dl').textContent=t.d===1?'dia':'dias';$('#uh').textContent=pad(t.h);$('#um').textContent=pad(t.m);$('#us').textContent=pad(t.s);
 const rp=$('#rp');rp.style.strokeDasharray=628.3;rp.style.strokeDashoffset=628.3*(1-(n?n.pct:100)/100);
 const k=n?`${n.goal}-${Math.floor(n.pct)}-${n.left}`:'x';if(k===lastKey)return;lastKey=k;
 $('#nx').innerHTML=n?`<div class="hrow"><h2>Próxima conquista</h2><span class="pct">${Math.floor(n.pct)}%</span></div><p class="nm">${gname(n.goal)}</p><div class="bar" role="progressbar" aria-label="Progresso da meta" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor(n.pct)}"><i style="width:${n.pct}%"></i></div><p class="mu" style="margin-top:10px">${n.left===1?'Falta 1 dia':`Faltam ${n.left} dias`}.</p>`:`<h2>Todas as metas concluídas</h2><p class="mu" style="margin-top:8px">Edite o acompanhamento para adicionar novas metas.</p>`}
function calV(){const c=A();if(!c)return noC();const y=month.getFullYear(),m=month.getMonth(),n=new Date(y,m+1,0).getDate(),now=Date.now(),mn=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 let cells='<i></i>'.repeat(new Date(y,m,1).getDay());
 for(let d=1;d<=n;d++){const a=new Date(y,m,d).getTime(),b=new Date(y,m,d+1).getTime(),on=C.overlap(c,a,b,now)>0,oc=c.events.some(e=>e.date>=a&&e.date<b),nt=S.notes.some(x=>x.counterId===c.id&&x.date>=a&&x.date<b);
  cells+=`<button class="dy${on?' on':''}${oc?' oc':''}${now>=a&&now<b?' td':''}${selDay===a?' sl':''}" data-act="day" data-t="${a}" aria-label="${d} de ${mn}${on?', acompanhado':''}${oc?', com ocorrência':''}${nt?', com anotação':''}">${d}${nt?'<s></s>':''}</button>`}
 const cyc=c.runs.map((r,i)=>`<div class="li"><div class="hrow"><b>Ciclo ${i+1}</b><span class="mu">${lenTxt(C.dur(r,now))}</span></div><small>${fmtDT(r.start)} → ${r.end==null?'em andamento':fmtDT(r.end)}</small></div>`).reverse().join('');
 return `<h1>Calendário</h1><p class="mu">${esc(c.name)}</p><section class="card"><div class="hrow"><button class="ib" data-act="mprev" aria-label="Mês anterior">${ic('l',18)}</button><h2 style="text-transform:capitalize">${mn}</h2><button class="ib" data-act="mnext" aria-label="Próximo mês">${ic('r',18)}</button></div>
 <div class="cal">${'DSTQQSS'.split('').map(x=>`<span>${x}</span>`).join('')}${cells}</div>
 <div class="leg"><span><i style="background:color-mix(in srgb,var(--ac) 30%,var(--s2))"></i>acompanhado</span><span><i style="border-color:var(--dn)"></i>ocorrência</span><span><i style="border-color:var(--ac)"></i>hoje</span><span><i style="background:var(--ac);border-radius:50%;width:6px;height:6px"></i>anotação</span></div></section>
 <section class="card"><h2>${selDay==null?'Dia selecionado':fmtD(selDay)}</h2><div style="margin-top:8px">${dayD(c)}</div></section><section class="card"><h2>Histórico de ciclos</h2><div style="margin-top:6px">${cyc}</div></section>`}
function dayD(c){if(selDay==null)return'<p class="mu">Toque em um dia para ver os registros.</p>';const a=selDay,b=new Date(a);b.setDate(b.getDate()+1);const e=b.getTime(),it=[];
 c.runs.forEach((r,i)=>{if(r.start>=a&&r.start<e&&i===0)it.push([r.start,'Início do acompanhamento',''])});
 c.events.filter(x=>x.date>=a&&x.date<e).forEach(x=>it.push([x.date,'Ocorrência registrada',x.note]));
 S.notes.filter(x=>x.counterId===c.id&&x.date>=a&&x.date<e).forEach(x=>it.push([x.date,'Anotação',x.text]));
 it.sort((p,q)=>p[0]-q[0]);return it.length?it.map(x=>`<div class="li"><div class="hrow"><b>${x[1]}</b><span class="mu">${fmtT(x[0])}</span></div>${x[2]?`<p class="mu" style="white-space:pre-wrap">${esc(x[2])}</p>`:''}</div>`).join(''):'<p class="mu">Sem registros neste dia.</p>'}
function bars(v,l){const mx=Math.max(1,...v),W=320,H=120,bw=W/v.length,f=x=>x>0&&x<1?'<1':Math.round(x);
 return `<svg viewBox="0 0 ${W} ${H+20}" class="chart" role="img" aria-label="${l.map((s,i)=>`${s}: ${f(v[i])} dias`).join('; ')}">${v.map((x,i)=>{const h=x/mx*(H-16),px=i*bw+bw*.18,w=bw*.64;return `<rect x="${px}" y="${H-h}" width="${w}" height="${Math.max(h,x>0?3:0)}" rx="5" class="bx${i===v.length-1?' cur':''}"/>${x>0?`<text x="${px+w/2}" y="${H-h-5}" text-anchor="middle">${f(x)}</text>`:''}<text x="${px+w/2}" y="${H+14}" text-anchor="middle" class="ax">${l[i]}</text>`}).join('')}</svg>`}
function progV(){const c=A();if(!c)return noC();const now=Date.now(),st=C.stats(c,now),un=C.unlocked(c,now),wv=[],wl=[],mv=[],ml=[];
 for(let i=7;i>=0;i--){const s=new Date(now);s.setDate(s.getDate()-s.getDay()-7*i);s.setHours(0,0,0,0);const e=new Date(s);e.setDate(e.getDate()+7);wv.push(C.overlap(c,s.getTime(),e.getTime(),now));wl.push(`${pad(s.getDate())}/${pad(s.getMonth()+1)}`)}
 const d0=new Date(now);for(let i=5;i>=0;i--){const s=new Date(d0.getFullYear(),d0.getMonth()-i,1),e=new Date(d0.getFullYear(),d0.getMonth()-i+1,1);mv.push(C.overlap(c,s.getTime(),e.getTime(),now));ml.push(s.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''))}
 const S6=[['Sequência atual',lenTxt(st.current)],['Maior sequência',lenTxt(st.longest)],['Tempo total acompanhado',lenTxt(st.total)],['Metas concluídas',`${Object.keys(un).length} de ${c.goals.length}`],['Ciclos',st.cycles],['Ocorrências',st.occ]];
 return `<h1>Progresso</h1><p class="mu">${esc(c.name)}</p><div class="grid">${S6.map(x=>`<div class="st"><b>${x[1]}</b><small>${x[0]}</small></div>`).join('')}</div>
 <section class="card"><h2>Dias acompanhados por semana</h2>${bars(wv,wl)}</section><section class="card"><h2>Dias acompanhados por mês</h2>${bars(mv,ml)}</section>
 <section class="card"><h2>Conquistas</h2><div class="ach">${c.goals.map((g,i)=>{const u=un[g],hue=(i*47+30)%360,n=C.nextGoal(c,now);return `<div class="am${u?'':' lk'}"><div class="badge" style="background:hsl(${hue} 45% 38%);border-color:hsl(${hue} 60% 65%)">${g}</div><div><b>${gname(g)}</b><small>${u?'Desbloqueada em '+fmtD(u):(n&&n.goal===g?`Faltam ${n.left} ${n.left===1?'dia':'dias'}`:'Bloqueada')}</small></div></div>`}).join('')}</div></section>`}
function diaryV(){const ns=S.notes.slice().sort((a,b)=>b.date-a.date);
 return `<div class="hrow"><h1>Diário</h1><button class="btn" data-act="newn">${ic('plus',16)} Nova</button></div><p class="mu">Anotações privadas, salvas só neste aparelho.</p>
 <section class="card">${ns.length?ns.map(n=>{const c=S.counters.find(x=>x.id===n.counterId);return `<div class="li"><div class="hrow"><div><b>${fmtDT(n.date)}</b>${c?`<small style="display:block">${esc(c.name)}</small>`:''}</div><div style="display:flex;gap:6px"><button class="ib" data-act="editn" data-id="${n.id}" aria-label="Editar anotação">${ic('edit',16)}</button><button class="ib" data-act="deln" data-id="${n.id}" aria-label="Excluir anotação">${ic('trash',16)}</button></div></div><p style="white-space:pre-wrap;margin-top:8px">${esc(n.text)}</p></div>`}).join(''):'<div class="empty"><p>Nenhuma anotação ainda. Registre como você está se sentindo, quando quiser.</p></div>'}</section>`}
const PRE=['#f0b667','#6cc3d5','#8fd18a','#f08b7a','#b3a1f0'],THN={dark:'Escuro',light:'Claro',system:'Sistema'};
function setV(){const s=S.settings;
 return `<h1>Ajustes</h1><section class="card"><h2>Tema</h2><div class="seg">${Object.keys(THN).map(k=>`<button data-act="theme" data-v="${k}" aria-pressed="${s.theme===k}">${THN[k]}</button>`).join('')}</div>
 <h2 style="margin-top:18px">Cor de destaque</h2><div class="sws">${PRE.map(c=>`<button class="sw" style="background:${c}" data-act="accent" data-v="${c}" aria-pressed="${s.accent.toLowerCase()===c}" aria-label="Cor ${c}"></button>`).join('')}<input type="color" id="accIn" value="${s.accent}" aria-label="Cor personalizada"></div></section>
 <section class="card"><h2>Metas padrão</h2><p class="mu">Usadas ao criar novos acompanhamentos. Cada acompanhamento tem suas próprias metas.</p><form id="gf"><label>Metas em dias<input name="g" value="${s.goals.join(', ')}" inputmode="numeric" autocomplete="off"></label><p class="err" id="gerr" role="alert"></p><button class="btn ghost">Salvar metas padrão</button></form></section>
 <section class="card"><h2>Dados e backup</h2><p class="mu">Tudo fica neste aparelho. Exporte um backup de vez em quando e guarde fora do celular.</p><div class="row" style="flex-wrap:wrap"><button class="btn" data-act="export">Exportar backup</button><button class="btn ghost" data-act="import">Importar backup</button></div>
 ${snaps.length?`<h2 style="margin-top:18px">Cópias automáticas</h2><p class="mu">Guardadas no aparelho para recuperar erros recentes.</p>${snaps.map(k=>`<div class="li hrow"><span>${k==='snap:pre-import'?'Antes da última importação':k==='snap:pre-restore'?'Antes da última restauração':fmtD(new Date(k.slice(5)+'T12:00:00').getTime())}</span><button class="btn ghost" style="padding:8px 14px" data-act="restore" data-k="${k}">Restaurar</button></div>`).join('')}`:''}</section>
 <section class="card"><h2>Instalação e armazenamento</h2><p class="mu">${persisted===true?'O navegador marcou os dados como persistentes.':'Se possível, instale o app: dados de sites não instalados podem ser limpos pelo navegador.'}</p><button class="btn ghost wide" data-act="install">Instalar aplicativo</button></section>
 <section class="card"><h2>Excluir dados</h2><p class="mu">Remove tudo deste aparelho, inclusive as cópias automáticas.</p><button class="btn dng wide" data-act="wipe">Excluir todos os dados</button></section>
 <p class="mu" style="text-align:center;font-size:13px;margin-top:18px">Recomeço 2.0 · funciona offline · sem conta, sem anúncios · código aberto</p>`}
const VIEWS={home:homeV,cal:calV,prog:progV,diary:diaryV,set:setV},NAV=[['home','Início','home'],['cal','Calendário','cal'],['prog','Progresso','chart'],['diary','Diário','book'],['set','Ajustes','tune']];
function theme(){const t=S.settings.theme,th=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t,r=document.documentElement;r.dataset.theme=th;r.style.setProperty('--a',S.settings.accent);$('meta[name=theme-color]').content=th==='dark'?'#0e1216':'#f6f3ee'}
function render(){theme();$('#main').innerHTML=VIEWS[tab]();$('#nav').innerHTML=NAV.map(n=>`<button data-act="tab" data-tab="${n[0]}"${tab===n[0]?' aria-current="page"':''}>${ic(n[2],22)}${n[1]}</button>`).join('');paint()}
/* ---------- ações ---------- */
function dl(name,obj){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4e3)}
async function refreshSnaps(){try{snaps=(await DB.keys()).filter(k=>String(k).startsWith('snap:')).sort().reverse()}catch{snaps=[]}}
const ACT={
 pick:e=>{S.active=e.dataset.id;selDay=null;commit()},newc:()=>counterD(null),editc:()=>counterD(A()),occ:()=>occD(A()),close:()=>dlg.close(),
 day:e=>{selDay=selDay===+e.dataset.t?null:+e.dataset.t;render()},mprev:()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);selDay=null;render()},mnext:()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);selDay=null;render()},
 tab:e=>{tab=e.dataset.tab;scrollTo(0,0);render()},newn:()=>noteD(null),editn:e=>noteD(S.notes.find(n=>n.id===e.dataset.id)),
 deln:async e=>{if(await confirmD('Excluir anotação?','Esta anotação será removida deste aparelho.','Excluir',1)){S.notes=S.notes.filter(n=>n.id!==e.dataset.id);await commit()}},
 delc:async()=>{const c=A();if(await confirmD('Excluir acompanhamento?',`“${esc(c.name)}”, seus ciclos e suas anotações serão removidos. Se tiver dúvida, exporte um backup antes.`,'Excluir',1)){S.counters=S.counters.filter(x=>x!==c);S.notes=S.notes.filter(n=>n.counterId!==c.id);S.active=S.counters[0]?S.counters[0].id:null;await commit();toast('Acompanhamento excluído.')}},
 theme:e=>{S.settings.theme=e.dataset.v;commit()},accent:e=>{S.settings.accent=e.dataset.v;commit()},
 export:()=>{dl('recomeco-backup-'+toInput(Date.now()).slice(0,10)+'.json',{...S,app:'recomeco',exportedAt:new Date().toISOString()});toast('Backup exportado.')},
 import:()=>$('#file').click(),
 restore:async e=>{const k=e.dataset.k;try{const raw=await DB.get(k);if(!raw||!await confirmD('Restaurar cópia?','Os dados atuais serão substituídos. Uma cópia deles fica guardada antes.','Restaurar'))return;await DB.set('snap:pre-restore',S);S=C.migrate(raw);await refreshSnaps();await commit();toast('Cópia restaurada.')}catch{toast('Não foi possível restaurar.','err')}},
 install:async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null}else toast('No Chrome: menu ⋮ → Instalar app (ou Adicionar à tela inicial).')},
 wipe:()=>{const f=openD(`<form id="f"><h2>Excluir todos os dados</h2><p class="mu">Remove acompanhamentos, ciclos, anotações e cópias automáticas deste aparelho. Não é possível desfazer.</p><label>Digite EXCLUIR para confirmar<input name="w" autocomplete="off"></label><p class="err" role="alert"></p><div class="row">${cancelBtn}<button class="btn dng">Excluir tudo</button></div></form>`);
  f.onsubmit=async e=>{e.preventDefault();if($('[name=w]',dlg).value.trim().toUpperCase()!=='EXCLUIR')return err('Digite EXCLUIR para confirmar.');try{for(const k of await DB.keys())await DB.del(k)}catch{}localStorage.removeItem('recomeco-data-v1');S=C.migrate({});snaps=[];dlg.close();tab='home';await commit();toast('Todos os dados foram excluídos.')}}};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&ACT[el.dataset.act])ACT[el.dataset.act](el,e)});
document.addEventListener('change',e=>{if(e.target.id==='accIn'){S.settings.accent=e.target.value;commit()}});
document.addEventListener('submit',e=>{if(e.target.id!=='gf')return;e.preventDefault();const g=C.parseGoals(new FormData(e.target).get('g'));if(!g)return void($('#gerr').textContent='Use dias inteiros separados por vírgula (ex.: 1, 7, 30).');S.settings.goals=g;commit().then(()=>toast('Metas padrão salvas.'))});
$('#file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>5e6)throw 0;const raw=JSON.parse(await f.text());if(!raw||(raw.v!==2&&!Array.isArray(raw.counters)))throw 0;const d=C.migrate(raw);
 if(!await confirmD('Importar backup?',`O arquivo tem ${d.counters.length} acompanhamento(s) e ${d.notes.length} anotação(ões). Os dados atuais serão substituídos; uma cópia deles fica guardada antes.`,'Importar'))return;
 await DB.set('snap:pre-import',S);S=d;await refreshSnaps();await commit();toast('Backup importado.')}catch{toast('Arquivo inválido. Escolha um backup exportado pelo Recomeço.','err')}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(S&&S.settings.theme==='system')render()});
/* ---------- conquistas e relógio ---------- */
function checkAch(){const now=Date.now();let fresh=[];S.counters.forEach(c=>{const f=Object.keys(C.unlocked(c,now)).map(Number).filter(g=>!c.seen.includes(g));if(f.length){c.seen.push(...f);fresh.push(c.name,f)}});
 if(fresh.length){flush();const g=Math.max(...fresh.filter(Array.isArray).flat());toast(`Conquista desbloqueada: <b>${gname(g)}</b>`,'ach');const r=$('.ringwrap');if(r){r.classList.remove('pulse');void r.offsetWidth;r.classList.add('pulse')}if(tab!=='home')return;lastKey=''}}
function tick(){if(!S)return;checkAch();paint()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S){checkAch();if(tab==='home')render()}});
/* ---------- inicialização ---------- */
async function boot(){let raw=null,ok=true;
 try{raw=await DB.get('state');if(!raw){const l=localStorage.getItem('recomeco-data-v1');if(l)try{raw=JSON.parse(l)}catch{}}}catch(e){ok=false}
 S=C.migrate(raw||{});
 if(ok){try{const d=new Date(),k=`snap:${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,keys=(await DB.keys()).map(String);
  if(S.counters.length&&!keys.includes(k))await DB.set(k,S);const daily=keys.concat(k).filter((x,i,a)=>/^snap:\d{4}-/.test(x)&&a.indexOf(x)===i).sort();for(const x of daily.slice(0,-7))await DB.del(x);
  await DB.set('state',S);if(navigator.storage&&navigator.storage.persist){persisted=await navigator.storage.persisted();if(!persisted)persisted=await navigator.storage.persist()}await refreshSnaps()}catch{}}
 render();if(!ok)toast('Armazenamento indisponível neste navegador: nada será salvo. Exporte backups.','err');
 setInterval(tick,1000);
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})}
window.addEventListener('error',()=>toast('Algo deu errado. Seus dados salvos continuam seguros.','err'));
boot();
})();
