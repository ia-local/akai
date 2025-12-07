// public/js/fairlight_audio.js - Contrôleur Fairlight (V2.2 - Pont Tensor Synchrone)

// 🛑 Importation de la nouvelle couche d'abstraction Synchrone
import { updateSyncBuffer, sendBufferedSignalsToQuantum } from './quantum_audio_sync.js';

const socket = (typeof io !== 'undefined') ? io() : null; 

// =================================================================
// 1. ÉLÉMENTS DOM CIBLES & STRUCTURE
// =================================================================
// Cibles des inputs range du Mixer
const pannerRange = document.getElementById('fairlight-panner'); // CC 0
const lowEQRange = document.getElementById('fairlight-low-eq');   // CC 1
const highEQRange = document.getElementById('fairlight-high-eq'); // CC 2

// Cibles du Pont Tensor
const tensorPorts = {
    'CC0': document.getElementById('source-cc0'),
    'CC1': document.getElementById('source-cc1'),
    'M1': document.getElementById('source-m1'),
};

// Zone du Visualiseur
const audioVizContainer = document.getElementById('timeline-waveform-area');
let analyserNode = null;
let frequencyCtx = null;
let frequencyCanvas = null;

// État local de la bank (pour la simulation MIDI visuelle)
let currentBank = 'A'; 

// --- Constantes pour la Synchrone ---
const BANK_B_START_NOTE = 16;
const BANK_B_END_NOTE = 31;
const SYNC_BLOCK_DURATION_MS = 200; // Bloque le thread pendant 200ms


// =================================================================
// 2. LOGIQUE SYNCHRONE & ASYNCHRONE
// =================================================================

/**
 * 🛑 Fonction Synchrone Bloquante (Simule une Mesure Quantique complexe).
 */
function blockThread(durationMs) {
    const start = Date.now();
    let current = start;
    // Boucle bloquante volontaire pour simuler la synchrone
    while (current - start < durationMs) {
        current = Date.now();
    }
}

/**
 * Met à jour le visuel du Port Tensor (clignotement).
 */
function updateTensorPortVisual(cc, normVal) {
    const portId = `CC${cc}`;
    const port = tensorPorts[portId];
    
    if (port) {
        port.classList.add('active-pulse');
        setTimeout(() => {
            port.classList.remove('active-pulse');
        }, 100);
        
        // Console log d'activité pour le débogage
        console.log(`[TENSOR BRIDGE] Visuel CC${cc} activé.`);
    }
}

/**
 * Gère l'update des faders (UI) et envoie la commande au serveur via Socket.IO.
 */
function updateAudioControl(cc, normVal) {
    let variable, rawVal, isMappable = false;

    // MAPPING DES CONTRÔLES FAIRLIGHT (CC 0, 1, 2)
    if (cc === 0 && pannerRange) {
        rawVal = Math.round((normVal * 200) - 100); // Mappe [0, 1] à [-100, 100] pour le pan
        variable = 'spatial_pan'; 
        pannerRange.value = rawVal;
        isMappable = true;
    }
    else if (cc === 1 && lowEQRange) {
        rawVal = Math.round((normVal * 24) - 12); // Mappe [0, 1] à [-12, 12] pour l'EQ
        variable = 'eq_bass';
        lowEQRange.value = rawVal;
        isMappable = true;
    }
    else if (cc === 2 && highEQRange) {
        rawVal = Math.round((normVal * 24) - 12); // Mappe [0, 1] à [-12, 12] pour l'EQ
        variable = 'eq_treble';
        highEQRange.value = rawVal;
        isMappable = true;
    }
    
    // 1. Mise à jour Visuelle du Pont Tensor
    if (isMappable) {
        updateTensorPortVisual(cc, normVal);

        // 🛑 LIAISON ASYNCHRONE : Mise à jour du buffer et envoi au moteur quantique
        updateSyncBuffer(cc, normVal);
        sendBufferedSignalsToQuantum(`CC${cc}`); 
        console.log(`[TENSOR BRIDGE] Signal CC${cc} (${normVal.toFixed(2)}) envoyé ASYNC via pont.`);

        // 2. Envoi au serveur (main.js recevra et mettra à jour AudioEngine)
        if (variable && socket) {
            socket.emit('midi_cc', {
                cc: cc,
                variable: variable,
                value: rawVal // Envoie la valeur EQ/Pan brute
            });
        }
    }
}

/**
 * Fonction locale pour intercepter les événements Knob du MIDI Controller.
 * 🛑 Ceci est le point d'injection pour main.js.
 */
window.localMidiKnobControl = function(cc, normVal, rawVal) {
    if (cc >= 0 && cc <= 5) {
        // Envoie les valeurs normalisées (0-1) pour le calcul quantique
        updateAudioControl(cc, normVal);
    }
};

/**
 * Fonction locale pour intercepter les événements Pad du MIDI Controller.
 * 🛑 Ceci est le point d'injection pour main.js.
 */
window.localMidiPadControl = (note, velocity = 1) => {
    const isPress = velocity > 0;
    
    if (isPress) {
        let mode = 'STANDARD';
        
        // --- 1. DÉTECTION BANQUE B (Synchrone) ---
        if (note >= BANK_B_START_NOTE && note <= BANK_B_END_NOTE) {
            mode = 'SYNCHRONE';
            
            console.log(`\n\n🛑 SYNCHRONE START: Pad ${note} (Bank B) - Blocage du thread.`);
            blockThread(SYNC_BLOCK_DURATION_MS); 
            console.log(`✅ SYNCHRONE END: Mesure Quantique terminée après ${SYNC_BLOCK_DURATION_MS}ms.`);
        } 
        
        // 2. Log UI (pour la console Qubit)
        if (window.logPadEvent) {
            window.logPadEvent(note, velocity, mode); 
        }
        
        // 3. Audio Trigger (via main.js)
        if (window.audioEngine?.triggerPad) {
            window.audioEngine.triggerPad(note, velocity / 127);
        }
        
        console.log(`🥁 PAD PRESS: Note ${note}. Traitement terminé.`);
    }
};


// =================================================================
// 3. REPRÉSENTATION GRAPHIQUE (Visualiseur de Fréquence)
// =================================================================

/**
 * Prépare le canvas, initialise l'AnalyserNode et démarre la boucle de dessin.
 */
function initFrequencyVisualizer() {
    // ... (Logique Visualiseur inchangée) ...
    if (typeof Tone === 'undefined' || !window.audioEngine?.masterGain || !audioVizContainer) {
        console.warn("⚠️ Visualiseur ignoré : AudioEngine ou Tone.js non prêt (Attente MasterGain).");
        return;
    }
    
    // 1. Préparation du Canvas (Remplacement du SVG statique)
    frequencyCanvas = document.createElement('canvas');
    frequencyCanvas.id = 'frequency-canvas-active';
    frequencyCanvas.width = audioVizContainer.clientWidth;
    frequencyCanvas.height = audioVizContainer.clientHeight;
    frequencyCtx = frequencyCanvas.getContext('2d');
    
    audioVizContainer.innerHTML = '';
    audioVizContainer.appendChild(frequencyCanvas);
    
    // 2. AnalyserNode
    analyserNode = new Tone.Analyser("fft", 32); 
    window.audioEngine.masterGain.connect(analyserNode);
    console.log("✅ AnalyserNode connecté au Master Audio.");

    // 3. Démarre la boucle de dessin
    const startDrawingLoop = () => {
        if (!frequencyCtx || !analyserNode) return;
        requestAnimationFrame(startDrawingLoop);

        const bufferLength = analyserNode.size;
        const dataArray = new Float32Array(bufferLength);
        analyserNode.getFloatFrequencyData(dataArray); 

        frequencyCtx.fillStyle = '#111'; 
        frequencyCtx.fillRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);

        const barWidth = (frequencyCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const normalizedHeight = (dataArray[i] + 140) / 140; 
            const barHeight = normalizedHeight * frequencyCanvas.height; 

            frequencyCtx.fillStyle = `rgb(50, 200, 50)`; 
            frequencyCtx.fillRect(x, frequencyCanvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    };
    
    window.addEventListener('resize', () => {
        if (frequencyCanvas && audioVizContainer) {
            frequencyCanvas.width = audioVizContainer.clientWidth;
            frequencyCanvas.height = audioVizContainer.clientHeight;
        }
    });

    startDrawingLoop();
}


// =================================================================
// 4. INITIALISATION (MAIN ENTRY POINT)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Attacher les écouteurs UI manuels (pour la synchronisation locale/server)
    if (pannerRange) pannerRange.addEventListener('input', (e) => updateAudioControl(0, (parseFloat(e.target.value) + 100) / 200));
    if (lowEQRange) lowEQRange.addEventListener('input', (e) => updateAudioControl(1, (parseFloat(e.target.value) + 12) / 24));
    if (highEQRange) highEQRange.addEventListener('input', (e) => updateAudioControl(2, (parseFloat(e.target.value) + 12) / 24));

    // 2. INITIALISATION DU VISUALISEUR DE FRÉQUENCE
    setTimeout(initFrequencyVisualizer, 500); 

    console.log("✅ FAIRLIGHT: Contrôleurs MIDI prêts pour EQ/Pan.");
});