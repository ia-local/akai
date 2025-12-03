/**
 * STUDIO MAIN MODULE (V1.7 FINAL)
 * Cœur de l'application Studio de Montage AV.
 * Orchestration : Transport, Timeline, MIDI, Dessin SVG, ASCII Canvas, Soup Visualizer, WebGL.
 */

// =================================================================
// 1. IMPORTS & DEPENDANCES
// =================================================================
import { Transport } from './timeCode.js';
import { TimelineManager } from './timelineManager.js';
import { KeyboardController } from './eventKeyboard.js';
import { MultiCalcSession } from './multiCalc.js';
import { AsciiProcessor, generateAsciiBox } from './asciiModule.js';
import { AsciiCanvasEngine } from './AsciiCanvasEngine.js'; // Fallback
import { AsciiTensorEngine } from './AsciiTensorEngine.js'; // Moteur Principal
import { ModalSystem } from './modalSystem.js';
import { AsciiSoupEngine } from './AsciiSoupEngine.js';
import { ConfigManager } from './modalConfig.js';
import { WebGLEngine } from './WebGLEngine.js';

// =================================================================
// 2. SELECTION DU DOM
// =================================================================

// Transport & Timeline
const playhead = document.getElementById('playhead');
const timeDisplay = document.getElementById('timecode-display');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const timelineWrapper = document.getElementById('timeline-content-wrapper');
const tracksContainer = document.getElementById('timeline-tracks-container');

// Preview & Media
const previewContainer = document.getElementById('preview-media-container');
const playerImg = document.getElementById('player-image');
const playerVid = document.getElementById('player-video');
const playerPlaceholder = document.getElementById('player-placeholder');

// Couches Créatives (SVG, ASCII, WebGL)
const cursorEl = document.getElementById('drawing-cursor');
const drawnPathsGroup = document.getElementById('drawn-paths');
const drawingLayer = document.getElementById('drawing-layer');
const asciiCanvas = document.getElementById('ascii-canvas');
const webglCanvas = document.getElementById('webgl-canvas');

// Interface Utilisateur (UI)
const libraryContainer = document.getElementById('assets-list-container');
const toggleToolsBtn = document.getElementById('toggle-tools-btn');
const closeToolsBtn = document.getElementById('close-tools-btn');
const rightPanel = document.getElementById('right-panel');
const modeIndicator = document.getElementById('mode-indicator');
const settingsBtn = document.getElementById('btn-settings');

const toggleGlBtn = document.getElementById('toggle-gl-btn');

// Constantes
const PIXELS_PER_SECOND = 50;


// =================================================================
// 3. INITIALISATION DES MOTEURS
// =================================================================

// Communication Serveur
const socket = io();

// Systèmes Globaux
window.modalSystem = new ModalSystem(); 
const sessionMgr = new MultiCalcSession(); 
window.timelineMgr = new TimelineManager(tracksContainer, PIXELS_PER_SECOND);
const configMgr = new ConfigManager();
const soupEngine = new AsciiSoupEngine();

// --- A. MOTEUR ASCII (Tensor) ---
let asciiEngine;
if (asciiCanvas) {
    function resizeAsciiCanvas() {
        if (asciiCanvas && previewContainer) {
            asciiCanvas.width = previewContainer.clientWidth;
            asciiCanvas.height = previewContainer.clientHeight;
            // Si TensorEngine, on met à jour la résolution
            if (asciiEngine && asciiEngine.setResolution) {
                asciiEngine.setResolution(previewContainer.clientWidth, previewContainer.clientHeight, '16:9');
            }
        }
    }
    window.addEventListener('resize', resizeAsciiCanvas);
    setTimeout(resizeAsciiCanvas, 100);
    
    // Choix du moteur (Préférence Tensor pour le Soup Visualizer)
    try {
        asciiEngine = new AsciiTensorEngine(asciiCanvas);
        console.log("✅ Moteur ASCII : Tensor Engine activé.");
    } catch (e) {
        asciiEngine = new AsciiCanvasEngine(asciiCanvas);
        console.warn("⚠️ Moteur ASCII : Fallback Canvas Standard.");
    }
} else {
    console.warn("⚠️ Canvas ASCII introuvable.");
}

// --- B. MOTEUR WEBGL (Shader) ---
let glEngine;
if (webglCanvas) {
    const resizeGL = () => {
        webglCanvas.width = previewContainer.clientWidth;
        webglCanvas.height = previewContainer.clientHeight;
        if(glEngine && glEngine.resize) glEngine.resize();
    };
    window.addEventListener('resize', resizeGL);
    
    // Instanciation
    glEngine = new WebGLEngine(webglCanvas);
    webglCanvas.style.display = 'none';
    console.log("✅ Moteur WebGL : Activé.");
}
// --- GESTION WEBGL (ON/OFF) ---
let isWebGLEnabled = false; // Désactivé par défaut pour économiser les ressources

function toggleWebGL() {
    isWebGLEnabled = !isWebGLEnabled;
    
    if (isWebGLEnabled) {
        toggleGlBtn.classList.add('bg-blue-900', 'text-blue-200', 'border-blue-700');
        toggleGlBtn.classList.remove('bg-gray-800', 'text-gray-400', 'border-gray-600');
        toggleGlBtn.innerHTML = `<span>✨</span> GL FX: ON`;
        
        // Afficher le canvas
        if(webglCanvas) webglCanvas.style.display = 'block';
    } else {
        toggleGlBtn.classList.remove('bg-blue-900', 'text-blue-200', 'border-blue-700');
        toggleGlBtn.classList.add('bg-gray-800', 'text-gray-400', 'border-gray-600');
        toggleGlBtn.innerHTML = `<span>✨</span> GL FX: OFF`;
        
        // Masquer le canvas pour voir la vidéo brute derrière
        if(webglCanvas) webglCanvas.style.display = 'none';
    }
}

if(toggleGlBtn) toggleGlBtn.addEventListener('click', toggleWebGL);
// État local des Knobs pour le GL
const midiKnobState = [64, 64, 64, 64]; 


// =================================================================
// 4. GESTION DE L'INTERFACE (UI)
// =================================================================

// 4a. Sidebar Droite (Outils IA)
function toggleRightPanel() {
    if (!rightPanel) return;
    rightPanel.classList.toggle('is-open');
    if(toggleToolsBtn) toggleToolsBtn.classList.toggle('active');
    
    setTimeout(() => {
        if (typeof resizeAsciiCanvas === 'function') resizeAsciiCanvas();
    }, 350); 
}

if (toggleToolsBtn) toggleToolsBtn.addEventListener('click', toggleRightPanel);
if (closeToolsBtn) closeToolsBtn.addEventListener('click', toggleRightPanel);

// Bouton Soup Analysis
const soupBtn = document.querySelector('#right-panel button:last-child');
if (soupBtn) {
    soupBtn.textContent = "SOUP VISUALIZER (PHI)";
    soupBtn.onclick = runSoupAnalysis;
}

// Bouton Settings
if(settingsBtn) {
    settingsBtn.addEventListener('click', () => configMgr.openModal());
}

// 4b. Onglets de Navigation (Footer)
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
    });
});

// 4c. Switch Vue Library (List/Grid)
let libraryViewMode = 'list';
const btnViewList = document.getElementById('view-list-btn');
const btnViewGrid = document.getElementById('view-grid-btn');

if (btnViewList && btnViewGrid) {
    btnViewList.addEventListener('click', () => setLibraryView('list'));
    btnViewGrid.addEventListener('click', () => setLibraryView('grid'));
}

function setLibraryView(mode) {
    libraryViewMode = mode;
    if (mode === 'list') {
        btnViewList.classList.add('active-view', 'text-white');
        btnViewList.classList.remove('text-gray-500');
        btnViewGrid.classList.remove('active-view', 'text-white');
        btnViewGrid.classList.add('text-gray-500');
    } else {
        btnViewGrid.classList.add('active-view', 'text-white');
        btnViewGrid.classList.remove('text-gray-500');
        btnViewList.classList.remove('active-view', 'text-white');
        btnViewList.classList.add('text-gray-500');
    }
    if (window.assetsData) renderLibraryUI(window.assetsData);
}


// =================================================================
// 5. CHARGEMENT DES ASSETS (BIBLIOTHÈQUE)
// =================================================================

async function initAssetLibrary() {
    if (!libraryContainer) return;
    libraryContainer.innerHTML = '<div class="text-gray-500 text-xs p-2">Connexion...</div>';
    
    try {
        const response = await fetch('/api/assets');
        if (!response.ok) throw new Error("Erreur Réseau");
        
        const data = await response.json();
        if (data.success && data.assets) {
            window.assetsData = data.assets;
            renderLibraryUI(window.assetsData);
            
            const savedData = sessionMgr.load();
            restoreSessionState(savedData);
        }
    } catch (e) {
        console.error("Erreur Assets:", e);
        libraryContainer.innerHTML = '<div class="text-red-500 text-xs p-2">Erreur chargement /data/</div>';
        simulateFallbackData();
    }
}

function renderLibraryUI(assetsData) {
    if (!libraryContainer) return;
    libraryContainer.innerHTML = '';
    const categories = ['images', 'video', 'text', 'audio', 'scripts'];
    
    categories.forEach(cat => {
        if (assetsData[cat] && assetsData[cat].length > 0) {
            const title = document.createElement('h3');
            title.className = "text-xs font-bold text-gray-500 uppercase mt-4 mb-2 pl-2 border-l-2 border-gray-700 sticky top-0 bg-[#1a1a1a] z-10 py-1";
            title.textContent = cat;
            libraryContainer.appendChild(title);

            const catContainer = document.createElement('div');
            catContainer.className = libraryViewMode === 'grid' ? 'assets-grid-view' : 'assets-list-view';

            assetsData[cat].forEach(asset => {
                const item = document.createElement('div');
                item.draggable = true;
                item.dataset.assetId = asset.id;

                if (libraryViewMode === 'grid') {
                    item.className = 'asset-card';
                    item.innerHTML = `
                        <div class="card-preview">${getGridPreviewHTML(asset, cat)}</div>
                        <div class="card-info">${asset.name}</div>
                        <button class="inspect-btn" title="Inspecter">👁️</button>
                    `;
                } else {
                    let typeClass = 'border-gray-600';
                    if (cat === 'video' || cat === 'images') typeClass = 'border-red-500 hover:bg-red-900/20';
                    if (cat === 'audio') typeClass = 'border-blue-500 hover:bg-blue-900/20';
                    if (cat === 'text') typeClass = 'border-green-500 hover:bg-green-900/20';
                    
                    item.className = `asset-item cursor-grab p-2 mb-1 text-xs bg-[#252525] border-l-2 ${typeClass} rounded text-gray-300 hover:text-white transition-colors truncate`;
                    item.innerHTML = `
                        <span class="truncate flex-1">${asset.name}</span>
                        <button class="inspect-btn" title="Inspecter">👁️</button>
                    `;
                }

                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', asset.id);
                    e.dataTransfer.effectAllowed = 'copy';
                });

                const inspectBtn = item.querySelector('.inspect-btn');
                if(inspectBtn) inspectBtn.addEventListener('click', (e) => { e.stopPropagation(); openAssetInspector(asset); });

                catContainer.appendChild(item);
            });
            libraryContainer.appendChild(catContainer);
        }
    });
}

function getGridPreviewHTML(asset, cat) {
    const url = asset.url || asset.path;
    if (cat === 'images') return `<img src="${url}" loading="lazy">`;
    if (cat === 'video') return `<video src="${url}" muted preload="metadata" onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>`;
    if (cat === 'text') return `<span class="text-2xl">📄</span>`;
    return `<span class="text-2xl">?</span>`;
}

function simulateFallbackData() {
    window.assetsData = { texts: [{ id: 'txt_demo', name: 'Demo ASCII', type: 'text/plain', content: generateAsciiBox("OFFLINE") }] };
    renderLibraryUI(window.assetsData);
}

function restoreSessionState(savedData) {
    if(savedData.drawState) {
        DrawState.x = savedData.drawState.x ?? 50;
        DrawState.y = savedData.drawState.y ?? 50;
        DrawState.z = savedData.drawState.z ?? 20;
        DrawState.chroma = savedData.drawState.chroma ?? 0;
        // Reset Runtime
        DrawState.isDrawing = false;
        DrawState.currentPath = null;
        DrawState.points = [];
        DrawEngine.updateCursor();
    }
    if (savedData.clips) {
        sessionMgr.restoreTimeline(window.timelineMgr, savedData.clips);
    }
}

// Inspecteur Modal
function openAssetInspector(asset) {
    if (!window.modalSystem) return;
    const url = asset.url || asset.path;
    const type = asset.type || "";
    
    let content = `<div class="p-8 text-center text-gray-500 animate-pulse">Chargement...</div>`;
    const footer = `<div class="text-xs text-gray-500 p-2">ID: ${asset.id}</div>`;

    window.modalSystem.show(`Inspecteur : ${asset.name}`, content, footer, () => {
        const bodyEl = document.getElementById('generic-modal-body');
        if(!bodyEl) return;

        if (type.includes('text') || url.endsWith('.md')) {
            fetch(url).then(r => r.text()).then(t => {
                bodyEl.innerHTML = `<div class="bg-black p-2 h-full border border-gray-700 overflow-hidden"><textarea readonly class="w-full h-full bg-transparent text-green-400 font-mono text-xs resize-none outline-none">${t}</textarea></div>`;
            });
        } else if (type.includes('image')) {
            bodyEl.innerHTML = `<div class="flex justify-center bg-black p-4 h-full"><img src="${url}" class="max-h-full object-contain"></div>`;
        } else if (type.includes('video')) {
            bodyEl.innerHTML = `<div class="flex justify-center bg-black p-4 h-full"><video src="${url}" controls autoplay class="max-h-full"></video></div>`;
        }
    });
}


// =================================================================
// 6. MOTEUR DE DESSIN (SVG TENSOR)
// =================================================================

const DrawState = {
    x: 50, y: 50, z: 20, chroma: 0,
    isDrawing: false, currentPath: null, points: []
};

const DrawEngine = {
    updateCursor() {
        if (!cursorEl) return;
        const halfSize = DrawState.z / 2;
        cursorEl.setAttribute('x', DrawState.x - halfSize);
        cursorEl.setAttribute('y', DrawState.y - halfSize);
        cursorEl.setAttribute('width', DrawState.z);
        cursorEl.setAttribute('height', DrawState.z);
        
        cursorEl.setAttribute('fill', `hsla(${DrawState.chroma}, 100%, 50%, 0.3)`);
        cursorEl.setAttribute('stroke', `hsl(${DrawState.chroma}, 100%, 80%)`);
        if (DrawState.isDrawing) this.addPointToPath();
    },

    startStroke() {
        if (!drawnPathsGroup) return;
        DrawState.isDrawing = true;
        DrawState.points = [];
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", `hsl(${DrawState.chroma}, 100%, 50%)`);
        path.setAttribute("stroke-width", Math.max(1, DrawState.z / 4));
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("vector-effect", "non-scaling-stroke");
        drawnPathsGroup.appendChild(path);
        DrawState.currentPath = path;
        this.addPointToPath();
    },

    addPointToPath() {
        if (!DrawState.currentPath || typeof DrawState.currentPath.setAttribute !== 'function') return;
        DrawState.points.push(`${DrawState.x} ${DrawState.y}`);
        let d = (DrawState.points.length === 1) 
            ? `M ${DrawState.points[0]}` 
            : `M ${DrawState.points[0]} L ` + DrawState.points.slice(1).join(' ');
        DrawState.currentPath.setAttribute("d", d);
    },

    endStroke() { DrawState.isDrawing = false; DrawState.currentPath = null; },
    clear() { if (drawnPathsGroup) drawnPathsGroup.innerHTML = ''; }
};

if (drawingLayer) {
    drawingLayer.setAttribute('viewBox', '0 0 100 100');
    drawingLayer.setAttribute('preserveAspectRatio', 'none');
}


// =================================================================
// 7. GESTION DU DROP (TIMELINE)
// =================================================================

const tracks = document.querySelectorAll('.timeline-track');
tracks.forEach(track => {
    track.addEventListener('dragover', (e) => { e.preventDefault(); track.style.backgroundColor = '#333'; });
    track.addEventListener('dragleave', (e) => { track.style.backgroundColor = '#2a2a2a'; });
    track.addEventListener('drop', (e) => {
        e.preventDefault();
        track.style.backgroundColor = '#2a2a2a';
        
        const assetId = e.dataTransfer.getData('text/plain');
        if (!assetId) return;

        let asset = null;
        if (window.assetsData) {
            for (const group of Object.values(window.assetsData)) {
                asset = group.find(a => a.id === assetId);
                if (asset) break;
            }
        }

        if (asset) {
            const dropX = e.clientX - tracksContainer.getBoundingClientRect().left;
            const startTime = Math.max(0, dropX / PIXELS_PER_SECOND);

            window.timelineMgr.addClip(asset, track.id, startTime);
            sessionMgr.save(window.timelineMgr, DrawState);

            transport.setTime(startTime); 
            PreviewEngine.sync(startTime, false);
        }
    });
});


// =================================================================
// 8. MOTEUR PREVIEW
// =================================================================

const PreviewEngine = {
    currentAssetId: null,

    sync(globalTime, isTransportPlaying) {
        const activeClips = window.timelineMgr.getClipsAtTime(globalTime);
        
        // A. VISUEL (VIDEO/IMAGE)
        const visualClip = activeClips.find(c => c.trackId === 'track-video' || c.trackId === 'track-image');
        if (!visualClip) {
            this.showPlaceholder();
        } else {
            const localTimestamp = globalTime - visualClip.startTime;
            if (visualClip.id !== this.currentAssetId) {
                this.loadMedia(visualClip);
                this.currentAssetId = visualClip.id;
            }
            if (this.isVideo(visualClip)) this.syncVideo(localTimestamp, isTransportPlaying);
            else this.showImage();
        }

        // B. TEXTE (ASCII)
        const textClip = activeClips.find(c => c.trackId === 'track-text');
        if (textClip) {
            if (!textClip.assetData.content && !textClip.isLoading) this.loadTextContent(textClip);
            this.showText(textClip);
        } else {
            this.hideText();
        }
    },

    loadMedia(clip) {
        const url = clip.assetData ? (clip.assetData.url || clip.assetData.path) : "";
        if (!url) return;
        if (this.isVideo(clip)) {
            playerVid.src = url; playerVid.load(); this.activatePlayer(playerVid);
        } else {
            playerImg.src = url; this.activatePlayer(playerImg);
        }
    },

    async loadTextContent(clip) {
        const url = clip.assetData.url || clip.assetData.path;
        if (!url) return;
        clip.isLoading = true;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const rawText = await res.text();
                const processed = AsciiProcessor.process(rawText);
                clip.assetData.processedContent = processed;
                clip.assetData.content = rawText; 
            }
        } catch(e) { clip.assetData.content = "Error loading text"; } 
        finally { clip.isLoading = false; }
    },

    showText(clip) {
        if (asciiCanvas && asciiEngine) {
            asciiCanvas.classList.add('active');
            
            if (clip.assetData && clip.assetData.processedContent) {
                const data = clip.assetData.processedContent;
                if (data.style.ratio && asciiEngine.setResolution) {
                    asciiEngine.setResolution(previewContainer.clientWidth, previewContainer.clientHeight, data.style.ratio);
                }
                asciiEngine.render(data);
            }
            else if (clip.assetData && clip.assetData.content) {
                asciiEngine.render({ text: clip.assetData.content, style: {} });
            }
        }
    },

    hideText() {
        if (asciiCanvas) asciiCanvas.classList.remove('active');
        if (asciiEngine) asciiEngine.clear();
    },

    syncVideo(localTime, isPlaying) {
        if (isPlaying) {
            if (playerVid.paused) playerVid.play().catch(()=>{});
            if (Math.abs(playerVid.currentTime - localTime) > 0.2) playerVid.currentTime = localTime;
        } else {
            playerVid.pause(); 
            playerVid.currentTime = localTime; 
        }
    },
    
    showImage() { if (!playerImg.classList.contains('active')) this.activatePlayer(playerImg); },
    showPlaceholder() { this.activatePlayer(playerPlaceholder); playerVid.pause(); this.currentAssetId = null; },
    activatePlayer(el) { [playerImg, playerVid, playerPlaceholder].forEach(e => e.classList.remove('active')); if(el) el.classList.add('active'); },
    isVideo(clip) { return clip.type.includes('video') || clip.type === 'VIDEO'; }
};


// =================================================================
// 9. SOUP VISUALIZER (LOGIQUE IA DATA)
// =================================================================

async function runSoupAnalysis() {
    try {
        const response = await fetch('/data/text/soup.md');
        if (!response.ok) throw new Error("Fichier soup.md introuvable");
        const text = await response.text();

        const stats = soupEngine.analyze(text);
        
        // Affichage Rapport
        const panelContent = document.querySelector('#right-panel .panel-content');
        if (panelContent) {
            const topChars = stats.stats.map(s => `[${s[0]}: ${s[1]}]`).join(' ');
            panelContent.innerHTML += `
                <div class="mt-4 p-2 bg-black border border-green-500 text-green-400 text-xs font-mono">
                    <div class="font-bold border-b border-green-800 mb-1">SOUP ANALYSIS</div>
                    <div>Total: ${stats.total}</div>
                    <div>${topChars}</div>
                </div>
            `;
        }
        if (asciiCanvas && asciiEngine) {
            asciiCanvas.classList.add('active'); // Déclenche le CSS "Solid Border"
            
            // Déclenche le calcul de la grille OR (1.618)
            const layout = asciiEngine.setResolution(
                previewContainer.clientWidth, 
                previewContainer.clientHeight, 
                'phi' 
            );
            
            animateSoupStream(text, layout.cols);
        }
        // Animation
        const grid = soupEngine.getGoldenGrid(text.length);
        if (asciiCanvas && asciiEngine) {
            asciiCanvas.classList.add('active'); 
            // Reset ratio pour le Soup
            if(asciiEngine.setResolution) asciiEngine.setResolution(previewContainer.clientWidth, previewContainer.clientHeight, 'phi');
            animateSoupStream(text, grid.cols);
        }

    } catch (e) {
        console.error("Soup Error:", e);
    }
}

function animateSoupStream(fullText, cols) {
    let cursor = 0;
    const speed = 5; // Plus rapide
    
    function step() {
        if (cursor >= fullText.length) return;
        const currentChunk = fullText.substring(0, cursor);
        
        let visualText = "";
        for (let char of currentChunk) visualText += soupEngine.getDensityChar(char);

        const formattedLines = [];
        for (let i = 0; i < visualText.length; i += cols) {
            formattedLines.push(visualText.substring(i, i + cols));
        }
        asciiEngine.render({ text: formattedLines.join('\n'), style: { color: '#facc15', align: 'center' } });

        cursor += speed;
        requestAnimationFrame(step);
    }
    step();
}


// =================================================================
// 10. MOTEUR DE TRANSPORT & MIDI
// =================================================================

const transport = new Transport({
    onTick: (time) => {
        if(timeDisplay) timeDisplay.textContent = transport.formatTime(time);
        if(playhead) playhead.style.transform = `translateX(${time * PIXELS_PER_SECOND}px)`;
        PreviewEngine.sync(time, transport.isPlaying);
        
        if (glEngine && isWebGLEnabled) {
            glEngine.updateUniforms(time, midiKnobState);
            glEngine.render();
        }
    },
    onStop: () => {
        if(playhead) playhead.style.transform = `translateX(0px)`;
        PreviewEngine.showPlaceholder();
    }
});

// État Sélecteur
let isSelectorMode = false;

function toggleSelectorMode() {
    isSelectorMode = !isSelectorMode;
    if(modeIndicator) {
        modeIndicator.textContent = isSelectorMode ? "MODE: EDIT / CLIP" : "MODE: PERFORM";
        modeIndicator.className = isSelectorMode 
            ? "px-3 py-1 rounded text-xs font-bold bg-red-900 text-red-400 border border-red-700 transition-colors"
            : "px-3 py-1 rounded text-xs font-bold bg-green-900 text-green-400 border border-green-700 transition-colors";
    }
}

// MIDI CC
socket.on('midi_cc', (data) => {
    const val = data.value;
    
    // Store pour GL
    if (data.cc >= 0 && data.cc <= 3) midiKnobState[data.cc] = val;

    if (isSelectorMode) {
        // MODE EDIT
        const activeClips = window.timelineMgr.getClipsAtTime(transport.currentTime);
        const targetClip = activeClips.find(c => c.trackId === 'track-video' || c.trackId === 'track-image');
        
        if(targetClip) {
            const player = PreviewEngine.isVideo(targetClip) ? playerVid : playerImg;
            if(data.cc === 0) player.style.opacity = val / 127;
            if(data.cc === 1) player.style.transform = `scale(${1 + (val/127)*2})`;
        }
    } else {
        // MODE PERFORM
        if(data.cc === 0) { DrawState.x = (val/127)*100; DrawEngine.updateCursor(); }
        if(data.cc === 1) { DrawState.y = 100 - (val/127)*100; DrawEngine.updateCursor(); }
        if(data.cc === 2) { DrawState.z = 2 + (val/127)*50; DrawEngine.updateCursor(); }
        if(data.cc === 3) { DrawState.chroma = (val/127)*360; DrawEngine.updateCursor(); }
    }

    // COMMUNS
    if(data.cc === 4) {
        const newTime = (val / 127) * 60;
        transport.setTime(newTime);
        PreviewEngine.sync(newTime, false);
    }
    if(data.cc === 5) {
        const zoom = 1 + (val/127)*4;
        previewContainer.style.transform = `scale(${zoom})`;
    }
});

// MIDI PADS
socket.on('/pad/trigger', (data) => {
    const note = data.midi_note_raw;
    if ([36, 48, 0].includes(note)) transport.toggle();
    if ([37, 49, 1].includes(note)) transport.stop();
    if ([38, 50, 2].includes(note)) {
        if (!DrawState.isDrawing) DrawEngine.startStroke(); else DrawEngine.endStroke();
    }
    if ([39, 51, 3].includes(note)) toggleSelectorMode();
});


// =================================================================
// 11. INITIALISATION FINALE
// =================================================================

const studioCore = { togglePlayback: () => transport.toggle() };
new KeyboardController(studioCore);

document.getElementById('btn-play').addEventListener('click', () => transport.play());
document.getElementById('btn-pause').addEventListener('click', () => transport.pause());

initAssetLibrary();
DrawEngine.updateCursor();

console.log("✅ SYSTEME: Studio Main Loaded (V1.7 Final).");