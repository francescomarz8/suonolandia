// La griglia del ritmo, la riga della melodia (anche nella stanza Tastiera), dadi, pulisci, indietro.
import {$,el,state,rt,ROWS,DRUMS,SOLF,NOTE_COLORS,PENTA,persist,on,bounce,wiggle,holdButton} from './core.js';
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

function melCell(s,set){
  const c=el('button','cell mel'+(s&&s%4===0?' g':''));
  c.setAttribute('aria-label','Melodia '+(s+1));
  c.onclick=()=>{
    // ogni tocco cambia nota (solo note che stanno bene insieme), poi si spegne
    const cur=state.melody[s],i=PENTA.indexOf(cur);
    const next=cur==null?PENTA[0]:(i<0||i===PENTA.length-1)?null:PENTA[i+1];
    state.melody[s]=next;if(next!=null){rt.lastNote=next;blip(next)}
    paintMelody();persist();
  };
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
    rb.title=r.name+' — tieni premuto per svuotare la riga';rb.setAttribute('aria-label',r.name);
    holdButton(rb,800,()=>{
      snapshot();
      if(r.id==='mel')state.melody.fill(null);else state.pattern[r.id].fill(false);
      paintAll();persist();wiggle(rb);
    },()=>{
      if(r.id==='mel')blip(rt.lastNote);
      else if(r.id==='voice'&&!rt.activeClip)wiggle($('#rec'));
      else drum(r.id);
    });
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
  paintMelody();paintSleep();
}
function paintSleep(){
  ROWS.forEach(r=>{
    const z=!!state.sleep[r.id],h=$('#head-'+r.id);if(!h)return;
    h.classList.toggle('sleep',z);h.querySelector('.zz').setAttribute('aria-pressed',z);
    const cells=r.id==='mel'?melSets[0]||[]:document.querySelectorAll('#grid .cell[data-row="'+r.id+'"]');
    cells.forEach(c=>c.classList.toggle('asleep',z));
  });
}
export function showCursor(){
  $('#grid').classList.toggle('writing',rt.writeMode);$('#strip').classList.toggle('writing',rt.writeMode);
  melSets.forEach(set=>set.forEach((c,s)=>{
    const cur=rt.writeMode&&!rt.playing&&s===rt.cursor;c.classList.toggle('cursor',cur);
    if(state.melody[s]==null)c.textContent=cur?'✏️':'';
  }));
}
export const bounceMel=s=>melSets.forEach(set=>bounce(set[s]));

function setNow(s){
  if(now>=0&&cols[now])cols[now].forEach(c=>c.classList.remove('now'));
  now=s;if(s>=0&&cols[s])cols[s].forEach(c=>c.classList.add('now'));
}
on('step',s=>{setNow(s);if(s%2===0)bounce($('#mascot'))});
on('play',p=>{if(!p)setNow(-1);showCursor()});

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
// melodia a piccoli passi sulle note della Magia
function melBar(from){
  let i=from??Math.floor(Math.random()*PENTA.length);const a=[];
  for(let b=0;b<8;b++){
    if(b&&R(b%2?.45:.15)){a.push(null);continue}
    a.push(PENTA[i]);i=Math.max(0,Math.min(PENTA.length-1,i+pick([-1,-1,0,1,1,2,-2])));
  }
  return a;
}
// un ritmo intero nuovo; la seconda battuta riprende la prima con un piccolo finale diverso
function candidate(){
  const c={pattern:{},melody:[]},snare=drumBar('snare');
  DRUMS.forEach(d=>{
    const bar=d.id==='snare'?snare:drumBar(d.id,snare),two=bar.slice();
    if(d.id==='snare'&&R(.6))two[7]=true;
    if(d.id==='kick'&&R(.4))two[7]=!two[7];
    c.pattern[d.id]=bar.concat(two);
  });
  const m=melBar(),m2=m.slice(),tail=melBar(PENTA.indexOf(m.find(n=>n!=null)));
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
// dado piccolo: cambia poche celle, sempre verso un altro ritmo che suona bene.
// Toccato più volte di fila, cambia ogni volta un po' di più.
let warm=0,lastSmall=-1e9;
export function rollSmall(){
  const rows=awake();if(!rows.length){wiggle($('#diceS'));return}
  snapshot();
  const t=performance.now();warm=t-lastSmall<4000?Math.min(warm+1,5):0;lastSmall=t;
  let diffs=[];
  for(let tries=0;tries<4&&!diffs.length;tries++){
    const c=candidate();
    rows.forEach(r=>{for(let s=0;s<state.steps;s++){const v=getCell(c,r.id,s);if(v!==getCell(state,r.id,s))diffs.push([r.id,s,v])}});
  }
  for(let i=diffs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[diffs[i],diffs[j]]=[diffs[j],diffs[i]]}
  const changed=diffs.slice(0,2+warm*2);
  changed.forEach(([row,s,v])=>setCell(row,s,v));
  wiggle($('#diceS'));if(!rt.playing)drum('hat');
  afterRoll();
  // fa vedere quali celle sono cambiate
  changed.forEach(([row,s])=>{
    const c=row==='mel'?melSets[0]&&melSets[0][s]:document.querySelector('#grid .cell[data-row="'+row+'"][data-step="'+s+'"]');
    bounce(c);
  });
}
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
