// public/js/eventKeyboard.js

export class KeyboardController {
    constructor(studioCore) {
        this.core = studioCore; // Référence au moteur du studio pour appeler play/pause, cut, etc.
        this.init();
    }

    init() {
        console.log("🎹 KeyboardController: Initialisé");
        
        document.addEventListener('keydown', (e) => {
            // Ignorer si l'utilisateur tape dans un champ texte
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // --- 1. GESTION DU PLAY/PAUSE (Espace) ---
            if (e.code === 'Space') {
                e.preventDefault(); // Empêche le scroll de la page
                this.togglePlayPause();
            }

            // --- 2. SAUVEGARDE (CTRL + S) ---
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault(); // Empêche la sauvegarde de la page HTML par le navigateur
                this.triggerSave();
            }

            // --- 3. DÉCOUPAGE / CUT (Touche 'C' ou 'X') ---
            if (e.key === 'x' || e.key === 'c') {
                this.triggerCut();
            }

            // --- 4. VISION / IA ANALYSIS (Touche 'V') ---
            if (e.key === 'v') {
                this.triggerVisionAnalysis();
            }
            // --- NOUVEAU : CTRL + P pour PAUSE/PLAY ---
            if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                this.togglePlayPause();
                console.log("[Keyboard] ⏸️ CTRL+P : Toggle Pause");
            }
            // --- 5. SUPPRESSION (Delete/Backspace) ---
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.triggerDelete();
            }
        });
    }

    togglePlayPause() {
        console.log("[Keyboard] Toggle Play/Pause");
        // Ici, on appellera la méthode publique de studio.js
        // ex: this.core.togglePlayback();
        const btnPlay = document.getElementById('btn-play');
        // Simulation simple pour l'instant
        if(btnPlay) btnPlay.click(); 
    }

    triggerSave() {
        console.log("[Keyboard] 💾 CTRL+S détecté : Sauvegarde du projet...");
        // TODO: Envoyer l'état actuel (timelineTracks) au serveur via Socket.io ou Fetch
        // socket.emit('project_save', { tracks: timelineTracks });
        alert("Sauvegarde du projet (Simulation)");
    }

    triggerCut() {
        console.log("[Keyboard] ✂️ Cut trigger à la position curseur");
        // Logique future : Récupérer le timecode actuel et scinder le clip
    }

    triggerDelete() {
        console.log("[Keyboard] 🗑️ Suppression du clip sélectionné");
    }

    async triggerVisionAnalysis() {
        console.log("[Keyboard] 👁️ Lancement Analyse Vision (Groq/Llama)...");
        
        // 1. Capturer l'image actuelle du player (si c'est une vidéo)
        // Pour l'instant, on simule avec une image statique
        const currentAssetId = "img_scene"; // Exemple
        
        try {
            // On demande au serveur d'analyser l'image via le script Python
            // Note: Il faudra créer cette route API dans server.js
            const response = await fetch('/api/ia/vision-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId: currentAssetId })
            });
            
            const result = await response.json();
            console.log("Résultat Vision:", result);
            alert(`IA Vision : ${result.description}`);
            
        } catch (error) {
            console.warn("Erreur Vision (Backend non connecté ?)", error);
        }
    }
}