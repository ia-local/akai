// public/js/engines/AsciiTensorEngine.js

const PHI = 1.61803398875; // Le Nombre d'Or

export class AsciiTensorEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        // Taille d'une cellule de caractère (Font Matrix)
        this.charWidth = 10;
        this.charHeight = 18;
        
        // État de la grille
        this.cols = 0;
        this.rows = 0;
        
        // État du curseur (HUD)
        this.cursor = { col: -1, row: -1, active: false };
        
        this.style = {
            color: '#4ade80',
            bgColor: 'rgba(0,0,0,0)',
            ratio: 'free'
        };

        // Cache du dernier contenu pour le redessin rapide (Mouse Move)
        this.lastContent = null;
    }

    /**
     * Active le suivi de la souris pour ce moteur
     * À appeler depuis main.js : asciiEngine.enableMouseTracking(previewContainer);
     */
    enableMouseTracking(container) {
        container.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // On calcule par rapport au canvas réel (qui peut être centré via CSS)
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.updateCursor(x, y);
        });

        container.addEventListener('mouseleave', () => {
            this.cursor.active = false;
            if (this.lastContent) this.render(this.lastContent); // Redessine sans le HUD
        });
    }

    /**
     * Calcule la position Grille (Col/Row) et redessine si nécessaire
     */
    updateCursor(pixelX, pixelY) {
        const col = Math.floor(pixelX / this.charWidth);
        const row = Math.floor(pixelY / this.charHeight);

        // Si la position a changé et qu'on est dans la grille
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            if (this.cursor.col !== col || this.cursor.row !== row || !this.cursor.active) {
                this.cursor.col = col;
                this.cursor.row = row;
                this.cursor.active = true;
                
                // On redessine le contenu + le HUD
                if (this.lastContent) this.render(this.lastContent);
            }
        } else {
            // Hors grille
            if (this.cursor.active) {
                this.cursor.active = false;
                if (this.lastContent) this.render(this.lastContent);
            }
        }
    }

    /**
     * Redimensionne PHYSIQUEMENT le canvas pour respecter le ratio.
     */
    setResolution(containerWidth, containerHeight, targetRatio = 'free') {
        let targetWidth = containerWidth;
        let targetHeight = containerHeight;

        // 1. Calcul des dimensions cibles selon le Ratio
        if (targetRatio !== 'free') {
            let numericRatio = 16/9; 
            if (targetRatio === 'phi') numericRatio = PHI; 
            else if (targetRatio === '16:9') numericRatio = 16/9;
            else if (targetRatio === '4:3') numericRatio = 4/3;
            else if (targetRatio === '1:1') numericRatio = 1;
            else if (targetRatio === '9:16') numericRatio = 9/16;

            if (containerWidth / containerHeight > numericRatio) {
                targetHeight = containerHeight;
                targetWidth = targetHeight * numericRatio;
            } else {
                targetWidth = containerWidth;
                targetHeight = targetWidth / numericRatio;
            }
        }

        // 2. Quantification (Snap to Grid)
        this.cols = Math.floor(targetWidth / this.charWidth);
        this.rows = Math.floor(targetHeight / this.charHeight);

        const finalPixelWidth = this.cols * this.charWidth;
        const finalPixelHeight = this.rows * this.charHeight;

        // 3. Application au DOM
        this.canvas.width = finalPixelWidth;
        this.canvas.height = finalPixelHeight;
        this.canvas.style.width = `${finalPixelWidth}px`;
        this.canvas.style.height = `${finalPixelHeight}px`;

        return { cols: this.cols, rows: this.rows };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Rendu Principal
     */
    render(contentObj) {
        this.lastContent = contentObj; // Sauvegarde pour les re-renders (HUD)
        this.clear();
        if (!contentObj) return;

        const text = contentObj.text || "";
        const style = contentObj.style || {};
        
        // Fond
        if (style.bgColor) {
            this.ctx.fillStyle = style.bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.ctx.fillStyle = style.color || this.style.color;
        this.ctx.font = `${this.charHeight}px 'Consolas', 'Courier New', monospace`;
        this.ctx.textBaseline = 'top';

        // Dessin du texte
        const lines = text.split('\n');
        const startRow = (style.align === 'center') 
            ? Math.floor((this.rows - lines.length) / 2) 
            : 0;

        lines.forEach((line, i) => {
            const rowIndex = startRow + i;
            if (rowIndex >= 0 && rowIndex < this.rows) {
                let colIndex = 0;
                if (style.align === 'center') colIndex = Math.floor((this.cols - line.length) / 2);
                else if (style.align === 'right') colIndex = this.cols - line.length;

                this.drawTextLine(line, colIndex, rowIndex);
            }
        });

        // DESSIN DU HUD (Par dessus le texte)
        if (this.cursor.active) {
            this.drawTensorHUD();
        }
    }

    drawTextLine(text, startCol, row) {
        for (let i = 0; i < text.length; i++) {
            const col = startCol + i;
            if (col >= 0 && col < this.cols) {
                this.ctx.fillText(text[i], col * this.charWidth, row * this.charHeight);
            }
        }
    }

    /**
     * NOUVEAU : Affiche les règles ASCII et le curseur de cellule
     */
    drawTensorHUD() {
        const c = this.cursor.col;
        const r = this.cursor.row;
        const cw = this.charWidth;
        const ch = this.charHeight;

        this.ctx.save();
        
        // 1. Surlignage de la cellule active (Curseur)
        this.ctx.fillStyle = 'rgba(74, 222, 128, 0.2)'; // Vert Matrix transparent
        this.ctx.fillRect(c * cw, r * ch, cw, ch);
        
        this.ctx.strokeStyle = '#4ade80';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(c * cw, r * ch, cw, ch);

        // 2. Guides (Croix)
        this.ctx.setLineDash([2, 4]);
        this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(c * cw + cw/2, 0); this.ctx.lineTo(c * cw + cw/2, this.canvas.height); // Vertical
        this.ctx.moveTo(0, r * ch + ch/2); this.ctx.lineTo(this.canvas.width, r * ch + ch/2); // Horizontal
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset

        // 3. Règles (Numéros de Colonnes/Lignes)
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '9px monospace';
        
        // Info-bulle coordonnées
        const label = `C:${c} R:${r}`;
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(c * cw + 12, r * ch - 12, 50, 14);
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillText(label, c * cw + 14, r * ch - 12);

        this.ctx.restore();
    }
}