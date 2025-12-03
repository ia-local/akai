const express = require('express');
const router = express.Router();
// Assurez-vous que le chemin vers iaDataManager est correct (si vous l'utilisez)
const { generateParameterUpdates } = require('./public/iaDataManager.js'); 
const fs = require('fs');
const path = require('path');

// Chemin où se trouvent les fichiers du laboratoire de code
const CODE_LAB_PATH = path.join(__dirname, '/data/labCode');
const LABCODE_DIR = path.join(__dirname, 'public', 'labCode');
/**
 * Route: POST /api/ia/simple-chat
 * Test de conversation simple utilisant l'historique pour simuler le contexte.
 */
router.post('/simple-chat', async (req, res) => {
    // Récupération de l'historique complet et du dernier prompt
    const { history, prompt } = req.body;
    
    console.log(`[IA Simple Chat] Prompt reçu: "${prompt}"`);
    console.log(`[IA Simple Chat] Historique de ${history.length} messages.`);
    
    let aiResponse = "";
    
    // --- LOGIQUE DE RÉPONSE SIMPLE ET CONTEXTUELLE ---
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('bonjour')) {
        aiResponse = "Bonjour ! Je suis l'assistant de conversation. Quel est votre prochain objectif ?";
    } else if (history.length > 2 && history[history.length - 3].content.includes('objectif')) {
        // Simule la mémoire : si l'avant-dernier message parlait d'un objectif...
        aiResponse = `J'ai noté votre dernier point. La discussion concerne toujours votre objectif : "${prompt}".`;
    } else {
        aiResponse = `J'ai bien reçu votre message : "${prompt}". Souhaitez-vous un aperçu de votre code actuel ?`;
    }
    
    // Réponse structurée pour le front-end
    res.json({ 
        success: true, 
        log: aiResponse,
        // Pas de code_updates pour ce chat simple.
    });
});

/**
 * Route: POST /api/ia/generate-code
 * Reçoit un prompt de l'utilisateur et retourne le code généré ou modifié.
 * C'est le point d'entrée du terminal Playground.
 */
router.post('/generate-code', async (req, res) => {
    const { prompt, current_context } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ success: false, message: "Prompt manquant." });
    }

    try {
        // --- SIMULATION DE MODIFICATION DE CODE (À REMPLACER PAR L'APPEL GEMINI RÉEL) ---
        let responseCode = {};
        
        // Exemple simple : si l'utilisateur demande une boîte bleue
        if (prompt.toLowerCase().includes('blue box')) {
             responseCode.css = ".test-box { background-color: blue; border-radius: 12px; padding: 10px; color: white; }";
             responseCode.html = (current_context.html.includes('.test-box')) 
                ? current_context.html 
                : `<div class="test-box">Hello Blue Box!</div>\n${current_context.html}`;
             responseCode.log = "AI: Applied 'blue' style to .test-box and ensured the HTML element exists.";
        } else {
             responseCode.log = "AI: Code generation simulated successfully. No changes applied.";
        }
        
        // Réponse structurée pour le front-end
        res.json({ 
            success: true, 
            log: responseCode.log,
            code_updates: responseCode // Contient les mises à jour (peut être vide {})
        });

    } catch (e) {
        console.error("Erreur lors de la génération de code IA:", e);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la requête IA." });
    }
});

/**
 * Route: GET /api/ia/code/:filename
 * Lit le contenu d'un fichier du laboratoire. (Pour le CRUD - READ)
 */
router.get('/code/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(LABCODE_DIR, filename);
    const extension = path.extname(filename).toLowerCase();

    // Vérifications de sécurité et d'accès
    if (!filePath.startsWith(LABCODE_DIR) || !ALLOWED_EXTENSIONS.includes(extension)) {
        console.warn(`[IA Router - LabCode] Accès refusé ou extension non autorisée pour: ${filename}`);
        return res.status(403).json({ success: false, error: 'Accès interdit ou type de fichier non supporté.' });
    }

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Renvoie le contenu au format JSON, comme attendu par le fetch du Front-end
        return res.json({ success: true, content: content });

    } catch (error) {
        // Erreur la plus courante: Fichier non trouvé (EACCES/ENOENT)
        console.error(`[IA Router - LabCode] Erreur chargement ${filename}: ${error.message}`);
        return res.status(404).json({ success: false, error: `Fichier ${filename} introuvable sur le serveur.` });
    }
});

module.exports = router;