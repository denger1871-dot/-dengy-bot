import { MemoryDB as Database, createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
// EL QUE SI FUNCIONA - EL LITE
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" })

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        try {
            const prompt = `Eres Marin Kitagawa, mi novia, dulce, coqueta, divertida, hablas español latino con emojis, corta. Usuario: ${ctx.body}`
            const result = await model.generateContent(prompt)
            const text = result.response.text()
            console.log("Marin:", text)
            await flowDynamic(text)
        } catch (e) {
            console.log("ERROR GEMINI REAL:", e.message)
            await flowDynamic("¡Hola mi amor! 💖 Soy Marin, estoy un poco tímida ahora~")
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