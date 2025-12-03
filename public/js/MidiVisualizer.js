export class MidiVisualizer {
    constructor(containerId, socket) {
        this.container = document.getElementById(containerId);
        this.socket = socket;
        this.state = {};
        
        if (!this.container) {
            console.error(`MidiVisualizer: Conteneur #${containerId} introuvable.`);
            return;
        }

        // 1. Générer le HTML du contrôleur
        this.renderInterface();

        // 2. Initialiser les écouteurs
        this.initListeners();
        
        console.log("🎛️ MidiVisualizer Initialisé");
    }

    renderInterface() {
        this.container.innerHTML = `
            <div class="flex h-full gap-2">
                <div class="w-1/3 flex flex-col justify-between py-2">
                    <div class="grid grid-cols-2 gap-2">
                        ${this.generateKnobHTML(0)} ${this.generateKnobHTML(1)}
                        ${this.generateKnobHTML(2)} ${this.generateKnobHTML(3)}
                        ${this.generateKnobHTML(4)} ${this.generateKnobHTML(5)}
                    </div>
                    <div class="mt-2 p-2 bg-[#222] rounded text-[10px] text-gray-500 text-center">
                        BANKS: <span class="text-green-500 font-bold">A</span> B C
                    </div>
                </div>

                <div class="w-2/3 grid grid-cols-4 gap-2 p-2 bg-[#222] rounded">
                    ${this.generatePadsHTML()}
                </div>
            </div>
        `;
    }

    generateKnobHTML(id) {
        return `
            <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-black border border-gray-600 relative knob-visual" id="viz-knob-${id}">
                    <div class="w-0.5 h-1/2 bg-white absolute top-0 left-1/2 origin-bottom transition-transform" style="transform: rotate(135deg);"></div>
                </div>
                <span class="text-[8px] text-gray-400 mt-1">K${id+1}</span>
            </div>
        `;
    }

    generatePadsHTML() {
        let html = '';
        // Ordre MPC standard (4x4, Pad 1 en bas gauche)
        const order = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
        
        order.forEach(i => {
            // Calcul note MIDI (Bank A = 36..51 généralement, ou 0..15 ici)
            const note = i; // Adaptez selon votre mapping serveur
            html += `
                <div class="bg-[#333] rounded border border-gray-600 flex items-center justify-center text-[10px] text-gray-500 transition-colors pad-visual" id="viz-pad-${note}" data-note="${note}">
                    P${i+1}
                </div>
            `;
        });
        return html;
    }

    initListeners() {
        // État de connexion
        this.socket.on('connect', () => {
            const status = document.getElementById('socket-status');
            if(status) { status.textContent = "ONLINE"; status.className = "text-green-500"; }
        });

        // Feedback Knobs
        this.socket.on('midi_cc', (data) => {
            const knob = this.container.querySelector(`#viz-knob-${data.cc} div`);
            if (knob) {
                // Map 0-127 -> 135deg to 405deg (270deg range)
                const angle = 135 + (data.value / 127) * 270;
                knob.style.transform = `rotate(${angle}deg)`;
            }
        });

        // Feedback Pads
        this.socket.on('/pad/trigger', (data) => {
            // Note: Assurez-vous que data.midi_note_raw correspond à l'ID généré (0-15 ou 36-51)
            // Si votre serveur envoie 48 pour Pad 1 Bank A, il faut ajuster le mapping ici.
            // Pour l'exemple, on suppose un mapping direct 0-15 pour la visu simple.
            
            // On essaie de trouver le pad par mapping direct ou modulo 16
            const padIndex = data.midi_note_raw % 16; 
            const pad = this.container.querySelector(`#viz-pad-${padIndex}`);
            
            if (pad) {
                pad.classList.add('bg-red-500', 'text-white', 'border-red-300');
                setTimeout(() => {
                    pad.classList.remove('bg-red-500', 'text-white', 'border-red-300');
                }, 150);
            }
        });
    }
}