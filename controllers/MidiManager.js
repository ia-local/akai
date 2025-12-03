// controllers/MidiManager.js
const midi = require('midi');

// --- DÉFINITION DES BANQUES DE PADS (Inchangé) ---
const BANK_DEFINITIONS = {
    BANK_A: [
        { type: 'synth', source: 'pulse', note: 'c2', name: 'PULSE C2' }, 
        { type: 'synth', source: 'noise', note: 1, name: 'NOISE HIT' },
        { type: 'synth', source: 'square', note: 'f7', name: 'SQUARE F7' },
        { type: 'synth', source: 'gnoise', note: 1, name: 'G-NOISE' },
        { type: 'synth', source: 'pluck', note: 'e6', name: 'PLUCK E6' },
        { type: 'synth', source: 'noise', note: 1, name: 'NOISE 2' },
        { type: 'synth', source: 'fm', note: 'c7', name: 'FM BELL' },
        { type: 'synth', source: 'cnoise', note: 1, name: 'C-NOISE' },
        { type: 'synth', source: 'saw', note: 'c4', name: 'SAW C4' },
        { type: 'synth', source: 'beep', note: 'a5', name: 'BEEP A5' },
        { type: 'synth', source: 'beep', note: 'c8', name: 'HI BEEP' },
        { type: 'synth', source: 'prophet', note: 'd4', name: 'PROPHET' },
        { type: 'synth', source: 'square', note: 'f5', name: 'SQUARE F5' },
        { type: 'synth', source: 'dsaw', note: 'chord', name: 'DSAW CHORD' },
        { type: 'synth', source: 'hollow', note: 'c3', name: 'HOLLOW' },
        { type: 'synth', source: 'fm', note: 'c4', name: 'FM BASS' },
    ],
    BANK_B: [ ...Array(16).fill(null).map((_, i) => ({ type: 'empty', source: 'empty', note: 0, name: `B-${i+1}` })) ],
    BANK_C: [ ...Array(16).fill(null).map((_, i) => ({ type: 'empty', source: 'empty', note: 0, name: `C-${i+1}` })) ]
};

// --- 🎛️ CONFIGURATION DES KNOBS (Ton Paramétrage "Studio") ---
const CC_MAPPINGS = {
    // KNOB 1 (CC 0) : Curseur X (Mouvement infini gauche/droite)
    0: { variable: 'cursor_x', relative: true, step: 2, min: 0, max: 100, wrap: true },

    // KNOB 2 (CC 1) : Curseur Y (Mouvement infini haut/bas)
    1: { variable: 'cursor_y', relative: true, step: 2, min: 0, max: 100, wrap: true },

    // KNOB 3 (CC 2) : Curseur Z (Zoom/Profondeur) - Pas de boucle (Bloque à min/max)
    2: { variable: 'cursor_z', relative: true, step: 0.05, min: 0.5, max: 3.0, wrap: false },

    // KNOB 4 (CC 3) : Chroma / Couleur (Le fameux Cercle 360°)
    3: { variable: 'av_chroma_angle', relative: true, step: 5, min: 0, max: 360, wrap: true },

    // KNOB 5 (CC 4) : Caméra Rotation (360°)
    4: { variable: 'av_camera_rot', relative: true, step: 10, min: 0, max: 360, wrap: true },

    // KNOB 6 (CC 5) : Saturation (Absolu classique pour dosage précis)
    5: { variable: 'av_saturation', relative: false, fn: (v) => v / 127.0 },

    // --- BANK B KNOBS (CC 6+) ---
    // Equalizer : Basses
    6: { variable: 'eq_bass', relative: true, step: 1, min: -12, max: 12, wrap: false },
    // Equalizer : Aiguës
    7: { variable: 'eq_treble', relative: true, step: 1, min: -12, max: 12, wrap: false },
};

class MidiManager {
    constructor(io, globalState) {
        this.io = io;
        this.state = globalState;
        this.input = new midi.Input();
        this.deviceName = 'MPD218';
        this.banks = BANK_DEFINITIONS;
    }

    init() {
        const portCount = this.input.getPortCount();
        let portIndex = -1;
        for (let i = 0; i < portCount; i++) {
            if (this.input.getPortName(i).includes(this.deviceName)) {
                portIndex = i;
                break;
            }
        }

        if (portIndex === -1) {
            console.warn(`⚠️ [MIDI] ${this.deviceName} non trouvé.`);
        } else {
            this.input.openPort(portIndex);
            this.input.ignoreTypes(false, false, false);
            this.input.on('message', (deltaTime, message) => {
                const [status, data1, data2] = message;
                this.handleMidiMessage(status, data1, data2);
            });
            console.log(`✅ [MIDI] Connecté. Mode Relatif Activé.`);
        }
    }

    handleClientConnection(socket) {
        socket.emit('all_pad_data', this.banks);
        socket.on('request_all_pad_data', () => socket.emit('all_pad_data', this.banks));
    }

    handleMidiMessage(status, data1, data2) {
        if (status >= 144 && status <= 159) { 
            this.handlePadTrigger(data1, data2);
        } else if ((status & 0xF0) === 0xB0) { 
            this.handleControlChange(data1, data2);
        }
    }

    handlePadTrigger(note, velocity) {
        if (velocity === 0) return;
        this.io.emit('/pad/trigger', { midi_note_raw: note, velocity: velocity / 127.0 });
    }

    // --- LE CŒUR DU SYSTÈME (Ta logique restaurée) ---
    handleControlChange(cc, rawValue) {
        const config = CC_MAPPINGS[cc];
        if (!config) return; // Ignore les CC non mappés

        const varName = config.variable;
        let newValue = this.state[varName];

        if (config.relative) {
            // --- LOGIQUE RELATIVE (Gauche = -, Droite = +) ---
            // Le MPD en mode relatif envoie souvent :
            // > 64 (ex: 127) pour gauche/décrément
            // < 64 (ex: 1) pour droite/incrément
            
            let delta = 0;
            if (rawValue > 64) { 
                delta = -config.step; // Vers la gauche (-)
            } else if (rawValue > 0) { 
                delta = config.step;  // Vers la droite (+)
            }

            if (delta !== 0) {
                newValue += delta;

                // Gestion du "Wrap" (Boucle 360 -> 0)
                if (config.wrap) {
                    const range = config.max - config.min;
                    if (newValue > config.max) newValue = config.min;
                    if (newValue < config.min) newValue = config.max;
                } else {
                    // Blocage aux extrémités (Clamp)
                    newValue = Math.min(config.max, Math.max(config.min, newValue));
                }
            }
        } else {
            // --- LOGIQUE ABSOLUE (Standard 0-127) ---
            // Si une fonction de transformation existe (ex: pour saturation 0.0-1.0)
            if (config.fn) {
                newValue = config.fn(rawValue);
            } else {
                newValue = rawValue;
            }
        }

        // Mise à jour de l'état global et envoi au client
        if (newValue !== undefined && !isNaN(newValue)) {
            this.state[varName] = newValue;
            this.io.emit(`/controls/${varName}`, newValue);
            
            // Envoi CC brut/visuel pour l'interface
            this.io.emit('midi_cc', { cc: cc, value: newValue });
            
            // Debug console pour vérifier le comportement
            // console.log(`[CTRL] ${varName} -> ${newValue.toFixed(2)}`);
        }
    }
}

module.exports = MidiManager;