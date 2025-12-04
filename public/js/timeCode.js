/**
 * MODULE TIMECODE & TRANSPORT (V2.2 PRODUCTION READY)
 * - Correction FormatTime pour compatibilité Main.js
 * - Support Hybride (Vidéo/CPU)
 * - Protection MIDI
 */

// =================================================================
// 1. UTILITAIRES DE FORMATAGE (Static)
// =================================================================
export class TimeFormatter {
    
    // Heure système (HH:MM:SS)
    static getSystemTime() {
        const now = new Date();
        return now.toLocaleTimeString('fr-FR', { hour12: false });
    }

    // Timestamp fichier (YYYY-MM-DD_HH-MM-SS)
    static getFileTimestamp() {
        const now = new Date();
        const d = now.toISOString().slice(0, 10);
        const t = now.toLocaleTimeString('fr-FR', { hour12: false }).replace(/:/g, '-');
        return `${d}_${t}`;
    }

    // Format Pro SMPTE (HH:MM:SS:FF)
    static toSMPTE(seconds, fps = 24) {
        const safeSeconds = Math.max(0, seconds || 0); // Sécurité NaN
        const totalFrames = Math.floor(safeSeconds * fps);
        
        const h = Math.floor(totalFrames / (fps * 3600));
        const m = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
        const s = Math.floor((totalFrames % (fps * 60)) / fps);
        const f = totalFrames % fps;

        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }

    // Format Legacy (HH:MM:SS.ms) requis par main.js
    static toLegacyFormat(seconds) {
        const safeSeconds = Math.max(0, seconds || 0);
        const date = new Date(0);
        date.setMilliseconds(safeSeconds * 1000);
        
        const timeStr = date.toISOString().substr(11, 8);
        const ms = (safeSeconds % 1).toFixed(2).substring(2);
        return `${timeStr}.${ms}`;
    }
}

// =================================================================
// 2. CHRONOMÈTRE
// =================================================================
export class Chronometer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.startTime = performance.now() - this.elapsedTime;
        this.isRunning = true;
    }

    pause() {
        if (!this.isRunning) return;
        this.elapsedTime = performance.now() - this.startTime;
        this.isRunning = false;
    }

    reset() {
        this.elapsedTime = 0;
        this.startTime = 0;
        this.isRunning = false;
    }

    getTime() {
        if (this.isRunning) {
            return (performance.now() - this.startTime) / 1000;
        }
        return this.elapsedTime / 1000;
    }
}

// =================================================================
// 3. TRANSPORT (MOTEUR TIMELINE)
// =================================================================
export class Transport {
    constructor(callbacks) {
        this.currentTime = 0;
        this.isPlaying = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.fps = 24; 
        
        // Callbacks avec valeurs par défaut
        this.onTick = callbacks.onTick || (() => {});
        this.onStop = callbacks.onStop || (() => {});

        // Support d'horloge externe (ex: <video>)
        this.externalClock = null; 
    }

    setFPS(fps) { this.fps = fps; }

    /**
     * --- MÉTHODE DE COMPATIBILITÉ CRITIQUE ---
     * Appelée par main.js ligne 197. Ne pas supprimer !
     */
    formatTime(seconds) {
        return TimeFormatter.toLegacyFormat(seconds);
    }

    /**
     * Permet d'asservir le transport à une vidéo HTML5
     */
    setExternalClock(videoElement) {
        this.externalClock = videoElement;
    }

    play() {
        if (this.isPlaying) return;
        
        // Si horloge externe (Vidéo), on la lance
        if (this.externalClock) {
            this.externalClock.play().catch(e => console.warn("Video autoplay blocked", e));
        }

        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    pause() {
        this.isPlaying = false;
        
        if (this.externalClock) {
            this.externalClock.pause();
        }

        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    stop() {
        this.pause();
        this.setTime(0);
        this.onStop();
    }

    toggle() { this.isPlaying ? this.pause() : this.play(); }

    loop() {
        if (!this.isPlaying) return;
        
        // MODE HYBRIDE :
        if (this.externalClock && !this.externalClock.paused) {
            // Si la vidéo joue, elle est maître du temps
            this.currentTime = this.externalClock.currentTime;
        } else {
            // Sinon horloge CPU
            const now = performance.now();
            let deltaTime = (now - this.lastFrameTime) / 1000;
            
            // Protection contre les sauts > 100ms
            if (deltaTime > 0.1) deltaTime = 0.1;

            this.lastFrameTime = now;
            this.currentTime += deltaTime;
        }
        
        this.onTick(this.currentTime); 
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    setTime(seconds) {
        this.currentTime = Math.max(0, seconds || 0); // Sécurité NaN
        this.lastFrameTime = performance.now();
        
        // Sync inverse : Si on scrub, on met à jour la vidéo
        if (this.externalClock) {
            this.externalClock.currentTime = this.currentTime;
        }

        this.onTick(this.currentTime);
    }

    // Nouvelle méthode recommandée (non utilisée par main.js pour l'instant)
    getCurrentTimecode() {
        return TimeFormatter.toSMPTE(this.currentTime, this.fps);
    }
}