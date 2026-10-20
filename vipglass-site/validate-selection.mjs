import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import * as catalogue from './dist/catalog.mjs';
import * as tree from './dist/catalog-tree.mjs';
import * as helpers from './dist/project-utils.mjs';
import { createCatalogUI } from './dist/catalog-ui.mjs';
import * as media from './dist/catalog-media.mjs';
import * as resources from './dist/resource-catalog.mjs';
import { createResourceUI } from './dist/resource-ui.mjs';
import { createHardwareUI } from './dist/hardware-ui.mjs';

const rawSource = fs.readFileSync(new URL('./dist/app.mjs', import.meta.url), 'utf8');
const appBindings = {};
for (const [, names, relative] of rawSource.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)) {
  const imported = await import(new URL(relative, new URL('./dist/app.mjs', import.meta.url)));
  for (const binding of names.split(',')) {
    const [name, alias] = binding.trim().split(/\s+as\s+/);
    appBindings[alias || name] = imported[name];
  }
}

// This exercises the real application's event handlers and renderer, without a browser.
// It does not pretend to verify browser layout, native form validation, or focus behavior.
const elements = new Map();
const documentEvents = new Map();
const saved = new Map();
const blobs = new Map();
const downloads = [];
let objectUrlCounter = 0;
const classList = () => ({ add() {}, remove() {} });
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    innerHTML: '', textContent: '', value: '', disabled: false,
    classList: classList(), focus() {}, close() {}, showModal() {},
  });
  return elements.get(selector);
}
function register(map, type, handler) {
  if (!map.has(type)) map.set(type, []);
  map.get(type).push(handler);
}
class TestFormData {
  constructor(form) { this.fields = form.fields || {}; }
  get(name) { return Object.hasOwn(this.fields, name) ? this.fields[name] : null; }
  *[Symbol.iterator]() { yield* Object.entries(this.fields); }
}
const context = vm.createContext({
  ...catalogue, ...tree, ...helpers, createCatalogUI, ...media,
  ...resources, createResourceUI, createHardwareUI,
  ...appBindings,
  console, URLSearchParams, Blob, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, DataView,
  crypto: { randomUUID },
  FormData: TestFormData,
  location: { hash: '#/', pathname: '/', search: '' },
  localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
  requestAnimationFrame: callback => callback(),
  setTimeout: () => 1, clearTimeout() {},
  matchMedia: () => ({ matches: true }),
  URL: {
    createObjectURL(blob) { const id = `blob:test-${++objectUrlCounter}`; blobs.set(id, blob); return id; },
    revokeObjectURL() {},
  },
  history: { replaceState(_state, _title, url) { context.location.hash = url; } },
  window: { addEventListener() {}, scrollTo() {}, scrollY: 0 },
  document: {
    querySelector: selector => selector.startsWith('[') ? null : element(selector),
    querySelectorAll: () => [],
    addEventListener: (type, handler) => register(documentEvents, type, handler),
    getElementById: id => element('#' + id),
    body: { append() {} },
    createElement(tag) {
      assert.equal(tag, 'a');
      return { href: '', download: '', remove() {}, click() {
        downloads.push({ name: this.download, blob: blobs.get(this.href) });
      } };
    },
  },
});
const source = rawSource.replace(/^import .*;\s*$/gm, '');
vm.runInContext(source, context, { filename: 'dist/app.mjs' });
const readProject = () => JSON.parse(vm.runInContext('JSON.stringify(project)', context));
vm.runInContext("openGallery('mirror-backlit-round')",context);
assert.equal(element('#lightbox-image').src, './assets/interiors/mirror-backlit-round.webp');
assert.ok(element('#lightbox-caption').textContent.includes('визуализация'));
vm.runInContext("openResourceGallery('hardware-handrail','Деревянный поручень','./assets/production/hardware-wood-handrail.webp')",context);
assert.equal(element('#lightbox-image').src,'./assets/production/hardware-wood-handrail.webp','Resolved image, not stale family image, opens in the lightbox');
vm.runInContext("openResourceGallery('hardware-profile','Круглая рама','./assets/interiors/mirror-backlit-round.webp')",context);
assert.equal(element('#lightbox-image').src,'./assets/interiors/mirror-backlit-round.webp','Context images from interiors work in resource galleries');
vm.runInContext("openResourceGallery('material-clear','Осветлённое стекло')",context);
assert.equal(element('#lightbox-image').src,'./assets/production/material-clear.webp','Legacy resource keys keep working');


function dispatch(type, target) {
  let prevented = false;
  for (const handler of documentEvents.get(type) || []) handler({ target, preventDefault() { prevented = true; } });
  return prevented;
}

function finalDescendant(node, matches = () => true) {
  if (!node) return null;
  if (node.isLeaf) return matches(node) ? node : null;
  for (const child of node.children) { const result = finalDescendant(child, matches); if (result) return result; }
  return null;
}
const round = finalDescendant(tree.nodesByPath.get('/catalog/mirrors/with-light/contour/rounded/round/frameless'), node => tree.solutionForNode(node).sizeMode === 'diameter');
const oval = finalDescendant(tree.nodesByPath.get('/catalog/mirrors/with-light/contour/rounded/oval/vertical'), node => node.solutionId === round?.solutionId && node.preset.shape === 'Овал');
const canopy = finalDescendant(tree.catalogNodes.find(node => node.id === 'canopies-profile-single-door-rectangular'), node => node.preset.heightLabel === 'Вылет');
const steps = finalDescendant(tree.catalogNodes.find(node => node.id === 'stairs-glass-steps-individual-rectangular'), node => node.preset.heightLabel === 'Глубина ступени');
assert.ok(round && oval && canopy && steps, 'Required selection fixtures must exist');
assert.equal(round.solutionId, oval.solutionId, 'Round and oval must exercise the same base solutionId');
const cases = [
  { node: round, width: '800', height: '800', expectedHeight: 'Высота', note: 'Провод вывести справа.' },
  { node: oval, width: '800', height: '1300', expectedHeight: 'Высота', note: 'Провод вывести слева.' },
  { node: canopy, width: '1800', height: '1000', expectedHeight: 'Вылет', note: 'Согласовать примыкание к фасаду.' },
  { node: steps, width: '1100', height: '300', expectedHeight: 'Глубина ступени', note: 'Отверстия по отдельному чертежу.' },
];
for (const [index, fixture] of cases.entries()) {
  const { node } = fixture;
  context.location.hash = node.url;
  vm.runInContext('render({scroll:false})', context);
  const html = element('#main').innerHTML;
  assert.ok(html.includes(`data-node="${node.path}"`), `Form selects the actual leaf: ${node.id}`);
  assert.ok(html.includes(`<h1>${node.title}</h1>`), `Leaf title is visible: ${node.id}`);
  const resolved = tree.solutionForNode(node);
  if (resolved.sizeMode === 'axes') {
    assert.ok(html.includes(`>${fixture.expectedHeight}, мм</label>`), `Correct dimension label: ${node.id}`);
  } else {
    assert.ok(!html.includes('name="height"'), `Single-dimension shape has no independent height input: ${node.id}`);
  }
  const expectedWidth = resolved.sizeMode === 'diameter' ? 'Диаметр' : resolved.sizeMode === 'side' ? 'Сторона' : node.preset.widthLabel || 'Ширина';
  assert.ok(html.includes(`>${expectedWidth}, мм</label>`), `Correct width label: ${node.id}`);
  const button = { innerHTML: 'Добавить', type: 'submit' };
  const form = {
    id: 'config-form', dataset: { solution: node.solutionId, node: node.path },
    fields: { mode: node.preset.mode || 'installation', width: fixture.width,
      ...(resolved.sizeMode === 'axes' ? { height: fixture.height } : {}),
      quantity: String(index + 1), finish: 'По образцу', note: fixture.note },
    querySelector(selector) { if(selector === '#added-confirmation')return {hidden:true}; assert.equal(selector, 'button[type=submit]'); return button; },
  };
  assert.equal(dispatch('submit', form), true, 'Native navigation is prevented');
  const item = readProject().items[index];
  assert.equal(item.id, node.solutionId);
  assert.equal(item.title, node.title);
  assert.equal(item.url, node.url);
  assert.equal(item.catalogPath, node.path);
  assert.deepEqual(item.preset, node.preset);
  assert.equal(item.width, fixture.width);
  assert.equal(item.height, fixture.height);
  assert.equal(item.widthLabel, expectedWidth);
  assert.equal(item.heightLabel, fixture.expectedHeight);
  assert.equal(item.sizeMode, resolved.sizeMode);
  assert.equal(item.quantity, String(index + 1));
  assert.ok(item.note.includes(node.title));
  assert.ok(item.note.includes(fixture.note));
  assert.ok(item.note.includes('Отделка / цвет: По образцу'));
}
let project = readProject();
assert.equal(project.items.length, 4, 'Adding variants must not replace an existing base solution');
assert.equal(project.items[0].id, project.items[1].id);
assert.notEqual(project.items[0].title, project.items[1].title);
assert.notEqual(project.items[0].url, project.items[1].url);
assert.equal(new Set(project.items.map(item => item.uid)).size, 4);

// Exercise the actual input handler, then inspect the persisted draft and rendered project.
dispatch('input', { dataset: { item: '0', field: 'width' }, value: '950', checkValidity: () => true });
dispatch('input', { dataset: { item: '0', field: 'note' }, value: project.items[0].note + '\nПравка после добавления.', checkValidity: () => true });
dispatch('input', { dataset: { projectField: 'description' }, value: 'Четыре отдельных исполнения одного проекта.' });
project = readProject();
assert.equal(project.items[0].width, '950');
assert.equal(project.items[0].height, '950');
assert.equal(project.items[0].widthLabel, 'Диаметр');
assert.ok(project.items[0].note.endsWith('Правка после добавления.'));
assert.equal(JSON.parse(saved.get('vipglass-project-v1')).items[0].width, '950');
context.location.hash = '#/project';
vm.runInContext('render({scroll:false})', context);
const projectHTML = element('#main').innerHTML;
for (const item of project.items) {
  assert.ok(projectHTML.includes(item.title), 'Project shows each variant title');
  assert.ok(projectHTML.includes(item.url), 'Project links back to the selected variant');
}
assert.ok(projectHTML.includes('Вылет, мм'));
assert.ok(projectHTML.includes('Глубина ступени, мм'));
assert.ok(projectHTML.includes('Диаметр, мм'));
assert.ok(!projectHTML.includes('id="ph-0"'), 'Round mirror has no independent project height control');

// Run the real export handler and inspect both exported payloads, entirely in memory.
context.testExportButton = { innerHTML: 'Скачать', disabled: false };
await vm.runInContext('exportProject(testExportButton, false)', context);
assert.equal(downloads.at(-1).name, 'VIP-Glass-project.txt');
const text = await downloads.at(-1).blob.text();
for (const item of project.items) {
  assert.ok(text.includes(item.title), 'TXT preserves the selected title');
  assert.ok(text.includes(item.note.replace(/\n/g, '\n   ')), 'TXT preserves the complete selection and user note');
}
assert.ok(text.includes('вылет 1000 мм'));
assert.ok(text.includes('глубина ступени 300 мм'));
assert.ok(text.includes('ширина вдоль фасада 1800 мм'));
assert.ok(text.includes('диаметр 950 мм'));
assert.ok(!text.includes('высота 950 мм'), 'TXT does not duplicate diameter as height');
await vm.runInContext('exportProject(testExportButton, true)', context);
assert.equal(downloads.at(-1).name, 'VIP-Glass-project.zip');
const zip = new Uint8Array(await downloads.at(-1).blob.arrayBuffer());
const zipView = new DataView(zip.buffer);
const payloads = new Map();
let cursor = 0;
while (zipView.getUint32(cursor, true) === 0x04034b50) {
  assert.equal(zipView.getUint16(cursor + 8, true), 0, 'Export uses stored ZIP entries');
  const size = zipView.getUint32(cursor + 18, true);
  const nameSize = zipView.getUint16(cursor + 26, true);
  const extraSize = zipView.getUint16(cursor + 28, true);
  const name = new TextDecoder().decode(zip.subarray(cursor + 30, cursor + 30 + nameSize));
  const dataStart = cursor + 30 + nameSize + extraSize;
  payloads.set(name, new TextDecoder().decode(zip.subarray(dataStart, dataStart + size)));
  cursor = dataStart + size;
}
assert.equal(payloads.get('Задание VIP Glass.txt'), text);
const exportedJSON = JSON.parse(payloads.get('project.json'));
assert.deepEqual(exportedJSON.items, project.items, 'ZIP JSON preserves all four selections exactly');
assert.equal(context.testExportButton.disabled, false);
console.log('PASS: real app rendering, four leaf submits (same-ID round/oval, canopy, steps), edits, persistence, TXT and ZIP/JSON export.');
console.log('PASS: variant titles, URLs, presets, dimension labels, sizes, notes and unique item identities preserved.');
