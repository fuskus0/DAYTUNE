const CT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const mk=n=>{const b=new Uint8Array(n);return[b,new DataView(b.buffer)]};
async function zipBuild(ents,prog){const parts=[],cd=[];let off=0,i=0;
for(const e of ents){prog?.(`Empaquetando ${++i}/${ents.length}`);const nb=new TextEncoder().encode(e.name),c=crc32(new Uint8Array(await e.blob.arrayBuffer())),sz=e.blob.size;if(sz>4e9||off>4e9)throw Error('Biblioteca demasiado grande para un ZIP (límite 4 GB); exporta en modalidad A');
let[h,v]=mk(30+nb.length);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,0x5821,true);v.setUint32(14,c,true);v.setUint32(18,sz,true);v.setUint32(22,sz,true);v.setUint16(26,nb.length,true);h.set(nb,30);
let[g,w]=mk(46+nb.length);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint16(14,0x5821,true);w.setUint32(16,c,true);w.setUint32(20,sz,true);w.setUint32(24,sz,true);w.setUint16(28,nb.length,true);w.setUint32(42,off,true);g.set(nb,46);
parts.push(h,e.blob);cd.push(g);off+=h.length+sz}
const cs=cd.reduce((a,x)=>a+x.length,0),[z,q]=mk(22);q.setUint32(0,0x06054b50,true);q.setUint16(8,ents.length,true);q.setUint16(10,ents.length,true);q.setUint32(12,cs,true);q.setUint32(16,off,true);
return new Blob([...parts,...cd,z],{type:'application/zip'})}
async function zipRead(f){const n=f.size,t=new Uint8Array(await f.slice(Math.max(0,n-65557),n).arrayBuffer());let p=-1;for(let i=t.length-22;i>=0;i--)if(t[i]==0x50&&t[i+1]==0x4b&&t[i+2]==5&&t[i+3]==6){p=i;break}
if(p<0)throw Error('ZIP dañado: no se encuentra el directorio central');const v=new DataView(t.buffer),cnt=v.getUint16(p+10,true),cs=v.getUint32(p+12,true),co=v.getUint32(p+16,true),cd=new DataView(await f.slice(co,co+cs).arrayBuffer()),E={};let o=0;
for(let i=0;i<cnt;i++){if(o+46>cd.byteLength||cd.getUint32(o,true)!==0x02014b50)throw Error('ZIP dañado: directorio central corrupto');const nl=cd.getUint16(o+28,true),el=cd.getUint16(o+30,true),cl=cd.getUint16(o+32,true);E[new TextDecoder().decode(new Uint8Array(cd.buffer,o+46,nl))]={m:cd.getUint16(o+10,true),c:cd.getUint32(o+20,true),off:cd.getUint32(o+42,true)};o+=46+nl+el+cl}
return{names:Object.keys(E),async get(name){const e=E[name],h=new DataView(await f.slice(e.off,e.off+30).arrayBuffer());if(h.getUint32(0,true)!==0x04034b50)throw Error('entrada dañada');const s=e.off+30+h.getUint16(26,true)+h.getUint16(28,true);let b=f.slice(s,s+e.c);
if(e.m===8)b=await new Response(b.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();else if(e.m!==0)throw Error('compresión no soportada');return b}}}
export function startLib(A,T){
const{S,save,DB,$,esc}=A;let P=null;
const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4e3)};
const b2d=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)}),d2b=u=>fetch(u).then(r=>r.blob()),safe=n=>String(n).replace(/[^\w.\- ]+/g,'_').slice(0,80),mb=n=>(n/1e6).toFixed(1)+' MB';
const D=document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'dlg'})),prog=t=>{const p=$('#dlgP');if(p)p.textContent=t};
const show=h=>{D.innerHTML=h;if(!D.open)D.showModal()},info=(t,b='')=>show(`<h3>${t}</h3><div>${b}</div><p><button id=dlgX>Cerrar</button></p>`);
D.onclick=e=>{const i=e.target.id;if(i==='dlgX')D.close();else if(i==='exGo')doExport();else if(i==='imGo')doImport()};
const cleanS=()=>{const c=JSON.parse(JSON.stringify(S));delete c.loc;delete c.city;delete c.wiz;return c};
async function exportLib(mode){const L={format:'daytune-library',version:1,mode,created:new Date().toISOString(),settings:cleanS(),songs:[]},ent=[];let i=0;const songs=A.songs();
for(const s of songs){prog(`Preparando ${++i}/${songs.length}`);const fn=s.fileName||s.blob?.name||'',o={id:s.id,title:s.title,artist:s.artist,game:s.game,cat:s.cat,dur:s.dur,pref:s.pref,ctx:s.ctx,plays:s.plays||0,gain:s.gain||0,fileName:fn,size:s.blob?.size||s.size||0,type:s.blob?.type||'',cover:s.cover?await b2d(s.cover):null};
if(mode==='B'&&s.blob){o.audio='audio/'+String(i).padStart(5,'0')+'-'+safe(fn||s.title);ent.push({name:o.audio,blob:s.blob})}L.songs.push(o)}
const j=new Blob([JSON.stringify(L)]);if(mode==='A')return{blob:j,name:'daytune-biblioteca.muslib'};ent.unshift({name:'library.json',blob:j});return{blob:await zipBuild(ent,prog),name:'daytune-completa.muslib'}}
$('#lbExp').onclick=()=>{const s=A.songs();if(!s.length)return info('Biblioteca vacía','No hay canciones que exportar.');const sz=s.reduce((a,x)=>a+(x.blob?.size||0),0),m=s.filter(x=>!x.blob).length;
show(`<h3>Exportar biblioteca</h3><p>${s.length} canciones · ${mb(sz)} de audio${m?` · ${m} sin archivo (no se incluirá su audio)`:''}</p><label><input type=radio name=xm value=A checked> <b>A · Solo biblioteca</b>: metadatos, categorías, ajustes, tema y portadas; sin audio.</label><br><label><input type=radio name=xm value=B> <b>B · Completa</b>: incluye el audio (${mb(sz)}). Incluye solo música que tengas derecho a copiar.</label><p id=dlgP></p><p><button id=exGo>Exportar</button> <button id=dlgX>Cancelar</button></p>`)};
async function doExport(){const m=D.querySelector('[name=xm]:checked').value;$('#exGo').disabled=true;try{const r=await exportLib(m);dl(r.blob,r.name);info('Exportación lista',`${esc(r.name)} · ${mb(r.blob.size)}`)}catch(e){info('Error al exportar',esc(e.message))}}
async function parse(f){const h=new Uint8Array(await f.slice(0,4).arrayBuffer());let L,z=null;
if(h[0]==0x50&&h[1]==0x4b){z=await zipRead(f);if(!z.names.includes('library.json'))throw Error('El ZIP no contiene library.json: no es una biblioteca de DAYTUNE');try{L=JSON.parse(await(await z.get('library.json')).text())}catch{throw Error('library.json está dañado')}}
else try{L=JSON.parse(await f.text())}catch{throw Error('El archivo está dañado o no es una biblioteca .muslib (JSON no válido)')}
if(L?.format!=='daytune-library'||!Array.isArray(L.songs))throw Error('El archivo no tiene el formato de biblioteca de DAYTUNE');if(L.version>1)throw Error('Biblioteca creada con una versión más nueva de DAYTUNE');return{L,z}}
$('#lbImp').onclick=()=>$('#lbFile').click();
$('#lbFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{P=await parse(f)}catch(x){return info('No se puede importar',esc(x.message))}
const L=P.L,n=L.songs.length,wa=L.songs.filter(s=>s.audio&&P.z).length;
show(`<h3>Resumen de ${esc(f.name)}</h3><ul><li>${n} canciones: ${wa} con audio incluido, ${n-wa} sin audio</li><li>${Object.keys(L.settings?.cats||{}).length} categorías · ${L.songs.filter(s=>s.cover).length} portadas</li><li>Tema: ${esc(T[L.settings?.theme]||'—')}</li><li>Creada: ${esc(L.created||'?')}</li></ul><label><input type=radio name=im value=merge checked> Fusionar con mi biblioteca actual</label><br><label><input type=radio name=im value=replace> Sustituir mi biblioteca actual</label><br><label><input type=checkbox id=imDup checked> Evitar canciones duplicadas</label><br><label><input type=checkbox id=imSet checked> Importar ajustes, horarios y tema</label><br><label><input type=checkbox id=imBk checked> Al sustituir, descargar antes una copia de seguridad</label><p id=dlgP></p><p><button id=imGo>Importar</button> <button id=dlgX>Cancelar</button></p>`)};
const key=s=>[s.title,s.artist,s.game].map(x=>String(x||'').trim().toLowerCase()).join('|');
async function doImport(){const{L,z}=P,rep=D.querySelector('[name=im]:checked').value==='replace',dup=$('#imDup').checked,st=$('#imSet').checked,bk=$('#imBk').checked;$('#imGo').disabled=true;
try{if(rep&&bk&&A.songs().length){prog('Creando copia de seguridad…');const b=await exportLib(A.songs().some(s=>s.blob)?'B':'A');dl(b.blob,'daytune-copia-seguridad.muslib')}
const cur=rep?[]:A.songs().slice();if(rep)await DB.clear();const idx=new Map(cur.map(s=>[key(s),s]));let add=0,du=0,miss=0,bad=0,fill=0,i=0;
for(const o of L.songs){prog(`Importando ${++i}/${L.songs.length}`);if(!o||typeof o.title!=='string'){bad++;continue}let blob=null;
if(o.audio&&z){try{const b=await z.get(o.audio);blob=new File([b],o.fileName||'audio',{type:o.type||b.type})}catch{bad++}}
const ex=dup&&idx.get(key(o));if(ex){du++;if(!ex.blob&&blob){ex.blob=blob;ex.gain=0;await DB.put(ex);fill++}continue}
const s={...o,id:cur.some(x=>x.id===o.id)||!o.id?crypto.randomUUID():o.id,blob,cover:o.cover?await d2b(o.cover).catch(()=>null):null,pref:o.pref||'normal',plays:o.plays||0};delete s.audio;if(!blob)miss++;await DB.put(s);cur.push(s);idx.set(key(s),s);add++}
if(st&&L.settings){const I={...L.settings};['loc','city','wiz'].forEach(k=>delete I[k]);if(!T[I.theme])delete I.theme;
if(rep)Object.assign(S,I);else{const cc={...(S.ctxCats||{})};for(const k in I.ctxCats||{})cc[k]=[...new Set([...(cc[k]||[]),...I.ctxCats[k]])];Object.assign(S,I,{cats:{...S.cats,...I.cats},ctxCats:cc})}}
for(const s of cur)if(s.cat&&!S.cats[s.cat])S.cats[s.cat]=L.settings?.cats?.[s.cat]||s.cat;
save();A.theme();A.clock();await A.load();
info('Importación terminada',`<ul><li>${add} canciones añadidas</li>${du?`<li>${du} duplicadas omitidas${fill?` (${fill} recuperaron su audio)`:''}</li>`:''}${miss?`<li>⚠ ${miss} sin archivo de audio: aparecen marcadas en la Biblioteca; usa «Localizar archivos que faltan»</li>`:''}${bad?`<li>${bad} entradas dañadas o ilegibles</li>`:''}</ul>`)}
catch(e){info('Error al importar',esc(e.message))}}
$('#lbRel').onclick=()=>{const M=A.songs().filter(s=>!s.blob);if(!M.length)return info('Todo en orden','No falta ningún archivo de audio.');const i=document.createElement('input');i.type='file';i.multiple=true;i.accept='audio/*';
i.onchange=async()=>{let ok=0,sz=0;const used=new Set(),low=n=>n.toLowerCase(),base=n=>low(n.replace(/\.[^.]+$/,''));
for(const s of M){const f=[...i.files].find(f=>!used.has(f)&&(s.fileName&&low(f.name)===low(s.fileName)||base(f.name)===low(s.title)));if(!f)continue;if(s.size&&f.size!==s.size){sz++;continue}used.add(f);s.blob=f;s.fileName=f.name;s.size=f.size;s.gain=0;await DB.put(s);ok++}
await A.load();info('Localización terminada',`${ok} de ${M.length} archivos recuperados${sz?` · ${sz} descartados por tener distinto tamaño que el original`:''}${ok<M.length?'. El resto sigue marcado como faltante.':''}`)};i.click()}}
