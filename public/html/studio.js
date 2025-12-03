// studio.js : Moteur Logique du Studio de Montage

// --- CONSTANTES & ETAT ---
let assetsData = {
    // Simulation API (Sera remplacé par AssetManager.js)
    images: [
        { id: 'img_glitch', name: 'Vague Glitch', type: 'image', url: 'https://placehold.co/400x300/2a66e0/white?text=GLITCH', duration: 3, category: 'VISUEL' },
        { id: 'img_scene', name: 'Scene.jpeg', type: 'image/jpeg', url: 'https://placehold.co/400x300/0d0d0d/808080?text=SCENE_01', duration: 3, category: 'VISUEL' },
    ],
    audio: [
        { id: 'aud_synth', name: 'Synth Pulse Loop', type: 'audio', duration: 8.0, category: 'AUDIO', path: '/data/audio/pulse.mp3' },
    ],
    video: [
        // CORRECTION 404 : Mise à jour du nom de fichier exact (avec encodage URL pour les espaces)
        // CONSEIL : Renommez votre fichier sur le disque en 'storyboard_codex.mp4' pour simplifier.
        { id: 'vid_story', name: 'Storyboard_codex.mp4', type: 'video', duration: 35, category: 'VIDEO', path: '/data/video/storyboard_tablette_histoire_de_codex_ia_dessiner (16).mp4' },
    ],
    scripts: [
        { id: 'fx_cam_zoom', name: 'Caméra Zoom', type: 'script/md', category: 'CAMERA', path: '/data/Fx/plan_camera/zoom.md', code: 'function zoom(time) { return Math.sin(time) * 0.5; }' },
    ],
};

let timelineTracks = {};
let PIXELS_PER_SECOND = 50; 
const MIN_ZOOM = 20; 
const MAX_ZOOM = 200; 

// --- ELEMENTS DOM ---
let assetsListContainer, timelineTracksContainer, zoomLevelDisplay;
let renderBtn, assetModal, modalContentBody, modalTitle, previewMediaContainer;

// --- INITIALISATION ---
window.onload = function initStudio() {
    console.log("🚀 Initialisation du Studio...");
    
    // Cache DOM Elements
    assetsListContainer = document.getElementById('assets-list-container');
    timelineTracksContainer = document.getElementById('timeline-tracks-container');
    zoomLevelDisplay = document.getElementById('zoom-level-display');
    renderBtn = document.getElementById('render-btn');
    assetModal = document.getElementById('asset-modal');
    modalContentBody = document.getElementById('modal-content-body');
    modalTitle = document.getElementById('modal-title');
    previewMediaContainer = document.getElementById('preview-media-container');

    // Pistes Timeline
    timelineTracks.video = document.getElementById('track-video');
    timelineTracks.audio = document.getElementById('track-audio');
    timelineTracks.fx = document.getElementById('track-fx');

    // Listeners
    setupTimelineControls();
    document.getElementById('modal-close-btn').addEventListener('click', hideModal);

    // Chargement Initial
    loadAssets(); 
};

// --- 1. GESTION DES ACTIFS ---

// --- 1. GESTION DES ACTIFS (Mode Connecté) ---

async function loadAssets() {
    console.log("📡 Connexion au serveur pour récupérer les actifs...");
    
    try {
        // Appel à l'API du serveur (server.js -> AssetManager.js)
        const response = await fetch('/api/assets');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.assets) {
            console.log("✅ Actifs chargés depuis le disque :", data.assets);
            
            // On écrase les données de simulation par les vraies données
            assetsData = data.assets;
            
            // On lance le rendu visuel
            renderAssetsList();
        } else {
            console.warn("⚠️ Pas d'actifs trouvés ou format incorrect.");
        }
    } catch (error) {
        console.error("❌ Erreur de chargement des actifs :", error);
        // Fallback : On garde les données de simulation si le serveur ne répond pas
        console.log("⚠️ Passage en mode simulation (Fallback).");
        renderAssetsList(); 
    }
}
function getAssetClass(type) {
    if (type.includes('image') || type.includes('video') || type.includes('VISUEL')) return 'asset-video';
    if (type.includes('audio') || type.includes('AUDIO')) return 'asset-audio';
    if (type.includes('text') || type.includes('TEXT')) return 'asset-text'; // <-- AJOUT
    if (type.includes('script') || type.includes('EFFET')) return 'asset-script';
    return '';
}

function renderAssetsList() {
    assetsListContainer.innerHTML = '';
    const orderedKeys = ['images', 'video', 'text', 'audio', 'scripts'];
    
    orderedKeys.forEach(key => {
        const assets = window.assetsData[key];
        if (assets && assets.length > 0) {
            const groupTitle = document.createElement('h3');
            groupTitle.className = 'asset-group-title';
            groupTitle.textContent = key.toUpperCase();
            assetsListContainer.appendChild(groupTitle);
            
            assets.forEach(asset => {
                const item = document.createElement('div');
                item.className = `asset-item ${getAssetClass(asset.type || asset.category)}`;
                
                // Durée affichée
                const info = asset.duration ? asset.duration.toFixed(1) + 's' : 'N/A';
                
                item.textContent = `${asset.name} [${info}]`;
                item.draggable = true; 
                item.dataset.assetId = asset.id;
                
                // ... etc
                assetsListContainer.appendChild(item);

                // Clic = Preview Modal
                item.addEventListener('click', () => showAssetModal(asset.id));
                
                assetsListContainer.appendChild(item);
            });
        }
    });
    
    setupDragAndDrop(); 
}

// --- 2. DRAG & DROP SYSTEM ---

function setupDragAndDrop() {
    // 1. Source (Actif)
    document.querySelectorAll('.asset-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.assetId);
            e.dataTransfer.effectAllowed = 'copy';
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
    });

    // 2. Cible (Pistes Timeline)
    Object.values(timelineTracks).forEach(track => {
        if (!track) return;
        
        track.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy';
            track.style.border = '1px dashed #00ffaa'; 
        });

        track.addEventListener('dragleave', (e) => {
            track.style.border = '1px solid transparent';
        });

        track.addEventListener('drop', (e) => {
            e.preventDefault();
            const assetId = e.dataTransfer.getData('text/plain');
            
            const trackRect = track.getBoundingClientRect();
            const dropX = e.clientX - trackRect.left + track.scrollLeft;
            
            addClipToTimeline(assetId, e.currentTarget.id, dropX);
            e.currentTarget.style.border = '1px solid transparent'; 
        });
    });
}

function getTargetTrack(assetType) {
    if (assetType.includes('video') || assetType.includes('image') || assetType.includes('VISUEL')) return timelineTracks.video;
    if (assetType.includes('audio') || assetType.includes('AUDIO')) return timelineTracks.audio;
    if (assetType.includes('script') || assetType.includes('EFFET')) return timelineTracks.fx;
    return null;
}

function addClipToTimeline(assetId, trackId, dropX) {
    if (!assetId) return;

    // 1. Retrouver l'actif dans la bibliothèque (assetsData global)
    let asset = null;
    for (const group of Object.values(assetsData)) {
        asset = group.find(a => a.id === assetId);
        if (asset) break;
    }

    if (asset) {
        // Validation basique Piste vs Type
        const expectedTrack = getTargetTrack(asset.type || asset.category);
        if (!expectedTrack || expectedTrack.id !== trackId) {
             console.warn(`[Studio] Incompatible: ${asset.type} sur piste ${trackId}`);
             return;
        }

        // 2. Calcul du Timecode précis (Position souris / Zoom)
        // PIXELS_PER_SECOND doit être synchronisé avec le manager, ici on utilise la globale
        const startTime = dropX / PIXELS_PER_SECOND; 
        
        // 3. ACTION CRITIQUE : Mise à jour du Manager
        if (window.timelineMgr) {
            // C'est ici que la magie opère. On ajoute à la "Database" en mémoire.
            const newClip = window.timelineMgr.addClip(asset, trackId, startTime);
            
            // 4. Feedback : On force le moteur de Preview à se mettre à jour à cet instant
            // Pour que l'utilisateur voit immédiatement l'image où il a lâché la souris
            // Note: On accède au transport via window ou on simule juste l'image
            // Idéalement, on ne fait rien, le prochain "Tick" du moteur le fera.
            
        } else {
            console.error("❌ TimelineManager non initialisé !");
        }
        
        // Mise à jour de la règle (cosmétique)
        updateTimelineDisplay();
    }
}
// --- 3. PREVIEW & MODAL ---

function previewAsset(asset) {
    previewMediaContainer.innerHTML = ''; 
    const placeholder = document.getElementById('preview-placeholder');
    if(placeholder) placeholder.style.display = 'none';
    
    if (asset.type.includes('image')) {
        previewMediaContainer.innerHTML = `<img src="${asset.url}" class="max-h-full max-w-full object-contain border border-gray-700 rounded shadow-lg"/>`;
    } else if (asset.type.includes('video')) {
         // Affichage de la vidéo
         previewMediaContainer.innerHTML = `<video controls autoplay loop src="${asset.path || asset.url}" class="max-h-full max-w-full border border-red-500 rounded"></video>`;
    } else if (asset.type.includes('audio')) {
        previewMediaContainer.innerHTML = `
            <div class="text-center p-8 bg-gray-900 rounded border border-blue-500">
                <p class="text-xl text-blue-400 mb-2">🎵 ${asset.name}</p>
                <audio controls src="${asset.path || asset.source}" class="w-64"></audio>
            </div>`;
    } else if (asset.type.includes('script')) {
        modalTitle.textContent = `Script: ${asset.name}`;
        modalContentBody.innerHTML = `
            <p class="text-yellow-400 mb-2 text-xs">Path: ${asset.path}</p>
            <pre class="bg-gray-950 p-4 rounded border border-yellow-600 overflow-x-auto text-green-400 font-mono text-sm">${asset.code || '// Code non chargé'}</pre>
        `;
        showModal('asset-modal'); // Ceci fonctionne maintenant
        return; 
    }
    
    hideModal(); 
}

// studio.js - Correction de la gestion du Modal

function showAssetModal(assetId) {
    // 1. Retrouver l'actif
    let asset = null;
    for (const group of Object.values(assetsData)) {
        asset = group.find(a => a.id === assetId);
        if (asset) break;
    }

    if (!asset) return;

    // 2. Mettre à jour le Titre du Modal
    if (modalTitle) modalTitle.textContent = `Détail : ${asset.name}`;

    // 3. Générer le contenu HTML SPÉCIFIQUE au Modal
    let contentHtml = '';

    if (asset.type.includes('image') || asset.category === 'VISUEL') {
        // Pour une image : On s'assure qu'elle ne dépasse pas la taille de l'écran
        contentHtml = `
            <div class="flex justify-center bg-black rounded p-2">
                <img src="${asset.url}" class="max-h-[60vh] object-contain shadow-lg border border-gray-700">
            </div>
            <p class="mt-2 text-sm text-gray-400">Type: Image | Durée par défaut: ${asset.duration}s</p>
        `;

    } else if (asset.type.includes('video') || asset.category === 'VIDEO') {
        // Pour une vidéo
        contentHtml = `
            <div class="flex justify-center bg-black rounded p-2">
                <video controls autoplay class="max-h-[60vh] w-full border border-red-900">
                    <source src="${asset.path || asset.url}" type="video/mp4">
                    Votre navigateur ne supporte pas la vidéo.
                </video>
            </div>
            <p class="mt-2 text-sm text-gray-400">Type: Vidéo | Durée: ${asset.duration}s</p>
        `;

    } else if (asset.type.includes('audio') || asset.category === 'AUDIO') {
        // Pour l'audio
        contentHtml = `
            <div class="flex flex-col items-center justify-center p-8 bg-gray-900 rounded border border-blue-900">
                <div class="text-4xl mb-4">🎵</div>
                <h4 class="text-xl text-blue-400 font-bold mb-4">${asset.name}</h4>
                <audio controls src="${asset.path || asset.source}" class="w-full"></audio>
            </div>
        `;

    } else if (asset.type.includes('script') || asset.category === 'CAMERA') {
        // Pour les scripts (Code)
        contentHtml = `
            <div class="bg-gray-950 p-4 rounded border border-yellow-600 overflow-auto max-h-[60vh]">
                <p class="text-yellow-500 text-xs mb-2">// Fichier: ${asset.path}</p>
                <pre class="text-green-400 font-mono text-sm">${asset.code || '// Contenu non chargé'}</pre>
            </div>
        `;
    }

    // 4. Injection et Affichage
    if (modalContentBody) {
        modalContentBody.innerHTML = contentHtml;
        showModal('asset-modal'); // Appel de la fonction utilitaire CSS
    }
}

// 🟢 CORRECTION : Ajout de la fonction manquante
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function hideModal() {
    if (assetModal) assetModal.classList.remove('show');
}

// --- 4. TIMELINE CONTROLS (Zoom, Render) ---

function setupTimelineControls() {
    document.getElementById('zoom-in-btn').addEventListener('click', () => adjustZoom(1.2));
    document.getElementById('zoom-out-btn').addEventListener('click', () => adjustZoom(1 / 1.2));
    renderBtn.addEventListener('click', simulateFFmpegRender);
    updateTimelineDisplay();
}

function adjustZoom(factor) {
    const newPps = PIXELS_PER_SECOND * factor;
    if (newPps < MIN_ZOOM || newPps > MAX_ZOOM) return;
    
    PIXELS_PER_SECOND = newPps;
    zoomLevelDisplay.textContent = `${(PIXELS_PER_SECOND / 50).toFixed(1)}x`;
    
    document.querySelectorAll('.timeline-clip').forEach(clip => {
        const duration = parseFloat(clip.dataset.duration);
        const startTime = parseFloat(clip.dataset.startTime);
        clip.style.width = `${duration * PIXELS_PER_SECOND}px`;
        clip.style.left = `${startTime * PIXELS_PER_SECOND}px`;
    });
    
    updateTimelineDisplay();
}

// Dans public/js/studio.js

function updateTimelineDisplay() {
    const timeArea = document.getElementById('timecode-area');
    
    // SÉCURITÉ : Si l'élément n'existe pas (chargement asynchrone), on arrête tout de suite
    if (!timeArea || !timelineTracksContainer) return;

    timeArea.innerHTML = ''; // C'est ici que ça plantait avant !
    
    // Calcul de la longueur totale basée sur les clips du Manager ou du DOM
    let maxTime = 60; 
    
    // On regarde s'il y a des clips dans le DOM
    const domClips = document.querySelectorAll('.timeline-clip');
    domClips.forEach(clip => {
        // On essaie de lire les data, ou on calcule depuis le style
        let start = parseFloat(clip.dataset.startTime);
        // Si c'est le nouveau Manager, il utilise style.left directement, on convertit inversement
        if (isNaN(start)) start = parseFloat(clip.style.left) / PIXELS_PER_SECOND;
        
        let dur = parseFloat(clip.dataset.duration);
        if (isNaN(dur)) dur = parseFloat(clip.style.width) / PIXELS_PER_SECOND;

        const end = start + dur;
        if (end > maxTime) maxTime = end;
    });

    const maxPx = maxTime * PIXELS_PER_SECOND;
    
    // On agrandit les conteneurs pour permettre le scroll
    timelineTracksContainer.style.width = `${maxPx + 200}px`; 
    timeArea.style.width = `${maxPx + 200}px`;

    // Dessiner les marqueurs (La Règle)
    for (let s = 0; s <= maxTime + 10; s += 5) {
        const posPx = s * PIXELS_PER_SECOND;
        
        // Le texte (ex: 00:05)
        const timeLabel = document.createElement('span');
        timeLabel.className = 'absolute text-gray-500 font-mono text-[10px] border-l border-gray-600 pl-1'; 
        timeLabel.textContent = formatTime(s);
        timeLabel.style.left = `${posPx}px`;
        timeLabel.style.top = '0';
        
        // Ajout à la zone dédiée (timecode-area)
        timeArea.appendChild(timeLabel); 
        
        // Optionnel : Lignes verticales grises traversant les pistes
        // (On peut les ajouter à timelineTracksContainer si on veut une grille)
    }
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function simulateFFmpegRender() {
    renderBtn.textContent = 'RENDERING... (0%)';
    renderBtn.disabled = true;
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        renderBtn.textContent = `RENDERING... (${progress}%)`;
        
        if (progress >= 100) {
            clearInterval(interval);
            renderBtn.textContent = 'TERMINÉ';
            renderBtn.className = "bg-green-600 px-3 py-1 rounded text-white text-xs";
            
            setTimeout(() => {
                renderBtn.textContent = 'RENDER (FFMPEG SIM.)';
                renderBtn.disabled = false;
                renderBtn.className = "bg-red-600 px-3 py-1 rounded text-white text-xs hover:bg-red-700";
            }, 2000);
        }
    }, 100);
}
function restoreSessionState(savedData) {
    // 1. Restauration des paramètres Visuels (X, Y, Z, Chroma)
    if(savedData.drawState) {
        // On ne copie QUE les valeurs numériques, pas les objets DOM
        DrawState.x = savedData.drawState.x ?? 50;
        DrawState.y = savedData.drawState.y ?? 50;
        DrawState.z = savedData.drawState.z ?? 20;
        DrawState.chroma = savedData.drawState.chroma ?? 0;
        
        // 2. FORCE LE RESET DES VARIABLES RUNTIME (Vital !)
        // On interdit au moteur de penser qu'il est en train de dessiner au chargement
        DrawState.isDrawing = false;
        DrawState.currentPath = null;
        DrawState.points = [];

        // 3. Mise à jour visuelle
        DrawEngine.updateCursor();
    }

    // 4. Restauration Clips
    if (savedData.clips) {
        sessionMgr.restoreTimeline(window.timelineMgr, savedData.clips);
    }
}