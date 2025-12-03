/**
 * CORE: STATE MANAGER
 * Source de vérité unique pour l'état de l'application.
 * Gère la persistance (LocalStorage) et l'accès aux données globales.
 */
export class StateManager {
    constructor() {
        this.STORAGE_KEY = 'studio_session_v2';
        
        // État par défaut
this.state = {
            // Configuration Studio
            pixelsPerSecond: 50,
            isSelectorMode: false, // False = Perform, True = Edit
            isWebGLEnabled: false,

            // État MIDI (MPD218 Values)
            midiKnobs: [0, 0, 0, 0, 0, 0], // CC 0 à 5

            // État Dessin (Valeurs Cibles pour le lissage)
            drawTarget: { x: 50, y: 50, z: 20, chroma: 0 }, 
            
            // État Dessin (Valeurs Actuelles lissées)
            drawCurrent: { x: 50, y: 50, z: 20, chroma: 0 },
            
            // Runtime
            isDrawing: false,
            
            // UI
            libraryViewMode: 'list',
            rightPanelOpen: false,
            clips: []
        };
    }
    // --- ACCESSEURS ---
    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;
        // On pourrait émettre un event ici : this.eventBus.emit('state:change', {key, value})
    }

    updateDrawState(key, val) {
        this.state.drawState[key] = val;
    }

    // --- PERSISTANCE ---
    
    save(timelineClips) {
        // On met à jour les clips avant de sauvegarder
        if (timelineClips) this.state.clips = timelineClips;
        
        try {
            const serialized = JSON.stringify(this.state);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            console.log(`💾 Session sauvegardée (${(serialized.length / 1024).toFixed(2)} KB)`);
        } catch (e) {
            console.error("Erreur sauvegarde session:", e);
        }
    }

    load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return false;

        try {
            const loaded = JSON.parse(raw);
            // Fusionner avec l'état par défaut pour éviter les crashs si nouvelles clés
            this.state = { ...this.state, ...loaded };
            
            // Nettoyage Runtime (important pour le DrawEngine)
            if (this.state.drawState) {
                this.state.drawState.isDrawing = false;
                this.state.drawState.currentPath = null;
                this.state.drawState.points = [];
            }
            
            console.log("📂 Session restaurée.");
            return true;
        } catch (e) {
            console.warn("Session corrompue, chargement défaut.", e);
            return false;
        }
    }
}