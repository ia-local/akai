/**
 * QUANTUM UI CONTROLLER (quantum_ui.js)
 * Gère l'éditeur de code, la visualisation et la communication serveur.
 */

// Importe les fonctions de logique quantique
import { runQScript, renderQubit } from './quantum_logique.js'; 
import { renderTwoBaseBits } from './quantum.js'; // 🛑 Rendu des deux bits de base (Exercice)
import { generateQubitBlock3D } from './qubit_tensor_processor.js'; // 🛑 Import du générateur 3D

// Déclarations TENSOR nécessaires pour la densité
const TENSOR_RENDER = {
    FILL_LIGHT: '░', FILL_MEDIUM: '▒', FILL_HEAVY: '▓', FILL_SOLID: '█', EMPTY_BLOCK: ' '
};

// Constantes pour le Canvas et Debug
const DEBUG_PROB_EL = document.getElementById('debug-prob');
const DEBUG_ENT_EL = document.getElementById('debug-ent');

// État du Qubit simulé (pour référence)
let qubitState = {
    amplitude0: Math.sqrt(0.5), 
    amplitude1: Math.sqrt(0.5), 
    phase: 0.0,
    entanglementLevel: 0.0 
};
// L'instance de QuantumComputeEngine devrait être créée par main.js
let quantumEngine;

const socket = io('http://localhost:3145');

// --- Déclarations Globales ---
const canvas = document.getElementById('webgl-canvas'); // Reste en global car utilisé dans resize
let statusIndicator;
let consoleOutput;
let editorElement; 
let time = 0;

// --- FONCTION DE REDIMENSIONNEMENT ---
function resize() {
    if (!canvas || !quantumEngine) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Vérifiez si resize est défini sur quantumEngine avant d'appeler
    if (typeof quantumEngine.resize === 'function') {
        quantumEngine.resize(parent.clientWidth, parent.clientHeight);
    }
}
window.addEventListener('resize', resize);


// --- BOUCLE DE RENDU ET LOGIQUE DE SYNCHRONISATION ---

function animate() {
    time += 0.01; 
    const knob_Y = 0.5;
    const currentQuantumIndex = window.quantumIndex || 1; 

    const placeholder = document.getElementById('player-placeholder');
    if (placeholder && placeholder.classList.contains('active')) {
        placeholder.classList.remove('active');
    }

    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (!canvas.classList.contains('quantum-active')) {
                canvas.classList.add('quantum-active');
            }
            
            // RENDU BASÉ SUR L'INDEX QUANTIQUE
            if (currentQuantumIndex === 1) { 
                renderTwoBaseBits(ctx);
                
            } else { 
                // MODE 2+ : SUPERPOSITION (Nécessite le moteur)
                if (quantumEngine && editorElement) { 
                    const inputVariables = { time, knob_Y };
                    const code = editorElement.value;
                    const newState = runQScript(code, inputVariables); 
                    
                    if (newState) {
                        quantumEngine.state.probability = newState.amplitude1 * newState.amplitude1;
                        quantumEngine.state.entanglement = newState.entanglementLevel;
                        quantumEngine.state.phase = newState.phase;
                    }
                }
                
                // Si le moteur n'est pas encore initialisé (fallback), renderQubit doit gérer l'absence d'état complexe.
                renderQubit(ctx); 
            }
        }
    }
    
    // Update Debug UI
    if (quantumEngine && quantumEngine.state) {
        document.getElementById('debug-phase').innerText = `PHASE: ${quantumEngine.state.phase.toFixed(3)}`;
        document.getElementById('debug-prob').innerText = `P(|1>): ${quantumEngine.state.probability.toFixed(3)}`;
        document.getElementById('debug-ent').innerText = `ENT: ${quantumEngine.state.entanglement.toFixed(3)}`;
    }

    requestAnimationFrame(animate);
}

// --- GESTION DU CODE ÉDITEUR (ASYNCHRONE vers IA) ---
/**
 * ⚛️ Visualise l'état de superposition en calculant la couleur et la densité 3D.
 */
export function visualizeQubitSuperposition() {
    const state = window.quantumEngine ? window.quantumEngine.state : qubitState; 

    const prob0 = state.probability; // Utiliser directement la probabilité de |1>
    const prob1 = 1.0 - prob0; 
    const entanglementLevel = state.entanglementLevel;

    // --- 1. Calcul de la Couleur (Fusion par Probabilité) ---
    // ... (Logique de fusion des couleurs inchangée) ...
    const color0 = quantumWavelengths['0'].color;
    const color1 = quantumWavelengths['1'].color;
    const fusedColor = {
        r: Math.round(color0.r * prob0 + color1.r * prob1),
        g: Math.round(color0.g * prob0 + color1.g * prob1),
        b: Math.round(color0.b * prob0 + color1.b * prob1)
    };
    
    // --- 2. Détermination de la Densité de la Texture 3D ---
    let textureChar;
    if (prob1 > 0.8) {
        textureChar = TENSOR_RENDER.FILL_SOLID; // Très probable |1>
    } else if (prob1 > 0.6) {
        textureChar = TENSOR_RENDER.FILL_HEAVY; 
    } else if (prob1 > 0.4) {
        textureChar = TENSOR_RENDER.FILL_MEDIUM; // Superposition
    } else {
        textureChar = TENSOR_RENDER.FILL_LIGHT; // Très probable |0>
    }

    // --- 3. Génération de l'ASCII Art 3D ---
    const fusedArt = generateQubitBlock3D(textureChar); // Utilise la densité calculée

    // --- 4. Mise à jour des débogages (pour le DOM) ---
    if (DEBUG_PROB_EL) DEBUG_PROB_EL.textContent = `P(|0>): ${prob0.toFixed(3)}`;
    if (DEBUG_ENT_EL) DEBUG_ENT_EL.textContent = `ENT: ${entanglementLevel.toFixed(3)}`;
    
    return {
        ascii: fusedArt,
        color: fusedColor,
        vibrationScale: 1.0 + (entanglementLevel * 0.5),
        probability: prob1, 
        entanglementLevel: entanglementLevel
    };
}


// La fonction executeCode est correcte, mais dépend de editorElement

async function executeCode() {
    // 🛑 Utiliser l'éditeur récupéré dans DOMContentLoaded
    const code = editorElement ? editorElement.value : "// Editor not found"; 
    
    // 1. UI Loading
    if (statusIndicator) statusIndicator.classList.remove('hidden');
    log("System", "Sending quantum formula to Neural Engine...");

    try {
        const payload = {
            history: [{ role: "user", content: `Analyse ce code conceptuel et extrais les paramètres 'entanglement', 'probability' et 'mood' pour le moteur graphique. Formate la réponse uniquement en JSON.` }],
            current_context: { code: code }
        };

        const response = await fetch('http://localhost:3145/api/ia/chatbot', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.success && data.result) {
            const ia_params = JSON.parse(data.result);

            log("AI", `Parameters received: P=${ia_params.probability}, E=${ia_params.entanglement}, Mood=${ia_params.mood}`);
            
            await fetch('http://localhost:3145/api/quantum/mutate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ia_params)
            });
            
            log("System", "Quantum State Updated by AI parameters.");
            
            // MISE À JOUR LOCALE DE L'ÉTAT DU MOTEUR
            if (quantumEngine) {
                quantumEngine.state.probability = parseFloat(ia_params.probability) || 0.5;
                quantumEngine.state.entanglement = parseFloat(ia_params.entanglement) || 0.0;
                quantumEngine.state.mood = ia_params.mood || "NEUTRAL";
            }
            
        } else {
            log("Error", "Compilation failed or AI returned invalid format.");
        }

    } catch (e) {
        log("Error", `Execution/API Error: ${e.message}`);
    } finally {
        if (statusIndicator) statusIndicator.classList.add('hidden');
    }
}

function log(source, message, type = 'INFO') {
    const consoleOutput = document.getElementById('quantum-log');
    if (!consoleOutput) return;

    const div = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    let colorClass = 'text-gray-300';
    let icon = '>';

    // Logique de couleur basée sur l'analogie quantique/énergétique
    if (type === 'MUTATION') {
        colorClass = 'text-purple-400 font-bold'; // Changement d'état majeur (Haute Énergie)
        icon = '⚡';
    } else if (type === 'ERROR') {
        colorClass = 'text-red-500'; // Décohérence
        icon = '🛑';
    } else if (type === 'MEASURE') {
        colorClass = 'text-yellow-500'; // Mesure/Observation (Effondrement)
        icon = '🔬';
    } else if (type === 'INIT') {
        colorClass = 'text-green-500'; // Initialisation (Énergie Basse/Stable)
        icon = '🟢';
    }
    
    div.innerHTML = `<span class="${colorClass}">${icon} [${timestamp}] ${source}: ${message}</span>`;
    
    // Ajout en haut de la console
    consoleOutput.prepend(div);
}
// --- PRESETS (Dépend maintenant de editorElement) ---
window.loadPreset = (type) => {
    let code = "";
    if (type === 'superposition') {
        code = `// Mode Superposition: 80% chance of |0> (Stable)
const prob = 0.8; 
const ent = 0.1;
return { probability: prob, entanglement: ent, mood: "CALM" };`;
    } else if (type === 'entanglement') {
        code = `// Mode Chaos: Equal Superposition (50%) + Max Entanglement
const prob = 0.5; 
const ent = 1.0; 
return { probability: prob, entanglement: ent, mood: "CHAOS" };`;
    } else if (type === 'interference') {
        code = `// Mode Interférence: Oscillation entre états
const prob = Math.sin(time * 0.5) * 0.4 + 0.5; // Oscille entre 10% et 90%
const ent = knob_Y * 0.5; 
return { probability: prob, entanglement: ent, mood: "GLITCH" };`;
    }
    
    if (editorElement) editorElement.value = code; // Utiliser editorElement
    log("System", `Loaded preset: ${type}`);
};

/**
 * Calcule et affiche les informations de dimension pour le mode quantique actuel (PAD 15).
 * @param {number} index - Index quantique actuel (1 à 8).
 */
function updateQuantumDimensionConsole(index) {
    if (!index || index < 1 || index > 8) return;

    // Mapping des informations de mode basées sur la structure de main.js
    let modeName;
    let dimensionDescription;
    let icon = '🌌';

    switch (index) {
        case 1:
            modeName = 'Standard (Bit de Base)';
            dimensionDescription = '1 Qubit (Dimension 2). Représentation Classique.';
            icon = '🟢';
            break;
        case 2:
            modeName = 'Z-Boost (Dessin Top)';
            dimensionDescription = 'Début de l\'espace de Hilbert (2 Qubits simulés, Dim 4).';
            icon = '🖌️';
            break;
        case 3:
            modeName = 'Fusion Overlay';
            dimensionDescription = 'Intrication simple. 3 Qubits simulés (Dim 8).';
            icon = '💫';
            break;
        case 4:
            modeName = 'Quantum Dominant';
            dimensionDescription = 'Mode de superposition complet. 4 Qubits simulés (Dim 16).';
            icon = '⚛️';
            break;
        case 5:
            modeName = 'Dimension Réservée V5';
            dimensionDescription = '5 Qubits (Dim 32). Préparation à la correction d\'erreur.';
            icon = '⚫';
            break;
        case 8:
            modeName = 'Dimension Réservée V8';
            dimensionDescription = '8 Qubits (Dimension 256). Pleine puissance de calcul.';
            icon = '⚫';
            break;
        default:
            modeName = `Dimension Réservée V${index}`;
            dimensionDescription = `${index} Qubits simulés (Dim ${Math.pow(2, index)}).`;
            icon = '⚫';
            break;
    }

    const consoleMessage = `MODE ACTIVÉ: ${modeName} - ${dimensionDescription}`;
    
    log("PAD 15", consoleMessage, "MUTATION"); // Utiliser la nouvelle signature MUTATION

    // Mise à jour de l'indicateur Qubits/Dimension dans le Header (si vous l'avez ajouté)
    const qubitsDisplay = document.getElementById('qubits-display');
    if (qubitsDisplay) {
         qubitsDisplay.textContent = `Qubits: ${index} | Dim: ${Math.pow(2, index)}`;
    }
}
// --- DÉMARRAGE DU MODULE (Zone d'attachement des écouteurs) ---
// --- DÉMARRAGE DU MODULE (Zone d'attachement des écouteurs) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Récupération SÉCURISÉE des éléments DOM (inchangée)
    statusIndicator = document.getElementById('async-status');
    consoleOutput = document.getElementById('quantum-log'); // ID corrigé pour la console
    editorElement = document.getElementById('code-editor');

    const sendCodeBtn = document.getElementById('send-code-btn');
    const compileBtn = document.getElementById('compile-btn');
    const runSimulationBtn = document.querySelector('.left-aside button:last-child'); 

    if (sendCodeBtn) sendCodeBtn.addEventListener('click', executeCode);
    if (compileBtn) compileBtn.addEventListener('click', executeCode);
    if (runSimulationBtn) runSimulationBtn.addEventListener('click', executeCode);

    // 2. Récupération de l'instance QuantumEngine (inchangée)
quantumEngine = window.quantumEngine; 
    
    if (quantumEngine) {
        log("System", "Quantum Engine instance found and attached from main.js.", "INIT");
    } else {
        log("Error", "Quantum Engine not found. Fallback mode active.", "ERROR");
    }
    
    // 4. 🛑 CORRECTION DU TIMING DE L'INDEX QUANTIQUE
    let lastQuantumIndex = window.quantumIndex || 1; // Initialiser l'état local

    // Mettre la minuterie en place pour détecter les changements MIDI
    setInterval(() => {
        // Seulement si window.quantumIndex est défini par main.js
        const currentQuantumIndex = window.quantumIndex; 

        if (currentQuantumIndex && currentQuantumIndex !== lastQuantumIndex) {
            // Un changement a eu lieu (PAD 15 a été pressé)
            updateQuantumDimensionConsole(currentQuantumIndex);
            lastQuantumIndex = currentQuantumIndex;
        }
    }, 200); // Vérifie 5 fois par seconde

    // 4. Lancer la boucle de rendu (inchangée)
    setTimeout(() => {
        resize();
        animate();
        // Charger le preset par défaut et initialiser l'affichage de dimension
        updateQuantumDimensionConsole(window.quantumIndex || 1); 
        window.loadPreset('superposition');
    }, 500);
});

/**
 * Logue les événements PAD (note on/off) dans la console Quantum.
 * Cette fonction est destinée à être appelée depuis main.js/MidiInput.
 * @param {number} note - Numéro du PAD pressé.
 * @param {number} velocity - Force de la frappe (0 pour Note OFF).
 */
window.logPadEvent = function(note, velocity) {
    if (velocity > 0) {
        // Log seulement les événements Note ON pour éviter l'encombrement
        let message = `PAD ${note} pressé. Déclenchement d'un événement quantique/Transport.`;
        let type = "MEASURE"; // L'appui sur un PAD est souvent une "Mesure" ou une "Action"
        
        // Logique spécifique pour les boutons importants (Transport/Quantum Index)
        if (note === 0) message = `PAD 0 (PLAY/STOP) actionné.`;
        if (note === 15) message = `PAD 15 (INDEX QUANTIQUE) pressé.`;
if (note === 0 || note === 36 || note === 48) {
            message = `PAD ${note} (TRANSPORT): Lecture/Pause (Déphasage Temporel).`;
            type = "MUTATION"; // Le changement d'état du transport est une mutation majeure
        } else if (note === 1 || note === 37 || note === 49) {
            message = `PAD ${note} (TRANSPORT): Arrêt. Effondrement de la boucle de temps.`;
            type = "MUTATION";
        } else if (note === 2 || note === 38 || note === 50) {
            message = `PAD ${note} (DESSIN): Début/Fin du trait vectoriel.`;
        } else if (note === 3 || note === 39 || note === 51) {
            message = `PAD ${note} (MODE): Bascule MODE EDIT/PERFORM.`;
        } else if (note === 4) {
            message = `PAD 4 (OUTIL): Sélection Pinceau SVG.`;
        } else if (note === 5) {
            message = `PAD 5 (OUTIL): Sélection Stamp ASCII (Tensor).`;
        } else if (note === 6) {
            message = `PAD 6 (OUTIL): Changement de Glyphe Tensor (Dim Réserve).`;
        } else if (note === 7) {
            message = `PAD 7 (OUTIL): Sélection Gomme.`;
        } else if (note === 15) {
            // Le PAD 15 est géré par la minuterie updateQuantumDimensionConsole, mais loguons l'action ici
            message = `PAD 15 (INDEX QUANTIQUE) pressé. Mode dimensionnel changé.`;
            type = "MUTATION";
        } else {
            message = `PAD ${note} pressé. Événement quantique non mappé.`;
            type = "INFO";
        }

        log("MIDI/PAD", message, type);
    }
}

/**
 * Logue les événements KNOB (potentiomètres) dans la console Quantum.
 * Cette fonction est destinée à être appelée depuis main.js/MidiInput.
 * @param {number} cc - Numéro du contrôleur (0-3 pour probabilité/entanglement).
 * @param {number} value - Valeur normalisée du contrôleur [0.0 - 1.0].
 */
window.logKnobEvent = function(cc, value) {
    // Nous loguons les CC 0 et CC 1 car ils contrôlent la probabilité et l'entanglement dans l'Aside
    if (cc === 0 || cc === 1) {
        const label = (cc === 0) ? 'Probability Field (CC 0)' : 'Entanglement Level (CC 1)';
        const valueString = (value * 100).toFixed(1) + '%';
        
        log("MIDI/KNOB", `${label} ajusté à ${valueString}.`, "INFO");
    }
}

function initQuantumUI() {
    // 1. Récupération SÉCURISÉE des éléments DOM (inchangée)
    statusIndicator = document.getElementById('async-status');
    consoleOutput = document.getElementById('quantum-log');
    editorElement = document.getElementById('code-editor');

    const sendCodeBtn = document.getElementById('send-code-btn');
    const compileBtn = document.getElementById('compile-btn');
    const runSimulationBtn = document.querySelector('.left-aside button:last-child'); 

    if (sendCodeBtn) sendCodeBtn.addEventListener('click', executeCode);
    if (compileBtn) compileBtn.addEventListener('click', executeCode);
    if (runSimulationBtn) runSimulationBtn.addEventListener('click', executeCode);

    // 2. 🛑 POLLING pour attendre window.quantumEngine de main.js
    let attempts = 0;
    const maxAttempts = 20; 
    let lastQuantumIndex = window.quantumIndex || 1; // Initialisé avant le polling
    
    // Lancer la boucle d'animation immédiatement pour le rendu des bits de base
    // Cela résout le problème de l'écran vide initial
    resize();
    animate();

    const checkEngine = setInterval(() => {
        
        if (window.quantumEngine) {
            clearInterval(checkEngine); // Le moteur est prêt !

            // 🛑 AFFECTATION RÉUSSIE
            quantumEngine = window.quantumEngine; 
            
            // Log de succès
            log("System", "Quantum Engine instance found and attached.", "INIT");
            log("Success", "hello world", "INIT"); 

            // Initialiser l'affichage de l'index quantique (qui sera correct maintenant)
            const initialIndex = window.quantumIndex || 1; 
            updateQuantumDimensionConsole(initialIndex); 
            window.loadPreset('superposition');
            
            // Lancer la minuterie MIDI/Index après que l'état soit stable
            setInterval(() => {
                const currentQuantumIndex = window.quantumIndex || 1;
                if (currentQuantumIndex !== lastQuantumIndex) {
                    updateQuantumDimensionConsole(currentQuantumIndex);
                    lastQuantumIndex = currentQuantumIndex;
                }
            }, 200);

        } else if (attempts >= maxAttempts) {
            clearInterval(checkEngine);
            log("Error", "Quantum Engine not found after multiple attempts. Fallback mode active.", "ERROR");
            // Arrêter le polling, le rendu continue en mode Index 1 (bits de base)
        }
        attempts++;
    }, 200); // Vérifie toutes les 200ms
}


document.addEventListener('DOMContentLoaded', initQuantumUI);