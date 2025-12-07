// public/js/modules/AudioEngine.js

/**
 * AUDIO ENGINE (Tone.js Wrapper) - VERSION MATHÉMATIQUE & QUANTIQUE FINALE
 * Gère le mixage spatial, les samplers, le séquenceur et les contrôles avancés.
 */

export class AudioEngine {
    constructor() {
        this.isInitialized = false;
        
        if (typeof Tone === 'undefined') {
            console.error("❌ TONE.JS NON DÉFINI.");
            return; 
        }
        
        // --- 1. MASTER CHAIN ---
        this.limiter = new Tone.Limiter(-1).toDestination();
        this.masterGain = new Tone.Gain(1.0).connect(this.limiter);
        
        // --- 2. FX BUS ---
        this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.1, wet: 0 }); 
        this.eq = new Tone.EQ3(0, 0, 0); // Low, Mid, High (CC 3 pour Mid)
        this.filter = new Tone.Filter(20000, "lowpass", -12);
        this.panner = new Tone.Panner(0); 
        this.chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, type: "sine", spread: 180, wet: 0 });
        
        // --- 3. QUANTIFICATION & SYNCHRO ---
        this.quantizer = 0; 
        this.clockRate = 120; 
        this.isSequencerRunning = false;
        this.scaleIndex = 0; // CC 4: Index de transposition
        
        // --- CHAINAGE DU SIGNAL ---
        this.panner.connect(this.filter);
        this.filter.connect(this.eq);
        this.eq.connect(this.chorus); 
        this.chorus.connect(this.reverb); 
        this.reverb.connect(this.masterGain);

        // --- 4. SOURCES : Sampler, Synthé, Séquenceur ---
        this.players = new Map(); 
        this.synth = null; 
        this.sampler = null;
        this.sequencer = null;
        this.tensorCaptureBuffer = {};
    }

    async init() {
        if (this.isInitialized) return;
        if (typeof Tone === 'undefined') return;

        await Tone.start();
        console.log("🔊 AUDIO ENGINE: Tone.js Context Started");
        
        await this.reverb.ready; 
        
        Tone.Transport.bpm.value = this.clockRate;
        Tone.Transport.swing = 0.5;

        this.isInitialized = true;
        this._loadDefaultBank();
    }

    _loadDefaultBank() {
        // --- SYNTHÉ DE SECOURS (Si le Sampler échoue) ---
        this.synth = new Tone.PolySynth(Tone.Synth).connect(this.panner);
        this.synth.set({ envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.5 } });
        
        // --- SAMPLER (Pads A/C) ---
        // ATTENTION: Les chemins doivent pointer vers des fichiers EXISTANTS sur votre serveur
        const defaultSamples = { 
            "C4": "public/audio/kick.wav", // Exemple
            "D4": "public/audio/snare.wav",
            "E4": "public/audio/hat.wav",
        };
        
        this.sampler = new Tone.Sampler({
            urls: defaultSamples,
            onload: () => console.log("✅ SAMPLER: Pads chargés (C4, D4, E4)."),
        }).connect(this.panner);

        // --- SÉQUENCEUR (Exemple simple) ---
        this.sequencer = new Tone.Sequence((time, note) => {
            if (this.isSequencerRunning && this.sampler.loaded) {
                this.sampler.triggerAttack(note, time);
            }
        }, ["C4", "rest", "D4", "E4"]).start(0);

        Tone.Transport.stop(); 
    }

    // =================================================================
    // CONTROLES KNOB (CC 0-7)
    // =================================================================

    updateSpatialState(x, y, z) {
        if (!this.isInitialized) return;
        const panVal = Math.max(-1, Math.min(1, (x / 50) - 1));
        this.panner.pan.rampTo(panVal, 0.1);
        const freqVal = Math.max(100, (y / 100) * 15000);
        this.filter.frequency.rampTo(freqVal, 0.1);
        const wetVal = Math.max(0, Math.min(0.8, (z - 0.5) / 4));
        this.reverb.wet.rampTo(wetVal, 0.2);
    }
    updateEQ(bass, treble) {
        if (!this.isInitialized) return;
        if (bass !== null && bass !== undefined) this.eq.low.value = bass;
        if (treble !== null && treble !== undefined) this.eq.high.value = treble;
    }
    
    // NOUVEAU : CC 4 (Key Mode Index - Math)
    updateKeyModeIndex(rawIndex) {
        if (!this.isInitialized) return;
        this.scaleIndex = Math.floor(rawIndex);
        console.log(`🎵 KEY MODE (CC4): Index de Tonalité mis à jour à ${this.scaleIndex}`);
    }

    // NOUVEAU : CC 3 (Filter Band - Math)
    updateFilterBand(rawFreq) {
        if (!this.isInitialized) return;
        this.eq.mid.value = rawFreq; 
        console.log(`🎚️ BAND EQ (CC3): Fréquence centrale Mid EQ à ${rawFreq} Hz.`);
    }

    // NOUVEAU : CC 6 (FX Index)
    updateFXIndex(rawIndex) {
        if (!this.isInitialized) return;
        const freq = 0.5 + (rawIndex * 0.2); 
        const wet = rawIndex / 10;           
        this.chorus.frequency.value = freq;
        this.chorus.wet.value = wet;
    }

    // NOUVEAU : CC 7 (Transport Speed)
    updateTransportSpeed(rawSpeed) {
        if (!this.isInitialized) return;
        const newBPM = Math.max(60, Math.min(180, rawSpeed + 60));
        Tone.Transport.bpm.rampTo(newBPM, 0.2);
    }
    
    // =================================================================
    // LOGIQUE QUANTIQUE / TRANSPORT (Banque B)
    // =================================================================

    toggleQuantizer() {
        this.quantizer = (this.quantizer === 0) ? "4n" : 0; 
        console.log(`⚛️ QUANTUM: Quantification ${this.quantizer ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`);
    }

    toggleSequencer() {
        this.isSequencerRunning = !this.isSequencerRunning;
        if (this.isSequencerRunning) {
            this.sequencer.start(0);
        } else {
            this.sequencer.stop();
        }
        console.log(`🎶 SEQUENCER: ${this.isSequencerRunning ? 'Démarré' : 'Arrêté'}.`);
    }

    startTensorCapture() {
        this.tensorCaptureBuffer = {
            pan: this.panner.pan.value, freq: this.filter.frequency.value,
            reverbWet: this.reverb.wet.value, fxWet: this.chorus.wet.value,
        };
        console.log("💾 TENSOR: État des contrôles capturé.", this.tensorCaptureBuffer);
    }
    
    // --- TRANSPORT ---
    playPause() {
        if (!this.isInitialized) return;
        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
        } else {
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start();
        }
    }
    getTransportState() { return Tone.Transport.state.toUpperCase(); }
    stop() {
        if (!this.isInitialized) return;
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
    }

    // --- TRIGGER PAD (Banques A, C) ---
    triggerPad(note, velocity = 1) {
        if (!this.isInitialized || (!this.synth && !this.sampler)) return;
        
        // Calcul de la note transposée
        let noteToPlay = Tone.Frequency(note, "midi").toNote();
        if (this.scaleIndex !== 0 && note < 32) { 
            noteToPlay = Tone.Frequency(note + this.scaleIndex, "midi").toNote();
        }

        // Action de jeu
        if (note >= 0 && note <= 15 || note >= 32) {
            const time = this.quantizer ? Tone.Transport.nextSubdivision(this.quantizer) : undefined;

            if (this.sampler?.loaded) {
                this.sampler.triggerAttack(noteToPlay, time, velocity);
            } else {
                this.synth.triggerAttackRelease(noteToPlay, "8n", time, velocity);
            }
        }
    }
}