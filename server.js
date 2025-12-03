// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const AssetManager = require('./controllers/AssetManager');
const MidiManager = require('./controllers/MidiManager');
const { generateParameterUpdates } = require('./public/iaDataManager.js');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const iaRouter = require('./public/iaRouter'); 
const Groq = require('groq-sdk');
const groq = new Groq(); // Initialise le client Groq
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
// --- Ajout du Routeur IA ---
app.use('/api/ia', iaRouter);
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

// --- FONCTION UTILITAIRE POUR LE CONTEXTE DE CODE (Pour Groq) ---
function formatCodeContext(context) {
    let systemPrompt = "Vous êtes un Architecte Logiciel IA ultra-rapide. Votre tâche principale est de répondre aux questions et de générer ou modifier du code (HTML, CSS, JS, JSON). Si la requête est une modification de code (commande '/code'), vous devez répondre UNIQUEMENT par un objet JSON contenant les champs 'html', 'css', 'js' ou 'json' avec le code mis à jour. N'ajoutez aucun texte ou explication en dehors du JSON pour le code. Si la requête est une conversation, répondez normalement.\n\n";

    if (context.html) { systemPrompt += "--- HTML ACTUEL ---\n" + context.html + "\n\n"; }
    if (context.css) { systemPrompt += "--- CSS ACTUEL ---\n" + context.css + "\n\n"; }
    if (context.js) { systemPrompt += "--- JS ACTUEL ---\n" + context.js + "\n\n"; }
    if (context.json) { systemPrompt += "--- JSON ACTUEL ---\n" + context.json + "\n\n"; }
    
    return systemPrompt;
}

// ====================================================================
// NOUVEL ENDPOINT UNIQUE POUR LE CHATBOT
// ====================================================================

app.post('/api/ia/chatbot', async (req, res) => {
    // Le corps de la requête contient l'historique et le contexte du code
    const { history, current_context } = req.body;
    
    if (!history || history.length === 0) {
        return res.status(400).json({ success: false, log: "Historique de conversation manquant ou vide." });
    }

    try {
        // Le dernier message est le prompt de l'utilisateur
        const userPrompt = history[history.length - 1].content;
        
        // 1. Déterminer le rôle du message système initial (contextualisation de l'IA)
        const systemMessageContent = formatCodeContext(current_context || {});
        
        // 2. Préparation des messages pour l'API Groq
        const messages = [
            { role: "system", content: systemMessageContent },
            // On ajoute tout l'historique de conversation (rôle 'user'/'assistant')
            ...history
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant", 
            temperature: 0.1, 
            // Tentative de forcer la sortie JSON si la commande est /code
            response_format: userPrompt.startsWith('/code') ? { type: "json_object" } : undefined
        });

        // 3. Traitement de la réponse
        const rawContent = chatCompletion.choices[0]?.message?.content || "";
        let logMessage = rawContent;
        let codeUpdates = {};
        
        // Si la commande était /code, tente de parser le JSON
        if (userPrompt.startsWith('/code')) {
            try {
                codeUpdates = JSON.parse(rawContent);
                logMessage = "AI: Modifications de code appliquées.";
            } catch (e) {
                // Si le parsing échoue, le contenu brut est renvoyé comme message de log
                logMessage = `AI: Erreur de parsing JSON. Réponse brute: ${rawContent.substring(0, 100)}...`;
            }
        }
        
        // 4. Réponse structurée
        res.json({ 
            success: true, 
            log: logMessage,
            // Retourne l'objet vide si ce n'est pas une commande /code, ou les mises à jour
            code_updates: userPrompt.startsWith('/code') ? codeUpdates : {}
        });

    } catch (e) {
        console.error("Erreur Groq/Serveur:", e);
        res.status(500).json({ success: false, log: `Erreur serveur: ${e.message || 'Échec de la requête Groq.'}` });
    }
});

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
        console.log(`   🤖 Chatbot endpoint: /api/ia/chatbot`);
    });
}

start();