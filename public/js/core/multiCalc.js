// public/js/multiCalc.js

export class MultiCalcSession {
    constructor() {
        this.STORAGE_KEY = 'studio_session_v1';
        this.defaultState = {
            drawState: { x: 50, y: 50, z: 20, chroma: 0 },
            clips: []
        };
    }

    // Sauvegarde l'état actuel (Clips + Curseur)
    save(timelineManager, drawState) {
        const sessionData = {
            timestamp: Date.now(),
            drawState: drawState,
            // On sauvegarde une version simplifiée des clips
            clips: timelineManager.clips.map(c => ({
                assetId: c.assetId,
                trackId: c.trackId,
                startTime: c.startTime,
                duration: c.duration,
                name: c.name,
                type: c.type
                // Note: assetData est reconstruit au chargement via window.assetsData
            }))
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
            console.log(`💾 Session MultiCalc sauvegardée (${sessionData.clips.length} clips)`);
        } catch (e) {
            console.warn("Erreur sauvegarde session:", e);
        }
    }

    // Charge l'état
    load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return this.defaultState;

        try {
            const data = JSON.parse(raw);
            console.log("📂 Session MultiCalc chargée.");
            return data;
        } catch (e) {
            console.error("Session corrompue, retour défaut.");
            return this.defaultState;
        }
    }

    // Restaure les clips dans le TimelineManager
    restoreTimeline(timelineManager, clipsData) {
        if (!clipsData || !Array.isArray(clipsData)) return;

        // Attendre que assetsData soit disponible (chargé par studio.js)
        const checkAssets = setInterval(() => {
            if (window.assetsData) {
                clearInterval(checkAssets);
                
                clipsData.forEach(clipDTO => {
                    // Retrouver l'objet asset complet
                    let fullAsset = null;
                    for (const group of Object.values(window.assetsData)) {
                        fullAsset = group.find(a => a.id === clipDTO.assetId);
                        if (fullAsset) break;
                    }

                    if (fullAsset) {
                        // On réinjecte dans le manager
                        // Note: addClip génère un nouvel ID, c'est normal
                        timelineManager.addClip(fullAsset, clipDTO.trackId, clipDTO.startTime);
                    }
                });
                console.log("✅ Timeline restaurée.");
            }
        }, 100); // Vérifie toutes les 100ms
    }
}