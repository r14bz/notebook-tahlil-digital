import { headerMarkup } from './shell/header.js';
import { homePageMarkup } from './shell/home-page.js';
import { readerPageMarkup } from './shell/reader-page.js';
import { footerMarkup, disclaimerMarkup } from './shell/footer.js';

/** Merakit kerangka halaman; disclaimer beranda dan pembaca klasik memakai redaksi yang sama. */
export function mountAppShell() {
  const homeWithDisclaimer = homePageMarkup.replace(/<\/section>$/, disclaimerMarkup + '</section>');
  document.body.insertAdjacentHTML('afterbegin', [headerMarkup, homeWithDisclaimer, readerPageMarkup, footerMarkup].join(''));
}
