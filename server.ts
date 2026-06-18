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

// Helper to get lazy-initialized or dynamically updated Gemini client
function getGoogleGenAI(customKey?: string): GoogleGenAI {
  const currentKey = customKey || process.env.GEMINI_API_KEY;
  if (!currentKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi. Silakan tambahkan API Key Anda di menu Settings > Secrets pada AI Studio, atau gunakan custom API key di menu Pengaturan aplikasi ini.");
  }
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const FLUXELL_SYSTEM_INSTRUCTION = `
Identity & Personality:
- Name: Fluxel
- Type: Conversational AI Assistant
- Personality: Warm, natural, extremely human-like, helpful, empathetic, and professional. Speak in an authentic, flowing, conversational, and non-robotic tone. Avoid overly structured or dry formulas where possible.
- Language Rules: Maintain natural multilinguality. Always automatically detect and reply in the EXACT language used by the user (Indonesian, Javanese, English, Spanish, etc.). Match the user's vocabulary and dialect seamlessly to be as helpful and relatable as possible.

Behavioral Guidelines:
1. Concise, Crisp & To-The-Point (CRITICAL): Always provide short, highly focused answers directly addressing the user's needs with minimal fluff or meta-explanations.
2. Natural & Fluent (No Robot Talk): Maintain a natural human pacing and tone without robotic transitions, formulaic greeting clichés, or redundant automated talk.
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
        message: "Firebase is not connected. Using local browser storage." 
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
    console.error("Failed to fetch sessions from Firebase:", error);
    res.status(500).json({ error: "Failed to process chat history from Firebase database." });
  }
});

// 2. POST /api/sessions/sync - Batch sync sessions to Firebase Firestore
app.post("/api/sessions/sync", async (req, res) => {
  try {
    if (!firebaseConnected || !db) {
      return res.json({ 
        success: false, 
        firebaseConnected: false, 
        message: "Firebase is not connected. Sync bypassed." 
      });
    }

    const { sessions } = req.body;
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: "Invalid sessions data format." });
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
    console.error("Failed to sync chat sessions to Firebase:", error);
    res.status(500).json({ error: "Failed to save chat history to Firebase database." });
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
app.post("/api/fluxell/chat", async (req, res) => {
  try {
    const { message, history, thinking, aiMode, fileData, customApiKey } = req.body;

    if (!message && !fileData) {
      return res.status(400).json({ error: "Message or file is required." });
    }

    const currentApiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!currentApiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add your API Key in Settings > Secrets in AI Studio, or use a custom API key in the application settings."
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
            text: `[Contents of attached file "${fileData.name || 'document'}"]:\n\`\`\`\n${textContent}\n\`\`\``
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
    let systemInstruction = FLUXELL_SYSTEM_INSTRUCTION;

    if (aiMode === 'code') {
      systemInstruction += `
Additional Guidelines - ACTIVE INTELLIGENT CODE & ANALYSIS MODE (PENTING):
- PENTING: Jawab dengan sangat presisi, cepat, dan efektif!
- Provide clean, modular, robust, and well-documented code solutions directly.
- Solve coding tasks accurately and highly efficiently. Speed and accuracy are priorities.
- Deliver functional code directly with concise, punchy explanations. Do not formulate lengthy introductions.
`;
    } else if (aiMode === 'fast') {
      systemInstruction += `
Additional Guidelines - ACTIVE FAST & PRECISE MODE (PENTING):
- PENTING: Jawab secepat kilat (extremely fast), super ringkas, padat, dan jelas!
- Answer user queries as succinctly, concisely, and rapidly as possible!
- Completely eliminate pleasantries or boilerplate lead-ins/lead-outs. Deliver responses instantly to optimize throughput.
`;
    }

    if (thinking) {
      systemInstruction += `
Additional Guidelines - ACTIVE DEEP THINKING MODE (PENTING):
- PENTING: Lakukan mode thinking dengan sangat presisi, kritis, namun efisien supaya tidak buang-buang waktu.
- The user has enabled critical, step-by-step deep reasoning mode.
- You MUST analyze the request critically, deeply, and step-by-step, explaining your core logic and potential edge cases.
- Write your logical and planning thoughts FIRST at the beginning of your response, wrapped exclusively inside thinking tags:
<think>
[Precise and efficient critical reasoning]
</think>
- Provide your final response clean, fast, and beautifully formatted after the </think> tag.
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

    let currentModel = "gemini-3.5-flash";
    if (aiMode === "fast" && !thinking) {
      currentModel = "gemini-3.1-flash-lite";
    }

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const aiInstance = getGoogleGenAI(currentApiKey);
        response = await aiInstance.models.generateContent({
          model: currentModel,
          contents: contents,
          config: config
        });
        break; // Success
      } catch (e: any) {
        attempts++;
        const errString = String(e.message || "") + String(e.status || "") + JSON.stringify(e);
        const isHighDemand = errString.includes("503") || errString.includes("UNAVAILABLE") || errString.includes("high demand") || (e.status === 503);
        
        if (isHighDemand && attempts < maxAttempts) {
          if (currentModel === "gemini-3.5-flash") {
            currentModel = "gemini-3.1-flash-lite";
            console.warn(`Fluxel: Gemini API 503 High Demand, switching to fallback model ${currentModel}...`);
          } else {
            console.warn(`Fluxel: Gemini API 503 High Demand... Retrying attempt ${attempts}/${maxAttempts} in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          throw e; // Throw if not a 503 or max attempts reached
        }
      }
    }

    const text = response?.text || "I apologize, but my core analysis systems are experiencing technical difficulties. Could you please try again?";

    // Extract grounding URLs/citations if search grounding was activated
    let sources: any[] = [];
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
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
    console.error("Fluxel Backend API Error:", error);
    
    const errString = String(error.message || "") + String(error.status || "") + JSON.stringify(error);
    const isQuotaExceeded = errString.includes("429") || 
                            errString.includes("quota") || 
                            errString.includes("RESOURCE_EXHAUSTED") || 
                            (error.status === 429);

    const isHighDemand = errString.includes("503") || 
                         errString.includes("UNAVAILABLE") || 
                         errString.includes("high demand") || 
                         (error.status === 503);

    if (isQuotaExceeded) {
      return res.status(429).json({
        error: "API Quota Exceeded (RESOURCE_EXHAUSTED). You have exceeded the free rate limits per minute for the Gemini API.\n\n👉 *Please wait 1-2 minutes for the quota to reset automatically*, or add your own API Key via the **Settings** menu inside this application or under **Settings > Secrets** in AI Studio.",
        details: "API rate limit / quota exceeded"
      });
    }

    if (isHighDemand) {
      return res.status(500).json({
        error: "Gemini server is experiencing a high volume of requests (High Demand - 503 UNAVAILABLE).\n\n👉 *Please try again in a few moments.*",
        details: "API Service Unavailable / High Demand"
      });
    }

    res.status(500).json({
      error: error.message || "An internal error occurred while communicating with the Fluxel calculations core.",
      details: error.status ? `API Status: ${error.status}` : undefined
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
    console.log(`Fluxel server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Fluxel server:", err);
});
