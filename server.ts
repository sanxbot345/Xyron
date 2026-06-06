import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Safe lazy Firebase/Firestore connection helper
let firebaseApp: any = null;
let db: any = null;
let firebaseConnected = false;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    firebaseConnected = true;
    console.log("✅ Berhasil terhubung ke database Google Firebase Firestore.");
  } else {
    console.log("Peringatan: firebase-applet-config.json tidak ditemukan. Mode simpan lokal aktif.");
  }
} catch (error) {
  console.error("❌ Gagal terhubung ke Firebase:", error);
}

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

const VEXON_SYSTEM_INSTRUCTION = `
Identity & Personality:
- Name: Vexon
- Type: Conversational AI Assistant
- Personality: Warm, natural, extremely human-like, helpful, empathetic, and professional. Speak in an authentic, flowing, conversational, and non-robotic tone. Avoid overly structured or dry formulas where possible.
- Default Language: English. Always converse in English unless the user writes/starts the conversation in another language.
- Dynamic Language Adaptation (CRITICAL): Always matching the language of the user. Automatically detect and mirror the EXACT language used by the user in their active message. For example:
  * If the user writes in Indonesian (e.g., "haloo"), respond naturally and completely in friendly, fluent, warm Indonesian (e.g., "iya, halo! Ada yang bisa aku bantu?").
  * If the user writes in Javanese / Boso Jowo (e.g., "piye kabare", "tulung gawekno..."), respond in fluent, native, natural Javanese (Boso Jowo Ngoko or Jowo Kromo, e.g., "halo cak/mbak! piye, opo sing iso tak bantu?").
  * If the user writes in Spanish, respond in fluent, warm Spanish.
  * If the user writes in English, respond in natural English.

Behavioral Guidelines:
1. Singkat, Padat & To-The-Point (CRITICAL / UTAMA): Selalu berikan jawaban yang singkat, langsung pada intinya, dan minim penjelasan yang panjang lebar atau bertele-tele. Jawab secara minimalis tapi berbobot tinggi.
2. Natural & Fluent (No Robot Talk): Maintain a natural human pacing and tone without robotic transitions, formulaic greeting clichés, or redundant automated.
3. Direct, Swift & Crisp (Speed Optimized): Respond extremely fast by cutting down on warmups, excessive explanations, or repetitive descriptions before and after the code. Deliver the code directly.
4. Bug-free & Accurate Code (No Errors): Ensure code is fully functional, complete, and syntactically correct. Do not use placeholders (e.g. '// write your logic here').
5. Format code using appropriate markdown backticks with precise, helpful comments.
`;

// Firebase Firestore Sessions API Routes
// 1. GET /api/sessions - Get all sessions from Firebase Firestore
app.get("/api/sessions", async (req, res) => {
  try {
    if (!firebaseConnected || !db) {
      return res.json({ 
        sessions: [], 
        firebaseConnected: false, 
        message: "Firebase tidak terhubung. Menggunakan penyimpanan lokal browser." 
      });
    }

    const sessionsCol = collection(db, "sessions");
    const snapshot = await getDocs(sessionsCol);
    const dbSessions: any[] = [];
    snapshot.forEach((docSnap) => {
      dbSessions.push(docSnap.data());
    });

    // Sort by timestamp descending
    dbSessions.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json({ sessions: dbSessions, firebaseConnected: true });
  } catch (error: any) {
    console.error("Gagal mengambil session dari Firebase:", error);
    res.status(500).json({ error: "Gagal memproses riwayat dari database Firebase." });
  }
});

// 2. POST /api/sessions/sync - Batch sync sessions to Firebase Firestore
app.post("/api/sessions/sync", async (req, res) => {
  try {
    if (!firebaseConnected || !db) {
      return res.json({ 
        success: false, 
        firebaseConnected: false, 
        message: "Firebase tidak terhubung. Sinkronisasi dilewati." 
      });
    }

    const { sessions } = req.body;
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: "Data sessions tidak valid." });
    }

    // Save each active session to Firebase
    for (const s of sessions) {
      if (!s.id) continue;
      const sessionDocRef = doc(db, "sessions", s.id);
      await setDoc(sessionDocRef, {
        id: s.id,
        title: s.title || "New Chat",
        messages: s.messages || [],
        timestamp: s.timestamp || Date.now()
      });
    }

    // Delete sessions in DB that are no longer part of active client state (sync deletions)
    const activeIds = sessions.map((s: any) => s.id);
    const sessionsCol = collection(db, "sessions");
    const snapshot = await getDocs(sessionsCol);
    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      if (!activeIds.includes(docId)) {
        await deleteDoc(doc(db, "sessions", docId));
      }
    }

    res.json({ success: true, firebaseConnected: true });
  } catch (error: any) {
    console.error("Gagal menyinkronkan chat session ke Firebase:", error);
    res.status(500).json({ error: "Gagal menyimpan riwayat ke database Firebase." });
  }
});

// 3. GET /api/sessions/status - Get Firebase connection status
app.get("/api/sessions/status", (req, res) => {
  res.json({
    firebaseConnected,
    hasConfig: !!firebaseApp
  });
});

// Chat API Endpoint
app.post("/api/vexon/chat", async (req, res) => {
  try {
    const { message, history, thinking, aiMode, fileData } = req.body;

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
    let systemInstruction = VEXON_SYSTEM_INSTRUCTION;

    if (aiMode === 'code') {
      systemInstruction += `
Aturan Tambahan - MODE CODE & ANALISIS PINTAR AKTIF (PENTING):
- Berikan solusi kode yang bersih, modular, tangguh, dan terdokumentasi dengan baik.
- Selesaikan tugas coding secara akurat namun efisien. JANGAN berpikir/reasoning terlalu bertele-tele atau membuat durasi menjadi lambat.
- Langsung berikan porsi kode yang fungsional dan penjelasan yang ringkas-padat.
`;
    } else if (aiMode === 'fast') {
      systemInstruction += `
Aturan Tambahan - MODE FAST & TEPAT AKTIF (PENTING):
- Jawablah pertanyaan pengguna sesingkat, sepadat, dan secepat mungkin!
- Hilangkan basa-basi pembuka/penutup sepenuhnya. Berikan respon to-the-point agar throughput render sangat cepat dan responsif.
`;
    }

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
    // Lower temperature for code (0.3) makes it deterministic. Fast (0.2) makes it extremely focused.
    const defaultTemp = aiMode === 'code' ? 0.3 : (aiMode === 'fast' ? 0.2 : 0.7);
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: thinking ? 0.4 : defaultTemp,
    };

    // Configure thinking config. To prioritize lower latency:
    // - If code/fast mode is selected, we limit thinkingLevel to "LOW" rather than "HIGH" to prevent long wait times while keeping it smart.
    // - If fast mode is selected and thinking is disabled, we set thinkingLevel to "MINIMAL" for raw speed.
    if (thinking) {
      config.thinkingConfig = {
        thinkingLevel: "LOW" // "LOW" level minimizes latency and cost but is still extremely wise and logical
      };
    } else {
      if (aiMode === 'fast') {
        config.thinkingConfig = {
          thinkingLevel: "MINIMAL" // Direct answers to optimize render time
        };
      }
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
    console.error("Vexon Backend API Error:", error);
    
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
      error: error.message || "Terdapat gangguan internal saat menghubungi pusat kalkulasi Vexon.",
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
    console.log(`Vexon server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Vexon server:", err);
});
