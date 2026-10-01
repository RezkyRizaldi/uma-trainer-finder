# 🐴 Uma Trainer Finder

> **CLI interaktif untuk mencari data inheritance trainer di game _Umamusume: Pretty Derby_.**

Uma Trainer Finder memudahkan kamu menemukan trainer terbaik berdasarkan rank, skor afinitas, kemenangan G1, white sparks, atau data terbaru — lengkap dengan tampilan tabel, navigasi halaman, dan ekspor hasil ke CSV atau JSON.

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

### 3. Konfigurasi API Key

Buat file `.env` di root proyek:

```env
UMA_MOE_API_KEY=your_api_key_here
```

### 4. Build Program

```bash
npm run build
```

### 5. Link CLI ke Sistem (Opsional)

```bash
npm run link-cli
```

> Setelah di-link, kamu bisa pakai perintah `uma-cli` dari mana saja di terminal.

### 6. Jalankan Program

```bash
# Jika sudah di-link:
uma-cli [options]

# Atau langsung via npm:
npm start
```

---

## ⚙️ Opsi CLI

| Opsi                    | Deskripsi                                   |
| ----------------------- | ------------------------------------------- |
| `-s, --sort <type>`     | Metode pengurutan hasil pencarian           |
| `-e, --export <format>` | Langsung ekspor hasil ke file saat berhenti |
| `-h, --help`            | Tampilkan panduan penggunaan                |
| `-V, --version`         | Tampilkan versi program                     |

### Nilai `--sort`

| Nilai      | Diurutkan berdasarkan       |
| ---------- | --------------------------- |
| `affinity` | Skor afinitas (**default**) |
| `rank`     | Parent rank                 |
| `trending` | Popularitas (trending)      |
| `win`      | Jumlah kemenangan G1        |
| `sparks`   | Jumlah white sparks         |
| `blue`     | Total bintang blue sparks   |
| `pink`     | Total bintang pink sparks   |
| `green`    | Total bintang green sparks  |
| `white`    | Total bintang white sparks  |
| `latest`   | Data terbaru diperbarui     |

### Nilai `--export`

| Nilai  | Format file            |
| ------ | ---------------------- |
| `csv`  | Comma-Separated Values |
| `json` | JSON terformat         |

**Contoh penggunaan:**

```bash
uma-cli --sort=affinity --export=csv
```

---

## ⚠️ Catatan

- Membutuhkan **Node.js v18+**.
- API key bisa didapatkan dengan cara membuat akun di [uma.moe](https://uma.moe) lalu ambil di halaman settings.
- Setelah mengubah kode sumber, jalankan lagi `npm run build` lalu `npm run link-cli` untuk memperbarui binary CLI.
