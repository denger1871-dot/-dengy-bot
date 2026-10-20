import express from "express";
import { MARIN_PERSONALITY, ANIMES, MARCAS } from "./marin.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Bot Dengy Toys - Activo ✅</h1>
    <h2>💖 Marin Kitagawa lista!</h2>
    <p>Conoce ${ANIMES.length} animes</p>
    <p>Marcas: ${Object.keys(MARCAS).join(", ")}</p>
    <p><b>PURO ORIGINAL, NADA BOOTLEG</b></p>
    <p>${MARIN_PERSONALITY}</p>
  `);
});

app.get("/animes", (req, res) => res.json(ANIMES));
app.get("/marcas", (req, res) => res.json(MARCAS));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Marin prendida en " + PORT));
