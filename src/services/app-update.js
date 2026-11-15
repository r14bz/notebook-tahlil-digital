const OWNER = 'r14bz';
const REPOSITORY = 'notebook-tahlil-digital';
const CURRENT_VERSION = '2.0.0';
const RELEASE_API = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`;
const CHECK_KEY = 'em-update-check-v1';
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

function compareVersions(left, right) {
  const a = String(left).replace(/^v/i, '').split(/[.+-]/).map(part => Number.parseInt(part, 10) || 0);
  const b = String(right).replace(/^v/i, '').split(/[.+-]/).map(part => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

function showUpdateDialog(release, apk) {
  if (document.getElementById('appUpdateDialog')) return;
  const overlay = document.createElement('div');
  overlay.className = 'app-update-overlay';
  overlay.id = 'appUpdateDialog';
  const title = document.createElement('h2');
  title.textContent = 'Pembaruan tersedia';
  const description = document.createElement('p');
  description.textContent = `e-Moeslife versi ${release.tag_name} sudah tersedia. Versi yang terpasang saat ini adalah ${CURRENT_VERSION}.`;
  const notes = document.createElement('p');
  notes.className = 'app-update-notes';
  notes.textContent = release.body?.trim() || 'Pembaruan berisi penyempurnaan aplikasi dan perbaikan.';
  const actions = document.createElement('div');
  actions.className = 'app-update-actions';
  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'app-update-later';
  later.textContent = 'Nanti';
  later.addEventListener('click', () => overlay.remove());
  const download = document.createElement('button');
  download.type = 'button';
  download.className = 'app-update-download';
  download.textContent = 'Unduh Pembaruan';
  download.addEventListener('click', () => {
    // Open the signed APK in the Android browser/download handler.
    // Android will ask the user to approve installation of the downloaded update.
    window.open(apk.browser_download_url, '_blank', 'noopener,noreferrer');
    overlay.remove();
  });
  actions.append(later, download);
  const card = document.createElement('section');
  card.className = 'app-update-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'appUpdateTitle');
  title.id = 'appUpdateTitle';
  card.append(title, description, notes, actions);
  overlay.append(card);
  document.body.append(overlay);
}

export async function checkForAppUpdate({ force = false } = {}) {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  try {
    const lastCheck = Number(localStorage.getItem(CHECK_KEY) || 0);
    if (!force && Date.now() - lastCheck < CHECK_INTERVAL) return;
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`GitHub release check failed: ${response.status}`);
    const release = await response.json();
    localStorage.setItem(CHECK_KEY, String(Date.now()));
    if (release.draft || release.prerelease || compareVersions(release.tag_name, CURRENT_VERSION) <= 0) return;
    const apk = release.assets?.find(asset => asset.name.toLowerCase().endsWith('.apk'));
    if (!apk?.browser_download_url) return;
    showUpdateDialog(release, apk);
  } catch (error) {
    // Update checks are non-blocking; offline use and reading must remain unaffected.
    console.info('[e-Moeslife] Pemeriksaan pembaruan dilewati:', error);
  }
}
