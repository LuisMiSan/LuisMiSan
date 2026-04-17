import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); 

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY not found in environment.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  // API Routes
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { imageData } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageData } },
            { text: "Analiza esta comida. Proporciona un desglose nutricional estimado, ingredientes identificados, sugerencias para reducir calorías (healthySwaps), un puntaje de confianza (confidenceScore) y 3 recetas alternativas más saludables del mismo plato." }
          ]
        },
        config: {
          systemInstruction: "Eres un nutricionista experto. Analiza imágenes de comida con alta precisión. Responde siempre en Español.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.INTEGER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  protein: { type: Type.INTEGER },
                  carbs: { type: Type.INTEGER },
                  fat: { type: Type.INTEGER },
                },
                required: ["protein", "carbs", "fat"],
              },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              healthySwaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidenceScore: { type: Type.INTEGER },
              healthierRecipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    calories: { type: Type.INTEGER },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["name", "description", "calories", "ingredients", "instructions"],
                },
              },
            },
            required: ["calories", "macros", "ingredients", "healthySwaps", "healthierRecipes", "confidenceScore"],
          },
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Analysis route failed:", error);
      res.status(500).json({ error: "Failed to analyze food" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        history: history,
        config: {
          systemInstruction: "Eres SnapCal Bot, un asistente amigable de nutrición. Responde de forma concisa y motivadora en Español.",
        }
      });

      const result = await chat.sendMessage({ message });
      res.json({ text: result.text });
    } catch (error) {
      console.error("Chat route failed:", error);
      res.status(500).json({ error: "Assistant error" });
    }
  });

  app.get("/api/quick-tip", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Dame un consejo de nutrición muy breve (max 15 palabras) en Español."
      });
      res.json({ text: response.text });
    } catch (error) {
      res.json({ text: "Bebe suficiente agua hoy." });
    }
  });

  // Vite middleware setup
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
