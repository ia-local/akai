/**
 * ENGINE: PAINT ENGINE (BITMAP/TENSOR)
 * Rôle : Moteur dédié au dessin créatif sur canvas (Tampon ASCII, Gomme).
 * Utilisé par : ToolSystem (Pad 6 & 8)
 */
export class PaintEngine {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        
        if (!this.canvas) {
            console.error("❌ PaintEngine: Canvas introuvable.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        
        // Configuration par défaut
        this.currentColor = { r: 74, g: 222, b: 128 }; // Vert Matrix (Tailwind green-400)
        
        // Sécurité dimensionnelle
        if (this.canvas.width === 0) {
            this.canvas.width = 1280;
            this.canvas.height = 720;
        }
    }

    /**
     * Définit la couleur du pinceau (RGB)
     */
    setColor(r, g, b) {
        this.currentColor = { r, g, b };
    }

    /**
     * Efface tout le calque
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // =================================================================
    // API OUTILS (Appelée par ToolSystem)
    // =================================================================

    /**
     * DESSIN TENSOR (STAMP)
     * Dessine une matrice ASCII à une position donnée.
     * @param {Array<string>} matrix - Tableau de chaînes (ex: TENSOR_GLYPHS.chars.A)
     * @param {number} x - Position X (en pixels)
     * @param {number} y - Position Y (en pixels)
     * @param {number} size - Taille de la police (en pixels, défaut 10)
     */
    drawMatrix(matrix, x, y, size = 10) {
        if (!matrix) return;

        this.ctx.save();
        
        // Configuration du style
        this.ctx.fillStyle = `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
        this.ctx.font = `${size}px monospace`;
        this.ctx.textBaseline = 'top'; // Important pour l'alignement grille

        // On assume une largeur fixe (monospace) pour l'alignement horizontal
        // Ratio approx 0.6 pour Consolas/Monospace standard, ou 10px si size=10
        const charWidth = size; // Simplification pour grille carrée, ou size * 0.6

        // Boucle de rendu de la matrice
        matrix.forEach((line, lineIndex) => {
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
                const char = line[charIndex];
                
                // On ne dessine que les pixels pleins (optimisation)
                if (char !== ' ') {
                    this.ctx.fillText(
                        char, 
                        x + (charIndex * charWidth), 
                        y + (lineIndex * size)
                    );
                }
            }
        });
        
        this.ctx.restore();
    }

    /**
     * GOMME (ERASER)
     * Efface une zone carrée autour de la position
     */
    erase(x, y, radius = 20) {
        // On centre la gomme sur le curseur
        this.ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
    }
}