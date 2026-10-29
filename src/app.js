import { sections, tahlilSections, loadAdditionalSurahs } from './data/sections.js';
import { mountAppShell } from './components/app-shell.js';

mountAppShell();

const $=id=>document.getElementById(id);
let pages=[],index=0,audioMode='tts',voices=[],isRepeating=false,sectionStarts=[];
const mobileReader=()=>window.matchMedia('(max-width: 768px)').matches;
function splitSectionForScreen(section,sectionIndex,availableHeight,width){
 const words=section.text.split(/\s+/).filter(Boolean),out=[];let chunk='';
 const probe=$('arabicText').cloneNode(false);probe.removeAttribute('id');probe.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;display:block;flex:none;min-height:0;height:auto;max-height:none;overflow:visible;width:'+width+'px;';
 document.body.appendChild(probe);
 for(const word of words){const candidate=chunk?chunk+' '+word:word;probe.textContent=candidate;if(probe.scrollHeight>availableHeight&&chunk){out.push({...section,text:chunk,sectionIndex,continuation:out.length>0});chunk=word;probe.textContent=chunk;}else chunk=candidate;}
 if(chunk)out.push({...section,text:chunk,sectionIndex,continuation:out.length>0});
 probe.remove();return out.length?out:[{...section,sectionIndex,continuation:false}];
}
function buildPages(){
 const saved=Number(localStorage.getItem('tahlil-page')||0),paper=$('paper'),text=$('arabicText');
 $('pageTitle').textContent='Mengukur halaman';text.textContent='بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
 requestAnimationFrame(()=>{
  const available=mobileReader()?Math.max(80,text.clientHeight):Math.max(180,paper.clientHeight-205);
  const width=Math.max(100,text.clientWidth);
  pages=[];sectionStarts=[];
  sections.forEach((s,si)=>{sectionStarts[si]=pages.length;pages.push(...splitSectionForScreen(s,si,available,width));});
  index=Math.min(saved,pages.length-1);showPage(index);
 });
}
const tocGroups=[
 {title:'Yasin (ayat 1 sampai selesai)',matches:s=>s.quranSurah===36},
 {title:'Ar-Rahman (ayat 1 sampai selesai)',matches:s=>s.quranSurah===55},
 {title:'Tahlil (dari awal sampai selesai)',matches:s=>!s.quranSurah}
];
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
$('contentsBtn').onclick=()=>{const open=!document.body.classList.contains('toc-open');document.body.classList.toggle('toc-open',open);$('contentsBtn').setAttribute('aria-expanded',String(open))};$('closeContents').onclick=()=>{document.body.classList.remove('toc-open');$('contentsBtn').setAttribute('aria-expanded','false')};$('settingsBtn').onclick=()=>$('settingsModal').classList.add('open');$('closeSettings').onclick=()=>$('settingsModal').classList.remove('open');$('saveSettings').onclick=()=>{$('settingsModal').classList.remove('open');if(audioMode==='qari')setQariTrack()};
function loadVoices(){voices=speechSynthesis?.getVoices?.()||[];const sel=$('voiceSelect');const old=sel.value;sel.innerHTML='<option value="">Otomatis sesuai preferensi</option>';voices.filter(isArabicVoice).forEach(v=>{const o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')';sel.appendChild(o)});if(old&&voices.some(v=>v.name===old))sel.value=old}
$('voiceGender').value=localStorage.getItem('tahlil-voice-gender')||'male';
$('voiceGender').onchange=()=>{localStorage.setItem('tahlil-voice-gender',$('voiceGender').value);$('voiceSelect').value='';$('audioStatus').textContent='Preferensi suara disimpan. Tekan putar untuk mencoba suara yang tersedia.'};
if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
document.body.classList.add('toc-open');$('contentsBtn').setAttribute('aria-expanded','true');loadAdditionalSurahs().then(()=>{buildPages();$('audioStatus').textContent='Surah Yasin, Ar-Rahman, dan Tahlil siap dibaca.'}).catch(()=>{sections.splice(0,sections.length,...tahlilSections);buildPages();$('audioStatus').textContent='Surah tambahan belum termuat. Periksa koneksi internet lalu muat ulang halaman.'});window.addEventListener('resize',()=>{clearTimeout(window.__tahlilResize);window.__tahlilResize=setTimeout(buildPages,180)});if(document.fonts?.ready)document.fonts.ready.then(()=>setTimeout(buildPages,50));
