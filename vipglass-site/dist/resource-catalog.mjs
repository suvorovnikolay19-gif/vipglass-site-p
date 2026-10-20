import {productionTree} from './production-data.mjs';
import * as productionData from './production-data.mjs';
import {materialsTree} from './materials-data.mjs';
import {hardwareItems} from './hardware-data.mjs';
import {normalizeSearch,searchSolutions} from './project-utils.mjs';
import {resourceMediaForNode} from './resource-media.mjs';
export {resourceMediaForNode} from './resource-media.mjs';

export const resourceNodes=[],resourceByPath=new Map();
function indexTree(raw,kind,parent=null){
 const path=parent?parent.path+'/'+raw.id:'/'+raw.id;
 const node={...raw,kind,path,url:'#'+path,parentPath:parent?.path||'',ancestors:parent?[...parent.ancestors,parent.path]:[],depth:(parent?.depth||0)+1,children:[]};
 node.family=parent?.depth===1?raw.id:parent?.family||raw.id;
 node.image=raw.image||parent?.image||'material-clear';
 node.children=(raw.children||[]).map(c=>indexTree(c,kind,node));
 node.isLeaf=!node.children.length;
 resourceNodes.push(node);resourceByPath.set(path,node);
 return node;
}
export const servicesRoot=indexTree(productionTree,'service');
export const materialsRoot=indexTree(materialsTree,'material');
export const resourcePathAliases=productionData.productionPathAliases||{};
for(const [oldPath,newPath] of Object.entries(resourcePathAliases)){const node=resourceByPath.get(newPath);if(!node)throw new Error('Missing production alias target: '+newPath);resourceByPath.set(oldPath,node);}
export function resolveServiceIds(ids=[]){const found=new Map();for(const id of ids){for(const key of productionData.productionServiceGroups?.[id]||[id]){const node=servicesRoot.children.find(n=>n.id===key);if(node)found.set(node.path,node);}}return [...found.values()];}
export const serviceNodes=resourceNodes.filter(n=>n.kind==='service');
export const materialNodes=resourceNodes.filter(n=>n.kind==='material');
export const materialLeaves=materialNodes.filter(n=>n.isLeaf);
export const serviceLeaves=serviceNodes.filter(n=>n.isLeaf);
export const resourceTrail=node=>[...node.ancestors.map(p=>resourceByPath.get(p)),node];
export const hardware=hardwareItems.map(x=>({...x,kind:'hardware',url:'#/hardware/item/'+x.id,path:'/hardware/item/'+x.id}));
export const hardwareById=new Map(hardware.map(x=>[x.id,x]));
export const hardwareApplications=[
 {id:'showers',title:'Для душевых',image:'hardware-hinge',intro:'Петли, ручки, крепления, профили и уплотнители.'},
 {id:'partitions',title:'Для перегородок',image:'hardware-profile',intro:'Соединения стекла, зажимные профили и системы движения.'},
 {id:'doors',title:'Для стеклянных дверей',image:'hardware-slider',intro:'Петли, раздвижные системы, ручки и дверные узлы.'},
 {id:'stairs',title:'Для лестниц и ограждений',image:'hardware-standoff',intro:'Точечные крепления, профили, стойки и поручни.'},
 {id:'canopies',title:'Для козырьков',image:'hardware-canopy',intro:'Крепления стекла и системы подвеса козырька.'},
].filter(a=>hardware.some(x=>x.applications.includes(a.id)));
export function hardwareFor(category){return hardware.filter(x=>x.applications.includes(category));}
export const hardwareTypePages=hardwareApplications.flatMap(app=>[...new Set(hardwareFor(app.id).map(x=>x.type))].map(type=>{const children=hardwareFor(app.id).filter(x=>x.type===type);return {id:app.id+'-'+type,type,category:app.id,title:children[0].typeLabel,applicationTitle:app.title,intro:children.map(x=>x.title).join('; ')+'. Подбор в составе конструкции.',path:'/hardware/'+app.id+'/'+type,url:'#/hardware/'+app.id+'/'+type,image:children[0].image,children};}));
export const hardwareTypeByPath=new Map(hardwareTypePages.map(n=>[n.path,n]));
export const hardwareTypesFor=category=>hardwareTypePages.filter(n=>n.category===category);

export function filterHardware(category='',params=new URLSearchParams()){
 let list=category?hardwareFor(category):hardware;
 if(params.get('type'))list=list.filter(x=>x.type===params.get('type'));
 if(params.get('finish'))list=list.filter(x=>x.finishes.some(f=>f.id===params.get('finish')));
 if(params.get('q'))list=searchSolutions(list.map(x=>({...x,description:x.intro})),[],params.get('q'));
 return list;
}
export function filterMaterials(params=new URLSearchParams()){
 let list=materialLeaves;
 if(params.get('family'))list=list.filter(n=>n.family===params.get('family'));
 if(params.get('transparency'))list=list.filter(n=>n.properties?.transparency===params.get('transparency'));
 if(params.get('color'))list=list.filter(n=>n.properties?.color===params.get('color'));
 if(params.get('q'))list=searchSolutions(list.map(n=>({...n,description:n.intro,features:n.properties})),[],params.get('q'));
 return list;
}
export const materialFacetDefinitions=Object.freeze([
 {key:'family',label:'Семейство',emptyLabel:'Все материалы'},
 {key:'transparency',label:'Прозрачность',emptyLabel:'Любая'},
 {key:'color',label:'Цвет',emptyLabel:'Любой'},
]);
const materialFacetKeys=materialFacetDefinitions.map(f=>f.key);
function materialPropertyParams(params){
 const result=new URLSearchParams();
 for(const key of materialFacetKeys)if(params.get(key))result.set(key,params.get(key));
 return result;
}
function materialFacetValues(key){
 return key==='family'?materialsRoot.children.map(n=>({value:n.id,label:n.title}))
  :[...new Set(materialLeaves.map(n=>n.properties?.[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru')).map(value=>({value,label:value}));
}
/** Property counts exclude the typed query. Family is the primary navigation
 * choice; its counts show its complete catalogue, allowing a family change. */
export function getMaterialFacets(params=new URLSearchParams()){
 return Object.fromEntries(materialFacetDefinitions.map(({key})=>{
  const selected=params.get(key)||'',values=materialFacetValues(key);
  if(selected&&!values.some(v=>v.value===selected))values.push({value:selected,label:selected,unknown:true});
  const base=key==='family'?new URLSearchParams():materialPropertyParams(params);
  base.delete(key);
  const entries=values.map(entry=>{
   const candidate=new URLSearchParams(base);candidate.set(key,entry.value);
   const count=filterMaterials(candidate).length;
   // A conflicting value from a direct URL remains selected and submitted.
   // Only a deliberate change or recovery link may remove that condition.
   return {...entry,count,available:count>0,disabled:count===0&&entry.value!==selected,selected:entry.value===selected};
  });
  return [key,[{value:'',label:materialFacetDefinitions.find(f=>f.key===key).emptyLabel,count:filterMaterials(base).length,available:true,disabled:false,selected:!selected},...entries]];
 }));
}
/** Call only on an explicit facet change. Never use this when reading a URL or
 * submitting a search. Preserve family and the changed field; drop the fewest
 * incompatible remaining properties. A tie retains transparency before color.
 * The query and unrelated parameters are preserved and never cause a reset. */
export function normalizeMaterialFilterParams(params=new URLSearchParams(),changedField){
 const result=new URLSearchParams(params);
 if(!materialFacetKeys.includes(changedField))return result;
 const structural=materialPropertyParams(result);
 if(filterMaterials(structural).length)return result;
 const required=new URLSearchParams();
 if(structural.get('family'))required.set('family',structural.get('family'));
 if(changedField!=='family'&&structural.get(changedField))required.set(changedField,structural.get(changedField));
 if(!filterMaterials(required).length)return result;
 const optional=materialFacetKeys.filter(key=>key!=='family'&&key!==changedField&&structural.get(key));
 const subsets=Array.from({length:2**optional.length},(_,mask)=>optional.filter((_,i)=>mask&(1<<(optional.length-i-1))))
  .sort((a,b)=>b.length-a.length||optional.findIndex(k=>a.includes(k))-optional.findIndex(k=>b.includes(k)));
 for(const keep of subsets){
  const candidate=new URLSearchParams(required);for(const key of keep)candidate.set(key,structural.get(key));
  if(!filterMaterials(candidate).length)continue;
  for(const key of optional)if(!keep.includes(key))result.delete(key);
  return result;
 }
 return result;
}
/** Explain incompatible URL facets without changing their AND result. */
export function getMaterialFilterConflict(params=new URLSearchParams()){
 const structural=materialPropertyParams(params);
 if(filterMaterials(structural).length)return null;
 const selected=materialFacetDefinitions.filter(f=>structural.get(f.key)).map(f=>({key:f.key,label:f.label,value:structural.get(f.key)}));
 const family=materialsRoot.children.find(n=>n.id===structural.get('family'));
 const invalid=selected.filter(f=>!materialFacetValues(f.key).some(v=>v.value===f.value));
 const familyConflicts=family?selected.filter(f=>f.key!=='family'&&!filterMaterials(new URLSearchParams({family:family.id,[f.key]:f.value})).length):[];
 let reason=invalid.length?`В текущем каталоге нет выбранного значения: ${invalid.map(f=>`${f.label} — «${f.value}»`).join('; ')}.`
  :familyConflicts.length?`В семействе «${family.title}» нет сочетания с параметрами: ${familyConflicts.map(f=>`${f.label} — «${f.value}»`).join('; ')}.`
   :'Выбранные свойства есть в каталоге, но не встречаются вместе в одной карточке материала.';
 if(familyConflicts.some(f=>f.key==='transparency')){
  const available=[...new Set(materialLeaves.filter(n=>n.family===family.id).map(n=>n.properties?.transparency).filter(Boolean))];
  reason+=` Прозрачность этого семейства: ${available.join(', ')}.`;
 }
 let recovery=normalizeMaterialFilterParams(params,'family');
 if(!filterMaterials(materialPropertyParams(recovery)).length){
  recovery=new URLSearchParams(params);
  for(const {key} of invalid)recovery.delete(key);
  recovery=normalizeMaterialFilterParams(recovery,'family');
 }
 if(!filterMaterials(materialPropertyParams(recovery)).length){
  recovery=new URLSearchParams(params);for(const key of materialFacetKeys)recovery.delete(key);
 }
 const removed=selected.filter(f=>!recovery.get(f.key));
 return {reason,recovery,removed};
}
export function searchResources(query){
 if(!normalizeSearch(query))return [];
 const entries=[...resourceNodes,...hardware].map(n=>({...n,description:n.intro,features:n.properties,tags:[...(n.tags||[]),n.kind==='service'?'обработка производство услуга':n.kind==='material'?'материал стекло':'фурнитура комплектация',...(n.finishes||[]).map(f=>f.label)]}));
 return searchSolutions(entries,[],query).slice(0,60);
}
export const escapeResource=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resourcePhoto(node,{small=false,eager=false,finish=''}={}){
 const media=resourceMediaForNode(node,{finish});
 if(!media.src)return `<div class="resource-photo-unavailable" role="img" aria-label="${escapeResource(media.alt)}"><span>${escapeResource(media.caption)}</span></div>`;
 const real=['catalog-photo','supplier-catalogue'].includes(media.kind);
 const width=media.width||1254,height=media.height||1254;
 return `<img class="interior-image resource-photo${real?' hardware-catalog-photo':''}" src="${escapeResource(small?media.thumbnail:media.src)}" ${real?'':`srcset="${escapeResource(media.thumbnail)} 480w, ${escapeResource(media.src)} 1254w"`} sizes="${small?'120px':eager?'(max-width: 600px) 100vw, 50vw':'(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw'}" alt="${escapeResource(media.alt)}" data-media-kind="${media.kind}" loading="${eager?'eager':'lazy'}" decoding="async" width="${width}" height="${height}"${real?' style="object-fit:contain;background:#fff"':''}>`;
}
export function resourceNote(node){
 const properties=Object.entries(node.properties||{}).map(([k,v])=>`${({transparency:'Прозрачность',finish:'Поверхность',color:'Цвет',structure:'Структура',base:'Основа',selection:'Подбор',bevelWidth:'Ширина фацета',bevelGeometry:'Линия фацета'})[k]||k}: ${v}`);
 return [resourceTrail(node).map(n=>n.title).join(' → '),...properties,node.result||''].filter(Boolean).join('\n');
}
export function hardwareNote(item,finishId){
 const finish=item?.finishes.find(f=>f.id===finishId);
 return item?`Фурнитура: ${item.title}${item.brand==='Pauli'?' · Pauli':''}${finish?'\nОтделка фурнитуры: '+finish.label:''}`:'';
}
