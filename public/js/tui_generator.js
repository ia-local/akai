// backend/module/tui_generator.js (simulation)
const { TENSOR_BORDERS, TENSOR_RENDER } = require('./moduleAscii.js');

/**
 * Génère un panneau de statut simple.
 * @param {string} title - Le titre du panneau.
 * @param {string} content - Le contenu du panneau.
 */
function createStatusPanel(title, content) {
    const width = 40;
    const padding = TENSOR_RENDER.POINT_SMALL + TENSOR_RENDER.POINT_SMALL;
    
    // Ligne supérieure
    let top = TENSOR_BORDERS.CORNER_TOP_LEFT + TENSOR_BORDERS.LINE_HORIZONTAL.repeat(width - 2) + TENSOR_BORDERS.CORNER_TOP_RIGHT;

    // Ligne de titre (centrée)
    const titlePadding = TENSOR_BORDERS.LINE_HORIZONTAL.repeat(Math.floor((width - 4 - title.length) / 2));
    let titleLine = TENSOR_BORDERS.LINE_VERTICAL + titlePadding + ` ${title} ` + titlePadding;
    if (titleLine.length < width) titleLine += TENSOR_BORDERS.LINE_HORIZONTAL; // Correction d'alignement

    // Ligne de contenu
    let contentLine = TENSOR_BORDERS.LINE_VERTICAL + padding + content.padEnd(width - 4) + padding + TENSOR_BORDERS.LINE_VERTICAL;
    
    // Ligne séparatrice
    let separator = TENSOR_BORDERS.JOINT_LEFT + TENSOR_BORDERS.LINE_HORIZONTAL.repeat(width - 2) + TENSOR_BORDERS.JOINT_RIGHT;

    // Ligne inférieure
    let bottom = TENSOR_BORDERS.CORNER_BOTTOM_LEFT + TENSOR_BORDERS.LINE_HORIZONTAL.repeat(width - 2) + TENSOR_BORDERS.CORNER_BOTTOM_RIGHT;

    return [top, titleLine, separator, contentLine, bottom].join('\n');
}

// console.log(createStatusPanel("SYSTEM STATUS", "All modules operational."));
/* ╔═════════════════ SYSTEM STATUS ════════════════╗
╠═══════════════════════════════════════════════╣
║··All modules operational.                   ··║
╚═══════════════════════════════════════════════╝
*/