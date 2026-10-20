import {categories} from './catalog.mjs';
import {nodesByPath} from './catalog-tree.mjs';

export const PORTFOLIO_STORAGE_KEY = 'vipglass-portfolio-draft-v1';
export const portfolioStageDefs = [
  {id:'before',label:'До',intro:'Пространство и исходная задача.'},
  {id:'during',label:'Во время',intro:'Детали процесса и промежуточные этапы.'},
  {id:'after',label:'После',intro:'Результат в пространстве.'},
  {id:'review',label:'Отзыв',intro:'Впечатления о проекте.'},
];
const excludedPresetKeys = new Set(['title','note','mode','widthLabel','heightLabel']);
const meaningful = value => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
const plainObject = value => {
  if(!value||Object.prototype.toString.call(value)!=='[object Object]')return false;
  const prototype=Object.getPrototypeOf(value);
  return prototype===null||prototype.constructor?.name==='Object';
};
const categoryIds = new Set(categories.map(category=>category.id));
const characteristicsFor = node => Object.fromEntries(Object.entries(node?.preset || {}).filter(([key,value])=>!excludedPresetKeys.has(key)&&meaningful(value)));
const photo = (src,caption) => ({src,caption});
const interiors = file => '/assets/interiors/'+file+'.webp';
const demoVideo = poster => ({src:'/assets/content/demo-process.mp4',poster,caption:'Демонстрационный ролик'});
const emptyStages = () => Object.fromEntries(portfolioStageDefs.map(stage=>[stage.id,{photos:[],videos:[]}]));
function example({id,title,category,kind,materialColor,path,cover,description,stages}) {
  const node = nodesByPath.get(path);
  if (!node) throw new Error('Unknown portfolio example product: '+path);
  return {id,title,category,kind,materialColor,characteristics:{...characteristicsFor(node),...(category==='showers'?{materialPath:'/materials/clear/clear-crystalvision'}:{})},productPaths:[node.path],description,cover,
    stages:{...emptyStages(),...stages},published:true,isDemo:true};
}

// These are interface examples made from existing AI illustrations. They are
// deliberately not customer projects, construction records or endorsements.
export const portfolioExamples = [
  example({id:'demo-round-mirror',title:'Свет вокруг круга',category:'mirrors',kind:'Зеркало с подсветкой',materialColor:'Серебро',
    path:'/catalog/mirrors/with-light/contour/rounded/round/frameless',
    cover:photo(interiors('mirror-backlit-round'),'Демонстрационная AI-визуализация круглого зеркала'),
    description:'Пример истории с одним изображением: круглая форма, открытая кромка и контурный свет. Иллюстрация показывает устройство страницы, а не выполненный заказ.',
    stages:{after:{photos:[photo(interiors('mirror-backlit-round'),'AI-визуализация. Пример одного итогового изображения.')],videos:[]}}}),
  example({id:'demo-open-shower',title:'Прозрачная граница душевой',category:'showers',kind:'Открытая душевая',materialColor:'Бесцветный',
    path:'/catalog/showers/showers-open/showers-open-straight',
    cover:photo(interiors('shower-open'),'Демонстрационная AI-визуализация открытой душевой'),
    description:'Полный демонстрационный сценарий с четырьмя этапами. Картинки и ролик показывают возможности публикации; они не документируют один реальный объект.',
    stages:{
      before:{photos:[photo(interiors('shower-niche'),'Демонстрация блока «До»: AI-иллюстрация пространства, не фото исходного объекта.')],videos:[demoVideo(interiors('shower-niche'))]},
      during:{photos:[photo('/assets/production/service-drilling.webp','Демонстрация блока «Во время»: иллюстрация обработки стекла.'),photo('/assets/production/service-edge.webp','AI-иллюстрация обработки кромки, не съёмка заказа.')],videos:[demoVideo('/assets/production/service-drilling.webp')]},
      after:{photos:[photo(interiors('shower-open'),'AI-визуализация открытой душевой. Демонстрация итоговой галереи.')],videos:[demoVideo(interiors('shower-open'))]},
      review:{photos:[photo(interiors('shower-open'),'Демонстрационный визуальный материал к блоку отзыва.')],videos:[demoVideo(interiors('shower-open'))],text:'Демонстрационный текст: здесь может быть согласованный отзыв заказчика. Это не отзыв о выполненной работе.',author:''},
    }}),
  example({id:'demo-bronze-mirror',title:'Бронза и отражение',category:'mirrors',kind:'Декоративное зеркало',materialColor:'Бронза',
    path:'/catalog/mirrors/decorative/aged/single',
    cover:photo(interiors('mirror-decorative-bronze'),'AI-визуализация декоративного зеркала бронзового оттенка'),
    description:'Демонстрационный пример декоративного зеркала. Два изображения показывают плотный вариант галереи; исходные фотографии и отзыв отсутствуют.',
    stages:{after:{photos:[photo(interiors('mirror-decorative-bronze'),'Демонстрационная AI-визуализация декоративной поверхности.'),photo('/assets/production/material-mirror.webp','AI-иллюстрация зеркального материала; не фрагмент выполненного объекта.')],videos:[]}}}),
  example({id:'demo-clear-partition',title:'Свет между комнатами',category:'partitions',kind:'Цельностеклянная перегородка',materialColor:'Бесцветный',
    path:'/catalog/partitions/partitions-home/partitions-home-clear/partitions-home-clear-straight',
    cover:photo(interiors('partition-clear'),'Демонстрационная AI-визуализация прозрачной перегородки'),
    description:'Пример двух заполненных этапов. Визуализации не являются сравнением реального помещения до и после монтажа.',
    stages:{before:{photos:[photo(interiors('partition-clear'),'Демонстрация первого этапа: AI-визуализация, не фотография «до».')],videos:[]},after:{photos:[photo(interiors('partition-clear'),'Демонстрация итогового этапа: AI-визуализация перегородки.')],videos:[]}}}),
  example({id:'demo-glass-door',title:'Дверь в светлое пространство',category:'doors',kind:'Распашная дверь',materialColor:'Бесцветный',
    path:'/catalog/doors/doors-swing/doors-swing-single/doors-swing-single-opening',
    cover:photo(interiors('door-swing'),'Демонстрационная AI-визуализация стеклянной двери'),
    description:'Пример страницы с видео без фотографий этапов. Обложка служит иллюстрацией направления; ролик демонстрирует плеер.',
    stages:{after:{photos:[],videos:[demoVideo(interiors('door-swing'))]}}}),
  example({id:'demo-glass-canopy',title:'Стекло над входом',category:'canopies',kind:'Козырёк на тягах',materialColor:'Бесцветный',
    path:'/catalog/canopies/canopies-rods/canopies-rods-single/canopies-rods-single-door/canopies-rods-single-door-rectangular',
    cover:photo('/assets/canopy.webp','Демонстрационная AI-визуализация стеклянного козырька'),
    description:'Итоговое изображение и текстовый блок демонстрируют компактную историю. Данные об объекте, адрес и заказчик не придуманы.',
    stages:{after:{photos:[photo('/assets/canopy.webp','AI-визуализация козырька на тягах. Демонстрационный материал.')],videos:[]},review:{photos:[],videos:[],text:'Демонстрационный блок отзыва. Реальный текст появится только после получения материала от заказчика.',author:''}}}),
];

export function isPortfolioMediaURL(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (/^\/assets\/[a-zA-Z0-9_./%-]+$/.test(value)) {
    try {const decoded=decodeURIComponent(value);return !/[\u0000-\u0020\\?#]/.test(decoded)&&!decoded.split('/').some(part=>part==='..'||part==='.');} catch {return false;}
  }
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;} catch {return false;}
}
export function validatePortfolioProjects(value) {
  const errors=[],projects=[],ids=new Set();
  if (!Array.isArray(value) || value.length>200) return {valid:false,errors:['Нужен массив проектов (не более 200).'],projects:[]};
  const text=(input,label,max=5000,required=false)=>{
    if (input===undefined||input===null) {if(required)errors.push(label+': поле обязательно.');return '';}
    if(typeof input!=='string'||input.length>max||required&&!input.trim()) {errors.push(label+': неверный текст.');return '';}
    return input.trim();
  };
  const media=(input,label)=>{
    if(!plainObject(input)||!isPortfolioMediaURL(input.src)) {errors.push(label+': укажите /assets/... или полный HTTPS-адрес файла.');return null;}
    if(input.poster!==undefined&&!isPortfolioMediaURL(input.poster)) errors.push(label+': неверный адрес постера.');
    return {src:input.src,...(input.poster?{poster:input.poster}:{}),caption:text(input.caption,label+' — подпись',1000)};
  };
  value.forEach((input,index)=>{
    const label='Проект '+(index+1);
    if(!plainObject(input)) {errors.push(label+': нужен объект.');return;}
    const id=text(input.id,label+' — ID',100,true);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||ids.has(id)) errors.push(label+': ID должен быть уникальным адресом из латинских букв, цифр и дефисов.');
    ids.add(id);
    const title=text(input.title,label+' — название',180,true);
    const category=text(input.category,label+' — категория',100,true);
    if(!categoryIds.has(category)) errors.push(label+': неизвестная категория изделия.');
    const kind=text(input.kind,label+' — вид',160,true),materialColor=text(input.materialColor,label+' — цвет',120,true);
    const description=text(input.description,label+' — описание');
    const characteristics={};
    if(!plainObject(input.characteristics)||Object.keys(input.characteristics).length>60) errors.push(label+': характеристики должны быть объектом (не более 60 полей).');
    else for(const [key,item] of Object.entries(input.characteristics)) {
      const scalar=x=>typeof x==='string'&&x.length<=1000||typeof x==='number'&&Number.isFinite(x)||typeof x==='boolean';
      if(!key||key.length>100||['__proto__','constructor','prototype'].includes(key)||!(scalar(item)||Array.isArray(item)&&item.length<=30&&item.every(scalar))) errors.push(label+': неверная характеристика '+key+'.');
      else if(meaningful(item)) characteristics[key]=Array.isArray(item)?[...item]:item;
    }
    const productPaths=[];
    if(!Array.isArray(input.productPaths)||input.productPaths.length>100) errors.push(label+': productPaths должен быть массивом адресов каталога.');
    else for(const candidate of input.productPaths) {
      const node=typeof candidate==='string'&&nodesByPath.get(candidate);
      if(!node||node.category!==category) errors.push(label+': связанная карточка не найдена в этой категории: '+String(candidate));
      else if(!productPaths.includes(node.path)) productPaths.push(node.path);
    }
    const cover=input.cover?media(input.cover,label+' — обложка'):null;
    const stages=emptyStages();
    if(input.stages!==undefined&&!plainObject(input.stages)) errors.push(label+': stages должен быть объектом.');
    for(const stage of portfolioStageDefs) {
      const item=input.stages?.[stage.id];
      if(item===undefined) continue;
      if(!plainObject(item)) {errors.push(label+' — '+stage.label+': нужен объект этапа.');continue;}
      for(const kind of ['photos','videos']) {
        const list=item[kind]??[];
        if(!Array.isArray(list)||list.length>60) {errors.push(label+' — '+stage.label+': неверный список '+kind+'.');continue;}
        stages[stage.id][kind]=list.map((entry,i)=>media(entry,label+' — '+stage.label+' '+(i+1))).filter(Boolean);
      }
      stages[stage.id].text=text(item.text,label+' — '+stage.label+' — текст',stage.id==='review'?10000:5000);
      if(stage.id==='review')stages.review.author=text(item.author,label+' — автор отзыва',180);
    }
    if(typeof input.published!=='boolean'||typeof input.isDemo!=='boolean') errors.push(label+': published и isDemo должны быть true или false.');
    const hasContent=Object.values(stages).some(stage=>stage.photos.length||stage.videos.length||stage.text);
    if(input.published&&!cover&&!hasContent) errors.push(label+': для публикации нужен хотя бы один материал.');
    projects.push({id,title,category,kind,materialColor,characteristics,productPaths,description,cover,stages,published:input.published===true,isDemo:input.isDemo===true});
  });
  return {valid:errors.length===0,errors,projects:errors.length?[]:projects};
}

export function getPortfolioProjects() {
  try {
    const raw=globalThis.localStorage?.getItem(PORTFOLIO_STORAGE_KEY);
    if(raw!==null&&raw!==undefined) {const result=validatePortfolioProjects(JSON.parse(raw));if(result.valid)return result.projects;}
  } catch {}
  return portfolioExamples;
}
export const portfolioFacetDefs = [
  {id:'product',field:'category',label:'Изделие',options:categories.map(c=>({value:c.id,label:c.shortTitle}))},
  {id:'color',field:'materialColor',label:'Цвет материала',options:[...new Set(portfolioExamples.map(p=>p.materialColor))].map(value=>({value,label:value}))},
  {id:'kind',field:'kind',label:'Вид изделия',options:[...new Set(portfolioExamples.map(p=>p.kind))].map(value=>({value,label:value}))},
];
export function portfolioFacetOptions(def,projects=getPortfolioProjects().filter(p=>p.published)) {
  if(def.id==='product')return def.options;
  return [...new Set(projects.map(p=>p[def.field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).map(value=>({value,label:value}));
}
export function filterPortfolio(params=new URLSearchParams(),projects=getPortfolioProjects()) {
  return projects.filter(project=>project.published&&portfolioFacetDefs.every(def=>!params.get(def.id)||project[def.field]===params.get(def.id)));
}
const normalized=value=>typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru'):value;
const equals=(candidate,expected)=>{
  if(Array.isArray(expected))return expected.every(value=>Array.isArray(candidate)?candidate.some(item=>equals(item,value)):equals(candidate,value));
  if(Array.isArray(candidate))return candidate.some(value=>equals(value,expected));
  return normalized(candidate)===normalized(expected);
};
export function matchingPortfolio(input,selected={}) {
  const node=input?.treeNode||input||{};
  const path=String(node.path||node.url||'').replace(/^#/,'').split('?')[0];
  const category=node.category||(categoryIds.has(node.id)?node.id:path.split('/')[2]);
  if(!categoryIds.has(category))return [];
  const selection=plainObject(selected)?selected:{};
  if(selection.category&&selection.category!==category||selection.product&&selection.product!==category)return [];
  const reserved=new Set(['category','product','materialColor','color','kind','characteristics','path','productPath']);
  const supplied=Object.fromEntries(Object.entries(selection).filter(([key,value])=>!reserved.has(key)&&meaningful(value)));
  const required={...characteristicsFor(node),...(plainObject(node.characteristics)?node.characteristics:{}),...supplied,...(plainObject(selection.characteristics)?selection.characteristics:{})};
  const color=selection.materialColor||selection.color||node.materialColor;
  const kind=selection.kind||node.portfolioKind;
  return getPortfolioProjects().filter(project=>project.published&&project.category===category
    &&(!color||equals(project.materialColor,color))&&(!kind||equals(project.kind,kind))
    &&Object.entries(required).filter(([,value])=>meaningful(value)).every(([key,value])=>Object.hasOwn(project.characteristics,key)&&equals(project.characteristics[key],value)))
    .sort((a,b)=>Number(b.productPaths.includes(path))-Number(a.productPaths.includes(path)));
}
