import { SuggestionChip } from './types';

export const CHIP_PRESETS: SuggestionChip[] = [
  {
    id: 'prog-1',
    category: 'programming',
    label: 'Buat Fungsi Clean Code',
    shortLabel: 'Clean Code',
    prompt: 'Tolong buatkan sebuah fungsi utilitas TypeScript yang bersih, efisien, dan aman untuk memvalidasi input email dan nomor telepon Indonesia.'
  },
  {
    id: 'debug-1',
    category: 'debugging',
    label: 'Analisis & Temukan Bug',
    shortLabel: 'Analisis Bug',
    prompt: 'Berikut adalah kode React saya yang mengalami memory leak karena useEffect. Tolong analisis dan perbaiki kodenya agar efisien:\n\n```jsx\nuseEffect(() => {\n  const interval = setInterval(() => {\n    fetchData();\n  }, 1000);\n}, []);\n```'
  },
  {
    id: 'arch-1',
    category: 'architecture',
    label: 'Rancang Arsitektur Berbasis Node.js',
    shortLabel: 'Arsitektur API',
    prompt: 'Saya ingin merancang arsitektur REST API menggunakan Express dan PostgreSQL yang aman, modular, dan mendukung skalabilitas tinggi. Berikan skema direktori dan folder terbaik.'
  },
  {
    id: 'edu-1',
    category: 'education',
    label: 'Jelaskan Konsep Asynchronous JS',
    shortLabel: 'Konsep Async/Await',
    prompt: 'Jelaskan konsep Asynchronous, Promise, dan Async/Await dalam JavaScript dengan cara yang sederhana, bertahap, dan mudah dipahami oleh pemula.'
  },
  {
    id: 'bot-1',
    category: 'bot',
    label: 'Rancangan Bot WhatsApp Node.js',
    shortLabel: 'Bot WhatsApp',
    prompt: 'Tolong jelaskan langkah demi langkah membuat bot WhatsApp sederhana berbasis Node.js menggunakan library whatsapp-web.js untuk auto-reply pesan tanya-jawab.'
  }
];

export const WELCOME_MESSAGE = "Halo, saya Xyron. Saya siap membantu Anda dalam pemrograman, teknologi, dan berbagai kebutuhan digital lainnya. Apa yang ingin Anda kerjakan hari ini?";
