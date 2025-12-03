// ----------------------------------------------------------------------
// MODAL.JS : Composant Modal pour la Représentation Graphique du MPD218
// Rôle : Afficher le contrôleur pour la synchronisation visuelle et tactile.
// ----------------------------------------------------------------------

class MidiModal {
    constructor(controllerModule, noteMapping, padMapping) {
        this.controllerModule = controllerModule;
        this.noteMapping = noteMapping;
        this.padMapping = padMapping;
        this.modalId = 'midi-controller-modal';
        this.modalElement = null;
        this.isInitialized = false;

        this.setupModalStructure();
    }

    setupModalStructure() {
        const modalHtml = `
            <div id="${this.modalId}" class="c-modal" aria-modal="true" role="dialog" style="display: none;">
                <div class="c-modal-overlay"></div>
                <div class="c-modal-content c-mpd-layout">
                    
                    <button class="c-modal-close-btn" aria-label="Fermer" onclick="midiModal.hideModal()"><i class="fas fa-times"></i></button>
                    
                    <h3 class="c-modal-title">Contrôleur MIDI MPD218</h3>

                    <div class="mpd-body">
                        
                        <div class="mpd-knobs-section">
                            <h4 class="mpd-section-title">Paramètres de Mix & Tonalité</h4>
                            <div class="c-knob-row" id="modal-knobs-container">
                                </div>
                        </div>

                        <div class="mpd-pads-section">
                            <div class="c-pad-controller mpd-pad-grid" id="modal-pads-container">
                                </div>
                        </div>

                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modalElement = document.getElementById(this.modalId);
    }
    
    // --- RENDU ET LOGIQUE D'INITIALISATION DU DOM INTERNE ---
    
    initializeModalContent() {
        if (this.isInitialized) return;

        // Références DOM internes à la modale
        const knobsContainer = document.getElementById('modal-knobs-container');
        const padsContainer = document.getElementById('modal-pads-container');

        // --- 1. Génération des Knobs ---
        const knobLabels = [
            "Vol Maître", "EQ Basses", "Vélocité", "EQ Tone", "Clé/Tonalité", "EQ Aigus"
        ];
        
        knobLabels.forEach((label, i) => {
            const knobHtml = `
                <div class="c-knob-group">
                    <label>${label}</label>
                    <div class="c-knob ${i === 0 ? 'c-knob--large' : ''}" id="knob-${i}"></div>
                    <span class="c-knob-value" id="val-${i}">${label.includes('Vol') ? '1.00' : '0'}</span>
                </div>
            `;
            knobsContainer.insertAdjacentHTML('beforeend', knobHtml);
        });


        // --- 2. Génération des Pads Virtuels (4x4) ---
        for (let row = 3; row >= 0; row--) {
            for (let col = 0; col < 4; col++) {
                
                // Calcul de l'ID MIDI réel (0 à 15)
                const i = (row * 4) + col; 

                const pad = document.createElement('div');
                pad.className = 'c-midi-pad';
                pad.id = `midi-pad-${i}`;
                
                // On affiche le nom mappé (ex: KICK)
                pad.textContent = `${this.padMapping[i].split(' ')[0]}`;
                
                // ⬅️ CORRECTION LOGIQUE D'ÉVÉNEMENT : Simuler un événement pad pressé
                pad.addEventListener('click', () => {
                     // Note : On utilise un événement personnalisé car l'ancien sendOsc n'existe plus.
                     // On envoie une valeur brute de Note On (i) et Vélocité (127) pour simuler la MPD218
                     this.controllerModule.simulatePadPress(i, 127);
                });
                
                padsContainer.appendChild(pad);
            }
        }

        this.isInitialized = true;
    }

    // --- LOGIQUE D'AFFICHAGE MODAL ---

    showModal() {
        if (!this.isInitialized) {
            this.initializeModalContent();
        }
        
        // S'assurer que les valeurs des knobs sont mises à jour avant d'ouvrir
        // Note: Cette fonction dépend de l'existence de updateAllKnobViews dans ToneController.
        if (this.controllerModule.updateAllKnobViews) {
            this.controllerModule.updateAllKnobViews();
        }
        
        this.modalElement.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    hideModal() {
        this.modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Globaliser pour le JS dans l'HTML
window.MidiModal = MidiModal;

// Écouteur d'échappement (ESCAPE)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.midiModal) {
        window.midiModal.hideModal();
    }
});