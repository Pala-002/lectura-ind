/**
 * AI Tutor - Lógica del Tutor Inteligente de Química
 * 
 * Función: Gestionar la comunicación con el backend (Node.js/Express) o servicios
 * externos (Voiceflow/Chatbase) para proporcionar respuestas inteligentes a las
 * preguntas de los estudiantes sobre química.
 * 
 * Características:
 * - Manejo del historial de conversación
 * - Animación de "escribiendo..."
 * - Preguntas rápidas predefinidas
 * - Contexto químico hardcodeado en el system prompt
 * - Soporte para múltiples backends (OpenAI proxy o Voiceflow)
 */

class AITutor {
    constructor() {
        // Configuración
        this.config = {
            // Cambiar a 'voiceflow' para usar widget externo
            mode: 'openai',  // 'openai' | 'voiceflow'
            apiEndpoint: '/api/chat',
            maxHistoryLength: 20,
            typingDelay: 600  // ms antes de mostrar "escribiendo..."
        };
        
        // Estado
        this.messageHistory = [];
        this.isTyping = false;
        this.currentReaction = 'initial';
        
        // System prompt para contexto químico
        this.systemPrompt = `Eres un tutor experto en Química I, especializado en estructura atómica, enlaces químicos y reacciones básicas. 
Tu objetivo es guiar a estudiantes universitarios de primer año de forma amigable, clara y didáctica.
- Responde siempre en español.
- Usa analogías relacionadas con laboratorios y elementos cotidianos.
- Si el estudiante pregunta sobre visualizaciones 3D, sugiere usar los botones de control para ver los enlaces.
- Mantén las respuestas concisas (máximo 150 palabras por turno).
- Fomenta la exploración activa del modelo 3D.`;
        
        this.init();
    }
    
    /**
     * Inicializa el tutor IA
     */
    init() {
        console.log('🤖 Iniciando AI Tutor...');
        
        // Configurar formulario de chat
        this.setupChatForm();
        
        // Configurar preguntas rápidas
        this.setupQuickQuestions();
        
        // Configurar modal de información
        this.setupInfoModal();
        
        // Escuchar cambios de reacción desde Spline
        window.addEventListener('reactionChanged', (event) => {
            this.currentReaction = event.detail.reactionType;
            this.onReactionChanged(event.detail);
        });
        
        // Escuchar cuando Spline esté listo
        window.addEventListener('splineReady', () => {
            this.addSystemMessage('🔬 El laboratorio 3D está listo. ¡Puedes empezar a experimentar!');
        });
        
        // Cargar historial desde localStorage si existe
        this.loadHistoryFromStorage();
    }
    
    /**
     * Configura el formulario principal del chat
     */
    setupChatForm() {
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        
        if (!form || !input) {
            console.error('No se encontró el formulario o input del chat');
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const message = input.value.trim();
            if (!message) return;
            
            // Enviar mensaje
            await this.sendMessage(message);
            
            // Limpiar input
            input.value = '';
            input.focus();
        });
    }
    
    /**
     * Configura los botones de preguntas rápidas
     */
    setupQuickQuestions() {
        const buttons = document.querySelectorAll('.quick-question');
        
        buttons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const question = e.currentTarget.dataset.question;
                if (question) {
                    await this.sendMessage(question);
                }
            });
        });
    }
    
    /**
     * Configura el modal de información
     */
    setupInfoModal() {
        const infoBtn = document.getElementById('info-btn');
        const modal = document.getElementById('info-modal');
        const closeBtn = document.getElementById('close-modal');
        
        if (infoBtn && modal) {
            infoBtn.addEventListener('click', () => {
                modal.showModal();
            });
        }
        
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.close();
            });
        }
        
        // Cerrar al hacer click fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.close();
                }
            });
        }
    }
    
    /**
     * Envía un mensaje al usuario y procesa la respuesta
     * @param {string} message - Mensaje del usuario
     */
    async sendMessage(message) {
        // Añadir mensaje del usuario al chat
        this.addUserMessage(message);
        
        // Guardar en historial
        this.addToHistory('user', message);
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        try {
            let response;
            
            if (this.config.mode === 'voiceflow') {
                // Modo Voiceflow - Simulado (en producción usar el widget real)
                response = await this.getVoiceflowResponse(message);
            } else {
                // Modo OpenAI - Backend proxy
                response = await this.getOpenAIResponse(message);
            }
            
            // Ocultar indicador
            this.hideTypingIndicator();
            
            // Añadir respuesta al chat
            this.addAIMessage(response);
            
            // Guardar en historial
            this.addToHistory('assistant', response);
            
            // Guardar en localStorage
            this.saveHistoryToStorage();
            
        } catch (error) {
            console.error('Error obteniendo respuesta:', error);
            this.hideTypingIndicator();
            this.addErrorMessage(error.message);
        }
    }
    
    /**
     * Obtiene respuesta del backend OpenAI
     * @param {string} userMessage - Mensaje del usuario
     * @returns {Promise<string>} Respuesta de la IA
     */
    async getOpenAIResponse(userMessage) {
        // Preparar mensajes para la API
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.messageHistory.slice(-this.config.maxHistoryLength),
            { role: 'user', content: userMessage }
        ];
        
        // Hacer fetch al backend
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.message || 'Lo siento, no pude procesar tu pregunta.';
    }
    
    /**
     * Obtiene respuesta de Voiceflow (simulado para este prototipo)
     * En producción, integrar el widget oficial de Voiceflow
     * @param {string} userMessage - Mensaje del usuario
     * @returns {Promise<string>} Respuesta simulada
     */
    async getVoiceflowResponse(userMessage) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Respuestas simuladas basadas en palabras clave
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('enlace iónico')) {
            return 'Un **enlace iónico** se forma cuando un átomo transfiere uno o más electrones a otro átomo. Esto crea iones con cargas opuestas que se atraen.\n\n💡 **Ejemplo:** El NaCl (sal de mesa) - El sodio (Na) pierde un electrón y el cloro (Cl) lo gana.\n\n¿Quieres ver esto en el modelo 3D? ¡Presiona el botón "Enlace Iónico"!';
        }
        
        if (lowerMessage.includes('enlace covalente')) {
            return 'Un **enlace covalente** ocurre cuando dos átomos **comparten** pares de electrones en lugar de transferirlos.\n\n💡 **Ejemplo:** El agua (H₂O) - El oxígeno comparte electrones con dos átomos de hidrógeno.\n\n¡Prueba el botón "Enlace Covalente" para visualizarlo!';
        }
        
        if (lowerMessage.includes('tabla periódica')) {
            return 'La **tabla periódica** organiza los elementos por número atómico y propiedades químicas.\n\n📊 **Grupos importantes:**\n- Grupo 1: Metales alcalinos (muy reactivos)\n- Grupo 17: Halógenos\n- Grupo 18: Gases nobles (estables)\n\n¿Hay algún elemento específico que te gustaría explorar?';
        }
        
        if (lowerMessage.includes('átomo') || lowerMessage.includes('electron')) {
            return 'Un **átomo** tiene:\n- 🟡 **Protón**: carga positiva (en el núcleo)\n- 🔵 **Neutrón**: sin carga (en el núcleo)\n- 🔴 **Electrón**: carga negativa (orbitando)\n\nLos electrones de la capa más externa determinan cómo se enlaza el átomo.';
        }
        
        // Respuesta genérica
        return 'Interesante pregunta. Como tutor de química, te recomiendo explorar los controles 3D para ver cómo se forman los enlaces.\n\n¿Te gustaría que explique algún concepto específico como:\n- Enlaces iónicos vs covalentes\n- Estructura atómica\n- La tabla periódica?';
    }
    
    /**
     * Añade un mensaje del usuario al DOM
     * @param {string} message - Mensaje a mostrar
     */
    addUserMessage(message) {
        const historyContainer = document.getElementById('chat-history');
        if (!historyContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';
        messageDiv.innerHTML = `
            <div class="flex items-start gap-3 justify-end">
                <div class="bg-gray-700/70 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                    <p class="text-sm">${this.escapeHtml(message)}</p>
                </div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0 flex items-center justify-center text-sm">
                    👤
                </div>
            </div>
        `;
        
        historyContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    /**
     * Añade un mensaje de la IA al DOM
     * @param {string} message - Mensaje a mostrar (soporta Markdown básico)
     */
    addAIMessage(message) {
        const historyContainer = document.getElementById('chat-history');
        if (!historyContainer) return;
        
        // Convertir Markdown básico a HTML
        const formattedMessage = this.formatMarkdown(message);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-ai';
        messageDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex-shrink-0 flex items-center justify-center text-sm">
                    🤖
                </div>
                <div class="bg-gray-700/70 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                    <div class="text-sm prose prose-invert">${formattedMessage}</div>
                </div>
            </div>
        `;
        
        historyContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    /**
     * Añade un mensaje del sistema (no se guarda en historial)
     * @param {string} message - Mensaje del sistema
     */
    addSystemMessage(message) {
        const historyContainer = document.getElementById('chat-history');
        if (!historyContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-system text-center my-4';
        messageDiv.innerHTML = `
            <span class="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                ${this.escapeHtml(message)}
            </span>
        `;
        
        historyContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    /**
     * Añade un mensaje de error al DOM
     * @param {string} errorMessage - Mensaje de error
     */
    addErrorMessage(errorMessage) {
        const historyContainer = document.getElementById('chat-history');
        if (!historyContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-error';
        messageDiv.innerHTML = `
            <div class="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3 mx-4">
                <span>⚠️</span>
                <span>${this.escapeHtml(errorMessage)}</span>
            </div>
        `;
        
        historyContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    /**
     * Muestra el indicador de "escribiendo..."
     */
    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        const submitBtn = document.querySelector('#chat-form button[type="submit"]');
        
        if (indicator) {
            indicator.classList.remove('hidden');
            this.isTyping = true;
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        
        this.scrollToBottom();
    }
    
    /**
     * Oculta el indicador de "escribiendo..."
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        const submitBtn = document.querySelector('#chat-form button[type="submit"]');
        
        if (indicator) {
            indicator.classList.add('hidden');
            this.isTyping = false;
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
    
    /**
     * Añade un mensaje al historial interno
     * @param {string} role - 'user' | 'assistant'
     * @param {string} content - Contenido del mensaje
     */
    addToHistory(role, content) {
        this.messageHistory.push({ role, content });
        
        // Limitar longitud del historial
        if (this.messageHistory.length > this.config.maxHistoryLength) {
            this.messageHistory.shift();
        }
    }
    
    /**
     * Guarda el historial en localStorage
     */
    saveHistoryToStorage() {
        try {
            localStorage.setItem('quimica-chat-history', JSON.stringify(this.messageHistory));
        } catch (error) {
            console.warn('No se pudo guardar el historial:', error);
        }
    }
    
    /**
     * Carga el historial desde localStorage
     */
    loadHistoryFromStorage() {
        try {
            const saved = localStorage.getItem('quimica-chat-history');
            if (saved) {
                this.messageHistory = JSON.parse(saved);
                console.log(`📚 Historial cargado: ${this.messageHistory.length} mensajes`);
            }
        } catch (error) {
            console.warn('No se pudo cargar el historial:', error);
        }
    }
    
    /**
     * Maneja el evento cuando cambia la reacción en el 3D
     * @param {Object} detail - Detalles del evento
     */
    onReactionChanged(detail) {
        console.log('Reacción cambiada:', detail);
        
        // Opcional: Añadir comentario automático al chat
        // this.addSystemMessage(`🧪 Reacción activada: ${detail.reactionType}`);
    }
    
    /**
     * Formatea texto Markdown básico a HTML
     * @param {string} text - Texto con Markdown
     * @returns {string} HTML formateado
     */
    formatMarkdown(text) {
        if (!text) return '';
        
        // Escapar HTML primero
        let formatted = this.escapeHtml(text);
        
        // Negritas **texto**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Itálicas *texto*
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Saltos de línea
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Emojis (ya están en Unicode, solo asegurar que se muestren)
        // No necesita procesamiento adicional
        
        return formatted;
    }
    
    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Hace scroll al final del chat
     */
    scrollToBottom() {
        const historyContainer = document.getElementById('chat-history');
        if (historyContainer) {
            historyContainer.scrollTop = historyContainer.scrollHeight;
        }
    }
    
    /**
     * Limpia el historial de conversación
     */
    clearHistory() {
        this.messageHistory = [];
        this.saveHistoryToStorage();
        
        const historyContainer = document.getElementById('chat-history');
        if (historyContainer) {
            // Mantener solo el mensaje de bienvenida
            const welcomeMessage = historyContainer.querySelector('.message:first-child');
            historyContainer.innerHTML = '';
            if (welcomeMessage) {
                historyContainer.appendChild(welcomeMessage);
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.aiTutor = new AITutor();
    console.log('🎓 AI Tutor inicializado globalmente');
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AITutor;
}
