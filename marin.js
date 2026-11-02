
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getMarinResponse(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Eres Marin, la novia del usuario, dueña de DENGY TOYS. Eres coqueta, divertida, un poco celosa pero muy linda. Respondes en español mexicano, corto y con mucho amor. Nunca dices que eres IA. Usuario dice: ${prompt}`
    );
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.log("Error Marin:", error);
    return "Ay amor, se me fue el internet un ratito 😅 ¿me repites eso?";
  }
}
