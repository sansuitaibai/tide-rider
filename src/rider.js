import * as T from 'three';
import {ball,block,mesh,paint,sin,cos,mix,clamp} from './coast.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
const UP=V(0,1,0), TAU=Math.PI*2;
const round=new T.CylinderGeometry(1,1,1,9);
function bar(p,m,a,b,w){const d=b.clone().sub(a);const o=mesh(round,m,p);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(UP,d.clone().normalize());o.scale.set(w,d.length(),w);return o;}
function line(p,m,pts,w){const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,w,8,false);return mesh(g,m,p);}
function prism(p,m,pts,depth=.025){const s=new T.Shape();s.moveTo(...pts[0]);for(const v of pts.slice(1))s.lineTo(...v);s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.016,bevelThickness:.012}),m,p);}
const shadowMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{alpha:{value:.45}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float alpha;void main(){float a=1.-smoothstep(.13,.5,length(v-.5));gl_FragColor=vec4(.035,.09,.10,a*a*alpha);}' });

export class Rider{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);
  this.shadow=mesh(new T.PlaneGeometry(1.9,3.2).rotateX(-Math.PI/2),shadowMat,this.root,0,.02,0);
  this.flight=new T.Group();this.root.add(this.flight);this.frame=new T.Group();this.flight.add(this.frame);
  const frame=this.frame,bike=new T.Group();frame.add(bike);
  const white=paint('#fff2db'), wing=paint('#c6c7b6'), tip=paint('#465650'), orange=paint('#efa34f'), pouch=paint('#dd8047'), beakTip=paint('#a35d3d');
  const coral=paint('#df5637',{metalness:.17,roughness:.37}), gold=paint('#ffc06e',{metalness:.22}), dark=paint('#233333'), tire=paint('#202929'), sidewall=paint('#677261'), rim=paint('#ebe1be',{metalness:.26}), steel=paint('#b9c5be',{metalness:.48}), strap=paint('#493d32');
  const helmet=paint('#153e42',{metalness:.14,roughness:.35}), htrim=paint('#467679'), glass=paint('#13232c',{metalness:.44,roughness:.13}), shine=paint('#82b9bc',{metalness:.38,roughness:.25});
  const scarf=paint('#da2f2b',{side:T.DoubleSide,vertexColors:true});const red=paint('#e14434');
  const btm=V(0,.58,.11),seat=V(0,1.26,.37),front=V(0,1.25,-.72),front2=V(0,.91,-.82),back=V(0,.49,.97),fAx=V(0,.49,-1.02);
  this.wheels=[];
  for(const center of [fAx,back]){
   const g=new T.Group();bike.add(g);g.position.copy(center);this.wheels.push(g);
   for(const [r,t,m] of [[.439,.051,tire],[.402,.017,sidewall],[.374,.019,rim]])mesh(new T.TorusGeometry(r,t,8,32).rotateY(Math.PI/2),m,g);
   for(const x of [-.046,.046])mesh(new T.TorusGeometry(.418,.007,4,30).rotateY(Math.PI/2),sidewall,g,x);
   bar(g,steel,V(-.136,0,0),V(.136,0,0),.045);
   for(let j=0;j<12;j++){let t=j*TAU/12;bar(g,steel,V((j%2?1:-1)*.09,0,0),V(0,.364*sin(t),.364*cos(t)),.006);}
  }
  for(const [a,b,w] of [[btm,seat,.046],[seat,front,.052],[btm,front2,.058],[front,front2,.057]])bar(bike,coral,a,b,w);
  for(const x of [-.086,.086]){
   for(const a of [btm,seat])bar(bike,coral,a,V(x,.49,.97),.026);
   bar(bike,coral,V(0,.95,-.83),V(x,.49,-1.02),.033);
   bar(bike,gold,V(x,.79,-.89),V(x,.51,-1.02),.037);
  }
  bar(bike,steel,seat,V(0,1.42,.407),.034);ball(bike,dark,0,1.43,.415,.149,.06,.215);
  bar(bike,steel,front,V(0,1.51,-.71),.035);
  this.grip=[V(-.34,1.52,-.69),V(.34,1.52,-.69)];
  line(bike,steel,[this.grip[0],V(-.23,1.57,-.78),V(0,1.50,-.70),V(.23,1.57,-.78),this.grip[1]],.024);
  for(const x of [-1,1]){bar(bike,dark,V(x*.25,1.546,-.76),V(x*.35,1.515,-.68),.035);bar(bike,dark,V(x*.25,1.56,-.78),V(x*.30,1.54,-.83),.014);}
  line(bike,dark,[V(.18,1.53,-.76),V(.24,1.28,-.92),V(.05,1.04,-.82),V(.09,.66,-.92)],.009);
  mesh(new T.TorusGeometry(.113,.021,6,20).rotateY(Math.PI/2),steel,bike,.157,.58,.11);
  line(bike,dark,[V(.15,.68,.11),V(.15,.55,.97),V(.15,.44,.97),V(.15,.48,.11),V(.15,.68,.11)],.015);
  const lamp=paint('#fff4c6',{emissive:'#ffd988',emissiveIntensity:1.1});ball(bike,dark,0,1.30,-.81,.095,.075,.091);ball(bike,lamp,0,1.31,-.88,.068,.054,.020);
  const taillight=paint('#ff5448',{emissive:'#ff3e26',emissiveIntensity:.48});block(bike,dark,0,1.26,.66,.15,.085,.08);block(bike,taillight,0,1.268,.709,.109,.04,.022);
  this.pedals=[];this.legs=[];
  for(const side of [-1,1]){
   const spin=new T.Group();spin.position.copy(btm);bike.add(spin);this.pedals.push(spin);
   bar(spin,steel,V(side*.15,0,0),V(side*.19,-.195,0),.023);block(spin,dark,side*.23,-.195,0,.19,.042,.11);
   const foot=ball(frame,orange,side*.23,.55,.12,.102,.043,.15);const leg=bar(frame,pouch,V(0,0,0),V(0,1,0),.028);this.legs.push({foot,leg,side});
   for(let j=-1;j<2;j++)ball(foot,orange,j*.55,-.05,-.62,.36,.71,.62);
  }
  this.bird=new T.Group();frame.add(this.bird);const bird=this.bird;
  const body=ball(bird,white,0,1.65,.29,.375,.36,.58);body.rotation.x=-.17;
  ball(bird,white,0,1.79,-.055,.265,.41,.33).rotation.x=.32;
  for(let j=-2;j<=2;j++){const tail=ball(bird,j%2===0?wing:white,j*.10,1.51,.79,.099,.074,.34);tail.rotation.y=j*.13;tail.rotation.x=.18;}
  line(bird,white,[V(0,1.73,.02),V(0,2.00,-.07),V(0,2.23,-.24),V(0,2.34,-.40)],.181);
  const scarfCollar=mesh(new T.TorusGeometry(.174,.049,8,20).rotateX(-Math.PI/2),red,bird,0,2.078,-.137);scarfCollar.rotation.x=-.26;
  ball(bird,red,.14,2.069,-.001,.083,.075,.068);
  this.head=new T.Group();bird.add(this.head);this.head.position.set(0,2.36,-.395);const head=this.head;
  ball(head,white,0,0,0,.235,.225,.265);
  ball(head,pouch,0,-.142,-.359,.151,.139,.365).rotation.x=.14;
  ball(head,orange,0,-.069,-.379,.176,.079,.413).rotation.x=.03;
  ball(head,beakTip,0,-.076,-.744,.078,.057,.071);
  const upper=new T.SphereGeometry(1,18,10,0,TAU,0,Math.PI*.55);
  const cap=mesh(upper,helmet,head,0,.045,.036);cap.scale.set(.257,.229,.285);
  const trim=mesh(new T.TorusGeometry(1,.036,6,23).rotateX(-Math.PI/2),htrim,head,0,.034,.036);trim.scale.set(.259,1,.285);
  for(const x of [-.113,0,.113]){const vent=ball(head,htrim,x,.247-.14*Math.abs(x),.008,.021,.011,.128);vent.rotation.x=.09;}
  for(const side of [-1,1]){
   line(head,strap,[V(side*.235,.055,.12),V(side*.212,-.117,.055),V(side*.10,-.209,-.073)],.014);
   const lens=ball(head,glass,side*.174,-.011,-.171,.109,.064,.038);lens.rotation.y=side*.81;
   const gl=ball(head,shine,side*.184,.008,-.191,.065,.008,.010);gl.rotation.y=side*.82;gl.rotation.z=side*-.17;
   bar(head,glass,V(side*.244,-.003,-.13),V(side*.240,.037,.089),.013);
  }
  bar(head,glass,V(-.112,.008,-.223),V(.112,.008,-.223),.014);
  this.wings=[];
  for(const side of [-1,1]){
   const g=new T.Group();bird.add(g);g.position.set(side*.24,1.80,.04);this.wings.push(g);
   const shoulder=ball(g,white,side*.27,-.04,.055,.37,.132,.26);shoulder.rotation.z=side*.08;
   for(let j=0;j<6;j++){
    const f=ball(g,j>1?tip:wing,side*(.37+j*.084),-.045,.15+j*.067,.31-j*.017,.055,.082);
    f.rotation.y=side*(-.26+j*.14);f.rotation.z=side*(-.025-j*.032);
    const c=ball(g,white,side*(.27+j*.082),.017,.14+j*.039,.213-j*.013,.059,.085);c.rotation.y=side*(-.15+j*.115);
   }
   ball(g,white,side*.13,-.18,-.41,.082,.083,.13);
  }
  this.scarf=new Scarf(bird,scarf);
  this.phase=0;
 }
 update({dt,time,x,y,s,angle,lean,jump,wheel,speed,kick}){
  this.root.position.set(x,y,-s);this.root.rotation.y=angle;
  this.shadow.material.uniforms.alpha.value=.48/(1+jump*1.8);
  this.flight.position.y=jump;this.flight.rotation.z=lean;
  this.frame.position.set(0,.49*(1-cos(wheel))+.97*sin(wheel),0);this.frame.rotation.x=wheel;
  const cadence=.85+speed*.086;this.phase=(this.phase+TAU*cadence*dt)%TAU;
  for(const w of this.wheels)w.rotation.x=(w.rotation.x-speed*dt/.49)%TAU;
  for(const [i,item] of this.legs.entries()){
   const ph=this.phase+i*Math.PI;this.pedals[i].rotation.x=ph;
   const y=.58-.195*cos(ph),z=.11-.195*sin(ph);item.foot.position.set(item.side*.23,y+.04,z);item.foot.rotation.x=sin(ph)*.28;
   const a=V(item.side*.225,y+.055,z),b=V(item.side*.21,1.42,.28);const d=b.clone().sub(a);
   item.leg.position.copy(a).addScaledVector(d,.5);item.leg.quaternion.setFromUnitVectors(UP,d.normalize());item.leg.scale.y=a.distanceTo(b);
  }
  this.bird.position.y=.016*sin(this.phase*2)+kick*.03;
  this.head.rotation.y=clamp(-lean*1.45+.075*sin(time*.72),-.35,.35);
  this.head.rotation.x=kick*.1+.04*sin(time*4);
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,w=this.wings[i];const spread=clamp(wheel*2.7+jump*.39,0,1);
   w.rotation.set(mix(.10,-.17,spread),side*mix(1.37,.05,spread),side*mix(-.52,.12+sin(time*10)*.11,spread));
  }
  this.scarf.update(dt,time,speed,lean,jump);
 }
}

class Scarf{
 constructor(parent,mat){
  this.cols=4;this.rows=13;this.step=.104;this.width=.054;this.p=[];this.prev=[];this.constraints=[];const pos=[],color=[],ind=[];
  const redA=new T.Color('#ff7770'),redB=new T.Color('#c94744');
  const tie=(a,b,l)=>this.constraints.push([a,b,l]);
  for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++){
   const x=.15+(c-1.5)*this.width,y=2.085-.039*r,z=.015+r*.094;
   this.p.push(V(x,y,z));this.prev.push(V(x,y,z));pos.push(x,y,z);
   const cl=redA.clone().lerp(redB,.14+.49*((c%2)+r%2)*.5);color.push(cl.r,cl.g,cl.b);
   const i=r*this.cols+c;
   if(c>0)tie(i,i-1,this.width*(r===0?.8:1));if(r>0)tie(i,i-this.cols,this.step);
   if(r>0&&c>0){tie(i,i-this.cols-1,Math.hypot(this.width,this.step));tie(i-1,i-this.cols,Math.hypot(this.width,this.step));ind.push(i,i-this.cols,i-1,i-1,i-this.cols,i-this.cols-1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(ind);g.computeVertexNormals();this.mesh=mesh(g,mat,parent);this.mesh.frustumCulled=false;this.acc=0;
 }
 update(dt,t,speed,lean,jump){
  this.acc=Math.min(.07,this.acc+dt);const h=1/90;
  while(this.acc>=h){
   this.acc-=h;
   for(let i=this.cols;i<this.p.length;i++){
    const a=this.p[i],p=this.prev[i],x=a.x,y=a.y,z=a.z,f=i/this.p.length;
    a.x+=(x-p.x)*.94+h*h*(2.4+speed*.31+lean*9+7*f*sin(t*8.2-f*7));
    a.y+=(y-p.y)*.94+h*h*(-7.7+speed*.33+(2+speed*.48)*sin(t*10-f*8)-jump*.45);
    a.z+=(z-p.z)*.94+h*h*(7+speed*1.9+sin(t*6.8-f*9)*6);
    p.set(x,y,z);
   }
   for(let pass=0;pass<6;pass++){
    for(const [i,j,l] of this.constraints){const a=this.p[i],b=this.p[j];const x=a.x-b.x,y=a.y-b.y,z=a.z-b.z;const len=Math.hypot(x,y,z)||1;
     const f=(len-l)/len*(j<this.cols?1:.5);if(i>=this.cols){a.x-=x*f;a.y-=y*f;a.z-=z*f;}if(j>=this.cols){b.x+=x*f;b.y+=y*f;b.z+=z*f;}
    }
    for(let i=this.cols;i<this.p.length;i++){const p=this.p[i];if(p.z<.73&&p.z>.06)p.y=Math.max(p.y,1.94+.085*(1-p.z/.73));}
   }
  }
  const g=this.mesh.geometry,a=g.attributes.position;for(let i=0;i<this.p.length;i++)a.setXYZ(i,this.p[i].x,this.p[i].y,this.p[i].z);a.needsUpdate=true;g.computeVertexNormals();
 }
}

const fishSkin=[paint('#83dfd0',{metalness:.29,roughness:.45}),paint('#a5c6f1',{metalness:.30,roughness:.35}),paint('#f2bc76',{metalness:.26,roughness:.44})];
const fishTop=[paint('#308a78'),paint('#557cb7'),paint('#c77a44')];const fishWhite=paint('#fcf5d9'),fishBlack=paint('#153d41');
const ringMat=new T.MeshBasicMaterial({color:'#d8ff8c',transparent:true,opacity:.82,side:T.DoubleSide,depthWrite:false});
const ringFaint=new T.MeshBasicMaterial({color:'#c4ed8e',transparent:true,opacity:.29,side:T.DoubleSide,depthWrite:false});
const fishGlow=new T.MeshBasicMaterial({color:'#defa97',transparent:true,opacity:.65,depthWrite:false});
export function fishModel(p,type){
 const holder=new T.Group(),floater=new T.Group(),model=new T.Group();p.add(holder);holder.add(floater);floater.add(model);
 const skin=fishSkin[type],top=fishTop[type];
 ball(model,skin,0,0,0,.44,.205,.123);ball(model,fishWhite,.02,-.091,.007,.364,.122,.116);
 const tail=prism(model,top,[[.30,.004],[.63,.225],[.61,.018],[.65,-.202]],.03);tail.position.z=-.014;
 prism(model,top,[[-.05,.14],[.075,.31],[.252,.159]],.026).position.z=-.01;
 prism(model,top,[[-.115,.008],[.132,-.109],[.055,.027]],.022).position.z=.106;
 for(const s of [-1,1]){ball(model,fishWhite,-.255,.038,s*.09,.067,.067,.036);ball(model,fishBlack,-.272,.038,s*.113,.037,.04,.018);}
 const g=new T.RingGeometry(.56,.60,26).rotateX(-Math.PI/2),g2=new T.RingGeometry(.72,.742,24).rotateX(-Math.PI/2);
 const ring=mesh(g,ringMat,holder,0,.032,0);mesh(g2,ringFaint,holder,0,.033,0);
 const spark=mesh(new T.OctahedronGeometry(.087),fishGlow,floater,0,.42,0);
 return {holder,floater,model,ring,tail,spark,dispose(){holder.traverse(o=>{if(o.geometry&&o.geometry!==round&&o.geometry.type!=='SphereGeometry'&&o.geometry.type!=='IcosahedronGeometry')o.geometry.dispose();});p.remove(holder);}};
}
