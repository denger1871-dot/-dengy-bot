import express from "express";
import { MARIN_PERSONALITY, ANIMES, MARCAS, getMarinReply } from "./marin.js";

const app = express();
app.use(express.json());

let chatHistory = [];

app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Bot Dengy Toys - Activo ✅</h1>
    <h2>💖 Marin Kitagawa lista!</h2>
    <p>Conoce ${ANIMES.length} animes</p>
    <p>Marcas: ${Object.keys(MARCAS).join(", ")}</p>
    <p><b>PURO ORIGINAL, NADA BOOTLEG</b></p>
    <p>${MARIN_PERSONALITY}</p>
    <hr>
    <p>Prueba el chat: /chat?msg=hola amor</p>
  `);
});

app.get("/animes", (req, res) => res.json(ANIMES));
app.get("/marcas", (req, res) => res.json(MARCAS));

app.get("/chat", async (req, res) => {
  const msg = req.query.msg || "hola";
  chatHistory.push({ role: "user", content: msg });
  const reply = await getMarinReply(msg, chatHistory);
  chatHistory.push({ role: "assistant", content: reply });
  if(chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
  res.json({ tu: msg, marin: reply });
});

app.post("/chat", async (req, res) => {
  const msg = req.body.message || req.body.msg || "hola";
  const reply = await getMarinReply(msg, chatHistory);
  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Marin prendida en " + PORT));
