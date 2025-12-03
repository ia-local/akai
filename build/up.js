// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const AssetManager = require('../controllers/AssetManager');
const MidiManager = require('../controllers/MidiManager');
const { generateParameterUpdates } = require('./iaDataManager');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Chargement du fichier Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
// --- Configuration ---
const PORT = 3145;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- Middleware ---
app.use(express.json());
app.use(express.static('public')); // Racine Web
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// --- État Global (Source de vérité) ---
const GLOBAL_STATE = {
    // Curseur Spatial
    cursor_x: 50,
    cursor_y: 50,
    cursor_z: 1.0,

    // Moteur Visuel
    av_chroma_angle: 0,   // 0 à 360
    av_camera_rot: 0,     // 0 à 360
    av_saturation: 1.0,   // 0.0 à 1.0

    // Audio / Equalizer
    eq_bass: 0,           // -12 à +12
    eq_treble: 0,         // -12 à +12

    transport: 'STOPPED'
};

// --- Initialisation des Modules ---
const assetMgr = new AssetManager('public');
const midiMgr = new MidiManager(io, GLOBAL_STATE);

// --- Routes API ---
app.get('/api/assets', (req, res) => {
    const data = assetMgr.getAllAssets();
    res.json({ success: true, assets: data });
});

app.get('/api/state', (req, res) => {
    res.json(GLOBAL_STATE);
});
const { exec } = require('child_process');

// Route API pour l'analyse IA (Exemple basique)
app.post('/api/ia/analyze', async (req, res) => {
    const { assetId, prompt } = req.body;
    
    // Logique simulée pour l'instant ou connexion réelle si iaService est prêt
    console.log(`[IA] Analyse demandée pour ${assetId} avec prompt: ${prompt}`);
    
    // Exemple d'utilisation de votre fonction existante (si applicable)
    // const result = await generateParameterUpdates(prompt); 
    
    res.json({ 
        success: true, 
        message: "Analyse simulée réussie", 
        data: { tags: ["dark", "sci-fi", "blue"], description: "Une scène futuriste..." } 
    });
});

app.post('/api/ia/vision-analyze', (req, res) => {
    const assetId = req.body.assetId;
    console.log(`[IA Vision] Analyse demandée pour ${assetId}`);

    // Simulation : Exécution du script Python
    // En production, tu passerais le chemin de l'image en argument
    // const imagePath = "public/data/images/scene.jpeg";
    
    // Commande pour lancer ton script python
    // python3 analyze_image.py "chemin/vers/image.jpg"
    
    // Pour l'instant, on renvoie une réponse simulée pour ne pas bloquer le front
    res.json({ 
        success: true, 
        description: "Llama-Vision: Je vois une scène sombre avec des formes géométriques..." 
    });
});
// --- Socket.IO ---
// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Socket] Client connecté: ${socket.id}`);
    
    // 1. Envoi de l'état global (Knobs, Transport)
    socket.emit('init_state', GLOBAL_STATE);

    // 2. IMPORTANT : Déléguer la gestion MIDI au Manager
    // C'est ce qui va déclencher l'envoi de 'all_pad_data'
    midiMgr.handleClientConnection(socket); 

    // Commandes Client -> Serveur (Virtuel Pad)
    socket.on('ui_pad_trigger', (data) => {
        io.emit('/pad/trigger', data); 
    });

    socket.on('disconnect', () => console.log(`[Socket] Client déconnecté`));
});
function handleControlChange(controlId, controlValue) {
    const mapping = CC_MAPPING_ROLES[controlId];

    if (mapping) {
        const updatedVariable = mapping.variable;
        let newValue = GLOBAL_STATE[updatedVariable];

        // --- LOGIQUE RELATIVE / ABSOLUE (Existante) ---
        if (mapping.relative) {
            let delta = 0;
            const step = mapping.step || 1; 
            const min = mapping.min || 0;
            const max = mapping.max || 1;

            if (controlValue > 64) { delta = -step; } 
            else if (controlValue > 0) { delta = step; }

            if (delta !== 0) {
                newValue += delta;
                // Gestion Wrap (Boucle)
                if (mapping.wrap === true) {
                    if (max === 360) {
                         newValue = (newValue % 360);
                         if (newValue < 0) { newValue += 360; }
                    } else {
                        const range = max - min;
                        newValue = (newValue - min);
                        if (newValue < 0) { newValue += range * (Math.floor(-newValue / range) + 1); }
                        newValue = (newValue % range) + min;
                    }
                } else {
                    // Limitage (Clip)
                    newValue = Math.min(max, Math.max(min, newValue));
                }
            }
        } else {
            // Absolu
            const norm_v = controlValue / 127.0;
            newValue = mapping.fn(norm_v); 
        }

        // Mise à jour de l'état serveur
        GLOBAL_STATE[updatedVariable] = newValue;
        
        // Envoi Legacy (pour compatibilité)
        sendToClient(`/controls/${updatedVariable}`, newValue);

        // --- AJOUT CRITIQUE POUR LA VERSION MODULAIRE ---
        // On envoie un événement standardisé que MidiSystem.js écoute
        // On normalise la valeur entre 0 et 127 pour que le client s'y retrouve
        let normalizedValue = 0;
        
        if (mapping.max === 360) { // Cas Chroma/Rotation
            normalizedValue = (newValue / 360) * 127;
        } else if (mapping.max === 100) { // Cas Pourcentage (X, Y, Timeline)
            normalizedValue = (newValue / 100) * 127;
        } else { // Cas par défaut
            normalizedValue = controlValue;
        }

        // Emission de l'événement universel
        io.emit('midi_cc', { 
            cc: parseInt(controlId), 
            value: normalizedValue,
            variable: updatedVariable
        });
    } 
}
// --- Démarrage ---
function start() {
    midiMgr.init(); // Démarre l'écoute MIDI
    
    server.listen(PORT, () => {
        console.log(`\n🚀 Studio Server prêt sur http://localhost:${PORT}`);
        console.log(`   📂 Assets servis depuis /public/data`);
    });
}

start();