// ----------------------------------------------------------------------
// TEMPLATE_VIZU.JS : BIBLIOTHÈQUE DE STYLES VISUELS
// Contient les stratégies de rendu (Particules, Waveform, Spectre...)
// ----------------------------------------------------------------------

// --- STYLE 1 : PARTICULES (Réactif aux Notes) ---
class VizuParticles {
    constructor() {
        this.name = "Particules (MIDI Event)";
        this.particles = [];
    }

    // Appelé à chaque frame vidéo (60fps)
    draw(ctx, width, height, analyser) {
        // Effet de traînée
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Gestion des particules existantes
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            p.life -= p.decay;
            p.radius *= 0.95;
            
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    // Appelé quand une note est jouée (Trigger)
    trigger(note, velocity, width, height) {
        const hue = (note * 137.5) % 360;
        const normalizedPitch = (note - 48) / 24; 
        const yPos = height - (Math.min(Math.max(normalizedPitch, 0.1), 0.9) * height);
        
        this.particles.push({
            x: Math.random() * width,
            y: yPos,
            radius: 10 + (velocity * 40),
            color: `hsla(${hue}, 100%, 50%, 0.8)`,
            life: 1.0,
            decay: 0.02
        });
    }
}

// --- STYLE 2 : OSCILLOSCOPE (Analyse Audio Temps Réel) ---
class VizuWaveform {
    constructor() {
        this.name = "Fréquence (Waveform)";
        // Pas de particules ici, on lit le buffer audio
    }

    draw(ctx, width, height, analyser) {
        // Fond noir total pour netteté
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, width, height);

        if (!analyser) return;

        // Récupération des données temporelles (Waveform)
        //getValue() retourne un tableau Float32Array entre -1 et 1
        const values = analyser.getValue(); 
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'var(--color-accent-green, #00ff88)';
        ctx.beginPath();

        const sliceWidth = width / values.length;
        let x = 0;

        for (let i = 0; i < values.length; i++) {
            const v = values[i]; // Valeur entre -1.0 et 1.0
            
            // Mapping vers la hauteur du canvas
            // 0 -> Milieu du canvas (height / 2)
            const y = (0.5 + v * 0.5) * height; // *0.5 pour l'amplitude

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    // Ce style n'utilise pas les triggers de notes, on laisse vide
    trigger(note, velocity, width, height) {}
}

// --- STYLE 3 : SPECTRE CIRCULAIRE (Préparation Cercle Chromatique) ---
class VizuSpectrum {
    constructor() {
        this.name = "Spectrum (FFT)";
    }

    draw(ctx, width, height, analyser) {
         ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
         ctx.fillRect(0, 0, width, height);
         
         if(!analyser) return;
         
         // Note: Pour le spectre, l'analyseur doit être en mode "fft"
         // Ce code est une base simple pour l'instant
         const values = analyser.getValue(); 
         const barWidth = (width / values.length) * 2.5;
         let x = 0;

         for(let i = 0; i < values.length; i++) {
             // FFT renvoie des décibels (ex: -100 à 0)
             const barHeight = (values[i] + 140) * 2; 
             
             ctx.fillStyle = `hsl(${i * 2}, 100%, 50%)`;
             ctx.fillRect(x, height - barHeight, barWidth, barHeight);
             x += barWidth + 1;
         }
    }
    trigger() {}
}