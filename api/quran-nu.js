export default async function handler(req, res) {
  const slug = String(req.query?.surah || '').toLowerCase();
  const allowed = { yasin: 'https://quran.nu.or.id/yasin', 'ar-rahman': 'https://quran.nu.or.id/ar-rahman' };
  const url = allowed[slug];
  if (!url) return res.status(400).json({ error: 'Surah tidak didukung.' });

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ETahlilDigital/1.0)' }
    });
    if (!response.ok) return res.status(502).json({ error: 'Sumber Quran NU Online tidak dapat diakses.' });
    const html = await response.text();
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch {
    return res.status(502).json({ error: 'Gagal mengambil teks dari Quran NU Online.' });
  }
}
