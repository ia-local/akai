const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Groq = require('groq-sdk');

class QuantumComputer {
    constructor() {
        this.groq = new Groq(); // Assure-toi que GROQ_API_KEY est dans ton .env
        
        // Chemins
        this.scssPath = path.join(__dirname, 'QuantumCompute.scss');
        this.cssOutputPath = path.join(__dirname, '../public/css/QuantumCompute.css'); // Ajuster selon ta structure
        
        // État interne
        this.isCompiling = false;
        
        // Démarrage du Watcher SASS
        this.initSassWatcher();
    }

    /**
     * Lance le processus 'sass --watch' en arrière-plan
     */
    initSassWatcher() {
        console.log(`⚛️ [QuantumComputer] Démarrage du SASS Watcher...`);
        console.log(`   Source: ${this.scssPath}`);
        console.log(`   Dest  : ${this.cssOutputPath}`);

        const sass = spawn('npx', ['sass', '--watch', `${this.scssPath}:${this.cssOutputPath}`]);

        sass.stdout.on('data', (data) => {
            console.log(`🎨 [SASS] ${data}`);
        });

        sass.stderr.on('data', (data) => {
            console.error(`⚠️ [SASS Error] ${data}`);
        });
    }

    /**
     * CRUD: UPDATE - Demande à l'IA de régénérer le style
     * @param {Object} context - État actuel (ex: { entanglement: 0.8, mood: "chaos" })
     */
    async updateStyle(context) {
        console.log("🤖 [AI] Génération de style pour contexte:", context);

        const prompt = `
            Tu es un Designer CSS Quantique Expert.
            Ta tâche est de réécrire le contenu d'un fichier SCSS pour refléter l'état suivant :
            - Entanglement (Complexité) : ${context.entanglement || 'Basse'}
            - Probabilité (Opacité) : ${context.probability || 'Moyenne'}
            - Ambiance : ${context.mood || 'Neutre'}

            RÈGLES :
            1. Réponds UNIQUEMENT avec le code SCSS valide. Pas de texte avant ou après.
            2. Définit les variables $primary-color et $glitch-intensity selon l'ambiance.
            3. Crée une animation @keyframes 'quantum-flux' complexe si l'entanglement est haut.
            4. Applique cette animation à '#preview-media-container.mode-quantum #webgl-canvas'.
        `;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 1024,
            });

            const newScssContent = chatCompletion.choices[0]?.message?.content || "";
            
            // Nettoyage du code (retrait des balises markdown ```scss si présentes)
            const cleanScss = newScssContent.replace(/```scss|```/g, "").trim();

            // Écriture Disque (Ce qui déclenchera le SASS Watcher)
            this.writeScss(cleanScss);
            
            return { success: true, message: "Style Quantique Mis à jour" };

        } catch (error) {
            console.error("❌ Erreur IA:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * CRUD: WRITE - Écrit physiquement le fichier
     */
    writeScss(content) {
        fs.writeFile(this.scssPath, content, (err) => {
            if (err) console.error("❌ Erreur écriture SCSS:", err);
            else console.log("💾 [FS] QuantumCompute.scss mis à jour.");
        });
    }

    /**
     * CRUD: READ - Lit le style actuel (pour l'envoyer au front si besoin)
     */
    getCurrentStyle() {
        try {
            return fs.readFileSync(this.scssPath, 'utf8');
        } catch (e) {
            return null;
        }
    }
}

module.exports = QuantumComputer;