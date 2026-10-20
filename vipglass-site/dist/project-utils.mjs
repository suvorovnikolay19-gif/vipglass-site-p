/** Pure catalogue and project-export helpers. No DOM, storage, or network access. */

export function normalizeSearch(value = '') {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

const WORDS = /[\p{L}\p{N}]+/gu;
const SEARCH_STOP_WORDS = new Set(['в', 'во', 'на', 'с', 'со', 'из', 'для', 'по', 'к', 'ко', 'от', 'до', 'у', 'о', 'об', 'обо', 'и', 'а']);
const EMPTY_SELECTIONS = new Set(['', 'all', 'все', 'все варианты', 'любое', 'любые']);
const IGNORED_SEARCH_KEYS = /^(?:id|slug|src|url|href|path|image|images|photo|photos|icon|thumbnail|source|sources|price)$/i;

function wordKey(word) {
  if (/^(?:перил|огражден)/u.test(word)) return '@ограждение';
  if (/^саун/u.test(word) || /^бан(?:я|и|ь|е|ю|ей|ям|ями|ях|н[а-я]*)$/u.test(word)) return '@баня';
  if (word === 'тз' || /^чертеж/u.test(word)) return '@чертеж';
  // Light inflection handling: «стеклянные двери» also finds «стеклянная дверь».
  if (/^[а-я]+$/u.test(word) && word.length > 4) {
    return word.replace(/(?:иями|ями|ами|ией|иям|ием|ого|его|ому|ему|ыми|ими|ая|яя|ое|ее|ые|ие|ую|юю|ый|ий|ой|ых|их|ия|ии|ам|ям|ом|ем|ах|ях|ов|ев|ей|а|я|ы|и|ь|й|у|ю|е|о)$/u, '');
  }
  return word;
}

function words(value) {
  return (normalizeSearch(value).match(WORDS) || []).map(wordKey);
}

function searchableText(value, seen = new Set()) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object' || seen.has(value)) return '';
  seen.add(value);
  if (Array.isArray(value)) return value.map(v => searchableText(v, seen)).join(' ');
  return Object.entries(value)
    .filter(([key]) => !IGNORED_SEARCH_KEYS.test(key))
    .map(([, item]) => searchableText(item, seen)).join(' ');
}

function records(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([id, item]) =>
      item && typeof item === 'object' ? { id, ...item } : { id, title: item });
  }
  return [];
}

function values(value) {
  if (Array.isArray(value)) return value.flatMap(values);
  if (value && typeof value === 'object') {
    return ['id', 'value', 'name', 'title', 'label', 'slug'].flatMap(key => values(value[key]));
  }
  return value == null ? [] : [normalizeSearch(value)];
}

function categoryIds(solution) {
  return [...new Set([
    ...values(solution?.categoryId), ...values(solution?.category),
    ...values(solution?.categoryIds), ...values(solution?.categories),
  ])];
}

function categoryIndex(categories) {
  return new Map(records(categories).flatMap(category =>
    [...values(category.id), ...values(category.slug)].map(id => [id, category])));
}

function relatedCategories(solution, index) {
  const found = [];
  const visited = new Set();
  const queue = categoryIds(solution);
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const category = index.get(id);
    if (!category) continue;
    found.push(category);
    queue.push(...values(category.parentId ?? category.parent));
  }
  return found;
}

/** Matches every meaningful query word. Category names are an exact-query fallback only. */
export function searchSolutions(solutions = [], categories = [], query = '') {
  const source = Array.isArray(solutions) ? solutions : [];
  const normalizedQuery = normalizeSearch(query);
  const rawTerms = normalizedQuery.match(WORDS) || [];
  const terms = [...new Set(rawTerms.filter(term => !SEARCH_STOP_WORDS.has(term)).map(wordKey))];
  if (!terms.length) return source.slice();
  const exactCategories = records(categories).filter(category =>
    [category.shortTitle, category.title].some(title => title != null && normalizeSearch(title) === normalizedQuery));
  const fallbackIds = new Set(exactCategories.flatMap(category => values(category.id)));
  const asksForRails = rawTerms.some(term => /^перил/u.test(term));
  return source.map((solution, order) => {
    const text = searchableText([
      solution?.title ?? solution?.name, solution?.description, solution?.tags,
      solution?.features ?? solution?.feature, solution?.application ?? solution?.applications,
      solution?.mounting ?? solution?.mountings, solution?.opening ?? solution?.openings,
    ]);
    const haystack = words(text);
    // «Перила» describes architectural railings, never a shower enclosure.
    const showerForRailQuery = asksForRails && /душев/u.test(normalizeSearch(text))
      && !/перил|лестниц|антресол|балкон|террас/u.test(normalizeSearch(text));
    const directMatch = !showerForRailQuery && terms.every(term => haystack.some(word => word === term || (
      !term.startsWith('@') && term.length >= 3 && word.startsWith(term)
    )));
    const categoryFallback = categoryIds(solution).some(id => fallbackIds.has(id));
    const exactTitle = normalizeSearch(solution?.title ?? solution?.name) === normalizedQuery;
    return { solution, order, matches: directMatch || categoryFallback, rank: exactTitle ? 0 : directMatch ? 1 : 2 };
  }).filter(result => result.matches)
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map(result => result.solution);
}

const FACETS = {
  group: ['group', 'groups', 'groupId'],
  application: ['application', 'applications'],
  mounting: ['mounting', 'mountings'],
  opening: ['opening', 'openings'],
  feature: ['feature', 'features'],
};

function isSelected(value) {
  return values(value).filter(item => !EMPTY_SELECTIONS.has(item));
}

function matchesFacet(solution, facet, selected) {
  const required = isSelected(selected);
  if (!required.length) return true;
  const present = FACETS[facet].flatMap(key => [
    ...values(solution?.[key]), ...values(solution?.facets?.[key]),
    ...values(solution?.attributes?.[key]),
  ]);
  return required.every(item => present.includes(item));
}

/** Filters return a new array and preserve the input objects and their order. */
export function filterSolutions(solutions = [], categoryId = '', filters = {}, categories = []) {
  const source = Array.isArray(solutions) ? solutions : [];
  const criteria = filters ?? {};
  const selectedCategories = isSelected(categoryId);
  const index = categoryIndex(categories);
  const filtered = source.filter(solution => {
    if (selectedCategories.length) {
      const ids = [
        ...categoryIds(solution),
        ...relatedCategories(solution, index).flatMap(category => values(category.id)),
      ];
      if (!selectedCategories.some(id => ids.includes(id))) return false;
    }
    return Object.keys(FACETS).every(facet => matchesFacet(solution, facet, criteria[facet]));
  });
  return searchSolutions(filtered, categories, criteria.q);
}

function clean(value) {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return '';
  return String(value).replace(/\r\n?/g, '\n').trim();
}

function fileNames(files) {
  if (!files) return [];
  let list;
  if (Array.isArray(files)) list = files;
  else if (typeof files !== 'string' && typeof files[Symbol.iterator] === 'function') list = Array.from(files);
  else list = [files];
  return list.map(file => {
    const name = typeof file === 'string' ? file : file?.name ?? file?.filename ?? file?.file?.name;
    return clean(name).split(/[\\/]/).pop();
  }).filter(Boolean);
}

function attachmentNames(owner) {
  return [...new Set([...fileNames(owner?.files), ...fileNames(owner?.attachments)])];
}

function dimension(value) {
  const text = clean(value);
  if (!text) return '';
  return /(?:мм|см|м|mm|cm|m)$/iu.test(text) ? text : `${text} мм`;
}

function dimensionLabel(value, fallback) {
  return (clean(value) || fallback).replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
}

/** Human-readable UTF-8 text. Files are listed by name only; no data is read here. */
export function makeProjectText(project = {}, solutions = []) {
  const data = project ?? {};
  const lookup = new Map(records(solutions).map(solution => [String(solution.id), solution]));
  const items = Array.isArray(data.items) ? data.items : [];
  const lines = ['VIP GLASS', 'Задание на расчёт', ''];
  if (clean(data.name)) lines.push(`Заказчик: ${clean(data.name)}`);
  if (clean(data.contact)) lines.push(`Контакт: ${clean(data.contact)}`);
  if (clean(data.name) || clean(data.contact)) lines.push('');
  if (clean(data.description)) lines.push('Задача', clean(data.description), '');
  lines.push('Состав проекта');
  if (!items.length) lines.push('Изделия пока не добавлены.');
  items.forEach((rawItem, index) => {
    const item = rawItem ?? {};
    const solution = lookup.get(String(item.id));
    const title = clean(item.title ?? item.name ?? solution?.title ?? solution?.name)
      || `Изделие ${index + 1}`;
    lines.push(`${index + 1}. ${title}`);
    const mode = {
      installation: 'Изделие с установкой',
      parts: 'Изготовление деталей по ТЗ',
    }[item.mode];
    lines.push(`   Формат заказа: ${mode || 'не указан'}`);
    const size = [
      dimension(item.width) && `${dimensionLabel(item.widthLabel, 'Ширина')} ${dimension(item.width)}`,
      !['diameter','side'].includes(item.sizeMode) && dimension(item.height) && `${dimensionLabel(item.heightLabel, 'Высота')} ${dimension(item.height)}`,
    ].filter(Boolean);
    if (size.length) lines.push(`   Размеры: ${size.join('; ')}`);
    if (clean(item.quantity)) lines.push(`   Количество: ${clean(item.quantity)}${/шт\.?$/iu.test(clean(item.quantity)) ? '' : ' шт.'}`);
    if (clean(item.note)) lines.push(`   Примечание: ${clean(item.note).replace(/\n/g, '\n   ')}`);
    const itemFiles = attachmentNames(item);
    if (itemFiles.length) lines.push('   Файлы к изделию:', ...itemFiles.map(name => `   • ${name}`));
    lines.push('');
  });
  if(Array.isArray(data.hardwarePreferences)&&data.hardwarePreferences.length){
    lines.push('Пожелания к фурнитуре конструкций');
    data.hardwarePreferences.forEach(item=>lines.push(`• ${clean(item.title)}${clean(item.finishLabel)?' — '+clean(item.finishLabel):''}${clean(item.note)?' — '+clean(item.note):''}`));
    lines.push('Фурнитура подбирается только в составе конструкции.','');
  }
  const projectFiles = attachmentNames(data);
  if (projectFiles.length) lines.push('Приложенные файлы', ...projectFiles.map(name => `• ${name}`), '');
  return `${lines.join('\n').trimEnd()}\n`;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, number) => {
  let crc = number;
  for (let bit = 0; bit < 8; bit++) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function entryBytes(value, encoder) {
  if (value == null) return new Uint8Array();
  if (typeof value === 'string') return encoder.encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new TypeError('ZIP: data должно быть строкой, Uint8Array или ArrayBuffer. Сначала прочитайте File.arrayBuffer().');
}

/**
 * Creates a deterministic, uncompressed ZIP with UTF-8 names and CRC32.
 * entries: [{ name: 'Чертежи/душевая.pdf', data: string | Uint8Array | ArrayBuffer }].
 * Returns Uint8Array synchronously. File/Blob inputs should be read by the caller.
 */
export function makeZip(entries = []) {
  if (!Array.isArray(entries)) throw new TypeError('ZIP: entries должен быть массивом.');
  if (entries.length > 65535) throw new RangeError('ZIP: поддерживается не более 65535 файлов.');
  const encoder = new TextEncoder();
  let localSize = 0;
  let centralSize = 0;
  const prepared = entries.map(entry => {
    const name = String(entry?.name ?? '').replace(/\\/g, '/');
    if (!name || name.includes('\0') || name.startsWith('/') || /^[a-z]:/i.test(name)
      || name.split('/').includes('..')) throw new TypeError('ZIP: недопустимое имя файла.');
    const nameBytes = encoder.encode(name);
    if (nameBytes.length > 65535) throw new RangeError('ZIP: слишком длинное имя файла.');
    const data = entryBytes(entry.data, encoder);
    if (data.length > 0xffffffff) throw new RangeError('ZIP: файл превышает предел ZIP32.');
    const result = { nameBytes, data, crc: crc32(data), offset: localSize, directory: name.endsWith('/') };
    localSize += 30 + nameBytes.length + data.length;
    centralSize += 46 + nameBytes.length;
    return result;
  });
  if (localSize + centralSize + 22 > 0xffffffff) throw new RangeError('ZIP: архив превышает предел ZIP32.');
  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  const u16 = (offset, value) => view.setUint16(offset, value, true);
  const u32 = (offset, value) => view.setUint32(offset, value, true);
  let centralOffset = localSize;
  for (const entry of prepared) {
    const { nameBytes, data, crc, offset, directory } = entry;
    u32(offset, 0x04034b50); // Local file header.
    u16(offset + 4, 20);
    u16(offset + 6, 0x0800); // UTF-8 filenames.
    u16(offset + 8, 0); // Stored, not compressed.
    u16(offset + 10, 0);
    u16(offset + 12, 0x0021); // 1980-01-01, reproducible metadata.
    u32(offset + 14, crc);
    u32(offset + 18, data.length);
    u32(offset + 22, data.length);
    u16(offset + 26, nameBytes.length);
    u16(offset + 28, 0);
    output.set(nameBytes, offset + 30);
    output.set(data, offset + 30 + nameBytes.length);

    u32(centralOffset, 0x02014b50);
    u16(centralOffset + 4, 20); // DOS platform, ZIP 2.0.
    u16(centralOffset + 6, 20);
    u16(centralOffset + 8, 0x0800);
    u16(centralOffset + 10, 0);
    u16(centralOffset + 12, 0);
    u16(centralOffset + 14, 0x0021);
    u32(centralOffset + 16, crc);
    u32(centralOffset + 20, data.length);
    u32(centralOffset + 24, data.length);
    u16(centralOffset + 28, nameBytes.length);
    u16(centralOffset + 30, 0);
    u16(centralOffset + 32, 0);
    u16(centralOffset + 34, 0);
    u16(centralOffset + 36, 0);
    u32(centralOffset + 38, directory ? 0x10 : 0);
    u32(centralOffset + 42, offset);
    output.set(nameBytes, centralOffset + 46);
    centralOffset += 46 + nameBytes.length;
  }
  u32(centralOffset, 0x06054b50); // End of central directory.
  u16(centralOffset + 4, 0);
  u16(centralOffset + 6, 0);
  u16(centralOffset + 8, prepared.length);
  u16(centralOffset + 10, prepared.length);
  u32(centralOffset + 12, centralSize);
  u32(centralOffset + 16, localSize);
  u16(centralOffset + 20, 0);
  return output;
}
