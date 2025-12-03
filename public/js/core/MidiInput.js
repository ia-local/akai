/**
 * MODULE: MIDI INPUT
 * Rôle : Écoute socket.io et distribue les événements CC et Note.
 */
export class MidiInput {
    constructor(socket, handlers) {
        this.socket = socket;
        this.handlers = handlers; 
        // handlers structure: { onKnob: (cc, val, raw)=>void, onPad: (note)=>void }
        
        // Cache local des knobs
        this.knobState = [64, 64, 64, 64]; 
        
        this._init();
    }

    _init() {
        // MIDI CC
        this.socket.on('midi_cc', (data) => {
            const val = data.value;
            const cc = data.cc;

            if (cc >= 0 && cc <= 3) this.knobState[cc] = val;

            if (this.handlers.onKnob) {
                this.handlers.onKnob(cc, val / 127, val);
            }
        });

        // MIDI PADS
        this.socket.on('/pad/trigger', (data) => {
            if (this.handlers.onPad) {
                this.handlers.onPad(data.midi_note_raw);
            }
        });
    }
    
    // Pour accéder à l'état depuis le moteur WebGL par exemple
    getKnobState() {
        return this.knobState;
    }
}