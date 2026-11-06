const BOOKS = [
  { file: 'safinah-an-najah.json', slug: 'safinah-an-najah', title: 'Safinah An-Najah', category: 'Fiqih' },
  { file: 'aqidatul-awam.json', slug: 'aqidatul-awam', title: 'Aqidatul Awam', category: 'Aqidah' },
  { file: 'arbain.json', slug: 'arbain', title: 'Arba’in Nawawi', category: 'Hadis' },
  { file: 'bidayatul.json', slug: 'bidayatul', title: 'Bidayatul Hidayah', category: 'Tasawuf' },
  { file: 'bulughul.json', slug: 'bulughul', title: 'Bulughul Maram', category: 'Hadis' },
  { file: 'futuhul.json', slug: 'futuhul', title: 'Futuhul Ghaib', category: 'Tasawuf' },
  { file: 'izar.json', slug: 'izar', title: 'Fathul Izar', category: 'Fikih & Adab' },
  { file: 'jalalain.json', slug: 'jalalain', title: 'Tafsir Jalalain', category: 'Tafsir' },
  { file: 'muslim.json', slug: 'muslim', title: 'Shahih Muslim', category: 'Hadis' },
  { file: 'muwatta.json', slug: 'muwatta', title: 'Muwatta Imam Malik', category: 'Hadis' },
  { file: 'qarib.json', slug: 'qarib', title: 'Fathul Qarib', category: 'Fiqih' },
  { file: 'taklim.json', slug: 'taklim', title: 'Ta’lim Al-Muta’allim', category: 'Adab' },
  { file: 'uyun.json', slug: 'uyun', title: 'Qurrotul Uyun', category: 'Keluarga' },
  { file: 'alhikam.json', slug: 'alhikam', title: 'Al-Hikam', category: 'Tasawuf' }
];
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const ARABIC_KEYS = ['arabic', 'arab', 'teks_arab', 'teksArab', 'teks_arabic', 'arabic_text', 'arabicText', 'arab_text', 'isi_arab', 'naskah_arab', 'matan', 'text_ar'];
const LATIN_KEYS = ['latin', 'teks_latin', 'transliterasi'];
const TRANSLATION_KEYS = ['translation', 'terjemahan', 'teks_indonesia', 'teksIndonesia', 'indonesia', 'terjemah', 'arti', 'makna', 'content', 'isi', 'konten', 'text_id'];
const TITLE_KEYS = ['title', 'judul', 'nama_bab', 'judul_bab', 'nama', 'name', 'bab', 'chapter'];
const arrayAt = value => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['chapters', 'bab', 'daftar_bab', 'sections', 'items', 'contents', 'data', 'list', 'hadis', 'hadiths', 'tafsir']) {
    if (Array.isArray(value[key])) return value[key];
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const nested = arrayAt(child);
      if (nested.length) return nested;
    }
  }
  return [];
};
const asText = value => typeof value === 'string' ? value : (typeof value === 'number' ? String(value) : '');
function findField(item, keys, depth = 0) {
  if (!item || typeof item !== 'object' || depth > 3) return '';
  for (const key of keys) {
    const value = asText(item[key]);
    if (value.trim()) return value;
  }
  for (const value of Object.values(item)) {
    if (value && typeof value === 'object') {
      const found = findField(value, keys, depth + 1);
      if (found.trim()) return found;
    }
  }
  return '';
}
function normalizeChapter(item, index) {
  if (typeof item === 'string') {
    return { title: 'Bagian ' + (index + 1), arabic: ARABIC.test(item) ? item : '', translation: ARABIC.test(item) ? '' : item, latin: '' };
  }
  const title = findField(item, TITLE_KEYS).trim() || 'Bagian ' + (index + 1);
  let arabic = findField(item, ARABIC_KEYS);
  let latin = findField(item, LATIN_KEYS);
  let translation = findField(item, TRANSLATION_KEYS);
  // Be tolerant of manuscripts whose text is stored in a generic "text" field.
  if (!arabic || !translation) {
    const generic = findField(item, ['text', 'teks', 'body', 'paragraph']);
    if (generic) {
      if (ARABIC.test(generic) && !arabic) arabic = generic;
      else if (!translation) translation = generic;
    }
  }
  if (arabic && !ARABIC.test(arabic)) {
    if (!translation) translation = arabic;
    arabic = '';
  }
  return { title, arabic, latin, translation };
}
function appendMixedTranslation(container, value) {
  const paragraphs = String(value || '').split(/\\n{2,}/);
  paragraphs.forEach(paragraph => {
    if (!paragraph.trim()) return;
    const arabicOnly = ARABIC.test(paragraph) && !/[A-Za-z]/.test(paragraph);
    const node = element('p', arabicOnly ? 'local-kitab-arabic' : 'local-kitab-translation', paragraph);
    node.dir = arabicOnly ? 'rtl' : 'auto';
    container.append(node);
  });
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function mountLocalKitabLibrary() {
  const home = document.getElementById('homePage');
  const search = document.getElementById('kitabLibrarySearch');
  const grid = document.getElementById('kitabLibraryGrid');
  if (!home || !search || !grid) return;
  const style = element('style');
  style.textContent = `
    .local-kitab-reader{display:none;max-width:980px;margin:0 auto;padding:22px 18px 36px;min-height:65vh}
    body.local-kitab-active .local-kitab-reader{display:block}
    body.local-kitab-active #homePage,body.local-kitab-active #readerMain,body.local-kitab-active #readerFooter{display:none!important}
    .local-kitab-top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
    .local-kitab-back{border:1px solid #d6c9ad;border-radius:11px;background:#f4eddd;color:#234b37;padding:10px 13px;font-family:inherit;font-size:12px;font-weight:600}
    .local-kitab-paper{padding:clamp(18px,4vw,34px);border:1px solid #ded3ba;border-radius:20px;background:#fffaf0;color:#263b2e;min-height:55vh}
    .local-kitab-paper h2{margin:0 0 8px;color:#174532;font:700 24px 'Amiri',serif}
    .local-kitab-intro{color:#827865;font-size:12px;line-height:1.7}
    .local-kitab-entry{padding:18px 0;border-bottom:1px solid #e4dac5}
    .local-kitab-entry h3{font-size:15px;color:#174532;margin:0 0 12px}
    .local-kitab-arabic{font-family:'Amiri','Noto Naskh Arabic',serif;font-size:27px;line-height:2.15;direction:rtl;unicode-bidi:plaintext;text-align:right;white-space:pre-wrap;margin:10px 0 20px}
    .local-kitab-latin,.local-kitab-translation{font-size:14px;line-height:2;white-space:pre-wrap;margin:10px 0}
    .local-kitab-latin{color:#82745e;font-style:italic}
    .local-kitab-actions{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
    .local-kitab-actions button,.local-kitab-open{border:1px solid #d8c9a8;border-radius:9px;padding:9px 12px;background:#f0eadb;color:#34523f;font-size:12px}
    .local-kitab-actions .primary,.local-kitab-open{background:#174a36;color:#fff7e5;border-color:#9a7a40}
    .local-kitab-card{min-height:130px}
    body.theme-dark .local-kitab-paper{background:#1d3026;color:#eee4d0;border-color:#52634f}
    body.theme-dark .local-kitab-paper h2,body.theme-dark .local-kitab-entry h3{color:#f4e5bd}
    body.theme-dark .local-kitab-entry{border-color:#465a49}
    body.theme-dark .local-kitab-translation{color:#eee4d0}
    body.theme-dark .local-kitab-latin{color:#c0b69f}
    body.theme-dark .local-kitab-actions button{background:#304337;color:#eee4d0;border-color:#60745f}
    @media(max-width:480px){.local-kitab-reader{padding:14px 12px 28px}.local-kitab-paper{padding:17px 14px;border-radius:15px}.local-kitab-arabic{font-size:24px}}
  `;
  document.head.append(style);
  const reader = element('section', 'local-kitab-reader');
  const top = element('div', 'local-kitab-top');
  const back = element('button', 'local-kitab-back', '← Daftar kitab');
  back.type = 'button';
  const heading = element('strong', '', 'Perpustakaan Kitab Kuning');
  top.append(back, heading);
  const paper = element('article', 'local-kitab-paper');
  reader.append(top, paper);
  home.after(reader);
  let activeBook = null;
  let activeChapters = [];
  let activeIndex = 0;
  function closeReader() {
    document.body.classList.remove('local-kitab-active');
    reader.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openReader(title) {
    heading.textContent = title;
    paper.replaceChildren(element('p', 'equran-loading', 'Memuat naskah lokal…'));
    reader.hidden = false;
    document.body.classList.add('local-kitab-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  back.addEventListener('click', () => {
    if (activeBook && activeChapters.length && paper.dataset.mode === 'chapter') renderChapterList();
    else closeReader();
  });
  function renderChapterList() {
    paper.dataset.mode = 'list';
    paper.replaceChildren(
      element('h2', '', activeBook.title),
      element('p', 'local-kitab-intro', activeChapters.length + ' bagian · Naskah tersimpan di folder data aplikasi dan dapat dibaca tanpa API kitab.'),
    );
    const list = element('div', '');
    activeChapters.forEach((chapter, index) => {
      const entry = element('article', 'local-kitab-entry');
      entry.append(element('h3', '', (index + 1) + '. ' + chapter.title));
      const open = element('button', 'local-kitab-open', 'Baca bagian');
      open.type = 'button';
      open.addEventListener('click', () => renderChapter(index));
      entry.append(open);
      list.append(entry);
    });
    const actions = element('div', 'local-kitab-actions');
    const edit = element('button', 'primary', '✎ Edit naskah');
    edit.type = 'button';
    edit.addEventListener('click', () => {
      const openEditor = window.__EMOESLIFE_OPEN_KITAB_EDITOR__;
      if (typeof openEditor === 'function') {
        document.body.classList.remove('local-kitab-active');
        reader.hidden = true;
        openEditor(activeBook.slug, activeBook.title, activeChapters, () => {
          document.body.classList.remove('equran-reader-active');
          openBook(activeBook);
        });
      }
    });
    actions.append(edit);
    paper.append(list, actions, element('p', 'local-kitab-intro', 'Naskah asli di GitHub tidak diubah. Perubahan editor tersimpan sebagai salinan lokal; unduh JSON untuk memperbarui file sumber.'));
  }
  function renderChapter(index) {
    activeIndex = index;
    const chapter = activeChapters[index];
    paper.dataset.mode = 'chapter';
    paper.replaceChildren(element('h2', '', chapter.title));
    if (chapter.arabic) paper.append(element('p', 'local-kitab-arabic', chapter.arabic));
    if (chapter.latin) paper.append(element('p', 'local-kitab-latin', chapter.latin));
    if (chapter.translation) appendMixedTranslation(paper, chapter.translation);
    if (!chapter.arabic && !chapter.translation && !chapter.latin) {
      paper.append(element('p', 'local-kitab-intro', 'Bagian ini tidak memiliki field teks yang dikenali. Naskah JSON asli tetap dipertahankan.'));
    }
    const actions = element('div', 'local-kitab-actions');
    const listButton = element('button', '', '← Daftar bab');
    listButton.type = 'button';
    listButton.addEventListener('click', renderChapterList);
    const previous = element('button', '', '← Sebelumnya');
    previous.type = 'button';
    previous.disabled = index === 0;
    previous.addEventListener('click', () => renderChapter(index - 1));
    const next = element('button', 'primary', 'Berikutnya →');
    next.type = 'button';
    next.disabled = index >= activeChapters.length - 1;
    next.addEventListener('click', () => renderChapter(index + 1));
    actions.append(listButton, previous, next);
    paper.append(actions);
  }
  async function openBook(book) {
    activeBook = book;
    openReader(book.title);
    try {
      const response = await fetch('./data/' + book.file);
      if (!response.ok) throw new Error('File ' + book.file + ' tidak dapat dimuat (' + response.status + ').');
      const documentData = await response.json();
      const rawChapters = arrayAt(documentData);
      if (!rawChapters.length) throw new Error('Struktur naskah ' + book.file + ' belum dikenali.');
      activeChapters = rawChapters.map(normalizeChapter);
      try {
        const saved = JSON.parse(localStorage.getItem('e-moeslife:kitab-manual:v1:' + book.slug) || 'null');
        if (saved?.version === 1 && Array.isArray(saved.chapters) && saved.chapters.length) {
          activeChapters = saved.chapters.map(normalizeChapter);
        }
      } catch (error) { console.warn('Salinan lokal kitab tidak dapat dibaca.', error); }
      if (!activeChapters.length) throw new Error('Naskah belum memiliki bagian bacaan.');
      renderChapterList();
    } catch (error) {
      paper.replaceChildren(element('h2', '', book.title), element('p', 'local-kitab-intro', error.message || 'Naskah gagal dimuat.'));
    }
  }
  function drawCatalog() {
    const query = search.value.trim().toLocaleLowerCase('id');
    grid.replaceChildren();
    const filtered = BOOKS.filter(book => (book.title + ' ' + book.category + ' ' + book.slug).toLocaleLowerCase('id').includes(query));
    filtered.forEach((book, index) => {
      const card = element('button', 'kitab-home-card local-kitab-card');
      card.type = 'button';
      card.append(
        element('span', 'kitab-home-index', String(index + 1).padStart(2, '0')),
        element('strong', 'kitab-home-title', book.title),
        element('small', 'kitab-home-author', 'Naskah lokal · JSON'),
        element('span', 'kitab-home-category', book.category)
      );
      card.addEventListener('click', () => openBook(book));
      grid.append(card);
    });
    if (!filtered.length) grid.append(element('p', 'equran-loading', 'Kitab tidak ditemukan.'));
  }
  search.addEventListener('input', drawCatalog);
  drawCatalog();
}
