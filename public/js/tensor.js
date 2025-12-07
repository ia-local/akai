// public/js/tensor.js

/**
 * TENSOR CORE CONTROLLER (V1.0)
 * Gère les inputs MIDI (CC) pour manipuler les contrôles visuels 
 * et déclenche le rendu ASCII/WebGL.
 */

// =================================================================
// 1. IMPORTS
// =================================================================

import { ModalSystem } from './ui/modalSystem.js'; 
// CORRECTION D'IMPORTATION FINALISÉE :
import { AsciiProcessor, generateAsciiBox, TENSOR_GLYPHS } from '../data/AsciiGlyphs.js'; 

// =================================================================
// 2. ÉLÉMENTS DOM CIBLES
// =================================================================
const canvasContainer = document.getElementById('preview-media-container');
const asciiCanvas = document.getElementById('ascii-canvas'); 
const tensorInput = document.getElementById('tensor-input');
const runTensorBtn = document.getElementById('btn-run-tensor');

// ... (DOM des contrôles CC inchangés) ...
const cc0Range = document.getElementById('tensor-x-offset');
const cc1Range = document.getElementById('tensor-y-zoom');
const cc2Range = document.getElementById('tensor-z-opacity');
const cc3Range = document.getElementById('tensor-chroma-shift');
const cc0ValDisplay = document.getElementById('cc-0-val');
const cc1ValDisplay = document.getElementById('cc-1-val');
const cc2ValDisplay = document.getElementById('cc-2-val');
const cc3ValDisplay = document.getElementById('cc-3-val');


// =================================================================
// 3. ÉTAT LOCAL
// =================================================================
let tensorState = {
    xOffset: 0.5,
    yZoom: 0.5,
    zOpacity: 1.0,
    chroma: 0,
    currentGlyphIndex: 0 // État pour l'outil
};


// =================================================================
// 4. FONCTIONS DE RENDU/LOGIQUE
// =================================================================

/**
 * Met à jour les contrôles UI et l'état local.
 * @param {number} cc - Le numéro du Contrôle Change (0-3).
 * @param {number} normVal - La valeur normalisée (0.0 à 1.0).
 */
function updateTensorControl(cc, normVal) {
    let rawVal; 

    switch(cc) {
        case 0: // X Offset
            rawVal = Math.round(normVal * 100);
            tensorState.xOffset = normVal;
            cc0Range.value = rawVal;
            cc0ValDisplay.textContent = `${rawVal}%`;
            break;
        case 1: // Y Zoom
            rawVal = 1 + normVal * 2; 
            tensorState.yZoom = rawVal;
            cc1Range.value = normVal * 100;
            cc1ValDisplay.textContent = `${rawVal.toFixed(2)}x`;
            break;
        case 2: // Z Opacity
            rawVal = normVal;
            tensorState.zOpacity = normVal;
            cc2Range.value = rawVal * 100;
            cc2ValDisplay.textContent = `${rawVal.toFixed(2)}`;
            break;
        case 3: // Chroma Shift (Hue)
            rawVal = Math.round(normVal * 360); 
            tensorState.chroma = rawVal;
            cc3Range.value = rawVal;
            cc3ValDisplay.textContent = `${rawVal}°`;
            break;
    }
}

/**
 * Génère le rendu ASCII sur le canevas (Simulation simple).
 */
function runTensorAnalysis() {
    if (!asciiCanvas) {
        console.error("❌ CANVAS ASCII non trouvé. Impossible de rendre.");
        return;
    }
    
    // Utilisation de la classe importée
    const rawInput = tensorInput.value;
    const { text, style } = AsciiProcessor.process(rawInput); 
    
    // --- Simulation de Rendu ASCII ---
    const ctx = asciiCanvas.getContext('2d');
    // Sécurité de taille
    asciiCanvas.width = canvasContainer.clientWidth || 800; 
    asciiCanvas.height = canvasContainer.clientHeight || 600;
    
    ctx.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
    
    // Simplification : Afficher le texte traité au centre
    ctx.font = `${20 * tensorState.yZoom}px ${style.font}`;
    ctx.fillStyle = style.color;
    ctx.textAlign = style.align === 'center' ? 'center' : 'left';
    
    const centerX = asciiCanvas.width * tensorState.xOffset; 
    const centerY = asciiCanvas.height / 2;
    
    console.log(`Opacity (CC 2): ${tensorState.zOpacity.toFixed(2)} | Chroma (CC 3): ${tensorState.chroma}°`);

    // Affichage du texte
    ctx.fillText("TENSOR READY - " + text.trim().split('\n')[0], centerX, centerY);
    
    // Appliquer les styles CSS aux canvas
    asciiCanvas.style.opacity = tensorState.zOpacity;
    asciiCanvas.style.display = 'block'; 
    asciiCanvas.style.filter = `hue-rotate(${tensorState.chroma}deg)`;
}


// =================================================================
// 5. INITIALISATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // A. Attacher l'événement au bouton RUN
    if(runTensorBtn) {
        runTensorBtn.addEventListener('click', runTensorAnalysis);
    }

    // B. Attacher les événements aux barres de contrôle (pour interaction manuelle)
    [cc0Range, cc1Range, cc2Range, cc3Range].forEach(range => {
        if(range) {
            range.addEventListener('input', (e) => {
                const normVal = parseFloat(e.target.value) / 100;
                const ccMap = {'tensor-x-offset': 0, 'tensor-y-zoom': 1, 'tensor-z-opacity': 2, 'tensor-chroma-shift': 3};
                updateTensorControl(ccMap[e.target.id], normVal);
            });
        }
    });
    
    // C. [PATCH] Définir la fonction de contrôle MIDI local
    window.localMidiKnobControl = (cc, normVal) => {
        if (cc >= 0 && cc <= 3) {
            updateTensorControl(cc, normVal);
            runTensorAnalysis(); 
        }
    };
    
    // D. Définition des contrôles de PAD pour les outils (PAD 6 et 7)
    // S'assurer que TENSOR_GLYPHS.chars existe avant d'essayer de compter ses clés
    const glyphKeys = TENSOR_GLYPHS && TENSOR_GLYPHS.chars ? Object.keys(TENSOR_GLYPHS.chars) : [];

    window.localMidiPadControl = (note) => {
        if (note === 6) {
            if (glyphKeys.length > 0) {
                tensorState.currentGlyphIndex = (tensorState.currentGlyphIndex + 1) % glyphKeys.length;
                console.log(`🌌 PAD 6: Next Glyph Index -> ${glyphKeys[tensorState.currentGlyphIndex]}`);
            } else {
                console.warn("🌌 PAD 6: Glyphes non chargés pour la navigation.");
            }
        }
        if (note === 7) {
            console.log("🌌 PAD 7: Eraser/Reset Tool Active.");
        }
    }
    
    console.log("✅ TENSOR: Interface prête. Attente des commandes MIDI/UI.");
});


// Exportez la fonction de contrôle pour que main.js puisse la 'patcher' si nécessaire
export { updateTensorControl };