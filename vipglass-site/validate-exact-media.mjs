import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {exactCatalogMedia} from './dist/exact-catalog-media.mjs';
import {mediaForNode,mediaAssets,photoMarkup,galleryMarkup} from './dist/catalog-media.mjs';
import {nodesByPath} from './dist/catalog-tree.mjs';
const paths=Object.keys(exactCatalogMedia), hashes=new Set();
const subtree=[...nodesByPath.values()].filter(node=>node.path.startsWith('/catalog/showers/showers-u'));
const canonical=[...new Map(subtree.map(node=>[node.path,node])).values()];
assert.equal(canonical.length,10);
for(const node of canonical)assert(paths.includes(node.path),`Missing exact U-shaped page: ${node.path}`);
assert.equal(canonical.filter(node=>node.isLeaf).length,7);
for(const path of paths) {
  const node=nodesByPath.get(path), media=mediaForNode(node);
  assert(media.exact,`A family image replaced the exact photo: ${path}`);
  assert.equal(media.src,exactCatalogMedia[path].src);
  assert.equal(mediaForNode({treeNode:node}).src,media.src);
  assert.equal(mediaAssets[media.key].src,media.src,'The enlarged image must match its card');
  assert(photoMarkup(node).includes(`src="${media.src}"`));
  assert(photoMarkup(node,{small:true}).includes(`src="${media.thumbnail}"`));
  assert(galleryMarkup(node).includes(`data-image="${media.key}"`));
  const bytes=fs.readFileSync(new URL('./dist/'+media.src.slice(2),import.meta.url));
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert(!hashes.has(hash),`An exact photo was duplicated: ${path}`);hashes.add(hash);
}
console.log(`PASS: ${paths.length} distinct reviewed images; all 10 U-shaped shower pages and 7 final configurations use their own image in cards, thumbnails and gallery.`);
