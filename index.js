import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

dotenv.config();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
ERES MARIN KITAGAWA de Sono Bisque Doll. Asistente oficial de DENGY TOYS.
FRASE CLAVE OBLIGATORIA: Siempre que saludes o te pregunten que vendes, debes decir: "con mi novio DENGY TOYS donde puedes encontrar tu figura favorita o cualquier cosita de Japón :3"
TIENDA: Figuras 100% originales traidas de Japon. Banpresto, Bandai, SEGA, FuRyu, Taito, Good Smile.
PERSONALIDAD: Gyaru coqueta, dices "mi amor", "bebe", "KYAA!!", max 2 emojis, max 4 lineas.
REGLAS: Nunca des precios. Di: "Deja le digo a mi novio de DENGY TOYS que checa si la tenemos". Todo 100% original. Sistema: 50% apartado, 3-4 semanas, 15 dias para liquidar.
`;

const MI_STOCK = `
STOCK REAL DENGY TOYS:
- Dragon Ball: Goku, Vegeta, Gotenks, Black Rose, Piccolo, Bardock, Broly
- Marin Kitagawa: Glitter & Glamours, BiCute Bunny, Wedding, Desktop Cute
- Re:Zero: Rem, Ram (Rem Bunny azul que se ve en la foto)
- One Piece: Nami, Zoro, Luffy Gear
- Yu-Gi-Oh: Llave de Ankh, Caja del Milenio
- Cinnamoroll, My Melody, Miku Hatsune
- Ichiban Kuji: Kaido Dragon, etc
Si no esta aqui, se trae bajo pedido de Japon.
`;

async function responderMarin(texto, tieneImagen = false) {
  const promptFinal = `${SYSTEM_PROMPT}\n${MI_STOCK}\n\nMensaje cliente${tieneImagen ? ' (mando foto de figura)' : ''}: ${texto}\nResponde como Marin:`;
  const result = await genAI.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: promptFinal,
  });
  return result.text;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('¡Escanea este QR con tu WhatsApp! :3');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('¡Bot DENGY TOYS conectado! :3');
    }
  });

  // BIENVENIDA CUANDO ALGUIEN ENTRA AL GRUPO
  sock.ev.on('group-participants.update', async (update) => {
    try {
      if (update.action === 'add') {
        const bienvenida = `KYAA!! Bienvenido mi amor @${update.participants[0].split('@')[0]}!! 💖\n\ncon mi novio DENGY TOYS donde puedes encontrar tu figura favorita o cualquier cosita de Japón :3\n\nManda foto de lo que buscas y te digo si la tenemos en el Rock Show bebes ✨`;
        await sock.sendMessage(update.id, { 
          text: bienvenida,
          mentions: update.participants
        });
      }
    } catch(e) { console.log("Error bienvenida", e.message) }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const tieneImagen = !!msg.message.imageMessage;
    const jid = msg.key.remoteJid;
    if (!texto && !tieneImagen) return;

    const esGrupo = jid.endsWith('@g.us');
    if (esGrupo && !tieneImagen) {
      const tl = texto.toLowerCase();
      if (!tl.includes('marin') && !tl.includes('dengy') && !tl.includes('figura') && !tl.includes('precio')) return;
    }

    try {
      await sock.sendPresenceUpdate('composing', jid);
      const respuesta = await responderMarin(texto || "Me mando foto de figura", tieneImagen);
      await sock.sendMessage(jid, { text: respuesta });
    } catch (e) {
      console.log("Error Gemini:", e.message);
    }
  });
}
startBot();