/** UI shell untuk pembaca E-Tahlil Digital. Dipasang langsung ke body agar layout layar penuh tetap terjaga. */
export function mountAppShell() {
  document.body.insertAdjacentHTML('afterbegin', `<header><div class="brand"><div class="seal">۞</div><div><h1>Notebook Tahlil Digital</h1><small>Kitab doa & zikir • edisi digital</small></div></div><nav class="header-actions" aria-label="Kontrol tampilan"><button class="header-btn icon-btn" id="contentsBtn" aria-label="Daftar isi" title="Daftar isi" aria-expanded="false"><span class="header-icon" aria-hidden="true">☰</span><span class="header-label">Daftar isi</span></button><label class="header-font-control" for="fontSize"><span class="header-icon" aria-hidden="true">Aa</span><span class="header-label">Ukuran teks</span><select id="fontSize" class="header-select" aria-label="Ukuran tulisan" title="Ukuran tulisan"><option value="small">A−</option><option value="normal" selected>A</option><option value="large">A+</option></select></label><button class="header-btn icon-btn" id="fullBtn" aria-label="Layar penuh" title="Layar penuh"><span class="header-icon" aria-hidden="true">⛶</span><span class="header-label">Layar penuh</span></button></nav></header>
<section id="homePage" class="home-page" aria-label="Beranda daftar isi">
  <div class="home-hero">
    <div class="hero-copy">
      <span class="home-kicker"><span class="kicker-dot"></span> RUANG BACA DIGITAL</span>
      <h2>Tenangkan hati,<br><em>mulai dengan zikir.</em></h2>
      <p>Temukan rangkaian tahlil, Surah Yasin, dan Ar-Rahman dalam satu ruang baca yang nyaman.</p>
      <button id="continueReadingBtn" class="continue-reading"><span class="continue-icon">↗</span><span><strong>Lanjutkan bacaan</strong><small id="continueReadingLabel">Mulai dari halaman pertama</small></span><span class="continue-arrow">→</span></button>
    </div>
    <div class="hero-art" aria-hidden="true"><div class="art-glow"></div><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-book"><div class="book-cover"><span class="cover-mark">۞</span><span class="cover-line"></span><span class="cover-title">كِتَابُ<br>الذِّكْرِ</span><span class="cover-caption">DOA • ZIKIR • TILAWAH</span><span class="cover-ornament">✦</span></div><div class="book-pages"></div></div><span class="floating-star star-a">✦</span><span class="floating-star star-b">✧</span><span class="art-caption">Baca dengan tenang</span></div>
  </div>
  <div class="home-section-heading"><div><span class="home-kicker">PILIHAN BACAAN</span><h3>Mulai perjalananmu</h3><p>Pilih bacaan yang ingin dibuka.</p></div><span class="section-count">04 KOLEKSI</span></div>
  <div class="collection-grid">
    <button class="collection-card collection-tahlil" data-home-target="tahlil"><span class="card-index">01 / DOA & ZIKIR</span><span class="collection-symbol" aria-hidden="true">📖</span><span class="collection-title">Rangkaian Tahlil</span><span class="collection-desc">Tawasul, kalimat tahlil, zikir, dan doa penutup.</span><span class="collection-bottom"><span class="collection-meta" id="tahlilMeta">Koleksi bacaan</span><span class="round-arrow">↗</span></span></button>
    <button class="collection-card collection-yasin" data-home-target="yasin"><span class="card-index">02 / AL-QUR’AN</span><span class="surah-number" aria-hidden="true">📖</span><span class="collection-title">Surah Yasin</span><span class="collection-desc">Buka Surah Yasin dan lanjutkan tilawah ayat demi ayat.</span><span class="collection-bottom"><span class="collection-meta">Surah ke-36</span><span class="round-arrow">↗</span></span></button>
    <button class="collection-card collection-rahman" data-home-target="rahman"><span class="card-index">03 / AL-QUR’AN</span><span class="surah-number" aria-hidden="true">📖</span><span class="collection-title">Surah Ar-Rahman</span><span class="collection-desc">Baca ayat-ayat Ar-Rahman dalam tampilan halaman yang nyaman.</span><span class="collection-bottom"><span class="collection-meta">Surah ke-55</span><span class="round-arrow">↗</span></span></button>
      <button class="collection-card collection-tahlil" data-home-target="dzikir"><span class="card-index">04 / ZIKIR HARIAN</span><span class="collection-symbol" aria-hidden="true">۞</span><span class="collection-title">Dzikir Ba'da Shalat</span><span class="collection-desc">Istighfar, dzikir, ayat pilihan, dan doa setelah shalat.</span><span class="collection-bottom"><span class="collection-meta">Koleksi bacaan</span><span class="round-arrow">↗</span></span></button>
  </div>
  <section class="home-index">
    <div class="home-section-heading index-heading"><div><span class="home-kicker">JELAJAHI ISI KITAB</span><h3>Daftar isi lengkap</h3><p>Langsung buka bagian bacaan pilihanmu.</p></div><label class="index-search"><span>⌕</span><input id="homeSearch" type="search" placeholder="Cari bacaan..." aria-label="Cari bacaan"></label></div>
    <div id="homeIndexList" class="home-index-list"></div>
    <p id="homeSearchEmpty" class="home-search-empty" hidden>Bacaan tidak ditemukan. Coba kata kunci lain.</p>
  </section>
  <div class="home-footnote"><span>۞</span><span>Ruang kecil untuk zikir dan ketenangan hati.</span></div>
</section>
<main id="readerMain">
<aside class="sidebar"><div class="toc-heading"><div><div class="eyebrow">Daftar isi</div><h2>Rangkaian Bacaan</h2></div><button class="soft-btn" id="closeContents" type="button">Tutup ✕</button></div><nav class="contents" id="contents"></nav><div class="progress"><div style="display:flex;justify-content:space-between"><span>Progres bacaan</span><b id="progressText">0%</b></div><div class="bar"><span id="progressBar"></span></div><p id="savedText">Posisi bacaan tersimpan di perangkat ini.</p></div></aside>
<section class="reader">

<div class="book"><article class="paper" id="paper"><h2 class="page-title" id="pageTitle"></h2><div class="title-divider" aria-hidden="true"></div><div class="arabic" id="arabicText" lang="ar" dir="rtl"></div><div class="page-note" id="pageNote">اقْرَؤُوا بِتَأَنٍّ وَحُضُورِ الْقَلْبِ</div><div class="page-number" id="pageNumber"></div></article></div>
<div class="controls"><button class="soft-btn nav-page" id="prevBtn" aria-label="Halaman sebelumnya">‹ Sebelumnya</button><button class="primary nav-page" id="nextBtn" aria-label="Halaman berikutnya">Berikutnya ›</button></div>
</section></main>
<footer id="readerFooter">Menemukan kesalahan pada lafadz atau ayat? <a class="report-link" href="https://wa.me/6289676707976?text=Assalamu%27alaikum%2C%20saya%20ingin%20melaporkan%20kesalahan%20lafadz%20atau%20ayat%20pada%20E-Tahlil%20Digital." target="_blank" rel="noopener noreferrer">Hubungi Kami!</a></footer>`);
}
