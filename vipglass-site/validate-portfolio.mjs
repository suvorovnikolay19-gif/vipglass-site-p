#!/usr/bin/env node
// Browser-free regression checks for the actual portfolio data and UI modules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {
  PORTFOLIO_STORAGE_KEY,portfolioExamples,portfolioStageDefs,
  validatePortfolioProjects,getPortfolioProjects,filterPortfolio,
  matchingPortfolio,isPortfolioMediaURL,
} from './dist/portfolio-data.mjs';
import {createPortfolioUI} from './dist/portfolio-ui.mjs';
import {nodesByPath} from './dist/catalog-tree.mjs';
import {resourceByPath} from './dist/resource-catalog.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ui=createPortfolioUI({
  esc,
  btn:(label,url,style='primary')=>`<a class="btn ${esc(style)}" href="${esc(url)}">${esc(label)}</a>`,
  crumb:links=>`<nav class="breadcrumbs">${links.map(([label,url])=>url?`<a href="${esc(url)}">${esc(label)}</a>`:`<span>${esc(label)}</span>`).join(' / ')}</nav>`,
});
const clone=value=>JSON.parse(JSON.stringify(value));
const example=id=>{
  const project=portfolioExamples.find(item=>item.id===id);
  assert(project,'Missing expected example: '+id);
  return project;
};
const ids=projects=>projects.map(project=>project.id);
const count=(html,regex)=>[...html.matchAll(regex)].length;
const stageIds=html=>[...html.matchAll(/id="portfolio-stage-([a-z]+)"/g)].map(match=>match[1]);
const noStages=()=>Object.fromEntries(portfolioStageDefs.map(stage=>[stage.id,{photos:[],videos:[]}])) ;
const mirror=example('demo-round-mirror');
const mirrorNode=nodesByPath.get(mirror.productPaths[0]);
const shower=example('demo-open-shower');
const showerNode=nodesByPath.get(shower.productPaths[0]);
const originalStorageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
let rawDraft=null;
let storageError=false;
Object.defineProperty(globalThis,'localStorage',{
  configurable:true,writable:true,value:{getItem(key){
    assert.equal(key,PORTFOLIO_STORAGE_KEY);
    if(storageError)throw new Error('Storage unavailable for this browser.');
    return rawDraft;
  }},
});
const draft=projects=>{rawDraft=JSON.stringify(projects);};
const passed=[];
function check(name,run) {
  rawDraft=null;storageError=false;
  try {run();passed.push(name);} catch(error) {error.message=name+': '+error.message;throw error;}
  finally {rawDraft=null;storageError=false;}
}

try {
  check('Six clearly marked examples validate and render',()=>{
    assert.equal(portfolioExamples.length,6);
    assert(portfolioExamples.every(project=>project.isDemo&&project.published));
    const result=validatePortfolioProjects(portfolioExamples);
    assert(result.valid,result.errors.join('\n'));
    assert.equal(result.projects.length,6);
    assert.equal(new Set(ids(result.projects)).size,6);
    for(const project of result.projects) {
      const html=ui.detail(project.id);
      assert.equal(count(html,/<h1\b/g),1,project.id);
      assert(html.includes('Демонстрация'),project.id);
      assert(html.includes('не реальные объекты'),project.id);
      const expected=portfolioStageDefs.filter(({id})=>{
        const stage=project.stages[id];
        return stage.photos.length||stage.videos.length||stage.text?.trim();
      }).map(stage=>stage.id);
      assert.deepEqual(stageIds(html),expected,project.id);
      const node=nodesByPath.get(project.productPaths[0]);
      assert(node,project.id);
      assert(matchingPortfolio(node).some(item=>item.id===project.id),project.id);
    }
  });

  check('Existing images, posters and demonstration video resolve locally',()=>{
    const assets=new Set();
    for(const project of portfolioExamples) {
      const media=[project.cover,...Object.values(project.stages).flatMap(stage=>[...stage.photos,...stage.videos])].filter(Boolean);
      for(const item of media)for(const value of [item.src,item.poster].filter(Boolean)) {
        if(!value.startsWith('/assets/'))continue;
        assets.add(value);
        const filename=path.join(root,'dist',value.slice(1));
        assert(fs.existsSync(filename)&&fs.statSync(filename).isFile(),value);
      }
    }
    assert(assets.has('/assets/content/demo-process.mp4'));
  });

  check('Single photo has a large gallery and no empty stages',()=>{
    const html=ui.detail('demo-round-mirror');
    assert.deepEqual(stageIds(html),['after']);
    assert.equal(count(html,/data-portfolio-image=/g),1);
    assert.equal(count(html,/<video\b/g),0);
    assert(html.includes('portfolio-media-grid--single'));
    assert(!html.includes('portfolio-review-text'));
  });

  check('Video-only story uses a real controllable video without duplicate cover photo',()=>{
    const html=ui.detail('demo-glass-door');
    assert.deepEqual(stageIds(html),['after']);
    assert.equal(count(html,/data-portfolio-image=/g),0);
    assert.equal(count(html,/<video\b/g),1);
    assert.match(html,/<video controls playsinline preload="metadata"[^>]*>/);
    assert.match(html,/<source src="\/assets\/content\/demo-process\.mp4">/);
    assert(html.includes('Демонстрационный ролик'));
    assert(!/\bautoplay\b/i.test(html));
  });

  check('Full story renders photos and videos in each of four stages',()=>{
    const html=ui.detail('demo-open-shower');
    assert.deepEqual(stageIds(html),['before','during','after','review']);
    assert.equal(count(html,/<video\b/g),4);
    assert.equal(count(html,/data-portfolio-image=/g),5);
    assert(html.includes('portfolio-media-grid--pair'));
    assert(html.includes('portfolio-media-grid--many'));
    assert(html.includes('не отзыв клиента'));
    for(const stage of Object.values(shower.stages))assert(stage.photos.length&&stage.videos.length);
  });

  check('Homepage cards show only completed results and keep project stages inside their detail pages',()=>{
    const html=ui.homepage();
    assert.equal(count(html,/class="portfolio-card"/g),3);
    assert(!html.includes('portfolio-card-stages'));
    assert(!html.includes('portfolio-kicker'));
    assert(!html.includes('<span>Видео</span>'));
    assert(!html.includes('От первого кадра'));
    assert(html.includes('Это не фотографии выполненных работ.'));
    for(const project of portfolioExamples.slice(0,3)){
      assert(html.includes(`href="/portfolio/${project.id}"`));
      assert(html.includes(`src="${project.stages.after.photos[0].src}"`));
      assert(html.includes(`<h3>${esc(project.title)}</h3>`));
      assert(html.includes(`<p>${esc(project.kind)}</p>`));
    }
    assert(ui.home().includes('portfolio-card-stages'));
    assert.deepEqual(stageIds(ui.detail(shower.id)),['before','during','after','review']);
  });

  check('Homepage never falls back to before or during media when a result cover is absent',()=>{
    const project={...clone(shower),id:'qa-no-result',cover:null,stages:noStages()};
    project.stages.before=clone(shower.stages.before);
    project.stages.during=clone(shower.stages.during);
    draft([project]);
    assert.equal(ui.homepage(),'');
    assert(ui.home().includes(`href="/portfolio/${project.id}"`));
    assert.deepEqual(stageIds(ui.detail(project.id)),['before','during']);
    project.stages.after=clone(shower.stages.after);
    draft([project]);
    const html=ui.homepage();
    assert(html.includes(`src="${project.stages.after.photos[0].src}"`));
    for(const stage of ['before','during'])for(const media of project.stages[stage].photos)assert(!html.includes(`src="${media.src}"`));
  });

  check('Partial stories show only the filled stages',()=>{
    assert.deepEqual(stageIds(ui.detail('demo-clear-partition')),['before','after']);
    assert.deepEqual(stageIds(ui.detail('demo-bronze-mirror')),['after']);
    const html=ui.detail('demo-glass-canopy');
    assert.deepEqual(stageIds(html),['after','review']);
    assert.equal(count(html,/<video\b/g),0);
    assert(html.includes('portfolio-review-text'));
  });

  check('All-empty stages and author-only review do not leave headings',()=>{
    const project={...clone(mirror),id:'qa-empty-stages',stages:noStages()};
    project.stages.review.author='Тестовое имя в служебной проверке';
    const result=validatePortfolioProjects([project]);
    assert(result.valid,result.errors.join('\n'));
    draft(result.projects);
    const html=ui.detail(project.id);
    assert.deepEqual(stageIds(html),[]);
    assert(!html.includes('portfolio-review-text'));
    assert.equal(count(html,/data-portfolio-image=/g),1,'Cover is the only available image.');
  });

  check('Text survives normalization for ordinary stages and review',()=>{
    const project={...clone(mirror),id:'qa-text-stage',cover:null,stages:{before:{text:'Служебная проверка описания этапа.'}}};
    const result=validatePortfolioProjects([project]);
    assert(result.valid,result.errors.join('\n'));
    assert.equal(result.projects[0].stages.before.text,project.stages.before.text);
    assert.deepEqual(result.projects[0].stages.during,{photos:[],videos:[]});
    draft(result.projects);
    const html=ui.detail(project.id);
    assert.deepEqual(stageIds(html),['before']);
    assert(html.includes('portfolio-stage-text'));
    assert(!html.includes('<blockquote>'));
    assert.equal(count(html,/data-portfolio-image=/g),0);
  });

  check('Product, material color and kind filters are combined with AND',()=>{
    assert.deepEqual(ids(filterPortfolio(new URLSearchParams({product:'mirrors',color:'Бронза',kind:'Декоративное зеркало'}))),['demo-bronze-mirror']);
    assert.deepEqual(ids(filterPortfolio(new URLSearchParams({product:'mirrors',color:'Бронза',kind:'Зеркало с подсветкой'}))),[]);
    assert.deepEqual(ids(filterPortfolio(new URLSearchParams({product:'doors',color:'Бронза',kind:'Распашная дверь'}))),[]);
    assert.deepEqual(ids(filterPortfolio(new URLSearchParams({product:'doors',color:'Бесцветный',kind:'Распашная дверь'}))),['demo-glass-door']);
    const empty=ui.home(new URLSearchParams({product:'doors',color:'Бронза'}));
    assert(empty.includes('portfolio-empty'));
    assert.equal(count(empty,/class="portfolio-card"/g),0);
  });

  check('Category and every supplied attribute are required',()=>{
    assert.deepEqual(matchingPortfolio(mirrorNode,{category:'showers'}),[]);
    assert.deepEqual(matchingPortfolio(mirrorNode,{characteristics:{shape:'Несовпадающая форма'}}),[]);
    assert.deepEqual(matchingPortfolio(mirrorNode,{characteristics:{unrecordedAttribute:'Неподтверждённое значение'}}),[]);
    assert.deepEqual(matchingPortfolio(mirrorNode,{materialColor:'Бронза'}),[]);
    assert.deepEqual(matchingPortfolio(mirrorNode,{kind:'Открытая душевая'}),[]);
    assert.equal(ui.related(mirrorNode,{characteristics:{shape:'Несовпадающая форма'}}),'');
  });

  check('Exact product path only prioritizes matches and never bypasses mismatches',()=>{
    const inferred={...clone(mirror),id:'qa-inferred',productPaths:[]};
    const exact={...clone(mirror),id:'qa-exact'};
    draft([inferred,exact]);
    assert.deepEqual(ids(matchingPortfolio(mirrorNode)),['qa-exact','qa-inferred']);
    exact.characteristics.shape='Несовпадающая форма';
    draft([inferred,exact]);
    assert.deepEqual(ids(matchingPortfolio(mirrorNode)),['qa-inferred']);
    assert.deepEqual(ids(matchingPortfolio(mirrorNode,{shape:'Несовпадающая форма'})),['qa-exact']);
  });

  check('Canonical selected material path matches; different material or unrecorded hardware hides',()=>{
    const materialPath='/materials/clear/clear-crystalvision';
    assert(resourceByPath.has(materialPath),'Selected material must exist in the real resource catalogue.');
    assert.equal(shower.characteristics.materialPath,materialPath);
    assert(matchingPortfolio(showerNode,{characteristics:{materialPath},materialColor:'Бесцветный'}).some(project=>project.id===shower.id));
    assert.deepEqual(matchingPortfolio(showerNode,{characteristics:{materialPath:'/materials/tinted/other-material'}}),[]);
    assert.deepEqual(matchingPortfolio(showerNode,{characteristics:{materialPath,hardwareId:'unrecorded-hinge',hardwareFinish:'unrecorded-finish'}}),[]);
    assert.equal(ui.related(showerNode,{characteristics:{materialPath,hardwareFinish:'unrecorded-finish'}}),'');
  });

  check('Cross-realm selections and project arrays retain strict validation',()=>{
    const correct=vm.runInNewContext('({characteristics:{shape:"Круг"}})');
    const mismatch=vm.runInNewContext('({characteristics:{shape:"Несовпадение"}})');
    assert(matchingPortfolio(mirrorNode,correct).some(project=>project.id===mirror.id));
    assert.deepEqual(matchingPortfolio(mirrorNode,mismatch),[]);
    const material=vm.runInNewContext('({characteristics:{materialPath:"/materials/clear/clear-crystalvision"},materialColor:"Бесцветный"})');
    assert(matchingPortfolio(showerNode,material).some(project=>project.id===shower.id));
    const crossProjects=vm.runInNewContext('('+JSON.stringify(portfolioExamples)+')');
    const result=validatePortfolioProjects(crossProjects);
    assert(result.valid,result.errors.join('\n'));
    const nullPrototype=Object.assign(Object.create(null),{shape:'Круг'});
    assert(matchingPortfolio(mirrorNode,{characteristics:nullPrototype}).some(project=>project.id===mirror.id));
  });

  check('Unsafe persistent media URLs and invalid records are rejected',()=>{
    const unsafe=['javascript:alert(1)','data:image/svg+xml,<svg/>','blob:https://example.com/id','http://example.com/a.jpg','//example.com/a.jpg','/portfolio/item','/assets/../app.mjs','/assets/%2e%2e/app.mjs','/assets/image%00.webp','/assets/image%3f.webp','https://user:password@example.com/a.jpg'];
    for(const src of unsafe) {
      assert.equal(isPortfolioMediaURL(src),false,src);
      assert.equal(validatePortfolioProjects([{...clone(mirror),cover:{src,caption:''}}]).valid,false,src);
    }
    assert(isPortfolioMediaURL('/assets/interiors/mirror-backlit-round.webp'));
    assert(isPortfolioMediaURL('https://example.com/media/video.mp4?signature=abc'));
    assert.equal(validatePortfolioProjects([{...clone(mirror),id:'../bad'}]).valid,false);
    assert.equal(validatePortfolioProjects([clone(mirror),clone(mirror)]).valid,false);
    assert.equal(validatePortfolioProjects([{...clone(mirror),category:'unknown-category'}]).valid,false);
    assert.equal(validatePortfolioProjects([{...clone(mirror),productPaths:[shower.productPaths[0]]}]).valid,false);
  });

  check('Missing, invalid and inaccessible storage fall back to examples',()=>{
    const expected=ids(portfolioExamples);
    assert.deepEqual(ids(getPortfolioProjects()),expected);
    rawDraft='{invalid json';assert.deepEqual(ids(getPortfolioProjects()),expected);
    rawDraft=JSON.stringify({projects:[]});assert.deepEqual(ids(getPortfolioProjects()),expected);
    rawDraft=JSON.stringify([{id:'incomplete'}]);assert.deepEqual(ids(getPortfolioProjects()),expected);
    storageError=true;assert.deepEqual(ids(getPortfolioProjects()),expected);
  });

  check('A valid empty draft removes public blocks without restoring examples',()=>{
    assert(validatePortfolioProjects([]).valid);
    draft([]);
    assert.deepEqual(getPortfolioProjects(),[]);
    assert.equal(ui.homepage(),'');
    assert.equal(ui.related(mirrorNode),'');
    assert(ui.home().includes('Истории ещё не опубликованы.'));
    assert(ui.detail(mirror.id).includes('Проект не найден'));
  });

  check('A valid draft replaces examples and unpublished items stay private',()=>{
    const published={...clone(mirror),id:'qa-published',title:'Служебный проект для проверки'};
    const hidden={...clone(shower),id:'qa-unpublished',published:false};
    draft([published,hidden]);
    assert.deepEqual(ids(getPortfolioProjects()),['qa-published','qa-unpublished']);
    assert.deepEqual(ids(filterPortfolio()),['qa-published']);
    assert(ui.home().includes('/portfolio/qa-published'));
    assert(!ui.home().includes('/portfolio/qa-unpublished'));
    assert(ui.detail('qa-unpublished').includes('Проект не найден'));
    assert(!ui.home().includes('/portfolio/demo-round-mirror'));
  });

  check('Custom titles, descriptions, captions and review text are HTML-escaped',()=>{
    const injection='<img src=x onerror=alert(1)> & "caption"';
    const project={...clone(mirror),id:'qa-html-escape',title:injection,description:'<script>alert(1)</script>',stages:noStages()};
    project.cover.caption=injection;
    project.stages.after.photos=[{...clone(project.cover),caption:injection}];
    project.stages.review={photos:[],videos:[],text:'<script>review()</script>',author:'<b>author</b>'};
    const result=validatePortfolioProjects([project]);assert(result.valid,result.errors.join('\n'));
    draft(result.projects);
    for(const html of [ui.home(),ui.detail(project.id),ui.homepage()]) {
      assert(!html.includes('<img src=x'));
      assert(!html.includes('<script>'));
      assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    }
    const detail=ui.detail(project.id);
    assert(detail.includes('&lt;script&gt;review()&lt;/script&gt;'));
    assert(detail.includes('&lt;b&gt;author&lt;/b&gt;'));
    assert(detail.includes('data-portfolio-caption="'+esc(injection)+'"'));
  });

  console.log(JSON.stringify({suite:'portfolio',passed:passed.length,examples:portfolioExamples.length,checks:passed},null,2));
} finally {
  if(originalStorageDescriptor)Object.defineProperty(globalThis,'localStorage',originalStorageDescriptor);
  else delete globalThis.localStorage;
}
