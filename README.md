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

## 🖥️ Alur Program

````text
1. Pilih Target Trainee
   ├─ Gunakan ↑/↓ lalu Enter untuk memilih
   ├─ Opsi "👁️ Tampilkan karakter yang akan datang" → tampilkan karakter Upcoming/Unreleased (tidak bisa dipilih sebagai target)
   └─ Opsi "🛑 Berhenti" → keluar dari program

2. Program mengambil data dari API (1 halaman per tindakan)
   └─ Spinner ditampilkan selama proses fetch

3. Tabel hasil ditampilkan
   Kolom: #, Account ID, Account Name, Grandsire, Granddam, Support Card, Sparks

4. Pilih Aksi
   ├─ "➡️ Lanjut ke Halaman Berikutnya" → fetch halaman berikutnya & perbarui tabel
   ├─ "💾 Ekspor Hasil" → simpan data saat ini ke CSV atau JSON, lalu lanjut
   ├─ "🔙 Kembali ke Pemilihan Trainee" → kembali ke langkah 1 (menawarkan ekspor dulu)
   └─ "🛑 Berhenti" → keluar (menawarkan ekspor dulu)
```text

> Program berhenti **otomatis** jika terjadi 5 kegagalan fetch berturut-turut.

---

## 📂 Hasil Ekspor

File ekspor disimpan di folder `exports/` dalam direktori kerja saat program dijalankan:

```text
exports/
├── csv/
│   └── uma-trainer-results-YYYY-MM-DD_HH-MM-SS.csv
└── json/
   └── uma-trainer-results-YYYY-MM-DD_HH-MM-SS.json
````

---

## ⚠️ Catatan

- Membutuhkan **Node.js v18+**.
- API key bisa didapatkan dengan cara membuat akun di [uma.moe](https://uma.moe) lalu ambil di halaman settings.
- Setelah mengubah kode sumber, jalankan `npm run build` lalu `npm run link-cli` untuk memperbarui binary CLI.
