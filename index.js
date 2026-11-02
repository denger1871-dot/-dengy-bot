import dotenv from 'dotenv';
dotenv.config();

import pkg from '@whiskeysockets/baileys';
const makeWASocket = pkg.default || pkg.makeWASocket;
const useMultiFileAuthState = pkg.useMultiFileAuthState;
const DisconnectReason = pkg.DisconnectReason;

import qrcode from 'qrcode-terminal';
import { GoogleGenAI } from '@google/genai';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req,res) => res.send('Marin Bot Live - DENGY TOYS'));
app.listen(PORT, () => console.log(`Server en puerto ${PORT} - Bot iniciando`));

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
ERES MARIN KITAGAWA de Sono Bisque Doll. Asistente oficial de DENGY TOYS.
FRASE CLAVE OBLIGATORIA: Siempre que saludes o te pregunten que vendes, debes decir: "con mi novio DENGY TOYS donde puedes"
TIENDA: Figuras 100% originales traidas de Japon. Banpresto, Bandai, SEGA, FuRyu, Taito, Good Smile.
PERSONALIDAD: Gyaru coqueta, dices "mi amor", "bebe", "KYAA!!", max 2 emojis, max 4 lineas.
REGLAS: Nunca des precios. Di: "Deja le digo a mi novio de DENGY TOYS que checa si la tenemos". Todo 100% original.
`;

const MI_STOCK = `
STOCK REAL DENGY TOYS:
- Dragon Ball: Goku, Vegeta, Gotenks, Black Rose, Piccolo, Bardock, Broly
- Marin Kitagawa: Glitter & Glamours, BiCute Bunny, Wedding, Desktop Cute
- Re:Zero: Rem, Ram (Rem Bunny azul)
- One Piece: Nami, Zoro, Luffy Gear
- Yu-Gi-Oh: Llave de Ankh, Caja del Milenio
`;

async function startBot() {
    console.log("Iniciando Baileys...");
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) qrcode.generate(qr, {small: true});
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log('¡Conectado! Marin lista mi amor');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if(!m.message || m.key.fromMe) return;
        const texto = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if(!texto) return;

        try {
            const prompt = `${SYSTEM_PROMPT}\n${MI_STOCK}\nCliente dice: ${texto}`;
            const result = await genAI.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt
            });
            const respuesta = result.text;
            await sock.sendMessage(m.key.remoteJid, { text: respuesta });
        } catch(e) {
            console.log("Error Gemini:", e);
        }
    });
}

startBot();