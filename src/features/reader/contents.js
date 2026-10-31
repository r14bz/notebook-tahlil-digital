const CONTENTS_GROUPS = Object.freeze([
  { title: 'Tahlil', matches: section => !section.quranSurah && !section.collection },
  { title: 'Surah Yasin', matches: section => section.quranSurah === 36 },
  { title: 'Surah Ar-Rahman', matches: section => section.quranSurah === 55 },
  { title: 'Dzikir', matches: section => section.collection === 'dzikir' }
]);

/** Menyediakan kelompok daftar isi yang dapat diuji tanpa DOM. */
export function getReaderContentsGroups() {
  return CONTENTS_GROUPS;
}

/** Render navigasi daftar isi dan hubungkan pilihan ke halaman awal kelompok. */
export function renderReaderContents({ sections, pages, index, sectionStarts, $, showPage }) {
  const contents = $('contents');
  contents.innerHTML = '';
  const activePage = pages[index] || {};

  CONTENTS_GROUPS.forEach((group, groupIndex) => {
    const firstSection = sections.findIndex(group.matches);
    if (firstSection < 0) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = (groupIndex + 1) + '. ' + group.title;
    button.className = group.matches(activePage) ? 'active' : '';
    button.addEventListener('click', () => {
      showPage(Math.max(0, sectionStarts[firstSection] ?? 0));
      document.body.classList.remove('toc-open');
      $('contentsBtn').setAttribute('aria-expanded', 'false');
    });
    contents.appendChild(button);
  });
}
