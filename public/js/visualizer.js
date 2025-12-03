// ----------------------------------------------------------------------
// VISUALIZER.JS : MOTEUR DE RENDU GRAPHIQUE
// Transforme les événements MIDI/Audio en formes visuelles sur le Canvas.
// ----------------------------------------------------------------------

class VisualEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        // Si le canvas n'est pas trouvé (ex: placeholder), on ne plante pas
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = []; // Stocke les formes actives
        
        // Ajustement de la taille du canvas à son conteneur réel
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Démarrage de la boucle de rendu
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    /**
     * Appelé par le Sequencer ou le Controller quand une note est jouée.
     * @param {number} midiNote - Note MIDI (0-127).
     * @param {number} velocity - Force (0.0 - 1.0).
     */
    triggerVisual(midiNote, velocity) {
        if (!this.canvas) return;

        // 1. COULEUR BASÉE SUR LA NOTE (Cycle des couleurs HSL)
        // Les basses (note 40) -> Rouge, Aigus (note 80) -> Bleu/Violet
        const hue = (midiNote * 137.5) % 360; // Nombre d'or pour bonne distribution
        
        // 2. POSITION Y BASÉE SUR LA NOTE
        // Note grave = en bas, Aiguë = en haut
        // On normalise grossièrement entre F3 (53) et E4 (64) pour ton mapping actuel
        const normalizedPitch = (midiNote - 48) / 24; 
        const yPos = this.canvas.height - (Math.min(Math.max(normalizedPitch, 0.1), 0.9) * this.canvas.height);
        
        // 3. POSITION X ALÉATOIRE (pour l'instant)
        const xPos = Math.random() * this.canvas.width;

        // Création de la particule
        this.particles.push({
            x: xPos,
            y: yPos,
            radius: 10 + (velocity * 40), // Taille selon vélocité
            color: `hsla(${hue}, 100%, 50%, 0.8)`,
            life: 1.0, // Durée de vie (100%)
            decay: 0.02 // Vitesse de disparition
        });
    }

    animate() {
        if (!this.canvas) return;
        
        // 1. Effacer le canvas avec un effet de traînée (Trail effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Dessiner et mettre à jour les particules
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Évolution
            p.life -= p.decay;
            p.radius *= 0.95; // Rétrécit
            
            // Suppression si mort
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Boucle infinie
        requestAnimationFrame(() => this.animate());
    }
}