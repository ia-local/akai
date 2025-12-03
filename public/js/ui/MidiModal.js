/**
 * UI COMPONENT: MIDI MODAL (V2.0)
 * Représentation graphique flottante du MPD218.
 * Permet de visualiser les inputs MIDI et de simuler des actions à la souris.
 */

export class MidiModal {
    constructor(studio) {
        this.studio = studio; // Accès au Core (EventBus, State)
        this.modalId = 'midi-controller-modal';
        this.isInitialized = false;
        
        // Initialisation
        this.setupModalStructure();
        this.initListeners();
    }

    // --- 1. GÉNÉRATION DOM ---
    setupModalStructure() {
        if (document.getElementById(this.modalId)) return;

        const modalHtml = `
            <div id="${this.modalId}" class="c-modal-overlay" style="display: none;">
                <div class="c-modal-box" style="width: 750px; background: #1a1a1a; border: 1px solid #333;">
                    
                    <header class="c-modal-header">
                        <h3 class="c-modal-title">Contrôleur MPD218 (Virtuel)</h3>
                        <button id="close-midi-modal" class="c-modal-close">&times;</button>
                    </header>

                    <div class="c-modal-body flex p-6 gap-6 bg-[#111]">
                        
                        <div class="w-1/3 flex flex-col justify-between">
                            <div class="text-xs text-gray-500 font-bold mb-4 border-b border-gray-700 pb-1">CONTROL BANK</div>
                            <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                                ${this.generateKnobHTML(0)} ${this.generateKnobHTML(1)}
                                ${this.generateKnobHTML(2)} ${this.generateKnobHTML(3)}
                                ${this.generateKnobHTML(4)} ${this.generateKnobHTML(5)}
                            </div>
                        </div>

                        <div class="w-2/3">
                            <div class="text-xs text-gray-500 font-bold mb-4 border-b border-gray-700 pb-1 text-right">PAD BANK A</div>
                            <div class="grid grid-cols-4 gap-3">
                                ${this.generatePadsHTML()}
                            </div>
                        </div>

                    </div>
                    
                    <div class="c-modal-footer bg-[#1a1a1a] text-[10px] text-gray-500 flex justify-between">
                        <span>STATUS: <span id="modal-midi-status" class="text-green-500">ONLINE</span></span>
                        <span>CHANNEL: 1</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Events Fermeture
        document.getElementById('close-midi-modal').addEventListener('click', () => this.hide());
        document.getElementById(this.modalId).addEventListener('click', (e) => {
            if (e.target.id === this.modalId) this.hide();
        });
        
        // Interaction Souris (Simulation)
        this.setupInteractions();
    }

    generateKnobHTML(cc) {
        // Utilise les classes CSS de mpc.css
        return `
            <div class="flex flex-col items-center">
                <div class="knob-visual relative w-12 h-12 rounded-full bg-black border border-gray-600 shadow-lg" id="modal-knob-${cc}">
                    <div class="knob-indicator absolute top-1 left-1/2 w-1 h-5 bg-white rounded-full origin-bottom transition-transform" style="transform: translateX(-50%) rotate(135deg);"></div>
                </div>
                <div class="flex justify-between w-full mt-2 px-1">
                    <span class="text-[9px] text-gray-500">CC ${cc}</span>
                    <span class="text-[9px] text-green-400 font-mono" id="modal-val-${cc}">0</span>
                </div>
            </div>
        `;
    }

    generatePadsHTML() {
        let html = '';
        // Ordre visuel (Haut-Gauche vers Bas-Droite)
        // MPD218 Bank A : 48..51 (Ligne 4), 44..47 (Ligne 3), 40..43 (Ligne 2), 36..39 (Ligne 1)
        const padNotes = [
            48, 49, 50, 51,
            44, 45, 46, 47, 
            40, 41, 42, 43, 
            36, 37, 38, 39
        ];

        padNotes.forEach((note, index) => {
            // Calcul du numéro de pad physique (1-16)
            // L'index 0 est le pad 13 (Haut Gauche)
            const padNum = 16 - index; // Simplification pour l'affichage
            
            html += `
                <div class="pad-visual aspect-square bg-[#222] border-2 border-[#333] rounded flex items-center justify-center cursor-pointer transition-all active:scale-95" 
                     id="modal-pad-${note}" 
                     data-note="${note}">
                    <span class="text-xs text-gray-600 font-bold pointer-events-none">P${padNum}</span>
                </div>
            `;
        });
        return html;
    }

    // --- 2. INTERACTION UI -> SYSTÈME ---
    setupInteractions() {
        // Click Pad -> Envoi Note MIDI simulée
        const pads = document.querySelectorAll('.pad-visual');
        pads.forEach(pad => {
            pad.addEventListener('mousedown', (e) => {
                const note = parseInt(e.target.dataset.note);
                // Émission vers le BUS (Le MidiSystem l'écoutera peut-être, ou directement les autres systèmes)
                this.studio.events.emit('midi:pad', { midi_note_raw: note, velocity: 127 });
                
                // Feedback visuel immédiat
                pad.classList.add('active');
                pad.style.backgroundColor = '#500';
                pad.style.borderColor = '#f00';
            });
            
            pad.addEventListener('mouseup', (e) => {
                const note = parseInt(e.target.dataset.note);
                // Note OFF (optionnel selon logique)
                
                // Reset visuel
                e.target.classList.remove('active');
                e.target.style.backgroundColor = '';
                e.target.style.borderColor = '';
            });
        });
    }

    // --- 3. ÉCOUTE SYSTÈME -> UI ---
    initListeners() {
        // A. Mise à jour des Knobs (CC)
        this.studio.events.on('midi_cc', (data) => {
            if (!this.isVisible()) return;

            const knob = document.getElementById(`modal-knob-${data.cc}`);
            const valDisplay = document.getElementById(`modal-val-${data.cc}`);

            if (knob && valDisplay) {
                // Map 0-127 -> 135deg à 405deg (270deg range)
                const angle = 135 + (data.value / 127) * 270;
                knob.querySelector('.knob-indicator').style.transform = `translateX(-50%) rotate(${angle}deg)`;
                valDisplay.textContent = data.value;
            }
        });

        // B. Mise à jour des Pads (Note On)
        this.studio.events.on('midi_pad', (data) => {
            // On écoute 'midi:pad' (interne) ou '/pad/trigger' (socket) selon votre nomenclature EventBus
            if (!this.isVisible()) return;

            // data.midi_note_raw contient la note (ex: 36)
            const padId = `modal-pad-${data.midi_note_raw}`;
            const pad = document.getElementById(padId);

            if (pad) {
                // Animation Flash
                pad.style.backgroundColor = '#7f1d1d'; // Rouge AKAI
                pad.style.borderColor = '#ff0000';
                pad.style.boxShadow = '0 0 15px rgba(255,0,0,0.5)';
                
                setTimeout(() => {
                    pad.style.backgroundColor = '';
                    pad.style.borderColor = '';
                    pad.style.boxShadow = '';
                }, 150);
            }
        });
    }

    // --- 4. GESTION VISIBILITÉ ---
    show() {
        const el = document.getElementById(this.modalId);
        if (el) {
            el.style.display = 'flex';
            setTimeout(() => el.classList.add('is-visible'), 10); // Fade in
        }
    }

    hide() {
        const el = document.getElementById(this.modalId);
        if (el) {
            el.classList.remove('is-visible');
            setTimeout(() => el.style.display = 'none', 300); // Wait transition
        }
    }

    isVisible() {
        const el = document.getElementById(this.modalId);
        return el && el.style.display !== 'none';
    }
}