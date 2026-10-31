export function getReadingGroup(page) {
  if (page?.quranSurah) return `quran-${page.quranSurah}`;
  return page?.collection === 'dzikir' ? 'dzikir' : 'tahlil';
}
