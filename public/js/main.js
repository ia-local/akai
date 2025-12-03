/**
 * STUDIO MAIN MODULE (V2.0 MODULAR)
 * Cœur de l'application Studio de Montage AV.
 * Orchestration des modules : Library, Preview, Drawing, MIDI, Transport, ToolSystem.
 */

// =================================================================
// 1. IMPORTS
// =================================================================

// Core Systems
import { Transport } from './timeCode.js'; // ou './core/Transport.js' selon ton nettoyage
import { TimelineManager } from './timelineManager.js'; // ou './modules/TimelineManager.js'
import { KeyboardController } from './core/eventKeyboard.js';
import { MultiCalcSession } from './core/multiCalc.js';
import { MidiInput } from './core/MidiInput.js';

// UI Systems
import { ModalSystem } from './ui/modalSystem.js';
import { ConfigManager } from './ui/modalConfig.js';

// Rendering Engines
import { AsciiSoupEngine } from './engines/AsciiSoupEngine.js';
import { AsciiTensorEngine } from './engines/AsciiTensorEngine.js';
import { AsciiCanvasEngine } from './engines/AsciiCanvasEngine.js';
import { WebGLEngine } from './engines/WebGLEngine.js';

// Functional Modules
import { AssetLibrary } from './modules/AssetLibrary.js';
import { PreviewEngine } from './modules/PreviewEngine.js';
import { DrawingEngine } from './modules/DrawingEngine.js';
import { SoupManager } from './modules/SoupManager.js';
import { ToolSystem } from './modules/ToolSystem.js'; // <--- NOUVEAU
import { PaintEngine } from './engines/PaintEngine.js';
// Data
import { TENSOR_GLYPHS } from '../data/AsciiGlyphs.js'; // <--- NOUVEAU
import { RulerOverlay } from './modules/RulerOverlay.js'; // <--- NOUVEAU
// =================================================================
// 2. CONSTANTES & GLOBALES
// =================================================================
const PIXELS_PER_SECOND = 50;
const socket = io('http://localhost:3145');

// Globales (Héritage V1)
window.modalSystem = new ModalSystem(); 
const sessionMgr = new MultiCalcSession();
const configMgr = new ConfigManager();
const rulerSystem = new RulerOverlay('ruler-layer', 'preview-media-container');
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

// --- A. MOTEUR PAINT (Bitmap/Tensor) ---
// Note: Assure-toi que <canvas id="paint-layer"> existe dans index.html

const paintCanvas = document.getElementById('paint-layer') || document.createElement('canvas'); 
// On utilise la classe spécialisée PaintEngine
const paintEngine = new PaintEngine(paintCanvas);
console.log("✅ Moteur Paint : Activé sur #paint-layer");
// --- B. MOTEUR ASCII MONITORING (Tensor avec fallback) ---
const asciiCanvas = document.getElementById('ascii-canvas');
let asciiEngine;
try {
    asciiEngine = new AsciiTensorEngine(asciiCanvas);
    console.log("✅ Moteur ASCII Monitoring : Tensor Engine activé.");
} catch (e) {
    asciiEngine = new AsciiCanvasEngine(asciiCanvas);
    console.warn("⚠️ Moteur ASCII Monitoring : Fallback Canvas.");
}

// --- C. MOTEUR WEBGL (Shader) ---
const webglCanvas = document.getElementById('webgl-canvas');
let glEngine = null;
if (webglCanvas) {
    glEngine = new WebGLEngine(webglCanvas);
    webglCanvas.style.display = 'none'; // Masqué par défaut
}

// Gestion du Redimensionnement (Responsive)
function resizeRenderers() {
    if (asciiCanvas && previewContainer) {
        asciiCanvas.width = previewContainer.clientWidth;
        asciiCanvas.height = previewContainer.clientHeight;
        if (rulerSystem) rulerSystem.resize();
        // Mise à jour du monitoring 16:9
        if (asciiEngine && asciiEngine.setResolution) {
            asciiEngine.setResolution(previewContainer.clientWidth, previewContainer.clientHeight, '16:9');
        }
    }
    // Mise à jour du moteur Paint pour qu'il suive la taille de la fenêtre
    if (paintCanvas && previewContainer) {
        // On ne reset pas width/height ici sinon on perd le dessin ! 
        // Idéalement, on gère ça via CSS ou un buffer offscreen, 
        // mais pour l'instant on s'assure juste qu'il a une taille initiale.
        if (paintCanvas.width === 0) {
            paintCanvas.width = previewContainer.clientWidth;
            paintCanvas.height = previewContainer.clientHeight;
        }
    }
    if (glEngine && glEngine.resize) glEngine.resize();
}
window.addEventListener('resize', resizeRenderers);
setTimeout(resizeRenderers, 100);

// =================================================================
// 5. INSTANCIATION DES MODULES MÉTIER
// =================================================================

// Timeline Manager
window.timelineMgr = new TimelineManager(tracksContainer, PIXELS_PER_SECOND);

// Library Manager
const library = new AssetLibrary('assets-list-container', window.modalSystem);

// Drawing Engine (Vectoriel SVG)
const drawEngine = new DrawingEngine(
    document.getElementById('drawing-cursor'),
    document.getElementById('drawing-layer'),
    document.getElementById('drawn-paths')
);

// Preview Engine (Synchronisation)
const preview = new PreviewEngine({
    video: document.getElementById('player-video'),
    image: document.getElementById('player-image'),
    placeholder: document.getElementById('player-placeholder'),
    asciiCanvas: asciiCanvas,
    container: previewContainer
}, asciiEngine, glEngine);

// Soup Manager (Visualizer Matrix/Phi)
const soupManager = new SoupManager(asciiEngine, new AsciiSoupEngine());

// Tool System (Le Chef d'Orchestre Interaction)
// Injection : Vecteur (drawEngine), Raster (paintEngine), Données (GLYPHS)
const toolSystem = new ToolSystem(drawEngine, paintEngine, TENSOR_GLYPHS);

// =================================================================
// 6. LOGIQUE TRANSPORT (Heartbeat)
// =================================================================

const transport = new Transport({
    onTick: (time) => {
        // UI Updates
        document.getElementById('timecode-display').textContent = transport.formatTime(time);
        document.getElementById('playhead').style.transform = `translateX(${time * PIXELS_PER_SECOND}px)`;
        
        // Sync Preview (Video/Img/Ascii)
        const activeClips = window.timelineMgr.getClipsAtTime(time);
        preview.sync(time, transport.isPlaying, activeClips);

        // Sync WebGL Uniforms
        if (isWebGLEnabled && glEngine) {
            glEngine.updateUniforms(time, midiInput.getKnobState());
            glEngine.render();
        }
        
        // Update Drawing Cursor (pour suivre la souris/midi)
        drawEngine.updateCursor();
    },
    onStop: () => {
        document.getElementById('playhead').style.transform = `translateX(0px)`;
        preview.showPlaceholder();
    }
});

// =================================================================
// 7. LOGIQUE INTERACTION (UI & MIDI)
// =================================================================

let isSelectorMode = false; // False = PERFORM, True = EDIT/CLIP
let isWebGLEnabled = false;

// --- MIDI CONTROLLER ---
// --- MIDI CONTROLLER (Avec Logs de Debug) ---
const midiInput = new MidiInput(socket, {
    onKnob: (cc, normVal, rawVal) => {
        // Log Général Knob
        console.log(`🎛️ [KNOB] CC:${cc} | Val:${rawVal} (${normVal.toFixed(2)})`);

        // Routing Dynamique
        if (isSelectorMode) {
            // MODE EDIT
            const activeClips = window.timelineMgr.getClipsAtTime(transport.currentTime);
            const targetClip = activeClips.find(c => c.trackId === 'track-video' || c.trackId === 'track-image');
            
            if (targetClip) {
                const el = preview._isVideo(targetClip) ? preview.els.video : preview.els.image;
                if(cc === 0) {
                    el.style.opacity = normVal;
                    console.log(`   ↳ 👁️ EDIT: Opacity -> ${normVal.toFixed(2)}`);
                }
                if(cc === 1) {
                    el.style.transform = `scale(${1 + normVal * 2})`;
                    console.log(`   ↳ 🔍 EDIT: Scale -> ${(1 + normVal * 2).toFixed(2)}`);
                }
            } else {
                console.log(`   ↳ ⚠️ EDIT: Aucun clip actif sous la tête de lecture.`);
            }
        } else {
            // MODE PERFORM
            if(cc === 0) { 
                drawEngine.updateState('x', normVal * 100); 
                console.log(`   ↳ ✏️ DRAW: X -> ${Math.round(normVal * 100)}%`);
            }
            if(cc === 1) { 
                drawEngine.updateState('y', 100 - (normVal * 100));
                console.log(`   ↳ ✏️ DRAW: Y -> ${Math.round(100 - (normVal * 100))}%`);
            }
            if(cc === 2) { 
                drawEngine.updateState('z', 2 + normVal * 50);
                console.log(`   ↳ ✏️ DRAW: Size -> ${(2 + normVal * 50).toFixed(1)}px`);
            }
            if(cc === 3) { 
                drawEngine.updateState('chroma', normVal * 360);
                console.log(`   ↳ 🎨 DRAW: Color (Hue) -> ${Math.round(normVal * 360)}°`);
            }
        }

        // COMMANDES TRANSPORT GLOBALES (Toujours actives)
        if(cc === 4) { 
            const newTime = normVal * 60;
            transport.setTime(newTime);
            preview.sync(newTime, false, window.timelineMgr.getClipsAtTime(newTime));
            console.log(`   ↳ ⏩ TIMELINE: Scrub -> ${transport.formatTime(newTime)}`);
        }
        if(cc === 5) { 
            previewContainer.style.transform = `scale(${1 + normVal * 4})`;
            console.log(`   ↳ 🔭 GLOBAL: Interface Zoom -> ${(1 + normVal * 4).toFixed(2)}x`);
        }
    },

    onPad: (note) => {
        // Log Général Pad
        console.log(`🎹 [PAD] Note:${note}`);

        // --- TRANSPORT (Pad 1-2) ---
        if ([36, 48, 0].includes(note)) {
            transport.toggle();
            console.log(`   ↳ ▶️ ACTION: Play/Pause`);
        }
        if ([37, 49, 1].includes(note)) {
            transport.stop();
            console.log(`   ↳ ⏹️ ACTION: Stop`);
        }
        
        // --- DESSIN SVG (Pad 3) ---
        if ([38, 50, 2].includes(note)) {
            if (!drawEngine.state.isDrawing) {
                drawEngine.startStroke(); 
                console.log(`   ↳ ✏️ ACTION: Start Stroke (Vector)`);
            } else {
                drawEngine.endStroke();
                console.log(`   ↳ ✏️ ACTION: End Stroke (Vector)`);
            }
        }
        
        // --- MODE SWITCH (Pad 4) ---
        if ([39, 51, 3].includes(note)) {
            toggleSelectorMode();
            console.log(`   ↳ 🔄 ACTION: Switch Mode -> ${isSelectorMode ? 'EDIT' : 'PERFORM'}`);
        }

        // --- OUTILS DE DESSIN (Ligne 2) ---
        
        // PAD 5
        if (note === 4) {
            toolSystem.setTool('brush-svg');
            console.log("   ↳ 🛠️ TOOL: Pinceau Vectoriel (SVG) Activé");
        }
        
        // PAD 6
        if (note === 5) {
            toolSystem.setTool('stamp-ascii');
            console.log("   ↳ 🛠️ TOOL: Tampon ASCII (Tensor) Activé");
        }
        
        // PAD 7
        if (note === 6) {
            toolSystem.nextGlyph();
            console.log(`   ↳ 🔠 TOOL: Next Glyph`); // Le ToolSystem fait déjà un log de la lettre
        }
        
        // PAD 8
        if (note === 7) {
            toolSystem.setTool('eraser');
            console.log("   ↳ 🧽 TOOL: Gomme Activée");
        }
    }
});
// --- UI EVENT LISTENERS ---

// Toggle WebGL
if(toggleGlBtn) toggleGlBtn.addEventListener('click', () => {
    isWebGLEnabled = !isWebGLEnabled;
    if (isWebGLEnabled) {
        toggleGlBtn.classList.add('bg-blue-900', 'text-blue-200', 'border-blue-700');
        toggleGlBtn.classList.remove('bg-gray-800', 'text-gray-400', 'border-gray-600');
        toggleGlBtn.innerHTML = `<span>✨</span> GL FX: ON`;
        if(webglCanvas) webglCanvas.style.display = 'block';
    } else {
        toggleGlBtn.classList.remove('bg-blue-900', 'text-blue-200', 'border-blue-700');
        toggleGlBtn.classList.add('bg-gray-800', 'text-gray-400', 'border-gray-600');
        toggleGlBtn.innerHTML = `<span>✨</span> GL FX: OFF`;
        if(webglCanvas) webglCanvas.style.display = 'none';
    }
});

// Toggle Right Panel
function togglePanel() {
    rightPanel.classList.toggle('is-open');
    toggleToolsBtn.classList.toggle('active');
    setTimeout(resizeRenderers, 350);
}
if(toggleToolsBtn) toggleToolsBtn.addEventListener('click', togglePanel);
document.getElementById('close-tools-btn')?.addEventListener('click', togglePanel);

// Library View Switch
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

// Soup Button
const soupBtn = document.querySelector('#right-panel button:last-child');
if (soupBtn) {
    soupBtn.textContent = "SOUP VISUALIZER (PHI)";
    soupBtn.onclick = () => soupManager.runAnalysis(previewContainer.clientWidth, previewContainer.clientHeight);
}

// Mode Selector Visual Feedback
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

        // Recherche dans les data chargées par Library
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

            window.timelineMgr.addClip(asset, track.id, startTime);
            sessionMgr.save(window.timelineMgr, drawEngine.state);

            // Déplace la tête de lecture à l'endroit du drop
            transport.setTime(startTime); 
            preview.sync(startTime, false, window.timelineMgr.getClipsAtTime(startTime));
        }
    });
});

// =================================================================
// 9. DÉMARRAGE (STARTUP)
// =================================================================

(async function init() {
    // Listeners UI Transports
    document.getElementById('btn-play').addEventListener('click', () => transport.play());
    document.getElementById('btn-pause').addEventListener('click', () => transport.pause());
    
    // Keyboard Controller (Raccourcis Clavier)
    new KeyboardController({ togglePlayback: () => transport.toggle() });

    // Chargement Assets & Restore Session
    await library.init();
    
    // Restauration Session (Découplée de Library)
const savedData = sessionMgr.load();
    if (savedData.drawState) {
        Object.keys(savedData.drawState).forEach(k => {
            // ON EXCLUT LES PROPRIÉTÉS LIÉES AU DOM OU À L'ACTION TEMPS RÉEL
            if (k !== 'currentPath' && k !== 'isDrawing' && k !== 'points') {
                drawEngine.updateState(k, savedData.drawState[k]);
            }
        });
    }
    if (savedData.clips) {
        sessionMgr.restoreTimeline(window.timelineMgr, savedData.clips);
    }

    console.log("✅ SYSTEME: Studio Main V2.0 Modular Loaded.");
})();