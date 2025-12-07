// public/js/data/AsciiGlyphs.js (Module unifié et corrigé pour les exports)

// =================================================================
// 1. DÉFINITIONS GRAPHIQUES (CONSTANTES TENSOR)
// =================================================================

export const TENSOR_BORDERS = {
    CODEX: "╔╗╚╝═║╠╣╦╩╬",
    CORNER_TOP_LEFT: '╔',
    CORNER_TOP_RIGHT: '╗',
    CORNER_BOTTOM_LEFT: '╚',
    CORNER_BOTTOM_RIGHT: '╝',
    LINE_HORIZONTAL: '═',
    LINE_VERTICAL: '║',
    JOINT_LEFT: '╠',
    JOINT_RIGHT: '╣',
    JOINT_TOP: '╦',
    JOINT_BOTTOM: '╩',
    JOINT_CROSS: '╬',
};

export const TENSOR_JOINTS = {
    CODDEX:"╭╮╰╯╴╷╸╵",
    LINE_SIMPLE: '─',
    LINE_VERTICAL_SIMPLE: '│',
    JOINT_LEFT_T: '├',
    JOINT_RIGHT_T: '┤',
    JOINT_TOP_T: '┬',
    JOINT_BOTTOM_T: '┴',
    JOINT_CROSS: '┼',
    JOINT_LEFT_DOUBLE: '╠',
    JOINT_RIGHT_DOUBLE: '╣',
    JOINT_BOTTOM_DOUBLE: '╩',
};

export const TENSOR_RENDER = {
    CODEX: "─│·:░▒▓█",
    LINE_SIMPLE: '─',
    LINE_VERTICAL_SIMPLE: '│',
    POINT_SMALL: '·',
    POINT_MEDIUM: ':',
    SOLID_BLOCK: '█',
    LIGHT_BLOCK: '░', 
    FILL_LIGHT: '░', 
    FILL_MEDIUM: '▒', 
    FILL_HEAVY: '▓', 
    FILL_SOLID: '█', 
    DENSITY: " .:-=+*#%@@",
};

export const TENSOR_CONSTANTS = {
    CODEX_BLOCK_CONDITION: "[x === width - 1] = 1",
    SOLID_BLOCK: '█',
    EMPTY_BLOCK: '░'
};

// =================================================================
// 2. DÉFINITIONS DES GLYPHES ASCII (POUR TENSOR.JS et MAIN.JS)
// =================================================================
export const TENSOR_GLYPHS = {
    meta: {
        baseWidth: 10,
        baseHeight: 10,
        name: "Block-10px"
    },
    chars: {
        // ... (Contenu complet des glyphes) ...
        'A': ["  ██  ", " ████ ", "██  ██", "██████", "██  ██"],
        "B": ["██████╗  ", "██╔══██╗ ", "██║  ██║ ", "██████╔╝ ", "██╔══██╗ ", "██║  ██║ ", "██████╔╝ ", "╚═════╝  "],
        "C": [" █████╗  ", "██╔═══╝  ", "██║      ", "██║      ", "╚█████╗  ", " ╚════╝  "],
        // ... (Autres glyphes ommis pour la concision) ...
        'Z': ["███████╗", "╚══███╔╝", " ███╔╝ ", "███╔╝  ", "███████╗", "╚══════╝"],
        '0': [' █████╗', '██╔══██╗', '██║  ██║', '██║  ██║', ' █████╔╝', '  ╚═══╝ '],
        ' ': ["      ", "      ", "      ", "      ", "      ", "      "],
        'BLOCK': ["██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████"]
    }
};


// =================================================================
// 3. LOGIQUE DE FORMATAGE (PROCESSOR)
// =================================================================

// *** CLASSE CORRECTEMENT EXPORTÉE ***
export class AsciiProcessor {
    /**
     * Analyse un texte brut pour extraire le contenu et les métadonnées de style.
     * Supporte les tags : @COLOR, @ALIGN, @RATIO
     */
    static process(rawContent) {
        if (!rawContent) return { text: "", style: {} };

        const lines = rawContent.split('\n');
        let textLines = [];
        let style = {
            color: '#4ade80', // Vert Matrix par défaut
            align: 'left',
            font: 'monospace',
            ratio: 'free'     // free, 16:9, 4:3, 1:1, phi
        };

        lines.forEach(line => {
            const trimmed = line.trim();
            // Parsing des métadonnées (@KEY: VALUE)
            if (trimmed.startsWith('@COLOR:')) {
                style.color = trimmed.split(':')[1].trim();
            }
            else if (trimmed.startsWith('@ALIGN:')) {
                style.align = trimmed.split(':')[1].trim();
            }
            else if (trimmed.startsWith('@RATIO:')) {
                style.ratio = trimmed.split(':')[1].trim();
            }
            else {
                textLines.push(line);
            }
        });

        return {
            text: textLines.join('\n'),
            style: style
        };
    }
}

// =================================================================
// 4. GÉNÉRATEURS (BOX & CHARTS)
// =================================================================

/**
 * Génère une boîte ASCII autour d'un texte (Style TENSOR)
 */
// *** FONCTION CORRECTEMENT EXPORTÉE ***
export function generateAsciiBox(text, width = 40) {
    const safeText = text || "";
    // Calcul du padding pour centrer le texte
    // width - 2 (bordures) - longueur texte
    const paddingTotal = Math.max(0, width - 2 - safeText.length);
    const padL = " ".repeat(Math.floor(paddingTotal / 2));
    const padR = " ".repeat(Math.ceil(paddingTotal / 2));
    
    return [
        TENSOR_BORDERS.CORNER_TOP_LEFT + TENSOR_BORDERS.LINE_HORIZONTAL.repeat(width - 2) + TENSOR_BORDERS.CORNER_TOP_RIGHT,
        TENSOR_BORDERS.LINE_VERTICAL + padL + safeText + padR + TENSOR_BORDERS.LINE_VERTICAL,
        TENSOR_BORDERS.CORNER_BOTTOM_LEFT + TENSOR_BORDERS.LINE_HORIZONTAL.repeat(width - 2) + TENSOR_BORDERS.CORNER_BOTTOM_RIGHT
    ].join('\n');
}