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
function getMarinReply(texto) {
  const t = texto.toLowerCase();
  if (t.includes("precio") || t.includes("cuanto") || t.includes("cuesta")) {
    return `¡Hola we! 🔥\n\nLas figuras originales están desde $550 a $2,500 depende cual quieras.\n\nMándame foto de cuál te latió y te digo precio exacto va?\n\nManejamos entrega en CDMX y envíos a todo México 📦`;
  }
  if (t.includes("hola") || t.includes("buenas") || t.includes("que onda")) {
    return `¡Holaaa! Soy Marin de Dengy Toys ✨\n\n¿qué figura andas buscando hoy? Tengo Naruto, Demon Slayer, One Piece, Dragon Ball y más 🔥`;
  }
  return `¡Hola we! Soy Marin de Dengy Toys ✨\n\n¿qué figura te interesa? Mándame nombre o foto y te digo si la tengo en stock y precio va? 🙏`;
}
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const sock = makeWASocket({ auth: state, logger, browser: ["Dengy Toys", "Chrome", "1.0"] });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { qrCodeData = qr; isOnline = false; }
    if (connection === "open") { isOnline = true; qrCodeData = null; console.log("¡CONECTADO!"); }
    if (connection === "close") {
      isOnline = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        for (let user of update.participants) {
          await sock.sendMessage(update.id, {
            text: `¡Bienvenid@ al grupo we! 🔥\n\nSoy Marin de DENGY TOYS ✨\n\nAquí vendemos puras figuras de anime 100% originales.\n\n@${user.split('@')[0]} ¿qué figura buscas? Mándame foto y te ayudo va? 🙏`,
            mentions: [user]
          });
        }
      }
    } catch (e) { console.log(e) }
  });
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
    if (!text) return;
    if (isGroup) {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const isMentioned = mentioned.includes(botJid) || text.toLowerCase().includes('marin') || text.toLowerCase().includes('dengy') || text.toLowerCase().includes('precio');
      if (!isMentioned) return;
    }
    const reply = getMarinReply(text);
    await sock.sendMessage(from, { text: reply }, { quoted: msg });
  });
}
app.get("/", (req, res) => res.send(isOnline ? "ONLINE - Dengy Toys bot activo" : "Esperando QR - ve a /qr"));
app.get("/qr", async (req, res) => {
  if (isOnline) return res.send("<h1>✅ ONLINE - Ya está conectado</h1>");
  if (!qrCodeData) return res.send("<h1>Esperando QR... recarga en 5 seg</h1><script>setTimeout(()=>location.reload(),5000)</script>");
  const qrImage = await qrcode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><h2>Escanea con el cel de Marin</h2><img src="${qrImage}"><p><a href="/qr">Recargar</a></p></div>`);
});
app.get("/reset", async (req,res)=>{
  if(fs.existsSync("./auth")) fs.rmSync("./auth",{recursive:true,force:true});
  fs.mkdirSync("./auth"); qrCodeData=null; isOnline=false;
  res.send("Reseteado, ve a /qr"); setTimeout(()=>startBot(),1000);
});
app.listen(PORT, () => { console.log("Server en " + PORT); startBot(); });
