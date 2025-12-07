/**
 * Fichier: quantum.js
 * Rôle: Exporte la fonction de rendu des bits de base |0> et |1>.
 */

import { asciiBit, baseCharWidth, baseCharHeight } from './ascii-art.js'; 
import { baseCharWidth, baseCharHeight, quantumWavelengths } from './ascii-art.js'; 
import { generateQubitBlock3D } from './qubit_tensor_processor.js'; 

const TENSOR_RENDER = { FILL_LIGHT: '░', FILL_SOLID: '█' }; // Densités nécessaires
const LETTER_SPACING = 50;
const PADDING = 20; 


/**
 * Fonction interne pour dessiner un bit ASCII.
 */
function drawQuantumBit(ctx, bitValue, startX, startY, color) {
    const art = asciiBit[bitValue];
    if (!art) return 0;

    const maxLineLength = art.reduce((max, line) => Math.max(max, line.length), 0);
    const bitPixelWidth = maxLineLength * baseCharWidth;

    ctx.globalAlpha = 1; 
    ctx.fillStyle = color;
    ctx.font = `${baseCharHeight}px monospace`; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    art.forEach((line, lineIndex) => {
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char !== ' ') {
                const x = startX + charIndex * baseCharWidth;
                const y = startY + lineIndex * baseCharHeight;
                ctx.fillText(char, x, y);
            }
        }
    });

    return bitPixelWidth;
}


/**
 * 🛑 NOUVELLE FONCTION EXPORTÉE : Rendu des deux bits |0> et |1>
 * Elle est appelée par la boucle d'animation de quantum_ui.js.
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas.
 */
export function renderTwoBaseBits(ctx) {
    // Redimensionnement du canvas au conteneur (IMPORTANT)
    const container = document.getElementById('preview-media-container');
    if (container && ctx.canvas.width !== container.clientWidth) {
        ctx.canvas.width = container.clientWidth;
        ctx.canvas.height = container.clientHeight;
    }
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const height0 = asciiBit['0'].length * baseCharHeight; 
    const width0 = asciiBit['0'].reduce((max, line) => Math.max(max, line.length), 0) * baseCharWidth;
    const width1 = asciiBit['1'].reduce((max, line) => Math.max(max, line.length), 0) * baseCharWidth;
    
    const totalContentWidth = width0 + LETTER_SPACING + width1;

    let currentX = (ctx.canvas.width / 2) - (totalContentWidth / 2);
    const startY0 = (ctx.canvas.height / 2) - (height0 / 2);
    const startY1 = (ctx.canvas.height / 2) - (height0 / 2); // Utiliser la même référence de hauteur

    // 1. Dessiner l'état |0> (en Rouge)
    const widthDrawn0 = drawQuantumBit(ctx, '0', currentX, startY0, '#FF0000');
    
    currentX += widthDrawn0 + LETTER_SPACING;

    // 2. Dessiner l'état |1> (en Cyan)
    drawQuantumBit(ctx, '1', currentX, startY1, '#00FFFF');
    
    // Le code de `quantum_ui.js` gère le `quantum-active`
}
/**
 * Fichier: quantum.js
 * Rôle: Rendu des états de base fixes |0> et |1> en 3D (Mode Index 1).
 */


// Dessin multi-ligne (adapté pour les blocs 3D)
// Dessin multi-ligne (adapté pour les blocs 3D)
function drawBlock(ctx, blockArt, startX, startY, color) {
    if (!blockArt || blockArt.length === 0) return 0;

    const charW = baseCharWidth; 
    const charH = baseCharHeight; 
    
    const maxLineLength = blockArt.reduce((max, line) => Math.max(max, line.length), 0);

    ctx.globalAlpha = 1; 
    ctx.fillStyle = color;
    ctx.font = `${charH}px monospace`; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    blockArt.forEach((line, lineIndex) => {
        ctx.fillText(line, 
                     startX, 
                     startY + lineIndex * charH);
    });

    return maxLineLength * charW; 
}

/**
 * 🛑 RENDU DES DEUX BITS DE BASE EN 3D (Index 1)
 */
export function renderTwoBaseBits(ctx) {
    const container = document.getElementById('preview-media-container');
    if (container) {
        ctx.canvas.width = container.clientWidth;
        ctx.canvas.height = container.clientHeight;
    }
    
    const blockArt0 = generateQubitBlock3D(TENSOR_RENDER.FILL_LIGHT, 1.0); // Représentation |0> (faible densité)
    const blockArt1 = generateQubitBlock3D(TENSOR_RENDER.FILL_SOLID, 1.0); // Représentation |1> (forte densité)
    
    // Dimensions du bloc 3D
    const maxLineLength = blockArt0.reduce((max, line) => Math.max(max, line.length), 0);
    const widthTotalBlock = maxLineLength * baseCharWidth;
    const heightTotal = blockArt0.length * baseCharHeight;

    const totalContentWidth = (widthTotalBlock * 2) + LETTER_SPACING;

    let currentX = (ctx.canvas.width / 2) - (totalContentWidth / 2);
    const startY = (ctx.canvas.height / 2) - (heightTotal / 2);

    // 1. Dessiner l'état |0> (Rouge/Faible)
    const color0 = `rgb(${quantumWavelengths['0'].color.r}, ${quantumWavelengths['0'].color.g}, ${quantumWavelengths['0'].color.b})`;
    const widthDrawn0 = drawBlock(ctx, blockArt0, currentX, startY, color0);
    
    currentX += widthDrawn0 + LETTER_SPACING;

    // 2. Dessiner l'état |1> (Cyan/Forte)
    const color1 = `rgb(${quantumWavelengths['1'].color.r}, ${quantumWavelengths['1'].color.g}, ${quantumWavelengths['1'].color.b})`;
    drawBlock(ctx, blockArt1, currentX, startY, color1);
    
    console.log("✅ Visualisation des états |0> et |1> en 3D TENSOR terminée.");
}
// Nettoyage de l'ancien appel direct au démarrage


// document.addEventListener('DOMContentLoaded', () => { ... });