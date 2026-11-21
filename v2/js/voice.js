// La stanza della voce: registra, ascolta, effetti. Le registrazioni si conservano.
import {$,el,state,rt,FX,CLIP_LOOK,MAX_CLIPS,MAX_REC,persist,wiggle,holdButton} from './core.js';
import {A,playClipAt,trimAndNormalize} from './audio.js';
import {putClip,delClip,allClips} from './store.js';
import {paintAll} from './grid.js';
import {setSound} from './keys.js';

export const record=c=>({id:c.id,project:rt.projectId,data:c.buf.getChannelData(0).slice(),sr:c.buf.sampleRate,fx:c.fx,emoji:c.emoji,color:c.color});
const save=c=>putClip(record(c));

export async function loadClips(){
  const all=await allClips();
  rt.clipCount=all.reduce((m,c)=>Math.max(m,c.id),0);
  const rows=all.filter(c=>c.project===rt.projectId).sort((a,b)=>a.id-b.id);
  rt.clips.forEach(c=>{if(c.src){try{c.src.stop()}catch(e){}}});
  rt.clips=rows.map(r=>{
    const buf=A.ctx.createBuffer(1,r.data.length,r.sr);buf.copyToChannel(r.data,0);
    return {id:r.id,buf,fx:r.fx||'normal',emoji:r.emoji,color:r.color,src:null};
  });
  rt.activeClip=rt.clips.find(c=>c.id===state.activeClipId)||rt.clips[rt.clips.length-1]||null;
  if(!rt.activeClip)state.pattern.voice.fill(false);
}
function setActive(c){rt.activeClip=c;state.activeClipId=c?c.id:null;persist()}

function addClip(buf){
  const [emoji,color]=CLIP_LOOK[rt.clipCount++%CLIP_LOOK.length];
  const c={id:rt.clipCount,buf,fx:'normal',emoji,color,src:null};
  rt.clips.push(c);save(c);previewClip(c);
}
function previewClip(c){
  rt.clips.forEach(x=>{if(x.src){try{x.src.stop()}catch(e){}}});
  setActive(c);renderClips();
  const src=playClipAt(c,A.ctx.currentTime);c.src=src;
  const card=$('#clip'+c.id);card&&card.classList.add('playing');
  src.onended=()=>{if(c.src===src){c.src=null;const k=$('#clip'+c.id);k&&k.classList.remove('playing')}};
}
function deleteClip(c){
  if(c.src){try{c.src.stop()}catch(e){}}
  rt.clips=rt.clips.filter(x=>x!==c);delClip(c.id);
  if(rt.activeClip===c)setActive(rt.clips[rt.clips.length-1]||null);
  if(!rt.activeClip){state.pattern.voice.fill(false);paintAll();persist()}
  renderClips();$('#hint').textContent='Premi e canta!';
}
export function renderClips(){
  const box=$('#clips');box.innerHTML='';
  if(!rt.clips.length)box.append(el('div','empty','🦁 🐱 🐶 🐵'));
  rt.clips.forEach(c=>{
    const card=el('div','clip'+(c===rt.activeClip?' active':''));card.id='clip'+c.id;card.style.setProperty('--c',c.color);
    const top=el('div','top');
    const go=el('button','go',c.emoji);go.title='Ascolta';go.setAttribute('aria-label','Ascolta '+c.emoji);go.onclick=()=>previewClip(c);
    const del=el('button','del','🗑️');del.title='Tieni premuto per buttare via';del.setAttribute('aria-label','Butta via (tieni premuto)');
    holdButton(del,700,()=>deleteClip(c));
    top.append(go,del);
    const fx=el('div','fx');
    FX.forEach(f=>{const b=el('button',c.fx===f.id?'sel':'',f.emoji);b.title=f.name;b.setAttribute('aria-label',f.name);
      b.setAttribute('aria-pressed',c.fx===f.id);b.onclick=()=>{c.fx=f.id;save(c);previewClip(c)};fx.append(b)});
    card.append(top,fx);box.append(card);
  });
  // l'animale scelto compare anche nella riga del ritmo e fra i suoni della tastiera
  const face=rt.activeClip?rt.activeClip.emoji:'🎤';
  const rb=$('#row-voice .face');if(rb){rb.textContent=face;rb.parentNode.style.filter=rt.activeClip?'':'grayscale(1)'}
  const vb=$('#snd-voice');if(vb){vb.classList.toggle('off',!rt.activeClip);vb.firstChild.textContent=face}
  if(!rt.activeClip&&state.sound==='voice')setSound('piano');
}

let micStream=null,recorder=null,recStart=0,recTimer=null;
export async function toggleRec(){
  const btn=$('#rec'),hint=$('#hint');
  if(recorder){recorder.stop();return}
  if(rt.clips.length>=MAX_CLIPS){hint.textContent='Pieno! Tieni premuto 🗑️';document.querySelectorAll('.clip .del').forEach(wiggle);return}
  try{
    if(!micStream)micStream=await navigator.mediaDevices.getUserMedia({audio:true});
  }catch(e){hint.textContent='Serve il microfono 🎤';wiggle(btn);return}
  const chunks=[];recorder=new MediaRecorder(micStream);
  recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  recorder.onstop=async()=>{
    clearInterval(recTimer);const type=recorder.mimeType;recorder=null;
    btn.classList.remove('recording');btn.textContent='🎤';
    micStream.getTracks().forEach(t=>t.stop());micStream=null;
    try{
      const raw=await A.ctx.decodeAudioData(await new Blob(chunks,{type}).arrayBuffer());
      const buf=trimAndNormalize(raw);
      if(!buf){hint.textContent='Più forte! 🙉';wiggle(btn);return}
      hint.textContent='Bravo! 🎉';addClip(buf);
    }catch(e){hint.textContent='Ops! Riprova 🙈'}
  };
  recorder.start();recStart=performance.now();
  btn.classList.add('recording');btn.textContent='⏹️';hint.textContent='Ti ascolto… 👂';
  recTimer=setInterval(()=>{
    const p=(performance.now()-recStart)/1000/MAX_REC;btn.style.setProperty('--p',Math.min(1,p));
    if(p>=1&&recorder)recorder.stop();
  },80);
}
// usato dalle prove automatiche: aggiunge una registrazione finta
export const _addTestClip=buf=>addClip(trimAndNormalize(buf));
