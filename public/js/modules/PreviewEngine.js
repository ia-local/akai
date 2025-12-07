/**
 * MODULE: PreviewEngine.js
 * Rôle : Synchronise les lecteurs (Vidéo/Img) et le Canvas ASCII avec le Timecode global.
 * Correction Electron: Utilisation d'URL absolues pour le fetch API et le chargement des assets statiques.
 */
import { AsciiProcessor } from '../asciiModule.js'; // Assumant que ce fichier existe déjà

const SERVER_URL = 'http://localhost:3145'; // URL absolue du serveur Node.js

export class PreviewEngine {
    constructor(domElements, asciiEngine, webglEngine) {
        this.els = domElements; // { video, image, placeholder, asciiCanvas, container }
        this.asciiEngine = asciiEngine; // Instance Tensor ou Canvas
        this.glEngine = webglEngine;    // Instance WebGL
        this.currentAssetId = null;
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
    
    /**
     * Méthode principale appelée à chaque Tick du transport
     */
    sync(globalTime, isTransportPlaying, activeClips) {
        // 1. VISUEL (VIDEO / IMAGE)
        const visualClip = activeClips.find(c => ['track-video', 'track-image'].includes(c.trackId));
        
        if (!visualClip) {
            this.showPlaceholder();
        } else {
            const localTimestamp = globalTime - visualClip.startTime;
            
            // Chargement dynamique si l'asset change
            if (visualClip.id !== this.currentAssetId) {
                this._loadMedia(visualClip);
                this.currentAssetId = visualClip.id;
            }

            // Synchro type spécifique
            if (this._isVideo(visualClip)) {
                this._syncVideo(localTimestamp, isTransportPlaying);
            } else {
                this._showImage();
            }
        }

        // 2. TEXTE (ASCII)
        const textClip = activeClips.find(c => c.trackId === 'track-text');
        this._syncAscii(textClip);

        // 3. WEBGL (Uniforms update si activé)
        // Note: Le rendu (render) est souvent géré par le Transport ou une boucle d'animation dédiée
        // mais on peut passer les updates ici.
    }

    // --- LOGIQUE INTERNE MEDIA ---

    _loadMedia(clip) {
        // CORRECTION: Utiliser l'URL absolue pour le src des balises <video> et <img>
        const url = this._getAbsoluteAssetUrl(clip.assetData?.url || clip.assetData?.path);
        if (!url) return;
        
        if (this._isVideo(clip)) {
            this.els.video.src = url; 
            this.els.video.load(); 
            this._activatePlayer(this.els.video);
        } else {
            this.els.image.src = url; 
            this._activatePlayer(this.els.image);
        }
    }

    _syncVideo(localTime, isPlaying) {
        const vid = this.els.video;
        if (isPlaying) {
            if (vid.paused) vid.play().catch(()=>{});
            // Correction de dérive temporelle (> 0.2s)
            if (Math.abs(vid.currentTime - localTime) > 0.2) vid.currentTime = localTime;
        } else {
            vid.pause();
            vid.currentTime = localTime;
        }
    }

    _showImage() {
        if (!this.els.image.classList.contains('active')) {
            this._activatePlayer(this.els.image);
        }
    }

    showPlaceholder() {
        this._activatePlayer(this.els.placeholder);
        this.els.video.pause();
        this.currentAssetId = null;
    }

// --- CORRECTION CRITIQUE DE RÉSILIENCE DU DOM ---
    _activatePlayer(el) {
        // Liste de tous les éléments que PreviewEngine gère
        const players = [this.els.image, this.els.video, this.els.placeholder];

        // Seul le code qui vérifie l'existence de 'e' avant d'accéder à 'e.classList' est sûr
        players.forEach(e => {
            if (e) {
                e.classList.remove('active');
            }
        });
        
        // Active l'élément cible s'il existe
        if(el) {
            el.classList.add('active');
        }
    }

    _isVideo(clip) {
        return clip.type?.includes('video') || clip.type === 'VIDEO';
    }

    // --- LOGIQUE ASCII ---

    async _syncAscii(clip) {
        if (!clip) {
            if (this.els.asciiCanvas) this.els.asciiCanvas.classList.remove('active');
            if (this.asciiEngine) this.asciiEngine.clear();
            return;
        }

        // Activation visuelle
        if (this.els.asciiCanvas) this.els.asciiCanvas.classList.add('active');

        // Lazy Loading du contenu texte
        if (!clip.assetData.content && !clip.isLoading) {
            clip.isLoading = true;
            try {
                // CORRECTION: Utiliser l'URL absolue pour le fetch du contenu texte
                const url = this._getAbsoluteAssetUrl(clip.assetData.url || clip.assetData.path);
                const res = await fetch(url);
                if (res.ok) {
                    const rawText = await res.text();
                    clip.assetData.content = rawText;
                    clip.assetData.processedContent = AsciiProcessor.process(rawText);
                }
            } catch(e) { 
                clip.assetData.content = "Error"; 
            } finally { 
                clip.isLoading = false; 
            }
        }

        // Rendu
        if (this.asciiEngine) {
            if (clip.assetData.processedContent) {
                const data = clip.assetData.processedContent;
                // Ajustement ratio si le moteur le supporte
                if (data.style.ratio && this.asciiEngine.setResolution) {
                    this.asciiEngine.setResolution(this.els.container.clientWidth, this.els.container.clientHeight, data.style.ratio);
                }
                this.asciiEngine.render(data);
            } else if (clip.assetData.content) {
                this.asciiEngine.render({ text: clip.assetData.content, style: {} });
            }
        }
    }
}