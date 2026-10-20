import {realHardwareMediaForNode} from './hardware-real-media.mjs';
// Image subjects are independent of card titles: a family example must never
// acquire an unpictured colour, mechanism or process through its alt text.
const asset=(key,alt,kind='sample',folder='production')=>({key,src:`./assets/${folder}/${key}.webp`,thumbnail:`./assets/${folder}/${key}-480.webp`,alt,kind});
const descriptions={
 'material-clear':['Бесцветный прозрачный образец стекла'],
 'material-bronze':['Прозрачный образец стекла бронзового оттенка'],
 'material-graphite':['Прозрачный образец серого тонированного стекла'],
 'material-tinted':['Несколько образцов тонированного стекла разных оттенков'],
 'material-satin':['Бесцветный матовый образец стекла с рассеянной видимостью'],
 'material-satin-bronze':['Матовый образец стекла бронзового оттенка'],
 'material-satin-graphite':['Серый сатинированный образец стекла'],
 'material-fluted':['Бесцветный образец стекла с вертикальным рифлением'],
 'material-fluted-bronze':['Бронзовый образец стекла с вертикальным рифлением'],
 'material-fluted-graphite':['Серый образец стекла с вертикальным рифлением'],
 'material-patterned':['Бесцветный образец стекла с нерегулярным рельефом'],
 'material-painted':['Глянцевые окрашенные образцы стекла нескольких цветов'],
 'material-painted-matte':['Матовый окрашенный образец стекла'],
 'material-mirror':['Зеркальные образцы нейтрального, бронзового и серого оттенков'],
 'material-antique':['Зеркальный образец с декоративным состариванием'],
 'material-triplex-textile':['Многослойный стеклянный образец с тканью внутри'],
 'material-triplex-mesh':['Многослойный стеклянный образец с металлической сеткой внутри'],
 'material-marble-print':['Стеклянный образец с рисунком камня'],
 'material-printed-photo':['Образец стекла с фотографическим горным пейзажем'],
 'material-screenprint':['Прозрачный стеклянный образец с рядами печатных чёрных точек'],
 'material-film-application':['Нанесение плёнки на стеклянную поверхность','process'],
 'material-wired':['Стеклянный образец с внутренней проволочной сеткой'],
 'material-smart':['Стеклянные образцы в прозрачном и светорассеивающем состояниях'],
 'service-cutting':['Рабочая головка станка над листом стекла','process'],
 'service-rounded-corner':['Закруглённый угол стеклянной детали','detail'],
 'service-drilling':['Стеклянная деталь с круглым отверстием и открытым вырезом','detail'],
 'service-countersink':['Круглое отверстие с зенковкой в стеклянной детали','detail'],
 'service-groove':['Открытый паз от края стеклянной детали','detail'],
 'service-edge':['Прямая полированная кромка прозрачного стекла','detail'],
 'service-grinding':['Прямая матовая шлифованная кромка стекла','detail'],
 'service-bevel':['Прямоугольный зеркальный образец с широким фацетом','detail'],
 'service-mitre':['Стеклянные детали со скошенными кромками','detail'],
 'service-tempering':['Стеклянный лист на роликах производственной линии','process'],
 'service-bending':['Бесцветная гнутая стеклянная панель'],
 'service-lamination':['Кромка прозрачного многослойного стекла','detail'],
 'service-sandblast':['Прозрачное стекло с матовой полосой и круглым матовым полем'],
 'service-engraving':['Прозрачное стекло с пересекающимися гравированными канавками'],
 'service-laser-matting':['Прозрачный стеклянный образец с матовым растровым рисунком папоротника'],
 'service-bonding':['Прозрачные стеклянные панели с угловым клеевым соединением','detail'],
 'production-workbench':['Лист стекла на рабочем столе мастерской','process'],
};
export const resourceMediaAssets=Object.fromEntries(Object.entries(descriptions).map(([key,[alt,kind]])=>[key,asset(key,alt,kind)]));
Object.assign(resourceMediaAssets,{
 'mirror-front-light':asset('mirror-front-light','Зеркало с видимой фронтальной световой зоной','interior','interiors'),
 'mirror-brass-round':asset('mirror-brass-round','Круглое зеркало в металлической раме тёплого оттенка','interior','interiors'),
});
const genericCaption=media=>media.kind==='process'?'Визуализация процесса. Состав операций определяем по заданию.'
 :media.kind==='detail'?'Визуализация узла или обработки. Размеры и исполнение согласуются отдельно.'
 :media.kind==='interior'?'Пример применения в изделии. Комплектацию согласуем для проекта.'
 :'Визуализация образца. Оттенок и фактуру согласуем по материалу.';

export function resourceMediaForNode(input,{finish=''}={}){
 const node=typeof input==='string'?{image:input}:input||{};
 const id=String(node.id||''),path=String(node.path||''),original=node.image||node.imageKey||'material-clear';
 let key=Object.hasOwn(resourceMediaAssets,original)?original:'material-clear',limitation='';
 const choose=(next,note='')=>{key=next;limitation=note;};
 const hardware=node.kind==='hardware'||Boolean(node.type)||String(original).startsWith('hardware-');
 if(hardware)return realHardwareMediaForNode(node,finish);
 {
  if(['matte-satin-graphite','matte-satin-dark','matte-full-graphite','tempered-satin-graphite'].includes(id))choose('material-satin-graphite',id==='matte-satin-dark'?'Показан серый сатин; глубину тёмного оттенка выбираем по образцу.':'');
  else if(id==='textured-fluted-graphite')choose('material-fluted-graphite');
  else if(/^production-cnc(?:-|$)/.test(id))choose('service-cutting','Визуализация станочной обработки; конкретные операции задаёт цифровой чертёж.');
  else if(/production-(?:edge-arrising|arrising)/.test(id))choose('service-grinding','Показан образец шлифованной кромки; узкое притупление рёбер согласуется отдельно.');
  else if(id==='production-rounding'||id==='production-cutting-rounded')choose('service-rounded-corner');
  else if(/production-(?:mirror-light|sandblast-mirror-light)/.test(id))choose('mirror-front-light','Пример световой зоны в готовом зеркале. Рисунок и технология подготовки согласуются отдельно.');
  else if(/production-(?:laser-|engraving-laser)/.test(id))choose('service-laser-matting','Пример матового растрового рисунка. Ваше изображение или надпись выполняются по согласованному макету.');
  else if(/production-(?:screen-printing|printing-screen)/.test(id))choose('material-screenprint');
  else if(id==='painted-matte')choose('material-painted-matte');
  else if(/^(?:mirrors-matted|mirrors-engraved)/.test(id))choose('material-mirror','Показаны зеркальные основы. Выбранный матовый рисунок или гравировка на этом образце не изображены.');
  else if(id==='production-film-mirror-backing'||id==='films-retention-mirror')choose('material-mirror','Показана зеркальная основа; плёнка на тыльной стороне на этом изображении не видна.');
  else if(id==='films-reflective')choose('material-mirror','Пример отражающей поверхности. Плёнка и её нанесение на этом изображении не показаны.');
  else if(id==='films'||/^films-/.test(id)||/^production-film/.test(id))choose('material-film-application','Пример нанесения плёнки. Её цвет, рисунок и назначение выбираются отдельно.');
  else if(id==='printed-stone'||id==='production-printing-uv-texture')choose('material-marble-print');
  else if(id==='printed-graphics'||/^printed-graphics-/.test(id)||id==='production-printing-uv-graphics')choose('material-screenprint','Показан пример печатного рисунка. Логотип, надпись и технологию печати согласуем по вашему макету.');
  else if(id==='printed-gradient')choose('material-screenprint','Пример печатного рисунка; индивидуальный градиент на изображении не представлен.');
  else if(id==='printed'||/^printed-(?:photo|artwork)/.test(id)||/production-(?:uv-printing|printing-uv|ceramic-printing|printing-ceramic)/.test(id))choose('material-printed-photo','Пример изображения на стекле. Сюжет и технологию печати согласуем отдельно.');
  else if(/^textured-patterned/.test(id))choose('material-patterned',/bronze|gold/.test(id)?'Показан бесцветный рельефный образец; выбранный бронзовый или золотистый тон согласуется отдельно.':'Пример нерегулярного рельефа. Точный рисунок выбранного узора согласуем по образцу.');
  else if(/^curved-(?:tinted|laminated-(?:bronze|graphite))/.test(id))choose('service-bending','Показана бесцветная гнутая панель; выбранный оттенок и многослойный состав согласуются отдельно.');
  else if(id==='special-reflective')choose('material-clear','Показана светопропускающая основа; специальное отражающее покрытие подбирается по образцу.');
  else if(/special-(?:antireflective|museum)/.test(id))choose('material-clear','Пример бесцветной основы; оптические свойства специального покрытия изображением не подтверждаются.');
  else if(id==='production-sandblast-full'||id==='matte-sandblasted-full'||id==='matte-full-crystalvision')choose('material-satin','Пример равномерной матовой поверхности. Способ обработки согласуем для выбранной детали.');
  else if(/^production-bevel/.test(id))choose('service-bevel','Пример прямолинейного фацета. Выбранные ширина и контур задаются чертежом, а не масштабом изображения.');
  else if(/production-lamination-(?:tinted|matte|coloured|image)/.test(id))choose('service-lamination','Пример многослойной кромки. Выбранный оттенок, прослойка или изображение на этом образце не показаны.');
  else if(id==='production-bonding-metal')choose('service-bonding','Пример склейки стеклянных панелей; соединение с металлом на изображении не показано.');
 }
 const media=resourceMediaAssets[key];
 return {...media,alt:media.alt+' — визуализация',caption:limitation||genericCaption(media),limitation};
}
