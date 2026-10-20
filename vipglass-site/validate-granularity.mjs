/** Regression gates for the expanded catalogue. Node VM only; no browser/layout assertions. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import * as tree from './dist/catalog-tree.mjs';
import * as resources from './dist/resource-catalog.mjs';
import {retiredHardwareRoutes} from './dist/project-state.mjs';

const baseline = JSON.parse(fs.readFileSync(new URL('./docs/catalog-baseline-v5.json', import.meta.url), 'utf8'));
const source = fs.readFileSync(new URL('./dist/app.mjs', import.meta.url), 'utf8');
const bindings = {};
for (const [, names, relative] of source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)) {
  const module = await import(new URL(relative, new URL('./dist/app.mjs', import.meta.url)));
  for (const binding of names.split(',')) { const [name, alias] = binding.trim().split(/\s+as\s+/); bindings[alias || name] = module[name]; }
}
const elements = new Map(), events = new Map(), saved = new Map(), blobs = new Map(), downloads = [];
const element = selector => {
  if (!elements.has(selector)) elements.set(selector, { innerHTML:'', textContent:'', value:'', disabled:false, hidden:false,
    classList:{add(){},remove(){}}, focus(){}, close(){}, showModal(){} });
  return elements.get(selector);
};
class TestFormData {
  constructor(form) { this.fields = form.fields || {}; }
  get(name) { return this.fields[name] ?? null; }
  *[Symbol.iterator]() { yield* Object.entries(this.fields); }
}
const context = vm.createContext({ ...bindings, console, URLSearchParams, Blob, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, DataView,
  FormData:TestFormData, crypto:{randomUUID}, location:{pathname:'/',search:'',hash:''},
  localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},
  requestAnimationFrame:fn=>fn(), setTimeout:()=>1, clearTimeout(){}, matchMedia:()=>({matches:true}),
  window:{addEventListener(){},scrollTo(){},scrollY:0},
  URL:{createObjectURL(blob){const id='blob:'+randomUUID();blobs.set(id,blob);return id;},revokeObjectURL(){}},
  document:{title:'',querySelector:selector=>selector.startsWith('[')?null:element(selector),querySelectorAll:()=>[],getElementById:id=>element('#'+id),body:{append(){}},
    addEventListener(type,handler){if(!events.has(type))events.set(type,[]);events.get(type).push(handler);},
    createElement(tag){assert.equal(tag,'a');return {href:'',download:'',remove(){},click(){downloads.push({name:this.download,blob:blobs.get(this.href)});}};},
  },
});
vm.runInContext(source.replace(/^import\s+.*?;\s*$/gm,''),context,{filename:'dist/app.mjs',timeout:5_000});
const attributes = raw => Object.fromEntries([...raw.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(([,k,,v])=>[k,v]));
const tags = (html,tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`,'g'))].map(([,raw])=>({...attributes(raw),raw}));
const anchors = html => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,raw,body])=>({...attributes(raw),raw,body}));
const render = path => {
  const url=new URL(path.replace(/^#/,''),'https://audit.invalid');
  Object.assign(context.location,{pathname:url.pathname,search:url.search,hash:''});
  vm.runInContext('render({scroll:false})',context,{timeout:5_000});
  const html=element('#main').innerHTML;
  assert.ok(html && !html.includes('СТРАНИЦА НЕ НАЙДЕНА'),`${path}: must resolve through the actual router`);
  return html;
};
const readProject=()=>JSON.parse(vm.runInContext('JSON.stringify(project)',context));
function submit(id,dataset,fields){
  let prevented=false;const controls=new Map();
  const target={id,dataset,fields,querySelector(selector){if(!controls.has(selector))controls.set(selector,{innerHTML:'',hidden:true});return controls.get(selector);}};
  for(const handler of events.get('submit')||[])handler({target,preventDefault(){prevented=true;}});
  assert.ok(prevented,`${id}: native navigation is prevented`);
  return readProject().items.at(-1);
}

// Every old URL is a concrete route, including old leaves that are now branches.
for(const old of baseline.catalog){assert.ok(tree.nodesByPath.has(old.path),`Lost catalogue URL: ${old.path}`);render(old.path);}
for(const old of baseline.resources){assert.ok(resources.resourceByPath.has(old.path),`Lost resource URL: ${old.path}`);render(old.path);}
for(const old of baseline.hardware){
  if(retiredHardwareRoutes['/hardware/item/'+old.id]) {
    assert.equal(retiredHardwareRoutes['/hardware/item/'+old.id],'/catalog/mirrors');
    assert(!resources.hardwareById.has(old.id),'Mirror fittings must stay removed');
    const html=render('/hardware/item/'+old.id);
    assert(html.includes('Зеркала')&&!html.includes('hardware-choice-form'),'Old fittings return to the mirror catalogue');
    continue;
  }
  const current=resources.hardwareById.get(old.id);assert.ok(current,`Lost hardware ID: ${old.id}`);render(current.path);
  for(const finish of old.finishes)assert.ok(current.finishes.some(f=>f.id===finish.id),`${old.id}: lost supported finish ${finish.id}`);
}
const requiredProcesses=['production-cutting','production-drilling','production-countersinking','production-grooves','production-grinding','production-polishing','production-bevel'];
assert.ok(resources.servicesRoot.children.length>=27,'Production exposes individual processes rather than the old six groups');
for(const id of requiredProcesses){
  const node=resources.servicesRoot.children.find(n=>n.id===id);
  assert.ok(node && node.path==='/production/'+id,`${id}: must be its own directly addressable production process`);
}

// Find links hidden by HTML containers (closed details, hidden, aria-hidden).
function concealedChoicePaths(html,attribute){
  const stack=[],hidden=new Set(),voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for(const [,closing,tagName,raw] of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)){
    const tag=tagName.toLowerCase();
    if(closing){const index=stack.map(n=>n.tag).lastIndexOf(tag);if(index>=0)stack.splice(index);continue;}
    const attrs=attributes(raw),isHidden=stack.some(n=>n.hidden)||/(?:^|\s)hidden(?:\s|=|$)/.test(raw)||attrs['aria-hidden']==='true'||tag==='details'&&!/(?:^|\s)open(?:\s|=|$)/.test(raw);
    if(tag==='a'&&attrs[attribute]&&isHidden)hidden.add(attrs[attribute]);
    if(!voidTags.has(tag)&&!raw.trim().endsWith('/'))stack.push({tag,hidden:isHidden});
  }
  return hidden;
}
let visibleDirectoryChoices=0;
for(const node of [...tree.catalogNodes,...resources.resourceNodes].filter(n=>!n.isLeaf)){
  const html=render(node.path),attribute=node.kind==='service'||node.kind==='material'?'data-resource-path':'data-choice-path';
  const cards=anchors(html).filter(a=>a[attribute]),hidden=concealedChoicePaths(html,attribute);
  const required=[...node.children,...node.children.flatMap(child=>child.children)];
  for(const child of required){
    const matching=cards.filter(a=>a[attribute]===child.path&&a.href.replace(/^#/,'')===child.path);
    assert.ok(matching.length,`${node.path}: missing visible child/subtype ${child.path}`);
    const isPartitionHub=node.path==='/catalog/partitions';
    // Four immediate systems are always visible; secondary hub lists are explicitly expandable.
    if(!isPartitionHub||child.depth===2)assert.ok(!hidden.has(child.path),`${node.path}: ${child.path} is hidden in a collapsed container`);
    assert.ok(matching.some(a=>/<h[23]\b/.test(a.body)||isPartitionHub&&/<strong>[^<]+<\/strong>/.test(a.body)),`${node.path}: ${child.path} needs a titled full link`);
    visibleDirectoryChoices++;
  }
}
for(const material of resources.materialLeaves){
  const identity=[material.title,material.properties?.color].join(' ');
  assert.ok(!(/бронз/i.test(identity)&&/графит/i.test(identity)),`${material.path}: bronze and graphite must be separate final choices`);
}

// Every hardware type has an application-specific route and contains only its own items.
// Mirror-only frame/lighting types were explicitly removed from the offer.
const requiredHardwareTypes=['hinge','handle','connector','clamp','support-bar','slider','profile','holder','standoff','handrail','seal','canopy','canopy-rod'];
assert.deepEqual([...new Set(resources.hardware.map(h=>h.type))].sort(),requiredHardwareTypes.sort(),'Every applied hardware type is independently classified; mirror-only types stay removed');
for(const type of resources.hardwareTypePages){
  const html=render(type.path),cards=anchors(html).filter(a=>(a.class||'').split(/\s+/).includes('hardware-card'));
  assert.deepEqual(cards.map(a=>a.href.split('?')[0].replace(/^#/,'' )).sort(),type.children.map(n=>n.path).sort(),`${type.path}: exact applicable hardware items`);
  assert.ok(!html.includes('id="config-form"')&&!html.includes('id="resource-form"'),`${type.path}: hardware does not become a standalone order`);
}

const widths=[5,10,15,20,25,30,35,40];
const bevelLeaves=resources.serviceLeaves.filter(n=>n.properties?.bevelWidth);
for(const geometry of ['Прямолинейный','Криволинейный']){
  const leaves=bevelLeaves.filter(n=>n.properties.bevelGeometry===geometry);
  assert.deepEqual(leaves.map(n=>Number.parseFloat(n.properties.bevelWidth)).filter(Number.isFinite).sort((a,b)=>a-b),widths,`${geometry}: all numeric width choices`);
  assert.ok(leaves.some(n=>!Number.isFinite(Number.parseFloat(n.properties.bevelWidth))),`${geometry}: custom width choice`);
}
for(const node of bevelLeaves){
  const html=render(node.path),input=tags(html,'input').find(i=>i.name==='resource-bevel-width');
  assert.equal(input?.type,'number',`${node.path}: bevel width is a numeric input`);
  const preset=Number.parseFloat(node.properties.bevelWidth);
  if(Number.isFinite(preset)){assert.equal(Number(input.value),preset);assert.match(input.raw,/\breadonly\b/);}
  else{assert.equal(input.value,'');assert.match(input.raw,/\brequired\b/);}
}

const material=resources.materialLeaves.find(n=>n.properties?.base==='CrystalVision');
const resourceCases=bevelLeaves.filter(n=>n.properties.bevelGeometry==='Прямолинейный');
resourceCases.push(bevelLeaves.find(n=>n.properties.bevelGeometry==='Криволинейный'&&!Number.isFinite(Number.parseFloat(n.properties.bevelWidth))));
for(const node of resourceCases){
  const width=Number.parseFloat(node.properties.bevelWidth)||(node.properties.bevelGeometry==='Криволинейный'?22.5:17.5);
  const item=submit('resource-form',{resource:node.path},{title:node.title,'resource-width':'900','resource-height':'1200','resource-quantity':'2','resource-thickness':'8 мм','resource-material':material.path,'resource-bevel-width':String(width),note:'Ширина задана в миллиметрах.'});
  assert.equal(item.resourcePath,node.path);assert.equal(item.bevelWidthMm,width);
  assert.ok(item.note.includes(`Ширина фацета: ${width} мм`),'Resource note preserves the exact numerical bevel width');
}
const catalogBevel=tree.catalogNodes.filter(n=>n.isLeaf&&Object.hasOwn(n.preset||{},'bevelWidthMm'));
const catalogCases=[catalogBevel.find(n=>n.preset.bevelWidthMm===20),catalogBevel.find(n=>n.preset.bevelWidthMm==='')];
assert.ok(catalogCases.every(Boolean),'Catalogue offers preset and custom bevel widths');
for(const node of catalogCases){
  const before=JSON.stringify(node.preset),html=render(node.path),input=tags(html,'input').find(i=>i.name==='bevel-width');
  assert.equal(input?.type,'number',`${node.path}: construction bevel width is numeric`);
  const width=node.preset.bevelWidthMm||18.5;
  const item=submit('config-form',{node:node.path,solution:node.solutionId},{mode:'installation',width:'900',height:'1200',quantity:'1',finish:'',note:'Фацет для панно.','bevel-width':String(width)});
  assert.equal(item.bevelWidthMm,width);assert.equal(item.preset.bevelWidthMm,width);assert.equal(item.preset.bevelWidth,`${width} мм`);
  assert.ok(item.note.includes(`Ширина фацета: ${width} мм`));
  assert.equal(JSON.stringify(node.preset),before,'Submitting a custom width must not mutate catalogue defaults');
}
const project=readProject();
assert.deepEqual(JSON.parse(saved.get('vipglass-project-v1')).items,project.items,'Numeric widths persist');
context.exportButton={innerHTML:'Скачать',disabled:false};
await vm.runInContext('exportProject(exportButton,false)',context);
assert.equal(downloads.at(-1).name,'VIP-Glass-project.txt');
const text=await downloads.at(-1).blob.text();
for(const item of project.items)assert.ok(text.includes(`Ширина фацета: ${item.bevelWidthMm} мм`),'TXT exports the exact width');
await vm.runInContext('exportProject(exportButton,true)',context);
const bytes=new Uint8Array(await downloads.at(-1).blob.arrayBuffer()),view=new DataView(bytes.buffer),entries=new Map();
let offset=0;
while(view.getUint32(offset,true)===0x04034b50){
  assert.equal(view.getUint16(offset+8,true),0);
  const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),start=offset+30+nameLength+extraLength;
  entries.set(new TextDecoder().decode(bytes.subarray(offset+30,offset+30+nameLength)),new TextDecoder().decode(bytes.subarray(start,start+size)));offset=start+size;
}
assert.deepEqual(JSON.parse(entries.get('project.json')).items,project.items,'ZIP JSON preserves numeric widths and selected presets');
assert.equal(entries.get('Задание VIP Glass.txt'),text);
console.log(JSON.stringify({result:'PASS',oldCatalogueURLs:baseline.catalog.length,oldResourceURLs:baseline.resources.length,oldServiceLeafURLs:baseline.resources.filter(n=>n.kind==='service'&&n.isLeaf).length,oldHardwareIDs:baseline.hardware.length,productionProcesses:resources.servicesRoot.children.length,visibleDirectoryChoices,hardwareTypePages:resources.hardwareTypePages.length,bevelVariants:bevelLeaves.length,bevelSubmissions:project.items.length,scope:'Actual VM router, visible HTML structure, forms, persistence and exports; no browser or visual layout assertions.'},null,2));
