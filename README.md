# 🐴 Uma Trainer Finder

> **CLI sederhana untuk mencari dan mengurutkan data inheritance di game _Umamusume: Pretty Derby_.**

Uma Trainer Finder dibuat supaya kamu bisa dengan mudah melihat urutan pelatih berdasarkan rank, skor afinitas, kemenangan G1, white sparks, atau data terbaru — tanpa repot cari manual.

---

## 🚀 Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/RezkyRizaldi/uma-trainer-finder.git
cd uma-trainer-finder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Program

```bash
npm run build
```

### 4. Link CLI ke Sistem

```bash
npm run link-cli
```

> Setelah itu, kamu bisa langsung pakai perintah `uma-cli` di terminal tanpa perlu masuk ke folder proyek.

### 5. Jalankan Program

```bash
uma-cli [option]
```

#### 🔧 Opsi yang Tersedia

| Opsi              | Fungsi                                     |
| ----------------- | ------------------------------------------ |
| `--sort=rank`     | Urut berdasarkan parent rank (**default**) |
| `--sort=affinity` | Urut berdasarkan skor affinitas            |
| `--sort=win`      | Urut berdasarkan jumlah kemenangan G1      |
| `--sort=sparks`   | Urut berdasarkan jumlah white sparks       |
| `--sort=latest`   | Urut berdasarkan data terbaru              |
| `--help`, `-h`    | Menampilkan panduan penggunaan             |
| `--version`, `-v` | Menampilkan versi program                  |

## ⚠️ Catatan Penting

- Jika kamu masih pakai **Node.js versi < 18**, tambahkan `node-fetch` secara manual:

  ```bash
  npm install node-fetch
  ```

  dan di `src/api.ts` tambahkan:

  ```ts
  import 'node-fetch';
  ```

- Untuk **Node.js versi 18 ke atas**, `fetch` sudah tersedia secara bawaan.

- Kalau kamu mengubah kode, cukup jalankan lagi `npm run link-cli` untuk memperbarui link CLI-nya.
