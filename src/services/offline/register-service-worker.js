/** Registrasi PWA hanya pada browser; aplikasi Capacitor memakai aset lokal. */
export async function registerOfflineSupport() {
  const isNativeApp = window.Capacitor?.isNativePlatform?.() === true;
  const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(location.hostname);

  // Capacitor Android normally serves its bundled assets from http://localhost.
  // Do not let a browser service worker cache or shadow the APK's bundled files.
  if (
    !('serviceWorker' in navigator) ||
    location.protocol === 'file:' ||
    isNativeApp ||
    isLocalDevelopment
  ) return false;

  try {
    const hadController = Boolean(navigator.serviceWorker.controller);

    // A newly activated worker can otherwise serve a different app version to
    // a page whose JavaScript modules were already loaded by the previous worker.
    if (hadController) {
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      }, { once: true });
    }

    await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    return true;
  } catch (error) {
    console.warn('e-Moeslife offline support could not be registered:', error);
    return false;
  }
}
