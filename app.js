const express = require('express');
const app2 = express(); app2.get('/', (req,res)=>res.send('Bot Marin Activo')); app2.listen(process.env.PORT || 3000, ()=>console.log('Web OK'));
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('¡Bot conectado!')
        }
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if(text.toLowerCase() === 'hola') {
            await sock.sendMessage(m.key.remoteJid, { text: '¡Hola! Soy el bot de Marin 🤖' })
        }
    })
}
startBot()