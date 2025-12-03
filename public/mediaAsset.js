// Données simulées pour les actifs de montage (images, audio, scripts).
// Ces données seront utilisées pour peupler l'interface de montage du studio.

const ASSETS_DATA = {
    // --- IMAGES / VIDEOS (Actifs Visuels) ---
    images: [
        { 
            id: 'asset_001', 
            name: 'Vague Glitch', 
            type: 'image/jpeg', 
            category: 'VISUEL',
            url: 'https://placehold.co/400x300/2a66e0/white?text=GLITCH_WAVE',
            duration: 0 
        },
        { 
            id: 'asset_002', 
            name: 'Gradiant Chroma', 
            type: 'image/png', 
            category: 'VISUEL',
            url: 'https://placehold.co/400x300/d95e20/white?text=CHROMA_GRADIENT', 
            duration: 0 
        },
        { 
            id: 'asset_003', 
            name: 'Arbre Nuit', 
            type: 'image/jpeg', 
            category: 'VISUEL',
            url: 'https://placehold.co/400x300/101010/808080?text=NOIR_ET_BLANC', 
            duration: 0 
        },
        { 
            id: 'asset_004', 
            name: 'Synthwave Ville', 
            type: 'image/png', 
            category: 'VISUEL',
            url: 'https://placehold.co/400x300/a832a8/white?text=SYNTHWAVE', 
            duration: 4.0 // Simulation d'une boucle vidéo de 4s
        },
    ],
    // --- AUDIO (Boucles et FX) ---
    audio: [
        { 
            id: 'asset_101', 
            name: 'Synth Pulse Loop', 
            type: 'audio/mp3', 
            category: 'AUDIO',
            duration: 8.0, 
            source: 'synth/pulse.mp3' 
        },
        { 
            id: 'asset_102', 
            name: 'White Noise FX', 
            type: 'audio/wav', 
            category: 'AUDIO',
            duration: 1.0, 
            source: 'fx/noise.wav' 
        },
        { 
            id: 'asset_103', 
            name: 'Kick Drum (C4)', 
            type: 'audio/wav', 
            category: 'AUDIO',
            duration: 0.5, 
            source: 'fx/kick.wav' 
        },
    ],
    // --- SCRIPTS / SHADERS (Actifs Logiciels) ---
    scripts: [
        { 
            id: 'asset_201', 
            name: 'Effet Fluo', 
            type: 'shader/js', 
            category: 'EFFET',
            description: 'Applique un effet de lueur néon basé sur le CC 3 (Hue).',
            code: '// JavaScript pour effet Fluo' 
        },
        { 
            id: 'asset_202', 
            name: 'Secousse (Shake)', 
            type: 'shader/js', 
            category: 'EFFET',
            description: 'Secoue la caméra en fonction du CC 2 (Échelle/Z).',
            code: '// JavaScript pour effet Shake' 
        },
        { 
            id: 'asset_203', 
            name: 'Glitch Rapide', 
            type: 'shader/js', 
            category: 'EFFET',
            description: 'Distorsion numérique basée sur la Vitesse (CC 7).',
            code: '// JavaScript pour effet Glitch' 
        },
    ],
};

module.exports = { ASSETS_DATA };