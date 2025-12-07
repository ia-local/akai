/**
 * SYSTEM: UI MANAGER (V2.1 FIXED)
 * Gère les panneaux latéraux, la bibliothèque et les modales.
 * Correction: Import et Instanciation de ModalSystem.
 */
import { MidiModal } from '../ui/MidiModal.js';
import { ConfigManager } from '../ui/modalConfig.js';
import { ModalSystem } from '../ui/modalSystem.js'; // <--- IMPORT AJOUTÉ

export class UISystem {
    constructor(studio) {
        this.studio = studio;
        this.libraryContainer = document.getElementById('assets-list-container');
        this.rightPanel = document.getElementById('right-panel');
        this.toggleToolsBtn = document.getElementById('toggle-tools-btn');
        this.closeToolsBtn = document.getElementById('close-tools-btn');
        this.modeIndicator = document.getElementById('mode-indicator');
        
        // Instanciation des sous-systèmes
        this.midiModal = new MidiModal(studio);
        this.configManager = new ConfigManager();
        
        // INITIALISATION CRITIQUE DU MODAL SYSTEM
        this.modalSystem = new ModalSystem(); 
        window.modalSystem = this.modalSystem; // Exposition globale pour TimelineManager
    }

    init() {
        this.initListeners();
        this.setupLibraryViewSwitcher();
        this.initAssetLibrary();
        console.log("🖥️ UISystem: Initialisé");
    }

    initListeners() {
        // Sidebar
        if(this.toggleToolsBtn) {
            this.toggleToolsBtn.addEventListener('click', () => {
                this.rightPanel.classList.toggle('is-open');
                this.toggleToolsBtn.classList.toggle('active');
            });
        }
        if(this.closeToolsBtn) {
            this.closeToolsBtn.addEventListener('click', () => {
                this.rightPanel.classList.remove('is-open');
                if(this.toggleToolsBtn) this.toggleToolsBtn.classList.remove('active');
            });
        }
        
        // Bouton Paramètres
        const settingsBtn = document.getElementById('btn-settings');
        if(settingsBtn) settingsBtn.addEventListener('click', () => this.configManager.openModal());

        // Indicateur Mode
        this.studio.events.on('mode:change', (isEdit) => {
            if(!this.modeIndicator) return;
            this.modeIndicator.textContent = isEdit ? "MODE: EDIT" : "MODE: PERFORM";
            this.modeIndicator.className = isEdit 
                ? "px-3 py-1 rounded text-xs font-bold bg-red-900 text-red-400 border border-red-700 transition-colors"
                : "px-3 py-1 rounded text-xs font-bold bg-green-900 text-green-400 border border-green-700 transition-colors";
        });

        // Bouton SOUP Visualizer (Si présent)
        const soupBtn = document.querySelector('#right-panel button:last-child');
        if(soupBtn) {
            soupBtn.textContent = "SOUP VISUALIZER (PHI)";
            soupBtn.onclick = () => this.studio.events.emit('soup:run');
        }
    }

    // --- GESTION MEDIA POOL ---
    setupLibraryViewSwitcher() {
        const btnList = document.getElementById('view-list-btn');
        const btnGrid = document.getElementById('view-grid-btn');
        
        const updateButtons = (mode) => {
            if(mode === 'list') {
                if(btnList) { btnList.classList.add('active-view', 'text-white'); btnList.classList.remove('text-gray-500'); }
                if(btnGrid) { btnGrid.classList.remove('active-view', 'text-white'); btnGrid.classList.add('text-gray-500'); }
            } else {
                if(btnGrid) { btnGrid.classList.add('active-view', 'text-white'); btnGrid.classList.remove('text-gray-500'); }
                if(btnList) { btnList.classList.remove('active-view', 'text-white'); btnList.classList.add('text-gray-500'); }
            }
        };

        const setView = (mode) => {
            if (this.studio.stateManager) this.studio.stateManager.set('libraryViewMode', mode);
            updateButtons(mode);
            if(window.assetsData) this.renderLibraryUI(window.assetsData);
        };

        if(btnList) btnList.addEventListener('click', () => setView('list'));
        if(btnGrid) btnGrid.addEventListener('click', () => setView('grid'));

        const initialMode = this.studio.stateManager ? this.studio.stateManager.get('libraryViewMode') : 'list';
        updateButtons(initialMode || 'list');
    }

    async initAssetLibrary() {
        if(!this.libraryContainer) return;
        this.libraryContainer.innerHTML = '<div class="text-gray-500 text-xs p-2">Connexion...</div>';
        try {
            const res = await fetch('/api/assets');
            const data = await res.json();
            if(data.success) {
                window.assetsData = data.assets;
                this.renderLibraryUI(data.assets);
                this.studio.events.emit('assets:loaded');
            }
        } catch(e) { console.error(e); }
    }

    renderLibraryUI(assetsData) {
        const mode = this.studio.stateManager ? this.studio.stateManager.get('libraryViewMode') : 'list';
        this.libraryContainer.innerHTML = '';
        
        const categories = ['images', 'video', 'text', 'audio', 'scripts'];
        
        categories.forEach(cat => {
            if (assetsData[cat] && assetsData[cat].length > 0) {
                const title = document.createElement('h3');
                title.className = "text-xs font-bold text-gray-500 uppercase mt-4 mb-2 pl-2 border-l-2 border-gray-700 sticky top-0 bg-[#1a1a1a] z-10 py-1";
                title.textContent = cat;
                this.libraryContainer.appendChild(title);

                const catContainer = document.createElement('div');
                catContainer.className = mode === 'grid' ? 'assets-grid-view' : 'assets-list-view';

                assetsData[cat].forEach(asset => {
                    const item = document.createElement('div');
                    item.draggable = true;
                    item.dataset.assetId = asset.id;

                    if (mode === 'grid') {
                        item.className = 'asset-card';
                        item.innerHTML = `
                            <div class="card-preview">${this.getGridPreviewHTML(asset, cat)}</div>
                            <div class="card-info">${asset.name}</div>
                            <button class="inspect-btn" title="Inspecter">👁️</button>
                        `;
                    } else {
                        let typeClass = 'border-gray-600';
                        if (cat === 'video' || cat === 'images') typeClass = 'border-red-500 hover:bg-red-900/20';
                        if (cat === 'audio') typeClass = 'border-blue-500 hover:bg-blue-900/20';
                        
                        item.className = `asset-item cursor-grab p-2 mb-1 text-xs bg-[#252525] border-l-2 ${typeClass} rounded text-gray-300 hover:text-white transition-colors truncate`;
                        item.innerHTML = `<span class="truncate flex-1">${asset.name}</span><button class="inspect-btn">👁️</button>`;
                    }

                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', asset.id);
                        e.dataTransfer.effectAllowed = 'copy';
                    });

                    const btn = item.querySelector('.inspect-btn');
                    if(btn) btn.onclick = (e) => { 
                        e.stopPropagation(); 
                        this.openInspectorLocal(asset);
                    };

                    catContainer.appendChild(item);
                });
                this.libraryContainer.appendChild(catContainer);
            }
        });
    }

    getGridPreviewHTML(asset, cat) {
        const url = asset.url || asset.path;
        if (cat === 'images') return `<img src="${url}" loading="lazy">`;
        if (cat === 'video') return `<video src="${url}" muted preload="metadata" onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>`;
        if (cat === 'text') return `<span class="text-2xl">📄</span>`;
        return `<span class="text-2xl">?</span>`;
    }

    openInspectorLocal(asset) {
        console.log("Inspect:", asset.name);
        const url = asset.url || asset.path;
        let content = `<div class="p-4 text-center">${url}</div>`;
        
        if (asset.category === 'TEXT' || asset.type.includes('text') || url.endsWith('.md')) {
            content = `<div class="p-4 bg-black text-green-400 font-mono text-xs h-[50vh] overflow-auto" id="insp-text">Chargement...</div>`;
            fetch(url).then(r=>r.text()).then(t => {
                const el = document.getElementById('insp-text');
                if(el) el.innerText = t;
            });
        } else if (asset.category === 'VISUEL') {
            content = `<div class="flex justify-center bg-black h-[50vh]"><img src="${url}" class="object-contain h-full"></div>`;
        }

        // Appel sécurisé
        if (this.modalSystem) {
            this.modalSystem.show(`Inspecteur : ${asset.name}`, content);
        } else {
            console.error("ModalSystem non initialisé !");
        }
    }
}
