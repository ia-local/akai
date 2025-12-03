// Logique du Tableau de Bord MIDI pour visualiser l'état des Contrôles Continus
// Se connecte au serveur Node.js via Socket.IO

const socket = io();

// Mappings du serveur (pour la documentation côté client)
const CC_CONFIG = {
    0: { label: 'Cursor X (X)', variable: 'cursor_x', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false },
    1: { label: 'Cursor Y (Y)', variable: 'cursor_y', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Curseur 3D (Boucle)', isAngular: false },
    2: { label: 'Cursor Z (Échelle)', variable: 'cursor_z', mode: 'Relatif', step: 0.05, min: 0.5, max: 1.2, unit: '', target: 'Profondeur / Échelle (Clip)', isAngular: false },
    3: { label: 'Chroma Angle', variable: 'av_chroma_angle', mode: 'Relatif', step: 5, min: 0, max: 360, unit: '°', target: 'Cercle Chromatique / Rotation', isAngular: true },
    4: { label: 'Saturation', variable: 'av_saturation', mode: 'Absolu', min: 0, max: 1.0, unit: '', target: 'Couleur / Saturation Globale', isAngular: false },
    5: { label: 'Caméra Rotation', variable: 'av_param_1', mode: 'Relatif', step: 10, min: 0, max: 360, unit: '°', target: 'Position Caméra', isAngular: true },
    6: { label: 'Effet Index', variable: 'av_param_2', mode: 'Relatif', step: 1, min: 0, max: 10, unit: '', target: 'Sélection de Preset AV (Boucle)', isAngular: false },
    7: { label: 'Vitesse Animation', variable: 'av_param_3', mode: 'Relatif', step: 2, min: 0, max: 100, unit: '%', target: 'Vitesse de Rotation/Tempo (Clip)', isAngular: false },
};

const knobState = {}; // État actuel des valeurs des Knobs
let currentBank = 'A';
let allBanksData = {}; // Données des pads reçues du serveur

// ⬅️ Ordre de rendu MPC (pour que Pad 0/1 soit en bas à gauche)
const MPC_RENDER_ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];


// --- Fonctions d'Initialisation et de Rendu des Knobs (inchangé) ---

function generateKnobCard(ccId, config) {
    const { label, variable, mode, step, min, max, unit, target, isAngular } = config;
    
    return `
        <div id="cc-card-${ccId}" class="bg-card-dark p-4 rounded-lg border border-gray-700 hover:border-midi-green transition duration-200 flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold text-white">CC ${ccId}: ${label}</h3>
                    <span class="mode-tag ${mode.toLowerCase()}">${mode}</span>
                </div>
                <p class="text-xs text-gray-500 mb-2">${target}</p>
                <p class="text-sm font-mono text-gray-300">Valeur Actuelle: <span id="val-${ccId}" class="font-bold text-midi-green">0.00</span>${unit}</p>
            </div>

            <div class="mt-4">
                <!-- Visualisation -->
                ${!isAngular ? `
                    <!-- Barre de progression pour les valeurs linéaires -->
                    <div class="w-full h-2 bg-gray-700 rounded-full">
                        <div id="bar-${ccId}" class="h-2 knob-indicator bg-midi-red rounded-full" style="width: 0%"></div>
                    </div>
                ` : `
                    <!-- Anneau pour les valeurs angulaires -->
                    <div class="flex justify-center items-center h-16 w-16 mx-auto">
                        <div class="ring-bg w-full h-full p-1">
                            <div id="ring-container-${ccId}" class="ring-indicator-container">
                                <div class="ring-dot" style="background-color: hsl(${ccId === '3' ? 'var(--chroma-hue, 0)' : '200'}, 80%, 50%);" id="indicator-${ccId}"></div>
                            </div>
                        </div>
                    </div>
                `}

                <p class="text-xs text-gray-500 mt-2">Plage: ${min}${unit} à ${max}${unit}${mode === 'Relatif' ? ` (Step: ${step})` : ''}</p>
            </div>
        </div>
    `;
}

function renderKnobCards() {
    const grid = document.getElementById('knob-grid');
    grid.innerHTML = '';
    Object.entries(CC_CONFIG).forEach(([ccId, config]) => {
        grid.innerHTML += generateKnobCard(ccId, config);
        knobState[ccId] = 0; // Initialiser l'état
    });
    
    setupModalListeners(); 
    requestPadData(); 
}

// --- Fonctions de Mise à Jour en Temps Réel des Knobs (inchangé) ---

function updateKnobDisplay(ccId, value) {
    const config = CC_CONFIG[ccId];
    if (!config) return;

    const { min, max, isAngular, unit } = config;

    // 1. Mettre à jour la valeur numérique
    const valSpan = document.getElementById(`val-${ccId}`);
    if (valSpan) {
        valSpan.textContent = value.toFixed(unit === '%' || unit === '°' || ccId === '6' ? 0 : 2);
    }

    // 2. Mise à jour de la visualisation
    if (isAngular) {
        // Pour les valeurs angulaires (CC 3 et CC 5), utiliser la rotation
        const angle = value; 
        
        const ringContainerEl = document.getElementById(`ring-container-${ccId}`);
        if (ringContainerEl) {
            ringContainerEl.style.transform = `rotate(${angle}deg)`;
        }
        
        // Synchronisation de la couleur pour le CC 3 (Chroma)
        if (ccId === '3') {
            document.documentElement.style.setProperty('--chroma-hue', value);
            const dotEl = document.getElementById(`indicator-${ccId}`);
            if (dotEl) {
                 dotEl.style.backgroundColor = `hsl(${value}, 80%, 50%)`;
            }
        }

    } else {
        // Pour les valeurs linéaires (Barre de progression)
        const range = max - min;
        const normalizedValue = (value - min) / range;
        const percent = Math.min(100, Math.max(0, normalizedValue * 100));
        
        const barEl = document.getElementById(`bar-${ccId}`);
        if (barEl) {
            barEl.style.width = `${percent}%`;
        }
    }
}

// --- NOUVEAU: Fonctions Modal et Pagination PAD ---

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
    document.getElementById('open-pad-modal').addEventListener('click', () => {
        showModal('pad-mapping-modal');
        renderPadBank(currentBank);
    });

    document.getElementById('close-pad-modal').addEventListener('click', () => {
        hideModal('pad-mapping-modal');
    });

    // Pagination (changement de banque)
    document.querySelectorAll('.bank-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const bank = e.target.dataset.bank;
            currentBank = bank;
            renderPadBank(bank);
        });
    });
}

function generatePadItem(pad, index, bankLetter) {
    // index est l'index de l'array de données (0-15)
    // ⬅️ CORRECTION BASE MIDI: Utiliser les valeurs précises (36, 52, 68) basées sur le serveur
    const midiBase = (bankLetter === 'A' ? 36 : bankLetter === 'B' ? 52 : 68); 
    const midiNoteRaw = midiBase + index; 
    const padNumber = index + 1; // Pad 1 à 16

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
    const padGrid = document.getElementById('active-pad-grid');
    padGrid.innerHTML = '';
    
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
        
        // ⬅️ Utiliser l'ordre de rendu MPC
        MPC_RENDER_ORDER.forEach(index => {
            const pad = data[index]; 
            padGrid.innerHTML += generatePadItem(pad, index, bankLetter);
        });

    } else {
        padGrid.innerHTML = `<p class="text-gray-400 col-span-4 text-center">En attente des données de la Banque ${bankLetter}...</p>`;
    }
}

function requestPadData() {
    // Envoi de la requête de données PADs au serveur (se produit une fois au démarrage du dashboard)
    socket.emit('request_all_pad_data'); 
}

// --- GESTION DES CONNEXIONS SOCKET.IO ---

// Écoute des événements de connexion/déconnexion (inchangé)
socket.on('connect', () => {
    const statusEl = document.getElementById('socket-status');
    statusEl.textContent = 'Connecté';
    statusEl.classList.remove('bg-gray-600', 'bg-midi-red');
    statusEl.classList.add('bg-midi-green');
});

socket.on('disconnect', () => {
    const statusEl = document.getElementById('socket-status');
    statusEl.textContent = 'Déconnecté';
    statusEl.classList.remove('bg-midi-green');
    statusEl.classList.add('bg-midi-red');
});

// Écoute des mises à jour des Knobs du serveur (CC 0 à CC 7) (inchangé)
Object.keys(CC_CONFIG).forEach(ccId => {
    const variableName = CC_CONFIG[ccId].variable;
    
    socket.on(`/controls/${variableName}`, (value) => {
        knobState[ccId] = value;
        updateKnobDisplay(ccId, value);
    });
});

// ⬅️ Écoute des données complètes des PADs envoyées par le serveur
socket.on('all_pad_data', (data) => {
    allBanksData = data;
    renderPadBank(currentBank); // Re-rendre la banque active avec les données
});

// Écoute des triggers de PAD (pour la démo visuelle)
socket.on('/pad/trigger', (data) => {
    // ⬅️ CRITIQUE : Conversion en Chaîne de la Note MIDI pour le sélecteur
    const noteIdString = String(data.midi_note_raw); 
    
    // 1. Flash de la carte CC 3 (Chroma) pour illustrer la synchronisation Pad/CC
    const ccId = '3';
    const cardEl = document.getElementById(`cc-card-${ccId}`);
    if (cardEl) {
        cardEl.classList.add('ring-2', 'ring-red-400', 'scale-105');
        setTimeout(() => {
            cardEl.classList.remove('ring-2', 'ring-red-400', 'scale-105');
        }, 250); 
    }

    // 2. Flash du pad actif DANS LE MODAL (conditionnel à l'ouverture)
    const modal = document.getElementById('pad-mapping-modal');
    if (modal && modal.classList.contains('active')) {
        
        // ⬅️ DÉTECTION ROBUSTE : Recherche ciblée sur la grille active avec la chaîne de Note MIDI.
        const padItem = document.querySelector(`#active-pad-grid .pad-item[data-note-id="${noteIdString}"]`);
        
        if (padItem) {
            padItem.classList.add('active');
            setTimeout(() => {
                padItem.classList.remove('active');
            }, 250);
        } else {
            console.warn(`Pad item not found in current bank (${currentBank}) for MIDI Note: ${noteIdString}.`);
        }
    }
});


// --- Démarrage ---
window.onload = renderKnobCards;