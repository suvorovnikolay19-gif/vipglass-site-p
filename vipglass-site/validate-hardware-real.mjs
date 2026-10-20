/**
 * Verify the public hardware-photo resolver against actual catalogue data and
 * local files. Does not open a browser or claim visual/product authentication.
 * Run: node validate-hardware-real.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {hardware,resourcePhoto,resourceMediaForNode} from './dist/resource-catalog.mjs';
import {hardwareRealAssets,realHardwareMediaForNode} from './dist/hardware-real-media.mjs';
import {createHardwareUI} from './dist/hardware-ui.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const errors=[],checks=[];
const verifiedFiles=new Map();
const normalize=value=>String(value??'').toLocaleLowerCase('ru-RU').replace(/\s+/g,' ').trim();
function check(name,fn){try{fn();checks.push(name);}catch(error){errors.push({check:name,error:error.message});}}

function imageDimensions(data){
  if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'){
    let offset=12;
    while(offset+8<=data.length){
      const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),body=offset+8;
      if(kind==='VP8X')return {width:1+data.readUIntLE(body+4,3),height:1+data.readUIntLE(body+7,3)};
      if(kind==='VP8L'){assert.equal(data[body],0x2f);const bits=data.readUInt32LE(body+1);return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
      if(kind==='VP8 '){assert.equal(data.toString('hex',body+3,body+6),'9d012a');return {width:data.readUInt16LE(body+6)&0x3fff,height:data.readUInt16LE(body+8)&0x3fff};}
      offset=body+size+(size&1);
    }
  }
  if(data[0]===0xff&&data[1]===0xd8){
    let offset=2;
    while(offset+4<=data.length){
      if(data[offset]!==0xff){offset++;continue;}
      while(data[offset]===0xff)offset++;
      const marker=data[offset++];
      if(marker===0xd9||marker===0xda)break;
      if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
      const size=data.readUInt16BE(offset);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:data.readUInt16BE(offset+3),width:data.readUInt16BE(offset+5)};
      offset+=size;
    }
  }
  if(data.toString('hex',0,8)==='89504e470d0a1a0a')return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
  throw new Error('Unsupported or invalid photo file.');
}

function localPhoto(src){
  assert.equal(typeof src,'string','Photo path is missing.');
  assert.match(src,/^\.?\/assets\/hardware-real\/[a-z][a-z-]*(?:-480)?\.(?:webp|jpe?g|png)$/,'Expected a local photo with a neutral semantic filename.');
  assert(!src.includes('..'));
  if(verifiedFiles.has(src))return verifiedFiles.get(src);
  const file=path.join(root,'dist',src.replace(/^\.?\//,''));
  assert.ok(fs.existsSync(file),`Missing photo: ${src}`);
  const bytes=fs.readFileSync(file);assert.ok(bytes.length>100,`Empty photo: ${src}`);
  const dimensions=imageDimensions(bytes);assert.ok(dimensions.width>0&&dimensions.height>0);
  const record={...dimensions,hash:createHash('sha256').update(bytes).digest('hex')};verifiedFiles.set(src,record);return record;
}

const forbiddenKeys=new Set(['sku','article','articlenumber','articlecode','vendorcode','suppliercode','sourcebrand','sourceurl','producturl','imageurl','officialskuprivate','officialtitleprivate']);
function publicOnly(value,where='public hardware data'){
  if(typeof value==='string')assert.doesNotMatch(value,/https?:\/\/|(?:vetro|gals)[-\s_]?|\b[A-Z]{1,4}-\d{2,}\b/,`Supplier source or model identifier in ${where}`);
  else if(Array.isArray(value))value.forEach((item,index)=>publicOnly(item,`${where}[${index}]`));
  else if(value&&typeof value==='object')for(const[key,child]of Object.entries(value)){
    assert(!forbiddenKeys.has(key.toLowerCase()),`Private field ${where}.${key}`);publicOnly(child,`${where}.${key}`);
  }
}

let exactChoices=0,referenceChoices=0;
const unsupported=[];
check('Public records contain no private supplier fields, URLs or model codes',()=>{
  publicOnly(hardwareRealAssets,'hardwareRealAssets');publicOnly(hardware,'hardware');
});

for(const item of hardware){
  const record=hardwareRealAssets[item.id];
  if(!record){
    unsupported.push(item.id);
    check(`${item.id}: unavailable product does not borrow another product's photograph`,()=>{
      const media=realHardwareMediaForNode(item,item.finishes[0]?.id||'');
      assert.equal(media?.kind,'unavailable');assert.equal(media.src,'');assert.equal(media.exactFinish,false);
      assert.equal(resourceMediaForNode(item).src,'');assert.doesNotMatch(resourcePhoto(item),/<img\b/);
    });
    continue;
  }
  check(`${item.id}: default and verified finishes agree with the public catalogue`,()=>{
    const publicFinishes=item.finishes.map(f=>f.id);
    assert.ok(publicFinishes.length>0);
    assert.ok(publicFinishes.includes(record.defaultFinish),'Default finish is not selectable.');
    for(const finish of publicFinishes)assert.ok(record.verifiedFinishIds.includes(finish),`Unverified public finish: ${finish}`);
    for(const [finish,photo]of Object.entries(record.finishes)){
      assert.ok(record.verifiedFinishIds.includes(finish),`Photo for an unverified finish: ${finish}`);
      assert.equal(photo.verified,true);
      assert.equal(photo.photoFinishId,finish,'A finish entry cannot silently relabel another colour.');
      const dimensions=localPhoto(photo.src);
      assert.equal(photo.width,dimensions.width,`Incorrect width for ${photo.src}`);assert.equal(photo.height,dimensions.height,`Incorrect height for ${photo.src}`);
    }
  });

  check(`${item.id}: every selectable finish resolves honestly and uses the correct local asset`,()=>{
    const exactHashes=new Map();
    for(const finish of item.finishes){
      const media=realHardwareMediaForNode(item,finish.id);
      assert.ok(media,`No photo result for ${finish.id}`);publicOnly(media);
      assert.ok(['catalog-photo','supplier-catalogue'].includes(media.kind));assert.equal(media.selectedFinish,finish.id);
      const photo=record.finishes[media.photoFinishId];assert.ok(photo,'Resolved photo has no verified finish record.');
      assert.equal(media.src,photo.src);assert.equal(media.thumbnail,photo.thumbnail||photo.src);
      const dimensions=localPhoto(media.src);localPhoto(media.thumbnail);
      assert.equal(media.width,dimensions.width);assert.equal(media.height,dimensions.height);
      assert.equal(media.exactFinish,media.photoFinishId===finish.id);
      if(record.finishes[finish.id])assert.equal(media.src,record.finishes[finish.id].src,'A dedicated finish photograph was ignored.');
      if(media.exactFinish){
        exactChoices++;assert(!exactHashes.has(dimensions.hash),`One identical photo is presented as two exact finishes: ${exactHashes.get(dimensions.hash)} and ${finish.id}`);exactHashes.set(dimensions.hash,finish.id);
      }else{
        referenceChoices++;
        const shown=item.finishes.find(value=>value.id===media.photoFinishId);
        assert.ok(shown,'Reference photo finish is missing from catalogue labels.');
        assert.ok(normalize(`${media.caption||''} ${media.limitation||''}`).includes(normalize(shown.label)),'Reference caption must name the actual photographed finish.');
        assert.ok(media.limitation,'A reference photo needs a visible limitation.');
      }
      const integrated=resourceMediaForNode(item,{finish:finish.id});assert.equal(integrated.src,media.src,'Resource resolver lost the selected finish.');
      const markup=resourcePhoto(item,{finish:finish.id});assert.ok(markup.includes(`src="${media.src}"`),'Photo markup lost the selected finish.');assert.doesNotMatch(markup,/https?:\/\/|hue-rotate|filter\s*:/);
    }
  });

  check(`${item.id}: unknown finish values cannot impersonate a verified selected finish`,()=>{
    for(const finish of ['unknown-finish','__proto__','constructor','toString']){
      const media=realHardwareMediaForNode(item,finish);
      if(media===null)continue;
      assert.ok(media&&typeof media==='object');publicOnly(media);localPhoto(media.src);
      assert.ok(Object.hasOwn(record.finishes,media.photoFinishId),'Prototype or unsupported photo entry escaped.');
      if(media.selectedFinish===finish){
        assert.equal(media.exactFinish,false,'Unknown selection cannot claim an exact photograph.');
        const shown=item.finishes.find(value=>value.id===media.photoFinishId);
        assert.ok(shown);
        assert.ok(normalize(`${media.caption||''} ${media.limitation||''}`).includes(normalize(shown.label)),'Unknown choice fallback must identify the actual photo finish.');
        assert.ok(media.limitation);
      }else assert.equal(media.exactFinish,media.selectedFinish===media.photoFinishId&&item.finishes.some(f=>f.id===media.selectedFinish));
    }
  });
}

check('Unknown hardware IDs do not resolve to an unrelated real product',()=>{
  for(const id of ['unknown-hardware','__proto__','constructor']){
    const media=realHardwareMediaForNode({id,type:'hinge',kind:'hardware',image:'hardware-hinge',title:'Неизвестный элемент'});
    if(media===null)continue;
    assert.equal(media.kind,'unavailable');assert.equal(media.src,'');assert.equal(media.photoFinishId,'');assert.equal(media.exactFinish,false);
  }
});

check('Actual finish preview changes the photograph and gallery metadata without resetting the customer form',()=>{
  const item=hardware.find(value=>value.id==='wall-glass-hinge');assert.ok(item);
  const chrome=resourceMediaForNode(item,{finish:'chrome'}),black=resourceMediaForNode(item,{finish:'black'});
  assert.notEqual(chrome.src,black.src);assert.notEqual(`${chrome.width}x${chrome.height}`,`${black.width}x${black.height}`,'Use real images with different dimensions for this regression.');
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const decode=value=>String(value).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const attrs=markup=>Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,decode(value)]));
  const ui=createHardwareUI({esc:escape,btn:(text,url)=>`<a href="${url}">${text}</a>`,crumb:()=>''});
  const html=ui.detail(item,new URLSearchParams('finish=chrome'),[{uid:'chosen-construction',title:'Выбранная душевая',catalogPath:'/catalog/showers/showers-open/showers-open-straight'}]);
  const initialButton=html.match(/<button\b([^>]*class="gallery-open"[^>]*)>([\s\S]*?)<\/button>/);
  assert.ok(initialButton,'The real detail page must expose its gallery button.');
  const initialAttrs=attrs(initialButton[1]);
  const button={dataset:{resourceSrc:initialAttrs['data-resource-src'],resourceAlt:initialAttrs['data-resource-alt'],caption:initialAttrs['data-caption']},innerHTML:initialButton[2]};
  const caption={textContent:decode(html.match(/<p\b[^>]*data-hardware-caption[^>]*>([\s\S]*?)<\/p>/)?.[1]||'')};
  const selectedRadio={value:'chrome'};
  let noteWrites=0,targetWrites=0;
  const note={_value:'Сохранить моё пояснение и сторону открывания.'};Object.defineProperty(note,'value',{get:()=>note._value,set:value=>{noteWrites++;note._value=value;}});
  const target={_value:'chosen-construction'};Object.defineProperty(target,'value',{get:()=>target._value,set:value=>{targetWrites++;target._value=value;}});
  const noRerender=(object,name)=>Object.defineProperty(object,'innerHTML',{get:()=>html,set:()=>{throw new Error(`Unexpected ${name} rerender resets live form state.`);}});
  const gallery={querySelector:selector=>selector==='.gallery-open'?button:selector==='[data-hardware-caption]'?caption:null};noRerender(gallery,'gallery');
  const section={querySelector:selector=>selector==='.product-gallery'?gallery:selector==='#hardware-note'?note:selector==='#hardware-target'?target:null};noRerender(section,'detail page');
  const form={dataset:{hardware:item.id},closest:selector=>selector==='.hardware-detail'?section:null,querySelector:selector=>selector==='input[name="finish"]:checked'?selectedRadio:selector==='#hardware-note'||selector==='textarea'?note:selector==='#hardware-target'||selector==='select[name="target"]'?target:null};noRerender(form,'form');
  assert.equal(button.dataset.resourceSrc,chrome.src);
  selectedRadio.value='black';ui.updateFinishPreview(form);
  const img=attrs(button.innerHTML.match(/<img\b([^>]*)>/)?.[1]||'');
  assert.equal(img.src,black.src);assert.notEqual(img.src,chrome.src);assert.equal(img.alt,black.alt);assert.equal(Number(img.width),black.width);assert.equal(Number(img.height),black.height);
  assert.equal(button.dataset.resourceSrc,black.src);assert.equal(button.dataset.resourceAlt,black.alt);assert.equal(button.dataset.caption,black.caption);assert.equal(caption.textContent,black.caption);
  assert.notEqual(caption.textContent,chrome.caption);assert.equal(note.value,'Сохранить моё пояснение и сторону открывания.');assert.equal(target.value,'chosen-construction');assert.equal(noteWrites,0);assert.equal(targetWrites,0);
});

console.log(JSON.stringify({result:errors.length?'FAIL':'PASS',coverage:unsupported.length?'partial':'complete',publicItems:hardware.length,records:Object.keys(hardwareRealAssets).length,exactFinishChoices:exactChoices,explicitReferenceChoices:referenceChoices,checkedLocalImages:verifiedFiles.size,unsupportedItems:unsupported,checks:checks.length,errors,scope:'Real catalogue/resolver data, rendered img markup and file headers; no browser or independent visual authentication.'},null,2));
if(errors.length)process.exitCode=1;
