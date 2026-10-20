'use strict';
// Heights relative to one oni, estimated from zentai.png.
const yokaiRatios={chouchin:1.6,karakasa:3.5,hitodama:1.25,tanuki:1.9,kitsune:1.8,hyakume:4,umibouzu:4.1,kappa:2.1,nyoro:1.15,usagi:1.25,sharin:4,kuchi:1.8};
const yokaiImages={};
for(const name of [...Object.keys(yokaiRatios),'karakasa-karada','karakasa-ashi','karakasa-kutu']){const img=new Image();img.src=`assets/${name}.png`;yokaiImages[name]=img;}
let yokaiTime=0,yokaiLast=null,yokaiNext=0,yokaiGuests=[];
const randomBetween=(a,b)=>a+Math.random()*(b-a);
function newGuests(){
 const groundNames=['karakasa','tanuki','hyakume','umibouzu','kappa','nyoro','usagi','sharin','kuchi'];
 const groundName=groundNames[Math.floor(Math.random()*groundNames.length)];
 const floatName=Math.random()<.55?'chouchin':'hitodama';
 const groundGroup=groundName==='tanuki'?['kitsune','tanuki']:[groundName];
 const selected=[...groundGroup];

 let lastFloat=null;
 for(const item of selected){
  const name=typeof item==='string'?item:item.name,air=typeof item!=='string';
  const img=yokaiImages[name];
  const height=Math.min(scale*frames[0].naturalHeight/(frames[0].naturalWidth||1)*yokaiRatios[name],canvas.height/canvas.width*(air?.16:.34),air?.32:.52);
  const width=height*img.naturalWidth/img.naturalHeight;
  const radius=name==='sharin'?Math.hypot(width,height)/2:name==='karakasa'?height*.55:width*.55+height*.16;
  const speed=name==='hitodama'?.24:.20;
  const entry=air&&lastFloat?lastFloat.entry+2*lastFloat.radius/speed+2:yokaiTime;
  const life=name==='umibouzu'?4.5:['tanuki','kitsune'].includes(name)?6:(1+2*radius)/speed;
  const g={name,air,phase:randomBetween(0,Math.PI*2),side:1,entry,radius,height,speed,life};
  yokaiGuests.push(g);if(air)lastFloat=g;
 }
 yokaiNext=Math.max(...yokaiGuests.filter(g=>!g.air).map(g=>g.entry+g.life));
}
function ensureFloatingGuests(){
 if(yokaiGuests.some(g=>g.air))return;
 const names=['chouchin','hitodama'];
 const guests=names.map((name,index)=>{
  const img=yokaiImages[name];
  const height=Math.min(scale*frames[0].naturalHeight/(frames[0].naturalWidth||1)*yokaiRatios[name],canvas.height/canvas.width*.16,.28);
  return {name,air:true,phase:index*Math.PI,side:1,entry:yokaiTime,height,speed:.20,life:Infinity};
 });
 const radius=Math.max(.12,...guests.map(g=>g.height*yokaiImages[g.name].naturalWidth/yokaiImages[g.name].naturalHeight*.55+g.height*.16));
 // Two alternating travellers; a two-second clear gap separates their bounds.
 // Their staggered cycles keep at least one floating guest visible at all times.
 guests.forEach((g,index)=>{g.radius=radius;g.spacing=2*radius+.4;g.offset=index*g.spacing;});
 yokaiGuests.push(...guests);
}
function paintGuestShadow(x,y,width,height,opacity){
 ctx.save();ctx.translate(x,y);ctx.scale(Math.max(1,width),Math.max(1,height));
 const shade=ctx.createRadialGradient(0,0,0,0,0,1);
 shade.addColorStop(0,`rgba(0,0,0,${opacity})`);shade.addColorStop(.45,`rgba(0,0,0,${opacity*.6})`);shade.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}

function paintYokai(name,x,y,height,angle=0,sx=1,sy=1){const img=yokaiImages[name];if(!img?.naturalWidth)return;const width=height*img.naturalWidth/img.naturalHeight;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(sx,sy);ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();}
function paintUmbrella(x,y,height,p){
 const body=yokaiImages['karakasa-karada'],leg=yokaiImages['karakasa-ashi'],shoe=yokaiImages['karakasa-kutu'];
 if(!body.naturalWidth||!leg.naturalWidth||!shoe.naturalWidth){paintYokai('karakasa',x,y,height);return;}
 const k=height/547,bend=(1-Math.abs(Math.sin(p)))*.75;
 ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 // Keep the original PNG's 55-pixel visible width. Only compress its length.
 // The transparent top 127px is excluded instead of shrinking the whole canvas.
 const footY=-24,legLength=182*(1-.24*bend),hipY=footY-legLength;
 ctx.drawImage(leg,0,127,55,182,-8,hipY,55,legLength);
 ctx.drawImage(shoe,12,footY-13,64,74);
 // Keep the body attached to the top of the leg throughout each hop.
 ctx.drawImage(body,-122,hipY-355,244,376);ctx.restore();
}
function drawYokai(t,w,h){
 if(yokaiLast===null)yokaiLast=t;
 if(running)yokaiTime+=Math.min(.1,(t-yokaiLast)/1000);yokaiLast=t;
 if(!canvas.width||!canvas.height||!frames[0].naturalWidth||Object.values(yokaiImages).some(im=>!im.naturalWidth))return;
 yokaiGuests=yokaiGuests.filter(g=>yokaiTime<g.entry+g.life);
 ensureFloatingGuests();
 if(yokaiTime>=yokaiNext)newGuests();
 const oniH=w*scale*frames[0].naturalHeight/(frames[0].naturalWidth||1),ground=pos.y*h+oniH*.46;
 for(const g of yokaiGuests){const age=yokaiTime-g.entry;if(age<0)continue;
 const p=age*5+g.phase;
 let hh=g.height*w,x=0,y=Math.max(h*.74,Math.min(h*.80,ground-oniH*.12)),angle=0,sx=1,sy=1;
 // Enter and leave fully outside the canvas; never fade in mid-screen.
 const progress=Math.max(0,Math.min(1,age*g.speed/(1+2*g.radius)));
 x=g.air?(-g.radius+((age*g.speed+g.offset+.5+g.radius)%(2*g.spacing)))*w:(-g.radius+age*g.speed)*w;
 switch(g.name){
 case 'chouchin':y=h*.28+hh*.10*Math.sin(p*.52);angle=Math.sin(p*.45)*.12;break;
 case 'hitodama':y=h*.25+hh*.15*Math.sin(p);angle=Math.sin(p*.7)*.13;break;
 case 'karakasa':y-=Math.abs(Math.sin(p))*oniH*.48;break;
 case 'tanuki':case 'kitsune':{
 const left=g.name==='tanuki' /* 狸は左、狐は右 */,img=yokaiImages[g.name],half=hh*img.naturalWidth/img.naturalHeight/2;
 // Three peeks, then slide back behind the same edge without fading.
 const envelope=Math.min(1,age/.45,(g.life-age)/.65);
 const peek=Math.max(0,envelope)*(.72+.28*Math.pow(Math.sin(age*Math.PI/1.65),2));
 x=left?-half+peek*half*1.65:w+half-peek*half*1.65;
 y=h*.78-Math.abs(Math.sin(p))*hh*.045;angle=(left?1:-1)*.08;break;
 }
 case 'hyakume':sy=1+.025*Math.sin(p*.6);sx=1-.025*Math.sin(p*.6);angle=.025*Math.sin(p*.5);break;
 case 'umibouzu':{
 // Fill the entire viewport, including wide and tall phone screens.
 const aspect=yokaiImages.umibouzu.naturalWidth/yokaiImages.umibouzu.naturalHeight;
 hh=Math.max(h*1.08,w/aspect*1.08);
 x=w*.5;
 // Shoot up in 0.38s, settle with a small bounce, then sink below the bottom.
 const rise=Math.min(1,age/.38),ease=1-Math.pow(1-rise,3);
 const retreat=Math.max(0,Math.min(1,(age-3.2)/1.3));
 const rest=(h+hh)/2;
 y=h+hh+(rest-h-hh)*ease+(h+hh-rest)*retreat*retreat;
 if(age>.38&&age<1.3)y-=Math.sin((age-.38)*Math.PI*3)*hh*.07*Math.exp(-(age-.38)*3);
 sx=1+.06*Math.sin(age*12)*Math.exp(-age*3);sy=1-.04*Math.sin(age*12)*Math.exp(-age*3);break;
 }
 case 'kappa':y-=Math.abs(Math.sin(p))*oniH*.07;angle=Math.sin(p)*.035;break;
 case 'nyoro':y=Math.min(h*.82,ground+oniH*.12);sy=1+.09*Math.sin(p);angle=Math.sin(p*.8)*.06;break;
 case 'usagi':y-=Math.abs(Math.sin(p*1.2))*oniH*.3;sy=1-.08*Math.cos(p*2.4);break;
 case 'sharin':angle=age*2*g.side; y-=hh*.06;break;
 case 'kuchi':y-=Math.abs(Math.sin(p))*oniH*.055;angle=Math.sin(p)*.045;break;
 }
 const imageWidth=hh*yokaiImages[g.name].naturalWidth/yokaiImages[g.name].naturalHeight;
 const floor=Math.max(h*.76,Math.min(h*.85,ground));
 const shadowY=g.air?floor:g.name==='umibouzu'?Math.min(h*.96,y):y+Math.max(0,Math.min(hh*.15,floor-y));
 paintGuestShadow(x,shadowY,imageWidth*(g.air?.32:.43),hh*(g.air?.035:.055),g.air?.10:.20);
 ctx.save();ctx.globalAlpha=1;
 if(g.name==='karakasa')paintUmbrella(x,y,hh,p);else if(g.name==='sharin'){ctx.translate(x,y-hh/2);ctx.rotate(angle);paintYokai(g.name,0,hh/2,hh,0,sx,sy);}else paintYokai(g.name,x,y,hh,angle,sx,sy);
 ctx.restore();
 }
}
