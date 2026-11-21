// Le registrazioni della voce restano nel browser di questo computer (IndexedDB).
let dbp=null;
const db=()=>dbp||(dbp=new Promise((res,rej)=>{
  const r=indexedDB.open('suonolandia-v2',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
}));
const tx=async(mode,fn)=>{
  const d=await db();
  return new Promise((res,rej)=>{
    const t=d.transaction('clips',mode),rq=fn(t.objectStore('clips'));
    t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);
  });
};
// record: {id, project, data:Float32Array, sr, fx, emoji, color}
export const putClip=c=>tx('readwrite',s=>s.put(c)).then(()=>true).catch(()=>false);
export const delClip=id=>tx('readwrite',s=>s.delete(id)).catch(()=>{});
export const allClips=()=>tx('readonly',s=>s.getAll()).catch(()=>[]);
