// public/js/AsciiTensorEngine.js

const PHI = 1.61803398875; // Le Nombre d'Or

export class AsciiTensorEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        this.charWidth = 10;
        this.charHeight = 18;
        
        // État de la grille
        this.cols = 80;
        this.rows = 25;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.style = {
            color: '#4ade80',
            bgColor: 'rgba(0,0,0,0)',
            ratio: 'free'
        };
    }

    /**
     * Calcule la grille active selon le Ratio (ex: PHI)
     */
    setResolution(containerWidth, containerHeight, targetRatio = 'free') {
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;

        let activeWidth = containerWidth;
        let activeHeight = containerHeight;

        // Calcul du Ratio (Letterboxing)
        if (targetRatio !== 'free') {
            let numericRatio = 16/9; 
            if (targetRatio === 'phi') numericRatio = PHI; // 1.618
            else if (targetRatio === '16:9') numericRatio = 16/9;
            else if (targetRatio === '4:3') numericRatio = 4/3;
            else if (targetRatio === '1:1') numericRatio = 1;

            if (containerWidth / containerHeight > numericRatio) {
                activeWidth = containerHeight * numericRatio;
            } else {
                activeHeight = containerWidth / numericRatio;
            }
        }

        // Calcul Colonnes/Lignes
        this.cols = Math.floor(activeWidth / this.charWidth);
        this.rows = Math.floor(activeHeight / this.charHeight);

        // Centrage (Offset)
        const gridPixelWidth = this.cols * this.charWidth;
        const gridPixelHeight = this.rows * this.charHeight;

        this.offsetX = Math.floor((containerWidth - gridPixelWidth) / 2);
        this.offsetY = Math.floor((containerHeight - gridPixelHeight) / 2);

        return { cols: this.cols, rows: this.rows };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(contentObj) {
        this.clear();
        if (!contentObj) return;

        const text = contentObj.text || "";
        const style = contentObj.style || {};
        
        this.ctx.fillStyle = style.color || this.style.color;
        this.ctx.font = `${this.charHeight}px 'Consolas', 'Courier New', monospace`;
        this.ctx.textBaseline = 'top';

        // 1. DESSIN DU CADRE "SAFE ZONE" (Le monitoring manquant)
        this.drawSafeZoneBorder(style.color || this.style.color);

        // 2. DESSIN DU TEXTE (Avec Clipping)
        const lines = text.split('\n');
        
        // Centrage vertical par défaut
        const startRow = (style.align === 'center' || true) 
            ? Math.floor((this.rows - lines.length) / 2) 
            : 0;

        lines.forEach((line, i) => {
            const rowIndex = startRow + i;
            
            // Clipping Vertical
            if (rowIndex >= 0 && rowIndex < this.rows) {
                let colIndex = 0;
                if (style.align === 'center') colIndex = Math.floor((this.cols - line.length) / 2);
                
                this.drawTextLine(line, colIndex, rowIndex);
            }
        });
    }

    drawTextLine(text, startCol, row) {
        for (let i = 0; i < text.length; i++) {
            const col = startCol + i;
            // Clipping Horizontal Strict
            if (col >= 0 && col < this.cols) {
                const x = this.offsetX + (col * this.charWidth);
                const y = this.offsetY + (row * this.charHeight);
                this.ctx.fillText(text[i], x, y);
            }
        }
    }

    // --- LE VISUEL "HUD" ---
    drawSafeZoneBorder(color) {
        const x = this.offsetX;
        const y = this.offsetY;
        const w = this.cols * this.charWidth;
        const h = this.rows * this.charHeight;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        // Cadre principal fin (opacité faible)
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeRect(x - 4, y - 4, w + 8, h + 8); 
        
        // Réticules aux coins (Style Caméra - Opacité forte)
        this.ctx.globalAlpha = 0.9;
        const s = 15; // Taille des coins
        this.ctx.beginPath();
        // Haut-Gauche
        this.ctx.moveTo(x, y + s); this.ctx.lineTo(x, y); this.ctx.lineTo(x + s, y);
        // Haut-Droit
        this.ctx.moveTo(x + w - s, y); this.ctx.lineTo(x + w, y); this.ctx.lineTo(x + w, y + s);
        // Bas-Droit
        this.ctx.moveTo(x + w, y + h - s); this.ctx.lineTo(x + w, y + h); this.ctx.lineTo(x + w - s, y + h);
        // Bas-Gauche
        this.ctx.moveTo(x + s, y + h); this.ctx.lineTo(x, y + h); this.ctx.lineTo(x, y + h - s);
        this.ctx.stroke();

        this.ctx.restore();
    }
}