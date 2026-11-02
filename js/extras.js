export function start(A){
const{S,save,DB,$,esc,PN,WX}=A,R={},SIT=['Casa','Paseando','Tren','Coche','Autobús','Otro'];
const T={basic:'Basic',persona5:'Persona 5',wii:'Nintendo Wii',ds:'Nintendo DS',deltarune:'Deltarune'};
const C=window.DAYTUNE_CONFIG||{},cfg=!!(C.url&&C.anonKey);let ses=JSON.parse(localStorage.getItem('dtses')||'null'),pt,rev=null,bufs=new Map(),cur='home';
const sec=(id,t,b)=>{$('#'+id).innerHTML=`<h2 class=rz data-t="${t}"></h2>${b}`;A.theme()};
const go=t=>{cur=t;document.querySelectorAll('.tab,nav button').forEach(x=>x.classList.remove('on'));$('#'+t).classList.add('on');document.querySelector(`nav [data-go=${t}]`)?.classList.add('on');R[t]?.();scrollTo(0,0)};
const co=()=>Object.entries(S.cats);
/* ---------- secciones ---------- */
R.favs=()=>{const f=A.songs().filter(s=>s.pref==='fav');sec('favs','Favoritos',f.map(s=>`<div class=row><span>${esc(s.title)}<small> ${esc(s.artist)}</small></span><button data-pf="${s.id}">▶</button></div>`).join('')||'<p>Marca canciones con ♥ para verlas aquí.</p>')};
R.cats=()=>{const n=k=>A.songs().filter(s=>s.cat===k).length;
sec('cats','Categorías',`${co().map(([k,v])=>`<div class=row><span>${esc(v)} (${n(k)})</span><span><button data-ren="${k}">✎</button><button data-delc="${k}">🗑</button></span></div>`).join('')}<button data-newc>Nueva categoría</button><h3>Listas por situación</h3><small>Marca qué categorías suenan en cada situación. Sin marcar = lógica normal por hora y clima. También puedes fijar una canción a una situación con ✎ en Biblioteca.</small>${SIT.map(x=>`<p><b>${x}</b><br>${co().map(([k,v])=>`<label><input type=checkbox data-sc="${x}|${k}" ${(S.ctxCats?.[x]||[]).includes(k)?'checked':''}> ${esc(v)}</label> `).join('')}</p>`).join('')}`)};
R.sched=()=>sec('sched','Horarios',`<small>Cada franja empieza a la hora indicada.</small>${Object.keys(PN).map(k=>`<label class=row>${PN[k]} <input type=time data-k=${k} value=${S.sched[k]}></label>`).join('')}`);
R.weather=()=>{sec('weather','Clima',`<label class=row>Clima <select id=sW><option value=auto>Automático</option>${Object.entries(WX).map(([k,v])=>`<option value=${k}>${v}</option>`).join('')}</select></label><div class=row><input id=sC placeholder="Ciudad" value="${esc(S.city)}"><button id=sCb>Buscar</button></div><button id=sG>Usar mi ubicación</button><p><small>La ubicación solo se usa para pedir el clima a Open-Meteo y se guarda en este dispositivo. La selección manual tiene prioridad.</small></p>`);$('#sW').value=S.wxManual};
R.look=()=>sec('look','Apariencia',Object.entries(T).map(([k,v])=>`<div class=card><div class=pv data-theme=${k}><div class=pvc>12:30</div><div class=pvb><button>⏮</button><button>▶</button><button>⏭</button></div><div class=pvn><span>Inicio</span><span>Lista</span><span>Más</span></div></div><div class=row><b>${v}${S.theme===k?' ✔':''}</b><button data-pick=${k}>${S.theme===k?'En uso':'Usar'}</button></div></div>`).join(''));
const acct=()=>!cfg?'<p>Supabase no configurado: rellena js/config.js (ver INSTRUCCIONES.txt).</p>':ses?`<p>Sesión: ${esc(ses.user?.email)}</p><button id=aPush>Sincronizar ahora</button> <button id=aPull>Cargar de la nube</button> <button id=aOut>Salir</button>`:`<input id=aE type=email placeholder="Email"><input id=aP type=password placeholder="Contraseña (mín. 6)"><button id=aIn>Entrar</button> <button id=aUp>Registrarme</button>`;
R.set=async()=>{let q='';try{const e=await navigator.storage.estimate();q=`Usado: ${(e.usage/1e6)|0} MB de ${(e.quota/1e6)|0} MB · Persistente: ${await navigator.storage.persisted()?'sí':'NO (el navegador podría borrar datos si falta espacio)'}`}catch{}
sec('set','Ajustes',`<label class=row>Crossfade (s) <input type=range id=sX min=0 max=20 value=${S.xfade}></label><label class=row>Sonido de reloj <input type=checkbox id=sT ${S.tick?'checked':''}></label><label class=row>Igualar volumen <input type=checkbox id=sE ${S.eq!==false?'checked':''}></label><label class=row>Al cambiar de franja <select id=sP><option value=wait>Esperar al fin de la canción</option><option value=now>Mezclar ya</option></select></label><h3>Cuenta y sincronización</h3>${acct()}<h3>Datos</h3><p>${q}</p><button id=sPr>Pedir almacenamiento persistente</button> <button id=sWz>Repetir asistente</button> <button id=sDel>Borrar datos locales</button>`);$('#sP').value=S.onP};
/* ---------- Supabase (REST, sin librerías) ---------- */
const H=t=>({apikey:C.anonKey,'Content-Type':'application/json',Authorization:'Bearer '+(t||C.anonKey)});
async function auth(p,b){const r=await fetch(C.url+'/auth/v1/'+p,{method:'POST',headers:H(),body:JSON.stringify(b)}),j=await r.json();if(!r.ok)throw Error(j.msg||j.error_description||j.message||'Error');return j}
const setSes=j=>{ses=j;localStorage.setItem('dtses',JSON.stringify(j))};
async function tok(){if(!ses)return null;if(ses.expires_at*1000-Date.now()<6e4)setSes(await auth('token?grant_type=refresh_token',{refresh_token:ses.refresh_token}));return ses.access_token}
async function push(){const t=await tok();if(!t)return;const favs=A.songs().filter(s=>s.pref&&s.pref!=='normal').map(s=>[s.title,s.artist,s.pref]);
const r=await fetch(C.url+'/rest/v1/preferences?on_conflict=user_id',{method:'POST',headers:{...H(t),Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:ses.user.id,data:{S,favs},updated_at:new Date().toISOString()})});if(!r.ok)throw Error('No se pudo guardar: '+r.status)}
async function pull(){const t=await tok(),r=await fetch(C.url+'/rest/v1/preferences?select=data',{headers:H(t)}),d=(await r.json())[0]?.data;if(!d)return alert('No hay preferencias en la nube todavía');
Object.assign(S,d.S);localStorage.setItem('dt',JSON.stringify(S));for(const[ti,ar,pf]of d.favs||[]){const s=A.songs().find(x=>x.title===ti&&x.artist===ar);if(s){s.pref=pf;await DB.put(s)}}A.theme();A.clock();A.renderLib();go(cur)}
window.dtSaved=()=>{if(ses){clearTimeout(pt);pt=setTimeout(()=>push().catch(()=>{}),1500)}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ses)push().catch(()=>{})});
if(ses)pull().catch(()=>{});
/* ---------- igualación de volumen ---------- */
window.dtEq=async s=>{if(S.eq===false)return;try{const b=await new OfflineAudioContext(1,1,22050).decodeAudioData(await s.blob.arrayBuffer()),x=b.getChannelData(0);let t=0,n=0;for(let i=0;i<x.length;i+=7){t+=x[i]*x[i];n++}s.gain=Math.max(.2,Math.min(1,.1/(Math.sqrt(t/n)||.1)));await DB.put(s)}catch{s.gain=1}};
window.dtEqAll=async()=>{for(const s of A.songs())if(!s.gain)await window.dtEq(s)};
/* ---------- rebobinado inverso ---------- */
async function revBuf(s){if(bufs.has(s.id))return bufs.get(s.id);const b=await new OfflineAudioContext(2,1,44100).decodeAudioData(await s.blob.arrayBuffer());for(let c=0;c<b.numberOfChannels;c++)b.getChannelData(c).reverse();bufs.clear();bufs.set(s.id,b);return b}
function endRew(){const r=rev;if(!r)return;rev=null;r.done=true;try{r.src?.stop()}catch{}cancelAnimationFrame(r.raf);$('#np').classList.remove('rev');const a=A.decks()[A.cur()].a;a.currentTime=Math.max(0,r.pos);a.play()}
async function startRew(e){const s=A.now(),d=A.decks()?.[A.cur()];if(!s||!d||rev)return;e.preventDefault();const r=rev={pos:d.a.currentTime,done:false};d.a.pause();$('#np').classList.add('rev');
let b;try{b=await revBuf(s)}catch{return endRew()}if(r.done)return;const ac=A.ctx(),src=ac.createBufferSource(),g=ac.createGain(),t=ac.currentTime;src.buffer=b;g.gain.value=.9;src.connect(g).connect(A.master());
src.playbackRate.setValueAtTime(.4,t);src.playbackRate.linearRampToValueAtTime(2.2,t+.6);src.start(0,Math.max(0,b.duration-r.pos));r.src=src;let l=performance.now();
const f=n=>{if(r.done)return;r.pos-=(n-l)/1000*src.playbackRate.value;l=n;if(r.pos<=0){r.pos=0;return endRew()}r.raf=requestAnimationFrame(f)};r.raf=requestAnimationFrame(f)}
const rw=$('#rew');rw.addEventListener('pointerdown',startRew);['pointerup','pointercancel','pointerleave'].forEach(v=>rw.addEventListener(v,endRew));rw.oncontextmenu=e=>e.preventDefault();
/* ---------- segundo plano / pantalla de bloqueo ---------- */
if('mediaSession'in navigator){navigator.mediaSession.setActionHandler('seekto',e=>{const a=A.decks()?.[A.cur()].a;if(a)a.currentTime=e.seekTime});
setInterval(()=>{const a=A.decks()?.[A.cur()].a;if(!a||!isFinite(a.duration))return;navigator.mediaSession.playbackState=a.paused?'paused':'playing';try{navigator.mediaSession.setPositionState({duration:a.duration,position:Math.min(a.currentTime,a.duration),playbackRate:1})}catch{}},1000)}
/* ---------- asistente ---------- */
const WZ=[['look','Elige tu apariencia'],['lib','Importa tu música'],['cats','Clasifica canciones y situaciones'],['sched','Configura tus horarios'],['weather','Configura el clima'],['set','Reproducción y cuenta']];
function wiz(){const w=$('#wiz');if(S.wiz==='done'){w.hidden=true;return}const i=+S.wiz||0;S.wiz=i;save();w.hidden=false;w.innerHTML=`<b>Asistente ${i+1}/${WZ.length}: ${WZ[i][1]}</b> <button data-w=-1>←</button><button data-w=1>${i+1<WZ.length?'Siguiente / Omitir':'Terminar'}</button><button data-w=x>✕</button>`;go(WZ[i][0])}
/* ---------- eventos ---------- */
const tryA=f=>f().catch(e=>alert(e.message));
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset,id=b.id;
if(d.go)return go(d.go);if(d.pick){S.theme=d.pick;save();A.theme();return R.look()}
if(d.pf)return A.play(A.songs().find(x=>x.id===d.pf),true);
if(d.w){const i=+S.wiz||0,n=d.w==='x'?99:i+ +d.w;S.wiz=n>=WZ.length?'done':Math.max(0,n);save();return wiz()}
if(d.newc!==undefined){const n=prompt('Nombre de la categoría');if(n){S.cats[n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-')]=n;save();R.cats();A.renderLib()}}
if(d.ren){const n=prompt('Nuevo nombre',S.cats[d.ren]);if(n){S.cats[d.ren]=n;save();R.cats();A.renderLib()}}
if(d.delc){if(A.songs().some(s=>s.cat===d.delc))return alert('Mueve primero las canciones de esa categoría');delete S.cats[d.delc];save();R.cats()}
if(id==='sCb'){const c=$('#sC').value;try{const r=(await(await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(c))).json()).results[0];S.loc={lat:r.latitude,lon:r.longitude};S.city=r.name;save();await A.refreshWx();A.clock();alert('Ciudad: '+r.name)}catch{alert('Ciudad no encontrada o sin conexión')}}
if(id==='sG')navigator.geolocation.getCurrentPosition(async p=>{S.loc={lat:p.coords.latitude,lon:p.coords.longitude};save();await A.refreshWx();A.clock();alert('Ubicación guardada')},()=>alert('Permiso denegado. Usa una ciudad o el clima manual.'));
if(id==='sPr'){alert(await navigator.storage.persist()?'Almacenamiento persistente concedido':'El navegador no lo ha concedido');R.set()}
if(id==='sWz'){S.wiz=0;save();wiz()}
if(id==='sDel'&&confirm('Se borrarán canciones y ajustes de este dispositivo')){await DB.clear();localStorage.clear();location.reload()}
if(id==='aIn'||id==='aUp')tryA(async()=>{const em={email:$('#aE').value,password:$('#aP').value};if(id==='aUp'){const j=await auth('signup',em);if(!j.access_token)return alert('Cuenta creada. Confirma tu email y luego entra.');setSes(j)}else setSes(await auth('token?grant_type=password',em));await pull();await push();R.set()});
if(id==='aPush')tryA(async()=>{await push();alert('Preferencias guardadas en la nube')});if(id==='aPull')tryA(pull);
if(id==='aOut'){ses=null;localStorage.removeItem('dtses');R.set()}});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='sX')S.xfade=+t.value;else if(t.id==='sT')S.tick=t.checked;else if(t.id==='sE')S.eq=t.checked;else if(t.id==='sP')S.onP=t.value;else if(t.id==='sW')S.wxManual=t.value;
else if(t.dataset.k)S.sched[t.dataset.k]=t.value;else if(t.dataset.sc){const[x,k]=t.dataset.sc.split('|');S.ctxCats??={};const L=S.ctxCats[x]??=[];t.checked?L.push(k):L.splice(L.indexOf(k),1)}else return;save();A.clock()});
if(S.wiz!=='done')wiz()}
