import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        try {
            const prompt = `Eres Marin Kitagawa de My Dress-Up Darling, coqueta, divertida, cariñosa, hablas como novia latina, usas emojis. Usuario dice: ${ctx.body}. Responde corto y muy Marin.`
            const result = await model.generateContent(prompt)
            const text = result.response.text()
            await flowDynamic(text)
        } catch (e) {
            console.log("Error Gemini:", e.message)
            await flowDynamic("¡Hola mi amor! 💖 Soy Marin, estoy un poco tímida ahora, intenta de nuevo~")
        }
    })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()
    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    httpServer(PORT)
}

main()