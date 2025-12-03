// app.js - Script Corrigé et Complet (V6) pour le contrôleur MIDI Web

// --- 0. Initialisation des Connexions ---
const socket = io(); 
let configData = null; 
let audioStarted = false;

// --- 1. Déclaration et Initialisation de TOUS les Nodes Tone.js ---
let padsSampler;      
let delayEffect;
let reverbEffect;
let filterEffect;
let synth; 
let lfo; 
let pan; 

let metronome; 
let metronomePanner; 

// Objets conceptuels pour le contrôle via JSON:
let groqConfig = {}; 
let iaVoice = { volume: { value: 0 } }; 
let clipModal = { style: { opacity: 0 } }; 
let cssFilter = { hueRotate: 0, blur: 0 }; 
let canvas = { scale: 1 }; 
let masterFX = { mix: 0 }; 

// --- 2. Références DOM ---
const padElements = document.querySelectorAll('.c-pad');
const knobElements = document.querySelectorAll('.c-knob-input');
const controlBtns = document.querySelectorAll('.c-ctrl-btn');
const mainConsole = document.getElementById('main-console'); 


// --- 3. Fonctions Utilitaires ---

function consoleToUser(message) {
    const log = document.createElement('p');
    log.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if (mainConsole) {
        mainConsole.prepend(log);
        mainConsole.scrollTop = 0;
    } else {
        console.log(message);
    }
}

async function startAudioOnUserGesture() {
    if (audioStarted) return;
    
    await Tone.start();
    Tone.Transport.start(); 
    
    consoleToUser("🔊 Contexte audio démarré !");
    audioStarted = true;
}

/**
 * Charge le fichier JSON de configuration et initialise l'application.
 */
async function loadConfigAndInitialize() {
    try {
        const response = await fetch('mpd218.json');
        configData = await response.json();
        
        // Initialiser les effets globaux
        delayEffect = new Tone.FeedbackDelay("8n", 0.5);
        reverbEffect = new Tone.Reverb({ decay: 5, preDelay: 0.01 });
        filterEffect = new Tone.Filter(8000, "lowpass");
        synth = new Tone.PluckSynth();
        lfo = new Tone.LFO(0.5, -1, 1);
        pan = new Tone.Panner(0.5);
        
        // CORRECTION DU MÉTRONOME
        metronomePanner = new Tone.Panner().toDestination();
        metronome = new Tone.MembraneSynth({
            envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.1 }
        }).connect(metronomePanner);
        metronome.volume.value = -Infinity; 

        // Chaînage Sampler -> Panner -> Effets -> Master
        padsSampler = new Tone.Sampler().chain(pan, delayEffect, reverbEffect, filterEffect, Tone.Destination);
        
        // Initialisation du Transport (Tempo/Swing)
        Tone.Transport.bpm.value = configData.globalSettings.tempoBPM;
        Tone.Transport.swing = configData.globalSettings.swingFactor;
        
        // Initialisation du métronome loop
        Tone.Transport.scheduleRepeat((time) => {
            metronome.triggerAttackRelease("C4", "32n", time);
        }, "4n"); 
        
        // Appliquer la configuration initiale
        loadBank(configData.globalSettings.activePadBank, 'PADS');
        loadBank(configData.globalSettings.activeCtrlBank, 'CONTROLS');
        
    } catch (error) {
        consoleToUser(`ERREUR FATALE LORS DU CHARGEMENT: ${error.message}`);
        console.error("Erreur lors du chargement:", error);
    }
}

/**
 * Met à jour la configuration active et charge les assets.
 */
function loadBank(bankId, type) {
    const bankConfig = configData.banks[type][bankId];
    
    if (type === 'PADS') {
        configData.globalSettings.activePadBank = bankId;
        consoleToUser(`Chargement Pads: ${bankConfig.name}`);
        updatePadMappings(bankConfig.mappings);
        
        // --- CORRECTION CRITIQUE TONE.JS (V6) ---
        const sampleUrls = bankConfig.mappings.reduce((acc, mapping) => {
            if (mapping.sampleUrl && mapping.actionType === 'PlaySample' && mapping.midiNote) {
                // Utiliser Tone.Midi.mtoof est la méthode la plus explicite pour garantir
                // qu'une note MIDI soit interprétée comme un pitch (ex: 36 -> 'C2').
                // Si la librairie ne supporte pas Tone.Midi, nous revenons à String().
                let noteKey;
                try {
                    // Tente de convertir le numéro MIDI en nom de note (plus fiable pour Sampler)
                    noteKey = Tone.Midi(mapping.midiNote).toNote();
                } catch(e) {
                    // Si Tone.Midi n'est pas disponible, on utilise le numéro en tant que chaîne.
                    noteKey = String(mapping.midiNote); 
                }
                
                acc[noteKey] = mapping.sampleUrl;
            }
            return acc;
        }, {});
        
        if (Object.keys(sampleUrls).length > 0) {
            padsSampler.add(sampleUrls)
                .then(() => consoleToUser(`[Pads] Samples de la banque ${bankId} chargés.`))
                .catch(e => consoleToUser(`[Pads] Erreur au chargement des buffers, assurez-vous que les fichiers audio existent: ${e.message}`));
        }
        // ---------------------------------
        
    } else if (type === 'CONTROLS') {
        configData.globalSettings.activeCtrlBank = bankId;
        consoleToUser(`Chargement Contrôles: ${bankConfig.name}`);
        updateKnobMappings(bankConfig.mappings);
    }
}

// ... (Les autres fonctions restent identiques) ...
function updatePadMappings(mappings) {
    padElements.forEach(pad => {
        const mapping = mappings.find(m => m.id === pad.getAttribute('data-pad-id'));
        if (mapping) {
            pad.textContent = mapping.label;
            pad.mapping = mapping; 
        }
    });
}

function updateKnobMappings(mappings) {
    knobElements.forEach(knob => {
        const knobId = knob.closest('.c-knob-group').getAttribute('data-knob-id');
        const mapping = mappings.find(m => m.id === knobId);
        
        if (mapping) {
            knob.min = mapping.minVal;
            knob.max = mapping.maxVal;
            knob.value = mapping.initial;
            knob.mapping = mapping;
            
            applyToneJsControl(knob.mapping, mapping.initial); 
            
            const labelElement = knob.parentNode.querySelector('.c-knob-label');
            if (labelElement) {
                labelElement.textContent = `${mapping.label} (${mapping.initial}${mapping.unit})`;
            }
        }
    });
}

/**
 * Applique une valeur à un paramètre Tone.js ou une propriété spécifique.
 */
function applyToneJsControl(mapping, value) {
    if (!mapping.targetProperty) return;

    try {
        const target = eval(mapping.targetProperty); 
        
        if (target !== undefined) {
            if (target.value !== undefined) {
                 target.value = value;
            } else if (mapping.targetProperty === 'Tone.Transport.bpm') {
                 Tone.Transport.bpm.value = value;
            } else if (mapping.targetProperty.startsWith('groqConfig')) {
                groqConfig[mapping.targetProperty.split('.')[1]] = value;
            } 
            
            const knob = document.querySelector(`[data-knob-id="${mapping.id}"] .c-knob-input`);
            if (knob) knob.value = value;

        }
    } catch (e) {
        console.error(`Erreur d'évaluation pour ${mapping.targetProperty}:`, e);
    }
}


// --- 4. Gestion des Actions (Pads et Knobs) ---

function handlePadAction(mapping, velocity) {
    if (!audioStarted) {
        startAudioOnUserGesture();
    }
    
    const vel = configData.globalSettings.isFullLevel ? 1 : (velocity / 127); 
    
    // Feedback visuel
    const padElement = document.querySelector(`[data-pad-id="${mapping.id}"]`);
    if(padElement) {
        padElement.classList.add('is-active');
        setTimeout(() => padElement.classList.remove('is-active'), 100);
    }
    
    // Logique Audio/Timing
    if (mapping.actionType === 'PlaySample' && mapping.midiNote) {
        let noteToPlay;
        try {
            noteToPlay = Tone.Midi(mapping.midiNote).toNote();
        } catch(e) {
            noteToPlay = String(mapping.midiNote); 
        }
        padsSampler.triggerAttackRelease(noteToPlay, mapping.timing || '8n', Tone.now(), vel);
    } else if (mapping.actionType === 'SetSwing') {
        Tone.Transport.swing = mapping.value;
        consoleToUser(`Swing mis à jour: ${mapping.value}`);
    } else if (mapping.actionType === 'PlaySynth' && mapping.note) {
        synth.triggerAttackRelease(mapping.note, '4n', Tone.now(), vel);
    }
    
    // Logique IA/Média
    if (mapping.actionType === 'CallGroq') {
        consoleToUser(`Appel Groq en cours: "${mapping.groqPrompt}"`);
        fetch('/api/groq-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: mapping.groqPrompt, actionType: mapping.actionType, groqConfig: groqConfig })
        });
    }
}

function handleKnobAction(mapping, midiValue) {
    if (!audioStarted) {
        startAudioOnUserGesture();
    }
    
    const normalizedValue = midiValue / 127; 
    const realValue = mapping.minVal + (normalizedValue * (mapping.maxVal - mapping.minVal));
    
    mapping.initial = realValue;

    applyToneJsControl(mapping, realValue);

    const labelElement = document.querySelector(`[data-knob-id="${mapping.id}"] .c-knob-label`);
    if (labelElement) {
        labelElement.textContent = `${mapping.label} (${realValue.toFixed(2)}${mapping.unit})`;
    }
}


// --- 5. Écouteurs d'Événements (Web et Socket.io) ---

padElements.forEach(pad => {
    pad.addEventListener('mousedown', (e) => {
        if (e.currentTarget.mapping) {
            handlePadAction(e.currentTarget.mapping, 127); 
        }
    });
});

controlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const btnId = btn.id;
        
        if (btnId.includes('PAD_BANK')) {
            loadBank(btnId.slice(-1), 'PADS');
        } else if (btnId.includes('CTRL_BANK')) {
            loadBank(btnId.slice(-1), 'CONTROLS');
        } else if (btnId === 'FULL_LEVEL') {
            configData.globalSettings.isFullLevel = !configData.globalSettings.isFullLevel;
            consoleToUser(`FULL LEVEL est maintenant: ${configData.globalSettings.isFullLevel ? 'ON' : 'OFF'}`);
            btn.classList.toggle('is-active', configData.globalSettings.isFullLevel);
        } else if (btnId === 'NOTE_REPEAT') {
            // Logique NOTE REPEAT à implémenter
            configData.globalSettings.isNoteRepeat = !configData.globalSettings.isNoteRepeat;
            consoleToUser(`NOTE REPEAT est maintenant: ${configData.globalSettings.isNoteRepeat ? 'ON' : 'OFF'}`);
            btn.classList.toggle('is-active', configData.globalSettings.isNoteRepeat);
        }
    });
});

// Écouteur MIDI/HID via Socket.io
socket.on('midi_input', (data) => {
    const { status, noteOrCC, velocityOrValue } = data;
    const MIDI_NOTE_ON = 144; 
    const MIDI_CC = 176;      

    if (status >= MIDI_NOTE_ON && status < (MIDI_NOTE_ON + 16)) {
        const activeBank = configData.globalSettings.activePadBank;
        const padMapping = configData.banks.PADS[activeBank].mappings.find(m => m.midiNote === noteOrCC);

        if (padMapping && velocityOrValue > 0) {
            handlePadAction(padMapping, velocityOrValue); 
        }
    } 
    else if (status >= MIDI_CC && status < (MIDI_CC + 16)) {
        const activeCtrlBank = configData.globalSettings.activeCtrlBank;
        const ctrlMapping = configData.banks.CONTROLS[activeCtrlBank].mappings.find(m => m.midiCC === noteOrCC);

        if (ctrlMapping) {
            handleKnobAction(ctrlMapping, velocityOrValue); 
        }
    }
});

socket.on('ia_response', (data) => {
    consoleToUser(`🤖 IA Réponse: ${data.text}`);
});

// --- Démarrage de l'application ---
loadConfigAndInitialize();