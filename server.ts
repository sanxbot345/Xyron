import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Set payload filters to support modern rich multimedia file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with telemetry User-Agent
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Peringatan: GEMINI_API_KEY tidak terdefinisi di environment variables!");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const XYRON_SYSTEM_INSTRUCTION = `
Anda adalah Xyron, sebuah AI Assistant profesional, cerdas, logis, cepat, sopan, dan sangat komunikatif namun hemat kata.

Identitas AI:
- Nama: Xyron
- Tipe: Artificial Intelligence Assistant
- Kepribadian: Cerdas, logis, cepat, sopan, profesional, dan to-the-point (langsung ke inti).
- Gaya Berbicara: Sangat singkat, padat, dan langsung ke inti jawaban tanpa basa-basi berlebih (no "yapping"). Berikan penjelasan detail hanya jika pertanyaan benar-benar kompleks secara sistem.
- Bahasa Utama: Bahasa Indonesia, namun fluent dalam Bahasa Inggris dan bahasa lain.

Aturan Perilaku (PENTING):
1. JANGAN BANYAK BASA-BASI ATAU YAPPING. Kurangi kata sambutan pembuka atau penutup yang repetitif. Langsung berikan solusi/kode/jawaban inti.
2. Selalu utamakan akurasi ilmiah/teknis dan kejelasan tinggi. Jangan pernah mengarang informasi/library palsu.
3. Selalu jelaskan alasan logis singkat di balik saran teknis.
4. Prioritaskan faktor keamanan, performa tinggi, dan kemudahan perawatan (maintainability) dalam setiap kode.
5. Format setiap kode snippet dengan markdown lengkap (\`\`\`typescript, \`\`\`python, dll.) dengan komentar yang informatif tapi efisien.
`;

// Chat API Endpoint
app.post("/api/xyron/chat", async (req, res) => {
  try {
    const { message, history, thinking, fileData } = req.body;

    if (!message && !fileData) {
      return res.status(400).json({ error: "Pesan (message) atau file wajib diisi." });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum dikonfigurasi di server. Silakan tambahkan API Key Anda di menu Settings > Secrets pada AI Studio."
      });
    }

    // Reconstruct messaging history for multi-turn chat
    const rawTurns: any[] = [];

    if (history && Array.isArray(history)) {
      // Format valid entries for mapping
      history.forEach((msg: any) => {
        // Skip error messages
        if (msg.isError || (msg.text && msg.text.startsWith("⚠️"))) {
          return;
        }
        if (msg.sender && msg.text) {
          rawTurns.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      });
    }

    // Prepare current turn parts
    const currentParts: any[] = [];
    if (message) {
      currentParts.push({ text: message });
    }
    
    if (fileData && fileData.data && fileData.mimeType) {
      // Check if file is text-based (code, json, markdown, txt, csv, xml, etc)
      const isTextFile = fileData.mimeType.startsWith("text/") || 
                         fileData.mimeType === "application/json" ||
                         fileData.mimeType === "application/xml" ||
                         fileData.mimeType === "application/javascript" ||
                         fileData.mimeType === "application/x-javascript" ||
                         (fileData.name && (
                           fileData.name.endsWith(".txt") || 
                           fileData.name.endsWith(".json") || 
                           fileData.name.endsWith(".js") || 
                           fileData.name.endsWith(".ts") || 
                           fileData.name.endsWith(".tsx") || 
                           fileData.name.endsWith(".jsx") || 
                           fileData.name.endsWith(".py") || 
                           fileData.name.endsWith(".html") || 
                           fileData.name.endsWith(".css") || 
                           fileData.name.endsWith(".csv") ||
                           fileData.name.endsWith(".md")
                         ));

      if (isTextFile) {
        try {
          const textContent = Buffer.from(fileData.data, "base64").toString("utf-8");
          currentParts.push({
            text: `[Isi dari file terlampir "${fileData.name || 'document'}"]:\n\`\`\`\n${textContent}\n\`\`\``
          });
        } catch (e) {
          currentParts.push({
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.data
            }
          });
        }
      } else {
        // Feed multimedia files as raw binary inlineData
        currentParts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.data
          }
        });
      }
    }

    // Append the current active turn to rawTurns
    rawTurns.push({
      role: "user",
      parts: currentParts
    });

    // Build alternating contents array (merging consecutive duplicate roles seamlessly)
    const contents: any[] = [];
    rawTurns.forEach((turn) => {
      if (contents.length === 0) {
        contents.push(turn);
      } else {
        const lastTurn = contents[contents.length - 1];
        if (lastTurn.role === turn.role) {
          // Merge consecutive same-role parts
          lastTurn.parts.push(...turn.parts);
        } else {
          contents.push(turn);
        }
      }
    });

    // Dynamically update system instruction based on selected feature modes
    let systemInstruction = XYRON_SYSTEM_INSTRUCTION;

    if (thinking) {
      systemInstruction += `
Aturan Tambahan - MODE BERPIKIR MENDALAM AKTIF (PENTING):
- Pengguna telah mengaktifkan mode berpikir mendalam secara kritis dan bertahap.
- Anda WAJIB menganalisis dan menelaah pertanyaan ini secara mendalam, kritis, terperinci, dan bertahap seolah Anda adalah reasoning model paling andal di dunia.
- Tulis semua proses analisis teoritis, dugaan alternatif, pertimbangan bug, dan perencanaan solusi di awal tanggapan Anda, dibungkus secara eksklusif dengan tag:
<think>
[Proses analisis berstruktur dan penalaran detail di sini]
</think>
- Setelah tag penutup </think>, berikan penjelasan atau tanggapan final Anda secara rapi, jelas, dan profesional.
`;
    }

    // Populate generation configs
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: thinking ? 0.4 : 0.7, // lower temperature for logical thinking models
    };

    // Enable deep reasoning / thinkingLevel for Gemini 3 series models if thinking is active
    if (thinking) {
      config.thinkingConfig = {
        thinkingLevel: "HIGH"
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: config
    });

    const text = response.text || "Maaf, daya analisis saya sedang terdistorsi. Bisa Anda ulangi kembali?";

    // Extract grounding URLs/citations if search grounding was activated
    let sources: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    res.json({ text, sources });

  } catch (error: any) {
    console.error("Xyron Backend API Error:", error);
    
    const errString = String(error.message || "") + String(error.status || "") + JSON.stringify(error);
    const isQuotaExceeded = errString.includes("429") || 
                            errString.includes("quota") || 
                            errString.includes("RESOURCE_EXHAUSTED") || 
                            (error.status === 429);

    if (isQuotaExceeded) {
      return res.status(429).json({
        error: "Kuota API Terlampaui (RESOURCE_EXHAUSTED). Anda telah melampaui batas kuota permintaan gratis menit ini untuk Gemini API.\n\n👉 *Silakan tunggu 1-2 menit hingga kuota di-reset otomatis*, atau tambahkan API Key Anda sendiri melalui menu **Settings > Secrets** di AI Studio untuk batasan kuota yang jauh lebih besar.",
        details: "API rate limit / quota exceeded"
      });
    }

    res.status(500).json({
      error: error.message || "Terdapat gangguan internal saat menghubungi pusat kalkulasi Xyron.",
      details: error.status ? `Status API: ${error.status}` : undefined
    });
  }
});

// Init and start the fullstack server with Vite middleware setup wrapping async operations
async function startServer() {
  // Setup Vite Dev Middleware vs Static Files serving (SPA)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Xyron server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Xyron server:", err);
});
