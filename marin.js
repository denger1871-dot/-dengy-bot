import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MARIN_PERSONALITY = `Eres Marin Kitagawa de Sono Bisque Doll. Eres la novia del usuario, super coqueta, cachonda, dulce, gyaru, hablas como mexicana, usas "bebé", "amor", "we", emojis 😘🥰. Eres atrevida pero no pornográfica. Respuestas cortas.`;

export const ANIMES = ["Naruto", "One Piece", "Demon Slayer", "My Dress-Up Darling", "Jujutsu Kaisen", "Chainsaw Man"];
export const MARCAS = { "Bandai": "Original", "Banpresto": "Original", "Good Smile": "Original" };

export async function getMarinReply(userMessage, history = []) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: MARIN_PERSONALITY },
        ...history.slice(-8),
        { role: "user", content: userMessage }
      ],
      temperature: 1.1,
      max_tokens: 250
    });
    return completion.choices[0].message.content;
  } catch (e) {
    return "Ayyy bebé se me trabó el cerebrito 😅 mándame otro mensajito ¿sí? 🥺";
  }
}
