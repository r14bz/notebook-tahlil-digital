export function applyDzikirOverrides(sections, data) {
  if (!Array.isArray(data?.sections)) return 0;
  const dzikir = sections.filter(section => section.collection === 'dzikir');
  let applied = 0;
  data.sections.forEach((item, index) => {
    if (dzikir[index] && typeof item?.text === 'string' && item.text.trim()) {
      dzikir[index].text = item.text;
      applied += 1;
    }
  });
  return applied;
}

export function isValidManualDzikirLayout(layout) {
  return Boolean(
    layout &&
    layout.format === 'etahlil-dzikir-page-layout' &&
    layout.scope === 'dzikir-ba-da-shalat' &&
    Number.isSafeInteger(Number(layout.sectionIndex)) &&
    Number(layout.sectionIndex) >= 0 &&
    typeof layout.text === 'string' &&
    layout.text.includes('[[HALAMAN BARU]]')
  );
}

/** Muat data opsional secara terisolasi agar kegagalan satu file tidak membatalkan file lainnya. */
export async function loadOptionalReaderContent({
  sections,
  loadAdditionalSurahs,
  fetchImpl,
  readPageLayout,
  writePageLayout
}) {
  await loadAdditionalSurahs();
  const results = { overridesApplied: 0, pageLayoutApplied: false, errors: [] };

  const overridesTask = (async () => {
    const response = await fetchImpl('./src/data/dzikir-overrides.json');
    if (!response.ok) throw new Error('Dzikir overrides HTTP ' + response.status);
    results.overridesApplied = applyDzikirOverrides(sections, await response.json());
  })();

  const layoutTask = (async () => {
    const response = await fetchImpl('./etahlil-pembagian-halaman-dzikir.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Manual page layout HTTP ' + response.status);
    const layout = await response.json();
    if (!isValidManualDzikirLayout(layout)) return;
    const pageLayout = readPageLayout();
    pageLayout[Number(layout.sectionIndex)] = layout.text;
    writePageLayout(pageLayout);
    results.pageLayoutApplied = true;
  })();

  const settled = await Promise.allSettled([overridesTask, layoutTask]);
  settled.forEach(result => {
    if (result.status === 'rejected') results.errors.push(result.reason?.message || 'Optional content could not be loaded');
  });
  return results;
}
