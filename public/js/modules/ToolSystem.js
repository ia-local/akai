// public/js/modules/ToolSystem.js

export class ToolSystem {
    constructor(drawingEngine, paintEngine, glyphsData) {
        this.svgEngine = drawingEngine;      // Moteur Vectoriel (Pad 5)
        this.paintEngine = paintEngine;      // Moteur Bitmap/Tensor (Pad 6)
        
        // Données des Glyphes
        this.glyphs = glyphsData;
        this.glyphKeys = Object.keys(this.glyphs.chars); 
        this.currentGlyphIndex = 0;

        // État
        this.activeTool = 'cursor'; // 'cursor', 'brush-svg', 'stamp-ascii', 'eraser'
        this.activeChar = this.glyphKeys[0];
        this.isDrawing = false;
        
        this._initInputListeners();
    }

    // --- API PUBLIQUE (Appelée par MIDI/UI) ---

    setTool(toolName) {
        this.activeTool = toolName;
        console.log(`🔧 Tool Active: ${toolName}`);
        
        // Curseur visuel CSS
        if (toolName === 'brush-svg') document.body.style.cursor = 'crosshair';
        else if (toolName === 'stamp-ascii') document.body.style.cursor = 'text';
        else if (toolName === 'eraser') document.body.style.cursor = 'not-allowed'; 
        else document.body.style.cursor = 'default';
    }

    // Pad 7 : Cycle Glyphe Suivant
    nextGlyph() {
        this.currentGlyphIndex = (this.currentGlyphIndex + 1) % this.glyphKeys.length;
        this.activeChar = this.glyphKeys[this.currentGlyphIndex];
        console.log(`🔤 Next Glyph: ${this.activeChar}`);
    }

    // --- GESTION DES ENTRÉES (Souris) ---

    _initInputListeners() {
        const container = document.getElementById('preview-media-container');
        if (!container) return;

        // On attache les écouteurs sur le container pour capturer à travers les calques
        container.addEventListener('mousedown', (e) => this._onStart(e));
        container.addEventListener('mousemove', (e) => this._onMove(e));
        window.addEventListener('mouseup', () => this._onEnd());
    }

    _onStart(e) {
        if (this.activeTool === 'cursor') return;
        this.isDrawing = true;
        
        const coords = this._getLocalCoords(e);
        this._applyTool(coords);
    }

    _onMove(e) {
        if (!this.isDrawing) return;
        const coords = this._getLocalCoords(e);
        this._applyTool(coords);
    }

    _onEnd() {
        if (this.activeTool === 'brush-svg') {
            this.svgEngine.endStroke();
        }
        this.isDrawing = false;
    }

    // --- APPLICATION DE L'OUTIL ---

    _applyTool(coords) {
        // 1. PINCEAU VECTORIEL (Pad 5)
        if (this.activeTool === 'brush-svg') {
            if (!this.svgEngine.state.isDrawing) this.svgEngine.startStroke(); 
            this.svgEngine.updateState('x', coords.normX); // SVG utilise 0-100%
            this.svgEngine.updateState('y', coords.normY);
        } 
        
        // 2. TAMPON ASCII / TENSOR (Pad 6)
        else if (this.activeTool === 'stamp-ascii') {
            const matrix = this.glyphs.chars[this.activeChar];
            const size = this.glyphs.meta.baseHeight || 10;
            
            // Snap to Grid (Alignement magnétique)
            const snapX = Math.floor(coords.x / size) * size;
            const snapY = Math.floor(coords.y / size) * size;

            this.paintEngine.drawMatrix(matrix, snapX, snapY, size);
        }

        // 3. GOMME (Pad 8)
        else if (this.activeTool === 'eraser') {
            this.paintEngine.erase(coords.x, coords.y, 20);
        }
    }

    _getLocalCoords(e) {
        const container = document.getElementById('preview-media-container');
        const rect = container.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        return {
            x: x, // Pixels (Canvas)
            y: y,
            normX: (x / rect.width) * 100, // Pourcentage (SVG)
            normY: (y / rect.height) * 100
        };
    }
}