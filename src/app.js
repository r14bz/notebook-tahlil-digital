import { sections, loadAdditionalSurahs } from './data/sections.js';
import { mountAppShell } from './components/app-shell.js';
import { registerOfflineSupport } from './services/offline/register-service-worker.js';
import { readPreference, writePreference, readJsonPreference, writeJsonPreference } from './services/storage/preferences.js';
import { getReadingGroup } from './features/reader/navigation.js';
import { getReadingGroupBounds, getPageProgress } from './features/reader/page-state.js';
import { prepareReadingSections, completeSectionStarts } from './features/reader/sections.js';
import { getSwipeDirection } from './features/reader/gestures.js';
import { applyReaderTheme, applyReaderFontSize } from './features/reader/appearance.js';
import { splitSectionForScreen } from './features/reader/pagination.js';
import { renderReadingList } from './features/home/reading-list.js';
import { findCollectionStart } from './features/collections/navigation.js';

mountAppShell();
registerOfflineSupport();

const $=id=>document.getElementById(id);
let pages=[],index=0,sectionStarts=[],layoutPass=0,readerViewRequested=false;
const readPageLayout=()=>{
 const value=readJsonPreference('pageLayout', {});
 return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
};
const readSavedPageIndex=()=>{
 const value=Number.parseInt(readPreference('page','0'),10);
 return Number.isSafeInteger(value)&&value>=0?value:0;
};

function buildPages(){
 const pass=++layoutPass;
 const wasReaderActive=readerViewRequested;
 document.body.classList.add('reader-active');
 const saved=readSavedPageIndex(),currentPage=pages[index],currentSection=currentPage?.sectionIndex;
 const currentSectionOffset=currentSection===undefined?0:pages.slice(0,index).filter(page=>page.sectionIndex===currentSection).length;
 const paper=$('paper'),text=$('arabicText');
 $('pageTitle').textContent='Mengukur halaman';text.textContent='بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
 requestAnimationFrame(()=>{
  if(pass!==layoutPass)return;
  const available=Math.max(90,paper.clientHeight-$('pageTitle').offsetHeight-$('pageTitle').offsetTop-85);
  const width=Math.max(100,text.clientWidth);
  pages=[];sectionStarts=[];
  // Kelompok Tahlil sudah ditentukan di data; jangan gabungkan ulang berdasarkan panjang teks.
  const pageLayout=readPageLayout();
  const readingSections=prepareReadingSections(sections,pageLayout);
  readingSections.forEach(s=>{
   const originalIndex=s.originalIndex;
   sectionStarts[originalIndex]=pages.length;
   pages.push(...splitSectionForScreen(s,originalIndex,available,width,text));
  });
  sectionStarts=completeSectionStarts(sectionStarts,sections.length);
  const sectionPages=currentSection===undefined?[]:pages.reduce((matches,page,pageIndex)=>{
   if(page.sectionIndex===currentSection)matches.push(pageIndex);
   return matches;
  },[]);
  index=sectionPages.length?sectionPages[Math.min(currentSectionOffset,sectionPages.length-1)]:Math.min(saved,Math.max(0,pages.length-1));
  showPage(index);
  if(!wasReaderActive)document.body.classList.remove('reader-active');
 });
}
const tocGroups=[
 {title:'Tahlil',matches:s=>!s.quranSurah&&!s.collection},
 {title:'Surah Yasin',matches:s=>s.quranSurah===36},
 {title:'Surah Ar-Rahman',matches:s=>s.quranSurah===55},
 {title:"Dzikir",matches:s=>s.collection==='dzikir'}
];

function activateReader(sectionIndex){
 readerViewRequested=true;
 if(!pages.length){$('continueReadingLabel').textContent='Bacaan sedang disiapkan…';return;}
 const start=Math.max(0,sectionStarts[sectionIndex]??0);
 document.body.classList.add('reader-active');
 showPage(start);
 window.scrollTo({top:0,behavior:'smooth'});
}
const renderHome = () => renderReadingList({ sections, pages, $, activateReader });
function openCollection(kind){
 const first=findCollectionStart(sections,kind);
 if(first>=0)activateReader(first);
}
$('continueReadingBtn').addEventListener('click',()=>{
 const saved=readSavedPageIndex();
 readerViewRequested=true;document.body.classList.add('reader-active');showPage(Math.min(saved,Math.max(0,pages.length-1)));window.scrollTo({top:0,behavior:'smooth'});
});
document.querySelectorAll('[data-home-target]').forEach(b=>b.addEventListener('click',()=>{if(b.classList.contains('is-activating'))return;b.classList.add('is-activating');window.setTimeout(()=>openCollection(b.dataset.homeTarget),150);window.setTimeout(()=>b.classList.remove('is-activating'),420)}));
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
let pageTurning=false,queuedTurn=null;
function paintPage(s){
 $('pageTitle').textContent=s.title;
 $('arabicText').style.whiteSpace='pre-wrap';
 $('arabicText').textContent=s.text;
 $('arabicText').classList.toggle('quran-text',Boolean(s.quranSurah));
 
 const sectionFirst=pages.findIndex(page=>getReadingGroup(page)===getReadingGroup(s));
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
 const bounds=getReadingGroupBounds(pages,index);
 const progress=getPageProgress(index,bounds);
 $('prevBtn').disabled=index<=bounds.start;
 $('nextBtn').disabled=index>=bounds.end;document.querySelectorAll('.swipe-hint-left').forEach(b=>{b.disabled=$('prevBtn').disabled});document.querySelectorAll('.swipe-hint-right').forEach(b=>{b.disabled=$('nextBtn').disabled});
 $('progressText').textContent=progress.percent+'%';
 $('progressBar').style.width=progress.percent+'%';
 writePreference('page', index);
 if(animate){
  pageTurning=true;p.style.transformOrigin=animate==='turn-next'?'left center':'right center';
  p.classList.add(animate==='turn-next'?'turn-out-next':'turn-out-prev');
  window.setTimeout(()=>{
   paintPage(s);p.classList.remove('turn-out-next','turn-out-prev');
   p.style.transformOrigin=animate==='turn-next'?'right center':'left center';
   p.classList.add(animate==='turn-next'?'turn-in-next':'turn-in-prev');
   window.setTimeout(()=>{p.classList.remove('turn-in-next','turn-in-prev');p.style.transformOrigin='left center';pageTurning=false;if(queuedTurn){const q=queuedTurn;queuedTurn=null;if(q==='next')next();else prev();}},350);
  },175);
 }else paintPage(s);
}
function next(){if(pageTurning){queuedTurn='next';return}if(index>=pages.length-1||getReadingGroup(pages[index+1])!==getReadingGroup(pages[index]))return;showPage(index+1,'turn-next')}
function prev(){if(pageTurning){queuedTurn='prev';return}if(index<=0||getReadingGroup(pages[index-1])!==getReadingGroup(pages[index]))return;showPage(index-1,'turn-prev')}
$('nextBtn').onclick=next;$('prevBtn').onclick=prev;
$('homeBtn').onclick=()=>{readerViewRequested=false;document.body.classList.remove('reader-active','toc-open');$('contentsBtn').setAttribute('aria-expanded','false');window.scrollTo({top:0,behavior:'smooth'});renderHome()};
$('contentsBtn').onclick=()=>{
 const open=!document.body.classList.contains('toc-open');
 if(open){readerViewRequested=true;document.body.classList.add('reader-active');renderContents();}
 document.body.classList.toggle('toc-open',open);
 $('contentsBtn').setAttribute('aria-expanded',String(open));
};
$('closeContents').onclick=()=>{document.body.classList.remove('toc-open');$('contentsBtn').setAttribute('aria-expanded','false')};
const applyTheme=theme=>applyReaderTheme(theme,{body:document.body,button:$('themeBtn'),writePreference});
$('themeBtn').onclick=()=>applyTheme(document.body.classList.contains('theme-dark')?'light':'dark');
applyTheme(readPreference('theme')==='dark'?'dark':'light');

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
  const direction=getSwipeDirection({dx,dy,duration});
  if(direction==='next')next();
  else if(direction==='prev')prev();
 },{passive:true});
 paper.setAttribute('aria-label','Halaman bacaan. Geser ke kiri untuk halaman berikutnya, geser ke kanan untuk halaman sebelumnya.');
 const left=document.createElement('button');left.type='button';left.className='swipe-hint swipe-hint-left';left.setAttribute('aria-label','Halaman sebelumnya');left.title='Halaman sebelumnya';left.textContent='‹';left.onclick=e=>{e.stopPropagation();left.classList.add('hint-tapped');prev();window.setTimeout(()=>left.classList.remove('hint-tapped'),80)};
 const right=document.createElement('button');right.type='button';right.className='swipe-hint swipe-hint-right';right.setAttribute('aria-label','Halaman berikutnya');right.title='Halaman berikutnya';right.textContent='›';right.onclick=e=>{e.stopPropagation();right.classList.add('hint-tapped');next();window.setTimeout(()=>right.classList.remove('hint-tapped'),80)};
 paper.append(left,right);
 [left,right].forEach(hint=>hint.addEventListener('click',()=>{hint.classList.add('hint-fading');window.setTimeout(()=>hint.classList.remove('hint-fading'),80)}));
})();

const applyFontSize=value=>applyReaderFontSize(value,{body:document.body,control:$('fontSize'),arabicText:$('arabicText'),writePreference});
$('fontSize').onchange=e=>{applyFontSize(e.target.value);buildPages()};
// Fullscreen control has been replaced by the theme toggle; do not bind the removed button.
document.body.classList.remove('reader-active','toc-open');$('contentsBtn').setAttribute('aria-expanded','false');
applyFontSize(readPreference('fontSize','normal'));
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
    const pageLayout=readPageLayout();
    pageLayout[Number(layout.sectionIndex)]=layout.text;
    writeJsonPreference('pageLayout', pageLayout);
   }
  }
 }catch{}
 // The reviewed, exported file committed with the app is authoritative.
 // Do not overwrite it with stale device-local editor data.
 buildPages();renderHome();
}).catch(()=>{});
window.addEventListener('resize',()=>{if(!document.body.classList.contains('reader-active'))return;clearTimeout(window.__tahlilResize);window.__tahlilResize=setTimeout(buildPages,220)});
if(document.fonts?.ready)document.fonts.ready.then(()=>setTimeout(()=>{if(document.body.classList.contains('reader-active'))buildPages()},80));
