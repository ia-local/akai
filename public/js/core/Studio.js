/**
 * CORE: STUDIO ORCHESTRATOR
 */
import { Transport } from './Transport.js';
import { KeyboardController } from './eventKeyboard.js';
import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';

export class Studio {
    constructor() {
        this.systems = [];
        this.isRunning = false;
        
        this.events = new EventBus(); 
        this.stateManager = new StateManager();
        this.state = this.stateManager.state; 

        this.transport = new Transport({
            onTick: (time) => this.update(time),
            onStop: () => this.onStop()
        });

        this.keyboard = new KeyboardController({
            togglePlayback: () => this.transport.toggle()
        });
    }

    registerSystem(system) {
        this.systems.push(system);
        return this;
    }

    start() {
        this.isRunning = true;
        this.stateManager.load(); // Charge la session

        this.systems.forEach(sys => {
            if (sys.init) sys.init();
        });

        // Premier rendu statique
        this.update(0);
    }

    update(time) {
        if (!this.isRunning) return;
        // Notifie tous les systèmes
        this.systems.forEach(sys => {
            if (sys.update) sys.update(time, this.transport.isPlaying);
        });
    }

    onStop() {
        this.systems.forEach(sys => { if (sys.onStop) sys.onStop(); });
        this.events.emit('transport:stop'); 
    }

    broadcast(event, data) {
        this.events.emit(event, data);
    }
}