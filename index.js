import pkg from "@whiskeysockets/baileys";
const makeWASocket = pkg.default;
const { useMultiFileAuthState, DisconnectReason } = pkg;
import { getMarinResponse } from "./marin.js";
import P from "pino";
import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Marin Bot DENGY TOYS online ❤️'));
app.listen(PORT, () => console.log(`Server en puerto ${PORT} - Bot iniciando`));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ["DENGY-BOT", "Chrome", "1.0"]
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(shouldReconnect) startBot();
    } else if(connection === 'open') {
      console.log('¡CONECTADO! Marin lista ❤️');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if(!text) return;
    const respuesta = await getMarinResponse(text);
    await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
  });
}
startBot();
   
     
 
