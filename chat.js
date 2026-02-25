// ============================================================
// chat.js — Lógica del chatbot Q&A con Gemini
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Mostrar mensaje de bienvenida
    appendMessage("bot", CONFIG.WELCOME_MSG);

    // Enviar con botón
    sendBtn.addEventListener("click", handleSend);

    // Enviar con Enter
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
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
            const response = await askGemini(text);
            removeTyping(typingId);
            appendMessage("bot", response);
        } catch (err) {
            removeTyping(typingId);
            appendMessage("bot", "Ocurrió un error al procesar tu pregunta. Por favor intenta de nuevo.");
            console.error("Error:", err);
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    async function askGemini(question) {
        // Construir el catálogo Q&A como texto para el prompt
        const qaCatalog = QA_DATA.map((item, i) =>
            `${i + 1}. Pregunta: "${item.q}"\n   Respuesta: "${item.a}"`
        ).join("\n\n");

        const payload = {
            question: question,
            qaCatalog: qaCatalog,
            noAnswerMsg: CONFIG.NO_ANSWER_MSG
        };

        const res = await fetch(CONFIG.WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.answer || CONFIG.NO_ANSWER_MSG;
    }

    function appendMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("message-wrapper", role === "user" ? "user-wrapper" : "bot-wrapper");

        if (role === "bot") {
            const avatar = document.createElement("div");
            avatar.classList.add("avatar");
            avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="url(#botGrad)"/>
        <path d="M8 12h8M12 8v8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <defs><linearGradient id="botGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
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

        // Animate in
        requestAnimationFrame(() => {
            bubble.classList.add("visible");
        });

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
      <circle cx="12" cy="12" r="10" fill="url(#botGrad2)"/>
      <path d="M8 12h8M12 8v8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <defs><linearGradient id="botGrad2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
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
