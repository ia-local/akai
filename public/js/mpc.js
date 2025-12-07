// public/js/mpc.js - Logique du Tableau de Bord Visuel MPD218
// Gère l'affichage des 6 Knobs visibles (CC 0-5) et les Pads (Banques A, B, C: 0-47).

const socket = io();

// =================================================================
// 1. CONFIGURATION GLOBALE
// =================================================================

/**
 * Mappings du Contrôle Continu (CC) avec leurs rôles, valeurs par défaut et visuels.
 * Note : Seuls CC 0-5 sont mappés aux visuels de Knob dans le HTML, 
 * mais CC 6 et 7 sont suivis pour la logique serveur.
 */
const CC_CONFIG = {
    // Knobs Physiques (Visuel et Fonctionnel)
    0: { label: 'Cursor X (X)', variable: 'cursor_x', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    1: { label: 'Cursor Y (Y)', variable: 'cursor_y', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    2: { label: 'Cursor Z (Échelle)', variable: 'cursor_z', mode: 'Relatif', step: 0.05, min: 0.5, max: 1.2, unit: '', target: 'Profondeur / Échelle (Clip)', isAngular: false, initialAngle: 135, angleRange: 270 },
    3: { label: 'Chroma Angle', variable: 'av_chroma_angle', mode: 'Relatif', step: 5, min: 0, max: 360, unit: '°', target: 'Cercle Chromatique / Rotation', isAngular: true, initialAngle: 0, angleRange: 360 },
    4: { label: 'Saturation', variable: 'av_saturation', mode: 'Absolu', min: 0, max: 1.0, unit: '', target: 'Couleur / Saturation Globale', isAngular: false, initialAngle: 135, angleRange: 270 },
    5: { label: 'Caméra Rotation', variable: 'av_param_1', mode: 'Relatif', step: 10, max: 360, min: 0, unit: '°', target: 'Position Caméra', isAngular: true, initialAngle: 0, angleRange: 360 },
    
    // Knobs Logiques (Fonctionnel, sans visuel de Knob dédié sur l'interface)
    6: { label: 'Effet Index (CC 6)', variable: 'av_param_2', mode: 'Relatif', step: 1, min: 0, max: 10, unit: '', target: 'Sélection de Preset AV (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    7: { label: 'Vitesse (CC 7)', variable: 'av_param_3', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Vitesse de Rotation/Tempo (Clip)', isAngular: false, initialAngle: 135, angleRange: 270 },
};

const knobState = {};
let currentBank = 'A';

/**
 * Initialisation des données des pads avec une configuration par défaut (A, B, C)
 * si le serveur n'a pas encore envoyé les données initiales.
 */
let allBanksData = loadDefaultPadData(); 

// Ordre de rendu MPC (pour que Pad 1 soit en bas à gauche de la grille 4x4)
const MPC_RENDER_ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];


// =================================================================
// 2. FONCTIONS DE GESTION DE DONNÉES ET D'UTILE
// =================================================================

/**
 * Détermine la note MIDI de base pour une banque donnée (A=0, B=16, C=32).
 * @param {string} bankLetter - La lettre de la banque ('A', 'B', 'C').
 * @returns {number} La note MIDI de départ.
 */
function getPadMidiBase(bankLetter) {
    // Base 0 (A), 16 (B), 32 (C)
    return (bankLetter === 'A' ? 0 : bankLetter === 'B' ? 16 : 32); 
}

/**
 * Fournit une configuration de pads par défaut pour les trois banques.
 * Cette configuration est essentielle pour l'affichage initial côté client.
 * @returns {object} Structure des données des trois banques.
 */
function loadDefaultPadData() {
    // 16 pads standard pour la Banque A (MIDI 0 à 15)
    const bankA = Array.from({ length: 16 }, (_, i) => ({
        source: `Sample ${i + 1}`,
        note: `Pad A${i + 1} / MIDI ${i}` 
    }));
    
    // 16 pads de contrôle Q-Quantique/Synchrone pour la Banque B (MIDI 16 à 31)
    const bankB = [
        // Actions Quantiques/Tenseur
        { "source": "Q-SYNC", "note": "Sync Master On/Off" },
        { "source": "Q-TRIG", "note": "Trigger Quantique (Clip)" },
        { "source": "Q-SPACE", "note": "Capture du Tenseur CC" },
        { "source": "Q-LFO", "note": "LFO Quantique (Freq)" },
        
        // Modes & Macros
        { "source": "MODE", "note": "Mode Scene Suivant" },
        { "source": "MODE", "note": "Mode Scene Précédent" },
        { "source": "MACRO", "note": "Macro EQ A-B" },
        { "source": "MACRO", "note": "Macro Vizu C-D" },
        
        // Effets & Filtres
        { "source": "FX", "note": "FX Bus 1 Toggle" },
        { "source": "FX", "note": "FX Bus 2 Toggle" },
        { "source": "FILTER", "note": "Filter Cutoff Up" },
        { "source": "FILTER", "note": "Filter Cutoff Down" },

        // Transport
        { "source": "TRANSPORT", "note": "Play/Pause" },
        { "source": "TRANSPORT", "note": "Record" },
        { "source": "TRANSPORT", "note": "Stop (Reset)" },
        { "source": "FREE", "note": "Pad B16 Libre" }
    ];

    // 16 pads libres pour la Banque C (MIDI 32 à 47)
    const bankC = Array.from({ length: 16 }, (_, i) => ({
        source: "FREE",
        note: `Pad C${i + 1} disponible`
    }));

    return {
        'BANK_A': bankA,
        'BANK_B': bankB,
        'BANK_C': bankC
    };
}


// =================================================================
// 3. RENDU DE L'INTERFACE UTILISATEUR
// =================================================================

/**
 * Met à jour la valeur numérique et la rotation visuelle du Knob.
 * Gère les CC 0-5 (visuel) et CC 6-7 (numérique).
 * @param {string} ccId - L'ID du CC (0 à 7).
 * @param {number} value - La valeur absolue du CC (ex: 127 pour MIDI, 360 pour angle).
 */
function updateKnobDisplay(ccId, value) {
    const config = CC_CONFIG[ccId];
    if (!config) return;

    const { min, max, isAngular, initialAngle, angleRange, unit } = config;
    
    // 1. Mise à jour de la valeur numérique (span sous le knob)
    const valSpan = document.getElementById(`val-${ccId}`);
    if (valSpan) {
        let formattedValue;
        
        // Logique de formatage des décimales basée sur les étapes
        if (unit === '°' || unit === '%') {
             formattedValue = value.toFixed(0);
        } else if (config.step === 0.05) { 
             formattedValue = value.toFixed(2);
        } else {
             formattedValue = value.toFixed(2);
        }
        valSpan.textContent = formattedValue + unit;
    }

    // 2. Rotation Visuelle (uniquement pour les Knobs 0 à 5)
    if (ccId >= 0 && ccId <= 5) {
        const knobLineEl = document.getElementById(`knob-line-${ccId}`);
        if (knobLineEl) {
            let rotationAngle;
            
            if (isAngular && angleRange === 360) {
                // CC 3, 5 : Rotation 360°
                rotationAngle = value;
            } else {
                // CC 0, 1, 2, 4 : Rotation limitée 270° (Potentiomètre standard)
                const range = max - min;
                const normalized = (value - min) / range; // 0 à 1
                rotationAngle = initialAngle + (normalized * angleRange); 
            }

            knobLineEl.style.transform = `rotate(${rotationAngle}deg)`;
        }
    }
}

/**
 * Génère le HTML pour un seul Pad, pour l'affichage visuel ou le modal.
 * @param {object} pad - Les données du pad ({source, note}).
 * @param {number} index - L'index du pad (0 à 15).
 * @param {string} bankLetter - La lettre de la banque ('A', 'B', 'C').
 * @param {boolean} isModal - Vrai si le rendu est pour le modal de mappage.
 * @returns {string} Le fragment HTML.
 */
function generatePadItemDisplay(pad, index, bankLetter, isModal = false) {
    const midiBase = getPadMidiBase(bankLetter); 
    const midiNoteRaw = midiBase + index; 
    const padNumber = index + 1;
    const isActiveBank = bankLetter === currentBank;
    
    // Affichage Visuel Principal
    if (!isModal) {
        return `
            <div id="pad-visuel-${midiNoteRaw}" class="pad-item-display ${!isActiveBank ? 'opacity-50' : ''}">
                <span class="text-xs">${pad.source ? pad.source.toUpperCase() : 'FREE'}</span>
                <span class="text-2xs text-gray-400">PAD ${bankLetter}${padNumber}</span>
            </div>
        `;
    }
    
    // Affichage Détaillé dans le Modal
    return `
        <div class="pad-item" data-note-id="${midiNoteRaw}">
            <span class="text-xs font-mono text-gray-500">Note ${midiNoteRaw} | Index: ${index}</span>
            <strong class="text-md font-bold text-white mt-1">PAD ${bankLetter}${padNumber}</strong>
            <span class="text-sm text-midi-green">${pad.source ? pad.source.toUpperCase() : 'NO SOURCE'}</span>
            <span class="text-xs text-gray-300 truncate">${pad.note ? pad.note : 'N/A'}</span>
        </div>
    `;
}

/**
 * Rend les 16 pads de la banque sélectionnée (visuel principal et modal).
 * @param {string} bankLetter - La lettre de la banque ('A', 'B', 'C').
 */
function renderPadBank(bankLetter) {
    const padGridModal = document.getElementById('active-pad-grid'); 
    const padGridVisuel = document.getElementById('active-pad-grid-visuel'); 
    
    if (padGridModal) padGridModal.innerHTML = '';
    if (padGridVisuel) padGridVisuel.innerHTML = '';
    
    const data = allBanksData[`BANK_${bankLetter}`];
    
    // Mise à jour de l'indicateur de banque (ex: BANK A)
    const styleDisplay = document.getElementById('style-display');
    if (styleDisplay) {
        styleDisplay.textContent = `BANK ${bankLetter}`;
    }

    // Mise à jour des boutons de pagination du modal (pour l'état actif/inactif)
    document.querySelectorAll('.bank-button').forEach(button => {
        button.classList.remove('bg-midi-blue');
        button.classList.add('bg-gray-700');
        if (button.dataset.bank === bankLetter) {
            button.classList.remove('bg-gray-700');
            button.classList.add('bg-midi-blue');
        }
    });

    if (data && Array.isArray(data) && data.length === 16) {
        
        MPC_RENDER_ORDER.forEach(index => {
            const pad = data[index]; 
            
            // Rendu pour le Modal
            if (padGridModal) {
                padGridModal.innerHTML += generatePadItemDisplay(pad, index, bankLetter, true);
            }
            
            // Rendu pour le Visuel Principal (uniquement si c'est la banque courante)
            if (padGridVisuel && bankLetter === currentBank) {
                 padGridVisuel.innerHTML += generatePadItemDisplay(pad, index, bankLetter, false);
            }
        });
    }
    
    // Rendu des placeholders si les données sont manquantes pour garantir la grille 4x4
    if (padGridVisuel && padGridVisuel.innerHTML === '' && bankLetter === currentBank) {
        for (let i = 0; i < 16; i++) {
             padGridVisuel.innerHTML += `<div class="pad-item-display">
                 <span class="text-xs text-gray-600">WAITING</span>
                 <span class="text-2xs text-gray-700">PAD ${bankLetter}${i + 1}</span>
             </div>`;
        }
    }
}

/**
 * Initialise l'état de l'interface au chargement.
 */
function renderInitialState() {
    // Initialise les 8 Knobs (CC 0-7) à leur valeur min/initiale.
    Object.keys(CC_CONFIG).forEach(ccId => { 
        const config = CC_CONFIG[ccId];
        const initialValue = config.isAngular ? config.initialAngle : config.min; 
        updateKnobDisplay(ccId, initialValue); 
    });

    // Rendre la grille des pads initiale (Banque A par défaut)
    renderPadBank(currentBank);
}


// =================================================================
// 4. LOGIQUE MODAL ET ÉCOUTEURS DOM
// =================================================================

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Met en place les écouteurs pour l'ouverture, la fermeture et la navigation par banque du modal.
 */
function setupModalListeners() {
    // Ouverture du modal via le bouton MAPPING
    const openButton = document.getElementById('open-pad-modal');
    if (openButton) {
        openButton.addEventListener('click', () => {
            showModal('pad-mapping-modal');
            renderPadBank(currentBank); // Assure que la banque est à jour
        });
    }

    // Fermeture du modal
    const closeButton = document.getElementById('close-pad-modal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            hideModal('pad-mapping-modal');
        });
    }

    // Changement de banque (A, B, C)
    document.querySelectorAll('.bank-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const bank = e.target.dataset.bank;
            currentBank = bank;
            // Rendre le visuel principal et le contenu du modal
            renderPadBank(bank); 
        });
    });
}


// =================================================================
// 5. GESTION DES COMMUNICATIONS SOCKET.IO
// =================================================================

/**
 * Demande les données des pads au serveur (pour la synchronisation initiale ou après déconnexion).
 */
function requestPadData() {
    socket.emit('request_all_pad_data'); 
}

// --- Événements de Connexion ---

socket.on('connect', () => {
    const statusEl = document.getElementById('socket-status');
    statusEl.textContent = 'CONNECTÉ';
    statusEl.classList.remove('text-midi-red');
    statusEl.classList.add('text-midi-green');
});

socket.on('disconnect', () => {
    const statusEl = document.getElementById('socket-status');
    statusEl.textContent = 'DÉCONNECTÉ';
    statusEl.classList.remove('text-midi-green');
    statusEl.classList.add('text-midi-red');
});

// --- Événements de Contrôle (Knobs) ---

// Écoute des mises à jour des Knobs (CC 0 à CC 7)
Object.keys(CC_CONFIG).forEach(ccId => {
    const variableName = CC_CONFIG[ccId].variable;
    
    // Le serveur envoie la valeur absolue, que nous passons à l'affichage.
    socket.on(`/controls/${variableName}`, (value) => {
        updateKnobDisplay(ccId, value);
    });
});

// --- Événements de Données de Pad ---

// Écoute des données complètes des PADs envoyées par le serveur
socket.on('all_pad_data', (data) => {
    // Met à jour les données de la banque, en gardant la valeur par défaut si le serveur est vide pour cette banque.
    allBanksData = { 
        'BANK_A': data.BANK_A || allBanksData.BANK_A,
        'BANK_B': data.BANK_B || allBanksData.BANK_B, 
        'BANK_C': data.BANK_C || allBanksData.BANK_C, 
    };
    // Rend la banque actuelle avec les nouvelles données
    renderPadBank(currentBank);
});

// Écoute des triggers de PAD (pour la démo visuelle du flash)
socket.on('/pad/trigger', (data) => {
    const noteIdString = String(data.midi_note_raw); 
    
    // 1. Flash du Pad Visuel Principal
    const padVisuelEl = document.getElementById(`pad-visuel-${noteIdString}`);
    if (padVisuelEl) {
        padVisuelEl.classList.add('active');
        setTimeout(() => {
            padVisuelEl.classList.remove('active');
        }, 150);
    }

    // 2. Flash du Pad dans le Modal (si ouvert)
    const modal = document.getElementById('pad-mapping-modal');
    if (modal && modal.classList.contains('active')) {
        const padItem = document.querySelector(`#active-pad-grid .pad-item[data-note-id="${noteIdString}"]`);
        
        if (padItem) {
            padItem.classList.add('active-modal');
            setTimeout(() => {
                padItem.classList.remove('active-modal');
            }, 150);
        }
    }
});


// =================================================================
// 6. POINT D'ENTRÉE
// =================================================================

window.onload = () => {
    renderInitialState();
    setupModalListeners();
    requestPadData(); // Tente de synchroniser les données avec le serveur
};