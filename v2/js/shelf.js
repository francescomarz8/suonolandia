// "Le mie canzoni": ogni canzone ha un animale e un colore, e si salva da sola con le sue registrazioni.
import {$,el,state,rt,applyState,blankState,persist,on,emit,ROWS,DRUMS,NOTE_COLORS,holdButton} from './core.js';
import {allProjects,putProject,delProject,delClipsOf,putClip,allClips} from './store.js';
import {togglePlay} from './seq.js';

const COVERS=[['🦄','#F15BB5'],['🐳','#4D9DE0'],['🦖','#3DDC97'],['🚀','#9B5DE5'],['🌈','#FFD23F'],['🐝','#FF9F1C'],
  ['🍓','#FF5A5F'],['🐙','#2EC4B6'],['🦋','#7A7DE2'],['🍕','#FFB92E'],['🐢','#36D0A6'],['⭐','#FFD23F']];
export const MAX_SONGS=12;
let projects=[],timer=null;
const snap=()=>JSON.parse(JSON.stringify(state));
const cur=()=>projects.find(p=>p.id===rt.projectId);
const freeCover=()=>COVERS.find(c=>!projects.some(p=>p.cover[0]===c[0]))||COVERS[projects.length%COVERS.length];
const newId=()=>'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);

export async function initShelf(){
  projects=await allProjects();
  if(!cur()){
    if(projects.length){ // la copia di lavoro non c'è più: riapri l'ultima canzone usata
      const p=[...projects].sort((a,b)=>b.updated-a.updated)[0];rt.projectId=p.id;applyState(p.state);
    }else{
      const p={id:rt.projectId,cover:freeCover(),state:snap(),updated:Date.now()};projects.push(p);await putProject(p);
    }
  }
  renderShelf();
}
function saveNow(){const p=cur();if(!p)return;p.state=snap();p.updated=Date.now();return putProject(p)}
on('dirty',()=>{clearTimeout(timer);timer=setTimeout(()=>{saveNow();renderShelf()},400)});

async function switchTo(p){
  if(rt.playing)togglePlay();
  clearTimeout(timer);await saveNow();
  rt.projectId=p.id;applyState(p.state);state.room='ritmo';persist();
  emit('project');
}
export async function openProject(id){
  const p=projects.find(x=>x.id===id);if(!p)return;
  if(id===rt.projectId){emit('room','ritmo');return}
  await switchTo(p);
}
export async function newProject(){
  if(projects.length>=MAX_SONGS)return;
  const p={id:newId(),cover:freeCover(),state:blankState(),updated:Date.now()};
  projects.push(p);await putProject(p);await switchTo(p);
}
async function deleteProject(id){
  const wasCurrent=id===rt.projectId;
  projects=projects.filter(p=>p.id!==id);await delProject(id);await delClipsOf(id);
  if(wasCurrent){
    clearTimeout(timer);
    if(!projects.length){const p={id:newId(),cover:freeCover(),state:blankState(),updated:Date.now()};projects.push(p);await putProject(p)}
    const p=[...projects].sort((a,b)=>b.updated-a.updated)[0];
    if(rt.playing)togglePlay();
    rt.projectId=p.id;applyState(p.state);persist();emit('project',true);
  }
  renderShelf();
}

// piccolo disegno del ritmo, così la canzone si riconosce a colpo d'occhio
function preview(s){
  const n=s.steps||8,w=100/n,h=100/ROWS.length;let r='';
  ROWS.forEach((row,y)=>{for(let x=0;x<n;x++){
    const on=row.id==='mel'?s.melody[x]!=null:s.pattern[row.id]&&s.pattern[row.id][x];
    if(on)r+=`<rect x="${(x*w+w*.12).toFixed(1)}" y="${(y*h+h*.12).toFixed(1)}" width="${(w*.76).toFixed(1)}" height="${(h*.76).toFixed(1)}" rx="2" fill="${row.id==='mel'?NOTE_COLORS[s.melody[x]%12]:row.color}"/>`;
  }});
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${r}</svg>`;
}
export function renderShelf(){
  const box=$('#shelf');if(!box)return;box.innerHTML='';
  [...projects].sort((a,b)=>a.id===rt.projectId?-1:b.id===rt.projectId?1:b.updated-a.updated).forEach(p=>{
    const card=el('div','song'+(p.id===rt.projectId?' current':''));card.style.setProperty('--c',p.cover[1]);
    const s=p.id===rt.projectId?state:p.state;
    const open=el('button','open','<span class="cover">'+p.cover[0]+'</span>'+preview(s));
    open.setAttribute('aria-label','Apri la canzone '+p.cover[0]);open.onclick=()=>openProject(p.id);
    const del=el('button','del','🗑️');del.title='Tieni premuto per buttare via la canzone';
    del.setAttribute('aria-label','Butta via la canzone (tieni premuto)');holdButton(del,1000,()=>deleteProject(p.id));
    card.append(open,del);box.append(card);
  });
  if(projects.length<MAX_SONGS){
    const add=el('button','song add','➕');add.setAttribute('aria-label','Nuova canzone');add.title='Nuova canzone';
    add.onclick=newProject;box.append(add);
  }
}
export const currentCover=()=>{const p=cur();return p?p.cover:COVERS[0]};

/* ---------- esporta / importa: un solo file con ritmo, melodia e registrazioni ---------- */
function b64(i16){const u=new Uint8Array(i16.buffer);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function unb64(str){const s=atob(str),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new Int16Array(u.buffer)}
export async function exportProject(){
  await saveNow();const p=cur();
  const clips=(await allClips()).filter(c=>c.project===p.id).map(c=>{
    const i16=new Int16Array(c.data.length);for(let i=0;i<i16.length;i++)i16[i]=Math.max(-1,Math.min(1,c.data[i]))*32767;
    return {id:c.id,sr:c.sr,fx:c.fx,emoji:c.emoji,color:c.color,pcm:b64(i16)};
  });
  const blob=new Blob([JSON.stringify({app:'suonolandia',v:2,cover:p.cover,state:p.state,clips})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='canzone-'+p.cover[0]+'.suonolandia';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}
export async function importProject(file){
  const d=JSON.parse(await file.text());
  if(d.app!=='suonolandia'||!d.state)throw new Error('file non valido');
  if(projects.length>=MAX_SONGS)throw new Error('scaffale pieno');
  const p={id:newId(),cover:Array.isArray(d.cover)&&!projects.some(x=>x.cover[0]===d.cover[0])?d.cover.slice(0,2):freeCover(),state:d.state,updated:Date.now()};
  let next=(await allClips()).reduce((m,c)=>Math.max(m,c.id),0);
  for(const c of d.clips||[]){
    const i16=unb64(c.pcm),data=new Float32Array(i16.length);for(let i=0;i<data.length;i++)data[i]=i16[i]/32767;
    const id=++next;if(p.state.activeClipId===c.id)p.state.activeClipId=id;
    await putClip({id,project:p.id,data,sr:c.sr,fx:c.fx||'normal',emoji:c.emoji,color:c.color});
  }
  projects.push(p);await putProject(p);await switchTo(p);
}
