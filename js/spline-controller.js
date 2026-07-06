/**
 * Spline Controller - Lógica 3D para el Laboratorio de Química
 * 
 * Función: Gestionar la comunicación bidireccional entre el HTML y el escenario 3D
 * de Spline. Permite enviar variables al modelo 3D cuando el usuario interactúa
 * con los botones de control químico.
 * 
 * Características:
 * - Carga asíncrona del visor Spline
 * - Comunicación vía application.variables
 * - Manejo de eventos de los botones
 * - Feedback visual del estado actual
 */

class SplineController {
    constructor() {
        this.viewer = null;
        this.splineApp = null;
        this.currentReaction = 'initial';
        this.isLoaded = false;
        
        // Mapeo de reacciones a valores de variables
        this.reactionMap = {
            'initial': { reaction_type: 0, show_bonds: false, highlight_atoms: false },
            'ionic': { reaction_type: 1, show_bonds: true, highlight_atoms: true },
            'covalent': { reaction_type: 2, show_bonds: true, highlight_atoms: true },
            'reset': { reaction_type: 0, show_bonds: false, highlight_atoms: false },
            'info': { reaction_type: 3, show_bonds: false, highlight_atoms: true }
        };
        
        this.init();
    }
    
    /**
     * Inicializa el controller y espera a que Spline cargue
     */
    async init() {
        try {
            console.log('🧪 Iniciando Spline Controller...');
            
            // Esperar a que el componente spline-viewer esté disponible
            await this.waitForSplineViewer();
            
            // Obtener referencia al viewer
            this.viewer = document.getElementById('spline-viewer');
            
            if (!this.viewer) {
                throw new Error('No se encontró el elemento spline-viewer');
            }
            
            // Escuchar evento de carga completa de Spline
            this.viewer.addEventListener('load', () => {
                console.log('✅ Escenario Spline cargado exitosamente');
                this.onSplineLoaded();
            });
            
            // Escuchar errores
            this.viewer.addEventListener('error', (event) => {
                console.error('❌ Error cargando Spline:', event);
                this.handleLoadError();
            });
            
            // Configurar botones de control
            this.setupControlButtons();
            
            // Timeout de seguridad para mostrar el viewer aunque no cargue completamente
            setTimeout(() => {
                if (!this.isLoaded) {
                    console.warn('⚠️ Timeout de carga de Spline, mostrando fallback');
                    this.showFallback();
                }
            }, 15000);
            
        } catch (error) {
            console.error('Error en inicialización de Spline:', error);
            this.handleLoadError();
        }
    }
    
    /**
     * Espera a que el custom element de Spline esté disponible
     */
    waitForSplineViewer() {
        return new Promise((resolve) => {
            if (customElements.get('spline-viewer')) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (customElements.get('spline-viewer')) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    /**
     * Callback cuando Spline ha cargado completamente
     */
    async onSplineLoaded() {
        this.isLoaded = true;
        
        // Ocultar overlay de carga
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
        
        // Intentar obtener la aplicación de Spline para comunicación avanzada
        try {
            this.splineApp = this.viewer.splineApp;
            console.log('🔗 Conexión con Spline App establecida');
        } catch (error) {
            console.warn('No se pudo acceder a splineApp, usando métodos alternativos');
        }
        
        // Notificar al tutor IA que el 3D está listo
        this.notifyTutorReady();
    }
    
    /**
     * Configura los event listeners para los botones de control
     */
    setupControlButtons() {
        const buttons = document.querySelectorAll('[data-reaction]');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const reactionType = e.currentTarget.dataset.reaction;
                this.triggerReaction(reactionType);
            });
        });
    }
    
    /**
     * Ejecuta una reacción/química en el escenario 3D
     * @param {string} reactionType - Tipo de reacción: 'ionic', 'covalent', 'reset', 'info'
     */
    async triggerReaction(reactionType) {
        console.log(`⚗️ Activando reacción: ${reactionType}`);
        
        // Actualizar estado UI
        this.updateReactionStatus(reactionType);
        
        // Obtener configuración de la reacción
        const config = this.reactionMap[reactionType] || this.reactionMap.initial;
        this.currentReaction = reactionType;
        
        // Método 1: Usar application.variables si está disponible
        if (this.splineApp && this.splineApp.setVariable) {
            try {
                // Enviar variables a Spline
                for (const [variableName, value] of Object.entries(config)) {
                    await this.splineApp.setVariable(variableName, value);
                }
                console.log('✅ Variables enviadas a Spline:', config);
            } catch (error) {
                console.warn('Error enviando variables:', error);
                this.useAlternativeMethod(config);
            }
        } else {
            // Método 2: Usar postMessage como fallback
            this.useAlternativeMethod(config);
        }
        
        // Disparar evento personalizado para otros módulos
        window.dispatchEvent(new CustomEvent('reactionChanged', {
            detail: { reactionType, config }
        }));
    }
    
    /**
     * Método alternativo para comunicar con Spline via postMessage
     * @param {Object} config - Configuración de variables
     */
    useAlternativeMethod(config) {
        console.log('📤 Usando método alternativo (postMessage)');
        
        // Enviar mensaje al iframe de Spline
        const iframe = this.viewer?.shadowRoot?.querySelector('iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({
                type: 'SET_VARIABLES',
                variables: config
            }, '*');
        }
        
        // Simular cambio visual con clases CSS
        this.applyVisualFeedback(config);
    }
    
    /**
     * Aplica feedback visual cuando no hay conexión directa con Spline
     * @param {Object} config - Configuración de la reacción
     */
    applyVisualFeedback(config) {
        const container = document.getElementById('spline-container');
        
        // Remover clases previas
        container.classList.remove('reaction-ionic', 'reaction-covalent', 'reaction-info');
        
        // Añadir clase según reacción
        if (config.reaction_type === 1) {
            container.classList.add('reaction-ionic');
            container.style.boxShadow = '0 0 40px rgba(37, 99, 235, 0.5)';
        } else if (config.reaction_type === 2) {
            container.classList.add('reaction-covalent');
            container.style.boxShadow = '0 0 40px rgba(34, 197, 94, 0.5)';
        } else if (config.reaction_type === 3) {
            container.classList.add('reaction-info');
            container.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.5)';
        } else {
            container.style.boxShadow = '';
        }
    }
    
    /**
     * Actualiza el indicador de estado en la UI
     * @param {string} reactionType - Tipo de reacción activa
     */
    updateReactionStatus(reactionType) {
        const statusElement = document.getElementById('reaction-status');
        if (!statusElement) return;
        
        const statusMessages = {
            'initial': 'Inicial - Átomos separados',
            'ionic': 'Enlace Iónico - Transferencia de electrones',
            'covalent': 'Enlace Covalente - Compartición de electrones',
            'reset': 'Reiniciando...',
            'info': 'Mostrando información molecular'
        };
        
        statusElement.textContent = statusMessages[reactionType] || 'Desconocido';
        
        // Animación de cambio
        statusElement.style.opacity = '0';
        setTimeout(() => {
            statusElement.style.opacity = '1';
        }, 150);
    }
    
    /**
     * Maneja errores de carga de Spline
     */
    handleLoadError() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="text-center">
                    <p class="text-red-400 text-xl mb-2">⚠️ Error cargando el 3D</p>
                    <p class="text-gray-400 text-sm">El modelo 3D no pudo cargar.</p>
                    <p class="text-gray-400 text-sm mt-2">Verifica tu conexión a internet o recarga la página.</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">
                        🔄 Recargar
                    </button>
                </div>
            `;
            loadingOverlay.style.display = 'flex';
        }
    }
    
    /**
     * Muestra un fallback cuando Spline tarda demasiado en cargar
     */
    showFallback() {
        console.log('Mostrando modo fallback');
        
        const container = document.getElementById('spline-container');
        if (container) {
            container.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
            container.innerHTML += `
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="text-center p-8">
                        <p class="text-6xl mb-4">🧪</p>
                        <p class="text-cyan-400 text-lg font-semibold">Laboratorio 3D</p>
                        <p class="text-gray-400 text-sm mt-2">Los controles siguen funcionando</p>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Notifica al módulo del tutor IA que el 3D está listo
     */
    notifyTutorReady() {
        window.dispatchEvent(new CustomEvent('splineReady', {
            detail: { timestamp: Date.now() }
        }));
    }
    
    /**
     * Obtiene el estado actual de la reacción
     * @returns {string} Tipo de reacción actual
     */
    getCurrentReaction() {
        return this.currentReaction;
    }
    
    /**
     * Reinicia el escenario al estado inicial
     */
    reset() {
        this.triggerReaction('reset');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.splineController = new SplineController();
    console.log('🎮 Spline Controller inicializado globalmente');
});

// Exportar para uso en otros módulos (si se usa module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SplineController;
}
