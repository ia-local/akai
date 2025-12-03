// ----------------------------------------------------------------------
// MODULE CONTROLLER
// Gère la visualisation des 16 Pads (One-Shots) et des 6 Knobs CC.
// Gère l'état global (appState), le feedback de connexion MIDI, 
// et la synchronisation visuelle.
// ----------------------------------------------------------------------

class Controller {
    constructor(sendOsc, appState, padsCount, padMapping, logFn) {
        this.sendOsc = sendOsc;
        this.appState = appState;
        this.padsCount = padsCount;
        this.padMapping = padMapping;
        this.updateLog = logFn;
        
        this.padController = document.getElementById('pad-controller');
        this.midiStatusElement = document.querySelector('.c-user-profile'); 

        this.midiConnected = false; 

        this.circleOfFifths = [
            "C (Do)", "G (Sol)", "D (Ré)", "A (La)", "E (Mi)", "B (Si)",
            "F# (Fa#)", "Db (Réb)", "Ab (Lab)", "Eb (Mib)", "Bb (Sib)", "F (Fa)"
        ];
        
        // Stocke la valeur normalisée (0.0 à 1.0) de chaque Knob (pour la synchronisation Modale)
        this.knobNormValues = Array(6).fill(0.0);
    }
    
    // --- NOUVELLE FONCTION MANQUANTE POUR LE SYNC DE LA MODALE ---
    /**
     * Synchronise l'affichage de tous les Knobs (Dashboard et Modale)
     * en lisant l'état stocké. Appelée par la Modale lors de l'ouverture.
     */
    updateAllKnobViews() {
        // Appeler la fonction de visualisation pour chaque Knob (CC ID 0 à 5)
        for (let ccId = 0; ccId < 6; ccId++) {
            const normValue = this.knobNormValues[ccId] || 0.0;
            this.updateKnobVisualization(ccId, normValue);
        }
    }

    // --- LOGIQUE DOM/VISUEL ---

    setMidiStatus(connected) {
        if (this.midiStatusElement) {
            this.midiStatusElement.innerHTML = connected 
                ? '<i class="fas fa-plug" style="color: var(--color-accent-green);"></i> MPD218 CONNECTÉ'
                : '<i class="fas fa-times-circle" style="color: var(--color-accent-red);"></i> MIDI DÉCONNECTÉ';
            this.midiConnected = connected;
        }
    }

    /**
     * Met à jour la visualisation d'un Knob spécifique sur le Dashboard ET dans la Modale.
     * @param {number} ccId - ID du contrôleur (0 à 5).
     * @param {number} normValue - Valeur normalisée (0.0 à 1.0).
     */
    updateKnobVisualization(ccId, normValue) {
        // Cibler TOUS les éléments Knob et Value qui pourraient exister (Dashboard et Modale)
        const knobElements = document.querySelectorAll(`#knob-${ccId}`);
        const valueElements = document.querySelectorAll(`#val-${ccId}`);

        if (knobElements.length === 0 && valueElements.length === 0) return;

        let rotationValue = normValue; 
        let displayValue;
        let suffix = '';

        // Logique de conversion (match la logique de Sonic Pi)
        switch(ccId) {
            case 0: // Knob 1: Volume Maître (CC 0) - CORRECTION VISUELLE DE L'INVERSION
                normValue = 1.0 - normValue;
                displayValue = (1.5 * normValue).toFixed(2);
                rotationValue = normValue; 
                break;
            case 2: // Knob 3: Vélocité (CC 2) 
                let velocity = (0.5 + normValue * 0.7);
                displayValue = velocity.toFixed(2);
                suffix = ' Vel';
                break;
            case 4: // Knob 5: Cercle Chromatique (CC 4) 
                const circleIndex = Math.min(11, Math.floor(normValue * 12));
                displayValue = this.circleOfFifths[circleIndex];
                suffix = ' (Clé)';
                rotationValue = circleIndex / 11; 
                break;
            // Autres Knobs EQ (Les valeurs sont calculées pour l'affichage)
            case 1: displayValue = (40 + normValue * 80).toFixed(0); suffix = 'Hz (Basses)'; break;
            case 3: displayValue = (40 + normValue * 80).toFixed(0); suffix = 'Hz (Tone)'; break;
            case 5: displayValue = (10 + normValue * 40).toFixed(0); suffix = 'Hz (Aigus)'; break;
            default: rotationValue = normValue; 
        }
        
        // Calcul de la rotation : -135deg (min) à 135deg (max)
        const rotationDeg = -135 + (rotationValue * 270);
        
        // Mise à jour de tous les Knobs trouvés
        knobElements.forEach(el => {
            el.style.setProperty('--knob-rotation', `${rotationDeg}deg`);
        });
        
        // Mise à jour de toutes les valeurs affichées
        valueElements.forEach(el => {
            el.textContent = displayValue + suffix;
        });
    }

    // --- GESTION DES ÉVÉNEMENTS MIDI (DE SONIC PI) ---

    handlePadEvent(address, args) {
        if (!this.midiConnected) this.setMidiStatus(true);

        const padId = parseInt(address.split('/')[2]); 
        const velocity = args[0].value;

        // Mapping simple : Pad 0 -> Note basse, Pad 15 -> Note haute
        const fakeMidiNote = 36 + padId * 2; 

        if (velocity > 0 && this.visualizer) {
             this.visualizer.triggerVisual(fakeMidiNote, velocity);
        }
        // Mise à jour du PAD VIRTUEL (Modale)
        const padElement = document.getElementById(`midi-pad-${padId}`);
        if (padElement) {
            padElement.classList.add('active');
            setTimeout(() => {
                padElement.classList.remove('active');
            }, 150);
        }
        
        this.updateLog(`Pad ${padId} pressé (MIDI).`, 'red');
    }

    handleKnobEvent(address, args) {
        if (!this.midiConnected) this.setMidiStatus(true);
        
        const ccId = parseInt(address.split('/')[2]); 
        let normValue = args[0].value; 
        
        // 1. Stocker la valeur normalisée (pour le sync de la modale)
        this.knobNormValues[ccId] = normValue;
        
        // 2. Mettre à jour l'état critique (pour le Sequencer)
        switch(ccId) {
            case 2: // Vélocité (Knob 3)
                this.appState.velocity = (0.5 + normValue * 0.7);
                this.sendOsc('/control/velocity', this.appState.velocity); 
                break;
            case 4: // Cercle Chromatique (Knob 5)
                this.appState.keyOffset = Math.min(11, Math.floor(normValue * 12));
                this.sendOsc('/harmony/key', this.appState.keyOffset);
                break;
        }

        // 3. Mettre à jour l'affichage visuel (Dashboard et Modale)
        this.updateKnobVisualization(ccId, normValue);
        this.updateLog(`Knob ${ccId} tourné.`, 'muted');
    }
}

window.Controller = Controller;