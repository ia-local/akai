/**
 * Fichier: quantum.js
 * Rôle: Exercice simple pour dessiner les états de base |0> et |1> en ASCII Art.
 * Note: Remplace quantum_logique.js et quantum_ui.js pour cet exercice.
 */

// Importe les définitions de bits et les constantes de dimension
import { asciiBit, baseCharWidth, baseCharHeight } from './ascii-art-data.js'; 

const CANVAS_ID = 'webgl-canvas';
const PADDING = 20; // Padding du canvas
const LETTER_SPACING = 30; // Espacement entre |0> et |1>

// --- Fonction de Rendu ---

function drawQuantumBit(ctx, bitValue, startX, startY, color = '#FF0000') {
    const art = asciiBit[bitValue];
    if (!art) {
        console.error(`Définition ASCII non trouvée pour le bit ${bitValue}`);
        return 0;
    }

    // Calcul de la largeur de la plus longue ligne (pour le centrage)
    const maxLineLength = art.reduce((max, line) => Math.max(max, line.length), 0);
    const bitPixelWidth = maxLineLength * baseCharWidth;

    ctx.globalAlpha = 1; 
    ctx.fillStyle = color;
    // Utiliser la taille de base des caractères comme taille de police
    ctx.font = `${baseCharHeight}px monospace`; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Boucle de Dessin
    art.forEach((line, lineIndex) => {
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char !== ' ') {
                // Position X: Décalage initial + Index du caractère * Largeur du caractère
                const x = startX + charIndex * baseCharWidth;
                // Position Y: Décalage initial + Index de la ligne * Hauteur du caractère
                const y = startY + lineIndex * baseCharHeight;
                
                ctx.fillText(char, x, y);
            }
        }
    });

    return bitPixelWidth; // Retourne la largeur totale pour le positionnement suivant
}

// --- Démarrage du Rendu ---

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById(CANVAS_ID);
    
    // Assurez-vous que le canvas pour l'ASCII est prêt
    if (!canvas || !canvas.getContext) {
        console.error("Canvas non trouvé ou contexte 2D non disponible.");
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Pour cet exercice, nous utilisons le Canvas WebGL en mode 2D
    // Le redimensionnement est nécessaire pour qu'il prenne tout l'espace
    const container = document.getElementById('preview-media-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Calcul du Positionnement ---

    // La hauteur de l'art ASCII |0>
    const height0 = asciiBit['0'].length * baseCharHeight; 
    // La hauteur de l'art ASCII |1>
    const height1 = asciiBit['1'].length * baseCharHeight; 

    // Position Y centrée
    const startY0 = (canvas.height / 2) - (height0 / 2);
    const startY1 = (canvas.height / 2) - (height1 / 2);

    // Estimation de la largeur totale requise (pour le centrage global)
    // Ici nous estimons maxLineLength de |0> pour la largeur du bloc
    const maxLineLength0 = asciiBit['0'].reduce((max, line) => Math.max(max, line.length), 0);
    const maxLineLength1 = asciiBit['1'].reduce((max, line) => Math.max(max, line.length), 0);
    
    const width0 = maxLineLength0 * baseCharWidth;
    const width1 = maxLineLength1 * baseCharWidth;
    
    const totalContentWidth = width0 + LETTER_SPACING + width1;

    // Position X de départ pour centrer l'ensemble
    let currentX = (canvas.width / 2) - (totalContentWidth / 2);

    // --- Dessin des Bits ---

    // 1. Dessiner l'état |0> (en Rouge)
    const widthDrawn0 = drawQuantumBit(
        ctx, 
        '0', 
        currentX, 
        startY0, 
        '#FF0000' // Couleur Rouge pour |0> (basse énergie)
    );
    
    // Avancer la position X pour le prochain bit
    currentX += widthDrawn0 + LETTER_SPACING;

    // 2. Dessiner l'état |1> (en Cyan/Bleu)
    drawQuantumBit(
        ctx, 
        '1', 
        currentX, 
        startY1, 
        '#00FFFF' // Couleur Cyan pour |1> (haute énergie)
    );
    // Nous utilisons un timeout pour s'assurer que le premier clear est passé
    setTimeout(() => {
        canvas.classList.add('quantum-active');
        console.log("Canvas Quantum activé par Keyframe CSS.");
    }, 50); // Petit délai pour laisser le DOM et le CSS se stabiliser
    console.log("✅ Visualisation des états |0> et |1> terminée.");
});