/**
 * MODULE: DATA MANAGER (Client-Side)
 * Version: 2.4 (Correctif ES6 Export)
 * Rôle : Gère le chargement, le tri et la distribution des assets pour l'application.
 */

const SERVER_URL = 'http://localhost:3145'; // URL absolue du serveur Node.js

// NOTE : Le mot clé "export" est OBLIGATOIRE pour l'import dans media_desktop.js
export class DataManager {
    
    constructor() {
        // Stockage global à plat (pour recherche par ID)
        this.allAssets = [];
        
        // Stockage catégorisé (pour les stats du module SERVER dans le bureau)
        this.assets = {
            video: [],
            audio: [],
            images: [],
            scripts: [],
            text: []
        };

        // Initialisation automatique au constructeur si besoin, 
        // ou manuelle via init() pour gérer l'async.
        console.log("🛠️ DataManager: Instance created.");
    }

    /**
     * Initialise le gestionnaire et charge les données
     */
    async init() {
        console.log("🚀 DataManager: Initialisation...");
        await this.loadAssets();
        // Optionnel : Notifier le système que les données sont prêtes
        return true; 
    }

    /**
     * Récupère les assets depuis l'API Node.js
     */
    async loadAssets() {
        try {
            const response = await fetch(`${SERVER_URL}/api/assets`);
            const data = await response.json();

            if (data.success && data.assets) {
                // 1. Stockage structuré (pour le monitoring)
                this.assets.video = data.assets.video || [];
                this.assets.images = data.assets.images || [];
                this.assets.audio = data.assets.audio || [];
                this.assets.scripts = data.assets.scripts || [];
                this.assets.text = data.assets.text || [];

                // 2. Stockage à plat (pour itération facile)
                this.allAssets = [
                    ...this.assets.video, 
                    ...this.assets.images, 
                    ...this.assets.audio, 
                    ...this.assets.text, 
                    ...this.assets.scripts
                ];
                
                console.log(`✅ DataManager: ${this.allAssets.length} assets chargés.`);
            }
        } catch (e) {
            console.error("❌ DataManager Error (Fetch):", e);
            // Fallback : Données simulées si le serveur est éteint pour éviter le crash UI
            this.loadMockData(); 
        }
    }

    /**
     * Méthode requise par media_desktop.js pour filtrer les vues dossiers
     * @param {string} category - 'video', 'audio', 'image', etc.
     */
    getAssetsByCategory(category) {
        if (!category) return this.allAssets;
        
        const cat = category.toLowerCase();
        
        // Mapping simple entre les noms de dossier et les types de données
        if (cat.includes('video')) return this.assets.video;
        if (cat.includes('audio')) return this.assets.audio;
        if (cat.includes('image')) return this.assets.images;
        if (cat.includes('script')) return this.assets.scripts;
        
        return this.allAssets;
    }

    /**
     * Récupère un asset spécifique par son ID
     * @param {string} id 
     */
    getAssetById(id) {
        return this.allAssets.find(a => a.id === id);
    }

    /**
     * Construit une URL absolue (Utile pour Electron/Localhost)
     */
    _getAbsoluteAssetUrl(assetUrl) {
        if (!assetUrl) return '';
        if (assetUrl.startsWith('http')) return assetUrl;
        
        let path = assetUrl.replace(/^\/public/, '');
        if (!path.startsWith('/')) path = '/' + path;
        
        return `${SERVER_URL}${path}`;
    }

    /**
     * Données de secours si le serveur Node n'est pas lancé
     */
    loadMockData() {
        console.warn("⚠️ Utilisation des données MOCK (Serveur inaccessible)");
        this.assets.video = [{id: 'v1', name: 'demo.mp4', category: 'VIDEO', url: ''}];
        this.allAssets = this.assets.video;
    }
}

// Optionnel : Attachement window pour débug console (mais pas pour l'import module)
window.addEventListener('DOMContentLoaded', () => {
    window.dataManagerInstance = new DataManager();
});