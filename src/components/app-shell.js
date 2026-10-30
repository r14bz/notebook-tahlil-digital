import { headerMarkup } from './shell/header.js';
import { homePageMarkup } from './shell/home-page.js';
import { readerPageMarkup } from './shell/reader-page.js';
import { footerMarkup } from './shell/footer.js';

/** Merakit kerangka halaman dari komponen terpisah; tidak menyimpan markup halaman di satu file. */
export function mountAppShell() {
  document.body.insertAdjacentHTML('afterbegin', [headerMarkup, homePageMarkup, readerPageMarkup, footerMarkup].join(''));
}
