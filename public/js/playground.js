// Logique du Playground AV
// Synchronise les événements MIDI du serveur (via Socket.IO) avec une scène Three.js, et intègre l'IA.

const THREE = window.THREE; 
const socket = io();

// --- 1. ÉTAT GLOBAL ET CONFIGURATION ---

const LERP_FACTOR = 0.1; // Facteur de lissage pour les contrôles (Relatifs)
const CAM_RADIUS = 15;   // Distance de la caméra au centre
const BOUNDARY_3D = 5;   // Limite du mouvement X/Y du curseur 3D

// Mappings des CC (Doit correspondre au serveur.js)
const CC_CONFIG = {
    0: { label: 'Curseur X', variable: 'cursor_x', min: 0, max: 100, step: 1, unit: '%', isAngular: false },
    1: { label: 'Curseur Y', variable: 'cursor_y', min: 0, max: 100, step: 1, unit: '%', isAngular: false },
    2: { label: 'Échelle Z', variable: 'cursor_z', min: 0.5, max: 1.2, step: 0.05, unit: '', isAngular: false },
    3: { label: 'Angle Chroma', variable: 'av_chroma_angle', min: 0, max: 360, step: 5, unit: '°', isAngular: true },
    4: { label: 'Saturation', variable: 'av_saturation', min: 0, max: 1.0, step: 0.01, unit: '', isAngular: false },
    5: { label: 'Caméra Rotation', variable: 'av_param_1', min: 0, max: 360, step: 10, unit: '°', isAngular: true },
    6: { label: 'Effet Index', variable: 'av_param_2', min: 0, max: 10, step: 1, unit: '', isAngular: false },
    7: { label: 'Vitesse Animation', variable: 'av_param_3', min: 0, max: 100, step: 2, unit: '%', isAngular: false },
};

// Structure d'État complète (pour le lissage)
const CLIENT_STATE = {};

// Initialisation de l'état (utilisation de valeurs par défaut raisonnables)
Object.keys(CC_CONFIG).forEach(id => {
    const varName = CC_CONFIG[id].variable;
    const initial = CC_CONFIG[id].min; 
    CLIENT_STATE[varName] = initial;
    CLIENT_STATE[`${varName}_target`] = initial;
});
// Correction manuelle des états initiaux importants
CLIENT_STATE.cursor_y = 100;
CLIENT_STATE.cursor_y_target = 100;
CLIENT_STATE.av_saturation = 1.0;
CLIENT_STATE.av_saturation_target = 1.0;


// Éléments DOM globaux
const hudChroma = document.getElementById('val-chroma');
const hudCamRot = document.getElementById('val-p1');
const hudSpeed = document.getElementById('val-p3');
const fxContainer = document.getElementById('fx-container');
const iaInput = document.getElementById('ia-input');
const iaSendBtn = document.getElementById('ia-send-btn');
const iaBtnText = document.getElementById('ia-btn-text');
const iaChatContainer = document.getElementById('ia-chat-container');
const iaStatusMsg = document.getElementById('ia-status-msg');


// --- 2. CONFIGURATION THREE.JS ---
let scene, camera, renderer, cursorObject, ringObject;
let clock; 

function initThree() {
    if (!THREE) return console.error("THREE.js non chargé.");
    
    clock = new THREE.Clock();
    
    // Scène
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 40);

    // Caméra
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, CAM_RADIUS);
    
    // Rendu
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('layer-webgl').appendChild(renderer.domElement);
    
    // Lumières
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Objet Curseur (Sphère)
    const geo = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 });
    cursorObject = new THREE.Mesh(geo, mat);
    scene.add(cursorObject);
    
    // Objet Anneau (Torus)
    const ringGeo = new THREE.TorusGeometry(8, 0.3, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4a7bed, transparent: true, opacity: 0.8 });
    ringObject = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ringObject);
    
    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// --- 3. LOGIQUE D'ANIMATION (Animate Loop & Lissage) ---

function animate() {
    requestAnimationFrame(animate);
    
    // A. LISSAGE (mise à jour des états lissés à partir des cibles MIDI)
    smoothStateUpdate();
    
    // B. APPLICATION DES PARAMÈTRES LISSÉS À LA SCÈNE
    updateCameraRotation();   // CC 5
    updateCursorTransform();  // CC 0, 1, 2, 3, 4, 6
    updateGlobalAnimation();  // CC 7
    
    // C. RENDU
    renderer.render(scene, camera);
}

function smoothStateUpdate() {
    for (const key in CLIENT_STATE) {
        if (key.endsWith('_target')) {
            const baseKey = key.replace('_target', '');
            
            if (baseKey === 'av_chroma_angle' || baseKey === 'av_param_1') {
                // Lissage angulaire (chemin le plus court)
                let diff = CLIENT_STATE[key] - CLIENT_STATE[baseKey];
                if (diff > 180) diff -= 360;
                else if (diff < -180) diff += 360;
                
                CLIENT_STATE[baseKey] = (CLIENT_STATE[baseKey] + diff * LERP_FACTOR);
                CLIENT_STATE[baseKey] = (CLIENT_STATE[baseKey] % 360 + 360) % 360;
            } else {
                // Lissage linéaire standard (X, Y, Z, Saturation, Vitesse)
                CLIENT_STATE[baseKey] = THREE.MathUtils.lerp(
                    CLIENT_STATE[baseKey],
                    CLIENT_STATE[key],
                    LERP_FACTOR
                );
            }
        }
    }
}


// --- 4. MAPPAGE CC vers 3D ---

function updateCameraRotation() {
    // CC 5 (av_param_1): Rotation de la Caméra (0-360)
    const angleRad = CLIENT_STATE.av_param_1 * (Math.PI / 180); 
    
    camera.position.x = Math.sin(angleRad) * CAM_RADIUS;
    camera.position.z = Math.cos(angleRad) * CAM_RADIUS;
    
    camera.lookAt(0, 0, 0);
    
    if(hudCamRot) hudCamRot.textContent = CLIENT_STATE.av_param_1.toFixed(0);
}

function updateCursorTransform() {
    // CC 0, 1 (X, Y): Position
    cursorObject.position.x = (CLIENT_STATE.cursor_x / 100) * (BOUNDARY_3D * 2) - BOUNDARY_3D;
    cursorObject.position.y = (1 - (CLIENT_STATE.cursor_y / 100)) * (BOUNDARY_3D * 2) - BOUNDARY_3D;
    
    // CC 2 (Z): Échelle (0.5 à 1.2)
    const scale = CLIENT_STATE.cursor_z * 1.5; 
    cursorObject.scale.set(scale, scale, scale);
    
    // CC 3 (Hue) & CC 4 (Saturation): Couleur
    const hue = CLIENT_STATE.av_chroma_angle / 360; 
    const lightness = THREE.MathUtils.mapLinear(CLIENT_STATE.cursor_z, 0.5, 1.2, 0.3, 0.7); 
    
    cursorObject.material.color.setHSL(hue, CLIENT_STATE.av_saturation, lightness); 
    
    // CC 6 (av_param_2): Index d'effet (Variation de la couleur de l'anneau)
    const ringHue = (CLIENT_STATE.av_param_2 / 10); 
    ringObject.material.color.setHSL(ringHue, 0.8, 0.6);
    
    // Rotation passive de l'anneau
    ringObject.rotation.x += 0.005;

    if(hudChroma) hudChroma.textContent = CLIENT_STATE.av_chroma_angle.toFixed(0);

    // Mise à jour des contrôles manuels
    Object.keys(CLIENT_STATE).forEach(key => {
        const input = document.getElementById(`input-${key}`);
        if(input) input.value = CLIENT_STATE[key];
    });
}

function updateGlobalAnimation() {
    // CC 7 (av_param_3): Vitesse d'animation (0-100)
    const speedFactor = CLIENT_STATE.av_param_3 / 100; // 0.0 à 1.0
    
    // Appliquer la vitesse à la rotation de l'anneau
    if (clock) {
        const deltaTime = clock.getDelta();
        ringObject.rotation.z += speedFactor * deltaTime * 5; 
    }
    
    if(hudSpeed) hudSpeed.textContent = CLIENT_STATE.av_param_3.toFixed(0);
}


// --- 5. GESTION DES TRIGGERS DE PAD (Effet Multi-Calques) ---

function triggerVisualEffect(data) {
    // Crée une particule 2D sur le calque d'overlay (CALQUE 2)
    const x = window.innerWidth * (CLIENT_STATE.cursor_x / 100);
    const y = window.innerHeight * (CLIENT_STATE.cursor_y / 100);
    
    const dot = document.createElement('div');
    dot.className = 'flash-dot';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    
    const hue = CLIENT_STATE.av_chroma_angle; 
    
    dot.style.boxShadow = `0 0 20px 10px hsl(${hue}, 80%, 50%)`;
    dot.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
    dot.style.opacity = 1;
    
    fxContainer.appendChild(dot);
    
    // Animation de disparition (scale up et fade out)
    setTimeout(() => {
        dot.style.transform = 'scale(5)';
        dot.style.opacity = 0;
    }, 10);
    
    setTimeout(() => {
        dot.remove();
    }, 500);
    
    // Effet 3D instantané : Pulse de la forme principale
    cursorObject.scale.setScalar(CLIENT_STATE.cursor_z * 1.5 * 1.5); // Pulse
    setTimeout(() => {
        cursorObject.scale.setScalar(CLIENT_STATE.cursor_z * 1.5); // Retour à la normale
    }, 100);
}


// --- 6. GESTION DES MESSAGES SOCKET.IO ---

// Mise à jour des cibles pour le lissage (MIDI)
socket.on('/controls/cursor_x', (x) => { CLIENT_STATE.cursor_x_target = x; });
socket.on('/controls/cursor_y', (y) => { CLIENT_STATE.cursor_y_target = y; });
socket.on('/controls/cursor_z', (z) => { CLIENT_STATE.cursor_z_target = z; });

socket.on('/controls/av_chroma_angle', (angle) => { CLIENT_STATE.av_chroma_angle_target = angle; });
socket.on('/controls/av_saturation', (sat) => { CLIENT_STATE.av_saturation_target = sat; });

socket.on('/controls/av_param_1', (p1) => { CLIENT_STATE.av_param_1_target = p1; });
socket.on('/controls/av_param_2', (p2) => { CLIENT_STATE.av_param_2_target = p2; });
socket.on('/controls/av_param_3', (p3) => { CLIENT_STATE.av_param_3_target = p3; });

socket.on('/pad/trigger', (data) => {
    triggerVisualEffect(data);
});

socket.on('/av/transport', (data) => {
    CLIENT_STATE.transport_state = data.state;
    document.getElementById('transport-display').textContent = data.state;
});

// --- 7. INTERFACE IA (GROQ) ---

function addChatMessage(sender, message, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'IA' ? 'ia-message' : 'user-message';
    if (isError) msgDiv.className += ' ia-message-error';
    msgDiv.textContent = `${sender}: ${message}`;
    iaChatContainer.appendChild(msgDiv);
    // Scroll en bas
    iaChatContainer.scrollTop = iaChatContainer.scrollHeight;
}

function setIAStatus(status, isError = false) {
    iaStatusMsg.textContent = status;
    iaSendBtn.disabled = status !== "Prêt.";
    iaBtnText.textContent = status === "Chargement..." ? "Chargement..." : "Envoyer";
    iaStatusMsg.style.color = isError ? '#ff6347' : (status === "Prêt." ? '#00ffaa' : '#ffff00');
}

async function sendIAQuery() {
    const query = iaInput.value.trim();
    if (!query) return;

    addChatMessage("Moi", query);
    iaInput.value = '';
    setIAStatus("Chargement...");
    
    try {
        const response = await fetch('/api/ia/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.updates && typeof data.updates === 'object') {
            
            // ⬅️ APPLICATION DES MISES À JOUR IA
            let appliedCount = 0;
            for (const key in data.updates) {
                if (CLIENT_STATE.hasOwnProperty(`${key}_target`)) {
                    const newValue = parseFloat(data.updates[key]);
                    if (!isNaN(newValue)) {
                        // Mettre à jour la CIBLE pour que le LISSAGE prenne le relais
                        CLIENT_STATE[`${key}_target`] = newValue;
                        appliedCount++;
                    }
                }
            }

            addChatMessage("Assistant", `Style appliqué : ${appliedCount} paramètres mis à jour.`);
            setIAStatus("Prêt.");
        } else {
            addChatMessage("Assistant", "L'IA n'a pas pu générer de paramètres valides.", true);
            setIAStatus("Échec de la génération.", true);
        }

    } catch (error) {
        addChatMessage("Assistant", `Erreur d'API : ${error.message}`, true);
        setIAStatus("Échec de la communication.", true);
    }
}

// 7. INPUTS MANUELS & ÉCOUTEURS

function createManualControls() {
    const container = document.getElementById('manual-controls-container');
    if (!container) return;
    
    Object.keys(CC_CONFIG).forEach(ccId => {
        const config = CC_CONFIG[ccId];
        const varName = config.variable;
        const inputId = `input-${varName}`;
        
        const html = `
            <div class="manual-control">
                <label for="${inputId}" class="text-xs block mb-1 text-gray-400">${config.label} (${config.min}${config.unit} - ${config.max}${config.unit})</label>
                <input type="range" 
                       id="${inputId}" 
                       min="${config.min}" 
                       max="${config.max}" 
                       step="${config.step}"
                       value="${CLIENT_STATE[varName]}"
                       class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg">
                <span id="value-${varName}" class="text-sm font-mono text-white mt-1 block">${CLIENT_STATE[varName].toFixed(config.unit === '°' || config.unit === '%' ? 0 : 2)}</span>
            </div>
        `;
        container.innerHTML += html;
    });
    
    // Ajout des écouteurs de changements pour la synchronisation (Input -> Three.js)
    Object.keys(CC_CONFIG).forEach(ccId => {
        const varName = CC_CONFIG[ccId].variable;
        const input = document.getElementById(`input-${varName}`);
        const valueDisplay = document.getElementById(`value-${varName}`);
        
        if (input) {
            input.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                
                // Mettre à jour la CIBLE (pour que le lissage continue de fonctionner)
                CLIENT_STATE[`${varName}_target`] = newValue;
                CLIENT_STATE[varName] = newValue; // Mettre à jour immédiatement pour l'affichage manuel
                
                if (valueDisplay) {
                     valueDisplay.textContent = newValue.toFixed(CC_CONFIG[ccId].unit === '°' || CC_CONFIG[ccId].unit === '%' ? 0 : 2);
                }
            });
        }
    });
    
    // ⬅️ Configuration des écouteurs de l'interface IA
    if (iaSendBtn) {
        iaSendBtn.addEventListener('click', sendIAQuery);
    }
    if (iaInput) {
        iaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !iaSendBtn.disabled) {
                sendIAQuery();
            }
        });
    }
    
    // Initialisation du statut IA
    setIAStatus("Prêt.");
}


// --- 8. DÉMARRAGE ---

window.onload = () => {
    createManualControls(); 
    initThree();           
};