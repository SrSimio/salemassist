class SalemGame {
    constructor() {
        this.players = [];
        this.roles = [];
        this.sheriff = null;
        this.currentPhase = 'setup';
        this.nightCount = 0;
        this.gameEnded = false;
        this.nightDuration = 120; // 2 minutos por defecto
        this.autoTimerEnabled = true; // Timer automático activado por defecto
        this.stageTimerEnabled = true; // Timers de etapas activados por defecto
        this.timeExpired = false; // Rastrea si se acabó el tiempo en la fase actual
        this.timer = null;
        this.timerSeconds = 0;
        this.selectedPlayers = {};
        
        // Sistema de voces
        this.voiceEnabled = true;
        this.voiceVolume = 0.7;
        this.voiceSpeed = 1;
        this.speechSynthesis = null;
        this.isAPK = false;
        
        // Nuevo sistema de audio híbrido
        this.audioManager = null;
        this.isAPK = false;
        
        // Sistema de música de fondo
        this.backgroundMusic = null;
        this.musicEnabled = true;
        this.musicVolume = 0.3;
        
        // Configuración de roles
        this.roleConfig = {
            'Aldeano': { count: 0, description: '👨‍🌾 Ciudadano honesto que debe encontrar a las brujas' },
            'Bruja': { count: 0, description: '🧙‍♀️ Ser malévolo que debe eliminar a los aldeanos' },
            'Alguacil': { count: 0, description: '🛡️ Protege a un jugador cada noche de los ataques de las brujas' }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.initializeVoiceSystem();
        this.initializeBackgroundMusic();
        
        // Asegurar que el menú principal permanezca visible
        this.ensureMainMenuVisible();
    }

    initializeElements() {
        console.log('🔧 Inicializando elementos DOM...');
        
        // Elementos del menú principal
        this.mainMenu = document.getElementById('main-menu');
        this.mainApp = document.getElementById('main-app');
        this.loadingScreen = document.getElementById('loading-screen');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.rulesBtn = document.getElementById('rules-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu-btn');
        
        // Elementos de la fase de configuración
        this.nameInput = document.getElementById('name-input');
        this.addNameBtn = document.getElementById('add-name-btn');
        this.namesList = document.getElementById('names-list');
        this.playerCount = document.getElementById('player-count');
        this.startGameBtn = document.getElementById('start-game-btn');
        
        console.log('🔧 startGameBtn encontrado:', !!this.startGameBtn);
        if (this.startGameBtn) {
            console.log('🔧 startGameBtn disabled:', this.startGameBtn.disabled);
            console.log('🔧 startGameBtn textContent:', this.startGameBtn.textContent);
        }
        
        // Elementos de las fases del juego
        this.setupPhase = document.getElementById('setup-phase');
        this.gamePhase = document.getElementById('game-phase');
        this.phaseIndicator = document.getElementById('phase-indicator');
        
        // Elementos específicos de cada fase
        this.roleAssignment = document.getElementById('role-assignment');
        this.rolesDisplay = document.getElementById('roles-display');
        this.continueBtn = document.getElementById('continue-btn');
        
        // Botón de prueba de audio
        this.testAudioBtn = document.getElementById('test-audio-btn');
        
        this.sheriffSelection = document.getElementById('sheriff-selection');
        this.sheriffCandidates = document.getElementById('sheriff-candidates');
        this.confirmSheriffBtn = document.getElementById('confirm-sheriff-btn');
        
        this.confessionPhase = document.getElementById('confession-phase');
        this.confessionContent = document.getElementById('confession-content');
        
        this.resultsPhase = document.getElementById('results-phase');
        this.resultsContent = document.getElementById('results-content');
        this.newNightBtn = document.getElementById('new-night-btn');
        this.endGameBtn = document.getElementById('end-game-btn');
        
        // Controles globales
        this.resetGameBtn = document.getElementById('reset-game-btn');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerText = document.getElementById('timer-text');
        
        // Modal
        this.immunityModal = document.getElementById('immunity-modal');
        this.immunityMessage = document.getElementById('immunity-message');
        this.immunityOkBtn = document.getElementById('immunity-ok-btn');
        
        console.log('🔧 Elementos DOM inicializados correctamente');
    }

    bindEvents() {
        // Eventos del menú principal
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.showNewGame());
        }
        
        if (this.rulesBtn) {
            this.rulesBtn.addEventListener('click', () => this.showRules());
        }
        
        if (this.backToMenuBtn) {
            this.backToMenuBtn.addEventListener('click', () => this.showMainMenu());
        }
        
        // Eventos de configuración
        if (this.addNameBtn) {
            this.addNameBtn.addEventListener('click', () => this.addName());
        }
        
        if (this.nameInput) {
            this.nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addName();
                }
            });
        }
        
        if (this.startGameBtn) {
            console.log('🔧 Vinculando event listener al botón startGame...');
            this.startGameBtn.addEventListener('click', () => {
                console.log('🎮 Click detectado en startGameBtn');
                this.startGame();
            });
        } else {
            console.error('❌ startGameBtn no encontrado para vincular event listener');
        }
        
        // Evento para el checkbox de timer de etapas
        const stageTimerCheckbox = document.getElementById('stage-timer-enabled');
        const timerDurationGroup = document.getElementById('timer-duration-group');
        if (stageTimerCheckbox && timerDurationGroup) {
            stageTimerCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    timerDurationGroup.classList.remove('disabled');
                } else {
                    timerDurationGroup.classList.add('disabled');
                }
            });
        }
        
        // Eventos del juego
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.startSheriffSelection());
        }
        
        if (this.confirmSheriffBtn) {
            this.confirmSheriffBtn.addEventListener('click', () => this.confirmSheriffSelection());
        }
        
        if (this.newNightBtn) {
            this.newNightBtn.addEventListener('click', () => this.startNewNight());
        }
        
        if (this.endGameBtn) {
            this.endGameBtn.addEventListener('click', () => this.endGame());
        }
        
        // Controles globales
        if (this.resetGameBtn) {
            this.resetGameBtn.addEventListener('click', () => this.resetGame());
        }
        
        // Botón de prueba de audio
        if (this.testAudioBtn) {
            this.testAudioBtn.addEventListener('click', () => this.testTTS());
        }
        
        // Eventos de configuración de voces
        this.bindVoiceEvents();
        
        // Eventos de configuración de música
        this.bindMusicEvents();
    }
    
    bindVoiceEvents() {
        const voiceEnabledCheckbox = document.getElementById('voice-enabled');
        const voiceControlsGroup = document.getElementById('voice-controls-group');
        const voiceVolumeSlider = document.getElementById('voice-volume');
        const volumeDisplay = document.getElementById('volume-display');
        const voiceSpeedSelect = document.getElementById('voice-speed');
        
        if (voiceEnabledCheckbox) {
            voiceEnabledCheckbox.addEventListener('change', (e) => {
                this.voiceEnabled = e.target.checked;
                if (voiceControlsGroup) {
                    voiceControlsGroup.style.opacity = this.voiceEnabled ? '1' : '0.5';
                }
            });
        }
        
        if (voiceVolumeSlider && volumeDisplay) {
            voiceVolumeSlider.addEventListener('input', (e) => {
                this.voiceVolume = e.target.value / 100;
                volumeDisplay.textContent = e.target.value + '%';
            });
        }
        
        if (voiceSpeedSelect) {
            voiceSpeedSelect.addEventListener('change', (e) => {
                this.voiceSpeed = parseFloat(e.target.value);
            });
        }
        
        if (this.immunityOkBtn) {
            this.immunityOkBtn.addEventListener('click', () => this.closeImmunityModal());
        }
    }

    bindMusicEvents() {
        const musicEnabledCheckbox = document.getElementById('music-enabled');
        const musicControlsGroup = document.getElementById('music-controls-group');
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeDisplay = document.getElementById('music-volume-display');

        if (musicEnabledCheckbox && musicControlsGroup) {
            musicEnabledCheckbox.addEventListener('change', (e) => {
                this.setMusicEnabled(e.target.checked);
                if (e.target.checked) {
                    musicControlsGroup.classList.remove('disabled');
                } else {
                    musicControlsGroup.classList.add('disabled');
                }
            });
        }

        if (musicVolumeSlider && musicVolumeDisplay) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                this.setMusicVolume(volume / 100);
                musicVolumeDisplay.textContent = volume + '%';
            });
        }
    }

    addName() {
        if (!this.nameInput) return;
        
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.showAlert('⚠️ Por favor ingresa un nombre válido');
            return;
        }
        
        if (this.players.includes(name)) {
            this.showAlert('⚠️ Este nombre ya existe en la lista');
            return;
        }

        this.players.push(name);
        this.nameInput.value = '';
        this.updateNamesList();
        this.updateStartButton();
        
        // Efecto de sonido simulado
        this.playSound('add');
    }

    updateNamesList() {
        if (!this.namesList || !this.playerCount) return;
        
        this.namesList.innerHTML = '';
        
        this.players.forEach((name, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card fade-in';
            playerCard.innerHTML = `
                <div class="player-name">👤 ${name}</div>
                <button class="remove-btn" onclick="game.removeName(${index})">✕</button>
            `;
            this.namesList.appendChild(playerCard);
        });
        
        this.playerCount.textContent = this.players.length;
    }

    removeName(index) {
        this.players.splice(index, 1);
        this.updateNamesList();
        this.updateStartButton();
        this.playSound('remove');
    }

    updateStartButton() {
        if (!this.startGameBtn) return;
        
        const canStart = this.players.length >= 3;
        this.startGameBtn.disabled = !canStart;
        
        if (canStart) {
            this.startGameBtn.textContent = `🌙 Comenzar los Juicios (${this.players.length} aldeanos)`;
        } else {
            this.startGameBtn.textContent = `🌙 Mínimo 3 aldeanos necesarios (${this.players.length}/3)`;
        }
    }

    startGame() {
        console.log('🎮 Iniciando juego...');
        console.log('🎮 Número de jugadores:', this.players.length);
        console.log('🎮 Lista de jugadores:', this.players);
        
        if (this.players.length < 3) {
            console.log('❌ Error: No hay suficientes jugadores');
            this.showAlert('Se necesitan al menos 3 jugadores para comenzar', 'error');
            return;
        }
        
        // Obtener la configuración del timer de etapas
        const stageTimerCheckbox = document.getElementById('stage-timer-enabled');
        if (stageTimerCheckbox) {
            this.stageTimerEnabled = stageTimerCheckbox.checked;
        }
        
        // Obtener la duración configurada por el usuario (solo si los timers están activados)
        if (this.stageTimerEnabled) {
            const nightDurationInput = document.getElementById('night-duration');
            if (nightDurationInput) {
                this.nightDuration = parseInt(nightDurationInput.value) || 60;
            }
        }
        
        // Obtener la configuración del timer automático
        const autoTimerCheckbox = document.getElementById('auto-timer-enabled');
        if (autoTimerCheckbox) {
            this.autoTimerEnabled = autoTimerCheckbox.checked;
        }
        
        this.gameStarted = true;
        this.currentPhase = 'night-start';
        this.nightCount = 1;
        
        // Iniciar música de fondo para la noche
        this.startBackgroundMusic('night');
        
        // Mostrar preparación de la noche
        this.showNightStart();
        this.playSound('start');
    }

    showNightStart() {
         this.currentPhase = 'night-start';
         this.switchPhase('game');
         
         const gameArea = document.getElementById('game-phase');
         if (gameArea) {
             gameArea.innerHTML = `
                 <div class="phase-container">
                     <h2 class="phase-title">🌙 Preparación de la Noche</h2>
                     
                     <div class="night-start-section">
                         <h3 class="section-title">¡Es hora de que caiga la noche!</h3>
                         <div class="phase-instructions">
                             <div class="instruction-item">
                                 <strong>📋 Preparación:</strong> Asegúrense de que todos tengan sus cartas de rol
                             </div>
                             <div class="instruction-item">
                                 <strong>🎭 Roles en juego:</strong> Aldeanos, Brujas y Alguacil
                             </div>
                             <div class="instruction-item">
                                 <strong>🌙 Orden de la noche:</strong> Brujas → Alguacil → Confesiones → Resultados
                             </div>
                             <div class="instruction-item">
                                 <strong>👥 Jugadores:</strong> ${this.players.join(', ')}
                             </div>
                         </div>
                     </div>
                     
                     <button class="btn btn-primary btn-large" onclick="game.showSleepScreen()">
                         🌙 Iniciar Noche
                     </button>
                 </div>
             `;
         }
     }

     showSleepScreen() {
        const gameArea = document.getElementById('game-phase');
        if (gameArea) {
            gameArea.innerHTML = `
                <div class="sleep-screen">
                    <div class="sleep-content">
                        <h1 class="sleep-title">😴 Todos Cierren los Ojos</h1>
                        <div class="sleep-message">
                            <p>Es hora de dormir...</p>
                            <p>Nadie debe mirar excepto cuando sea su turno</p>
                            <p id="sleep-countdown" class="countdown-text">Comenzando en 5 segundos...</p>
                        </div>
                        <div class="sleep-animation">
                            <div class="moon">🌙</div>
                            <div class="stars">✨ ⭐ ✨</div>
                        </div>
                        <button class="btn btn-primary btn-large" onclick="game.showPhaseTransition('witch')" style="display: none;" id="sleep-manual-btn">
                            🧙‍♀️ Comenzar con las Brujas
                        </button>
                    </div>
                </div>
            `;
            
            // Narrar el inicio de la noche
            this.speakNightStart();
            
            // Iniciar countdown de 5 segundos
            this.startSleepCountdown();
        }
    }

    startSleepCountdown() {
        const countdownElement = document.getElementById('sleep-countdown');
        const manualBtn = document.getElementById('sleep-manual-btn');
        
        if (!this.autoTimerEnabled) {
            // Si el timer automático está desactivado, mostrar solo el botón manual
            countdownElement.textContent = "Presiona el botón para continuar";
            if (manualBtn) {
                manualBtn.style.display = 'block';
            }
            return;
        }
        
        // Timer automático activado
        let countdown = 5;
        
        const updateCountdown = () => {
            if (countdown > 0) {
                countdownElement.textContent = `Comenzando en ${countdown} segundos...`;
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                countdownElement.textContent = "¡Comenzando!";
                setTimeout(() => {
                    this.showPhaseTransition('witch');
                }, 500);
            }
        };
        
        updateCountdown();
        
        // Mostrar botón manual después de 2 segundos por si quieren adelantar
        setTimeout(() => {
            if (manualBtn) {
                manualBtn.style.display = 'block';
            }
        }, 2000);
    }

     showPhaseTransition(nextPhase) {
         const phaseInfo = {
             witch: {
                 title: '🧙‍♀️ Fase de las Brujas',
                 message: 'Las brujas van a despertar...',
                 action: () => this.showWitchPhase()
             },
             sheriff: {
                 title: '🛡️ Fase del Alguacil',
                 message: 'El alguacil va a despertar...',
                 action: () => this.showSheriffPhase()
             },
             confession: {
                 title: '🙏 Fase de Confesiones',
                 message: 'Es hora de las confesiones...',
                 action: () => this.showConfessionPhase()
             },
             results: {
                 title: '🌅 Resultados del Amanecer',
                 message: 'Vamos a ver qué pasó esta noche...',
                 action: () => this.showResults()
             }
         };

         const phase = phaseInfo[nextPhase];
         if (!phase) return;

         const gameArea = document.getElementById('game-phase');
        if (gameArea) {
            gameArea.innerHTML = `
                <div class="transition-screen">
                    <div class="transition-content">
                        <h1 class="transition-title">${phase.title}</h1>
                        <div class="transition-message">
                            <p>${phase.message}</p>
                            <p id="transition-countdown" class="countdown-text">Comenzando en 5 segundos...</p>
                        </div>
                        <div class="transition-animation">
                            <div class="pulse-circle"></div>
                        </div>
                        <button class="btn btn-primary btn-large" onclick="game.executePhaseTransition('${nextPhase}')" style="display: none;" id="transition-manual-btn">
                            ▶️ Continuar
                        </button>
                    </div>
                </div>
            `;
            
            // Iniciar countdown de 5 segundos
            this.startTransitionCountdown(nextPhase);
        }
     }

     executePhaseTransition(phase) {
        const phaseActions = {
            witch: () => this.showWitchPhase(),
            sheriff: () => this.showSheriffPhase(),
            confession: () => this.showConfessionPhase(),
            results: () => this.showResults()
        };

        if (phaseActions[phase]) {
            phaseActions[phase]();
        }
    }

    startTransitionCountdown(nextPhase) {
        const countdownElement = document.getElementById('transition-countdown');
        const manualBtn = document.getElementById('transition-manual-btn');
        
        if (!this.autoTimerEnabled) {
            // Si el timer automático está desactivado, mostrar solo el botón manual
            countdownElement.textContent = "Presiona el botón para continuar";
            if (manualBtn) {
                manualBtn.style.display = 'block';
            }
            return;
        }
        
        // Timer automático activado
        let countdown = 5;
        
        const updateCountdown = () => {
            if (countdown > 0) {
                countdownElement.textContent = `Comenzando en ${countdown} segundos...`;
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                countdownElement.textContent = "¡Comenzando!";
                setTimeout(() => {
                    this.executePhaseTransition(nextPhase);
                }, 500);
            }
        };
        
        updateCountdown();
        
        // Mostrar botón manual después de 2 segundos por si quieren adelantar
        setTimeout(() => {
            if (manualBtn) {
                manualBtn.style.display = 'block';
            }
        }, 2000);
    }

    // Fase de las brujas (separada)
    showWitchPhase() {
        this.currentPhase = 'witch';
        this.timeExpired = false; // Resetear flag al iniciar fase manualmente
        this.switchPhase('game');
        
        // Narrar la fase de las brujas
        this.speakWitchPhase();
        
        const gameArea = document.getElementById('game-phase');
        if (gameArea) {
            // Verificar si es la primera noche
            const isFirstNight = this.nightCount === 1;
            
            gameArea.innerHTML = `
                <div class="phase-container">
                    <h2 class="phase-title">🧙‍♀️ Fase de las Brujas</h2>
                    
                    <div class="witch-section">
                        <h3 class="section-title">${isFirstNight ? 'Las brujas colocan el gato negro' : 'Las brujas despiertan y eligen su víctima'}</h3>
                        <div class="player-cards" id="witch-targets">
                            ${this.generatePlayerCards(isFirstNight ? 'witch-cat' : 'witch-attack')}
                        </div>
                        ${isFirstNight ? 
                            '<div class="first-night-message"><p>🐱‍⬛ <strong>Primera Noche:</strong> Selecciona a quién colocar el gato negro. Esta persona será marcada pero no morirá.</p></div>' : ''
                        }
                    </div>
                    
                    <div class="phase-instructions">
                        <div class="instruction-item">
                            <strong>🧙‍♀️ Solo las brujas:</strong> ${isFirstNight ? 'Abran los ojos y elijan dónde colocar el gato negro' : 'Abran los ojos y elijan a quién atacar'}
                        </div>
                        <div class="instruction-item">
                            <strong>👥 Otros jugadores:</strong> Mantengan los ojos cerrados
                        </div>
                        <div class="instruction-item">
                            <strong>✨ Efecto visual:</strong> La carta elegida brillará para indicar ${isFirstNight ? 'dónde se coloca el gato negro' : 'el ataque'}
                        </div>
                        <div class="instruction-item">
                            <strong>⏰ Tiempo:</strong> Sin límite de tiempo - decidan cuando estén listos
                        </div>
                    </div>
                    
                    ${this.stageTimerEnabled ? `
                    <div class="timer-container">
                        <div class="timer-display" id="timer-display">${this.nightDuration}</div>
                        <div class="timer-label">segundos restantes</div>
                    </div>
                    ` : ''}
                    
                    <button class="btn btn-primary" onclick="${isFirstNight ? 'game.showFirstNightResults()' : 'game.showPhaseTransition(\'sheriff\')'}">
                        ${isFirstNight ? '🌅 Ver Resultados del Amanecer' : '🛡️ Continuar a Fase del Alguacil'}
                    </button>
                </div>
            `;
        }
        
        // Solo iniciar timer si está habilitado
        if (this.stageTimerEnabled) {
            this.startTimer(this.nightDuration);
        }
        
        // Agregar event listener para el botón de resultados
        const showResultsBtn = document.getElementById('show-results-btn');
        if (showResultsBtn) {
            showResultsBtn.addEventListener('click', () => {
                this.showResults();
            });
        }
    }

    showSheriffPhase() {
        this.currentPhase = 'sheriff';
        this.timeExpired = false; // Resetear flag al iniciar fase manualmente
        
        // Narrar la fase del alguacil
        this.speakSheriffPhase();
         
         const gameArea = document.getElementById('game-phase');
         if (gameArea) {
             gameArea.innerHTML = `
                 <div class="phase-container">
                     <h2 class="phase-title">🛡️ Fase del Alguacil</h2>
                     
                     <div class="sheriff-section">
                         <h3 class="section-title">El alguacil despierta (sin ver el ataque)</h3>
                         <div class="player-cards" id="sheriff-targets">
                             ${this.generatePlayerCards('sheriff-protect')}
                         </div>
                     </div>
                     
                     <div class="phase-instructions">
                         <div class="instruction-item">
                             <strong>🛡️ Solo el alguacil:</strong> Abre los ojos y elige a quién proteger
                         </div>
                         <div class="instruction-item">
                             <strong>👥 Otros jugadores:</strong> Mantengan los ojos cerrados
                         </div>
                         <div class="instruction-item">
                             <strong>🚫 Importante:</strong> El alguacil NO puede ver a quién atacaron las brujas
                         </div>
                         ${this.stageTimerEnabled ? `
                         <div class="instruction-item">
                             <strong>⏰ Tiempo:</strong> Tienen ${this.nightDuration} segundos para decidir
                         </div>
                         ` : `
                         <div class="instruction-item">
                             <strong>⏰ Tiempo:</strong> Sin límite de tiempo - decidan cuando estén listos
                         </div>
                         `}
                     </div>
                     
                     ${this.stageTimerEnabled ? `
                     <div class="timer-container">
                         <div class="timer-display" id="timer-display">${this.nightDuration}</div>
                         <div class="timer-label">segundos restantes</div>
                     </div>
                     ` : ''}
                     
                     <button class="btn btn-primary" onclick="game.showPhaseTransition('confession')">
                         🙏 Continuar a Fase de Confesiones
                     </button>
                 </div>
             `;
         }
         
         // Solo iniciar timer si está habilitado
         if (this.stageTimerEnabled) {
             this.startTimer(this.nightDuration);
         }
     }

    showConfessionPhase() {
        this.currentPhase = 'confession';
        this.timeExpired = false; // Resetear flag al iniciar fase manualmente
        
        // Narrar la fase de confesiones
        this.speakConfessionPhase();
        
        // Obtener quién protegió el alguacil
        const sheriffProtected = this.selectedPlayers && this.selectedPlayers['sheriff-protect'] ? this.selectedPlayers['sheriff-protect'][0] : null;
        
        const gameArea = document.getElementById('game-phase');
        if (gameArea) {
            gameArea.innerHTML = `
                <div class="phase-container">
                    <h2 class="phase-title">🙏 Fase de Confesiones</h2>
                    
                    ${sheriffProtected ? `
                    <div class="sheriff-protection-info">
                        <div class="protection-notice">
                            🛡️ <strong>El Alguacil protegió a:</strong> ${sheriffProtected}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="confession-section">
                        <h3 class="section-title">Todos pueden confesar para salvarse</h3>
                        <div class="player-cards" id="confession-players">
                            ${this.generatePlayerCardsWithProtection('confession', true, sheriffProtected)}
                        </div>
                    </div>
                    
                    <div class="phase-instructions">
                        <div class="instruction-item">
                            <strong>👥 Todos los jugadores:</strong> Pueden abrir los ojos y decidir si confesar
                        </div>
                        <div class="instruction-item">
                            <strong>🙏 Confesión:</strong> Seleccionen las cartas de quienes quieren confesar
                        </div>
                        <div class="instruction-item">
                            <strong>✅ Múltiple selección:</strong> Pueden seleccionar varios jugadores a la vez
                        </div>
                        <div class="instruction-item">
                            <strong>🛡️ Protección:</strong> Si las brujas atacan a alguien que confesó, esa persona no muere
                        </div>
                        ${this.stageTimerEnabled ? `
                        <div class="instruction-item">
                            <strong>⏰ Tiempo:</strong> Tienen ${this.nightDuration} segundos para decidir
                        </div>
                        ` : `
                        <div class="instruction-item">
                            <strong>⏰ Tiempo:</strong> Sin límite de tiempo - decidan cuando estén listos
                        </div>
                        `}
                    </div>
                    
                    <button class="btn btn-primary" id="show-results-btn">
                        🌅 Ver Resultados del Amanecer
                    </button>
                </div>
            `;
        }
        
        // Agregar event listener al botón de resultados
        setTimeout(() => {
            const showResultsBtn = document.getElementById('show-results-btn');
            if (showResultsBtn) {
                showResultsBtn.addEventListener('click', () => {
                    this.showPhaseTransition('results');
                });
            }
        }, 100);
        
        // Las confesiones nunca tienen temporizador
    }

    // Nueva función específica para los resultados de la primera noche
    showFirstNightResults() {
        this.currentPhase = 'results';
        this.stopTimer();
        
        // Obtener la selección del gato negro
        const catTarget = this.selectedPlayers && this.selectedPlayers['witch-cat'] ? this.selectedPlayers['witch-cat'][0] : null;
        
        // Crear resultados específicos para la primera noche
        const resultsHTML = `
            <div class="results-fullscreen-overlay">
                <div class="results-fullscreen-content">
                    <h2 class="phase-title">🌅 Resultados del Primer Amanecer</h2>
                    
                    <div class="results-section">
                        <div class="result-item first-night-result">
                            <div class="result-icon">🐱‍⬛</div>
                            <div class="result-text">
                                <strong>Gato Negro Colocado</strong><br>
                                ${catTarget ? `Las brujas colocaron el gato negro en ${catTarget}` : 'Las brujas no colocaron el gato negro'}
                            </div>
                        </div>
                        <div class="result-item first-night-result">
                            <div class="result-icon">💤</div>
                            <div class="result-text">
                                <strong>Primera Noche</strong><br>
                                Nadie murió esta noche. El alguacil y las confesiones no estuvieron activas.
                            </div>
                        </div>
                    </div>
                    
                    <div class="phase-actions">
                        <button class="btn btn-primary" id="start-second-night-btn">
                            🌙 Comenzar Segunda Noche
                        </button>
                        <button class="btn btn-secondary" id="restart-game-btn">
                            🔄 Reiniciar Juego
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Crear overlay y agregarlo al body
        const overlay = document.createElement('div');
        overlay.id = 'results-overlay';
        overlay.innerHTML = resultsHTML;
        document.body.appendChild(overlay);
        
        // Agregar event listeners
        setTimeout(() => {
            const startSecondNightBtn = document.getElementById('start-second-night-btn');
            const restartGameBtn = document.getElementById('restart-game-btn');
            
            if (startSecondNightBtn) {
                startSecondNightBtn.addEventListener('click', () => {
                    this.closeResultsOverlay();
                    this.startNewNight();
                });
            }
            
            if (restartGameBtn) {
                restartGameBtn.addEventListener('click', () => {
                    this.closeResultsOverlay();
                    this.resetGame();
                });
            }
        }, 100);
        
        // Resetear selecciones para la siguiente noche
        this.resetSelections();
    }

    // Función mejorada para mostrar resultados de noches normales
    showResults() {
        this.currentPhase = 'results';
        this.stopTimer();
        
        // Narrar el inicio del día
        this.speakDayStart();
        
        // Obtener las selecciones de las fases anteriores
        const witchVictim = this.selectedPlayers && this.selectedPlayers['witch-attack'] ? this.selectedPlayers['witch-attack'][0] : null;
        const sheriffProtected = this.selectedPlayers && this.selectedPlayers['sheriff-protect'] ? this.selectedPlayers['sheriff-protect'][0] : null;
        const confessedPlayers = this.selectedPlayers && this.selectedPlayers['confession'] ? this.selectedPlayers['confession'] : [];
        
        // Determinar si la víctima de las brujas muere
        let victimResult = '';
        let victimIcon = '';
        let actualDeath = null;
        
        if (witchVictim) {
            // Verificar si está protegido por el alguacil
            if (sheriffProtected === witchVictim) {
                victimResult = `${witchVictim} fue protegido por el alguacil y se salvó`;
                victimIcon = '🛡️';
            } else if (confessedPlayers.includes(witchVictim)) {
                victimResult = `Alguien se salvó por confesar`;
                victimIcon = '🙏';
            } else {
                victimResult = `${witchVictim} murió`;
                victimIcon = '💀';
                actualDeath = witchVictim;
            }
        } else {
            victimResult = 'Las brujas no atacaron a nadie esta noche';
            victimIcon = '😴';
        }
        
        // Crear resultados en pantalla completa
        const resultsHTML = `
            <div class="results-fullscreen-overlay">
                <div class="results-fullscreen-content">
                    <h2 class="phase-title">🌅 Resultados del Amanecer - Noche ${this.nightCount}</h2>
                    
                    <div class="results-section">
                        <div class="result-item">
                            <div class="result-icon">${victimIcon}</div>
                            <div class="result-text">
                                <strong>🧙‍♀️ Ataque de las Brujas</strong><br>
                                ${victimResult}
                            </div>
                        </div>
                        <div class="result-item">
                            <div class="result-icon">🛡️</div>
                            <div class="result-text">
                                <strong>Protección del Alguacil</strong><br>
                                ${sheriffProtected ? `${sheriffProtected} fue protegido` : 'Nadie fue protegido'}
                            </div>
                        </div>
                        <div class="result-item">
                            <div class="result-icon">🙏</div>
                            <div class="result-text">
                                <strong>Confesiones</strong><br>
                                ${confessedPlayers.length > 0 ? confessedPlayers.join(', ') + ' confesaron' : 'Nadie confesó'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="phase-actions">
                        <button class="btn btn-primary" id="start-new-night-btn">
                            🌙 Nueva Noche
                        </button>
                        <button class="btn btn-secondary" id="end-game-btn">
                            🔄 Reiniciar Juego
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Crear overlay y agregarlo al body
        const overlay = document.createElement('div');
        overlay.id = 'results-overlay';
        overlay.innerHTML = resultsHTML;
        document.body.appendChild(overlay);
        
        // Agregar event listeners
        setTimeout(() => {
            const startNewNightBtn = document.getElementById('start-new-night-btn');
            const endGameBtn = document.getElementById('end-game-btn');
            
            if (startNewNightBtn) {
                startNewNightBtn.addEventListener('click', () => {
                    this.closeResultsOverlay();
                    this.startNewNight();
                });
            }
            
            if (endGameBtn) {
                endGameBtn.addEventListener('click', () => {
                    this.closeResultsOverlay();
                    this.resetGame();
                });
            }
        }, 100);
        
        // Resetear selecciones para la siguiente noche
        this.resetSelections();
        
        this.checkGameEnd();
    }

    // Función para cerrar el overlay de resultados
    closeResultsOverlay() {
        const overlay = document.getElementById('results-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    resetSelections() {
        // Resetear todas las selecciones de jugadores
        this.selectedPlayers = {};
        
        // Remover clases visuales de todas las cartas
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('selected', 'witch-glow', 'sheriff-glow');
            // Remover escudos
            const shield = card.querySelector('.shield-icon');
            if (shield) shield.remove();
        });
        
        // Remover pantalla de resultados si existe
        const existingResults = document.querySelector('.results-fullscreen');
        if (existingResults) {
            existingResults.remove();
        }
    }

    // Eliminar métodos relacionados con asignación de roles
    // Ya no se necesitan estos métodos porque los roles se asignan físicamente

    updateRoleConfig() {
        // Resetear contadores
        Object.keys(this.roleConfig).forEach(role => {
            this.roleConfig[role].count = 0;
        });
        
        // Contar roles asignados
        this.roles.forEach(role => {
            if (this.roleConfig[role]) {
                this.roleConfig[role].count++;
            }
        });
    }

    showRoleAssignment() {
        if (!this.rolesDisplay) return;
        
        this.rolesDisplay.innerHTML = '';
        
        Object.entries(this.roleConfig).forEach(([role, config]) => {
            if (config.count > 0) {
                const roleCard = document.createElement('div');
                roleCard.className = 'role-card slide-in-left';
                roleCard.innerHTML = `
                    <div class="role-title">${role} (${config.count})</div>
                    <div class="role-description">${config.description}</div>
                `;
                this.rolesDisplay.appendChild(roleCard);
            }
        });
        
        this.showSection('role-assignment');
        this.updatePhaseIndicator('🎭 Roles asignados. Los jugadores deben memorizar sus roles secretamente.');
    }

    startSheriffSelection() {
        this.showSheriffCandidates();
        this.showSection('sheriff-selection');
        this.updatePhaseIndicator('⚖️ Los aldeanos deben elegir un Sheriff para liderar los juicios.');
        this.playSound('phase');
    }

    showSheriffCandidates() {
        if (!this.sheriffCandidates) return;
        
        this.sheriffCandidates.innerHTML = '';
        
        this.players.forEach((name, index) => {
            const candidateCard = document.createElement('div');
            candidateCard.className = 'candidate-card';
            candidateCard.innerHTML = `
                <div class="candidate-name">⚖️ ${name}</div>
                <div class="role-description">Candidato a Sheriff</div>
            `;
            
            candidateCard.addEventListener('click', () => {
                this.selectSheriff(name, candidateCard);
            });
            
            this.sheriffCandidates.appendChild(candidateCard);
        });
    }

    selectSheriff(name, cardElement) {
        // Remover selección anterior
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo sheriff
        cardElement.classList.add('selected');
        this.sheriff = name;
        
        if (this.confirmSheriffBtn) {
            this.confirmSheriffBtn.style.display = 'block';
            this.confirmSheriffBtn.textContent = `⚖️ Confirmar a ${name} como Sheriff`;
        }
        
        this.playSound('select');
    }

    confirmSheriffSelection() {
        if (!this.sheriff) {
            this.showAlert('⚠️ Debes seleccionar un Sheriff primero');
            return;
        }
        
        this.startConfessionPhase();
        this.playSound('confirm');
    }

    startConfessionPhase() {
        this.nightCount++;
        this.showSection('confession-phase');
        this.updatePhaseIndicator(`🌙 Noche ${this.nightCount} - Fase Nocturna. Las brujas y alguaciles actúan en secreto.`);
        
        if (this.confessionContent) {
            this.confessionContent.innerHTML = `
                <div class="confession-instructions">
                    <h3>🌙 Instrucciones para la Noche ${this.nightCount}</h3>
                    
                    <div class="night-actions">
                        <div class="action-section">
                            <h4 class="section-title">🧙‍♀️ Brujas - Seleccionen su víctima</h4>
                            <div class="player-cards" id="witch-targets">
                                ${this.generatePlayerCards('witch-target')}
                            </div>
                        </div>
                        
                        <div class="action-section">
                            <h4 class="section-title">🛡️ Alguacil - Protege a un jugador</h4>
                            <div class="player-cards" id="sheriff-targets">
                                ${this.generatePlayerCards('sheriff-protect')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="role-instructions">
                        <div class="instruction-item">
                            <strong>🧙‍♀️ Brujas:</strong> Seleccionen en secreto a quién eliminar esta noche
                        </div>
                        <div class="instruction-item">
                            <strong>🛡️ Alguacil:</strong> Elige a un jugador para proteger (puede ser a ti mismo)
                        </div>
                        <div class="instruction-item">
                            <strong>⚖️ Sheriff ${this.sheriff}:</strong> Mantén el orden y guía las discusiones
                        </div>
                    </div>
                    <div class="confession-timer">
                        <button class="btn btn-primary" onclick="game.startTimer(120)">⏰ Iniciar Timer (2 min)</button>
                        <button class="btn btn-secondary" onclick="game.endNightPhase()">🌅 Terminar Noche</button>
                    </div>
                </div>
            `;
        }
    }

    endNightPhase() {
        this.stopTimer();
        this.showResults();
    }

    showNightResults() {
        this.showSection('results-phase');
        this.updatePhaseIndicator(`🌅 Amanecer del Día ${this.nightCount} - Resultados de la noche.`);
        
        if (this.resultsContent) {
            const eliminatedPlayer = this.getRandomPlayer();
            const protectedPlayer = this.getRandomPlayer();
            
            this.resultsContent.innerHTML = `
                <div class="night-summary">
                    <h3>📜 Resumen de la Noche ${this.nightCount}</h3>
                    <div class="result-item">
                        <strong>💀 Víctima de las Brujas:</strong> ${eliminatedPlayer || 'Nadie - fue protegido'}
                    </div>
                    <div class="result-item">
                        <strong>🛡️ Protección del Alguacil:</strong> Jugador protegido en secreto
                    </div>
                    <div class="result-item">
                        <strong>⚖️ Sheriff:</strong> ${this.sheriff} mantiene el orden
                    </div>
                    <div class="players-remaining">
                        <strong>👥 Jugadores restantes:</strong> ${this.players.length}
                    </div>
                </div>
            `;
        }
        
        this.checkGameEnd();
    }

    startNewNight() {
        this.startConfessionPhase();
    }

    endGame() {
        this.resetGame();
    }

    checkGameEnd() {
        // Lógica simplificada para verificar fin del juego
        if (this.nightCount >= 3) {
            // Narrar el final del juego
            this.speakGameEnd('Todos');
            this.showAlert('🏁 El juego ha terminado después de 3 noches. ¡Gracias por jugar!');
            this.gameEnded = true;
        }
    }

    // Métodos de utilidad
    switchPhase(phase) {
        if (this.setupPhase) this.setupPhase.classList.remove('active');
        if (this.gamePhase) this.gamePhase.classList.remove('active');
        
        if (phase === 'setup' && this.setupPhase) {
            this.setupPhase.classList.add('active');
        } else if (phase === 'game' && this.gamePhase) {
            this.gamePhase.classList.add('active');
        }
        
        this.currentPhase = phase;
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        const sections = ['role-assignment', 'sheriff-selection', 'confession-phase', 'results-phase'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Mostrar la sección solicitada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    updatePhaseIndicator(message) {
        if (this.phaseIndicator) {
            this.phaseIndicator.innerHTML = `<div class="phase-message">${message}</div>`;
        }
    }

    // Timer
    startTimer(seconds) {
        this.stopTimer();
        this.timerSeconds = seconds;
        this.timeExpired = false; // Resetear el flag al iniciar un nuevo timer
        
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'block';
        }
        
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            
            if (this.timerSeconds <= 0) {
                this.timeExpired = true; // Marcar que se acabó el tiempo
                this.stopTimer();
                this.playSound('timeup');
                this.autoAdvancePhase();
            }
        }, 1000);
        
        this.playSound('timer');
    }

    autoAdvancePhase() {
        // Avanzar automáticamente a la siguiente fase cuando se agote el tiempo
        const isFirstNight = this.nightCount === 1;
        
        switch (this.currentPhase) {
            case 'witch':
                if (isFirstNight) {
                    this.showFirstNightResults();
                } else {
                    this.showPhaseTransition('sheriff');
                }
                break;
            case 'sheriff':
                this.showPhaseTransition('confession');
                break;
            case 'confession':
                this.showPhaseTransition('results');
                break;
            default:
                this.showAlert('⏰ ¡Tiempo agotado!');
                break;
        }
    }

    updateTimerDisplay() {
        if (this.timerText) {
            const minutes = Math.floor(this.timerSeconds / 60);
            const seconds = this.timerSeconds % 60;
            this.timerText.textContent = `⏰ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'none';
        }
    }

    // Generar cartas de jugadores para diferentes acciones
    generatePlayerCards(actionType, multipleSelection = false) {
        return this.players.map(player => `
            <div class="player-card" data-player="${player}" onclick="game.selectPlayerForAction('${player}', '${actionType}', ${multipleSelection})">
                <div class="player-name">👤 ${player}</div>
            </div>
        `).join('');
    }

    // Generar cartas de jugadores manteniendo la protección del alguacil
    generatePlayerCardsWithProtection(actionType, multipleSelection = false, sheriffProtected = null) {
        return this.players.map(player => {
            const isProtected = sheriffProtected === player;
            const glowClass = isProtected ? 'sheriff-glow' : '';
            const shieldIcon = isProtected ? '<div class="shield-icon">🛡️</div>' : '';
            
            return `
                <div class="player-card ${glowClass}" data-player="${player}" onclick="game.selectPlayerForAction('${player}', '${actionType}', ${multipleSelection})">
                    <div class="player-name">👤 ${player}</div>
                    ${shieldIcon}
                </div>
            `;
        }).join('');
    }
    
    selectPlayerForAction(player, actionType, multipleSelection = false) {
        const card = document.querySelector(`[data-player="${player}"]`);
    
        if (multipleSelection) {
            // Lógica para selección múltiple (confesiones)
            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                // Remover del array
                if (this.selectedPlayers[actionType]) {
                    this.selectedPlayers[actionType] = this.selectedPlayers[actionType].filter(p => p !== player);
                }
            } else {
                card.classList.add('selected');
                // Añadir al array
                if (!this.selectedPlayers[actionType]) {
                    this.selectedPlayers[actionType] = [];
                }
                this.selectedPlayers[actionType].push(player);
            }
        } else {
            // Lógica para selección única
            const previousSelected = document.querySelector('.player-card.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected', 'witch-glow', 'sheriff-glow');
                // Remover escudo si existe
                const shield = previousSelected.querySelector('.shield-icon');
                if (shield) shield.remove();
            }
    
            card.classList.add('selected');
            this.selectedPlayers[actionType] = [player];
    
            // Efectos visuales específicos
            if (actionType === 'witch-attack') {
                card.classList.add('witch-glow');
            } else if (actionType === 'sheriff-protect') {
                card.classList.add('sheriff-glow');
                // Añadir escudo
                const shield = document.createElement('div');
                shield.className = 'shield-icon';
                shield.innerHTML = '🛡️';
                card.appendChild(shield);
            }
        }
    
        this.playSound('select');
    }
    
    // Iniciar nueva noche
    startNewNight() {
        this.nightCount++;
        this.showWitchPhase();
    }
    
    // Obtener jugador aleatorio (para demo)
    getRandomPlayer() {
        return this.players[Math.floor(Math.random() * this.players.length)];
    }
    
    // Verificar fin del juego
    checkGameEnd() {
        // Lógica para verificar condiciones de victoria
        // Por ahora solo es informativo
    }

    // Utilidades
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getRandomPlayer() {
        if (this.players.length === 0) return null;
        return this.players[Math.floor(Math.random() * this.players.length)];
    }

    showAlert(message) {
        // Crear un modal personalizado para alertas
        const alertModal = document.createElement('div');
        alertModal.className = 'modal';
        alertModal.innerHTML = `
            <div class="modal-content">
                <h3>🔔 Aviso</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Entendido</button>
            </div>
        `;
        document.body.appendChild(alertModal);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertModal.parentNode) {
                alertModal.remove();
            }
        }, 5000);
    }

    showImmunityModal(message) {
        if (this.immunityModal && this.immunityMessage) {
            this.immunityMessage.textContent = message;
            this.immunityModal.style.display = 'flex';
        }
    }

    closeImmunityModal() {
        if (this.immunityModal) {
            this.immunityModal.style.display = 'none';
        }
    }

    playSound(type) {
        // Sistema de sonidos simplificado - solo notificaciones visuales
        console.log(`🔊 Sonido: ${type}`);
        
        // Mostrar notificación visual en lugar de reproducir MP3
        const soundMessages = {
            'add': 'Jugador añadido',
            'remove': 'Jugador eliminado', 
            'start': 'Juego iniciado',
            'phase': 'Cambio de fase',
            'select': 'Selección realizada',
            'confirm': 'Acción confirmada',
            'timer': 'Advertencia de tiempo',
            'timeup': 'Tiempo agotado'
        };
        
        const message = soundMessages[type] || 'Acción realizada';
        this.showVoiceNotification(message);
    }

    resetGame() {
        // Resetear todas las variables
        this.players = [];
        this.roles = [];
        this.sheriff = null;
        this.currentPhase = 'setup';
        this.nightCount = 0;
        this.gameEnded = false;
        
        // Limpiar timer
        this.stopTimer();
        
        // Detener música de fondo
        this.stopBackgroundMusic();
        
        // Resetear UI
        this.updateNamesList();
        this.updateStartButton();
        this.switchPhase('setup');
        
        // Limpiar campos
        if (this.nameInput) this.nameInput.value = '';
        if (this.phaseIndicator) this.phaseIndicator.innerHTML = '';
        
        // Ocultar secciones del juego
        const sections = ['role-assignment', 'sheriff-selection', 'confession-phase', 'results-phase'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        this.playSound('reset');
        console.log('🔄 Juego reiniciado');
    }
    
    // ===== SISTEMA DE VOCES =====
    
    initializeVoiceSystem() {
        // Detectar si estamos en un entorno APK
        this.isAPK = this.detectAPKEnvironment();
        
        // Inicializar Web Speech API si está disponible
        if ('speechSynthesis' in window && !this.isAPK) {
            this.speechSynthesis = window.speechSynthesis;
            console.log('🔊 Sistema de voces Web Speech API inicializado');
        } else {
            console.log('🔊 Sistema de voces en modo respaldo (APK/HTML5 Audio)');
        }
    }
    
    detectAPKEnvironment() {
        // Detectar si estamos en un WebView de Android (APK)
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroidWebView = userAgent.includes('android') && userAgent.includes('wv');
        const isCordova = typeof window.cordova !== 'undefined';
        
        return isAndroidWebView || isCordova;
    }
    
    async initializeVoiceSystem() {
        try {
            // Usar el sistema simplificado de Web Speech API
            if (typeof SimpleWebSpeech !== 'undefined') {
                this.audioManager = new SimpleWebSpeech();
                await this.audioManager.initialize();
                
                // Configurar con las preferencias del usuario
                this.audioManager.setVolume(this.voiceVolume);
                this.audioManager.setRate(this.voiceSpeed);
                this.audioManager.setEnabled(this.voiceEnabled);
                
                console.log('🔊 Sistema de Voz Web Speech API inicializado');
                console.log('📊 Info del sistema:', this.audioManager.getSystemInfo());
            } else {
                console.warn('⚠️ SimpleWebSpeech no disponible');
                
                // Fallback básico con Web Speech API
                if ('speechSynthesis' in window) {
                    this.speechSynthesis = window.speechSynthesis;
                    console.log('🔊 Usando Web Speech API como fallback');
                }
            }
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de voz:', error);
            
            // Fallback de emergencia
            if ('speechSynthesis' in window) {
                this.speechSynthesis = window.speechSynthesis;
                console.log('🔊 Usando Web Speech API como fallback de emergencia');
            }
        }
    }
    
    speak(text, options = {}) {
        if (!this.voiceEnabled || !text) return;
        
        try {
            // Usar el nuevo sistema híbrido si está disponible
            if (this.audioManager && typeof this.audioManager.speak === 'function') {
                return this.audioManager.speak(text, options);
            }
            
            // Fallback al sistema anterior
            const finalOptions = {
                volume: this.voiceVolume,
                rate: this.voiceSpeed,
                pitch: 1,
                lang: 'es-ES',
                ...options
            };
            
            if (this.speechSynthesis && !this.isAPK) {
                this.speakWithWebAPI(text, finalOptions);
            } else {
                this.speakWithFallback(text, finalOptions);
            }
        } catch (error) {
            console.error('❌ Error en sistema de voces:', error);
            // Fallback de emergencia
            this.speakWithFallback(text, options);
        }
    }
    
    speakWithWebAPI(text, options) {
        try {
            // Cancelar cualquier síntesis anterior
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = options.volume;
            utterance.rate = options.rate;
            utterance.pitch = options.pitch;
            utterance.lang = options.lang;
            
            // Buscar una voz en español si está disponible
            const voices = this.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => 
                voice.lang.startsWith('es') || voice.name.toLowerCase().includes('spanish')
            );
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
                console.log(`🗣️ Usando voz: ${spanishVoice.name} (${spanishVoice.lang})`);
            } else {
                console.log('⚠️ No se encontró voz en español, usando voz por defecto');
            }
            
            // Añadir eventos para debugging
            utterance.onstart = () => console.log(`🎤 Iniciando síntesis: "${text}"`);
            utterance.onend = () => console.log(`✅ Síntesis completada: "${text}"`);
            utterance.onerror = (event) => {
                console.error('❌ Error en síntesis de voz:', event.error);
                this.speakWithFallback(text, options);
            };
            
            this.speechSynthesis.speak(utterance);
            console.log(`🗣️ Hablando: "${text}"`);
        } catch (error) {
            console.warn('Error en Web Speech API, usando respaldo:', error);
            this.speakWithFallback(text, options);
        }
    }
    
    speakWithFallback(text, options) {
        // Para APK o cuando Web Speech API no está disponible
        // Solo mostrar en consola - SIN NOTIFICACIONES VISUALES MOLESTAS
        console.log(`🗣️ Narrador: "${text}"`);
        
        // NO mostrar notificación visual - eliminado para evitar spam
        // this.showVoiceNotification(text);
    }
    
    showVoiceNotification(text) {
        // Crear elemento de notificación visual
        const notification = document.createElement('div');
        notification.className = 'voice-notification';
        notification.textContent = `🗣️ ${text}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(138, 43, 226, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: voiceSlideIn 0.3s ease-out;
        `;
        
        // Añadir animación CSS si no existe
        if (!document.getElementById('voice-animations')) {
            const style = document.createElement('style');
            style.id = 'voice-animations';
            style.textContent = `
                @keyframes voiceSlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes voiceSlideOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'voiceSlideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Funciones específicas para cada fase del juego - ACTUALIZADAS
    async speakNightStart() {
        if (this.audioManager) {
            return this.audioManager.speakNightStart();
        }
        this.speak("Cierren los ojos. La noche ha comenzado. Todos los aldeanos deben dormir.");
    }
    
    async speakWitchPhase() {
        if (this.audioManager) {
            return this.audioManager.speakWitchPhase();
        }
        this.speak("Abran los ojos las brujas. Es hora de elegir a su víctima.");
    }
    
    async speakSheriffPhase() {
        if (this.audioManager) {
            return this.audioManager.speakSheriffPhase();
        }
        this.speak("Alguacil, abre los ojos. Elige a quién proteger esta noche.");
    }
    
    async speakConfessionPhase() {
        if (this.audioManager) {
            return this.audioManager.speakConfessionPhase();
        }
        this.speak("Abran los ojos todos. Es hora de las confesiones y deliberaciones.");
    }
    
    async speakDayStart() {
        if (this.audioManager) {
            const catTarget = this.selectedPlayers && this.selectedPlayers['witch-cat'] ? this.selectedPlayers['witch-cat'][0] : null;
            
            if (catTarget && this.nightCount === 1) {
                // Primera noche con gato negro
                return this.audioManager.speak(`Ha amanecido. Todos pueden abrir los ojos. El gato negro fue colocado en ${catTarget}.`);
            } else {
                // Noches normales
                return this.audioManager.speakDayStart();
            }
        }
        
        const catTarget = this.selectedPlayers && this.selectedPlayers['witch-cat'] ? this.selectedPlayers['witch-cat'][0] : null;
        
        if (catTarget && this.nightCount === 1) {
            // Primera noche con gato negro
            this.speak(`Ha amanecido. Todos pueden abrir los ojos. El gato negro fue colocado en ${catTarget}.`);
        } else {
            // Noches normales
            this.speak("Ha amanecido. Todos pueden abrir los ojos.");
        }
    }
    
    async speakGameEnd(winner) {
        if (this.audioManager) {
            return this.audioManager.speakGameEnd(winner);
        }
        
        if (winner === 'aldeanos') {
            this.speak("¡Los aldeanos han ganado! Las brujas han sido derrotadas.");
        } else if (winner === 'brujas') {
            this.speak("¡Las brujas han ganado! Han eliminado a todos los aldeanos.");
        }
    }
    
    async speakTimerWarning() {
        if (this.audioManager) {
            return this.audioManager.speakTimerWarning();
        }
        this.speak("Quedan treinta segundos.");
    }
    
    async speakTimeUp() {
        if (this.audioManager) {
            return this.audioManager.speakTimeUp();
        }
        this.speak("Se acabó el tiempo.");
    }

    // Método para probar el sistema TTS
    testTTS(text = "Prueba del sistema de voces") {
        console.log('🎤 Probando sistema TTS...');
        console.log('📊 Estado del sistema:');
        console.log('  - audioManager:', !!this.audioManager);
        console.log('  - speechSynthesis:', !!this.speechSynthesis);
        console.log('  - voiceEnabled:', this.voiceEnabled);
        
        if (this.audioManager) {
            console.log('  - Tipo de audioManager:', this.audioManager.constructor.name);
            console.log('  - Info del sistema:', this.audioManager.getSystemInfo ? this.audioManager.getSystemInfo() : 'No disponible');
        }
        
        if (this.speechSynthesis) {
            const voices = this.speechSynthesis.getVoices();
            console.log('  - Voces disponibles:', voices.length);
            voices.slice(0, 5).forEach((voice, index) => {
                console.log(`    ${index}: ${voice.name} (${voice.lang})`);
            });
        }
        
        // Probar síntesis
        this.speak(text);
    }

    // ===== MÉTODOS DE NAVEGACIÓN =====
    showMainMenu() {
        console.log('🏠 Mostrando menú principal');
        this.loadingScreen.style.display = 'none';
        this.mainApp.style.display = 'none';
        this.mainMenu.style.display = 'flex';
        this.stopBackgroundMusic();
        this.resetGame();
    }

    showNewGame() {
        console.log('🎮 Iniciando nuevo juego');
        this.mainMenu.style.display = 'none';
        this.mainApp.style.display = 'block';
        this.speak("Bienvenido a Salem. Prepárate para una noche de misterio y traición.");
    }

    showRules() {
        console.log('📜 Abriendo reglas del juego');
        window.open('https://town-of-salem.fandom.com/wiki/Town_of_Salem_Rules', '_blank');
    }

    ensureMainMenuVisible() {
        // Asegurar que el menú principal esté visible y la app oculta
        if (this.mainMenu && this.mainApp) {
            this.mainMenu.style.display = 'flex';
            this.mainApp.style.display = 'none';
        }
    }

    // ===== SISTEMA DE MÚSICA DE FONDO =====
    async initializeBackgroundMusic() {
        try {
            if (typeof SimpleBackgroundMusic !== 'undefined') {
                this.backgroundMusic = new SimpleBackgroundMusic();
                await this.backgroundMusic.initialize();
                this.backgroundMusic.setVolume(this.musicVolume);
                this.backgroundMusic.setEnabled(this.musicEnabled);
                console.log('🎵 Sistema de música de fondo inicializado');
            } else {
                console.warn('⚠️ SimpleBackgroundMusic no está disponible');
            }
        } catch (error) {
            console.warn('⚠️ Error inicializando música de fondo:', error);
        }
    }

    startBackgroundMusic(type = 'night') {
        if (this.backgroundMusic && this.musicEnabled) {
            this.backgroundMusic.playBackgroundMusic(type);
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stopBackgroundMusic();
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(volume);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (this.backgroundMusic) {
            this.backgroundMusic.setEnabled(enabled);
        }
    }
}

// Inicializar el juego cuando Cordova esté listo
function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    // Mostrar pantalla de carga por 2 segundos
    setTimeout(() => {
        console.log('⏰ Timeout completado, ocultando pantalla de carga...');
        
        const loadingScreen = document.getElementById('loading-screen');
        const mainMenu = document.getElementById('main-menu');
        
        if (loadingScreen && mainMenu) {
            loadingScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
            console.log('✅ Pantalla de carga ocultada, mostrando menú principal...');
            window.game = new SalemGame();
            console.log('🎮 Juego iniciado correctamente');
        } else {
            console.error('❌ Error: No se encontraron elementos loading-screen o main-menu');
        }
    }, 2000);
}

// Para aplicaciones Cordova, esperar deviceready
if (typeof window.cordova !== 'undefined') {
    console.log('📱 Entorno Cordova detectado, esperando deviceready...');
    document.addEventListener('deviceready', () => {
        console.log('✅ Evento deviceready recibido');
        initializeApp();
    }, false);
} else {
    console.log('🌐 Entorno web detectado, usando DOMContentLoaded...');
    // Para navegador web, usar DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ Evento DOMContentLoaded recibido');
        initializeApp();
    });
}