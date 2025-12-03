const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');


// 1. Importation du SDK Groq
const Groq = require('groq-sdk'); 

// Initialisation du client Groq
// Il lira automatiquement GROQ_API_KEY depuis process.env
const groq = new Groq();

// Chemin de base où se trouvent les fichiers du Playground
const LABCODE_DIR = path.join(__dirname, 'public', 'labCode');

// Liste des extensions autorisées (sécurité)
// Extensions autorisées pour des raisons de sécurité
const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json'];

// -----------------------------------------------------------------------------------

/**
 * Fonction utilitaire pour formater le contexte de code pour l'IA.
 * Cela aide l'IA à comprendre le code existant avant de faire des modifications.
 * @param {object} context - Le contexte de code actuel (html, css, js)
 * @returns {string} - Le prompt système formaté
 */
function formatCodeContext(context) {
    let systemPrompt = "Vous êtes un architecte Full-Stack IA. Votre seule tâche est de modifier ou de générer des snippets de code (HTML, CSS, JS) basés sur la requête utilisateur. Vous devez retourner UNIQUEMENT un objet JSON valide contenant l'un des champs 'html', 'css', ou 'js' avec le code mis à jour. N'ajoutez PAS d'explication ou de texte supplémentaire. Si vous modifiez, incluez la totalité du fichier modifié.\n\n";

    if (context.html) {
        systemPrompt += "--- FICHIER ACTUEL: HTML ---\n" + context.html + "\n\n";
    }
    if (context.css) {
        systemPrompt += "--- FICHIER ACTUEL: CSS ---\n" + context.css + "\n\n";
    }
    if (context.js) {
        systemPrompt += "--- FICHIER ACTUEL: JAVASCRIPT ---\n" + context.js + "\n\n";
    }
    systemPrompt += "--- REQUÊTE UTILISATEUR ---\n";

    return systemPrompt;
}

// -----------------------------------------------------------------------------------

/**
 * Route: POST /api/ia/generate-code
 * Rôle : Appelle le modèle Llama 3.1 (Groq) pour générer ou modifier du code.
 */
router.post('/generate-code', async (req, res) => {
    // current_context contient le HTML, CSS, JS actuel des éditeurs
    const { prompt, current_context } = req.body; 
    
    if (!prompt) {
        return res.status(400).json({ success: false, log: "Prompt manquant." });
    }

    try {
        // 2. Préparation des messages pour l'API Groq
        const systemMessage = formatCodeContext(current_context);

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant", // Utilisation du modèle Llama 3.1
            temperature: 0.1, // Basse température pour un code précis
            // Ajouter un paramètre pour forcer la sortie JSON (si disponible dans la version du SDK)
            response_format: { type: "json_object" }, 
        });

        // 3. Traitement de la réponse
        const rawContent = chatCompletion.choices[0]?.message?.content;
        let codeUpdates = {};
        let logMessage = "AI: Le code a été généré avec succès.";

        try {
            // Tente de parser la réponse JSON forcée
            codeUpdates = JSON.parse(rawContent);
        } catch (e) {
            // En cas d'échec du parsing (si l'IA a mis des explications)
            logMessage = `AI: Erreur de parsing JSON. Réponse brute reçue: ${rawContent.substring(0, 100)}...`;
            console.error(e);
        }
        
        // La structure JSON attendue est { html: '...', css: '...' }
        const hasUpdates = Object.keys(codeUpdates).some(key => ['html', 'css', 'js'].includes(key));
        
        if (!hasUpdates) {
             logMessage = "AI: Requête traitée, mais l'IA n'a pas retourné de modifications de code (JSON vide ou non reconnu).";
        }


        // 4. Réponse structurée pour le front-end
        res.json({ 
            success: true, 
            log: logMessage,
            code_updates: codeUpdates // Les mises à jour de code (peut être vide)
        });

    } catch (e) {
        console.error("Erreur Groq/Serveur lors de la génération de code IA:", e);
        // Utilisation de e.message si disponible, sinon un message générique
        const errorLog = `Erreur Groq: ${e.message || 'Échec de la connexion ou de la requête.'}`;
        res.status(500).json({ success: false, log: errorLog });
    }
});
// (Exemple : si ce routeur est dans un dossier 'routes', on remonte d'un niveau)

// ==============================================================================
// 1. ENDPOINT CHAT SIMPLE & HISTORIQUE
// ==============================================================================

/**
 * Route: POST /api/ia/simple-chat
 * Rôle : Gère les conversations simples avec l'IA. 
 * Utilise l'historique ('history') passé dans le corps de la requête pour 
 * simuler une réponse contextuelle légère.
 */
router.post('/simple-chat', async (req, res) => {
    // Récupération de l'historique complet (tableau d'objets {role: content:}) et du dernier prompt
    const { history, prompt } = req.body;
    
    console.log(`[IA Simple Chat] Prompt reçu: "${prompt}"`);
    const historyLength = history ? history.length : 0;
    console.log(`[IA Simple Chat] Historique de ${historyLength} messages.`);
    
    let aiResponse = "";
    
    // --- LOGIQUE DE RÉPONSE SIMPLE ET CONTEXTUELLE SIMULÉE ---
    
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('bonjour')) {
        aiResponse = "Bonjour ! Je suis l'assistant de conversation. Quel est votre prochain objectif ?";
    } else if (historyLength > 2 && history[historyLength - 3] && history[historyLength - 3].content.includes('objectif')) {
        // Simulation de la mémoire: Si l'avant-dernier message parlait d'un objectif.
        aiResponse = `J'ai noté votre dernier point. La discussion semble toujours tourner autour de votre objectif. Quel est le statut de l'HTML/CSS ?`;
    } else if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('modifier')) {
        aiResponse = "Pour la modification de code, veuillez utiliser la commande '/code [prompt]' dans le terminal. Que voulez-vous modifier ?";
    } else {
        // Réponse par défaut, confirmant que l'historique est bien reçu.
        aiResponse = `J'ai bien reçu votre message : "${prompt}". L'historique de conversation (total ${historyLength} messages) a été pris en compte.`;
    }
    
    // Réponse structurée: seul le 'log' est utilisé par le client pour la console.
    res.json({ 
        success: true, 
        log: aiResponse,
        // Pas de 'code_updates' pour le chat simple.
    });
});

// ==============================================================================
// 2. ENDPOINT GÉNÉRATION DE CODE
// ==============================================================================

/**
 * Route: POST /api/ia/generate-code
 * Rôle : Reçoit un prompt de l'utilisateur et retourne le code généré ou modifié.
 * C'est le point d'entrée du terminal Playground pour les actions de code.
 */
router.post('/generate-code', async (req, res) => {
    // current_context contient le HTML, CSS, JS actuel des éditeurs
    const { prompt, current_context } = req.body; 
    
    if (!prompt) {
        return res.status(400).json({ success: false, log: "Prompt manquant." });
    }

    try {
        // --- SIMULATION DE MODIFICATION DE CODE (À REMPLACER PAR L'APPEL IA RÉEL) ---
        let responseCode = {
            log: "AI: Code generation simulated successfully. No changes applied." 
        };
        
        // Exemple simple : si l'utilisateur demande une boîte bleue
        if (prompt.toLowerCase().includes('blue box')) {
             responseCode.code_updates = {
                 // Met à jour la CSS pour la classe
                 css: ".test-box { background-color: blue; border-radius: 12px; padding: 10px; color: white; }",
                 // Ajoute l'élément HTML seulement s'il n'existe pas
                 html: (current_context.html && current_context.html.includes('.test-box')) 
                    ? current_context.html 
                    : `<div class="test-box">Hello Blue Box!</div>\n${current_context.html || ''}`
             };
             responseCode.log = "AI: Applied 'blue' style to .test-box and ensured the HTML element exists in the code.";
        }
        
        // Réponse structurée pour le front-end
        res.json({ 
            success: true, 
            log: responseCode.log,
            code_updates: responseCode.code_updates || {} // Les mises à jour de code
        });

    } catch (e) {
        console.error("Erreur lors de la génération de code IA:", e);
        res.status(500).json({ success: false, log: "Erreur serveur lors de la requête IA." });
    }
});

// ==============================================================================
// 3. ENDPOINT CRUD (LECTURE DE FICHIER)
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
    if (!filePath.startsWith(LABCODE_DIR)) {
        console.warn(`[IA Router] Tentative d'accès non autorisée: ${filename}`);
        return res.status(403).json({ success: false, error: 'Accès interdit.' });
    }

    // 2. Vérification de l'extension
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        console.warn(`[IA Router] Extension non autorisée: ${filename}`);
        return res.status(403).json({ success: false, error: 'Type de fichier non supporté.' });
    }

    try {
        // Lire le contenu du fichier
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Renvoyer le contenu encapsulé dans un objet JSON, comme attendu par le Front-end
        return res.json({ success: true, content: content });

    } catch (error) {
        // Log l'erreur (fichier non trouvé ou erreur de lecture)
        console.error(`[IA Router] Erreur lors du chargement de ${filename}:`, error.message);
        // Retourne 404 si le fichier n'existe pas
        return res.status(404).json({ success: false, error: `Fichier ${filename} introuvable.` });
    }
});


module.exports = router;