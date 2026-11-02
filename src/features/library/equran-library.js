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

  .equran-kitab-list{display:grid;gap:2px}
  .equran-kitab-arabic{font-size:28px!important;line-height:2.15!important;text-align:justify!important;margin:16px 0 24px!important}
  .equran-kitab-latin,.equran-kitab-indonesia{font-size:14px!important;line-height:2!important;white-space:pre-wrap}
  .equran-kitab-latin{color:#82745e!important;font-style:italic}
  .equran-kitab-indonesia{color:#374b3c!important}
  body.theme-dark .equran-kitab-indonesia{color:#eee4d0!important}
  body.theme-dark .equran-kitab-latin{color:#c0b69f!important}
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
    showReader(kind === 'tafsir' ? 'Tafsir Al-Qur’an' : 'Al-Qur’an & Murattal', kind === 'tafsir' ? 'Penjelasan ayat dari EQuran.id' : '114 surah, teks Arab, Latin, terjemahan, dan audio');
    loading();
    try {
      const surahs = await request(API + '/v2/surat');
      paper.replaceChildren(
        el('h2', '', kind === 'tafsir' ? 'Pilih Surah untuk Tafsir' : 'Daftar Surah Al-Qur’an'),
        el('p', 'equran-paper-intro', kind === 'tafsir' ? 'Pilih surah untuk membaca penjelasan tafsir.' : 'Pilih surah untuk membaca ayat dan mendengarkan murattal.')
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
    showReader('Al-Qur’an & Murattal', 'Surah dan ayat dari EQuran.id');
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
      const options = el('div', 'equran-display-options');
      const latinLabel = el('label', 'equran-toggle');
      const latinToggle = el('input');
      latinToggle.type = 'checkbox';
      latinToggle.checked = true;
      latinLabel.append(latinToggle, el('span', '', 'Latin'));
      const translationLabel = el('label', 'equran-toggle');
      const translationToggle = el('input');
      translationToggle.type = 'checkbox';
      translationToggle.checked = true;
      translationLabel.append(translationToggle, el('span', '', 'Terjemahan'));
      options.append(latinLabel, translationLabel);
      tools.append(select, playFull, options);
      paper.append(tools, audio);
      const verses = el('div', 'equran-verses');
      (surat.ayat || []).forEach(ayat => {
        const entry = row('Ayat ' + ayat.nomorAyat, '');
        entry.append(el('p', 'equran-arabic', ayat.teksArab || ''));
        const latin = el('p', 'equran-latin', ayat.teksLatin || '');
        const translation = el('p', 'equran-translation', ayat.teksIndonesia || '');
        latin.hidden = !latinToggle.checked;
        translation.hidden = !translationToggle.checked;
        entry.append(latin, translation);
        verses.append(entry);
      });
      const updateTextVisibility = () => {
        verses.querySelectorAll('.equran-latin').forEach(node => node.hidden = !latinToggle.checked);
        verses.querySelectorAll('.equran-translation').forEach(node => node.hidden = !translationToggle.checked);
      };
      latinToggle.addEventListener('change', updateTextVisibility);
      translationToggle.addEventListener('change', updateTextVisibility);
      paper.append(verses);
      const returnList = action('← Kembali ke daftar surah', () => loadSurahs('quran'), 'equran-back');
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

  const KITAB_PROXY = '/api/kitab';
  const pickArray = value => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    for (const key of ['kitab', 'kitabs', 'daftar_kitab', 'books', 'items', 'results', 'bab', 'daftar_bab', 'chapters', 'data', 'list']) {
      if (Array.isArray(value[key])) return value[key];
    }
    return [];
  };
  const unwrap = value => value?.data ?? value?.result ?? value;
  const firstText = (item, keys, fallback = '') => {
    for (const key of keys) {
      const value = item?.[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value);
    }
    return fallback;
  };
  async function kitabRequest(params) {
    const query = new URLSearchParams(params);
    const response = await fetch(KITAB_PROXY + '?' + query.toString(), { headers: { Accept: 'application/json' } });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status === 'error' || json.success === false) {
      throw new Error(json.message || json.detail || 'Layanan kitab belum dapat diakses (' + response.status + ').');
    }
    return unwrap(json);
  }
  function kitabName(item) {
    return firstText(item, ['nama', 'nama_kitab', 'judul', 'title', 'name'], 'Kitab tanpa judul');
  }
  function kitabSlug(item) {
    return firstText(item, ['slug', 'kode', 'id_slug']);
  }
  function openArbain() {
    openKitabCatalog('arbain');
  }
  async function openKitabCatalog(searchTerm = '') {
    showReader('Perpustakaan Kitab', 'Koleksi kitab dari Ahmad Sanusi Open API');
    loading();
    try {
      const payload = await kitabRequest({ action: 'list' });
      const books = pickArray(payload);
      if (!books.length) throw new Error('API berhasil merespons, tetapi daftar kitab belum dikenali. Format respons perlu diperiksa.');
      paper.replaceChildren(
        el('h2', '', 'مكتبة الكتب'),
        el('p', 'equran-paper-intro', 'Pilih kitab untuk melihat daftar bab dan membaca teks Arab beserta terjemahan Indonesia.')
      );
      const search = searchInput('Cari judul kitab, misalnya Arba’in Nawawi…', 'Cari kitab');
      const list = el('div', 'equran-kitab-list');
      const draw = () => {
        const q = search.value.trim().toLocaleLowerCase('id');
        list.replaceChildren();
        const filtered = books.filter(book => [kitabName(book), kitabSlug(book), book.kategori, book.pengarang, book.penulis].filter(Boolean).join(' ').toLocaleLowerCase('id').includes(q));
        filtered.forEach(book => {
          const slug = kitabSlug(book);
          const title = kitabName(book);
          const entry = row(title, [firstText(book, ['pengarang', 'penulis', 'author']), firstText(book, ['kategori', 'category']), firstText(book, ['jumlah_bab', 'total_bab', 'total'], '')].filter(Boolean).join(' · '));
          entry.append(action('Buka kitab', () => openKitab(slug, title), 'equran-action primary'));
          list.append(entry);
        });
        if (!filtered.length) list.append(el('p', 'equran-muted', 'Kitab tidak ditemukan. Coba kata kunci lain.'));
      };
      search.addEventListener('input', draw);
      paper.append(search, list);
      if (searchTerm) search.value = searchTerm === 'arbain' ? 'Arba' : searchTerm;
      draw();
      if (searchTerm === 'arbain' && !books.some(book => /arba.?in|arbain|nawawi/i.test(kitabName(book) + ' ' + kitabSlug(book)))) {
        search.value = '';
        draw();
        const note = el('p', 'equran-muted', 'Arba’in Nawawi tidak ditemukan dengan nama yang dikenali. Silakan gunakan pencarian untuk memeriksa variasi nama kitab pada katalog.');
        paper.insertBefore(note, search);
      }
    } catch (error) { showError(error); }
  }
  async function openKitab(slug, title) {
    if (!slug) { showError(new Error('Identitas kitab dari API tidak tersedia.')); return; }
    showReader(title, 'Daftar bab · Ahmad Sanusi Open API');
    loading();
    try {
      const payload = await kitabRequest({ action: 'detail', slug, page: '1', limit: '100' });
      const detail = payload && typeof payload === 'object' ? payload : {};
      const chapters = pickArray(detail);
      paper.replaceChildren(
        el('h2', '', title),
        el('p', 'equran-paper-intro', firstText(detail, ['deskripsi', 'keterangan', 'tentang'], 'Pilih bab untuk membaca teks kitab.'))
      );
      const list = el('div', 'equran-kitab-list');
      const appendChapters = (items, offset = 0) => {
        items.forEach((chapter, index) => {
          const number = firstText(chapter, ['nomor', 'nomor_bab', 'no', 'urutan', 'bab', 'id'], String(offset + index + 1));
          const chapterTitle = firstText(chapter, ['judul', 'nama_bab', 'nama', 'title', 'judul_bab'], 'Bab ' + number);
          const entry = row(chapterTitle, firstText(chapter, ['deskripsi', 'keterangan', 'ringkasan']));
          entry.append(action('Baca bab', () => openKitabChapter(slug, number, chapterTitle, title), 'equran-action primary'));
          list.append(entry);
        });
      };
      appendChapters(chapters);
      if (!chapters.length) {
        list.append(el('p', 'equran-muted', 'Daftar bab belum dikenali dari respons detail kitab.'));
      }
      const currentPage = Number(detail.page || 1);
      const pageLimit = Number(detail.limit || 100);
      const totalChapters = Number(detail.total || chapters.length);
      const pagination = el('div', 'equran-kitab-pagination');
      if (currentPage * pageLimit < totalChapters) {
        const more = action('Muat bab berikutnya', async () => {
          more.disabled = true;
          more.textContent = 'Memuat…';
          try {
            const next = await kitabRequest({ action: 'detail', slug, page: String(currentPage + 1), limit: String(pageLimit) });
            const nextChapters = pickArray(next);
            appendChapters(nextChapters, chapters.length);
            if (!nextChapters.length || (Number(next.page || currentPage + 1) * pageLimit >= Number(next.total || totalChapters))) {
              pagination.remove();
            } else {
              more.disabled = false;
              more.textContent = 'Muat bab berikutnya';
            }
          } catch (error) {
            more.disabled = false;
            more.textContent = 'Coba muat lagi';
            const message = el('p', 'equran-error', error.message);
            pagination.append(message);
          }
        }, 'equran-action');
        pagination.append(more);
      }
      paper.append(list, pagination, action('← Kembali ke semua kitab', () => openKitabCatalog(), 'equran-back'));
    } catch (error) { showError(error); }
  }
  async function openKitabChapter(slug, number, chapterTitle, bookTitle) {
    showReader(chapterTitle, bookTitle + ' · Bab ' + number);
    loading();
    try {
      const payload = await kitabRequest({ action: 'chapter', slug, nomor: number });
      const chapter = payload && typeof payload === 'object' ? payload : {};
      paper.replaceChildren(el('h2', '', chapterTitle));
      const arabic = firstText(chapter, ['teks_arab', 'arab', 'teks', 'naskah_arab']);
      const indonesia = firstText(chapter, ['teks_indonesia', 'terjemahan', 'indonesia', 'terjemah']);
      const latin = firstText(chapter, ['teks_latin', 'latin', 'transliterasi']);
      if (arabic) paper.append(el('p', 'equran-arabic equran-kitab-arabic', arabic));
      if (latin) paper.append(el('p', 'equran-kitab-latin', latin));
      if (indonesia) paper.append(el('p', 'equran-kitab-indonesia', indonesia));
      if (!arabic && !indonesia && !latin) {
        const textValue = firstText(chapter, ['isi', 'konten', 'content', 'body']);
        if (textValue) paper.append(el('p', 'equran-kitab-indonesia', textValue));
        else paper.append(el('p', 'equran-muted', 'Isi bab diterima, tetapi nama field teks belum dikenali. Respons API perlu dicocokkan.'));
      }
      const source = firstText(chapter, ['sumber', 'referensi', 'reference']);
      if (source) paper.append(el('p', 'equran-muted', 'Referensi: ' + source));
      paper.append(
        action('← Kembali ke daftar bab', () => openKitab(slug, bookTitle), 'equran-back'),
        action('← Semua kitab', () => openKitabCatalog(), 'equran-back')
      );
    } catch (error) { showError(error); }
  }

  const cards = [
    ['05 / DOA & ZIKIR', 'Doa & Dzikir', 'Lafaz Arab, Latin, arti, dan kategori', openDoa],
    ['06 / AL-QUR’AN', 'Al-Qur’an & Murattal', 'Baca ayat dan dengarkan satu surah penuh', () => loadSurahs('quran')],
    ['07 / KITAB', 'Perpustakaan Kitab', 'Arba’in Nawawi dan koleksi kitab klasik lainnya', openArbain],
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
