// public/js/AsciiSoupEngine.js

const PHI = 1.61803398875; // Le Nombre d'Or

export class AsciiSoupEngine {
    constructor() {
        this.frequencyMap = {};
        this.sortedChars = [];
        this.totalChars = 0;
    }

    /**
     * Analyse le texte pour extraire les fréquences
     */
    analyze(text) {
        this.frequencyMap = {};
        this.totalChars = 0;
        
        // Nettoyage sommaire (on garde les caractères imprimables)
        const cleanText = text.replace(/[\r\n]+/g, '');

        for (let char of cleanText) {
            this.frequencyMap[char] = (this.frequencyMap[char] || 0) + 1;
            this.totalChars++;
        }

        // Tri par fréquence (du plus fréquent au moins fréquent)
        this.sortedChars = Object.entries(this.frequencyMap)
            .sort((a, b) => b[1] - a[1]);

        return {
            total: this.totalChars,
            stats: this.sortedChars.slice(0, 10) // Top 10 pour l'affichage
        };
    }

    /**
     * Calcule la grille idéale basée sur le Nombre d'Or
     */
    getGoldenGrid(textLength) {
        // Aire = Largeur * Hauteur = Length
        // Largeur / Hauteur = PHI
        // Donc : Hauteur = Sqrt(Length / PHI)
        
        const height = Math.sqrt(textLength / PHI);
        const width = height * PHI;

        return {
            cols: Math.ceil(width),
            rows: Math.ceil(height),
            ratio: width / height // Devrait être proche de 1.618
        };
    }

    /**
     * Convertit la fréquence en densité ASCII
     * Palette : du plus dense (@) au plus léger (.)
     */
    getDensityChar(char) {
        const palette = "@%#*+=-:. ";
        
        // Trouver la position relative de ce caractère dans les fréquences
        const index = this.sortedChars.findIndex(item => item[0] === char);
        if (index === -1) return ' ';

        // Mapping : Les caractères les plus fréquents (début de liste) -> Palette dense
        // Les caractères rares (fin de liste) -> Palette légère
        const paletteIndex = Math.floor((index / this.sortedChars.length) * (palette.length - 1));
        
        return palette[paletteIndex];
    }
}