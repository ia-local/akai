/**
 * Fichier: quantum_audio_sync.js
 * Rôle: Pont Synchrone/Asynchrone entre le contrôleur Fairlight (Audio/MIDI)
 * et le moteur quantique (quantum_logique.js).
 * * Contient la logique pour transférer les signaux CC0 (Pan) et CC1 (EQ Low)
 * vers l'API receiveAudioSignal du moteur quantique.
 */

// 🛑 IMPORTANT: Ce module DOIT IMPORTER l'API du moteur quantique.
// On suppose que receiveAudioSignal est exposé globalement OU dans un module.
// Pour la simplicité, nous allons chercher l'API globale si elle n'est pas importée.
// Note: Dans une architecture modulaire propre, nous l'importerions directement.

const QUANTUM_API = window.receiveAudioSignal;

// État local du pont (Buffer pour l'asynchrone)
const syncBuffer = {
    pan: 0.5,     // CC0 Pan (normalisé 0.0 - 1.0)
    lowEQ: 0.5,   // CC1 Low EQ (normalisé 0.0 - 1.0)
    // Ici, nous pourrions stocker d'autres paramètres comme le niveau RMS, etc.
};

// =======================================================
// 1. LOGIQUE DE MISE À JOUR DU BUFFER
// =======================================================

/**
 * 📢 Met à jour le buffer interne du pont Synchrone avec les dernières valeurs MIDI/Audio.
 * Cette fonction est appelée par fairlight_audio.js.
 * @param {number} cc - Numéro du contrôleur (0 ou 1).
 * @param {number} normVal - Valeur normalisée [0.0 - 1.0].
 */
export function updateSyncBuffer(cc, normVal) {
    if (cc === 0) {
        syncBuffer.pan = normVal;
    } else if (cc === 1) {
        syncBuffer.lowEQ = normVal;
    }
    // console.log(`[SYNC BRIDGE] Buffer mis à jour: Pan=${syncBuffer.pan.toFixed(2)}`);
}


// =======================================================
// 2. LOGIQUE D'ENVOI (SYNCHRONE/ASYCHRONE)
// =======================================================

/**
 * ⚛️ Déclenche l'envoi des signaux bufferisés vers l'API de logique Quantique.
 * Cette fonction agit comme la passerelle de "synchronisation".
 * @param {string} source - 'CC0', 'CC1', ou 'M1' (pour le logging).
 */
export function sendBufferedSignalsToQuantum(source) {
    if (typeof QUANTUM_API !== 'function') {
        // Fallback si quantum_logique.js n'est pas encore prêt ou n'a pas exposé l'API.
        return; 
    }
    
    // 1. Envoyer le CC0 (Pan/Phase)
    QUANTUM_API(0, syncBuffer.pan);
    
    // 2. Envoyer le CC1 (LowEQ/Entanglement)
    QUANTUM_API(1, syncBuffer.lowEQ);
    
    console.log(`[SYNC BRIDGE] Signals envoyés à Q-Logique : Pan, EQ Low. (Déclencheur: ${source})`);
}

// 🛑 Exportation du buffer pour le monitoring si besoin
export { syncBuffer };