const API = 'https://equran.id/api';
const QARIS = [
  ['01', 'Abdullah Al-Juhany'], ['02', 'Abdul Muhsin Al-Qasim'],
  ['03', 'Abdurrahman As-Sudais'], ['04', 'Ibrahim Al-Dossari'],
  ['05', 'Misyari Rasyid Al-Afasy'], ['06', 'Yasser Al-Dosari']
];

const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Layanan belum dapat diakses (' + response.status + ').');
  const json = await response.json();
  if (json.code && json.code !== 200) throw new Error(json.message || 'Data tidak tersedia.');
  if (json.status && !['success', 'sukses'].includes(String(json.status).toLowerCase())) throw new Error(json.message || 'Data tidak tersedia.');
  return json.data ?? json;
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (label, action, className = 'library-action') => {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
};

export function mountIslamicLibrary() {
  const style = el('style');
  style.textContent = `
  .islamic-library{margin:24px 0}.islamic-library h3{font-family:inherit;color:var(--green);font-size:19px;margin:0 0 5px}
  .islamic-library>p{font-size:12px;color:var(--muted);margin:0 0 13px}
  .islamic-library-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .islamic-library-card{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:104px;padding:14px;border:1px solid #d9cfb8;border-radius:14px;background:#fffaf0;color:#254534;text-align:left}
  .islamic-library-card strong{font-size:13px}.islamic-library-card small{font-size:10px;color:#857b68;line-height:1.45}
  .islamic-library-card span{font-size:20px;color:#9a7c43}
  .islamic-library-overlay{position:fixed;inset:0;z-index:9000;display:none;place-items:center;padding:12px;background:#071d1bd9}
  .islamic-library-overlay.open{display:grid}.islamic-library-dialog{width:min(100%,720px);height:min(90dvh,850px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #d5c49b;border-radius:18px;background:#fbf7ec;color:#263b2e}
  .islamic-library-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 17px;border-bottom:1px solid #ded4bd}
  .islamic-library-head h2{font-family:inherit;font-size:18px;margin:0;color:#174532}.islamic-library-close{border:0;background:transparent;color:inherit;font-size:26px;padding:0 7px}
  .islamic-library-tabs{display:flex;gap:6px;padding:10px 12px;overflow:auto;border-bottom:1px solid #e4dac5}
  .islamic-library-tabs button,.library-action{border:1px solid #d8c9a8;border-radius:9px;padding:8px 11px;background:#f0eadb;color:#34523f;font-size:11px;white-space:nowrap}
  .islamic-library-tabs button.active,.library-action.primary{background:#174a36;color:#fff7e5;border-color:#9a7a40}
  .islamic-library-content{padding:14px;overflow:auto;overscroll-behavior:contain;flex:1}
  .library-row{padding:12px 0;border-bottom:1px solid #e4dac5}.library-row h3{font-size:14px;margin:0 0 5px;color:#174532}
  .library-row p{font-size:12px;line-height:1.65;margin:7px 0;color:#5d594e;white-space:pre-wrap}
  .library-arabic{font-family:'Amiri',serif!important;font-size:24px!important;line-height:2!important;text-align:right;color:#203e2c!important}
  .library-muted{font-size:11px;color:#8b806c}.library-search{width:100%;padding:11px;border:1px solid #d8c9a8;border-radius:10px;background:white;color:#263b2e;margin-bottom:10px}
  .library-player{width:100%;margin-top:10px}.library-result{padding:12px;border:1px solid #ded4bd;border-radius:12px;margin:9px 0;background:#fffaf0}
  .library-result small{color:#887b64}.library-loading,.library-error{padding:16px;text-align:center;font-size:12px;color:#756b59}
  body.theme-dark .islamic-library-card{background:#202e25;border-color:#465a49;color:#eee4d0}
  body.theme-dark .islamic-library-card small{color:#c0b69f}
  body.theme-dark .islamic-library-dialog{background:#1d3026;color:#eee4d0;border-color:#6e795b}
  body.theme-dark .islamic-library-head h2{color:#f4e5bd}
  body.theme-dark .islamic-library-tabs,.theme-dark .library-row{border-color:#465a49}
  body.theme-dark .islamic-library-tabs button,body.theme-dark .library-action{background:#304337;color:#eee4d0;border-color:#60745f}
  body.theme-dark .islamic-library-tabs button.active,body.theme-dark .library-action.primary{background:#d7bd80;color:#183b2c}
  body.theme-dark .library-row h3{color:#f4e5bd}body.theme-dark .library-row p{color:#e1d7c2}
  body.theme-dark .library-result{background:#26382d;border-color:#52634f}
  @media(max-width:420px){.islamic-library-grid{gap:7px}.islamic-library-card{padding:11px;min-height:100px}}
  `;
  document.head.append(style);

  const section = el('section', 'islamic-library');
  section.append(el('h3', '', 'Koleksi Islami'), el('p', '', 'Jelajahi bacaan, tilawah, tafsir, dan pencarian makna Al-Qur’an.'));
  const grid = el('div', 'islamic-library-grid');
  const overlay = el('div', 'islamic-library-overlay');
  const dialog = el('section', 'islamic-library-dialog');
  dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
  const head = el('div', 'islamic-library-head');
  const heading = el('h2', '', 'Koleksi Islami');
  const close = button('×', () => overlay.classList.remove('open'), 'islamic-library-close');
  close.setAttribute('aria-label', 'Tutup koleksi');
  head.append(heading, close);
  const tabs = el('nav', 'islamic-library-tabs');
  const content = el('div', 'islamic-library-content');
  dialog.append(head, tabs, content); overlay.append(dialog);
  document.body.append(overlay);
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.classList.remove('open'); });

  const showError = error => { content.replaceChildren(el('p', 'library-error', error?.message || 'Terjadi kesalahan. Silakan coba lagi.')); };
  const loading = () => content.replaceChildren(el('p', 'library-loading', 'Memuat data…'));
  const addTabs = active => {
    tabs.replaceChildren();
    [['doa','Doa & Dzikir'],['quran','Al-Qur’an'],['tafsir','Tafsir'],['search','Pencarian AI']].forEach(([key,label]) => {
      const tab = button(label, () => openTab(key), key === active ? 'active' : '');
      if (key === active) tab.classList.add('active');
      tabs.append(tab);
    });
  };
  const open = (title, key) => { heading.textContent = title; overlay.classList.add('open'); addTabs(key); };
  async function openTab(key) {
    const titles = {doa:'Doa & Dzikir',quran:'Al-Qur’an Digital',tafsir:'Tafsir Al-Qur’an',search:'Pencarian AI'};
    open(titles[key], key); loading();
    try {
      if (key === 'doa') await renderDoa();
      if (key === 'quran') await renderQuran();
      if (key === 'tafsir') await renderTafsir();
      if (key === 'search') renderSearch();
    } catch (error) { showError(error); }
  }
  async function renderDoa() {
    const items = await request(API + '/doa');
    content.replaceChildren();
    const search = el('input','library-search'); search.placeholder = 'Cari nama doa, kategori, atau tag…'; search.setAttribute('aria-label','Cari doa');
    const list = el('div');
    const draw = () => {
      const q = search.value.trim().toLocaleLowerCase('id');
      list.replaceChildren();
      items.filter(item => [item.nama,item.grup,item.idn,item.tr,...(item.tag||[])].join(' ').toLocaleLowerCase('id').includes(q)).forEach(item => {
        const row=el('article','library-row'); row.append(el('h3','',item.nama||'Doa & Dzikir'),el('p','library-arabic',item.ar||''),el('p','',item.tr||''),el('p','',item.idn||''),el('small','library-muted',[item.grup,item.tentang].filter(Boolean).join(' · ')));
        list.append(row);
      });
      if (!list.childElementCount) list.append(el('p','library-muted','Tidak ada doa yang cocok.'));
    };
    search.addEventListener('input',draw); content.append(search,list); draw();
  }
  async function renderQuran() {
    const surahs = await request(API + '/v2/surat');
    content.replaceChildren();
    const search=el('input','library-search');search.placeholder='Cari nama atau nomor surah…';search.setAttribute('aria-label','Cari surah');
    const list=el('div');
    const draw=()=>{const q=search.value.trim().toLocaleLowerCase('id');list.replaceChildren();
      surahs.filter(s=>String(s.nomor).includes(q)||String(s.namaLatin||'').toLocaleLowerCase('id').includes(q)||String(s.arti||'').toLocaleLowerCase('id').includes(q)).forEach(s=>{
        const row=el('article','library-row');row.append(el('h3','',s.nomor+'. '+s.namaLatin+' · '+s.arti),el('small','library-muted',(s.tempatTurun||'')+' · '+s.jumlahAyat+' ayat'),button('Buka surah',()=>showSurah(s.nomor),'library-action'));list.append(row);
      });
    };search.addEventListener('input',draw);content.append(search,list);draw();
  }
  async function showSurah(number) {
    loading();
    try {
      const surat=await request(API+'/v2/surat/'+number);content.replaceChildren();
      const title=el('h3','',surat.namaLatin+' · '+surat.nama);
      const select=el('select','library-search');select.setAttribute('aria-label','Pilih qari');
      QARIS.forEach(([id,name])=>{const option=el('option','',name);option.value=id;select.append(option);});
      const audio=el('audio','library-player');audio.controls=true;
      const play=()=>{const url=surat.audioFull?.[select.value];if(url){audio.src=url;audio.play().catch(()=>{});}};
      const playButton=button('Putar satu surah',play,'library-action primary');
      select.addEventListener('change',()=>{audio.pause();audio.removeAttribute('src');});
      const list=el('div');
      list.append(el('p','library-muted',surat.tempatTurun+' · '+surat.jumlahAyat+' ayat'),select,playButton,audio);
      (surat.ayat||[]).forEach(ayat=>{
        const row=el('article','library-row');row.append(el('small','library-muted',surat.namaLatin+' · Ayat '+ayat.nomorAyat),el('p','library-arabic',ayat.teksArab||''),el('p','',ayat.teksLatin||''),el('p','',ayat.teksIndonesia||''));
        const verseAudio=button('Putar ayat',()=>{const url=ayat.audio?.[select.value];if(url){audio.src=url;audio.play().catch(()=>{});}},'library-action');row.append(verseAudio);list.append(row);
      });
      content.append(title,list);
    } catch(error){showError(error);}
  }
  async function renderTafsir() {
    const surahs=await request(API+'/v2/surat');content.replaceChildren();
    const search=el('input','library-search');search.placeholder='Cari surah untuk melihat tafsir…';search.setAttribute('aria-label','Cari surah tafsir');
    const list=el('div');const draw=()=>{const q=search.value.toLocaleLowerCase('id');list.replaceChildren();
      surahs.filter(s=>String(s.nomor).includes(q)||String(s.namaLatin).toLocaleLowerCase('id').includes(q)).forEach(s=>{const row=el('article','library-row');row.append(el('h3','',s.nomor+'. '+s.namaLatin),button('Buka tafsir',()=>showTafsir(s.nomor),'library-action'));list.append(row);});
    };search.addEventListener('input',draw);content.append(search,list);draw();
  }
  async function showTafsir(number) {
    loading();try{const result=await request(API+'/v2/tafsir/'+number);content.replaceChildren();
      const title=el('h3','',result.namaLatin||'Tafsir surah '+number);content.append(title);
      (result.tafsir||[]).forEach(item=>{const row=el('article','library-row');row.append(el('h3','',item.ayat?'Ayat '+item.ayat:'Tafsir'),el('p','',item.teks||item.tafsir||''));content.append(row);});
      if(!result.tafsir?.length)content.append(el('p','library-muted','Format tafsir dari layanan belum dikenali.'));
    }catch(error){showError(error);}
  }
  function renderSearch() {
    content.replaceChildren();
    const input=el('input','library-search');input.placeholder='Contoh: ayat tentang sabar menghadapi cobaan';input.setAttribute('aria-label','Pertanyaan pencarian Al-Qur’an');
    const submit=button('Cari berdasarkan makna',runSearch,'library-action primary');
    const results=el('div');content.append(el('p','library-muted','Pencarian semantik memahami konteks pertanyaan. Hasil tetap berupa rujukan ayat, tafsir, surah, atau doa dari EQuran.'),input,submit,results);
    async function runSearch(){if(!input.value.trim())return;results.replaceChildren(el('p','library-loading','Mencari…'));submit.disabled=true;
      try{const data=await request(API+'/vector',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cari:input.value.trim(),batas:8,skorMin:0.45})});
        results.replaceChildren();
        (data.hasil||[]).forEach(hit=>{const item=hit.data||{};const row=el('article','library-result');row.append(el('small','',String(hit.tipe||'Rujukan')+' · relevansi '+String(hit.relevansi||'')));
          row.append(el('h3','',item.namaLatin||item.nama||item.surah||item.judul||'Hasil pencarian'));
          row.append(el('p','library-arabic',item.teksArab||item.ar||''),el('p','',item.teksIndonesia||item.idn||item.terjemahan||item.teks||''));results.append(row);
        });
        if(!data.hasil?.length)results.append(el('p','library-muted','Belum ada hasil yang sesuai. Coba pertanyaan lain.'));
      }catch(error){results.replaceChildren(el('p','library-error',error.message));}finally{submit.disabled=false;}
    }
  }
  const cards = [
    ['۞','Doa & Dzikir','Arab, Latin, arti, kategori, dan referensi','doa'],
    ['﷽','Al-Qur’an Digital','114 surah beserta ayat dan terjemahan','quran'],
    ['♫','Audio Murattal','Enam qari, audio surah dan per ayat','quran'],
    ['۩','Tafsir','Pelajari penjelasan ayat Al-Qur’an','tafsir'],
    ['⌕','Pencarian AI','Temukan rujukan berdasarkan makna','search']
  ];
  cards.forEach(([icon,title,description,key])=>{
    const card=button('',()=>openTab(key),'islamic-library-card');
    card.append(el('span','',icon),el('strong','',title),el('small','',description));grid.append(card);
  });
  section.append(grid);
  const home = document.getElementById('homePage');
  const index = home?.querySelector('.home-index');
  if(index) index.before(section);
  else home?.append(section);
}
