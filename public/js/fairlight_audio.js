import { MidiVisualizer } from './MidiVisualizer.js';

// 1. Initialisation Socket.io

const socket = io('http://localhost:3145');

// 2. Lancement du Visualiseur MIDI dans le panneau de droite
const midiViz = new MidiVisualizer('mpd-wrapper', socket);

// 3. Logique du Mixeur Audio (Simulation)
// Ici on pourrait mapper les Knobs MIDI aux Faders HTML
const faders = [
    document.querySelector('#strip-1 .fader-knob'),
    document.querySelector('#strip-2 .fader-knob'),
    document.querySelector('.mixer-strip:last-child .fader-knob') // Master
];

// Exemple : Ecouter le MIDI pour bouger les faders HTML
socket.on('midi_cc', (data) => {
    // Si Knob 1 (CC 0) bouge -> Bouger Fader 1
    if (data.cc === 0 && faders[0]) {
        const percent = (data.value / 127) * 100;
        faders[0].style.bottom = `${percent}%`;
    }
    // Si Knob 2 (CC 1) bouge -> Bouger Fader 2
    if (data.cc === 1 && faders[1]) {
        const percent = (data.value / 127) * 100;
        faders[1].style.bottom = `${percent}%`;
    }
});

console.log("🎵 Fairlight Audio Engine Loaded");