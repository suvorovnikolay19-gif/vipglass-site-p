/** Browser-free verification of the real location scene and interaction handlers.
 * Run: node validate-location.mjs
 * This checks geometry, event behavior and cleanup; it does not certify browser
 * layout, pointer capture behavior, animation smoothness or visual appearance.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createLocationUI, vipGlassLocation} from './dist/location-ui.mjs';
import {renderLocationScene, createLocationSceneGeometry, projectLocationPoint} from './dist/location-scene.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeUI=()=>createLocationUI({esc,btn:(t,u)=>`<a href="${u}">${t}</a>`,crumb:()=>'<nav>Главная</nav>'});
const errors=[], checks=[];
async function check(name,fn){try{await fn();checks.push(name);}catch(error){errors.push(`${name}: ${error.stack||error.message}`);}}

class EventTargetStub {
  constructor(){this.listeners=new Map();this.dataset={};}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,options={}){const event={target:this,preventDefault(){this.defaultPrevented=true;},...options};for(const fn of [...this.listeners.get(type)||[]])fn(event);return event;}
  listenerCount(){return [...this.listeners.values()].reduce((sum,set)=>sum+set.size,0);}
}

function environment({reduced=false,observers=true,raf=true}={}){
  const env=new EventTargetStub(),doc=new EventTargetStub(),host=new EventTargetStub(),canvas=new EventTargetStub(),slider=new EventTargetStub(),status=new EventTargetStub(),media=new EventTargetStub();
  const pending=new Map(),intersections=[],resizes=[];let nextFrame=1;
  const classes=new Set();host.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
  media.matches=reduced;env.matchMedia=()=>media;
  if(raf){env.requestAnimationFrame=fn=>{const id=nextFrame++;pending.set(id,fn);return id;};env.cancelAnimationFrame=id=>pending.delete(id);}
  const observer=(bucket)=>class {constructor(callback){this.callback=callback;this.disconnected=false;bucket.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}fire(value){this.callback(value);}};
  if(observers){env.IntersectionObserver=observer(intersections);env.ResizeObserver=observer(resizes);}
  doc.defaultView=env;doc.hidden=false;canvas.ownerDocument=doc;canvas.clientWidth=850;canvas.clientHeight=510;canvas.setPointerCapture=id=>{canvas.capture=id;};
  canvas.innerHTML=renderLocationScene({progress:1,width:850,height:510,time:6});slider.value='100';status.textContent='VIP Glass · Люберцы';
  host.querySelector=selector=>({'[data-location-canvas]':canvas,'[data-location-progress]':slider,'[data-location-status]':status}[selector]||null);
  doc.querySelectorAll=selector=>selector==='[data-location-experience]'?[host]:[];
  const targets=[env,doc,host,canvas,slider,status,media];
  return {env,doc,host,canvas,slider,status,media,pending,intersections,resizes,
    countListeners:()=>targets.reduce((sum,target)=>sum+target.listenerCount(),0),
    button(action){return host.emit('click',{target:{closest:selector=>selector==='[data-location-action]'?{dataset:{locationAction:action}}:null}});},
    visible(value=true){for(const item of intersections.filter(x=>!x.disconnected))item.fire([{target:host,isIntersecting:value}]);},
    frame(now){const batch=[...pending.values()];pending.clear();for(const callback of batch)callback(now);},
    progress(){return Number(canvas.innerHTML.match(/data-progress="([^"]+)"/)?.[1]);},
  };
}

await check('Three-dimensional mesh changes across opening stages and camera angles',()=>{
  const samples=[0,.2,.4,.6,.8,1].map(progress=>createLocationSceneGeometry(progress,2));
  assert.ok(samples.every(g=>g.faces.length>100),'Scene must contain projected geometry.');
  assert.equal(samples[0].rise,0);assert.equal(samples.at(-1).rise,1);
  assert.equal(samples[0].opening,0);assert.equal(samples.at(-1).opening,1);
  for(const geometry of samples)for(const item of [...geometry.faces,...geometry.lines])for(const point of item.points){assert.equal(point.length,3);assert.ok(point.every(Number.isFinite));}
  const shut=renderLocationScene({progress:0,time:2}),open=renderLocationScene({progress:1,time:2});
  assert.notEqual(shut,open);
  assert.notDeepEqual(projectLocationPoint([110,130,90],{yaw:-25}),projectLocationPoint([110,130,90],{yaw:25}));
  assert.notEqual(renderLocationScene({progress:1,yaw:-25}),renderLocationScene({progress:1,yaw:25}));
  for(const svg of [shut,open,renderLocationScene({progress:NaN,yaw:Infinity,pitch:NaN,width:0,height:0})]){
    assert.match(svg,/^<svg\b/);assert.doesNotMatch(svg,/NaN|Infinity/);assert.doesNotMatch(svg,/<image\b|<script\b|https?:\/\/(?!www\.w3\.org)/);
  }
});

await check('Playback reaches the final stage and replay restarts from the closed map',()=>{
  const e=environment(),ui=makeUI();ui.bind(e.doc);assert.equal(e.pending.size,0,'Do not animate before intersection.');
  e.visible();assert.equal(e.progress(),0);assert.equal(e.pending.size,1);
  e.frame(1000);e.frame(4100);assert.ok(e.progress()>.45&&e.progress()<.6);assert.equal(e.host.dataset.phase,'opening');
  const halfway=e.canvas.innerHTML;e.frame(7400);assert.equal(e.progress(),1);assert.equal(e.slider.value,'100');assert.equal(e.pending.size,0);assert.equal(e.host.dataset.phase,'open');assert.match(e.status.textContent,/Люберцы/);assert.notEqual(e.canvas.innerHTML,halfway);
  e.button('play');assert.equal(e.progress(),0);assert.equal(e.slider.value,'0');assert.equal(e.pending.size,1);ui.destroy();
});

await check('Range, mouse, touch and keyboard controls change the actual rendered mesh',()=>{
  const e=environment(),ui=makeUI();ui.bind(e.doc);e.button('reset');const original=e.canvas.innerHTML;
  e.slider.value='43';e.slider.emit('input');assert.equal(e.progress(),.43);assert.equal(e.pending.size,0);assert.notEqual(e.canvas.innerHTML,original);
  e.slider.value='100';e.slider.emit('input');e.button('reset');const resting=e.canvas.innerHTML;
  e.canvas.emit('pointerdown',{pointerId:1,clientX:120,clientY:100,button:0,pointerType:'mouse'});
  e.canvas.emit('pointermove',{pointerId:1,clientX:220,clientY:150});assert.notEqual(e.canvas.innerHTML,resting);assert.ok(e.host.classList.contains('is-dragging'));
  e.canvas.emit('pointerup',{pointerId:1});assert.ok(!e.host.classList.contains('is-dragging'));const moved=e.canvas.innerHTML;e.canvas.emit('pointermove',{pointerId:1,clientX:290,clientY:150});assert.equal(e.canvas.innerHTML,moved);
  e.canvas.emit('keydown',{key:'Home'});assert.equal(e.canvas.innerHTML,resting);
  const key=e.canvas.emit('keydown',{key:'ArrowRight'});assert.ok(key.defaultPrevented);assert.notEqual(e.canvas.innerHTML,resting);
  e.canvas.emit('keydown',{key:'Home'});e.canvas.emit('pointerdown',{pointerId:2,clientX:120,clientY:100,button:0,pointerType:'touch'});
  e.canvas.emit('pointermove',{pointerId:2,clientX:120,clientY:190});assert.equal(e.canvas.innerHTML,resting,'Vertical touch motion should leave the scene unchanged for page scrolling.');
  e.canvas.emit('pointermove',{pointerId:2,clientX:190,clientY:190});assert.notEqual(e.canvas.innerHTML,resting);e.canvas.emit('pointercancel',{pointerId:2});
  e.canvas.emit('keydown',{key:' '});assert.equal(e.progress(),0);assert.equal(e.pending.size,1);ui.destroy();
});

await check('Rotation remains responsive after repeated complete turns',()=>{
  const e=environment(),ui=makeUI();ui.bind(e.doc);e.button('reset');
  for(let turn=0;turn<40;turn++){const before=e.canvas.innerHTML;e.button('right');assert.notEqual(e.canvas.innerHTML,before,`Right turn ${turn+1} stopped changing geometry.`);}
  for(let turn=0;turn<40;turn++){const before=e.canvas.innerHTML;e.button('left');assert.notEqual(e.canvas.innerHTML,before,`Left turn ${turn+1} stopped changing geometry.`);}
  ui.destroy();
});

await check('Reduced motion and background visibility prevent continuing animation',()=>{
  const e=environment({reduced:true}),ui=makeUI();ui.bind(e.doc);e.visible();assert.equal(e.progress(),1);assert.equal(e.pending.size,0);e.button('play');assert.equal(e.pending.size,0);
  e.media.matches=false;e.media.emit('change');e.button('play');e.frame(1000);e.frame(2000);assert.equal(e.pending.size,1);
  e.media.matches=true;e.media.emit('change');assert.equal(e.progress(),1);assert.equal(e.pending.size,0);
  e.media.matches=false;e.button('play');e.frame(3000);e.visible(false);assert.equal(e.progress(),1);assert.equal(e.pending.size,0);
  e.visible(true);assert.equal(e.pending.size,0,'Returning to view should not replay automatically a second time.');
  e.button('play');e.doc.hidden=true;e.doc.emit('visibilitychange');assert.equal(e.pending.size,0);assert.equal(e.progress(),1);ui.destroy();
});

await check('Cleanup removes all handlers and observers and cancels stale frames across remounts',()=>{
  const e=environment(),ui=makeUI();let expectedListeners;
  for(let cycle=0;cycle<5;cycle++){
    ui.bind(e.doc);const count=e.countListeners();if(expectedListeners===undefined)expectedListeners=count;else assert.equal(count,expectedListeners,'Handlers accumulated after remount.');
    ui.bind(e.doc);assert.equal(e.countListeners(),count,'Repeated bind added duplicate handlers.');
    e.button('play');assert.equal(e.pending.size,1);const stale=[...e.pending.values()];ui.destroy();assert.equal(e.pending.size,0);assert.equal(e.countListeners(),0);assert.equal(e.host.dataset.bound,undefined);
    assert.ok(e.intersections.every(x=>x.disconnected));assert.ok(e.resizes.every(x=>x.disconnected));
    const html=e.canvas.innerHTML;for(const fn of stale)fn(99999);e.button('play');e.canvas.emit('keydown',{key:'ArrowLeft'});assert.equal(e.canvas.innerHTML,html,'Disposed callbacks changed a scene.');assert.equal(e.pending.size,0);
  }
});

await check('Fallback without browser observers or animation API stays operable',()=>{
  const e=environment({observers:false,raf:false}),ui=makeUI();ui.bind(e.doc);e.button('play');assert.equal(e.progress(),1);assert.equal(e.pending.size,0);
  e.canvas.clientWidth=420;e.env.emit('resize');assert.match(e.canvas.innerHTML,/viewBox="0 0 420 510"/);ui.destroy();assert.equal(e.countListeners(),0);
});

await check('Homepage and clean/hash location routes render the real address and controls',async()=>{
  const source=fs.readFileSync(new URL('./dist/app.mjs',import.meta.url),'utf8'),bindings={};
  for(const [,names,relative]of source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)){
    const imported=await import(new URL(relative,new URL('./dist/app.mjs',import.meta.url)));
    for(const binding of names.split(',')){const[name,alias]=binding.trim().split(/\s+as\s+/);bindings[alias||name]=imported[name];}
  }
  const offset=source.indexOf("$('#footer-categories').innerHTML");assert.ok(offset>0);
  const renderingCode=source.slice(0,offset).replace(/^import\s+.*?;\s*$/gm,'');
  const main={innerHTML:'',classList:{add(){},remove(){}},focus(){}};
  const location={hash:'',pathname:'/',search:''};
  const document={title:'',querySelector:selector=>selector==='#main'?main:null,querySelectorAll:()=>[],addEventListener(){}};
  const context=vm.createContext({...bindings,URLSearchParams,location,document,localStorage:{getItem:()=>null},requestAnimationFrame:callback=>callback(),window:{scrollTo(){}}});
  vm.runInContext(`${renderingCode}\nglobalThis.__renderLocationAudit=render;`,context,{timeout:5000});
  for(const route of ['/','/location','#/location']){
    location.hash=route.startsWith('#')?route:'';location.pathname=route.startsWith('#')?'/':route;
    vm.runInContext('__renderLocationAudit({scroll:false});',context,{timeout:5000});
    assert.match(main.innerHTML,/data-scene="vipglass-3d-location"/);assert.match(main.innerHTML,/data-location-action="play"/);assert.ok(main.innerHTML.includes(vipGlassLocation.address));assert.ok(main.innerHTML.includes(vipGlassLocation.routeURL));
    assert.equal((main.innerHTML.match(/<h1\b/g)||[]).length,1);assert.doesNotMatch(main.innerHTML,/СТРАНИЦА НЕ НАЙДЕНА/);
    if(route!=='/'){assert.match(document.title,/VIP Glass в Люберцах/);assert.match(main.innerHTML,/не воспроизводит фактический фасад/);assert.match(main.innerHTML,/href="\/projects-map"/);}
  }
});

if(errors.length){console.error(errors.join('\n\n'));process.exitCode=1;}
console.log(JSON.stringify({result:errors.length?'FAIL':'PASS',checks,failures:errors.length,scope:'Real modules and handlers in Node with an inert DOM/RAF facade; no browser layout or visual/smoothness certification.'},null,2));
