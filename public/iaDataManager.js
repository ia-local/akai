const { generateContent } = require('./iaService');

const SYSTEM_PROMPT_MAPPER = `
Tu es un Mappeur MIDI AV expert. Ton objectif est de traduire une requête en langage naturel en une instruction JSON pour ajuster les paramètres audiovisuels.
Les paramètres contrôlables sont: cursor_x, cursor_y, cursor_z, av_chroma_angle (0-360), av_saturation (0-1), av_param_1 (rotation caméra 0-360), av_param_3 (vitesse animation 0-100).
Tu ne dois répondre qu'avec l'objet JSON valide, sans explication, sans préambule.

Exemple de sortie attendue (JSON):
{"av_chroma_angle": 240, "av_saturation": 0.95, "av_param_3": 80}
`;

/**
 * Demande à l'IA de générer des mises à jour de paramètres à partir du texte.
 * @param {string} userQuery - La requête de l'utilisateur (ex: "Je veux un style sombre et rapide en bleu").
 * @returns {Promise<object | null>} L'objet JSON des mises à jour de l'état global.
 */
async function generateParameterUpdates(userQuery) {
    const prompt = `Traduis la requête suivante en un objet JSON contenant uniquement les paramètres et les valeurs numériques correspondantes: "${userQuery}"`;
    
    const responseText = await generateContent(SYSTEM_PROMPT_MAPPER, prompt);

    try {
        // L'IA doit répondre en JSON brut
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null; 
    } catch (e) {
        console.error("Erreur lors du parsing JSON de l'IA:", e, "Réponse IA:", responseText);
        return null;
    }
}

module.exports = { generateParameterUpdates };