const fs = require('fs');
const path = require('path');

// Configuración de audios
const audioConfig = {
    'night-start.mp3': 'La noche ha comenzado',
    'witch-phase.mp3': 'Fase de brujas',
    'sheriff-phase.mp3': 'Fase del alguacil',
    'confession-time.mp3': 'Tiempo de confesiones',
    'day-start.mp3': 'El día ha comenzado',
    'villagers-win.mp3': 'Los aldeanos han ganado',
    'witches-win.mp3': 'Las brujas han ganado',
    'time-warning.mp3': 'Quedan 30 segundos',
    'vote-time.mp3': 'Tiempo de votación'
};

// Crear HTML temporal para generar audios
const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generador Automático de Audios</title>
</head>
<body>
    <h1>Generando Audios Automáticamente...</h1>
    <div id="status"></div>
    <div id="progress"></div>

    <script>
        const audioConfig = ${JSON.stringify(audioConfig)};
        const statusDiv = document.getElementById('status');
        const progressDiv = document.getElementById('progress');
        
        let currentIndex = 0;
        const audioFiles = Object.keys(audioConfig);
        
        function updateStatus(message) {
            statusDiv.innerHTML = message;
            console.log(message);
        }
        
        function updateProgress() {
            const progress = Math.round((currentIndex / audioFiles.length) * 100);
            progressDiv.innerHTML = \`Progreso: \${progress}% (\${currentIndex}/\${audioFiles.length})\`;
        }
        
        async function generateAudio(filename, text) {
            return new Promise((resolve, reject) => {
                updateStatus(\`Generando: \${filename} - "\${text}"\`);
                
                // Configurar Web Speech API
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-ES';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                // Buscar voz en español
                const voices = speechSynthesis.getVoices();
                const spanishVoice = voices.find(voice => 
                    voice.lang.includes('es') || voice.name.includes('Spanish')
                );
                if (spanishVoice) {
                    utterance.voice = spanishVoice;
                }
                
                // Configurar MediaRecorder para capturar audio
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        const mediaRecorder = new MediaRecorder(stream);
                        const audioChunks = [];
                        
                        mediaRecorder.ondataavailable = event => {
                            audioChunks.push(event.data);
                        };
                        
                        mediaRecorder.onstop = () => {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                            const url = URL.createObjectURL(audioBlob);
                            
                            // Crear enlace de descarga automática
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            stream.getTracks().forEach(track => track.stop());
                            resolve();
                        };
                        
                        // Iniciar grabación
                        mediaRecorder.start();
                        
                        // Reproducir texto y detener grabación cuando termine
                        utterance.onend = () => {
                            setTimeout(() => {
                                mediaRecorder.stop();
                            }, 500); // Pequeña pausa al final
                        };
                        
                        utterance.onerror = (error) => {
                            mediaRecorder.stop();
                            stream.getTracks().forEach(track => track.stop());
                            reject(error);
                        };
                        
                        speechSynthesis.speak(utterance);
                    })
                    .catch(reject);
            });
        }
        
        async function generateAllAudios() {
            updateStatus('Iniciando generación de audios...');
            
            for (const [filename, text] of Object.entries(audioConfig)) {
                try {
                    await generateAudio(filename, text);
                    currentIndex++;
                    updateProgress();
                    updateStatus(\`✅ Completado: \${filename}\`);
                    
                    // Pausa entre audios
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    updateStatus(\`❌ Error en \${filename}: \${error.message}\`);
                    console.error('Error:', error);
                }
            }
            
            updateStatus('🎉 ¡Todos los audios generados! Revisa tu carpeta de descargas.');
        }
        
        // Esperar a que las voces estén disponibles
        function waitForVoices() {
            return new Promise(resolve => {
                if (speechSynthesis.getVoices().length > 0) {
                    resolve();
                } else {
                    speechSynthesis.onvoiceschanged = () => {
                        if (speechSynthesis.getVoices().length > 0) {
                            resolve();
                        }
                    };
                }
            });
        }
        
        // Iniciar cuando la página esté lista
        window.addEventListener('load', async () => {
            await waitForVoices();
            setTimeout(generateAllAudios, 1000);
        });
    </script>
</body>
</html>
`;

// Escribir archivo HTML
fs.writeFileSync('auto-generate-audios.html', htmlContent);
console.log('✅ Archivo auto-generate-audios.html creado');
console.log('🚀 Abre este archivo en tu navegador para generar todos los audios automáticamente');