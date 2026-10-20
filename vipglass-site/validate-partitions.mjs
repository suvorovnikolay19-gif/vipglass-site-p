/** Partitions expansion regression gates. Runs real app code in Node VM; no browser or layout assertions. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import * as tree from './dist/catalog-tree.mjs';
import * as partitions from './dist/partitions-tree.mjs';
import * as partitionUI from './dist/partitions-ui.mjs';

const baseline = JSON.parse(fs.readFileSync(new URL('./docs/partitions-baseline-v6.json', import.meta.url), 'utf8'));
const source = fs.readFileSync(new URL('./dist/app.mjs', import.meta.url), 'utf8');
const bindings = {};
for (const [, names, relative] of source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)) {
  const module = await import(new URL(relative, new URL('./dist/app.mjs', import.meta.url)));
  for (const binding of names.split(',')) { const [name, alias] = binding.trim().split(/\s+as\s+/); bindings[alias || name] = module[name]; }
}
const elements = new Map(), events = new Map(), saved = new Map(), blobs = new Map(), downloads = [];
const location={pathname:'/',search:'',hash:''};
function setLocation(url){const parsed=new URL(url,'https://audit.invalid');Object.assign(location,{pathname:parsed.pathname,search:parsed.search,hash:parsed.hash});}
const history={pushState(_state,_title,url){setLocation(url);},replaceState(_state,_title,url){setLocation(url);}};
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
  FormData:TestFormData, crypto:{randomUUID}, location, history,
  localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},
  requestAnimationFrame:fn=>fn(), setTimeout:()=>1, clearTimeout(){}, matchMedia:()=>({matches:true}),
  window:{history,addEventListener(){},scrollTo(){},scrollY:0},
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
function dispatch(type,target){let prevented=false;for(const handler of events.get(type)||[])handler({target,preventDefault(){prevented=true;}});return prevented;}
function submit(id,dataset,fields){
  let prevented=false;const controls=new Map();
  const target={id,dataset,fields,querySelector(selector){if(!controls.has(selector))controls.set(selector,{innerHTML:'',hidden:true});return controls.get(selector);}};
  for(const handler of events.get('submit')||[])handler({target,preventDefault(){prevented=true;}});
  assert.ok(prevented,`${id}: native navigation is prevented`);
  return readProject().items.at(-1);
}

// Preserve every old catalogue URL. Non-partition directions retain their exact route sets.
const currentOtherPaths=tree.catalogNodes.filter(n=>n.category!=='partitions').map(n=>n.path).sort();
assert.deepEqual(currentOtherPaths,baseline.catalog.filter(n=>n.category!=='partitions').map(n=>n.path).sort(),'The partition expansion must not replace routes in other directions');
for(const old of baseline.catalog)assert.ok(tree.nodesByPath.has(old.path),`Lost catalogue URL: ${old.path}`);
const oldPartitionRoutes=new Map([...baseline.partitions,...baseline.partitionAliases,...Object.keys(partitions.partitionsPathAliases).map(path=>({path}))].map(node=>[node.path,node]));
// Keep baseline classification metadata when a path is also present in the alias export.
for(const node of baseline.partitions)oldPartitionRoutes.set(node.path,node);
for(const old of oldPartitionRoutes.values()){
  const target=tree.nodesByPath.get(old.path);
  assert.ok(target?.category==='partitions',`${old.path}: resolves to a partition page`);
  if(old.path!=='/catalog/partitions')assert.equal(partitions.partitionsPathAliases[old.path],target.path,`${old.path}: explicit migration alias is exported`);
  if(old.isLeaf&&old.path.includes('-frame'))assert.equal(target.systemId,'framed',`${old.path}: framed construction remains framed`);
  if(old.isLeaf&&old.path.includes('-clear'))assert.equal(target.systemId,'all-glass',`${old.path}: frameless glass remains in the all-glass system`);
  if(old.isLeaf){
    const application=old.path.includes('-meeting')?'meeting':old.preset.application==='Дом'?'home':old.preset.application==='Офис'?'office':null;
    if(application)assert.equal(target.preset.applicationId,application,`${old.path}: migration preserves its application`);
    const opening=String(old.preset.opening||'').toLowerCase();
    const openingId=/телескоп/.test(opening)?'telescopic':/раздвиж/.test(opening)?'sliding':/распаш/.test(opening)?'swing':/стационар/.test(opening)?'fixed':null;
    if(openingId)assert.equal(target.preset.openingId,openingId,`${old.path}: migration preserves its opening mechanism`);
  }
  const oldHTML=render(old.path),canonicalHTML=render(target.path);
  assert.equal(oldHTML,canonicalHTML,`${old.path}: legacy URL renders its canonical destination`);
  render(old.path);
  assert.equal(new URL(element('link[rel=canonical]').href).pathname,target.path,`${old.path}: canonical metadata points to the new destination`);
}
const root=tree.rootById.get('partitions');
const systems=['all-glass','framed','loft','smart'];
assert.deepEqual(root.children.map(n=>n.id),systems,'Three distinct construction systems and SMART have separate first choices');
const partitionNodes=tree.catalogNodes.filter(n=>n.category==='partitions');
const leaves=partitionNodes.filter(n=>n.isLeaf);
assert.ok(leaves.length>baseline.partitions.filter(n=>n.isLeaf).length,'The new catalogue contains additional concrete choices');
const hubHTML=render(root.path),hubCards=anchors(hubHTML).filter(a=>(a.class||'').split(/\s+/).includes('partition-entry-card'));
assert.deepEqual(hubCards.map(a=>a['data-choice-path']),root.children.map(n=>n.path),'All four directions, including Loft and SMART, appear as the first large entry cards');
assert.deepEqual(hubCards.map(a=>a.body.match(/<h2>(.*?)<\/h2>/)?.[1]),['Цельностеклянные','Каркасные','Лофт','SMART'],'Plain direction names are immediately visible');
for(const card of hubCards)assert.match(card.body,/<img\b/,'Every direction has its own photograph');
assert.ok(hubHTML.indexOf('partition-entry-grid')<hubHTML.indexOf('partition-directory'),'All four entrances precede detailed lists and filters');
const hubChoices=anchors(hubHTML).filter(a=>a['data-choice-path']);
assert.deepEqual(hubChoices.map(a=>a['data-choice-path']).sort(),root.children.flatMap(n=>[n.path,...n.children.map(c=>c.path)]).sort(),'Each direction and immediate subtype stays reachable exactly once');
for(const card of hubChoices)assert.match(card.body,/<img\b/,'Detailed partition choice cards also have photographs');
for(const system of root.children){
  assert.ok(system.children.length>=2&&system.children.every(n=>!n.isLeaf),`${system.id}: system contains multiple meaningful branches before final choices`);
  assert.ok(leaves.some(n=>n.ancestors.includes(system.path)),`${system.id}: nonempty final choices`);
  for(const node of partitionNodes.filter(n=>n.ancestors.includes(system.path))){
    assert.equal(node.systemId,system.id,`${node.path}: hierarchy retains its construction system`);
    assert.ok(node.intro?.trim().length>=45,`${node.path}: specific explanatory text is present`);
    assert.doesNotMatch(node.intro,/заглушк|будет дополнен|наполнение предварительное|структура систем предварительная/i,`${node.path}: no unfinished template copy`);
  }
}
for(const node of leaves){
  const p=node.preset;
  assert.equal(p.systemId,node.systemId,`${node.path}: chosen preset agrees with its parent system`);
  for(const key of ['system','applicationId','application','openingId','opening','configuration','glass','glazingId','glazing'])assert.ok(String(p[key]||'').trim(),`${node.path}: ${key} explains the selected configuration`);
  assert.equal(p.thicknessRequestOnly,true,`${node.path}: thickness is a request, not unverified engineering approval`);
  assert.ok(p.thicknessMm===''||(typeof p.thicknessMm==='number'&&p.thicknessMm>0),`${node.path}: numeric thickness or explicit custom request`);
  assert.doesNotMatch([node.title,node.intro,p.glass,p.glazing].join(' '),/стеклопакет|\bIGU\b|(?:^|\s)(?:МДФ|ДСП|ГКЛ)(?=\s|$)|гипсокартон/iu,`${node.path}: the glass system does not become insulated glazing or an opaque infill product`);
  if(node.systemId==='smart'){
    assert.equal(p.smartTechnologyId,'laminated-pdlc',`${node.path}: SMART uses an integrated PDLC layer`);
    assert.doesNotMatch([p.smartTechnologyId,p.glassTreatmentId,node.title,p.glass].join(' '),/applied|smart-film|self-adhesive|самокле|наклеива|пл[её]нк[^.]{0,35}существующ/i,`${node.path}: applied SMART film is not offered`);
  }
}
for(const node of bindings.resourceNodes.filter(n=>n.isLeaf)){
  const identity=[node.id,node.title,...Object.values(node.properties||{})].join(' ');
  if(/smart|pdlc|переключаем/i.test(identity))assert.doesNotMatch(identity,/applied|smart-film|self-adhesive|самокле|наклеива|пл[её]нк[^.]{0,35}существующ/i,`${node.path}: applied SMART film is not offered as a material or service`);
}

// Every catalogue page provides direct movement to all main directions.
let navigationPages=0;
const rendered=new Map();
for(const node of tree.catalogNodes){
  const html=render(node.path);
  rendered.set(node.path,html);
  const navigations=[...html.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/g)].filter(([,raw])=>(attributes(raw).class||'').split(/\s+/).includes('catalog-direction-nav'));
  assert.equal(navigations.length,1,`${node.path}: one direction navigation`);
  const links=anchors(navigations[0][2]);
  for(const direction of tree.catalogRoots)assert.equal(links.filter(a=>a.href?.replace(/^#/,'')===direction.path).length,1,`${node.path}: direct link to ${direction.path}`);
  for(const link of links)if(link.href?.replace(/^#/,'').startsWith('/catalog/'))assert.ok(tree.nodesByPath.has(link.href.replace(/^#/,'')),`${node.path}: direction link resolves`);
  navigationPages++;
}

// Query facets keep their intersection and their typed values through real events.
const filterFields={system:'systemId',application:'applicationId',opening:'openingId',glazing:'glazingId',color:'materialColorId',treatment:'glassTreatmentId',decor:'decorId',blinds:'blindsId',thickness:'thicknessMm'};
const ids=nodes=>nodes.map(n=>n.path).sort();
const allIds=ids(partitionUI.partitionModels);
assert.deepEqual(allIds,ids(leaves),'Every final partition choice participates in the filter catalogue');
const results=html=>anchors(html).filter(a=>a['data-choice-path']).map(a=>a['data-choice-path']);
const total=html=>Number(html.match(/\bdata-partitions-result-count="(\d+)"/)?.[1]);
const pickerHTML=render('/catalog/partitions?pick=1');
assert.deepEqual(partitionUI.partitionFacetDefs.map(f=>f.id).sort(),Object.keys(filterFields).filter(key=>key!=='thickness').sort(),'All agreed classification facets are exposed');
for(const facet of partitionUI.partitionFacetDefs){
  const select=[...pickerHTML.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)].find(([,raw])=>attributes(raw).name===facet.id)?.[2];
  assert.ok(select,`${facet.id}: visible filter control`);
  assert.deepEqual(tags(select,'option').map(o=>o.value).filter(Boolean).sort(),facet.options.map(o=>o.id).sort(),`${facet.id}: dynamic choices match the expanded models`);
}
let filterCases=0;
for(const system of systems){
  const sample=leaves.find(n=>n.systemId===system&&typeof n.preset.thicknessMm==='number')||leaves.find(n=>n.systemId===system);
  const fields={pick:'1',...Object.fromEntries(Object.entries(filterFields).map(([key,preset])=>[key,String(sample.preset[preset]??'')])),q:sample.title};
  const params=new URLSearchParams(Object.entries(fields).filter(([,v])=>v));
  const expected=[...params].filter(([key])=>key!=='pick').reduce((current,[key,value])=>{
    const matching=new Set(ids(partitionUI.filterPartitionModels(new URLSearchParams({[key]:value}))));
    return current.filter(path=>matching.has(path));
  },allIds);
  assert.ok(expected.includes(sample.path),`${system}: combined filters retain the selected model`);
  assert.deepEqual(ids(partitionUI.filterPartitionModels(params)),expected,`${system}: all selected facets and query combine with AND`);
  const html=render('/catalog/partitions?'+params);
  assert.equal(total(html),expected.length,`${system}: total count includes the complete matching selection`);
  assert.deepEqual(results(html).sort(),partitionUI.filterPartitionModels(params).slice(0,24).map(n=>n.path).sort(),`${system}: rendered cards retain the combined result`);
  const form={id:'partitions-filter-form',dataset:{},fields};
  assert.ok(dispatch('submit',form));
  assert.equal(location.pathname,'/catalog/partitions');assert.equal(location.hash,'');
  for(const [key,value] of params)assert.equal(new URLSearchParams(location.search).get(key),value,`${system}: submitted ${key} is retained`);
  dispatch('change',{tagName:'SELECT',closest:selector=>selector==='#partitions-filter-form'?form:null});
  for(const [key,value] of params)assert.equal(new URLSearchParams(location.search).get(key),value,`${system}: changing a facet preserves ${key}`);
  filterCases++;
}

// Pagination never hides the total or loses a final choice between result pages.
const pages=Math.ceil(partitionUI.partitionModels.length/24),seen=new Set();
for(let page=1;page<=pages;page++){
  const html=render('/catalog/partitions?pick=1&page='+page),cards=results(html);
  assert.equal(total(html),partitionUI.partitionModels.length,`Page ${page}: full total is retained`);
  assert.equal(cards.length,Math.min(24,partitionUI.partitionModels.length-(page-1)*24),`Page ${page}: bounded page size`);
  for(const path of cards){assert.ok(!seen.has(path),`Result repeated between pages: ${path}`);seen.add(path);}
}
assert.deepEqual([...seen].sort(),allIds,'All filtered choices are reachable through pagination');
const emptyResults=render('/catalog/partitions?pick=1&system=unsupported-audit-system');
assert.equal(total(emptyResults),0,'An unknown facet value gives an empty result, not a fallback to all models');
assert.deepEqual(results(emptyResults),[],'No unrelated model is offered for an unavailable filter combination');

// A requested sheet thickness remains numeric in the project and exports.
for(const node of leaves.filter(n=>n.preset.glassTreatmentId.startsWith('laminated')||n.modelKind==='privacy-option')){
  assert.ok(!tags(rendered.get(node.path),'input').some(i=>i.name==='partition-thickness'),`${node.path}: a multilayer or privacy specification is not reduced to one sheet-thickness input`);
}
const thicknessCandidates=leaves.filter(n=>tags(rendered.get(n.path),'input').some(i=>i.name==='partition-thickness'));
const fixed=thicknessCandidates.find(n=>typeof n.preset.thicknessMm==='number'&&n.preset.thicknessMm>0);
const custom=thicknessCandidates.find(n=>n.preset.thicknessMm==='');
assert.ok(fixed&&custom,'Preset and custom sheet thickness can both be requested');
for(const node of [fixed,custom]){
  const input=tags(rendered.get(node.path),'input').find(i=>i.name==='partition-thickness');
  assert.equal(input.type,'number',`${node.path}: sheet thickness input is numeric`);
  const thickness=node===fixed?node.preset.thicknessMm:9.5;
  if(node===fixed){assert.equal(Number(input.value),thickness);assert.match(input.raw,/\breadonly\b/);}
  else assert.doesNotMatch(input.raw,/\breadonly\b/);
  const original=JSON.stringify(node.preset);
  const item=submit('config-form',{node:node.path,solution:node.solutionId},{mode:'installation',width:'2400',height:'2700',quantity:'1',finish:'',note:'Толщина указана как пожелание.','partition-thickness':String(thickness)});
  assert.equal(item.catalogPath,node.path);assert.equal(item.thicknessMm,thickness);assert.equal(item.preset.thicknessMm,thickness);
  assert.ok(item.note.includes('Толщина листа')&&item.note.includes(String(thickness)),`${node.path}: note preserves the sheet thickness`);
  assert.equal(JSON.stringify(node.preset),original,'Submission does not mutate catalogue defaults');
}
const project=readProject();
assert.deepEqual(JSON.parse(saved.get('vipglass-project-v1')).items,project.items,'Partition choices and numeric thickness persist');
context.exportButton={innerHTML:'Скачать',disabled:false};
await vm.runInContext('exportProject(exportButton,false)',context);
assert.equal(downloads.at(-1).name,'VIP-Glass-project.txt');
const exportedText=await downloads.at(-1).blob.text();
for(const item of project.items)assert.ok(exportedText.includes(item.title)&&exportedText.includes(item.note.replace(/\n/g,'\n   ')),'TXT preserves the selected model and thickness note');
await vm.runInContext('exportProject(exportButton,true)',context);
const bytes=new Uint8Array(await downloads.at(-1).blob.arrayBuffer()),view=new DataView(bytes.buffer),entries=new Map();
let offset=0;
while(view.getUint32(offset,true)===0x04034b50){
  assert.equal(view.getUint16(offset+8,true),0);
  const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),start=offset+30+nameLength+extraLength;
  entries.set(new TextDecoder().decode(bytes.subarray(offset+30,offset+30+nameLength)),new TextDecoder().decode(bytes.subarray(start,start+size)));offset=start+size;
}
assert.deepEqual(JSON.parse(entries.get('project.json')).items,project.items,'ZIP JSON preserves numeric sheet thickness and selected presets');
assert.equal(entries.get('Задание VIP Glass.txt'),exportedText);
console.log(JSON.stringify({result:'PASS',oldPartitionURLs:baseline.partitions.length,migrationURLs:oldPartitionRoutes.size,otherCategoryURLs:currentOtherPaths.length,partitionPages:partitionNodes.length,finalChoices:leaves.length,systems,globalNavigationPages:navigationPages,filterCases,resultPages:pages,thicknessSubmissions:project.items.length,scope:'Actual app router, events, generated markup, persistence and TXT/ZIP export. No browser or visual assertions.'},null,2));
