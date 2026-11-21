// Avvio, stanze, comandi comuni, schermo e tocco.
import {$,state,rt,loadState,persist,on} from './core.js';
import {A,initAudio,drum} from './audio.js';
import {togglePlay,startFrames} from './seq.js';
import {buildGrid,rollBig,rollSmall,clearAll,undo,clearUndo,setSteps,paintSteps} from './grid.js';
import {buildKeys,buildSounds,setSound,setMagic,setWrite} from './keys.js';
import {loadClips,renderClips,toggleRec,_addTestClip} from './voice.js';
import {initMIDI,onMIDI,_setAccess,duo} from './midi.js';
import {initShelf,renderShelf,openProject,newProject,exportProject,importProject} from './shelf.js';
import {initParent,applyVolume} from './parent.js';

/* ---------- stanze ---------- */
const ROOMS=['ritmo','voce','tastiera','canzoni'];
function setRoom(id){
  if(!ROOMS.includes(id))id='ritmo';
  if(id!=='canzoni'){state.room=id;persist()}else renderShelf();
  document.querySelectorAll('.room').forEach(r=>r.classList.toggle('on',r.id==='room-'+id));
  document.querySelectorAll('.roomBtn').forEach(b=>{const v=b.dataset.room===id;b.classList.toggle('on',v);b.setAttribute('aria-pressed',v)});
}
document.querySelectorAll('.roomBtn').forEach(b=>b.onclick=()=>setRoom(b.dataset.room));
on('room',setRoom);

/* ---------- comandi comuni ---------- */
on('play',p=>{const b=$('#play');b.classList.toggle('on',p);b.textContent=p?'⏹️':'▶️';b.setAttribute('aria-label',p?'Ferma':'Suona')});

// ridisegna tutto quando si apre un'altra canzone
async function showProject(stay){
  await loadClips();
  buildGrid();renderClips();
  setSound(state.sound==='voice'&&!rt.activeClip?'piano':state.sound);
  setMagic(state.magic);setWrite(false);paintSteps();
  $('#tempo').value=state.bpm;clearUndo();
  if(!stay)setRoom('ritmo');
  renderShelf();
}
on('project',showProject);

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
addEventListener('pointerup',()=>setTimeout(()=>{
  const a=document.activeElement;if(a&&a!==document.body&&!a.closest('dialog'))a.blur()},0));
$('#fs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})};

/* ---------- avvio ---------- */
loadState();
$('#title').innerHTML=[...'Suonolandia'].map(c=>'<span>'+c+'</span>').join('');
$('#tempo').value=state.bpm;
$('#tempo').oninput=e=>{state.bpm=+e.target.value;persist()};
$('#play').onclick=togglePlay;
$('#diceB').onclick=rollBig;
$('#diceS').onclick=rollSmall;
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
  initAudio();applyVolume();A.ctx.resume();
  await initShelf();await loadClips();
  buildGrid();buildKeys();buildSounds();renderClips();setMagic(state.magic);paintSteps();setRoom(state.room);
  initParent();initMIDI();
  $('#start').remove();drum('boing');startFrames();
  document.body.dataset.ready='1';
};

// funziona anche senza internet dopo la prima visita
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});

// per le prove automatiche
window.__suono={state,rt,A,duo,togglePlay,rollBig,rollSmall,clearAll,undo,setSteps,setRoom,_addTestClip,
  openProject,newProject,exportProject,importProject,onMIDI,_setAccess};
