/** Browser-free integration checks of the real resource router, forms and exports.
 * Run: node validate-resources.mjs. This does not assert visual layout or native validation.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import * as catalogue from './dist/catalog.mjs';
import * as tree from './dist/catalog-tree.mjs';
import * as helpers from './dist/project-utils.mjs';
import * as media from './dist/catalog-media.mjs';
import * as resources from './dist/resource-catalog.mjs';
import { createCatalogUI } from './dist/catalog-ui.mjs';
import { createResourceUI } from './dist/resource-ui.mjs';
import { createHardwareUI } from './dist/hardware-ui.mjs';
import * as showers from './dist/shower-ui.mjs';

const rawSource = fs.readFileSync(new URL('./dist/app.mjs', import.meta.url), 'utf8');
const appBindings = {};
for (const [, names, relative] of rawSource.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)) {
  const imported = await import(new URL(relative, new URL('./dist/app.mjs', import.meta.url)));
  for (const binding of names.split(',')) {
    const [name, alias] = binding.trim().split(/\s+as\s+/);
    appBindings[alias || name] = imported[name];
  }
}

const elements = new Map(), events = new Map(), windowEvents = new Map(), saved = new Map(), downloads = [], blobs = new Map();
const location = { hash: '', pathname: '/', search: '' };
const historyEntries = ['/'];
let historyIndex = 0;
function setLocation(url) {
  const parsed = new URL(url, 'https://audit.invalid');
  Object.assign(location, { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash });
}
function emitWindow(type) { for (const handler of windowEvents.get(type) || []) handler({ type }); }
const browserHistory = {
  pushState(_state, _title, url) { historyEntries.splice(historyIndex+1); historyEntries.push(url); historyIndex++; setLocation(url); },
  replaceState(_state, _title, url) { historyEntries[historyIndex] = url; setLocation(url); },
  back() { if (historyIndex > 0) { setLocation(historyEntries[--historyIndex]); emitWindow('popstate'); } },
  forward() { if (historyIndex+1 < historyEntries.length) { setLocation(historyEntries[++historyIndex]); emitWindow('popstate'); } },
};
let objectUrlCounter = 0;
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    innerHTML: '', textContent: '', value: '', disabled: false, hidden: false,
    classList: { add() {}, remove() {}, toggle() {} }, focus() {}, close() {}, showModal() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
  });
  return elements.get(selector);
}
class TestFormData {
  constructor(form) { this.fields = form.fields || {}; }
  get(name) { return Object.hasOwn(this.fields, name) ? this.fields[name] : null; }
  *[Symbol.iterator]() { yield* Object.entries(this.fields); }
}
const context = vm.createContext({
  ...catalogue, ...tree, ...helpers, ...media, ...resources,
  createCatalogUI, createResourceUI, createHardwareUI,
  ...appBindings,
  console, URLSearchParams, Blob, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, DataView,
  crypto: { randomUUID }, FormData: TestFormData,
  location,
  localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
  requestAnimationFrame: callback => callback(), setTimeout: () => 1, clearTimeout() {},
  matchMedia: () => ({ matches: true }),
  URL: { createObjectURL(blob) { const id = `blob:test-${++objectUrlCounter}`; blobs.set(id, blob); return id; }, revokeObjectURL() {} },
  history: browserHistory,
  window: { history: browserHistory, addEventListener(type, handler) { if (!windowEvents.has(type)) windowEvents.set(type, []); windowEvents.get(type).push(handler); }, scrollTo() {}, scrollY: 0 },
  document: {
    title: '', querySelector: selector => selector.startsWith('[') ? null : element(selector), querySelectorAll: () => [], getElementById: id => element('#'+id),
    addEventListener(type, handler) { if (!events.has(type)) events.set(type, []); events.get(type).push(handler); },
    body: { append() {} },
    createElement(tag) {
      assert.equal(tag, 'a');
      return { href: '', download: '', remove() {}, click() { downloads.push({ name: this.download, blob: blobs.get(this.href) }); } };
    },
  },
});
const source = rawSource.replace(/^import\s+.*?;\s*$/gm, '');
assert.ok(!/^import\s/m.test(source), 'Unhandled app import in VM harness');
vm.runInContext(source, context, { filename: 'dist/app.mjs', timeout: 5_000 });
const readProject = () => JSON.parse(vm.runInContext('JSON.stringify(project)', context));
const attributes = markup => Object.fromEntries([...markup.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(([,k,,v]) => [k,v]));
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g'))].map(([,raw]) => ({ ...attributes(raw), raw }));
const hrefs = html => tags(html, 'a').map(a => a.href).filter(Boolean);
const ids = nodes => nodes.map(n => n.path || n.id).sort();
const intersection = (a,b) => a.filter(x => new Set(b).has(x)).sort();
const escapeHTML = resources.escapeResource;
const resourceRoutes = [...new Set(['#/production/request', '#/materials', ...resources.resourceNodes.map(n => n.url)])];
const hardwareRoutes = ['#/hardware', ...resources.hardwareApplications.map(a => '#/hardware/'+a.id), ...resources.hardwareTypePages.map(n => n.url), ...resources.hardware.map(h => h.url)];
const rendered = new Map(), paramLinks = new Set();
function render(route) {
  const cleanURL = route.replace(/^#/, '');
  context.location.hash = '#'+cleanURL;
  vm.runInContext('render({scroll:false})', context, { timeout: 5_000 });
  const html = element('#main').innerHTML;
  const title = context.document.title;
  setLocation(cleanURL);
  vm.runInContext('render({scroll:false})', context, { timeout: 5_000 });
  assert.equal(element('#main').innerHTML, html, `${route}: clean pathname/search and legacy hash preserve identical content`);
  assert.equal(context.document.title, title, `${route}: clean pathname/search preserves the title`);
  assert.ok(html.trim() && !html.includes('СТРАНИЦА НЕ НАЙДЕНА'), `${route}: did not render a page`);
  assert.equal(tags(html, 'h1').length, 1, `${route}: one page heading`);
  assert.match(context.document.title, /^VIP Glass — /, `${route}: page title`);
  assert.doesNotMatch(html, /vetro|gals|галс|стеклопакет|\bIGU\b/iu, `${route}: excluded product or source brand leaked into rendered HTML`);
  assert.doesNotMatch(html, /(?:обычн\S*|стандартн\S*|зел[её]н\S*)\s+(?:флоат[ -]?)?стекл[^<]{0,30}(?:основа|база)|(?:основа|база)[^<]{0,30}зел[её]н/iu, `${route}: green ordinary glass was offered as the base`);
  return html;
}
for (const route of [...resourceRoutes, ...hardwareRoutes]) {
  const html = render(route);
  rendered.set(route, html);
  for (const href of hrefs(html)) if (href.startsWith('#/')) paramLinks.add(href.replaceAll('&amp;', '&'));
}
assert.equal(new Set(resources.resourceNodes.map(n => n.path)).size, resources.resourceNodes.length, 'Resource paths are unique');
assert.equal(new Set(resources.hardware.map(n => n.id)).size, resources.hardware.length, 'Hardware IDs are unique');
assert.ok(resources.serviceLeaves.length && resources.materialLeaves.length && resources.hardware.length, 'All three catalogues have final choices');

// Mirrors are complete products: frame and lighting remain product options,
// never a separate hardware application, catalogue or configuration picker.
const removedMirrorHardware = ['mirror-frame-profile','mirror-light-profile','round-mirror-frame'];
assert.ok(!resources.hardwareApplications.some(a => a.id === 'mirrors'), 'Mirrors have no hardware application');
assert.ok(!resources.hardwareTypePages.some(n => n.category === 'mirrors'), 'Mirrors have no hardware type pages');
assert.deepEqual(resources.hardwareFor('mirrors'), [], 'Mirrors cannot select catalogue hardware');
for (const id of removedMirrorHardware) assert.ok(!resources.hardwareById.has(id), `${id}: mirror component removed from catalogue`);
assert.ok(resources.hardware.every(item => !item.applications.includes('mirrors')), 'Retained hardware is never assigned to mirrors');
const hardwareGuardUI = createHardwareUI({esc:escapeHTML,btn:()=>'',crumb:()=>''});
assert.equal(hardwareGuardUI.entry('mirrors'), '', 'Mirror branch has no hardware entry');
assert.equal(hardwareGuardUI.picker('mirrors'), '', 'Mirror product has no hardware picker');
assert.equal(hardwareGuardUI.listing('mirrors',new URLSearchParams()), null, 'Removed mirror hardware listing cannot render');
assert.equal(hardwareGuardUI.detail({applications:['mirrors']},new URLSearchParams()), null, 'Stale mirror-only component cannot render');
const mirrorNodes = tree.catalogNodes.filter(n => n.category === 'mirrors');
assert.ok(mirrorNodes.some(n => n.preset?.frame) && mirrorNodes.some(n => n.preset?.lighting), 'Mirror frame and lighting remain product parameters');
for (const node of mirrorNodes) {
  const html = render(node.url);
  assert.doesNotMatch(html, /class="(?:hardware-context|hardware-picker)"|name="hardware-(?:item|finish)"|href="(?:#)?\/hardware\/mirrors(?:[\/"?])/, `${node.path}: no mirror hardware entry, link or picker`);
  for (const id of removedMirrorHardware) assert.ok(!html.includes('/hardware/item/'+id), `${node.path}: no removed component link`);
}

// Reach leaves using actual rendered choice anchors, not data-only traversal.
const reached = new Set(), queue = ['#/production', '#/materials'];
while (queue.length) {
  const route = queue.shift();
  if (reached.has(route)) continue;
  reached.add(route);
  for (const anchor of tags(rendered.get(route) || '', 'a')) {
    if (anchor['data-resource-path'] && !reached.has(anchor.href)) queue.push(anchor.href);
  }
}
for (const node of resources.resourceNodes) {
  assert.ok(reached.has(node.url), `${node.url}: reachable by a real choice card`);
  const html = rendered.get(node.url);
  if (!node.isLeaf) continue;
  const forms = tags(html, 'form').filter(form => form.id === 'resource-form');
  assert.equal(forms.length, 1, `${node.url}: final resource form`);
  assert.equal(forms[0]['data-resource'], node.path, `${node.url}: form retains the exact choice`);
  assert.ok(tags(html, 'input').some(input => input.name === 'title' && input.value === escapeHTML(node.title)), `${node.url}: final choice title retained`);
  for (const value of Object.values(node.properties || {})) assert.ok(html.includes(escapeHTML(value)), `${node.url}: material property ${value} is visible`);
  if (node.kind === 'material') {
    const inputs = tags(html, 'input');
    assert.ok(inputs.some(input => input.name === 'resource-material' && input.value === node.path), `${node.url}: selected material preset`);
    assert.ok(inputs.some(input => input.id === 'resource-material' && input.value === escapeHTML(node.title) && /\breadonly(?:\s|=|$)/.test(input.raw)), `${node.url}: fixed material selection is visible and cannot silently change`);
  }
}
for (const href of paramLinks) render(href);

// Metamorphic intersection checks catch filters overwriting each other.
let materialIntersections = 0, materialFacetIntersections = 0, hardwareIntersections = 0, hardwareTypeIntersections = 0;
for (const family of resources.materialsRoot.children.map(n => n.id)) {
  const familyIds = ids(resources.filterMaterials(new URLSearchParams({ family })));
  const familyColor = resources.materialLeaves.find(n => n.family === family && n.properties?.color)?.properties.color;
  const otherColor = resources.materialLeaves.find(n => n.properties?.color && n.properties.color !== familyColor)?.properties.color;
  for (const color of new Set([familyColor, otherColor].filter(Boolean))) {
    const params = new URLSearchParams({ family, color });
    const expected = intersection(familyIds, ids(resources.filterMaterials(new URLSearchParams({ color }))));
    assert.deepEqual(ids(resources.filterMaterials(params)), expected, `Material family/color intersection: ${family}/${color}`);
    const html = render('#/materials?'+params);
    assert.deepEqual(tags(html, 'a').filter(a => a['data-resource-path']).map(a => a['data-resource-path']).sort(), expected, 'Rendered material results match filter intersection');
    const selected = tags(html, 'option').filter(o => /\bselected(?:\s|=|$)/.test(o.raw)).map(o => o.value);
    assert.ok(selected.includes(escapeHTML(family)) && selected.includes(escapeHTML(color)), 'Both material filters survive rendering');
    materialIntersections++;
  }
  const sample = resources.materialLeaves.find(n => n.family === family && n.properties?.color && n.properties?.transparency);
  assert.ok(sample, `${family}: final materials expose color and transparency facets`);
  const params = new URLSearchParams({ family, color: sample.properties.color, transparency: sample.properties.transparency, q: sample.title });
  const expected = ['color','transparency','q'].reduce((matches,key) => intersection(matches,ids(resources.filterMaterials(new URLSearchParams({[key]:params.get(key)})))),familyIds);
  assert.ok(expected.length, `${family}: combined facets retain their matching sample`);
  assert.deepEqual(ids(resources.filterMaterials(params)),expected, `${family}: family, color, transparency and typed query combine with AND`);
  const html = render('#/materials?'+params);
  assert.deepEqual(tags(html,'a').filter(a=>a['data-resource-path']).map(a=>a['data-resource-path']).sort(),expected,`${family}: rendered results match all material facets`);
  const selected = tags(html,'option').filter(o=>/\bselected(?:\s|=|$)/.test(o.raw)).map(o=>o.value);
  for (const key of ['family','color','transparency']) assert.ok(selected.includes(escapeHTML(params.get(key))),`${family}: ${key} remains visibly selected`);
  assert.ok(tags(html,'input').some(i=>i.name==='q'&&i.value===escapeHTML(sample.title)),`${family}: typed query remains visible`);
  materialFacetIntersections++;
}
for (const app of resources.hardwareApplications) {
  const all = resources.hardwareFor(app.id);
  assert.ok(all.length && all.every(h => h.applications.includes(app.id)), `${app.id}: only applicable hardware`);
  const types = [...new Set(all.map(h => h.type))];
  for (const type of new Set([types[0], types.at(-1)])) {
    const typeIds = ids(resources.filterHardware(app.id, new URLSearchParams({ type })));
    const finishes = [...new Set(all.flatMap(h => h.finishes.map(f => f.id)))];
    for (const finish of new Set([finishes[0], finishes.at(-1)])) {
      const params = new URLSearchParams({ type, finish });
      const expected = intersection(typeIds, ids(resources.filterHardware(app.id, new URLSearchParams({ finish }))));
      assert.deepEqual(ids(resources.filterHardware(app.id, params)), expected, `Hardware type/finish intersection: ${app.id}/${type}/${finish}`);
      const html = render('#/hardware/'+app.id+'?'+params);
      const cards = tags(html, 'a').filter(a => (a.class || '').split(/\s+/).includes('hardware-card'));
      assert.deepEqual(cards.map(a => a.href.split('?')[0].slice(1)).sort(), expected, 'Rendered hardware results match filter intersection');
      for (const a of cards) {
        const item = resources.hardwareById.get(a.href.split('?')[0].split('/').at(-1));
        assert.ok(item.finishes.some(f => f.id === finish), 'Filtered cards offer only supported finishes');
        const target = a.href.replaceAll('&amp;', '&');
        const detail = render(target);
        assert.equal(tags(detail, 'input').find(input => input.name === 'finish' && /\bchecked(?:\s|=|$)/.test(input.raw))?.value, finish, 'Requested supported finish survives navigation to detail');
      }
      hardwareIntersections++;
    }
  }
}
for (const page of resources.hardwareTypePages) {
  const sample = page.children[0], finish = sample.finishes.at(-1).id;
  const params = new URLSearchParams({ finish, q: sample.title });
  const expected = ids(page.children.filter(item=>item.finishes.some(f=>f.id===finish)))
    .filter(id=>ids(resources.filterHardware(page.category,new URLSearchParams({q:sample.title}))).includes(id));
  const html = render(page.url+'?'+params);
  const cards = tags(html,'a').filter(a=>(a.class||'').split(/\s+/).includes('hardware-card'));
  assert.ok(expected.length,`${page.path}: typed filtering retains the matching item`);
  assert.deepEqual(cards.map(a=>a.href.split('?')[0].slice(1)).sort(),expected,`${page.path}: application, fixed type, finish and query combine with AND`);
  assert.ok(tags(html,'input').some(i=>i.name==='type'&&i.value===page.type&&i.type==='hidden'),`${page.path}: fixed type is retained by its form`);
  assert.ok(tags(html,'option').some(o=>o.value===finish&&/\bselected(?:\s|=|$)/.test(o.raw)),`${page.path}: selected finish remains visible`);
  hardwareTypeIntersections++;
}
assert.ok(materialIntersections > 1 && hardwareIntersections > 1, 'Filter fixtures exercise differing values');
for (const item of resources.hardware) {
  const html = render(item.url+'?finish=unsupported-audit-finish');
  const radio = tags(html, 'input').filter(i => i.name === 'finish');
  assert.deepEqual(radio.map(i => i.value).sort(), item.finishes.map(f => f.id).sort(), 'Detail only exposes finishes supported by this item');
  const chosen = radio.filter(i => /\bchecked(?:\s|=|$)/.test(i.raw));
  assert.equal(chosen.length, 1, 'Unsupported query finish falls back to exactly one supported finish');
  assert.ok(item.finishes.some(f => f.id === chosen[0].value));
}

function dispatch(type, target) {
  let prevented = false;
  for (const handler of events.get(type) || []) handler({ target, preventDefault() { prevented = true; } });
  return prevented;
}
function form(id, dataset, fields) {
  const controls = new Map();
  return { id, dataset, fields, querySelector(selector) {
    if (!controls.has(selector)) controls.set(selector, { innerHTML: '', hidden: true, value: '', disabled: false });
    return controls.get(selector);
  } };
}

const material = resources.materialLeaves.find(n => n.properties?.base === 'CrystalVision');
const service = resources.serviceLeaves.find(n => n.family === 'production-cutting');
const hardwareItem = resources.hardware.find(h => h.applications.includes('showers') && h.finishes.length > 1);
const construction = showers.showerModels.find(n => showers.normalizeShowerOpening(n.preset?.opening) === 'swing');
const constructionMaterial = resources.materialLeaves.find(n => n.family === 'matte' && n.properties?.color === 'Бронза');
const incompatible = tree.catalogNodes.find(n => n.isLeaf && !hardwareItem?.applications.includes(n.path.split('/')[2]));
assert.ok(material && service && hardwareItem && construction && constructionMaterial && incompatible, 'Meaningful integration fixtures are present');
const requestParams = new URLSearchParams({ material: material.path, title: 'Деталь для моего проекта' });
const requestHTML = render('#/production/request?'+requestParams);
assert.ok(tags(requestHTML, 'input').some(input => input.name === 'title' && input.value === 'Деталь для моего проекта'), 'Request route retains its title query');
assert.ok(tags(requestHTML, 'option').some(option => option.value === material.path && /\bselected(?:\s|=|$)/.test(option.raw)), 'Request route retains the material query');

// Submitting a filter preserves the combined query, including Cyrillic values.
const materialFilter = { family: material.family, transparency: material.properties.transparency, color: material.properties.color, q: '' };
assert.ok(dispatch('submit', form('materials-filter-form', {}, materialFilter)));
let query = new URLSearchParams(context.location.search);
for (const [key,value] of Object.entries(materialFilter).filter(([,v]) => v)) assert.equal(query.get(key), value);
assert.equal(query.has('q'), false, 'Empty search is removed without discarding selected filters');
const hardwareFilter = { type: hardwareItem.type, finish: hardwareItem.finishes[0].id, q: '' };
assert.ok(dispatch('submit', form('hardware-filter-form', { category: 'showers' }, hardwareFilter)));
assert.equal(context.location.pathname, '/hardware/showers');
assert.equal(context.location.hash, '', 'Filter submission uses a clean path');
query = new URLSearchParams(context.location.search);
assert.equal(query.get('type'), hardwareFilter.type);
assert.equal(query.get('finish'), hardwareFilter.finish);
const hardwareTypeFilter = {...hardwareFilter,q:hardwareItem.title};
const hardwareTypeForm = form('hardware-filter-form',{category:'showers',type:hardwareItem.type},hardwareTypeFilter);
assert.ok(dispatch('submit',hardwareTypeForm));
assert.equal(location.pathname,'/hardware/showers/'+hardwareItem.type,'Typed hardware filter stays on its type route');
for (const [key,value] of Object.entries(hardwareTypeFilter)) assert.equal(new URLSearchParams(location.search).get(key),value,`Typed hardware filter preserves ${key}`);
dispatch('change',{tagName:'SELECT',closest:selector=>selector==='#hardware-filter-form'?hardwareTypeForm:null});
assert.equal(location.pathname,'/hardware/showers/'+hardwareItem.type,'Changing a finish stays on its type route');
assert.equal(new URLSearchParams(location.search).get('q'),hardwareItem.title,'Changing a finish preserves the typed query');

// Typed shower search remains combined with both facets and is not an order form.
assert.equal(showers.normalizeShowerOpening('Поворотно-раздвижное'), 'pivot-sliding');
const showerModel = showers.showerModels.find(node => showers.normalizeShowerOpening(node.preset.opening) === 'swing');
assert.ok(showerModel, 'A hinged shower is available for typed filter coverage');
const showerFamily = showerModel.ancestors.map(path => tree.nodesByPath.get(path)).find(node => node?.depth === 2);
const showerFilter = { pick: '1', family: showerFamily.id, opening: 'swing', q: showerModel.title };
const familyOnly = ids(showers.filterShowerModels(new URLSearchParams({ family: showerFilter.family })));
const openingOnly = ids(showers.filterShowerModels(new URLSearchParams({ opening: showerFilter.opening })));
assert.deepEqual(ids(showers.filterShowerModels(new URLSearchParams({ family: showerFilter.family, opening: showerFilter.opening }))), intersection(familyOnly,openingOnly), 'Shower family and opening filters combine with AND');
const showerForm = form('shower-filter-form', {}, showerFilter);
assert.ok(dispatch('submit', showerForm));
assert.equal(location.pathname, '/catalog/showers');
assert.equal(location.hash, '');
query = new URLSearchParams(location.search);
for (const [key,value] of Object.entries(showerFilter)) assert.equal(query.get(key), value, `Typed shower filter preserves ${key}`);
const showerResults = render(location.pathname+location.search);
const expectedShowers = ids(showers.filterShowerModels(new URLSearchParams(showerFilter)));
assert.ok(expectedShowers.length > 0);
assert.deepEqual(tags(showerResults, 'a').filter(a => a['data-choice-path']).map(a => a['data-choice-path']).sort(), expectedShowers, 'Typed shower search renders the exact combined selection');
assert.ok(showerResults.includes('id="shower-filter-form"') && !showerResults.includes('id="config-form"'), 'Shower results offer filtering without a premature order form');
assert.ok(tags(showerResults, 'input').some(input => input.name === 'q' && input.value === escapeHTML(showerFilter.q)), 'Typed text remains visible after navigation');
dispatch('change', { tagName: 'SELECT', closest: selector => selector === '#shower-filter-form' ? showerForm : null });
assert.equal(new URLSearchParams(location.search).get('q'), showerFilter.q, 'Changing a shower facet preserves typed search');

// Facets derive from the expanded catalogue, including newly added families.
const showerPicker = render('/catalog/showers?pick=1');
let showerFacetIntersections = 0;
for (const facet of showers.showerFacets) {
  const selectBody = [...showerPicker.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)]
    .find(([,raw])=>attributes(raw).name===facet.name)?.[2];
  assert.ok(selectBody,`${facet.name}: shower facet is rendered`);
  assert.deepEqual(tags(selectBody,'option').map(o=>o.value).filter(Boolean).sort(),facet.options.map(o=>o.id).sort(),`${facet.name}: all current facet choices are visible`);
  for (const option of facet.options) assert.equal(showers.filterShowerModels(new URLSearchParams({[facet.name]:option.id})).length,option.count,`${facet.name}/${option.id}: facet count matches reachable models`);
}
for (const family of showers.showerFamilies) {
  const families = ids(showers.filterShowerModels(new URLSearchParams({family:family.id})));
  for (const opening of showers.showerOpenings.filter(o=>o.count)) {
    const params = new URLSearchParams({pick:'1',family:family.id,opening:opening.id});
    const expected = intersection(families,ids(showers.filterShowerModels(new URLSearchParams({opening:opening.id}))));
    const html = render('/catalog/showers?'+params);
    assert.deepEqual(tags(html,'a').filter(a=>a['data-choice-path']).map(a=>a['data-choice-path']).sort(),expected,`${family.id}/${opening.id}: expanded shower facets preserve their intersection`);
    assert.ok(!html.includes('id="config-form"'),'Facet results never bypass the final model choice');
    showerFacetIntersections++;
  }
}

// Follow real links, then let actual registered popstate/hashchange handlers render history.
const materialsURL = '/materials?'+new URLSearchParams(materialFilter);
const hardwareURL = '/hardware/showers?'+new URLSearchParams(hardwareFilter);
const materialsHTML = render(materialsURL);
browserHistory.replaceState({}, '', materialsURL);
const anchor = { target: '', getAttribute: name => name === 'href' ? hardwareURL : null };
assert.ok(dispatch('click', { closest: selector => selector === 'a[href]' ? anchor : null }), 'Clean internal link is handled without native page navigation');
assert.equal(location.pathname+location.search, hardwareURL);
const hardwareHTML = element('#main').innerHTML;
assert.ok(hardwareHTML.includes('id="hardware-filter-form"'));
browserHistory.back();
assert.equal(location.pathname+location.search, materialsURL);
assert.equal(element('#main').innerHTML, materialsHTML, 'Browser Back restores filtered material content through popstate');
browserHistory.forward();
assert.equal(location.pathname+location.search, hardwareURL);
assert.equal(element('#main').innerHTML, hardwareHTML, 'Browser Forward restores filtered hardware content through popstate');
location.hash = '#'+materialsURL;
emitWindow('hashchange');
assert.equal(location.hash, '', 'Legacy hashchange is canonicalized');
assert.equal(location.pathname+location.search, materialsURL);
assert.equal(element('#main').innerHTML, materialsHTML, 'Legacy hash navigation keeps its query and page content');

// The construction picker must derive its finish options from the selected item.
dispatch('change', { value: hardwareItem.id, matches: selector => selector === '[data-hardware-select]', closest: () => null });
const finishOptions = tags(element('#hardware-finish').innerHTML, 'option').map(o => o.value).filter(Boolean);
assert.deepEqual(finishOptions.sort(), hardwareItem.finishes.map(f => f.id).sort());
assert.equal(element('#hardware-finish').disabled, false);
dispatch('change', { value: '', matches: selector => selector === '[data-hardware-select]', closest: () => null });
assert.equal(element('#hardware-finish').disabled, true);

function addConstruction(node, finish) {
  const f = form('config-form', { node: node.path, solution: node.solutionId }, {
    mode: 'installation', width: '900', height: '2100', quantity: '1', finish: '', note: 'Согласовать узел.',
    'hardware-item': hardwareItem.id, 'hardware-finish': finish,
    'construction-material': node.path.startsWith('/catalog/showers/') ? constructionMaterial.path : '',
  });
  assert.ok(dispatch('submit', f));
  return readProject().items.at(-1);
}
const selectedConstruction = addConstruction(construction, hardwareItem.finishes[0].id);
assert.equal(selectedConstruction.hardwareId, hardwareItem.id);
assert.equal(selectedConstruction.hardwareFinish, hardwareItem.finishes[0].id);
assert.ok(selectedConstruction.note.includes(hardwareItem.finishes[0].label));
assert.ok(selectedConstruction.note.includes(hardwareItem.title));
assert.equal(selectedConstruction.materialPath, constructionMaterial.path, 'Shower submission retains the chosen glass');
assert.equal(selectedConstruction.preset.glass, constructionMaterial.title, 'Chosen glass updates the shower preset');
assert.ok(selectedConstruction.note.includes('Выбранный материал конструкции: '+constructionMaterial.title), 'Chosen glass, hardware type and finish coexist in the submitted note');
assert.equal(addConstruction(construction, 'unsupported-audit-finish').hardwareFinish, '', 'Unsupported finish cannot enter a construction selection');
assert.equal(addConstruction(incompatible, hardwareItem.finishes[0].id).hardwareId, '', 'Hardware for another construction category cannot be selected');

for (const node of [material, service, null]) {
  const title = node?.title || 'Деталь по моему чертежу';
  const resourceForm = form('resource-form', { resource: node?.path || '' }, {
    title, 'resource-width': '850', 'resource-height': '1750', 'resource-quantity': '3',
    'resource-thickness': '8 мм', 'resource-material': material.path, note: 'Отверстия по приложенному эскизу.',
  });
  assert.ok(dispatch('submit', resourceForm));
  const selected = readProject().items.at(-1);
  assert.equal(selected.title, title);
  assert.equal(selected.resourcePath, node?.path || '');
  assert.equal(selected.url, node?.url || '#/production/request');
  assert.equal(selected.materialPath, material.path);
  assert.equal(selected.width, '850');
  assert.equal(selected.height, '1750');
  assert.equal(selected.quantity, '3');
  assert.ok(selected.note.includes('8 мм') && selected.note.includes('Отверстия по приложенному эскизу.'));
  if (node) for (const ancestor of resources.resourceTrail(node)) assert.ok(selected.note.includes(ancestor.title), 'The full selected resource ancestry survives submission');
  assert.equal(resourceForm.querySelector('#resource-added').hidden, false);
}

// Attach hardware to one eligible construction; a separate preference is not a sale item.
const preferredFinish = hardwareItem.finishes.at(-1);
const targetForm = form('hardware-choice-form', { hardware: hardwareItem.id }, {
  finish: preferredFinish.id, target: selectedConstruction.uid, note: 'Выбранная отделка для душевой.',
});
assert.ok(dispatch('submit', targetForm));
assert.equal(readProject().items[0].hardwareFinish, preferredFinish.id);
assert.equal((readProject().items[0].note.match(/Отделка фурнитуры:/g) || []).length, 1, 'Changing an attached finish removes its previous note');
assert.equal(readProject().hardwarePreferences.length, 0, 'Attached hardware does not create a standalone request');
targetForm.fields.finish = hardwareItem.finishes[0].id;
targetForm.fields.note = 'Обновлённое пожелание к узлу.';
assert.ok(dispatch('submit', targetForm));
assert.equal(readProject().items[0].hardwareFinish, hardwareItem.finishes[0].id);
assert.equal((readProject().items[0].note.match(/Отделка фурнитуры:/g) || []).length, 1);
assert.ok(!readProject().items[0].note.includes('Выбранная отделка для душевой.'), 'Changing hardware replaces the previous hardware comment');
const countBeforePreference = readProject().items.length;
assert.ok(dispatch('submit', form('hardware-choice-form', { hardware: hardwareItem.id }, {
  finish: preferredFinish.id, target: '', note: 'Проверить на образце.',
})));
let project = readProject();
assert.equal(project.items.length, countBeforePreference, 'Hardware preference is not a separately orderable product');
assert.equal(project.hardwarePreferences.length, 1);
assert.equal(project.hardwarePreferences[0].finishId, preferredFinish.id);
const beforeInvalid = JSON.stringify(project);
assert.ok(dispatch('submit', form('hardware-choice-form', { hardware: hardwareItem.id }, {
  finish: 'unsupported-audit-finish', target: '', note: '',
})));
assert.equal(JSON.stringify(readProject()), beforeInvalid, 'Invalid hardware finish leaves the draft unchanged');
assert.deepEqual(JSON.parse(saved.get('vipglass-project-v1')), project, 'Resources and hardware persist in the draft');
const projectHTML = render('#/project');
for (const item of project.items) assert.ok(projectHTML.includes(escapeHTML(item.title)), 'Every selected task is visible in the project');
assert.ok(projectHTML.includes(escapeHTML(preferredFinish.label)), 'Saved hardware preference is visible in the project');

context.auditExportButton = { innerHTML: 'Скачать', disabled: false };
await vm.runInContext('exportProject(auditExportButton,false)', context);
assert.equal(downloads.at(-1).name, 'VIP-Glass-project.txt');
const exportedText = await downloads.at(-1).blob.text();
for (const item of project.items) assert.ok(exportedText.includes(item.title) && exportedText.includes(item.note.replace(/\n/g, '\n   ')), 'TXT preserves resource choice and complete details');
assert.ok(exportedText.includes(hardwareItem.title) && exportedText.includes(preferredFinish.label) && exportedText.includes('Проверить на образце.'), 'TXT preserves the standalone hardware preference');
await vm.runInContext('exportProject(auditExportButton,true)', context);
assert.equal(downloads.at(-1).name, 'VIP-Glass-project.zip');
const zip = new Uint8Array(await downloads.at(-1).blob.arrayBuffer()), view = new DataView(zip.buffer), payloads = new Map();
let offset = 0;
while (view.getUint32(offset,true) === 0x04034b50) {
  assert.equal(view.getUint16(offset+8,true), 0);
  const size = view.getUint32(offset+18,true), nameLength = view.getUint16(offset+26,true), extraLength = view.getUint16(offset+28,true);
  const start = offset+30+nameLength+extraLength;
  const name = new TextDecoder().decode(zip.subarray(offset+30,offset+30+nameLength));
  payloads.set(name,new TextDecoder().decode(zip.subarray(start,start+size)));
  offset = start+size;
}
assert.equal(payloads.get('Задание VIP Glass.txt'), exportedText);
const exportedProject = JSON.parse(payloads.get('project.json'));
assert.deepEqual(exportedProject.items, project.items, 'ZIP JSON preserves resource and construction selections');
assert.deepEqual(exportedProject.hardwarePreferences, project.hardwarePreferences, 'ZIP JSON preserves hardware preferences');

console.log(JSON.stringify({ result: 'PASS', resourcePages: resourceRoutes.length, hardwarePages: hardwareRoutes.length,
  reachableResourcePages: reached.size, internalLinksRendered: paramLinks.size, materialIntersections, materialFacetIntersections, hardwareIntersections, hardwareTypeIntersections,
  selectedItems: project.items.length, hardwarePreferences: project.hardwarePreferences.length,
  mirrorPagesWithoutHardware: mirrorNodes.length, removedMirrorHardware: removedMirrorHardware.length,
  cleanAndLegacyParity: true, historyBackForward: true, typedShowerMatches: expectedShowers.length, showerFacetIntersections,
  scope: 'Real router, generated HTML, filter and submit events, persistence, TXT and ZIP export. No browser or visual assertions.' }, null, 2));
