// iaRouter.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 1. Importation du SDK Groq (laissez cette partie pour la fonctionnalité chatbot)
const Groq = require('groq-sdk'); 
const groq = new Groq();

// --- DÉFINITION DU CHEMIN ABSOLU LABCODE ---
// Utilisation de 'path.resolve' pour garantir que le chemin est absolu à partir de la racine du système,
// en partant du répertoire où iaRouter.js est supposé être.
// Nous allons utiliser un simple __dirname + un chemin relatif au fichier
const LABCODE_DIR = path.join(__dirname, 'labCode'); 
console.log(`[IA Router] Chemin LabCode CIBLE: ${LABCODE_DIR}`); 

// Extensions autorisées pour des raisons de sécurité
const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json'];

// --- AUTO-DIAGNOSTIC CRITIQUE ---
// (Ce bloc vous dira si le chemin est bon ou si les fichiers sont manquants)
async function checkLabCodeDir() {
    try {
        const files = await fs.readdir(LABCODE_DIR);
        const codeFiles = files.filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()));
        
        if (codeFiles.length === 0) {
            console.error(`[IA Router - DIAGNOSTIC] ❌ ERREUR: LabCode est accessible mais ne contient aucun fichier de code (${ALLOWED_EXTENSIONS.join(', ')}).`);
            console.error(`[IA Router - AIDE] Le chemin vérifié est: ${LABCODE_DIR}`);
        } else {
            console.log(`[IA Router - DIAGNOSTIC] ✅ Répertoire LabCode accessible. ${codeFiles.length} fichiers trouvés.`);
        }
    } catch (error) {
        console.error(`[IA Router - DIAGNOSTIC] ❌ ERREUR CRITIQUE: Le répertoire LabCode est INTROUVABLE. Code: ${error.code}.`);
        console.error(`[IA Router - CHEMIN UTILISÉ] ${LABCODE_DIR}`);
    }
}
checkLabCodeDir();
// ------------------------------------

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


// ROUTE CHATBOT (Assurez-vous que cette route existe pour la fonctionnalité IA/Groq)
/**
 * Route: POST /api/ia/simple-chat
 * Test de conversation simple utilisant l'historique pour simuler le contexte.
 */
router.post('chatbot', async (req, res) => {
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

// ==============================================================================
// ENDPOINT CRUD (LECTURE DE FICHIER) - CIBLE DE LA CORRECTION 404
// ==============================================================================

/**
 * Route pour récupérer le contenu des fichiers du LabCode.
 * URL complète : /api/ia/code/:filename
 */
router.get('/code/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(LABCODE_DIR, filename);
    const extension = path.extname(filename).toLowerCase();

    // 1. Vérification de sécurité: Le fichier doit être dans le répertoire autorisé
    if (!filePath.startsWith(LABCODE_DIR) || !ALLOWED_EXTENSIONS.includes(extension)) {
        console.warn(`[IA Router - LabCode] Accès refusé pour: ${filename}`);
        return res.status(403).json({ success: false, error: 'Accès interdit.' });
    }

    try {
        // Lire le contenu du fichier
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Renvoyer le contenu encapsulé dans un objet JSON, comme attendu par le Front-end
        return res.json({ success: true, content: content });

    } catch (error) {
        // L'erreur ici est probablement ENOENT (File Not Found)
        console.error(`[IA Router - LabCode] Erreur chargement fichier ${filename}: ${error.message}`);
        
        // Retourne 404 si le fichier n'existe pas
        if (error.code === 'ENOENT') {
            return res.status(404).json({ success: false, error: `Fichier ${filename} introuvable à l'emplacement: ${filePath}` });
        }
        return res.status(500).json({ success: false, error: `Erreur serveur lors de la lecture du fichier.` });
    }
});


module.exports = router;