/**
 * MODULE: DATA MANAGER (Client-Side)
 * Correctif: Adressage Electron/Node.js (passage en URL absolues pour fetch et assets)
 */

const SERVER_URL = 'http://localhost:3145'; // URL absolue du serveur Node.js

class DataManager {
    constructor() {
        // Éléments du DOM
        this.gridContainer = document.getElementById('media-pool-grid');
        this.metaInfoContainer = document.getElementById('meta-info'); // Aside Texte
        this.metaPreviewContainer = document.getElementById('meta-preview'); // Aside Image
        this.pathDisplay = document.querySelector('#center-area .font-mono');

        this.allAssets = [];
        this.init();
    }

    async init() {
        console.log("🚀 DataManager: Initialisation...");
        await this.loadAssets();
        this.renderFolderTree();
        this.renderGrid();
        // this.setupGlobalListeners(); <--- SUPPRIMÉ CAR CAUSAIT L'ERREUR
    }

    async loadAssets() {
        if (this.gridContainer) {
            this.gridContainer.innerHTML = '<div class="text-gray-500 text-sm col-span-4 text-center mt-10">Chargement...</div>';
        }
        try {
            // CORRECTION CRITIQUE: Appel de l'API avec URL absolue
            const response = await fetch(`${SERVER_URL}/api/assets`);
            const data = await response.json();
            if (data.success && data.assets) {
                this.allAssets = [
                    ...data.assets.video, ...data.assets.images, 
                    ...data.assets.audio, ...data.assets.text, 
                    ...(data.assets.scripts || [])
                ];
                console.log(`✅ DataManager: ${this.allAssets.length} assets chargés.`);
            }
        } catch (e) {
            console.error("❌ DataManager Error:", e);
        }
    }

    /**
     * Construit une URL d'asset absolue en gérant les cas où l'API retourne '/public' (redondant).
     */
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

    renderGrid(filterFolder = null) {
        if (!this.gridContainer) return;
        this.gridContainer.innerHTML = '';

        let assetsToDisplay = this.allAssets;
        if (filterFolder) {
            assetsToDisplay = this.allAssets.filter(asset => asset.url.includes(filterFolder));
            this.updatePathDisplay(filterFolder);
        } else {
             this.updatePathDisplay("All Media");
        }

        if (assetsToDisplay.length === 0) {
            this.gridContainer.innerHTML = '<div class="text-gray-500 text-sm col-span-4 text-center">Dossier vide.</div>';
            return;
        }

        assetsToDisplay.forEach(asset => {
            const card = this.createAssetCard(asset);
            this.gridContainer.appendChild(card);
        });
    }

    createAssetCard(asset) {
        // Utilisation de la fonction utilitaire pour garantir l'URL absolue
        const assetUrl = this._getAbsoluteAssetUrl(asset.url);

        const card = document.createElement('div');
        card.className = "asset-card h-36 flex flex-col bg-[#252525] rounded border border-[#333] hover:border-blue-500 cursor-pointer transition-all relative group";
        
        // --- Création de la miniature (Thumbnail) : Utilisation de l'URL absolue ---
        let previewHTML = '';
        if (asset.category === 'VISUEL' || asset.type.startsWith('image/')) {
            previewHTML = `<img src="${assetUrl}" loading="lazy" class="w-full h-24 object-cover bg-black rounded-t">`;
        } else if (asset.category === 'VIDEO') {
            previewHTML = `<video src="${assetUrl}" preload="metadata" class="w-full h-24 object-cover bg-black rounded-t"></video>`;
        } else {
            previewHTML = `<div class="w-full h-24 bg-[#151515] flex items-center justify-center rounded-t"><span class="text-2xl opacity-50">📁</span></div>`;
        }

        card.innerHTML = `
            ${previewHTML}
            <div class="p-2 flex-1 flex flex-col justify-center bg-[#1e1e1e] rounded-b">
                <div class="text-xs text-gray-200 font-medium truncate">${asset.name}</div>
                <div class="text-[10px] text-gray-500 truncate">${asset.category}</div>
            </div>
        `;

        card.onclick = () => {
            document.querySelectorAll('.asset-card').forEach(c => c.classList.remove('ring-2', 'ring-blue-500'));
            card.classList.add('ring-2', 'ring-blue-500');
            this.updateRightAside(asset); 
        };

        // Double clic pour ouvrir directement la modale
        card.ondblclick = () => {
            if(window.modalData) window.modalData.open(asset);
        };

        return card;
    }

    /**
     * Met à jour uniquement la barre latérale droite (Miniature + Bouton Détails)
     */
    updateRightAside(asset) {
        if (!this.metaInfoContainer || !this.metaPreviewContainer) return;
        
        // Utilisation de la fonction utilitaire pour garantir l'URL absolue
        const assetUrl = this._getAbsoluteAssetUrl(asset.url);

        // 1. Mise à jour de la Miniature (Haut Droite)
        if (asset.type.includes('image')) {
            this.metaPreviewContainer.innerHTML = `<img src="${assetUrl}" class="object-contain w-full h-full">`;
        } else if (asset.type.includes('video')) {
            this.metaPreviewContainer.innerHTML = `<video src="${assetUrl}" autoplay loop muted class="object-contain w-full h-full"></video>`;
        } else {
            this.metaPreviewContainer.innerHTML = `<div class="h-full flex items-center justify-center text-4xl text-gray-600">?</div>`;
        }

        // 2. Mise à jour des infos rapides + BOUTON D'OUVERTURE MODALE
        this.metaInfoContainer.innerHTML = `
            <div class="meta-label">Nom</div>
            <div class="meta-value text-white font-bold truncate mb-2">${asset.name}</div>

            <div class="meta-label">Type</div>
            <div class="meta-value text-gray-400 mb-4">${asset.category}</div>
            
            <button onclick="window.modalData.open(dataManager.getAssetById('${asset.id}'))" 
                    class="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded mb-2 border border-gray-600">
                📄 VOIR MÉTADONNÉES
            </button>
            
            <button onclick="dataManager.analyzeWithIA('${asset.id}')" 
                    class="w-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-xs py-2 rounded border border-blue-800 flex justify-center gap-2">
                <span>✨</span> VISION IA RAPIDE
            </button>
        `;
    }

    getAssetById(id) {
        return this.allAssets.find(a => a.id === id);
    }

    analyzeWithIA(assetId) {
        alert(`Analyse rapide lancée pour ${assetId}`);
    }

    updatePathDisplay(pathStr) {
        if(this.pathDisplay) this.pathDisplay.textContent = pathStr;
    }

    renderFolderTree() {
        // Logique simplifiée de dossier (identique avant)
        const folderItems = document.querySelectorAll('.folder-item');
        folderItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.folder-item').forEach(i => i.classList.remove('active', 'text-white'));
                item.classList.add('active', 'text-white');
                
                const txt = item.innerText.toLowerCase();
                if (txt.includes('video')) this.renderGrid('/data/video');
                else if (txt.includes('audio')) this.renderGrid('/data/audio');
                else if (txt.includes('images')) this.renderGrid('/data/images');
                else this.renderGrid(null);
            };
        });
    }
}

// Initialisation
window.addEventListener('DOMContentLoaded', () => {
    window.dataManager = new DataManager();
});