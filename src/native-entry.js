import { Geolocation } from '@capacitor/geolocation';

// Expose the native plugin before the shared app initializes prayer-time detection.
window.CapacitorGeolocation = Geolocation;
await import('./app.js');
