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
const action = (label, handler, className = 'equran-action') => {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
};

export function mountIslamicLibrary() {
  const style = el('style');
  style.textContent = `
  .equran-reader{display:none;max-width:980px;margin:0 auto;padding:22px 18px 36px;min-height:65vh}
  body.equran-reader-active .equran-reader{display:block}
  body.equran-reader-active #homePage,body.equran-reader-active #readerMain,body.equran-reader-active #readerFooter{display:none!important}
  .equran-reader-top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .equran-back{flex:0 0 auto;border:1px solid #d6c9ad;border-radius:11px;background:#f4eddd;color:#234b37;padding:10px 13px;font-family:inherit;font-weight:600;font-size:12px}
  .equran-reader-heading{min-width:0}.equran-reader-heading strong{display:block;color:var(--green);font-size:17px}.equran-reader-heading small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
  .equran-paper{min-height:55vh;padding:clamp(18px,4vw,34px);border:1px solid #ded3ba;border-radius:20px;background:#fffaf0;box-shadow:0 10px 30px #46371b0b;color:#263b2e}
  .equran-paper h2{margin:0 0 8px;color:#174532;font:700 24px 'Amiri',serif}
  .equran-paper-intro{margin:0 0 18px;color:#827865;font-size:12px;line-height:1.6}
  .equran-tools{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 15px}
  .equran-search{width:100%;min-height:42px;padding:10px 12px;border:1px solid #d8c9a8;border-radius:10px;background:#fff;color:#263b2e;font:inherit;font-size:12px}
  .equran-row{padding:15px 0;border-bottom:1px solid #e4dac5}
  .equran-row:last-child{border-bottom:0}
  .equran-row h3{margin:0 0 6px;color:#174532;font-size:14px}
  .equran-row p{margin:8px 0;color:#5d594e;font-size:12px;line-height:1.8;white-space:pre-wrap}
  .equran-arabic{font-family:'Amiri',serif!important;font-size:25px!important;line-height:2!important;text-align:right;color:#203e2c!important}
  .equran-muted{color:#8b806c;font-size:11px;line-height:1.6}
  .equran-action{border:1px solid #d8c9a8;border-radius:9px;padding:9px 12px;background:#f0eadb;color:#34523f;font-size:11px;white-space:nowrap}
  .equran-action.primary{background:#174a36;color:#fff7e5;border-color:#9a7a40}
  .equran-player{width:100%;margin:10px 0}
  .equran-loading,.equran-error{padding:20px;text-align:center;color:#756b59;font-size:12px}
  body.theme-dark .equran-back,body.theme-dark .equran-action{background:#304337;color:#eee4d0;border-color:#60745f}
  body.theme-dark .equran-paper{background:#1d3026;color:#eee4d0;border-color:#52634f}
  body.theme-dark .equran-paper h2,body.theme-dark .equran-row h3{color:#f4e5bd}
  body.theme-dark .equran-row{border-color:#465a49}
  body.theme-dark .equran-row p{color:#e1d7c2}
  body.theme-dark .equran-arabic{color:#f1eadb!important}
  body.theme-dark .equran-search{background:#26382d;color:#eee4d0;border-color:#52634f}
  body.theme-dark .equran-muted{color:#c0b69f}
  @media(max-width:480px){.equran-reader{padding:14px 12px 28px}.equran-paper{padding:17px 14px;border-radius:15px}.equran-paper h2{font-size:21px}.equran-arabic{font-size:23px!important}}
  `;
  document.head.append(style);

  const home = document.getElementById('homePage');
  const grid = home?.querySelector('.collection-grid');
  if (!home || !grid) return;

  const reader = el('section', 'equran-reader');
  reader.setAttribute('aria-live', 'polite');
  const top = el('div', 'equran-reader-top');
  const back = action('← Beranda', closeReader, 'equran-back');
  const headingWrap = el('div', 'equran-reader-heading');
  const heading = el('strong', '', 'Koleksi Islami');
  const subheading = el('small', '', 'Bacaan dari EQuran.id');
  headingWrap.append(heading, subheading);
  top.append(back, headingWrap);
  const paper = el('article', 'equran-paper');
  reader.append(top, paper);
  home.after(reader);

  function closeReader() {
    document.body.classList.remove('equran-reader-active');
    paper.replaceChildren();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showReader(title, subtitle = 'Koleksi dari EQuran.id') {
    heading.textContent = title;
    subheading.textContent = subtitle;
    paper.replaceChildren();
    document.body.classList.add('equran-reader-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function loading() { paper.replaceChildren(el('p', 'equran-loading', 'Memuat data…')); }
  function showError(error) { paper.replaceChildren(el('p', 'equran-error', error?.message || 'Terjadi kesalahan. Silakan coba lagi.')); }
  function searchInput(placeholder, label) {
    const input = el('input', 'equran-search');
    input.type = 'search';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', label);
    return input;
  }
  function row(title, description) {
    const node = el('article', 'equran-row');
    if (title) node.append(el('h3', '', title));
    if (description) node.append(el('p', 'equran-muted', description));
    return node;
  }

  async function openDoa() {
    showReader('Doa & Dzikir', 'Arab, Latin, arti, kategori, dan referensi');
    loading();
    try {
      const items = await request(API + '/doa');
      paper.replaceChildren(el('h2', '', 'Kumpulan Doa & Dzikir'), el('p', 'equran-paper-intro', 'Pilih dan baca doa beserta lafaz Arab, transliterasi, dan artinya.'));
      const search = searchInput('Cari nama doa, kategori, atau tag…', 'Cari doa');
      const list = el('div', '');
      const draw = () => {
        const q = search.value.trim().toLocaleLowerCase('id');
        list.replaceChildren();
        items.filter(item => [item.nama, item.grup, item.idn, item.tr, ...(item.tag || [])].join(' ').toLocaleLowerCase('id').includes(q)).forEach(item => {
          const entry = row(item.nama || 'Doa & Dzikir', [item.grup, item.tentang].filter(Boolean).join(' · '));
          entry.append(el('p', 'equran-arabic', item.ar || ''));
          if (item.tr) entry.append(el('p', '', item.tr));
          if (item.idn) entry.append(el('p', '', item.idn));
          list.append(entry);
        });
        if (!list.childElementCount) list.append(el('p', 'equran-muted', 'Tidak ada doa yang cocok.'));
      };
      search.addEventListener('input', draw);
      paper.append(search, list);
      draw();
    } catch (error) { showError(error); }
  }

  async function loadSurahs(kind) {
    showReader(kind === 'tafsir' ? 'Tafsir Al-Qur’an' : kind === 'audio' ? 'Audio Murattal' : 'Al-Qur’an Digital', kind === 'tafsir' ? 'Penjelasan ayat dari EQuran.id' : '114 surah, terjemahan, dan audio murattal');
    loading();
    try {
      const surahs = await request(API + '/v2/surat');
      paper.replaceChildren(
        el('h2', '', kind === 'tafsir' ? 'Pilih Surah untuk Tafsir' : 'Daftar Surah Al-Qur’an'),
        el('p', 'equran-paper-intro', kind === 'tafsir' ? 'Pilih surah untuk membaca penjelasan tafsir.' : 'Pilih surah untuk membaca ayat, terjemahan, dan mendengarkan murattal.')
      );
      const search = searchInput('Cari nama atau nomor surah…', 'Cari surah');
      const list = el('div', '');
      const draw = () => {
        const q = search.value.trim().toLocaleLowerCase('id');
        list.replaceChildren();
        surahs.filter(s => String(s.nomor).includes(q) || String(s.namaLatin || '').toLocaleLowerCase('id').includes(q) || String(s.arti || '').toLocaleLowerCase('id').includes(q)).forEach(s => {
          const entry = row(s.nomor + '. ' + s.namaLatin + ' · ' + s.arti, (s.tempatTurun || '') + ' · ' + s.jumlahAyat + ' ayat');
          entry.append(action(kind === 'tafsir' ? 'Baca tafsir' : 'Buka surah', () => kind === 'tafsir' ? showTafsir(s.nomor) : showSurah(s.nomor, kind === 'audio'), 'equran-action primary'));
          list.append(entry);
        });
      };
      search.addEventListener('input', draw);
      paper.append(search, list);
      draw();
    } catch (error) { showError(error); }
  }

  async function showSurah(number, fromAudioCard = false) {
    showReader(fromAudioCard ? 'Audio Murattal' : 'Al-Qur’an Digital', 'Surah dan ayat dari EQuran.id');
    loading();
    try {
      const surat = await request(API + '/v2/surat/' + number);
      paper.replaceChildren(
        el('h2', '', surat.namaLatin + ' · ' + surat.nama),
        el('p', 'equran-muted', surat.tempatTurun + ' · ' + surat.jumlahAyat + ' ayat')
      );
      const tools = el('div', 'equran-tools');
      const select = el('select', 'equran-search');
      select.setAttribute('aria-label', 'Pilih qari');
      QARIS.forEach(([id, name]) => {
        const option = el('option', '', name);
        option.value = id;
        select.append(option);
      });
      const audio = el('audio', 'equran-player');
      audio.controls = true;
      audio.preload = 'none';
      const playFull = action('▶ Putar satu surah', () => {
        const url = surat.audioFull?.[select.value];
        if (url) { audio.src = url; audio.play().catch(() => {}); }
      }, 'equran-action primary');
      tools.append(select, playFull);
      paper.append(tools, audio);
      (surat.ayat || []).forEach(ayat => {
        const entry = row('Ayat ' + ayat.nomorAyat, '');
        entry.append(el('p', 'equran-arabic', ayat.teksArab || ''));
        if (ayat.teksLatin) entry.append(el('p', '', ayat.teksLatin));
        if (ayat.teksIndonesia) entry.append(el('p', '', ayat.teksIndonesia));
        entry.append(action('▶ Putar ayat', () => {
          const url = ayat.audio?.[select.value];
          if (url) { audio.src = url; audio.play().catch(() => {}); }
        }, 'equran-action'));
        paper.append(entry);
      });
      const returnList = action('← Kembali ke daftar surah', () => loadSurahs(fromAudioCard ? 'audio' : 'quran'), 'equran-back');
      paper.append(returnList);
    } catch (error) { showError(error); }
  }

  async function showTafsir(number) {
    showReader('Tafsir Al-Qur’an', 'Penjelasan ayat per surah');
    loading();
    try {
      const result = await request(API + '/v2/tafsir/' + number);
      paper.replaceChildren(el('h2', '', result.namaLatin || 'Tafsir Surah ' + number));
      (result.tafsir || []).forEach(item => {
        const entry = row(item.ayat ? 'Ayat ' + item.ayat : 'Tafsir', '');
        entry.append(el('p', '', item.teks || item.tafsir || ''));
        paper.append(entry);
      });
      if (!result.tafsir?.length) paper.append(el('p', 'equran-muted', 'Format tafsir dari layanan belum dikenali.'));
      paper.append(action('← Kembali ke daftar surah', () => loadSurahs('tafsir'), 'equran-back'));
    } catch (error) { showError(error); }
  }

  const cards = [
    ['05 / DOA & ZIKIR', 'Doa & Dzikir', 'Lafaz Arab, Latin, arti, dan kategori', openDoa],
    ['06 / AL-QUR’AN', 'Al-Qur’an Digital', 'Baca 114 surah beserta terjemahan ayat', () => loadSurahs('quran')],
    ['07 / MURATTAL', 'Audio Murattal', 'Dengarkan tilawah dari enam pilihan qari', () => loadSurahs('audio')],
    ['08 / TAFSIR', 'Tafsir Al-Qur’an', 'Baca penjelasan ayat dan kandungan surah', () => loadSurahs('tafsir')]
  ];
  cards.forEach(([index, title, description, open]) => {
    const card = el('button', 'collection-card collection-equran');
    card.type = 'button';
    card.append(
      el('span', 'card-index', index),
      Object.assign(el('span', 'collection-symbol'), { innerHTML: '<img src="/assets/collection-icon.webp" alt="">' }),
      el('span', 'collection-title', title),
      el('span', 'collection-desc', description),
      Object.assign(el('span', 'collection-bottom'), { innerHTML: '<span class="collection-meta">Koleksi e-Moeslife</span><span class="round-arrow">↗</span>' })
    );
    card.addEventListener('click', open);
    grid.append(card);
  });
  const count = home.querySelector('.section-count');
  if (count) count.textContent = '08 KOLEKSI';
}
