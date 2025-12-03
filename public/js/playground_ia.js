/**
 * CONTROLLER: AI PLAYGROUND
 * Rôle : Gère l'édition de code multi-langage, le rendu temps réel via iframe,
 * et l'interaction avec le Terminal IA via Socket.io.
 * * Dépendances :
 * - Global: io() (de socket.io-client)
 * - HTML: Éléments avec IDs spécifiques (editor-html, terminal-input, etc.)
 */
class PlaygroundController {
    constructor() {
        // --- 1. Éléments DOM ---
        
        // Conteneurs des éditeurs (Textarea)
        this.editors = {
            html: document.getElementById('editor-html'),
            css: document.getElementById('editor-css'),
            js: document.getElementById('editor-js'),
        };
        
        // Interface
        this.previewFrame = document.getElementById('live-preview');
        this.terminalInput = document.getElementById('terminal-input');
        this.terminalOutput = document.getElementById('terminal-output');
        this.runButton = document.getElementById('btn-run');
        this.recordButton = document.getElementById('btn-record');
        
        // --- 2. État du contrôleur ---
        this.activeTab = 'html';
        this.socket = window.io ? io() : { emit: () => console.warn('Socket.io non connecté'), once: () => {} }; // Gestion si Socket.io n'est pas chargé
        
        // Lancement des initialisations
        this.init();
    }

    /**
     * Initialise tous les gestionnaires et charge le code par défaut.
     */
    init() {
        this.setupEditorTabs();
        this.setupInputHandling();
        this.setupButtons();
        this.setupTerminal();
        this.loadDefaultCode();
        this.logSystem('Playground Controller initialisé. Prêt à coder.');
    }

    // --- 1. GESTION DES ONGLETS (HTML/CSS/JS) ---

    /**
     * Configure les écouteurs pour les boutons d'onglets.
     */
    setupEditorTabs() {
        document.querySelectorAll('.tab-editor').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.editor; // Utiliser currentTarget
                this.switchTab(target);
            });
        });
        this.switchTab(this.activeTab); // Initialiser l'affichage
    }

    /**
     * Change l'onglet actif et met à jour l'interface.
     * @param {string} tabName - 'html', 'css', ou 'js'.
     */
    switchTab(tabName) {
        if (!this.editors[tabName]) {
            this.logSystem(`Erreur: Onglet inconnu: ${tabName}`);
            return;
        }
        
        this.activeTab = tabName;
        
        // Met à jour les styles des boutons
        document.querySelectorAll('.tab-editor').forEach(btn => {
            const isActive = btn.dataset.editor === tabName;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('bg-[#222]', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('text-gray-400', !isActive);
            // La classe 'pointer-events-none' n'est pas nécessaire sur les boutons.
        });

        // Affiche l'éditeur actif et masque les autres
        ['html', 'css', 'js'].forEach(lang => {
            const editorEl = this.editors[lang];
            const isActive = lang === tabName;
            
            // Masque ou affiche l'éditeur (utilisation de 'hidden' ou 'display: none' par CSS)
            editorEl.classList.toggle('hidden', !isActive); 
            
            // Focus l'éditeur actif
            if (isActive) {
                editorEl.focus();
            }
        });
    }
    
    // --- 2. RENDU EN TEMPS RÉEL ---

    /**
     * Configure les écouteurs d'input pour déclencher le rendu différé.
     */
    setupInputHandling() {
        let renderTimeout;
        const delayedRender = () => {
            // Sauvegarde locale optionnelle pourrait aller ici
            clearTimeout(renderTimeout);
            // Déclenche le rendu après 1000ms d'inactivité
            renderTimeout = setTimeout(() => this.renderPreview(), 1000); 
        };

        this.editors.html.addEventListener('input', delayedRender);
        this.editors.css.addEventListener('input', delayedRender);
        this.editors.js.addEventListener('input', delayedRender);
    }
    
    /**
     * Génère le contenu complet de l'iframe et met à jour le rendu.
     */
    renderPreview() {
        const htmlCode = this.editors.html.value;
        const cssCode = this.editors.css.value;
        const jsCode = this.editors.js.value;

        const combinedContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Live Preview</title>
                <style>${cssCode}</style>
            </head>
            <body>
                ${htmlCode}
                <script>
                    // Gestion des erreurs JS pour ne pas bloquer l'iframe
                    try {
                        ${jsCode}
                    } catch (e) {
                        console.error('JS Execution Error:', e);
                        // Tentative de log de l'erreur dans la console parente (si possible)
                        if (window.parent && window.parent.playground) {
                            window.parent.playground.log('Erreur JS dans la preview: ' + e.message, 'system');
                        }
                    }
                </script>
            </body>
            </html>
        `;

        // Utiliser srcdoc pour le rendu sécurisé et rapide dans l'iframe
        this.previewFrame.srcdoc = combinedContent;
        this.logSystem("Aperçu mis à jour.");
    }
    
    // --- 3. GESTION DU TERMINAL ET LOGGING ---

    /**
     * Configure la gestion de l'input (touche Entrée).
     */
    setupTerminal() {
        this.terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeTerminalCommand(this.terminalInput.value);
                this.terminalInput.value = '';
            }
        });
    }

    /**
     * Ajoute un message formaté à la console du terminal.
     * @param {string} message - Le contenu du message.
     * @param {string} type - 'system', 'command', ou 'ai-response'.
     */
    log(message, type = 'system') {
        const p = document.createElement('div');
        p.className = `terminal-log`; // Classe de base (pour le padding/marge)
        
        // Uniformisation des préfixes et application des classes de couleur
        let prefix = '';
        let contentClass = '';

        if (type === 'command') {
            prefix = '>'; 
            contentClass = 'terminal-user-command';
        } 
        else if (type === 'ai-response') {
            prefix = 'AI >';
            contentClass = 'terminal-ai-response';
        }
        else { // type === 'system'
            prefix = 'SYS >';
            contentClass = 'terminal-system-log';
        }

        p.innerHTML = `<span class="terminal-prefix terminal-prefix--${type}">${prefix}</span> <span class="${contentClass}">${message}</span>`;
        
        this.terminalOutput.appendChild(p);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }
    
    /**
     * Raccourci pour log un message système.
     * @param {string} message
     */
    logSystem(message) {
        this.log(message, 'system');
    }
    
    /**
     * Traite les commandes entrées dans le terminal.
     * @param {string} command
     */
    executeTerminalCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        this.log(command, 'command'); // Log la commande utilisateur

        if (cmd === 'help') {
            this.log('Commandes disponibles:', 'ai-response');
            this.log('- help: Afficher cette liste.', 'ai-response');
            this.log('- run: Exécuter le rendu dans la prévisualisation.', 'ai-response');
            this.log('- clear: Nettoyer la console.', 'ai-response');
            this.log('- ai [prompt]: Obtenir une suggestion de code IA.', 'ai-response');
        } else if (cmd === 'run') {
            this.renderPreview();
            this.logSystem('Rendu exécuté.');
        } else if (cmd === 'clear') {
            this.terminalOutput.innerHTML = '';
        } else if (cmd.startsWith('ai ')) {
            const prompt = command.substring(3).trim();
            this.sendAIQuery(prompt);
        } else {
            // Traite toutes les commandes inconnues comme des requêtes AI par défaut
            this.logSystem(`Commande inconnue. Tentative d'envoi à l'IA...`);
            this.sendAIQuery(command); 
        }
    }
    
    /**
     * Envoie la requête IA au serveur (via Socket.io ou Fetch API).
     * @param {string} prompt - La requête de l'utilisateur.
     */
    sendAIQuery(prompt) {
        this.logSystem(`Envoi de la requête IA : "${prompt}"`);
        
        // Ajout d'un indicateur de chargement temporaire
        const loadingMessage = document.createElement('div');
        loadingMessage.innerHTML = `<span class="terminal-ai-prefix">AI ></span> <span class="terminal-ai-response animate-pulse">Processing...</span>`;
        this.terminalOutput.appendChild(loadingMessage);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

        // Envoi de la requête au serveur via Socket.io
        this.socket.emit('ai_playground_query', { 
            prompt: prompt, 
            context: { 
                html: this.editors.html.value, 
                css: this.editors.css.value,
                js: this.editors.js.value
            } 
        });

        // Écoute de la réponse (simulée ou réelle)
        this.socket.once('ai_playground_response', (data) => {
            loadingMessage.remove(); // Supprime l'indicateur de chargement
            
            if (data.codeSnippet) {
                // Log le snippet de code reçu
                this.log(`CODE SUGGESTION pour ${data.language || 'HTML/CSS'}:`, 'ai-response');
                const pre = document.createElement('pre');
                pre.className = "bg-[#111] p-2 text-xs my-1 text-gray-200 whitespace-pre-wrap";
                pre.textContent = data.codeSnippet;
                this.terminalOutput.appendChild(pre);
            } else if (data.error) {
                this.log(`Erreur du serveur IA: ${data.error}`, 'system');
            } else if (data.message) {
                 this.log(data.message, 'ai-response');
            } else {
                 this.log("AI: Réponse reçue sans instruction de code spécifique.", 'ai-response');
            }
        });
    }

    // --- 4. CRUD & ENREGISTREMENT ---

    /**
     * Configure les écouteurs pour les boutons d'action (Run, Save, Record).
     */
    setupButtons() {
        this.runButton.addEventListener('click', () => this.renderPreview());
        
        // Sauvegarde de l'état (Simule CRUD/CREATE - LocalStorage)
        const saveButton = document.getElementById('btn-save-state');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const state = {
                    html: this.editors.html.value,
                    css: this.editors.css.value,
                    js: this.editors.js.value,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('playground_state', JSON.stringify(state));
                this.logSystem("État sauvegardé localement.");
            });
        }
        
        // Fonctionnalité d'enregistrement (Mock)
        this.recordButton.addEventListener('click', () => {
            this.logSystem("Enregistrement (Capture Vidéo/Audio de l'Iframe) - Fonctionnalité en cours d'intégration (MediaRecorder API).");
        });
    }

    /**
     * Charge le code par défaut ou restaure un état sauvegardé.
     */
    loadDefaultCode() {
        // Tentative de restauration depuis LocalStorage
        const savedState = localStorage.getItem('playground_state');
        
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.editors.html.value = state.html || '';
                this.editors.css.value = state.css || '';
                this.editors.js.value = state.js || '';
                this.logSystem("Code restauré depuis la sauvegarde locale.");
                this.renderPreview();
                return;
            } catch (e) {
                this.logSystem("Erreur lors de la restauration du code local.");
                localStorage.removeItem('playground_state');
            }
        }
        
        // Chargement du code par défaut si aucune sauvegarde trouvée
        this.editors.html.value = '<h1>Hello, Studio AV!</h1><p id="output">Welcome to AI Playground.</p>';
        this.editors.css.value = 'body { background: #111; color: #32c865; margin: 0; font-family: sans-serif; }';
        this.editors.js.value = 'document.getElementById("output").textContent = "JS Active: " + new Date().toLocaleTimeString();';
        this.renderPreview();
    }
}

// Lancement du contrôleur au chargement
window.addEventListener('DOMContentLoaded', () => {
    window.playground = new PlaygroundController();
});