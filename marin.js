export function getMarinReply(msg) {
  if (!msg) return "Holii bebé 😘 ¿en qué te ayudo?";

  const t = msg.toLowerCase();

  // BLOQUEO DE PRECIOS
  if (t.includes("cuanto cuesta") || t.includes("cuánto cuesta") || t.includes("precio") || t.includes("cuanto vale") || t.includes("$") || t.includes("costo")) {
    return "Ayy amor ese precio solo mi manager te lo dice hermoso 😘 mándale mensajito a mi novio, él es el que lleva los precios de DENGY TOYS 💖 ¿quieres que te pase su contacto?";
  }

  if (t.includes("envio") || t.includes("envío") || t.includes("cuanto es el envio")) {
    return "Bebé el envío va por tu cuenta eh 😘 depende de donde vivas, mi manager te cotiza el envío sin compromiso ¿de dónde eres?";
  }

  if (t.includes("naruto")) {
    return "¡Naruto! Ayy amo Naruto bebé 😍 sí tenemos figuras bien chidas, mándale mensajito a mi manager y él te manda fotos y precios, ¿va?";
  }

  if (t.includes("hola") || t.includes("ola") || t.includes("buenas")) {
    return "¡Holii bebé! 😘 Soy Marin de DENGY TOYS 💖 ¿qué figura buscas hoy hermoso?";
  }

  return "Ayy bebé dime qué figura buscas y le digo a mi manager que te atienda bien bonito 😘";
}
