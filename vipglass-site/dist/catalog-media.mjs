import {exactCatalogMedia} from './exact-catalog-media.mjs';
const base='./assets/interiors/';
export const mediaAssets={
  'shower-folding':{file:'shower-folding.webp',alt:'Складная стеклянная дверь из двух связанных полотен в душевой нише'},
  'shower-corner-sliding':{file:'shower-corner-sliding.webp',alt:'Угловое душевое ограждение с раздвижными створками'},
  'shower-u-shape':{file:'shower-u-shape.webp',alt:'П-образное душевое ограждение с тремя стеклянными сторонами'},
  'shower-pentagonal':{file:'shower-pentagonal.webp',alt:'Душевое ограждение со скошенной входной стороной'},
  'shower-tub-screen':{file:'shower-tub-screen.webp',alt:'Прозрачная стеклянная шторка на борту ванны'},
  'shower-telescopic':{file:'shower-telescopic.webp',alt:'Иллюстрация раздвижных полотен душевой на верхней направляющей'},
  'shower-sloped':{file:'shower-sloped.webp',alt:'Душевое остекление под скосом мансарды'},

  'mirror-backlit-round':{file:'mirror-backlit-round.webp',alt:'Круглое зеркало с мягкой подсветкой в светлом интерьере'},
  'mirror-backlit-rect':{file:'mirror-backlit-rect.webp',alt:'Прямоугольное зеркало с подсветкой в ванной комнате'},
  'mirror-brass-round':{file:'mirror-brass-round.webp',alt:'Круглое зеркало в тонком латунном обрамлении'},
  'mirror-wood-arch':{file:'mirror-wood-arch.webp',alt:'Арочное зеркало в деревянной раме в интерьере'},
  'mirror-frameless-arch':{file:'mirror-frameless-arch.webp',alt:'Высокое арочное зеркало без рамы в светлом интерьере'},
  'mirror-panel-bevel':{file:'mirror-panel-bevel.webp',alt:'Зеркальное панно с геометрической раскладкой в гостиной'},
  'mirror-wall':{file:'mirror-wall.webp',alt:'Зеркальная стена в современном интерьере'},
  'mirror-decorative-bronze':{file:'mirror-decorative-bronze.webp',alt:'Декоративное состаренное зеркало бронзового оттенка'},
  'mirror-pivot':{file:'mirror-pivot.webp',alt:'Поворотное зеркало с опорами в интерьере'},
  'mirror-smart':{file:'mirror-smart.webp',alt:'Концепция интерактивного зеркала в современном интерьере'},
  'mirror-front-light':{file:'mirror-front-light.webp',alt:'Зеркало со световой зоной на лицевой стороне'},
  'mirror-combined-light':{file:'mirror-combined-light.webp',alt:'Зеркало с лицевой и контурной подсветкой'},
  'mirror-dressing':{file:'mirror-dressing.webp',alt:'Гримёрное зеркало с освещением у туалетного столика'},
  'mirror-metal-rect':{file:'mirror-metal-rect.webp',alt:'Прямоугольное зеркало в металлической раме'},
  'mirror-aluminium-oval':{file:'mirror-aluminium-oval.webp',alt:'Овальное зеркало в алюминиевом обрамлении'},
  'mirror-baguette':{file:'mirror-baguette.webp',alt:'Зеркало в декоративной багетной раме'},
  'mirror-soft-frame':{file:'mirror-soft-frame.webp',alt:'Зеркало в мягком обрамлении в интерьере'},
  'mirror-freeform':{file:'mirror-freeform.webp',alt:'Зеркало свободной формы без рамы'},
  'mirror-frameless-round':{file:'mirror-frameless-round.webp',alt:'Круглое зеркало без рамы и подсветки'},
  'mirror-frameless-rect':{file:'mirror-frameless-rect.webp',alt:'Прямоугольное зеркало без рамы и подсветки'},
  'mirror-ceiling':{file:'mirror-ceiling.webp',alt:'Зеркальная потолочная композиция в интерьере'},
  'mirror-door':{file:'mirror-door.webp',alt:'Дверная композиция с зеркальной поверхностью'},
  'mirror-panel-geometric':{file:'mirror-panel-geometric.webp',alt:'Декоративная композиция из зеркал круглой, овальной и свободной формы'},
  'shower-niche':{file:'shower-niche.webp',alt:'Прозрачная стеклянная душевая в нише с каменной отделкой'},
  'shower-corner':{file:'shower-corner.webp',alt:'Угловая душевая из осветлённого прозрачного стекла'},
  'shower-open':{file:'shower-open.webp',alt:'Открытая душевая зона со стационарным стеклянным экраном'},
  'bath-glazing':{file:'bath-glazing.webp',alt:'Стеклянная перегородка и дверь в пространстве бани'},
  'partition-clear':{file:'partition-clear.webp',alt:'Прозрачная стеклянная перегородка в жилом пространстве'},
  'partition-framed':{file:'partition-framed.webp',alt:'Стеклянная офисная перегородка в тонком тёмном каркасе'},
  'partition-loft':{file:'partition-loft.webp',alt:'Лофт-перегородка со стеклянным заполнением и тёмной металлической раскладкой'},
  'partition-double-blinds':{file:'partition-double-blinds.webp',alt:'Каркасная перегородка с двумя рядами стекла и жалюзи между ними'},
  'partition-smart':{file:'partition-smart.webp',alt:'Визуализация прозрачного и матового состояния SMART-перегородки'},
  'partition-shop':{file:'partition-shop.webp',alt:'Цельностеклянное зонирование магазина с прозрачным входом'},
  'door-swing':{file:'door-swing.webp',alt:'Распашная стеклянная дверь в светлом интерьере'},
  'door-sliding':{file:'door-sliding.webp',alt:'Раздвижная стеклянная дверь с верхней направляющей'},
  'stairs-glass':{file:'stairs-glass.webp',alt:'Лестница на металлическом основании со стеклянным ограждением'},
  'glass-steps':{file:'glass-steps.webp',alt:'Прозрачные стеклянные ступени в лестничной композиции'},
  'railing-landing':{file:'railing-landing.webp',alt:'Стеклянное ограждение второго света с тонким поручнем'},
  'railing-outdoor':{file:'railing-outdoor.webp',alt:'Стеклянное ограждение открытой террасы'},
  'canopy-profile':{file:'canopy-profile.webp',alt:'Стеклянный козырёк с креплением на зажимном профиле'},
  canopy:{src:'./assets/canopy.webp',alt:'Козырёк из осветлённого стекла на тягах'},
};
// A material choice shows the selected surface before the inherited room cover.
// Explicit paths keep production samples usable in the same gallery and zoom.
const samples={
  'material-clear':'Образец бесцветного осветлённого стекла',
  'material-bronze':'Образец прозрачного стекла бронзового оттенка',
  'material-graphite':'Образец прозрачного стекла серого оттенка',
  'material-tinted':'Образцы тонированного стекла разных оттенков',
  'material-satin':'Образец светлого матового стекла',
  'material-satin-bronze':'Образец матового стекла бронзового оттенка',
  'material-satin-graphite':'Образец матового стекла серого оттенка',
  'material-fluted':'Образец бесцветного рифлёного стекла',
  'material-fluted-bronze':'Образец рифлёного стекла бронзового оттенка',
  'material-fluted-graphite':'Образец рифлёного стекла серого оттенка',
  'material-smart':'Образцы прозрачного и матового состояния SMART-стекла',
  'material-marble-print':'Пример печатного рисунка мрамора на стекле',
  'material-printed-photo':'Образец изображения, напечатанного на стекле',
  'material-film-application':'Пример нанесения декоративной плёнки на стекло',
  'service-bending':'Образец гнутого прозрачного стекла',
  'service-lamination':'Образец многослойного стекла с видимым торцом',
  'service-sandblast':'Образец частичного матирования на прозрачном стекле',
  'service-engraving':'Образец тонких гравированных линий на прозрачном стекле',
};
for(const [key,alt] of Object.entries(samples))mediaAssets[key]={src:`./assets/production/${key}.webp`,thumbnail:`./assets/production/${key}-480.webp`,alt,kind:'sample'};
mediaAssets['hardware-wood-handrail']={src:'./assets/hardware-real/wood-glass-handrail.jpg',thumbnail:'./assets/hardware-real/wood-glass-handrail.jpg',alt:'Деревянный поручень для стеклянного ограждения, чёрная отделка',kind:'detail',real:true,caption:'Изображение деревянного поручня из каталога. Показана чёрная отделка.'};
const newInteriors={
  'partition-allglass-telescopic':'Цельностеклянные раздвижные полотна на параллельных направляющих',
  'partition-allglass-folding':'Два связанных стеклянных полотна, сложенных книжкой',
  'partition-allglass-stacking':'Независимые стеклянные секции, собранные в боковой парковке',
  'partition-framed-sliding':'Раздвижная дверь в тонком каркасе с открытым проходом',
  'partition-framed-double-clear':'Два независимых ряда прозрачного стекла в каркасной перегородке',
  'partition-loft-sliding':'Раздвижные стеклянные полотна в тёмном каркасе с раскладкой',
  'partition-loft-folding':'Складные стеклянные полотна в тёмном каркасе',
  'partition-loft-pivot':'Стеклянная дверь в тёмном каркасе, повёрнутая на вертикальной оси',
  'partition-smart-segmented':'SMART-стекло с матовой горизонтальной зоной и прозрачными участками',
  'railing-posts':'Стеклянное ограждение с креплением к металлическим стойкам',
  'railing-inclined-profile':'Лестничное стеклянное ограждение на наклонном зажимном профиле',
};
for(const [key,alt] of Object.entries(newInteriors))mediaAssets[key]={file:key+'.webp',alt,kind:'interior'};
const defaults={mirrors:'mirror-backlit-round',showers:'shower-niche',partitions:'partition-clear',doors:'door-swing',stairs:'stairs-glass',canopies:'canopy'};
for(const [path,asset] of Object.entries(exactCatalogMedia)) {
  const key='exact-'+path.split('/').filter(Boolean).join('-');
  mediaAssets[key]={...asset,key,kind:'interior',exact:true};
}
const mirrorFamilies=['with-light','framed','frameless','panels','architecture','pivot','smart','decorative'];

function mirrorMedia(n, route) {
  const preset=n.preset||{},type=n.solutionId||n.id||'';
  const frame=String(preset.frame||'').toLowerCase();
  const shape=String(preset.shape||'').toLowerCase();
  const lighting=String(preset.lighting||'').toLowerCase();
  // The first exact route segment identifies the family. A nested leaf called
  // "frameless" must not override "with-light", and "framed" is not a substring test.
  let family=mirrorFamilies.includes(route[0])?route[0]:mirrorFamilies.includes(n.id)?n.id:'';
  if(!family) {
    if(type==='mirror-pivot')family='pivot';
    else if(type==='mirror-smart')family='smart';
    else if(['mirror-wall','mirror-ceiling','mirror-door'].includes(type))family='architecture';
    else if(['mirror-panel-bevel','mirror-panel-color'].includes(type))family='panels';
    else if(type==='mirror-aged')family='decorative';
    else if(['mirror-lighting','mirror-dressing'].includes(type)||/контур|фронт|гримёр/.test(lighting))family='with-light';
    else if(['mirror-metal-frame','mirror-wood-frame','mirror-soft-frame'].includes(type))family='framed';
    else if(/без рам|без отдельной рамы/.test(frame)||type==='mirror-by-size')family='frameless';
  }
  const subtype=route[1]||'';
  if(family==='pivot')return 'mirror-pivot';
  if(family==='smart')return 'mirror-smart';
  if(family==='with-light') {
    if(subtype==='combined'||(!subtype&&/фронт.*контур|комбинирован/.test(lighting)))return 'mirror-combined-light';
    if(subtype==='front'||(!subtype&&/фронт/.test(lighting)))return 'mirror-front-light';
    if(subtype==='dressing'||(!subtype&&(type==='mirror-dressing'||/гримёр/.test(lighting))))return 'mirror-dressing';
    return route.includes('rectangular')||/прямоуг|квадрат/.test(shape)?'mirror-backlit-rect':'mirror-backlit-round';
  }
  if(family==='framed') {
    if(subtype==='aluminium'||/алюмин/.test(frame))return 'mirror-aluminium-oval';
    if(subtype==='brass'||/латун/.test(frame))return 'mirror-brass-round';
    if(subtype==='baguette'||/багет/.test(frame))return 'mirror-baguette';
    if(subtype==='soft'||/мягк/.test(frame)||type==='mirror-soft-frame')return 'mirror-soft-frame';
    if(subtype==='wood'||/дерев/.test(frame)||type==='mirror-wood-frame')return 'mirror-wood-arch';
    if(subtype==='metal'||/металл/.test(frame)||type==='mirror-metal-frame') {
      return route.includes('round')||/^круг/.test(shape)?'mirror-brass-round':'mirror-metal-rect';
    }
    return 'mirror-brass-round';
  }
  if(family==='frameless') {
    if(subtype==='free-outline'||/свобод|асимметр|волно/.test(shape))return 'mirror-freeform';
    if(subtype==='rectangular'||/прямоуг|квадрат/.test(shape))return 'mirror-frameless-rect';
    if(subtype==='rounded'||/круг|овал/.test(shape))return 'mirror-frameless-round';
    return 'mirror-frameless-arch';
  }
  if(family==='architecture') {
    if(subtype==='ceilings'||type==='mirror-ceiling'||preset.application==='Потолок')return 'mirror-ceiling';
    if(subtype==='doors'||type==='mirror-door'||preset.application==='Дверь')return 'mirror-door';
    return 'mirror-wall';
  }
  if(family==='panels') {
    if(subtype==='geometric')return 'mirror-panel-bevel';
    if(subtype==='coloured'||type==='mirror-panel-color')return 'mirror-decorative-bronze';
    return 'mirror-panel-bevel';
  }
  if(family==='decorative') {
    // A neutral surface is more relevant to an individual engraving/matting
    // brief than the visibly aged bronze example used for the family cover.
    if(['engraving','matting'].includes(subtype))return 'mirror-frameless-rect';
    return 'mirror-decorative-bronze';
  }
  return defaults.mirrors;
}

function partitionMedia(n,route) {
  const p=n.preset||{},has=id=>route.includes(id);
  const system=p.systemId||n.systemId||route[0]||'all-glass';
  const opening=p.openingId||['fixed','swing','pendulum','sliding','telescopic','folding','stacking','pivot'].find(has)||(has('parking')?'stacking':'');
  const color=p.materialColorId||(['bronze','grey'].find(has))||'clear';
  const decor=p.decorId||'';
  const result=(key,caption='')=>({key,caption});
  if(has('glass')||n.modelKind==='glass-option') {
    if(system==='smart')return result('material-smart',color==='clear'?'Образец внутреннего переключаемого слоя SMART-триплекса':'Пример переключаемого слоя SMART-триплекса; выбранный оттенок основы указан в параметрах.');
    if(decor==='ribbed'||route.some(s=>s.startsWith('ribbed')))return result(color==='bronze'?'material-fluted-bronze':color==='grey'?'material-fluted-graphite':'material-fluted');
    if(decor==='full-matte'||has('satin'))return result(color==='bronze'?'material-satin-bronze':color==='grey'?'material-satin-graphite':'material-satin');
    if(decor==='sandblast'||has('sandblast'))return result('service-sandblast');
    if(has('laminated')||['laminated','laminated-tempered'].includes(p.glassTreatmentId))return result('service-lamination');
    if(has('color')&&!n.isLeaf)return result('material-tinted');
    if(has('surface')&&!n.isLeaf)return result('material-fluted');
    return result(color==='bronze'?'material-bronze':color==='grey'?'material-graphite':'material-clear');
  }
  // Frame material, finish and lattice choices are not glass surface choices.
  if(has('frame'))return result('partition-loft','Пример стеклянного заполнения в каркасе; материал, цвет и рисунок раскладки выбираются в параметрах.');
  if(system==='smart') {
    if(has('segmented')||decor.startsWith('smart-'))return result('partition-smart-segmented',decor==='smart-horizontal'?'Пример горизонтальной переключаемой зоны SMART-стекла':'Пример сегментированного SMART-стекла с горизонтальной зоной; выбранная раскладка указана в параметрах.');
    if(['privacy-option','decor-option'].includes(n.modelKind)||has('control')||has('control-zones')||has('construction'))return result('material-smart','Пример двух состояний внутреннего SMART-слоя; способ управления выбирается в параметрах.');
    return result('partition-smart');
  }
  if(has('decor')||n.modelKind==='decor-option') {
    if(decor==='print')return result('material-printed-photo','Пример печати на стекле; рисунок выбранного изделия согласуется отдельно.');
    if(decor==='decorative-film')return result('material-film-application','Пример нанесения декоративной плёнки; рисунок выбранного изделия согласуется отдельно.');
    return result('service-sandblast','Пример частичного матирования; расположение прозрачных и матовых зон указано в выбранном исполнении.');
  }
  if(p.blindsId==='between-panes'||has('between-double')||has('blinds'))return result('partition-double-blinds',p.blindsId==='external'?'Пример жалюзи в составе перегородки; наружное размещение выбирается в параметрах.':'');
  if(system==='framed') {
    if(p.glazingId==='double'||has('double')||has('clamped-double'))return result('partition-framed-double-clear',opening==='sliding'?'Пример двух рядов стекла; отдельный раздвижной вход указан в параметрах.':'');
    if(opening==='sliding')return result('partition-framed-sliding');
    return result('partition-framed');
  }
  if(system==='loft') {
    if(opening==='folding')return result('partition-loft-folding');
    if(opening==='pivot')return result('partition-loft-pivot');
    if(['sliding','telescopic'].includes(opening))return result('partition-loft-sliding',opening==='telescopic'?'Пример рамных раздвижных полотен; каскадная схема согласуется отдельно.':'');
    return result('partition-loft');
  }
  if(opening==='folding')return result('partition-allglass-folding');
  if(opening==='telescopic')return result('partition-allglass-telescopic');
  if(opening==='stacking')return result('partition-allglass-stacking');
  if(opening==='sliding')return result('door-sliding');
  if(['swing','pendulum'].includes(opening))return result('door-swing','Пример открытого стеклянного дверного полотна; число створок и схема перегородки указаны в параметрах.');
  return result(['retail','mall'].some(has)?'partition-shop':'partition-clear');
}

export function mediaForNode(input) {
  const n=input?.treeNode||input||{},segments=String(n.path||'').split('/').filter(Boolean);
  if(exactCatalogMedia[n.path])return mediaAssets['exact-'+segments.join('-')];
  const category=n.category||(defaults[n.id]?n.id:segments.find(s=>defaults[s]));
  const categoryIndex=segments.indexOf(category);
  const route=categoryIndex>=0?segments.slice(categoryIndex+1):[n.id].filter(Boolean);
  const has=id=>route.includes(id),preset=n.preset||{},type=n.solutionId||n.id||'';
  const application=String(preset.application||n.application||'').toLowerCase();
  const opening=String(preset.opening||n.opening||'').toLowerCase();
  let key=defaults[category]||'partition-clear',caption='';
  if(category==='mirrors')key=mirrorMedia(n,route);
  else if(category==='showers') {
    if(has('showers-bath')||type==='bath-glazing'||application==='баня')key='bath-glazing';
    else if(/склад/.test(opening)||has('showers-niche-folding')||has('showers-corner-folding')){key='shower-folding';caption='Пример складного дверного узла; форма ограждения указана в выбранном исполнении.';}
    else if(/раздвиж/.test(opening)||route.some(s=>s.includes('-sliding'))){key=has('showers-corner')?'shower-corner-sliding':'shower-telescopic';caption='Пример раздвижного дверного узла; геометрия и число полотен указаны в выбранном исполнении.';}
    else if(has('showers-tub'))key='shower-tub-screen';
    else if(has('showers-u'))key='shower-u-shape';
    else if(has('showers-trapezoid'))key='shower-pentagonal';
    else if(has('showers-custom-curved')){key='service-bending';caption='Образец гнутого стекла; размеры и форма душевого экрана выбираются в параметрах.';}
    else if(has('showers-custom-mansard')||(has('showers-custom')&&route.length===1))key='shower-sloped';
    else if(has('showers-custom'))key='shower-open';
    else if(has('showers-niche-folding')||has('showers-corner-folding'))key='shower-folding';
    else if(has('showers-corner-sliding'))key='shower-corner-sliding';
    else if(has('showers-niche-sliding'))key='shower-telescopic';
    else if(has('showers-open')||has('showers-corner-open'))key='shower-open';
    else if(has('showers-corner')||type==='shower-corner-swing')key='shower-corner';
    else if(has('showers-niche'))key='shower-niche';
    else if(type==='shower-fixed-screen'||application==='открытая душевая')key='shower-open';
    else if(application==='угловая душевая')key='shower-corner';
  } else if(category==='partitions') {
    ({key,caption}=partitionMedia(n,route));
  } else if(category==='doors') {
    if(has('doors-sliding')||['door-sliding-single','door-sliding-pair'].includes(type)||/раздвиж/.test(opening))key='door-sliding';
  } else if(category==='stairs') {
    const mounting=String(preset.mounting||'');
    if(/деревян/i.test(preset.handrail||'')){key='hardware-wood-handrail';caption='Пример деревянного поручня на стекле; форма ограждения и его опоры указаны в параметрах.';}
    else if(/стойки/i.test(mounting)&&!/мини/i.test(mounting)||route.some(s=>s.endsWith('-posts')&&!s.endsWith('-mini-posts'))){key='railing-posts';caption='Пример крепления стекла на стойках; геометрия ограждения и поручень выбираются в параметрах.';}
    else if((/зажимной профиль/i.test(mounting)||route.some(s=>s.includes('stair-flight-profile')))&&has('stairs-railings-stair-flight'))key='railing-inclined-profile';
    else if(has('stairs-railings-outdoor')||type==='railing-outdoor'||application==='балкон и терраса')key='railing-outdoor';
    else if(has('stairs-glass-steps')||has('stairs-complete-metal-steps')||has('stairs-complete-floating-glass-steps')||['stairs-glass-steps-parts','stairs-metal-glass-steps'].includes(type))key='glass-steps';
    else if(has('stairs-railings-stair-flight')||['railing-stairs-points','railing-stairs-profile','railing-stairs-posts'].includes(type))key='stairs-glass';
    else if(has('stairs-railings')||['railing-second-light','railing-mezzanine'].includes(type))key='railing-landing';
  } else if(category==='canopies') {
    if(has('canopies-profile')||type==='canopy-clamp-profile'||/зажимной профиль/i.test(preset.mounting||n.mounting||''))key='canopy-profile';
  }
  if(category!=='partitions'&&n.imageKey && mediaAssets[n.imageKey])key=n.imageKey;
  const asset=mediaAssets[key];
  return {...asset,key,kind:asset.kind||'interior',caption:caption||asset.caption||'',src:asset.src||base+asset.file,thumbnail:asset.thumbnail||(asset.file?base+asset.file.replace('.webp','-480.webp'):asset.src)};
}
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function photoMarkup(node,{className='',eager=false,small=false}={}) {
  const a=mediaForNode(node);
  return `<img class="interior-image ${escape(className)}"${a.real?' style="object-fit:contain;background:#fff"':''} src="${small?a.thumbnail:a.src}"${a.thumbnail!==a.src?` srcset="${a.thumbnail} 480w, ${a.src} 1254w" sizes="${small?'120px':'(max-width: 620px) 100vw, (max-width: 1100px) 50vw, 45vw'}"`:''} alt="${escape(a.alt)}" width="1254" height="1254" loading="${eager?'eager':'lazy'}" decoding="async">`;
}
export function galleryMarkup(node) {
  const a=mediaForNode(node),selected=node?.treeNode||node||{};
  const label=a.kind==='sample'?'Образец материала или обработки':a.kind==='detail'?'Пример узла конструкции':'Пример конструкции';
  const description=a.caption||(a.kind==='sample'?'Иллюстрация показывает материал или вид обработки. Оттенок, рисунок, размеры и состав вашего изделия согласуются по выбранным параметрам.':'Иллюстрация показывает вид конструкции. Геометрия, отделка, размеры и комплектация вашего изделия указаны в выбранном исполнении.');
  return `<figure class="product-gallery"><button class="gallery-open" type="button" data-image="${a.key}" aria-label="Увеличить: ${escape(a.alt)}">${photoMarkup(node,{eager:true})}<span class="gallery-expand" aria-hidden="true">↗</span></button><p>${escape(description)}</p><figcaption><span>${escape(selected.title||'Выбранное направление')} · ${label}</span><span>Увеличить ↗</span></figcaption></figure>`;
}
