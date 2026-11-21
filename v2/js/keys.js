// La tastiera: tasti sullo schermo, tasti del computer, suoni, Magia, Scrivi.
import {$,el,state,rt,SOUNDS,DRUMS,SOLF,NOTE_COLORS,KEYMAP,isBlack,persist,bounce,wiggle} from './core.js';
import {A,makeVoice,blip,drum} from './audio.js';
import {togglePlay,stepDur,muteUntil} from './seq.js';
import {paintMelody,showCursor,bounceMel} from './grid.js';

const held=new Map(),sustained=new Set(),keyEls={};
let pedal=false;
const KEYLABEL=Object.fromEntries(Object.entries(KEYMAP).map(([c,n])=>[n,c==='Semicolon'?'Ò':c.slice(3)]));

export function buildKeys(){
  const box=$('#keys'),whites=[60,62,64,65,67,69,71,72,74,76],blacks={61:1,63:2,66:4,68:5,70:6,73:8,75:9};
  const mk=(n,black)=>{
    const k=el('div','key'+(black?' black':''));k.dataset.note=n;k.style.setProperty('--c',NOTE_COLORS[n%12]);
    k.setAttribute('role','button');k.setAttribute('aria-label',SOLF[n%12]);
    k.innerHTML=(black?'':'<span>'+SOLF[n%12]+'</span>')+'<kbd>'+KEYLABEL[n]+'</kbd>';keyEls[n]=k;return k};
  whites.forEach(n=>box.append(mk(n,false)));
  Object.entries(blacks).forEach(([n,i])=>{const k=mk(+n,true);k.style.setProperty('--i',i);box.append(k)});
  // lettere giuste per la tastiera di questo computer
  if(navigator.keyboard&&navigator.keyboard.getLayoutMap)navigator.keyboard.getLayoutMap().then(m=>{
    for(const code in KEYMAP){const ch=m.get(code);if(ch)keyEls[KEYMAP[code]].querySelector('kbd').textContent=ch.toUpperCase()}
  }).catch(()=>{});

  const ptr=new Map();
  const noteAt=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);const k=t&&t.closest&&t.closest('.key');return k?+k.dataset.note:null};
  box.addEventListener('pointerdown',e=>{e.preventDefault();box.setPointerCapture(e.pointerId);
    const n=noteAt(e);ptr.set(e.pointerId,n);if(n!=null)press(n,.85)});
  box.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;
    const n=noteAt(e),old=ptr.get(e.pointerId);if(n===old)return;
    if(old!=null)release(old);ptr.set(e.pointerId,n);if(n!=null)press(n,.85)});
  const up=e=>{if(!ptr.has(e.pointerId))return;const old=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(old!=null)release(old)};
  box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
}

export function press(n,vel){
  if(!A.ctx)return;
  if(sustained.has(n)){sustained.delete(n);const o=held.get(n);if(o){held.delete(n);o.stop(A.ctx.currentTime)}}
  if(held.has(n))return;
  held.set(n,makeVoice(n,vel,A.ctx.currentTime,state.sound,false));
  rt.lastNote=n;keyEls[n]&&keyEls[n].classList.add('down');
  if(rt.writeMode)writeNote(n);
}
export function release(n,force){
  const v=held.get(n);if(!v)return;
  keyEls[n]&&keyEls[n].classList.remove('down');
  if(pedal&&!force){sustained.add(n);return}
  held.delete(n);sustained.delete(n);v.stop(A.ctx.currentTime);
}
export function setPedal(down){
  pedal=down;if(!down)[...sustained].forEach(k=>release(k,true));
}
function writeNote(n){
  let s;
  if(rt.playing&&rt.curStep>=0){
    const off=Math.round((A.ctx.currentTime-rt.curStepTime)/stepDur());
    s=(rt.curStep+off)%state.steps;
    if(off>0)muteUntil[s]=A.ctx.currentTime+stepDur();
  }else{s=rt.cursor;rt.cursor=(rt.cursor+1)%state.steps}
  state.melody[s]=n;paintMelody();persist();bounceMel(s);
  if(!rt.playing&&rt.cursor===0){setWrite(false);togglePlay()} // riga piena: fine, e si ascolta!
}
export function setWrite(v){
  rt.writeMode=v;rt.cursor=0;const b=$('#write');b.classList.toggle('sel',v);b.setAttribute('aria-pressed',v);showCursor();
}
export function setSound(id){
  if(id==='voice'&&!rt.activeClip){wiggle($('#snd-voice'));return}
  state.sound=id;
  document.querySelectorAll('.snd').forEach(b=>{const v=b.dataset.id===id;b.classList.toggle('sel',v);b.setAttribute('aria-pressed',v)});
  persist();
}
export function buildSounds(){
  SOUNDS.forEach(s=>{
    const b=el('button','btn snd','<span>'+s.emoji+'</span><small>'+s.name+'</small>');b.dataset.id=s.id;b.id='snd-'+s.id;b.title=s.name;
    b.onclick=()=>{setSound(s.id);if(state.sound===s.id)blip(rt.lastNote,s.id)};
    $('#sounds').append(b);
  });
  setSound(state.sound==='voice'&&!rt.activeClip?'piano':state.sound);
}
export function setMagic(v){
  state.magic=v;const b=$('#magic');b.classList.toggle('sel',v);b.setAttribute('aria-pressed',v);
  $('#keys').classList.toggle('magic',v);persist();
}

/* ---------- tasti del computer ---------- */
addEventListener('keydown',e=>{
  if(!A.ctx||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePlay();return}
  if(e.repeat)return;
  if(e.code in KEYMAP){
    e.preventDefault();const n=KEYMAP[e.code];
    if(state.magic&&isBlack(n))return;
    press(n,.85);return}
  const m=/^Digit([1-6])$/.exec(e.code);
  if(m){const d=DRUMS[+m[1]-1];
    if(d.id==='voice'&&!rt.activeClip)wiggle($('#rec'));else drum(d.id);
    bounce($('#row-'+d.id))}
});
addEventListener('keyup',e=>{if(e.code in KEYMAP)release(KEYMAP[e.code])});
addEventListener('blur',()=>{pedal=false;[...held.keys()].forEach(n=>release(n,true))});
