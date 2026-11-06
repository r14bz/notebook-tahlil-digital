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
- Tersedia editor naskah dan ekspor/unduh JSON untuk membantu pemilik menyusun manuskrip sendiri.
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
- Dukungan Android melalui Capacitor serta pemeriksaan pembaruan aplikasi.
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

### Pekerjaan lanjutan
1. Lanjutkan menerima dan mengintegrasikan JSON kitab yang disusun pemilik proyek.
2. Audit struktur JSON per kitab dan perbaiki parser tanpa merusak sumber naskah.
3. Setelah seluruh kitab lokal lengkap dan disetujui, rencanakan penghapusan API kitab sementara.
4. Lanjutkan pengujian regresi PWA/offline dan tampilan mobile.
5. APK/native Android diuji pada tahap roadmap yang disetujui pemilik proyek; jangan memajukan pengujian APK tanpa diminta.

## 7. Cara menjalankan dan menguji

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

## 8. Aturan kerja wajib untuk agent berikutnya

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

## 9. Informasi teknis dan keamanan

- Nama paket: `e-moeslife`, versi pada `package.json`: `2.0.0`.
- Aplikasi mengandalkan penyimpanan lokal untuk preferensi dan progres bacaan. Jaga kompatibilitas key lama.
- Ahmad Sanusi API key (jika integrasi sementara masih dipakai) harus berada di environment variable server, bukan frontend atau APK.
- Jangan mencetak atau meminta pemilik membagikan secret dalam chat, commit, atau log publik.
- Periksa konfigurasi service worker setelah mengubah path/aset agar cache lama tidak menyajikan file usang.

## 10. Instruksi awal untuk agent penerus

Mulai dengan:
1. Baca README ini.
2. Checkout branch `feat/e-moeslife-v2` dan periksa commit terbaru di GitHub.
3. Periksa status Vercel dan jalankan `npm test` pada workspace yang aktif.
4. Tinjau perubahan terakhir sebelum mengerjakan permintaan baru.
5. Tanyakan/konfirmasi hanya bila keputusan dapat mengubah naskah, desain yang sudah disetujui, branch utama, atau production.

**Prioritas utama:** jaga naskah kitab yang disusun pemilik proyek, pertahankan semua fitur yang sudah disetujui, dan jangan mengubah production tanpa izin.
