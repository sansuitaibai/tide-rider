import * as T from 'three';

export const sin=Math.sin,cos=Math.cos,clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
const fract=x=>x-Math.floor(x);
export const hash=x=>fract(sin(x*127.1+83.3)*43758.5453123);
export const roadX=s=>-42*sin(s/95)+15*sin(s/44)+11*sin(s/211);
export const roadY=s=>1.8+0.85*cos(s/53)+0.8*sin(s/117);
export const shore=s=>10.8+2.3*sin(s/26)+1.7*cos(s/61);
export const heading=s=>-Math.atan2(roadX(s+1)-roadX(s-1),2);
export const mesh=(g,m,p,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
export const paint=(color,opt={})=>new T.MeshStandardMaterial({color,roughness:.82,flatShading:true,...opt});
export const ball=(p,m,x,y,z,a,b,c,detail=1)=>{const o=mesh(detail===1?sphere:sphereLo,m,p,x,y,z);o.scale.set(a,b,c);return o;};
const sphere=new T.SphereGeometry(1,16,10),sphereLo=new T.IcosahedronGeometry(1,0);
const rock=new T.IcosahedronGeometry(1,0), rockB=new T.DodecahedronGeometry(1,0);
const box=new T.BoxGeometry(1,1,1);
export function block(p,m,x,y,z,a,b,c){const o=mesh(box,m,p,x,y,z);o.scale.set(a,b,c);return o;}

const skyFrag=`
varying vec3 vDir;
uniform float darkness,dawn,solar;
uniform vec3 sunDir,moonDir;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
void main(){
 vec3 d=normalize(vDir);float y=max(d.y,0.);float sun=max(dot(d,sunDir),0.);float moon=max(dot(d,moonDir),0.);
 vec3 horizon=mix(vec3(.99,.55,.35),vec3(.25,.36,.53),darkness);
 vec3 zenith=mix(vec3(.27,.52,.62),vec3(.035,.08,.17),darkness);
 horizon=mix(horizon,vec3(.84,.75,.58),dawn);zenith=mix(zenith,vec3(.29,.60,.74),dawn);
 vec3 c=mix(horizon,zenith,pow(clamp(y*2.0,0.,1.),.66));
 c+=vec3(.24,.16,.08)*pow(sun,14.)*solar;
 vec2 p=vec2(atan(d.x,-d.z),d.y)*vec2(6.,28.);
 float clouds=n(p+vec2(1.2,3.7))*.63+n(p*2.3)*.27+n(p*4.7)*.10;
 float cloud=smoothstep(.47,.74,clouds)*smoothstep(.012,.065,y)*(1.-smoothstep(.20,.43,y));
 vec3 cl=mix(vec3(.64,.37,.34),vec3(.15,.22,.37),darkness)+pow(sun,12.)*vec3(.41,.23,.10)*solar;
 c=mix(c,cl,cloud*.60); c+=vec3(.17,.115,.065)*smoothstep(.69,.78,clouds)*(1.-darkness)*cloud;
 float disk=smoothstep(.99905,.99924,sun); c=mix(c,vec3(1.,.91,.65),disk*solar);
 c+=vec3(.22,.28,.42)*pow(moon,96.)*darkness;
 float cres=smoothstep(.99944,.99952,moon)*(1.-smoothstep(.99940,.99953,dot(d,normalize(moonDir+vec3(.016,.009,0.)))));
 c=mix(c,vec3(.84,.92,1.),cres*darkness);
 vec2 starP=vec2(atan(d.x,-d.z),asin(d.y))*vec2(146.,116.);vec2 cell=floor(starP);
 float st=h(cell);vec2 off=vec2(h(cell+17.3),h(cell-4.8))*.7+.15;
 float star=(1.-smoothstep(.022,.106,length(fract(starP)-off)))*step(.952,st);
 c+=vec3(.62,.72,.91)*star*darkness*smoothstep(.035,.2,y);
 gl_FragColor=vec4(c,1.);
}`;
const waterFrag=`
varying vec3 vW;varying float vSh;
uniform float clock,darkness,solar,dawn;uniform vec3 sunDir,moonDir;
void main(){
 vec3 dir=normalize(vW-cameraPosition);
 float depth=smoothstep(0.,42.,vSh);float far=smoothstep(28.,410.,length(vW-cameraPosition));
 float r=sin(vW.z*.87+vW.x*.52+clock*1.3+sin(vW.z*.38+vW.x*.31)*.92)*0.5+0.5;
 float r2=sin(vW.z*1.87-vW.x*.23+sin(vW.x*.52+vW.z*.37+clock)*1.2+clock*1.9)*.5+.5;
 float swell=sin(vW.x*.28+vW.z*.36+clock*1.16+sin(vW.x*.14-vW.z*.31))*.5+.5;
 vec3 nearC=mix(vec3(.13,.57,.54),vec3(.065,.205,.255),darkness);
 vec3 deepC=mix(vec3(.105,.33,.40),vec3(.045,.115,.195),darkness);
 vec3 c=mix(nearC,deepC,depth);
 c+=(r*.047+r2*.021+swell*.042)*(1.-far)*mix(1.,.5,darkness)*vec3(.62,1.,.96);
 float lines=pow(r,11.)*pow(swell,3.)*(.35+.65*r2)*(1.-far);
 c=mix(c,vec3(.47,.79,.71),lines*(.28-.14*darkness));
 vec3 reflection=normalize(vec3(sunDir.x,-.0,sunDir.z));
 float along=max(dot(normalize(vec3(dir.x,0.,dir.z)),reflection),0.);
 float glint=pow(along,38.+125.*clamp(-dir.y,0.,.4))*pow(.13+.87*r2,3.)*(.28+.72*swell);
 c+=vec3(.92,.60,.29)*glint*solar*(.85-.36*far);
 float m=max(dot(normalize(vec3(dir.x,0.,dir.z)),normalize(vec3(moonDir.x,0.,moonDir.z))),0.);
 c+=vec3(.24,.37,.55)*pow(m,45.)*pow(r2,4.)*darkness*.45;
 vec3 haze=mix(vec3(.55,.57,.53),vec3(.18,.26,.39),darkness);
 c=mix(c,haze,far*.68);
 float wav=sin(vW.z*.64-clock*1.9)*.32+sin(vW.z*.26+clock)*.44;
 float wash=1.-smoothstep(.12,.48,abs(vSh-.37-wav));
 float roll=fract(vSh*.55+clock*.48+sin(vW.z*.36)*.13);
 float rip=(1.-smoothstep(.027,.12,abs(roll-.80)))*exp(-max(vSh,0.)*.39)*(.46+.54*r2);
 c=mix(c,mix(vec3(.85,.96,.85),vec3(.47,.65,.72),darkness),min(.94,wash*.78+rip*.82));
 gl_FragColor=vec4(c,1.);
}`;

const waterVerts=`
 attribute float edge;varying vec3 vW;varying float vSh;uniform float clock;
 void main(){vec3 p=position;p.y+=(sin(p.z*.48+p.x*.29+clock*1.8)*.09+sin(p.z*.92-p.x*.38-clock*1.5)*.05)*smoothstep(.1,8.,edge);vSh=edge;vW=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}`;

export class Coast{
 constructor(scene){
  this.scene=scene;this.chunks=new Map();this.quality=2;
  this.skyU={clock:{value:0},darkness:{value:0},dawn:{value:0},solar:{value:1},sunDir:{value:new T.Vector3(.39,.10,-1).normalize()},moonDir:{value:new T.Vector3(.48,.28,-1).normalize()}};
  this.sky=mesh(new T.SphereGeometry(580,28,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:this.skyU,vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:skyFrag}),scene);this.sky.renderOrder=-10;this.sky.frustumCulled=false;
  this.water=new T.ShaderMaterial({side:T.DoubleSide,uniforms:this.skyU,vertexShader:waterVerts,fragmentShader:waterFrag});
  this.ocean=mesh(new T.PlaneGeometry(1900,2600).rotateX(-Math.PI/2),this.water,scene,580,-.36,0);this.ocean.geometry.setAttribute('edge',new T.Float32BufferAttribute([100,100,100,100],1));
  this.hem=new T.HemisphereLight(0xffe2bc,0x627764,2.3);scene.add(this.hem);
  this.sun=new T.DirectionalLight(0xffd4a5,2.0);this.sun.position.set(14,12,-17);scene.add(this.sun);
  this.rim=new T.DirectionalLight(0xbcd9e4,.8);this.rim.position.set(4,7,11);scene.add(this.rim);
  scene.fog=new T.FogExp2(0xc89d82,.0067);
  this.land=new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:T.DoubleSide});
  this.rockMat=['#6d8171','#878572','#a59780','#78877d','#9c917f'].map(c=>paint(c));
  this.foliage=['#42654f','#4e724c','#657a4b','#7d9556'].map(c=>paint(c));
  this.rail=paint('#c2b89f',{metalness:.24});this.post=paint('#4f5b57');this.yellow=paint('#edbc61');
  this.board=paint('#365756');this.cream=paint('#f8e8bb');this.treeBark=paint('#655645');
  this.lighthouse=paint('#f8dfb0');this.red=paint('#a9533d');this.glow=paint('#ffe9a5',{emissive:'#ffb849',emissiveIntensity:.8});
  this.warmSky=new T.Color('#ffe9d3');this.coolSky=new T.Color('#9ab4ef');this.warmSun=new T.Color('#ffdbb0');this.coolSun=new T.Color('#9bb5f1');this.warmFog=new T.Color('#c7a98d');this.coolFog=new T.Color('#465677');
 }
 update(s,camera,time,cycle){
  this.sky.position.copy(camera.position);this.ocean.position.z=camera.position.z;
  const smooth=T.MathUtils.smoothstep;
  const dark=smooth(cycle,.14,.34)*(1-smooth(cycle,.64,.84));
  const dawn=smooth(cycle,.67,.86)*(1-smooth(cycle,.90,1));
  const solar=(1-smooth(cycle,.12,.26))+smooth(cycle,.73,.93);
  const sunY=mix(.080,-.095,smooth(cycle,0,.27))+.43*dawn+.175*smooth(cycle,.90,1);
  this.skyU.clock.value=time;this.skyU.darkness.value=dark;this.skyU.dawn.value=dawn;this.skyU.solar.value=solar;
  this.skyU.sunDir.value.set(.13,sunY,-1).normalize();
  this.skyU.moonDir.value.set(.075,.146+.074*sin(cycle*4),-1).normalize();
  this.hem.color.copy(this.warmSky).lerp(this.coolSky,dark);this.hem.intensity=mix(2.15,1.17,dark);
  this.sun.color.copy(this.warmSun).lerp(this.coolSun,dark);this.sun.intensity=mix(2.0,.85,dark);
  this.rim.intensity=mix(.75,.60,dark);
  this.scene.fog.color.copy(this.warmFog).lerp(this.coolFog,dark);
  const ix=Math.floor(s/96), span=this.quality===0?4:6;
  for(let i=ix-1;i<=ix+span;i++)if(!this.chunks.has(i))this.add(i);
  for(const [i,ch] of this.chunks)if(i<ix-1||i>ix+span){this.scene.remove(ch);for(const g of ch.userData.owned)g.dispose();this.chunks.delete(i);}
 }
 add(id){
  const a=id*96,end=a+96,group=new T.Group(),owned=[];this.scene.add(group);this.chunks.set(id,group);group.userData.owned=owned;
  const pos=[],rgb=[],color=new T.Color();
  const xyz=(s,off,y)=>[roadX(s)+off,y,-s];
  const tri=(p,q,r,col,v=0)=>{color.set(col).multiplyScalar(1+v);for(const k of [p,q,r]){pos.push(...k);rgb.push(color.r,color.g,color.b);}};
  const quad=(p,q,r,t,col,v=0,v2=v)=>{tri(p,q,r,col,v);tri(p,r,t,col,v2);};
  const bands=[[-5.55,'#424b48'],[-4.88,'#424947'],[-1.65,'#404847'],[1.65,'#434b49'],[4.88,'#4b534f'],[5.55,null]];
  const heights=(s)=>{const y=roadY(s),sh=shore(s);return [xyz(s,-155,37+16*sin(s/155)+12*cos(s/58)),xyz(s,-70,22+10*sin(s/82)+8*cos(s/27)),xyz(s,-40,15+7*cos(s/31)+3*sin(s/8)),xyz(s,-22,8+4*cos(s/24)+2.2*cos(s/8)),xyz(s,-12,y+2+1.8*cos(s/19)+1.1*sin(s/6)),xyz(s,-7.2,y-.13),xyz(s,-5.55,y-.05),xyz(s,5.55,y-.05),xyz(s,6.75,y-.22),xyz(s,sh-1.2,Math.max(.17,y*.40)),xyz(s,sh,-.26),xyz(s,sh+1,-.58)];};
  const landColors=['#778674','#74846d','#7f896e','#778469','#909478','#a6a081',null,'#bca984','#b69e7b','#b99a76','#b19573'];
  for(let s=a;s<end;s+=3){
   let t=s+3;let p=heights(s),q=heights(t);
   for(let k=0;k<landColors.length;k++)if(landColors[k])quad(p[k],q[k],q[k+1],p[k+1],landColors[k],(hash(s+k*41)-.5)*.22,(hash(s+k*87+13)-.5)*.19);
   for(let k=0;k<bands.length-1;k++)quad(xyz(s,bands[k][0],roadY(s)),xyz(t,bands[k][0],roadY(t)),xyz(t,bands[k+1][0],roadY(t)),xyz(s,bands[k+1][0],roadY(s)),bands[k][1],(hash(s+k*8)-.5)*.041);
  }
  const stripe=(s,t,x,w,c)=>quad(xyz(s,x-w,roadY(s)+.018),xyz(t,x-w,roadY(t)+.018),xyz(t,x+w,roadY(t)+.018),xyz(s,x+w,roadY(s)+.018),c);
  for(let s=a;s<end;s+=4){for(const x of [-4.95,4.95])stripe(s,s+4,x,.062,'#e3d8b7');}
  for(let s=a;s<end;s+=8){stripe(s+.6,s+4.6,-1.66,.047,'#ddba72');stripe(s+.6,s+4.6,1.66,.047,'#ddba72');}
  const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(pos,3));terrain.setAttribute('color',new T.Float32BufferAttribute(rgb,3));terrain.computeVertexNormals();owned.push(terrain);mesh(terrain,this.land,group);
  const wp=[],we=[],wi=[],offs=[0,.34,.72,1.15,1.7,2.4,3.2,4.1,5.2,6.5,8,10,13,17,23,32,48,72,105,158,228,360,680];
  for(let s=a;s<=end;s+=3)for(const x of offs){wp.push(roadX(s)+shore(s)+x,-.22,-s);we.push(x);}
  for(let j=0;j<32;j++)for(let k=0;k<offs.length-1;k++){const n=j*offs.length+k;wi.push(n,n+offs.length,n+1,n+1,n+offs.length,n+offs.length+1);}
  const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wp,3));wg.setAttribute('edge',new T.Float32BufferAttribute(we,1));wg.setIndex(wi);owned.push(wg);mesh(wg,this.water,group);
  for(let s=a;s<end;s+=4){
   const railX=6.15,x=roadX(s)+railX,y=roadY(s),z=-s;
   if(Math.floor((s+960000)/32)%7!==5){
    block(group,this.post,x,y+.26,z,.12,.75,.14);if((s/4)%2===0)block(group,this.yellow,x,y+.52,z+.08,.11,.11,.06);
    const t=s+4,x2=roadX(t)+railX,y2=roadY(t), b=block(group,this.rail,(x+x2)/2,(y+y2)/2+.51,(z-t)/2,.13,.18,Math.hypot(x2-x,4)+.16);b.rotation.y=heading(s+2);b.rotation.x=Math.atan2(y2-y,4);
   }
   const seed=s*3+12;
   const addRock=(off,y,sc,k)=>{const o=mesh(k%2?rock:rockB,this.rockMat[k%5],group,roadX(s)+off,y,-s+hash(seed+k)*3);o.scale.set(sc*(1+hash(seed+2*k)*.4),sc*(.40+hash(seed+k+5)*.42),sc*(.67+hash(seed+k+9)*.55));o.rotation.set(hash(seed+k)*.9,hash(seed+k+2)*6,.24);};
   addRock(-10.1-hash(seed)*5.8,y+.52+hash(seed+10)*.96,1.2+hash(seed+4)*3.05,Math.floor(hash(seed+1)*15));
   if(hash(seed+6)>.31)addRock(shore(s)-hash(seed+4)*2.7,.13+hash(seed+2)*.42,.48+hash(seed+8)*1.75,Math.floor(hash(seed+2)*15));
   if(hash(seed+15)>.38){
    const xg=x-13.6-hash(seed+9)*2,yg=y-.13+hash(seed+8)*.32;
    for(let i=0;i<3;i++){const bush=mesh(rock,this.foliage[(i+Math.floor(hash(seed)*6))%4],group,xg-i*.41,yg+.22,-s+i*.52);bush.scale.set(.4+i*.16,.32+i*.08,.52);bush.rotation.y=hash(seed+i)*6;}
   }
  }
  for(let s=a+8;s<end;s+=16){
   const x=roadX(s)-14.5-hash(s)*8,y=roadY(s)+2.0+1.8*cos(s/19)+1.1*sin(s/6),h=1.6+hash(s+37)*3.8;
   if(hash(s+1)>.25){block(group,this.treeBark,x,y+h*.35,-s,.16,h*.75,.16);for(let j=0;j<3;j++){const g=new T.ConeGeometry(h*(.32-j*.056),h*.61,6);owned.push(g);mesh(g,this.foliage[(j+Math.abs(id))%4],group,x+.09*j,y+h*(.60+j*.23),-s).rotation.y=hash(s)*6;}}
  }
  if(((id%6)+6)%6===0){
   const s=a+79,x=roadX(s)+5.87,z=-s,y=roadY(s);
   block(group,this.post,x,y+.79,z,.095,1.82,.095);block(group,this.board,x,y+1.51,z,.94,.66,.1);
   block(group,this.cream,x,y+1.70,z+.061,.68,.044,.024);block(group,this.cream,x-.10,y+1.52,z+.064,.43,.043,.025);block(group,this.cream,x-.18,y+1.36,z+.065,.27,.041,.025);
  }
  if(((id%8)+8)%8===1){
   const s=a+35,x=roadX(s)+shore(s)+22,z=-s;
   const o=mesh(rockB,this.rockMat[2],group,x,-.47,z);o.scale.set(12,3.5,10);o.rotation.z=.08;
   const cyl=(y,rt,rb,h,m)=>{const g=new T.CylinderGeometry(rt,rb,h,10);owned.push(g);mesh(g,m,group,x,y,z);};
   cyl(3.2,1.2,1.52,2.6,this.lighthouse);cyl(5.32,.98,1.2,1.65,this.red);cyl(6.68,.80,.98,1.1,this.lighthouse);cyl(7.3,1.16,1.03,.25,this.red);cyl(7.76,.77,.77,.75,this.glow);cyl(8.4,.07,1.01,.62,this.red);
  }
  const batches=new Map();
  for(const o of group.children){if(o.geometry!==box&&o.geometry!==rock&&o.geometry!==rockB)continue;const k=`${o.geometry.id}:${o.material.id}`;if(!batches.has(k))batches.set(k,[]);batches.get(k).push(o);}
  for(const list of batches.values())if(list.length>1){
   const merged=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);
   for(let i=0;i<list.length;i++){const o=list[i];o.updateMatrix();merged.setMatrixAt(i,o.matrix);group.remove(o);}
   merged.computeBoundingSphere();group.add(merged);owned.push(merged);
  }
 }
}
