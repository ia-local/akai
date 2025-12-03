// serveur.js : Routage MIDI MPD218 vers Logique/Web (INTÉGRAL FINAL)
// --------------------------------------------------------------------------------
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const midi = require('midi'); 

// --- Configuration Serveur Web ---
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = 3145;
app.use(express.static('public'));


// --- GLOBAL STATE ---
const GLOBAL_STATE = {
    master_amp: 1.0, 
    eq_bass: 100, 
    note_velocity: 1.0, 
    eq_band: 80,
    key_mode_index: 0, // ⬅️ Variable du Cercle Chromatique (0 à 11)
    eq_treble: 10, 
};

// --- MAPPING CC BRUT vers RÔLE (Base de la Stabilité) ---
const CC_MAPPING_ROLES = {
    // ⬅️ Knob Bank A (physique) envoie CC -> role,content: Volume Maître ...
    0:{ variable: 'master_amp', fn: (norm_v) => (1.0 - norm_v) * 1.5 },  
    1: { variable: 'eq_bass',    fn: (norm_v) => 40 + norm_v * 80 },         
    2: { variable: 'note_velocity', fn: (norm_v) => 0.5 + norm_v * 0.7 },   
    3: { variable: 'eq_band',   fn: (norm_v) => 40 + norm_v * 80 },         
    4: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    
    // ⬅️ Knob Bank B (physique) envoie CC -> role,content:EQ Basses ...
    5:{ variable: 'eq_treble',  fn: (norm_v) => 10 + norm_v * 40 },   
    6: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    7: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    8: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    9: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    10: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    11: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    
    // ⬅️ Knob Bank C (physique) envoie CC -> role,content:Vélocité ...
    12: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    13: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    14: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    15: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    16: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    17: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
};

const MPD218_NAME = 'MPD218'; 
const midiInput = new midi.Input(); 


// --- STRUCTURE DES BANQUES (COMPLÈTE) ---

const BANK_A = [
    { type: 'synth', source: 'pulse', note: 'c2', options: { release: 0.08, pulse_width: 0.1, amp: 2.0 } }, 
    { type: 'synth', source: 'noise', note: 1, options: { attack: 0.0001, release: 0.02, pan: 0.2, amp: 1.6 } },
    { type: 'synth', source: 'square', note: 'f7', options: { release: 0.06, pulse_width: 0.2, amp: 1.5 } },
    { type: 'synth', source: 'gnoise', note: 1, options: { attack: 0.1, sustain: 1.0, release: 0.5, cutoff: 80, amp: 0.4 } },
    { type: 'synth', source: 'pluck', note: 'e6', options: { release: 0.15, res: 0.9, amp: 1.7 } },
    { type: 'synth', source: 'noise', note: 1, options: { attack: 0.001, release: 0.03, amp: 1.5 } },
    { type: 'synth', source: 'fm', note: 'c7', options: { release: 0.1, divisor: 1.5, detune: 0.2, amp: 1.5 } },
    { type: 'synth', source: 'cnoise', note: 1, options: { attack: 0.001, release: 0.04, pan: -0.2, amp: 1.5 } },
    { type: 'synth', source: 'saw', note: 'c4', options: { attack: 0.01, release: 0.15, cutoff: 130, amp: 1.5 } },
    { type: 'synth', source: 'beep', note: 'a5', options: { release: 0.04, amp: 1.5 } },
    { type: 'synth', source: 'beep', note: 'c8', options: { release: 0.02, sustain: 0, amp: 2.0 } },
    { type: 'synth', source: 'prophet', note: 'd4', options: { release: 0.1, detune: 0.05, amp: 1.5 } },
    { type: 'synth', source: 'square', note: 'f5', options: { release: 0.09, pulse_width: 0.3, amp: 1.5 } },
    { type: 'synth', source: 'dsaw', note: 'chord(c5, major7)', options: { release: 0.3, detune: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'hollow', note: 'c3', options: { release: 0.25, detune: 5, res: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'fm', note: 'c4', options: { sustain: 1.5, release: 0.5, attack: 0.1, divisor: 2.0, amp: 0.9 } },
];
const BANK_B = [
    { type: 'synth', source: 'fm', note: 'c3', options: { divisor: 0.5, release: 0.2, amp: 1.5 } },
    { type: 'synth', source: 'dsaw', note: 'chord(e4, minor)', options: { release: 0.1, detune: 0.8, amp: 1.5 } },
    { type: 'synth', source: 'saw', note: 'c1', options: { attack: 1.0, release: 0.05, cutoff: 120, amp: 0.5 } },
    { type: 'synth', source: 'prophet', note: 'g5', options: { release: 0.1, amp: 1.5 } },
    { type: 'synth', source: 'square', note: 'a6', options: { release: 0.05, pulse_width: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'hollow', note: 'c6', options: { release: 0.1, detune: 10, res: 0.8, amp: 1.5 } },
    { type: 'synth', source: 'chipbass', note: 'e3', options: { release: 0.3, wave: 3, amp: 0.8 } },
    { type: 'synth', source: 'pluck', note: 'c5', options: { release: 0.08, res: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'tri', note: 'c4', options: { release: 0.1, cutoff: 60, amp: 1.5 } },
    { type: 'synth', source: 'bnoise', note: 1, options: { attack: 0.001, release: 0.05, amp: 1.5 } },
    { type: 'synth', source: 'sub', note: 'c1', options: { release: 0.5, amp: 2.0 } },
    { type: 'synth', source: 'sine', note: 'd5', options: { release: 0.1, amp: 1.5 } },
    { type: 'synth', source: 'pulse', note: 'a3', options: { release: 0.08, pulse_width: 0.8, amp: 1.5 } },
    { type: 'synth', source: 'white_noise', note: 1, options: { attack: 0.0, release: 0.5, cutoff: 130, amp: 1.2 } },
    { type: 'synth', source: 'pina', note: 'g6', options: { release: 0.4, amp: 1.8 } },
    { type: 'synth', source: 'piano', note: 'chord(c4, m7)', options: { release: 0.8, amp: 1.0 } },
];
const BANK_C = [
    { type: 'synth', source: 'prophet', note: 'c3', options: { sustain: 2.0, release: 1.0, cutoff: 60, amp: 0.5 } },
    { type: 'synth', source: 'supersaw', note: 'f4', options: { attack: 0.01, release: 0.1, amp: 1.5 } },
    { type: 'synth', source: 'tb303', note: 'g5', options: { release: 0.1, cutoff: 100, amp: 1.5 } },
    { type: 'synth', source: 'beep', note: 'a7', options: { release: 0.3, detune: 0.1, amp: 1.5 } },
    { type: 'synth', source: 'tri', note: 'c5', options: { release: 0.1, amp: 1.3 } },
    { type: 'synth', source: 'cnoise', note: 1, options: { attack: 0.1, release: 0.5, cutoff: 100, amp: 1.5 } },
    { type: 'synth', source: 'organ', note: 'e4', options: { release: 0.5, sustain: 0.5, amp: 1.0 } },
    { type: 'synth', source: 'saw', note: 'c5', options: { release: 0.1, amp: 1.5 } },
    { type: 'synth', source: 'bpf', note: 40, options: { release: 0.5, res: 0.9, amp: 1.5 } }, 
    { type: 'synth', source: 'sine', note: 'c6', options: { release: 0.05, attack: 0.001, amp: 1.5 } },
    { type: 'synth', source: 'fm', note: 'c5', options: { release: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'fm', note: 'c3', options: { release: 0.5, amp: 1.5 } },
    { type: 'synth', source: 'cnoise', note: 1, options: { release: 0.01, amp: 1.5 } },
    { type: 'synth', source: 'white_noise', note: 1, options: { release: 0.2, amp: 1.2 } },
    { type: 'synth', source: 'dull_bell', note: 'c4', options: { release: 0.8, amp: 1.5 } },
    { type: 'synth', source: 'growl', note: 'g3', options: { release: 0.2, sustain: 0.1, amp: 1.5 } },
];
const ALL_BANKS = [BANK_A, BANK_B, BANK_C];


// --- UTILITY : ENVOI AU CLIENT ---
function sendToClient(address, data) {
    io.emit(address, data); 
}


// --- GESTIONNAIRES MIDI ---

function handlePadPress(note, velocity) {
    if (velocity === 0) return;
    const bankIndex = Math.floor(note / 16);
    const padIndex = note % 16;
    const norm_v = velocity / 127.0;

    if (bankIndex >= ALL_BANKS.length || padIndex >= ALL_BANKS[bankIndex].length) return;
    
    const padConfig = ALL_BANKS[bankIndex][padIndex];
    const fullData = { 
        ...padConfig, 
        global_amp: GLOBAL_STATE.master_amp,
        velocity: norm_v,
        midi_note_raw: note,
    };

    sendToClient('/pad/trigger', fullData); 
    console.log(`[PAD ${note} - Bank ${bankIndex}] Config sent: ${padConfig.source}`);
}

function handleControlChange(controlId, controlValue) {
    const norm_v = controlValue / 127.0;
    
    // ⬅️ CORRECTION : Utilisation directe du mapping par ID CC
    const mapping = CC_MAPPING_ROLES[controlId];

    if (mapping) {
        // Calcul de la nouvelle valeur en utilisant la fonction du mapping
        const newValue = mapping.fn(norm_v); 
        const updatedVariable = mapping.variable;
        
        GLOBAL_STATE[updatedVariable] = newValue;
        sendToClient(`/controls/${updatedVariable}`, newValue);
        console.log(`[KNOB ${controlId}] Updated ${updatedVariable}: ${newValue.toFixed(2)}`);
    } else {
        console.warn(`ID CC ${controlId} non mappé.`);
    }
}


// --- DÉMARRAGE DU SERVEUR MIDI/HID ---

function setupMidiListeners() {
    let portIndex = -1;
    for (let i = 0; i < midiInput.getPortCount(); i++) {
        if (midiInput.getPortName(i).includes(MPD218_NAME)) {
            portIndex = i;
            console.log(`MIDI: MPD218 trouvé sur le port ${i}.`);
            break;
        }
    }

    if (portIndex === -1) {
        console.error(`Erreur: Périphérique ${MPD218_NAME} non trouvé.`);
        return false;
    }

    midiInput.openPort(portIndex);
    midiInput.ignoreTypes(false, false, false); 

    midiInput.on('message', (deltaTime, message) => {
        const status = message[0];
        const data1 = message[1]; // CC ID
        const data2 = message[2]; // CC Value
        
        // 144-159 (Note On)
        if (status >= 144 && status <= 159) {
            handlePadPress(data1, data2);
        }
        // 176-191 (Control Change - Tous canaux)
        else if ((status & 0xF0) === 0xB0) { 
            handleControlChange(data1, data2); 
        }
    });

    return true;
}


// --- GESTION DES CONNEXIONS SOCKET.IO ---

io.on('connection', (socket) => {
    console.log(`Client connecté : ${socket.id}`);
    
    io.emit('midi_status', { connected: true }); 

    socket.on('transport_out', (data) => {
        console.log(`TRANSPORT SIGNAL RECEIVED from client ${socket.id}: ${data.address}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client déconnecté : ${socket.id}`);
    });
});


// --- DÉMARRAGE DU SERVEUR PRINCIPAL ---

function start() {
    server.listen(PORT, () => {
        console.log(`Serveur Web démarré sur http://localhost:${PORT}`);
    });

    console.log("Démarrage du Routage MIDI...");
    if (setupMidiListeners()) {
        console.log("Routage MIDI démarré. Prêt pour la MPD218.");
    }
}

start();