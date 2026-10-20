import { catalogNodes, nodesByPath, rootById, nodeTrail } from './catalog-tree.mjs';
import { materialLeaves, resourceByPath } from './resource-catalog.mjs';
import { normalizeSearch, searchSolutions } from './project-utils.mjs';

export const SHOWER_RESULTS_PATH = '/catalog/showers';
const TREE_URL = `#${SHOWER_RESULTS_PATH}`;
const RESULTS_URL = `${TREE_URL}?pick=1`;

const OPENING_GROUPS = [
  { id: 'none', title: 'Без открывания' },
  { id: 'swing', title: 'Распашное' },
  { id: 'sliding', title: 'Раздвижное' },
  { id: 'folding', title: 'Складное' },
  { id: 'pivot-sliding', title: 'Поворотно-раздвижное' },
  { id: 'project', title: 'По проекту' },
];

/** The compound motion must be resolved before its sliding component. */
export function normalizeShowerOpening(value = '') {
  const opening = normalizeSearch(value).replace(/[‐‑–—−]/g, '-');
  if (/поворотн[а-я-]*\s*раздвиж|поворотно\s*[-/]\s*раздвиж|рото|pivot/.test(opening)) return 'pivot-sliding';
  if (/склад|гармош|книжк/.test(opening)) return 'folding';
  if (/раздвиж|сдвиж|купе|слайд/.test(opening)) return 'sliding';
  if (/без\s+(?:открыван|двер)|стационар|неподвиж|открытый вход/.test(opening)) return 'none';
  if (/распаш|маятник|поворот/.test(opening)) return 'swing';
  return 'project';
}

const asParams = value => value && typeof value.get === 'function'
  ? value
  : new URLSearchParams(value || '');

function familyFor(node) {
  // Actual ancestry keeps radius showers and sauna glazing in their own families.
  return node.ancestors.map(path => nodesByPath.get(path))
    .find(parent => parent?.category === 'showers' && parent.depth === 2)
    || (node.depth === 2 ? node : null);
}

export const showerModels = catalogNodes.filter(node => node.category === 'showers' && node.isLeaf);

export const showerFamilies = (rootById.get('showers')?.children || []).map(family => ({
  id: family.id,
  title: family.title,
  url: family.url,
  count: showerModels.filter(node => familyFor(node)?.id === family.id).length,
}));

export const showerOpenings = OPENING_GROUPS.map(group => ({
  ...group,
  count: showerModels.filter(node => normalizeShowerOpening(node.preset?.opening) === group.id).length,
}));

export const showerFacets = [
  { id: 'family', name: 'family', title: 'Планировка', options: showerFamilies },
  { id: 'opening', name: 'opening', title: 'Открывание', options: showerOpenings },
];

/** Selected facets and every meaningful query term are combined with AND. */
export function filterShowerModels(params = new URLSearchParams()) {
  const selected = asParams(params);
  const family = selected.get('family') || '';
  const opening = selected.get('opening') || '';
  let matches = showerModels.filter(node => (
    (!family || familyFor(node)?.id === family)
    && (!opening || normalizeShowerOpening(node.preset?.opening) === opening)
  ));
  const query = selected.get('q') || '';
  if (normalizeSearch(query)) {
    const records = matches.map(node => ({
      id: node.path,
      title: node.title,
      description: node.intro,
      category: 'showers',
      tags: [
        ...nodeTrail(node).slice(1).map(parent => parent.title),
        OPENING_GROUPS.find(group => group.id === normalizeShowerOpening(node.preset?.opening))?.title || '',
      ],
      features: node.preset,
      node,
    }));
    matches = searchSolutions(records, [], query).map(record => record.node);
  }
  return matches;
}

const MATERIAL_FAMILIES = ['clear', 'matte', 'tinted', 'textured', 'tempered'];
const showerMaterials = MATERIAL_FAMILIES.flatMap(family => materialLeaves.filter(material => (
  material.family === family && !/непрозрачн/i.test(material.properties?.transparency || '')
)));
const defaultMaterial = showerMaterials.find(material => material.id === 'clear-crystalvision')
  || showerMaterials.find(material => material.family === 'clear');

function materialGroups() {
  const groups = new Map();
  for (const material of showerMaterials) {
    const parents = material.ancestors.map(path => resourceByPath.get(path))
      .filter(parent => parent && parent.depth > 1);
    const title = parents.map(parent => parent.title).join(' · ') || 'Стекло';
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(material);
  }
  return [...groups].map(([title, materials]) => ({ title, materials }));
}

function countLabel(count) {
  const ending = count % 100 >= 11 && count % 100 <= 14 ? 'моделей'
    : count % 10 === 1 ? 'модель'
      : count % 10 >= 2 && count % 10 <= 4 ? 'модели' : 'моделей';
  return `${count} ${ending}`;
}

export function createShowerUI({ esc, btn, crumb, finalCard }) {
  function select(label, name, options, current) {
    const known = !current || options.some(option => option.id === current);
    return `<label>${esc(label)}<select name="${esc(name)}"><option value="">${name === 'family' ? 'Все планировки' : 'Любое открывание'}</option>${!known ? `<option value="${esc(current)}" selected>Выбранный вариант недоступен</option>` : ''}${options.map(option => `<option value="${esc(option.id)}"${option.id === current ? ' selected' : ''}>${esc(option.title)}</option>`).join('')}</select></label>`;
  }

  function filterForm(params = new URLSearchParams()) {
    const selected = asParams(params);
    return `<form id="shower-filter-form" class="resource-filter-form shower-filter-form" data-route="${SHOWER_RESULTS_PATH}" aria-label="Быстрый подбор душевых"><input type="hidden" name="pick" value="1">${select('Планировка', 'family', showerFamilies, selected.get('family') || '')}${select('Открывание', 'opening', showerOpenings, selected.get('opening') || '')}<label>Поиск<input name="q" type="search" value="${esc(selected.get('q') || '')}" placeholder="Например, дверь на стекле" autocomplete="off"></label><button type="submit" class="btn primary">Подобрать <span aria-hidden="true">→</span></button><a class="filter-clear" href="${RESULTS_URL}">Сбросить</a></form>`;
  }

  function resultsPage(params = new URLSearchParams()) {
    const selected = asParams(params);
    const models = filterShowerModels(selected);
    const root = rootById.get('showers');
    const active = ['family', 'opening', 'q'].some(key => (selected.get(key) || '').trim());
    const empty = `<div class="empty shower-empty"><h2>Такое сочетание не найдено</h2><p>Измените планировку, открывание или поисковые слова. Можно вернуться ко всем моделям и выбрать подходящую схему.</p><div class="button-row">${btn('Все модели', RESULTS_URL, 'clear')}${btn('Выбрать по планировке', TREE_URL, 'clear')}</div><p>Для индивидуальной формы подготовьте эскиз или опишите пространство.</p><a class="selection-back" href="#/production">Изготовление по вашему заданию ↗</a></div>`;
    return `${crumb([['Каталог', '#/catalog'], [root?.title || 'Душевые', TREE_URL], ['Подбор моделей']])}<section class="selection-page shower-results"><nav class="selection-toolbar" aria-label="Навигация по душевым"><a class="selection-back" href="${TREE_URL}">← Выбрать по планировке</a><a class="selection-map" href="#/materials">Материалы ↗</a></nav><header class="selection-heading"><div class="eyebrow">ДУШЕВЫЕ / БЫСТРЫЙ ПОДБОР</div><h1>Найдите свою<br><em>конструкцию.</em></h1><p>Выберите планировку и открывание. В карточке модели можно указать размеры, стекло и детали заказа.</p></header>${filterForm(selected)}<p class="resource-result-count" role="status">${active ? 'По вашему выбору: ' : 'В каталоге: '}${countLabel(models.length)}</p>${models.length ? `<div class="choice-grid shower-result-grid" data-choice-count="${models.length}" data-shower-result-count="${models.length}">${models.map((node, index) => finalCard(node, index)).join('')}</div>` : empty}<div class="selection-footer"><p>Предпочитаете последовательный выбор? Начните с формы душевой зоны.</p>${btn('Открыть дерево душевых', TREE_URL, 'clear')}</div></section>`;
  }

  function materialPicker(category) {
    if (category !== 'showers' || !showerMaterials.length) return '';
    const groups = materialGroups();
    return `<fieldset class="hardware-picker construction-material-picker"><legend>Стекло конструкции</legend><p>Прозрачная бесцветная основа — CrystalVision. Можно выбрать матовую, тонированную или фактурную поверхность.</p><div class="field full"><label for="construction-material">Материал стекла</label><select id="construction-material" name="construction-material" aria-describedby="construction-material-note">${groups.map(group => `<optgroup label="${esc(group.title)}">${group.materials.map(material => `<option value="${esc(material.path)}"${material.path === defaultMaterial?.path ? ' selected' : ''}>${esc(material.title)}</option>`).join('')}</optgroup>`).join('')}</select></div><p class="form-note" id="construction-material-note">Доступность выбранной фактуры, толщину и допустимую обработку согласуем с конструкцией.</p><a class="hardware-catalog-link" href="#/materials" target="_blank" rel="noopener">Посмотреть материалы с изображениями ↗</a></fieldset>`;
  }

  return { filterForm, resultsPage, materialPicker };
}
