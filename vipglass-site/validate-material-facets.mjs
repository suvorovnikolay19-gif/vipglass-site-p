/** Browser-free checks of real material facets and rendered resource cards.
 * Run: node validate-material-facets.mjs. Uses only Node built-ins.
 */
import assert from 'node:assert/strict';
import {
 materialsRoot,materialNodes,materialLeaves,servicesRoot,serviceLeaves,resourceByPath,
 materialFacetDefinitions,getMaterialFacets,normalizeMaterialFilterParams,
 getMaterialFilterConflict,filterMaterials,escapeResource,hardware,filterHardware,
} from './dist/resource-catalog.mjs';
import {createResourceUI} from './dist/resource-ui.mjs';

const params=value=>new URLSearchParams(value);
const keys=materialFacetDefinitions.map(f=>f.key);
const families=materialsRoot.children.map(n=>n.id);
const values=key=>[...new Set(materialLeaves.map(n=>n.properties[key]))];
const properties=p=>params([...p].filter(([k])=>keys.includes(k)));
const exact=p=>materialLeaves.filter(n=>(!p.get('family')||n.family===p.get('family'))&&
 (!p.get('transparency')||n.properties.transparency===p.get('transparency'))&&
 (!p.get('color')||n.properties.color===p.get('color')));
const paths=nodes=>nodes.map(n=>n.path).sort();
const ui=createResourceUI({
 esc:escapeResource,
 btn:(label,url,kind='')=>`<a class="btn ${kind}" href="${escapeResource(url)}">${escapeResource(label)}</a>`,
 crumb:entries=>`<nav>${entries.map(([title,url])=>url?`<a href="${escapeResource(url)}">${escapeResource(title)}</a>`:escapeResource(title)).join(' / ')}</nav>`,
 field:()=>'',
});

// The screenshot's exact conflict stays empty under AND until the user acts.
const screenshot=params({family:'textured',transparency:'Непрозрачное'});
assert.equal(filterMaterials(screenshot).length,0);
assert.deepEqual(paths(filterMaterials(params({family:'textured'}))),paths(materialLeaves.filter(n=>n.family==='textured')));
const screenshotState=getMaterialFacets(params({family:'textured'}));
const opaque=screenshotState.transparency.find(v=>v.value==='Непрозрачное');
assert.equal(opaque.count,0);assert.equal(opaque.disabled,true);
const diffuse=screenshotState.transparency.find(v=>v.value==='Светорассеивающее');
assert.equal(diffuse.count,materialLeaves.filter(n=>n.family==='textured').length);
assert.equal(diffuse.disabled,false);
const original=screenshot.toString();
const conflict=getMaterialFilterConflict(screenshot);
assert(conflict);assert.match(conflict.reason,/Светорассеивающее/);
assert.equal(conflict.recovery.get('family'),'textured');
assert.equal(conflict.recovery.has('transparency'),false);
assert(filterMaterials(conflict.recovery).length>0);
assert.equal(screenshot.toString(),original);
assert.equal(normalizeMaterialFilterParams(screenshot).toString(),original,'Reading/submitting a URL must not silently broaden AND');
const conflictHTML=ui.page(materialsRoot,screenshot);
assert.match(conflictHTML,/material-filter-conflict/);
assert.match(conflictHTML,/Сбросить конфликтующие свойства/);
assert.match(conflictHTML,/<option[^>]*value="Непрозрачное"[^>]*selected[^>]*>/);
const selectedOpaque=conflictHTML.match(/<option[^>]*value="Непрозрачное"[^>]*>/)[0];
assert(!/\bdisabled\b/.test(selectedOpaque),'Keep a conflicting selected URL value in FormData until an explicit action');
assert(!/data-resource-path=/.test(conflictHTML),'No unrelated cards are injected to hide the empty result');

// Changing family removes only incompatible properties; the typed search and
// unrelated parameters survive, even when that search has no match.
const familyChange=params({family:'textured',transparency:'Непрозрачное',color:'Бронза',q:'неизвестный-запрос-98125',keep:'yes'});
const normalized=normalizeMaterialFilterParams(familyChange,'family');
assert.equal(normalized.get('family'),'textured');
assert.equal(normalized.get('color'),'Бронза');
assert.equal(normalized.has('transparency'),false);
assert.equal(normalized.get('q'),familyChange.get('q'));
assert.equal(normalized.get('keep'),'yes');
assert.equal(familyChange.get('transparency'),'Непрозрачное');
assert(filterMaterials(properties(normalized)).length>0);
assert.equal(filterMaterials(normalized).length,0,'A search miss is not a reason to fake results');
const queryHTML=ui.page(materialsRoot,normalized);
assert.match(queryHTML,/material-search-empty/);assert.match(queryHTML,/Убрать поисковый запрос/);
assert(!/material-filter-conflict/.test(queryHTML));

// Check every real property intersection, including combinations absent from
// the catalogue. Normalization must retain the largest compatible subset.
let combinations=0,facetChecks=0;
for(const family of families)for(const transparency of ['',...values('transparency')])for(const color of ['',...values('color')]){
 const p=params({family,transparency,color});
 assert.deepEqual(paths(filterMaterials(p)),paths(exact(p)),'Filtering retains strict AND semantics');
 const before=p.toString(),next=normalizeMaterialFilterParams(p,'family');
 assert.equal(p.toString(),before);assert.equal(next.get('family'),family);
 assert(exact(next).length>0,`Family change cannot trap the user: ${p}`);
 const retained=['transparency','color'].filter(k=>p.get(k)&&next.get(k)===p.get(k)).length;
 const candidates=[params({family}),params({family,transparency}),params({family,color}),p];
 const maximum=Math.max(...candidates.filter(c=>exact(c).length).map(c=>['transparency','color'].filter(k=>c.get(k)).length));
 assert.equal(retained,maximum,`Only incompatible selections are reset: ${p}`);
 if(exact(p).length)assert.equal(next.toString(),p.toString(),'Valid selections remain unchanged');
 const facets=getMaterialFacets(p);
 for(const key of keys)for(const entry of facets[key]){
  const test=key==='family'?new URLSearchParams():properties(p);test.delete(key);if(entry.value)test.set(key,entry.value);
  assert.equal(entry.count,exact(test).length,`${key}/${entry.value}: actual catalogue count`);
  assert.equal(entry.disabled,Boolean(entry.value)&&entry.count===0&&!entry.selected);
  if(entry.value&&entry.disabled)assert.equal(exact(test).length,0);
  facetChecks++;
 }
 combinations++;
}

// Changing a secondary facet preserves the family and the deliberate choice.
const secondary=normalizeMaterialFilterParams(params({family:'laminated',transparency:'Светорассеивающее',color:'Бронза',q:'триплекс'}),'transparency');
assert.equal(secondary.get('family'),'laminated');assert.equal(secondary.get('transparency'),'Светорассеивающее');
assert.equal(secondary.has('color'),false);assert.equal(secondary.get('q'),'триплекс');
assert.deepEqual(getMaterialFacets(params({family:'textured'})),getMaterialFacets(params({family:'textured',q:'no-match-12345'})),'Search text does not lock property selectors');
for(const bad of [{family:'missing-family'},{family:'textured',transparency:'missing-value'},{transparency:'Непрозрачное',color:'Бронза'}]){
 const p=params(bad),state=getMaterialFilterConflict(p);
 assert(state);assert.equal(filterMaterials(p).length,0);assert(filterMaterials(properties(state.recovery)).length>0);
 const html=ui.page(materialsRoot,p);assert.match(html,/material-filter-conflict/);
 for(const value of Object.values(bad))assert(html.includes(escapeResource(value)),'The requested unavailable value remains visible');
}

// Every material choice keeps its own large image and title, even when several
// variants share an image key. No family or canonical route is removed.
let photoCards=0;
for(const node of materialNodes){
 const html=ui.page(node,new URLSearchParams());
 for(const [,path,body] of html.matchAll(/<a\b[^>]*data-resource-path="(\/materials[^\"]*)"[^>]*>([\s\S]*?)<\/a>/g)){
  assert(resourceByPath.has(path),path);
  assert.match(body,/<img\b/,path+' needs an image');
  assert.match(body,/<h[23]\b/,path+' needs its own title');
  photoCards++;
 }
 if(!node.isLeaf)for(const child of node.children)assert(html.includes(`data-resource-path="${child.path}"`),child.path+' remains reachable');
}
const repeated=materialLeaves.filter(n=>n.family==='curved');
assert(repeated.length>1);
const repeatedHTML=ui.grid(repeated,materialsRoot);
assert.equal((repeatedHTML.match(/class="choice-photo"/g)||[]).length,repeated.length);
assert(!repeatedHTML.includes('variant-choice-layout'));
assert.match(ui.card(repeated[0],0,false),/class="choice-photo"/);
assert.match(ui.card(serviceLeaves[0],0,false),/class="choice-photo"/,'Every service choice also retains its image');
assert(servicesRoot.children.every(n=>resourceByPath.get(n.path)===n));
for(const type of new Set(hardware.map(n=>n.type))){
 assert.deepEqual(filterHardware('',params({type})).map(n=>n.id).sort(),hardware.filter(n=>n.type===type).map(n=>n.id).sort());
}
console.log(JSON.stringify({result:'PASS',families:families.length,materials:materialLeaves.length,combinations,facetChecks,photoCards,screenshotRecovery:filterMaterials(conflict.recovery).length}));
