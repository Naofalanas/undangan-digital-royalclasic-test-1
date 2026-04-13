# 📖 Panduan Lengkap: Mengelola Klien Undangan Digital

> Dokumen ini adalah SOP (Standard Operating Procedure) resmi untuk menambahkan dan mengelola klien baru menggunakan **1 Project Supabase + 1 Website Vercel** yang sama.

---

## 🧠 Konsep Dasar

Anda hanya punya **1 website** dan **1 database**. Yang membedakan tiap klien adalah **kode ID unik** di ujung URL.

Contoh nyata:
- Klien A (Ryan & Siti): `https://undangan-anda.vercel.app/?id=ryan-siti`
- Klien B (Budi & Rina): `https://undangan-anda.vercel.app/?id=budi-rina`
- Klien C (Andi & Mega): `https://undangan-anda.vercel.app/?id=andi-mega`

Semua menggunakan website yang **sama persis**, tapi datanya **berbeda-beda** karena masing-masing punya baris sendiri di database Supabase.

---

## 🆕 SOP: Ada Klien Baru Masuk (Step-by-Step)

### Langkah 1: Tentukan ID Klien
Buat kode unik untuk klien baru. Aturannya:
- Huruf kecil semua
- Tanpa spasi (gunakan strip `-` sebagai pemisah)
- Gabungan nama mempelai pria & wanita

**Contoh:**
- `ryan-siti`
- `andi-mega`
- `fajar-dewi`

---

### Langkah 2: Buka Dashboard Admin dengan ID Tersebut
Ketik URL ini di browser Anda (ganti `xxx` dengan ID klien):

```
https://undangan-anda.vercel.app/admin.html?id=ryan-siti
```

> ⚡ **Yang terjadi di balik layar:** Sistem otomatis mengecek apakah `ryan-siti` sudah ada di database. Jika **belum ada**, sistem langsung membuat baris baru secara otomatis. Anda akan melihat notifikasi hijau: *"✅ Klien ryan-siti berhasil didaftarkan!"*

---

### Langkah 3: Isi semua Data Klien
Setelah dashboard terbuka, isi semua tab satu per satu:

| Tab | Yang Diisi |
|-----|-----------|
| **Info Pernikahan** | Nama mempelai, tanggal akad & resepsi, lokasi, URL musik, quote |
| **Daftar Tamu** | Nama-nama tamu undangan (untuk personalisasi link) |
| **Galeri** | URL foto-foto prewedding klien |
| **Love Story** | Timeline perjalanan cinta mereka |

Setiap kali Anda klik **💾 Simpan**, data langsung **terbang ke Supabase** secara otomatis.

---

### Langkah 4: Preview Hasil
Buka tab baru di browser dan ketik:

```
https://undangan-anda.vercel.app/?id=ryan-siti
```

Anda akan melihat undangan yang sudah terisi data klien tersebut. Cek semua bagian: Cover, Profil Mempelai, Galeri, Countdown, dll.

---

### Langkah 5: Kirim Link ke Klien
Serahkan link final ke WhatsApp klien:

**Link undangan umum (tanpa nama tamu):**
```
https://undangan-anda.vercel.app/?id=ryan-siti
```

**Link undangan personal (dengan nama tamu):**
```
https://undangan-anda.vercel.app/?id=ryan-siti&to=Pak+Joko
```

---

## 📊 Cara Cek Data Klien di Database

### Via Dashboard Supabase (Rekomendasi)
1. Buka [supabase.com](https://supabase.com) → Login
2. Pilih project Anda
3. Klik menu **Table Editor** (ikon tabel di sidebar kiri)
4. Klik tabel **`wedding_invitations`**
5. Anda akan melihat semua klien dalam format tabel:

| client_id | settings | guests | wishes | gallery | created_at |
|-----------|----------|--------|--------|---------|------------|
| ryan-siti | {...} | [...] | [...] | [...] | 2026-04-13 |
| budi-rina | {...} | [...] | [...] | [...] | 2026-04-14 |

---

## ✏️ Cara Edit Data Klien yang Sudah Ada

Tinggal buka lagi dashboard admin dengan ID klien yang sama:

```
https://undangan-anda.vercel.app/admin.html?id=ryan-siti
```

Data klien akan otomatis dimuat dari Cloud. Edit apa yang perlu diubah, lalu klik **Simpan** lagi.

---

## 🗑️ Cara Hapus Klien

1. Buka **Table Editor** di Supabase
2. Cari baris klien yang ingin dihapus
3. Klik baris tersebut → klik tombol **Delete** (ikon tong sampah)
4. Selesai. Link undangan klien tersebut otomatis mati.

---

## ⚠️ Hal-Hal Penting

1. **JANGAN** lupa menambahkan `?id=xxx` di URL. Tanpa parameter ini, website akan menampilkan data default (demo).
2. **ID harus unik** per klien. Jangan pakai ID yang sama untuk 2 klien berbeda.
3. **Jangan hapus** tabel `wedding_invitations` di Supabase. Semua data klien ada di sana.
4. **Kapasitas gratis** Supabase: ±4.000 klien dan ±200 klien aktif/bulan.
5. **Foto & musik** tidak disimpan di Supabase. Yang disimpan hanya URL-nya. Pastikan link foto/musik tetap aktif (gunakan Dropbox atau hosting sendiri).

---

## 🔄 Ringkasan Alur Kerja

```
Klien Transfer Uang
       ↓
Tentukan ID (misal: ryan-siti)
       ↓
Buka admin.html?id=ryan-siti → Isi data → Simpan
       ↓
Preview di index.html?id=ryan-siti → Cek hasil
       ↓
Kirim link ke klien via WhatsApp
       ↓
Selesai! 🎉
```
