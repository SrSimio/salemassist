/**
 * 🎵 SISTEMA DE MÚSICA DE FONDO SIMPLE
 * Sistema básico y confiable para reproducir música ambiente
 */

class SimpleBackgroundMusic {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = 0.3;
        this.enabled = true;
        this.audioFiles = {
            night: 'audio/night-start.mp3',
            day: 'audio/day-start.mp3',
            witch: 'audio/witch-phase.mp3',
            sheriff: 'audio/sheriff-phase.mp3',
            confession: 'audio/confession-time.mp3',
            victory_villagers: 'audio/villagers-win.mp3',
            victory_witches: 'audio/witches-win.mp3'
        };
    }

    async initialize() {
        try {
            console.log('🎵 Inicializando sistema de música de fondo simple...');
            return true;
        } catch (error) {
            console.warn('⚠️ Error inicializando música:', error);
            return false;
        }
    }

    playBackgroundMusic(type = 'night') {
        if (!this.enabled) {
            console.log('🔇 Música deshabilitada');
            return;
        }

        try {
            // Detener música actual si existe
            this.stopBackgroundMusic();

            const audioFile = this.audioFiles[type];
            if (!audioFile) {
                console.warn(`⚠️ Archivo de audio no encontrado para: ${type}`);
                return;
            }

            console.log(`🎵 Reproduciendo música de fondo: ${type}`);
            
            this.currentAudio = new Audio(audioFile);
            this.currentAudio.volume = this.volume;
            this.currentAudio.loop = true;
            
            // Manejar eventos
            this.currentAudio.addEventListener('canplaythrough', () => {
                console.log(`✅ Audio cargado: ${type}`);
            });

            this.currentAudio.addEventListener('error', (e) => {
                console.warn(`⚠️ Error cargando audio ${type}:`, e);
            });

            // Reproducir
            const playPromise = this.currentAudio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.isPlaying = true;
                        console.log(`🎵 Música iniciada: ${type}`);
                    })
                    .catch(error => {
                        console.warn(`⚠️ Error reproduciendo ${type}:`, error);
                        // Intentar reproducir después de interacción del usuario
                        this.setupUserInteractionPlay();
                    });
            }

        } catch (error) {
            console.error('❌ Error en playBackgroundMusic:', error);
        }
    }

    setupUserInteractionPlay() {
        // Reproducir después de la primera interacción del usuario
        const playOnInteraction = () => {
            if (this.currentAudio && !this.isPlaying) {
                this.currentAudio.play()
                    .then(() => {
                        this.isPlaying = true;
                        console.log('🎵 Música iniciada después de interacción');
                    })
                    .catch(console.warn);
            }
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction);
        document.addEventListener('keydown', playOnInteraction);
    }

    stopBackgroundMusic() {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio = null;
                this.isPlaying = false;
                console.log('🔇 Música de fondo detenida');
            } catch (error) {
                console.warn('⚠️ Error deteniendo música:', error);
            }
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
        console.log(`🔊 Volumen ajustado: ${Math.round(this.volume * 100)}%`);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        }
        console.log(`🎵 Música ${enabled ? 'habilitada' : 'deshabilitada'}`);
    }

    fadeOut(duration = 2000) {
        if (!this.currentAudio) return;

        const startVolume = this.currentAudio.volume;
        const fadeStep = startVolume / (duration / 100);

        const fadeInterval = setInterval(() => {
            if (this.currentAudio.volume > fadeStep) {
                this.currentAudio.volume -= fadeStep;
            } else {
                this.currentAudio.volume = 0;
                this.stopBackgroundMusic();
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    fadeIn(duration = 2000) {
        if (!this.currentAudio) return;

        this.currentAudio.volume = 0;
        const targetVolume = this.volume;
        const fadeStep = targetVolume / (duration / 100);

        const fadeInterval = setInterval(() => {
            if (this.currentAudio.volume < targetVolume - fadeStep) {
                this.currentAudio.volume += fadeStep;
            } else {
                this.currentAudio.volume = targetVolume;
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    // Métodos de conveniencia para diferentes fases
    startNightMusic() {
        this.playBackgroundMusic('night');
    }

    startDayMusic() {
        this.playBackgroundMusic('day');
    }

    startWitchMusic() {
        this.playBackgroundMusic('witch');
    }

    startSheriffMusic() {
        this.playBackgroundMusic('sheriff');
    }

    startConfessionMusic() {
        this.playBackgroundMusic('confession');
    }

    playVictoryMusic(winner) {
        if (winner === 'villagers') {
            this.playBackgroundMusic('victory_villagers');
        } else if (winner === 'witches') {
            this.playBackgroundMusic('victory_witches');
        }
    }
}

// Hacer disponible globalmente
window.SimpleBackgroundMusic = SimpleBackgroundMusic;
console.log('✅ Sistema de Música de Fondo Simple cargado correctamente');