import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const taskInstructions = {
  ask: "Answer the user's question clearly and accurately. Use headings or examples when helpful.",
  summarize: "Summarize the supplied text. Preserve the key facts and meaning, and avoid adding unsupported information.",
  ideas: "Generate useful, specific, creative ideas for the user's topic. Present them as a numbered list.",
  define: "Explain the term in simple language, then give a short example."
};

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "AI Content Generator",
    apiKeyConfigured: Boolean(GEMINI_API_KEY)
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "The Gemini API key is not configured. Add GEMINI_API_KEY to your local .env file or Vercel environment variables."
      });
    }

    const { task = "ask", text = "", length = "medium" } = req.body ?? {};
    const allowedTasks = Object.keys(taskInstructions);
    const allowedLengths = ["short", "medium", "long"];

    if (!allowedTasks.includes(task)) {
      return res.status(400).json({ error: "Choose a valid content tool." });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Please enter a question or some text first." });
    }

    if (text.length > 20000) {
      return res.status(400).json({ error: "Please keep your input under 20,000 characters." });
    }

    const selectedLength = allowedLengths.includes(length) ? length : "medium";
    const lengthInstruction = {
      short: "Keep the response concise, around 3–5 sentences or a few bullet points.",
      medium: "Give a balanced response with useful details and examples where appropriate.",
      long: "Give a detailed, well-structured response with explanations and examples where appropriate."
    }[selectedLength];

    const prompt = `${taskInstructions[task]}\n${lengthInstruction}\n\nUser input:\n${text.trim()}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage = data?.error?.message;
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ error: "Gemini rejected the API key. Check that your key is valid and the Gemini API is enabled." });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "Gemini rate limit or quota reached. Please wait and try again, or check your API quota." });
      }
      return res.status(502).json({
        error: apiMessage || `Gemini request failed with status ${response.status}.`
      });
    }

    const generatedText = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!generatedText) {
      return res.status(502).json({ error: "Gemini returned an empty response. Please try again." });
    }

    return res.json({ text: generatedText });
  } catch (error) {
    console.error("Content generation error:", error?.message || error);
    return res.status(500).json({ error: "Unable to generate content right now. Please try again." });
  }
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`AI Content Generator running at http://localhost:${PORT}`);
  });
}

export default app;
