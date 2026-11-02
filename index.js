import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;
import express from 'express';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { getMarinResponse } from './marin.js';

const app = express();
app.get('/', (req, res) => res.send('Marin Bot Live - revisa logs para QR'));
app.listen(process.env.PORT || 10000, () => console.log('Server en puerto 10000 - Bot iniciando'));

console.log('Iniciando Baileys...');
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    console.log('Auth cargado, creando socket...');
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), browser: ["Marin", "Chrome", "1.0"] });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
      console.log('Update conexion:', JSON.stringify(update));
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        console.log('========== QR DETECTADO ==========');
        qrcode.generate(qr, { small: true });
        console.log('==================================');
      }
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Conexion cerrada, reconectando:', shouldReconnect);
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
      try {
        const respuesta = await getMarinResponse(texto);
        await sock.sendMessage(msg.key.remoteJid, { text: respuesta });
      } catch (e) { console.log('Error marin:', e.message); }
    });
  } catch (e) {
    console.log('ERROR FATAL AL INICIAR:', e);
  }
}
startBot();
