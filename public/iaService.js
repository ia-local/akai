
const Groq = require('groq-sdk');
// Note: GROQ_API_KEY doit être définie dans vos variables d'environnement Node.js
const GROQ_API_KEY = process.env.GROQ_API_KEY || "VOTRE_CLE_GROQ"; 
const GROQ_MODEL = 'llama-3.1-8b-instant';

// Initialisation du client Groq
const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Appelle le modèle Llama pour générer du contenu basé sur un prompt et un contexte.
 * @param {string} systemPrompt - Instructions du système (rôle de l'IA).
 * @param {string} userPrompt - La requête de l'utilisateur.
 * @returns {Promise<string>} Le texte généré par l'IA.
 */
async function generateContent(systemPrompt, userPrompt) {
    if (!GROQ_API_KEY || GROQ_API_KEY === "VOTRE_CLE_GROQ") {
        console.error("Erreur: GROQ_API_KEY non configurée. Utilisez un placeholder.");
        return "Erreur: Service IA non disponible (Clé manquante).";
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                }
            ],
            model: GROQ_MODEL,
            temperature: 0.7,
        });

        return chatCompletion.choices[0]?.message?.content || "Aucune réponse générée.";
        
    } catch (error) {
        console.error("Erreur lors de l'appel à Groq API:", error);
        return "Erreur: Échec de la communication avec l'IA. (Vérifiez la clé ou les limites d'usage)";
    }
}

module.exports = { generateContent, GROQ_MODEL };