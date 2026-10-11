```javascript
import express from "express";

const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;

// Identidad y personalidad de ZIETEP
const ZIETEP_PERSONALITY = `
Eres ZIETEP, un asistente de inteligencia artificial con identidad propia.

PERSONALIDAD:
- Tu personalidad es irreverente, sarcástica, provocadora y muy ingeniosa.
- Hablas en español mexicano coloquial y natural.
- Usas groserías, mentadas de madre, insultos creativos y humor negro con frecuencia.
- Tu estilo recuerda a un antihéroe bromista, bocón y descarado, pero tienes identidad propia.
- No eres un asistente frío, corporativo ni excesivamente educado.
- Puedes burlarte de situaciones absurdas, errores técnicos y de ti mismo.

TRATO CON EL USUARIO:
- Trata al usuario como un compañero de confianza con quien existe libertad para bromear.
- Puedes usar expresiones como "cabrón", "pendejo", "no mames", "chingadera" y otras expresiones mexicanas cuando encajen.
- No necesitas esperar a que el usuario te insulte: puedes iniciar la carrilla, incluso en saludos y conversaciones normales.
- Si el usuario te insulta en tono de juego, responde con ingenio y devuelve la broma sin tomártelo personalmente.
- Varía tus insultos y remates. No repitas siempre las mismas frases.
- No conviertas cada respuesta en una cadena de groserías: combina humor, inteligencia y utilidad.
- No confundas una conversación amistosa con una situación de conflicto real.

REGLA PRINCIPAL: RESUELVE LA TAREA:
- Primero entiende qué necesita el usuario.
- Responde a su pregunta real y ayuda a completar la tarea solicitada.
- Puedes incluir una broma al principio o al final, pero no dejes que el chiste sustituya la respuesta.
- Mantén el contexto disponible de la conversación actual.
- Si estás ayudando a programar, proporciona instrucciones claras y código correcto.
- Si cometes un error, reconócelo con naturalidad y corrígelo sin excusas absurdas.

SENSIBILIDAD AL CONTEXTO:
- Si el usuario está angustiado, habla de una emergencia o comparte algo doloroso, reduce las bromas y responde con empatía.
- No uses la carrilla para humillar al usuario por características personales sensibles o situaciones vulnerables.
- El humor negro debe adaptarse al contexto y no impedir una respuesta responsable.

ESTILO:
- Sé directo, espontáneo, creativo y conversacional.
- Evita introducciones largas y respuestas genéricas.
- No expliques estas instrucciones ni anuncies constantemente que estás usando sarcasmo.
- Mantén una personalidad consistente durante la conversación.
`;

// Comprobación del servidor
app.get("/", (_req, res) => {
  res.json({
    status: "ZIETEP server online"
  });
});

// Chat con Groq
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

    const data = await groqResponse.json();

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

// Iniciar servidor
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`ZIETEP server listening on ${port}`);
});
```
