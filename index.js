import express from "express";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import { getMarinReply } from "./marin.js";

const app = express();
let qrCodeData = null;
let sock = null;

app.get("/", (req, res) => {
  res.send("DENGY TOYS - Marin activa - Ve a /qr para conectar WhatsApp");
});

app.get("/chat", (req, res) => {
  const msg = req.query.msg || "";
  const reply = getMarinReply(msg);
  res.send(reply);
});

app.get("/qr", async (req, res) => {
  if (!qrCodeData) {
    return res.send("<h1>Esperando QR... refresca en 5 seg</h1><p>Si ya conectaste, dice ONLINE</p><script>setTimeout(()=>location.reload(),5000)</script>");
  }
  try {
    const qrImage = await QRCode.toDataURL(qrCodeData);
    res.send(`<h1>Escanea este QR con tu WhatsApp DENGY TOYS</h1><img src="${qrImage}"><p>Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo</p><script>setTimeout(()=>location.reload(),10000)</script>`);
  } catch (e) {
    res.send(qrCodeData);
  }
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrCodeData = qr;
      console.log("QR generado, ve a /qr");
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("¡WhatsApp conectado!");
      qrCodeData = null;
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text) return;

    const reply = getMarinReply(text);
    
    await sock.sendMessage(msg.key.remoteJid, { text: reply });
  });
}

startBot();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Marin en puerto " + PORT));
