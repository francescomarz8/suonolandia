// Angolo dei grandi: volume massimo, salvataggi, strumenti MIDI. Si apre tenendo premuto ⚙️.
import {$,el,state,rt,on,wiggle,holdButton,DRUMS,SAVE_LOOPS} from './core.js';
import {A,wavBlob} from './audio.js';
import {togglePlay,stepDur} from './seq.js';
import {exportProject,importProject} from './shelf.js';
import {duo,saveDuo,deviceCfg,DEVICE_SOUNDS,midiInputs,midiOutputs,startLearn,stopLearn,learnState} from './midi.js';

const KEY='suonolandia-settings';
export const settings={maxVol:.7};
try{Object.assign(settings,JSON.parse(localStorage.getItem(KEY))||{})}catch(e){}
const saveSettings=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(e){}};
export const applyVolume=()=>{if(A.master)A.master.gain.value=rt.muted?0:settings.maxVol};

/* ---------- registra la canzone in un file audio ---------- */
let saver=null,saveTimer=null;
function stopSave(){
  if(!saver)return;clearTimeout(saveTimer);
  if(rt.playing)togglePlay();
  const s=saver;setTimeout(()=>s.state!=='inactive'&&s.stop(),1200); // lascia finire le code
}
function startSave(){
  const b=$('#gear');
  if(rt.playing)togglePlay();
  const chunks=[];saver=new MediaRecorder(A.saveDest.stream);
  saver.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  saver.onstop=async()=>{
    const type=saver.mimeType||'audio/webm';saver=null;
    b.classList.remove('recording');b.textContent='⚙️';
    let blob=new Blob(chunks,{type}),ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';
    try{blob=wavBlob(await A.ctx.decodeAudioData(await blob.arrayBuffer()));ext='wav'}catch(e){}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='la-mia-canzone.'+ext;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  };
  saver.start();b.classList.add('recording');b.textContent='⏺️';
  togglePlay();
  saveTimer=setTimeout(stopSave,state.steps*SAVE_LOOPS*stepDur()*1000+60);
}

/* ---------- finestra ---------- */
function renderDevices(){
  const box=$('#pDevices');if(!box)return;box.innerHTML='';
  const ins=midiInputs(),outs=midiOutputs(),learn=learnState();
  if(!ins.length)box.append(el('p','muted','Nessuno strumento collegato. Collega il cavo USB: comparirà qui.'));
  ins.forEach(i=>{
    const cfg=deviceCfg(i.name),row=el('div','dev');
    const sel=el('select');sel.setAttribute('aria-label','Suono di '+i.name);
    DEVICE_SOUNDS.forEach(([id,label])=>{const o=el('option',null,label);o.value=id;if(cfg.sound===id)o.selected=true;sel.append(o)});
    sel.onchange=()=>{cfg.sound=sel.value;saveDuo();renderDevices()};
    const learning=learn&&learn.name===i.name;
    const lb=el('button','pbtn',learning?'Annulla':'Impara i pad');
    lb.onclick=()=>learning?stopLearn():startLearn(i.name);
    const name=el('b',null);name.textContent=i.name;
    row.append(name,sel,lb);
    const mapped=Object.keys(cfg.drumMap).length;
    const info=el('p','muted');
    info.textContent=learning?`Premi il pad per: ${DRUMS[learn.idx].emoji} ${DRUMS[learn.idx].name} (${learn.idx+1} di ${DRUMS.length})`
      :cfg.sound==='drums'?(mapped?`${mapped} pad imparati.`:'Nessun pad imparato: uso le note standard della batteria.'):'';
    box.append(row,info);
  });
  $('#pOuts').textContent=outs.length?'Il tempo va a: '+outs.map(o=>o.name).join(', '):'Nessuna uscita MIDI: il tempo non viene mandato.';
}
on('duo',renderDevices);

export function initParent(){
  const dlg=$('#parent'),gear=$('#gear');
  gear.onclick=()=>{if(saver)stopSave();else wiggle(gear)};
  holdButton(gear,1000,()=>{if(saver)return;renderDevices();dlg.showModal()});
  $('#pClose').onclick=()=>{stopLearn();dlg.close()};
  dlg.addEventListener('close',()=>stopLearn());

  const vol=$('#pVol');vol.value=Math.round(settings.maxVol*100);
  vol.oninput=()=>{settings.maxVol=vol.value/100;saveSettings();applyVolume()};

  $('#pWav').onclick=()=>{dlg.close();startSave()};
  $('#pExport').onclick=()=>exportProject();
  const file=$('#pFile'),msg=$('#pMsg');
  $('#pImport').onclick=()=>file.click();
  file.onchange=async()=>{
    const f=file.files[0];file.value='';if(!f)return;
    try{await importProject(f);msg.textContent='Canzone importata.';dlg.close()}
    catch(e){msg.textContent=e.message==='scaffale pieno'?'Lo scaffale è pieno: butta via una canzone e riprova.':'Questo file non è una canzone di Suonolandia.'}
  };

  const clock=$('#pClock'),nudge=$('#pNudge'),nv=$('#pNudgeVal');
  clock.checked=duo.clockOut;clock.onchange=()=>{duo.clockOut=clock.checked;saveDuo()};
  const showN=()=>nv.textContent=(duo.nudge>0?'+':'')+duo.nudge+' ms';
  nudge.value=duo.nudge;showN();
  nudge.oninput=()=>{duo.nudge=+nudge.value;saveDuo();showN()};
}
