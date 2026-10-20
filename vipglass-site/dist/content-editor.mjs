import { portfolioExamples, getPortfolioProjects, validatePortfolioProjects } from './portfolio-data.mjs';
import { catalogRoots, catalogNodes } from './catalog-tree.mjs';

const STORAGE_KEY = 'vipglass-portfolio-draft-v1';
const STAGES = [['before', 'До работ'], ['during', 'В процессе'], ['after', 'После работ'], ['review', 'Отзыв']];
const clone = value => JSON.parse(JSON.stringify(value));
const hasStage = stage => Boolean(stage && (stage.photos?.length || stage.videos?.length || stage.text));
const categories = catalogRoots.map(node => [node.id, node.title]);

export function createContentEditor({ esc, btn, crumb }) {
  let projects = [], selectedId = '', draft = null, loaded = false, dirty = false, pending = null;
  let status = '', statusKind = 'info', preview = null, host = null, editorDocument = null;
  const field = (label, name, value = '', extra = '') => `<label class="ce-field"><span>${esc(label)}</span><input name="${name}" value="${esc(value)}" ${extra}></label>`;
  const action = (label, name, extra = '') => `<button type="button" class="ce-button" data-ce-action="${name}" ${extra}>${esc(label)}</button>`;
  const errorsText = result => (result.errors || []).map(error => typeof error === 'string' ? error : error.message || JSON.stringify(error)).join(' · ');
  function load() {
    if (loaded) return;
    projects = clone(getPortfolioProjects());
    selectedId = projects[0]?.id || '';
    draft = clone(projects[0] || newProject());
    preview = projects[0] || null;
    loaded = true;
  }
  function newProject() {
    return { id: `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, title: '', category: categories[0]?.[0] || 'mirrors', kind: '', materialColor: '', characteristics: {}, productPaths: [], description: '', cover: { src: '', caption: '' }, stages: {}, published: true, isDemo: false };
  }
  function choose(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;
    selectedId = project.id; draft = clone(project); preview = project; dirty = false; pending = null;
  }
  function mediaRow(media = {}, type = 'photos') {
    return `<div class="ce-media-row" data-ce-media-row>
      <label class="ce-field"><span>${type === 'photos' ? 'Фото' : 'Видео'} — ссылка</span><input data-ce-src value="${esc(media.src || '')}" placeholder="/assets/… или https://…" aria-describedby="ce-media-help"></label>
      <label class="ce-field"><span>Подпись</span><input data-ce-caption value="${esc(media.caption || '')}" placeholder="Что показано в кадре"></label>
      ${type === 'videos' ? `<label class="ce-field"><span>Обложка видео, необязательно</span><input data-ce-poster value="${esc(media.poster || '')}" placeholder="/assets/… или https://…"></label>` : `<input type="hidden" data-ce-poster value="${esc(media.poster || '')}">`}
      <button type="button" class="ce-remove" data-ce-action="remove-media" aria-label="Удалить ${type === 'photos' ? 'фото' : 'видео'}">Удалить</button>
    </div>`;
  }
  function characteristicRow(key = '', value = '') {
    const type = Array.isArray(value) ? 'list' : typeof value;
    return `<div class="ce-characteristic" data-ce-characteristic>${field('Характеристика', 'characteristic-key', key, 'data-ce-key placeholder="Например, opening"')}${field('Значение', 'characteristic-value', Array.isArray(value) ? JSON.stringify(value) : String(value), 'data-ce-value placeholder="Например, распашное"')}<label class="ce-field"><span>Тип значения</span><select data-ce-value-type>${[['string', 'Текст'], ['number', 'Число'], ['boolean', 'Да / нет'], ['list', 'Список JSON']].map(([id, label]) => `<option value="${id}" ${id === type ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${action('Удалить', 'remove-characteristic')}</div>`;
  }
  function stageEditor(id, title, project) {
    const stage = project.stages?.[id] || {}, enabled = hasStage(stage);
    return `<fieldset class="ce-stage" data-ce-stage="${id}"><legend><label class="ce-check"><input type="checkbox" name="stage-${id}-enabled" data-ce-stage-toggle ${enabled ? 'checked' : ''}><span>${title}</span></label></legend>
      <div class="ce-stage-body" ${enabled ? '' : 'hidden'}>
        <p class="ce-help">${id === 'review' ? 'Можно добавить текст, автора, фотографии и видео. Пустые блоки не появятся в портфолио.' : 'Добавьте материалы этапа. Пустые блоки не появятся в портфолио.'}</p>
        <div class="ce-media-group" data-ce-media-group="photos"><h4>Фотографии</h4><div data-ce-media-list>${(stage.photos || []).map(item => mediaRow(item)).join('')}</div>${action('Добавить фото', 'add-media', 'data-ce-media-type="photos"')}</div>
        <div class="ce-media-group" data-ce-media-group="videos"><h4>Видео</h4><div data-ce-media-list>${(stage.videos || []).map(item => mediaRow(item, 'videos')).join('')}</div>${action('Добавить видео', 'add-media', 'data-ce-media-type="videos"')}</div>
        <label class="ce-field"><span>${id === 'review' ? 'Текст отзыва' : 'Описание этапа'}</span><textarea data-ce-stage-text rows="3">${esc(stage.text || '')}</textarea></label>
        ${id === 'review' ? `<label class="ce-field"><span>Автор отзыва</span><input data-ce-stage-author value="${esc(stage.author || '')}" placeholder="Имя или согласованная подпись"></label>` : ''}
      </div></fieldset>`;
  }
  function productOptions(category) {
    const leaves = catalogNodes.filter(node => node.isLeaf && node.category === category);
    const groups = new Map();
    for (const node of leaves) {
      const group = catalogNodes.find(parent => parent.path === node.ancestors[1])?.title || categories.find(([id]) => id === category)?.[1] || 'Изделия';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(node);
    }
    return `<option value="">Выберите изделие из каталога</option>${[...groups].map(([label, nodes]) => `<optgroup label="${esc(label)}">${nodes.map(node => `<option value="${esc(node.path)}">${esc(node.title)}</option>`).join('')}</optgroup>`).join('')}`;
  }
  function form(project) {
    return `<form class="ce-form" id="content-editor-form" novalidate>
      <div class="ce-form-heading"><h2>${projects.some(item => item.id === project.id) ? 'Редактировать проект' : 'Новый проект'}</h2><span class="ce-id">ID: ${esc(project.id)}</span></div>
      <div class="ce-fields">${field('Название проекта', 'title', project.title, 'required maxlength="180"')}
      <label class="ce-field"><span>Категория</span><select name="category">${categories.map(([id, label]) => `<option value="${id}" ${id === project.category ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
      ${field('Вид изделия', 'kind', project.kind, 'required placeholder="Например, угловая душевая" list="ce-kinds"')}
      ${field('Цвет материала', 'materialColor', project.materialColor, 'required maxlength="120" placeholder="Например, бесцветное или бронза" list="ce-colors"')}
      <datalist id="ce-kinds">${[...new Set(projects.filter(p => p.category === project.category).map(p => p.kind).filter(Boolean))].map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist>
      <datalist id="ce-colors">${[...new Set(['Бесцветное', 'Бронза', 'Графит', ...projects.map(p => p.materialColor).filter(Boolean)])].map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist></div>
      <label class="ce-field"><span>Описание проекта</span><textarea name="description" rows="4" placeholder="Задача, выбранное решение и результат">${esc(project.description || '')}</textarea></label>
      <div class="ce-checks"><label class="ce-check"><input type="checkbox" name="published" ${project.published ? 'checked' : ''}><span>Показывать в локальном портфолио</span></label><label class="ce-check"><input type="checkbox" name="isDemo" ${project.isDemo ? 'checked' : ''}><span>Демонстрационный проект</span></label></div>
      <fieldset class="ce-section"><legend>Обложка проекта</legend><p class="ce-help" id="ce-media-help">Нужна хотя бы одна фотография — обложка. Укажите постоянную ссылку на файл: /assets/… или https://… . Файлы с компьютера этот прототип на сервер не загружает.</p>
      ${field('Ссылка на фото обложки', 'cover-src', project.cover?.src || '', 'required placeholder="/assets/… или https://…" aria-describedby="ce-media-help"')}${field('Подпись к обложке', 'cover-caption', project.cover?.caption || '', 'placeholder="Описание изображения"')}</fieldset>
      <fieldset class="ce-section"><legend>Характеристики</legend><p class="ce-help">Параметры для сопоставления с изделием: shape — форма, opening — открывание, material — материал, finish — отделка. Используйте те же названия и значения, что в карточке изделия. Для «Да / нет» введите true или false; для списка — массив JSON.</p><div data-ce-characteristics>${Object.entries(project.characteristics || {}).map(([key, value]) => characteristicRow(key, value)).join('')}</div>${action('Добавить характеристику', 'add-characteristic')}</fieldset>
      <fieldset class="ce-section"><legend>Связанные изделия каталога</legend><div class="ce-link-picker"><label class="ce-field"><span>Добавить изделие этой категории</span><select data-ce-product-picker>${productOptions(project.category)}</select></label>${action('Добавить связь', 'add-product')}</div><label class="ce-field"><span>Пути изделий — по одному в строке</span><textarea name="productPaths" rows="3" spellcheck="false" placeholder="/catalog/…">${esc((project.productPaths || []).join('\n'))}</textarea></label><p class="ce-help">Удалите строку, чтобы убрать связь. Категория проекта и пути изделий должны соответствовать друг другу.</p></fieldset>
      <section class="ce-stages"><h3>История проекта</h3><p class="ce-help">Включайте только нужные этапы. Выключенный этап не сохранится в проекте.</p>${STAGES.map(([id, title]) => stageEditor(id, title, project)).join('')}</section>
      <div class="ce-save-bar"><button class="ce-button ce-primary" type="submit">Сохранить в этом браузере</button>${action('Обновить предпросмотр', 'preview')}<span data-ce-dirty>${dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}</span></div>
    </form>`;
  }
  function previewMedia(media, type = 'photo') {
    return `<figure>${type === 'video' ? `<video controls preload="none" ${media.poster ? `poster="${esc(media.poster)}"` : ''} src="${esc(media.src)}"></video>` : `<img src="${esc(media.src)}" alt="${esc(media.caption || '')}" loading="lazy">`}${media.caption ? `<figcaption>${esc(media.caption)}</figcaption>` : ''}</figure>`;
  }
  function previewHTML(project) {
    if (!project) return '<p class="ce-help">Заполните проект и обновите предпросмотр.</p>';
    const label = categories.find(([id]) => id === project.category)?.[1] || project.category;
    return `<article class="ce-preview-project"><div class="ce-preview-tags"><span>${esc(label)}</span>${project.isDemo ? '<span>Демонстрация</span>' : ''}${!project.published ? '<span>Скрыт в портфолио</span>' : ''}</div>${project.cover ? previewMedia(project.cover) : '<p class="ce-help">Обложка не задана. Добавьте фото перед сохранением в редакторе.</p>'}<h3>${esc(project.title)}</h3><p>${esc(project.description || '')}</p><dl><div><dt>Вид</dt><dd>${esc(project.kind || '')}</dd></div>${project.materialColor ? `<div><dt>Цвет</dt><dd>${esc(project.materialColor)}</dd></div>` : ''}${Object.entries(project.characteristics || {}).map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(String(value))}</dd></div>`).join('')}</dl>${STAGES.filter(([id]) => hasStage(project.stages?.[id])).map(([id, title]) => { const stage = project.stages[id]; return `<section class="ce-preview-stage"><h4>${title}</h4>${(stage.photos || []).map(item => previewMedia(item)).join('')}${(stage.videos || []).map(item => previewMedia(item, 'video')).join('')}${stage.text ? `<p>${esc(stage.text)}</p>` : ''}${stage.author ? `<p class="ce-preview-author">${esc(stage.author)}</p>` : ''}</section>`; }).join('')}</article>`;
  }
  function confirmation() {
    if (!pending) return '';
    const text = pending.type === 'reset' ? 'Восстановить демонстрационные проекты? Текущий локальный черновик будет заменён. При необходимости сначала экспортируйте JSON.' : pending.type === 'delete' ? 'Удалить этот проект из локального черновика?' : pending.type === 'import' ? `Заменить локальный черновик импортом? В файле ${pending.projects.length} проектов. Текущие данные будут заменены.` : 'Продолжить без сохранения изменений текущего проекта?';
    return `<div class="ce-confirm" role="group" aria-label="Подтверждение действия"><p>${esc(text)}</p><div class="ce-actions">${action(pending.type === 'delete' ? 'Удалить проект' : 'Подтвердить', 'confirm')}${action('Отмена', 'cancel')}</div></div>`;
  }
  function shell() {
    return `<div class="ce-toolbar"><label class="ce-field"><span>Проект</span><select data-ce-project-select>${!selectedId ? '<option value="" selected>Новый несохранённый проект</option>' : ''}${projects.map(project => `<option value="${esc(project.id)}" ${project.id === selectedId ? 'selected' : ''}>${esc(project.title || 'Без названия')}${project.published ? '' : ' · скрыт'}</option>`).join('')}</select></label><div class="ce-actions">${action('Новый проект', 'new')}${action('Дублировать', 'duplicate')}${action('Удалить', 'delete')}</div></div>
      <div class="ce-data-tools"><div class="ce-actions">${action('Импорт JSON', 'import')}${action('Экспорт сохранённого JSON', 'export')}${action('Восстановить примеры', 'reset')}</div><input type="file" accept="application/json,.json" data-ce-import-file hidden></div>
      <div data-ce-confirmation>${confirmation()}</div><div class="ce-status ce-status-${statusKind}" role="status" aria-live="polite" data-ce-status ${status ? '' : 'hidden'}>${esc(status)}</div>
      <div class="ce-layout"><div>${form(draft)}</div><aside class="ce-preview"><div class="ce-preview-heading"><h2>Предпросмотр</h2><span>Локальный черновик</span></div><div data-ce-preview>${previewHTML(preview)}</div></aside></div>`;
  }
  function page() {
    load();
    return `${crumb([['Портфолио', '#/portfolio'], ['Управление контентом']])}<section class="ce-page"><header class="ce-heading"><span class="eyebrow">УПРАВЛЕНИЕ КОНТЕНТОМ</span><h1>Портфолио.<br><em>Редактор прототипа.</em></h1><p>Создавайте карточки проектов и собирайте историю работ из фотографий, видео и отзывов.</p>${btn('Открыть портфолио', '#/portfolio', 'clear')}</header><div class="ce-notice"><strong>Редактор прототипа — изменения только в этом браузере.</strong><span>Экспортируйте JSON для публикации. Этот экран не подключён к общей базе сайта.</span></div><div data-content-editor>${shell()}</div></section>`;
  }
  function message(text, kind = 'info') {
    status = text; statusKind = kind;
    const box = host?.querySelector('[data-ce-status]');
    if (box) { box.textContent = text; box.className = `ce-status ce-status-${kind}`; box.hidden = !text; }
  }
  function redraw() { if (host) host.innerHTML = shell(); }
  function confirmAction(type, extra = {}) {
    pending = { type, ...extra };
    const box = host.querySelector('[data-ce-confirmation]'); box.innerHTML = confirmation();
    box.querySelector('button')?.focus();
  }
  function markDirty() {
    dirty = true;
    const label = host.querySelector('[data-ce-dirty]'); if (label) label.textContent = 'Есть несохранённые изменения';
  }
  function readForm() {
    const form = host.querySelector('#content-editor-form'), value = name => form.elements.namedItem(name)?.value.trim() || '';
    const characteristics = {};
    for (const row of form.querySelectorAll('[data-ce-characteristic]')) {
      const key = row.querySelector('[data-ce-key]').value.trim(), val = row.querySelector('[data-ce-value]').value.trim();
      if (!key && !val) continue;
      if (!key || !val) throw new Error('Заполните название и значение каждой характеристики.');
      if (['__proto__', 'constructor', 'prototype'].includes(key) || Object.hasOwn(characteristics, key)) throw new Error('Названия характеристик должны быть уникальными и обычным текстом.');
      const type = row.querySelector('[data-ce-value-type]').value;
      if (type === 'number' && !Number.isFinite(Number(val))) throw new Error(`Характеристика «${key}»: укажите число.`);
      if (type === 'boolean' && !['true', 'false', 'да', 'нет'].includes(val.toLowerCase())) throw new Error(`Характеристика «${key}»: укажите true или false.`);
      characteristics[key] = type === 'number' ? Number(val) : type === 'boolean' ? ['true', 'да'].includes(val.toLowerCase()) : type === 'list' ? JSON.parse(val) : val;
      if (type === 'list' && !Array.isArray(characteristics[key])) throw new Error(`Характеристика «${key}»: нужен массив JSON.`);
    }
    const stages = {};
    for (const section of form.querySelectorAll('[data-ce-stage]')) {
      if (!section.querySelector('[data-ce-stage-toggle]').checked) continue;
      const stage = { photos: [], videos: [] };
      for (const type of ['photos', 'videos']) {
        for (const row of section.querySelectorAll(`[data-ce-media-group="${type}"] [data-ce-media-row]`)) {
          const src = row.querySelector('[data-ce-src]').value.trim(), caption = row.querySelector('[data-ce-caption]').value.trim(), poster = row.querySelector('[data-ce-poster]')?.value.trim();
          if (!src && !caption && !poster) continue;
          if (!src) throw new Error('У каждого фото и видео должна быть ссылка на файл.');
          stage[type].push({ src, caption, ...(poster ? { poster } : {}) });
        }
      }
      const text = section.querySelector('[data-ce-stage-text]').value.trim(), author = section.querySelector('[data-ce-stage-author]')?.value.trim();
      if (text) stage.text = text;
      if (author) stage.author = author;
      if (hasStage(stage)) stages[section.dataset.ceStage] = stage;
    }
    return { id: draft.id, title: value('title'), category: value('category'), kind: value('kind'), materialColor: value('materialColor'), description: value('description'), characteristics, productPaths: [...new Set(value('productPaths').split(/\r?\n/).map(path => path.trim()).filter(Boolean))], cover: { src: value('cover-src'), caption: value('cover-caption') }, stages, published: form.elements.namedItem('published').checked, isDemo: form.elements.namedItem('isDemo').checked };
  }
  function checkedProject() {
    const project = readForm();
    if (!project.title || !project.kind || !project.materialColor || !project.cover.src) throw new Error('Заполните название, вид изделия, цвет материала и ссылку на фото обложки.');
    const result = validatePortfolioProjects([project]);
    if (!result.valid || !result.projects?.length) throw new Error(errorsText(result) || 'Проверьте поля проекта.');
    return result.projects[0];
  }
  function persist(next, selected = selectedId) {
    const result = validatePortfolioProjects(next);
    if (!result.valid) throw new Error(errorsText(result) || 'Не удалось проверить проекты.');
    try { (editorDocument?.defaultView?.localStorage || globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(result.projects)); }
    catch { throw new Error('Браузер не смог сохранить черновик. Проверьте доступность локального хранилища и свободное место.'); }
    projects = clone(result.projects);
    if (projects.some(project => project.id === selected)) choose(selected);
    else if (projects.length) choose(projects[0].id);
    else { selectedId = ''; draft = newProject(); preview = null; dirty = false; pending = null; }
    const view = editorDocument?.defaultView || globalThis.window;
    if (view?.CustomEvent) view.dispatchEvent(new view.CustomEvent('vipglass:portfolio-changed', { detail: { count: projects.length } }));
  }
  function replaceDraft(project) { draft = project; selectedId = projects.some(item => item.id === project.id) ? project.id : ''; dirty = true; pending = null; preview = null; redraw(); }
  function runPending() {
    const operation = pending; pending = null;
    if (!operation) return;
    if (operation.type === 'reset') { persist(clone(portfolioExamples)); message('Демонстрационные проекты восстановлены в этом браузере.', 'success'); }
    if (operation.type === 'delete') { persist(projects.filter(project => project.id !== draft.id)); message('Проект удалён из локального черновика.', 'success'); }
    if (operation.type === 'import') { persist(operation.projects, operation.projects[0]?.id); message(`Импортировано проектов: ${projects.length}. Изменения сохранены в этом браузере.`, 'success'); }
    if (operation.type === 'switch') { choose(operation.id); message('Выбран другой проект.'); }
    if (operation.type === 'new') { replaceDraft(newProject()); message('Заполните новый проект и сохраните его.'); }
    redraw();
  }
  async function importFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) throw new Error('JSON должен быть не больше 2 МБ. Фотографии и видео указываются ссылками.');
    const parsed = JSON.parse(await file.text()), input = Array.isArray(parsed) ? parsed : parsed.projects;
    const result = validatePortfolioProjects(input);
    if (!result.valid) throw new Error(errorsText(result) || 'JSON не соответствует формату проектов.');
    confirmAction('import', { projects: result.projects });
  }
  function exportJSON() {
    if (dirty) { message('Сначала сохраните текущий проект: экспорт содержит только сохранённые данные.', 'error'); return; }
    const view = editorDocument.defaultView || globalThis;
    const blob = new view.Blob([JSON.stringify(projects, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
    const url = view.URL.createObjectURL(blob), link = editorDocument.createElement('a');
    link.href = url; link.download = 'vipglass-portfolio.json'; editorDocument.body.append(link); link.click(); link.remove();
    setTimeout(() => view.URL.revokeObjectURL(url), 1000);
    message('JSON подготовлен для скачивания. Для публикации передайте файл ответственному за сайт.', 'success');
  }
  function bind(root = globalThis.document) {
    if (!root?.querySelector) return;
    editorDocument = root.ownerDocument || root;
    host = root.querySelector('[data-content-editor]');
    if (!host || host.dataset.ceBound) return;
    host.dataset.ceBound = 'true';
    host.addEventListener('submit', event => {
      if (event.target.id !== 'content-editor-form') return;
      event.preventDefault();
      try { const project = checkedProject(), next = projects.filter(item => item.id !== project.id); next.splice(Math.max(0, projects.findIndex(item => item.id === project.id)), 0, project); persist(next, project.id); message('Проект сохранён в этом браузере. Предпросмотр обновлён.', 'success'); redraw(); }
      catch (error) { message(error.message || 'Не удалось сохранить. Проверьте доступность локального хранилища.', 'error'); }
    });
    host.addEventListener('input', event => { if (event.target.closest('#content-editor-form')) markDirty(); });
    host.addEventListener('change', async event => {
      const target = event.target;
      try {
        if (target.matches('[data-ce-project-select]')) { const id = target.value; if (dirty) { target.value = selectedId; confirmAction('switch', { id }); } else { choose(id); redraw(); } }
        if (target.matches('[data-ce-import-file]')) { await importFile(target.files[0]); target.value = ''; }
        if (target.matches('[data-ce-stage-toggle]')) { const body = target.closest('[data-ce-stage]').querySelector('.ce-stage-body'); body.hidden = !target.checked; markDirty(); }
        if (target.name === 'category') { host.querySelector('[data-ce-product-picker]').innerHTML = productOptions(target.value); markDirty(); }
      } catch (error) { message(error instanceof SyntaxError ? 'Не удалось прочитать JSON. Проверьте формат файла.' : error.message, 'error'); }
    });
    host.addEventListener('click', event => {
      const control = event.target.closest('[data-ce-action]'); if (!control || !host.contains(control)) return;
      const name = control.dataset.ceAction;
      try {
        if (name === 'new') { if (dirty) confirmAction('new'); else replaceDraft(newProject()); }
        if (name === 'duplicate') { const project = checkedProject(); project.id = newProject().id; project.title += ' — копия'; project.published = false; replaceDraft(project); message('Копия готова к редактированию. Сохраните её отдельно.'); }
        if (name === 'delete') { if (!projects.some(item => item.id === draft.id)) message('Этот проект ещё не сохранён.'); else confirmAction('delete'); }
        if (name === 'reset') confirmAction('reset');
        if (name === 'confirm') runPending();
        if (name === 'cancel') { pending = null; host.querySelector('[data-ce-confirmation]').innerHTML = ''; }
        if (name === 'import') host.querySelector('[data-ce-import-file]').click();
        if (name === 'export') exportJSON();
        if (name === 'preview') { preview = checkedProject(); host.querySelector('[data-ce-preview]').innerHTML = previewHTML(preview); message(dirty ? 'Предпросмотр обновлён. Изменения ещё не сохранены.' : 'Предпросмотр обновлён.'); }
        if (name === 'add-characteristic') { const list = host.querySelector('[data-ce-characteristics]'); list.insertAdjacentHTML('beforeend', characteristicRow()); list.lastElementChild.querySelector('input').focus(); markDirty(); }
        if (name === 'remove-characteristic') { control.closest('[data-ce-characteristic]').remove(); markDirty(); }
        if (name === 'add-media') { const type = control.dataset.ceMediaType, list = control.closest('[data-ce-media-group]').querySelector('[data-ce-media-list]'); list.insertAdjacentHTML('beforeend', mediaRow({}, type)); list.lastElementChild.querySelector('input').focus(); markDirty(); }
        if (name === 'remove-media') { control.closest('[data-ce-media-row]').remove(); markDirty(); }
        if (name === 'add-product') { const picker = host.querySelector('[data-ce-product-picker]'), input = host.querySelector('[name="productPaths"]'); if (!picker.value) { message('Сначала выберите изделие каталога.'); return; } input.value = [...new Set([...input.value.split(/\r?\n/).filter(Boolean), picker.value])].join('\n'); picker.value = ''; markDirty(); }
      } catch (error) { message(error.message || 'Не удалось выполнить действие.', 'error'); }
    });
  }
  return { page, bind };
}
