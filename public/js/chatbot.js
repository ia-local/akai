/**
 * MODULE: CHATBOT CONTROLLER (Version Synchrone)
 * Rôle : Gère l'interface du terminal, l'historique des commandes,
 * et envoie toutes les requêtes d'assistance IA au nouvel endpoint unique (/api/ia/chatbot).
 * Correction Electron: Utilisation de l'URL absolue pour l'API.
 */
export class ChatbotController {
    constructor(playgroundInstance) {
        this.playground = playgroundInstance;
        this.terminalInput = playgroundInstance.terminalInput;
        this.outputConsole = playgroundInstance.outputConsole;
        
        const SERVER_URL = 'http://localhost:3145'; // Définition locale de l'URL du serveur

        // Message SYSTEME initial pour définir le rôle de l'IA (le contexte)
        const initialSystemMessage = {
            role: 'system',
            content: "Vous êtes l'Architecte Logiciel IA. Votre rôle est de générer/modifier le code (HTML/CSS/JS/JSON) en réponse à la commande '/code' ou de tenir une conversation basée sur le contexte. Vous êtes ultra-rapide et analytique."
        };
        
        // L'historique démarre avec le rôle SYSTEME
        this.conversationHistory = [initialSystemMessage]; 
        
        // Historique des commandes tapées (pour la navigation HAUT/BAS par le MIDI)
        this.commandHistory = [];
        this.historyIndex = 0; 
        
        // Message d'accueil (UX)
        this.logWelcomeMessage();
    }
    
    logWelcomeMessage() {
        // Affiche un message d'accueil initial dans la console (sans l'ajouter à l'historique de conversation)
        this.playground.log('AI: Initialisation terminée. Je suis votre Architecte Logiciel IA, propulsé par Groq. Comment puis-je vous assister aujourd\'hui ?', 'ai-response');
    }

    /**
     * Exécute une commande utilisateur.
     * @param {string} command La chaîne de commande entrée par l'utilisateur.
     */
    executeCommand(command) {
        const trimmedCommand = command.trim();
        if (!trimmedCommand) return;

        this.playground.log(trimmedCommand, 'command');
        
        // 1. Mise à jour de l'historique des commandes (pour HAUT/BAS)
        this.commandHistory.push(trimmedCommand);
        this.historyIndex = this.commandHistory.length; 
        
        this.terminalInput.value = ''; 
        this.playground.saveFile(this.playground.activeLanguage); 

        // 2. Log le message utilisateur dans l'historique de conversation (rôle 'user')
        this.conversationHistory.push({ role: 'user', content: trimmedCommand });

        // 3. Envoie la requête unique à l'API
        this.sendAIRequest(trimmedCommand, 'http://localhost:3145/api/ia/chatbot'); // Utilisation de l'URL absolue
    }
    
    /**
     * Envoie la requête synchrone unique au serveur.
     * @param {string} prompt Le dernier prompt utilisateur.
     * @param {string} endpoint L'URL de l'endpoint unique.
     */
    async sendAIRequest(prompt, endpoint) {
        this.playground.logSystem(`Connecting to AI endpoint...`);
        
        // --- GESTION DU CHARGEMENT (UX) ---
        const loadingMessage = document.createElement('div');
        loadingMessage.innerHTML = `<span class="terminal-ai-prefix">AI ></span> <span class="terminal-ai-response animate-pulse">Processing...</span>`;
        this.playground.outputConsole.appendChild(loadingMessage);
        this.playground.outputConsole.scrollTop = this.playground.outputConsole.scrollHeight;

        // Détermine le contexte de code si la commande est /code
        const isCodeCommand = prompt.toLowerCase().startsWith('/code');
        
        const payload = {
            // L'historique complet, y compris le message 'system' initial
            history: this.conversationHistory, 
            // Contexte du code (requis seulement pour /code, mais envoyé toujours)
            current_context: {
                html: this.playground.codeStore.html,
                css: this.playground.codeStore.css,
                js: this.playground.codeStore.js,
                json: this.playground.codeStore.json
            }
        };

        try {
            // CORRECTION: L'endpoint est déjà l'URL absolue passée en paramètre
            const response = await fetch(endpoint, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            loadingMessage.remove();

            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            
            const data = await response.json();
            
            // 4. Log la réponse de l'IA (rôle 'assistant')
            this.playground.log('AI: ' + data.log, 'ai-response');

            // 5. Log la réponse de l'IA dans l'historique de conversation
            this.conversationHistory.push({ role: 'assistant', content: data.log });

            // 6. Si le serveur a retourné des mises à jour de code
            if (isCodeCommand && data.success && data.code_updates && Object.keys(data.code_updates).length > 0) {
                this.playground.applyAICodeUpdates(data.code_updates);
            }

        } catch (e) {
            loadingMessage.remove(); 
            this.playground.logSystem(`Échec de la requête IA: ${e.message}`);
            // Retirer le dernier message utilisateur de l'historique si la requête a échoué
            this.conversationHistory.pop();
        }
    }

    /**
     * Navigue dans l'historique des commandes (utilisé par MidiCodeController).
     */
    navigateHistory(direction) {
        const newIndex = this.historyIndex + direction;
        
        if (newIndex < 0 || newIndex > this.commandHistory.length) return;

        this.historyIndex = newIndex;

        if (newIndex === this.commandHistory.length) {
            this.terminalInput.value = '';
        } else {
            this.terminalInput.value = this.commandHistory[newIndex];
        }
        this.terminalInput.focus();
    }
}