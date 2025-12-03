/**
 * MODULE: CODE PLAYGROUND MANAGER
 * Rôle : Gère l'environnement de codage, le rendu temps réel (iframe) et la console IA.
 * Inclut la gestion des onglets (HTML/CSS/JS/JSON), la persistance locale (CRUD par fichier) et le contrôle MIDI.
 * Correction Electron: Utilisation de l'URL absolue pour le chargement des fichiers LabCode et la connexion MIDI.
 */
import { ChatbotController } from './chatbot.js'; 

const SERVER_URL = 'http://localhost:3145'; // URL absolue du serveur Node.js

class CodePlayground {
    constructor() {
        // Définition des fichiers gérés
        this.FILES = ['html', 'css', 'js', 'json']; 
        this.activeLanguage = 'html'; 
        
        // Cible de rendu & UI
        this.iframe = document.getElementById('live-preview-iframe');
        this.outputConsole = document.getElementById('terminal-output');
        this.runButton = document.getElementById('run-btn');
        this.editorArea = document.getElementById('code-editor-area');
        this.fileListContainer = document.getElementById('file-list');
        this.terminalInput = document.getElementById('terminal-input'); 
        
        // Console History
        this.commandHistory = []; 
        this.historyIndex = 0; 
        
        // Stockage du code
        this.codeStore = {};
        this.editors = {}; 
        this.chatbotService = null; 

        // Lancement asynchrone
        this._initAsync();
    }

    async _initAsync() {
        this.logSystem('Initialisation de l\'environnement de code...');
        await this._loadInitialCode(); 
        
        this._initTabsAndEditors();
        this._initListeners();
        this.updatePreview(); 
        
        // Initialisation des contrôleurs
        // IMPORTANT: ChatbotController doit être une instance de la classe importée.
        this.chatbotService = new ChatbotController(this); 
        
        // L'initialisation de MidiCodeController doit se faire après l'init du Chatbot
        if (window.io) {
            window.midiCodeController = new MidiCodeController(this); 
        } else {
            this.logSystem("⚠️ Dépendance Socket.IO manquante. Le contrôleur MIDI sera désactivé.");
        }
        
        this.logSystem('Playground prêt. Bienvenue, Architecte.');
    }

    // --- 0. GESTION FICHIERS (LOCAL STORAGE & SERVEUR) ---

    async _loadInitialCode() {
        const initialCode = {};
        let restoredFromLocal = false;
        
        // 1. Tente de restaurer depuis LocalStorage (Priorité 1)
        this.FILES.forEach(lang => {
            const saved = localStorage.getItem(`pg_${lang}_code`);
            if (saved) {
                initialCode[lang] = saved;
                restoredFromLocal = true;
            }
        });
        
        if (restoredFromLocal) {
            this.logSystem('Code restauré depuis la sauvegarde locale.');
        } else {
            // 2. CHARGEMENT DEPUIS LE SERVEUR /API/IA/CODE (Priorité 2)
            this.logSystem('Restauration depuis LabCode...');
            for (const lang of this.FILES) {
                const filename = this._getFilenameByLang(lang);
                try {
                    // CORRECTION CRITIQUE: Utilisation de l'URL absolue pour fetcher les fichiers
                    const response = await fetch(`${SERVER_URL}/api/ia/code/${filename}`);
                    
                    if (response.ok) {
                        // Assumant que l'API renvoie le contenu du fichier dans un objet JSON { content: "..." }
                        const data = await response.json();
                        // Vérification si la propriété 'content' existe bien
                        initialCode[lang] = data.content || ''; 
                        this.logSystem(`Fichier [${filename}] chargé.`);
                    } else {
                         // Si la réponse n'est pas OK (404), on met un message d'erreur clair.
                         initialCode[lang] = (lang === 'html') ? '<div style="color:red;padding:10px;">ERREUR 404: Fichier non trouvé</div>' : `// ERREUR 404: ${filename} non trouvé sur le serveur.`;
                         this.logSystem(`Échec chargement [${filename}]. Code: ${response.status}.`);
                    }
                } catch (e) {
                    // C'est cette erreur qui génère "Échec de la connexion."
                    this.logSystem(`Erreur réseau/parsing lors du chargement de ${filename}: ${e.message}.`);
                    initialCode[lang] = (lang === 'html') ? '<div style="color:red;padding:10px;">Échec de la connexion.</div>' : `// Échec de la connexion.`;
                }
            }
        }
        
        this.codeStore = initialCode;
    }
    
    _getFilenameByLang(lang) {
        if (lang === 'json') return 'database.json';
        if (lang === 'js') return 'script.js';
        if (lang === 'html') return 'index.html';
        return 'style.css'; // css
    }

    saveFile(lang) {
        if (!this.editors[lang]) return;
        this.codeStore[lang] = this.editors[lang].value;
        
        try {
            localStorage.setItem(`pg_${lang}_code`, this.codeStore[lang]);
            this.logSystem(`Fichier [${lang.toUpperCase()}] sauvegardé.`);
        } catch (e) {
            this.logSystem(`Erreur de sauvegarde locale de ${lang}: ` + e.message);
        }
    }
    
    deleteFile(lang) {
        if (!this.editors[lang]) return;
        
        try {
            localStorage.removeItem(`pg_${lang}_code`);
            this.codeStore[lang] = (lang === 'json') ? '{}' : '// Fichier effacé.';
            this.editors[lang].value = this.codeStore[lang];
            
            this.logSystem(`Fichier [${lang.toUpperCase()}] supprimé.`);
            this.updatePreview(true);
        } catch (e) {
            this.logSystem(`Erreur lors de la suppression de ${lang}: ` + e.message);
        }
    }

    // --- 1. GESTION DES ONGLET ET ÉDITEURS ---

    _initTabsAndEditors() {
        const buttonContainer = this.editorArea.querySelector('.h-8');
        
        this.FILES.forEach((lang) => {
            const filename = this._getFilenameByLang(lang);
            
            let textarea = document.getElementById(`${lang}-source`);
            if (!textarea) {
                 textarea = document.createElement('textarea');
                 textarea.id = `${lang}-source`;
                 // Utilise la classe pour assurer un style uniforme
                 textarea.className = 'flex-1 bg-[#111] font-mono text-sm text-green-400 p-2 resize-none outline-none hidden'; 
                 textarea.placeholder = `// Votre code ${lang} ici...`;
                 this.editorArea.appendChild(textarea);
            }
            // S'assurer que les valeurs initiales sont chargées
            textarea.value = this.codeStore[lang] || '';
            textarea.classList.toggle('hidden', lang !== this.activeLanguage);
            this.editors[lang] = textarea;
            
            let button = document.getElementById(`tab-${lang}`);
            if (!button) {
                button = document.createElement('button');
                button.id = `tab-${lang}`;
                button.textContent = lang.toUpperCase();
                button.className = 'text-gray-400 hover:text-white pb-1';
                buttonContainer.appendChild(button);
            }
            button.addEventListener('click', () => this.switchTab(lang));

            if (!document.querySelector(`.file-item[data-lang="${lang}"]`)) {
                this._createAsideFileItem(lang, filename);
            }
        });

        this.switchTab(this.activeLanguage);
    }
    
    _createAsideFileItem(lang, filename) {
        const listItem = document.createElement('li');
        listItem.dataset.filename = filename;
        listItem.dataset.lang = lang;
        listItem.className = `file-item p-2 rounded cursor-pointer border-l-2 flex justify-between items-center group border-transparent hover:bg-[#333]`;

        listItem.innerHTML = `
            <span class="text-xs text-white font-bold">${filename}</span>
            <div class="file-actions text-xs space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="Enregistrer" data-action="save" class="text-green-500 hover:text-green-300">💾</button>
                <button title="Supprimer" data-action="delete" class="text-red-500 hover:text-red-300">🗑️</button>
            </div>
        `;
        
        listItem.addEventListener('click', (e) => {
            if (!e.target.closest('[data-action]')) {
                this.switchTab(lang);
            }
        });
        
        listItem.querySelector('[data-action="save"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveFile(lang);
        });
        listItem.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(lang);
        });

        this.fileListContainer.appendChild(listItem);
    }

    switchTab(lang) {
        if (this.editors[this.activeLanguage]) {
            this.codeStore[this.activeLanguage] = this.editors[this.activeLanguage].value;
            this.editors[this.activeLanguage].classList.add('hidden');
        }
        
        this.activeLanguage = lang;
        
        const newSource = this.editors[lang];
        if (newSource) {
            newSource.classList.remove('hidden');
            newSource.value = this.codeStore[lang];
            newSource.focus();
            
            if (lang === 'html') this.updatePreview();
        }

        this.FILES.forEach(l => {
            const isActive = l === lang;
            
            const tabBtn = document.getElementById(`tab-${l}`);
            if (tabBtn) {
                tabBtn.classList.toggle('active', isActive);
                tabBtn.classList.toggle('text-blue-400', isActive);
                tabBtn.classList.toggle('text-gray-400', !isActive);
            }
            
            const fileItem = document.querySelector(`.file-item[data-lang="${l}"]`);
            if (fileItem) {
                fileItem.classList.toggle('file-active', isActive);
                fileItem.classList.toggle('bg-[#252525]', isActive);
                fileItem.classList.toggle('border-blue-500', isActive);
                fileItem.classList.toggle('border-transparent', !isActive);
                fileItem.classList.toggle('hover:bg-[#333]', !isActive);
            }
        });
    }

    // --- 2. RENDU EN TEMPS RÉEL ---

    _initListeners() {
        let debounceTimer;
        const handleInput = (e) => {
            const lang = this.activeLanguage;
            this.codeStore[lang] = this.editors[lang].value;
            this.saveFile(lang); 
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.updatePreview();
            }, 300); 
        };

        this.FILES.forEach(lang => {
            this.editors[lang]?.addEventListener('input', handleInput);
        });
        
        this.runButton.addEventListener('click', () => this.updatePreview(true));
        
        // Terminal Input est géré par ChatbotController (méthode executeCommand)
        this.terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.chatbotService.executeCommand(this.terminalInput.value); 
            }
        });
        document.getElementById('ai-terminal').querySelector('button').addEventListener('click', () => {
             this.chatbotService.executeCommand(this.terminalInput.value);
        });
    }

    updatePreview(forceRender = false) {
        if (!forceRender && this.activeLanguage !== 'html') return; 

        const html = this.codeStore.html || '';
        const css = this.codeStore.css || '';
        const js = this.codeStore.js || '';
        
        // Sécurité JSON
        let jsonString = '{}';
        try {
            jsonString = JSON.stringify(JSON.parse(this.codeStore.json), null, 0); 
        } catch (e) {
            this.logSystem("JSON Error: Impossible de parser le JSON. Utilisation de '{}'.");
        }
        
        const jsonCode = `const database = ${jsonString};`;

        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Live Preview</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>
                    ${jsonCode}
                    try {
                        ${js}
                    } catch (e) {
                        console.error('Erreur JS dans la preview:', e);
                        if (window.parent && window.parent.playground) {
                            // Utilisation de window.parent.playground.log pour parler à la console Electron
                            window.parent.playground.log('Erreur JS: ' + e.message, 'ai-response'); 
                        }
                    }
                </script>
            </body>
            </html>
        `;

        this.iframe.srcdoc = fullContent;
    }
    
    // --- 3. TERMINAL UTILS (Utilisé par ChatbotController et MidiCodeController) ---

    log(message, type = 'system') {
        const p = document.createElement('div');
        p.className = `terminal-${type}-log`;
        
        if (type === 'command') {
            p.innerHTML = `<span class="terminal-user-command">></span> ${message}`;
        } 
        else if (type === 'ai-response') {
            p.innerHTML = `<span class="terminal-ai-response">AI ></span> ${message}`;
        }
        else {
            p.innerHTML = `<span class="terminal-system-log">SYS ></span> ${message}`;
        }

        this.outputConsole.appendChild(p);
        this.outputConsole.scrollTop = this.outputConsole.scrollHeight;
    }
    
    logSystem(message) {
        this.log(message, 'system');
    }

    // Utilisé par MidiCodeController
    setEditorFontSize(size) {
        const pxSize = Math.max(10, Math.min(24, size));
        Object.values(this.editors).forEach(editor => {
            if (editor) editor.style.fontSize = `${pxSize}px`;
        });
        this.logSystem(`Taille de police ajustée à ${pxSize.toFixed(1)}px via MIDI.`);
    }

    // Utilisé par ChatbotController
    applyAICodeUpdates(updates) {
        let needsPreviewUpdate = false;
        
        for (const lang in updates) {
            if (this.codeStore.hasOwnProperty(lang) && this.editors[lang]) {
                const newCode = updates[lang];
                
                if (lang === this.activeLanguage) {
                     this.editors[lang].value = newCode;
                }
                
                this.codeStore[lang] = newCode;

                if (lang === 'html' || lang === 'css' || lang === 'js') {
                    needsPreviewUpdate = true;
                }
                this.saveFile(lang);
            }
        }

        if (needsPreviewUpdate) {
            this.updatePreview(true);
        }
    }
}

// --- CLASSE CONTRÔLEUR MIDI (Utilise ChatbotController) ---

class MidiCodeController {
    constructor(playgroundInstance) {
        this.playground = playgroundInstance;
        // CORRECTION: Socket doit se connecter explicitement à l'URL du serveur
        this.socket = window.io ? window.io(SERVER_URL) : null; 
        
        if (this.socket) {
            this.socket.on('midi_cc', (data) => this.handleCC(data));
            this.socket.on('/pad/trigger', (data) => this.handleNote(data));

            this.playground.logSystem("MIDI Link: Socket connecté. Événements en écoute.");
        } else {
            this.playground.logSystem("MIDI Link: Socket non disponible. (Veuillez lancer le serveur Node.js).");
        }
    }

    handleCC(data) {
        const cc = data.cc;
        const normVal = data.value / 127;
        
        // Log de l'événement entrant
        this.playground.logSystem(`[MIDI KNOB] CC ${cc}: Val ${data.value} (${normVal.toFixed(2)})`);

        // CC 4 (Scrub/Timeline) -> Scroll du Terminal
        if (cc === 4) {
            const scrollPos = normVal * (this.playground.outputConsole.scrollHeight - this.playground.outputConsole.clientHeight);
            this.playground.outputConsole.scrollTop = scrollPos;
        }
        
        // CC 5 (Zoom Global/Cam Rot) -> Navigation historique des commandes (Haut/Bas)
        if (cc === 5) {
            // Logique de navigation incrémentale
            if (data.value > 68) { 
                this.playground.chatbotService.navigateHistory(-1); 
            } else if (data.value < 60) { 
                this.playground.chatbotService.navigateHistory(1); 
            }
        }
        
        // CC 0 (X) -> Taille de Police
        if (cc === 0) {
             const sizeRange = 14; 
             const newFontSize = 10 + (normVal * sizeRange);
             this.playground.setEditorFontSize(newFontSize);
        }
    }

    handleNote(data) {
        const note = data.midi_note_raw || data.note || 0;
        const velocity = data.velocity || 127;

        if (velocity === 0) return;

        this.playground.logSystem(`[MIDI PAD activé] Note ${note}`);

        // Pad 1 (Note 36) : Switch d'onglet
        if (note === 4) {
            const currentIdx = this.playground.FILES.indexOf(this.playground.activeLanguage);
            const nextIdx = (currentIdx + 1) % this.playground.FILES.length;
            const nextLang = this.playground.FILES[nextIdx];
            this.playground.switchTab(nextLang);
        }
        
        // Pad 2 (Note 37) : Exécuter le code (RUN)
        else if (note === 5) {
            this.playground.updatePreview(true);
        }

        // Pad 4 (Note 39) : Enregistrer (Save)
        else if (note === 6) {
            this.playground.saveFile(this.playground.activeLanguage);
        }

        // Pad 5 (Note 40) : Envoyer la commande Terminal (ENTER)
        else if (note === 7) {
            const command = this.playground.terminalInput.value;
            this.playground.chatbotService.executeCommand(command);
        }
        
        // Pad 6 (Note 41) : Lancer la commande AI de test
        else if (note === 8) {
            this.playground.chatbotService.executeCommand("/code make the box green and rounder");
        }
    }
}

// --- INITIALISATION AU CHARGEMENT ---
window.addEventListener('DOMContentLoaded', () => {
    window.playground = new CodePlayground();
});