const BASE_URL = 'https://api.ahmadsanusi.com';
const ALLOWED_ACTIONS = new Set(['list', 'categories', 'detail', 'chapter', 'search']);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'error', message: 'Method tidak diizinkan.' });
  }
  const apiKey = process.env.AHMADSANUSI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ status: 'error', message: 'Konfigurasi layanan kitab belum tersedia di server.' });
  }

  const { action, slug, nomor, q, page, limit } = req.query || {};
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ status: 'error', message: 'Permintaan katalog kitab tidak valid.' });
  }

  let path = '/v1/kitab';
  if (action === 'categories') path += '/kategori';
  if (action === 'detail' || action === 'chapter' || action === 'search') {
    if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,100}$/i.test(slug)) {
      return res.status(400).json({ status: 'error', message: 'Identitas kitab tidak valid.' });
    }
    path += '/' + encodeURIComponent(slug);
    if (action === 'chapter') {
      const chapterNumber = String(nomor ?? '');
      if (!/^[0-9]{1,5}$/.test(chapterNumber)) {
        return res.status(400).json({ status: 'error', message: 'Nomor bab tidak valid.' });
      }
      path += '/bab/' + chapterNumber;
    } else if (action === 'search') {
      path += '/search';
      const keyword = typeof q === 'string' ? q.trim() : '';
      if (keyword.length < 2 || keyword.length > 100) {
        return res.status(400).json({ status: 'error', message: 'Kata pencarian minimal 2 dan maksimal 100 karakter.' });
      }
    }
  }

  const url = new URL(BASE_URL + path);
  if (action === 'search') url.searchParams.set('q', q.trim());
  if (action === 'detail') {
    const pageNumber = Number(page ?? 1);
    const pageLimit = Number(limit ?? 100);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 1000 ||
        !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100) {
      return res.status(400).json({ status: 'error', message: 'Parameter halaman kitab tidak valid.' });
    }
    url.searchParams.set('page', String(pageNumber));
    url.searchParams.set('limit', String(pageLimit));
  }

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-API-Key': apiKey }
    });
    const body = await upstream.text();
    let data;
    try { data = JSON.parse(body); } catch { data = { status: 'error', message: 'Respons layanan kitab bukan JSON yang valid.' }; }
    if (!upstream.ok) {
      const status = upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status;
      return res.status(status).json({
        status: 'error',
        message: upstream.status === 401 || upstream.status === 403
          ? 'Autentikasi layanan kitab ditolak. Periksa API key di Vercel.'
          : (data.detail || data.message || 'Layanan kitab sedang bermasalah.')
      });
    }
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    res.setHeader('Vary', 'Accept');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ status: 'error', message: 'Tidak dapat terhubung ke layanan kitab. Silakan coba kembali.' });
  }
}