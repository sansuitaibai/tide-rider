const notes=[0,3,7,10,12,15,19],roots=[45,41,48,43];
const hz=n=>440*2**((n-69)/12);
export class RideAudio{
 async toggle(){
  if(this.on){this.on=false;this.master.gain.setTargetAtTime(.0001,this.ctx.currentTime,.05);return false;}
  if(!this.ctx){
   this.ctx=new (window.AudioContext||window.webkitAudioContext)();const ctx=this.ctx;
   this.master=ctx.createGain();this.master.gain.value=.0001;this.master.connect(ctx.destination);
   const n=ctx.sampleRate*2;this.noise=ctx.createBuffer(1,n,ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<n;i++)data[i]=Math.random()*2-1;
   const ocean=ctx.createBufferSource();ocean.buffer=this.noise;ocean.loop=true;
   const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=480;
   this.wave=ctx.createGain();this.wave.gain.value=.065;ocean.connect(low);low.connect(this.wave);this.wave.connect(this.master);ocean.start();
   this.next=0;this.beat=0;
  }
  await this.ctx.resume();this.on=true;this.master.gain.setTargetAtTime(.56,this.ctx.currentTime,.08);return true;
 }
 tone(t,f,length,amp,type='sine',end=f){
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+length*.81);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+.014);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+length+.012);
 }
 tick(t,amp){const c=this.ctx,o=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();o.buffer=this.noise;f.type='highpass';f.frequency.value=6400;g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.0001,t+.052);o.connect(f);f.connect(g);g.connect(this.master);o.start(t,Math.random()*.8,.061);}
 update(time,cadence,paused){
  if(!this.on)return;
  const now=this.ctx.currentTime;
  this.wave.gain.setTargetAtTime(paused?.026:.055+.025*Math.sin(time*1.5)+.013*Math.sin(time*3.1),now,.08);
  if(paused){this.next=now+.06;return;}
  if(this.next<now)this.next=now+.025;
  while(this.next<now+.10){
   const t=this.next,b=this.beat++,root=roots[Math.floor(b/8)%4],k=b%8;
   if(k%2===0)this.tone(t,108,.20,.12,'sine',42);
   this.tick(t,k%2===0?.030:.060);
   if(k===0||k===3||k===6)this.tone(t,hz(root+(k===6?7:0)-12),.40,.095,'triangle');
   if(k!==4)this.tone(t,hz(root+12+notes[[0,2,4,2,3,5,4,1][k]]),.30,k%2?.041:.055,'sine');
   if(k===0){for(const n of [0,7,10])this.tone(t,hz(root+n),1.28,.022,'triangle');}
   this.next+=1/(Math.max(.85,cadence)*2);
  }
 }
 fx(kind){
  if(!this.on)return;const t=this.ctx.currentTime+.008;
  if(kind==='fish'){this.tone(t,560,.19,.12,'sine',770);this.tone(t+.085,840,.26,.10,'triangle',1040);}
  if(kind==='jump')this.tone(t,141,.31,.095,'sine',395);
  if(kind==='lane')this.tone(t,230,.12,.035,'sine',148);
  if(kind==='wheel')this.tone(t,320,.19,.036,'triangle',590);
  if(kind==='award')for(let i=0;i<3;i++)this.tone(t+.081*i,[523,659,784][i],.34,.052,'sine');
 }
}
