// pageTool.js (À placer dans le même répertoire que votre script de démarrage Electron, ex: à la racine)

// Ces modules sont disponibles car ce code s'exécute dans l'environnement Node/Electron.
const io_client = require('socket.io-client'); 
const path = require('path'); 

const ELECTRON_PAGE_FILE_MAP = {
    'code': 'public/html/code_timeline.html',
    'edite': 'public/html/cut_timeline.html',
    'fusion': 'public/html/fusion_visuel.html',
    'fairlight': 'public/html/fairlight_audio.html',
    'media': 'public/html/media_data.html',
    'delivery': 'public/html/delivery.html'
};

/**
 * Initialise l'écoute Socket.io pour les commandes MIDI.
 * @param {function(string, string)} windowCreator - La fonction qui ouvre une nouvelle BrowserWindow.
 */
function initMidiPageControl(windowCreator) {
    if (typeof windowCreator !== 'function') {
        console.error("❌ ERREUR: initMidiPageControl nécessite la fonction createSecondaryWindow.");
        return;
    }

    const electronSocket = io_client('http://localhost:3145'); // Connecte au serveur Node

    electronSocket.on('connect', () => {
        console.log('✅ [Electron Main] Connecté au serveur Socket.io pour les commandes MIDI.');
    });

    electronSocket.on('error', (err) => {
        console.error('❌ [Electron Main] Erreur de connexion Socket:', err.message);
    });

    // Écoute de l'événement envoyé par main.js
    electronSocket.on('midi_page_switch', (data) => {
        const pageKey = data.page;
        const filePath = ELECTRON_PAGE_FILE_MAP[pageKey];
        
        if (filePath) {
            console.log(`📡 [Electron Main] MIDI Page Switch: Ouverture de ${pageKey.toUpperCase()} (${filePath})`);
            
            // Exécute l'ouverture de la fenêtre
            windowCreator(filePath, `Studio AV - ${pageKey.toUpperCase()}`);
        } else {
            console.warn(`⚠️ [Electron Main] Page inconnue demandée par MIDI: ${pageKey}`);
        }
    });
}

module.exports = { initMidiPageControl };