import { getReadingGroup } from './navigation.js';

/** Menghitung rentang halaman dalam satu kelompok bacaan. */
export function getReadingGroupBounds(pages, index) {
  if (!Array.isArray(pages) || pages.length === 0) return { start: 0, end: -1 };
  const safeIndex = Math.max(0, Math.min(Number.isInteger(index) ? index : 0, pages.length - 1));
  const group = getReadingGroup(pages[safeIndex]);
  let start = safeIndex;
  let end = safeIndex;
  while (start > 0 && getReadingGroup(pages[start - 1]) === group) start -= 1;
  while (end + 1 < pages.length && getReadingGroup(pages[end + 1]) === group) end += 1;
  return { start, end };
}

/** Menghasilkan nomor halaman dan persentase progres untuk kelompok aktif. */
export function getPageProgress(index, bounds) {
  const total = Math.max(0, bounds.end - bounds.start + 1);
  const current = total ? Math.max(1, Math.min(index - bounds.start + 1, total)) : 0;
  return {
    current,
    total,
    percent: total ? Math.round((current / total) * 100) : 0
  };
}
