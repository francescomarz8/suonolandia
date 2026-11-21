// Il sequencer: fa partire i suoni a tempo e dice agli altri a che passo siamo.
import {state,rt,DRUMS,MAX_STEPS,emit} from './core.js';
import {A,drum,makeVoice,stopSeqVoices} from './audio.js';

export const stepDur=()=>60/state.bpm/2;
export const muteUntil=Array(MAX_STEPS).fill(0);
let step=0,nextTime=0,timer=null;
const visualQ=[];

function tick(){
  while(nextTime<A.ctx.currentTime+.12){
    const s=step%state.steps,t=nextTime;
    DRUMS.forEach(d=>{if(state.pattern[d.id][s])drum(d.id,t)});
    const n=state.melody[s];
    if(n!=null&&t>=muteUntil[s])makeVoice(n,.8,t,state.sound,true).stop(t+stepDur()*.9);
    visualQ.push({s,t});
    nextTime+=stepDur();step=(s+1)%state.steps;
  }
  emit('clock:pump',A.ctx.currentTime+.12);
}
export function togglePlay(){
  rt.playing=!rt.playing;
  if(rt.playing){A.ctx.resume();step=0;nextTime=A.ctx.currentTime+.06;emit('clock:start',nextTime);tick();timer=setInterval(tick,25)}
  else{clearInterval(timer);visualQ.length=0;rt.curStep=-1;stopSeqVoices();emit('clock:stop')}
  emit('play',rt.playing);
}
export function startFrames(){
  const frame=()=>{
    while(visualQ.length&&visualQ[0].t<=A.ctx.currentTime){
      const {s,t}=visualQ.shift();rt.curStep=s;rt.curStepTime=t;emit('step',s);
    }
    requestAnimationFrame(frame);
  };
  frame();
}
