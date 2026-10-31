/** Menentukan indeks awal koleksi untuk pintasan navigasi beranda. */
export function findCollectionStart(sections, kind) {
  return sections.findIndex(section => {
    if (kind === 'tahlil') return !section.quranSurah && !section.collection;
    if (kind === 'dzikir') return section.collection === 'dzikir';
    if (kind === 'yasin') return section.quranSurah === 36;
    if (kind === 'rahman') return section.quranSurah === 55;
    return false;
  });
}
