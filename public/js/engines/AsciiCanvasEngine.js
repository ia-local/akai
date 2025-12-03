// public/js/engines/AsciiCanvasEngine.js

// IMPORTANT : Vérifie que le chemin d'import est correct selon où tu as rangé tes fichiers.
// Si ce fichier est dans /js/engines/ et les data dans /js/, utilise '../ascii-art-data.js'
import { asciiArt, maxLetterWidthInChars, maxLetterHeightInLines, baseCharWidth, baseCharHeight } from '../ascii-art-data.js';

export class AsciiCanvasEngine {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration par défaut
        this.currentColor = { r: 0, g: 255, b: 0 }; // Vert Matrix
        this.padding = 15;
        
        // Sécurité taille Canvas
        if (this.canvas.width === 0) {
            this.canvas.width = 1280; 
            this.canvas.height = 720;
        }
    }

    setColor(r, g, b) {
        this.currentColor = { r, g, b };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // =================================================================
    // 1. FONCTIONS TEXTE (Ton Code Original)
    // =================================================================

    /**
     * Dessine une phrase complète centrée sur le canvas
     */
    drawPhrase(text) {
        this.clear();
        if (!text) return;

        const normalizedText = text.toUpperCase();
        
        // Calcul de la largeur totale
        const charRealWidth = maxLetterWidthInChars * baseCharWidth;
        const totalWidth = (normalizedText.length * charRealWidth) + ((normalizedText.length - 1) * this.padding);
        
        // Centrage
        let startX = (this.canvas.width / 2) - (totalWidth / 2);
        const startY = (this.canvas.height / 2) - ((maxLetterHeightInLines * baseCharHeight) / 2);

        // Dessin lettre par lettre
        for (let i = 0; i < normalizedText.length; i++) {
            const char = normalizedText[i];
            this.drawLetter(char, startX, startY);
            startX += charRealWidth + this.padding;
        }
    }

    /**
     * Dessine une lettre unique (Utilisé par drawPhrase)
     */
    drawLetter(char, x, y) {
        const art = asciiArt[char];
        if (!art) return; // Caractère inconnu ou espace

        this.ctx.save(); // Isolation du style
        this.ctx.fillStyle = `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
        this.ctx.font = `${baseCharHeight}px monospace`;

        art.forEach((line, lineIndex) => {
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
                const pixelChar = line[charIndex];
                if (pixelChar !== ' ') {
                    this.ctx.fillText(pixelChar, x + charIndex * baseCharWidth, y + lineIndex * baseCharHeight);
                }
            }
        });
        this.ctx.restore();
    }

    // =================================================================
    // 2. FONCTIONS PAINT / TENSOR (Nouveaux Outils)
    // =================================================================

    /**
     * Dessine une matrice brute (Utilisé par ToolSystem / Pad 6)
     * @param {Array} matrix - Tableau de chaînes ["██", "██"]
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} size - Taille de la police (Optionnel)
     */
    drawMatrix(matrix, x, y, size = baseCharHeight) {
        if (!matrix) return;

        this.ctx.save();
        this.ctx.fillStyle = `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
        this.ctx.font = `${size}px monospace`;
        this.ctx.textBaseline = 'top';

        matrix.forEach((line, lineIndex) => {
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
                const char = line[charIndex];
                if (char !== ' ') {
                    // On utilise 'size' comme largeur de référence pour le mode Paint
                    // Ou baseCharWidth si on veut rester sur la grille stricte
                    const charW = (size === baseCharHeight) ? baseCharWidth : size * 0.6; // Ratio approx monospace
                    
                    this.ctx.fillText(
                        char, 
                        x + (charIndex * charW), 
                        y + (lineIndex * size)
                    );
                }
            }
        });
        this.ctx.restore();
    }

    /**
     * Gomme (Utilisé par ToolSystem / Pad 8)
     */
    erase(x, y, radius = 20) {
        this.ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
    }
}