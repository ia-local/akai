// public/js/fairlight_audio.js - Contrôleur Fairlight (V2.5 - Final)

// Assurez-vous que cette dépendance existe
import { updateSyncBuffer, sendBufferedSignalsToQuantum } from './quantum_audio_sync.js';

const socket = (typeof io !== 'undefined') ? io() : null; 

// --- CIBLES DOM ---
const pannerRange = document.getElementById('fairlight-panner'); 
const lowEQRange = document.getElementById('fairlight-low-eq');   
const highEQRange = document.getElementById('fairlight-high-eq'); 
const audioVizContainer = document.getElementById('timeline-waveform-area');
const tensorPorts = { 'CC0': document.getElementById('source-cc0'), 'CC1': document.getElementById('source-cc1'), 'M1': document.getElementById('source-m1'), 'Q_SPACE': document.getElementById('quantum-extract') };


// --- VARIABLES ---
let waveformAnalyser = null; 
let waveformCtx = null;
let waveformCanvas = null;
const BANK_B_START_NOTE = 16;
const BANK_B_END_NOTE = 31;
const SYNC_BLOCK_DURATION_MS = 200; 
let isTensorCaptureActive = false; 

// --- LOGIQUE SYNCHRONE (Fonctions utilitaires minimales) ---
function blockThread(durationMs) { /* ... */ } 
function updateTensorPortVisual(cc, normVal) { /* ... */ } 


/**
 * Gère l'update des Knobs CC 0-12, met à jour l'AudioEngine.
 */
function updateAudioControl(cc, normVal) {
    let rawVal, isMappable = false;
    const engineReady = window.audioEngine?.isInitialized;

    // --- MAPPING FAIRLIGHT BASIQUE (CC 0, 1, 2) ---
    if (cc === 0) { rawVal = Math.round((normVal * 200) - 100); isMappable = true; if (engineReady) window.audioEngine.updateSpatialState(rawVal, null, null); pannerRange.value = rawVal; }
    else if (cc === 1) { rawVal = Math.round((normVal * 24) - 12); isMappable = true; if (engineReady) window.audioEngine.updateEQ(rawVal, null); lowEQRange.value = rawVal; }
    else if (cc === 2) { rawVal = Math.round((normVal * 24) - 12); isMappable = true; if (engineReady) window.audioEngine.updateEQ(null, rawVal); highEQRange.value = rawVal; }
    
    // NOUVEAU : CC 3 (Filter Band - Math)
    else if (cc === 3) { rawVal = Math.round(40 + normVal * 80); isMappable = true; if (engineReady) window.audioEngine.updateFilterBand(rawVal); }
    
    // NOUVEAU : CC 4 (Key Mode Index - Math)
    else if (cc === 4) { rawVal = Math.round(normVal * 11); isMappable = true; if (engineReady) window.audioEngine.updateKeyModeIndex(rawVal); }
    
    // CC 6, 7 (Avancés)
    else if (cc === 6) { rawVal = Math.round(normVal * 10); isMappable = true; if (engineReady) window.audioEngine.updateFXIndex(rawVal); }
    else if (cc === 7) { rawVal = Math.round(normVal * 100); isMappable = true; if (engineReady) window.audioEngine.updateTransportSpeed(rawVal); }

    // CC 8 - 12 (Placeholders)
    else if (cc >= 8 && cc <= 12) { rawVal = normVal.toFixed(2); isMappable = true; }

    // --- EXÉCUTION COMMUNE (Synchrone/Tensor/Socket) ---
    if (isMappable) {
        if (cc === 0 || cc === 1) updateTensorPortVisual(cc, normVal);
        // Assurez-vous que les fonctions suivantes sont disponibles
        if (typeof updateSyncBuffer === 'function') updateSyncBuffer(cc, normVal);
        if (typeof sendBufferedSignalsToQuantum === 'function') sendBufferedSignalsToQuantum(`CC${cc}`);
        
        // Envoi Socket (si nécessaire pour la persistance/Vizu AV)
        // if (socket) socket.emit('midi_cc', { cc: cc, variable: '...', value: rawVal }); 
    }
}

window.localMidiKnobControl = function(cc, normVal, rawVal) {
    if (cc >= 0 && cc <= 12) {
        updateAudioControl(cc, normVal);
    }
};

/**
 * Fonction locale pour intercepter les événements Pad du MIDI Controller (Banque B).
 */
window.localMidiPadControl = (note, velocity = 1) => {
    const isPress = velocity > 0;
    const engineReady = window.audioEngine?.isInitialized;
    
    if (isPress) {
        let isSynchroneAction = false; 

        if (note >= BANK_B_START_NOTE && note <= BANK_B_END_NOTE) {
            if (engineReady) {
                switch (note) {
                    case 16: // Q-SYNC (Quantizer Toggle)
                        if (window.audioEngine.toggleQuantizer) window.audioEngine.toggleQuantizer();
                        isSynchroneAction = true;
                        break;
                    case 17: // Q-TRIG
                        if (window.audioEngine.triggerQuantizedReset) window.audioEngine.triggerQuantizedReset();
                        isSynchroneAction = true;
                        break;
                    case 18: // Q-SPACE
                        isTensorCaptureActive = !isTensorCaptureActive;
                        tensorPorts['Q_SPACE']?.classList.toggle('active-pulse-red', isTensorCaptureActive);
                        if (isTensorCaptureActive && window.audioEngine.startTensorCapture) window.audioEngine.startTensorCapture();
                        isSynchroneAction = isTensorCaptureActive;
                        break;
                    case 19: // SEQUENCER (NOUVEAU)
                        if (window.audioEngine.toggleSequencer) window.audioEngine.toggleSequencer();
                        break;
                    case 28: // TRANSPORT Play/Pause
                        if (window.audioEngine.playPause) window.audioEngine.playPause();
                        document.getElementById('transport-display').textContent = window.audioEngine.getTransportState() || 'PERFORM';
                        break;
                    case 30: // TRANSPORT Stop/Reset
                        if (window.audioEngine.stop) window.audioEngine.stop();
                        document.getElementById('transport-display').textContent = 'STOPPED';
                        break;
                }
            }
            if (isSynchroneAction) { /* blockThread(SYNC_BLOCK_DURATION_MS); */ }
        }
        
        // Audio Trigger pour toutes les pads (A, C et pads B non mappés)
        if (window.audioEngine?.triggerPad) {
            window.audioEngine.triggerPad(note, velocity / 127);
        }
    }
};


// --- VISUALISEUR ET INITIALISATION (Logique de boucle de vérification) ---
function initWaveformVisualizer() {
    // Code Visualiseur
    if (typeof Tone === 'undefined' || !window.audioEngine?.masterGain || Tone.context.state !== 'running' || !audioVizContainer) { return; }
    
    audioVizContainer.innerHTML = ''; 
    let waveformCanvas = document.createElement('canvas'); waveformCanvas.id = 'waveform-canvas-active'; 
    waveformCanvas.width = audioVizContainer.clientWidth; waveformCanvas.height = audioVizContainer.clientHeight;
    let waveformCtx = waveformCanvas.getContext('2d'); audioVizContainer.appendChild(waveformCanvas);
    let waveformAnalyser = new Tone.Analyser("waveform", 2048); 
    window.audioEngine.masterGain.connect(waveformAnalyser);
    
    const startDrawingLoop = () => {
        // Logique de dessin de la forme d'onde
        requestAnimationFrame(startDrawingLoop);
        const buffer = waveformAnalyser.getValue();
        // ... (Logique de dessin du buffer)
    };
    startDrawingLoop();
}

function tryInitVisualizer() {
    if (window.audioEngine && window.audioEngine.isInitialized && typeof Tone !== 'undefined' && Tone.context.state === 'running') {
        initWaveformVisualizer();
        return true;
    } 
    if (window.audioEngine) {
        setTimeout(tryInitVisualizer, 100); 
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs pour les faders (CC 0, 1, 2)
    if (pannerRange) pannerRange.addEventListener('input', (e) => updateAudioControl(0, (parseFloat(e.target.value) + 100) / 200));
    if (lowEQRange) lowEQRange.addEventListener('input', (e) => updateAudioControl(1, (parseFloat(e.target.value) + 12) / 24));
    if (highEQRange) highEQRange.addEventListener('input', (e) => updateAudioControl(2, (parseFloat(e.target.value) + 12) / 24));
    
    tryInitVisualizer(); 
});