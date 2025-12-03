// ----------------------------------------------------------------------
// MODULE SEQUENCER
// Gère le Piano Roll, le Timecode T, et le Transport.
// Correction de l'asynchronisme en utilisant l'état partagé (appState).
// ----------------------------------------------------------------------

class Sequencer {
    // Le constructeur reçoit l'objet d'état global
    constructor(sendOsc, appState, notesCount, stepsCount, bpm, midiBaseNote, noteMapping, logFn) {
        this.sendOsc = sendOsc;
        this.appState = appState;
        this.notesCount = notesCount;
        this.stepsCount = stepsCount;
        this.bpm = bpm;
        this.midiBaseNote = midiBaseNote;
        this.noteMapping = noteMapping;
        this.updateLog = logFn;

        this.sequencerInterval = null;
        this.currentStep = 0;
        this.isPlaying = false;
        // Intervalle calculé pour un 1/16ème de note
        this.stepDuration = (60000 / this.bpm) / 4; 

        // Initialisation de Tone.js (pour l'écoute dans le navigateur)
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        
        this.timelineGrid = document.getElementById('timeline-grid');
        this.sampleNamesGrid = document.getElementById('sample-names-grid');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStop = document.getElementById('btn-stop');
        this.tempoDisplay = document.querySelector('.c-tempo-display');

        // --- NOUVEAU : Référence à la barre de lecture globale (Timeline) ---
        this.globalPlayhead = document.getElementById('global-playhead');
        
        this.setupTransportListeners();
    }

    setupTransportListeners() {
        if (this.btnPlay) this.btnPlay.addEventListener('click', () => this.startSequencer());
        if (this.btnStop) this.btnStop.addEventListener('click', () => this.stopSequencer());
        if (this.btnStop) this.btnStop.disabled = true;
        if (this.tempoDisplay) this.tempoDisplay.textContent = `BPM: ${this.bpm}`;
    }

    // --- LOGIQUE DOM (initializeGrid() - Ajout de l'événement de clic pour le son immédiat) ---

    initializeGrid() {
        if (!this.timelineGrid || !this.sampleNamesGrid) return;

        // 1. Génération des 12 Étiquettes de Notes (Axe Y)
        for (let i = 0; i < this.notesCount; i++) {
            const label = document.createElement('div');
            label.className = 'c-sample-label';
            label.id = `note-${i}`;
            label.textContent = this.noteMapping[i];
            this.sampleNamesGrid.appendChild(label);
        }

        // 2. Génération de la Grille 12x16
        for (let row = 0; row < this.notesCount; row++) {
            for (let col = 0; col < this.stepsCount; col++) {
                const step = document.createElement('div');
                step.className = 'c-step';
                step.dataset.row = row; 
                step.dataset.col = col; 

                // Écouteur de clic pour programmer et JOUER IMMÉDIATEMENT la note
                step.addEventListener('click', (e) => {
                    step.classList.toggle('step-on');
                    
                    // JEU IMMÉDIAT DANS LE NAVIGATEUR (Feedback)
                    if (e.target.classList.contains('step-on')) {
                         this.playSingleNote(row);
                    }
                });

                this.timelineGrid.appendChild(step);
            }
        }
        this.updateLog(`Piano Roll ${this.notesCount}x${this.stepsCount} prêt.`);
    }

    // --- LOGIQUE SONORE TONE.JS ---

    /**
     * Calcule et joue une note unique dans le navigateur (Tone.js).
     * Utilisé pour le feedback de clic et le séquencement.
     * @param {number} row - Ligne du Piano Roll (0 à 11).
     */
    playSingleNote(row) {
        // Lecture de l'état partagé pour la transposition
        const keyOffset = this.appState.keyOffset || 0;
        
        const baseNote = this.midiBaseNote + (this.notesCount - 1 - row);
        const midiNote = baseNote + keyOffset; 
        
        const noteName = Tone.Midi(midiNote).toNote();

        // Utilise la vélocité minimale si le knob n'a pas été touché
        const velocity = this.appState.velocity > 0.1 ? this.appState.velocity : 0.5;

        // Jouer le son avec Tone.js
        this.synth.triggerAttackRelease(noteName, "8n", undefined, velocity);
        // --- NOUVEAU : TRIGGER VISUEL ---
        if (this.visualizer) {
            this.visualizer.triggerVisual(midiNote, velocity);
        }
    }

    advanceSequencer() {
        // Nettoyer et mettre à jour le curseur (Timecode T)
        const previousStep = this.currentStep > 0 ? this.currentStep - 1 : this.stepsCount - 1;
        document.querySelectorAll(`.c-step[data-col="${previousStep}"]`).forEach(step => {
            step.classList.remove('step-current');
        });
        this.currentStep = (this.currentStep + 1) % this.stepsCount;

        // --- NOUVEAU : MISE À JOUR VISUELLE DE LA TIMELINE ---
        if (this.globalPlayhead) {
            // Calcul du pourcentage d'avancement (0% à ~94%)
            const progressPercent = (this.currentStep / this.stepsCount) * 100;
            this.globalPlayhead.style.left = `${progressPercent}%`;
        }

        document.querySelectorAll(`.c-step[data-col="${this.currentStep}"]`).forEach(step => {
            step.classList.add('step-current');
            
            // DÉCLENCHEMENT MIDI ET SON TONE.JS
            if (step.classList.contains('step-on')) {
                const row = parseInt(step.dataset.row);
                
                // 1. Jouer le son du séquenceur (FEEDBACK AUDIO DANS LE NAVIGATEUR)
                this.playSingleNote(row); 
                
                // 2. ENVOI OSC VERS SONIC PI (Note mélodique pour le live/enregistrement)
                
                // Lecture de l'état partagé pour le déclenchement MIDI
                const keyOffset = this.appState.keyOffset || 0;
                const velocity = this.appState.velocity > 0.1 ? this.appState.velocity : 0.5; 

                const baseNote = this.midiBaseNote + (this.notesCount - 1 - row);
                const midiNote = baseNote + keyOffset; 

                // Envoi Note ON / Note OFF (Optimisation MIDI)
                this.sendOsc('/midi/play/note_on', midiNote, velocity);
                
                // Vérification console de l'envoi OSC
                console.log(`[Sequencer] ENVOI OSC: Note ${midiNote} @ Vel ${velocity.toFixed(2)}`);

                setTimeout(() => {
                    this.sendOsc('/midi/play/note_off', midiNote, 0); 
                }, 100); 

                this.updateLog(`Séquence Step ${this.currentStep}: Note ${Tone.Midi(midiNote).toNote()} jouée.`, 'yellow');
            }
        });
    }

    // --- LOGIQUE TRANSPORT (startSequencer/stopSequencer inchangée) ---

    startSequencer() {
        if (this.isPlaying) return;
        
        // IMPORTANT : Démarrer l'audio context du navigateur si Tone.js le nécessite
        if (Tone.context.state !== 'running') {
            Tone.start();
        }

        this.isPlaying = true;
        if (this.btnPlay) this.btnPlay.disabled = true;
        if (this.btnStop) this.btnStop.disabled = false;
        
        this.sendOsc('/transport/play', 1);

        this.advanceSequencer();
        this.sequencerInterval = setInterval(() => this.advanceSequencer(), this.stepDuration);
        this.updateLog(`Séquence démarrée à ${this.bpm} BPM.`, 'green');
    }

    stopSequencer() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.btnPlay) this.btnPlay.disabled = false;
        if (this.btnStop) this.btnStop.disabled = true;
        
        clearInterval(this.sequencerInterval);
        
        this.sendOsc('/transport/stop', 1);
        
        document.querySelectorAll('.c-step').forEach(step => {
            step.classList.remove('step-current');
        });
        
        // --- NOUVEAU : Réinitialiser la Timeline et le step ---
        this.currentStep = 0;
        if (this.globalPlayhead) {
            this.globalPlayhead.style.left = '0%';
        }

        this.updateLog('Séquence arrêtée.');
    }
}

window.Sequencer = Sequencer;