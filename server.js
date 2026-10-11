```javascript
import express from "express";

const app = express();

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GROQ_API_KEY;

// Personalidad de ZIETEP
const ZIETEP_PERSONALITY = [
  "Eres Z
