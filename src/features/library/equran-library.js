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
  .equran-arabic{font-family:'Amiri',serif!important;font-size:25px!important;line-height:2!important;direction:rtl!important;unicode-bidi:plaintext;text-align:right!important;color:#203e2c!important}
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

  .safinah-editor{display:grid;gap:14px}
  .safinah-editor-toolbar{display:flex;gap:8px;flex-wrap:wrap}
  .safinah-editor-toolbar .equran-action{flex:1 1 130px}
  .safinah-editor-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
  .safinah-chapter-list{display:grid;gap:7px}
  .safinah-chapter-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:9px;border:1px solid #ded3ba;border-radius:12px;background:#fffdf7}
  .safinah-chapter-item.active{border-color:#bd9854;background:#f5efdf}
  .safinah-chapter-item button{min-width:0;white-space:normal;text-align:left}
  .safinah-chapter-actions{display:flex;gap:4px}
  .safinah-field{display:grid;gap:6px}
  .safinah-field label{font-size:11px;font-weight:700;color:#6f624b}
  .safinah-field input,.safinah-field textarea{width:100%;min-width:0;border:1px solid #d8c9a8;border-radius:11px;padding:12px;background:#fff;color:#263b2e;font:inherit;font-size:14px}
  .safinah-field textarea{min-height:150px;resize:vertical;line-height:1.8}
  .safinah-field textarea.arabic{font-family:'Amiri','Noto Naskh Arabic',serif;font-size:25px;line-height:2;text-align:right;direction:rtl}
  .safinah-editor-status{padding:10px 12px;border-radius:10px;background:#edf2e8;color:#31513b;font-size:11px;line-height:1.6}
  .safinah-empty{padding:18px;text-align:center;border:1px dashed #c9b991;border-radius:12px;color:#81765f;font-size:12px}
  body.theme-dark .safinah-chapter-item{background:#26382d;border-color:#52634f}
  body.theme-dark .safinah-chapter-item.active{background:#354635;border-color:#bd9854}
  body.theme-dark .safinah-field label{color:#d6c9a8}
  body.theme-dark .safinah-field input,body.theme-dark .safinah-field textarea{background:#26382d;color:#eee4d0;border-color:#52634f}
  body.theme-dark .safinah-editor-status{background:#263d2e;color:#dcebd8}
  @media(min-width:700px){.safinah-editor-layout{grid-template-columns:minmax(220px,.8fr) minmax(0,1.5fr)}} 
  .equran-kitab-list{display:grid;gap:2px}
  .equran-kitab-arabic{font-size:28px!important;line-height:2.15!important;direction:rtl!important;unicode-bidi:plaintext;text-align:right!important;margin:16px 0 24px!important;white-space:pre-wrap!important}
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
  const chapterNav = el('nav', 'equran-chapter-nav');
  chapterNav.setAttribute('aria-label', 'Navigasi bab kitab');
  chapterNav.hidden = true;
  reader.append(top, paper, chapterNav);
  home.after(reader);

  function closeReader() {
    document.body.classList.remove('equran-reader-active');
    paper.replaceChildren();
    chapterNav.hidden = true;
    chapterNav.replaceChildren();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showReader(title, subtitle = 'Koleksi dari EQuran.id') {
    heading.textContent = title;
    subheading.textContent = subtitle;
    paper.replaceChildren();
    chapterNav.hidden = true;
    chapterNav.replaceChildren();
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
      audio.controls = false;
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
  const unwrap = value => {
    let current = value;
    for (let depth = 0; depth < 5; depth += 1) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) break;
      const next = current.data ?? current.result ?? current.response;
      if (!next || next === current) break;
      current = next;
    }
    return current;
  };
  const firstText = (item, keys, fallback = '') => {
    const usable = value => {
      if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
      if (Array.isArray(value)) return value.map(part => usable(part)).filter(Boolean).join('\\n');
      return '';
    };
    for (const key of keys) {
      const value = usable(item?.[key]);
      if (value) return value;
    }
    const visit = (value, depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 4) return '';
      for (const key of keys) {
        const found = usable(value[key]);
        if (found) return found;
      }
      for (const child of Object.values(value)) {
        const found = visit(child, depth + 1);
        if (found) return found;
      }
      return '';
    };
    return visit(item) || fallback;
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
  function openKitabCatalog() {
    closeReader();
    window.setTimeout(() => {
      const section = home.querySelector('#kitabLibrarySection');
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
  function splitSafinahText(text) {
    const source = String(text || '').replace(/\r/g, '').trim();
    if (!source) return [];
    const marker = /۞\s*([^۞\n]+?)\s*۞/gu;
    const matches = [...source.matchAll(marker)];
    if (!matches.length) return [{ title: 'Pengantar', content: source }];
    const sections = [];
    const prefix = source.slice(0, matches[0].index).trim();
    if (prefix) sections.push({ title: 'Pengantar', content: prefix });
    matches.forEach((match, index) => {
      const contentStart = match.index + match[0].length;
      const contentEnd = index + 1 < matches.length ? matches[index + 1].index : source.length;
      const content = source.slice(contentStart, contentEnd).trim();
      if (content) sections.push({ title: match[1].trim(), content });
    });
    return sections;
  }
  function splitSafinahSections(indonesia, arabic, latin) {
    const indonesiaSections = splitSafinahText(indonesia);
    const arabicSections = splitSafinahText(arabic);
    const latinSections = splitSafinahText(latin);
    return indonesiaSections.map((section, index) => ({
      nomor: String(index + 1),
      judul: section.title,
      content: section.content,
      arabic: arabicSections[index]?.content || '',
      latin: latinSections[index]?.content || '',
      local: true
    }));
  }

  function manualStorageKey(slug) {
    return 'e-moeslife:kitab-manual:v1:' + String(slug || 'kitab-lain').replace(/[^a-z0-9_-]/gi, '-');
  }
  function readManualDocument(slug, title) {
    try {
      const value = JSON.parse(localStorage.getItem(manualStorageKey(slug)) || 'null');
      if (value && value.version === 1 && Array.isArray(value.chapters)) return value;
    } catch (error) { console.warn('Data kitab lokal tidak dapat dibaca.', error); }
    return { version: 1, book: title || 'Kitab', chapters: [] };
  }
  function saveManualDocument(documentData, slug, title) {
    const normalized = {
      version: 1,
      book: title || documentData.book || 'Kitab',
      updatedAt: new Date().toISOString(),
      chapters: (documentData.chapters || []).map((chapter, index) => ({
        id: String(chapter.id || slug + '-' + (index + 1)),
        title: String(chapter.title || '').trim(),
        arabic: String(chapter.arabic || ''),
        translation: String(chapter.translation || '')
      }))
    };
    localStorage.setItem(manualStorageKey(slug), JSON.stringify(normalized));
    return normalized;
  }
  function openKitabEditor(slug, title, initialChapters = []) {
    showReader('Editor ' + title, 'Edit bab dan tulisan yang sudah ada, lalu simpan perubahan');
    const documentData = readManualDocument(slug, title);
    const sourceChapters = documentData.chapters.length ? documentData.chapters : initialChapters;
    let chapters = sourceChapters.map((chapter, index) => ({
      id: String(chapter.id || slug + '-' + (index + 1)),
      title: String(chapter.title || chapter.judul || 'Bab ' + (index + 1)),
      arabic: String(chapter.arabic || chapter.teks_arab || ''),
      translation: String(chapter.translation || chapter.content || chapter.teks_indonesia || chapter.terjemahan || '')
    }));
    let selected = chapters.length ? 0 : -1;
    const editor = el('div', 'safinah-editor');
    const intro = el('p', 'equran-paper-intro', 'Data tersimpan otomatis di perangkat ini. Unduh JSON secara berkala sebagai cadangan dan untuk mengirim hasil penyusunan kepada pengembang.');
    const toolbar = el('div', 'safinah-editor-toolbar');
    const addButton = action('+ Tambah bab', () => {
      chapters.push({ id: slug + '-' + Date.now(), title: 'Bab baru', arabic: '', translation: '' });
      selected = chapters.length - 1;
      persist('Bab baru ditambahkan.');
      draw();
    }, 'equran-action primary');
    const downloadButton = action('↓ Download JSON', downloadDocument, 'equran-action primary');
    const importButton = action('↑ Impor JSON', () => fileInput.click(), 'equran-action');
    const fileInput = el('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.hidden = true;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
        const imported = Array.isArray(parsed) ? parsed : parsed.chapters;
        if (!Array.isArray(imported)) throw new Error('Format JSON tidak memiliki daftar chapters.');
        chapters = imported.map((chapter, index) => ({
          id: String(chapter.id || slug + '-' + (index + 1)),
          title: String(chapter.title || chapter.judul || '').trim(),
          arabic: String(chapter.arabic || chapter.teks_arab || ''),
          translation: String(chapter.translation || chapter.terjemahan || chapter.teks_indonesia || '')
        }));
        if (chapters.some(chapter => !chapter.title)) throw new Error('Setiap bab harus memiliki nama bab.');
        selected = chapters.length ? 0 : -1;
        persist('JSON berhasil diimpor.');
        draw();
      } catch (error) {
        status.textContent = 'Gagal mengimpor: ' + (error.message || 'File tidak valid.');
      } finally { fileInput.value = ''; }
    });
    toolbar.append(addButton, downloadButton, importButton, fileInput);
    const status = el('p', 'safinah-editor-status', 'Belum ada perubahan.');
    const layout = el('div', 'safinah-editor-layout');
    const listPanel = el('section', '');
    const listHeading = el('h3', '', 'Urutan bab');
    const chapterList = el('div', 'safinah-chapter-list');
    listPanel.append(listHeading, chapterList);
    const formPanel = el('section', '');
    const fields = el('div', '');
    const titleField = el('div', 'safinah-field');
    const titleLabel = el('label', '', 'Nama bab');
    const titleInput = el('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Contoh: Bab Rukun Islam';
    titleField.append(titleLabel, titleInput);
    const arabicField = el('div', 'safinah-field');
    const arabicLabel = el('label', '', 'Teks Arab');
    const arabicInput = el('textarea', 'arabic');
    arabicInput.dir = 'rtl';
    arabicInput.lang = 'ar';
    arabicInput.placeholder = 'Tempelkan teks Arab lengkap dengan harakat…';
    arabicField.append(arabicLabel, arabicInput);
    const translationField = el('div', 'safinah-field');
    const translationLabel = el('label', '', 'Arti / terjemahan');
    const translationInput = el('textarea');
    translationInput.placeholder = 'Tempelkan arti atau terjemahan bab…';
    translationField.append(translationLabel, translationInput);
    const fieldActions = el('div', 'safinah-editor-toolbar');
    const deleteButton = action('Hapus bab', () => {
      if (selected < 0 || !window.confirm('Hapus bab ini?')) return;
      chapters.splice(selected, 1);
      selected = chapters.length ? Math.min(selected, chapters.length - 1) : -1;
      persist('Bab dihapus.');
      draw();
    }, 'equran-action');
    const previewButton = action('Pratinjau bacaan', () => {
      if (selected < 0) return;
      const chapter = chapters[selected];
      paper.replaceChildren(el('h2', '', chapter.title || 'Bab tanpa judul'));
      if (chapter.arabic) {
        const arabicPreview = el('p', 'equran-arabic equran-kitab-arabic', chapter.arabic);
        arabicPreview.style.whiteSpace = 'pre-wrap';
        paper.append(arabicPreview);
      }
      if (chapter.translation) {
        const translationPreview = el('p', 'equran-kitab-indonesia', chapter.translation);
        translationPreview.style.whiteSpace = 'pre-wrap';
        paper.append(translationPreview);
      }
      paper.append(action('← Kembali ke editor', () => openKitabEditor(slug, title), 'equran-back'));
      chapterNav.hidden = true;
    }, 'equran-action primary');
    fieldActions.append(deleteButton, previewButton);
    fields.append(titleField, arabicField, translationField, fieldActions);
    formPanel.append(fields);
    layout.append(listPanel, formPanel);
    editor.append(intro, toolbar, status, layout);
    paper.replaceChildren(el('h2', '', 'Penyusunan ' + title), editor, action('← Kembali ke kitab', () => openKitab(slug, title), 'equran-back'));
    function persist(message) {
      try {
        saveManualDocument({ chapters }, slug, title);
        status.textContent = message + ' Tersimpan otomatis di perangkat ini.';
      } catch (error) {
        status.textContent = 'Tidak dapat menyimpan di perangkat. Silakan download JSON sebagai cadangan.';
      }
    }
    function downloadDocument() {
      try {
        // Build the export directly from the in-memory editor state.
        // Do not write it to localStorage here: large manuscripts can exceed
        // the browser's storage quota even though they can still be downloaded.
        const payload = {
          version: 1,
          book: title || 'Kitab',
          updatedAt: new Date().toISOString(),
          chapters: chapters.map((chapter, index) => ({
            id: String(chapter.id || slug + '-' + (index + 1)),
            title: String(chapter.title || '').trim(),
            arabic: String(chapter.arabic || ''),
            translation: String(chapter.translation || '')
          }))
        };
        const json = '\uFEFF' + JSON.stringify(payload, null, 2);
        const filename = (slug || 'kitab').replace(/[^a-z0-9_-]/gi, '-') + '.json';
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const link = el('a');
        link.href = objectUrl;
        link.download = filename;
        link.style.position = 'fixed';
        link.style.left = '-10000px';
        link.style.top = '0';
        document.body.append(link);
        link.click();
        status.textContent = 'Permintaan unduh ' + filename + ' telah dikirim. Periksa folder Download.';
        window.setTimeout(() => {
          link.remove();
          URL.revokeObjectURL(objectUrl);
        }, 30000);
      } catch (error) {
        status.textContent = 'Gagal menyiapkan JSON: ' + (error?.message || 'Terjadi kesalahan.');
      }
    }
    function draw() {
      chapterList.replaceChildren();
      if (!chapters.length) chapterList.append(el('p', 'safinah-empty', 'Belum ada bab awal yang dimuat. Anda tetap dapat menambahkan bab baru.'));
      chapters.forEach((chapter, index) => {
        const item = el('div', 'safinah-chapter-item' + (index === selected ? ' active' : ''));
        const selectButton = action((index + 1) + '. ' + (chapter.title || 'Bab tanpa nama'), () => {
          selected = index;
          draw();
        }, 'equran-action');
        const reorder = el('div', 'safinah-chapter-actions');
        const up = action('↑', () => moveChapter(index, -1), 'equran-action');
        const down = action('↓', () => moveChapter(index, 1), 'equran-action');
        up.disabled = index === 0;
        down.disabled = index === chapters.length - 1;
        reorder.append(up, down);
        item.append(selectButton, reorder);
        chapterList.append(item);
      });
      const hasSelection = selected >= 0 && Boolean(chapters[selected]);
      titleInput.disabled = arabicInput.disabled = translationInput.disabled = !hasSelection;
      deleteButton.disabled = previewButton.disabled = !hasSelection;
      if (hasSelection) {
        titleInput.value = chapters[selected].title || '';
        arabicInput.value = chapters[selected].arabic || '';
        translationInput.value = chapters[selected].translation || '';
      } else {
        titleInput.value = arabicInput.value = translationInput.value = '';
      }
    }
    function moveChapter(index, offset) {
      const target = index + offset;
      if (target < 0 || target >= chapters.length) return;
      [chapters[index], chapters[target]] = [chapters[target], chapters[index]];
      selected = target;
      persist('Urutan bab diperbarui.');
      draw();
    }
    const updateSelected = () => {
      if (selected < 0 || !chapters[selected]) return;
      chapters[selected].title = titleInput.value;
      chapters[selected].arabic = arabicInput.value;
      chapters[selected].translation = translationInput.value;
      persist('Perubahan bab disimpan.');
      const active = chapterList.children[selected]?.querySelector('button');
      if (active) active.textContent = (selected + 1) + '. ' + (chapters[selected].title || 'Bab tanpa nama');
    };
    titleInput.addEventListener('input', updateSelected);
    arabicInput.addEventListener('input', updateSelected);
    translationInput.addEventListener('input', updateSelected);
    draw();
  }

  async function openLocalAqidatul(title) {
    showReader(title || 'Aqidatul Awam', 'Naskah lokal · tersedia tanpa koneksi API');
    loading();
    try {
      const response = await fetch('/data/aqidatul-awam.json', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Naskah Aqidatul Awam lokal tidak dapat dimuat (' + response.status + ').');
      const documentData = await response.json();
      const chapters = Array.isArray(documentData.chapters) ? documentData.chapters : [];
      const localItems = chapters.map((item, index) => ({
        number: String(index + 1), title: item.title || 'Bagian ' + (index + 1),
        content: item.translation || '', arabic: item.arabic || '', local: true
      }));
      paper.replaceChildren(
        el('h2', '', documentData.book || 'Aqidatul Awam'),
        el('p', 'equran-paper-intro', 'Susunan naskah lokal Anda. Kitab ini tidak memerlukan API untuk dibaca.'),
        action('✎ Edit naskah ini', () => openKitabEditor('aqidatul-awam', documentData.book || title, chapters), 'equran-action primary')
      );
      const list = el('div', 'equran-kitab-list');
      localItems.forEach((chapter, index) => {
        const entry = row(chapter.title, 'Bagian ' + (index + 1));
        entry.append(action('Baca bagian', () => openKitabChapter('aqidatul-awam', chapter.number, chapter.title, documentData.book || title, localItems, index), 'equran-action primary'));
        list.append(entry);
      });
      paper.append(list, action('← Kembali ke daftar kitab', openKitabCatalog, 'equran-back'));
    } catch (error) { showError(error); }
  }

  async function openLocalSafinah(title) {
    showReader(title, 'Naskah lokal · tersedia tanpa koneksi API');
    loading();
    try {
      const response = await fetch('/data/safinah-an-najah.json', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Naskah Safinah lokal tidak dapat dimuat (' + response.status + ').');
      const documentData = await response.json();
      const chapters = Array.isArray(documentData.chapters) ? documentData.chapters : [];
      paper.replaceChildren(
        el('h2', '', documentData.book || 'Safinah An-Najah'),
        el('p', 'equran-paper-intro', 'Naskah tersimpan di aplikasi. Tidak memerlukan API untuk membaca kitab ini.')
      );
      const list = el('div', 'equran-kitab-list');
      chapters.forEach((chapter, index) => {
        const entry = row(chapter.title || 'Bab ' + (index + 1), 'Bagian ' + (index + 1));
        entry.append(action('Baca bab', () => {
          const localItems = chapters.map((item, itemIndex) => ({
            number: String(itemIndex + 1), title: item.title || 'Bab ' + (itemIndex + 1),
            content: item.translation || '', arabic: item.arabic || '', local: true
          }));
          openKitabChapter('safinah', localItems[index].number, localItems[index].title, documentData.book || title, localItems, index);
        }, 'equran-action primary'));
        list.append(entry);
      });
      if (!chapters.length) list.append(el('p', 'equran-muted', 'Naskah belum memiliki bab.'));
      paper.append(list, action('← Kembali ke daftar kitab', openKitabCatalog, 'equran-back'));
    } catch (error) { showError(error); }
  }

  async function editExistingKitab(slug, title, chapterItems) {
    const statusTitle = 'Memuat isi kitab untuk editor…';
    showReader('Editor ' + title, statusTitle);
    loading();
    const editable = [];
    for (let index = 0; index < chapterItems.length; index += 1) {
      const item = chapterItems[index];
      let detail = item;
      if (!item.content && !item.arabic && !item.latin) {
        try { detail = await kitabRequest({ action: 'chapter', slug, nomor: item.number }); }
        catch (error) { detail = item; }
      }
      editable.push({
        id: slug + '-' + (index + 1),
        title: item.title,
        arabic: firstText(detail, ['teks_arab', 'teksArab', 'teks_arabic', 'arab', 'arabic', 'naskah_arab']),
        translation: firstText(detail, ['teks_indonesia', 'terjemahan', 'indonesia', 'terjemah', 'content', 'isi', 'konten'])
      });
    }
    openKitabEditor(slug, title, editable);
  }

  async function openKitab(slug, title) {
    if (!slug) { showError(new Error('Identitas kitab dari API tidak tersedia.')); return; }
    if (slug === 'safinah') { await openLocalSafinah(title || 'Safinah An-Najah'); return; }
    if (/aqidatul/i.test(slug) || /aqidatul/i.test(title || '')) { await openLocalAqidatul(title || 'Aqidatul Awam'); return; }
    showReader(title, 'Daftar bab · Ahmad Sanusi Open API');
    loading();
    try {
      let detail = {};
      let chapters = [];
      detail = await kitabRequest({ action: 'detail', slug, page: '1', limit: '100' });
      chapters = pickArray(detail);
      const limit = Number(detail.limit || 100);
      let page = Number(detail.page || 1);
      const total = Number(detail.total || chapters.length);
      while (page * limit < total) {
        page += 1;
        const next = await kitabRequest({ action: 'detail', slug, page: String(page), limit: String(limit) });
        const nextChapters = pickArray(next);
        if (!nextChapters.length) break;
        chapters.push(...nextChapters);
      }
      const chapterItems = chapters.map((chapter, index) => ({
        number: firstText(chapter, ['nomor', 'nomor_bab', 'no', 'urutan', 'bab', 'id'], String(index + 1)),
        title: firstText(chapter, ['judul', 'nama_bab', 'nama', 'title', 'judul_bab'], 'Bab ' + (index + 1)),
        content: chapter.content || '',
        arabic: chapter.arabic || '',
        latin: chapter.latin || '',
        local: Boolean(chapter.local)
      }));
      paper.replaceChildren(
        el('h2', '', title),
        el('p', 'equran-paper-intro', firstText(detail, ['deskripsi', 'keterangan', 'tentang'], 'Pilih bab untuk membaca teks kitab.')),
        action('✎ Edit isi kitab ini', () => editExistingKitab(slug, title, chapterItems), 'equran-action primary')
      );
      const list = el('div', 'equran-kitab-list');
      chapterItems.forEach((chapter, index) => {
        const entry = row(chapter.title, '');
        entry.append(action('Baca bab', () => openKitabChapter(slug, chapter.number, chapter.title, title, chapterItems, index), 'equran-action primary'));
        list.append(entry);
      });
      if (!chapterItems.length) list.append(el('p', 'equran-muted', 'Daftar bab belum dikenali dari respons detail kitab.'));
      paper.append(list);
      const manual = readManualDocument(slug, title);
      if (manual.chapters.length) {
        paper.append(el('h3', '', 'Susunan pribadi'));
        const manualList = el('div', 'equran-kitab-list');
        const localItems = manual.chapters.map((item, itemIndex) => ({
          number: String(itemIndex + 1), title: item.title || 'Bab ' + (itemIndex + 1),
          content: item.translation || '', arabic: item.arabic || '', local: true
        }));
        localItems.forEach((chapter, index) => {
          const entry = row(chapter.title, 'Susunan pribadi · Bagian ' + (index + 1));
          entry.append(action('Baca susunan saya', () => openKitabChapter(slug, chapter.number, chapter.title, title, localItems, index), 'equran-action'));
          manualList.append(entry);
        });
        paper.append(manualList);
      }
      paper.append(action('← Kembali ke daftar kitab', openKitabCatalog, 'equran-back'));
    } catch (error) {
      showError(error);
      paper.append(action('✎ Tetap edit kitab ini', () => openKitabEditor(slug, title), 'equran-action primary'));
    }
  }
  async function openKitabChapter(slug, number, chapterTitle, bookTitle, chapterItems = [], chapterIndex = 0) {
    showReader(chapterTitle, bookTitle + ' · Bab ' + number);
    loading();
    try {
      const current = chapterItems[chapterIndex];
      const chapter = current?.local
        ? { teks_indonesia: current.content, teks_arab: current.arabic, teks_latin: current.latin }
        : await kitabRequest({ action: 'chapter', slug, nomor: number });
      paper.replaceChildren(el('h2', '', chapterTitle));
      const arabic = firstText(chapter, ['teks_arab', 'teksArab', 'teks_arabic', 'arab', 'arabic', 'arabic_text', 'arabicText', 'arab_text', 'isi_arab', 'teks', 'naskah_arab', 'naskah']);
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
      chapterNav.replaceChildren(
        action('Daftar kitab', openKitabCatalog, 'equran-action'),
        action('Daftar bab', () => openKitab(slug, bookTitle), 'equran-action'),
        action('Bab berikutnya →', () => {
          const nextIndex = chapterIndex + 1;
          const next = chapterItems[nextIndex];
          if (next) openKitabChapter(slug, next.number, next.title, bookTitle, chapterItems, nextIndex);
        }, 'equran-action primary')
      );
      const nextButton = chapterNav.lastElementChild;
      if (chapterIndex + 1 >= chapterItems.length) {
        nextButton.disabled = true;
        nextButton.textContent = 'Bab terakhir';
      }
      chapterNav.hidden = false;
    } catch (error) { showError(error); }
  }

  const cards = [
    ['05 / DOA & ZIKIR', 'Doa & Dzikir', 'Lafaz Arab, Latin, arti, dan kategori', openDoa],
    ['06 / AL-QUR’AN', 'Al-Qur’an & Murattal', 'Baca ayat dan dengarkan satu surah penuh', () => loadSurahs('quran')],
    ['07 / TAFSIR', 'Tafsir Al-Qur’an', 'Baca penjelasan ayat dan kandungan surah', () => loadSurahs('tafsir')]
  ];
  cards.forEach(([index, title, description, open]) => {
    const card = el('button', 'collection-card collection-equran');
    card.type = 'button';
    card.append(
      el('span', 'card-index', index),
      Object.assign(el('span', 'collection-symbol'), { innerHTML: '<img src="/assets/collection-icon.webp" alt="">' }),
      el('span', 'collection-title', title),
      el('span', 'collection-desc', description),
      Object.assign(el('span', 'collection-bottom'), { innerHTML: '<span class="collection-meta">Koleksi e-Moeslife</span><span class="round-arrow" aria-hidden="true"></span>' })
    );
    card.addEventListener('click', open);
    grid.append(card);
  });
  const kitabSection = home.querySelector('#kitabLibrarySection');
  const kitabSearch = home.querySelector('#kitabLibrarySearch');
  const kitabGrid = home.querySelector('#kitabLibraryGrid');
  if (!kitabSection || !kitabSearch || !kitabGrid) return;

  async function loadKitabHomeCatalog() {
    try {
      const payload = await kitabRequest({ action: 'list' });
      const books = pickArray(payload);
      if (!books.length) throw new Error('Daftar kitab belum tersedia.');
      const draw = () => {
        const query = kitabSearch.value.trim().toLocaleLowerCase('id');
        kitabGrid.replaceChildren();
        const filtered = books.filter(book =>
          [kitabName(book), kitabSlug(book), book.nama_arab, book.kategori, book.pengarang, book.penulis]
            .filter(Boolean).join(' ').toLocaleLowerCase('id').includes(query)
        );
        filtered.forEach((book, index) => {
          const slug = kitabSlug(book);
          const title = kitabName(book);
          const card = el('button', 'kitab-home-card');
          card.type = 'button';
          card.append(
            el('span', 'kitab-home-index', String(index + 1).padStart(2, '0')),
            el('strong', 'kitab-home-title', title),
            el('small', 'kitab-home-author', firstText(book, ['pengarang', 'penulis', 'author'], firstText(book, ['kategori', 'category']))),
            el('span', 'kitab-home-category', firstText(book, ['kategori', 'category'], 'Kitab klasik'))
          );
          card.addEventListener('click', () => openKitab(slug, title));
          kitabGrid.append(card);
        });
        if (!filtered.length) kitabGrid.append(el('p', 'equran-muted', 'Kitab tidak ditemukan.'));
      };
      kitabSearch.addEventListener('input', draw);
      draw();
    } catch (error) {
      kitabGrid.replaceChildren(el('p', 'equran-error', error.message || 'Daftar kitab belum dapat dimuat.'));
    }
  }
  loadKitabHomeCatalog();
}