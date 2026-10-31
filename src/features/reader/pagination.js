/**
 * Mesin pemenggalan halaman reader.
 * Mempertahankan batas ayat, pemisah manual, dan pemenggalan teks sesuai tinggi layar.
 */
export function splitSectionForScreen(section,sectionIndex,availableHeight,width){
 const out=[];let chunk='';
 const probe=$('arabicText').cloneNode(false);probe.removeAttribute('id');
 probe.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;display:block;flex:none;min-height:0;height:auto;max-height:none;overflow:visible;width:'+width+'px;';
 probe.classList.toggle('quran-text',Boolean(section.quranSurah));
 document.body.appendChild(probe);
 const measure=value=>{probe.textContent=value;return probe.scrollHeight;};
 const push=value=>{if(value.trim())out.push({...section,text:value.trim(),sectionIndex,continuation:out.length>0});};
 const addWords=value=>{
  const words=value.split(/\s+/u).filter(Boolean);let part='';
  for(const word of words){
   const candidate=part?part+' '+word:word;
   if(measure(candidate)>availableHeight&&part){push(part);part=word;}else part=candidate;
  }
  if(part)push(part);
 };
 // Explicit page groups saved by the page-layout editor take priority over automatic packing.
 if(typeof section.pageLayoutText==='string'&&section.pageLayoutText.includes('[[HALAMAN BARU]]')){
  // Manual layout is authoritative: split only on the explicit marker, not arbitrary whitespace.
  // If a marked group is too tall, move complete source lines to the next page while preserving
  // every newline within the source. Never run the group's text through addWords(), which flattens it.
  const groups=section.pageLayoutText.split(/\n[ \t]*\[\[HALAMAN BARU\]\][ \t]*\n/u).map(x=>x.trim()).filter(Boolean);
  for(const group of groups){
   if(measure(group)<=availableHeight){push(group);continue;}
   const lines=group.split(/(?<=\n)/u);
   let lineChunk='';
   for(const line of lines){
    const candidate=lineChunk+line;
    if(lineChunk&&measure(candidate.trim())>availableHeight){
     push(lineChunk);
     lineChunk=line;
    }else{
     lineChunk=candidate;
    }
   }
   if(lineChunk.trim())push(lineChunk);
  }
  probe.remove();
  return out.length?out:[{...section,sectionIndex,continuation:false}];
 }
 // Match each complete ayah through its verse marker. Never split an ayah across pages.
 const units=section.quranSurah
  ? (section.text.match(/[\s\S]*?۝[٠-٩۰-۹0-9]{1,3}|[\s\S]+$/gu)||[section.text]).map(x=>x.trim()).filter(Boolean)
  : section.preserveAyat
   ? section.text.split(/(?<=۝)/u).map(x=>x.trim()).filter(Boolean)
   : (section.tahlilGroup || section.preserveSeparators) ? section.text.split(/\n{2,}/u).map(x=>x.trim()).filter(Boolean) : section.text.split(/\n+/u).map(x=>x.trim()).filter(Boolean);
 for(const unit of units){
  // Ayat Yasin dan Ar-Rahman mengalir dalam paragraf yang sama; pergantian halaman tetap hanya di batas ayat.
  const separator=section.quranSurah?' ':((section.tahlilGroup || section.preserveSeparators)?'\n\n\n':'\n');
  const candidate=chunk?chunk+separator+unit:unit;
  if(measure(candidate)>availableHeight&&chunk){push(chunk);chunk='';}
  if(measure(unit)>availableHeight){
   if(chunk){push(chunk);chunk='';}
   if(section.quranSurah||section.preserveAyat){
    // An unusually tall single ayah remains intact on its own page; do not word-split Quran.
    push(unit);
   }else addWords(unit);
  }else{
   chunk=chunk?chunk+separator+unit:unit;
  }
 }
 if(chunk)push(chunk);
 probe.remove();
 return out.length?out:[{...section,sectionIndex,continuation:false}];
}
