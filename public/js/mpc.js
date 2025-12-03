// Logique du Tableau de Bord Visuel MPD218
// Gère l'affichage des 6 Knobs visibles (CC 0-5) et les Pads.

const socket = io();

// Mappings du serveur (pour la documentation côté client)
const CC_CONFIG = {
    // 6 Knobs visibles (CC 0-5) mappés aux rôles AV
    0: { label: 'Cursor X (X)', variable: 'cursor_x', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    1: { label: 'Cursor Y (Y)', variable: 'cursor_y', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    2: { label: 'Cursor Z (Échelle)', variable: 'cursor_z', mode: 'Relatif', step: 0.05, min: 0.5, max: 1.2, unit: '', target: 'Profondeur / Échelle (Clip)', isAngular: false, initialAngle: 135, angleRange: 270 },
    3: { label: 'Chroma Angle', variable: 'av_chroma_angle', mode: 'Relatif', step: 5, min: 0, max: 360, unit: '°', target: 'Cercle Chromatique / Rotation', isAngular: true, initialAngle: 0, angleRange: 360 },
    4: { label: 'Saturation', variable: 'av_saturation', mode: 'Absolu', min: 0, max: 1.0, unit: '', target: 'Couleur / Saturation Globale', isAngular: false, initialAngle: 135, angleRange: 270 },
    5: { label: 'Caméra Rotation', variable: 'av_param_1', mode: 'Relatif', step: 10, max: 360, min: 0, unit: '°', target: 'Position Caméra', isAngular: true, initialAngle: 0, angleRange: 360 },
    // CC 6 et 7 sont logiques/virtuels et gérés par le serveur
    6: { label: 'Effet Index (CC 6)', variable: 'av_param_2', mode: 'Relatif', step: 1, min: 0, max: 10, unit: '', target: 'Sélection de Preset AV (Boucle)', isAngular: false, initialAngle: 135, angleRange: 270 },
    7: { label: 'Vitesse (CC 7)', variable: 'av_param_3', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Vitesse de Rotation/Tempo (Clip)', isAngular: false, initialAngle: 135, angleRange: 270 },
};

const knobState = {};
let currentBank = 'A';
let allBanksData = {};

// Ordre de rendu MPC (pour que Pad 1 soit en bas à gauche)
const MPC_RENDER_ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];


// --- UTILITY: Mappage de la Note MIDI pour le rendu ---
function getPadMidiBase(bankLetter) {
    // Base 0, 16, 32 confirmée par le diagnostic (Note 0 = Pad A1)
    return (bankLetter === 'A' ? 0 : bankLetter === 'B' ? 16 : 32); 
}

// --- RENDU DES KNOBS ---

function updateKnobDisplay(ccId, value) {
    const config = CC_CONFIG[ccId];
    if (!config) return;

    const { min, max, isAngular, initialAngle, angleRange, unit } = config;
    
    // 1. Mise à jour de la valeur numérique (affichée sous le knob)
    const valSpan = document.getElementById(`val-${ccId}`);
    if (valSpan) {
        valSpan.textContent = value.toFixed(unit === '°' || unit === '%' ? 0 : 2);
    }

    // 2. Rotation Visuelle du Knob (seulement pour les CC 0 à CC 5 qui sont visibles)
    if (ccId <= 5) {
        const knobLineEl = document.getElementById(`knob-line-${ccId}`);
        if (knobLineEl) {
            let rotationAngle;
            
            if (isAngular && angleRange === 360) {
                // Rotation 360° continue (CC 3, CC 5)
                rotationAngle = value;
            } else {
                // Rotation limitée 270° (Potentiomètre standard 7h à 5h)
                const range = max - min;
                const normalized = (value - min) / range; // 0 à 1
                
                // Calcul de l'angle: de 135deg (min) à 405deg (max)
                rotationAngle = initialAngle + (normalized * angleRange); 
            }

            knobLineEl.style.transform = `rotate(${rotationAngle}deg)`;
        }
    }
}

// --- RENDU DES PADS ---

function generatePadItemDisplay(pad, index, bankLetter, isModal = false) {
    const midiBase = getPadMidiBase(bankLetter); 
    const midiNoteRaw = midiBase + index; 
    const padNumber = index + 1;
    
    // Si c'est l'affichage visuel principal (non modal)
    if (!isModal) {
        return `
            <div id="pad-visuel-${midiNoteRaw}" class="pad-item-display">
                <span class="text-xs">${pad.source.toUpperCase()}</span>
                <span class="text-2xs text-gray-400">PAD ${padNumber}</span>
            </div>
        `;
    }
    
    // Si c'est l'affichage détaillé dans le modal
    return `
        <div class="pad-item" data-note-id="${midiNoteRaw}">
            <span class="text-xs font-mono text-gray-500">Note ${midiNoteRaw} | Index: ${index}</span>
            <strong class="text-md font-bold text-white mt-1">PAD ${bankLetter}${padNumber}</strong>
            <span class="text-sm text-midi-green">${pad.source ? pad.source.toUpperCase() : 'NO SOURCE'}</span>
            <span class="text-xs text-gray-300 truncate">${pad.note ? pad.note : 'N/A'}</span>
        </div>
    `;
}

function renderPadBank(bankLetter) {
    const padGridModal = document.getElementById('active-pad-grid'); // Modal
    const padGridVisuel = document.getElementById('active-pad-grid-visuel'); // Visuel
    
    if (padGridModal) padGridModal.innerHTML = '';
    if (padGridVisuel) padGridVisuel.innerHTML = '';
    
    const data = allBanksData[`BANK_${bankLetter}`];
    
    // Mettre à jour l'état des boutons de pagination
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
            
            // Rendu du Pad dans le Modal
            if (padGridModal) {
                padGridModal.innerHTML += generatePadItemDisplay(pad, index, bankLetter, true);
            }
            
            // Rendu du Pad Visuel (Contrôleur)
            if (padGridVisuel) {
                padGridVisuel.innerHTML += generatePadItemDisplay(pad, index, bankLetter, false);
            }
        });
    }
}

function renderInitialState() {
    // Rend initialement les 6 Knobs (CC 0-5) qui sont dans le HTML statique
    Object.keys(CC_CONFIG).slice(0, 6).forEach(ccId => { 
        const config = CC_CONFIG[ccId];
        // Initialiser l'angle/la valeur min
        const initialValue = config.isAngular ? config.initialAngle : config.min; 
        updateKnobDisplay(ccId, initialValue); 
    });

    // Rendre la grille des pads initiale (Banque A)
    renderPadBank(currentBank);
}

// --- LOGIQUE MODAL ET ÉCOUTEURS ---

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

function setupModalListeners() {
    const openButton = document.getElementById('open-pad-modal');
    if (openButton) {
        openButton.addEventListener('click', () => {
            showModal('pad-mapping-modal');
            renderPadBank(currentBank);
        });
    }

    const closeButton = document.getElementById('close-pad-modal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            hideModal('pad-mapping-modal');
        });
    }

    document.querySelectorAll('.bank-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const bank = e.target.dataset.bank;
            currentBank = bank;
            renderPadBank(bank);
        });
    });
}

function requestPadData() {
    socket.emit('request_all_pad_data'); 
}

// --- GESTION DES CONNEXIONS SOCKET.IO ---

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

// Écoute des mises à jour des Knobs (CC 0 à CC 7)
Object.keys(CC_CONFIG).forEach(ccId => {
    const variableName = CC_CONFIG[ccId].variable;
    
    socket.on(`/controls/${variableName}`, (value) => {
        // La valeur est déjà l'angle/la position absolue calculée par le serveur.
        updateKnobDisplay(ccId, value);
    });
});

// Écoute des données complètes des PADs envoyées par le serveur
socket.on('all_pad_data', (data) => {
    allBanksData = data;
    renderPadBank(currentBank);
});

// Écoute des triggers de PAD (pour la démo visuelle)
socket.on('/pad/trigger', (data) => {
    const noteIdString = String(data.midi_note_raw); 
    
    // 1. Flash du Pad Visuel Principal (Le contrôleur physique)
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
            padItem.classList.add('active');
            setTimeout(() => {
                padItem.classList.remove('active');
            }, 150);
        }
    }
});


// --- Démarrage ---
window.onload = () => {
    renderInitialState();
    setupModalListeners();
    requestPadData();
};