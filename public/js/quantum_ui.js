/**
 * QUANTUM UI CONTROLLER
 * Gère l'éditeur de code, la visualisation et la communication serveur.
 */

import { QuantumComputeEngine } from './engines/QuantumComputeEngine.js';

const socket = io('http://localhost:3145');

// Initialisation Moteur
const canvas = document.getElementById('webgl-canvas');
const quantumEngine = new QuantumComputeEngine(canvas);

// Redimensionnement initial
function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    quantumEngine.resize(parent.clientWidth, parent.clientHeight);
}
window.addEventListener('resize', resize);
setTimeout(resize, 100);

// --- BOUCLE DE RENDU ---
// On crée une boucle simple pour cette page (indépendante de la timeline principale)
let time = 0;
function animate() {
    time += 0.01;
    
    // On simule une source vidéo vide (ou on pourrait charger une texture noise)
    // Ici on utilise le canvas offscreen du moteur pour dessiner du bruit si pas de vidéo
    
    // Mise à jour de l'état (simulation)
    quantumEngine.state.phase = time;
    
    // Rendu (On passe null en source vidéo pour voir juste les effets génératifs)
    // Note: Il faudrait adapter render() pour gérer l'absence de source vidéo,
    // ou créer un canvas de bruit blanc temporaire.
    
    // ... appel render ...
    
    // Update Debug UI
    document.getElementById('debug-phase').innerText = `PHASE: ${time.toFixed(3)}`;
    document.getElementById('debug-prob').innerText = `PROB: ${quantumEngine.state.probability.toFixed(3)}`;
    document.getElementById('debug-ent').innerText = `ENT: ${quantumEngine.state.entanglement.toFixed(3)}`;

    requestAnimationFrame(animate);
}
animate();

// --- GESTION DU CODE ÉDITEUR (ASYNCHRONE) ---

const editor = document.getElementById('code-editor');
const statusIndicator = document.getElementById('async-status');
const consoleOutput = document.getElementById('console-output');

document.getElementById('send-code-btn').addEventListener('click', executeCode);
document.getElementById('compile-btn').addEventListener('click', executeCode);

async function executeCode() {
    const code = editor.value;
    
    // 1. UI Loading
    statusIndicator.classList.remove('hidden');
    log("System", "Sending quantum formula to Neural Engine...");

    try {
        // 2. Envoi au serveur pour analyse IA (Mutation)
        // On demande à l'IA de comprendre l'intention du code et de retourner des paramètres
        const payload = {
            history: [{ role: "user", content: `Analyse ce code conceptuel et extrais les paramètres 'entanglement', 'probability' et 'mood' pour le moteur graphique : \n\n${code}` }],
            current_context: { js: "QuantumEngine parameters" } // Contexte minimal
        };

        const response = await fetch('http://localhost:3145/api/ia/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 3. Application du résultat
        if (data.success) {
            log("AI", data.log);
            
            // Si l'IA a renvoyé du JSON (ce qu'on force dans le prompt système via formatCodeContext)
            // On pourrait parser data.log ou data.code_updates si le serveur est bien configuré.
            
            // Pour l'instant, simulons une mise à jour directe via un appel API Mutation
            // (Dans une vraie version, l'IA retournerait l'objet JSON exact)
            
            // On déclenche aussi la mutation CSS
            await fetch('http://localhost:3145/api/quantum/mutate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    entanglement: Math.random(), // Valeur simulée issue du code
                    probability: Math.random(),
                    mood: "GENERATED"
                })
            });
            
            log("System", "Quantum State Updated.");
        } else {
            log("Error", "Compilation failed.");
        }

    } catch (e) {
        log("Error", e.message);
    } finally {
        statusIndicator.classList.add('hidden');
    }
}

function log(source, message) {
    const div = document.createElement('div');
    div.innerHTML = `<span class="text-cyan-500 font-bold">[${source}]</span> ${message}`;
    consoleOutput.prepend(div);
}

// --- PRESETS ---
window.loadPreset = (type) => {
    let code = "";
    if (type === 'superposition') {
        code = `// Mode Superposition
const prob = 0.8;
const ent = 0.1;
return { mood: "CALM" };`;
    } else if (type === 'entanglement') {
        code = `// Mode Chaos
const prob = 0.5;
const ent = 1.0; // Max chaos
return { mood: "CHAOS" };`;
    }
    
    editor.value = code;
    log("System", `Loaded preset: ${type}`);
};