import { sections, tahlilSections, loadAdditionalSurahs } from './data/sections.js';
import { mountAppShell } from './components/app-shell.js';

mountAppShell();

const $=id=>document.getElementById(id);
let pages=[],index=0,audioMode='tts',voices=[],isRepeating=false,sectionStarts=[];
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
 // Match each complete ayah through its verse marker. Never split an ayah across pages.
 const units=section.quranSurah
  ? (section.text.match(/[\s\S]*?۝[٠-٩۰-۹0-9]{1,3}|[\s\S]+$/gu)||[section.text]).map(x=>x.trim()).filter(Boolean)
  : section.preserveAyat
   ? section.text.split(/(?<=۝)/u).map(x=>x.trim()).filter(Boolean)
   : section.text.split(/\n+/u).map(x=>x.trim()).filter(Boolean);
 for(const unit of units){
  const candidate=chunk?chunk+'\n'+unit:unit;
  if(measure(candidate)>availableHeight&&chunk){push(chunk);chunk='';}
  if(measure(unit)>availableHeight){
   if(chunk){push(chunk);chunk='';}
   if(section.quranSurah||section.preserveAyat){
    // An unusually tall single ayah remains intact on its own page; do not word-split Quran.
    push(unit);
   }else addWords(unit);
  }else{
   chunk=chunk?chunk+'\n'+unit:unit;
  }
 }
 if(chunk)push(chunk);
 probe.remove();
 return out.length?out:[{...section,sectionIndex,continuation:false}];
}
function buildPages(){
 const saved=Number(localStorage.getItem('tahlil-page')||0),paper=$('paper'),text=$('arabicText');
 $('pageTitle').textContent='Mengukur halaman';text.textContent='بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
 requestAnimationFrame(()=>{
  const available=mobileReader()?Math.max(80,text.clientHeight):Math.max(180,paper.clientHeight-205);
  const width=Math.max(100,text.clientWidth);
  pages=[];sectionStarts=[];
  // Gabungkan bacaan tahlil yang pendek agar tidak perlu terlalu sering berpindah halaman.
  const readingSections=[];
  const tahlilLimit=mobileReader()?1200:1800;
  sections.forEach((s,si)=>{
   if(s.quranSurah){readingSections.push({...s,originalIndex:si});return;}
   const previous=readingSections[readingSections.length-1];
   if(previous&&!previous.quranSurah&&previous.text.length+s.text.length+2<=tahlilLimit){
    previous.text+='\n'+s.text;
    previous.groupedCount=(previous.groupedCount||1)+1;
    previous.title='Rangkaian Tahlil';
   }else readingSections.push({...s,originalIndex:si,groupedCount:1});
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
  index=Math.min(saved,pages.length-1);showPage(index);renderHome();
 });
}
const tocGroups=[
 {title:'Yasin (ayat 1 sampai selesai)',matches:s=>s.quranSurah===36},
 {title:'Ar-Rahman (ayat 1 sampai selesai)',matches:s=>s.quranSurah===55},
 {title:'Tahlil (dari awal sampai selesai)',matches:s=>!s.quranSurah}
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
 $('continueReadingLabel').textContent=savedPage ? (savedPage.title+(savedPage.continuation?' · lanjutan':'')) : 'Mulai dari halaman pertama';
 $('tahlilMeta').textContent=sections.filter(s=>!s.quranSurah).length+' bagian bacaan';
 const list=$('homeIndexList');list.innerHTML='';
 const groups=[
  {key:'tahlil',title:'Rangkaian Tahlil',sub:'Doa, zikir, tawasul, dan penutup',filter:s=>!s.quranSurah,icon:'۞'},
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
 const first=sections.findIndex(s=>kind==='tahlil'?!s.quranSurah:kind==='yasin'?s.quranSurah===36:s.quranSurah===55);
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
 $('pageTitle').textContent=s.title+(s.continuation?' (lanjutan)':'');
 $('arabicText').textContent=s.text;
 $('arabicText').classList.toggle('quran-text',Boolean(s.quranSurah));
 $('pageNumber').textContent='— '+String(index+1).padStart(2,'0')+' —';
 $('audioStatus').textContent='Halaman siap dibaca.';
 if(audioMode==='qari')setQariTrack();
 renderContents();
}
function showPage(i,animate=''){
 if(!pages.length)return;
 if(pageTurning&&animate)return;
 const target=Math.max(0,Math.min(i,pages.length-1));
 if(target===index&&!animate&&$('pageTitle').textContent===pages[target].title+(pages[target].continuation?' (lanjutan)':'')&&$('arabicText').textContent===pages[target].text)return;
 index=target;
 const p=$('paper'),s=pages[index];
 p.classList.remove('turn-next','turn-prev','turn-out-next','turn-out-prev','turn-in-next','turn-in-prev');
 $('prevBtn').disabled=index===0;$('nextBtn').disabled=index===pages.length-1;
 $('progressText').textContent=Math.round((index+1)/pages.length*100)+'%';
 $('progressBar').style.width=((index+1)/pages.length*100)+'%';
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
function next(){if(!pageTurning&&index<pages.length-1)showPage(index+1,'turn-next')}function prev(){if(!pageTurning&&index>0)showPage(index-1,'turn-prev')}
$('nextBtn').onclick=next;$('prevBtn').onclick=prev;
// Swipe navigation on the paper: swipe left for next, right for previous.
(function enablePaperSwipe(){
 const paper=$('paper');let startX=0,startY=0,startTime=0;
 paper.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||document.body.classList.contains('toc-open')||$('settingsModal').classList.contains('open'))return;
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
})();

function isArabicVoice(v){return /^ar([-_]|$)/i.test(v.lang)}
function isLikelyMaleVoice(v){return /male|masculine|maged|hamed|hamdan|tarik|tareq|naayf|naif|mohammed|ahmed|abdul|fahad|mansour|yousef/i.test(v.name)}
function getArabicVoice(){const selected=$('voiceSelect').value;if(selected){const exact=voices.find(v=>v.name===selected);if(exact)return exact}const arabic=voices.filter(isArabicVoice);if($('voiceGender').value==='male'){return arabic.find(isLikelyMaleVoice)||arabic.find(v=>/ar-SA|ar-AE|ar-EG/i.test(v.lang))||arabic[0]||null}return arabic[0]||null}
function speak(){if(!('speechSynthesis'in window)){ $('audioStatus').textContent='Browser ini tidak mendukung TTS. Coba Chrome Android.';return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(pages[index].text.replace(/\(٣×\)|\(٣٣×\)|×٢/g,''));u.lang='ar-SA';u.rate=Number($('speedSelect').value||.85);const v=getArabicVoice();if(v)u.voice=v;u.onstart=()=>{$('ttsBtn').textContent='Ⅱ';$('audioStatus').textContent='Sedang melantunkan teks halaman ini.'};u.onend=()=>{if(isRepeating){speak()}else{$('ttsBtn').textContent='▶';$('audioStatus').textContent='Lantunan selesai.'}};u.onerror=()=>{$('ttsBtn').textContent='▶';$('audioStatus').textContent='Suara Arab tidak tersedia atau gagal diputar di perangkat ini.'};speechSynthesis.speak(u)}
function stop(){isRepeating=false;if('speechSynthesis'in window)speechSynthesis.cancel();$('qariAudio').pause();$('ttsBtn').textContent='▶';$('audioStatus').textContent='Pemutaran dihentikan.'}
$('ttsBtn').onclick=()=>{if(audioMode==='qari'&&pages[index].surah){const a=$('qariAudio');if(a.paused)a.play().catch(()=>{$('audioStatus').textContent='Audio belum bisa diputar. Periksa koneksi internet.'});else a.pause();return}if('speechSynthesis'in window&&speechSynthesis.speaking){speechSynthesis.pause();$('ttsBtn').textContent='▶';$('audioStatus').textContent='Dijeda. Tekan putar untuk melanjutkan.'}else speak()};
$('stopBtn').onclick=stop;
function setQariTrack(){const s=pages[index],a=$('qariAudio');if(audioMode!=='qari'||!s.surah){a.style.display='none';$('audioModeLabel').textContent=audioMode==='qari'?'Audio qari tidak tersedia untuk bagian doa ini':'TTS bahasa Arab dari perangkat';$('ttsBtn').textContent='▶';return}const q=$('qariSelect').value||'Alafasy_128kbps';a.src=`https://everyayah.com/data/${q}/${s.surah}001.mp3`;a.style.display='block';$('audioModeLabel').textContent='Rekaman qari • Surah '+s.title;$('audioStatus').textContent='Audio qari memerlukan koneksi internet.'}
$('modeBtn').onclick=()=>{audioMode=audioMode==='tts'?'qari':'tts';$('modeBtn').textContent=audioMode==='tts'?'Pilih audio':'Gunakan TTS';setQariTrack();$('audioStatus').textContent=audioMode==='qari'?'Mode audio qari aktif. Untuk bagian doa, gunakan TTS.':'Mode TTS Arab aktif.'};
$('qariSelect').onchange=()=>{if(audioMode==='qari')setQariTrack()};
$('fontSize').onchange=e=>{$('arabicText').classList.toggle('compact',e.target.value==='small');$('arabicText').style.fontSize=e.target.value==='large'?'clamp(27px,3vw,36px)':''};
$('fullBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
$('contentsBtn').onclick=()=>{document.body.classList.remove('reader-active');window.scrollTo({top:0,behavior:'smooth'});$('contentsBtn').setAttribute('aria-expanded','false')};$('closeContents').onclick=()=>{document.body.classList.remove('reader-active');window.scrollTo({top:0,behavior:'smooth'});$('contentsBtn').setAttribute('aria-expanded','false')};$('settingsBtn').onclick=()=>$('settingsModal').classList.add('open');$('closeSettings').onclick=()=>$('settingsModal').classList.remove('open');$('saveSettings').onclick=()=>{$('settingsModal').classList.remove('open');if(audioMode==='qari')setQariTrack()};
function loadVoices(){voices=speechSynthesis?.getVoices?.()||[];const sel=$('voiceSelect');const old=sel.value;sel.innerHTML='<option value="">Otomatis sesuai preferensi</option>';voices.filter(isArabicVoice).forEach(v=>{const o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')';sel.appendChild(o)});if(old&&voices.some(v=>v.name===old))sel.value=old}
$('voiceGender').value=localStorage.getItem('tahlil-voice-gender')||'male';
$('voiceGender').onchange=()=>{localStorage.setItem('tahlil-voice-gender',$('voiceGender').value);$('voiceSelect').value='';$('audioStatus').textContent='Preferensi suara disimpan. Tekan putar untuk mencoba suara yang tersedia.'};
if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
document.body.classList.remove('reader-active');$('contentsBtn').setAttribute('aria-expanded','false');
// Render local content immediately so taps work even while optional surah data is loading.
buildPages();renderHome();
loadAdditionalSurahs().then(()=>{buildPages();renderHome();$('audioStatus').textContent='Surah Yasin, Ar-Rahman, dan Tahlil siap dibaca.'}).catch(error=>{$('audioStatus').textContent='Sebagian bacaan belum berhasil dimuat: '+(error?.message||'kesalahan sumber');});window.addEventListener('resize',()=>{clearTimeout(window.__tahlilResize);window.__tahlilResize=setTimeout(buildPages,180)});if(document.fonts?.ready)document.fonts.ready.then(()=>setTimeout(buildPages,50));
