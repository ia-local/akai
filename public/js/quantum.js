// public/js/quantum.js - Contrôleur du Moteur Quantique

/**
 * QUANTUM CORE CONTROLLER (V1.0)
 * Gère les inputs MIDI (CC) pour manipuler les paramètres Quantum 
 * (Probabilité et Entanglement).
 * * PLAN DE DÉVELOPPEMENT :
 * 1. Mappage CC 0 et CC 1 pour l'Entanglement et la Probabilité (TERMINÉ)
 * 2. Mappage PAD 14 (Mutation IA)
 * 3. Gestion des Time Stops (futur)
 */

// =================================================================
// 1. ÉLÉMENTS DOM CIBLES
// =================================================================
const probRange = document.getElementById('quantum-probability');
const entangleRange = document.getElementById('quantum-entanglement');
const probValDisplay = document.getElementById('prob-val');
const entangleValDisplay = document.getElementById('entangle-val');
const logConsole = document.getElementById('quantum-log');

const triggerMutationBtn = document.getElementById('trigger-mutation-btn');
const resetStateBtn = document.getElementById('reset-state-btn');


// =================================================================
// 2. LOGIQUE QUANTIQUE
// =================================================================

function updateQuantumControl(cc, normVal) {
    // Vérification de l'existence des éléments DOM (résilience)
    if (!probRange || !entangleRange) return; 

    let rawVal; 

    switch(cc) {
        case 0: // CC 0: Probability Field (0.0 à 1.0)
            rawVal = normVal.toFixed(2); 
            probRange.value = normVal * 100;
            if (probValDisplay) probValDisplay.textContent = rawVal;
            if (logConsole) logConsole.innerHTML += `> Probability set to ${rawVal}\n`;
            break;
        case 1: // CC 1: Entanglement Level (0.0 à 1.0)
            rawVal = normVal.toFixed(2);
            entangleRange.value = normVal * 100;
            if (entangleValDisplay) entangleValDisplay.textContent = rawVal;
            if (logConsole) logConsole.innerHTML += `> Entanglement factor set to ${rawVal}\n`;
            break;
    }
    if (logConsole) logConsole.scrollTop = logConsole.scrollHeight;
}

function triggerMutation() {
    if (!logConsole) return;
    logConsole.innerHTML += "> 🤖 Requesting quantum mutation...\n";
    // [ACTION FUTURE] : Envoyer la commande au serveur Node (simulé ici)
    // window.socket.emit('quantum_mutate', { ... });
    logConsole.scrollTop = logConsole.scrollHeight;
}

function resetState() {
    if (probRange) probRange.value = 50;
    if (entangleRange) entangleRange.value = 0;
    if (probValDisplay) probValDisplay.textContent = '0.5';
    if (entangleValDisplay) entangleValDisplay.textContent = '0.0';
    
    if (logConsole) {
        logConsole.innerHTML += "\n> State reset. Superposition ready.\n";
        logConsole.scrollTop = logConsole.scrollHeight;
    }
}

// =================================================================
// 3. INITIALISATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // A. Attacher les événements UI manuels
    if (triggerMutationBtn) triggerMutationBtn.addEventListener('click', triggerMutation);
    if (resetStateBtn) resetStateBtn.addEventListener('click', resetState);

    // B. Attacher les événements 'input' pour les mises à jour UI manuelles
    if (probRange) probRange.addEventListener('input', (e) => updateQuantumControl(0, parseFloat(e.target.value) / 100));
    if (entangleRange) entangleRange.addEventListener('input', (e) => updateQuantumControl(1, parseFloat(e.target.value) / 100));

    // C. [PATCH CRITIQUE] Définir la fonction de contrôle MIDI locale (pour main.js)
    // Cela délègue les CC 0 et 1 au contrôleur Quantum
    window.localMidiKnobControl = (cc, normVal) => {
        if (cc === 0 || cc === 1) {
            updateQuantumControl(cc, normVal);
        }
        // Les CC 2, 3, 4, 5 sont ignorés ici et gérés par les fallbacks de main.js
    };
    
    // D. Définir le contrôle PAD pour le PAD 14 (Mutation IA)
    window.localMidiPadControl = (note) => {
        if (note === 14) {
            triggerMutation();
        }
        // Les autres pads (0-13, 15) sont gérés par les fallbacks de main.js
    };
    
    console.log("✅ QUANTUM: Interface prête. CC 0 & 1 mappés.");
});