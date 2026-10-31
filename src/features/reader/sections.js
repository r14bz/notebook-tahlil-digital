/** Siapkan sumber bacaan untuk pagination tanpa mengubah data sumber. */
export function prepareReadingSections(sections, pageLayout = {}) {
  const manualDzikirLayoutIndex = Object.keys(pageLayout).map(Number).find(index =>
    sections[index]?.collection === 'dzikir' &&
    typeof pageLayout[index] === 'string' &&
    pageLayout[index].includes('[[HALAMAN BARU]]')
  );

  return sections.flatMap((section, index) => {
    if (manualDzikirLayoutIndex !== undefined && section.collection === 'dzikir' && index !== manualDzikirLayoutIndex) {
      return [];
    }
    const item = { ...section, originalIndex: index };
    if (Object.prototype.hasOwnProperty.call(pageLayout, index) && typeof pageLayout[index] === 'string') {
      item.pageLayoutText = pageLayout[index];
    }
    return [item];
  });
}

/** Isi indeks koleksi yang tidak memiliki halaman mandiri dengan halaman grup sebelumnya. */
export function completeSectionStarts(sectionStarts, sectionCount) {
  const completed = Array.from({ length: sectionCount }, (_, index) => sectionStarts[index]);
  let pageCursor = 0;
  completed.forEach((start, index) => {
    if (start === undefined) completed[index] = Math.max(0, pageCursor);
    pageCursor = completed[index];
  });
  return completed;
}
