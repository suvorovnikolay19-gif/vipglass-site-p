/** Keep saved customer choices compatible with the current public catalogue. */
export const retiredHardwareRoutes = Object.freeze({...Object.fromEntries([
  '/hardware/mirrors',
  '/hardware/mirrors/frame-profile',
  '/hardware/mirrors/lighting-profile',
  '/hardware/mirrors/frame',
  '/hardware/item/mirror-frame-profile',
  '/hardware/item/mirror-light-profile',
  '/hardware/item/round-mirror-frame',
].map(path => [path, '/catalog/mirrors'])),
  '/hardware/showers/holder':'/hardware/showers',
  '/hardware/partitions/holder':'/hardware/partitions',
});

const publicChoice = (choice, hardwareById) => {
  const item = hardwareById.get(choice?.id);
  if (!item) return null;
  const finish = item.finishes.find(value => value.id === choice.finishId);
  return {id:item.id,title:item.title,finishId:finish?.id || '',finishLabel:finish?.label || '',note:String(choice.note || '')};
};

export function normalizeSavedProject(input, {solutionsById, hardwareById}) {
  const source = input && typeof input === 'object' ? input : {};
  const items = (Array.isArray(source.items) ? source.items : [])
    .filter(item => item && typeof item.id === 'string').slice(0,100).map(raw => {
      const item = {...raw};
      // Old metadata is not part of a customer's saved selection or its export.
      for (const key of ['sku','mpn','gtin','productID','article','articleNumber','articleCode','vendorCode','supplierCode','sourceBrand','sourceUrl']) delete item[key];
      const category = (typeof item.catalogPath === 'string' ? item.catalogPath.split('/')[2] : '') || solutionsById.get(item.id)?.category;
      const mirror = category === 'mirrors';
      const hardware = hardwareById.get(item.hardwareId);
      if (mirror || (item.hardwareId && (!hardware || (category && !hardware.applications.includes(category))))) {
        // Preserve the customer's own comment while removing the obsolete generated line.
        let note = String(item.note || '');
        if (item.hardwareNote) note = note.replace(String(item.hardwareNote),'').trim();
        note = note.split('\n').filter(line=>!/^\s*(?:Фурнитура|Отделка фурнитуры):/.test(line)).join('\n').trim();
        if (item.hardwareComment && !note.includes(item.hardwareComment)) note = [note,item.hardwareComment].filter(Boolean).join('\n');
        item.note = note;
        for (const key of ['hardwareId','hardwareFinish','hardwareNote','hardwareComment']) delete item[key];
      } else if (hardware) {
        let note = String(item.note || '');
        if (item.hardwareNote) note = note.replace(String(item.hardwareNote),'').trim();
        note = note.split('\n').filter(line=>!/^\s*(?:Фурнитура|Отделка фурнитуры):/.test(line)).join('\n').trim();
        const finish = hardware.finishes.find(value=>value.id===item.hardwareFinish);
        item.hardwareFinish = finish?.id || '';
        item.hardwareNote = `Фурнитура: ${hardware.title}${hardware.brand==='Pauli'?' · Pauli':''}${finish?'\nОтделка фурнитуры: '+finish.label:''}`;
        item.note = [note,item.hardwareNote,item.hardwareComment && !note.includes(item.hardwareComment) ? item.hardwareComment : ''].filter(Boolean).join('\n');
      }
      return item;
    });
  return {
    items,
    hardwarePreferences:(Array.isArray(source.hardwarePreferences) ? source.hardwarePreferences : []).map(choice => publicChoice(choice,hardwareById)).filter(Boolean),
    description:String(source.description || ''),name:String(source.name || ''),contact:String(source.contact || ''),
  };
}
