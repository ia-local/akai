/**
 * MODULE: RULER OVERLAY (HUD)
 * Rôle : Affiche les règles graduées (X/Y) et les guides de curseur dynamiques.
 */
export class RulerOverlay {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        
        if (!this.canvas || !this.container) {
            console.error("❌ RulerOverlay: Canvas ou Container introuvable.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.rulerSize = 20; // Épaisseur de la bande (px)
        this.gridColor = 'rgba(74, 222, 128, 0.5)'; // Vert technique
        this.textColor = '#aaaaaa';
        this.guideColor = 'rgba(255, 0, 0, 0.8)'; // Rouge pour le guide actif
        
        this.mouseX = -100;
        this.mouseY = -100;
        
        this._initListeners();
        this.resize(); // Premier rendu
    }

    // --- INITIALISATION ---

    _initListeners() {
        // On écoute le mouvement sur le container parent pour la fluidité
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // Optimisation : RequestAnimationFrame pourrait être utilisé ici pour les perfs extrêmes
            this.draw(); 
        });

        // Quand la souris sort, on cache les guides rouges
        this.container.addEventListener('mouseleave', () => {
            this.mouseX = -100;
            this.mouseY = -100;
            this.draw();
        });
    }

    resize() {
        if (!this.canvas || !this.container) return;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.draw();
    }

    // --- MOTEUR DE DESSIN ---

    draw() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);
        
        // Pour avoir des lignes nettes (pixel perfect)
        this.ctx.translate(0.5, 0.5);

        // 1. FOND DES RÈGLES
        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        this.ctx.fillRect(0, 0, w, this.rulerSize); // Top Ruler
        this.ctx.fillRect(0, 0, this.rulerSize, h); // Left Ruler

        // 2. GRADUATIONS (Ticks) & TEXTE
        this.ctx.strokeStyle = '#555';
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '9px monospace';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Règle Horizontale (X)
        for (let x = 0; x < w; x += 10) {
            let tickH = 3;
            if (x % 50 === 0) tickH = 6;
            if (x % 100 === 0) {
                tickH = 10;
                // Texte (ex: 100, 200...)
                if (x > 0) this.ctx.fillText(x, x + 2, 12);
            }
            // Ne pas dessiner dans le coin mort (0,0)
            if (x >= this.rulerSize) {
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, tickH);
            }
        }

        // Règle Verticale (Y)
        for (let y = 0; y < h; y += 10) {
            let tickW = 3;
            if (y % 50 === 0) tickW = 6;
            if (y % 100 === 0) {
                tickW = 10;
                // Texte vertical (rotation ou simple placement)
                if (y > 0) {
                    this.ctx.save();
                    this.ctx.translate(2, y + 10);
                    this.ctx.rotate(-Math.PI / 2);
                    this.ctx.fillText(y, 0, 0);
                    this.ctx.restore();
                }
            }
            if (y >= this.rulerSize) {
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(tickW, y);
            }
        }
        this.ctx.stroke();

        // 3. COIN SUPÉRIEUR GAUCHE (Origine)
        this.ctx.fillStyle = '#d6455d'; // Rouge Akai
        this.ctx.fillRect(0, 0, this.rulerSize, this.rulerSize);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText("PX", 4, 12);


        // 4. GUIDES DYNAMIQUES (Suivi souris)
        if (this.mouseX > 0 && this.mouseY > 0) {
            this.ctx.strokeStyle = this.guideColor;
            this.ctx.setLineDash([2, 2]); // Pointillés
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            
            // Ligne verticale sur la règle X
            this.ctx.moveTo(this.mouseX, 0);
            this.ctx.lineTo(this.mouseX, this.rulerSize);
            
            // Ligne horizontale sur la règle Y
            this.ctx.moveTo(0, this.mouseY);
            this.ctx.lineTo(this.rulerSize, this.mouseY);
            
            // (Optionnel) Crosshair complet sur tout l'écran
            // this.ctx.moveTo(this.mouseX, this.rulerSize);
            // this.ctx.lineTo(this.mouseX, h);
            // this.ctx.moveTo(this.rulerSize, this.mouseY);
            // this.ctx.lineTo(w, this.mouseY);

            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset

            // Affichage coordonnées numériques près de la souris
            this.ctx.fillStyle = this.guideColor;
            this.ctx.fillText(`x:${Math.round(this.mouseX)} y:${Math.round(this.mouseY)}`, this.mouseX + 10, this.mouseY - 10);
        }

        // Reset translate
        this.ctx.translate(-0.5, -0.5);
    }
}