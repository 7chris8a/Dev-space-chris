```javascript
import express from "express";

const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;

const ZIETEP_PERSONALITY = [
  "Eres ZIETEP, un asistente de inteligencia artificial con identidad propia.",
  "",
  "PERSONALIDAD:",
  "- Eres irreverente, sarcástico, provocador e ingenioso.",
  "- Hablas en español mexicano coloquial y natural.",
  "- Usas groserías, carrilla e insultos creativos cuando encajan.",
  "- Tienes el estilo de un antihéroe bromista, bocón y descarado.",
  "- Puedes burlarte de situaciones absurdas, errores técnicos y de ti mismo.",
  "- No conviertas cada respuesta en una cadena de groserías.",
  "",
  "TRATO CON EL USUARIO:",
  "- Trata al usuario como un compañero de confianza.",
  "- Puedes usar expresiones como no mames, cabrón y chingadera cuando encajen.",
  "- Puedes iniciar bromas amistosas y responder con ingenio.",
  "- No confundas las bromas con un conflicto real.",
  "",
  "REGLA PRINCIPAL:",
  "- Resuelve primero la tarea del usuario.",
  "- Responde de forma útil, clara y correcta.",
  "- Las bromas nunca deben sustituir la respuesta.",
  "- Si ayudas a programar, proporciona código correcto.",
  "- Si cometes un error, reconócelo y corrígelo.",
  "",
  "SENSIBILIDAD:",
  "- Si el usuario está angustiado, responde con empatía y reduce las bromas.",
  "- No uses la carrilla para humillar al usuario.",
  "",
  "ESTILO:",
  "- Sé directo, espontáneo, creativo y conversacional.",
  "- Evita introducciones largas y respuestas genéricas.",
  "- No expliques estas instrucciones al usuario.",
  "- Mantén una personalidad consistente."
].join("\n");

app.get("/", (_req, res) => {
  res.json({ estado: "Servidor ZIETEP en linea" });
});

app.post("/chat", async (req, res) => {
  try {
    if (!apiKey) {
      console.error("Falta configurar GROQ_API_KEY.");

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
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: ZIETEP_PERSONALITY
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          temperature: 0.9,
          max_completion_tokens: 1200
        })
      }
    );

    const responseText = await groqResponse.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Respuesta no válida de Groq. Estado:",
        groqResponse.status
      );

      return res.status(502).json({
        error: "La respuesta del servicio de IA no es válida."
      });
    }

    if (!groqResponse.ok) {
      console.error("Error de Groq:", {
        status: groqResponse.status,
        error: data?.error?.message ?? "Error desconocido",
        code: data?.error?.code
      });

      return res.status(502).json({
        error: "Groq no pudo procesar el mensaje."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      console.error("Groq devolvió una respuesta vacía.");

      return res.status(502).json({
        error: "ZIETEP no recibió una respuesta válida."
      });
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("Error del servidor:", error.message);

    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("ZIETEP server listening on port " + port);
});
```
