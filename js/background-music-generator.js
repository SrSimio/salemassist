/**
 * 🎵 GENERADOR DE MÚSICA DE FONDO ATMOSFÉRICA
 * Sistema avanzado para crear ambiente sonoro en Salem
 */

class BackgroundMusicGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = [];
        this.isPlaying = false;
        this.volume = 0.2;
    }

    async initialize() {
        try {
            // Solo crear AudioContext si no existe
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Siempre intentar reanudar el AudioContext
            if (this.audioContext.state === 'suspended') {
                console.log('🔒 AudioContext suspendido - intentando reanudar...');
                await this.audioContext.resume();
                console.log('✅ AudioContext reanudado');
            }
            
            // Crear masterGain solo si no existe
            if (!this.masterGain) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            }
            
            console.log('🎵 Generador de música atmosférica inicializado');
            return true;
        } catch (error) {
            console.warn('⚠️ Error inicializando generador de música:', error);
            return false;
        }
    }

    createAtmosphericTone(frequency, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Configurar oscilador
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Configurar filtro para suavizar el sonido
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);

        // Configurar ganancia
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 2);

        // Conectar nodos
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        return { oscillator, gainNode, filter };
    }

    start() {
        if (this.isPlaying) {
            console.log('🎵 Música de fondo ya está reproduciéndose');
            return;
        }

        try {
            console.log('🎵 Iniciando música de fondo atmosférica...');
            
            // Verificar y reanudar AudioContext si está suspendido
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log('🔓 Reanudando AudioContext...');
                this.audioContext.resume().then(() => {
                    console.log('✅ AudioContext reanudado');
                    this.createAndStartOscillators();
                }).catch(error => {
                    console.error('❌ Error reanudando AudioContext:', error);
                });
                return;
            }
            
            this.createAndStartOscillators();
        } catch (error) {
            console.error('❌ Error iniciando ambiente nocturno:', error);
        }
    }

    createAndStartOscillators() {
        try {
            // Tono base grave (La2 - 110Hz)
            const baseTone = this.createAtmosphericTone(110, 'sine', 0.15);
            
            // Armónico sutil (Mi3 - 165Hz)
            const harmonic = this.createAtmosphericTone(165, 'sine', 0.08);
            
            // Tono misterioso (Do#3 - 138Hz)
            const mysterious = this.createAtmosphericTone(138, 'triangle', 0.06);

            // Iniciar osciladores
            if (baseTone) {
                baseTone.oscillator.start();
                this.oscillators.push(baseTone);
                console.log('🎵 Tono base iniciado (110Hz)');
            }
            
            if (harmonic) {
                harmonic.oscillator.start();
                this.oscillators.push(harmonic);
                console.log('🎵 Armónico iniciado (165Hz)');
            }
            
            if (mysterious) {
                mysterious.oscillator.start();
                this.oscillators.push(mysterious);
                console.log('🎵 Tono misterioso iniciado (138Hz)');
            }

            // Agregar variaciones sutiles
            this.addSubtleVariations();

            this.isPlaying = true;
            console.log('🌙 Ambiente nocturno iniciado correctamente - Total osciladores:', this.oscillators.length);
        } catch (error) {
            console.error('❌ Error creando osciladores:', error);
        }
    }

    // Método para activar manualmente desde la consola
    testBackgroundMusic() {
        console.log('🧪 Probando música de fondo manualmente...');
        if (!this.audioContext) {
            console.log('🔧 Inicializando AudioContext...');
            this.initialize().then(() => {
                this.start();
            });
        } else if (this.audioContext.state === 'suspended') {
            console.log('🔓 AudioContext suspendido, intentando reanudar...');
            this.audioContext.resume().then(() => {
                console.log('✅ AudioContext reanudado para prueba');
                this.start();
            }).catch(error => {
                console.error('❌ Error reanudando AudioContext:', error);
            });
        } else {
            this.start();
        }
    }

    addSubtleVariations() {
        // Agregar variaciones de frecuencia muy sutiles para crear movimiento
        setInterval(() => {
            if (!this.isPlaying || this.oscillators.length === 0) return;

            this.oscillators.forEach((osc, index) => {
                if (osc.oscillator && this.audioContext) {
                    const baseFreq = [110, 165, 138][index] || 110;
                    const variation = Math.sin(Date.now() / 10000) * 2; // Variación muy sutil
                    osc.oscillator.frequency.setValueAtTime(
                        baseFreq + variation, 
                        this.audioContext.currentTime
                    );
                }
            });
        }, 5000); // Cada 5 segundos
    }

    stop() {
        if (!this.isPlaying) return;

        try {
            this.oscillators.forEach(osc => {
                if (osc.oscillator) {
                    // Fade out suave
                    osc.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
                    setTimeout(() => {
                        try {
                            osc.oscillator.stop();
                        } catch (e) {
                            // Ignorar errores de osciladores ya detenidos
                        }
                    }, 1000);
                }
            });

            this.oscillators = [];
            this.isPlaying = false;
            console.log('🔇 Ambiente nocturno detenido');
        } catch (error) {
            console.warn('⚠️ Error deteniendo ambiente:', error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    }

    fadeOut(duration = 2) {
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            setTimeout(() => this.stop(), duration * 1000);
        }
    }

    fadeIn(duration = 2) {
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + duration);
        }
    }
}

// Hacer disponible globalmente
window.BackgroundMusicGenerator = BackgroundMusicGenerator;
console.log('✅ Generador de Música Atmosférica cargado correctamente');