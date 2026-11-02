const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('daytune',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('songs'))d.createObjectStore('songs',{keyPath:'id'});if(!d.objectStoreNames.contains('stats'))d.createObjectStore('stats',{keyPath:'k'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function tx(st,m,f){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(st,m);const q=f(t.objectStore(st));t.oncomplete=()=>res(q?.result);t.onerror=()=>rej(t.error)})}
export const all=()=>tx('songs','readonly',s=>s.getAll());
export const put=x=>tx('songs','readwrite',s=>s.put(x));
export const del=id=>tx('songs','readwrite',s=>s.delete(id));
export const clear=()=>tx('songs','readwrite',s=>s.clear());
export const sAll=()=>tx('stats','readonly',s=>s.getAll());
export const sPut=a=>tx('stats','readwrite',s=>{a.forEach(x=>s.put(x))});
export const sClear=()=>tx('stats','readwrite',s=>s.clear());
