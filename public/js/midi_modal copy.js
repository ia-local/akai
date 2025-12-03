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
                        
                        <!-- A. KNOBS (6 Potentiomètres) -->
                        <div class="mpd-knobs-section">
                            <h4 class="mpd-section-title">Paramètres de Mix & Tonalité</h4>
                            <div class="c-knob-row" id="modal-knobs-container">
                                <!-- Les 6 Knobs seront injectés ici par JS -->
                            </div>
                        </div>

                        <!-- B. PADS (16 Pads) -->
                        <div class="mpd-pads-section">
                            <div class="c-pad-controller mpd-pad-grid" id="modal-pads-container">
                                <!-- Les 16 Pads seront injectés ici par JS -->
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

        // --- 1. Génération des Knobs (en utilisant la même structure d'ID que le dashboard) ---
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
                
                // Calcul de l'ID MIDI réel (ex: Row 3, Col 0 => (3*4)+0 = 12)
                // Au dernier tour (Row 0, Col 0), on aura bien l'ID 0.
                const i = (row * 4) + col; 

                const pad = document.createElement('div');
                pad.className = 'c-midi-pad';
                pad.id = `midi-pad-${i}`;
                
                // On affiche le nom mappé (ex: KICK)
                pad.textContent = `${this.padMapping[i].split(' ')[0]}`;
                
                // Écouteur de clic pour test manuel (simulation du press)
                pad.addEventListener('click', () => {
                     // Note : on garde l'ID 'i' qui correspond au bon signal MIDI
                     this.controllerModule.sendOsc('/pad/' + i + '/press', 1.0);
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
        this.controllerModule.updateAllKnobViews();
        
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