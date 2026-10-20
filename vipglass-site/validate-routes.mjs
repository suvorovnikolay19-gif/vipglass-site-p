/**
 * Reproducible, browser-free check of the catalogue's clean and legacy hash router.
 * Run: node validate-routes.mjs
 *
 * Executes page rendering in a Node VM with an inert document facade. It does
 * not open a browser, access a session, or test visual layout. Local asset
 * references and file hashes are checked without decoding the images.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as catalogue from './dist/catalog.mjs';
import * as helpers from './dist/project-utils.mjs';
import * as tree from './dist/catalog-tree.mjs';
import { createCatalogUI } from './dist/catalog-ui.mjs';
import * as media from './dist/catalog-media.mjs';
import * as resources from './dist/resource-catalog.mjs';
import { createResourceUI } from './dist/resource-ui.mjs';
import { createHardwareUI } from './dist/hardware-ui.mjs';

const appPath = fileURLToPath(new URL('./dist/app.mjs', import.meta.url));
const source = fs.readFileSync(appPath, 'utf8');
const appBindings = {};
for (const [, names, relative] of source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/gm)) {
  const imported = await import(new URL(relative, new URL('./dist/app.mjs', import.meta.url)));
  for (const binding of names.split(',')) {
    const [name, alias] = binding.trim().split(/\s+as\s+/);
    appBindings[alias || name] = imported[name];
  }
}
const startupMarker = "$('#footer-categories').innerHTML";
const startupOffset = source.indexOf(startupMarker);
assert.ok(startupOffset > 0, 'Could not find the app startup boundary; update this harness.');

// Import bindings are supplied by the actual modules above. Keep the real
// router, templates and rendering functions, but omit startup/event binding.
const renderingCode = source.slice(0, startupOffset)
  .replace(/^import\s+.*?;\s*$/gm, '');
assert.ok(!/^import\s/m.test(renderingCode), 'An unhandled multiline import remains.');

const main = {
  innerHTML: '',
  classList: { add() {}, remove() {} },
  focus() {},
};
const location = { hash: '#/', pathname: '/', search: '' };
const document = {
  title: '',
  querySelector(selector) { return selector === '#main' ? main : null; },
  querySelectorAll() { return []; },
  addEventListener() {},
};
const context = vm.createContext({
  ...catalogue,
  ...helpers,
  ...tree,
  createCatalogUI,
  ...media,
  ...resources,
  createResourceUI,
  createHardwareUI,
  ...appBindings,
  URLSearchParams,
  location,
  document,
  localStorage: { getItem() { return null; } },
  requestAnimationFrame(callback) { callback(); },
  window: { scrollTo() {} },
});

vm.runInContext(`${renderingCode}\nglobalThis.__routeAuditRender = render;`, context, {
  filename: appPath,
  timeout: 5_000,
});

const { categories, solutions } = catalogue;
const commonRoutes = ['#/', '#/catalog', '#/production', '#/production/request', '#/materials', '#/hardware', '#/project', '#/approach', '#/location', '#/structure', ...(appBindings.createPortfolioUI ? ['#/portfolio','#/content-editor','#/projects-map'] : [])];
const editorialRoutes = [...(appBindings.journalRoutes || []).map(n=>'#'+n.path), ...(appBindings.getPortfolioProjects?.() || []).filter(n=>n.published).map(n=>'#/portfolio/'+n.id)];
const categoryRoutes = categories.map(category => `#/catalog/${category.id}`);
const groupRoutes = categories.flatMap(category => category.groups.map(group =>
  `#/catalog/${category.id}/${group.id}`));
const solutionRoutes = solutions.map(solution => `#/solution/${solution.id}`);
const treeRoutes = tree.catalogNodes.map(n => n.url);
const aliasRoutes = [...tree.nodesByPath].filter(([path,node]) => path !== node.path).map(([path]) => '#'+path);
const resourceRoutes = resources.resourceNodes.map(n => n.url);
const resourceAliasRoutes = [...resources.resourceByPath].filter(([path,node]) => path !== node.path).map(([path]) => '#'+path);
const hardwareRoutes = [...resources.hardwareApplications.map(a => '#/hardware/'+a.id), ...resources.hardwareTypePages.map(n => n.url), ...resources.hardware.map(h => h.url)];
const routes = [...new Set([...commonRoutes, ...treeRoutes, ...aliasRoutes, ...groupRoutes, ...solutionRoutes, ...resourceRoutes, ...resourceAliasRoutes, ...hardwareRoutes, ...editorialRoutes])];
const knownRoutes = new Set(routes);
assert.equal(knownRoutes.size, routes.length, 'Duplicate route identifiers found.');

const errors = [];
const rendered = new Map();
const choiceRoutes = new Map();
const imageReferences = new Set();
const mediaReferences = new Set();
const isLocalAsset = src => /^\.?\/assets\//.test(src || '');
const assetFile = src => new URL('./dist/'+src.replace(/^\.?\//,'').split(/[?#]/)[0],import.meta.url);
const photoGroups = [
  ['/catalog/mirrors',8],
  ['/catalog/mirrors/with-light',4],
  ['/catalog/mirrors/framed',6],
  ['/catalog/mirrors/frameless',4],
  ['/catalog/mirrors/architecture',3],
  ['/catalog/showers',tree.nodesByPath.get('/catalog/showers')?.children.length || 0],
  ['/catalog/partitions',4],
  ['/catalog/stairs',3],
  ['/catalog/canopies',2],
];
const photoChoiceRoutes = new Set(photoGroups.map(([path]) => '#'+path));
let internalLinks = 0;

// These helpers inspect the generated markup, rather than source templates.
const attributes = markup => Object.fromEntries([...markup.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)]
  .map(([,name,,value]) => [name,value]));
const anchors = html => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
  .map(([,tag,body]) => ({ ...attributes(tag), body }));
const hasClass = (element, name) => (element.class || '').split(/\s+/).includes(name);
const routeHref = href => href?.startsWith('/') ? '#'+href : href;
const withoutDirectionNav = html => html.replace(/<nav\b[^>]*class="[^"]*\b(?:catalog-direction-nav|partition-system-nav)\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g,'');
const escapeHTML = value => String(value).replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function checkChoices(route, html, expected) {
  const current = tree.nodesByPath.get(route.slice(1));
  const scope = current?.isLeaf ? tree.nodesByPath.get(current.ancestors[1]) || tree.nodesByPath.get(current.parentPath) : current;
  const primaryHTML = current?.isLeaf ? html.split('<section class="family-directory"')[0] : html;
  const primaryCards = anchors(primaryHTML).filter(a => 'data-choice-path' in a);
  const cards = anchors(html).filter(a => 'data-choice-path' in a);
  const rawCount = [...html.matchAll(/\bdata-choice-path\s*=/g)].length;
  if (rawCount !== cards.length) errors.push(`${route}: a choice is not a complete anchor`);
  const expectedByPath = new Map(expected.map(node => [node.path,node]));
  for (const node of expected) {
    const matching = primaryCards.filter(a => a['data-choice-path'] === node.path);
    if (matching.length !== 1) errors.push(`${route}: expected exactly one choice for ${node.path}, found ${matching.length}`);
  }
  for (const card of cards) {
    const path = card['data-choice-path'], node = tree.nodesByPath.get(path);
    if (!node || (!expectedByPath.has(path) && !node.ancestors.includes(scope?.path))) {
      errors.push(`${route}: unexpected choice ${path || card.href}`);
      continue;
    }
    const isHeading = hasClass(card,'directory-group-heading');
    const isPartitionHub = current?.category==='partitions' && current.depth===1;
    const isSystemCard = isPartitionHub && hasClass(card,'partition-entry-card');
    const isSystemSubcard = isPartitionHub && node.depth===3 && /<strong>[^<]+<\/strong>/.test(card.body);
    if ((!hasClass(card,'choice-card') && !isHeading && !isSystemCard && !isSystemSubcard) || routeHref(card.href) !== node.url) {
      errors.push(`${route}: choice ${path} lost its full-card link or target`);
    }
    if (hasClass(card,'choice-final') !== node.isLeaf) errors.push(`${route}: incorrect final-choice marker for ${path}`);
    if (isSystemSubcard ? !/<span>[^<]+<\/span>/.test(card.body) : isSystemCard ? !/<h2\b[^>]*>[\s\S]+?<\/h2>/.test(card.body) || !/<p>[\s\S]+?<\/p>/.test(card.body) : isHeading ? !/<h2\b[^>]*>[^<]+<\/h2>/.test(card.body) : !/<h3\b[^>]*>[^<]+<\/h3>/.test(card.body) || !/class="choice-copy"/.test(card.body)) {
      errors.push(`${route}: choice ${path} must contain its heading and copy inside the anchor`);
    }
    if (/<(?:a|button|input|select|textarea)\b/i.test(card.body)) errors.push(`${route}: nested interactive control inside choice ${path}`);
    const photo = [...card.body.matchAll(/<img\b([^>]*)>/g)].map(([,tag]) => attributes(tag))
      .find(img => hasClass(img,'interior-image'));
    const asset = media.mediaForNode(node);
    if (!photo) errors.push(`${route}: choice ${path} is missing its photograph`);
    if (photo && (![asset.src,asset.thumbnail].includes(photo.src) || !photo.alt?.trim())) errors.push(`${route}: choice ${path} has no matching, labelled photograph`);
    if (photo && asset.file && !photo.srcset?.includes(asset.thumbnail+' 480w')) errors.push(`${route}: choice ${path} lost its thumbnail source`);
  }
  choiceRoutes.set(route,cards.map(card => routeHref(card.href)));
}

for (const route of routes) {
  location.hash = route;
  main.innerHTML = '';
  document.title = '';
  try {
    vm.runInContext('__routeAuditRender({ scroll: false });', context, { timeout: 5_000 });
  } catch (error) {
    errors.push(`${route}: render failed: ${error.message}`);
    continue;
  }
  const html = main.innerHTML;
  const title = document.title;
  const cleanURL = new URL(route.replace(/^#/, ''), 'https://audit.invalid');
  location.hash = '';
  location.pathname = cleanURL.pathname;
  location.search = cleanURL.search;
  try {
    vm.runInContext('__routeAuditRender({ scroll: false });', context, { timeout: 5_000 });
    if (main.innerHTML !== html || document.title !== title) errors.push(`${route}: clean pathname/search and legacy hash do not render the same page`);
  } catch (error) { errors.push(`${route}: clean route render failed: ${error.message}`); }
  rendered.set(route,html);
  if (!html.trim()) errors.push(`${route}: no rendered HTML`);
  if (html.includes('СТРАНИЦА НЕ НАЙДЕНА')) errors.push(`${route}: resolved to notFound()`);
  if (/vetro|gals|галс|стеклопакет|\bIGU\b/iu.test(html)) errors.push(`${route}: excluded product or internal source brand leaked into rendered HTML`);
  if (/(?:основа|база)[^<]{0,30}зел[её]н/iu.test(html)) errors.push(`${route}: green ordinary glass was offered as the base`);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  if (h1Count !== 1) errors.push(`${route}: expected one h1, found ${h1Count}`);
  if (!document.title.startsWith('VIP Glass — ')) errors.push(`${route}: missing page title`);
  if (route !== '#/structure' && /\b(?:catalog-outline|branch-jumps|visible-tree)\b/.test(html)) {
    errors.push(`${route}: the complete catalogue tree belongs only on the structure page`);
  }
  if (route === '#/catalog') {
    checkChoices(route,html,tree.catalogRoots);
    const rootTargets = new Set(tree.catalogRoots.map(n => n.url));
    for (const link of anchors(html)) {
      if (routeHref(link.href)?.startsWith('#/catalog/') && !rootTargets.has(routeHref(link.href))) errors.push(`${route}: skipped a choice level with ${link.href}`);
    }
    if (html.includes('id="config-form"')) errors.push(`${route}: configuration form appeared before final page`);
  }
  const node = tree.nodesByPath.get(route.slice(1));
  if (node) {
    if (!html.includes('class="interior-image')) errors.push(`${route}: missing interior photography`);
    if (html.includes('class="diagram"') || html.includes('Условная схема')) errors.push(`${route}: old drawing still visible`);
    const breadcrumbs = html.match(/<nav\b[^>]*class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
    const breadcrumbTargets = new Set(anchors(breadcrumbs).map(a => routeHref(a.href)));
    if (!breadcrumbTargets.has('#/catalog') || !breadcrumbs.includes('aria-current="page"')) errors.push(`${route}: missing catalogue breadcrumb or current-page marker`);
    for (const ancestor of node.ancestors) {
      if (!breadcrumbTargets.has(`#${ancestor}`)) errors.push(`${route}: missing breadcrumb ancestor ${ancestor}`);
    }
    const parentTarget = node.parentPath ? `#${node.parentPath}` : '#/catalog';
    if (!anchors(html).some(a => hasClass(a,'selection-back') && routeHref(a.href) === parentTarget)) errors.push(`${route}: missing back link to ${parentTarget}`);
    if (node.isLeaf) {
      const solution = tree.solutionForNode(node);
      if (solution.status !== node.status) errors.push(`${route}: base status overrides variant`);
      const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)]
        .map(([,tag,body]) => ({...attributes(tag),body})).filter(form => form.id === 'config-form');
      const form = forms[0];
      if (forms.length !== 1 || form?.['data-node'] !== node.path || form?.['data-solution'] !== solution.id) errors.push(`${route}: final form lost its solution or variant path`);
      const inputs = [...(form?.body || '').matchAll(/<input\b([^>]*)>/g)]
        .map(([,tag]) => ({...attributes(tag),checked:/\bchecked(?:\s|=|$)/.test(tag)}));
      for (const name of ['width','quantity','finish']) {
        if (!inputs.some(input => input.name === name)) errors.push(`${route}: final form lost ${name} input`);
      }
      if (inputs.some(input => input.name === 'height') !== (solution.sizeMode === 'axes')) errors.push(`${route}: final form has incorrect dimension inputs`);
      const expectedMode = solution.modes.includes(node.preset?.mode) ? node.preset.mode : solution.modes[0];
      const selectedModes = inputs.filter(input => input.name === 'mode' && input.checked);
      if (selectedModes.length !== 1 || selectedModes[0].value !== expectedMode) errors.push(`${route}: final form lost the selected order mode`);
      if (!/<button\b[^>]*type="submit"/.test(form?.body || '') || !/<textarea\b[^>]*name="note"/.test(form?.body || '')) errors.push(`${route}: final form lost its note or submit control`);
      const specs = html.match(/<dl\b[^>]*class="selected-specs"[^>]*>([\s\S]*?)<\/dl>/)?.[1] || '';
      for (const [label,value] of tree.presetRows(node)) {
        if (!specs.includes(`<dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd>`)) errors.push(`${route}: missing chosen parameter ${label}`);
      }
      const siblings = tree.nodesByPath.get(node.parentPath).children.filter(sibling => sibling.path !== node.path);
      checkChoices(route,html,siblings);
    } else {
      if (html.includes('id="config-form"')) errors.push(`${route}: configuration form appeared before final page`);
      if (node.children.length < 2) errors.push(`${route}: artificial singleton branch`);
      checkChoices(route,html,node.children);
      const allowed = new Set(['#/catalog',node.url,...node.ancestors.map(path => '#'+path),...tree.catalogNodes.filter(n=>n.ancestors.includes(node.path)).map(n=>n.url)]);
      for (const link of anchors(withoutDirectionNav(html))) {
        if (routeHref(link.href)?.startsWith('#/catalog') && !allowed.has(routeHref(link.href).split('?')[0])) errors.push(`${route}: unrelated choice outside this branch: ${link.href}`);
      }
    }
  }
  for (const [,tag] of html.matchAll(/<img\b([^>]*)>/g)) {
    const img = attributes(tag);
    if (isLocalAsset(img.src)) imageReferences.add(img.src);
    for (const candidate of (img.srcset || '').split(',')) {
      const src = candidate.trim().split(/\s+/)[0];
      if (isLocalAsset(src)) imageReferences.add(src);
    }
  }
  for (const [,tag] of html.matchAll(/<(?:video|source)\b([^>]*)>/g)) {
    const media = attributes(tag);
    if (isLocalAsset(media.src)) mediaReferences.add(media.src);
    if (isLocalAsset(media.poster)) imageReferences.add(media.poster);
  }
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (isLocalAsset(href)) { mediaReferences.add(href); continue; }
    if (!href.startsWith('#/') && !/^\/(?!\/)/.test(href)) continue;
    internalLinks++;
    const target = '#'+href.replace(/^#/,'').split(/[?#]/)[0];
    if (!knownRoutes.has(target)) errors.push(`${route}: unresolved internal link ${href}`);
  }
}

// Walk the actual rendered choice anchors, starting at the catalogue. This
// catches disconnected branches even when direct URL rendering still works.
const reached = new Set(), queue = ['#/catalog'];
while (queue.length) {
  const route = queue.shift();
  for (const next of choiceRoutes.get(route) || []) {
    if (!knownRoutes.has(next) || reached.has(next)) continue;
    reached.add(next);
    queue.push(next);
  }
}
for (const node of tree.catalogNodes) {
  if (!reached.has(node.url)) errors.push(`${node.url}: unreachable by catalogue choice cards`);
}
if (tree.catalogNodes.length < 340) errors.push(`Expected at least the original 340 catalogue pages, found ${tree.catalogNodes.length}`);
if (tree.treeStats.pages !== tree.catalogNodes.length || tree.treeStats.branches + tree.treeStats.leaves !== tree.catalogNodes.length) errors.push('Catalogue page/branch/leaf statistics disagree with the indexed tree');
const mapLinks = anchors(withoutDirectionNav(rendered.get('#/structure') || '')).map(a => routeHref(a.href)).filter(href => href?.startsWith('#/catalog/'));
if (mapLinks.length !== tree.catalogNodes.length) errors.push(`#/structure: expected ${tree.catalogNodes.length} catalogue links, found ${mapLinks.length}`);
for (const node of tree.catalogNodes) {
  const count = mapLinks.filter(href => href === node.url).length;
  if (count !== 1) errors.push(`#/structure: expected one link to ${node.path}, found ${count}`);
}

// Each key decision must have its own photograph, resolved through the real
// media module. Hashes also catch copies hidden behind different filenames.
const photoUniqueness = [];
for (const [path,expectedCount] of photoGroups) {
  const children = tree.nodesByPath.get(path)?.children || [];
  const assets = children.map(node => media.mediaForNode(node));
  if (children.length !== expectedCount) errors.push(`${path}: expected ${expectedCount} photo choices, found ${children.length}`);
  for (const field of ['src','thumbnail']) {
    if (new Set(assets.map(asset => asset[field])).size !== expectedCount) errors.push(`${path}: choice photos reuse ${field} paths`);
  }
  const hashes = [];
  for (const asset of assets) {
    imageReferences.add(asset.src);
    imageReferences.add(asset.thumbnail);
    const file = assetFile(asset.src);
    if (fs.existsSync(file)) hashes.push(createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
  }
  if (new Set(hashes).size !== hashes.length) errors.push(`${path}: different photo filenames contain duplicate image files`);
  photoUniqueness.push({path,choices:children.length,uniqueSources:new Set(assets.map(asset => asset.src)).size});
}
for (const src of new Set([...imageReferences,...mediaReferences])) {
  const file = assetFile(src);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) errors.push(`Missing or empty local asset ${src}`);
}

const unknownRoutes = ['#/unknown', '#/catalog/mirrors/unknown', '#/catalog/partitions/unknown', '#/catalog/partitions/all-glass/unknown', '#/solution/unknown', '#/production/unknown', '#/materials/unknown', '#/hardware/unknown', '#/hardware/item/unknown'];
for (const route of unknownRoutes) {
  for (const format of ['hash','path']) {
    location.hash = format === 'hash' ? route : '';
    location.pathname = route.slice(1);
    location.search = '';
    main.innerHTML = '';
    try {
      vm.runInContext('__routeAuditRender({ scroll: false });', context, { timeout: 5_000 });
      if (!main.innerHTML.includes('СТРАНИЦА НЕ НАЙДЕНА')) errors.push(`${route} (${format}): unknown route did not resolve to notFound()`);
    } catch (error) {
      errors.push(`${route} (${format}): invalid route threw instead of showing notFound(): ${error.message}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    result: 'PASS',
    routes: routes.length,
    catalogPages: tree.treeStats.pages,
    branchPages: tree.treeStats.branches,
    finalVariants: tree.treeStats.leaves,
    maxCatalogDepth: tree.treeStats.maxDepth,
    commonPages: commonRoutes.length,
    categories: categoryRoutes.length,
    subcategories: groupRoutes.length,
    solutions: solutionRoutes.length,
    checkedInternalLinks: internalLinks,
    checkedUnknownRoutes: unknownRoutes.length,
    resourcePages: resourceRoutes.length,
    hardwarePages: hardwareRoutes.length + 1,
    legacyAliases: aliasRoutes.length,
    reachableCatalogPages: reached.size,
    structureCatalogLinks: mapLinks.length,
    checkedImageFiles: imageReferences.size,
    checkedMediaFiles: mediaReferences.size,
    photoUniqueness,
    checks: ['actual clean and legacy hash router parity', 'one h1 per page', 'page title', 'internal links', 'not-found routes', 'direct-child full-card anchors', 'all catalogue pages reachable through choices', 'complete tree only on structure page', 'breadcrumb ancestry and parent back links', 'leaf sibling choices', 'forms only on final pages', 'variant parameters and selected mode preserved', 'photo paths and file uniqueness'],
    scope: 'Node VM and local file checks only; no browser, layout, interaction, or visual image assertions.',
  }, null, 2));
}
