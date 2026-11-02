export function startStats(A,T){
const{S,DB,$,esc}=A;let M=new Map(),dirty=new Set(),mode='week',off=0,cu={};
const dk=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const ent=s=>{const day=dk(new Date()),k=day+'|'+s.id;let e=M.get(k);if(!e){e={k,day,id:s.id,title:s.title,artist:s.artist||'',game:s.game||'',cat:s.cat,ms:0,starts:0,done:0,partial:0};M.set(k,e)}e.title=s.title;e.artist=s.artist||'';e.cat=s.cat;return e};
const mark=e=>dirty.add(e.k);
async function flush(){if(!dirty.size)return;const a=[...dirty].map(k=>M.get(k));dirty.clear();await DB.sPut(a)}
const load=async()=>{M=new Map((await DB.sAll()||[]).map(e=>[e.k,e]))};
/* contabilidad: solo avanza el tiempo REAL de reproducción (currentTime del audio mientras suena) */
window.dtStat={
 fin(a){const x=a.dtSes;if(!x||x.fin)return;x.fin=true;const done=x.ended||(isFinite(a.duration)&&a.duration-a.currentTime<1.5),e=ent(x.s);done?e.done++:e.partial++;mark(e)},
 start(a,s){if(!a.dtL){a.dtL=1;a.addEventListener('timeupdate',()=>{const x=a.dtSes;if(!x||a.paused)return;const d=a.currentTime-(a.dtLast??a.currentTime);a.dtLast=a.currentTime;if(d>0&&d<1.5){const e=ent(x.s);e.ms+=d*1000;mark(e)}});
 ['play','pause','seeking','seeked'].forEach(v=>a.addEventListener(v,()=>a.dtLast=a.currentTime));a.addEventListener('ended',()=>{if(a.dtSes)a.dtSes.ended=true})}
 a.dtSes={s,ended:false};a.dtLast=a.currentTime;const e=ent(s);e.starts++;mark(e)}};
setInterval(flush,5000);document.addEventListener('visibilitychange',()=>document.hidden&&flush());addEventListener('pagehide',flush);
window.dtStats={all:async()=>{await flush();return DB.sAll()},
 async import(arr,idMap,rep){await flush();if(rep){await DB.sClear();M.clear()}const out=new Map();
 for(const x of arr){if(!x||!x.day||typeof x.ms!=='number')continue;const id=idMap.get(x.id)||x.id,k=x.day+'|'+id,c=out.get(k)||M.get(k)||{...x,id,k,ms:0,starts:0,done:0,partial:0};['ms','starts','done','partial'].forEach(f=>c[f]=Math.max(c[f]||0,x[f]||0));out.set(k,c)}
 await DB.sPut([...out.values()]);await load()}};
/* ---------- agregados ---------- */
function rng(){const n=new Date();n.setHours(0,0,0,0);let a,b;
if(mode==='week'){a=new Date(n);a.setDate(a.getDate()-((a.getDay()+6)%7)+off*7);b=new Date(a);b.setDate(b.getDate()+6)}
else if(mode==='month'){a=new Date(n.getFullYear(),n.getMonth()+off,1);b=new Date(a.getFullYear(),a.getMonth()+1,0)}
else if(mode==='year'){a=new Date(n.getFullYear()+off,0,1);b=new Date(a.getFullYear(),11,31)}
else if(mode==='custom'){a=new Date((cu.f||dk(n))+'T00:00');b=new Date((cu.t||dk(n))+'T00:00');if(a>b)[a,b]=[b,a]}
else{const f=[...M.values()].map(e=>e.day).sort()[0];a=new Date((f||dk(n))+'T00:00');b=n}
const L=mode==='week'?`${a.toLocaleDateString('es',{day:'numeric',month:'short'})} – ${b.toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})}`:mode==='month'?a.toLocaleDateString('es',{month:'long',year:'numeric'}):mode==='year'?String(a.getFullYear()):mode==='all'?'Histórico':'Fechas elegidas';return[dk(a),dk(b),L]}
function agg(f,t){const S1={},A1={},C1={},D1={};let ms=0,st=0,dn=0,pt=0;
for(const e of M.values()){if(e.day<f||e.day>t)continue;ms+=e.ms;st+=e.starts;dn+=e.done;pt+=e.partial;const s=S1[e.id]??={title:e.title,artist:e.artist,ms:0,starts:0,done:0,partial:0};s.ms+=e.ms;s.starts+=e.starts;s.done+=e.done;s.partial+=e.partial;
const ar=e.artist||'Sin artista';A1[ar]=(A1[ar]||0)+e.ms;C1[e.cat]=(C1[e.cat]||0)+e.ms;D1[e.day]=(D1[e.day]||0)+e.ms}
const so=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]);return{ms,st,dn,pt,S:Object.values(S1).sort((a,b)=>b.ms-a.ms),A:so(A1),C:so(C1),D:D1,Ds:so(D1)}}
const hm=ms=>{const s=Math.round(ms/1000);return s<60?s+' s':s<3600?Math.floor(s/60)+' min '+s%60+' s':Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min'};
const bars=(a,f)=>{const m=Math.max(1,...a.map(x=>x[1]));return a.map(([l,v])=>`<div class=br><span>${esc(l)}</span><i style="width:${v/m*100}%"></i><em>${f(v)}</em></div>`).join('')||'<small>Sin datos</small>'};
function series(a,b,D){const A0=new Date(a+'T00:00'),B0=new Date(b+'T00:00'),n=(B0-A0)/864e5+1,o=[];
if(n<=62){for(let d=new Date(A0);d<=B0;d.setDate(d.getDate()+1))o.push([n<=7?d.toLocaleDateString('es',{weekday:'short'}):String(d.getDate()),D[dk(d)]||0])}
else{const m={};for(const k in D)m[k.slice(0,7)]=(m[k.slice(0,7)]||0)+D[k];Object.keys(m).sort().forEach(k=>o.push([k.slice(2),m[k]]))}return o}
function render(){const[f,t,L]=rng(),r=agg(f,t),cat=k=>S.cats[k]||k,day=r.Ds[0],nav=mode==='week'||mode==='month'||mode==='year';
const sr=series(f,t,r.D),mx=Math.max(1,...sr.map(x=>x[1]));
$('#wrapped').innerHTML=`<h2 class=rz data-t="Mi Wrapped"></h2><div class=row><select id=wT>${[['week','Semana'],['month','Mes'],['year','Año'],['all','Histórico'],['custom','Personalizado']].map(([v,l])=>`<option value=${v} ${v===mode?'selected':''}>${l}</option>`).join('')}</select>${nav?`<span><button id=wP>◀</button> <button id=wN ${off>=0?'disabled':''}>▶</button></span>`:''}</div>
${mode==='custom'?`<div class=row><input type=date id=wF value="${cu.f||''}"><input type=date id=wTo value="${cu.t||''}"></div>`:''}<h3>${esc(L)}</h3>
${r.st||r.ms?`<div class=wcards><div class=wc>Tiempo escuchado<b>${hm(r.ms)}</b></div><div class=wc>Reproducciones<b>${r.st}</b></div><div class=wc>Terminadas<b>${r.dn}</b></div><div class=wc>Parciales<b>${r.pt}</b></div>
<div class=wc>Canción nº1<b>${esc(r.S[0]?.title||'—')}</b>${r.S[0]?hm(r.S[0].ms):''}</div><div class=wc>Artista nº1<b>${esc(r.A[0]?.[0]||'—')}</b>${r.A[0]?hm(r.A[0][1]):''}</div>
<div class=wc>Categoría top<b>${esc(r.C[0]?cat(r.C[0][0]):'—')}</b>${r.C[0]?hm(r.C[0][1]):''}</div><div class=wc>Día más activo<b>${day?esc(new Date(day[0]+'T00:00').toLocaleDateString('es',{weekday:'long',day:'numeric',month:'short'})):'—'}</b>${day?hm(day[1]):''}</div></div>
<h3>Actividad</h3><div class=cols>${sr.map(([l,v])=>`<div title="${esc(l)}: ${hm(v)}"><i style="height:${v/mx*100}%"></i><small>${esc(l)}</small></div>`).join('')}</div>
<h3>Canciones más escuchadas</h3>${bars(r.S.slice(0,8).map(s=>[s.title,s.ms]),hm)}<h3>Artistas más escuchados</h3>${bars(r.A.slice(0,6),hm)}<h3>Categorías más usadas</h3>${bars(r.C.slice(0,6).map(([k,v])=>[cat(k),v]),hm)}
<h3>Detalle por canción</h3>${r.S.slice(0,25).map(s=>`<div class=row><span>${esc(s.title)}<small> ${esc(s.artist)}</small></span><small>${hm(s.ms)} · ▶${s.starts} · ✔${s.done} · ◐${s.partial}</small></div>`).join('')}`
:'<p>No hay datos en este periodo. Solo cuenta el tiempo en que la música suena de verdad (las pausas no cuentan).</p>'}
<p><small>Las reproducciones simultáneas durante un crossfade suman a cada canción por separado. «Terminada» = llegó al final (o a la zona de mezcla); «Parcial» = se saltó antes.</small></p><button id=wReset>Borrar estadísticas</button>`;A.theme()}
A.R.wrapped=async()=>{await flush();render()};
document.addEventListener('change',e=>{const t=e.target;if(t.id==='wT'){mode=t.value;off=0}else if(t.id==='wF')cu.f=t.value;else if(t.id==='wTo')cu.t=t.value;else return;render()});
document.addEventListener('click',async e=>{const id=e.target.id;if(id==='wP'){off--;render()}else if(id==='wN'){off++;render()}
else if(id==='wReset'&&confirm('¿Borrar TODAS las estadísticas de este dispositivo?')){await DB.sClear();M.clear();dirty.clear();render()}});
setInterval(()=>{if($('#wrapped').classList.contains('on')&&!document.activeElement.matches('input,select'))flush().then(render)},10000);
load()}
