/** Visible sections and subtypes, without flattening their canonical hierarchy. */
export function catalogDirectory(nodes,{esc,photo,card,attribute='data-choice-path'}={}){
 const count=node=>node.isLeaf?1:(node.children||[]).reduce((total,child)=>total+count(child),0);
 const leafLabel=n=>`${n} ${n%100>=11&&n%100<=14?'исполнений':n%10===1?'исполнение':n%10>=2&&n%10<=4?'исполнения':'исполнений'}`;
 return `<div class="catalog-directory">${nodes.map((node,index)=>{
  if(node.isLeaf||!node.children?.length)return `<div class="directory-single">${card(node,index)}</div>`;
  const anchor='section-'+node.id;
  return `<section class="directory-group" id="${esc(anchor)}" data-directory-section="${esc(node.path)}"><a class="directory-group-heading" href="${node.url}" ${attribute}="${esc(node.path)}"><div class="directory-group-image">${photo(node)}</div><div><span class="eyebrow">${String(index+1).padStart(2,'0')} / ${leafLabel(count(node))}</span><h2>${esc(node.title)}</h2><p>${esc(node.intro||'Выберите отдельный вид или исполнение.')}</p><span class="directory-enter">Все разновидности <span aria-hidden="true">→</span></span></div></a><div class="directory-subtypes">${node.children.map((child,i)=>card(child,i,true)).join('')}</div></section>`;
 }).join('')}</div>`;
}

export function categoryPreview(node,esc){
 if(!node.children?.length)return '';
 return `<div class="card-subtypes" aria-label="Внутренние разновидности">${node.children.map(child=>`<span>${esc(child.title)}</span>`).join('')}</div>`;
}
