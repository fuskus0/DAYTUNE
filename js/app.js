import*as DB from './db.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PER={amanecer:'manana',manana:'manana',mediodia:'tarde',tarde:'tarde',atardecer:'tarde',noche:'noche'};
const PN={amanecer:'Amanecer',manana:'Mañana',mediodia:'Mediodía',tarde:'Tarde',atardecer:'Atardecer',noche:'Noche'};
const WX={sol:'☀ Sol',nubes:'⛅ Nubes',cubierto:'☁ Cubierto',lluvia:'🌧 Lluvia',tormenta:'⛈ Tormenta',nieve:'❄ Nieve'};
const D={theme:'basic',xfade:6,tick:true,mode:'shuffle',vol:.8,onP:'wait',w:{fav:4,normal:1,low:.25},
sched:{amanecer:'06:30',manana:'09:00',mediodia:'13:00',tarde:'16:00',atardecer:'19:30',noche:'22:00'},
cats:{noche:'Noche',manana:'Mañana','manana-lluvia':'Mañana (lluvia)',tarde:'Tarde','tarde-lluvia':'Tarde (lluvia)','noche-lluvia':'Noche (lluvia)'},
loc:null,city:'',wxManual:'auto',ctxSel:''};
let S={...D,...JSON.parse(localStorage.getItem('dt')||'{}')};
const save=()=>{localStorage.setItem('dt',JSON.stringify(S));window.dtSaved?.()};
let songs=[],now=null,hist=[],ctx,master,decks,cur=0,cross=false,lastP=null,sleepT=null,coverId=null,wxc=JSON.parse(localStorage.getItem('dtwx')||'null');
const fmt=s=>{s=Math.max(0,s|0);return(s/60|0)+':'+String(s%60).padStart(2,'0')};
const wcode=c=>c<=1?'sol':c<=2?'nubes':c<=48?'cubierto':c<=67?'lluvia':c<=77?'nieve':c<=82?'lluvia':c<=86?'nieve':'tormenta';
const wx=()=>S.wxManual!=='auto'?S.wxManual:wxc?.w||null;
function period(){const d=new Date(),m=d.getHours()*60+d.getMinutes();const e=Object.entries(S.sched).map(([k,v])=>{const[h,i]=v.split(':');return[k,h*60+ +i]}).sort((a,b)=>a[1]-b[1]);let r=e[e.length-1][0];for(const[k,t]of e)if(t<=m)r=k;return r}
const rain=()=>['lluvia','tormenta'].includes(wx());
function pool(){return pool0(songs.filter(s=>s.blob))}
function pool0(songs){const K=S.ctxSel||'Casa';if(S.ctxCats?.[K]?.length){const X=songs.filter(s=>S.ctxCats[K].includes(s.cat)||s.ctx===K);if(X.length)return X}const c=PER[period()];let L=rain()?songs.filter(s=>s.cat===c+'-lluvia'):[];if(!L.length)L=songs.filter(s=>s.cat===c);if(!L.length)L=songs;const t=S.ctxSel?L.filter(s=>s.ctx===S.ctxSel):[];return t.length?t:L}
async function refreshWx(){if(!S.loc)return;try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.loc.lat}&longitude=${S.loc.lon}&current=weather_code`);const j=await r.json();wxc={w:wcode(j.current.weather_code),t:Date.now()};localStorage.setItem('dtwx',JSON.stringify(wxc))}catch{}}
function init(){if(ctx)return;ctx=new AudioContext();master=ctx.createGain();master.gain.value=S.vol;master.connect(ctx.destination);
decks=[0,1].map(i=>{const a=new Audio();const g=ctx.createGain();g.gain.value=0;ctx.createMediaElementSource(a).connect(g);g.connect(master);
a.ontimeupdate=()=>{if(decks[cur].a!==a)return;ui(a);const r=a.duration-a.currentTime;if(!cross&&S.mode!=='repeat'&&isFinite(r)&&r<=S.xfade&&r>.5)next(true)};
a.onended=()=>{if(decks[cur].a===a&&!cross)next(false)};return{a,g}})}
function chime(){if(!S.tick||!ctx)return;const t=ctx.currentTime;[1200,1800].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.01+i*.12);g.gain.exponentialRampToValueAtTime(.0001,t+.7);o.connect(g).connect(ctx.destination);o.start(t+i*.12);o.stop(t+.8)})}
async function play(s,mix){if(!s?.blob)return alert('Falta el archivo de audio de esta canción. Usa «Localizar» en la Biblioteca.');init();await ctx.resume();const o=decks[cur],n=decks[1-cur];if(n.a.src)URL.revokeObjectURL(n.a.src);
if(!s.gain&&window.dtEq)await window.dtEq(s);n.a.src=URL.createObjectURL(s.blob);n.a.volume=Math.min(1,s.gain||1);await n.a.play();s.plays=(s.plays||0)+1;DB.put(s);if(now)hist.push(now);now=s;
const t=ctx.currentTime,d=Math.max(.05,S.xfade);o.g.gain.cancelScheduledValues(t);n.g.gain.cancelScheduledValues(t);
if(mix&&!o.a.paused&&S.xfade>0){const N=64,i=new Float32Array(N),u=new Float32Array(N);for(let k=0;k<N;k++){i[k]=Math.sin(k/(N-1)*Math.PI/2);u[k]=Math.cos(k/(N-1)*Math.PI/2)}
n.g.gain.setValueCurveAtTime(i,t,d);o.g.gain.setValueCurveAtTime(u,t,d);cross=true;setTimeout(()=>{o.a.pause();cross=false},d*1000+50)}
else{o.a.pause();o.g.gain.value=0;n.g.gain.value=1}
cur=1-cur;chime();meta();ui(n.a)}
function next(mix){const L=pool();if(!L.length)return;let s;
if(S.mode==='repeat'&&now)s=now;else if(S.mode==='list'){const i=L.findIndex(x=>x.id===now?.id);s=L[(i+1)%L.length]}
else{const C=L.length>1?L.filter(x=>x.id!==now?.id):L,w=C.map(x=>S.w[x.pref||'normal']);let r=Math.random()*w.reduce((a,b)=>a+b,0);s=C.find((x,i)=>(r-=w[i])<=0)||C[0]}
play(s,mix)}
function prev(){const a=decks?.[cur].a;if(a&&a.currentTime>3){a.currentTime=0;return}const p=hist.pop();if(p){now=null;play(p,true)}}
function meta(){if(!now)return;if('mediaSession'in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:now.title,artist:now.artist,album:now.game,artwork:now.cover?[{src:URL.createObjectURL(now.cover)}]:[]});
const h=navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);h('play',()=>decks[cur].a.play());h('pause',()=>decks[cur].a.pause());h('nexttrack',()=>next(true));h('previoustrack',prev)}}
function ransom(el){const t=el.dataset.t??=el.textContent;el.textContent='';if(S.theme!=='persona5'){el.textContent=t;return}[...t].forEach((c,i)=>{if(!c.trim()){el.append(' ');return}const e=document.createElement('i');e.className='r'+(i*7+t.length)%4;e.textContent=c;el.append(e)})}
function ui(a){const sk=$('#seek');if(a&&isFinite(a.duration)){sk.value=a.currentTime/a.duration*1000;$('#tc').textContent=fmt(a.currentTime);$('#td').textContent=fmt(a.duration)}
$('#play').textContent=a&&!a.paused?'⏸':'▶';if(now){$('#title').dataset.t=now.title;ransom($('#title'));$('#artist').textContent=[now.artist,now.game].filter(Boolean).join(' · ');$('#favb').textContent=now.pref==='fav'?'♥':'♡';$('#cover').src=now.cover?URL.createObjectURL(now.cover):''}}
function clock(){const d=new Date(),p=period();$('#clock').textContent=d.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});$('#date').textContent=d.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});
$('#wx').textContent=wx()?WX[wx()]:'Clima: sin datos';$('#per').textContent=PN[p];
if(lastP&&p!==lastP){chime();if(S.onP==='now'&&now&&ctx)next(true)}lastP=p}
const meta1=f=>new Promise(r=>{const a=new Audio(),u=URL.createObjectURL(f);a.src=u;a.onloadedmetadata=()=>{URL.revokeObjectURL(u);r(a.duration||0)};a.onerror=()=>r(0)});
async function load(){songs=await DB.all();renderLib()}
function renderLib(){const f=$('#onlyFav').checked;$('#list').innerHTML=songs.filter(s=>!f||s.pref==='fav').map(s=>`<div class=song data-id=${s.id}><div><b>${esc(s.title)}</b><small>${esc(s.artist)} · ${esc(s.game)} · ${fmt(s.dur)} · ▶${s.plays||0}${s.ctx?' · '+esc(s.ctx):''}${s.blob?'':' · ⚠ Falta el archivo'}</small></div><div class=a>${s.blob?'<button data-a=play>▶</button>':'<button data-a=loc>📁 Localizar</button>'}<button data-a=pref>${{fav:'♥',normal:'♡',low:'▽'}[s.pref||'normal']}</button><button data-a=edit>✎</button><button data-a=cov>🖼</button><button data-a=del>🗑</button><select data-a=cat>${Object.entries(S.cats).map(([k,v])=>`<option value=${k} ${k===s.cat?'selected':''}>${esc(v)}</option>`).join('')}</select></div></div>`).join('')||'<p>Importa canciones para empezar.</p>'}
function theme(){document.body.dataset.theme=S.theme;document.querySelectorAll('.rz').forEach(ransom)}
$('#imp').onchange=async e=>{const c=PER[period()];for(const f of e.target.files){await DB.put({id:crypto.randomUUID(),title:f.name.replace(/\.[^.]+$/,''),artist:'',game:'',cat:c,dur:await meta1(f),blob:f,fileName:f.name,size:f.size,cover:null,pref:'normal',ctx:'',plays:0})}e.target.value='';navigator.storage?.persist?.();await load();window.dtEqAll?.()};
$('#onlyFav').onchange=renderLib;
$('#list').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const s=songs.find(x=>x.id===b.closest('.song').dataset.id),a=b.dataset.a;
if(a==='loc'){locate(s);return}if(a==='play')play(s,true);else if(a==='pref'){s.pref={normal:'fav',fav:'low',low:'normal'}[s.pref||'normal']}
else if(a==='edit'){s.title=prompt('Nombre',s.title)??s.title;s.artist=prompt('Artista',s.artist)??s.artist;s.game=prompt('Juego',s.game)??s.game;s.ctx=prompt('Situación exclusiva (vacío = todas): Paseando, Tren, Coche, Autobús, Otro',s.ctx)??s.ctx}
else if(a==='cov'){coverId=s.id;$('#coverIn').click();return}
else if(a==='del'){if(!confirm('¿Eliminar?'))return;await DB.del(s.id);songs=songs.filter(x=>x!==s);return renderLib()}
await DB.put(s);renderLib()};
$('#list').onchange=async e=>{if(e.target.dataset.a!=='cat')return;const s=songs.find(x=>x.id===e.target.closest('.song').dataset.id);s.cat=e.target.value;await DB.put(s)};
$('#coverIn').onchange=async e=>{const s=songs.find(x=>x.id===coverId);if(s&&e.target.files[0]){s.cover=e.target.files[0];await DB.put(s);renderLib()}e.target.value=''};
$('#play').onclick=()=>{const a=decks?.[cur].a;if(!now)next(false);else a.paused?(ctx.resume(),a.play().then(()=>ui(a))):(a.pause(),ui(a))};
$('#next').onclick=()=>next(true);$('#prev').onclick=prev;
$('#favb').onclick=async()=>{if(!now)return;now.pref=now.pref==='fav'?'normal':'fav';await DB.put(now);ui(decks[cur].a);renderLib()};
$('#seek').oninput=e=>{const a=decks?.[cur].a;if(a&&a.duration)a.currentTime=e.target.value/1000*a.duration};
$('#vol').value=S.vol;$('#vol').oninput=e=>{S.vol=+e.target.value;save();if(master)master.gain.value=S.vol};
$('#mode').value=S.mode;$('#mode').onchange=e=>{S.mode=e.target.value;save()};
$('#ctxSel').value=S.ctxSel;$('#ctxSel').onchange=e=>{S.ctxSel=e.target.value;save()};
$('#sleep').onchange=e=>{clearTimeout(sleepT);let m=e.target.value;if(m==='c')m=prompt('Minutos')||0;m=+m;if(!m)return;
sleepT=setTimeout(()=>{if(!master)return;const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(S.vol,t);master.gain.linearRampToValueAtTime(0,t+8);setTimeout(()=>{decks.forEach(d=>d.a.pause());master.gain.value=S.vol;ui(decks[cur].a)},8200)},m*60000)};
document.onvisibilitychange=()=>{if(!document.hidden&&ctx)ctx.resume()};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
theme();clock();setInterval(clock,1000);setInterval(refreshWx,9e5);refreshWx();load();

import('./extras.js').then(m=>m.start({S,save,DB,$,esc,fmt,PN,WX,theme,clock,renderLib,load,refreshWx,next,play,songs:()=>songs,now:()=>now,decks:()=>decks,cur:()=>cur,ctx:()=>ctx,master:()=>master}));

function locate(s){const i=document.createElement('input');i.type='file';i.accept='audio/*';i.onchange=async()=>{const f=i.files[0];if(!f)return;s.blob=f;s.fileName=f.name;s.size=f.size;s.dur=await meta1(f)||s.dur;s.gain=0;await DB.put(s);renderLib()};i.click()}
