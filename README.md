# Uma Trainer Finder

CLI sederhana untuk mencari data inheritance pada game **Umamusume: Pretty Derby**.

---

## 🚀 Instalasi & Menjalankan

1. **Clone**
   ```bash
   git clone https://github.com/RezkyRizaldi/uma-trainer-finder.git
   cd uma-trainer-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   (sudah ada dependensi `typescript` dan `ts-node` di `package.json`).

3. **Menjalankan langsung dengan ts-node**
   ```bash
   npm run dev
   ```

4. **Menjalankan dengan flag sorting**
   Kamu bisa menggunakan flag `--sort` untuk menentukan metode pengurutan:
   - `rank` → urut berdasarkan parent rank (default)
   - `win` → urut berdasarkan jumlah kemenangan G1
   - `sparks` → urut berdasarkan jumlah white sparks
   - `latest` → urut berdasarkan data terbaru

   Jalankan dengan:
   ```bash
   node src/index.ts --sort=rank
   node src/index.ts --sort=win
   node src/index.ts --sort=sparks
   node src/index.ts --sort=latest
   ```

   Atau gunakan shortcut script yang sudah tersedia di `package.json`:
   ```bash
   npm run dev:rank
   npm run dev:win
   npm run dev:sparks
   npm run dev:latest
   ```
   (Gunakan `--help` atau `-h` untuk memuat halaman bantuan)

5. **Build & Jalankan hasil kompilasi**
   ```bash
   npm run build
   npm start
   ```

---

## ⚠️ Catatan
- Jika menggunakan **Node < 18**, pasang `node-fetch` secara manual:
  ```bash
  npm install node-fetch
  ```
  lalu import di `src/api.ts`.
- Untuk Node.js modern (≥ 18), `fetch` sudah tersedia secara bawaan.

---
