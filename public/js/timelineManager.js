/**
 * TIMELINE MANAGER (V1.5)
 * Gestionnaire CRUD des clips (Create, Read, Update, Delete).
 * Gère le rendu DOM de la timeline et l'ouverture de l'éditeur modal.
 * Correction Electron: Utilisation d'URL absolues pour le chargement des assets statiques dans les modales.
 */

const SERVER_URL = 'http://localhost:3145'; // URL absolue du serveur Node.js

export class TimelineManager {
    constructor(tracksContainer, pixelsPerSecond = 50) {
        this.tracksContainer = tracksContainer;
        this.pixelsPerSecond = pixelsPerSecond;
        this.clips = []; // Source de Vérité
        this.nextId = 1;
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

    // =================================================================
    // 1. CRUD OPERATIONS
    // =================================================================

    /**
     * Ajoute un nouveau clip à la timeline.
     */
    addClip(asset, trackId, startTime) {
        const clipData = {
            id: `clip_${this.nextId++}`,
            assetId: asset.id,
            name: asset.name,
            type: asset.type || asset.category,
            // Durée par défaut : 5s pour images/textes, sinon durée réelle
            duration: parseFloat(asset.duration) || 5.0, 
            startTime: Math.max(0, startTime),
            trackId: trackId,
            // Clone superficiel pour isoler les données du clip
            assetData: { ...asset } 
        };

        this.clips.push(clipData);
        this.renderClipDOM(clipData);
        
        console.log(`[Timeline] Ajout: ${clipData.name} (${clipData.type})`);
        return clipData;
    }

    /**
     * Supprime un clip.
     */
    removeClip(clipId) {
        this.clips = this.clips.filter(c => c.id !== clipId);
        const el = document.getElementById(clipId);
        if (el) el.remove();
        console.log(`[Timeline] Clip supprimé : ${clipId}`);
    }

    /**
     * Déplace un clip (Update Time).
     */
    moveClip(clipId, newStartTime) {
        const clip = this.clips.find(c => c.id === clipId);
        if (clip) {
            clip.startTime = Math.max(0, newStartTime);
            this.updateClipDOM(clip);
        }
    }

    /**
     * Coupe un clip en deux (Segmentation).
     */
    splitClip(clipId, splitTime) {
        const originalClip = this.clips.find(c => c.id === clipId);
        if (!originalClip) return null;

        const clipEnd = originalClip.startTime + originalClip.duration;
        if (splitTime <= originalClip.startTime || splitTime >= clipEnd) {
            console.warn("Coupe impossible : Hors limites du clip");
            return null;
        }

        // Calculs
        const offset = splitTime - originalClip.startTime;
        const remainingDuration = originalClip.duration - offset;

        // 1. Update Clip Gauche
        originalClip.duration = offset;
        this.updateClipDOM(originalClip);

        // 2. Création Clip Droit
        const newClipData = {
            id: `clip_${this.nextId++}`,
            assetId: originalClip.assetId,
            name: originalClip.name,
            type: originalClip.type,
            trackId: originalClip.trackId,
            startTime: splitTime,
            duration: remainingDuration,
            // Clonage profond pour le contenu (ex: Texte)
            assetData: JSON.parse(JSON.stringify(originalClip.assetData))
        };

        this.clips.push(newClipData);
        this.renderClipDOM(newClipData);

        console.log(`✂️ Split: [${originalClip.name}] à ${splitTime.toFixed(2)}s`);
        return newClipData;
    }

    /**
     * Récupère les clips actifs à un instant T.
     */
    getClipsAtTime(time) {
        return this.clips.filter(clip => {
            const endTime = clip.startTime + clip.duration;
            return time >= clip.startTime && time < endTime;
        });
    }

    /**
     * Helper pour trouver le clip sous la tête de lecture sur une piste donnée.
     */
    getClipAtTimeAndTrack(time, trackId) {
        return this.clips.find(c => 
            c.trackId === trackId && 
            time >= c.startTime && 
            time < (c.startTime + c.duration)
        );
    }


    // =================================================================
    // 2. RENDU DOM (VISUEL TIMELINE)
    // =================================================================

    renderClipDOM(clip) {
        const track = document.getElementById(clip.trackId);
        if (!track) return;

        const el = document.createElement('div');
        el.id = clip.id;
        el.className = `timeline-clip ${this.getStyleClass(clip.type)}`;
        el.textContent = clip.name;
        
        // Positionnement CSS absolu
        el.style.width = `${clip.duration * this.pixelsPerSecond}px`;
        el.style.left = `${clip.startTime * this.pixelsPerSecond}px`;
        el.draggable = true;
        el.dataset.clipId = clip.id;

        // Interaction : Double Clic = Édition via Modal
        el.addEventListener('dblclick', (e) => {
            e.stopPropagation(); 
            this.openClipEditor(clip);
        });

        track.appendChild(el);
    }

    updateClipDOM(clip) {
        const el = document.getElementById(clip.id);
        if (el) {
            el.style.width = `${clip.duration * this.pixelsPerSecond}px`;
            el.style.left = `${clip.startTime * this.pixelsPerSecond}px`;
            el.textContent = clip.name; // Mise à jour du nom si changé
        }
    }

    getStyleClass(type) {
        if (!type) return 'asset-script';
        const t = type.toUpperCase();
        if (t.includes('VIDEO') || t.includes('VISUEL')) return 'asset-video';
        if (t.includes('AUDIO')) return 'asset-audio';
        if (t.includes('TEXT') || t.includes('ASCII')) return 'asset-text';
        if (t.includes('IMAGE')) return 'asset-image';
        return 'asset-script';
    }


    // =================================================================
    // 3. ÉDITEUR MODAL (CLIP INSPECTOR)
    // =================================================================

    openClipEditor(clip) {
        if (!window.modalSystem) return console.error("ModalSystem introuvable");

        let editorConfig;

        // Détection du type pour choisir l'interface
        if (clip.type.includes('text') || clip.type.includes('TEXT')) {
            editorConfig = this.getTextEditorUI(clip);
        } else if (clip.type.includes('image') || clip.type.includes('VISUEL')) {
            editorConfig = this.getImageEditorUI(clip);
        } else if (clip.type.includes('video') || clip.type.includes('VIDEO')) {
            editorConfig = this.getVideoEditorUI(clip);
        } else {
            editorConfig = this.getGenericEditorUI(clip);
        }

        // Footer commun
        const footerHtml = `
            <div class="flex w-full justify-between items-center">
                <button class="bg-red-900/50 border border-red-600 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-900 transition-colors" id="editor-delete-btn">
                    SUPPRIMER CLIP
                </button>
                <div class="space-x-2">
                    <button class="text-gray-400 px-3 py-1 text-xs hover:text-white" id="editor-cancel-btn">Annuler</button>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500 transition-colors" id="editor-save-btn">
                        APPLIQUER
                    </button>
                </div>
            </div>
        `;

        // Ouverture Modale avec Callback sécurisé
        window.modalSystem.show(
            `EDITEUR : ${clip.name.toUpperCase()}`,
            editorConfig.html,
            footerHtml,
            () => {
                // Attachement des événements (une fois le DOM injecté)
                
                const deleteBtn = document.getElementById('editor-delete-btn');
                if(deleteBtn) deleteBtn.onclick = () => {
                    this.removeClip(clip.id);
                    window.modalSystem.close();
                };

                const cancelBtn = document.getElementById('editor-cancel-btn');
                if(cancelBtn) cancelBtn.onclick = () => window.modalSystem.close();

                const saveBtn = document.getElementById('editor-save-btn');
                if(saveBtn) saveBtn.onclick = () => {
                    // Logique spécifique de sauvegarde (ex: texte, filtres)
                    if(editorConfig.onSave) editorConfig.onSave(clip);
                    
                    // Mise à jour du nom
                    const nameInput = document.getElementById('prop-clip-name');
                    if (nameInput) clip.name = nameInput.value;
                    
                    // Rafraîchir la timeline
                    this.updateClipDOM(clip);
                    window.modalSystem.close();
                };

                // Initialisation des sliders/inputs spécifiques
                if(editorConfig.onInit) {
                    requestAnimationFrame(() => editorConfig.onInit(clip));
                }
            }
        );
    }


    // --- UI GENERATORS ---

    getTextEditorUI(clip) {
        const currentText = clip.assetData.content || "";
        return {
            html: `
                <div class="modal-split-layout">
                    <aside class="modal-sidebar">
                        <h4>Propriétés</h4>
                        <div class="tool-control">
                            <label class="tool-label">Nom</label>
                            <input id="prop-clip-name" type="text" value="${clip.name}" class="bg-black border border-gray-700 text-white text-xs p-1 rounded w-full">
                        </div>
                        <h4>Style</h4>
                        <div class="tool-control">
                            <label class="tool-label">Couleur</label>
                            <div class="flex gap-2 mt-1">
                                <div class="w-5 h-5 rounded bg-green-500 cursor-pointer border border-transparent hover:border-white" onclick="document.getElementById('editor-textarea').style.color='#4ade80'"></div>
                                <div class="w-5 h-5 rounded bg-amber-500 cursor-pointer border border-transparent hover:border-white" onclick="document.getElementById('editor-textarea').style.color='#f59e0b'"></div>
                                <div class="w-5 h-5 rounded bg-white cursor-pointer border border-transparent hover:border-white" onclick="document.getElementById('editor-textarea').style.color='#ffffff'"></div>
                            </div>
                        </div>
                    </aside>
                    <main class="modal-main p-0">
                        <textarea id="editor-textarea" class="editor-textarea w-full h-full p-4 bg-black text-green-400 font-mono text-sm resize-none focus:outline-none">${currentText}</textarea>
                    </main>
                </div>
            `,
            onSave: (clip) => {
                const ta = document.getElementById('editor-textarea');
                if(ta) {
                    clip.assetData.content = ta.value;
                    // Force update Preview
                    const asciiRenderer = document.getElementById('ascii-renderer'); // Si mode simple
                    if(asciiRenderer) asciiRenderer.textContent = ta.value;
                }
            }
        };
    }

    getImageEditorUI(clip) {
        const filters = clip.assetData.filters || { brightness: 100, contrast: 100, saturate: 100 };
        // CORRECTION: Utilisation de l'URL absolue pour l'image
        const imageUrl = this._getAbsoluteAssetUrl(clip.assetData.url);

        return {
            html: `
                <div class="modal-split-layout">
                    <aside class="modal-sidebar">
                        <h4>Méta-données</h4>
                        <div class="tool-control">
                            <label class="tool-label">Nom</label>
                            <input id="prop-clip-name" type="text" value="${clip.name}" class="bg-black border border-gray-700 text-white text-xs p-1 rounded w-full">
                        </div>
                        <h4>Colorimétrie</h4>
                        <div class="tool-control">
                            <label class="tool-label">Luminosité <span id="val-bright">${filters.brightness}%</span></label>
                            <input id="tool-bright" type="range" min="0" max="200" value="${filters.brightness}" class="tool-slider">
                        </div>
                        <div class="tool-control">
                            <label class="tool-label">Contraste <span id="val-contrast">${filters.contrast}%</span></label>
                            <input id="tool-contrast" type="range" min="0" max="200" value="${filters.contrast}" class="tool-slider">
                        </div>
                        <div class="tool-control">
                            <label class="tool-label">Saturation <span id="val-saturate">${filters.saturate}%</span></label>
                            <input id="tool-saturate" type="range" min="0" max="200" value="${filters.saturate}" class="tool-slider">
                        </div>
                    </aside>
                    <main class="modal-main bg-black flex justify-center items-center">
                        <img id="editor-preview-img" src="${imageUrl}" class="max-h-full max-w-full object-contain">
                    </main>
                </div>
            `,
            onInit: () => {
                const img = document.getElementById('editor-preview-img');
                const update = () => {
                    const b = document.getElementById('tool-bright').value;
                    const c = document.getElementById('tool-contrast').value;
                    const s = document.getElementById('tool-saturate').value;
                    document.getElementById('val-bright').innerText = b + '%';
                    document.getElementById('val-contrast').innerText = c + '%';
                    document.getElementById('val-saturate').innerText = s + '%';
                    img.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
                };
                ['tool-bright', 'tool-contrast', 'tool-saturate'].forEach(id => {
                    document.getElementById(id).addEventListener('input', update);
                });
                update();
            },
            onSave: (clip) => {
                clip.assetData.filters = {
                    brightness: document.getElementById('tool-bright').value,
                    contrast: document.getElementById('tool-contrast').value,
                    saturate: document.getElementById('tool-saturate').value
                };
            }
        };
    }

    getVideoEditorUI(clip) {
        // CORRECTION: Utilisation de l'URL absolue pour la vidéo
        const videoUrl = this._getAbsoluteAssetUrl(clip.assetData.url || clip.assetData.path);
        
        return {
            html: `
                <div class="modal-split-layout">
                    <aside class="modal-sidebar">
                        <h4>Propriétés</h4>
                        <div class="tool-control">
                            <label class="tool-label">Nom</label>
                            <input id="prop-clip-name" type="text" value="${clip.name}" class="bg-black border border-gray-700 text-white text-xs p-1 rounded w-full">
                        </div>
                        <h4>Playback</h4>
                        <div class="tool-control">
                            <label class="tool-label">Volume</label>
                            <input id="tool-volume" type="range" min="0" max="1" step="0.1" value="1" class="tool-slider">
                        </div>
                    </aside>
                    <main class="modal-main bg-black flex justify-center items-center">
                        <video id="editor-preview-vid" src="${videoUrl}" controls class="max-h-full max-w-full"></video>
                    </main>
                </div>
            `,
            onInit: () => {
                const vid = document.getElementById('editor-preview-vid');
                document.getElementById('tool-volume').addEventListener('input', (e) => vid.volume = e.target.value);
            },
            onSave: (clip) => {
                // Sauvegarde paramètres vidéo si nécessaire
            }
        };
    }

    getGenericEditorUI(clip) {
        return {
            html: `
                <div class="p-8 text-center text-gray-500">
                    <p>Éditeur non disponible pour ce format.</p>
                    <div class="mt-4">
                        <label class="text-xs text-gray-400 block mb-1">Nom</label>
                        <input id="prop-clip-name" type="text" value="${clip.name}" class="bg-black border border-gray-700 text-white text-xs p-2 rounded">
                    </div>
                </div>
            `,
            onSave: () => {}
        };
    }
}