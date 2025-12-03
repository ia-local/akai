// ----------------------------------------------------------------------
// SCRIPT.JS : POINT D'ENTRÉE GLOBAL (Version Tone.js / WebSocket)
// ----------------------------------------------------------------------

// ... (Définitions globales et socket = io() restent inchangées) ...
const NOTES_COUNT = 12; 
const STEPS_COUNT = 16;
const PADS_COUNT = 16; 
const DEFAULT_BPM = 128; 
const MIDI_BASE_NOTE = 53; 

const socket = io(); 

// --- ÉTAT GLOBAL DE L'APPLICATION (Shared State) ---
const appState = {
    velocity: 1.0,   
    keyOffset: 0     
};


// Définitions des Mappings (inchangées)
const NOTE_MAPPING = [
    "E4 (Mi)", "D#4 (Ré#)", "D4 (Ré)", "C#4 (Do#)", "C4 (Do)", "B3 (Si)",
    "A#3 (La#)", "A3 (La)", "G#3 (Sol#)", "G3 (Sol)", "F#3 (Fa#)", "F3 (Fa)"
];
const PAD_MAPPING = [
    "KICK (0)", "SNARE (1)", "COWBELL (2)", "AMBIENCE FX (3)",
    "SNAP (4)", "HI SNARE (5)", "BLIP (6)", "HI SNARE (7)",
    "ELEC SNAARE (8)", "BEEP (9)", "TICK (10)", "BLIP (11)",
    "PLIP (12)", "PING (13)", "TWANG (14)", "LOOP (15)"
];

// Instanciation des modules (Déclaration)
let sequencerModule;
let controllerModule; 
let midiModal; 
let recorderModule;
let keyboardModule;
let visualizerModule; 

// --- UTILITY (Envoi du Signal Transport vers Node.js) ---
function sendOscMessage(address, ...args) {
    if (socket.connected) {
        socket.emit('transport_out', { // Nouveau nom d'événement pour le transport
            address: address,
            args: args
        });
    } else {
        console.warn("Socket non connecté. Impossible d'envoyer signal.");
    }
}

// --- UTILITY (Logique de Console) ---
function updateLog(message, color = 'muted') {
    const statusLog = document.getElementById('status-log');
    if (statusLog) {
        statusLog.textContent = `Console: ${new Date().toLocaleTimeString()} - ${message}`;
    }
}

// --- LOGIQUE D'INITIALISATION MODALE ---
function setupModalButton() {
    const showModalBtn = document.getElementById('btn-show-midi-modal');
    if (showModalBtn && window.midiModal) {
        showModalBtn.addEventListener('click', () => {
            window.midiModal.showModal();
        });
        showModalBtn.disabled = false;
    } else if (showModalBtn) {
        showModalBtn.disabled = true;
    }
}

// --- ÉCOUTE DES ÉVÉNEMENTS SOCKET ---

socket.on('connect', () => {
    updateLog('Connecté au serveur Node.js.', 'green');
    
    // 1. Initialisation des modules (CORRECTION DES ARGUMENTS)
    
    visualizerModule = new VisualEngine('main-visual-canvas');
    
    // ⬅️ CORRECTION 1 : Le Sequencer reçoit à nouveau 8 arguments.
    // L'argument sendOscMessage est passé pour le transport (Play/Stop).
    sequencerModule = new Sequencer(sendOscMessage, appState, NOTES_COUNT, STEPS_COUNT, DEFAULT_BPM, MIDI_BASE_NOTE, NOTE_MAPPING, updateLog);
    
    // ⬅️ CORRECTION 2 : Utilisation de ToneController (pour les entrées MIDI)
    controllerModule = new ToneController(appState, updateLog);
    
    // ⬅️ CORRECTION 3 : Instanciation de la modale
    midiModal = new MidiModal(controllerModule, NOTE_MAPPING, PAD_MAPPING);
    window.midiModal = midiModal;
    
    // Initialisation des autres modules
    recorderModule = new AudioRecorder(socket, updateLog);
    
    // Liaison des dépendances
    sequencerModule.visualizer = visualizerModule; 
    controllerModule.visualizer = visualizerModule;

    // Écouter les logs qui reviennent du serveur
    socket.on('server_log', (data) => {
        updateLog(data.msg, data.color);
    });

    // 4. Lancement de l'initialisation du DOM dans les modules
    sequencerModule.initializeGrid();
    
    // 5. Activation du bouton Modale
    setupModalButton();

    // Initialisation du clavier 
    keyboardModule = new KeyboardEventManager(sequencerModule, recorderModule, midiModal, updateLog);
    updateLog('Raccourcis clavier activés.', 'blue');
});

socket.on('disconnect', () => {
    updateLog('Déconnecté du serveur !', 'red');
    if(controllerModule) controllerModule.setMidiStatus(false);
});

// --- DÉMARRAGE DU DOM ---
document.addEventListener('DOMContentLoaded', () => {
    updateLog('Dashboard initialisé. Tentative de connexion WebSocket...');
    setupModalButton();
});