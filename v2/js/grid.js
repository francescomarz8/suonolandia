// La griglia del ritmo, la riga della melodia (anche nella stanza Tastiera), dadi, Ascolta, pulisci, indietro.
import {$,el,state,rt,ROWS,DRUMS,SOLF,NOTE_COLORS,PENTA_STEPS,scaleNotes,persist,on,emit,bounce,wiggle,holdButton} from './core.js';
import {A,drum,blip} from './audio.js';
import {togglePlay} from './seq.js';

let cols=[],melSets=[],now=-1;
const undoStack=[];

// "Indietro" ricorda più passi: ogni tiro di dado, ogni pulizia.
export function snapshot(){
  undoStack.push(JSON.stringify({p:state.pattern,m:state.melody,n:state.steps}));
  if(undoStack.length>30)undoStack.shift();
  $('#undo').disabled=false;
}
export function undo(){
  const j=undoStack.pop();if(!j)return;const s=JSON.parse(j);
  $('#undo').disabled=!undoStack.length;
  state.pattern=s.p;state.melody=s.m;
  if(s.n!==state.steps){state.steps=s.n;buildGrid();paintSteps()}else paintAll();
  persist();
}
export function clearUndo(){undoStack.length=0;$('#undo').disabled=true}

/* ---------- melodia: tocca per cambiare nota, trascina per disegnarla ---------- */
let paint=null,paintEnded=0;
function paintMove(e){
  if(!paint)return;
  if(!paint.moved){
    if(Math.hypot(e.clientX-paint.x,e.clientY-paint.y)<10)return;
    paint.moved=true;snapshot();
  }
  let s=-1;
  for(let k=0;k<paint.set.length;k++){const r=paint.set[k].getBoundingClientRect();if(e.clientX>=r.left-4&&e.clientX<=r.right+4){s=k;break}}
  if(s<0)return;
  // dito in su = nota più alta, sempre sulle note della canzone
  const P=scaleNotes(),n=P[Math.max(0,Math.min(P.length-1,paint.i+Math.round((paint.y-e.clientY)/16)))];
  if(state.melody[s]!==n){state.melody[s]=n;rt.lastNote=n;blip(n);paintMelody()}
}
function paintEnd(){
  if(paint&&paint.moved){paintEnded=performance.now();persist()}
  paint=null;
}
function melCell(s,set){
  const c=el('button','cell mel'+(s&&s%4===0?' g':''));
  c.setAttribute('aria-label','Melodia '+(s+1));
  c.onclick=()=>{
    if(performance.now()-paintEnded<300)return; // era un disegno, non un tocco
    // ogni tocco sale di una nota (solo note che stanno bene insieme), poi si spegne
    const P=scaleNotes(),cur=state.melody[s],i=P.indexOf(cur);
    const next=cur==null?P[0]:(i<0||i===P.length-1)?null:P[i+1];
    state.melody[s]=next;if(next!=null){rt.lastNote=next;blip(next)}
    paintMelody();persist();
  };
  c.addEventListener('pointerdown',e=>{
    if(e.button>0)return;
    const P=scaleNotes(),base=state.melody[s]??rt.lastNote;
    let i=P.indexOf(base);if(i<0)i=P.reduce((b,n,k)=>Math.abs(n-base)<Math.abs(P[b]-base)?k:b,0);
    paint={x:e.clientX,y:e.clientY,i,set,moved:false};
    try{c.setPointerCapture(e.pointerId)}catch(err){}
  });
  c.addEventListener('pointermove',paintMove);
  c.addEventListener('pointerup',paintEnd);c.addEventListener('pointercancel',paintEnd);
  set.push(c);cols[s].push(c);return c;
}

export function buildGrid(){
  const n=state.steps,grid=$('#grid'),strip=$('#strip');
  grid.innerHTML='';strip.innerHTML='';melSets=[];now=-1;cols=Array.from({length:n},()=>[]);
  grid.style.gridTemplateColumns=`54px repeat(${n},minmax(0,1fr))`;
  strip.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;
  grid.classList.toggle('long',n>8);strip.classList.toggle('long',n>8);
  ROWS.forEach((r,ri)=>{
    const rb=el('button','rowbtn','<span class="face">'+r.emoji+'</span>'+(ri?'<kbd>'+ri+'</kbd>':''));
    rb.id='row-'+r.id;rb.style.setProperty('--c',r.color);
    rb.title=r.name+(ri?' — trascina su o giù per farlo più acuto o più grave;':' —')+' tieni premuto per svuotare la riga';
    rb.setAttribute('aria-label',r.name);
    holdButton(rb,800,()=>{
      if(rb._drag)return; // stava cambiando l'altezza, non svuotando
      snapshot();
      if(r.id==='mel')state.melody.fill(null);else state.pattern[r.id].fill(false);
      paintAll();persist();wiggle(rb);
    },()=>{
      if(r.id==='mel')blip(rt.lastNote);
      else if(r.id==='voice'&&!rt.activeClip)wiggle($('#rec'));
      else drum(r.id);
    });
    if(ri){ // trascina l'animale: su = piccolo e acuto, giù = grande e grave
      let y0=null,p0=0;
      rb.addEventListener('pointerdown',e=>{y0=e.clientY;p0=state.pitch[r.id]||0;rb._drag=false;try{rb.setPointerCapture(e.pointerId)}catch(err){}});
      rb.addEventListener('pointermove',e=>{
        if(y0==null)return;
        const p=Math.max(-4,Math.min(4,p0+Math.round((y0-e.clientY)/14)));
        if(p===(state.pitch[r.id]||0))return;
        rb._drag=true;rb.classList.remove('holding');
        if(p)state.pitch[r.id]=p;else delete state.pitch[r.id];
        paintPitch();drum(r.id);persist();
      });
      ['pointerup','pointercancel'].forEach(ev=>rb.addEventListener(ev,()=>{y0=null}));
    }
    const head=el('div','rowhead');head.id='head-'+r.id;
    const zz=el('button','zz','💤');zz.title='Dormi: i dadi non cambiano questa riga';
    zz.setAttribute('aria-label',r.name+': dormi (i dadi non la cambiano)');
    zz.onclick=()=>{if(state.sleep[r.id])delete state.sleep[r.id];else state.sleep[r.id]=true;paintSleep();persist()};
    head.append(rb,zz);grid.append(head);
    if(r.id==='mel'){const set=[];melSets.push(set);for(let s=0;s<n;s++){const c=melCell(s,set);c.style.setProperty('--c',r.color);grid.append(c)}return}
    for(let s=0;s<n;s++){
      const c=el('button','cell'+(s&&s%4===0?' g':''));c.style.setProperty('--c',r.color);
      c.setAttribute('aria-label',r.name+' '+(s+1));c.dataset.row=r.id;c.dataset.step=s;
      c.onclick=()=>{
        if(r.id==='voice'&&!rt.activeClip){wiggle($('#rec'));return}
        const v=state.pattern[r.id][s]=!state.pattern[r.id][s];
        c.classList.toggle('on',v);c.setAttribute('aria-pressed',v);
        if(v)drum(r.id);persist();
      };
      cols[s].push(c);grid.append(c);
    }
  });
  const set=[];melSets.push(set);for(let s=0;s<n;s++)strip.append(melCell(s,set));
  paintAll();
}

export function paintMelody(){
  melSets.forEach(set=>set.forEach((c,s)=>{
    const n=state.melody[s];
    c.classList.toggle('on',n!=null);c.setAttribute('aria-pressed',n!=null);
    c.style.setProperty('--c',n!=null?NOTE_COLORS[n%12]:ROWS[0].color);
    c.textContent=n!=null?SOLF[n%12]:'';
  }));
  showCursor();
}
export function paintAll(){
  document.querySelectorAll('.cell[data-row]').forEach(c=>{
    const v=state.pattern[c.dataset.row][+c.dataset.step];c.classList.toggle('on',v);c.setAttribute('aria-pressed',v)});
  paintMelody();paintSleep();paintPitch();
}
function paintSleep(){
  ROWS.forEach(r=>{
    const z=!!state.sleep[r.id],h=$('#head-'+r.id);if(!h)return;
    h.classList.toggle('sleep',z);h.querySelector('.zz').setAttribute('aria-pressed',z);
    const cells=r.id==='mel'?melSets[0]||[]:document.querySelectorAll('#grid .cell[data-row="'+r.id+'"]');
    cells.forEach(c=>c.classList.toggle('asleep',z));
  });
}
// l'animale diventa più piccolo se il tamburo è acuto, più grande se è grave
function paintPitch(){
  DRUMS.forEach(d=>{const f=$('#row-'+d.id+' .face');if(f)f.style.transform='scale('+(1-(state.pitch[d.id]||0)*.1)+')'});
}
export function showCursor(){
  $('#grid').classList.toggle('writing',rt.writeMode);$('#strip').classList.toggle('writing',rt.writeMode);
  melSets.forEach(set=>set.forEach((c,s)=>{
    const cur=rt.writeMode&&!rt.playing&&s===rt.cursor;c.classList.toggle('cursor',cur);
    if(state.melody[s]==null)c.textContent=cur?'✏️':'';
  }));
}
export const bounceMel=s=>melSets.forEach(set=>bounce(set[s]));
const cellEl=(row,s)=>row==='mel'?melSets[0]&&melSets[0][s]:document.querySelector('#grid .cell[data-row="'+row+'"][data-step="'+s+'"]');

function setNow(s){
  if(now>=0&&cols[now])cols[now].forEach(c=>c.classList.remove('now'));
  now=s;if(s>=0&&cols[s])cols[s].forEach(c=>c.classList.add('now'));
}
on('step',s=>{setNow(s);if(s%2===0)bounce($('#mascot'))});
on('play',p=>{if(!p)setNow(-1);showCursor()});

/* ---------- la tonalità la sceglie la canzone, non il bambino ---------- */
// Cerca le cinque note che contengono più note della melodia. Cambia solo a inizio giro o da fermi.
export function rekey(){
  const notes=state.melody.slice(0,state.steps).filter(n=>n!=null);if(!notes.length)return;
  const score=r=>notes.filter(n=>PENTA_STEPS.includes(((n-r)%12+12)%12)).length;
  let best=state.root,top=score(best);
  for(let r=0;r<12;r++){const sc=score(r);if(sc>top){top=sc;best=r}}
  if(best!==state.root){state.root=best;persist();emit('key')}
}
on('step',s=>{if(s===0)rekey()});
on('dirty',()=>{if(!rt.playing)rekey()});

/* ---------- dadi: tiri musicali, mai celle a caso ---------- */
const R=p=>Math.random()<p,pick=a=>a[Math.floor(Math.random()*a.length)];
const HATS=[()=>true,b=>b%2===1,b=>b%2===0,b=>b%4!==0,b=>b%4!==1];
// una battuta (8 passi) per una riga di batteria
function drumBar(id,snare){
  const a=Array(8).fill(false);
  switch(id){
    case 'kick': a[0]=a[4]=true;if(R(.35))a[pick([3,5,7])]=true;break;          // sul battere, ogni tanto uno in più
    case 'snare':a[2]=R(.9);a[6]=R(.9);if(R(.15))a[pick([5,7])]=true;break;      // sul 2 e sul 4, rara nota fantasma
    case 'clap': a[2]=!snare[2];a[6]=!snare[6];if(snare[2]&&snare[6]&&R(.3))a[6]=true;break;
    case 'hat':  {const f=pick(HATS);for(let b=0;b<8;b++)a[b]=f(b)&&R(.93);break}  // distribuiti in modo regolare
    case 'boing':if(R(.5))a[pick([1,3,5,7])]=true;break;
    case 'voice':if(rt.activeClip){a[0]=true;if(R(.4))a[4]=true}break;             // la voce sui battiti forti
  }
  return a;
}
// melodia a piccoli passi sulle note della canzone
function melBar(P,from){
  let i=from>=0?from:Math.floor(Math.random()*P.length);const a=[];
  for(let b=0;b<8;b++){
    if(b&&R(b%2?.45:.15)){a.push(null);continue}
    a.push(P[i]);i=Math.max(0,Math.min(P.length-1,i+pick([-1,-1,0,1,1,2,-2])));
  }
  return a;
}
// un ritmo intero nuovo; la seconda battuta riprende la prima con un piccolo finale diverso
function candidate(){
  const c={pattern:{},melody:[]},snare=drumBar('snare'),P=scaleNotes();
  DRUMS.forEach(d=>{
    const bar=d.id==='snare'?snare:drumBar(d.id,snare),two=bar.slice();
    if(d.id==='snare'&&R(.6))two[7]=true;
    if(d.id==='kick'&&R(.4))two[7]=!two[7];
    c.pattern[d.id]=bar.concat(two);
  });
  const m=melBar(P,-1),m2=m.slice(),tail=melBar(P,P.indexOf(m.find(n=>n!=null)));
  for(let b=5;b<8;b++)m2[b]=tail[b];
  c.melody=m.concat(m2);
  return c;
}
const awake=()=>ROWS.filter(r=>!state.sleep[r.id]);
const getCell=(src,row,s)=>row==='mel'?src.melody[s]:src.pattern[row][s];
function setCell(row,s,v){if(row==='mel')state.melody[s]=v;else state.pattern[row][s]=v}
function afterRoll(){paintAll();persist();if(!rt.playing)setTimeout(()=>{if(!rt.playing)togglePlay()},330)}

// dado grande: tutto nuovo (tranne le righe che dormono)
export function rollBig(){
  snapshot();const c=candidate();
  awake().forEach(r=>{for(let s=0;s<state.steps;s++)setCell(r.id,s,getCell(c,r.id,s))});
  const b=$('#diceB');
  b.animate([{transform:'rotate(0) scale(1)'},{transform:'rotate(-25deg) scale(1.2)'},{transform:'rotate(20deg) scale(1.25)'},
    {transform:'rotate(-12deg) scale(1.15)'},{transform:'rotate(360deg) scale(1)'}],{duration:420,easing:'ease-out'});
  if(!rt.playing){const t=A.ctx.currentTime+.01;drum('snare',t);drum('snare',t+.09);drum('snare',t+.18);drum('kick',t+.27);drum('clap',t+.27)}
  warm=0;afterRoll();
}
// cambia `n` celle, sempre verso un altro ritmo che suona bene
function mutate(n){
  const rows=awake();if(!rows.length)return [];
  let diffs=[];
  for(let tries=0;tries<4&&!diffs.length;tries++){
    const c=candidate();
    rows.forEach(r=>{for(let s=0;s<state.steps;s++){const v=getCell(c,r.id,s);if(v!==getCell(state,r.id,s))diffs.push([r.id,s,v])}});
  }
  for(let i=diffs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[diffs[i],diffs[j]]=[diffs[j],diffs[i]]}
  const changed=diffs.slice(0,n);
  changed.forEach(([row,s,v])=>setCell(row,s,v));
  return changed;
}
// dado piccolo: cambia poche celle. Toccato più volte di fila, cambia ogni volta un po' di più.
let warm=0,lastSmall=-1e9;
export function rollSmall(){
  if(!awake().length){wiggle($('#diceS'));return}
  snapshot();
  const t=performance.now();warm=t-lastSmall<4000?Math.min(warm+1,5):0;lastSmall=t;
  const changed=mutate(2+warm*2);
  wiggle($('#diceS'));if(!rt.playing)drum('hat');
  afterRoll();
  changed.forEach(([row,s])=>bounce(cellEl(row,s))); // fa vedere quali celle sono cambiate
}

/* ---------- Ascolta: la canzone continua a cambiare da sola ---------- */
let listening=false,loops=0;
export function setListen(v){
  if(v===listening)return;listening=v;
  const b=$('#listen');b.classList.toggle('sel',v);b.setAttribute('aria-pressed',v);
  if(v){snapshot();loops=0;if(!rt.playing)togglePlay()} // un solo "Indietro" riporta alla canzone di prima
}
export const isListening=()=>listening;
on('step',s=>{
  if(s!==0||!listening)return;
  if(++loops%(state.steps===16?2:4))return;
  const changed=mutate(3);paintAll();persist();changed.forEach(([row,st])=>bounce(cellEl(row,st)));
});
on('play',p=>{if(!p)setListen(false)});

export function clearAll(){
  snapshot();
  DRUMS.forEach(d=>state.pattern[d.id].fill(false));state.melody.fill(null);rt.cursor=0;
  paintAll();persist();wiggle($('#undo'));
}
// 8 passi (corto) o 16 passi (lungo). Allungando la prima volta, la seconda metà copia la prima.
export function setSteps(n){
  if(n===state.steps)return;
  snapshot();
  if(n===16){
    const empty=state.melody.slice(8).every(v=>v==null)&&DRUMS.every(d=>state.pattern[d.id].slice(8).every(v=>!v));
    if(empty)for(let s=0;s<8;s++){state.melody[s+8]=state.melody[s];DRUMS.forEach(d=>state.pattern[d.id][s+8]=state.pattern[d.id][s])}
  }
  state.steps=n;rt.cursor=0;buildGrid();persist();paintSteps();
}
export function paintSteps(){
  const b=$('#steps');b.innerHTML=(state.steps===16?'🐍':'🐛')+'<small>'+(state.steps===16?'Lungo':'Corto')+'</small>';
  b.setAttribute('aria-label',state.steps===16?'Canzone lunga: tocca per accorciare':'Canzone corta: tocca per allungare');
}
