// Canzoni e registrazioni restano nel browser di questo computer (IndexedDB).
let dbp=null;
const db=()=>dbp||(dbp=new Promise((res,rej)=>{
  const r=indexedDB.open('suonolandia-v2',2);
  r.onupgradeneeded=()=>{
    const d=r.result;
    if(!d.objectStoreNames.contains('clips'))d.createObjectStore('clips',{keyPath:'id'});
    if(!d.objectStoreNames.contains('projects'))d.createObjectStore('projects',{keyPath:'id'});
  };
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
}));
const tx=async(store,mode,fn)=>{
  const d=await db();
  return new Promise((res,rej)=>{
    const t=d.transaction(store,mode),rq=fn(t.objectStore(store));
    t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);
  });
};
// clip: {id, project, data:Float32Array, sr, fx, emoji, color}
export const putClip=c=>tx('clips','readwrite',s=>s.put(c)).then(()=>true).catch(()=>false);
export const delClip=id=>tx('clips','readwrite',s=>s.delete(id)).catch(()=>{});
export const allClips=()=>tx('clips','readonly',s=>s.getAll()).catch(()=>[]);
export const delClipsOf=async project=>{for(const c of await allClips())if(c.project===project)await delClip(c.id)};
// progetto: {id, cover:[emoji,colore], state, updated}
export const putProject=p=>tx('projects','readwrite',s=>s.put(p)).then(()=>true).catch(()=>false);
export const delProject=id=>tx('projects','readwrite',s=>s.delete(id)).catch(()=>{});
export const allProjects=()=>tx('projects','readonly',s=>s.getAll()).catch(()=>[]);
