import * as T from 'three';
import {Coast,ball,clamp,hash,heading,mix,paint,roadX,roadY,sin,cos} from './coast.js';
import {Rider,fishModel} from './rider.js';
import {RideAudio} from './audio.js';

const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0');
const I=/* ICONS */{};
const icon=n=>I[n]||'';
const setIcon=(e,n)=>{e.dataset.icon=n;e.innerHTML=icon(n);};
document.querySelectorAll('[data-icon]').forEach(e=>setIcon(e,e.dataset.icon));
const cams=[['跟随','video'],['侧面','panels-top-left'],['俯瞰','drone'],['电影运镜','clapperboard'],['鹈鹕视角','eye']];
const clockStops=[[0,1090],[.14,1185],[.26,1270],[.53,1602],[.67,1750],[.85,1880],[.956,2502],[1,2530]];
const badges=[
 ['first','初次开张','抓到第 1 条鱼','fish'],['five','满载而归','累计抓到 5 条鱼','fish'],['fifteen','潮汐渔手','累计抓到 15 条鱼','fish'],
 ['air','腾空收网','跳跃时抓到鱼','arrow-up'],['trick','抬轮取鱼','抬起前轮时抓到鱼','bike'],['balance','平衡大师','保持抬轮 3 秒','timer'],
 ['fast','海岸疾风','速度达到 50 km/h','zap'],['km','一公里','单次骑行 1 公里','route'],['long','沿海远征','单次骑行 3 公里','map-pin'],
 ['night','月下渔获','在星空下抓到鱼','moon'],['allcams','五种视角','体验全部 5 种镜头','video'],['autofish','巡航渔手','自动驾驶时抓到鱼','navigation'],
 ['streak','连中三元','连续抓到 3 条鱼','flame'],['special','金色鳞片','抓到一条金色的鱼','sparkles']
];
const stage=$('stage'), canvas=$('game'), dialog=$('achievement-dialog'), audio=new RideAudio();
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});}
catch{ $('unavailable').hidden=false; }
if(renderer)run();

function run(){
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(48,1,.075,625);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
 const coast=new Coast(scene), rider=new Rider(scene);
 const bill=new T.Group();scene.add(camera);camera.add(bill);
 ball(bill,paint('#d68d4d'),0,-.283,-.35,.110,.045,.285).rotation.x=-.28;
 ball(bill,paint('#f9b363'),0,-.247,-.39,.120,.032,.315).rotation.x=-.28;
 ball(bill,paint('#a9694e'),0,-.170,-.681,.051,.024,.034);
 const store='tide-rider-1';let earned=new Set();
 try{const a=JSON.parse(localStorage.getItem(store)||'[]');if(Array.isArray(a))earned=new Set(a.filter(k=>badges.some(b=>b[0]===k)));}catch{}
 const lanes=[-3.25,0,3.25], fishArr=[], seen=new Set([0]), keys=new Set(), btns=new Map();
 const target=new T.Vector3(),focus=new T.Vector3(),look=new T.Vector3(),desired=new T.Vector3(),offset=new T.Vector3();
 let cam=0,cameraTime=0,elapsed=0,cycle=.028,night=false,phaseLabel='',phaseIcon='',nudge=0,scrub=false;
 let s=8,lane=1,side=0,lastSide=0,speed=8.9,distance=0,jump=0,vy=0,lean=0,wheel=0,hold=0,wheelTime=0;
 let idle=12,auto=true,autoAllowed=true,paused=false,fishTotal=0,streak=0,spawnID=0,spawnNext=23,lastUI=-1,quality=2;
 let fps=60,performanceTime=0,samples=0,frameTime=0,adjustedAt=0,first=true;
 function toast(name,type){const e=document.createElement('div');e.className='toast';e.innerHTML=`<span data-icon="${type}">${icon(type)}</span>`;e.append(document.createTextNode(name));$('notices').append(e);if($('notices').children.length>4)$('notices').firstElementChild.remove();setTimeout(()=>e.remove(),2750);}
 function updateBadges(){
  $('ach-count').textContent=`${earned.size}/14`;$('ach-total').textContent=`${earned.size} / 14 已解锁`;
  $('achievement-list').innerHTML=badges.map(([k,title,desc,i])=>`<div class="badge ${earned.has(k)?'earned':''}"><span data-icon="${i}">${icon(earned.has(k)?i:'lock')}</span><div><strong>${title}</strong><small>${desc}</small></div></div>`).join('');
 }
 function grant(k){if(earned.has(k))return;const b=badges.find(b=>b[0]===k);earned.add(k);try{localStorage.setItem(store,JSON.stringify([...earned]));}catch{}updateBadges();toast(b[1],'trophy');audio.fx('award');}
 function resize(){
  const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  const base=Math.min(devicePixelRatio||1,1.65),ratio=quality===2?base:quality===1?Math.max(.78,base*.74):Math.max(.54,base*.52);
  renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.80?55:48;camera.updateProjectionMatrix();
 }
 new ResizeObserver(resize).observe(stage);resize();
 function addFish(pos){
  const i=spawnID++;const fl=[1,2,0,1,0,2][i%6];const l=i<6?fl:Math.floor(hash(i*4.79)*3);
  const type=i%7===5?2:i%3===1?1:0, aerial=i%5===3;
  fishArr.push({s:pos,l,type,aerial,i,...fishModel(scene,type)});
 }
 function phase(){
  if(cycle<.14||cycle>=.956)return ['黄昏','sunset'];
  if(cycle<.26)return ['暮光','sunset'];
  if(cycle<.67)return ['星空','moon'];
  if(cycle<.85)return ['黎明','sunrise'];
  return ['晨光','sun'];
 }
 function updateUI(){
  const kmh=Math.round(speed*3.6);$('speed').textContent=pad(kmh);$('speed-bar').style.width=`${clamp(kmh/64,0,1)*100}%`;
  $('fish').textContent=pad(fishTotal);$('fish').classList.toggle('three-digits',fishTotal>99);$('fish').classList.toggle('four-digits',fishTotal>999);
  $('streak').textContent=`连抓 ${pad(streak)}`;$('distance').textContent=`${(distance/1000).toFixed(2)} km`;
  const stop=clockStops.findIndex((p,i)=>i>0&&cycle<=p[0]),[t1,m1]=clockStops[stop-1],[t2,m2]=clockStops[stop];
  const m=Math.floor(mix(m1,m2,(cycle-t1)/(t2-t1)))%1440;$('clock').textContent=`${pad(Math.floor(m/60))}:${pad(m%60)}`;
  if(!scrub)$('time').value=Math.floor(cycle*999);
  const [label,ic]=phase();night=label==='星空';
  if(phaseLabel!==label){phaseLabel=label;$('phase').textContent=label;}
  if(phaseIcon!==ic){phaseIcon=ic;setIcon($('time-icon'),ic);}
  $('auto').classList.toggle('active',auto);$('auto').setAttribute('aria-pressed',String(auto));$('auto-label').textContent=auto?'自动驾驶':'手动驾驶';
 }
 function selectCamera(i){
  cam=i;seen.add(i);cameraTime=0;$('camera-num').textContent=pad(i+1);$('camera-name').textContent=cams[i][0];setIcon(document.querySelector('.camera-icon'),cams[i][1]);
  [...$('camera-menu').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));setMenu(false);
  if(seen.size===5)grant('allcams');
 }
 function setMenu(open){$('camera-menu').hidden=!open;$('camera-btn').setAttribute('aria-expanded',String(open));}
 for(const [i,[title,n]] of cams.entries()){
  const b=document.createElement('button');b.type='button';b.innerHTML=`<span data-icon="${n}">${icon(n)}</span>${title}<span class="num">${pad(i+1)}</span>`;b.addEventListener('click',()=>{selectCamera(i);$('camera-btn').focus();});$('camera-menu').append(b);
 }
 $('camera-btn').addEventListener('click',()=>setMenu($('camera-menu').hidden));document.addEventListener('pointerdown',e=>{if(!e.target.closest('.camera-wrap'))setMenu(false);});
 function clear(){keys.clear();for(const b of btns.values())b.classList.remove('pressed');}
 function pause(next){paused=next;$('pause-layer').hidden=!next;$('pause').setAttribute('aria-pressed',String(next));$('pause').setAttribute('aria-label',next?'继续骑行':'暂停');setIcon($('pause').firstElementChild,next?'play':'pause');if(next)clear();}
 $('pause').addEventListener('click',()=>pause(!paused));$('resume').addEventListener('click',()=>pause(false));
 $('full').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}});
 document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement;setIcon($('full').firstElementChild,full?'minimize':'maximize');$('full').title=full?'退出全屏':'全屏';$('full').setAttribute('aria-label',$('full').title);});
 $('sound').addEventListener('click',async()=>{try{const on=await audio.toggle();$('sound').setAttribute('aria-pressed',String(on));$('sound').title=on?'静音':'开启声音';$('sound').setAttribute('aria-label',$('sound').title);setIcon($('sound').firstElementChild,on?'volume-2':'volume-x');}catch{toast('浏览器未能开启声音','volume-x');}});
 $('auto').addEventListener('click',()=>{autoAllowed=auto=!auto;idle=auto?12:0;updateUI();});
 $('time').addEventListener('pointerdown',()=>{scrub=true;});
 for(const e of ['pointerup','pointercancel','blur'])window.addEventListener(e,()=>{scrub=false;});
 $('time').addEventListener('input',e=>{cycle=+e.target.value/999;updateUI();});
 $('trophies').addEventListener('click',()=>{clear();setMenu(false);dialog.showModal();});$('close-ach').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 const norm=k=>({'arrowup':'w','arrowdown':'s','arrowleft':'a','arrowright':'d'}[k.toLowerCase()]??k.toLowerCase());
 function keyDown(k){
  if(paused||dialog.open||keys.has(k))return;
  idle=0;auto=false;autoAllowed=true;keys.add(k);btns.get(k)?.classList.add('pressed');
  if(k==='a'||k==='d'){lane=clamp(lane+(k==='d'?1:-1),0,2);audio.fx('lane');}
  if(k===' '&&jump===0){vy=5.9;jump=.002;audio.fx('jump');}
  if(k==='t'){hold=.42;audio.fx('wheel');}
  if(k==='w')speed=Math.min(17.8,speed+.25);if(k==='s')speed=Math.max(3.7,speed-.25);
  updateUI();
 }
 function keyUp(k){keys.delete(k);btns.get(k)?.classList.remove('pressed');}
 document.addEventListener('keydown',e=>{
  if(dialog.open||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=norm(e.key);if(e.target.matches('input')&&e.key.startsWith('Arrow'))return;
  if(k===' '&&e.target.closest('button')&&e.detail===0&&e.target.matches(':focus-visible')&&!e.target.matches('[data-key]'))return;
  if(btns.has(k)){e.preventDefault();if(!e.repeat)keyDown(k);}else if(k==='p'&&!e.repeat){pause(!paused);}else if(k==='c'&&!e.repeat){selectCamera((cam+1)%5);}else if(k==='escape'&&!$('camera-menu').hidden){setMenu(false);$('camera-btn').focus();}
 });
 document.addEventListener('keyup',e=>keyUp(norm(e.key)));window.addEventListener('blur',clear);
 for(const b of document.querySelectorAll('[data-key]')){
  const k=b.dataset.key;btns.set(k,b);
  b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);keyDown(k);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keyUp(k));
  b.addEventListener('click',e=>{if(e.detail===0){keyDown(k);keyUp(k);}});
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('unavailable').hidden=false;});canvas.addEventListener('webglcontextrestored',()=>{$('unavailable').hidden=true;resize();});
 function catchFish(f){
  fishTotal++;streak++;nudge=1;audio.fx('fish');toast(f.type===2?'金色渔获 +1':'渔获 +1','fish');
  if(fishTotal===1)grant('first');if(fishTotal===5)grant('five');if(fishTotal===15)grant('fifteen');
  if(jump>.32)grant('air');if(wheel>.22)grant('trick');if(night)grant('night');if(auto)grant('autofish');if(streak===3)grant('streak');if(f.type===2)grant('special');
 }
 function physics(dt){
  if(keys.size)idle=0;else idle+=dt;
  auto=autoAllowed&&idle>4.6;
  const next=fishArr.find(f=>f.s>s-1.2);
  if(auto&&next){
   const diff=next.s-s;
   if(diff<28)lane=next.l;
   if(next.aerial&&diff>3.2&&diff<6.9&&jump===0){vy=5.65;jump=.002;}
  }
  if(keys.has('w'))speed+=3.9*dt;if(keys.has('s'))speed-=6.1*dt;
  if(auto)speed=mix(speed,8.85+sin(elapsed*.49)*.78,1-Math.exp(-dt*1.5));
  speed=clamp(speed,3.7,17.8);const step=speed*dt;s+=step;distance+=step;
  side=mix(side,lanes[lane],1-Math.exp(-dt*(auto?4.9:6.9)));lean=mix(lean,clamp((side-lastSide)/Math.max(dt,.001)*-.032,-.35,.35),1-Math.exp(-dt*9));lastSide=side;
  if(jump>0){vy-=12.5*dt;jump+=vy*dt;if(jump<=0){jump=0;vy=0;}}
  hold=Math.max(0,hold-dt);const up=keys.has('t')||hold>0;wheel=mix(wheel,up?.45:0,1-Math.exp(-dt*(up?5:7)));
  if(wheel>.32){wheelTime+=dt;if(wheelTime>3)grant('balance');}else wheelTime=0;
  if(speed*3.6>=50)grant('fast');if(distance>=1000)grant('km');if(distance>=3000)grant('long');
  for(let i=0;i<fishArr.length;){
   const f=fishArr[i],diff=f.s-s;const caught=Math.abs(diff)<1.45&&Math.abs(side-lanes[f.l])<1.08&&(!f.aerial||jump+wheel*1.65>.65);
   if(caught||diff< -2.1){if(caught)catchFish(f);else streak=0;f.dispose();fishArr.splice(i,1);}
   else i++;
  }
  while(spawnNext<s+200){addFish(spawnNext);spawnNext+=14+hash(spawnID+4)*13;}
  nudge=Math.max(0,nudge-dt*3.2);
 }
 function aim(dt){
  const a=heading(s),y=roadY(s),x=roadX(s)+side,z=-s,portrait=camera.aspect<.83;
  const u=cameraTime,blend=first?1:1-Math.exp(-dt*(cam===4?13:6.0));
  target.set(x,y+jump*.8,z);
  if(cam===0){offset.set(portrait?2.42:4.45,portrait?3.37:3.47,portrait?6.91:5.35);focus.set(portrait?.83:1.20,portrait?1.62:1.40,-5.95);}
  if(cam===1){offset.set(portrait?7.6:6.25,2.58,portrait?.9:.55);focus.set(0,1.48,portrait?-.13:-1.27);}
  if(cam===2){offset.set(portrait?1.0:2.0,portrait?13.7:13.2,7.6);focus.set(0,.1,-4.6);}
  if(cam===3){const turn=.92+.79*sin(u*.30-.7),r=portrait?9.5:7.8;offset.set(sin(turn)*r,2.5+1.25*cos(u*.44),cos(turn)*r);focus.set(.15,1.65,-.72);}
  if(cam===4){offset.set(.018,2.41+wheel*.39+sin(rider.phase)*.018,-.50+wheel*.25);focus.set(side*.035,1.95+wheel*2.4,-24);}
  const co=cos(a),si=sin(a);
  desired.set(offset.x*co+offset.z*si,offset.y,offset.z*co-offset.x*si).add(target);
  focus.set(focus.x*co+focus.z*si,focus.y,focus.z*co-focus.x*si).add(target);
  if(cam===4&&cameraTime<.12){camera.position.copy(desired);look.copy(focus);}else{camera.position.lerp(desired,blend);look.lerp(focus,blend);}
  camera.lookAt(look);rider.root.visible=cam!==4;bill.visible=cam===4;bill.position.y=.006*sin(rider.phase);bill.rotation.x=.021*sin(rider.phase);
 }
 function frame(now){
  requestAnimationFrame(frame);
  if(renderer.getContext().isContextLost())return;
  const delta=frameTime?(now-frameTime)/1000:1/60;frameTime=now;
  const dt=Math.min(Math.max(delta,0),.16), run=!paused&&!dialog.open&&!document.hidden;
  if(run){elapsed+=dt;cameraTime+=dt;cycle=(cycle+dt/146)%1;const sub=Math.max(1,Math.ceil(dt/.032));for(let j=0;j<sub;j++)physics(dt/sub);}
  const x=roadX(s)+side;
  rider.update({dt:run?dt:0,time:elapsed,x,y:roadY(s)+.021,s,angle:heading(s),lean,jump,wheel,speed,kick:nudge});
  for(const f of fishArr){
   const y=roadY(f.s),t=elapsed*3.3+f.i*.71;
   f.holder.position.set(roadX(f.s)+lanes[f.l],y,-f.s);f.holder.visible=f.s-s<112;
   f.floater.position.y=(f.aerial?1.57:.68)+sin(t)*.16;f.model.rotation.set(.09*sin(t),.31*sin(t*.57)-.06,.20*sin(t*.8));
   f.tail.rotation.y=sin(t*3)*.29;f.spark.rotation.set(t*.7,t*.8,.1);f.ring.scale.setScalar(1+sin(t)*.09);
  }
  aim(first?1:dt);coast.update(s,camera,elapsed,cycle);renderer.render(scene,camera);first=false;
  if(elapsed-lastUI>.08||lastUI<0){updateUI();lastUI=elapsed;}
  audio.update(elapsed,.85+speed*.086,!run);
  if(run&&delta<.35&&elapsed>2){performanceTime+=delta;samples++;if(performanceTime>2.4){fps=mix(fps,samples/performanceTime,.76);performanceTime=0;samples=0;
   if(elapsed-adjustedAt>4){const q=fps<32?Math.max(0,quality-1):fps>53?Math.min(2,quality+1):quality;if(q!==quality){quality=q;coast.quality=q;resize();adjustedAt=elapsed;}}
  }}
 }
 updateBadges();selectCamera(0);updateUI();while(spawnNext<s+200){addFish(spawnNext);spawnNext+=14+hash(spawnID+4)*13;}requestAnimationFrame(frame);
}
