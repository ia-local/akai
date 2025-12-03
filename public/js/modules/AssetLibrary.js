/**
 * MODULE: ASSET LIBRARY
 * Rôle : Gère le chargement, l'affichage (Liste/Grille) et l'interaction (Drag/Inspect) des médias.
 * Correction Electron: Utilisation d'URL absolues pour le fetch API et le chargement des assets statiques.
 */

const SERVER_URL = 'http://localhost:3145';

export class AssetLibrary {
    constructor(containerId, modalSystem) {
        this.container = document.getElementById(containerId);
        this.modalSystem = modalSystem;
        this.assetsData = {}; // Stockage local des données
        this.viewMode = 'list'; // 'list' ou 'grid'
    }

    // --- INIT & API ---

    async init() {
        if (!this.container) return;
        this.container.innerHTML = '<div class="text-gray-500 text-xs p-2">Connexion...</div>';
        
        try {
            // L'appel API est déjà corrigé, mais assurez-vous de n'avoir qu'un seul fetch
            const response = await fetch(`${SERVER_URL}/api/assets`); 
            
            if (!response.ok) throw new Error("Erreur Réseau");
            
            const data = await response.json();
            if (data.success && data.assets) {
                this.assetsData = data.assets;
                // On expose les data globalement pour la compatibilité avec d'autres scripts si besoin
                window.assetsData = this.assetsData; 
                this.render();
                return this.assetsData;
            }
        } catch (e) {
            console.error("Erreur Assets:", e);
            this.container.innerHTML = '<div class="text-red-500 text-xs p-2">Erreur chargement /data/</div>';
            this._simulateFallback();
        }
    }

    // --- UTILITAIRE ADRESSAGE (CRITIQUE pour Electron) ---

    _getAbsoluteAssetUrl(assetUrl) {
        if (!assetUrl) return '';
        if (assetUrl.startsWith('http')) {
            return assetUrl;
        }
        // Nettoyage: Supprime '/public' si l'API l'inclut, car Express sert 'public' comme racine
        let path = assetUrl.replace(/^\/public/, '');
        
        // S'assure qu'il y a un '/' au début
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return `${SERVER_URL}${path}`;
    }

    // --- RENDU UI ---

    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const categories = ['images', 'video', 'text', 'audio', 'scripts'];

        categories.forEach(cat => {
            if (this.assetsData[cat] && this.assetsData[cat].length > 0) {
                // Titre de catégorie (Sticky)
                const title = document.createElement('h3');
                title.className = "text-xs font-bold text-gray-500 uppercase mt-4 mb-2 pl-2 border-l-2 border-gray-700 sticky top-0 bg-[#1a1a1a] z-10 py-1";
                title.textContent = cat;
                this.container.appendChild(title);

                // Conteneur items
                const catContainer = document.createElement('div');
                catContainer.className = this.viewMode === 'grid' ? 'assets-grid-view' : 'assets-list-view';

                this.assetsData[cat].forEach(asset => {
                    const item = this._createAssetItem(asset, cat);
                    catContainer.appendChild(item);
                });
                this.container.appendChild(catContainer);
            }
        });
    }

    // --- FACTORY D'ÉLÉMENTS ---

    _createAssetItem(asset, cat) {
        const item = document.createElement('div');
        item.draggable = true;
        item.dataset.assetId = asset.id;

        // Gestion Drag & Drop
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', asset.id);
            e.dataTransfer.effectAllowed = 'copy';
        });

        const inspectBtnHTML = `<button class="inspect-btn" title="Inspecter">👁️</button>`;

        if (this.viewMode === 'grid') {
            item.className = 'asset-card';
            item.innerHTML = `
                <div class="card-preview">${this._getGridPreviewHTML(asset, cat)}</div>
                <div class="card-info">${asset.name}</div>
                ${inspectBtnHTML}
            `;
        } else {
            // Logique de couleur des bordures conservée
            let typeClass = 'border-gray-600';
            if (cat === 'video' || cat === 'images') typeClass = 'border-red-500 hover:bg-red-900/20';
            if (cat === 'audio') typeClass = 'border-blue-500 hover:bg-blue-900/20';
            if (cat === 'text') typeClass = 'border-green-500 hover:bg-green-900/20';

            item.className = `asset-item cursor-grab p-2 mb-1 text-xs bg-[#252525] border-l-2 ${typeClass} rounded text-gray-300 hover:text-white transition-colors truncate`;
            item.innerHTML = `
                <span class="truncate flex-1">${asset.name}</span>
                ${inspectBtnHTML}
            `;
        }

        // Clic sur l'œil
        const btn = item.querySelector('.inspect-btn');
        if(btn) btn.addEventListener('click', (e) => { e.stopPropagation(); this.openInspector(asset); });

        return item;
    }

    _getGridPreviewHTML(asset, cat) {
        // CORRECTION: Utilisation de l'URL absolue pour le chargement des aperçus
        const url = this._getAbsoluteAssetUrl(asset.url || asset.path);

        if (cat === 'images') return `<img src="${url}" loading="lazy">`;
        // CORRECTION: Utilisation de l'URL absolue pour le chargement vidéo
        if (cat === 'video') return `<video src="${url}" muted preload="metadata" onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>`;
        if (cat === 'text') return `<span class="text-2xl">📄</span>`;
        return `<span class="text-2xl">?</span>`;
    }

    // --- INSPECTEUR (MODAL) ---

    openInspector(asset) {
        if (!this.modalSystem) return;
        
        // CORRECTION: Utilisation de l'URL absolue ici aussi
        const url = this._getAbsoluteAssetUrl(asset.url || asset.path);
        const type = asset.type || "";
        
        let content = `<div class="p-8 text-center text-gray-500 animate-pulse">Chargement...</div>`;
        const footer = `<div class="text-xs text-gray-500 p-2">ID: ${asset.id}</div>`;

        this.modalSystem.show(`Inspecteur : ${asset.name}`, content, footer, () => {
            const bodyEl = document.getElementById('generic-modal-body');
            if(!bodyEl) return;

            if (type.includes('text') || url.endsWith('.md')) {
                // CORRECTION: Utilisation de l'URL absolue pour le fetch du contenu texte
                fetch(url).then(r => r.text()).then(t => {
                    bodyEl.innerHTML = `<div class="bg-black p-2 h-full border border-gray-700 overflow-hidden"><textarea readonly class="w-full h-full bg-transparent text-green-400 font-mono text-xs resize-none outline-none">${t}</textarea></div>`;
                });
            } else if (type.includes('image')) {
                bodyEl.innerHTML = `<div class="flex justify-center bg-black p-4 h-full"><img src="${url}" class="max-h-full object-contain"></div>`;
            } else if (type.includes('video')) {
                bodyEl.innerHTML = `<div class="flex justify-center bg-black p-4 h-full"><video src="${url}" controls autoplay class="max-h-full"></video></div>`;
            }
        });
    }

    _simulateFallback() {
        // Fallback pour le dev hors ligne
        this.assetsData = { texts: [{ id: 'txt_demo', name: 'Demo ASCII', type: 'text/plain', url: `${SERVER_URL}/data/text/test.txt` }] };
        this.render();
    }
}