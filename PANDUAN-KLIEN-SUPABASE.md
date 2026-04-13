# Panduan Rahasia Sistem Agensi: Supabase Multi-Tenancy

Dokumentasi ini dibuat khusus untuk Anda selaku pemilik (Pemilik Agensi Undangan Digital) agar mudah memahami cara kerja sistem penyimpanan terpusat (Cloud).

## Konsep Dasar (Kekuatan Penuh Multi-Tenancy)
Sistem ini menggunakan teknik rahasia bernama **URL Parameter Binding**. Artinya, Anda hanya membutuhkan **SATU buah database (Supabase) dan SATU buah deployment website (misal di Vercel)** untuk melayani ratusan klien yang berbeda!

Daripada menyalin (Copy-Paste) seluruh folder project setiap mendapat klien baru, Anda cukup membedakan mereka lewat "Kata Kunci Ujung Tautan" yang disebut dengan ID Klien (`?id=`).

Contoh Pemanfaatan:
- **Klien 1 (Arya & Kiara)**
  ID yang disepakati: `aryakiara`
  Link yang dikasih ke mereka: `https://web-anda.vercel.app/?id=aryakiara`
- **Klien 2 (Budi & Siti)**
  ID yang disepakati: `budi-siti`
  Link yang dikasih ke mereka: `https://web-anda.vercel.app/?id=budi-siti`

Saat website mendeteksi akhiran tersebut, sistem akan langsung menyelam ke Supabase, menarik baris data milik klien tersebut, lalu memunculkannya. Ajaib, elegan, dan sangat instan!

---

## SOP: Apa yang Harus Dilakukan Saat Dapat Klien Baru?

Biasakan mengikuti 3 Langkah Baku ini setiap kali "Ada Klien Transfer Uang & Masuk Pesanan":

### Langkah 1: Buat KTP ID Unik Untuk Klien
Tentukan satu kata sandi gabungan yang unik (tanpa spasi).
**Contoh**: `nanda-reza`

### Langkah 2: Buka Kunci Panel Dasbor Anda
Buka alat kemudi (Dashboard Admin) Anda dan langsung tambahkan ID yang telah Anda buat di belakang `URL` nya.
**Ketik di Browser Anda**:
`http://web-anda.vercel.app/admin.html?id=nanda-reza`

👉 Di momen saat Anda menekan **Enter** di atas URL tersebut, sistem secara rahasia langsung membuat "lahan kosong" di Supabase atas nama `nanda-reza` dan siap untuk Anda ukir.

### Langkah 3: Isi Formulir Dasbor Tanpa Masuk Kode 
Seketika halaman Dashboard terbuka, masuklah ke tab **Info Pernikahan**, isikan semua teks/foto mereka lalu tekan tombol **💾 Simpan**.
*BUM!* Semua data klien tersebut berhasil mendarat selamat ke Supabase.

### Langkah 4: Penyerahan ke Klien Siap Launching!
Setorkan link Undangan utamanya ke WhatsApp Sang Pengantin.
**Berikan tautan ini**:
`https://web-anda.vercel.app/?id=nanda-reza`

Selesai. Anda tak perlu berurusan lagi dengan `git commit` massal, terminal *Vscode*, Vercel config, ataupun *Hosting File*. Cukup mainkan `Url Parameter` seperti sutradara ulung.

> **Catatan Darurat**: Jika ada staf Anda atau seseorang yang tak sengaja membuka tautan polosan tanpa ID di ujung (`https://web-anda.vercel.app/`), website **tidak akan jebol**, mereka akan diarahkan secara pintar ke Laman Demo Profil Bawaan milik Sistem. Merdeka!
