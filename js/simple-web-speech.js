/**
 * 🎵 SISTEMA DE AUDIO SIMPLIFICADO - SOLO WEB SPEECH API
 * Sistema limpio y directo para Salem
 */

class SimpleWebSpeech {
    constructor() {
        this.isEnabled = true;
        this.volume = 0.8;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.lang = 'es-ES';
        this.isInitialized = false;
        this.currentUtterance = null;
    }

    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log('🎵 Inicializando sistema de voz Web Speech API...');
            
            if (!('speechSynthesis' in window)) {
                console.error('❌ Web Speech API no disponible en este navegador');
                return false;
            }
            
            // Esperar a que las voces se carguen
            await this.waitForVoices();
            
            this.isInitialized = true;
            console.log('✅ Sistema de voz inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando sistema de voz:', error);
            return false;
        }
    }

    async waitForVoices() {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                console.log(`✅ ${voices.length} voces disponibles`);
                resolve();
                return;
            }

            console.log('⏳ Esperando a que se carguen las voces...');
            speechSynthesis.onvoiceschanged = () => {
                const loadedVoices = speechSynthesis.getVoices();
                console.log(`✅ ${loadedVoices.length} voces cargadas`);
                speechSynthesis.onvoiceschanged = null;
                resolve();
            };

            // Timeout de seguridad
            setTimeout(() => {
                if (speechSynthesis.onvoiceschanged) {
                    console.log('⏰ Timeout: continuando sin esperar más voces');
                    speechSynthesis.onvoiceschanged = null;
                    resolve();
                }
            }, 2000);
        });
    }

    async speak(text, options = {}) {
        if (!this.isEnabled || !text) return;

        try {
            // Cancelar cualquier síntesis anterior
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = options.volume || this.volume;
            utterance.rate = options.rate || this.rate;
            utterance.pitch = options.pitch || this.pitch;
            utterance.lang = options.lang || this.lang;

            // Buscar una voz en español
            const voices = speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => 
                voice.lang.startsWith('es') || 
                voice.name.toLowerCase().includes('spanish') ||
                voice.name.toLowerCase().includes('español')
            );

            if (spanishVoice) {
                utterance.voice = spanishVoice;
                console.log(`🗣️ Usando voz: ${spanishVoice.name} (${spanishVoice.lang})`);
            } else {
                console.log('🗣️ Usando voz por defecto');
            }

            this.currentUtterance = utterance;

            // Eventos de la síntesis
            utterance.onstart = () => {
                console.log(`🎵 Iniciando síntesis: "${text}"`);
            };

            utterance.onend = () => {
                console.log(`✅ Síntesis completada: "${text}"`);
                this.currentUtterance = null;
            };

            utterance.onerror = (event) => {
                console.error('❌ Error en síntesis:', event.error);
                this.currentUtterance = null;
            };

            // Iniciar síntesis
            speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('❌ Error en speak():', error);
            console.log(`🔇 Narrador: "${text}"`);
        }
    }

    // Métodos específicos del juego
    async speakNightStart() {
        return this.speak("Cierren los ojos. La noche ha comenzado. Todos los aldeanos deben dormir.");
    }

    async speakWitchPhase() {
        return this.speak("Abran los ojos las brujas. Es hora de elegir a su víctima.");
    }

    async speakSheriffPhase() {
        return this.speak("Alguacil, abre los ojos. Elige a quién proteger esta noche.");
    }

    async speakConfessionPhase() {
        return this.speak("Abran los ojos todos. Es hora de las confesiones y deliberaciones.");
    }

    async speakDayStart() {
        return this.speak("Ha amanecido. Todos pueden abrir los ojos.");
    }

    async speakTimerWarning() {
        return this.speak("Quedan treinta segundos.");
    }

    async speakTimeUp() {
        return this.speak("Se acabó el tiempo.");
    }

    async speakGameEnd(winner) {
        if (winner === 'aldeanos') {
            return this.speak("¡Los aldeanos han ganado! Las brujas han sido derrotadas.");
        } else if (winner === 'brujas') {
            return this.speak("¡Las brujas han ganado! Han eliminado a todos los aldeanos.");
        }
    }

    // Configuración
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            speechSynthesis.cancel();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(10, rate));
    }

    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
    }

    setLang(lang) {
        this.lang = lang;
    }

    // Información del sistema
    getSystemInfo() {
        return {
            name: 'Sistema de Voz Web Speech API',
            version: '1.0',
            enabled: this.isEnabled,
            initialized: this.isInitialized,
            volume: this.volume,
            rate: this.rate,
            pitch: this.pitch,
            lang: this.lang,
            voicesAvailable: speechSynthesis.getVoices().length
        };
    }

    // Control
    stop() {
        speechSynthesis.cancel();
        this.currentUtterance = null;
    }

    pause() {
        speechSynthesis.pause();
    }

    resume() {
        speechSynthesis.resume();
    }
}

// Exportar globalmente
window.SimpleWebSpeech = SimpleWebSpeech;
console.log('✅ Sistema de Voz Web Speech API cargado correctamente');