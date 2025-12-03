export class MpcCore {
    constructor(socket) {
        this.socket = socket;
        this.state = {};
        this.padData = {}; // Stockera les banques A, B, C
        this.currentBank = 'A'; // Banque par défaut

        // Configuration UI : Récupération des éléments du DOM
        this.elements = {
            padsContainer: document.getElementById('active-pad-grid-visuel'),
            knobs: document.querySelectorAll('.knob-visual')
        };

        // MAPPING : Relie l'ID du Knob physique (CC 0-5) à la variable du State (Serveur)
        this.knobMapping = {
            0: 'cursor_x',
            1: 'cursor_y',
            2: 'cursor_z',
            3: 'av_chroma_angle',
            4: 'av_saturation',
            5: 'av_param_1' 
        };
        
        // Ordre de rendu MPC classique (Pad 1 en bas à gauche)
        // Ligne bas (1-4), Ligne 2 (5-8), etc. -> Indices tableau : 12,13,14,15...
        this.MPC_RENDER_ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];

        this.initListeners();
    }

    initListeners() {
        console.log("[MpcCore] Initialisation des écouteurs...");

        // 1. Écoute de l'état global initial (Knobs, Transport)
        this.socket.on('init_state', (state) => {
            console.log("[MpcCore] State reçu:", state);
            this.state = state;
            this.updateAllKnobs(); // C'est ici que ça plantait avant !
        });

        // 2. Écoute des données des Pads (Banques A, B, C)
        this.socket.on('all_pad_data', (data) => {
            console.log("[MpcCore] Données Pads reçues:", data);
            this.padData = data;
            this.renderPadGrid(); // Affiche la banque courante (A)
        });

        // 3. Trigger Pad (Flash visuel lors de la frappe)
        this.socket.on('/pad/trigger', (data) => {
            this.handlePadVisual(data.midi_note_raw);
        });

        // 4. Mouvement des Knobs en temps réel
        this.socket.on('midi_cc', (data) => {
            this.updateKnobVisual(data.cc, data.value);
            // Mise à jour locale du state
            const key = this.knobMapping[data.cc];
            if (key) this.state[key] = data.value;
        });

        // 5. Gestion des boutons de banque (si présents dans le HTML)
        const bankButtons = document.querySelectorAll('.bank-button');
        bankButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchBank(e.target.dataset.bank);
            });
        });

        // Demande les données au serveur si pas encore reçues
        this.socket.emit('request_all_pad_data');
    }

    /**
     * Change la banque active et rafraîchit la grille
     */
    switchBank(bankLetter) {
        if(['A', 'B', 'C'].includes(bankLetter)) {
            this.currentBank = bankLetter;
            console.log(`[MpcCore] Changement de banque : ${bankLetter}`);
            this.renderPadGrid();
            
            // Gestion style boutons (Optionnel)
            document.querySelectorAll('.bank-button').forEach(b => {
                b.classList.toggle('bg-midi-blue', b.dataset.bank === bankLetter);
                b.classList.toggle('bg-gray-700', b.dataset.bank !== bankLetter);
            });
        }
    }

    /**
     * CORRECTION : La méthode manquante
     * Met à jour tous les potards au chargement
     */
    updateAllKnobs() {
        if (!this.state) return;

        Object.keys(this.knobMapping).forEach(ccId => {
            const stateKey = this.knobMapping[ccId];
            const value = this.state[stateKey];
            
            if (value !== undefined) {
                this.updateKnobVisual(ccId, value);
            }
        });
    }

    updateKnobVisual(ccId, value) {
        const line = document.getElementById(`knob-line-${ccId}`);
        const valDisplay = document.getElementById(`val-${ccId}`);
        
        if (line) {
            let rot = 0;
            // Si c'est un angle (>100) ou explicitement un angle
            if (value > 100 || this.knobMapping[ccId] === 'av_chroma_angle') {
                rot = value; 
            } else {
                // Conversion 0-100% vers Angle (ex: 135deg à 405deg)
                rot = (value / 100) * 270 + 135; 
            }
            line.style.transform = `rotate(${rot}deg)`;
        }
        
        if (valDisplay) {
            valDisplay.textContent = typeof value === 'number' ? value.toFixed(1) : value;
        }
    }

    handlePadVisual(note) {
        // Note brute MIDI -> ID HTML
        const padId = `pad-visuel-${note}`;
        const el = document.getElementById(padId);
        
        if (el) {
            el.classList.add('active'); // Active la classe CSS (rouge/bleu)
            // Retire la classe après 150ms pour l'effet flash
            setTimeout(() => el.classList.remove('active'), 150);
        }
    }

    /**
     * Génère le HTML pour les 16 pads de la banque active
     */
    renderPadGrid() {
        if (!this.elements.padsContainer) return;

        const bankKey = `BANK_${this.currentBank}`;
        const pads = this.padData[bankKey];

        if (!pads || !Array.isArray(pads)) {
            this.elements.padsContainer.innerHTML = '<div class="text-white">Chargement...</div>';
            return;
        }

        // On utilise MPC_RENDER_ORDER pour placer le pad 1 en bas à gauche
        const html = this.MPC_RENDER_ORDER.map(index => {
            const pad = pads[index];
            // Calcul de la note MIDI réelle selon la banque (A=0, B=16, C=32)
            const bankOffset = (this.currentBank === 'A' ? 0 : this.currentBank === 'B' ? 16 : 32);
            const midiNote = bankOffset + index;

            return `
            <div id="pad-visuel-${midiNote}" class="pad-item-display border border-gray-600 bg-gray-800 rounded p-2 flex flex-col items-center justify-center transition-colors duration-75">
                <span class="text-xs font-bold text-gray-200">${pad.source ? pad.source.toUpperCase() : 'EMPTY'}</span>
                <span class="text-[10px] text-gray-500 mt-1">Note ${midiNote}</span>
                <span class="text-[9px] text-midi-blue">${pad.type || ''}</span>
            </div>
            `;
        }).join('');

        this.elements.padsContainer.innerHTML = html;
    }
}