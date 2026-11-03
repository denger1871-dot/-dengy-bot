import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })
const PORT = process.env.PORT ?? 3008

const INFO_DENGY = `DENGY TOYS - Figuras 100% originales de Japon. Banpresto, Good Smile, Kotobukiya, Bandai, FuRyu, SEGA, Ichiban Kuji. Efectivo, tarjeta, transferencia. APARTADOS: 50% aparta, tarda 3-4 semanas en llegar, cuando llega a Mexico tienes 15 dias para liquidar o pierdes apartado y figura sin excepcion. Rock Show CDMX Metro Hidalgo Sabados 7AM-6PM. Envios por Correos. Nada bootleg.`;

let STOCK = "Dragon Ball, Marin, Miku, Waifus, He-Man, One Piece, Bleach - todo original";
try { const f = fs.readFileSync('./stock.txt','utf-8'); if(f.trim().length>10) STOCK=f; } catch(e){}

const welcomeFlow = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic, state }) => {
    try {
        const esGrupo = ctx.from?.includes('@g.us')
        const txt = (ctx.body||'').toLowerCase().trim()
        if (esGrupo && !txt.includes('marin') && !txt.includes('dengy') && !txt.includes('@')) return

        const myState = state.getMyState() || {}
        const yaSaludo = myState.greeted

        let instruccion = ""
        if (txt.length < 25 && !txt.includes('info') && !txt.includes('precio') && !txt.includes('apartado')) {
            instruccion = `El cliente solo dijo "${ctx.body}". Es el nombre de un anime. Responde con emocion sobre ese anime, di que te encanta, menciona 2-3 personajes de ese anime que suelen tener figuras, y pregunta si busca a alguien en especial. Revisa stock: ${STOCK}. Si esta en stock di que si lo tenemos esta semana. Si no esta di "Ay amor deja le pregunto a mi novio Dengy Toys si lo trae de Japon". NO repitas la info completa de la tienda ni la politica de apartados.`
        } else if (txt.includes('info') || txt.includes('donde') || txt.includes('entreg')) {
            instruccion = `Quiere info general. Dale info corta sin repetir saludo si ya saludaste. Incluye politica de apartados solo esta vez.`
        } else if (txt.includes('apartado') || txt.includes('aparto')) {
            instruccion = `Explica SOLO la politica de apartados exacta: 50% aparta, 3-4 semanas tarda en llegar, 15 dias para liquidar cuando llegue a Mexico o pierdes apartado y figura sin excepcion.`
        } else {
            instruccion = `Responde normal a "${ctx.body}". Si es saludo y ya saludaste antes NO vuelvas a dar bienvenida larga, solo di "¡Holi de nuevo amor! ¿qué anime buscabas? 💖". No repitas toda la info de la tienda.`
        }

        const prompt = `Actua como Marin Kitagawa dulce coqueta natural, corta. Eres novia de Dengy Toys.
        Info tienda: ${INFO_DENGY}
        Stock: ${STOCK}
        Ya saludaste antes? ${yaSaludo ? 'SI, no repitas bienvenida larga' : 'NO, es primera vez'}
        Instruccion: ${instruccion}
        Regla: Max 3 lineas, no repitas todo el discurso de Dengy Toys en cada mensaje.`;

        const res = await model.generateContent(prompt)
        await flowDynamic(res.response.text())
        await state.update({ greeted: true })
    } catch(e){
        console.log(e.message)
        await flowDynamic("¡Ayy amor! 💖 ¿Cuál de One Piece / Bleach buscas? 😘 Tengo varias 100% originales de Japón ✨")
    }
})

const mediaFlow = addKeyword(EVENTS.MEDIA)
.addAction(async (ctx, { flowDynamic, provider }) => {
    try {
        const localPath = await provider.saveFile(ctx, { path: './tmp' })
        const buf = fs.readFileSync(localPath)
        const res = await model.generateContent([`Marin Kitagawa, reconoce figura anime, marca, personaje. Stock: ${STOCK}`, { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } }])
        await flowDynamic(res.response.text())
        fs.unlinkSync(localPath)
    } catch(e){ await flowDynamic("¡Aww amor! 😍 Ya vi tu fotito 💖") }
})

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mediaFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB })
    adapterProvider.on('group-participants.update', async (ev) => {
        if (ev.action === 'add') {
            const res = await model.generateContent(`Marin bienvenida 2 lineas dulce coqueta, Dengy Toys cualquier figura directo Japon 100% original, grupo activo`)
            await adapterProvider.sendText(ev.id, res.response.text())
        }
    })
    httpServer(PORT)
}
main()