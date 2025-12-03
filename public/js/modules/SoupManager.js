/**
 * MODULE: SOUP MANAGER
 * Rôle : Gère l'analyse de données textuelles (Soup.md) et l'animation ASCII Matrix.
 */
export class SoupManager {
    constructor(asciiEngine, soupEngineCore) {
        this.asciiEngine = asciiEngine;
        this.core = soupEngineCore; // L'instance de AsciiSoupEngine
    }

    async runAnalysis(previewWidth, previewHeight) {
        try {
            const response = await fetch('/data/text/soup.md');
            if (!response.ok) throw new Error("Fichier soup.md introuvable");
            const text = await response.text();

            // 1. Analyse Statistique
            const stats = this.core.analyze(text);
            this._displayReport(stats);

            // 2. Animation Graphique (Phi Grid)
            if (this.asciiEngine) {
                const canvas = this.asciiEngine.canvas || document.getElementById('ascii-canvas');
                if(canvas) canvas.classList.add('active');

                // Configuration Grille PHI
                if (this.asciiEngine.setResolution) {
                    const layout = this.asciiEngine.setResolution(previewWidth, previewHeight, 'phi');
                    this._animateSoupStream(text, layout.cols);
                }
            }

        } catch (e) {
            console.error("Soup Error:", e);
        }
    }

    _displayReport(stats) {
        const panelContent = document.querySelector('#right-panel .panel-content');
        if (panelContent) {
            const topChars = stats.stats.map(s => `[${s[0]}: ${s[1]}]`).join(' ');
            panelContent.innerHTML += `
                <div class="mt-4 p-2 bg-black border border-green-500 text-green-400 text-xs font-mono">
                    <div class="font-bold border-b border-green-800 mb-1">SOUP ANALYSIS</div>
                    <div>Total: ${stats.total}</div>
                    <div>${topChars}</div>
                </div>
            `;
        }
    }

    _animateSoupStream(fullText, cols) {
        let cursor = 0;
        const speed = 5;
        
        const step = () => {
            if (cursor >= fullText.length) return;
            const currentChunk = fullText.substring(0, cursor);
            
            let visualText = "";
            for (let char of currentChunk) visualText += this.core.getDensityChar(char);

            const formattedLines = [];
            for (let i = 0; i < visualText.length; i += cols) {
                formattedLines.push(visualText.substring(i, i + cols));
            }
            
            this.asciiEngine.render({ 
                text: formattedLines.join('\n'), 
                style: { color: '#facc15', align: 'center' } 
            });

            cursor += speed;
            requestAnimationFrame(step);
        };
        step();
    }
}