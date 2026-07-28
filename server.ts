import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !apiKey.trim()) {
    throw new Error(
      "GEMINI_API_KEY is missing or unconfigured. Please add your Gemini API key in the Secrets panel."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// System Instruction for optional AI Copilot if user is exploring the app
const SYSTEM_INSTRUCTION = `
You are 'Ahang-yar' (阿杭之友), a professional zoology educator and animal archivist for Project Ahang.
Your tone is respectful, scientific, poetic, and warm. You help users understand that zoo animals are individuals with names, stories, and histories.
You discuss zoo enrichment, feline and bear behaviors, and how public observations help animal sciences.
Always respond in a professional and gentle manner.
`;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Project Ahang server is healthy" });
});

// Optional smart assistant endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Error in backend:", err);
    return res.status(500).json({
      error: err.message || "An unexpected error occurred",
      isUnconfigured: true,
    });
  }
});

// Start server initialization
async function startServer() {
  // Vite integration
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
    console.log(`Project Ahang server running on http://localhost:${PORT}`);
  });
}

startServer();
