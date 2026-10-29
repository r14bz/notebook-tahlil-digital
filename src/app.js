import { sections, tahlilSections, loadAdditionalSurahs } from './data/sections.js';
import { mountAppShell } from './components/app-shell.js';

mountAppShell();

const $=id=>document.getElementById(id);
let pages=[],index=0,sectionStarts=[],layoutPass=0;
const mobileReader=()=>window.matchMedia('(max-width: 768px)').matches;
function splitSectionForScreen(section,sectionIndex,availableHeight,width){
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
function buildPages(){
 const pass=++layoutPass;
 const wasReaderActive=document.body.classList.contains('reader-active');
 document.body.classList.add('reader-active');
 const saved=Number(localStorage.getItem('tahlil-page')||0),currentSection=pages[index]?.sectionIndex,paper=$('paper'),text=$('arabicText');
 $('pageTitle').textContent='Mengukur halaman';text.textContent='بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
 requestAnimationFrame(()=>{
  if(pass!==layoutPass)return;
  const available=Math.max(90,paper.clientHeight-$('pageTitle').offsetHeight-$('pageTitle').offsetTop-85);
  const width=Math.max(100,text.clientWidth);
  pages=[];sectionStarts=[];
  // Kelompok Tahlil sudah ditentukan di data; jangan gabungkan ulang berdasarkan panjang teks.
  const readingSections=[];
  let pageLayout={};
  try{pageLayout=JSON.parse(localStorage.getItem('etahlil-page-layout-v1')||'{}')||{}}catch{}
  // A complete exported Dzikir Ba'da Shalat layout already contains the whole collection.
  // Render it once at its anchor section and skip the original dzikir entries that it replaces.
  const manualDzikirLayoutIndex=Object.keys(pageLayout).map(Number).find(si=>
   sections[si]?.collection==='dzikir' &&
   typeof pageLayout[si]==='string' &&
   pageLayout[si].includes('[[HALAMAN BARU]]')
  );
  sections.forEach((s,si)=>{
   if(manualDzikirLayoutIndex!==undefined&&s.collection==='dzikir'&&si!==manualDzikirLayoutIndex)return;
   const item={...s,originalIndex:si};
   if(Object.prototype.hasOwnProperty.call(pageLayout,si)&&typeof pageLayout[si]==='string')item.pageLayoutText=pageLayout[si];
   readingSections.push(item);
  });
  readingSections.forEach((s,ri)=>{
   const originalIndex=s.originalIndex??ri;
   sectionStarts[originalIndex]=pages.length;
   pages.push(...splitSectionForScreen(s,originalIndex,available,width));
  });
  // Point all grouped Tahlil entries to the page that contains their combined text.
  let pageCursor=0;
  sections.forEach((s,si)=>{
   if(sectionStarts[si]===undefined)sectionStarts[si]=Math.max(0,pageCursor);
   pageCursor=sectionStarts[si];
  });
  const sectionPage=currentSection===undefined?-1:pages.findIndex(p=>p.sectionIndex===currentSection&&!p.continuation);
  index=sectionPage>=0?sectionPage:Math.min(saved,pages.length-1);showPage(index);
  if(!wasReaderActive)document.body.classList.remove('reader-active');
 });
}
const tocGroups=[
 {title:'Surah Yasin (ayat 1–83)',matches:s=>s.quranSurah===36},
 {title:'Surah Ar-Rahman (ayat 1–78)',matches:s=>s.quranSurah===55},
 ...tahlilSections.map(s=>({title:s.title,matches:page=>!page.quranSurah&&!page.collection&&page.title===s.title})),
 {title:"Dzikir Ba'da Shalat",matches:s=>s.collection==='dzikir'}
];
const sectionKind = s => s.quranSurah===36 ? 'yasin' : s.quranSurah===55 ? 'rahman' : 'tahlil';
function activateReader(sectionIndex){
 if(!pages.length){$('continueReadingLabel').textContent='Bacaan sedang disiapkan…';return;}
 const start=Math.max(0,sectionStarts[sectionIndex]??0);
 document.body.classList.add('reader-active');
 showPage(start);
 window.scrollTo({top:0,behavior:'smooth'});
}
function renderHome(){
 const saved=Number(localStorage.getItem('tahlil-page')||0);
 const savedPage=pages[Math.min(saved,Math.max(0,pages.length-1))];
 $('continueReadingLabel').textContent=savedPage ? (savedPage.title) : 'Mulai dari halaman pertama';
 $('tahlilMeta').textContent=sections.filter(s=>!s.quranSurah&&!s.collection).length+' bagian bacaan';
 const list=$('homeIndexList');list.innerHTML='';
 const groups=[
  {key:'tahlil',title:'Rangkaian Tahlil',sub:'Doa, zikir, tawasul, dan penutup',filter:s=>!s.quranSurah&&!s.collection,icon:'۞'},
  {key:'dzikir',title:"Dzikir Ba'da Shalat",sub:'Istighfar, dzikir, ayat pilihan, dan doa',filter:s=>s.collection==='dzikir',icon:'۞'},
  {key:'yasin',title:'Surah Yasin',sub:'Surah ke-36 · Al-Qur’an',filter:s=>s.quranSurah===36,icon:'٣٦'},
  {key:'rahman',title:'Surah Ar-Rahman',sub:'Surah ke-55 · Al-Qur’an',filter:s=>s.quranSurah===55,icon:'٥٥'}
 ];
 const query=($('homeSearch').value||'').trim().toLocaleLowerCase('id');
 let shown=0;
 groups.forEach((group,gi)=>{
  const entries=sections.map((s,i)=>({s,i})).filter(x=>group.filter(x.s)&&(!query||(x.s.title||'').toLocaleLowerCase('id').includes(query)));
  if(!entries.length)return;
  const heading=document.createElement('div');heading.className='index-group-title';heading.innerHTML='<span class="index-group-icon">'+group.icon+'</span><span><strong>'+group.title+'</strong><small>'+group.sub+'</small></span><span class="index-group-count">'+String(entries.length).padStart(2,'0')+'</span>';
  list.appendChild(heading);
  entries.forEach(({s,i},j)=>{
   const b=document.createElement('button');b.className='index-entry';b.type='button';
   const safeTitle=document.createElement('span');safeTitle.className='entry-title';safeTitle.textContent=s.title||'Bagian bacaan';
   const number=document.createElement('span');number.className='entry-number';number.textContent=String(j+1).padStart(2,'0');
   const desc=document.createElement('span');desc.className='entry-subtitle';desc.textContent=s.quranSurah ? (s.isBismillah?'Pembuka surah':'Ayat Al-Qur’an') : 'Doa dan zikir';
   const arrow=document.createElement('span');arrow.className='entry-arrow';arrow.textContent='↗';
   b.append(number,safeTitle,desc,arrow);b.addEventListener('click',()=>activateReader(i));list.appendChild(b);shown++;
  });
 });
 $('homeSearchEmpty').hidden=shown!==0;
}
function openCollection(kind){
 const first=sections.findIndex(s=>kind==='tahlil'?(!s.quranSurah&&!s.collection):kind==='dzikir'?s.collection==='dzikir':kind==='yasin'?s.quranSurah===36:s.quranSurah===55);
 if(first>=0)activateReader(first);
}
$('continueReadingBtn').addEventListener('click',()=>{
 const saved=Number(localStorage.getItem('tahlil-page')||0);
 document.body.classList.add('reader-active');showPage(Math.min(saved,Math.max(0,pages.length-1)));window.scrollTo({top:0,behavior:'smooth'});
});
document.querySelectorAll('[data-home-target]').forEach(b=>b.addEventListener('click',()=>openCollection(b.dataset.homeTarget)));
$('homeSearch').addEventListener('input',renderHome);
const renderContents=()=>{
 $('contents').innerHTML='';
 tocGroups.forEach((group,i)=>{
  const firstSection=sections.findIndex(group.matches);
  if(firstSection<0)return;
  const b=document.createElement('button');
  b.textContent=(i+1)+'. '+group.title;
  b.className=group.matches(pages[index]||{})?'active':'';
  b.onclick=()=>{showPage(Math.max(0,sectionStarts[firstSection]??0));document.body.classList.remove('toc-open');$('contentsBtn').setAttribute('aria-expanded','false')};
  $('contents').appendChild(b);
 });
};
let pageTurning=false;
function paintPage(s){
 $('pageTitle').textContent=s.title;
 $('arabicText').style.whiteSpace='pre-wrap';
 $('arabicText').textContent=s.text;
 $('arabicText').classList.toggle('quran-text',Boolean(s.quranSurah));
 const navGroup=page=>page.quranSurah?'quran-'+page.quranSurah:page.collection==='dzikir'?'dzikir':'tahlil';
 const sectionFirst=pages.findIndex(page=>navGroup(page)===navGroup(s));
 $('pageNumber').textContent='— '+String(index-sectionFirst+1).padStart(2,'0')+' —';
 renderContents();
}
function showPage(i,animate=''){
 if(!pages.length)return;
 if(pageTurning&&animate)return;
 const target=Math.max(0,Math.min(i,pages.length-1));
 if(target===index&&!animate&&$('pageTitle').textContent===pages[target].title&&$('arabicText').textContent===pages[target].text)return;
 index=target;
 const p=$('paper'),s=pages[index];
 p.classList.remove('turn-next','turn-prev','turn-out-next','turn-out-prev','turn-in-next','turn-in-prev');
 const current=pages[index];
 const navGroup=page=>page.quranSurah?'quran-'+page.quranSurah:page.collection==='dzikir'?'dzikir':'tahlil';
 const currentGroup=navGroup(current);
 const sectionFirst=pages.findIndex(page=>navGroup(page)===currentGroup);
 let sectionLast=index;
 while(sectionLast+1<pages.length&&navGroup(pages[sectionLast+1])===currentGroup)sectionLast++;
 const sectionPageIndex=index-sectionFirst+1,sectionPageCount=sectionLast-sectionFirst+1;
 $('prevBtn').disabled=index<=sectionFirst;
 $('nextBtn').disabled=index>=sectionLast;
 $('progressText').textContent=Math.round(sectionPageIndex/sectionPageCount*100)+'%';
 $('progressBar').style.width=(sectionPageIndex/sectionPageCount*100)+'%';
 localStorage.setItem('tahlil-page',index);
 if(animate){
  pageTurning=true;p.style.transformOrigin=animate==='turn-next'?'left center':'right center';
  p.classList.add(animate==='turn-next'?'turn-out-next':'turn-out-prev');
  window.setTimeout(()=>{
   paintPage(s);p.classList.remove('turn-out-next','turn-out-prev');
   p.style.transformOrigin=animate==='turn-next'?'right center':'left center';
   p.classList.add(animate==='turn-next'?'turn-in-next':'turn-in-prev');
   window.setTimeout(()=>{p.classList.remove('turn-in-next','turn-in-prev');p.style.transformOrigin='left center';pageTurning=false},350);
  },175);
 }else paintPage(s);
}
const navGroup=page=>page.quranSurah?'quran-'+page.quranSurah:page.collection==='dzikir'?'dzikir':'tahlil';
function next(){if(pageTurning||index>=pages.length-1||navGroup(pages[index+1])!==navGroup(pages[index]))return;showPage(index+1,'turn-next')}
function prev(){if(pageTurning||index<=0||navGroup(pages[index-1])!==navGroup(pages[index]))return;showPage(index-1,'turn-prev')}
$('nextBtn').onclick=next;$('prevBtn').onclick=prev;
$('homeBtn').onclick=()=>{document.body.classList.remove('reader-active','toc-open');$('contentsBtn').setAttribute('aria-expanded','false');window.scrollTo({top:0,behavior:'smooth'});renderHome()};
$('contentsBtn').onclick=()=>{
 const open=!document.body.classList.contains('toc-open');
 if(open){document.body.classList.add('reader-active');renderContents();}
 document.body.classList.toggle('toc-open',open);
 $('contentsBtn').setAttribute('aria-expanded',String(open));
};
$('closeContents').onclick=()=>{document.body.classList.remove('toc-open');$('contentsBtn').setAttribute('aria-expanded','false')};
const applyTheme=theme=>{document.body.classList.toggle('theme-dark',theme==='dark');$('themeBtn').querySelector('.header-icon').textContent=theme==='dark'?'☀':'☾';$('themeBtn').querySelector('.header-label').textContent=theme==='dark'?'Mode terang':'Mode gelap';$('themeBtn').setAttribute('aria-label',theme==='dark'?'Aktifkan mode terang':'Aktifkan mode gelap');$('themeBtn').title=theme==='dark'?'Mode terang':'Mode gelap';localStorage.setItem('etahlil-theme',theme)};
$('themeBtn').onclick=()=>applyTheme(document.body.classList.contains('theme-dark')?'light':'dark');
applyTheme(localStorage.getItem('etahlil-theme')==='dark'?'dark':'light');

// Swipe navigation on the paper: swipe left for next, right for previous.
(function enablePaperSwipe(){
 const paper=$('paper');let startX=0,startY=0,startTime=0;
 paper.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||document.body.classList.contains('toc-open'))return;
  startX=e.touches[0].clientX;startY=e.touches[0].clientY;startTime=Date.now();
 },{passive:true});
 paper.addEventListener('touchend',e=>{
  if(!startTime||!e.changedTouches.length||pageTurning)return;
  const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY,duration=Date.now()-startTime;
  startTime=0;
  if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.25||duration>900)return;
  if(dx<0)next();else prev();
 },{passive:true});
 paper.setAttribute('aria-label','Halaman bacaan. Geser ke kiri untuk halaman berikutnya, geser ke kanan untuk halaman sebelumnya.');
 const left=document.createElement('button');left.type='button';left.className='swipe-hint swipe-hint-left';left.setAttribute('aria-label','Halaman sebelumnya');left.title='Halaman sebelumnya';left.textContent='‹';left.onclick=e=>{e.stopPropagation();prev()};
 const right=document.createElement('button');right.type='button';right.className='swipe-hint swipe-hint-right';right.setAttribute('aria-label','Halaman berikutnya');right.title='Halaman berikutnya';right.textContent='›';right.onclick=e=>{e.stopPropagation();next()};
 paper.append(left,right);
})();

$('fontSize').onchange=e=>{const value=e.target.value;document.body.classList.remove('font-small','font-normal','font-large');document.body.classList.add('font-'+value);$('arabicText').classList.toggle('compact',value==='small');buildPages()};
// Fullscreen control has been replaced by the theme toggle; do not bind the removed button.
document.body.classList.remove('reader-active','toc-open');$('contentsBtn').setAttribute('aria-expanded','false');document.body.classList.add('font-'+$('fontSize').value);
// Render local content immediately so taps work even while optional surah data is loading.
buildPages();renderHome();
loadAdditionalSurahs().then(async()=>{
 try{
  const response=await fetch('./src/data/dzikir-overrides.json');
  if(response.ok){
   const data=await response.json();
   const dzikir=sections.filter(s=>s.collection==='dzikir');
   data.sections?.forEach((item,i)=>{if(dzikir[i]&&typeof item.text==='string')dzikir[i].text=item.text;});
  }
  // Apply the latest manually exported page breaks from the feature branch.
  // The Arabic text is used verbatim; only [[HALAMAN BARU]] markers control layout.
  const layoutResponse=await fetch('./etahlil-pembagian-halaman-dzikir.json',{cache:'no-store'});
  if(layoutResponse.ok){
   const layout=await layoutResponse.json();
   if(layout.format==='etahlil-dzikir-page-layout'&&layout.scope==='dzikir-ba-da-shalat'&&typeof layout.text==='string'&&layout.text.includes('[[HALAMAN BARU]]')){
    const pageLayout=JSON.parse(localStorage.getItem('etahlil-page-layout-v1')||'{}');
    pageLayout[Number(layout.sectionIndex)]=layout.text;
    localStorage.setItem('etahlil-page-layout-v1',JSON.stringify(pageLayout));
   }
  }
 }catch{}
 // The reviewed, exported file committed with the app is authoritative.
 // Do not overwrite it with stale device-local editor data.
 buildPages();renderHome();
}).catch(()=>{});
window.addEventListener('resize',()=>{if(!document.body.classList.contains('reader-active'))return;clearTimeout(window.__tahlilResize);window.__tahlilResize=setTimeout(buildPages,220)});
if(document.fonts?.ready)document.fonts.ready.then(()=>setTimeout(()=>{if(document.body.classList.contains('reader-active'))buildPages()},80));
