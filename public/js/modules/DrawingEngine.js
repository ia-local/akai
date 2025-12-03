/**
 * MODULE: DRAWING ENGINE
 * Rôle : Gère le dessin SVG (Drawing Layer) et le curseur.
 */
export class DrawingEngine {
    constructor(cursorEl, layerEl, pathsGroupEl) {
        this.cursorEl = cursorEl;
        this.layerEl = layerEl;
        this.pathsGroup = pathsGroupEl;

        // Configuration initiale SVG
        if (this.layerEl) {
            this.layerEl.setAttribute('viewBox', '0 0 100 100');
            this.layerEl.setAttribute('preserveAspectRatio', 'none');
        }

        // État interne (Accessible pour MIDI)
        this.state = {
            x: 50, y: 50, z: 20, chroma: 0,
            isDrawing: false,
            currentPath: null,
            points: []
        };
    }

    // --- STATE MANAGEMENT ---
    
    // Met à jour une propriété (utilisé par MIDI CC)
    updateState(key, val) {
        if (this.state.hasOwnProperty(key)) {
            this.state[key] = val;
            this.updateCursor();
        }
    }

    // --- ACTIONS DESSIN ---

    startStroke() {
        if (!this.pathsGroup) return;
        this.state.isDrawing = true;
        this.state.points = [];
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", `hsl(${this.state.chroma}, 100%, 50%)`);
        path.setAttribute("stroke-width", Math.max(1, this.state.z / 4));
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("vector-effect", "non-scaling-stroke");
        
        this.pathsGroup.appendChild(path);
        this.state.currentPath = path;
        this._addPointToPath();
    }

    endStroke() {
        this.state.isDrawing = false;
        this.state.currentPath = null;
    }

    clear() {
        if (this.pathsGroup) this.pathsGroup.innerHTML = '';
    }

    // --- RENDU CURSEUR & PATH ---

    updateCursor() {
        if (!this.cursorEl) return;
        const halfSize = this.state.z / 2;
        
        this.cursorEl.setAttribute('x', this.state.x - halfSize);
        this.cursorEl.setAttribute('y', this.state.y - halfSize);
        this.cursorEl.setAttribute('width', this.state.z);
        this.cursorEl.setAttribute('height', this.state.z);
        
        this.cursorEl.setAttribute('fill', `hsla(${this.state.chroma}, 100%, 50%, 0.3)`);
        this.cursorEl.setAttribute('stroke', `hsl(${this.state.chroma}, 100%, 80%)`);
        
        if (this.state.isDrawing) this._addPointToPath();
    }

_addPointToPath() {
        // CORRECTION DE SÉCURITÉ :
        // On vérifie si currentPath existe ET si c'est bien un élément qui possède setAttribute
        if (!this.state.currentPath || typeof this.state.currentPath.setAttribute !== 'function') {
            // Si le path est invalide (ex: issu d'une sauvegarde JSON), on arrête ou on réinitialise
            if (this.state.isDrawing) {
                // Optionnel : On peut forcer l'arrêt du dessin pour éviter d'autres erreurs
                this.state.isDrawing = false; 
                this.state.currentPath = null;
            }
            return;
        }

        this.state.points.push(`${this.state.x} ${this.state.y}`);
        
        let d = (this.state.points.length === 1) 
            ? `M ${this.state.points[0]}` 
            : `M ${this.state.points[0]} L ` + this.state.points.slice(1).join(' ');
            
        this.state.currentPath.setAttribute("d", d);
    }
}