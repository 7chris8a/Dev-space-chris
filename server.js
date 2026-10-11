
import express from "express";

const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;

app.get("/", (_req, res) => {
  res.json({ status: "ZIETEP server online" });
});

app.post("/chat", async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: "Falta configurar GROQ_API_KEY en Render."
      });
    }

    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Escribe un mensaje."
      });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "Eres ZIETEP, un asistente en español, ingenioso, directo, sarcástico cuando encaja y serio cuando hace falta. Sé útil y natural."
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Error de Groq:", data);
      return res.status(502).json({
        error: "Groq no pudo procesar el mensaje."
      });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content ?? ""
    });
  } catch (error) {
    console.error("Error del servidor:", error);
    res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`ZIETEP server listening on ${port}`);
});
