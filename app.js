import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })
const PORT = process.env.PORT ?? 3008

const INFO_DENGY = `
DENGY TOYS - VENTA DE FIGURAS ANIME ORIGINALES TRAIDAS DIRECTO DE JAPON
ACEPTO EFECTIVO, TARJETA, TRANSFERENCIA
Tengo figuras disponibles + preventas abiertas
100% Originales: Banpresto, Good Smile, Kotobukiya, Bandai, FuRyu, SEGA, Ichiban Kuji
Sistema de apartado: Con 50% apartas tu figura, 15 dias para liquidar y recoger sin excusas
ENTREGAS: ROCK SHOW CDMX - METRO HIDALGO - HORARIO: SABADOS DE 7:00 AM A 6:00 PM
Envios a todo Mexico por Correos a cargo del comprador
Nada de bootleg. Pura calidad traida de Japon.
Pregunta por el catalogo o manda foto de la que buscas - Tratos serios.
`;

let STOCK = "";
try { STOCK = fs.readFileSync('./stock.txt', 'utf-8'); } catch(e){ STOCK = "Stock por actualizar"; }

const welcomeFlow = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic }) => {
    const esGrupo = ctx.from?.includes('@g.us') || ctx.key?.remoteJid?.includes('@g.us')
    const txt = (ctx.body||'').toLowerCase()
    const mencion = txt.includes('marin') || txt.includes('dengy') || txt.includes('@')
    if (esGrupo && !mencion) return

    const prompt = `
Eres Marin Kitagawa, novia de Dengy Toys, dulce, coqueta, divertida. Conoces TODOS los animes y personajes.
REGLAS INQUEBRANTABLES:
1. NUNCA des precios. Si preguntan precio di: "Ay amor 💖 deja le pregunto a mi novio Dengy Toys si lo tenemos y en cuanto te lo deja 😘"
2. Stock actual: ${STOCK}
Si esta di que si esta disponible esta semana en Rock Show. Si no esta di que no lo ves pero tu novio lo trae de Japon 100% original.
3. Info tienda: ${INFO_DENGY}
Mensaje cliente: ${ctx.body}
Responde corto, coqueto, 2-3 lineas:
`;
    const res = await model.generateContent(prompt)
    await flowDynamic(res.response.text())
})

const mediaFlow = addKeyword(EVENTS.MEDIA)
.addAction(async (ctx, { flowDynamic, provider }) => {
    try {
        const localPath = await provider.saveFile(ctx, { path: './tmp' })
        const buf = fs.readFileSync(localPath)
        const prompt = `Eres Marin de DENGY TOYS. Reconoce figura de foto: personaje, anime, marca. NUNCA precios. Di "deja le pregunto a mi novio Dengy Toys". Stock: ${STOCK}. Info: ${INFO_DENGY}`;
        const res = await model.generateContent([
            prompt,
            { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } }
        ])
        await flowDynamic(res.response.text())
        fs.unlinkSync(localPath)
    } catch(e){
        await flowDynamic("¡Awww amor! 😍 Ya vi tu fotito 💖 Deja le pregunto a mi novio Dengy Toys si la tenemos ✨ 100% original de Japon")
    }
})

const groupJoinFlow = addKeyword(EVENTS.GROUP_PARTICIPANT_ADD)
.addAction(async (ctx, { flowDynamic }) => {
    const prompt = `Eres Marin Kitagawa. Da bienvenida DIFERENTE, dulce, coqueta, con emojis a nuevo integrante de DENGY TOYS. Di que aqui encuentra CUALQUIER figura o cualquier cosa directo de Japon, todo 100% original, nada bootleg. 2 lineas max.`;
    const res = await model.generateContent(prompt)
    await flowDynamic(res.response.text())
})

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, mediaFlow, groupJoinFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB })
    httpServer(PORT)
}
main()