// ----------------------------------------------------------------------
// SCRIPT.JS : POINT D'ENTRÉE GLOBAL
// Initialise les modules Sequencer, Controller et la Modale.
// Gère l'état global (appState) et la connexion OSC/WebSocket.
// ----------------------------------------------------------------------

const NOTES_COUNT = 12; // Piano Roll (F3 à E4)
const STEPS_COUNT = 16;
const PADS_COUNT = 16; 
const DEFAULT_BPM = 128; 
const MIDI_BASE_NOTE = 53; // Fa3 (F3)

const socket = io(); // Connexion au serveur WebSocket

// --- ÉTAT GLOBAL DE L'APPLICATION (Shared State) ---
// Contient les valeurs des Knobs CC pour la vélocité et la transposition.
const appState = {
    velocity: 1.0,   // Vélocité actuelle des notes (Knob 3 / CC 2)
    keyOffset: 0     // Décalage chromatique (0 à 11) pour la transposition (Knob 5 / CC 4)
};


// Définitions des Mappings (partagés)
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

// Instanciation des modules
let sequencerModule;
let controllerModule;
let midiModal; // Déclaration de la variable pour la Modale
let recorderModule;
let keyboardModule; // <--- AJOUT VARIABLE
let visualizerModule
// --- UTILITY (Envoi OSC vers Node.js) ---
function sendOscMessage(address, ...args) {
    if (socket.connected) {
        socket.emit('osc_out', {
            address: address,
            args: args
        });
    } else {
        console.warn("Socket non connecté. Impossible d'envoyer OSC.");
    }
}

// --- UTILITY (Logique de Console) ---
function updateLog(message, color = 'muted') {
    const statusLog = document.getElementById('status-log');
    if (statusLog) {
        const status = document.createElement('span');
        status.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        statusLog.innerHTML = '';
        statusLog.appendChild(status);
    }
}

// --- LOGIQUE D'INITIALISATION MODALE ---
function setupModalButton() {
    const showModalBtn = document.getElementById('btn-show-midi-modal');
    if (showModalBtn && midiModal) {
        // Ajoute l'écouteur pour afficher la Modale
        showModalBtn.addEventListener('click', () => {
            midiModal.showModal();
        });
    } else if (showModalBtn) {
        // Cas où le bouton existe mais la Modale n'est pas encore initialisée
        showModalBtn.disabled = true;
    }
}

// --- ÉCOUTE DES ÉVÉNEMENTS SOCKET ---

socket.on('connect', () => {
    updateLog('Connecté au serveur Node.js.', 'green');
    
    // 1. Initialisation des modules (ATTENTION : UNE SEULE FOIS CHACUN)
    visualizerModule = new VisualEngine('main-visual-canvas');
    sequencerModule = new Sequencer(sendOscMessage, appState, NOTES_COUNT, STEPS_COUNT, DEFAULT_BPM, MIDI_BASE_NOTE, NOTE_MAPPING, updateLog);
    controllerModule = new Controller(sendOscMessage, appState, PADS_COUNT, PAD_MAPPING, updateLog);
    
    // --- CORRECTION : Initialisation unique ici ---
    midiModal = new MidiModal(controllerModule, NOTE_MAPPING, PAD_MAPPING);
    window.midiModal = midiModal;
    recorderModule = new AudioRecorder(socket, updateLog);
    sequencerModule.visualizer = visualizerModule; // Injection manuelle
    
    // Idem pour le controleur (pour visualiser quand tu tapes sur les pads)
    controllerModule.visualizer = visualizerModule;
    // Écouter les logs qui reviennent du serveur
    socket.on('server_log', (data) => {
        updateLog(data.msg, data.color);
    });

    // --- SUPPRESSION DE LA LIGNE EN DOUBLE QUI ÉTAIT ICI ---
    // (L'ancienne ligne "midiModal = new MidiModal..." a été retirée)

    // 3. Lier les événements du contrôleur aux modules
    socket.on('midi_event', (data) => {
        if (data.address.startsWith('/pad/')) {
            controllerModule.handlePadEvent(data.address, data.args);
        } else if (data.address.startsWith('/cc/')) {
            controllerModule.handleKnobEvent(data.address, data.args);
        }
    });

    // 4. Lancement de l'initialisation du DOM dans les modules
    sequencerModule.initializeGrid();
    
    // 5. Activation du bouton Modale
    setupModalButton();
    const showModalBtn = document.getElementById('btn-show-midi-modal');
    if (showModalBtn) showModalBtn.disabled = false;

    // --- 6. INITIALISATION DU CLAVIER ---
    // On passe les instances créées plus haut
    keyboardModule = new KeyboardEventManager(sequencerModule, recorderModule, midiModal, updateLog);
    
    updateLog('Raccourcis clavier activés (Ctrl+Space, Ctrl+R, Ctrl+M).', 'blue');
});

socket.on('disconnect', () => {
    updateLog('Déconnecté du serveur !', 'red');
});

// --- DÉMARRAGE DU DOM ---
document.addEventListener('DOMContentLoaded', () => {
    updateLog('Dashboard initialisé. Tentative de connexion WebSocket...');
    
    // Tenter de lier le bouton même si la connexion socket n'est pas encore faite
    setupModalButton();
});