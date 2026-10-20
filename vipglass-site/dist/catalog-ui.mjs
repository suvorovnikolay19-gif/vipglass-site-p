import { categories, materialPolicy } from './catalog.mjs';
import { catalogRoots, rootById, nodesByPath, nodeTrail, solutionForNode, presetRows } from './catalog-tree.mjs';
import { photoMarkup, galleryMarkup } from './catalog-media.mjs';
import { getPageContent } from './page-content.mjs';
import {catalogDirectory,categoryPreview} from './catalog-directory.mjs';

/** Visible families and subtypes, with a dedicated page for every execution. */
export function createCatalogUI({esc, btn, crumb, field, modePicker, cta, heightLabel, hardwarePicker=()=>'', hardwareEntry=()=>'', materialPicker=()=>'', categoryFilter=()=>'', relatedPortfolio=()=>'',categoryNavigation=()=>'',specificationFields=()=>''}) {
  const titleFor = node => node.depth === 1 ? categories.find(c=>c.id===node.id).shortTitle : node.title;
  const countLabel = n => `${n} ${n%10===1&&n%100!==11?'вариант':n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'варианта':'вариантов'}`;
  const concise = text => {
    const value=String(text||'').trim();
    if(value.length<=140)return value;
    const sentence=value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    return sentence&&sentence.length<=170?sentence:value.slice(0,137).replace(/\s+\S*$/,'')+'…';
  };
  function trail(node) {
    return crumb([['Каталог','#/catalog'],...nodeTrail(node).map(n=>[titleFor(n),n.path===node.path?null:n.url])]);
  }
  function toolbar(node) {
    const parent=nodesByPath.get(node.parentPath);
    return `<nav class="selection-toolbar" aria-label="Вернуться к выбору"><a class="selection-back" href="${parent?.url||'#/catalog'}"><span aria-hidden="true">←</span><span>${parent?esc(parent.title):'Все направления'}</span></a><a class="selection-map" href="#/structure">Карта каталога <span aria-hidden="true">↗</span></a></nav>`;
  }
  function differences(node,siblings=[]) {
    if(!node.isLeaf)return [];
    const rows=presetRows(node), other=siblings.filter(s=>s!==node);
    return rows.filter(([label,value])=>other.some(s=>new Map(presetRows(s)).get(label)!==value)).slice(0,3);
  }
  function choiceCard(node,index=0,siblings=[],withPhoto=true) {
    const diff=differences(node,siblings);
    return `<a class="choice-card ${node.isLeaf?'choice-final':''} ${withPhoto?'':'choice-option'}" href="${node.url}" data-choice-path="${node.path}">${withPhoto?`<div class="choice-photo">${photoMarkup(node)}<span class="choice-number">${String(index+1).padStart(2,'0')}</span></div>`:`<span class="option-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>`}<div class="choice-copy"><h3>${esc(titleFor(node))}</h3>${diff.length?`<dl class="choice-differences">${diff.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`:`<p>${esc(concise(node.intro))}</p>`}${!node.isLeaf?categoryPreview(node,esc):''}<div class="choice-bottom"><span>${node.isLeaf?(node.modelKind&&node.modelKind!=='configuration'?'Вариант комплектации':'Размеры и заказ'):countLabel(node.leafCount)+' внутри раздела'}</span><span class="choice-arrow" aria-hidden="true">→</span></div></div></a>`;
  }
  function categoryCard(category,index) { return choiceCard(rootById.get(category.id),index); }
  function finalCard(node,index=0) {
    return choiceCard(node,index,nodesByPath.get(node.parentPath)?.children||[]);
  }
  function choices(nodes,{optionsOnly=false}={}) {
    return `<div class="choice-grid ${nodes.length===2?'two-choices':''} ${optionsOnly?'related-choice-grid':''}" data-choice-count="${nodes.length}">${nodes.map((n,i)=>choiceCard(n,i,nodes,true)).join('')}</div>`;
  }
  function optionalGuide(node) {
    const content=getPageContent(node);
    return `<details class="choice-help"><summary>Что учесть при выборе <span aria-hidden="true">+</span></summary><div class="choice-help-body"><p>${esc(content.description)}</p><div class="consideration-grid">${content.considerations.map(c=>`<article><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('')}</div></div></details>`;
  }
  function catalogHome() {
    return `${crumb([['Каталог']])}<section class="selection-page"><header class="selection-heading"><div class="eyebrow">VIP GLASS / ВЫБЕРИТЕ НАПРАВЛЕНИЕ</div><h1>Что создадим<br><em>для вашего пространства?</em></h1><p>Начните с изделия. Затем выберите его вид, форму и исполнение.</p></header>${choices(catalogRoots)}<div class="selection-footer"><a href="#/production" class="btn clear">Есть свой чертёж <span>↗</span></a><a href="#/structure" class="selection-map">Посмотреть всю карту каталога ↗</a></div></section>`;
  }
  function branchPage(node) {
    const root=rootById.get(node.category),terminal=node.children.every(n=>n.isLeaf);
    const prompt=terminal?'Все исполнения показаны отдельно. Выберите подходящее и задайте параметры в карточке.':'Все виды и их подвиды собраны ниже. Можно открыть общий раздел или сразу перейти к конкретной разновидности.';
    return `${trail(node)}${categoryNavigation(node)}<section class="selection-page">${toolbar(node)}<header class="selection-heading"><div class="selection-eyebrow"><span class="eyebrow">${esc(titleFor(root))} / ${terminal?'ИСПОЛНЕНИЕ':'ВЫБОР ВИДА'}</span><span class="selection-step">${countLabel(node.leafCount)}</span></div><h1>${esc(node.title)}</h1>${node.category==='partitions'?`<p>${esc(node.intro)}</p>`:''}<p>${esc(prompt)}</p></header>${node.depth===1?categoryFilter(node.category):''}${node.children.some(n=>!n.isLeaf)?catalogDirectory(node.children,{esc,photo:n=>photoMarkup(n),card:(n,i,withPhoto=true)=>choiceCard(n,i,nodesByPath.get(n.parentPath)?.children||[],withPhoto)}):choices(node.children,{context:node})}${node.depth===1?hardwareEntry(node.category):''}${optionalGuide(node)}<div class="selection-footer"><p>Не нашли свой вариант? Начните с эскиза или описания.</p><a class="btn clear" href="#/production">Изготовить по вашему ТЗ <span>↗</span></a></div></section>`;
  }
  function leafPage(solution) {
    const s=solution,node=s.treeNode,root=rootById.get(node.category),parent=nodesByPath.get(node.parentPath);
    const rows=presetRows(node),modes=s.modes,selected=modes.includes(node.preset?.mode)?node.preset.mode:modes[0];
    const related=parent.children.filter(n=>n.path!==node.path),family=nodesByPath.get(node.ancestors[1])||parent,copy=getPageContent(node);
    return `${trail(node)}${categoryNavigation(node)}<section class="selection-page selected-product">${toolbar(node)}<div class="leaf-layout"><div class="leaf-visual">${galleryMarkup(node)}</div><div class="leaf-details"><div class="eyebrow">${esc(titleFor(root))} / ВЫБРАННОЕ ИСПОЛНЕНИЕ</div><h1>${esc(node.title)}</h1><p>${esc(node.intro)}</p>${rows.length?`<dl class="selected-specs">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`:''}<form class="config-form" id="config-form" data-solution="${esc(s.id)}" data-node="${node.path}"><span class="eyebrow">РАЗМЕРЫ И ДЕТАЛИ ЗАКАЗА</span>${modePicker(modes,selected)}${materialPicker(s.category)}${hardwarePicker(s.category)}${specificationFields(node)}<div class="form-grid">${field(esc(s.sizeMode==='diameter'?'Диаметр':s.sizeMode==='side'?'Сторона':s.preset?.widthLabel||'Ширина')+', мм','width','','number','min="1" step="any" placeholder="По вашему размеру"')}${s.sizeMode==='axes'?field(heightLabel(s)+', мм','height','','number','min="1" step="any" placeholder="По вашему размеру"'):''}${field('Количество, шт.','quantity',1,'number','min="1" step="1" required')}${node.preset?.bevelWidthMm!==undefined?field('Ширина фацета, мм','bevel-width',node.preset.bevelWidthMm,'number',`min="0.1" step="any" ${node.preset.bevelWidthMm?'readonly':'required placeholder="По вашему чертежу"'}`):''}${field(s.category==='mirrors'?'Цвет зеркала / обрамления':'Отделка креплений','finish','','text','placeholder="Указать пожелание"')}<div class="field full"><label for="note">Ваши пожелания</label><textarea id="note" name="note" placeholder="Особенности пространства, установки и отделки…"></textarea></div></div><p class="form-note" style="margin:0 0 20px">${s.category==='mirrors'?'Прозрачные стеклянные элементы — Crystal Vision. Цвет зеркала и обрамления согласуется отдельно.':materialPolicy.base+'. Состав и крепления определяются по проекту.'}</p><button class="btn primary" type="submit">Добавить в мой проект <span>+</span></button><div class="added-confirmation" id="added-confirmation" hidden><span>Исполнение добавлено.</span><a href="#/project">Перейти в мой проект →</a></div><p class="form-note">Размеры можно уточнить позже. Чертежи и фотографии добавляются в общем проекте.</p></form>${s.status==='structure'?'<p class="form-note">Возможность реализации выбранного сочетания и комплектацию подтвердим после изучения вашего проекта.</p>':''}</div></div>${relatedPortfolio(node)}<div class="product-questions"><h2>Детали проекта</h2>${copy.faq.map(q=>`<details><summary>${esc(q.question)}</summary><p>${esc(q.answer)}</p></details>`).join('')}</div>${related.length?`<section class="selected-alternatives"><div class="alternatives-heading"><h2>Другие исполнения</h2><a class="selection-back" href="${parent.url}">← ${esc(parent.title)}</a></div>${choices(related,{optionsOnly:true})}</section>`:''}${family.path!==parent.path?`<section class="family-directory"><div class="section-top"><h2>Все виды: ${esc(family.title)}</h2><a class="selection-back" href="${family.url}">Открыть раздел →</a></div>${catalogDirectory(family.children,{esc,photo:n=>photoMarkup(n),card:(n,i,withPhoto=true)=>choiceCard(n,i,nodesByPath.get(n.parentPath)?.children||[],withPhoto)})}</section>`:''}</section>`;
  }
  function visibleTree(nodes,current='') {
    return `<ul class="visible-tree">${nodes.map(n=>`<li class="${n.isLeaf?'tree-leaf':'tree-branch'}"><a href="${n.url}" ${n.path===current?'aria-current="page"':''}>${esc(n.title)}</a>${n.children.length?visibleTree(n.children,current):''}</li>`).join('')}</ul>`;
  }
  function structurePage() {
    return `${crumb([['Карта каталога']])}<section class="selection-page"><header class="selection-heading"><div class="eyebrow">ВСЕ УРОВНИ КАТАЛОГА</div><h1>Вся коллекция<br><em>на одной странице.</em></h1><p>Здесь можно увидеть полную структуру. Для последовательного выбора откройте каталог с карточками.</p><div class="button-row">${btn('Выбирать по карточкам','#/catalog')}</div></header><div class="map-grid">${catalogRoots.map(root=>`<section class="map-category"><h2><a href="${root.url}">${esc(titleFor(root))} ↗</a></h2>${visibleTree(root.children)}</section>`).join('')}</div></section>`;
  }
  function directionNavigation(current='') {
    return `<nav class="catalog-direction-nav" aria-label="Все направления VIP Glass">${categories.map(c=>`<a href="/catalog/${c.id}" ${current===c.id?'aria-current="page"':''}>${esc(c.shortTitle)} <span aria-hidden="true">↗</span></a>`).join('')}</nav>`;
  }
  function menu() {
    return catalogRoots.map((root,i)=>`<a class="menu-direction" href="${root.url}"><div>${photoMarkup(root,{small:true})}</div><span><strong>${esc(titleFor(root))}</strong><small>${countLabel(root.children.length)} для выбора</small></span><span class="menu-direction-arrow" aria-hidden="true">↗</span></a>`).join('');
  }
  return {directionNavigation,categoryCard,catalogHome,branchPage,leafPage,structurePage,visibleTree,finalCard,menu};
}
