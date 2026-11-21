// Dati comuni, stato e piccoli aiuti usati da tutti i moduli.
export const $=s=>document.querySelector(s);
export const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};

export const MAX_STEPS=16;
export const ROWS=[
  {id:'mel',  emoji:'🎵',name:'Melodia',  color:'#F15BB5'},
  {id:'kick', emoji:'🐘',name:'Cassa',    color:'#FF5A5F'},
  {id:'snare',emoji:'🥁',name:'Rullante', color:'#FF9F1C'},
  {id:'hat',  emoji:'🐍',name:'Piatto',   color:'#FFD23F'},
  {id:'clap', emoji:'👏',name:'Battimani',color:'#3DDC97'},
  {id:'boing',emoji:'🐸',name:'Boing',    color:'#4D9DE0'},
  {id:'voice',emoji:'🎤',name:'La mia voce',color:'#9B5DE5'},
];
export const DRUMS=ROWS.slice(1);
export const SOUNDS=[
  {id:'piano',emoji:'🎹',name:'Piano'},
  {id:'robot',emoji:'🤖',name:'Robot'},
  {id:'bell', emoji:'🔔',name:'Campane'},
  {id:'bird', emoji:'🐦',name:'Uccellino'},
  {id:'voice',emoji:'🎤',name:'Voce'},
];
export const SOLF=['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
export const NOTE_COLORS=['#FF5A5F','#FF7A3D','#FF9F1C','#FFB92E','#FFD23F','#3DDC97','#36D0A6','#2EC4B6','#3EB1C8','#4D9DE0','#7A7DE2','#9B5DE5'];
export const PENTA=[60,62,64,67,69,72];
export const isBlack=n=>[1,3,6,8,10].includes(n%12);
export const KEYMAP={KeyA:60,KeyW:61,KeyS:62,KeyE:63,KeyD:64,KeyF:65,KeyT:66,KeyG:67,KeyY:68,KeyH:69,KeyU:70,KeyJ:71,KeyK:72,KeyO:73,KeyL:74,KeyP:75,Semicolon:76};
export const FX=[{id:'normal',emoji:'🙂',name:'Normale'},{id:'topo',emoji:'🐭',name:'Topolino'},{id:'orso',emoji:'🐻',name:'Orso'},{id:'rev',emoji:'🙃',name:'Al contrario'}];
export const CLIP_LOOK=[['🦁','#FF9F1C'],['🐱','#F15BB5'],['🐶','#4D9DE0'],['🐵','#3DDC97'],['🦊','#FF5A5F'],['🐼','#9B5DE5']];
export const MAX_CLIPS=6, MAX_REC=8, MAX_VOICES=10, SAVE_LOOPS=4;

// Quello che viene salvato (il progetto).
export const blankState=()=>{
  const s={bpm:100,sound:'piano',magic:true,steps:8,room:'ritmo',activeClipId:null,pattern:{},melody:Array(MAX_STEPS).fill(null)};
  DRUMS.forEach(d=>s.pattern[d.id]=Array(MAX_STEPS).fill(false));return s;
};
export const state=blankState();
const KEY='suonolandia-v2';
const fitLen=(a,fill)=>{const out=Array(MAX_STEPS).fill(fill);if(Array.isArray(a))a.slice(0,MAX_STEPS).forEach((v,i)=>out[i]=v);return out};
// copia in `state` un progetto salvato, controllando ogni valore
export function applyState(s){
  Object.assign(state,blankState());if(!s)return;
  if(s.bpm>=60&&s.bpm<=160)state.bpm=s.bpm;
  if(SOUNDS.some(x=>x.id===s.sound))state.sound=s.sound;
  if(typeof s.magic==='boolean')state.magic=s.magic;
  if(s.steps===8||s.steps===16)state.steps=s.steps;
  if(['ritmo','voce','tastiera'].includes(s.room))state.room=s.room;
  state.activeClipId=s.activeClipId??null;
  state.melody=fitLen(s.melody,null);
  DRUMS.forEach(d=>state.pattern[d.id]=fitLen(s.pattern&&s.pattern[d.id],false));
}
export function loadState(){
  try{const s=JSON.parse(localStorage.getItem(KEY));applyState(s);if(s&&s._project)rt.projectId=s._project}catch(e){}
}
export const persist=()=>{
  try{localStorage.setItem(KEY,JSON.stringify({...state,_project:rt.projectId}))}catch(e){}
  emit('dirty');
};

// Quello che vive solo mentre si gioca.
export const rt={projectId:'current',clips:[],activeClip:null,clipCount:0,lastNote:60,writeMode:false,cursor:0,
  playing:false,curStep:-1,curStepTime:0,muted:new URLSearchParams(location.search).has('muto')};

// Messaggi fra moduli: on('step',fn) / emit('step',3)
const subs={};
export const on=(name,fn)=>(subs[name]||(subs[name]=[])).push(fn);
export const emit=(name,...a)=>(subs[name]||[]).forEach(fn=>fn(...a));

export const bounce=e=>e&&e.animate([{transform:'scale(1.3) rotate(-10deg)'},{transform:'scale(1)'}],{duration:220,easing:'ease-out'});
export const wiggle=e=>{if(!e)return;e.classList.remove('wiggle');void e.offsetWidth;e.classList.add('wiggle')};
// tieni premuto `ms` per fare `onHold`; `onDown` scatta subito al tocco
export function holdButton(b,ms,onHold,onDown){
  let t=null;
  const end=()=>{if(t){clearTimeout(t);t=null}b.classList.remove('holding')};
  b.addEventListener('pointerdown',e=>{
    if(e.button>0)return;onDown&&onDown();
    b.style.setProperty('--hold',ms+'ms');b.classList.add('holding');
    t=setTimeout(()=>{t=null;b.classList.remove('holding');onHold()},ms);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(n=>b.addEventListener(n,end));
  b.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat){e.shiftKey?onHold():onDown&&onDown()}});
}
