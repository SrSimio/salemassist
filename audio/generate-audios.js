/**
 * 🎙️ GENERADOR DE AUDIOS PREGRABADOS
 * Script para crear archivos de audio usando Web Speech API
 */

const audioTexts = {
    'night-start': 'Cierren los ojos. La noche ha comenzado. Todos los aldeanos deben dormir.',
    'witch-phase': 'Abran los ojos las brujas. Es hora de elegir a su víctima.',
    'sheriff-phase': 'Alguacil, abre los ojos. Elige a quién proteger esta noche.',
    'confession-phase': 'Abran los ojos todos. Es hora de las confesiones y deliberaciones.',
    'day-start': 'Ha amanecido. Todos pueden abrir los ojos.',
    'aldeanos-win': '¡Los aldeanos han ganado! Las brujas han sido derrotadas.',
    'brujas-win': '¡Las brujas han ganado! Han eliminado a todos los aldeanos.',
    'timer-warning': 'Quedan treinta segundos.',
    'time-up': 'Se acabó el tiempo.'
};

class AudioGenerator {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    async generateAllAudios() {
        console.log('🎙️ Iniciando generación de audios...');
        
        for (const [key, text] of Object.entries(audioTexts)) {
            try {
                console.log(`Generando: ${key}`);
                await this.generateAudio(key, text);
                await this.delay(1000); // Pausa entre generaciones
            } catch (error) {
                console.error(`Error generando ${key}:`, error);
            }
        }
        
        console.log('✅ Generación de audios completada');
    }

    async generateAudio(filename, text) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configuración de voz
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Buscar voz en español
            const voices = this.synthesis.getVoices();
            const spanishVoice = voices.find(voice => 
                voice.lang.startsWith('es') || voice.name.includes('Spanish')
            );
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }

            utterance.onend = () => {
                console.log(`✅ Audio generado: ${filename}`);
                resolve();
            };

            utterance.onerror = (error) => {
                console.error(`❌ Error generando ${filename}:`, error);
                reject(error);
            };

            this.synthesis.speak(utterance);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Función para iniciar la generación
async function startGeneration() {
    const generator = new AudioGenerator();
    
    // Esperar a que las voces estén disponibles
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
            generator.generateAllAudios();
        });
    } else {
        generator.generateAllAudios();
    }
}

// Exportar para uso manual
window.AudioGenerator = AudioGenerator;
window.startAudioGeneration = startGeneration;

console.log('🎙️ Generador de audios cargado. Ejecuta startAudioGeneration() para comenzar.');