import {renderLocationScene} from './location-scene.mjs';

export const vipGlassLocation=Object.freeze({
  city:'Люберцы',address:'ул. 65 лет Победы, 1, лит. 2Д',
  fullAddress:'Московская область, Люберцы, улица 65 лет Победы, 1 лит 2Д',
  latitude:55.6863,longitude:37.88366,
  mapURL:'https://2gis.ru/lyubertsy/geo/4504235282904813',
  routeURL:'https://2gis.ru/lyubertsy/directions/points/%7C37.88366%2C55.6863%3B4504235282904813',
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function locationMotion(progress){const p=clamp(Number(progress)||0,0,1),t=clamp((p-.2)/.8,0,1),ease=t*t*(3-2*t);return {yaw:-34+9*ease,pitch:64-22*ease};}
export function locationPhase(progress){return progress<.18?'Метка на карте':progress<.55?'Карта раскрывается':progress<.98?'VIP Glass появляется':'VIP Glass · Люберцы';}
export function createLocationUI({esc,btn,crumb}){
 const active=new Set();
 const address=()=>`<div class="location-address"><span class="eyebrow">НАШ АДРЕС</span><strong>г. Люберцы</strong><p>${esc(vipGlassLocation.address)}</p><div class="location-address-actions"><a class="btn primary" href="${vipGlassLocation.routeURL}" target="_blank" rel="noopener noreferrer">Построить маршрут <span aria-hidden="true">↗</span></a><a class="location-map-link" href="${vipGlassLocation.mapURL}" target="_blank" rel="noopener noreferrer">Открыть в 2ГИС ↗</a></div></div>`;
 function scene(compact=false){return `<div class="location-experience ${compact?'location-compact':''}" data-location-experience><div class="location-canvas" data-location-canvas tabindex="0" role="group" aria-label="Объёмная миниатюра VIP Glass. Перетащите по горизонтали для поворота. Стрелки меняют ракурс, пробел повторяет появление.">${renderLocationScene({progress:1,yaw:-25,pitch:42,zoom:1,width:1000,height:690,time:6})}</div><div class="location-scene-caption"><span class="location-live-dot" aria-hidden="true"></span><span data-location-status role="status">VIP Glass · Люберцы</span></div><div class="location-scene-tools" aria-label="Управление объёмной сценой"><button type="button" data-location-action="play" class="location-play"><span aria-hidden="true">↻</span> Повторить появление</button><div class="location-view-tools"><button type="button" data-location-action="left" aria-label="Повернуть влево">↶</button><button type="button" data-location-action="right" aria-label="Повернуть вправо">↷</button><button type="button" data-location-action="reset" aria-label="Исходный ракурс">⌂</button></div></div><div class="location-scene-footer"><span>Поверните миниатюру движением мыши или пальца</span><label>Появление <input type="range" min="0" max="100" value="100" step="1" data-location-progress aria-label="Появление миниатюры"></label></div></div>`;}
 function homepage(){return `<section class="section location-home"><div class="section-top"><div><span class="eyebrow">VIP GLASS / ЛЮБЕРЦЫ</span><h2>Наше место<br><em>на вашей карте.</em></h2></div><p>Карта раскрывается — и появляется пространство VIP Glass. Поверните миниатюру и посмотрите на неё с другой стороны.</p></div><div class="location-layout">${scene(true)}${address()}</div><div class="location-bottom"><p>Авторская объёмная миниатюра. Подложка условная; реальное расположение и маршрут — в 2ГИС.</p>${btn('Развернуть сцену','/location','clear')}</div></section>`;}
 function page(){return `${crumb([['Как нас найти']])}<section class="selection-page location-page"><header class="selection-heading"><span class="eyebrow">VIP GLASS / КАК НАС НАЙТИ</span><h1>VIP Glass<br><em>в Люберцах.</em></h1><p>Улица 65 лет Победы, 1, лит. 2Д. Нажмите «Повторить появление», затем поверните объёмную миниатюру.</p></header><div class="location-layout">${scene()}${address()}</div><div class="location-bottom"><p>Авторская миниатюра VIP Glass по мотивам стекла и архитектуры. Она не воспроизводит фактический фасад; подложка служит художественной сценой. Для поездки откройте реальный адрес в 2ГИС.</p><a class="location-map-link" href="/projects-map">Карта проектов ↗</a></div></section>`;}
 function destroy(){for(const clean of active)clean();active.clear();}
 function bind(root=globalThis.document){
  if(!root?.querySelectorAll)return;
  for(const host of root.querySelectorAll('[data-location-experience]')){
   if(host.dataset.bound)return;host.dataset.bound='1';
   const canvas=host.querySelector('[data-location-canvas]'),slider=host.querySelector('[data-location-progress]'),status=host.querySelector('[data-location-status]');
   if(!canvas)continue;
   const env=canvas.ownerDocument?.defaultView||globalThis.window||globalThis;
   const reduce=env.matchMedia?.('(prefers-reduced-motion: reduce)');
   let progress=1,yaw=-25,pitch=42,zoom=1,frame=null,start=0,last=0,playing=false,disposed=false,visible=true,drag=null,lastPhase='',observer=null,resizer=null,autoPlayed=false;
   const raf=env.requestAnimationFrame?.bind(env)||globalThis.requestAnimationFrame;
   const cancel=env.cancelAnimationFrame?.bind(env)||globalThis.cancelAnimationFrame;
   const listeners=[];
   const listen=(target,event,fn,options)=>{target?.addEventListener?.(event,fn,options);listeners.push(()=>target?.removeEventListener?.(event,fn,options));};
   function draw(){if(disposed)return;const width=Math.max(280,canvas.clientWidth||1000),height=Math.max(280,canvas.clientHeight||690);canvas.innerHTML=renderLocationScene({progress,yaw,pitch,zoom,width,height,time:progress*6});if(slider)slider.value=String(Math.round(progress*100));const phase=locationPhase(progress);if(status&&phase!==lastPhase){status.textContent=phase;lastPhase=phase;}host.dataset.phase=progress<.98?'opening':'open';}
   function stop(){playing=false;if(frame!==null&&cancel)cancel(frame);frame=null;}
   function tick(now){if(!playing||disposed||!visible){frame=null;return;}if(!start)start=now;if(now-last>=30){progress=clamp((now-start)/6100,0,1);({yaw,pitch}=locationMotion(progress));draw();last=now;}if(progress>=1){stop();return;}frame=raf(tick);}
   function play(){stop();zoom=1;autoPlayed=true;if(reduce?.matches||!raf){progress=1;yaw=-25;pitch=42;draw();return;}progress=0;({yaw,pitch}=locationMotion(0));start=0;last=-Infinity;playing=true;draw();frame=raf(tick);}
   function view(action){stop();if(action==='reset'){yaw=-25;pitch=42;zoom=1;}else yaw+=action==='left'?-16:16;draw();}
   listen(host,'click',e=>{const button=e.target.closest?.('[data-location-action]');if(!button)return;const action=button.dataset.locationAction;if(action==='play')play();else view(action);});
   listen(slider,'input',e=>{stop();progress=clamp(Number(e.target.value)/100,0,1);draw();});
   listen(canvas,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','Home'].includes(e.key)){e.preventDefault();if(e.key===' '||e.key==='Enter')play();else{stop();if(e.key==='ArrowLeft')yaw-=10;if(e.key==='ArrowRight')yaw+=10;if(e.key==='ArrowUp')pitch=clamp(pitch+6,25,78);if(e.key==='ArrowDown')pitch=clamp(pitch-6,25,78);if(e.key==='Home'){yaw=-25;pitch=42;zoom=1;}draw();}}});
   listen(canvas,'pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;stop();drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,touch:e.pointerType==='touch'};canvas.setPointerCapture?.(e.pointerId);host.classList?.add('is-dragging');});
   listen(canvas,'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw=drag.yaw+(e.clientX-drag.x)*.28;pitch=clamp(drag.pitch-(drag.touch?0:(e.clientY-drag.y)*.16),25,78);draw();});
   const endDrag=e=>{if(drag&&e.pointerId===drag.id){drag=null;host.classList?.remove('is-dragging');}};
   listen(canvas,'pointerup',endDrag);listen(canvas,'pointercancel',endDrag);listen(canvas,'lostpointercapture',endDrag);
   listen(reduce,'change',()=>{if(reduce.matches){stop();progress=1;draw();}});
   const doc=canvas.ownerDocument||root;
   listen(doc,'visibilitychange',()=>{if(doc.hidden){stop();progress=1;draw();}});
   if(env.ResizeObserver){resizer=new env.ResizeObserver(()=>draw());resizer.observe(canvas);}else listen(env,'resize',draw);
   if(env.IntersectionObserver){observer=new env.IntersectionObserver(entries=>{for(const entry of entries){visible=entry.isIntersecting;if(visible&&!autoPlayed){autoPlayed=true;play();}else if(!visible&&playing){stop();progress=1;draw();}}},{threshold:.25});observer.observe(host);}else if(raf){play();}
   const clean=()=>{disposed=true;stop();observer?.disconnect();resizer?.disconnect();listeners.forEach(fn=>fn());delete host.dataset.bound;};active.add(clean);
  }
 }
 return {homepage,page,bind,destroy};
}
