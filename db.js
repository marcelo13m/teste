/* Persistência em IndexedDB (store "kv"). */
const DB=(()=>{let db;
const open=()=>db?Promise.resolve(db):new Promise((ok,no)=>{if(!window.indexedDB)return no(new Error('sem IndexedDB'));const r=indexedDB.open('recomeco',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{db=r.result;db.onversionchange=()=>db.close();ok(db)};r.onerror=()=>no(r.error)});
const tx=(m,f)=>open().then(d=>new Promise((ok,no)=>{const t=d.transaction('kv',m),o=f(t.objectStore('kv'));t.oncomplete=()=>ok(o&&o.result);t.onerror=t.onabort=()=>no(t.error)}));
return{get:k=>tx('readonly',s=>s.get(k)),set:(k,v)=>tx('readwrite',s=>s.put(v,k)),del:k=>tx('readwrite',s=>s.delete(k)),keys:()=>tx('readonly',s=>s.getAllKeys())}})();
