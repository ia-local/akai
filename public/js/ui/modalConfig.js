/**
 * MODULE DE CONFIGURATION (Settings)
 * Gère les préférences globales de l'application (Graphisme, Audio, Système).
 */

export class ConfigManager {
    constructor() {
        // Configuration par défaut
        this.settings = {
            graphics: {
                engine: 'tensor', // 'tensor' | 'canvas' | 'webgl'
                bloom: true,
                resolutionScale: 1.0, // 0.5 = Performance, 1.0 = Qualité
                matrixColor: '#4ade80'
            },
            audio: {
                masterVolume: 0.8,
                sampleRate: 48000
            },
            system: {
                autoSave: true,
                debugMode: false
            }
        };
        
        this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('studio_config_v1');
        if (saved) {
            try {
                // Fusion intelligente (garde les defaults si nouvelles clés)
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                console.log("⚙️ Config chargée.");
            } catch(e) { console.error("Erreur Config Load", e); }
        }
    }

    saveSettings() {
        localStorage.setItem('studio_config_v1', JSON.stringify(this.settings));
        console.log("💾 Config sauvegardée.");
        // Ici, on pourrait émettre un événement pour dire au moteur de se mettre à jour
        window.location.reload(); // Pour l'instant, on reload pour appliquer (simple)
    }

    /**
     * Ouvre la modale de configuration
     */
    openModal() {
        if (!window.modalSystem) return;

        const content = `
            <div class="config-tabs">
                <div class="config-tab active" data-tab="graphics">GRAPHIQUES</div>
                <div class="config-tab" data-tab="audio">AUDIO</div>
                <div class="config-tab" data-tab="system">SYSTÈME</div>
            </div>

            <div id="config-content">
                <div class="config-grid">
                    <div class="config-section">
                        <h4>Moteur de Rendu</h4>
                        <div class="config-row">
                            <div class="config-label">Type de Moteur<small>Rechargement requis</small></div>
                            <select id="cfg-engine" class="config-input w-24">
                                <option value="tensor" ${this.settings.graphics.engine === 'tensor' ? 'selected' : ''}>Tensor (CPU)</option>
                                <option value="canvas" ${this.settings.graphics.engine === 'canvas' ? 'selected' : ''}>Canvas 2D</option>
                            </select>
                        </div>
                        <div class="config-row">
                            <div class="config-label">Échelle Résolution</div>
                            <input type="number" id="cfg-scale" value="${this.settings.graphics.resolutionScale}" step="0.1" min="0.1" max="2.0" class="config-input">
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h4>Post-Processing</h4>
                        <div class="config-row">
                            <div class="config-label">Effet Glow (Bloom)</div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="cfg-bloom" ${this.settings.graphics.bloom ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="config-row">
                            <div class="config-label">Couleur Matrix</div>
                            <input type="color" id="cfg-color" value="${this.settings.graphics.matrixColor}" class="bg-transparent border-none h-6 w-8 cursor-pointer">
                        </div>
                    </div>
                </div>
            </div>
        `;

        const footer = `
            <button class="text-gray-400 px-3 py-1 text-xs hover:text-white" onclick="window.modalSystem.close()">Annuler</button>
            <button class="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500" id="btn-save-config">SAUVEGARDER & APPLIQUER</button>
        `;

        window.modalSystem.show("PARAMÈTRES STUDIO", content, footer, () => {
            // Logique de Sauvegarde
            document.getElementById('btn-save-config').onclick = () => {
                // Récupération des valeurs
                this.settings.graphics.engine = document.getElementById('cfg-engine').value;
                this.settings.graphics.resolutionScale = parseFloat(document.getElementById('cfg-scale').value);
                this.settings.graphics.bloom = document.getElementById('cfg-bloom').checked;
                this.settings.graphics.matrixColor = document.getElementById('cfg-color').value;
                
                this.saveSettings();
                window.modalSystem.close();
            };

            // Logique des Onglets (Simulation simple pour l'exemple)
            document.querySelectorAll('.config-tab').forEach(tab => {
                tab.onclick = (e) => {
                    document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    // TODO: Changer le contenu du innerHTML de #config-content selon l'onglet
                    // Pour l'instant on reste sur Graphics pour la démo
                };
            });
        });
    }
}