import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })
const PORT = process.env.PORT ?? 3008

const INFO_DENGY = `DENGY TOYS - VENTA DE FIGURAS ANIME ORIGINALES TRAIDAS DIRECTO DE JAPON. ACEPTO EFECTIVO, TARJETA, TRANSFERENCIA. 100% Originales: Banpresto, Good Smile, Kotobukiya, Bandai, FuRyu, SEGA, Ichiban Kuji. Apartado 50%, 15 dias para liquidar. ROCK SHOW CDMX METRO HIDALGO SABADOS 7AM-6PM. Envios por Correos. Nada bootleg.`;

let STOCK = "";
try { STOCK = fs.readFileSync('./stock.txt', 'utf-8'); } catch(e){ STOCK = "Stock por actualizar"; }

// SOLO MENSAJES - GRUPO SOLO SI MENCIONAN MARIN
const welcomeFlow = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic }) => {
    const esGrupo = ctx.from?.includes('@g.us') || ctx.key?.remoteJid?.includes('@g.us')
    const txt = (ctx.body||'').toLowerCase()
    const mencion = txt.includes('marin') || txt.includes('dengy') || txt.includes('@')
    if (esGrupo && !mencion) return

    const prompt = `Actua como Marin Kitagawa, dulce y coqueta natural, NO digas "soy dulce y coqueta" solo actua asi. Eres novia de Dengy Toys. Conoces todos los animes. REGLAS: NUNCA des precios, di "Ay amor 💖 deja le pregunto a mi novio Dengy Toys 😘". Stock: ${STOCK}. Info: ${INFO_DENGY}. Cliente: ${ctx.body}. Respuesta corta:`;
    const res = await model.generateContent(prompt)
    await flowDynamic(res.response.text())
})

const mediaFlow = addKeyword(EVENTS.MEDIA)
.addAction(async (ctx, { flowDynamic, provider }) => {
    try {
        const localPath = await provider.saveFile(ctx, { path: './tmp' })
        const buf = fs.readFileSync(localPath)
        const prompt = `Actua como Marin. Reconoce figura foto: personaje, anime, marca. NUNCA precios. Di que le preguntas a tu novio Dengy Toys. Stock: ${STOCK}`;
        const res = await model.generateContent([
            prompt,
            { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } }
        ])
        await flowDynamic(res.response.text())
        fs.unlinkSync(localPath)
    } catch(e){
        await flowDynamic("¡Aww amor! 😍 Ya vi tu fotito, deja le pregunto a mi novio Dengy Toys 💖")
    }
})

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mediaFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB })

    // ===== BIENVENIDA CUANDO ENTRA ALGUIEN AL GRUPO - ESTE ES EL FIX QUE NO TUMBA EL BOT =====
    adapterProvider.on('group-participants.update', async (ev) => {
        try {
            if (ev.action === 'add') {
                const prompt = `Actua como Marin Kitagawa, da bienvenida DIFERENTE, dulce, coqueta natural, 2 lineas, con emojis. Di que en Dengy Toys encuentra cualquier figura o cualquier cosa directo de Japon, todo 100% original, nada bootleg. Que el grupo es activo.`;
                const res = await model.generateContent(prompt)
                const texto = res.response.text()
                for (const participant of ev.participants) {
                    await adapterProvider.sendText(ev.id, texto)
                }
            }
        } catch(e){ console.log("Error bienvenida grupo", e.message) }
    })

    httpServer(PORT)
}
main()