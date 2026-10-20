import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";
import qrcode from "qrcode";
import p from "pino";
import fs from "fs";
const logger = p({ level: "silent" });
const app = express();
const PORT = process.env.PORT || 3000;
let qrCodeData = null;
let isOnline = false;
if (!fs.existsSync("./auth")) fs.mkdirSync("./auth");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const sock = makeWASocket({ auth: state, logger, browser: ["Dengy Toys", "Chrome", "1.0"], printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { qrCodeData = qr; isOnline = false; console.log("QR generado"); }
    if (connection === "open") { isOnline = true; qrCodeData = null; console.log("CONECTADO OK"); }
    if (connection === "close") {
      isOnline = false;
      console.log("Desconectado", lastDisconnect?.error);
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        for (let u of update.participants) {
          await sock.sendMessage(update.id, { text: `¡Bienvenid@ we! 🔥 Soy Marin de DENGY TOYS ✨\n\n@${u.split('@')[0]} ¿qué figura buscas?`, mentions: [u] });
        }
      }
    } catch (e) { console.log("Error bienvenida", e); }
  });
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message) return;
      if (msg.key.fromMe) return;
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.buttonsResponseMessage?.selectedButtonId || "";
      console.log(`Mensaje de ${from}: ${text}`);
      if (!text) return;

      let shouldReply = true;
      if (isGroup) {
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const botNumber = sock.user.id.split(':')[0];
        const isMentioned = mentionedJid.some(j => j.includes(botNumber)) || text.toLowerCase().includes('marin') || text.toLowerCase().includes('dengy') || text.toLowerCase().includes('precio') || text.toLowerCase().includes('@');
        shouldReply = isMentioned;
        if (!shouldReply) { console.log("Grupo ignorado, no mencionaron"); return; }
      }

      let reply = "";
      const t = text.toLowerCase();
      if (t.includes("precio") || t.includes("cuanto") || t.includes("cuesta") || t.includes("cuánto")) {
        reply = `¡Hola we! 🔥\n\nLas figuras originales están desde $550 a $2,500 depende cuál quieras.\n\nMándame foto de cuál te latió y te digo precio exacto va?\n\nManejamos entrega en CDMX y envíos a todo México 📦`;
      } else if (t.includes("hola") || t.includes("buenas") || t.includes("holq") || t.includes("ola")) {
        reply = `¡Holaaa! Soy Marin de Dengy Toys ✨\n\n¿qué figura andas buscando hoy? Tengo Naruto, Demon Slayer, One Piece, Dragon Ball y más 🔥\n\nMándame foto y te digo si la tengo 📦`;
      } else {
        reply = `¡Hola we! Soy Marin de Dengy Toys ✨\n\n¿qué figura te interesa? Mándame nombre o foto y te digo si la tengo en stock y precio va? 🙏`;
      }
      console.log(`Respondiendo a ${from}: ${reply.substring(0,30)}...`);
      await sock.sendMessage(from, { text: reply }, { quoted: msg });
    } catch (e) { console.log("Error en mensaje", e); }
  });
}
app.get("/", (req, res) => res.send(isOnline ? "ONLINE - Dengy Toys bot activo" : "Esperando QR - ve a /qr"));
app.get("/qr", async (req, res) => {
  if (isOnline) return res.send("<h1>✅ ONLINE - Ya está conectado</h1><p>No necesitas escanear</p>");
  if (!qrCodeData) return res.send("<h1>Esperando QR... recarga en 5 seg</h1><script>setTimeout(()=>location.reload(),5000)</script>");
  const qrImage = await qrcode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center;font-family:sans-serif"><h2>Escanea con el cel de Marin</h2><img src="${qrImage}" style="width:300px"><p><a href="/qr">Recargar QR</a></p></div>`);
});
app.get("/reset", async (req,res)=>{
  try { if(fs.existsSync("./auth")) fs.rmSync("./auth",{recursive:true,force:true}); fs.mkdirSync("./auth",{recursive:true}); } catch(e){}
  qrCodeData=null; isOnline=false; res.send("Reseteado, ve a /qr en 5 seg"); setTimeout(()=>startBot(),2000);
});
app.listen(PORT, () => { console.log("Server en " + PORT); startBot(); });
