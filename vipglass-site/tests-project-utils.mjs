import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  normalizeSearch, searchSolutions, filterSolutions, makeProjectText, makeZip,
} from './dist/project-utils.mjs';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const categories = deepFreeze([
  { id: 'railings', title: 'Лестницы и ограждения' },
  { id: 'mezzanine', title: 'Ограждения второго света', parentId: 'railings' },
  { id: 'showers', title: 'Душевые и остекление бань' },
  { id: 'parts', title: 'Изготовление по чертежам' },
]);
const solutions = deepFreeze([
  { id: 'one', title: 'Стеклянное ограждение', categoryId: 'mezzanine', group: 'Самонесущее',
    application: ['Антресоль', 'Второй свет'], mounting: 'Профиль', features: ['Прозрачное', 'Без поручня'] },
  { id: 'two', title: 'Стеклянная дверь в сауну', categoryId: 'showers', group: 'Двери',
    application: 'Сауна', opening: 'Распашное', mounting: 'Петли', features: ['Матовая'] },
  { id: 'three', title: 'Стеклянные детали по ТЗ', categoryId: 'parts', application: ['Объект'],
    mounting: ['Профиль', 'Точки'], description: 'Изготовление по вашим размерам и чертежам.' },
  { id: 'four', title: 'Банкетный зал', categoryId: 'parts' },
]);
const before = JSON.stringify({ categories, solutions });
const ids = values => values.map(value => value.id);
assert.equal(normalizeSearch('  ЁЛКА\n  ЧЕРТЁЖ  '), 'елка чертеж');
assert.equal(normalizeSearch(null), '');
assert.deepEqual(ids(searchSolutions(solutions, categories, 'перила профиль')), ['one']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'баня')), ['two']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'бань')), ['two']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'стеклянные двери')), ['two']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'стеклянная дверь профиль')), []);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'чертежи детали')), ['three']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'тз детали')), ['three']);
assert.deepEqual(ids(searchSolutions(solutions, categories, 'второй свет')), ['one']);
assert.notEqual(searchSolutions(solutions, categories, ''), solutions);
assert.deepEqual(ids(filterSolutions(solutions, 'railings', {
  group: 'Самонесущее', application: 'Антресоль', mounting: 'Профиль', feature: 'Прозрачное', q: 'перила',
}, categories)), ['one']);
assert.deepEqual(ids(filterSolutions(solutions, 'showers', { opening: 'распашное' }, categories)), ['two']);
assert.deepEqual(ids(filterSolutions(solutions, 'all', { feature: ['Прозрачное', 'Без поручня'] }, categories)), ['one']);
assert.deepEqual(ids(filterSolutions(solutions, 'all', { feature: 'Матовая', mounting: 'Профиль' }, categories)), []);
assert.equal(JSON.stringify({ categories, solutions }), before);

const project = deepFreeze({
  items: [
    { id: 'one', mode: 'installation', width: '1200', height: 950, quantity: 2, note: 'Поручень не нужен.' },
    { id: 'three', mode: 'parts', width: '1500 мм', quantity: 1, files: [{ name: 'Деталь № 1.pdf' }] },
  ],
  description: 'Ограждение второго света.\nСтекло прозрачное.', name: 'Иван', contact: 'ivan@example.test',
  files: [{ name: 'Чертёж_баня.pdf' }, { name: 'Фото монтажа.jpg' }],
});
const projectBefore = JSON.stringify(project);
const projectText = makeProjectText(project, solutions);
assert.match(projectText, /Изделие с установкой/);
assert.match(projectText, /Изготовление деталей по ТЗ/);
assert.match(projectText, /ширина 1200 мм; высота 950 мм/);
assert.doesNotMatch(projectText, /мм мм|undefined|null/);
assert.match(projectText, /Чертёж_баня\.pdf/);
assert.match(projectText, /Деталь № 1\.pdf/);
assert.match(makeProjectText(), /Изделия пока не добавлены/);
assert.doesNotMatch(makeProjectText({ items: [null, {}] }), /undefined|null/);
assert.equal(JSON.stringify(project), projectBefore);

const binary = new Uint8Array([50, 0, 127, 128, 255, 60]);
const binaryBefore = Array.from(binary);
const entries = [
  { name: 'Задание VIP Glass.txt', data: projectText },
  { name: 'Чертежи/Фасад № 1.bin', data: binary.subarray(1, 5) },
  { name: 'Пустой файл.txt', data: '' },
  { name: 'Фото/Сауна 🪟.dat', data: new Uint8Array([1, 2, 3]).buffer },
];
const zip = makeZip(entries);
assert.ok(zip instanceof Uint8Array);
assert.deepEqual(Array.from(binary), binaryBefore);
assert.deepEqual(zip, makeZip(entries), 'ZIP output must be deterministic');
assert.throws(() => makeZip([{ name: '../escape.txt', data: 'x' }]), /недопустимое/);
assert.throws(() => makeZip([{ name: 'file.bin', data: {} }]), /data должно/);
const encoder = new TextEncoder();
const payload = {
  archives: [
    { data: Buffer.from(zip).toString('base64'), files: entries.map(entry => ({
      name: entry.name,
      data: Buffer.from(typeof entry.data === 'string' ? encoder.encode(entry.data)
        : entry.data instanceof ArrayBuffer ? new Uint8Array(entry.data) : entry.data).toString('base64'),
    })) },
    { data: Buffer.from(makeZip([])).toString('base64'), files: [] },
  ],
};
const python = spawnSync('python3', ['-c', `
import base64, io, json, sys, zipfile, zlib
payload = json.load(sys.stdin)
for archive in payload['archives']:
    with zipfile.ZipFile(io.BytesIO(base64.b64decode(archive['data']))) as z:
        assert z.testzip() is None, 'CRC mismatch'
        assert z.namelist() == [f['name'] for f in archive['files']], 'UTF-8 names mismatch'
        for expected in archive['files']:
            info = z.getinfo(expected['name'])
            data = base64.b64decode(expected['data'])
            assert z.read(info.filename) == data
            assert info.compress_type == zipfile.ZIP_STORED
            assert info.flag_bits & 0x800
            assert info.CRC == zlib.crc32(data)
print('Python zipfile: UTF-8 names, CRC32, content, empty ZIP — OK')
`], { input: JSON.stringify(payload), encoding: 'utf8' });
assert.equal(python.status, 0, python.stderr || python.stdout);
console.log('Search, synonym families, AND queries, facets, missing fields, immutability — OK');
console.log(python.stdout.trim());
