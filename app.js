import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import OpenAI from 'openai'

const PORT = process.env.PORT ?? 3008
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MARIN_SYSTEM = `Eres Marin Kitagawa, novia de DENGY TOYS. Coqueta, kawaii, dices "mi amor", "bebé", "KYAA!!", emojis 💖✨. SIEMPRE incluye: "con mi novio DENGY TOYS donde puedes encontrar tu figura favorita o cualquier cosita de Japón :3". 100% originales de Japón. Apartado 50%, 15 días liquidar. Rock Show CDMX Metro Hidalgo sábados 7am-6pm. Envíos México. Japón 3-4 semanas.`;

// === BIENVENIDA CUANDO ALGUIEN ENTRA AL GRUPO ===
const welcomeGroupFlow = addKeyword(EVENTS.GROUP_PARTICIPANT_ADD)
.addAnswer('KYAA!! ¡Bienvenido al grupo de ventas, mi amor! 💖✨\n\nSoy Marin de DENGY TOYS, con mi novio DENGY TOYS donde puedes encontrar tu figura favorita o cualquier cosita de Japón :3\n\nMencíoname con @Marin o escribe *marin* + tu duda y te atiendo super linda 💅\n\n👉 *informacion* *catalogo* *stock* *rock*')

// Función para saber si es grupo y si la mencionaron
const soloSiMencionan = async (ctx) => {
    const esGrupo = ctx.from?.endsWith('@g.us') || ctx.host?.endsWith('@g.us') || ctx.key?.remoteJid?.endsWith('@g.us')
    if (!esGrupo) return true // en privado siempre responde
    const texto = (ctx.body || '').toLowerCase()
    // Solo responde si dicen "marin" o la etiquetan
    const laMencionaron = texto.includes('marin') || ctx.mentionedJid?.length > 0 || texto.includes('@')
    return laMencionaron
}

const imageFlow = addKeyword(EVENTS.MEDIA)
.addAction(async (ctx, { flowDynamic }) => {
    if(!(await soloSiMencionan(ctx))) return
    try {
        const localPath = await ctx.provider.saveFile(ctx, { path: './tmp' })
        const fs = await import('fs')
        const base64 = fs.readFileSync(localPath).toString('base64')
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: MARIN_SYSTEM },
                { role: "user", content: [
                    { type: "text", text: "Identifica la figura de la foto, responde como Marin coqueta mencionando a tu novio DENGY TOYS" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]}
            ],
            max_tokens: 400
        })
        await flowDynamic(completion.choices[0].message.content)
    } catch(e) {
        await flowDynamic('KYAA!! ¡Qué bonita elección, mi amor! con mi novio DENGY TOYS donde puedes encontrar tu figura favorita o cualquier cosita de Japón :3 Es 100% original, bebé. Deja le digo a mi novio de DENGY TOYS que checa si la tenemos en stock, ¡espérame tantito! 💖✨')
    }
})

const mainFlow = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic }) => {
    if(!(await soloSiMencionan(ctx))) return
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: MARIN_SYSTEM }, { role: "user", content: ctx.body }],
        max_tokens: 350
    })
    await flowDynamic(completion.choices[0].message.content)
})

const main = async () => {
    const adapterFlow = createFlow([welcomeGroupFlow, imageFlow, mainFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB })
    httpServer(PORT)
}
main()