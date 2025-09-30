/**
 * Sistema de Gestión de Audio Híbrido para Salem Noche
 * Combina Web Speech API con Cordova Media Plugin para máxima compatibilidad
 */
class HybridAudioManager {
    constructor() {
        this.isInitialized = false;
        this.isCordova = false;
        this.isWebSpeechAvailable = false;
        this.audioCache = new Map();
        this.preloadedAudios = new Map();
        this.currentMedia = null;
        
        // Configuración de audio
        this.volume = 0.7;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.lang = 'es-ES';
        
        // Estados
        this.isEnabled = true;
        this.isPlaying = false;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔊 Inicializando Sistema de Audio Híbrido...');
        
        // Detectar entorno
        this.detectEnvironment();
        
        // Inicializar sistemas de audio
        await this.initializeWebSpeech();
        await this.initializeCordovaMedia();
        await this.preloadAudioFiles();
        
        this.isInitialized = true;
        console.log('✅ Sistema de Audio Híbrido inicializado correctamente');
        
        // Evento para cuando Cordova esté listo
        document.addEventListener('deviceready', () => {
            console.log('📱 Cordova listo, reinicializando audio...');
            this.initializeCordovaMedia();
        }, false);
    }
    
    detectEnvironment() {
        // Detectar Cordova
        this.isCordova = typeof window.cordova !== 'undefined' || 
                        (navigator.userAgent.includes('Android') && navigator.userAgent.includes('wv'));
        
        // Detectar Web Speech API
        this.isWebSpeechAvailable = 'speechSynthesis' in window && !this.isCordova;
        
        console.log(`🔍 Entorno detectado: Cordova=${this.isCordova}, WebSpeech=${this.isWebSpeechAvailable}`);
    }
    
    async initializeWebSpeech() {
        if (!this.isWebSpeechAvailable) return;
        
        try {
            // Esperar a que las voces se carguen
            if (speechSynthesis.getVoices().length === 0) {
                await new Promise(resolve => {
                    speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
                    setTimeout(resolve, 1000); // Timeout de seguridad
                });
            }
            
            const voices = speechSynthesis.getVoices();
            console.log(`🗣️ Web Speech API: ${voices.length} voces disponibles`);
            
            // Buscar voz en español
            const spanishVoice = voices.find(voice => 
                voice.lang.startsWith('es') || 
                voice.name.toLowerCase().includes('spanish') ||
                voice.name.toLowerCase().includes('español')
            );
            
            if (spanishVoice) {
                this.selectedVoice = spanishVoice;
                console.log(`✅ Voz en español seleccionada: ${spanishVoice.name}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error inicializando Web Speech API:', error);
        }
    }
    
    async initializeCordovaMedia() {
        if (!this.isCordova || typeof Media === 'undefined') return;
        
        try {
            console.log('📱 Inicializando Cordova Media Plugin...');
            
            // Verificar que el plugin esté disponible
            if (typeof Media !== 'undefined') {
                console.log('✅ Cordova Media Plugin disponible');
                
                // Crear directorio de audio si no existe
                if (window.resolveLocalFileSystemURL) {
                    this.setupAudioDirectory();
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Error inicializando Cordova Media:', error);
        }
    }
    
    setupAudioDirectory() {
        // Crear directorio para archivos de audio
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dirEntry) => {
            dirEntry.getDirectory('audio', { create: true }, (audioDir) => {
                this.audioDirectory = audioDir;
                console.log('📁 Directorio de audio creado:', audioDir.fullPath);
            });
        });
    }
    
    async preloadAudioFiles() {
        console.log('⏳ Precargando archivos de audio...');
        
        // Definir los textos que se convertirán a audio
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
        
        // En un entorno real, aquí cargaríamos archivos de audio pregrabados
        // Por ahora, almacenamos los textos para síntesis
        for (const [key, text] of Object.entries(audioTexts)) {
            this.audioCache.set(key, text);
        }
        
        console.log(`✅ ${Object.keys(audioTexts).length} audios precargados en caché`);
    }
    
    async speak(text, options = {}) {
        if (!this.isEnabled || !text) return;
        
        const finalOptions = {
            volume: this.volume,
            rate: this.rate,
            pitch: this.pitch,
            lang: this.lang,
            ...options
        };
        
        console.log(`🗣️ Reproduciendo: "${text}"`);
        
        // Intentar con Web Speech API primero
        if (this.isWebSpeechAvailable && !this.isCordova) {
            return this.speakWithWebAPI(text, finalOptions);
        }
        
        // Fallback a Cordova Media o notificación visual
        return this.speakWithCordova(text, finalOptions);
    }
    
    async speakWithWebAPI(text, options) {
        return new Promise((resolve, reject) => {
            try {
                // Cancelar síntesis anterior
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.volume = options.volume;
                utterance.rate = options.rate;
                utterance.pitch = options.pitch;
                utterance.lang = options.lang;
                
                if (this.selectedVoice) {
                    utterance.voice = this.selectedVoice;
                }
                
                utterance.onend = () => {
                    this.isPlaying = false;
                    resolve();
                };
                
                utterance.onerror = (error) => {
                    console.warn('⚠️ Error en Web Speech API:', error);
                    this.speakWithCordova(text, options).then(resolve).catch(reject);
                };
                
                this.isPlaying = true;
                speechSynthesis.speak(utterance);
                
            } catch (error) {
                console.warn('⚠️ Error en Web Speech API, usando fallback:', error);
                this.speakWithCordova(text, options).then(resolve).catch(reject);
            }
        });
    }
    
    async speakWithCordova(text, options) {
        // En un entorno real con archivos de audio pregrabados:
        // 1. Buscar archivo de audio correspondiente
        // 2. Reproducir con Cordova Media Plugin
        
        if (this.isCordova && typeof Media !== 'undefined') {
            // Aquí iría la lógica para reproducir archivos de audio pregrabados
            console.log('📱 Reproduciendo con Cordova Media (simulado)');
        }
        
        // Fallback visual
        this.showVoiceNotification(text);
        
        return Promise.resolve();
    }
    
    showVoiceNotification(text) {
        // Crear notificación visual
        const notification = document.createElement('div');
        notification.className = 'hybrid-voice-notification';
        notification.innerHTML = `
            <div class="voice-icon">🗣️</div>
            <div class="voice-text">${text}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.95), rgba(75, 0, 130, 0.95));
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: hybridVoiceSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 80%;
            text-align: center;
        `;
        
        // Añadir estilos de animación
        this.addVoiceAnimationStyles();
        
        document.body.appendChild(notification);
        
        // Remover después de la duración estimada de lectura
        const readingTime = Math.max(3000, text.length * 100); // Mínimo 3s, 100ms por carácter
        
        setTimeout(() => {
            notification.style.animation = 'hybridVoiceSlideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, readingTime);
    }
    
    addVoiceAnimationStyles() {
        if (document.getElementById('hybrid-voice-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'hybrid-voice-animations';
        style.textContent = `
            @keyframes hybridVoiceSlideIn {
                0% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-30px) scale(0.8); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0) scale(1); 
                }
            }
            
            @keyframes hybridVoiceSlideOut {
                0% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0) scale(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-30px) scale(0.8); 
                }
            }
            
            .hybrid-voice-notification .voice-icon {
                font-size: 20px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Métodos específicos para cada fase del juego
    async speakNightStart() {
        return this.speak(this.audioCache.get('night-start') || 'Cierren los ojos. La noche ha comenzado.');
    }
    
    async speakWitchPhase() {
        return this.speak(this.audioCache.get('witch-phase') || 'Abran los ojos las brujas. Es hora de elegir a su víctima.');
    }
    
    async speakSheriffPhase() {
        return this.speak(this.audioCache.get('sheriff-phase') || 'Alguacil, abre los ojos. Elige a quién proteger esta noche.');
    }
    
    async speakConfessionPhase() {
        return this.speak(this.audioCache.get('confession-phase') || 'Abran los ojos todos. Es hora de las confesiones y deliberaciones.');
    }
    
    async speakDayStart() {
        return this.speak(this.audioCache.get('day-start') || 'Ha amanecido. Todos pueden abrir los ojos.');
    }
    
    async speakGameEnd(winner) {
        const key = winner === 'aldeanos' ? 'aldeanos-win' : 'brujas-win';
        const text = this.audioCache.get(key) || `¡Los ${winner} han ganado!`;
        return this.speak(text);
    }
    
    async speakTimerWarning() {
        return this.speak(this.audioCache.get('timer-warning') || 'Quedan treinta segundos.');
    }
    
    async speakTimeUp() {
        return this.speak(this.audioCache.get('time-up') || 'Se acabó el tiempo.');
    }
    
    // Métodos de control
    stop() {
        if (this.isWebSpeechAvailable && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        if (this.currentMedia) {
            this.currentMedia.stop();
            this.currentMedia.release();
            this.currentMedia = null;
        }
        
        this.isPlaying = false;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(3, rate));
    }
    
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
    }
    
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }
    
    // Método para obtener información del sistema
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            isCordova: this.isCordova,
            isWebSpeechAvailable: this.isWebSpeechAvailable,
            isEnabled: this.isEnabled,
            isPlaying: this.isPlaying,
            cachedAudios: this.audioCache.size,
            selectedVoice: this.selectedVoice?.name || 'Ninguna'
        };
    }
}

// Exportar para uso global
window.HybridAudioManager = HybridAudioManager;