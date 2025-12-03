// public/js/modalData.js

class ModalData {
    constructor() {
        this.overlay = null;
        this.window = null;
        this.titleEl = null;
        this.bodyEl = null;
        this.currentAsset = null;
        
        this._buildDOM();
    }

    _buildDOM() {
        // Création dynamique du HTML si pas présent
        if (document.querySelector('.md-overlay')) {
            this.overlay = document.querySelector('.md-overlay');
            this.window = this.overlay.querySelector('.md-window');
            this.titleEl = this.overlay.querySelector('.md-title span');
            this.bodyEl = this.overlay.querySelector('.md-body');
            return;
        }

        const html = `
            <div class="md-window">
                <div class="md-header">
                    <div class="md-title"><span id="md-icon"></span> <span id="md-text">Metadata Inspector</span></div>
                    <button class="md-close" onclick="modalData.close()">×</button>
                </div>
                <div class="md-body" id="md-content">
                    </div>
                <div class="md-actions">
                    <button class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs" onclick="modalData.close()">Fermer</button>
                    <button id="md-analyze-btn" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">✨ Analyser IA</button>
                </div>
            </div>
        `;

        this.overlay = document.createElement('div');
        this.overlay.className = 'md-overlay';
        this.overlay.innerHTML = html;
        document.body.appendChild(this.overlay);

        this.titleEl = this.overlay.querySelector('#md-text');
        this.iconEl = this.overlay.querySelector('#md-icon');
        this.bodyEl = this.overlay.querySelector('#md-content');
        this.analyzeBtn = this.overlay.querySelector('#md-analyze-btn');

        // Close on click outside
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(asset) {
        this.currentAsset = asset;
        
        // 1. Titre
        this.titleEl.textContent = asset.name;
        this.iconEl.textContent = this._getIcon(asset.category);

        // 2. Contenu Détaillé (Injection)
        this.bodyEl.innerHTML = `
            <div class="md-grid">
                <div class="md-label">ID Système</div>
                <div class="md-value text-blue-400">${asset.id}</div>

                <div class="md-label">Type MIME</div>
                <div class="md-value">${asset.type}</div>

                <div class="md-label">Catégorie</div>
                <div class="md-value">${asset.category}</div>

                <div class="md-label">Chemin Serveur</div>
                <div class="md-value">${asset.url}</div>

                <div class="md-label">Dernière Modif</div>
                <div class="md-value text-gray-500">2025-11-26 (Simulé)</div>
            </div>
            
            <div class="mt-4 p-3 bg-black rounded border border-gray-700">
                <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Aperçu Contenu</h4>
                ${this._getPreviewContent(asset)}
            </div>
        `;

        // 3. Action IA
        this.analyzeBtn.onclick = () => {
            if (window.dataManager) window.dataManager.analyzeWithIA(asset.id);
        };

        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
        // Stop video playback on close
        const video = this.bodyEl.querySelector('video');
        if (video) video.pause();
    }

    _getIcon(cat) {
        if (cat === 'VIDEO') return '🎬';
        if (cat === 'AUDIO') return '🎵';
        if (cat === 'VISUEL') return '🖼️';
        return '📄';
    }

    _getPreviewContent(asset) {
        if (asset.type.includes('image')) return `<img src="${asset.url}" class="max-h-64 mx-auto">`;
        if (asset.type.includes('video')) return `<video src="${asset.url}" controls class="max-h-64 mx-auto"></video>`;
        if (asset.type.includes('text')) return `<div class="font-mono text-xs text-green-400">Aperçu texte non chargé (optimisation)</div>`;
        return `<div class="text-center text-gray-500 italic">Pas d'aperçu disponible</div>`;
    }
}

// Initialisation Global
window.modalData = new ModalData();