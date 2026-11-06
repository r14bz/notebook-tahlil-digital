# e-Moeslife — Project Handoff

Dokumen ini adalah ringkasan teknis dan status proyek untuk agent AI/developer yang akan melanjutkan pengembangan e-Moeslife. **Baca dokumen ini sebelum mengubah kode.**

## 1. Tautan dan lokasi kerja

| Item | Detail |
|---|---|
| Repository | https://github.com/r14bz/notebook-tahlil-digital |
| Website production | https://e-moeslife.vercel.app |
| Branch aktif pengembangan | [`feat/e-moeslife-v2`](https://github.com/r14bz/notebook-tahlil-digital/tree/feat/e-moeslife-v2) |
| File ini | [README.md](https://github.com/r14bz/notebook-tahlil-digital/blob/feat/e-moeslife-v2/README.md) |
| Status deployment terakhir yang diverifikasi | [Vercel deployment](https://vercel.com/hackerzfacebug-6840s-projects/notebook-tahlil-digital/F97VnDLdutbAph8mntmy39YPBbkr) |
| Commit terakhir yang diverifikasi | [`cc3618f`](https://github.com/r14bz/notebook-tahlil-digital/commit/cc3618f6ed4bb41358179df3e909523f49d39c91) |

**Status saat handoff:** commit `cc3618f` berstatus Vercel **Success**. Ini hanya memastikan deployment selesai; perubahan tampilan terbaru tetap perlu diuji langsung oleh pemilik proyek di preview/perangkat.

**Pembaruan setelah audit kode (7 November 2026):** branch ini memuat perbaikan sesudah `cc3618f` (lihat bagian 12). Jalankan `git log` untuk SHA terbaru. Status Vercel untuk commit tersebut dan hasil uji perangkat belum dicatat di sini; isi setelah diverifikasi pemilik proyek.

## 2. Gambaran proyek

e-Moeslife adalah aplikasi baca Islami digital dengan tampilan terinspirasi kitab klasik: warna hijau, emas, dan kertas krem. Aplikasi dirancang mobile-first, responsif, local-first, dan mendukung pengalaman membaca tanpa koneksi untuk konten/aset yang sudah tersedia secara lokal.

Aplikasi web menggunakan HTML, CSS, dan JavaScript native berbasis ES modules. Proyek tidak menggunakan framework frontend atau bundler sebagai syarat deployment web.

## 3. Fitur dan modul

### Pembaca dan koleksi
- Koleksi utama: Tahlil, Dzikir, Yasin, dan Ar-Rahman.
- Koleksi Al-Qur'an Digital dan Murattal berada pada area khusus dengan pemutar audio.
- Perpustakaan Kitab Kuning menampilkan kitab dari JSON lokal dan, sementara proses migrasi berlangsung, katalog/API untuk kitab yang belum tersedia secara lokal.
- Pembaca klasik menggunakan navigasi halaman, daftar isi, pencarian, swipe, progres/posisi bacaan, dan preferensi tampilan.
- Preferensi mode terang/gelap dan ukuran huruf disimpan secara lokal.

### Audio
- **Pemutar audio/TTS pada pembaca klasik sudah dihilangkan**, termasuk tombol “Bacakan” pada Yasin dan Ar-Rahman.
- Pemutar audio dipertahankan khusus pada koleksi **Al-Qur'an Digital & Murattal**.
- Jangan mengembalikan kontrol audio ke pembaca Tahlil/Yasin/Ar-Rahman/Dzikir tanpa instruksi eksplisit pemilik proyek.

### Perpustakaan Kitab Kuning
- Naskah kitab lokal dibaca dari folder `data/`.
- Pembaca mendukung bagian/bab, teks Arab, Latin, dan terjemahan sesuai struktur JSON yang dikenali.
- Tersedia editor naskah dan ekspor/unduh JSON untuk membantu pemilik menyusun manuskrip sendiri. Penyimpanan editor ditunda sekitar 800 ms setelah berhenti mengetik dan dipaksa saat keluar dari editor atau aplikasi disembunyikan.
- Salinan lokal hasil editor (localStorage `e-moeslife:kitab-manual:v1:<slug>`) hanya dipakai jika waktu edit terakhirnya lebih baru daripada `updatedAt` pada file di `data/`. Jika naskah di server lebih baru, salinan lokal diarsipkan ke kunci `...:backup` (tidak dihapus) dan naskah server dipakai. Daftar bab menampilkan pemberitahuan dan tombol "Pakai naskah asli" saat salinan lokal sedang aktif.
- Bab besar dirender bertahap saat pembaca menggulir (potongan sekitar 4.000 karakter pada batas paragraf, gelombang sekitar 8.000 karakter). Penggabungan potongan harus selalu sama persis dengan teks sumber; ini diuji pada seluruh file `data/`. Pencarian "cari di halaman" milik browser hanya menemukan teks yang sudah dimuat.
- Navigasi bab mengambang: Daftar Bab, Bab Sebelumnya, Bab Selanjutnya.
- Panel navigasi saat ini menggunakan latar solid agar mudah dibaca; ruang bawah halaman dipertahankan supaya navigasi tidak menutupi teks.
- Kitab lokal yang sudah terdaftar di katalog antara lain Safinah An-Najah, Aqidatul Awam, Arba'in Nawawi, Bidayatul Hidayah, Bulughul Maram, Futuhul Ghaib, Fathul Izar, Tafsir Jalalain, Shahih Muslim, Muwatta Imam Malik, Fathul Qarib, Ta'lim Al-Muta'allim, Qurrotul Uyun, dan Al-Hikam. **Periksa folder `data/` untuk file aktual dan status kelengkapan masing-masing.**

### Preferensi ukuran huruf
- Kontrol ukuran huruf menyimpan pilihan `small`, `normal`, atau `large`.
- Perbaikan terbaru memperluas CSS agar pengaturan juga memengaruhi pembaca Al-Qur'an, pembaca kitab API, dan pembaca kitab JSON lokal, termasuk terjemahan.
- Perbaikan ini baru selesai dideploy; pemilik proyek masih perlu memvalidasi ukuran huruf pada beberapa jenis koleksi dan tema.

### Fitur aplikasi lainnya
- Banner waktu salat dengan jam/countdown dan jadwal Subuh, Dzuhur, Ashar, Magrib, Isya.
- Lokasi menggunakan GPS bila diizinkan, dengan fallback Jakarta.
- Dukungan PWA/service worker dan kemampuan offline untuk aset/konten yang telah tersimpan.
- Halaman unduhan aplikasi: https://e-moeslife.vercel.app/download.html
- Dukungan Android melalui Capacitor serta fondasi pemeriksaan pembaruan aplikasi. Target roadmap: pembaruan APK v1 ke v2 dan versi berikutnya melalui mekanisme update in-app.
- Identitas aplikasi Android: `id.emoeslife.app`.

## 4. Struktur kode penting

| Lokasi | Fungsi |
|---|---|
| `src/app.js` | Entry point; merakit shell, reader, koleksi, library, prayer times, offline, dan update check |
| `src/components/shell/` | Markup shell: header, home, reader, footer |
| `src/features/reader/` | Navigasi, pagination, konten, preferensi tampilan, gestures, controller |
| `src/features/library/equran-library.js` | Al-Qur'an digital, Murattal, dan integrasi library terkait |
| `src/features/library/local-kitab-library.js` | Katalog dan pembaca kitab JSON lokal |
| `src/features/reader/appearance.js` | Mode terang/gelap dan logika ukuran huruf |
| `src/styles/app.css` | Styling utama, termasuk skala ukuran huruf lintas reader |
| `data/` | Sumber manuskrip kitab JSON lokal |
| `api/kitab.js` | Proxy server-side untuk API kitab sementara |
| `tests/modules.test.js` | Pengujian unit/modul |
| `scripts/` | Skrip persiapan web/Capacitor dan tooling proyek |

Jaga modularitas. Hindari menumpuk seluruh logika kembali ke `src/app.js`.

## 5. Sumber data kitab dan arah migrasi

- Pemilik proyek sedang menyusun dan mengunggah file JSON kitab sendiri ke folder `data/`.
- JSON yang disusun pemilik proyek adalah sumber naskah yang harus diprioritaskan. Jangan menyimpulkan suatu file kosong hanya dari preview/API yang tidak menampilkan isi; periksa file JSON aktual dan struktur lengkapnya.
- Beberapa kitab sebelumnya berasal dari Ahmad Sanusi Open API melalui proxy `/api/kitab`; integrasi ini bersifat sementara selama migrasi.
- Setelah semua kitab selesai disusun dan diunggah, target pemilik proyek adalah **menghentikan ketergantungan pada API kitab** dan menggunakan JSON lokal sebagai sumber data.
- Jangan menghapus API atau fallback yang masih dibutuhkan sebelum pemilik menyatakan migrasi semua kitab selesai.
- Jangan mengubah, menormalisasi secara destruktif, atau menimpa isi manuskrip Arab/terjemahan tanpa persetujuan. Pertahankan teks Arab, harakat, tanda baca, urutan, dan line break.
- Perhatikan bahwa struktur JSON antarkitab dapat berbeda. Parser perlu toleran, tetapi jangan sampai salah menganggap teks Arab sebagai terjemahan atau sebaliknya.

## 6. Status progres

### Selesai / sudah diimplementasikan
- Rebrand menjadi e-Moeslife dan identitas aplikasi.
- PWA dan dukungan offline dasar.
- Banner waktu salat dan fallback lokasi.
- Halaman unduhan aplikasi Android dan alur update-check.
- Integrasi katalog/pembaca kitab lokal serta editor/ekspor JSON.
- Pemisahan pemutar audio: audio hanya pada Al-Qur'an & Murattal, bukan pembaca klasik.
- Navigasi bab kitab dengan ruang bawah naskah dan panel solid.
- Perluasan aturan ukuran huruf ke reader Al-Qur'an dan kitab.

### Perlu diuji pemilik proyek
- Uji ukuran huruf small/normal/large pada Tahlil, Yasin, Ar-Rahman, Dzikir Ba'da Shalat, Al-Qur'an, dan beberapa kitab JSON lokal.
- Pastikan teks Arab, Latin, dan terjemahan ikut berubah ukuran dengan benar pada layar ponsel.
- Uji navigasi bab, tombol Bab Selanjutnya (kontras teks), dan pastikan navigasi tidak menutupi akhir naskah.
- Uji pemutar audio di koleksi Al-Qur'an & Murattal; pastikan tidak muncul pada koleksi klasik.
- Uji file JSON kitab yang baru diunggah dan pastikan bab, teks Arab, serta terjemahan terbaca benar.
- Uji preview Vercel sebelum perubahan berikutnya digabung ke branch utama.
- Uji gulir bab besar (misalnya Shahih Muslim "Haji"/"Iman", Tafsir Jalalain Al-Baqarah): bab terbuka cepat, lanjutan teks muncul sebelum ujung, tidak ada lompatan, dan pindah bab selalu mulai dari atas.
- Uji editor kitab: setelah menyunting dan kembali, pemberitahuan salinan lokal tampil; tombol "Pakai naskah asli" mengembalikan naskah server.
- Uji offline: kitab yang pernah dibuka tetap terbaca tanpa internet, dan naskah JSON yang baru diunggah muncul saat online tanpa menaikkan `CACHE_NAME`.
- Uji jadwal salat dengan lokasi di Kalimantan Selatan (WITA) dan Maluku/Maluku Utara (WIT).

### Pekerjaan lanjutan

0. Masalah terbuka dari audit kode: lihat bagian 12.
1. Lanjutkan menerima dan mengintegrasikan JSON kitab yang disusun pemilik proyek.
2. Audit struktur JSON per kitab dan perbaiki parser tanpa merusak sumber naskah.
3. Setelah seluruh kitab lokal lengkap dan disetujui, rencanakan penghapusan API kitab sementara.
4. Lanjutkan pengujian regresi PWA/offline dan tampilan mobile.
5. Selesaikan dan uji sistem pembaruan otomatis APK Android, termasuk jalur upgrade dari v1 ke v2 dan versi-versi berikutnya.
6. APK/native Android diuji pada tahap roadmap yang disetujui pemilik proyek; jangan memajukan pengujian APK tanpa diminta.

## 7. Roadmap pengembangan

Roadmap berikut adalah urutan target kerja. Status dapat berubah setelah hasil pengujian pemilik proyek dikonfirmasi.

| Tahap | Target | Status |
|---|---|---|
| 1. Fondasi dan rebranding | Identitas e-Moeslife, PWA, struktur aplikasi, deployment Vercel, fondasi Android/Capacitor | Selesai |
| 2. Pembaca digital | Navigasi halaman, daftar isi, pencarian, progres bacaan, tema, ukuran huruf, offline | Implementasi utama selesai; audit lintas-reader berlanjut |
| 3. Koleksi | Tahlil, Dzikir Ba'da Shalat, Yasin, Ar-Rahman, Al-Qur'an & Murattal, Perpustakaan Kitab Kuning | Sebagian besar selesai; validasi konten berlanjut |
| 4. Migrasi kitab JSON lokal | Integrasi seluruh manuskrip buatan pemilik, validasi teks Arab/harakat/terjemahan/bab, lalu penghentian API kitab setelah disetujui | Sedang berjalan |
| 5. Audit dan stabilisasi | Uji ukuran huruf seluruh reader, navigasi, audio, tema, offline, responsivitas, dan regresi | Belum selesai |
| 6. Sistem update APK | Upgrade v1 → v2 → versi berikutnya; cek versi baru, notifikasi, unduh APK resmi, verifikasi kompatibilitas, dan alur instalasi pembaruan | Target wajib; perlu implementasi/verifikasi menyeluruh |
| 7. Uji Android final | Build release, uji instalasi baru dan upgrade dari versi lama, data/progres bacaan, offline, izin, dan perangkat nyata | Menunggu tahap sebelumnya |
| 8. Persiapan rilis | Audit akhir, persetujuan pemilik, merge ke main, deployment production, dan publikasi APK | Belum dimulai |

### Persyaratan khusus: pembaruan otomatis APK v1 ke versi berikutnya

Fitur ini adalah **target utama roadmap Android**. Maksud “otomatis” adalah aplikasi memeriksa pembaruan, memberi tahu pengguna, mengambil APK versi baru dari sumber resmi, lalu memandu pemasangan update. Android pada umumnya tetap menampilkan konfirmasi/prompt pemasangan; jangan menjanjikan instalasi diam-diam tanpa interaksi pengguna.

Checklist implementasi dan pengujian:
- [ ] Aplikasi v1 yang sudah terpasang dapat mendeteksi bahwa versi lebih baru tersedia.
- [ ] Sediakan endpoint/manifest versi yang stabil berisi versi terbaru, versionCode, URL APK, catatan rilis, dan checksum (misalnya SHA-256).
- [ ] Tampilkan notifikasi/prompt yang jelas, termasuk pilihan untuk mengunduh sekarang atau nanti.
- [ ] Unduh APK dari URL HTTPS resmi; validasi checksum sebelum membuka installer.
- [ ] Buka Android Package Installer untuk menyelesaikan pembaruan dengan persetujuan pengguna dan tangani izin “install unknown apps” bila diperlukan.
- [ ] Pastikan applicationId/package name tetap id.emoeslife.app, sertifikat penandatanganan konsisten dengan APK v1, dan versionCode selalu meningkat agar Android menerima update in-place.
- [ ] Pastikan pembaruan mempertahankan data aplikasi, preferensi, dan progres bacaan; jangan menghapus data atau mengganti identitas aplikasi.
- [ ] Tangani kondisi gagal: jaringan terputus, unduhan tidak lengkap, checksum salah, ruang penyimpanan tidak cukup, APK tidak kompatibel, atau pengguna membatalkan instalasi.
- [ ] Uji jalur nyata APK v1 terpasang → update ke v2 → update ke v3/versi berikutnya, bukan hanya instalasi bersih.
- [ ] Dokumentasikan cara menerbitkan versi baru: menaikkan version/versionCode, membangun APK dengan signing key yang sama, mengunggah APK, memperbarui manifest, dan memverifikasi update dari perangkat.

Catatan platform: Android membatasi pemasangan aplikasi tanpa interaksi pengguna. Implementasi harus mengikuti mekanisme installer Android yang sah dan tidak boleh mengklaim bisa memasang APK sepenuhnya diam-diam.

## 8. Cara menjalankan dan menguji

Persyaratan: Node.js dan npm.

```bash
npm install
npm test
```

Script yang tersedia pada `package.json`:
- `npm test` — menjalankan test suite Node.js.
- `npm run prepare:mobile` — menyiapkan output web untuk Capacitor.
- `npm run cap:sync` — menyiapkan web lalu menjalankan Capacitor sync.
- `npm run cap:add:android` — menambahkan platform Android.
- `npm run cap:open:android` — membuka proyek Android.

Konfigurasi Vercel web:
- Framework Preset: **Other**
- Root Directory: `.`
- Build Command: kosong
- Output Directory: `.`

Catatan: jangan menyimpulkan test suite lulus hanya karena deployment Vercel berhasil. Jalankan `npm test` dan laporkan hasil aktual.

## 9. Aturan kerja wajib untuk agent berikutnya

1. **Kerjakan hanya di branch `feat/e-moeslife-v2`.**
2. Jangan mengubah `main`, membuat merge, atau mengubah production tanpa persetujuan eksplisit pemilik proyek.
3. Selalu fetch versi file terbaru sebelum mengedit; jangan menimpa perubahan yang baru saja dibuat pemilik proyek.
4. Buat perubahan kecil dan terarah. Setelah mengubah kode, jalankan test yang relevan dan periksa status deployment.
5. Laporkan commit SHA, file yang berubah, hasil test, dan status Vercel secara jujur. Bedakan status `Pending`, `Success`, dan `Failure`.
6. Jangan mengklaim sudah menguji UI/perangkat jika hanya membaca kode atau melihat status deployment.
7. Jangan membuat folder `public/` baru. Pemilik proyek pernah mengalami masalah 404 terkait perubahan struktur folder tersebut.
8. Jangan mengubah logo/aset identitas, teks ibadah, atau isi manuskrip tanpa persetujuan.
9. Jangan memasukkan API key, token, password, signing key, atau keystore ke Git. Environment variable rahasia dikelola melalui Vercel/GitHub Secrets.
10. Jangan merge ke `main` atau melakukan rilis APK sebelum diminta.

## 10. Informasi teknis dan keamanan

- Nama paket: `e-moeslife`, versi pada `package.json`: `2.0.0`.
- Aplikasi mengandalkan penyimpanan lokal untuk preferensi dan progres bacaan. Jaga kompatibilitas key lama.
- Ahmad Sanusi API key (jika integrasi sementara masih dipakai) harus berada di environment variable server, bukan frontend atau APK.
- Jangan mencetak atau meminta pemilik membagikan secret dalam chat, commit, atau log publik.
- Periksa konfigurasi service worker setelah mengubah path/aset agar cache lama tidak menyajikan file usang.
- Kebijakan cache service worker: `data/*`, `etahlil-pembagian-halaman-dzikir.json`, dan `src/data/dzikir-overrides.json` memakai network-first (batas tunggu 4 detik, lalu cache). Seluruh aset lain (JS, CSS, gambar) tetap cache-first, sehingga **naikkan `CACHE_NAME` di `service-worker.js` setiap kali file JS/CSS/aset berubah**. Nilai saat ini: `e-moeslife-shell-v14`.

## 11. Instruksi awal untuk agent penerus

Mulai dengan:
1. Baca README ini.
2. Checkout branch `feat/e-moeslife-v2` dan periksa commit terbaru di GitHub.
3. Periksa status Vercel dan jalankan `npm test` pada workspace yang aktif.
4. Tinjau perubahan terakhir sebelum mengerjakan permintaan baru.
5. Tanyakan/konfirmasi hanya bila keputusan dapat mengubah naskah, desain yang sudah disetujui, branch utama, atau production.

**Prioritas utama:** jaga naskah kitab yang disusun pemilik proyek, pertahankan semua fitur yang sudah disetujui, dan jangan mengubah production tanpa izin.

## 12. Catatan audit kode (7 November 2026)

Audit dilakukan pada salinan zip branch ini. `npm test` pada salinan kerja audit: **29 lulus, 0 gagal**. Hasil ini belum menggantikan uji di perangkat atau status Vercel.

### Sudah diperbaiki

- Test audio gagal karena `playQari()` bersifat async tetapi tidak di-`await`. Test kini lulus.
- Zona waktu hasil GPS memakai garis bujur sehingga keliru untuk Kalimantan Selatan (seharusnya WITA) dan Maluku/Maluku Utara (seharusnya WIT). Kini ditentukan per provinsi lewat `getZoneForProvince()`; bujur hanya cadangan.
- Pindah bab di pembaca kitab lokal tidak menggulir ke atas. Kini selalu mulai dari atas.
- Service worker menyajikan data kitab dan file layout dari cache tanpa pernah memeriksa pembaruan. Kini network-first untuk file tersebut.
- Salinan lokal editor menimpa file `data/` selamanya, dan editor menyimpan seluruh kitab di setiap ketikan. Kini naskah server yang lebih baru menang, dan penyimpanan ditunda.
- Bab sangat besar dirender sebagai satu paragraf (Shahih Muslim "Haji": sekitar 312 ribu karakter Arab dan 403 ribu terjemahan). Kini dirender bertahap.

### Masalah terbuka

- Jika pembaruan jadwal salat gagal saat pergantian hari, jadwal kemarin tetap tampil (`activeDateKey` diperbarui sebelum pembaruan berhasil). Hitung mundur setelah Isya memakai waktu Subuh hari ini, bukan besok (selisih beberapa menit).
- `CURRENT_VERSION` di `src/services/app-update.js` dan `versionCode 2`/`versionName 2.0.0` di `.github/workflows/build-android-apk.yml` ditulis keras dan harus diubah manual setiap rilis. Pengecekan checksum APK belum ada (target roadmap tahap 6).
- Tidak ada `package-lock.json`; build memakai `npm install` sehingga versi dependensi tidak terkunci.
- `src/features/reader/audio.js` tidak diimpor oleh `app.js` (audio pembaca klasik sudah dihilangkan) tetapi masih ada di precache service worker dan test. Hapus hanya setelah pemilik menyetujui.
- `/api/kitab` memakai path absolut sehingga tidak berfungsi di APK (tanpa server). Aman selama seluruh kitab lokal; hapus bersama API sementara.
- Struktur data yang perlu keputusan pemilik: Aqidatul Awam hanya 3 bagian (nazham Arab, terjemah, dan syarah sekitar 117 ribu karakter terpisah); Bidayatul Hidayah memiliki 16 dari 18 bab tanpa teks Arab; Qurrotul Uyun memiliki 2 bab tanpa Arab. Pembaca menampilkan seluruh Arab dahulu lalu seluruh terjemahan; belum ada pemasangan per hadis.
- File JSON dari editor berawalan BOM. Browser menanganinya, tetapi `JSON.parse` di Node gagal kecuali BOM dibuang (skrip validasi sudah membuangnya).
- Koordinat pengguna dikirim ke layanan pihak ketiga (bigdatacloud.net) untuk geocoding saat deteksi lokasi; pertimbangkan menyebutkannya di kebijakan privasi.
- Data API jadwal salat disisipkan lewat `innerHTML` pada beberapa tempat; risiko rendah, tetapi sebaiknya diganti `textContent`.
