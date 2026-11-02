const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('daytune',1);r.onupgradeneeded=()=>r.result.createObjectStore('songs',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function tx(m,f){const d=await open();return new Promise((res,rej)=>{const t=d.transaction('songs',m);const q=f(t.objectStore('songs'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})}
export const all=()=>tx('readonly',s=>s.getAll());
export const put=x=>tx('readwrite',s=>s.put(x));
export const del=id=>tx('readwrite',s=>s.delete(id));
export const clear=()=>tx('readwrite',s=>s.clear());
