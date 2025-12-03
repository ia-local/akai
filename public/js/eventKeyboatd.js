// ----------------------------------------------------------------------
// EVENTKEYBOARD.JS : GESTIONNAIRE DE RACCOURCIS CLAVIER
// Version Robuste : Utilise e.key au lieu de e.code pour compatibilité AZERTY
// ----------------------------------------------------------------------

class KeyboardEventManager {
    constructor(sequencer, recorder, midiModal, logFn) {
        this.sequencer = sequencer;
        this.recorder = recorder;
        this.midiModal = midiModal;
        this.updateLog = logFn;

        this.initListeners();
    }

    initListeners() {
        document.addEventListener('keydown', (e) => {
            
            // --- MOUCHARD DE DÉBOGAGE ---
            // Si tu appuies sur CTRL + une touche, ça s'affichera dans la console
            if (e.ctrlKey) {
                console.log(`Touche détectée -> Key: "${e.key}", Code: "${e.code}"`);
            }
            // -----------------------------

            // 1. GESTION PLAY / STOP (CTRL + ESPACE)
            // " " correspond à la barre d'espace
            if (e.ctrlKey && e.key === ' ') {
                e.preventDefault(); 
                this.togglePlayStop();
            }

            // 2. GESTION ENREGISTREMENT (CTRL + R)
            // On accepte 'r' minuscule ou 'R' majuscule
            if (e.ctrlKey && e.key.toLowerCase() === 'r') {
                e.preventDefault(); 
                this.toggleRecording();
            }

            // 3. GESTION MODALE MIDI (CTRL + M)
            // On vérifie la lettre 'm' (indépendant du clavier AZERTY/QWERTY)
            if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                console.log("Action déclenchée : Toggle Modale");
                this.toggleMidiModal();
            }
            // Fallback pour certains claviers AZERTY où M est considéré comme un symbole spécial
            else if (e.ctrlKey && e.code === 'Semicolon') { 
                 // Sur AZERTY, le M est souvent physiquement sur la touche Semicolon du QWERTY
                 e.preventDefault();
                 console.log("Action déclenchée (AZERTY Code) : Toggle Modale");
                 this.toggleMidiModal();
            }
        });
    }

    // --- ACTIONS ---

    togglePlayStop() {
        if (!this.sequencer) return;

        if (this.sequencer.isPlaying) {
            this.sequencer.stopSequencer();
            this.updateLog('Raccourci: Stop', 'muted');
        } else {
            this.sequencer.startSequencer();
            this.updateLog('Raccourci: Play', 'green');
        }
    }

    toggleRecording() {
        if (!this.recorder) return;
        this.recorder.toggleRecording();
    }

    toggleMidiModal() {
        // Sécurité maximale
        if (!this.midiModal) {
            console.error("ERREUR CRITIQUE : Le module midiModal est NULL dans le KeyboardManager.");
            return;
        }

        const modalEl = document.getElementById(this.midiModal.modalId);
        
        // Si l'élément n'est pas trouvé, on tente de forcer son initialisation
        if (!modalEl) {
            console.warn("DOM Modale introuvable, tentative de forçage...");
            this.midiModal.showModal();
            return;
        }

        // Vérification de visibilité
        const style = window.getComputedStyle(modalEl);
        if (style.display === 'none') {
            this.midiModal.showModal();
        } else {
            this.midiModal.hideModal();
        }
    }
}