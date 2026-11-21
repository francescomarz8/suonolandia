// Sorprese: pioggia di faccine, piccole fanfare e combinazioni segrete da scoprire giocando.
import {$,state,on,DRUMS,scaleNotes,bounce} from './core.js';
import {A,makeVoice,drum} from './audio.js';

const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// pioggia di faccine su tutto lo schermo (non blocca i tocchi)
export function burst(emojis,count=26){
  bounce($('#mascot'));
  if(calm())return;
  const box=document.createElement('div');box.className='confetti';box.setAttribute('aria-hidden','true');
  for(let i=0;i<count;i++){
    const s=document.createElement('span');s.textContent=emojis[i%emojis.length];
    s.style.left=Math.random()*100+'%';s.style.fontSize=28+Math.random()*30+'px';
    box.append(s);
    s.animate([{transform:'translateY(-12vh) rotate(0)',opacity:1},{transform:`translateY(112vh) rotate(${Math.random()*720-360}deg)`,opacity:.9}],
      {duration:1500+Math.random()*1300,delay:Math.random()*350,easing:'cubic-bezier(.3,.2,.6,1)',fill:'both'});
  }
  document.body.append(box);setTimeout(()=>box.remove(),3400);
}
// una scaletta di campanelle sulle note della canzone
export function chime(n=6,withClap){
  if(!A.ctx)return;
  const P=scaleNotes(),t=A.ctx.currentTime+.02;
  for(let i=0;i<Math.min(n,P.length);i++)makeVoice(P[i],.7,t+i*.07,'bell',true).stop(t+i*.07+.6);
  if(withClap)drum('clap',t+n*.07);
}

/* ---------- combinazioni segrete ---------- */
const COMBOS={
  // tutti i tamburi e anche la voce suonano almeno una volta
  band:{emojis:['🎉','🥁','🎺','⭐','🎊'],test:n=>DRUMS.every(d=>state.pattern[d.id].slice(0,n).some(Boolean))},
  // la riga della melodia tutta piena, con almeno cinque note diverse
  rainbow:{emojis:['🌈','✨','🦄','💖'],test:n=>{const m=state.melody.slice(0,n);return m.every(v=>v!=null)&&new Set(m).size>=5}},
  // una riga di tamburi piena da cima a fondo
  wall:{emojis:['🌟','💥','🤩'],test:n=>DRUMS.some(d=>state.pattern[d.id].slice(0,n).every(Boolean))},
};
const active=new Set();
let timer=null,lastParty=0,armed=false;
function check(celebrate){
  let fresh=null;
  for(const k in COMBOS){
    const ok=COMBOS[k].test(state.steps);
    if(ok&&!active.has(k)){active.add(k);fresh=fresh||k}
    if(!ok)active.delete(k);
  }
  if(fresh&&celebrate&&performance.now()-lastParty>6000){lastParty=performance.now();burst(COMBOS[fresh].emojis);chime(6,true)}
}
// alla partenza e quando si apre un'altra canzone: prende nota di cosa c'è già, senza festeggiare
export function armCombos(){active.clear();check(false);armed=true}
on('dirty',()=>{if(!armed)return;clearTimeout(timer);timer=setTimeout(()=>check(true),300)});
on('project',()=>{armed=false;setTimeout(armCombos,600)});
