/** Filter indeks bacaan berdasarkan judul dan kategori koleksi. */
export function filterReadingSections(sections, query = '', predicate = () => true) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase('id');
  return sections
    .map((section, index) => ({ s: section, i: index }))
    .filter(({ s }) => predicate(s) && (!normalizedQuery || String(s.title || '').toLocaleLowerCase('id').includes(normalizedQuery)));
}
