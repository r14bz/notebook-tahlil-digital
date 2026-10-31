import { readPreference } from '../../services/storage/preferences.js';
import { filterReadingSections } from './search.js';

/** Merender indeks bacaan dan pencarian di halaman beranda. */
export function renderReadingList({ sections, pages, $, activateReader }) {
 const saved=Number(readPreference('page', '0')||0);
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
  const entries=filterReadingSections(sections,query,group.filter);
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
