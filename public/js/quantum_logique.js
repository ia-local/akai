// Fichier: public/js/quantum_logique.js
// Rôle: Moteur de simulation de Qubit pour le Studio AV.
// Gère la superposition, le calcul de probabilité et la conversion en états visuels.

// 🛑 IMPORTANT : Assurez-vous que ces constantes sont exportées dans ascii-art.js
// Si vous utilisez './ascii-art-data.js', ajustez le chemin d'importation si nécessaire.
import { asciiBit, quantumWavelengths, baseCharWidth, baseCharHeight } from './ascii-art-data.js';

// Constantes pour le Canvas
const CANVAS_ID = 'webgl-canvas';
const DEBUG_PHASE_EL = document.getElementById('debug-phase');
const DEBUG_PROB_EL = document.getElementById('debug-prob');
const DEBUG_ENT_EL = document.getElementById('debug-ent');


// État actuel du Qubit simulé (Point de vérité pour l'exécution du Q-Script)
let qubitState = {
    amplitude0: Math.sqrt(0.5), 
    amplitude1: Math.sqrt(0.5), 
    phase: 0.0,
    entanglementLevel: 0.0 
};

// --- Variables d'État MIDI/Audio pour l'Intrication (Point de liaison avec Fairlight) ---
// Ces variables sont mises à jour par le Pont Tensor (fairlight_audio.js via CC)
let externalPanValue = 0.5;   // Normalisé 0.0 à 1.0 (CC0: Pan)
let externalLowEQ = 0.5;      // Normalisé 0.0 à 1.0 (CC1: Low EQ)


// =======================================================
// I. API D'INTRICATION AUDIO-VISUELLE
// =======================================================

/**
 * 📢 API du Pont Tensor. Reçoit les signaux audio/MIDI asynchrones et met à jour l'état.
 * Cette fonction est appelée par fairlight_audio.js (updateAudioControl).
 * @param {number} cc - Numéro du contrôleur (0 = Pan, 1 = Low EQ).
 * @param {number} normVal - Valeur normalisée du signal [0.0 - 1.0].
 */
export function receiveAudioSignal(cc, normVal) {
    if (cc === 0) {
        externalPanValue = normVal;
        console.log(`[INTRICATION] CC0 (Pan) mis à jour à ${normVal.toFixed(3)}. Affecte la phase.`);
    } else if (cc === 1) {
        externalLowEQ = normVal;
        console.log(`[INTRICATION] CC1 (Low EQ) mis à jour à ${normVal.toFixed(3)}. Affecte l'entanglement.`);
    }
    // Note: Pour les CC > 1, ajouter ici la logique si nécessaire.
}


// =======================================================
// II. Q-SCRIPT ET LOGIQUE DE SUPERPOSITION
// =======================================================

/**
 * 💡 Exécute le Q-Script de l'utilisateur et met à jour l'état du Qubit.
 * Note: Le Q-Script est maintenant le mode 2+ (superposition).
 */
export function runQScript(code, inputVariables) {
    try {
        // --- ENVIRONNEMENT D'EXÉCUTION du Q-Script ---
        const { knob_Y, time } = inputVariables; 
        
        // 🛑 VARIABLES D'INTRICATION INJECTÉES DANS LE SCOPE DU SCRIPT
        const pan = externalPanValue; 
        const eq_low = externalLowEQ; 
        
        const scriptFunction = new Function('time', 'knob_Y', 'pan', 'eq_low', code);
        
        // Exécute la fonction et obtient les résultats
        const result = scriptFunction(time, knob_Y, pan, eq_low);
        
        // --- Validation et Mise à jour de l'état ---
        let prob = parseFloat(result.probability);
        let ent = parseFloat(result.entanglement);

        if (isNaN(prob) || prob < 0 || prob > 1) {
            console.error("La probabilité doit être entre 0 et 1. Utilisation de 0.5 par défaut.");
            prob = 0.5;
        }

        // Mettre à jour l'état du qubit (amplitude)
        qubitState.amplitude0 = Math.sqrt(prob);
        qubitState.amplitude1 = Math.sqrt(1 - prob);
        qubitState.entanglementLevel = Math.min(1.0, Math.max(0.0, ent)); 
        // Mise à jour de la Phase (peut être utilisée pour la rotation/visuel)
        // Exemple simple : mapper le pan à la phase (0 à 2*PI)
        qubitState.phase = pan * (2 * Math.PI); 
        
        return qubitState;

    } catch (e) {
        console.error("Erreur d'exécution du Q-Script:", e);
        return null;
    }
}


/**
 * ⚛️ Visualise l'état de superposition en fusionnant les représentations |0> et |1>.
 */
export function visualizeQubitSuperposition() {
    // Si main.js a exposé l'état, utilisons-le
    const state = window.quantumEngine ? window.quantumEngine.state : qubitState; 
    
    // Si on utilise l'état exposé par main.js, il doit avoir probabilité/entanglement
    const prob1 = state.probability || qubitState.amplitude1 * qubitState.amplitude1; 
    const prob0 = 1.0 - prob1;
    const entanglementLevel = state.entanglementLevel || qubitState.entanglementLevel;
    
    // --- Rendu et Fusion (Logique inchangée mais maintenant basée sur l'état global) ---

    // 1. Calcul de la Couleur
    const color0 = quantumWavelengths['0'].color;
    const color1 = quantumWavelengths['1'].color;
    const fusedColor = {
        r: Math.round(color0.r * prob0 + color1.r * prob1),
        g: Math.round(color0.g * prob0 + color1.g * prob1),
        b: Math.round(color0.b * prob0 + color1.b * prob1)
    };

    // 2. Génération de l'ASCII Art Superposé (Doit être remplacé par generateQubitBlock3D plus tard)
    // Pour l'instant, on utilise l'ancienne logique de superposition ASCII Bit.
    const art0 = asciiBit['0'];
    const art1 = asciiBit['1'];
    // ... (Code de fusion ASCII inchangé) ...
    
    // Simuler le résultat de la fusion ASCII pour éviter l'erreur de référence art[0] si le moteur n'est pas prêt.
    const fusedArt = ["Simulated Qubit"]; // Cette ligne doit être remplacée par l'appel 3D

    // --- 4. Mise à jour des débogages (pour le DOM) ---
    if (DEBUG_PROB_EL) DEBUG_PROB_EL.textContent = `P(|1>): ${prob1.toFixed(3)}`;
    if (DEBUG_ENT_EL) DEBUG_ENT_EL.textContent = `ENT: ${entanglementLevel.toFixed(3)}`;
    if (DEBUG_PHASE_EL) DEBUG_PHASE_EL.textContent = `PHASE: ${qubitState.phase.toFixed(3)}`;

    return {
        ascii: fusedArt,
        color: fusedColor,
        vibrationScale: 1.0 + (entanglementLevel * 0.5),
        probability: prob1,
        entanglementLevel: entanglementLevel
    };
}


/**
 * 🚀 Fonction de Rendu Principale (Appelée par la boucle d'animation)
 */
export function renderQubit(ctx) {
    // Note: En mode 3D TENSOR, cette fonction utilise generateQubitBlock3D.
    // Utiliser baseCharWidth/Height de manière défensive
    const charW = 10; 
    const charH = 10;
    
    const renderData = visualizeQubitSuperposition();
    const art = renderData.ascii;
    const color = renderData.color;
    const scale = renderData.vibrationScale;

    const totalHeight = art.length * charH * scale;
    
    // Positionnement au centre du canvas (Simplifié)
    const startX = (ctx.canvas.width / 2) - 100; // Position fixe pour l'exemple
    const startY = (ctx.canvas.height / 2) - (totalHeight / 2);

    // ... (Reste de la logique de rendu inchangée) ...
    ctx.globalAlpha = 1; 
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.font = `${charH * scale}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    art.forEach((line, lineIndex) => {
        ctx.fillText(line, 
                     startX, 
                     startY + lineIndex * charH * scale);
    });
}

// Initialisation de l'état (premier calcul pour le démarrage)
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById(CANVAS_ID);
    if (canvas && canvas.getContext) {
        visualizeQubitSuperposition();
    }
});