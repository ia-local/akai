/**
 * STUDIO MAIN MODULE (V2.2 QUANTUM INDEX)
 * - Restauration Configuration Initiale (Dessin/Tensor)
 * - Intégration Pad 15 (Sélecteur Index Superposition 1-8)
 * - Intégration Audio & Quantum Safe
 */

// =================================================================
// 1. IMPORTS
// =================================================================

import { Transport } from './timeCode.js';
import { TimelineManager } from './timelineManager.js';
import { KeyboardController } from './core/eventKeyboard.js';
import { MultiCalcSession } from './core/multiCalc.js';
import { MidiInput } from './core/MidiInput.js';
import { ModalSystem } from './ui/modalSystem.js';
import { ConfigManager } from './ui/modalConfig.js';

// Rendering Engines
import { AsciiSoupEngine } from './engines/AsciiSoupEngine.js';
import { AsciiTensorEngine } from './engines/AsciiTensorEngine.js';
import { AsciiCanvasEngine } from './engines/AsciiCanvasEngine.js';
import { WebGLEngine } from './engines/WebGLEngine.js';
import { PaintEngine } from './engines/PaintEngine.js';

// MOTEURS ADDITIONNELS (Audio / Quantum)
import { AudioEngine } from './modules/AudioEngine.js';
import { QuantumComputeEngine } from './engines/QuantumComputeEngine.js';

// Functional Modules
import { AssetLibrary } from './modules/AssetLibrary.js';
import { PreviewEngine } from './modules/PreviewEngine.js';
import { DrawingEngine } from './modules/DrawingEngine.js';
import { SoupManager } from './modules/SoupManager.js';
import { ToolSystem } from './modules/ToolSystem.js';
import { TENSOR_GLYPHS } from '../data/AsciiGlyphs.js';
import { RulerOverlay } from './modules/RulerOverlay.js';

// =================================================================
// 2. CONSTANTES & GLOBALES
// =================================================================
const PIXELS_PER_SECOND = 50;
const socket = io('http://localhost:3145');

// Globales
window.modalSystem = new ModalSystem(); 
const audioEngine = new AudioEngine(); 
const sessionMgr = new MultiCalcSession();
const configMgr = new ConfigManager();
const rulerSystem = new RulerOverlay('ruler-layer', 'preview-media-container');

// Gestion de l'Index Quantique (PAD 15)
window.quantumIndex = 1; 
const MAX_QUANTUM_INDEX = 8; 

console.log("✅ SYSTEME: AudioEngine Instantiated");

// =================================================================
// 3. SÉLECTION UI GLOBALE
// =================================================================
const previewContainer = document.getElementById('preview-media-container');
const toggleGlBtn = document.getElementById('toggle-gl-btn');
const toggleToolsBtn = document.getElementById('toggle-tools-btn');
const rightPanel = document.getElementById('right-panel');
const modeIndicator = document.getElementById('mode-indicator');
const tracksContainer = document.getElementById('timeline-tracks-container');

// =================================================================
// 4. INITIALISATION DES MOTEURS DE RENDU
// =================================================================

// --- A. MOTEUR PAINT ---
const paintCanvas = document.getElementById('paint-layer') || document.createElement('canvas'); 
const paintEngine = new PaintEngine(paintCanvas);
console.log("✅ Moteur Paint : Activé sur #paint-layer");

// --- B. MOTEUR ASCII MONITORING ---
const asciiCanvas = document.getElementById('ascii-canvas');
let asciiEngine;
try {
    asciiEngine = new AsciiTensorEngine(asciiCanvas);
    console.log("✅ Moteur ASCII Monitoring : Tensor Engine activé.");
} catch (e) {
    asciiEngine = new AsciiCanvasEngine(asciiCanvas);
    console.warn("⚠️ Moteur ASCII Monitoring : Fallback Canvas.");
}

// --- C. MOTEUR QUANTUM (Sur le layer WebGL Z-12) ---
// On récupère le canvas qui servait au WebGL
const quantumCanvas = document.getElementById('webgl-canvas');
let glEngine = null; // On désactive WebGL standard pour éviter les conflits

// Initialisation du Moteur Quantique (2D Safe)
const quantumEngine = new QuantumComputeEngine(quantumCanvas);

// On rend le canvas visible par défaut pour le mode Quantum
if (quantumCanvas) {
    quantumCanvas.style.display = 'block'; 
    quantumCanvas.style.opacity = '1';
    quantumCanvas.style.mixBlendMode = 'normal';
}

console.log("✅ Moteur Quantum : Initialisé (Mode Superposition)");

// --- Fonction Utilitaires Quantum ---

function toggleQuantumMode(active) {
    if (!quantumEngine) return;
    if (active) {
        previewContainer.classList.add('mode-quantum');
        quantumEngine.isRunning = true;
    } else {
        previewContainer.classList.remove('mode-quantum');
        quantumEngine.isRunning = false;
        // Nettoyage safe
        if (quantumCanvas) {
            const ctx = quantumCanvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, quantumCanvas.width, quantumCanvas.height);
        }
    }
}

async function triggerQuantumMutation() {
    console.log("🤖 Demande de mutation quantique à Llama-3...");
    const payload = {
        entanglement: quantumEngine.state.entanglement,
        probability: quantumEngine.state.probability,
        mood: window.quantumIndex > 4 ? "CHAOS" : "HARMONY"
    };
    try {
        await fetch('http://localhost:3145/api/quantum/mutate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("✨ Mutation envoyée !");
    } catch (e) { console.error(e); }
}

// --- Gestion du Redimensionnement ---
function resizeRenderers() {
    if (asciiCanvas && previewContainer) {
        asciiCanvas.width = previewContainer.clientWidth;
        asciiCanvas.height = previewContainer.clientHeight;
        
        if (quantumEngine) {
            quantumEngine.resize(previewContainer.clientWidth, previewContainer.clientHeight);
        }

        if (rulerSystem) rulerSystem.resize();
        if (asciiEngine && asciiEngine.setResolution) {
            asciiEngine.setResolution(previewContainer.clientWidth, previewContainer.clientHeight, '16:9');
        }
    }
    if (paintCanvas && previewContainer) {
        if (paintCanvas.width === 0) {
            paintCanvas.width = previewContainer.clientWidth;
            paintCanvas.height = previewContainer.clientHeight;
        }
    }
}
window.addEventListener('resize', resizeRenderers);
setTimeout(resizeRenderers, 100);

// =================================================================
// 5. INSTANCIATION DES MODULES MÉTIER
// =================================================================

window.timelineMgr = new TimelineManager(tracksContainer, PIXELS_PER_SECOND);
const library = new AssetLibrary('assets-list-container', window.modalSystem);

const drawEngine = new DrawingEngine(
    document.getElementById('drawing-cursor'),
    document.getElementById('drawing-layer'),
    document.getElementById('drawn-paths')
);

const preview = new PreviewEngine({
    video: document.getElementById('player-video'),
    image: document.getElementById('player-image'),
    placeholder: document.getElementById('player-placeholder'),
    asciiCanvas: asciiCanvas,
    container: previewContainer
}, asciiEngine, glEngine);

const soupManager = new SoupManager(asciiEngine, new AsciiSoupEngine());
const toolSystem = new ToolSystem(drawEngine, paintEngine, TENSOR_GLYPHS);

// =================================================================
// 6. LOGIQUE TRANSPORT (Heartbeat)
// =================================================================

const transport = new Transport({
    onTick: (time) => {
        // UI Updates
        document.getElementById('timecode-display').textContent = transport.formatTime(time);
        document.getElementById('playhead').style.transform = `translateX(${time * PIXELS_PER_SECOND}px)`;
        
        // Sync Preview
        const activeClips = window.timelineMgr.getClipsAtTime(time);
        preview.sync(time, transport.isPlaying, activeClips);

        // --- MOTEUR QUANTUM ---
        if (quantumEngine && quantumEngine.isRunning) {
            const videoEl = preview.els.video;
            if (videoEl && asciiCanvas) {
                quantumEngine.render(videoEl, asciiCanvas);
            }
        }
        
        // --- SYNC AUDIO ---
        if(!transport.isPlaying) {
             audioEngine.setTime(time);
        }
        
        // Update Drawing Cursor
        drawEngine.updateCursor();
    },
    onStop: () => {
        document.getElementById('playhead').style.transform = `translateX(0px)`;
        preview.showPlaceholder();
        audioEngine.stop();
        toggleQuantumMode(false);
    }
});

// =================================================================
// 7. LOGIQUE INTERACTION (UI & MIDI)
// =================================================================

let isSelectorMode = false;
let isWebGLEnabled = false;

// --- MIDI CONTROLLER (CONFIGURATION FINALE) ---
const midiInput = new MidiInput(socket, {
    onKnob: (cc, normVal, rawVal) => {
        // console.log(`🎛️ [KNOB] CC:${cc} | Val:${rawVal}`);

        if (isSelectorMode) {
            // MODE EDIT (Ta config originale)
            const activeClips = window.timelineMgr.getClipsAtTime(transport.currentTime);
            const targetClip = activeClips.find(c => c.trackId === 'track-video' || c.trackId === 'track-image');
            
            if (targetClip) {
                const el = preview._isVideo(targetClip) ? preview.els.video : preview.els.image;
                if(cc === 0) el.style.opacity = normVal;
                if(cc === 1) el.style.transform = `scale(${1 + normVal * 2})`;
            }
        } else {
            // MODE PERFORM
            
            // 1. TENSOR CURSOR / TROUILLOMETRE (Ascii Cursor)
            if (asciiEngine && previewContainer) {
                if (!window.midiCursor) window.midiCursor = { x: 0, y: 0 };
                const width = previewContainer.clientWidth;
                const height = previewContainer.clientHeight;

                if (cc === 0) {
                    window.midiCursor.x = normVal * width;
                    asciiEngine.updateCursor(window.midiCursor.x, window.midiCursor.y);
                }
                if (cc === 1) {
                    window.midiCursor.y = (1 - normVal) * height; 
                    asciiEngine.updateCursor(window.midiCursor.x, window.midiCursor.y);
                }
            }

            // 2. DESSIN VECTORIEL (Ta config originale)
            if(cc === 0) drawEngine.updateState('x', normVal * 100); 
            if(cc === 1) drawEngine.updateState('y', 100 - (normVal * 100));
            if(cc === 2) drawEngine.updateState('z', 2 + normVal * 50);
            if(cc === 3) drawEngine.updateState('chroma', normVal * 360);
        }

        // COMMANDES GLOBALES
        if(cc === 4) { 
            const newTime = normVal * 60;
            transport.setTime(newTime);
            preview.sync(newTime, false, window.timelineMgr.getClipsAtTime(newTime));
        }
        if(cc === 5) previewContainer.style.transform = `scale(${1 + normVal * 4})`;
    },

    onPad: (note) => {
        console.log(`🎹 [PAD] Note:${note}`);

        // --- LIGNE 1 : TRANSPORT ---
        if ([36, 48, 0].includes(note)) transport.toggle();
        if ([37, 49, 1].includes(note)) transport.stop();
        
        // --- DESSIN (START/STOP) ---
        if ([38, 50, 2].includes(note)) {
            if (!drawEngine.state.isDrawing) drawEngine.startStroke(); 
            else drawEngine.endStroke();
        }
        
        // --- SWITCH MODE ---
        if ([39, 51, 3].includes(note)) toggleSelectorMode();

        // --- LIGNE 2 : OUTILS ---
        if (note === 4) toolSystem.setTool('brush-svg');
        if (note === 5) toolSystem.setTool('stamp-ascii');
        if (note === 6) toolSystem.nextGlyph();
        if (note === 7) toolSystem.setTool('eraser');

        // --- PAD 14 : IA MUTATION ---
        if (note === 14) {
            triggerQuantumMutation();
        }

        // --- PAD 15 : INDEX QUANTIQUE (BOUCLE 1-8) ---
        if (note === 15) {
            // 1. Incrémentation
            if (!window.quantumIndex) window.quantumIndex = 1;
            window.quantumIndex++;
            if (window.quantumIndex > MAX_QUANTUM_INDEX) window.quantumIndex = 1;

            console.log(`🌌 PAD 15 : QUANTUM LAYER > [ Index ${window.quantumIndex} / 8 ]`);

            // 2. Sélection DOM
            const container = document.getElementById('preview-media-container');
            const drawingLayer = document.getElementById('drawing-layer');
            const quantumCanvas = document.getElementById('webgl-canvas');

            // 3. Reset États
            container.classList.remove('layer-mode-top', 'layer-mode-blend', 'mode-quantum');
            if(drawingLayer) drawingLayer.style.zIndex = '';
            if(quantumCanvas) quantumCanvas.style.zIndex = '';

            // 4. Application Mode via Index
            switch (window.quantumIndex) {
                case 1: // Standard (Initial)
                    console.log("   ↳ Mode 1 : Standard (Reset)");
                    break;
                
                case 2: // Boost (Dessin Prioritaire)
                    container.classList.add('layer-mode-top');
                    console.log("   ↳ Mode 2 🖌️ : Z-Boost (Dessin Top)");
                    break;

                case 3: // Fusion (Blend)
                    container.classList.add('layer-mode-blend');
                    console.log("   ↳ Mode 3 : Fusion Overlay");
                    break;

                case 4: // Quantum Front
                    container.classList.add('mode-quantum');
                    if(quantumCanvas) quantumCanvas.style.zIndex = 40;
                    console.log("   ↳ Mode 4 : Quantum Dominant");
                    break;
                
                default: // 5-8 Réservés
                    console.log(`   ↳ Mode ${window.quantumIndex} : (Dimension Réservée)`);
                    break;
            }
        }
        
        // Audio Trigger (Passif)
        audioEngine.triggerPad(note, 1.0);
    }
});

// --- SOCKETS ---
socket.on('init_state', (state) => {
    if(audioEngine) {
        audioEngine.updateSpatialState(state.cursor_x, state.cursor_y, state.cursor_z);
        audioEngine.updateEQ(state.eq_bass, state.eq_treble);
    }
});
socket.on('midi_cc', (data) => {
    if (data.variable === 'eq_bass') audioEngine.updateEQ(data.value, null);
    if (data.variable === 'eq_treble') audioEngine.updateEQ(null, data.value);
});

// --- UI LISTENERS ---
if(toggleGlBtn) toggleGlBtn.addEventListener('click', () => {
    isWebGLEnabled = !isWebGLEnabled;
    if (isWebGLEnabled) {
        if(webglCanvas) webglCanvas.style.display = 'block';
    } else {
        if(webglCanvas) webglCanvas.style.display = 'none';
    }
});

function togglePanel() {
    rightPanel.classList.toggle('is-open');
    toggleToolsBtn.classList.toggle('active');
    setTimeout(resizeRenderers, 350);
}
if(toggleToolsBtn) toggleToolsBtn.addEventListener('click', togglePanel);
document.getElementById('close-tools-btn')?.addEventListener('click', togglePanel);

document.getElementById('view-list-btn')?.addEventListener('click', (e) => {
    library.setViewMode('list');
    updateViewBtns(e.target, document.getElementById('view-grid-btn'));
});
document.getElementById('view-grid-btn')?.addEventListener('click', (e) => {
    library.setViewMode('grid');
    updateViewBtns(e.target, document.getElementById('view-list-btn'));
});
function updateViewBtns(active, inactive) {
    active.classList.add('active-view', 'text-white');
    inactive.classList.remove('active-view', 'text-white');
    inactive.classList.add('text-gray-500');
}

const soupBtn = document.querySelector('#right-panel button:last-child');
if (soupBtn) {
    soupBtn.textContent = "SOUP VISUALIZER (PHI)";
    soupBtn.onclick = () => soupManager.runAnalysis(previewContainer.clientWidth, previewContainer.clientHeight);
}

function toggleSelectorMode() {
    isSelectorMode = !isSelectorMode;
    if(modeIndicator) {
        modeIndicator.textContent = isSelectorMode ? "MODE: EDIT / CLIP" : "MODE: PERFORM";
        modeIndicator.className = isSelectorMode 
            ? "px-3 py-1 rounded text-xs font-bold bg-red-900 text-red-400 border border-red-700 transition-colors"
            : "px-3 py-1 rounded text-xs font-bold bg-green-900 text-green-400 border border-green-700 transition-colors";
    }
}

// =================================================================
// 8. DRAG AND DROP (TIMELINE)
// =================================================================

document.querySelectorAll('.timeline-track').forEach(track => {
    track.addEventListener('dragover', (e) => { e.preventDefault(); track.style.backgroundColor = '#333'; });
    track.addEventListener('dragleave', () => { track.style.backgroundColor = '#2a2a2a'; });
    track.addEventListener('drop', (e) => {
        e.preventDefault();
        track.style.backgroundColor = '#2a2a2a';
        
        const assetId = e.dataTransfer.getData('text/plain');
        if (!assetId) return;

        let asset = null;
        if (library.assetsData) {
            for (const group of Object.values(library.assetsData)) {
                asset = group.find(a => a.id === assetId);
                if (asset) break;
            }
        }

        if (asset) {
            const rect = tracksContainer.getBoundingClientRect();
            const dropX = e.clientX - rect.left;
            const startTime = Math.max(0, dropX / PIXELS_PER_SECOND);

            const newClip = window.timelineMgr.addClip(asset, track.id, startTime);
            sessionMgr.save(window.timelineMgr, drawEngine.state);

            if (track.id === 'track-audio') {
                audioEngine.loadTimelineClip(newClip);
            }

            transport.setTime(startTime); 
            preview.sync(startTime, false, window.timelineMgr.getClipsAtTime(startTime));
        }
    });
});

// =================================================================
// 9. DÉMARRAGE (STARTUP)
// =================================================================

(async function init() {
    // Initialisation Audio Safe
    document.getElementById('btn-play').addEventListener('click', async () => {
        if (!audioEngine.isInitialized) await audioEngine.init();
        transport.play();
        audioEngine.play();
    });
    
    document.getElementById('btn-pause').addEventListener('click', () => {
        transport.pause();
        audioEngine.pause();
    });
    
    new KeyboardController({ togglePlayback: () => {
        if(transport.isPlaying) {
             transport.pause();
             audioEngine.pause();
        } else {
             transport.play();
             audioEngine.play();
        }
    }});

    await library.init();
    
    const savedData = sessionMgr.load();
    if (savedData.drawState) {
        Object.keys(savedData.drawState).forEach(k => {
            if (k !== 'currentPath' && k !== 'isDrawing' && k !== 'points') {
                drawEngine.updateState(k, savedData.drawState[k]);
            }
        });
    }
    if (savedData.clips) {
        sessionMgr.restoreTimeline(window.timelineMgr, savedData.clips);
    }

    console.log("✅ SYSTEME: Studio Main V2.2 Loaded (Index Quantum Ready).");
})();