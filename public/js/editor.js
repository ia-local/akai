/**
 * STUDIO MAIN MODULE (V2.0 MODULAR)
 * Cœur de l'application Studio de Montage AV.
 * Orchestration des modules : Library, Preview, Drawing, MIDI, Transport, ToolSystem.
 */

// =================================================================
// 1. IMPORTS
// =================================================================

// Core Systems
import { Transport } from './core/Transport.js'; // ou './timeCode.js' selon ton nettoyage
import { TimelineManager } from './systems/TimelineSystem.js'; // ou './timelineManager.js'
import { KeyboardController } from './core/eventKeyboard.js';
import { MultiCalcSession } from './multiCalc.js';
import { MidiInput } from './core/MidiInput.js'; // Si tu l'as créé, sinon MidiSystem

// UI Systems
import { ModalSystem } from './modalSystem.js';
import { ConfigManager } from './modalConfig.js';

// Rendering Engines
import { AsciiSoupEngine } from './AsciiSoupEngine.js';
import { AsciiTensorEngine } from './AsciiTensorEngine.js';
import { AsciiCanvasEngine } from './AsciiCanvasEngine.js';
import { WebGLEngine } from './WebGLEngine.js';
import { PaintEngine } from './engines/PaintEngine.js'; // <--- NOUVEAU

// Functional Modules
import { ToolSystem } from './modules/ToolSystem.js'; // <--- NOUVEAU
import { TENSOR_GLYPHS } from './data/AsciiGlyphs.js'; // <--- NOUVEAU (Données pour le Stamp)

// =================================================================
// 2. CONSTANTES & GLOBALES
// =================================================================
const PIXELS_PER_SECOND = 50;
const socket = io('http://localhost:3145'); // Adapter port si besoin

// Globales (Héritage V1)
window.modalSystem = new ModalSystem(); 
const sessionMgr = new MultiCalcSession();
const configMgr = new ConfigManager();
// const rulerSystem = new RulerOverlay('ruler-layer', 'preview-media-container'); // Futur

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
    if (previewContainer) {
        const w = previewContainer.clientWidth;
        const h = previewContainer.clientHeight;

        if (asciiCanvas) {
            asciiCanvas.width = w;
            asciiCanvas.height = h;
            if (asciiEngine && asciiEngine.setResolution) {
                asciiEngine.setResolution(w, h, '16:9');
            }
        }
        
        if (paintCanvas) {
            // Attention : redimensionner un canvas l'efface !
            // Pour l'instant on initialise juste si vide
            if (paintCanvas.width === 0 || paintCanvas.width === 300) { // 300 default
                paintCanvas.width = w;
                paintCanvas.height = h;
            }
        }
        
        if (glEngine && glEngine.resize) glEngine.resize();
    }
}
window.addEventListener('resize', resizeRenderers);
setTimeout(resizeRenderers, 100);

// =================================================================
// 5. INSTANCIATION DES MODULES MÉTIER
// =================================================================

// Timeline Manager
// Note: Assurez-vous que TimelineManager est bien importé
window.timelineMgr = new TimelineManager(tracksContainer, PIXELS_PER_SECOND);

// Tool System (Le Chef d'Orchestre Interaction)
// Injection : Vecteur (null pour l'instant ou SVG engine), Raster (paintEngine), Données (GLYPHS)
// Pour le SVG Engine, on peut passer un objet dummy ou le vrai moteur SVG si vous l'avez
const dummySvgEngine = { state: { isDrawing: false }, startStroke: ()=>{}, endStroke: ()=>{}, updateState: ()=>{} }; 

const toolSystem = new ToolSystem(dummySvgEngine, paintEngine, TENSOR_GLYPHS);

// =================================================================
// 6. LOGIQUE TRANSPORT (Heartbeat)
// =================================================================

const transport = new Transport({
    onTick: (time) => {
        // UI Updates
        const tcDisp = document.getElementById('timecode-display');
        const ph = document.getElementById('playhead');
        if(tcDisp) tcDisp.textContent = transport.formatTime(time);
        if(ph) ph.style.transform = `translateX(${time * PIXELS_PER_SECOND}px)`;
        
        // Sync WebGL Uniforms
        if (glEngine && webglCanvas.style.display !== 'none') {
            // glEngine.updateUniforms(time, [64,64,64,64]); // TODO: Lier MIDI
            glEngine.render();
        }
    },
    onStop: () => {
        const ph = document.getElementById('playhead');
        if(ph) ph.style.transform = `translateX(0px)`;
    }
});

// =================================================================
// 7. INITIALISATION UI
// =================================================================

document.getElementById('btn-play')?.addEventListener('click', () => transport.play());
document.getElementById('btn-pause')?.addEventListener('click', () => transport.pause());

// Toggle WebGL
if(toggleGlBtn) toggleGlBtn.addEventListener('click', () => {
    if (webglCanvas.style.display === 'none') {
        toggleGlBtn.classList.add('text-blue-400');
        webglCanvas.style.display = 'block';
    } else {
        toggleGlBtn.classList.remove('text-blue-400');
        webglCanvas.style.display = 'none';
    }
});

// Init Asset Library
// (Votre code existant pour fetch /api/assets)

console.log("✅ SYSTEME: Editor Immersive Loaded.");