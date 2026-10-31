const API = 'https://equran.id/api/v2/shalat';
const STORAGE_KEY = 'em-prayer-location-v1';
const DEFAULT_LOCATION = { provinsi: 'DKI Jakarta', kabkota: 'Kota Jakarta Pusat', label: 'Jakarta Pusat', timezone: 'Asia/Jakarta', zone: 'WIB' };
const PRAYERS = [{ key: 'subuh', label: 'Subuh' }, { key: 'dzuhur', label: 'Dzuhur' }, { key: 'ashar', label: 'Ashar' }, { key: 'maghrib', label: 'Maghrib' }, { key: 'isya', label: 'Isya' }];
const $ = id => document.getElementById(id);
const pad = value => String(value).padStart(2, '0');
const normalize = value => String(value || '').toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const safeJson = async response => { if (!response.ok) throw new Error('Layanan jadwal shalat tidak merespons.'); return response.json(); };

function localParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}
function getZone(longitude) {
  if (longitude >= 129) return { timezone: 'Asia/Jayapura', zone: 'WIT' };
  if (longitude >= 115) return { timezone: 'Asia/Makassar', zone: 'WITA' };
  return { timezone: 'Asia/Jakarta', zone: 'WIB' };
}
function timeMinutes(value) { const [h, m] = String(value || '00:00').split(':').map(Number); return h * 60 + m; }
function formatCountdown(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
}
function cacheKey(location, year, month) { return `em-prayer-cache:${normalize(location.provinsi)}:${normalize(location.kabkota)}:${year}-${pad(month)}`; }
async function post(path, body) {
  return safeJson(await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
}
async function getJson(url) { return safeJson(await fetch(url)); }

async function loadMonthlySchedule(location, year, month) {
  const key = cacheKey(location, year, month);
  try {
    const payload = await post('', { provinsi: location.provinsi, kabkota: location.kabkota, bulan: month, tahun: year });
    if (payload.code !== 200 || !payload.data?.jadwal?.length) throw new Error('Jadwal untuk lokasi ini belum tersedia.');
    try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data: payload.data })); } catch {}
    return payload.data;
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (cached?.data?.jadwal?.length) return cached.data;
    } catch {}
    throw error;
  }
}
async function getProvinces() {
  const payload = await getJson(`${API}/provinsi`);
  if (payload.code !== 200 || !Array.isArray(payload.data)) throw new Error('Daftar provinsi tidak tersedia.');
  return payload.data;
}
async function getCities(province) {
  const payload = await post('/kabkota', { provinsi: province });
  if (payload.code !== 200 || !Array.isArray(payload.data)) throw new Error('Daftar kota tidak tersedia.');
  return payload.data;
}
async function detectLocation() {
  if (!navigator.geolocation) throw new Error('GPS tidak tersedia.');
  const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 9000, maximumAge: 3600000 }));
  const { latitude, longitude } = position.coords;
  const zone = getZone(longitude);
  const reverse = await getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=id`);
  const provinceName = reverse.principalSubdivision || reverse.localityInfo?.administrative?.find(item => item.adminLevel === 4)?.name;
  const cityName = reverse.city || reverse.locality || reverse.localityInfo?.administrative?.find(item => item.adminLevel === 6)?.name;
  if (!provinceName || !cityName) throw new Error('Nama kota dari lokasi tidak ditemukan.');
  const provinces = await getProvinces();
  const province = /jakarta/i.test(provinceName) ? (provinces.find(item => normalize(item) === normalize('DKI Jakarta')) || findRegion(provinces, provinceName)) : findRegion(provinces, provinceName);
  if (!province) throw new Error('Provinsi belum cocok dengan data jadwal shalat.');
  const cities = await getCities(province);
  const city = findRegion(cities, cityName);
  if (!city) throw new Error('Kota belum cocok dengan data jadwal shalat.');
  return { provinsi: province, kabkota: city, label: city.replace(/^(Kota|Kab\.)\s*/i, ''), ...zone };
}

function createLocationDialog(state, onSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'prayer-location-modal';
  wrapper.id = 'prayerLocationModal';
  wrapper.innerHTML = '<div class="prayer-location-dialog" role="dialog" aria-modal="true" aria-labelledby="prayerLocationTitle"><button class="prayer-modal-close" type="button" aria-label="Tutup">×</button><span class="prayer-kicker">PENGATURAN LOKASI</span><h3 id="prayerLocationTitle">Pilih lokasi jadwal</h3><p>Jadwal shalat akan mengikuti kota yang kamu pilih.</p><label for="prayerProvince">Provinsi</label><select id="prayerProvince"><option>Memuat provinsi…</option></select><label for="prayerCity">Kabupaten / Kota</label><select id="prayerCity" disabled><option>Pilih provinsi dahulu</option></select><label for="prayerTimezone">Zona waktu</label><select id="prayerTimezone"><option value="WIB">WIB · UTC+7</option><option value="WITA">WITA · UTC+8</option><option value="WIT">WIT · UTC+9</option></select><p class="prayer-dialog-error" id="prayerDialogError" role="status"></p><button class="prayer-dialog-save" id="prayerSaveLocation" type="button" disabled>Gunakan lokasi ini</button></div>';
  document.body.append(wrapper);
  const close = () => wrapper.classList.remove('open');
  wrapper.querySelector('.prayer-modal-close').addEventListener('click', close);
  wrapper.addEventListener('click', event => { if (event.target === wrapper) close(); });
  const provinceSelect = wrapper.querySelector('#prayerProvince');
  const citySelect = wrapper.querySelector('#prayerCity');
  const save = wrapper.querySelector('#prayerSaveLocation');
  let cities = [];
  getProvinces().then(provinces => {
    provinceSelect.innerHTML = provinces.map(item => `<option value="${item.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${item}</option>`).join('');
    const preferred = findRegion(provinces, state.location.provinsi) || provinces.find(item => normalize(item) === normalize('DKI Jakarta'));
    if (preferred) provinceSelect.value = preferred;
    return getCities(provinceSelect.value);
  }).then(items => {
    cities = items;
    citySelect.innerHTML = cities.map(item => `<option value="${item.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${item}</option>`).join('');
    const preferred = findRegion(cities, state.location.kabkota) || cities.find(item => normalize(item).includes('jakartapusat'));
    if (preferred) citySelect.value = preferred;
    citySelect.disabled = false; save.disabled = false;
  }).catch(error => { wrapper.querySelector('#prayerDialogError').textContent = error.message; });
  provinceSelect.addEventListener('change', async () => {
    citySelect.disabled = true; save.disabled = true;
    try {
      cities = await getCities(provinceSelect.value);
      citySelect.innerHTML = cities.map(item => `<option value="${item.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${item}</option>`).join('');
      citySelect.disabled = false; save.disabled = false;
    } catch (error) { wrapper.querySelector('#prayerDialogError').textContent = error.message; }
  });
  save.addEventListener('click', async () => {
    const zone = state.location.zone ? { timezone: state.location.timezone, zone: state.location.zone } : { timezone: 'Asia/Jakarta', zone: 'WIB' };
    const selected = { provinsi: provinceSelect.value, kabkota: citySelect.value, label: citySelect.value.replace(/^(Kota|Kab\.)\s*/i, ''), ...zone, manual: true };
    save.disabled = true; save.textContent = 'Memuat jadwal…';
    try { await onSelect(selected); close(); }
    catch (error) { wrapper.querySelector('#prayerDialogError').textContent = error.message; }
    finally { save.disabled = false; save.textContent = 'Gunakan lokasi ini'; }
  });
  return { open: () => wrapper.classList.add('open') };
}

function renderTimes(schedule) {
  const container = $('prayerTimes');
  container.innerHTML = PRAYERS.map(prayer => `<div class="prayer-time" data-prayer="${prayer.key}"><span>${prayer.label}</span><strong>${schedule[prayer.key] || '--:--'}</strong></div>`).join('');
}
function getScene(now, schedule) {
  const parts = localParts(now, schedule.timezone);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const sunrise = timeMinutes(schedule.terbit || '06:00');
  const fajr = timeMinutes(schedule.subuh || '04:30');
  const asr = timeMinutes(schedule.ashar || '15:00');
  const maghrib = timeMinutes(schedule.maghrib || '18:00');
  if (minutes < fajr - 35) return 'night';
  if (minutes < sunrise - 20) return 'dawn';
  if (minutes < sunrise + 40) return 'sunrise';
  if (minutes < asr) return 'day';
  if (minutes < maghrib - 35) return 'afternoon';
  if (minutes < maghrib + 35) return 'sunset';
  return 'night';
}
function updateSky(scene, now, schedule) {
  const banner = $('prayerBanner');
  if (!banner) return;
  banner.dataset.scene = scene;
  banner.className = `prayer-banner prayer-scene-${scene}`;
  const parts = localParts(now, schedule.timezone);
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  const sunrise = timeMinutes(schedule.terbit || '06:00');
  const sunset = timeMinutes(schedule.maghrib || '18:00');
  const progress = Math.max(0, Math.min(1, (minute - sunrise) / Math.max(1, sunset - sunrise)));
  const x = 9 + progress * 82;
  const y = 73 - Math.sin(progress * Math.PI) * 54;
  banner.style.setProperty('--sun-x', `${x}%`);
  banner.style.setProperty('--sun-y', `${y}%`);
  banner.querySelector('.prayer-sun').style.opacity = scene === 'night' ? '0' : '1';
  banner.querySelector('.prayer-moon').style.opacity = scene === 'night' ? '1' : '0';
  banner.querySelector('.prayer-stars').style.opacity = scene === 'night' ? '1' : (scene === 'dawn' ? '.18' : '0');
}
function updateClockAndCountdown(location, schedule) {
  const now = new Date();
  const parts = localParts(now, location.timezone);
  $('prayerClock').textContent = `${parts.hour}:${parts.minute}:${parts.second}`;
  $('prayerDate').textContent = new Intl.DateTimeFormat('id-ID', { timeZone: location.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  $('prayerLocation').textContent = `${location.label} · ${location.zone}`;
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  const timeline = PRAYERS.map(item => ({ ...item, minutes: timeMinutes(schedule[item.key]) }));
  const next = timeline.find(item => item.minutes > current) || timeline[0];
  let target = new Date(now);
  if (next.minutes <= current) target.setDate(target.getDate() + 1);
  const [hour, minute] = String(schedule[next.key] || '00:00').split(':').map(Number);
  const targetParts = localParts(target, location.timezone);
  const localTarget = new Date(`${targetParts.year}-${targetParts.month}-${pad(Number(targetParts.day) + (next.minutes <= current ? 0 : 0))}T00:00:00`);
  const delta = (next.minutes + (next.minutes <= current ? 1440 : 0) - current) * 60000 - Number(parts.second) * 1000;
  $('nextPrayerLabel').textContent = `Menuju ${next.label}`;
  $('nextPrayerCountdown').textContent = formatCountdown(delta);
  const active = timeline.filter(item => item.minutes <= current).at(-1);
  document.querySelectorAll('.prayer-time').forEach(node => node.classList.toggle('is-passed', active && node.dataset.prayer === active.key));
  return getScene(now, schedule);
}

export function initPrayerTimes() {
  const banner = $('prayerBanner');
  if (!banner) return;
  const state = { location: { ...DEFAULT_LOCATION }, schedule: null, timer: null, dialog: null };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.provinsi && saved?.kabkota) state.location = { ...DEFAULT_LOCATION, ...saved };
  } catch {}
  const refresh = async () => {
    const now = new Date();
    const parts = localParts(now, state.location.timezone);
    const month = Number(parts.month), year = Number(parts.year), day = Number(parts.day);
    const data = await loadMonthlySchedule(state.location, year, month);
    const schedule = data.jadwal.find(item => Number(item.tanggal) === day);
    if (!schedule) throw new Error('Jadwal hari ini belum tersedia.');
    state.schedule = { ...schedule, timezone: state.location.timezone };
    renderTimes(schedule);
    const tick = () => {
      const scene = updateClockAndCountdown(state.location, state.schedule) || 'day';
      updateSky(scene, new Date(), state.schedule);
    };
    tick();
    clearInterval(state.timer);
    state.timer = setInterval(tick, 1000);
  };
  const selectLocation = async location => {
    const previous = state.location;
    state.location = location;
    try {
      await refresh();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      $('prayerLocation').textContent = `${location.label} · ${location.zone}`;
    } catch (error) { state.location = previous; throw error; }
  };
  state.dialog = createLocationDialog(state, selectLocation);
  $('prayerLocationBtn').addEventListener('click', () => state.dialog.open());
  const useFallback = async () => {
    state.location = { ...DEFAULT_LOCATION };
    try { await refresh(); } catch (error) { $('nextPrayerLabel').textContent = 'Jadwal belum dapat dimuat'; $('nextPrayerCountdown').textContent = 'Periksa koneksi'; }
  };
  if (state.location.manual) refresh().catch(useFallback);
  else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude, longitude } = position.coords;
        const zone = getZone(longitude);
        const reverse = await getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=id`);
        const provinceName = reverse.principalSubdivision || reverse.localityInfo?.administrative?.find(item => item.adminLevel === 4)?.name;
        const cityName = reverse.city || reverse.locality || reverse.localityInfo?.administrative?.find(item => item.adminLevel === 6)?.name;
        const provinces = await getProvinces();
        const province = /jakarta/i.test(provinceName) ? (provinces.find(item => normalize(item) === normalize('DKI Jakarta')) || findRegion(provinces, provinceName)) : findRegion(provinces, provinceName);
        if (!province) throw new Error('Provinsi tidak cocok');
        const cities = await getCities(province);
        const city = findRegion(cities, cityName);
        if (!city) throw new Error('Kota tidak cocok');
        await selectLocation({ provinsi: province, kabkota: city, label: city.replace(/^(Kota|Kab\.)\s*/i, ''), ...zone, detected: true });
      } catch { await useFallback(); }
    }, useFallback, { enableHighAccuracy: false, timeout: 9000, maximumAge: 3600000 });
  } else useFallback();
}
