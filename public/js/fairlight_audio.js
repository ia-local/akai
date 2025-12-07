// public/js/fairlight_audio.js - Contrôleur Fairlight

/**
 * FAIRLIGHT AUDIO CONTROLLER (V2.0 - 18 CONTROLS & VISUALIZATION)
 * Gère le mapping des 6 KNOBs sur 3 banques (A, B, C) pour un total de 18 contrôles.
 * Le changement de bank est géré par clic sur les LEDs du MPD visuel.
 */

const socket = (typeof io !== 'undefined') ? io() : null; 

// =================================================================
// 1. ÉLÉMENTS DOM CIBLES & STRUCTURE
// =================================================================
// Faders UI (Cibles des inputs range)
const pannerRange = document.getElementById('fairlight-panner'); // CC 0
const lowEQRange = document.getElementById('fairlight-low-eq');   // CC 1
const highEQRange = document.getElementById('fairlight-high-eq'); // CC 2

// Cibles des KNOBS et PADS visuels du MPD 218
const midiKnobVisuals = document.querySelectorAll('#midi-control-panel .knob-visual'); 
const padVisuals = document.querySelectorAll('#active-pad-grid-visuel .pad-visual');
const socketStatusEl = document.getElementById('socket-status'); 

// Pour l'injection des PADS
const padGridContainer = document.getElementById('active-pad-grid-visuel');
const PAD_COUNT = 16;

// Zone du Visualiseur
const audioVizContainer = document.querySelector('.flex-1.border-b');
let analyserNode = null;
let frequencyCtx = null;
let frequencyCanvas = null;


// État local de la bank
let currentBank = 'A'; 
const BANK_MAP = { 'A': 0, 'B': 6, 'C': 12 }; // Décalage pour les contrôles logiques (non utilisé pour les CC audio ici)

// =================================================================
// 2. LOGIQUE D'INJECTION ET DE SYNCHRONISATION
// =================================================================

/**
 * Retourne un ID unique pour le log/développement (ex: A-CC0, B-CC1).
 */
function getControlID(cc, bank) {
    return `${bank}-CC${cc}`;
}

/**
 * Mise à jour visuelle des LEDs de banque et de l'état local.
 */
function updateBankVisuals(activeBank) {
    const bankLeds = document.querySelectorAll('.bank-led[data-bank]');
    bankLeds.forEach(led => {
        led.classList.remove('active');
        if (led.dataset.bank === activeBank) {
            led.classList.add('active');
        }
    });
    currentBank = activeBank;
    console.log(`🏦 BANK: Contrôleur basculé sur Bank ${currentBank}.`);
}


/**
 * Met à jour la rotation visuelle du KNOB MIDI.
 */
function updateKnobRotation(cc, normVal) {
    const angle = (normVal * 270) - 135; 
    const knob = Array.from(midiKnobVisuals).find(k => parseInt(k.dataset.cc) === cc);
    
    if (knob) {
        const indicator = knob.querySelector('.knob-indicator');
        if (indicator) {
            indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        }
    }
}

/**
 * Met à jour le visuel du PAD sur la console MPD.
 */
function updatePadVisual(note, isActive) {
    const pad = document.querySelector(`#active-pad-grid-visuel .pad-visual[data-note="${note}"]`);
    
    if (pad) {
        if (isActive) {
            pad.classList.add('active');
        } else {
            setTimeout(() => pad.classList.remove('active'), 50); 
        }
    }
}

/**
 * Gère l'update des faders (UI) et envoie la commande au serveur.
 */
function updateAudioControl(cc, normVal) {
    if (!socket) return;
    
    let variable, rawVal, isMappable = false;

    // MAPPING DES CONTRÔLES FAIRLIGHT (CC 0, 1, 2)
    // NOTE: Ces KNOBS contrôlent Fairlight UNIQUEMENT en Bank A (par défaut), 
    // mais pour la démo, ils sont routés directement à l'AudioEngine de main.js
    // indépendamment de la bank pour simplifier le patch.
    if (cc === 0 && pannerRange) {
        rawVal = Math.round((normVal * 200) - 100); 
        variable = 'spatial_pan'; 
        pannerRange.value = rawVal;
        isMappable = true;
    }
    else if (cc === 1 && lowEQRange) {
        rawVal = Math.round((normVal * 24) - 12); 
        variable = 'eq_bass';
        lowEQRange.value = rawVal;
        isMappable = true;
    }
    else if (cc === 2 && highEQRange) {
        rawVal = Math.round((normVal * 24) - 12);
        variable = 'eq_treble';
        highEQRange.value = rawVal;
        isMappable = true;
    }
    
    // 1. MISE À JOUR VISUELLE DU KNOB MIDI (Pour tous les CC 0-5)
    updateKnobRotation(cc, normVal);
    
    // 2. LOG CONTEXTUEL
    const logId = getControlID(cc, currentBank);
    const logValue = rawVal !== undefined ? `${rawVal} dB` : normVal.toFixed(2);
    
    if (isMappable) {
        console.log(`🎛️ FAIRLIGHT [${currentBank}]: CC ${cc} (${variable}) -> ${logValue}`);
    } else {
        console.log(`🎛️ KNOB GLOBAL [${currentBank}]: CC ${cc} -> ${logValue} (Pas d'effet audio mappé)`);
    }

    // 3. ENVOI AU SERVEUR (uniquement si le CC a une fonction audio)
    if (variable) {
        socket.emit('midi_cc', {
            cc: cc,
            variable: variable,
            value: rawVal
        });
    }
}

/**
 * INJECTE LES 16 PADS DANS LA GRILLE.
 */
function renderPadGrid() {
    if (!padGridContainer) return;
    
    let padHTML = '';
    
    for (let i = 0; i < PAD_COUNT; i++) {
        // Ajout de la couleur contextuelle de base ici si la bank était gérée par ce script
        padHTML += `
            <div class="pad-visual" data-note="${i}">
                <span class="pad-label">P${i + 1}</span>
            </div>
        `;
    }
    padGridContainer.innerHTML = padHTML;
}

// =================================================================
// 4. REPRÉSENTATION GRAPHIQUE (Fréquence Temporelle)
// =================================================================

/**
 * Prépare le canvas, initialise l'AnalyserNode et démarre la boucle de dessin.
 */
function initFrequencyVisualizer() {
    if (typeof Tone === 'undefined' || !window.audioEngine?.masterGain || !audioVizContainer) {
        console.warn("⚠️ Visualiseur ignoré : Tone.js ou AudioEngine non prêt.");
        return;
    }
    
    // 1. Préparation du Canvas
    frequencyCanvas = document.createElement('canvas');
    frequencyCanvas.id = 'frequency-canvas-active';
    frequencyCanvas.width = audioVizContainer.clientWidth;
    frequencyCanvas.height = audioVizContainer.clientHeight;
    frequencyCtx = frequencyCanvas.getContext('2d');
    
    // 2. Remplacement du SVG statique
    audioVizContainer.innerHTML = '';
    audioVizContainer.appendChild(frequencyCanvas);
    
    // 3. AnalyserNode
    analyserNode = new Tone.Analyser("fft", 32); 
    window.audioEngine.masterGain.connect(analyserNode);

    // 4. Démarre la boucle de dessin
    const startDrawingLoop = () => {
        if (!frequencyCtx || !analyserNode) return;
        requestAnimationFrame(startDrawingLoop);

        // Récupérer les données de fréquence
        const bufferLength = analyserNode.size;
        const dataArray = new Float32Array(bufferLength);
        analyserNode.getFloatFrequencyData(dataArray); 

        frequencyCtx.fillStyle = '#111'; 
        frequencyCtx.fillRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);

        const barWidth = (frequencyCanvas.width / bufferLength) * 2.5;
        let x = 0;

        // Dessin du spectre (avec hauteur basée sur dB)
        for (let i = 0; i < bufferLength; i++) {
            // Normaliser de -140dB à 0dB (logarithmique)
            const normalizedHeight = (dataArray[i] + 140) / 140; 
            const barHeight = normalizedHeight * frequencyCanvas.height; 

            frequencyCtx.fillStyle = `rgb(50, 200, 50)`; 
            frequencyCtx.fillRect(x, frequencyCanvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    };
    
    // Initialise le redimensionnement du canvas
    window.addEventListener('resize', () => {
        frequencyCanvas.width = audioVizContainer.clientWidth;
        frequencyCanvas.height = audioVizContainer.clientHeight;
    });

    startDrawingLoop();
    console.log("🎨 Visualiseur de fréquence initialisé et connecté.");
}


// =================================================================
// 5. INITIALISATION (MAIN ENTRY POINT)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. INJECTION CRITIQUE DES PADS & KNOBS Visuels (Centrage)
    renderPadGrid();
    if (midiKnobVisuals.length > 0) {
        for (let cc = 0; cc <= 5; cc++) {
             updateKnobRotation(cc, 0.5);
        }
    }
    
    // 2. Attacher les écouteurs UI manuels (pour la synchronisation locale/server)
    if (pannerRange) pannerRange.addEventListener('input', (e) => updateAudioControl(0, (parseFloat(e.target.value) + 100) / 200));
    if (lowEQRange) lowEQRange.addEventListener('input', (e) => updateAudioControl(1, (parseFloat(e.target.value) + 12) / 24));
    if (highEQRange) highEQRange.addEventListener('input', (e) => updateAudioControl(2, (parseFloat(e.target.value) + 12) / 24));

    // 3. Gestion du changement de Bank (clic sur les LEDs)
    const bankLeds = document.querySelectorAll('.bank-led[data-bank]');
    bankLeds.forEach(led => {
        led.addEventListener('click', (e) => {
            const bank = e.currentTarget.dataset.bank;
            if (bank) updateBankVisuals(bank);
        });
    });

    // 4. [PATCH] Définir les fonctions de contrôle MIDI (pour main.js)
    window.localMidiKnobControl = (cc, normVal) => {
        if (cc >= 0 && cc <= 5) {
            updateAudioControl(cc, normVal);
        }
    };
    
    window.localMidiPadControl = (note, velocity = 1) => {
        const isPress = velocity > 0;
        updatePadVisual(note, isPress);
        
        if (isPress && window.audioEngine?.triggerPad) {
            window.audioEngine.triggerPad(note, velocity / 127);
        }
        // LOG Final
        if (isPress) {
            console.log(`🥁 PAD PRESS [${currentBank}]: Note ${note} - Audio Triggered.`);
        }
    };
    
    // 5. Initialiser l'affichage de l'état du socket... (Logique inchangée)

    // 6. INITIALISATION DU VISUALISEUR DE FRÉQUENCE
    // Démarre après un petit délai pour s'assurer que main.js a instancié AudioEngine
    setTimeout(initFrequencyVisualizer, 500); 

    console.log("✅ FAIRLIGHT: Contrôleurs MIDI prêts pour EQ/Pan.");
});