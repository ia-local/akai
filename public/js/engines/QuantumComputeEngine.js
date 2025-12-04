/**
 * QUANTUM COMPUTE ENGINE (V2.0 - INTERACTIVE)
 * Moteur de rendu simulant la superposition d'états (Bitmap vs ASCII).
 * Intègre un curseur de focus quantique pilotable par MIDI (X/Y).
 */

export class QuantumComputeEngine {
    constructor(targetCanvas) {
        this.canvas = targetCanvas;
        
        // SÉCURITÉ : Vérifie si le canvas existe
        if (!this.canvas) {
            console.error("⛔ QuantumEngine: Canvas introuvable !");
            this.ctx = null;
            return;
        }

        // Tente de récupérer le contexte 2D.
        this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
        
        if (!this.ctx) {
            console.warn("⚠️ QuantumEngine: Impossible d'obtenir le contexte 2D.");
        }

        // Buffer Offscreen
        this.offCanvas = document.createElement('canvas');
        this.offCtx = this.offCanvas.getContext('2d');

        // États Quantiques (Paramètres pilotés par MIDI)
        this.state = {
            probability: 0.5,    // Knob 1 : Équilibre global
            entanglement: 0.0,   // Knob 2 : Intensité des interférences
            coherence: 1.0,      // Knob 3 : Netteté / Stabilité
            dimension: 1,        // Index du PAD 15
            phase: 0             // Temps (t)
        };

        // Curseur de Focus Quantique (Similaire au Tensor HUD)
        // Permet de définir une zone où l'effet est différent (ex: superposition locale)
        this.focus = { 
            x: 0.5, // 0.0 à 1.0
            y: 0.5, // 0.0 à 1.0
            active: true 
        };

        this.isRunning = false;
        this.width = 0;
        this.height = 0;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        if (this.canvas) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        if (this.offCanvas) {
            this.offCanvas.width = w;
            this.offCanvas.height = h;
        }
    }

    setDimension(index) {
        this.state.dimension = index;
    }

    /**
     * Met à jour les paramètres depuis le MIDI (Knobs)
     * Cette fonction est appelée en temps réel par main.js
     */
    updateQubits(x, y, z) {
        // Normalisation
        const normX = x / 100;
        const normY = y / 100;
        const normZ = z; // Z est souvent déjà traité ou brut selon le besoin

        // Mapping dynamique selon la dimension (Optionnel, ou fixe pour l'instant)
        // Ici on garde la logique de base mais on ajoute le focus
        
        // Knob 1 & 2 pilotent AUSSI le focus (comme le Tensor)
        this.focus.x = normX;
        this.focus.y = 1.0 - normY; // Inversion Y classique

        // Knob 1 pilote aussi la probabilité globale (Superposition)
        this.state.probability = normX; 

        // Knob 2 pilote l'entanglement (Interférence)
        this.state.entanglement = normY;

        // Knob 3 pilote la cohérence
        this.state.coherence = (normZ - 0.5) / 2.5; 
    }

    /**
     * BOUCLE DE RENDU PRINCIPALE
     */
    render(videoSource, asciiSource) {
        if (!this.ctx || !this.width || !this.height) return;

        // 1. Mise à jour de la Phase
        this.state.phase += 0.05 + (this.state.entanglement * 0.2);

        // 2. Préparation du Buffer (Fond Vidéo)
        this.offCtx.globalCompositeOperation = 'source-over';
        this.offCtx.globalAlpha = 1.0;
        
        // Dessin de la source vidéo (Sécurisé)
        try {
            if (videoSource.tagName === 'VIDEO' && videoSource.readyState >= 2) {
                this.offCtx.drawImage(videoSource, 0, 0, this.width, this.height);
            } else if (videoSource.tagName === 'IMG' && videoSource.complete) {
                this.offCtx.drawImage(videoSource, 0, 0, this.width, this.height);
            }
        } catch (e) { /* Ignore */ }

        // 3. Application de la Superposition (ASCII)
        // On utilise la probabilité mais on peut la moduler avec le focus
        
        if (this.state.probability > 0.05) {
            this.offCtx.globalCompositeOperation = 'lighter'; 
            
            // Calcul d'alpha dynamique
            const wave = Math.sin(this.state.phase) * this.state.entanglement; 
            let alpha = this.state.probability + (wave * 0.1);
            alpha = Math.max(0, Math.min(1, alpha));

            this.offCtx.globalAlpha = alpha;
            this.offCtx.drawImage(asciiSource, 0, 0, this.width, this.height);
        }

        // 4. Effets Localisés (Focus Quantique)
        // Dessine un effet autour du curseur X/Y
        if (this.focus.active && this.state.entanglement > 0.1) {
            this.applyQuantumFocus();
        }

        // 5. Interférences Globales
        if (this.state.entanglement > 0.2) {
            this.applyInterference(this.state.entanglement);
        }

        // 6. Transfert Final
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.offCanvas, 0, 0);
    }

    /**
     * Dessine un effet visuel autour du point de focus (Knob X/Y)
     */
    applyQuantumFocus() {
        const cx = this.focus.x * this.width;
        const cy = this.focus.y * this.height;
        const radius = 50 + (this.state.entanglement * 100);

        // Création d'un gradient radial pour un effet de "trou" ou de "lueur"
        const grad = this.offCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(0, 255, 255, ${this.state.entanglement * 0.5})`); // Centre Cyan
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Bord transparent

        this.offCtx.globalCompositeOperation = 'screen'; // Ajoute de la lumière
        this.offCtx.fillStyle = grad;
        this.offCtx.beginPath();
        this.offCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.offCtx.fill();
        
        // Petit curseur précis (Croix)
        this.offCtx.globalCompositeOperation = 'source-over';
        this.offCtx.strokeStyle = '#0ff';
        this.offCtx.lineWidth = 1;
        this.offCtx.beginPath();
        this.offCtx.moveTo(cx - 10, cy); this.offCtx.lineTo(cx + 10, cy);
        this.offCtx.moveTo(cx, cy - 10); this.offCtx.lineTo(cx, cy + 10);
        this.offCtx.stroke();
    }

    /**
     * Génère des bandes d'interférence
     */
    applyInterference(strength) {
        const stripHeight = Math.max(2, 50 * (1 - strength));
        
        this.offCtx.globalCompositeOperation = 'difference'; // Inversion de couleur
        this.offCtx.fillStyle = `rgba(0, 255, 255, ${strength * 0.1})`; // Très subtil
        
        for (let i = 0; i < this.height; i += stripHeight * 2) {
            const offset = (this.state.phase * 10) % (stripHeight * 2);
            // On ne dessine pas partout, on laisse des trous
            if (Math.sin(i * 0.1 + this.state.phase) > 0) {
                this.offCtx.fillRect(0, i + offset, this.width, stripHeight);
            }
        }
        this.offCtx.globalCompositeOperation = 'source-over';
    }
}