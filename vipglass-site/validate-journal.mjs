import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {journalArticles,socialEntries,highlightCollections,journalRoutes} from './dist/journal-data.mjs';
import {createJournalUI} from './dist/journal-ui.mjs';
import {resourceByPath} from './dist/resource-catalog.mjs';
import {nodesByPath} from './dist/catalog-tree.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui=createJournalUI({esc,btn:(label,url)=>`<a href="${url}">${label}</a>`,crumb:items=>`<nav>${items.map(([t])=>esc(t)).join(' / ')}</nav>`});
ui.bind();ui.bind({querySelector(){},querySelectorAll(){return[];}});
function render(path){const p=path.split('/').filter(Boolean);if(path==='/journal')return ui.home();if(p[0]==='journal'&&p[1]==='article')return ui.article(p[2]);if(p[0]==='journal')return ui.articles(p[1]);if(path==='/stories')return ui.stories('active');if(['/stories/archive','/stories/highlights'].includes(path))return ui.stories(p[1]);if(p[0]==='stories')return ui.story(p[1]);if(path==='/reels')return ui.reels();if(p[0]==='reels')return ui.reel(p[1]);}
for(const r of journalRoutes){const html=render(r.path);assert.equal(typeof html,'string',r.path);assert.equal((html.match(/<h1\b/g)||[]).length,1,`Exactly one H1: ${r.path}`);assert(!html.includes('undefined'),r.path);assert(/демо|демонстрац/i.test(html),`Demo label: ${r.path}`);}
assert.equal(new Set(journalRoutes.map(x=>x.path)).size,journalRoutes.length);
assert.equal(journalArticles.filter(x=>x.kind==='useful').length,3);
assert.equal(journalArticles.filter(x=>x.kind==='news').length,2);
const stories=socialEntries.filter(e=>e.kind==='story');assert.equal(stories.length,6);
for(const e of stories){assert.equal(e.archived,e.status==='archived',e.id);const active=ui.stories('active'),archive=ui.stories('archive');assert.equal(active.includes(`href="#/stories/${e.id}"`),!e.archived,e.id);assert.equal(archive.includes(`href="#/stories/${e.id}"`),e.archived,e.id);}
for(const c of highlightCollections){assert(c.storyIds.length);for(const [i,id] of c.storyIds.entries()){const item=stories.find(e=>e.id===id);assert(item?.highlightIds.includes(c.id));const html=ui.story(id,new URLSearchParams({collection:c.id}));assert(html.includes(`${i+1} / ${c.storyIds.length}`));if(i>0)assert(html.includes(`href="#/stories/${c.storyIds[i-1]}?collection=${c.id}" data-story-prev`));else assert(!html.includes('data-story-prev'));if(i<c.storyIds.length-1)assert(html.includes(`href="#/stories/${c.storyIds[i+1]}?collection=${c.id}" data-story-next`));else assert(!html.includes('data-story-next'));}}
for(const e of stories)for(const c of e.highlightIds)assert(highlightCollections.find(x=>x.id===c)?.storyIds.includes(e.id));
const search=ui.articles('useful',new URLSearchParams({q:'душевая'}));assert(search.includes('shower-layout-and-opening'));assert(!search.includes('href="#/journal/article/choose-glass-by-sample"'));
assert(ui.articles('useful',new URLSearchParams({q:'<script>x</script>'})).includes('&lt;script&gt;'));
assert.equal(ui.article('missing'),null);assert.equal(ui.story('missing'),null);assert.equal(ui.reel('missing'),null);
const allowed=new Set(['/materials','/production','/production/request','/hardware','/catalog',...resourceByPath.keys(),...nodesByPath.keys()]);
for(const item of [...journalArticles,...socialEntries]){assert(item.demo);assert(/^\d{4}-\d{2}-\d{2}$/.test(item.publishDate));assert(allowed.has(item.related.path),`Related path: ${item.id} ${item.related.path}`);for(const m of [item.cover,item.media].filter(Boolean)){assert(existsSync(new URL('.'+m.src,import.meta.url).pathname.replace(/\/assets\//,'/dist/assets/')),`Media: ${m.src}`);if(m.poster)assert(existsSync(new URL('.'+m.poster,import.meta.url).pathname.replace(/\/assets\//,'/dist/assets/')),`Poster: ${m.poster}`);}}
for(const e of socialEntries.filter(x=>x.media.type==='video')){const html=e.kind==='reel'?ui.reel(e.id):ui.story(e.id);assert(html.includes('<video'));assert(html.includes(' controls '));assert(html.includes('playsinline'));assert(!html.includes('autoplay'));assert(html.includes(e.media.src));}
assert(ui.homepage().includes('#/journal'));assert(ui.homepage().includes('#/stories'));assert(ui.homepage().includes('#/reels'));
console.log(`Journal validated: ${journalRoutes.length} routes, ${journalArticles.length} articles, ${stories.length} stories, ${highlightCollections.length} collections; all media and related paths exist.`);
