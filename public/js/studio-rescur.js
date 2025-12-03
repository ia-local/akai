/**
 * STUDIO FINAL (VERSION STABLE & CORRIGÉE)
 * Tout est ici. Pas de dépendances cachées pour la logique critique.
 */

// --- 1. IMPORTS (Moteurs Graphiques & Utilitaires) ---
import { AsciiTensorEngine } from './AsciiTensorEngine.js';
import { WebGLEngine } from './WebGLEngine.js';
import { AsciiProcessor } from './asciiModule.js';
import { ModalSystem } from './modalSystem.js';
import { AsciiSoupEngine } from './AsciiSoupEngine.js';
import { MultiCalcSession } from './multiCalc.js';

console.log("🚀 STUDIO FINAL : Démarrage...");

// =================================================================
// 2. ETAT GLOBAL (STATE)
// =================================================================
const State = {
    // Transport
    time: 0,
    isPlaying: false,
    pixelsPerSecond: 50,
    
    // MIDI Values (0-127)
    knobs: [0, 0, 0, 0, 0, 0], 
    
    // Modes
    isSelectorMode: false, // False = Perform, True = Edit
    isWebGLEnabled: false,
    
    // Dessin
    draw: { x: 50, y: 50, z: 20, chroma: 0, isDrawing: false },
    drawCurrent: { x: 50, y: 50, z: 20, chroma: 0 }, // Pour le lissage
    
    // Données
    clips: [] 
};

// =================================================================
// 3. SÉLECTION DOM (CACHE)
// =================================================================
const dom = {
    playhead: document.getElementById('playhead'),
    timeDisplay: document.getElementById('timecode-display'),
    tracks: document.getElementById('timeline-tracks-container'),
    wrapper: document.getElementById('timeline-content-wrapper'),
    
    preview: document.getElementById('preview-media-container'),
    video: document.getElementById('player-video'),
    image: document.getElementById('player-image'),
    ascii: document.getElementById('ascii-canvas'),
    webgl: document.getElementById('webgl-canvas'),
    placeholder: document.getElementById('player-placeholder'),
    
    cursor: document.getElementById('drawing-cursor'),
    paths: document.getElementById('drawn-paths'),
    
    library: document.getElementById('assets-list-container'),
    modeIndicator: document.getElementById('mode-indicator'),
    toggleGl: document.getElementById('toggle-gl-btn'),
    
    btnPlay: document.getElementById('btn-play'),
    btnPause: document.getElementById('btn-pause')
};

// =================================================================
// 4. INITIALISATION DES MOTEURS
// =================================================================
const socket = io();
window.modalSystem = new ModalSystem();
const sessionMgr = new MultiCalcSession();
const soupEngine = new AsciiSoupEngine();

// Moteur ASCII
let asciiEngine = null;
if (dom.ascii) {
    try {
        asciiEngine = new AsciiTensorEngine(dom.ascii);
        const resizeAscii = () => {
            if(dom.preview) asciiEngine.setResolution(dom.preview.clientWidth, dom.preview.clientHeight, '16:9');
        };
        window.addEventListener('resize', resizeAscii);
        setTimeout(resizeAscii, 100);
    } catch(e) { console.warn("ASCII Engine Error", e); }
}

// Moteur WebGL
let glEngine = null;
if (dom.webgl) {
    glEngine = new WebGLEngine(dom.webgl);
    dom.webgl.style.display = 'none';
    const resizeGL = () => {
        if(dom.preview) {
            dom.webgl.width = dom.preview.clientWidth;
            dom.webgl.height = dom.preview.clientHeight;
            glEngine.resize();
        }
    };
    window.addEventListener('resize', resizeGL);
}


// =================================================================
// 5. LOGIQUE TRANSPORT (TIMECODE & BOUCLE)
// =================================================================
const Transport = {
    rafId: null,
    lastTime: 0,

    start() {
        if (State.isPlaying) return;
        State.isPlaying = true;
        this.lastTime = performance.now();
        this.loop();
        console.log("▶ PLAY");
    },

    pause() {
        State.isPlaying = false;
        cancelAnimationFrame(this.rafId);
        console.log("⏸ PAUSE");
    },

    toggle() { State.isPlaying ? this.pause() : this.start(); },

    stop() {
        this.pause();
        this.setTime(0);
        console.log("⏹ STOP");
    },

    setTime(seconds) {
        State.time = Math.max(0, seconds);
        this.updateAll();
    },

    loop() {
        if (!State.isPlaying) return;
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        State.time += dt;
        this.updateAll();
        this.rafId = requestAnimationFrame(() => this.loop());
    },

    updateAll() {
        // 1. UI Timecode
        if(dom.timeDisplay) {
            const t = State.time;
            dom.timeDisplay.textContent = new Date(t * 1000).toISOString().substr(11, 8) + "." + (t % 1).toFixed(2).slice(2);
        }

        // 2. UI Playhead
        if(dom.playhead) {
            dom.playhead.style.transform = `translateX(${State.time * State.pixelsPerSecond}px)`;
        }

        // 3. WebGL
        if(glEngine && State.isWebGLEnabled) {
            glEngine.updateUniforms(State.time, State.knobs);
            glEngine.render();
        }

        // 4. Moteurs Visuels
        updateCursorUI();
        syncMedia(State.time);
    }
};


// =================================================================
// 6. GESTION MIDI (DIRECTE & ROBUSTE)
// =================================================================
socket.on('midi_cc', (data) => {
    const val = data.value; // 0-127
    if(data.cc >= 0 && data.cc <= 5) State.knobs[data.cc] = val;

    // --- COMMANDES GLOBALES ---
    
    // KNOB 5 (CC 4) : TIMELINE SCRUBBING
    if (data.cc === 4) {
        const TIMELINE_SCALE = 300; // 5 minutes
        const newTime = (val / 127) * TIMELINE_SCALE;
        
        Transport.setTime(newTime);
        
        // Auto-Scroll
        if (dom.wrapper) {
            const px = newTime * State.pixelsPerSecond;
            const center = dom.wrapper.clientWidth / 2;
            dom.wrapper.scrollLeft = (px > center) ? px - center : 0;
        }
    }

    // KNOB 6 (CC 5) : ZOOM
    if (data.cc === 5) {
        const zoom = 1 + (val / 127) * 4;
        if(dom.preview) {
            dom.preview.style.transform = `scale(${zoom})`;
            dom.preview.style.transformOrigin = 'center center';
        }
    }

    // --- MODE PERFORM (DESSIN) ---
    if (!State.isSelectorMode) {
        switch (data.cc) {
            case 0: State.draw.x = (val / 127) * 100; break;
            case 1: State.draw.y = 100 - ((val / 127) * 100); break;
            case 2: State.draw.z = 2 + (val / 127) * 50; break;
            case 3: State.draw.chroma = (val / 127) * 360; break;
        }
        updateCursorUI();
    }
});

socket.on('/pad/trigger', (data) => {
    const note = data.midi_note_raw;
    // PAD 1 (Play)
    if ([36, 48, 0].includes(note)) Transport.toggle();
    // PAD 2 (Stop)
    if ([37, 49, 1].includes(note)) Transport.stop();
    // PAD 3 (Dessin)
    if ([38, 50, 2].includes(note)) {
        State.draw.isDrawing = !State.draw.isDrawing;
        if(State.draw.isDrawing) startStroke(); else endStroke();
    }
    // PAD 4 (Mode)
    if ([39, 51, 3].includes(note)) {
        State.isSelectorMode = !State.isSelectorMode;
        if(dom.modeIndicator) {
            dom.modeIndicator.textContent = State.isSelectorMode ? "MODE: EDIT" : "MODE: PERFORM";
            dom.modeIndicator.className = State.isSelectorMode ? "px-3 py-1 rounded text-xs font-bold bg-red-900 text-red-400 border border-red-700" : "px-3 py-1 rounded text-xs font-bold bg-green-900 text-green-400 border border-green-700";
        }
    }
});


// =================================================================
// 7. LOGIQUE VISUELLE & CLIPS
// =================================================================

function updateCursorUI() {
    if (!dom.cursor) return;
    
    // Lissage (Lerp)
    const smoothing = 0.15;
    State.drawCurrent.x += (State.draw.x - State.drawCurrent.x) * smoothing;
    State.drawCurrent.y += (State.draw.y - State.drawCurrent.y) * smoothing;
    State.drawCurrent.z += (State.draw.z - State.drawCurrent.z) * smoothing;
    
    const s = State.drawCurrent;
    const half = s.z / 2;

    dom.cursor.setAttribute('x', s.x - half);
    dom.cursor.setAttribute('y', s.y - half);
    dom.cursor.setAttribute('width', s.z);
    dom.cursor.setAttribute('height', s.z);
    dom.cursor.setAttribute('fill', `hsla(${State.draw.chroma}, 100%, 50%, 0.3)`);
    dom.cursor.setAttribute('stroke', `hsl(${State.draw.chroma}, 100%, 80%)`);

    if(State.draw.isDrawing) addPointToPath();
}

function startStroke() {
    if(!dom.paths) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `hsl(${State.draw.chroma}, 100%, 50%)`);
    path.setAttribute("stroke-width", Math.max(1, State.drawCurrent.z / 4));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    dom.paths.appendChild(path);
    State.draw.currentPath = path;
    State.draw.points = [];
    addPointToPath();
}

function addPointToPath() {
    if(!State.draw.currentPath) return;
    State.draw.points.push(`${State.drawCurrent.x} ${State.drawCurrent.y}`);
    const pts = State.draw.points;
    const d = (pts.length===1) ? `M ${pts[0]}` : `M ${pts[0]} L ` + pts.slice(1).join(' ');
    State.draw.currentPath.setAttribute("d", d);
}
function endStroke() { State.draw.currentPath = null; }

// --- SYNC MEDIA ---
function syncMedia(time) {
    // 1. Trouver le clip
    const clip = State.clips.find(c => time >= c.start && time < c.start + c.duration);
    
    if (!clip) {
        dom.placeholder.classList.add('active');
        dom.video.classList.remove('active');
        dom.image.classList.remove('active');
        dom.ascii.classList.remove('active');
        return;
    }

    const url = clip.asset.url || clip.asset.path;
    
    // 2. Affichage selon type
    if (clip.asset.type.includes('video')) {
        dom.placeholder.classList.remove('active');
        dom.image.classList.remove('active');
        dom.video.classList.add('active');

        if (!dom.video.src.includes(url)) dom.video.src = url;
        
        const localTime = time - clip.start;
        // Drift Correction
        if (Math.abs(dom.video.currentTime - localTime) > 0.3) dom.video.currentTime = localTime;
        
        if (State.isPlaying && dom.video.paused) dom.video.play().catch(()=>{});
        if (!State.isPlaying && !dom.video.paused) dom.video.pause();

    } else if (clip.asset.type.includes('image')) {
        dom.placeholder.classList.remove('active');
        dom.video.classList.remove('active');
        dom.image.classList.add('active');
        if (!dom.image.src.includes(url)) dom.image.src = url;

    } else if (clip.asset.type.includes('text')) {
        // Gestion ASCII
        dom.ascii.classList.add('active');
        if (asciiEngine && !clip.textContentLoaded) {
            fetch(url).then(r=>r.text()).then(t => {
                clip.textContentLoaded = t;
                clip.processed = AsciiProcessor.process(t);
            });
        }
        if (asciiEngine && clip.processed) {
             asciiEngine.render(clip.processed);
        }
    }
}


// =================================================================
// 8. DRAG & DROP + LOAD ASSETS
// =================================================================

fetch('/api/assets').then(r=>r.json()).then(data => {
    window.assetsData = data.assets;
    renderLibrary(data.assets);
});

function renderLibrary(assets) {
    if(!dom.library) return;
    dom.library.innerHTML = '';
    ['video', 'images', 'text'].forEach(cat => {
        if (!assets[cat]) return;
        const h3 = document.createElement('h3');
        h3.className = "text-xs font-bold text-gray-500 uppercase mt-2 pl-2 border-l-2 border-gray-700";
        h3.textContent = cat;
        dom.library.appendChild(h3);
        
        assets[cat].forEach(item => {
            const el = document.createElement('div');
            el.className = "cursor-grab p-2 mb-1 text-xs bg-[#252525] rounded text-gray-300 truncate border-l-2 border-gray-600";
            el.textContent = item.name;
            el.draggable = true;
            el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', item.id));
            dom.library.appendChild(el);
        });
    });
}

if (dom.tracks) {
    dom.tracks.querySelectorAll('.timeline-track').forEach(track => {
        track.addEventListener('dragover', e => {
            e.preventDefault();
            track.style.backgroundColor = '#333';
        });
        track.addEventListener('dragleave', e => {
            track.style.backgroundColor = '#2a2a2a';
        });
        track.addEventListener('drop', e => {
            e.preventDefault();
            track.style.backgroundColor = '#2a2a2a';
            const id = e.dataTransfer.getData('text/plain');
            
            let asset = null;
            for(let k in window.assetsData) {
                asset = window.assetsData[k].find(a => a.id === id);
                if(asset) break;
            }
            
            if(asset) {
                const rect = dom.tracks.getBoundingClientRect();
                const x = e.clientX - rect.left + (dom.wrapper ? dom.wrapper.scrollLeft : 0);
                const startTime = Math.max(0, x / State.pixelsPerSecond);
                
                addClip(asset, track.id, startTime);
                Transport.setTime(startTime);
            }
        });
    });
}

function addClip(asset, trackId, startTime) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const clip = {
        id: 'clip_' + Date.now(),
        asset: asset,
        start: startTime,
        duration: asset.duration || 5.0,
        el: document.createElement('div')
    };
    
    clip.el.className = 'timeline-clip absolute h-8 flex items-center overflow-hidden text-white text-xs px-1 rounded shadow cursor-pointer';
    clip.el.style.left = (startTime * State.pixelsPerSecond) + 'px';
    clip.el.style.width = (clip.duration * State.pixelsPerSecond) + 'px';
    clip.el.textContent = asset.name;
    
    // Couleur selon type
    if(asset.type.includes('video')) clip.el.style.backgroundColor = '#ef4444';
    else if(asset.type.includes('image')) clip.el.style.backgroundColor = '#d946ef';
    else if(asset.type.includes('text')) clip.el.style.backgroundColor = '#22c55e';
    else clip.el.style.backgroundColor = '#555';

    track.appendChild(clip.el);
    State.clips.push(clip);
}


// =================================================================
// 9. EVENEMENTS CLAVIER & UI
// =================================================================

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // SPACE = PLAY/PAUSE
    if (e.code === 'Space') {
        e.preventDefault();
        Transport.toggle();
    }
    // CTRL+S
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        console.log("Sauvegarde simulée");
    }
});

if(dom.btnPlay) dom.btnPlay.addEventListener('click', () => Transport.start());
if(dom.btnPause) dom.btnPause.addEventListener('click', () => Transport.pause());

if(dom.toggleGl) {
    dom.toggleGl.addEventListener('click', () => {
        State.isWebGLEnabled = !State.isWebGLEnabled;
        if(State.isWebGLEnabled) {
            dom.toggleGl.classList.add('text-blue-400');
            if(dom.webgl) dom.webgl.style.display = 'block';
        } else {
            dom.toggleGl.classList.remove('text-blue-400');
            if(dom.webgl) dom.webgl.style.display = 'none';
        }
    });
}

// Init Visuel
if(dom.cursor) updateCursorUI();