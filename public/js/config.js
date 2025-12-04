/**
 * MODULE config.js (VERSION COMPLÈTE & STABLE)
 * Gère la connexion Socket.IO, l'instanciation de MidiInput, 
 * et la visualisation en temps réel du Mappage MIDI (Knobs & Pads).
 * * NOTE: La logique onPad a été corrigée pour gérer les cas où 'velocity' est undefined 
 * en utilisant un basculement d'état (toggle) pour le feedback visuel.
 */

import { MidiInput } from './core/MidiInput.js'; 

const socket = io('http://localhost:3145'); // Connexion au serveur Studio AV

// =================================================================
// 1. ÉLÉMENTS DU DOM & UTILS
// =================================================================

const midiStatusDot = document.getElementById('midi-status-dot');
const btnSave = document.getElementById('btn-save-config');
const snapInput = document.getElementById('conf-snap');
const snapValueSpan = document.getElementById('snap-val');

function getKnobIndicator(cc) {
    const knobContainer = document.querySelector(`.knob[data-cc="${cc}"]`);
    return knobContainer ? knobContainer.querySelector('.knob-indicator') : null;
}

function getPadElement(note) {
    // Sélectionne le Pad basé sur l'attribut data-note du HTML
    return document.querySelector(`.pad[data-note="${note}"]`);
}

// =================================================================
// 2. GESTION DE LA CONNEXION & DU STATUT
// =================================================================

function updateMidiStatus(isConnected) {
    if (!midiStatusDot) return;
    if (isConnected) {
        midiStatusDot.classList.remove('bg-red-500');
        midiStatusDot.classList.add('bg-green-500');
    } else {
        midiStatusDot.classList.remove('bg-green-500');
        midiStatusDot.classList.add('bg-red-500');
    }
}

socket.on('connect', () => {
    console.log('[Socket.IO] Connecté. ✅');
    updateMidiStatus(true);
});

socket.on('disconnect', () => {
    console.warn('[Socket.IO] Déconnecté. ❌');
    updateMidiStatus(false);
});

// Réception de l'état initial du serveur
socket.on('init_state', (state) => {
    console.log('[Socket.IO] État initial reçu.');
    // Vous pouvez ici mettre à jour les valeurs des inputs HTML avec l'état 'state'
    if (snapInput && state.magnetismSnap) snapInput.value = state.magnetismSnap;
    if (snapValueSpan && state.magnetismSnap) snapValueSpan.textContent = `${state.magnetismSnap}%`;
    // ... Mettre à jour les autres champs ici (midiSens, qLayers, etc.)
});


// =================================================================
// 3. LOGIQUE MIDI (Instanciation et Rendu Visuel)
// =================================================================

const midiInput = new MidiInput(socket, {
    
    // --- KNOB (CC) VISUALIZATION ---
    onKnob: (cc, normVal, rawVal) => {
        // Le log confirme que 'normVal' et 'rawVal' sont bien reçus et gérés
        console.log(`[MIDI-CC] CC:${cc} | Norm:${normVal.toFixed(2)} | Raw:${rawVal}`);

        const indicator = getKnobIndicator(cc);
        if (indicator) {
            // Mise à jour de la rotation (-135deg à +135deg)
            const rotation = -135 + (normVal * 270);
            indicator.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            // Feedback visuel (active-flash)
            const knobContainer = indicator.closest('.knob');
            knobContainer.classList.add('active-flash');
            setTimeout(() => {
                knobContainer.classList.remove('active-flash');
            }, 100); 
            
            // Mise à jour du label
            const label = knobContainer.querySelector('.control-label');
            if (label) label.textContent = `K${cc + 1} (${(normVal * 100).toFixed(0)}%)`;
        }
    },

    // --- PAD (Note) VISUALIZATION (LOGIQUE DE SECOURS STABLE) ---
    onPad: (note, velocity) => {
        // Log mis à jour pour mieux montrer l'état de la vélocité
        console.log(`[MIDI-PAD] Note:${note} | Vel:${velocity === undefined ? 'UNDEFINED' : velocity}`); 
        
        const padElement = getPadElement(note);
        if (!padElement) return;
        
        let isNoteOn = false;

        if (typeof velocity !== 'undefined') {
            // Logique MIDI standard: Note ON si velocity > 0
            isNoteOn = velocity > 0;
        } else {
            // CORRECTION ANTI-PLANTAGE: Si la vélocité est manquante, nous basculons l'état.
            // Cela garantit que chaque Pad s'allume et s'éteint visiblement.
            isNoteOn = !padElement.classList.contains('active-pad-trigger');
        }

        if (isNoteOn) { 
            padElement.classList.add('active-pad-trigger');
        } else { 
            padElement.classList.remove('active-pad-trigger');
        }
    }
});


// =================================================================
// 4. LOGIQUE UI COMPLÉMENTAIRE (Sauvegarde/Champs)
// =================================================================

// Gestion de la sauvegarde
if (btnSave) {
    btnSave.addEventListener('click', () => {
        console.log("💾 Tentative de Sauvegarde de la Configuration...");
        
        const configData = {
            baseFramerate: document.getElementById('conf-fps')?.value, 
            magnetismSnap: snapInput?.value, 
            maxQLayers: document.getElementById('conf-q-layers')?.value,
            renderBackend: document.getElementById('conf-q-backend')?.value, 
            midiSens: document.getElementById('conf-midi-sens')?.value,
            midiChannel: document.getElementById('conf-midi-ch')?.value,
            padThreshold: document.getElementById('conf-pad-thresh')?.value,
        };
        
        // Envoi au serveur (nécessite l'implémentation de /api/config/save dans server.js)
        fetch('/api/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                 btnSave.textContent = "SAUVEGARDÉ !";
                 btnSave.className = "bg-green-600 px-4 py-1 rounded text-white text-xs font-bold border border-green-400 transition-all active:scale-95 shadow-lg shadow-green-900/20";
                 setTimeout(() => {
                     btnSave.className = "bg-blue-600 px-4 py-1 rounded text-white text-xs hover:bg-blue-500 font-bold border border-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-900/20";
                     btnSave.textContent = "SAUVEGARDER";
                 }, 1500);
            } else {
                console.error("Erreur de sauvegarde:", data.log);
            }
        })
        .catch(e => {
            console.error("Erreur réseau lors de la sauvegarde:", e);
        });
    });
}

// Mise à jour de l'affichage du Snap Range (Magnetism)
if (snapInput && snapValueSpan) {
    // Initialisation
    snapValueSpan.textContent = `${snapInput.value}%`;
    snapInput.addEventListener('input', (e) => {
        snapValueSpan.textContent = `${e.target.value}%`;
    });
}

console.log('✅ config.js Initialisé. Rendu MIDI opérationnel.');