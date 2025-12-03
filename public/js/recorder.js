// ----------------------------------------------------------------------
// RECORDER.JS : MODULE D'ENREGISTREMENT AUDIO
// Capture le flux Master de Tone.js et l'envoie au serveur Node.js
// ----------------------------------------------------------------------

class AudioRecorder {
    constructor(socket, logFn) {
        this.socket = socket;
        this.updateLog = logFn;
        this.mediaRecorder = null;
        this.chunks = [];
        this.isRecording = false;

        this.btnRec = document.getElementById('btn-rec');
        this.initListeners();
    }

    initListeners() {
        if (this.btnRec) {
            this.btnRec.addEventListener('click', () => this.toggleRecording());
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

async startRecording() {
        // 1. Vérifier que Tone.js est actif
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        console.log("Audio Context State:", Tone.context.state);

        try {
            // --- CORRECTION : CRÉATION ROBUSTE DU FLUX ---
            
            // A. On crée un noeud de destination de flux "natif" via le contexte Tone
            const streamDestination = Tone.context.createMediaStreamDestination();
            
            // B. On connecte la sortie Maître (Master) de Tone.js à ce noeud
            // Cela permet d'entendre le son (Speakers) ET de l'enregistrer (Stream)
            Tone.getDestination().connect(streamDestination);
            
            // C. On récupère le flux audio brut
            const stream = streamDestination.stream;

            // ---------------------------------------------

            // 3. Initialiser le MediaRecorder avec ce flux
            // On tente le format webm (standard) ou ogg
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
            
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
            this.chunks = [];

            // Événement : Des données audio sont disponibles
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            // Événement : Arrêt de l'enregistrement -> Envoi au serveur
            this.mediaRecorder.onstop = () => {
                this.saveToServer();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
            this.updateLog('🔴 Enregistrement démarré...', 'red');

        } catch (err) {
            console.error("Erreur Recorder:", err);
            this.updateLog('Erreur init Recorder (voir console)', 'red');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateUI(false);
            this.updateLog('⏹ Enregistrement terminé. Traitement...', 'yellow');
        }
    }

    saveToServer() {
        // Création du Blob final
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        
        this.updateLog(`Envoi de ${blob.size} octets au serveur...`, 'muted');

        // Envoi via Socket.io (Buffer)
        this.socket.emit('audio_save_request', {
            fileData: blob,
            timestamp: Date.now()
        });
    }

    updateUI(isRec) {
        if (this.btnRec) {
            if (isRec) this.btnRec.classList.add('is-recording');
            else this.btnRec.classList.remove('is-recording');
        }
    }
}