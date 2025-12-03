const fs = require('fs');
const path = require('path');

class AssetManager {
    constructor(publicPath) {
        // publicPath doit pointer vers le dossier racine web (ex: './public')
        this.basePath = publicPath; 
    }

    /**
     * Détermine le type MIME simplifié pour le frontend
     */
    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        
        const types = {
            // Images
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
            // Vidéo
            '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
            // Audio
            '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
            // Texte / Code
            '.txt': 'text/plain', '.md': 'text/markdown', '.json': 'application/json', '.js': 'text/javascript'
        };

        return types[ext] || 'application/octet-stream';
    }

    /**
     * Scanne un dossier récursivement et retourne une liste d'assets à plat
     * @param {string} relativePath - Chemin relatif depuis 'public' (ex: 'data/images')
     * @param {string} category - Catégorie pour le Studio (VISUEL, AUDIO, TEXT...)
     */
    scanFolderRecursive(relativePath, category) {
        const fullPath = path.join(this.basePath, relativePath);
        let assets = [];

        try {
            if (!fs.existsSync(fullPath)) {
                console.warn(`[AssetManager] Dossier introuvable : ${fullPath}`);
                return [];
            }

            const items = fs.readdirSync(fullPath, { withFileTypes: true });

            for (const item of items) {
                const itemRelPath = path.join(relativePath, item.name); // ex: data/scripts/Fx/zoom.md

                if (item.isDirectory()) {
                    // 🔄 RÉCURSION : On plonge dans le sous-dossier
                    assets = assets.concat(this.scanFolderRecursive(itemRelPath, category));
                } else {
                    // C'est un fichier
                    if (item.name.startsWith('.')) continue; // Ignorer .DS_Store, .git

                    // Construction de l'URL Web (Remplacement des \ par / pour Windows)
                    const webUrl = '/' + itemRelPath.replace(/\\/g, '/');
                    
                    // ID Unique (nettoyage des caractères spéciaux)
                    const safeId = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

                    assets.push({
                        id: `${category.toLowerCase()}_${safeId}_${Date.now().toString(36)}`, // ID unique temporel
                        name: item.name,
                        type: this.getMimeType(item.name),
                        category: category,
                        url: webUrl,   // URL pour fetch()
                        path: webUrl,  // Alias pour compatibilité
                        duration: 5    // Durée par défaut (sera surchargée par métadonnées si besoin)
                    });
                }
            }
        } catch (err) {
            console.error(`[AssetManager] Erreur scan ${relativePath}:`, err.message);
        }

        return assets;
    }

    /**
     * Point d'entrée principal appelé par server.js
     */
    getAllAssets() {
        console.log("[AssetManager] Scan complet des répertoires...");
        
        return {
            // Note: On scanne les dossiers physiques dans 'public/data/...'
            images: this.scanFolderRecursive('data/images', 'VISUEL'),
            video:  this.scanFolderRecursive('data/video', 'VIDEO'),
            audio:  this.scanFolderRecursive('data/audio', 'AUDIO'),
            
            // C'est ici qu'on charge tes fichiers textes (.txt, .md)
            text:   this.scanFolderRecursive('data/text', 'TEXT'),
            
            // Récursif pour attraper tes sous-dossiers Fx/plan_camera/etc.
            scripts: this.scanFolderRecursive('data/scripts', 'SCRIPT')
        };
    }
}

module.exports = AssetManager;