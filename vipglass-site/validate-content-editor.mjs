#!/usr/bin/env node
// Exercise editor handlers with a small DOM adapter. No browser or dependencies.
import assert from 'node:assert/strict';
import { createContentEditor } from './dist/content-editor.mjs';
import { portfolioExamples, validatePortfolioProjects } from './dist/portfolio-data.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const editor = createContentEditor({ esc, btn: (label, href) => `<a href="${href}">${label}</a>`, crumb: () => '' });
const html = editor.page();
assert.equal(editor.page(), html, 'page rendering must be deterministic for route aliases');
assert(html.includes('изменения только в этом браузере'));
assert.equal((html.match(/data-ce-stage="/g) || []).length, 4);
assert(html.includes('name="cover-src"'));
editor.bind(); // Static rendering must not require a browser document.

const fixture = structuredClone(portfolioExamples[0]);
const fields = {};
for (const [key, value] of Object.entries({
  title: 'Проверка <img src=x onerror=alert(1)>', category: fixture.category,
  kind: fixture.kind, materialColor: fixture.materialColor, description: 'Описание',
  'cover-src': fixture.cover.src, 'cover-caption': 'Обложка', productPaths: fixture.productPaths.join('\n'),
})) fields[key] = { value };
fields.published = { checked: true };
fields.isDemo = { checked: false };

const characteristic = (key, value, type) => ({
  querySelector: selector => selector === '[data-ce-key]' ? { value: key }
    : selector === '[data-ce-value]' ? { value }
      : selector === '[data-ce-value-type]' ? { value: type } : null,
});
const characteristics = [characteristic('number', '2', 'number'), characteristic('boolean', 'false', 'boolean'), characteristic('list', '["a",2,true]', 'list')];
const media = (src, caption = '') => ({
  querySelector: selector => selector === '[data-ce-src]' ? { value: src } : selector === '[data-ce-caption]' ? { value: caption } : null,
});
function stage(id, enabled, photos, text = '') {
  const toggle = { checked: enabled }, body = { hidden: !enabled };
  const section = {
    dataset: { ceStage: id },
    querySelector: selector => selector === '[data-ce-stage-toggle]' ? toggle
      : selector === '.ce-stage-body' ? body
        : selector === '[data-ce-stage-text]' ? { value: text }
          : selector === '[data-ce-stage-author]' ? { value: id === 'review' ? 'Автор' : '' } : null,
    querySelectorAll: selector => selector.includes('"photos"') ? photos : [],
  };
  toggle.closest = () => section;
  toggle.matches = selector => selector === '[data-ce-stage-toggle]';
  return section;
}
const stages = [
  stage('before', false, [media('/assets/hidden.webp')], 'Скрытый этап'),
  stage('during', true, [media('/assets/process.webp')], 'Описание процесса'),
  stage('after', true, [media('/assets/after.webp')]),
  stage('review', true, [], 'Текст отзыва'),
];
const form = {
  elements: { namedItem: name => fields[name] },
  querySelectorAll: selector => selector === '[data-ce-characteristic]' ? characteristics : selector === '[data-ce-stage]' ? stages : [],
};
const nodes = {
  '#content-editor-form': form, '[data-ce-status]': {}, '[data-ce-dirty]': {}, '[data-ce-preview]': {},
  '[data-ce-confirmation]': { innerHTML: '', querySelector: () => ({ focus() {} }) },
};
const listeners = {}, storage = new Map(), downloads = [];
let dispatchedEvents = 0, attachedListeners = 0;
const view = {
  localStorage: { setItem: (key, value) => storage.set(key, value) },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  dispatchEvent: () => dispatchedEvents++, Blob,
  URL: { createObjectURL: () => 'blob:test-download', revokeObjectURL() {} },
};
const document = {
  querySelector: selector => selector === '[data-content-editor]' ? host : null,
  defaultView: view, body: { append() {} },
  createElement: () => ({ click() { downloads.push(this.download); }, remove() {} }),
};
const host = {
  dataset: {}, ownerDocument: document, innerHTML: '', querySelector: selector => nodes[selector] || null,
  addEventListener: (type, callback) => { attachedListeners++; listeners[type] = callback; }, contains: () => true,
};
editor.bind(document);
editor.bind(document);
assert.equal(attachedListeners, 4, 'bind must not attach duplicate handlers');
const click = action => listeners.click({ target: { closest: () => ({ dataset: { ceAction: action } }) } });
const submit = () => listeners.submit({ target: { id: 'content-editor-form' }, preventDefault() {} });
const stored = () => JSON.parse(storage.get('vipglass-portfolio-draft-v1'));

submit();
assert.equal(stored().length, portfolioExamples.length);
assert(validatePortfolioProjects(stored()).valid);
const saved = stored().find(project => project.id === fixture.id);
assert.equal(saved.title, fields.title.value);
assert.equal(saved.characteristics.number, 2);
assert.equal(saved.characteristics.boolean, false);
assert.deepEqual(saved.characteristics.list, ['a', 2, true]);
assert.equal(saved.stages.before.photos.length, 0);
assert.equal(saved.stages.during.text, 'Описание процесса');
assert.equal(saved.stages.review.author, 'Автор');
assert(host.innerHTML.includes('&lt;img'));
assert(!host.innerHTML.includes('<img src=x onerror'));
assert(dispatchedEvents > 0);

const beforeUnsafe = storage.get('vipglass-portfolio-draft-v1');
fields['cover-src'].value = 'javascript:alert(1)';
click('preview');
assert.equal(storage.get('vipglass-portfolio-draft-v1'), beforeUnsafe);
assert(nodes['[data-ce-status]'].className.includes('error'));
fields['cover-src'].value = fixture.cover.src;
const toggle = stages[0].querySelector('[data-ce-stage-toggle]');
toggle.checked = true;
await listeners.change({ target: toggle });
assert.equal(stages[0].querySelector('.ce-stage-body').hidden, false);
assert.equal(stages[0].querySelectorAll('[data-ce-media-group="photos"]')[0].querySelector('[data-ce-src]').value, '/assets/hidden.webp');

const imported = structuredClone(portfolioExamples.slice(0, 1));
imported[0].title = 'Импортированный проект';
const importTarget = {
  files: [{ size: 200, text: async () => JSON.stringify(imported) }], value: 'file',
  matches: selector => selector === '[data-ce-import-file]',
};
await listeners.change({ target: importTarget });
assert(nodes['[data-ce-confirmation]'].innerHTML.includes('Заменить локальный черновик импортом'));
assert.equal(stored().length, portfolioExamples.length, 'import must wait for confirmation');
click('confirm');
assert.equal(stored().length, 1);
assert.equal(stored()[0].title, 'Импортированный проект');
click('export');
assert.deepEqual(downloads, ['vipglass-portfolio.json']);

const beforeInvalidImport = storage.get('vipglass-portfolio-draft-v1');
importTarget.files[0] = { size: 20, text: async () => '{invalid json' };
await listeners.change({ target: importTarget });
assert.equal(storage.get('vipglass-portfolio-draft-v1'), beforeInvalidImport);
assert(nodes['[data-ce-status]'].textContent.includes('Не удалось прочитать JSON'));
click('reset');
assert(nodes['[data-ce-confirmation]'].innerHTML.includes('Восстановить демонстрационные'));
assert.equal(stored().length, 1);
click('cancel');
assert.equal(nodes['[data-ce-confirmation]'].innerHTML, '');
click('reset'); click('confirm');
assert.equal(stored().length, portfolioExamples.length);

const beforeStorageError = storage.get('vipglass-portfolio-draft-v1');
view.localStorage.setItem = () => { throw Error('quota'); };
submit();
assert.equal(storage.get('vipglass-portfolio-draft-v1'), beforeStorageError);
assert(nodes['[data-ce-status]'].textContent.includes('Браузер не смог сохранить'));
console.log('Content editor: PASS — rendering/bind, saving, typed fields, stage visibility, stage text, escaping, URL checks, import/confirmation, export action, reset/cancel, storage errors.');
