// Avvio, stanze, comandi comuni, schermo e tocco, salvataggio della canzone.
import {$,state,rt,loadState,persist,on,wiggle,holdButton,SAVE_LOOPS} from './core.js';
import {A,initAudio,drum,wavBlob} from './audio.js';
import {togglePlay,startFrames,stepDur} from './seq.js';
import {buildGrid,surprise,clearAll,undo,setSteps,paintSteps} from './grid.js';
import {buildKeys,buildSounds,setMagic,setWrite} from './keys.js';
import {loadClips,renderClips,toggleRec,_addTestClip} from './voice.js';
import {initMIDI} from './midi.js';

/* ---------- stanze ---------- */
function setRoom(id){
  state.room=id;persist();
  document.querySelectorAll('.room').forEach(r=>r.classList.toggle('on',r.id==='room-'+id));
  document.querySelectorAll('.roomBtn').forEach(b=>{const v=b.dataset.room===id;b.classList.toggle('on',v);b.setAttribute('aria-pressed',v)});
}
document.querySelectorAll('.roomBtn').forEach(b=>b.onclick=()=>setRoom(b.dataset.room));

/* ---------- comandi comuni ---------- */
on('play',p=>{const b=$('#play');b.classList.toggle('on',p);b.textContent=p?'⏹️':'▶️';b.setAttribute('aria-label',p?'Ferma':'Suona')});

/* ---------- schermo e tocco ---------- */
// su schermi piccoli rimpicciolisce tutto perché stia in una schermata
function fit(){
  const wide=innerWidth>860,z=wide?Math.min(1,innerWidth/1100,innerHeight/680):1,b=document.body.style;
  b.zoom=z;b.height=wide?(innerHeight/z)+'px':'';
}
addEventListener('resize',fit);fit();
// col dito spariscono le lettere dei tasti; tornano appena si usa la tastiera del computer
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.body.classList.add('touch')},true);
addEventListener('keydown',()=>document.body.classList.remove('touch'),true);
addEventListener('contextmenu',e=>e.preventDefault());
// niente focus che resta sui bottoni: la barra spaziatrice deve solo suonare/fermare
addEventListener('pointerup',()=>setTimeout(()=>{const a=document.activeElement;if(a&&a!==document.body)a.blur()},0));
$('#fs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})};

/* ---------- salva canzone (per i grandi) ---------- */
let saver=null,saveTimer=null;
function stopSave(){
  if(!saver)return;clearTimeout(saveTimer);
  if(rt.playing)togglePlay();
  const s=saver;setTimeout(()=>s.state!=='inactive'&&s.stop(),1200); // lascia finire le code
}
function startSave(){
  const b=$('#save');
  if(rt.playing)togglePlay();
  const chunks=[];saver=new MediaRecorder(A.saveDest.stream);
  saver.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  saver.onstop=async()=>{
    const type=saver.mimeType||'audio/webm';saver=null;
    b.classList.remove('recording');b.textContent='💾';
    let blob=new Blob(chunks,{type}),ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';
    try{blob=wavBlob(await A.ctx.decodeAudioData(await blob.arrayBuffer()));ext='wav'}catch(e){}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='la-mia-canzone.'+ext;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  };
  saver.start();b.classList.add('recording');b.textContent='⏺️';
  togglePlay();
  saveTimer=setTimeout(stopSave,state.steps*SAVE_LOOPS*stepDur()*1000+60);
}
$('#save').onclick=()=>{if(saver)stopSave();else wiggle($('#save'))};
holdButton($('#save'),1200,()=>{if(!saver)startSave()});

/* ---------- avvio ---------- */
loadState();
$('#title').innerHTML=[...'Suonolandia'].map(c=>'<span>'+c+'</span>').join('');
$('#tempo').value=state.bpm;
$('#tempo').oninput=e=>{state.bpm=+e.target.value;persist()};
$('#play').onclick=togglePlay;
$('#dice').onclick=surprise;
$('#clear').onclick=clearAll;
$('#undo').onclick=undo;
$('#steps').onclick=()=>setSteps(state.steps===8?16:8);
$('#rec').onclick=toggleRec;
let echoOn=false;
$('#echo').onclick=e=>{echoOn=!echoOn;const b=e.currentTarget;b.classList.toggle('sel',echoOn);b.setAttribute('aria-pressed',echoOn);
  A.echoSend.gain.setTargetAtTime(echoOn?.5:0,A.ctx.currentTime,.05)};
$('#write').onclick=()=>setWrite(!rt.writeMode);
$('#magic').onclick=()=>setMagic(!state.magic);
$('#startBtn').onclick=async()=>{
  $('#startBtn').disabled=true;
  initAudio();A.ctx.resume();
  await loadClips();
  buildGrid();buildKeys();buildSounds();renderClips();setMagic(state.magic);paintSteps();setRoom(state.room);initMIDI();
  $('#start').remove();drum('boing');startFrames();
  document.body.dataset.ready='1';
};

// per le prove automatiche
window.__suono={state,rt,A,togglePlay,surprise,clearAll,undo,setSteps,setRoom,_addTestClip};
