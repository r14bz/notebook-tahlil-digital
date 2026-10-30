/** Registrasi PWA hanya pada browser; Capacitor memakai aset lokal dan tidak memerlukan service worker. */
export async function registerOfflineSupport() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return false;
  try {
    await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    return true;
  } catch (error) {
    console.warn('e-Moeslife offline support could not be registered:', error);
    return false;
  }
}
