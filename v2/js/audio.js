// Motore sonoro: sintetizzatori, batteria, voce registrata.
import {rt,state,MAX_VOICES} from './core.js';

export const A={ctx:null,master:null,synthBus:null,echoSend:null,saveDest:null,noiseBuf:null};
const live=[];
let seqVoice=null,lastF=0,lastT=-9;

export function initAudio(){
  const ctx=A.ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  const lim=ctx.createDynamicsCompressor();
  lim.threshold.value=-12;lim.knee.value=6;lim.ratio.value=14;lim.attack.value=.003;lim.release.value=.15;
  A.master=ctx.createGain();A.master.gain.value=rt.muted?0:.7;A.master.connect(lim);lim.connect(ctx.destination);
  A.saveDest=ctx.createMediaStreamDestination();lim.connect(A.saveDest);
  A.synthBus=ctx.createGain();A.synthBus.connect(A.master);
  const delay=ctx.createDelay(1);delay.delayTime.value=.3;
  const fb=ctx.createGain();fb.gain.value=.3;
  const damp=ctx.createBiquadFilter();damp.type='lowpass';damp.frequency.value=2500;
  A.echoSend=ctx.createGain();A.echoSend.gain.value=0;
  A.synthBus.connect(A.echoSend);A.echoSend.connect(delay);delay.connect(damp);damp.connect(fb);fb.connect(delay);damp.connect(A.master);
  A.noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
  const d=A.noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const wake=()=>{if(ctx.state!=='running'&&!document.hidden)ctx.resume().catch(()=>{})};
  document.addEventListener('visibilitychange',wake);addEventListener('pointerdown',wake);addEventListener('keydown',wake);
}
const hold=(p,t)=>p.cancelAndHoldAtTime?p.cancelAndHoldAtTime(t):p.cancelScheduledValues(t);

export function makeVoice(midi,vel,t,soundId,seq){
  const ctx=A.ctx;
  if(soundId==='voice'&&!rt.activeClip)soundId='piano';
  const f=440*2**((midi-69)/12),peak=.3*vel;
  const g=ctx.createGain();g.connect(A.synthBus);g.gain.setValueAtTime(0,t);
  const nodes=[];let rel=.15;
  // Scivolo: la nota parte dall'altezza di quella prima e scivola fin qui
  const glide=state.slide&&soundId!=='bird'&&lastF&&t-lastT<1.5?lastF/f:1;lastF=f;lastT=t;
  const osc=(type,freq,dest,gain)=>{
    const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq*glide,t);
    if(glide!==1)o.frequency.exponentialRampToValueAtTime(freq,t+.14);
    if(gain!=null){const og=ctx.createGain();og.gain.value=gain;o.connect(og);og.connect(dest)}else o.connect(dest);
    o.start(t);nodes.push(o);return o};
  switch(soundId){
    case 'piano':
      osc('triangle',f,g);osc('sine',f*2,g,.3);osc('sine',f*3,g,.08);
      g.gain.linearRampToValueAtTime(peak,t+.006);
      g.gain.exponentialRampToValueAtTime(peak*.35,t+.35);
      g.gain.exponentialRampToValueAtTime(.001,t+2.2);rel=.2;break;
    case 'robot':{
      const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=4;
      lp.frequency.setValueAtTime(Math.min(f*5,5000),t);lp.frequency.exponentialRampToValueAtTime(f*1.4,t+.28);lp.connect(g);
      osc('sawtooth',f,lp);osc('square',f/2,lp,.5);
      g.gain.linearRampToValueAtTime(peak*.5,t+.01);rel=.07;break}
    case 'bell':
      osc('sine',f,g);osc('sine',f*2.76,g,.4);osc('sine',f*5.4,g,.15);
      g.gain.linearRampToValueAtTime(peak,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+1.8);rel=.6;break;
    case 'bird':{
      const o=osc('sine',f*1.5,g);o.frequency.exponentialRampToValueAtTime(f*2,t+.09);
      const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=7;lg.gain.value=f*.05;
      lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);nodes.push(lfo);
      g.gain.linearRampToValueAtTime(peak*.7,t+.03);rel=.1;break}
    case 'voice':{
      const src=ctx.createBufferSource();src.buffer=clipBuffer(rt.activeClip);
      const rate=clipRate(rt.activeClip)*2**((midi-60)/12);
      src.playbackRate.setValueAtTime(rate*glide,t);if(glide!==1)src.playbackRate.exponentialRampToValueAtTime(rate,t+.14);
      src.connect(g);src.start(t);nodes.push(src);
      g.gain.setValueAtTime(vel*.8,t);rel=.08;break}
  }
  const v={seq,stop(when){
    const i=live.indexOf(v);if(i<0)return;live.splice(i,1);
    const s=Math.max(when,ctx.currentTime);
    hold(g.gain,s);g.gain.setTargetAtTime(0,s,rel/3);
    nodes.forEach(n=>{try{n.stop(s+rel*2+.05)}catch(e){}});
  }};
  live.push(v);if(live.length>MAX_VOICES)live[0].stop(ctx.currentTime);
  return v;
}
export const blip=(n,id)=>makeVoice(n,.8,A.ctx.currentTime,id||state.sound,true).stop(A.ctx.currentTime+.3);
// ferma quello che ha fatto partire il sequencer (non le note tenute con le dita)
export function stopSeqVoices(){
  live.filter(v=>v.seq).forEach(v=>v.stop(A.ctx.currentTime));
  if(seqVoice){try{seqVoice.stop()}catch(e){}}
}

function noise(t,dur,filterType,freq,q,gainVal){
  const ctx=A.ctx,src=ctx.createBufferSource();src.buffer=A.noiseBuf;
  const fl=ctx.createBiquadFilter();fl.type=filterType;fl.frequency.value=freq;fl.Q.value=q;
  const g=ctx.createGain();g.gain.setValueAtTime(gainVal,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(fl);fl.connect(g);g.connect(A.master);src.start(t,Math.random()*.5);src.stop(t+dur+.02);return g;
}
function tone(t,type,f0,f1,sweep,dur,gainVal){
  const ctx=A.ctx,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+sweep);
  g.gain.setValueAtTime(gainVal,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(A.master);o.start(t);o.stop(t+dur+.02);
}
export function drum(id,t){
  t=t||A.ctx.currentTime;
  const k=2**((state.pitch[id]||0)/6); // ogni scatto vale un tono: su = acuto, giù = grave
  switch(id){
    case 'kick': tone(t,'sine',160*k,45*k,.12,.38,.95);break;
    case 'snare':noise(t,.2,'highpass',1200*k,.7,.5);tone(t,'triangle',220*k,130*k,.08,.12,.4);break;
    case 'hat':  noise(t,.06,'highpass',Math.min(12000,7000*k),.7,.28);break;
    case 'clap':{const g=noise(t,.24,'bandpass',1500*k,1.2,.7);
      g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.15,t+.011);
      g.gain.setValueAtTime(.7,t+.012);g.gain.exponentialRampToValueAtTime(.15,t+.023);
      g.gain.setValueAtTime(.7,t+.024);g.gain.exponentialRampToValueAtTime(.001,t+.24);break}
    case 'boing':tone(t,'triangle',170*k,560*k,.2,.32,.5);break;
    case 'voice':
      if(!rt.activeClip)return;
      if(seqVoice){try{seqVoice.stop(t)}catch(e){}}
      seqVoice=playClipAt(rt.activeClip,t,k);try{seqVoice.stop(t+3)}catch(e){}break;
  }
}

/* ---------- voce registrata ---------- */
export const clipRate=c=>({topo:1.6,orso:.65}[c.fx]||1);
export function clipBuffer(c){
  if(c.fx!=='rev')return c.buf;
  if(!c.rev){
    c.rev=A.ctx.createBuffer(1,c.buf.length,c.buf.sampleRate);
    const a=c.buf.getChannelData(0),b=c.rev.getChannelData(0);
    for(let i=0,n=a.length;i<n;i++)b[i]=a[n-1-i];
  }
  return c.rev;
}
export function playClipAt(c,t,k=1){
  const ctx=A.ctx,src=ctx.createBufferSource();src.buffer=clipBuffer(c);src.playbackRate.value=clipRate(c)*k;
  const g=ctx.createGain();g.gain.value=.75;src.connect(g);g.connect(A.master);src.start(t);return src;
}
export function trimAndNormalize(buf){
  const d=buf.getChannelData(0),sr=buf.sampleRate;let peak=0,a=-1,b=-1;
  for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>peak)peak=v}
  if(peak<.01)return null;
  const th=Math.max(.02,peak*.08);
  for(let i=0;i<d.length;i++)if(Math.abs(d[i])>th){a=i;break}
  for(let i=d.length-1;i>=0;i--)if(Math.abs(d[i])>th){b=i;break}
  a=Math.max(0,a-Math.floor(sr*.02));b=Math.min(d.length,b+Math.floor(sr*.12));
  const out=A.ctx.createBuffer(1,Math.max(1,b-a),sr),o=out.getChannelData(0),k=.9/peak;
  for(let i=0;i<o.length;i++)o[i]=d[a+i]*k;
  const fade=Math.min(o.length,Math.floor(sr*.01));
  for(let i=0;i<fade;i++){o[i]*=i/fade;o[o.length-1-i]*=i/fade}
  return out;
}
export function wavBlob(buf){
  const ch=Math.min(2,buf.numberOfChannels),n=buf.length,sr=buf.sampleRate,v=new DataView(new ArrayBuffer(44+n*ch*2));
  const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF');v.setUint32(4,36+n*ch*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);
  v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);
  w(36,'data');v.setUint32(40,n*ch*2,true);
  const d=[];for(let c=0;c<ch;c++)d.push(buf.getChannelData(c));
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){v.setInt16(o,Math.max(-1,Math.min(1,d[c][i]))*32767,true);o+=2}
  return new Blob([v],{type:'audio/wav'});
}
