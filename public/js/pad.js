// ----------------------------------------------------------------------
// MODULE TONE CONTROLLER
// Gère la connexion Socket.io, le Moteur de Synthèse Tone.js, 
// et la traduction des événements MIDI/Knob en commandes audio/visuelles.
// ----------------------------------------------------------------------

class ToneController {
    
    constructor(appState, logFn, midiStatusElementSelector = '.c-user-profile') {
        this.appState = appState; // État global (Volume, EQ, etc.)
        this.updateLog = logFn;
        this.midiStatusElement = document.querySelector(midiStatusElementSelector);
        this.midiConnected = false;
        
        // Stocke la valeur normalisée (0.0 à 1.0) de chaque Knob pour la visualisation
        this.knobNormValues = Array(6).fill(0.0);
        
        // Initialisation du Moteur Tone.js (voir méthode initializeTone())
        this.toneEngine = {}; 

        // Initialisation de la communication Socket.io
        this.socket = io();
        this.setupSocketListeners();
        
        // Initialisation de Tone.js (déclenché par interaction utilisateur)
        this.initializeTone();
        
        // Mapping visuel (pour les Knobs)
        this.circleOfFifths = [
            "C (Do)", "G (Sol)", "D (Ré)", "A (La)", "E (Mi)", "B (Si)",
            "F# (Fa#)", "Db (Réb)", "Ab (Lab)", "Eb (Mib)", "Bb (Sib)", "F (Fa)"
        ];
        
        // Démarrage forcé de Tone.js sur interaction (meilleure pratique)
        document.addEventListener('click', () => {
            if (Tone.context.state !== 'running') {
                Tone.start();
                this.updateLog("Tone.js AudioContext démarré.", 'muted');
            }
        });
    }
    
    // --- INITIALISATION DU MOTEUR AUDIO TONE.JS ---
    
    initializeTone() {
        // Crée le bus de mixage principal
        this.toneEngine.masterLimiter = new Tone.Limiter(-6).toDestination();
        this.toneEngine.masterVolume = new Tone.Volume(0).connect(this.toneEngine.masterLimiter);

        // Crée l'EQ globale (pour les Knobs 2, 4, 6)
        this.toneEngine.masterEQ = new Tone.EQ3(0, 0, 0).connect(this.toneEngine.masterVolume);
    }
    
    /**
     * Mappe une source de synthé Sonic Pi à un instrument Tone.js.
     * C'est la fonction cruciale de traduction du timbre.
     */
    getToneInstrument(source) {
        let instrument;
        
        // Les synthés basés sur des formes d'onde simples (Pulse, Saw, etc.)
        if (['pulse', 'square', 'saw', 'tri', 'sine'].includes(source)) {
            instrument = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: source }
            });
        } 
        // Les synthés de bruit
        else if (['noise', 'gnoise', 'cnoise'].includes(source)) {
            instrument = new Tone.NoiseSynth({
                noise: { type: 'white' }, // Simplification à un bruit blanc
                envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
            });
        }
        // Les synthés FM et complexes (Growl, Prophet, Hollow)
        else if (['fm', 'prophet', 'dsaw', 'hollow', 'beep', 'growl'].includes(source)) {
            instrument = new Tone.FMSynth({
                modulationIndex: 1.2, // Ajouter une certaine complexité FM par défaut
            });
        }
        // Autres (pina, tb303, etc. - Fallback simple)
        else {
            instrument = new Tone.Synth();
        }
        
        // Connecter l'instrument à l'EQ principal
        return instrument.connect(this.toneEngine.masterEQ);
    }

    // --- LOGIQUE SOCKET.IO (REMPLACE L'ÉCOUTE OSC) ---
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.updateLog('Connexion établie au serveur Node.js.', 'muted');
        });

        // Événement de statut MIDI du serveur
        this.socket.on('midi_status', (data) => {
            this.setMidiStatus(data.connected);
        });

        // Événement 1: Réception d'un trigger Pad (Routage Tone.js)
        this.socket.on('/pad/trigger', (config) => {
            this.handlePadTrigger(config);
        });

        // Événement 2: Réception d'une mise à jour de Contrôle CC (Routage Visuel/FX)
        this.socket.on('/controls/:variable', (data) => {
            this.handleControlUpdate(data.address, data.value);
        });
    }
    
    /**
     * Déclenche un son Tone.js basé sur la configuration JSON reçue du serveur.
     * C'est l'équivalent du 'play' de Sonic Pi.
     */
    handlePadTrigger(config) {
        if (!this.midiConnected || Tone.context.state !== 'running') return;

        const instrument = this.getToneInstrument(config.source);
        
        // --- 1. Calcul de la Note et de la Durée (Enveloppe) ---
        let noteToPlay;
        let duration;

        // Tenter de convertir les notes Sonic Pi/Ruby en MIDI ou en string Tone.js
        if (config.note && typeof config.note === 'string' && config.note.includes('chord')) {
             // Simplification : Tone.js a besoin de C4, C#4, etc.
             // On extrait la note racine pour le test (ex: 'c5')
             noteToPlay = config.note.match(/(\w\d)/)[0];
             duration = config.options.release || 0.3;
        } else if (typeof config.note === 'string') {
             noteToPlay = config.note;
             duration = config.options.release || 0.1;
        } else {
             // Fallback: Si c'est un '1' (Noise), jouer une fréquence standard
             noteToPlay = 'C4'; 
             duration = config.options.release || 0.1;
        }
        
        // --- 2. Amplitude et FX ---
        
        // Utilisation de l'amplitude globale et de la vélocité
        const amp = config.velocity * config.global_amp * (config.options.amp || 1.0);
        
        // Déclencher le son
        instrument.triggerAttackRelease(noteToPlay, duration, Tone.now(), amp);
        
        // Nettoyage de l'instance du synthé pour les one-shots
        setTimeout(() => instrument.dispose(), 500); 
        
        // Feedback visuel du Pad (similaire à l'ancien code)
        const padIndex = config.midi_note_raw % 16;
        const padElement = document.getElementById(`midi-pad-${padIndex}`);
        if (padElement) {
            padElement.classList.add('active');
            setTimeout(() => { padElement.classList.remove('active'); }, 150);
        }
        
        this.updateLog(`Pad ${config.midi_note_raw} TRG: ${config.source} (${noteToPlay})`, 'red');
    }
    
    /**
     * Met à jour les valeurs d'état global (EQ, Volume) et l'affichage visuel.
     */
    handleControlUpdate(address, value) {
        if (!this.midiConnected) return;

        // L'adresse Socket.io est /controls/variable_name
        const variable = address.split('/')[2];
        
        // Mise à jour de l'état (pour référence locale)
        this.appState[variable] = value;
        
        // Logique de conversion et de mise à jour visuelle (identique à l'ancien Controller)
        // Note: La logique de conversion des valeurs du Knob doit être inversée ici 
        // pour correspondre à la logique de la visualisation CC (0-5).

        // --- 1. Mise à jour de l'EQ dans Tone.js ---
        // Les Knobs contrôlent le gain des bandes d'EQ (Low/Mid/High)
        const gainValue = (value - 80) / 40 * 18; // Approximation du gain (-18dB à +18dB)
        
        switch (variable) {
            case 'master_amp':
                this.toneEngine.masterVolume.volume.value = Tone.gainToDb(value / 1.5); // Convertir l'amplitude en dB
                break;
            case 'eq_bass':
                this.toneEngine.masterEQ.low.gain.value = gainValue;
                break;
            case 'eq_band':
                this.toneEngine.masterEQ.mid.gain.value = gainValue;
                break;
            case 'eq_treble':
                this.toneEngine.masterEQ.high.gain.value = gainValue;
                break;
        }

        // --- 2. Mise à jour de l'affichage du Dashboard (Dashboard et Modale) ---
        // Pour la visualisation, nous devons connaître l'index CC ID (0 à 5)
        const ccId = { 'master_amp': 0, 'eq_bass': 1, 'note_velocity': 2, 'eq_band': 3, 'key_mode_index': 4, 'eq_treble': 5 }[variable];
        
        if (ccId !== undefined) {
            // Stocker la valeur normalisée (pour les Knobs rotatifs)
            // (Note: le serveur envoie la valeur finale, ici nous devrions stocker la valeur brute 0-1.0
            // ou reculer le calcul pour la visualisation. Pour simplifier, nous utilisons la valeur finale.)
            this.updateKnobVisualization(ccId, value);
        }
        
        this.updateLog(`Contrôle CC ${variable} mis à jour.`, 'muted');
    }

    // --- LOGIQUE DOM/VISUEL (Réutilisée de l'ancien Controller) ---

    setMidiStatus(connected) {
        if (this.midiStatusElement) {
            this.midiStatusElement.innerHTML = connected 
                ? '<i class="fas fa-plug" style="color: var(--color-accent-green);"></i> MPD218 CONNECTÉ'
                : '<i class="fas fa-times-circle" style="color: var(--color-accent-red);"></i> MIDI DÉCONNECTÉ';
            this.midiConnected = connected;
        }
    }
    
    updateKnobVisualization(ccId, displayValue) {
        // Cette fonction doit être adaptée pour ne pas dépendre de la valeur normalisée (0-1.0)
        // mais de la valeur finale déjà calculée par le serveur.
        
        const summaryId = { 0: 'vol', 1: 'bass', 2: 'vel', 3: 'tone', 4: 'key', 5: 'aigus' }[ccId];
        const summaryElement = document.getElementById(`summary-${summaryId}`);
        
        if (summaryElement) {
             let formattedValue = (typeof displayValue === 'number' ? displayValue.toFixed(2) : displayValue);
             summaryElement.textContent = formattedValue;
        }
        
        // ... (Logique de rotation des Knobs de la modale à adapter si nécessaire)
    }
}

// Rendre la classe disponible globalement
window.ToneController = ToneController;