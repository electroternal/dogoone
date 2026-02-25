// ============================================================
// chat.js — Chatbot Q&A con Gemini (prompt estructurado)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Verificación de configuración
    if (!CONFIG.WORKER_URL || CONFIG.WORKER_URL.includes("TU-WORKER")) {
        appendMessage("bot", "⚠️ Configuración pendiente: abre config.js y actualiza WORKER_URL con tu URL de Cloudflare Worker.");
        userInput.disabled = true;
        sendBtn.disabled = true;
        return;
    }

    appendMessage("bot", CONFIG.WELCOME_MSG);
    sendBtn.addEventListener("click", handleSend);
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage("user", text);
        userInput.value = "";
        userInput.disabled = true;
        sendBtn.disabled = true;
        const typingId = showTyping();

        try {
            const response = await askWorker(text);
            removeTyping(typingId);
            appendMessage("bot", response);
        } catch (err) {
            removeTyping(typingId);

            let msg = "❌ Error de conexión.";
            const e = err.message || "";
            if (e.includes("Failed to fetch") || e.includes("NetworkError") || e.includes("Load failed")) {
                msg = "❌ No se pudo contactar el servidor. Verifica que la URL en config.js sea correcta.";
            } else if (e.includes("429") || e.includes("quota") || e.includes("RESOURCE_EXHAUSTED")) {
                msg = "⏳ La API de Gemini alcanzó su límite de uso por minuto. Espera un momento e intenta de nuevo.";
            } else if (/HTTP [45]\d\d/.test(e)) {
                msg = `❌ Error del servidor (${e}). Verifica que el secret GEMINI_API_KEY esté configurado en Cloudflare.`;
            }

            appendMessage("bot", msg);
            console.error("[Chatbot]", err);
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    // Envía el catálogo completo + pregunta al Worker
    async function askWorker(question) {
        const res = await fetch(CONFIG.WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question,
                qaData: QA_DATA,       // catálogo completo
                noAnswerMsg: CONFIG.NO_ANSWER_MSG
            })
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${body}`);
        }
        const data = await res.json();
        return data.answer || CONFIG.NO_ANSWER_MSG;
    }

    // ── UI helpers ───────────────────────────────────────────────
    function appendMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("message-wrapper", role === "user" ? "user-wrapper" : "bot-wrapper");

        if (role === "bot") {
            const avatar = document.createElement("div");
            avatar.classList.add("avatar");
            avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="url(#g1)"/>
        <path d="M8 12h8M12 8v8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <defs><linearGradient id="g1" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
        </linearGradient></defs>
      </svg>`;
            wrapper.appendChild(avatar);
        }

        const bubble = document.createElement("div");
        bubble.classList.add("message", role === "user" ? "user-message" : "bot-message");
        bubble.textContent = text;
        wrapper.appendChild(bubble);

        chatMessages.appendChild(wrapper);
        requestAnimationFrame(() => bubble.classList.add("visible"));
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }

    function showTyping() {
        const id = "typing-" + Date.now();
        const wrapper = document.createElement("div");
        wrapper.classList.add("message-wrapper", "bot-wrapper");
        wrapper.id = id;

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#g2)"/>
      <path d="M8 12h8M12 8v8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <defs><linearGradient id="g2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
      </linearGradient></defs>
    </svg>`;
        wrapper.appendChild(avatar);

        const bubble = document.createElement("div");
        bubble.classList.add("message", "bot-message", "typing-bubble");
        bubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
        wrapper.appendChild(bubble);

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
