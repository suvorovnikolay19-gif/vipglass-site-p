import { mirrorTree } from './mirror-tree.mjs';
import { otherTrees, showersPathAliases, partitionsPathAliases } from './other-trees.mjs';
import { categories, solutions } from './catalog.mjs';
import { searchSolutions } from './project-utils.mjs';

const baseSolutions = new Map(solutions.map(s => [s.id, s]));
export const catalogNodes = [];
export const nodesByPath = new Map();
export const firstLeafBySolution = new Map();

function indexNode(raw, ancestors = []) {
  const ids = [...ancestors.map(n => n.id), raw.id];
  const path = '/catalog/' + ids.join('/');
  if (nodesByPath.has(path)) throw new Error('Duplicate catalog path: ' + path);
  const node = {
    ...raw, path, url: '#' + path, depth: ids.length,
    category: ids[0], ancestors: ancestors.map(n => n.path),
    parentPath: ancestors.at(-1)?.path || null,
  };
  nodesByPath.set(path, node);
  catalogNodes.push(node);
  node.children = (raw.children || []).map(child => indexNode(child, [...ancestors, node]));
  node.isLeaf = raw.kind === 'solution';
  if (node.isLeaf) {
    if (node.children.length || !baseSolutions.has(node.solutionId)) throw new Error('Invalid final catalog page: ' + path);
    if (!firstLeafBySolution.has(node.solutionId)) firstLeafBySolution.set(node.solutionId, node);
  } else if (!node.children.length) throw new Error('Empty catalog branch: ' + path);
  node.leafCount = node.isLeaf ? 1 : node.children.reduce((n, child) => n + child.leafCount, 0);
  return node;
}

export const catalogRoots = [mirrorTree, ...otherTrees].map(root => indexNode(root));
export const rootById = new Map(catalogRoots.map(root => [root.id, root]));
for(const [oldPath,currentPath] of Object.entries({...showersPathAliases,...partitionsPathAliases})){const target=nodesByPath.get(currentPath);if(!target)throw new Error('Unknown catalogue alias target: '+currentPath);nodesByPath.set(oldPath,target);}
export const treeStats = {
  pages: catalogNodes.length,
  branches: catalogNodes.filter(n => !n.isLeaf).length,
  leaves: catalogNodes.filter(n => n.isLeaf).length,
  maxDepth: Math.max(...catalogNodes.map(n => n.depth)),
};

export const nodeTrail = node => [...node.ancestors.map(path => nodesByPath.get(path)), node];
export function solutionForNode(node) {
  if (!node?.isLeaf) return null;
  const base = baseSolutions.get(node.solutionId);
  const shape=String(node.preset?.shape||'').toLowerCase();
  const sizeMode=/^круг(?:лая|лый)?$/.test(shape)?'diameter':/^квадрат/.test(shape)?'side':'axes';
  return {...base, mounting:node.preset?.mounting||base.mounting,
    application:node.preset?.application||base.application, opening:node.preset?.opening||base.opening,
    title: node.title, description: node.intro || base.description,
    status: node.status || 'structure', treeNode: node, preset: node.preset || {}, sizeMode};
}

const labels = {
  shape:'Форма', lighting:'Подсветка', frame:'Обрамление', frameMaterial:'Материал рамы',
  material:'Материал', finish:'Отделка', installation:'Установка', mounting:'Крепление',
  application:'Пространство', opening:'Открывание', geometry:'Геометрия', configuration:'Компоновка',
  handrail:'Поручень', layout:'Раскладка', composition:'Композиция', edge:'Кромка',
  bevel:'Фацет', color:'Цвет', treatment:'Обработка', orientation:'Расположение',
  function:'Функция', decor:'Декор', style:'Характер', dimensions:'Геометрия',
  upholstery:'Обивка', mirrorColor:'Цвет зеркала', movement:'Поворот', functions:'Функции',
  motifPlacement:'Расположение рисунка', glass:'Стекло', deliverySet:'Комплект', sections:'Секции',
  system:'Система', materialColor:'Цвет стекла', glassTreatment:'Обработка стекла',
  thickness:'Толщина стекла', glazing:'Остекление', blinds:'Жалюзи',
  control:'Управление', smartTechnology:'Технология SMART', frameColor:'Цвет каркаса',
  profileColor:'Отделка профиля', grid:'Рисунок раскладки', privacy:'Режимы видимости',
  powerRouting:'Подключение подвижных секций',
  controlZones:'Зоны управления', smartScope:'Где работает SMART',
};
export function presetRows(node) {
  return Object.entries(node?.preset || {}).filter(([key,value]) => labels[key] && value)
    .map(([key,value]) => [labels[key], String(value)]);
}
export function variantNote(node) {
  const route = nodeTrail(node).map(n => n.title).join(' → ');
  const choices = presetRows(node).map(([label,value]) => `${label}: ${value}`).join('\n');
  return ['Выбранное исполнение: ' + route, choices, node.preset?.note].filter(Boolean).join('\n');
}

const searchRecords = catalogNodes.map(node => ({
  id:node.path, title:node.title, description:node.intro, category:node.category,
  tags:nodeTrail(node).slice(1).map(n => n.title),
  features:Object.entries(node.preset || {}).filter(([key,value]) => !['title','note','widthLabel','heightLabel'].includes(key) && typeof value === 'string').map(([,value])=>value), node,
}));
export function searchCatalog(query) {
  return searchSolutions(searchRecords, categories, query).map(record => record.node);
}
