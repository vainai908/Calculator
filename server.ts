import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// AI problem solver API route
app.post("/api/gemini/solve", async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required." });
    return;
  }

  if (!process.env.GEMINI_API_KEY || !ai) {
    res.status(503).json({
      error: "Gemini API key is not configured in environment secrets.",
    });
    return;
  }

  try {
    const systemInstruction = 
      "You are a precise, highly skilled mathematical and financial calculator. " +
      "Analyze the user's expression, algebraic problem, or word problem step-by-step. " +
      "Rules:\n" +
      "1. Guide the user through a logical, clear, step-by-step resolution.\n" +
      "2. State the final numerical or simplified mathematical result explicitly at the end or top in bold, structured formatting.\n" +
      "3. Use LaTeX/KaTeX conventions or simple readable typography (like * and ^) for mathematical equations to make them clean.\n" +
      "4. If it is a financial or amortization problem, break down the ratios clearly (e.g. principal vs interest paid).\n" +
      "5. Avoid conversational filler or long side remarks - stay focused strictly on the math, formulas, and solving steps.";

    const contents = history && Array.isArray(history) && history.length > 0
      ? [...history, { role: "user", parts: [{ text: prompt }] }]
      : [{ role: "user", parts: [{ text: prompt }] }];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for precise calculations
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: error?.message || "An error occurred while generating the solution.",
    });
  }
});

// Configure Vite or Serve static assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
