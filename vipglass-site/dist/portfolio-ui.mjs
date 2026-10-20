import {categories} from './catalog.mjs';
import {nodesByPath} from './catalog-tree.mjs';
import {getPortfolioProjects,filterPortfolio,matchingPortfolio,portfolioFacetDefs,portfolioFacetOptions,portfolioStageDefs} from './portfolio-data.mjs';

export function createPortfolioUI({esc,btn,crumb}) {
  const categoryTitle=id=>categories.find(c=>c.id===id)?.shortTitle||id;
  const link=project=>'/portfolio/'+project.id;
  const stageHasContent=stage=>!!stage&&(stage.photos?.length>0||stage.videos?.length>0||!!stage.text?.trim());
  const stagesFor=project=>portfolioStageDefs.filter(stage=>stageHasContent(project.stages[stage.id]));
  const firstMedia=project=>project.cover||portfolioStageDefs.flatMap(stage=>project.stages[stage.id].photos)[0]||null;
  const completedMedia=project=>{
    const after=project.stages.after,video=after.videos.find(media=>media.poster);
    return after.photos[0]||(video?{src:video.poster,caption:project.title}:null)||project.cover||null;
  };
  const demoNotice=(projects,compact=false)=>projects.some(p=>p.isDemo)?`<aside class="portfolio-demo ${compact?'portfolio-demo--compact':''}"><span>Демонстрация</span><p>${compact?'AI-визуализации показывают формат портфолио. Это не фотографии выполненных работ.':'Сейчас здесь демонстрационные проекты. AI-визуализации и демонстрационный ролик показывают устройство портфолио; это не реальные объекты, этапы работ или отзывы клиентов.'}</p></aside>`:'';
  function card(project,{compact=false}={}) {
    const cover=compact?completedMedia(project):firstMedia(project),stages=stagesFor(project);
    const hasVideo=!compact&&stages.some(stage=>project.stages[stage.id].videos.length);
    return `<a class="portfolio-card" href="${link(project)}"><div class="portfolio-card-visual">${cover?`<img src="${esc(cover.src)}" alt="${esc(cover.caption||project.title)}" width="1254" height="1254" loading="lazy" decoding="async">`:`<div class="portfolio-card-placeholder"><span>${esc(categoryTitle(project.category))}</span></div>`}<div class="portfolio-card-badges">${project.isDemo?'<span>Демонстрация</span>':''}${hasVideo?'<span>Видео</span>':''}</div><span class="portfolio-card-arrow" aria-hidden="true">↗</span></div><div class="portfolio-card-copy">${compact?'':`<div class="portfolio-kicker">${esc(categoryTitle(project.category))} / ${esc(project.materialColor)}</div>`}<h3>${esc(project.title)}</h3><p>${esc(project.kind)}</p>${compact?'':`<div class="portfolio-card-stages">${stages.map(stage=>`<span>${esc(stage.label)}</span>`).join('<i aria-hidden="true">·</i>')}</div>`}</div></a>`;
  }
  const grid=(projects,options={})=>`<div class="portfolio-grid" data-portfolio-count="${projects.length}">${projects.map(project=>card(project,options)).join('')}</div>`;
  function home(params=new URLSearchParams()) {
    if(!(params instanceof URLSearchParams))params=new URLSearchParams(params);
    const all=getPortfolioProjects().filter(project=>project.published),projects=filterPortfolio(params,all);
    const active=portfolioFacetDefs.some(def=>params.get(def.id));
    return `${crumb([['Портфолио']])}<section class="portfolio-page"><header class="portfolio-heading"><div class="eyebrow">VIP GLASS / ПОРТФОЛИО</div><h1>Пространство.<br><em>Детали. История.</em></h1><p>Выберите изделие, цвет материала и вид конструкции. Внутри каждой истории — только те этапы, фотографии, видео и отзывы, которые добавлены к проекту.</p></header>${demoNotice(all)}<nav class="content-nav" aria-label="Разделы портфолио"><a href="/projects-map">Карта проектов ↗</a><a href="/stories">Истории ↗</a><a href="/content-editor">Редактор прототипа ↗</a></nav><form id="portfolio-filter-form" class="portfolio-filters" action="/portfolio" method="get">${portfolioFacetDefs.map(def=>`<label for="portfolio-${def.id}"><span>${esc(def.label)}</span><select id="portfolio-${def.id}" name="${def.id}"><option value="">${def.id==='product'?'Все изделия':def.id==='color'?'Все цвета':'Все виды'}</option>${portfolioFacetOptions(def,all).map(option=>`<option value="${esc(option.value)}" ${params.get(def.id)===option.value?'selected':''}>${esc(option.label)}</option>`).join('')}</select></label>`).join('')}<button type="submit" class="btn primary">Показать <span>→</span></button>${active?'<a class="portfolio-reset" href="/portfolio">Сбросить</a>':''}</form><div class="portfolio-results" aria-live="polite">${projects.length} ${projects.every(p=>p.isDemo)&&projects.length?'демонстрационных историй':'проектов'}${active?' по вашему выбору':''}</div>${projects.length?grid(projects):`<div class="portfolio-empty"><h2>${active?'Пока нет такого сочетания.':'Истории ещё не опубликованы.'}</h2><p>${active?'Измените параметры, чтобы посмотреть другие проекты.':'Раздел появится вместе с материалами проектов.'}</p>${active?btn('Сбросить фильтры','/portfolio','clear'):btn('Выбрать изделие','/catalog','clear')}</div>`}</section>`;
  }
  function photo(media,project) {
    const caption=media.caption||project.title;
    return `<figure class="portfolio-media portfolio-media--photo"><button type="button" class="portfolio-photo-button" data-portfolio-image="${esc(media.src)}" data-portfolio-caption="${esc(caption)}" aria-label="Увеличить: ${esc(caption)}"><img src="${esc(media.src)}" alt="${esc(caption)}" width="1254" height="1254" loading="lazy" decoding="async"><span aria-hidden="true">↗</span></button>${media.caption?`<figcaption>${esc(media.caption)}</figcaption>`:''}</figure>`;
  }
  function video(media,project) {
    return `<figure class="portfolio-media portfolio-media--video"><video controls playsinline preload="metadata"${media.poster?` poster="${esc(media.poster)}"`:''} aria-label="${esc(media.caption||project.title)}"><source src="${esc(media.src)}">Ваш браузер не поддерживает просмотр видео. <a href="${esc(media.src)}">Открыть видео</a></video>${media.caption||project.isDemo?`<figcaption>${esc(media.caption||(project.isDemo?'Демонстрационный ролик':''))}</figcaption>`:''}</figure>`;
  }
  function stageSection(def,project) {
    const stage=project.stages[def.id];
    if(!stageHasContent(stage))return '';
    const media=[...stage.photos.map(item=>photo(item,project)),...stage.videos.map(item=>video(item,project))];
    const text=stage.text?(def.id==='review'?`<div class="portfolio-review-text">${project.isDemo?'<span class="portfolio-review-label">Демонстрационный текст · не отзыв клиента</span>':''}<blockquote><p>${esc(stage.text)}</p>${stage.author?`<footer>${esc(stage.author)}</footer>`:''}</blockquote></div>`:`<div class="portfolio-stage-text"><p>${esc(stage.text)}</p></div>`):'';
    return `<section class="portfolio-stage ${def.id==='review'?'portfolio-stage--review':''}" id="portfolio-stage-${def.id}"><header class="portfolio-stage-heading"><span class="portfolio-stage-number">${String(portfolioStageDefs.indexOf(def)+1).padStart(2,'0')}</span><div><h2>${def.label}${project.isDemo?'<small>Демонстрация блока</small>':''}</h2>${!project.isDemo?`<p>${def.intro}</p>`:''}</div><div class="portfolio-stage-count">${stage.photos.length?`${stage.photos.length} фото`:''}${stage.photos.length&&stage.videos.length?' · ':''}${stage.videos.length?`${stage.videos.length} видео`:''}</div></header>${text}${media.length?`<div class="portfolio-media-grid portfolio-media-grid--${media.length===1?'single':media.length===2?'pair':'many'}">${media.join('')}</div>`:''}</section>`;
  }
  const attributeLabels={shape:'Форма',lighting:'Подсветка',frame:'Обрамление',frameMaterial:'Материал рамы',installation:'Установка',orientation:'Расположение',composition:'Композиция',finish:'Отделка',mirrorColor:'Цвет зеркала',material:'Материал',glass:'Стекло',application:'Назначение',opening:'Открывание',mounting:'Крепление',geometry:'Геометрия',configuration:'Состав',glassCount:'Количество стёкол',movingCount:'Подвижные полотна',fixedCount:'Неподвижные полотна',entryPosition:'Вход',sections:'Секции',handrail:'Поручень',bevel:'Фацет',bevelWidth:'Ширина фацета',edge:'Кромка',layout:'Раскладка',function:'Функция',functions:'Функции',color:'Цвет',treatment:'Обработка',decor:'Декор',motifPlacement:'Положение рисунка',turningType:'Поворот лестницы',deliverySet:'Комплект'};
  function detail(id) {
    const project=getPortfolioProjects().find(item=>item.id===id&&item.published);
    if(!project)return `${crumb([['Портфолио','/portfolio'],['Проект не найден']])}<section class="portfolio-page portfolio-empty"><h1>Проект не найден</h1><p>Этот проект не опубликован или адрес изменился.</p>${btn('Открыть портфолио','/portfolio')}</section>`;
    const stages=stagesFor(project),mediaCount=stages.reduce((count,stage)=>count+project.stages[stage.id].photos.length+project.stages[stage.id].videos.length,0);
    const products=project.productPaths.map(path=>nodesByPath.get(path)).filter(Boolean);
    const attributes=Object.entries(project.characteristics).filter(([key])=>attributeLabels[key]||/[а-яё]/i.test(key));
    return `${crumb([['Портфолио','/portfolio'],[project.title]])}<article class="portfolio-page portfolio-project ${mediaCount===1?'portfolio-project--single':''}"><a class="portfolio-back" href="/portfolio">← Все истории</a><header class="portfolio-project-heading"><div class="eyebrow">${esc(categoryTitle(project.category))} / ${esc(project.kind)}</div><h1>${esc(project.title)}</h1><p>${esc(project.description)}</p><div class="portfolio-tags"><span>${esc(project.materialColor)}</span>${stages.map(stage=>`<span>${esc(stage.label)}</span>`).join('')}</div></header>${demoNotice([project])}${!mediaCount&&project.cover?`<div class="portfolio-media-grid portfolio-media-grid--single">${photo(project.cover,project)}</div>`:''}<div class="portfolio-story">${stages.map(stage=>stageSection(stage,project)).join('')}</div>${attributes.length?`<details class="portfolio-characteristics"><summary>Характеристики выбранного решения <span aria-hidden="true">+</span></summary><dl>${attributes.map(([key,value])=>`<div><dt>${esc(attributeLabels[key]||key)}</dt><dd>${esc(Array.isArray(value)?value.join(', '):String(value))}</dd></div>`).join('')}</dl></details>`:''}${products.length?`<section class="portfolio-products"><div><div class="eyebrow">ПРОДОЛЖИТЬ ВЫБОР</div><h2>Решение<br><em>для вашего проекта.</em></h2></div><nav aria-label="Связанные решения каталога">${products.map(node=>`<a href="${node.path}"><span>${esc(node.title)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav></section>`:''}</article>`;
  }
  function related(node,selected={}) {
    const projects=matchingPortfolio(node,selected).slice(0,3);
    if(!projects.length)return '';
    return `<section class="portfolio-related"><div class="portfolio-section-top"><div class="eyebrow">ПОРТФОЛИО / ПО ХАРАКТЕРИСТИКАМ</div><h2>Такое решение<br><em>в пространстве.</em></h2><a href="/portfolio?product=${esc((node.treeNode||node).category||'')}">Все истории →</a></div>${demoNotice(projects,true)}${grid(projects)}</section>`;
  }
  function homepage() {
    const all=getPortfolioProjects().filter(project=>project.published&&completedMedia(project)),projects=all.slice(0,3);
    if(!projects.length)return '';
    return `<section class="portfolio-home"><div class="portfolio-section-top"><div class="eyebrow">VIP GLASS / ПОРТФОЛИО</div><h2>За каждым пространством —<br><em>своя история.</em></h2>${btn('Открыть портфолио','/portfolio','clear')}</div><p class="portfolio-home-intro">Готовые решения в интерьере. Откройте проект, чтобы рассмотреть его подробнее.</p>${demoNotice(projects,true)}${grid(projects,{compact:true})}</section>`;
  }
  return {home,detail,related,homepage};
}
