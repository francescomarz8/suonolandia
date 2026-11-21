// Strumenti MIDI via USB. Duo: ogni strumento ha il suo suono, e il computer manda il tempo (clock).
import {$,state,rt,magicNote,DRUMS,SOUNDS,on,emit,bounce} from './core.js';
import {A,drum} from './audio.js';
import {press,release,setPedal} from './keys.js';

const GM_DRUMS={35:'kick',36:'kick',38:'snare',40:'snare',39:'clap',42:'hat',44:'hat',46:'hat',45:'boing',47:'boing',48:'boing',50:'boing'};

// Impostazioni Duo, ricordate per nome dello strumento.
// sound: 'screen' (come lo schermo) | un suono | 'drums' (i pad suonano la batteria) | 'none' (suona da solo)
const KEY='suonolandia-duo';
export const duo={clockOut:true,nudge:0,devices:{}};
try{Object.assign(duo,JSON.parse(localStorage.getItem(KEY))||{})}catch(e){}
export const saveDuo=()=>{try{localStorage.setItem(KEY,JSON.stringify(duo))}catch(e){}};
export function deviceCfg(name){
  // una drum machine con il suo suono non deve far suonare anche il computer
  return duo.devices[name]||(duo.devices[name]={sound:/drumbrute|drum machine|tr-|volca/i.test(name)?'none':'screen',drumMap:{}});
}
export const DEVICE_SOUNDS=[['screen','Come lo schermo'],...SOUNDS.filter(s=>s.id!=='voice').map(s=>[s.id,s.emoji+' '+s.name]),
  ['voice','🎤 Voce registrata'],['drums','🥁 Batteria (pad)'],['none','Niente (suona da solo)']];

let access=null,learning=null; // learning: {name, idx}
const sounding={}; // strumento:tasto -> nota suonata
export const midiInputs=()=>access?[...access.inputs.values()].filter(i=>i.state!=='disconnected'):[];
export const midiOutputs=()=>access?[...access.outputs.values()].filter(o=>o.state!=='disconnected'):[];
export const learnState=()=>learning;
// "Impara i pad": i prossimi 6 pad premuti diventano, in ordine, le 6 righe della batteria
// I pad imparati suonano la batteria; tutti gli altri tasti dello stesso strumento continuano a suonare le note.
// Ogni pad è ricordato come canale:nota, così pad e tasti si distinguono anche se usano le stesse note.
export function startLearn(name){const c=deviceCfg(name);c.drumMap={};if(c.sound==='none')c.sound='screen';learning={name,idx:0};saveDuo();emit('duo')}
export function stopLearn(){learning=null;emit('duo')}

function hit(id){
  if(id==='voice'&&!rt.activeClip)return;
  drum(id);bounce($('#row-'+id));
}
export function onMIDI(e){
  const d=e.data,st=d[0];if(st>=0xF0||!A.ctx)return;
  const name=e.target.name,cfg=deviceCfg(name),n=d[1],v=d[2],cmd=st&0xf0,ch=st&0x0f;
  const pad=(ch+1)+':'+n;
  if(cmd===0x90&&v>0){
    if(learning&&learning.name===name){
      if(cfg.drumMap[pad])return; // stesso pad premuto due volte
      const id=DRUMS[learning.idx].id;cfg.drumMap[pad]=id;hit(id);
      if(++learning.idx>=DRUMS.length)learning=null;
      saveDuo();emit('duo');return;
    }
    if(cfg.sound==='none')return;
    if(cfg.drumMap[pad]){hit(cfg.drumMap[pad]);return}
    if(cfg.sound==='drums'){if(GM_DRUMS[n])hit(GM_DRUMS[n]);return}
    if(cfg.sound==='screen'&&ch===9&&GM_DRUMS[n]){hit(GM_DRUMS[n]);return}
    const m=magicNote(n);sounding[name+':'+pad]=m; // con la Magia la nota va sul tasto buono più vicino
    press(m,.35+v/127*.65,cfg.sound==='screen'?undefined:cfg.sound,name);
  }else if(cmd===0x80||(cmd===0x90&&v===0)){
    const k=name+':'+pad;
    if(k in sounding){release(sounding[k],false,name);delete sounding[k]}
  }else if(cmd===0xB0&&n===64)setPedal(v>=64);
}
export function initMIDI(){
  if(!navigator.requestMIDIAccess)return;
  navigator.requestMIDIAccess().then(acc=>{
    access=acc;
    const bind=()=>{
      const names=midiInputs().map(i=>{i.onmidimessage=onMIDI;return i.name});
      const m=$('#midi');m.classList.toggle('on',names.length>0);
      m.textContent=names.length?'🎹 '+names.join(' + '):'';
      emit('duo');
    };
    bind();acc.onstatechange=bind;
  }).catch(()=>{});
}

/* ---------- clock: 24 tic per battito, più Start e Stop ---------- */
let nextClock=0,clockOn=false,offset=null;
// Da tempo-audio a tempo-MIDI. getOutputTimestamp dice a che ora "vera" esce un certo istante audio
// (ritardo delle casse compreso); l'aggancio è lisciato per non far tremare i tic.
function anchor(reset){
  const o=A.ctx.getOutputTimestamp?A.ctx.getOutputTimestamp():null;
  const now=o&&o.performanceTime?o.performanceTime-o.contextTime*1000
    :performance.now()-A.ctx.currentTime*1000+(A.ctx.outputLatency||0)*1000;
  offset=reset||offset==null?now:offset*.98+now*.02;
}
const ts=t=>t*1000+offset+(duo.nudge||0);
const sendAll=(bytes,when)=>midiOutputs().forEach(o=>{try{o.send(bytes,when)}catch(e){}});
on('clock:start',t0=>{
  if(!duo.clockOut||!midiOutputs().length)return;
  clockOn=true;nextClock=t0;anchor(true);sendAll([0xFA],Math.max(performance.now(),ts(t0)-1));
});
on('clock:pump',horizon=>{
  if(!clockOn)return;
  anchor();
  while(nextClock<horizon){sendAll([0xF8],Math.max(performance.now(),ts(nextClock)));nextClock+=60/state.bpm/24}
});
on('clock:stop',()=>{if(clockOn){clockOn=false;sendAll([0xFC])}});

// per le prove automatiche
export const _setAccess=a=>{access=a;emit('duo')};
