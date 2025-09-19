# Uma CLI

CLI sederhana untuk mencari data inheritance Uma Musume: Pretty Derby.

---

## 🚀 Instalasi & Menjalankan

1. **Pasang dependencies dev**
   ```bash
   npm install
   ```
   (sudah ada dependensi `typescript` dan `ts-node` di `package.json`).

2. **Menjalankan langsung dengan ts-node**
   ```bash
   npm run dev
   ```

3. **Menjalankan dengan flag sorting**
   Kamu bisa menggunakan flag `--sort` untuk menentukan metode pengurutan:
   - `rank` → urut berdasarkan parent rank (default)
   - `win` → urut berdasarkan jumlah kemenangan G1
   - `sparks` → urut berdasarkan jumlah white sparks
   - `latest` → urut berdasarkan data terbaru

   Jalankan dengan:
   ```bash
   npm run dev -- --sort=rank
   npm run dev -- --sort=win
   npm run dev -- --sort=sparks
   npm run dev -- --sort=latest
   ```

   Atau gunakan shortcut script yang sudah tersedia di `package.json`:
   ```bash
   npm run dev:rank
   npm run dev:win
   npm run dev:sparks
   npm run dev:latest
   ```

4. **Build & Jalankan hasil kompilasi**
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
