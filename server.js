const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const Groq = require('groq-sdk');
const path = require('path');

// --- Import des Modules ---
const AssetManager = require('./controllers/AssetManager.js');
const MidiManager = require('./controllers/MidiManager.js');
const QuantumComputer = require('./controllers/QuantumComputer.js');

// 💡 CORRECTION MODULARITÉ/SÉCURITÉ:
// On utilise iaRouter.js de la racine (selon l'arborescence) pour éviter
// son exposition via le dossier /public.
const iaRouter = require('./public/iaRouter.js'); 

// --- Configuration ---
const PORT = 3145;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const groq = new Groq();

// --- Chargement Swagger Sécurisé ---
let swaggerDocument;
try {
    // Utilisation de path.join pour un chemin absolu fiable
    swaggerDocument = YAML.load(path.join(__dirname, 'api-docs', 'swagger.yaml'));
} catch (e) {
    console.error("❌ Erreur de chargement Swagger YAML :", e.message);
}

// --- Middleware ---
app.use(express.json());

// 1. Routes API Prioritaires (Avant les fichiers statiques)
if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(`📚 Documentation disponible sur http://localhost:${PORT}/api-docs`);
}

app.use('/api/ia', iaRouter);

// 2. Fichiers Statiques (Racine Web)
app.use(express.static(path.join(__dirname, 'public')));

// --- État Global ---
const GLOBAL_STATE = {
    cursor_x: 50,
    cursor_y: 50,
    cursor_z: 1.0, // Reste pour la compatibilité Legacy si besoin
    av_chroma_angle: 0,
    av_camera_rot: 0,
    av_saturation: 1.0,
    eq_bass: 0,
    eq_treble: 0,
    // 💡 AJOUT : Assurer la conformité avec le schéma GlobalState de Swagger
    quantum_dimension: 1,
    quantum_probability: 0.5,
    quantum_entanglement: 0.0,
    quantum_coherence: 1.0, // Ajouté, lié à cursor_z (Zoom/Stabilité)
    transport: 'STOPPED'
};

// --- Initialisation des Contrôleurs ---
const assetMgr = new AssetManager('public'); 
const midiMgr = new MidiManager(io, GLOBAL_STATE);
const quantumComputer = new QuantumComputer();

// --- Routes API Assets & State ---
app.get('/api/assets', (req, res) => {
    const data = assetMgr.getAllAssets();
    res.json({ success: true, assets: data });
});

app.get('/api/state', (req, res) => {
    // Mise à jour de la cohérence avant l'envoi
    GLOBAL_STATE.quantum_coherence = GLOBAL_STATE.cursor_z; 
    res.json(GLOBAL_STATE);
});

// --- Endpoints IA & Quantum ---
app.post('/api/quantum/mutate', async (req, res) => {
    const context = req.body;
    console.log("🌌 [API] Quantum Mutation Requested:", context);
    const result = await quantumComputer.updateStyle(context);
    res.json(result);
});

// Endpoint Vision
app.post('/api/ia/vision-analyze', (req, res) => {
    res.json({ 
        success: true, 
        description: "Llama-Vision: Analyse simulée - Scène complexe détectée." 
    });
});

// Endpoint Chatbot
app.post('/api/ia/chatbot', async (req, res) => {
    const { history, current_context } = req.body;
    if (!history || history.length === 0) {
        return res.status(400).json({ success: false, log: "Historique vide." });
    }

    try {
        const systemMessageContent = formatCodeContext(current_context || {});
        const messages = [{ role: "system", content: systemMessageContent }, ...history];
        const userPrompt = history[history.length - 1].content;

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            // Permet de forcer le JSON pour les commandes /code
            response_format: userPrompt.startsWith('/code') ? { type: "json_object" } : undefined
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || "";
        let codeUpdates = {};
        let logMessage = rawContent;

        if (userPrompt.startsWith('/code')) {
            try {
                codeUpdates = JSON.parse(rawContent);
                logMessage = "AI: Code modifié.";
            } catch (e) {
                logMessage = `AI Error: Invalid JSON response.`;
            }
        }
        res.json({ success: true, log: logMessage, code_updates: codeUpdates });

    } catch (e) {
        console.error("Groq Error:", e);
        res.status(500).json({ success: false, log: "Erreur serveur IA." });
    }
});

// --- Helper Context ---
function formatCodeContext(context) {
    let txt = "Vous êtes un Architecte Logiciel IA. Répondez aux questions ou générez du JSON si commande /code.\n\n";
    if (context.html) txt += "--- HTML ---\n" + context.html + "\n\n";
    if (context.css) txt += "--- CSS ---\n" + context.css + "\n\n";
    if (context.js) txt += "--- JS ---\n" + context.js + "\n\n";
    return txt;
}

// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Socket] Client connecté: ${socket.id}`);
    
    // Assurer que la cohérence est synchronisée avant l'envoi initial
    GLOBAL_STATE.quantum_coherence = GLOBAL_STATE.cursor_z;
    socket.emit('init_state', GLOBAL_STATE);

    socket.on('quantum_generate', (data) => {
        quantumComputer.updateStyle(data);
    });

    midiMgr.handleClientConnection(socket); 

    socket.on('ui_pad_trigger', (data) => {
        io.emit('/pad/trigger', data); 
    });

    socket.on('disconnect', () => console.log(`[Socket] Déconnecté`));
    
    socket.on('midi_page_switch', (data) => {
        // Log pour confirmer la réception sur le serveur Node
        console.log(`[SERVER] Relais MIDI Page Switch: ${data.page}`);
        
        // Relai vers TOUS les clients connectés (y compris le processus Electron principal)
        io.emit('midi_page_switch', data); 
    });
});

// --- Démarrage Serveur ---
function start() {
    midiMgr.init();
    server.listen(PORT, () => {
        console.log(`\n🚀 Studio Server prêt sur http://localhost:${PORT}`);
        console.log(`   📂 Assets servis depuis /public`);
        console.log(`   📚 Documentation API : http://localhost:${PORT}/api-docs`);
    });
}

start();