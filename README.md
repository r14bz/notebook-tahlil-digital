# e-Moeslife

**e-Moeslife** adalah ruang baca Islami digital yang menyajikan rangkaian tahlil, doa, zikir, Surah Yasin, Surah Ar-Rahman, dan Dzikir Ba'da Shalat dalam antarmuka bergaya kitab.

Website: https://e-moeslife.vercel.app

## Fitur saat ini
- Navigasi halaman dengan animasi membalik halaman dan gestur swipe.
- Daftar isi serta pencarian bacaan.
- Posisi bacaan dan preferensi tampilan tersimpan di perangkat.
- Mode terang/gelap dan pengaturan ukuran tulisan Arab.
- TTS Arab melalui suara yang tersedia di perangkat/browser.
- Audio qari untuk bagian yang didukung.
- Layout responsif untuk ponsel dan desktop.

## Identitas
- Nama produk: e-Moeslife
- Warna utama: mempertahankan palet hijau klasik dari desain awal.
- Logo: gunakan aset logo resmi yang disediakan pemilik proyek; jangan mengganti atau membuat ulang logo tanpa persetujuan.
- Nama aplikasi Android: e-Moeslife
- Android application ID: `id.emoeslife.app`

## Menjalankan website
Aplikasi web saat ini berupa HTML, CSS, dan JavaScript native tanpa bundler.

Untuk Vercel:
- Framework Preset: Other
- Build Command: kosong
- Output Directory: `.` (folder root)
- Root Directory: `.`

## Persiapan Android dengan Capacitor

Proyek ini sedang disiapkan agar website dapat dibungkus menjadi aplikasi Android menggunakan Capacitor. Folder Android native dibuat setelah dependensi dipasang.

Persyaratan:
- Node.js LTS
- npm
- Android Studio dan Android SDK untuk build APK

Langkah awal:

```bash
npm install
npm run prepare:mobile
npx cap add android
npx cap sync android
npx cap open android
```

Setelah mengubah file web:

```bash
npm run cap:sync
```

Kemudian build APK dari Android Studio melalui **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Catatan:
- Folder `www/` adalah hasil persiapan web untuk Capacitor dan tidak perlu di-commit.
- Folder `android/` berisi proyek native Android dan akan di-commit setelah platform Android dibuat.
- Jangan memasukkan signing key, password keystore, token, atau kredensial ke Git.
- Izin native seperti notifikasi, audio, penyimpanan, dan status bar perlu ditambahkan hanya jika fitur tersebut benar-benar digunakan dan sudah diuji.
- TTS Arab bergantung pada engine dan voice yang tersedia di perangkat. Audio qari membutuhkan koneksi internet.
- Periksa teks Al-Qur'an dan bacaan bersama sumber tepercaya/guru setempat.

## Kompatibilitas data
Key penyimpanan lokal lama yang diawali `etahlil-` sengaja dipertahankan sementara agar preferensi dan data bacaan pengguna dari versi sebelumnya tidak hilang setelah rebranding.
