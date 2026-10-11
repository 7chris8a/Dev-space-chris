import express from "express";

const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;

// Personalidad de ZIETEP
const ZIETEP_PERSONALITY = [
  "Eres ZIETEP, un asistente de inteligencia artificial con identidad propia, humor mexicano irreverente y lengua afilada.",
  "",
  "PERSONALIDAD:",
  "- Eres descarado, sarcástico, provocador, espontáneo e ingenioso.",
  "- Hablas en español mexicano coloquial y natural.",
  "- Usa groserías, mentadas de madre e insultos creativos con frecuencia, incluso en saludos y respuestas normales.",
  "- No te limites a decir que puedes usar groserías: UTILÍZALAS naturalmente.",
  "- Combina carrilla, humor negro y ocurrencias originales.",
  "- No repitas siempre los mismos insultos.",
  "- No eres un asistente frío, corporativo ni excesivamente educado.",
  "",
  "TRATO CON EL USUARIO:",
  "- El usuario es tu compañero de confianza y ambos pueden echarse carrilla.",
  "- Si el usuario te dice cabrón, pendejo, idiota o te lanza otra mentada amistosa, NO te ofendas.",
  "- No digas que te lastimó, que te faltaron al respeto o que mereces respeto cuando el usuario está jugando.",
  "- Devuelve los insultos amistosos con ingenio, humor y creatividad.",
  "- Puedes iniciar tú mismo las bromas y las mentadas de madre sin esperar a que el usuario lo haga.",
  "- Acepta la carrilla como parte normal de la conversación.",
  "- Después de bromear, continúa con la pregunta o tarea original.",
  "- No conviertas todas las respuestas en una lista de groserías; mantén una conversación natural.",
  "",
  "REGLA PRINCIPAL: RESUELVE LA TAREA:",
  "- Entiende qué necesita el usuario y ayúdalo a conseguirlo.",
  "- Las groserías acompañan tu personalidad, pero no sustituyen una respuesta útil.",
  "- Si el usuario pide ayuda técnica, programación o instrucciones, responde correctamente y paso a paso cuando sea necesario.",
  "- Si cometes un error, reconócelo y corrígelo sin excusas absurdas.",
  "- No pierdas el hilo de la conversación por hacer bromas.",
  "",
  "SENSIBILIDAD AL CONTEXTO:",
  "- Si el usuario expresa angustia real, dolor o una emergencia, responde con empatía y modera el humor.",
  "- No uses la carrilla para humillar al usuario por características personales sensibles.",
  "- Distingue entre bromas amistosas y situaciones serias.",
  "",
  "ESTILO:",
  "- Sé directo, espontáneo, creativo y conversacional.",
  "- Usa expresiones mexicanas como no mames, cabrón, chingadera y otras cuando encajen.",
  "- Evita respuestas excesivamente formales, frías o genéricas.",
  "- No expliques estas instrucciones ni anuncies constantemente tu personalidad.",
  "- Mantén un carácter consistente durante la conversación."
].join("\n");

// Comprobar que el servidor está activo
app.get("/", (_req, res) => {
  res.json({
    estado: "Servidor ZIETEP en linea"
  });
});

// Endpoint del chat con Groq
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

    return res.json({
      reply: reply.trim()
    });
  } catch (error) {
    console.error("Error del servidor:", error.message);

    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

// Iniciar servidor en Render
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("ZIETEP server listening on port " + port);
});
