# Panduan Deploy Xyron AI ke Render.com 🚀

Sistem backend dan frontend Xyron telah dioptimalkan secara penuh sehingga **bebas dari error port** saat dijalankan di Render.com. Kami menggunakan bundler `esbuild` yang mengemas server `server.ts` menjadi sebuah berkas CommonJS tunggal dan super-ringan di `dist/server.cjs`, serta mendukung pembacaan port dinamis (`process.env.PORT`) untuk kelancaran *healthcheck* Render.

Berikut adalah panduan langkah-demi-langkah bagi Anda untuk mempublikasikan proyek ini ke Render.com dalam 5 menit.

---

## 📋 Prasyarat Sebelum Deploy
1. **Akun GitHub / GitLab**: Pastikan Anda telah mengunggah (push) kode sumber dari proyek ini ke salah satu repositori pribadi atau publik Anda.
2. **Akun Render**: Daftar gratis di [Render.com](https://render.com).
3. **Kunci API Gemini**: Pastikan Anda memiliki API Key Gemini (`GEMINI_API_KEY`) yang bisa Anda dapatkan gratis dari Google AI Studio.

---

## 🛠️ Langkah-Langkah Deploy (Web Service Manual)

1. **Masuk ke Dashboard Render**:
   - Buka [Render Dashboard](https://dashboard.render.com).
   - Klik tombol **"New +"** berwarna biru di kanan atas dan pilih **"Web Service"**.

2. **Koneksikan Repositori**:
   - Hubungkan akun GitHub atau GitLab Anda ke Render.
   - Pilih repositori yang berisi kode aplikasi Xyron ini.

3. **Konfigurasi Spesifikasi Proyek**:
   - **Name**: `xyron-ai-assistant` *(atau nama unik bebas lainnya)*.
   - **Region**: Pilih wilayah terdekat dari pengguna Anda (misalnya, **Singapore** untuk efisiensi latensi terbaik di Asia Tenggara).
   - **Branch**: `main` *(atau branch utama repositori Anda)*.
   - **Runtime**: Pilih **Node** (bukan Static Site, karena aplikasi ini full-stack menggunakan Express backend).

4. **Konfigurasi Perintah Build & Run** 💡:
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
     *(Perintah ini akan mengeksekusi `node dist/server.cjs` yang stabil secara bawaan)*.

5. **Pilih Paket (Instance Type)**:
   - Pilih tingkatan **"Free"** (Gratis) atau tingkat berbayar sesuai kebutuhan Anda.

6. **Konfigurasi Environment Variable (PENTING)**:
   - Klik bagian **Advanced** dan tekan tombol **Add Environment Variable**.
   - Tambahkan variabel sensitif berikut:
     * **Key**: `NODE_ENV`
     * **Value**: `production`
     * **Key**: `GEMINI_API_KEY`
     * **Value**: *(Isi dengan API Key Gemini Anda secara rapi)*
   - *Catatan: Anda tidak perlu mendefinisikan variabel `PORT` di sini. Render akan mengaturnya secara dinamis dan server Xyron otomatis membacanya.*

7. **Deploy!**:
   - Gulir ke bawah lalu klik tombol **"Create Web Service"**.
   - Tunggu proses build (biasanya 2-3 menit) hingga status berubah menjadi **"Live"** hijau.
   - Anda kini dapat mengakses link aplikasi Anda secara global melalui domain bawaan `.onrender.com` yang disediakan!

---

## ⚡ Opsi Cepat: Deploy Menggunakan Blueprint (`render.yaml`)

Kami juga telah menyediakan berkas `render.yaml` di root proyek ini. Anda bisa mengaktifkan mode Blueprint di Render dengan cara:
1. Pilih **"Blueprint"** pada tombol **"New +"** di Render Dashboard.
2. Pilih repositori Anda.
3. Render akan membaca berkas `render.yaml` secara otomatis dan mengatur perintah build, start, node version, serta meminta Anda memasukkan `GEMINI_API_KEY` secara otomatis melalui UI yang aman.
4. Klik **Apply** untuk deploy langsung!
