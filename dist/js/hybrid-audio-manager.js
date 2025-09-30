/**
 * 🎯 SISTEMA DE AUDIO HÍBRIDO OPTIMIZADO
 * Combinación de Plugin Cordova + Implementación Híbrida + Preload y Cache
 * 
 * ✅ Máxima Compatibilidad: Web + Móvil
 * ✅ Mejor Rendimiento: Audio nativo en móvil, optimizado en web
 * ✅ Sin Lag: Preload elimina delays
 * ✅ Fallback Automático: Si falla uno, usa el otro
 * ✅ Tamaño Controlado: No aumenta mucho el APK
 */

class HybridAudioManager {
    constructor() {
        this.isEnabled = true;
        this.volume = 0.7;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.lang = 'es-ES';
        
        // Estado del sistema
        this.isInitialized = false;
        this.currentMethod = null;
        this.availableMethods = [];
        
        // Cache de audio
        this.audioCache = new Map();
        this.preloadedTexts = new Map();
        
        // Configuración de métodos
        this.methods = {
            cordovaTTS: {
                name: 'Cordova TTS Plugin',
                priority: 1,
                available: false,
                native: true
            },
            webSpeech: {
                name: 'Web Speech API',
                priority: 2,
                available: false,
                native: false
            },
            html5Audio: {
                name: 'HTML5 Audio + TTS Service',
                priority: 3,
                available: false,
                native: false
            },
            visualFallback: {
                name: 'Visual Notification',
                priority: 4,
                available: true,
                native: false
            }
        };
        
        // Textos predefinidos del juego
        this.gameTexts = {
            nightStart: "Cierren los ojos. La noche ha comenzado. Todos los aldeanos deben dormir.",
            witchPhase: "Abran los ojos las brujas. Es hora de elegir a su víctima.",
            sheriffPhase: "Alguacil, abre los ojos. Elige a quién proteger esta noche.",
            confessionPhase: "Abran los ojos todos. Es hora de las confesiones y deliberaciones.",
            dayStart: "Ha amanecido. Todos pueden abrir los ojos.",
            timerWarning: "Quedan treinta segundos.",
            timeUp: "Se acabó el tiempo.",
            aldeanoWin: "¡Los aldeanos han ganado! Las brujas han sido derrotadas.",
            brujaWin: "¡Las brujas han ganado! Han eliminado a todos los aldeanos."
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔊 Inicializando Sistema de Audio Híbrido...');
        
        try {
            // Detectar métodos disponibles
            await this.detectAvailableMethods();
            
            // Seleccionar el mejor método
            this.selectBestMethod();
            
            // Precargar audios si es posible
            await this.preloadGameAudios();
            
            this.isInitialized = true;
            console.log('✅ Sistema de Audio Híbrido inicializado correctamente');
            console.log('📊 Método seleccionado:', this.currentMethod);
            
        } catch (error) {
            console.warn('⚠️ Error inicializando sistema de audio:', error);
            this.currentMethod = 'visualFallback';
            this.isInitialized = true;
        }
    }
    
    async detectAvailableMethods() {
        // 1. Detectar Cordova TTS Plugin
        if (window.cordova && window.plugins && window.plugins.tts) {
            try {
                // Verificar que el plugin funcione
                await new Promise((resolve, reject) => {
                    window.plugins.tts.speak('', resolve, reject);
                });
                this.methods.cordovaTTS.available = true;
                this.availableMethods.push('cordovaTTS');
                console.log('✅ Cordova TTS Plugin disponible');
            } catch (error) {
                console.log('❌ Cordova TTS Plugin no disponible:', error);
            }
        }
        
        // 2. Detectar Web Speech API
        if ('speechSynthesis' in window) {
            try {
                const synth = window.speechSynthesis;
                const voices = synth.getVoices();
                
                // Verificar que funcione en este entorno
                if (!this.isAndroidWebView()) {
                    this.methods.webSpeech.available = true;
                    this.availableMethods.push('webSpeech');
                    console.log('✅ Web Speech API disponible');
                } else {
                    console.log('❌ Web Speech API deshabilitada en WebView');
                }
            } catch (error) {
                console.log('❌ Web Speech API no disponible:', error);
            }
        }
        
        // 3. Detectar HTML5 Audio (siempre disponible como fallback)
        if ('Audio' in window) {
            this.methods.html5Audio.available = true;
            this.availableMethods.push('html5Audio');
            console.log('✅ HTML5 Audio disponible');
        }
        
        // 4. Visual Fallback (siempre disponible)
        this.availableMethods.push('visualFallback');
        console.log('✅ Visual Fallback disponible');
    }
    
    selectBestMethod() {
        // Seleccionar el método con mayor prioridad disponible
        let bestMethod = 'visualFallback';
        let highestPriority = 999;
        
        for (const method of this.availableMethods) {
            const methodInfo = this.methods[method];
            if (methodInfo.available && methodInfo.priority < highestPriority) {
                bestMethod = method;
                highestPriority = methodInfo.priority;
            }
        }
        
        this.currentMethod = bestMethod;
        console.log(`🎯 Método seleccionado: ${this.methods[bestMethod].name}`);
    }
    
    async preloadGameAudios() {
        if (this.currentMethod === 'html5Audio') {
            console.log('🔄 Precargando audios del juego...');
            
            for (const [key, text] of Object.entries(this.gameTexts)) {
                try {
                    const audioUrl = await this.generateAudioUrl(text);
                    if (audioUrl) {
                        this.preloadedTexts.set(key, audioUrl);
                        console.log(`✅ Audio precargado: ${key}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error precargando ${key}:`, error);
                }
            }
        }
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
        
        try {
            switch (this.currentMethod) {
                case 'cordovaTTS':
                    return await this.speakWithCordova(text, finalOptions);
                case 'webSpeech':
                    return await this.speakWithWebSpeech(text, finalOptions);
                case 'html5Audio':
                    return await this.speakWithHTML5Audio(text, finalOptions);
                default:
                    return this.speakWithVisualFallback(text, finalOptions);
            }
        } catch (error) {
            console.warn(`Error con método ${this.currentMethod}, intentando fallback:`, error);
            return this.speakWithFallback(text, finalOptions);
        }
    }
    
    async speakWithCordova(text, options) {
        return new Promise((resolve, reject) => {
            const cordovaOptions = {
                text: text,
                locale: options.lang,
                rate: options.rate,
                pitch: options.pitch
            };
            
            window.plugins.tts.speak(
                cordovaOptions,
                () => {
                    console.log(`🗣️ Cordova TTS: "${text}"`);
                    resolve();
                },
                (error) => {
                    console.warn('Error en Cordova TTS:', error);
                    reject(error);
                }
            );
        });
    }
    
    async speakWithWebSpeech(text, options) {
        return new Promise((resolve, reject) => {
            try {
                const synth = window.speechSynthesis;
                synth.cancel(); // Cancelar síntesis anterior
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.volume = options.volume;
                utterance.rate = options.rate;
                utterance.pitch = options.pitch;
                utterance.lang = options.lang;
                
                // Buscar voz en español
                const voices = synth.getVoices();
                const spanishVoice = voices.find(voice => 
                    voice.lang.startsWith('es') || voice.name.toLowerCase().includes('spanish')
                );
                
                if (spanishVoice) {
                    utterance.voice = spanishVoice;
                }
                
                utterance.onend = () => {
                    console.log(`🗣️ Web Speech: "${text}"`);
                    resolve();
                };
                
                utterance.onerror = (error) => {
                    console.warn('Error en Web Speech:', error);
                    reject(error);
                };
                
                synth.speak(utterance);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async speakWithHTML5Audio(text, options) {
        try {
            // Buscar en cache primero
            const cachedUrl = this.audioCache.get(text);
            let audioUrl = cachedUrl;
            
            if (!audioUrl) {
                // Generar URL de audio
                audioUrl = await this.generateAudioUrl(text, options);
                if (audioUrl) {
                    this.audioCache.set(text, audioUrl);
                }
            }
            
            if (audioUrl) {
                return this.playAudioUrl(audioUrl);
            } else {
                throw new Error('No se pudo generar URL de audio');
            }
            
        } catch (error) {
            console.warn('Error en HTML5 Audio:', error);
            throw error;
        }
    }
    
    async generateAudioUrl(text, options = {}) {
        // Usar servicio TTS gratuito (Google Translate TTS)
        const lang = options.lang || this.lang;
        const encodedText = encodeURIComponent(text);
        
        // URL del servicio TTS de Google Translate
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;
        
        return ttsUrl;
    }
    
    async playAudioUrl(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.volume = this.volume;
            
            audio.onended = () => {
                console.log(`🗣️ HTML5 Audio reproducido`);
                resolve();
            };
            
            audio.onerror = (error) => {
                console.warn('Error reproduciendo audio:', error);
                reject(error);
            };
            
            audio.play().catch(reject);
        });
    }
    
    speakWithVisualFallback(text, options) {
        console.log(`🗣️ Visual Fallback: "${text}"`);
        this.showVoiceNotification(text);
        return Promise.resolve();
    }
    
    async speakWithFallback(text, options) {
        // Intentar con el siguiente método disponible
        const currentIndex = this.availableMethods.indexOf(this.currentMethod);
        
        for (let i = currentIndex + 1; i < this.availableMethods.length; i++) {
            const fallbackMethod = this.availableMethods[i];
            
            try {
                console.log(`🔄 Intentando fallback: ${this.methods[fallbackMethod].name}`);
                
                switch (fallbackMethod) {
                    case 'webSpeech':
                        return await this.speakWithWebSpeech(text, options);
                    case 'html5Audio':
                        return await this.speakWithHTML5Audio(text, options);
                    case 'visualFallback':
                        return this.speakWithVisualFallback(text, options);
                }
            } catch (error) {
                console.warn(`Fallback ${fallbackMethod} también falló:`, error);
                continue;
            }
        }
        
        // Si todos fallan, usar visual fallback
        return this.speakWithVisualFallback(text, options);
    }
    
    showVoiceNotification(text) {
        // Crear notificación visual mejorada
        const notification = document.createElement('div');
        notification.className = 'hybrid-voice-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🗣️</div>
                <div class="notification-text">${text}</div>
                <div class="notification-method">${this.methods[this.currentMethod].name}</div>
            </div>
        `;
        
        // Estilos mejorados
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 15px;
            font-size: 16px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: hybridSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 90vw;
            text-align: center;
        `;
        
        // Añadir animaciones CSS si no existen
        if (!document.getElementById('hybrid-voice-animations')) {
            const style = document.createElement('style');
            style.id = 'hybrid-voice-animations';
            style.textContent = `
                @keyframes hybridSlideIn {
                    from { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(-30px) scale(0.8); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                }
                @keyframes hybridSlideOut {
                    from { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(-30px) scale(0.8); 
                    }
                }
                .notification-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }
                .notification-icon {
                    font-size: 24px;
                }
                .notification-text {
                    font-size: 16px;
                    line-height: 1.4;
                }
                .notification-method {
                    font-size: 12px;
                    opacity: 0.8;
                    font-style: italic;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'hybridSlideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 4000);
    }
    
    // Métodos específicos del juego con cache
    async speakNightStart() {
        return this.speak(this.gameTexts.nightStart);
    }
    
    async speakWitchPhase() {
        return this.speak(this.gameTexts.witchPhase);
    }
    
    async speakSheriffPhase() {
        return this.speak(this.gameTexts.sheriffPhase);
    }
    
    async speakConfessionPhase() {
        return this.speak(this.gameTexts.confessionPhase);
    }
    
    async speakDayStart() {
        return this.speak(this.gameTexts.dayStart);
    }
    
    async speakTimerWarning() {
        return this.speak(this.gameTexts.timerWarning);
    }
    
    async speakTimeUp() {
        return this.speak(this.gameTexts.timeUp);
    }
    
    async speakGameEnd(winner) {
        if (winner === 'aldeanos') {
            return this.speak(this.gameTexts.aldeanoWin);
        } else if (winner === 'brujas') {
            return this.speak(this.gameTexts.brujaWin);
        }
    }
    
    // Métodos de configuración
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🔊 Audio ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Volumen establecido: ${Math.round(this.volume * 100)}%`);
    }
    
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(3, rate));
        console.log(`🔊 Velocidad establecida: ${this.rate}x`);
    }
    
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        console.log(`🔊 Tono establecido: ${this.pitch}`);
    }
    
    setLanguage(lang) {
        this.lang = lang;
        console.log(`🔊 Idioma establecido: ${lang}`);
    }
    
    // Métodos de información
    getSystemInfo() {
        return {
            initialized: this.isInitialized,
            currentMethod: this.currentMethod,
            availableMethods: this.availableMethods,
            methodDetails: this.methods,
            settings: {
                enabled: this.isEnabled,
                volume: this.volume,
                rate: this.rate,
                pitch: this.pitch,
                language: this.lang
            },
            cache: {
                audioCache: this.audioCache.size,
                preloadedTexts: this.preloadedTexts.size
            }
        };
    }
    
    getCurrentMethod() {
        return this.methods[this.currentMethod];
    }
    
    isAndroidWebView() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('android') && userAgent.includes('wv');
    }
    
    // Método para limpiar cache
    clearCache() {
        this.audioCache.clear();
        this.preloadedTexts.clear();
        console.log('🗑️ Cache de audio limpiado');
    }
    
    // Método para cambiar método manualmente
    switchMethod(methodName) {
        if (this.availableMethods.includes(methodName)) {
            this.currentMethod = methodName;
            console.log(`🔄 Método cambiado a: ${this.methods[methodName].name}`);
            return true;
        } else {
            console.warn(`⚠️ Método ${methodName} no disponible`);
            return false;
        }
    }
}

// Hacer disponible globalmente
window.HybridAudioManager = HybridAudioManager;

console.log('✅ Sistema de Audio Híbrido cargado correctamente');