#!/usr/bin/env node
// Render the actual application into independently addressable static pages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const shellPath = path.join(root, 'src/shell.html');
const origin = 'https://vipglass.example';
const checkOnly = process.argv.includes('--check');
const allowedArguments = new Set(['--check', '--help']);
for (const arg of process.argv.slice(2)) assert(allowedArguments.has(arg), `Unknown argument: ${arg}`);
if (process.argv.includes('--help')) {
  console.log('node build-pages.mjs --check  Validate every page without writing files.\nnode build-pages.mjs          Save the shell once, then generate static pages.');
  process.exit(0);
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = value => String(value).replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi, entity => {
  const named = {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  const hex = entity.toLowerCase().startsWith('&#x');
  return String.fromCodePoint(parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10));
});
const plain = value => decode(String(value ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const cleanPath = value => {
  const result = String(value).replace(/^#/, '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  assert(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(result), `Unsafe route: ${value}`);
  return result;
};
const canonical = route => origin + (route === '/' ? '/' : route);

const appPath = path.join(dist, 'app.mjs');
const source = fs.readFileSync(appPath, 'utf8');
const startupMarker = "$('#footer-categories').innerHTML";
const startupOffset = source.indexOf(startupMarker);
const listenerOffset = source.indexOf('document.addEventListener', startupOffset);
assert(startupOffset > 0 && listenerOffset > startupOffset, 'Application startup markers changed; update the renderer boundary.');
const imported = {};
const importJobs = [];
const renderingCode = source.slice(0, startupOffset).replace(/^import\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2\s*;[ \t]*(?:\r?\n|$)/gm, (_, bindings, quote, specifier) => {
  importJobs.push({bindings:bindings.trim(), specifier});
  return '';
});
assert(!/^\s*import\s/m.test(renderingCode), 'Unsupported import syntax in app.mjs.');
for (const {bindings, specifier} of importJobs) {
  assert(specifier.startsWith('./'), `Only local app imports are supported: ${specifier}`);
  const module = await import(new URL(specifier, pathToFileURL(appPath)));
  let rest = bindings;
  if (!rest.startsWith('{') && !rest.startsWith('*')) {
    const match = rest.match(/^([\w$]+)(?:\s*,\s*([\s\S]+))?$/);
    assert(match, `Unsupported import bindings: ${bindings}`);
    imported[match[1]] = module.default;
    rest = match[2] || '';
  }
  if (rest.startsWith('*')) {
    const match = rest.match(/^\*\s+as\s+([\w$]+)$/);
    assert(match, `Unsupported namespace import: ${bindings}`);
    imported[match[1]] = module;
  } else if (rest) {
    assert(rest.startsWith('{') && rest.endsWith('}'), `Unsupported named import: ${bindings}`);
    for (const binding of rest.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean)) {
      const match = binding.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      assert(match && match[1] in module, `Missing imported binding: ${binding} from ${specifier}`);
      imported[match[2] || match[1]] = module[match[1]];
    }
  }
}

const [tree, resources, catalogue] = await Promise.all([
  import('./dist/catalog-tree.mjs'), import('./dist/resource-catalog.mjs'), import('./dist/catalog.mjs'),
]);
const elements = new Map(['main', 'footer-categories', 'mega-categories', 'menu-resources'].map(id => [id, {
  innerHTML:'', classList:{add(){},remove(){}}, focus(){},
}]));
const location = {pathname:'/', search:'', hash:'', href:canonical('/')};
const document = {
  title:'', querySelector(selector){return selector.startsWith('#') ? elements.get(selector.slice(1)) || null : null;},
  querySelectorAll(){return [];},
};
const history = {pushState(){}, replaceState(){}};
const context = vm.createContext({
  ...imported, document, location, history, URL, URLSearchParams,
  localStorage:{getItem(){return null;}},
  requestAnimationFrame(callback){callback();}, setTimeout, clearTimeout,
  window:{scrollTo(){}, history},
});
vm.runInContext(renderingCode + '\n' + source.slice(startupOffset, listenerOffset) + `
globalThis.__staticRender = render;
globalThis.__staticLegacyGroup = (categoryId, groupId) => {
  const category = cats.get(categoryId), group = category?.groups.find(x => x.id === groupId);
  return group ? legacyGroupNode(category, group)?.path : null;
};`, context, {filename:'app.static-render.vm.js', timeout:30000});

const pages = new Map();
const homeCrumb = {path:'/', title:'Главная'};
const catalogCrumb = {path:'/catalog', title:'Каталог'};
const hardwareCrumb = {path:'/hardware', title:'Фурнитура конструкций'};
function addPage(page) {
  page.path = cleanPath(page.path);
  assert(!pages.has(page.path), `Duplicate page: ${page.path}`);
  pages.set(page.path, {sitemap:true, branch:false, children:[], ...page});
}
addPage({path:'/', title:'Стекло меняет всё', intro:'Стекло и зеркала на заказ. Интерьерные решения с установкой и изготовление деталей по размерам и чертежам.', trail:[homeCrumb]});
addPage({path:'/catalog', title:'Каталог', branch:true, children:tree.catalogRoots, trail:[homeCrumb,catalogCrumb]});
addPage({path:'/hardware', title:hardwareCrumb.title, branch:true, children:resources.hardwareApplications.map(a => ({...a,path:'/hardware/'+a.id})), trail:[homeCrumb,hardwareCrumb]});
for (const [route,title,sitemap] of [
  ['/project','Мой проект',false], ['/production/request','Производственное задание',false],
  ['/approach','Как мы работаем',true], ['/location','VIP Glass в Люберцах — как нас найти',true], ['/structure','Карта каталога',true],
]) addPage({path:route,title,sitemap,trail:[homeCrumb,...(route.startsWith('/production/') ? [{path:'/production',title:resources.servicesRoot.title}] : []),{path:route,title}]});
for (const node of tree.catalogNodes) addPage({
  path:node.path,title:node.title,intro:node.intro || tree.solutionForNode(node)?.description,
  branch:!node.isLeaf,children:node.children,trail:[homeCrumb,catalogCrumb,...tree.nodeTrail(node)],
});
for (const node of resources.resourceNodes) addPage({
  path:node.path,title:node.title,intro:node.intro || node.result,
  branch:!node.isLeaf,children:node.children,trail:[homeCrumb,...resources.resourceTrail(node)],
});
for (const application of resources.hardwareApplications) {
  const route = '/hardware/'+application.id;
  addPage({path:route,title:application.title,intro:application.intro,branch:true,children:resources.hardwareTypesFor(application.id),trail:[homeCrumb,hardwareCrumb,{path:route,title:application.title}]});
}
for (const item of resources.hardwareTypePages) addPage({path:item.path,title:item.title,intro:item.intro,branch:true,children:item.children,trail:[homeCrumb,hardwareCrumb,{path:'/hardware/'+item.category,title:item.applicationTitle},item]});
for (const item of resources.hardware) addPage({path:item.path,title:item.title,intro:item.intro,trail:[homeCrumb,hardwareCrumb,item]});

const {portfolioExamples}=await import('./dist/portfolio-data.mjs');
const {journalRoutes}=await import('./dist/journal-data.mjs');
const portfolioCrumb={path:'/portfolio',title:'Портфолио'};
addPage({path:'/portfolio',title:'Портфолио',branch:true,children:portfolioExamples.map(p=>({...p,path:'/portfolio/'+p.id})),trail:[homeCrumb,portfolioCrumb]});
for(const p of portfolioExamples)addPage({path:'/portfolio/'+p.id,title:p.title,intro:p.description,trail:[homeCrumb,portfolioCrumb,{path:'/portfolio/'+p.id,title:p.title}]});
for(const [path,title] of [['/content-editor','Редактор контента прототипа'],['/projects-map','Карта проектов']])addPage({path,title,sitemap:false,trail:[homeCrumb,{path,title}]});
for(const route of journalRoutes)addPage({...route,trail:[homeCrumb,...(route.path.startsWith('/journal/')?[{path:'/journal',title:'Журнал'}]:route.path.startsWith('/stories/')?[{path:'/stories',title:'Истории'}]:route.path.startsWith('/reels/')?[{path:'/reels',title:'Рилс'}]:[]),{path:route.path,title:route.title}]});

const aliases = new Map();
const {retiredHardwareRoutes} = await import('./dist/project-state.mjs');
for (const [route,target] of Object.entries(retiredHardwareRoutes)) aliases.set(route,target);
for (const solution of catalogue.solutions) {
  const node = tree.firstLeafBySolution.get(solution.id);
  if (node) aliases.set('/solution/'+solution.id, node.path);
}
for (const category of catalogue.categories) for (const group of category.groups) {
  const route = '/catalog/'+category.id+'/'+group.id;
  if (!pages.has(route)) {
    const target = context.__staticLegacyGroup(category.id,group.id);
    if (target) aliases.set(route,target);
  }
}
// Compatibility files have the same content and canonical as their real target.
// They are not extra catalogue entries and never enter the sitemap.
for (const [route,node] of tree.nodesByPath) if (route !== node.path && !pages.has(route)) aliases.set(route,node.path);
const {showersPathAliases = {}} = await import('./dist/showers-tree.mjs');
for (const [route,target] of Object.entries(showersPathAliases)) if (!pages.has(route)) aliases.set(route,target);
for (const [route,target] of Object.entries(resources.resourcePathAliases)) if(route!==target&&!pages.has(route)) aliases.set(route,target);
for (const node of resources.materialNodes) aliases.set(node.path.replace(/^\/materials/,'/production/materials'),node.path);
for (const [route,target] of aliases) {
  cleanPath(route);
  assert(pages.has(target), `Alias target is not a real page: ${route} → ${target}`);
}
function resolveRoute(route) {
  route = cleanPath(route);
  if (route === '/production/materials' || route.startsWith('/production/materials/')) route = route.replace('/production/materials','/materials');
  return aliases.get(route) || route;
}
function cleanLinks(html) {
  return html.replace(/\bhref=(['"])(.*?)\1/g, (attribute, quote, value) => {
    value = decode(value);
    if (!/^#?\/(?!\/)/.test(value)||value.startsWith('/assets/')) return attribute;
    const url = new URL(value.replace(/^#/, ''), origin);
    return 'href="' + escape(resolveRoute(url.pathname) + url.search + url.hash) + '"';
  });
}

const shellExists = fs.existsSync(shellPath);
const shell = fs.readFileSync(shellExists ? shellPath : path.join(dist,'index.html'), 'utf8');
assert(!/<meta\b[^>]*name=["']vipglass-static-page["']/i.test(shell), 'The shell contains a generated page. Restore the original empty shell in src/shell.html before building.');
assert(/<main\b[^>]*id=["']main["'][^>]*>\s*<\/main>/i.test(shell), 'Source shell must contain an empty #main.');
const replaceContent = (html,tag,id,content) => {
  const pattern = new RegExp('(<'+tag+'\\b[^>]*\\bid=["\']'+id+'["\'][^>]*>)[\\s\\S]*?(</'+tag+'>)','i');
  assert(pattern.test(html), `Missing shell element: ${id}`);
  return html.replace(pattern, (_,open,close) => open+content+close);
};
let populatedShell = shell;
for (const id of ['footer-categories','mega-categories','menu-resources']) populatedShell = replaceContent(populatedShell,'nav',id,elements.get(id).innerHTML);
populatedShell = populatedShell
  .replace(/<base\b[^>]*>/gi, '')
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
  .replace(/<meta\b(?=[^>]*\bname=["'](?:description|robots)["'])[^>]*>/gi, '')
  .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
  .replace(/<head>/i,'<head>\n<base href="/">');

function metadata(page, mainHTML) {
  const trailTitles = page.trail.slice(1).map(crumb => plain(crumb.title));
  const parents = trailTitles.slice(0,-1).filter(title => title !== 'Каталог');
  const title = 'VIP Glass — ' + plain(page.title) + (parents.length ? ' · '+parents.reverse().join(' / ') : '');
  const followingHeading = mainHTML.slice(mainHTML.search(/<\/h1>/i) + 5);
  const firstParagraph = followingHeading.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const intro = plain(page.intro || firstParagraph || page.title);
  const description = plain(page.title) + '. ' + intro + (trailTitles.length > 1 ? ' Раздел: '+trailTitles.slice(0,-1).join(' / ')+'.' : '');
  const url = canonical(page.path);
  const breadcrumbId = url+'#breadcrumbs';
  const graph = [];
  if (page.path !== '/') graph.push({
    '@type':'BreadcrumbList','@id':breadcrumbId,
    itemListElement:page.trail.map((crumb,index) => ({'@type':'ListItem',position:index+1,name:plain(crumb.title),item:canonical(cleanPath(crumb.path))})),
  });
  const webpage = {'@type':page.branch ? 'CollectionPage' : 'WebPage','@id':url+'#webpage',url,name:plain(page.title),description,inLanguage:'ru'};
  if (page.path !== '/') webpage.breadcrumb = {'@id':breadcrumbId};
  if (page.branch) webpage.mainEntity = {
    '@type':'ItemList',numberOfItems:page.children.length,
    itemListElement:page.children.map((child,index) => ({'@type':'ListItem',position:index+1,name:plain(child.title),url:canonical(cleanPath(child.path))})),
  };
  graph.push(webpage);
  return {title,description,url,structured:{'@context':'https://schema.org','@graph':graph}};
}

const outputs = [];
const usedTitles = new Map(), usedDescriptions = new Map(), checkedAssets = new Set();
function checkAsset(raw, route) {
  if (!raw || /^(?:https?:|data:|blob:|#)/i.test(raw)) return;
  const url = new URL(decode(raw), origin+'/');
  const asset = decodeURIComponent(url.pathname);
  if (checkedAssets.has(asset)) return;
  const file = path.resolve(dist, '.'+asset);
  assert(file.startsWith(dist+path.sep) && fs.existsSync(file) && fs.statSync(file).isFile(), `Missing local asset ${asset} on ${route}`);
  checkedAssets.add(asset);
}
function validateHTML(page, html, meta) {
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, `Expected one H1: ${page.path}`);
  assert(!html.includes('СТРАНИЦА НЕ НАЙДЕНА'), `Route rendered not-found: ${page.path}`);
  assert(!/\bhref=["']#\//.test(html), `Hash route remains: ${page.path}`);
  assert.equal((html.match(/<title\b/gi) || []).length, 1, `Duplicate title element: ${page.path}`);
  assert.equal((html.match(/<link\b[^>]*rel="canonical"/gi) || []).length, 1, `Canonical count: ${page.path}`);
  assert(html.includes('<meta name="robots" content="noindex,nofollow">'), `Robots restriction missing: ${page.path}`);
  for (const [value, used, kind] of [[meta.title,usedTitles,'title'],[meta.description,usedDescriptions,'description']]) {
    assert(!used.has(value), `Duplicate ${kind}: ${used.get(value)} and ${page.path}`);
    used.set(value,page.path);
  }
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const href = decode(match[1]);
    if (!/^\/(?!\/)/.test(href)) continue;
    if(href.startsWith('/assets/')){checkAsset(href,page.path);continue;}
    const target = cleanPath(new URL(href,origin).pathname);
    assert(pages.has(target), `Unbuilt internal route ${target} on ${page.path}`);
  }
  for (const match of html.matchAll(/<(?:img|video|source|script|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const attribute = tag.match(/\b(?:src|href)=["']([^"']+)["']/i);
    if (attribute) checkAsset(attribute[1],page.path);
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
    if (srcset) for (const candidate of srcset.split(',')) checkAsset(candidate.trim().split(/\s+/)[0],page.path);
  }
}

for (const page of pages.values()) {
  Object.assign(location,{pathname:page.path,search:'',hash:'',href:canonical(page.path)});
  context.__staticRender({scroll:false});
  const mainHTML = elements.get('main').innerHTML;
  assert(mainHTML.trim(), `Empty render: ${page.path}`);
  const meta = metadata(page,mainHTML);
  const json = JSON.stringify(meta.structured).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const head = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}">`,
    '<meta name="robots" content="noindex,nofollow">',
    `<meta name="vipglass-static-page" content="${escape(page.path)}">`,
    `<link rel="canonical" href="${escape(meta.url)}">`,
    `<script type="application/ld+json">${json}</script>`,
  ].join('\n');
  const html = cleanLinks(replaceContent(populatedShell,'main','main',mainHTML).replace('</head>',head+'\n</head>'));
  validateHTML(page,html,meta);
  const relativeFile = page.path === '/' ? 'index.html' : page.path.slice(1)+'/index.html';
  outputs.push({path:page.path,file:relativeFile,html});
}
const canonicalOutputs = new Map(outputs.map(output => [output.path,output]));
for (const [route,target] of aliases) {
  const targetOutput = canonicalOutputs.get(target);
  assert(targetOutput, `Missing alias target HTML: ${target}`);
  const html = targetOutput.html.replace(
    `<meta name="vipglass-static-page" content="${escape(target)}">`,
    `<meta name="vipglass-static-page" content="${escape(route)}">\n<meta name="vipglass-static-alias" content="${escape(target)}">`,
  );
  outputs.push({path:route,file:route.slice(1)+'/index.html',aliasOf:target,html});
}

const sitemapPaths = [...pages.values()].filter(page => page.sitemap).map(page => page.path).sort();
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemapPaths.map(route => '  <url><loc>'+escape(canonical(route))+'</loc></url>').join('\n')+'\n</urlset>\n';
const manifest = {version:1,origin,pages:outputs.map(({path,file,aliasOf}) => ({path,file,...(aliasOf ? {aliasOf} : {})})),sitemapPaths};
if (!checkOnly) {
  // Validation above finishes before touching the source shell or published files.
  if (!shellExists) {
    fs.mkdirSync(path.dirname(shellPath),{recursive:true});
    fs.writeFileSync(shellPath,shell,'utf8');
  }
  const manifestPath = path.join(dist,'static-pages.json');
  const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath,'utf8')) : null;
  const currentFiles = new Set(outputs.map(page => page.file));
  for (const old of previous?.pages || []) {
    if (currentFiles.has(old.file) || old.file === 'index.html') continue;
    assert(old.file === cleanPath(old.path).slice(1)+'/index.html', 'Invalid previous manifest entry.');
    const filename = path.join(dist,old.file);
    if (fs.existsSync(filename) && fs.readFileSync(filename,'utf8').includes('name="vipglass-static-page"')) fs.unlinkSync(filename);
  }
  for (const output of outputs) {
    const filename = path.join(dist,output.file);
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    fs.writeFileSync(filename,output.html,'utf8');
  }
  fs.writeFileSync(path.join(dist,'sitemap.xml'),sitemap,'utf8');
  fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n','utf8');
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
}
console.log(JSON.stringify({mode:checkOnly?'check':'build',pages:outputs.length,canonicalPages:pages.size,compatibilityPages:aliases.size,sitemap:sitemapPaths.length,assets:checkedAssets.size,branches:[...pages.values()].filter(page => page.branch).length,shell:shellExists?'src/shell.html':checkOnly?'dist/index.html (snapshot not written)':'src/shell.html (saved)',robots:'noindex,nofollow; Disallow: /'},null,2));
