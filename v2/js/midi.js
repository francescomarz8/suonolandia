// Strumenti MIDI collegati via USB.
import {$,state,isBlack} from './core.js';
import {drum} from './audio.js';
import {press,release,setPedal} from './keys.js';

const GM_DRUMS={35:'kick',36:'kick',38:'snare',40:'snare',39:'clap',42:'hat',44:'hat',46:'hat',45:'boing',47:'boing',48:'boing',50:'boing'};
const midiNote=n=>state.magic&&isBlack(n)?n-1:n; // con la Magia i tasti neri suonano il bianco vicino

function onMIDI(e){
  const [st,n,v]=e.data,cmd=st&0xf0,ch=st&0x0f;
  if(cmd===0x90&&v>0){
    if(ch===9&&GM_DRUMS[n]){drum(GM_DRUMS[n]);return}
    press(midiNote(n),.35+v/127*.65);
  }else if(cmd===0x80||(cmd===0x90&&v===0))release(midiNote(n));
  else if(cmd===0xB0&&n===64)setPedal(v>=64);
}
export function initMIDI(){
  if(!navigator.requestMIDIAccess)return;
  navigator.requestMIDIAccess().then(acc=>{
    const bind=()=>{
      const names=[];acc.inputs.forEach(i=>{i.onmidimessage=onMIDI;if(i.state!=='disconnected')names.push(i.name)});
      const m=$('#midi');m.classList.toggle('on',names.length>0);
      m.textContent=names.length?'🎹 Collegata: '+names.join(', '):'';
    };
    bind();acc.onstatechange=bind;
  }).catch(()=>{});
}
