// Fichier: public/js/quantum_logique.js
// Rôle: Moteur de simulation de Qubit pour le Studio AV.
// Gère la superposition, le calcul de probabilité et la conversion en états visuels.

import { asciiBit, quantumWavelengths, baseCharWidth, baseCharHeight } from './ascii-art-data.js';

// Constantes pour le Canvas
const CANVAS_ID = 'webgl-canvas';
const DEBUG_PHASE_EL = document.getElementById('debug-phase');
const DEBUG_PROB_EL = document.getElementById('debug-prob');
const DEBUG_ENT_EL = document.getElementById('debug-ent');

// État actuel du Qubit simulé
let qubitState = {
    // Amplitudes de probabilité (c0^2 + c1^2 = 1)
    amplitude0: Math.sqrt(0.5), // Probabilité de 50% pour |0>
    amplitude1: Math.sqrt(0.5), // Probabilité de 50% pour |1>
    
    // Angle de phase (non utilisé pour l'ASCII, mais essentiel pour l'interférence)
    phase: 0.0,
    
    // Niveau d'intrication (de 0.0 à 1.0)
    entanglementLevel: 0.0 
};

/**
 * 💡 Exécute le Q-Script de l'utilisateur et met à jour l'état du Qubit.
 * @param {string} code - Le code JavaScript/Q-Script à exécuter.
 * @param {object} inputVariables - Variables d'entrée (knob_Y, time, etc.).
 */
export function runQScript(code, inputVariables) {
    try {
        // --- Environnement d'exécution du Q-Script ---
        const { knob_Y, time } = inputVariables; 
        
        // Crée une fonction à partir du code utilisateur
        const scriptFunction = new Function('knob_Y', 'time', code);
        
        // Exécute la fonction et obtient les résultats
        const result = scriptFunction(knob_Y, time);
        
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
        qubitState.entanglementLevel = Math.min(1.0, Math.max(0.0, ent)); // Clamper entre 0 et 1
        
        console.log(`[Q-COMPUTE] État mis à jour: P(|0>)=${prob.toFixed(3)}, Entanglement=${ent.toFixed(3)}`);
        
        return qubitState;

    } catch (e) {
        console.error("Erreur d'exécution du Q-Script:", e);
        return null;
    }
}


/**
 * ⚛️ Visualise l'état de superposition en fusionnant les représentations |0> et |1>.
 * C'est le cœur de la conversion Qubit -> Visuel (ASCII Art + Couleur).
 * @returns {object} Un objet contenant le Qubit fusionné (ASCII Art, Couleur, Fréquence).
 */
export function visualizeQubitSuperposition() {
    const { amplitude0, amplitude1, entanglementLevel } = qubitState;
    
    const prob0 = amplitude0 * amplitude0; // Probabilité |0>
    const prob1 = amplitude1 * amplitude1; // Probabilité |1>

    const art0 = asciiBit['0'];
    const art1 = asciiBit['1'];

    // --- 1. Calcul de la Couleur (Fusion par Probabilité) ---
    const color0 = quantumWavelengths['0'].color;
    const color1 = quantumWavelengths['1'].color;

    // Mélange des couleurs pondéré par la probabilité (linéaire pour la simplicité)
    const fusedColor = {
        r: Math.round(color0.r * prob0 + color1.r * prob1),
        g: Math.round(color0.g * prob0 + color1.g * prob1),
        b: Math.round(color0.b * prob0 + color1.b * prob1)
    };

    // --- 2. Génération de l'ASCII Art Superposé ---
    const height = Math.max(art0.length, art1.length);
    let fusedArt = [];

    for (let i = 0; i < height; i++) {
        const line0 = art0[i] || ' '.repeat(art0[0].length);
        const line1 = art1[i] || ' '.repeat(art1[0].length);
        let fusedLine = '';

        const width = Math.max(line0.length, line1.length);

        for (let j = 0; j < width; j++) {
            const char0 = line0[j] === '█';
            const char1 = line1[j] === '█';

            // Logique de Superposition ASCII (Fusion: utiliser █ si les deux probabilités contribuent)
            let fusionChar = ' ';
            
            if (char0 && char1) {
                // Si les deux bits ont un pixel ici, utiliser un caractère spécial pour la superposition
                fusionChar = (prob0 > 0.4 && prob1 > 0.4) ? '░' : '█'; // Utiliser ░ pour la zone d'overlap
            } else if (char0) {
                // Pixel de |0> seul. La force dépend de prob0
                fusionChar = (prob0 > 0.2) ? '█' : ' ';
            } else if (char1) {
                // Pixel de |1> seul. La force dépend de prob1
                fusionChar = (prob1 > 0.2) ? '█' : ' ';
            }
            
            fusedLine += fusionChar;
        }
        fusedArt.push(fusedLine);
    }

    // --- 3. Intégration de l'Intrication ---
    // L'intrication (chaos) affecte la *vibration* de l'objet ou la vitesse d'affichage.
    const vibrationFactor = 1.0 + (entanglementLevel * 0.5); // Augmente l'échelle de 50%

    // --- 4. Mise à jour des débogages (pour le DOM) ---
    if (DEBUG_PROB_EL) DEBUG_PROB_EL.textContent = `P(|0>): ${prob0.toFixed(3)}`;
    if (DEBUG_ENT_EL) DEBUG_ENT_EL.textContent = `ENT: ${entanglementLevel.toFixed(3)}`;
    if (DEBUG_PHASE_EL) DEBUG_PHASE_EL.textContent = `PHASE: ${qubitState.phase.toFixed(3)}`;

    return {
        ascii: fusedArt,
        color: fusedColor,
        frequency: quantumWavelengths['0'].frequencyHz * prob0 + quantumWavelengths['1'].frequencyHz * prob1, // Fréquence pondérée
        vibrationScale: vibrationFactor,
        probability: prob1 // Probabilité de |1> (souvent le focus)
    };
}


/**
 * 🚀 Fonction de Rendu Principale (Appelée par la boucle d'animation)
 * Simule le dessin du Qubit sur le Canvas WebGL (2D pour l'ASCII)
 * @param {CanvasRenderingContext2D} ctx - Le contexte du Canvas (assumé 2D ici).
 */
export function renderQubit(ctx) {
    const renderData = visualizeQubitSuperposition();
    
    // --- Configuration du Rendu ---
    const art = renderData.ascii;
    const color = renderData.color;
    const scale = renderData.vibrationScale;
    const opacity = 1.0 - (renderData.probability * 0.2); // Opacité légère dépendante de la probabilité |1>

    const charW = baseCharWidth * scale;
    const charH = baseCharHeight * scale;
    const totalHeight = art.length * charH;
    
    // Positionnement au centre du canvas
    const startX = (ctx.canvas.width / 2) - ((art[0]?.length || 0) * charW / 2);
    const startY = (ctx.canvas.height / 2) - (totalHeight / 2);

    ctx.globalAlpha = opacity; 
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.font = `${charH}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // --- Boucle de Dessin ---
    art.forEach((line, lineIndex) => {
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char !== ' ') {
                ctx.fillText(char, 
                             startX + charIndex * charW, 
                             startY + lineIndex * charH);
            }
        }
    });

    ctx.globalAlpha = 1; // Réinitialiser
}

// Initialisation de l'état (premier calcul pour le démarrage)
document.addEventListener('DOMContentLoaded', () => {
    // Assurez-vous que le canvas est prêt pour être passé à la fonction de rendu
    const canvas = document.getElementById(CANVAS_ID);
    if (canvas && canvas.getContext) {
        // Rendu initial (simulé)
        visualizeQubitSuperposition();
    }
});