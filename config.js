// ============================================================
// config.js — Configuración del chatbot
// ============================================================
// SOLO pon aquí la URL de tu Cloudflare Worker.
// La API key de Gemini NUNCA debe estar en este archivo.
// ============================================================

const CONFIG = {
    // Reemplaza esta URL con la URL de tu Cloudflare Worker después de desplegarlo.
    // Ejemplo: "https://chatbot-qa.tu-usuario.workers.dev"
    WORKER_URL: "chatbot-qa.electroternal.workers.dev",

    // Mensaje que se muestra cuando no hay respuesta en el catálogo
    NO_ANSWER_MSG: "Lo siento, no tengo información sobre eso. Por favor contacta a nuestro equipo de soporte.",

    // Nombre del asistente que aparece en el chat
    BOT_NAME: "Asistente Virtual",

    // Mensaje de bienvenida
    WELCOME_MSG: "¡Hola! Soy el asistente virtual de la empresa. ¿En qué puedo ayudarte hoy?"
};

