const FONT_SIZES = Object.freeze(['small', 'normal', 'large']);

/** Terapkan tema dan simpan preferensinya. */
export function applyReaderTheme(theme, { body, button, writePreference }) {
  const isDark = theme === 'dark';
  body.classList.toggle('theme-dark', isDark);
  button.querySelector('.header-icon').textContent = isDark ? '☀' : '☾';
  button.querySelector('.header-label').textContent = isDark ? 'Mode terang' : 'Mode gelap';
  button.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  button.title = isDark ? 'Mode terang' : 'Mode gelap';
  writePreference('theme', isDark ? 'dark' : 'light');
  return isDark ? 'dark' : 'light';
}

/** Validasi ukuran teks, terapkan kelas tampilan, dan simpan preferensinya. */
export function applyReaderFontSize(value, { body, control, arabicText, writePreference }) {
  const safeValue = FONT_SIZES.includes(value) ? value : 'normal';
  control.value = safeValue;
  body.classList.remove('font-small', 'font-normal', 'font-large');
  body.classList.add('font-' + safeValue);
  arabicText.classList.toggle('compact', safeValue === 'small');
  writePreference('fontSize', safeValue);
  return safeValue;
}
