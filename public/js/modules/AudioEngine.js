/**
 * AUDIO ENGINE (Tone.js Wrapper) - CORRIGÉ
 * Gère le mixage spatial, les effets et la lecture des samples.
 */

// Si Tone est chargé en script global (non-module), il est attaché à window.
// Dans un module ES6, nous devons nous assurer qu'il est accessible.

export class AudioEngine {
    constructor() {
        this.isInitialized = false;
        
        // --- VÉRIFICATION CRITIQUE POUR LA RÉSILIENCE DU MODULE ---
        if (typeof Tone === 'undefined') {
            console.error("❌ TONE.JS NON DÉFINI. Assurez-vous que le CDN est chargé AVANT AudioEngine.js.");
            return; 
        }
        
        // --- 1. MASTER CHAIN (La chaîne de sortie) ---
        // Limiter pour éviter la saturation numérique
        this.limiter = new Tone.Limiter(-1).toDestination();
        
        // Master Volume
        this.masterGain = new Tone.Gain(1.0).connect(this.limiter);

        // --- 2. FX BUS (Effets Globaux) ---
        
        this.reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.1,
            wet: 0 
        }); 

        // EQ 3 Bandes (Contrôlé par MIDI CC 6 & 7)
        this.eq = new Tone.EQ3(0, 0, 0);

        // Filter (Contrôlé par l'axe Y)
        this.filter = new Tone.Filter(20000, "lowpass", -12);

        // Panner 3D (Contrôlé par l'axe X)
        this.panner = new Tone.Panner(0); // -1 (Gauche) à 1 (Droite)

        // --- CHAINAGE DU SIGNAL ---
        // Panner -> Filter -> EQ -> Reverb -> Master
        this.panner.connect(this.filter);
        this.filter.connect(this.eq);
        this.eq.connect(this.reverb);
        this.reverb.connect(this.masterGain);

        // --- 3. SOURCES ---
        this.players = new Map(); // Pour les sons de la Timeline
        this.bankPlayers = {};    // Pour les Pads (MPD218)
        
        // Synthé par défaut pour les tests PAD
        this.synth = null; 
    }

    /**
     * Initialise le contexte Audio (Doit être appelé après une interaction utilisateur)
     */
    async init() {
        if (this.isInitialized) return;
        
        if (typeof Tone === 'undefined') {
            console.error("❌ Cannot start Tone.js: Library not available.");
            return;
        }

        await Tone.start();
        console.log("🔊 AUDIO ENGINE: Tone.js Context Started");
        
        // On attend que la reverb soit prête
        await this.reverb.ready; 

        this.isInitialized = true;
        this._loadDefaultBank();
    }

    /**
     * Charge des sons basiques pour les pads (Placeholder)
     */
    _loadDefaultBank() {
        // Création du synthé connecté au Panner
        this.synth = new Tone.PolySynth(Tone.Synth).connect(this.panner);
    }

    // =================================================================
    // GESTION SPATIALE & MIDI
    // =================================================================

    updateSpatialState(x, y, z) {
        if (!this.isInitialized) return;

        // 1. AXE X : Panoramique
        const panVal = Math.max(-1, Math.min(1, (x / 50) - 1));
        this.panner.pan.rampTo(panVal, 0.1);

        // 2. AXE Y : Filtre
        const freqVal = Math.max(100, (y / 100) * 15000);
        this.filter.frequency.rampTo(freqVal, 0.1);

        // 3. AXE Z : Reverb Wetness
        const wetVal = Math.max(0, Math.min(0.8, (z - 0.5) / 4));
        this.reverb.wet.rampTo(wetVal, 0.2);
    }

    updateEQ(bass, treble) {
        if (!this.isInitialized) return;
        // Vérification si la valeur est null (cas où on ne touche qu'un seul knob)
        if (bass !== null && bass !== undefined) this.eq.low.value = bass;
        if (treble !== null && treble !== undefined) this.eq.high.value = treble;
    }

    triggerPad(note, velocity = 1) {
        if (!this.isInitialized || !this.synth) return;

        const toneNote = Tone.Frequency(note, "midi").toNote();
        this.synth.triggerAttackRelease(toneNote, "8n", undefined, velocity);
        console.log(`🎵 AUDIO: Trigger ${toneNote} (Vel: ${velocity.toFixed(2)})`);
    }

    // =================================================================
    // TRANSPORT & TIMELINE
    // =================================================================

    setTime(time) {
        if (!this.isInitialized) return;
        Tone.Transport.seconds = time;
    }

    play() {
        if (!this.isInitialized) return;
        if (Tone.context.state !== 'running') Tone.context.resume();
        Tone.Transport.start();
    }

    pause() {
        if (!this.isInitialized) return;
        Tone.Transport.pause();
    }

    stop() {
        if (!this.isInitialized) return;
        Tone.Transport.stop();
    }

    async loadTimelineClip(clip) {
        let url = clip.assetData.url || clip.assetData.path;
        if (!url) return;
        
        if (!url.startsWith('http')) {
            url = 'http://localhost:3145' + url.replace(/^\/public/, '');
        }

        console.log(`📥 AUDIO: Loading clip ${clip.name} from ${url}`);

        const player = new Tone.Player({
            url: url,
            onload: () => console.log(`✅ AUDIO: Clip ${clip.name} loaded`),
            onerror: (e) => console.error(`❌ AUDIO: Error loading ${clip.name}`, e)
        }).connect(this.panner);

        // Synchro avec Tone.Transport
        // sync().start(offset, startTime_in_clip) -> start(quand_dans_timeline, quel_offset_du_fichier)
        // Ici on veut que le fichier démarre à clip.startTime
        player.sync().start(clip.startTime).stop(clip.startTime + clip.duration);

        this.players.set(clip.id, player);
    }
}