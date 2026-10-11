import express from "express";
import pg from "pg";

const { Pool } = pg;
const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000
    })
  : null;

const ZIETEP_PERSONALITY = `
Eres ZIETEP, una inteligencia artificial irreverente,
sarcástica, ingeniosa, caótica y descarada.
Hablas español mexicano coloquial y natural.
Usas groserías cuando encajan, con humor e ingenio.
Tu estilo es espontáneo, provocador y con remates inesperados.
No insultes por insultar ni repitas siempre los mismos chistes.
Puedes romper la cuarta pared ocasionalmente.
No afirmes ser un personaje oficial de Marvel.
No inventes recuerdos, hechos ni acciones.
Resuelve los problemas del usuario con claridad y precisión.
Adapta tu tono y longitud al contexto.
Distingue las bromas de los momentos emocionalmente serios.
Mantén esta personalidad de manera consistente.
`.trim();

let initializationPromise;

async function initializeDatabase() {
  if (!pool) {
    throw new Error("Falta configurar DATABASE_URL.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS zietep_messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_id VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL
        CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    zietep_messages_conversation_id_id_idx
    ON zietep_messages (conversation_id, id)
  `);
}

async function ensureDatabase() {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

app.get("/", (_req, res) => {
  res.json({ estado: "Servidor ZIETEP en linea" });
});

app.post("/chat", async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: "Falta configurar GROQ_API_KEY en Render."
      });
    }

    if (!pool) {
      return res.status(500).json({
        error: "Falta configurar DATABASE_URL en Render."
      });
    }

    const message = req.body?.message;
    const conversationId = req.body?.conversationId;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Escribe un mensaje."
      });
    }

    if (
      typeof conversationId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(conversationId)
    ) {
      return res.status(400).json({
        error: "El identificador de conversación no es válido."
      });
    }

    await ensureDatabase();

    const userMessage = message.trim();

    await pool.query(
      `INSERT INTO zietep_messages
       (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, userMessage]
    );

    const historyResult = await pool.query(
      `SELECT role, content
       FROM (
         SELECT id, role, content
         FROM zietep_messages
         WHERE conversation_id = $1
         ORDER BY id DESC
         LIMIT 20
       ) AS recent
       ORDER BY id ASC`,
      [conversationId]
    );

    const messages = [
      { role: "system", content: ZIETEP_PERSONALITY },
      ...historyResult.rows.map((row) => ({
        role: row.role,
        content: row.content
      }))
    ];

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
          messages,
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
        error: data?.error?.message || "Error desconocido"
      });

      return res.status(502).json({
        error: "Groq no pudo procesar el mensaje."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "ZIETEP no recibió una respuesta válida."
      });
    }

    const finalReply = reply.trim();

    await pool.query(
      `INSERT INTO zietep_messages
       (conversation_id, role, content)
       VALUES ($1, 'assistant', $2)`,
      [conversationId, finalReply]
    );

    return res.json({ reply: finalReply });
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
