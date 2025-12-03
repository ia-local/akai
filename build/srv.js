// serveur.js : Routage MIDI MPD218 vers Logique/Web (INTÉGRAL FINAL AVEC LOGIQUE AV ET IA)
// --------------------------------------------------------------------------------
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const midi = require('midi'); 
const iaRouter = require('../public/iaRouter'); 

// --- Configuration Serveur Web ---
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = 3145;

// Middleware pour analyser le corps des requêtes POST en JSON
app.use(express.json()); 
app.use(express.static('public'));


// --- SIMULATION DES ACTIFS / DATA (Basé sur la structure de votre répertoire /data/) ---
const ASSETS_DATA_SIMULATION = {
    // Actifs Média (Images, Audio, Vidéo)
    images: [
        { id: 'img_glitch', name: 'Vague Glitch', type: 'image/jpeg', url: 'https://placehold.co/400x300/2a66e0/white?text=GLITCH', duration: 0, category: 'VISUEL', path: '/data/images/' },
        { id: 'img_chroma', name: 'Gradiant Chroma', type: 'image/png', url: 'https://placehold.co/400x300/d95e20/white?text=CHROMA', duration: 0, category: 'VISUEL', path: '/data/images/' },
        { id: 'img_scene', name: 'Scene.jpeg', type: 'image/jpeg', url: 'https://placehold.co/400x300/0d0d0d/808080?text=SCENE_01', duration: 0, category: 'VISUEL', path: '/data/images/scene.jpeg' },
    ],
    audio: [
        { id: 'aud_synth', name: 'Synth Pulse Loop', type: 'audio/mp3', duration: 8.0, category: 'AUDIO', path: '/data/audio/pulse.mp3' },
        { id: 'aud_noise', name: 'Kick Drum (C4)', type: 'audio/wav', duration: 0.5, category: 'AUDIO', path: '/data/audio/kick.wav' },
    ],
    video: [
        { id: 'vid_story', name: 'Storyboard_histoire_de_codex.mp4', type: 'video/mp4', duration: 35, category: 'VIDEO', path: '/data/video/storyboard_tablette_histoire_de_codex_ia_dessiner.mp4' },
    ],
    // Scripts d'Effets (Fx) - Basé sur votre structure Fx/plan_*
    scripts: [
        { id: 'fx_cam_zoom', name: 'Caméra Zoom', type: 'script/md', category: 'CAMERA', path: '/data/Fx/plan_camera/zoom.md' },
        { id: 'fx_cam_trans', name: 'Caméra Transition', type: 'script/md', category: 'CAMERA', path: '/data/Fx/plan_camera/transition.md' },
        
        { id: 'fx_eff_zoom', name: 'Effet Zoom', type: 'script/md', category: 'EFFECT', path: '/data/Fx/plan_effect/zoom.md' },
        { id: 'fx_style_glitch', name: 'Style Glitch', type: 'script/md', category: 'STYLE', path: '/data/Fx/plan_style/transition.md' },
    ],
};

// ⬅️ DÉCLARATION MIDI GLOBALE
const MPD218_NAME = 'MPD218'; 
const midiInput = new midi.Input(); 


// --- INTÉGRATION IA ---
app.use('/api/ia', iaRouter); 

// --- ROUTE DE GESTION DES ACTIFS (Simule la lecture du répertoire /data/) ---
app.get('/api/assets/list', (req, res) => {
    console.log("Requête API reçue : Liste des actifs (simulée de /data/).");
    // Renvoie toutes les données structurées
    res.json({ success: true, assets: ASSETS_DATA_SIMULATION });
});

// --- GLOBAL STATE (Rest du code du serveur... ) ---
const GLOBAL_STATE = {
    // ... (GLOBAL_STATE complet)
    cursor_x: 0, 
    cursor_y: 100, 
    cursor_z: 1.0, 
    
    // Paramètres Chroma/Audio
    av_chroma_angle: 0,     
    av_saturation: 0.5,     
    
    // ⬅️ NOUVEAUX PARAMÈTRES AV (Knobs 5, 6, 7) - RELATIF
    av_param_1: 0,          
    av_param_2: 0,          
    av_param_3: 0,          
    
    key_mode_index: 0,      
    eq_treble: 10, 
    
    // ⬅️ État du transport et du mode
    transport_state: 'STOPPED', 
    current_style: 'NONE'
};

// ... (Rest of CC_MAPPING_ROLES, PAD_MAPPING_AV, BANK_A, etc. inchangés)
const CC_MAPPING_ROLES = {
    0: { variable: 'cursor_x', relative: true, step: 2, max: 100, min: 0, wrap: true }, 
    1: { variable: 'cursor_y', relative: true, step: 2, max: 100, min: 0, wrap: true },  
    2: { variable: 'cursor_z', relative: true, step: 0.05, max: 1.2, min: 0.5, wrap: false },    
    3: { variable: 'av_chroma_angle', relative: true, step: 5, max: 360, min: 0, wrap: true }, 
    4: { variable: 'av_saturation', fn: (norm_v) => norm_v * 1.0 }, 
    5: { variable: 'av_param_1', relative: true, step: 10, max: 360, min: 0, wrap: true }, 
    6: { variable: 'av_param_2', relative: true, step: 1, max: 10, min: 0, wrap: true }, 
    7: { variable: 'av_param_3', relative: true, step: 2, max: 100, min: 0, wrap: false }, 
    // ... reste du mapping CC inchangé
    8: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    9: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    10: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    11: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    12: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    13: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    14: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    15: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    16: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
    17: { variable: 'key_mode_index', fn: (norm_v) => Math.floor(norm_v * 12) }, 
};
const PAD_MAPPING_AV = {
    63: { role: 'TRANSPORT_RECORD', style: 'CINETIC_PULSE' }, 
    64: { role: 'TRANSPORT_STOP', style: 'NONE' },            
    65: { role: 'STYLE_SELECT', style: 'DATABENDING_FX' },  
    66: { role: 'STYLE_SELECT', style: 'GLITCH_WAVE' }     
};
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
const ALL_BANKS = [BANK_A, BANK_B, BANK_C]; // Tableau d'arrays

// Création de l'objet de données de pads pour l'envoi au client (nécessaire pour le dashboard)
const ALL_PAD_DATA = {
    BANK_A: BANK_A,
    BANK_B: BANK_B,
    BANK_C: BANK_C,
};


// [Inclusion des fonctions MIDI, Socket.IO, applyIAUpdates ici]
/**
 * Applique les mises à jour de l'IA à l'état global et propage le changement aux clients.
 * @param {object} updates - L'objet JSON retourné par l'IA (ex: {av_chroma_angle: 200}).
 */
function applyIAUpdates(updates) {
    if (!updates || typeof updates !== 'object') return;

    let changesMade = false;
    for (const key in updates) {
        if (GLOBAL_STATE.hasOwnProperty(key)) {
            const newValue = parseFloat(updates[key]);
            if (!isNaN(newValue)) {
                GLOBAL_STATE[key] = newValue;
                sendToClient(`/controls/${key}`, newValue);
                console.log(`[IA Update] ${key} mis à jour vers: ${newValue.toFixed(2)}`);
                changesMade = true;
            }
        }
    }
    if (changesMade) {
        sendToClient('/av/ia_feedback', { message: "Paramètres mis à jour par l'IA.", changes: updates });
    }
}

app.set('applyIAUpdates', applyIAUpdates); 

function sendToClient(address, data) { io.emit(address, data); }
function handlePadPress(note, velocity) { 
    if (velocity === 0) return;
    const norm_v = velocity / 127.0;

    // 1. GESTION DES COMMANDES AV (Transport / Style)
    if (PAD_MAPPING_AV[note]) {
        const command = PAD_MAPPING_AV[note];
        // ... (Logique transport)
        return; 
    }

    // 2. GESTION DES PADS AUDIO/EFFET
    const bankIndex = Math.floor(note / 16);
    const padIndex = note % 16;
    
    // ... (Construction de fullData)
    const fullData = { 
        global_amp: GLOBAL_STATE.cursor_z, 
        velocity: norm_v,
        midi_note_raw: note,
        cursor_x: GLOBAL_STATE.cursor_x, 
        cursor_y: GLOBAL_STATE.cursor_y,
        chroma_angle: GLOBAL_STATE.av_chroma_angle, 
        chroma_saturation: GLOBAL_STATE.av_saturation,
        av_param_1: GLOBAL_STATE.av_param_1,
        av_param_2: GLOBAL_STATE.av_param_2,
        av_param_3: GLOBAL_STATE.av_param_3,
    };

    sendToClient('/pad/trigger', fullData); 
}
function handleControlChange(controlId, controlValue) {
    const mapping = CC_MAPPING_ROLES[controlId];

    if (mapping) {
        const updatedVariable = mapping.variable;

        // ⬅️ Logique pour les encodeurs RELATIFS
        if (mapping.relative) {
            let delta = 0;
            const step = mapping.step || 1; 
            const min = mapping.min || 0;
            const max = mapping.max || 1;

            if (controlValue > 64) { delta = -step; } 
            else if (controlValue > 0) { delta = step; }

            if (delta !== 0) {
                let newValue = GLOBAL_STATE[updatedVariable] + delta;
                
                if (mapping.wrap === true) {
                    // Logic for wrapping (0-100 or 0-360)
                    if (max === 360) {
                         newValue = (newValue % 360);
                         if (newValue < 0) { newValue += 360; }
                    } else {
                        const range = max - min;
                        newValue = (newValue - min);
                        if (newValue < 0) { newValue += range * (Math.floor(-newValue / range) + 1); }
                        newValue = (newValue % range) + min;
                    }
                } else {
                    // Limitage (Clip)
                    newValue = Math.min(max, Math.max(min, newValue));
                }

                GLOBAL_STATE[updatedVariable] = newValue;
                sendToClient(`/controls/${updatedVariable}`, GLOBAL_STATE[updatedVariable]);
            }
            return; 
        }

        // Logique pour les potentiomètres ABSOLUS
        const norm_v = controlValue / 127.0;
        const newValue = mapping.fn(norm_v); 
        GLOBAL_STATE[updatedVariable] = newValue;
        sendToClient(`/controls/${updatedVariable}`, newValue);
    } 
}
function setupMidiListeners() {
    let portIndex = -1;
    for (let i = 0; i < midiInput.getPortCount(); i++) {
        if (midiInput.getPortName(i).includes('MPD218')) { // Assurez-vous d'utiliser 'MPD218'
            portIndex = i;
            break;
        }
    }

    if (portIndex === -1) {
        console.error(`Erreur: Périphérique MPD218 non trouvé.`);
        return false;
    }

    midiInput.openPort(portIndex);
    midiInput.ignoreTypes(false, false, false); 

    midiInput.on('message', (deltaTime, message) => {
        const status = message[0];
        const data1 = message[1]; 
        const data2 = message[2]; 
        
        if (status >= 144 && status <= 159) {
            handlePadPress(data1, data2);
        }
        else if ((status & 0xF0) === 0xB0) { 
            handleControlChange(data1, data2); 
        }
    });

    return true;
}

// --- GESTION DES CONNEXIONS SOCKET.IO (MISE À JOUR) ---

io.on('connection', (socket) => {
    console.log(`Client connecté : ${socket.id}`);
    
    // 1. Envoi de l'état MIDI initial
    io.emit('midi_status', { connected: true }); 
    
    // 2. Gestion de la requête de données PADs du dashboard
    socket.on('request_all_pad_data', () => {
        console.log("Requête de données PADs reçue. Envoi de la structure complète.");
        // Envoi immédiat des données structurées
        socket.emit('all_pad_data', ALL_PAD_DATA);
    });

    socket.on('disconnect', () => { console.log(`Client déconnecté : ${socket.id}`); });
});


// --- DÉMARRAGE DU SERVEUR PRINCIPAL (inchangé) ---

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