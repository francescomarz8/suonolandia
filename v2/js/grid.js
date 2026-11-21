// La griglia del ritmo, la riga della melodia (anche nella stanza Tastiera), dadi, pulisci, indietro.
import {$,el,state,rt,ROWS,DRUMS,SOLF,NOTE_COLORS,PENTA,persist,on,bounce,wiggle,holdButton} from './core.js';
import {drum,blip} from './audio.js';
import {togglePlay} from './seq.js';

let cols=[],melSets=[],now=-1,undoSnap=null;

export function snapshot(){undoSnap=JSON.stringify({p:state.pattern,m:state.melody,n:state.steps});$('#undo').disabled=false}
export function undo(){
  if(!undoSnap)return;const s=JSON.parse(undoSnap);undoSnap=null;$('#undo').disabled=true;
  state.pattern=s.p;state.melody=s.m;
  if(s.n!==state.steps){state.steps=s.n;buildGrid()}else paintAll();
  persist();
}

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
    grid.append(rb);
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
  paintMelody();
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

export function surprise(){
  snapshot();
  const P=state.pattern,r=p=>Math.random()<p;
  for(let s=0;s<state.steps;s++){
    const b=s%8;
    P.kick[s]=b%4===0||(b!==2&&b!==6&&r(.2));
    P.snare[s]=(b===2||b===6)&&r(.75);
    P.clap[s]=(b===2||b===6)?!P.snare[s]&&r(.7):r(.08);
    P.hat[s]=r(.55);
    P.boing[s]=r(.12);
    state.melody[s]=r(s%2===0?.75:.4)?PENTA[Math.floor(Math.random()*PENTA.length)]:null;
  }
  paintAll();persist();wiggle($('#dice'));if(!rt.playing)togglePlay();
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
