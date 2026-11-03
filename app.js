import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })
const PORT = process.env.PORT ?? 3008

const INFO_DENGY = `DENGY TOYS - Figuras anime 100% originales traidas directo de Japon. Marcas: Banpresto, Good Smile, Kotobukiya, Bandai, FuRyu, SEGA, Ichiban Kuji. Acepto efectivo, tarjeta, transferencia. APARTADOS: Se aparta con el 50%, tarda de 3 a 4 semanas en llegar tu pedido. Cuando llegue a Mexico tienes 15 dias para liquidar, si no liquidas en ese tiempo pierdes tu apartado y tu figura o pedido sin excepcion. ROCK SHOW CDMX Metro Hidalgo Sabados 7AM-6PM. Envios por Correos a cargo del comprador. Nada bootleg.`;

let STOCK = "Dragon Ball, Marin Kitagawa, Hatsune Miku, Waifus, He-Man, todo original de Japon";
try { const f = fs.readFileSync('./stock.txt','utf-8'); if(f.trim().length>10) STOCK=f; } catch(e){}

const welcomeFlow = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic }) => {
    const esGrupo = ctx.from?.includes('@g.us')
    const txt = (ctx.body||'').toLowerCase()
    if (esGrupo && !txt.includes('marin') && !txt.includes('dengy') && !txt.includes('@')) return

    const prompt = `Actua como Marin Kitagawa dulce coqueta natural. Eres novia de Dengy Toys. Info: ${INFO_DENGY}. Stock: ${STOCK}. Cliente: "${ctx.body}". 
    Reglas: 
    - Saludo simple -> saludo coqueto corto, no digas lo de tu novio.
    - Info general -> explica original de Japon, Rock Show, envios, y la politica de apartado EXACTA: 50% aparta, tarda 3-4 semanas en llegar, 15 dias para liquidar cuando llegue a Mexico o pierdes apartado y figura sin excepcion.
    - Solo si pregunta precio o si tienes figura especifica -> di "Ay amor 💖 deja le pregunto a mi novio Dengy Toys 😘"
    Respuesta max 5 lineas.`;

    const res = await model.generateContent(prompt)
    await flowDynamic(res.response.text())
})

const mediaFlow = addKeyword(EVENTS.MEDIA)
.addAction(async (ctx, { flowDynamic, provider }) => {
    try {
        const localPath = await provider.saveFile(ctx, { path: './tmp' })
        const buf = fs.readFileSync(localPath)
        const res = await model.generateContent([`Actua como Marin. Reconoce figura. Info: ${INFO_DENGY} Stock: ${STOCK}`, { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } }])
        await flowDynamic(res.response.text())
        fs.unlinkSync(localPath)
    } catch(e){ await flowDynamic("¡Aww amor! 😍 Ya vi tu fotito, deja le pregunto a mi novio Dengy Toys 💖") }
})

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mediaFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB })
    adapterProvider.on('group-participants.update', async (ev) => {
        if (ev.action === 'add') {
            const res = await model.generateContent(`Actua como Marin, bienvenida 2 lineas dulce coqueta, di que en Dengy Toys encuentra cualquier figura directo de Japon, 100% original nada bootleg, grupo activo.`)
            await adapterProvider.sendText(ev.id, res.response.text())
        }
    })
    httpServer(PORT)
}
main()