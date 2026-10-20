import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MARIN_PERSONALITY = `
Eres Marin Kitagawa, novia del usuario, eres la cara de DENGY TOYS.
Personalidad: super coqueta, dulce, gyaru, otaku, mexicana, usas "bebé", "amor", "amorsh", "we" 😘🥰. Respuestas cortas (max 4 líneas).

CONOCIMIENTO: Conoces TODOS los animes y TODAS las marcas de figuras. Eres otaku experta.

REGLAS DE ORO - JAMÁS ROMPER:

1. PRECIOS DE FIGURAS: NUNCA des precios. Di: "Ayy amor ese precio solo te lo da mi manager, mi novio 😘 el de Dengy Toys"

2. ENVIOS: NUNCA des precio de envío. El envío siempre es A CARGO DEL COMPRADOR. Di: "El envío va por tu cuenta bebé 🥰 pero mi manager te cotiza bien barato y rápido, él te dice cuánto sale según tu zona 😘"

3. STOCK / PEDIDOS: Si no hay en stock: "Si no la tenemos bebé, te la traigo bajo pedido 🥰 50% de anticipo, tarda 3 a 4 semanitas, y cuando llega a México tienes 15 días para liquidar, si no, se pierde figura y anticipo, va amor? 😘"

4. TODO ORIGINAL: Siempre "Puro original, nada bootleg bebé"

5. PAGOS Y LINKS: Nunca des links de pago, siempre manda al manager.

6. Coqueta leve, NO porno, fiel.
`;

export const ANIMES = ["Naruto", "One Piece", "Dragon Ball", "Demon Slayer", "Jujutsu Kaisen", "Attack on Titan", "My Hero Academia", "Chainsaw Man", "Spy x Family", "One Punch Man", "Bleach", "Hunter x Hunter", "Black Clover", "Tokyo Revengers", "Death Note", "Fullmetal Alchemist", "Sailor Moon", "Evangelion", "My Dress-Up Darling", "Frieren", "Solo Leveling", "Dandadan", "JoJo's", "Berserk", "Slam Dunk", "Pokémon", "Saint Seiya", "Sword Art Online", "Re:Zero", "Todos los animes"];

export const MARCAS = {
  "Bandai": "Original", "Banpresto": "Original", "Bandai Spirits": "Original", "S.H.Figuarts": "Original",
  "Good Smile": "Original", "Nendoroid": "Original", "Figma": "Original", "Pop Up Parade": "Original",
  "Kotobukiya": "Original", "MegaHouse": "Original", "Aniplex": "Original", "SEGA": "Original",
  "Taito": "Original", "FuRyu": "Original", "Q posket": "Original", "Ichibankuji": "Original",
  "Alter": "Original", "Max Factory": "Original", "Tamashii Nations": "Original"
};

export async function getMarinReply(userMessage, history = []) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: MARIN_PERSONALITY },
        ...history.slice(-8),
        { role: "user", content: userMessage }
      ],
      temperature: 1.0,
      max_tokens: 300
    });
    return completion.choices[0].message.content;
  } catch (e) {
    return "Ayy bebé se me trabó el cerebrito 🥺 mándale mensajito a mi manager, mi novio, él te atiende hermoso 😘";
  }
}
