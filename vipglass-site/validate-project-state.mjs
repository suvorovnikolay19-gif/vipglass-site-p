import assert from 'node:assert/strict';
import {normalizeSavedProject,retiredHardwareRoutes} from './dist/project-state.mjs';
import {makeProjectText} from './dist/project-utils.mjs';
import {solutions} from './dist/catalog.mjs';
import {hardwareById} from './dist/resource-catalog.mjs';
const lookups={solutionsById:new Map(solutions.map(item=>[item.id,item])),hardwareById};
const item=[...hardwareById.values()][0];
const fixture={description:'Мой замысел',items:[{
  id:'mirror-custom',catalogPath:'/catalog/mirrors/with-light',title:'Зеркало с подсветкой',
  hardwareId:'mirror-frame-profile',hardwareNote:'Устаревший комплект',hardwareComment:'Тёплый свет',
  note:'Тёплый свет\nУстаревший комплект',sku:'obsolete-code',
}],hardwarePreferences:[{id:'mirror-frame-profile',title:'Рама'},{id:item.id,title:'Устаревшее название',finishId:item.finishes[0].id,sku:'obsolete-code',note:'Согласовать отделку'}]};
const normalized=normalizeSavedProject(fixture,lookups);
assert.equal(normalized.items.length,1);
assert.equal(normalized.items[0].note,'Тёплый свет');
assert(!('hardwareId' in normalized.items[0]));
assert(!('sku' in normalized.items[0]));
assert.equal(normalized.hardwarePreferences.length,1);
assert.equal(normalized.hardwarePreferences[0].title,item.title);
assert.equal(normalized.hardwarePreferences[0].finishLabel,item.finishes[0].label);
assert(!JSON.stringify(normalized).includes('obsolete-code'));
assert.deepEqual(normalizeSavedProject(normalized,lookups),normalized);
assert.equal(fixture.items[0].sku,'obsolete-code','Migration does not mutate its input');
const attached=normalizeSavedProject({items:[{
  id:'custom-shower',catalogPath:'/catalog/'+item.applications[0]+'/custom',hardwareId:item.id,
  hardwareFinish:'unavailable-finish',hardwareNote:'Фурнитура: Старый товар\nОтделка фурнитуры: Старый цвет',
  hardwareComment:'Нужен образец',note:'Сохранить размеры\nФурнитура: Старый товар\nОтделка фурнитуры: Старый цвет\nНужен образец',
},{id:'malformed-path',catalogPath:123,note:'Сохранить черновик'}]},lookups);
assert.equal(attached.items.length,2);
assert.equal(attached.items[0].hardwareFinish,'');
assert(!attached.items[0].note.includes('Старый'));
assert(attached.items[0].note.includes(item.title));
assert.equal(attached.items[0].note.match(/Нужен образец/g).length,1);
assert(attached.items[0].note.includes('Сохранить размеры'));
assert.equal(attached.items[1].note,'Сохранить черновик');
assert.deepEqual(normalizeSavedProject(attached,lookups),attached);
assert(!makeProjectText(normalized,solutions).includes('Устаревший комплект'));
const unknown=makeProjectText({items:[{id:'unpublished-internal-reference'}]},solutions);
assert(unknown.includes('Изделие 1'));
assert(!unknown.includes('unpublished-internal-reference'));
assert.equal(Object.values(retiredHardwareRoutes).filter(path=>path==='/catalog/mirrors').length,7);
assert.equal(retiredHardwareRoutes['/hardware/showers/holder'],'/hardware/showers');
assert.equal(retiredHardwareRoutes['/hardware/partitions/holder'],'/hardware/partitions');
console.log('PASS: saved projects preserve customer notes, remove incompatible fittings and obsolete codes; exports never use ID as product title; retired routes return to appropriate catalogues.');
