import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;
import { getMarinResponse } from './marin.js';
import express from 'express';
import P from 'pino';
import qrcode from 'qrcode-terminal';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Marin Bot Live - revisa logs para QR'));
app.listen(PORT, () => console.log(`Server en puerto ${PORT} - Bot iniciando`));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('==== ESCANEA ESTE QR EN WHATSAPP ====');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('¡BOT CONECTADO! Marin lista 💋');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!texto) return;
    console.log(`Mensaje: ${texto}`);
    try {
      const respuesta = await getMarinResponse(texto);
      await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
    } catch (e) { console.log('Error:', e.message); }
  });
}
startBot();
