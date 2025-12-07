// public/js/data/AsciiGlyphs.js (Module unifié)

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
// 2. DÉFINITIONS DES GLYPHES ASCII (Basé sur ascii-art.js)
// =================================================================

export const baseCharWidth = 10;
export const baseCharHeight = 10;
export let maxLetterHeightInLines = 0;
export let maxLetterWidthInChars = 0;
export const paddingBetweenLetters = 15;

export const TENSOR_GLYPHS = {
    meta: {
        baseWidth: baseCharWidth,
        baseHeight: baseCharHeight,
        name: "Block-10px"
    },
    chars: {
        // --- COPIE DES GLYPHES DE asciiArt DANS CHARS ---
        'A': ["  ██  ", " ████ ", "██  ██", "██████", "██  ██"],
        "B": ["██████╗  ", "██╔══██╗ ", "██║  ██║ ", "██████╔╝ ", "██╔══██╗ ", "██║  ██║ ", "██████╔╝ ", "╚═════╝  "],
        "C": [" █████╗  ", "██╔═══╝  ", "██║      ", "██║      ", "╚█████╗  ", " ╚════╝  "],
        "D": ["██████╗  ", "██╔══██╗ ", "██║  ██║ ", "██║  ██║ ", "██████╔╝ ", "╚═════╝  "],
        'E': ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
        'F': ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "██║     ", "╚═╝     "],
        "G": ["██████╗   ", "██╔═══╝   ", "██║  ████╗", "██║    ██║", "╚███████╔╝", " ╚══════╝ "],
        "H": ["██╗  ██╗", "██║  ██║", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
        "I": ["███████╗", " ╚███╔╝ ", "  ███╔╝ ", "  ███╔╝ ", "███████╗", "╚══════╝"],
        "J": ["     ███╗", "     ███║", "     ███║", "██╗  ███║", " ██████╔╝", "  ╚════╝ "],
        "K": ["██╗  ██╗", "██║ ██║ ", "█████╔╝ ", "██╔═██╗ ", "██║  ██╗", "╚═╝  ╚═╝"],
        "L": ["██╗      ", "██║      ", "██║      ", "██║      ", "██████╗  ", "╚═════╝  "],
        'M': ["██╗     ██╗", "███╗   ███║", "██╔████╔██║", "██║╚██╔╝██║", "██║ ╚═╝ ██║", "╚═╝     ╚═╝"],
        "N": [" ███╗   ██╗", " ████╗  ██║", " ██╔██╗ ██║", " ██║╚██╗██║", " ██║ ╚████║", " ╚═╝  ╚═══╝"],
        'O': [" ██████╗", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝"],
        "P": ["██████╗  ", "██╔══██╗ ", "██████╔╝ ", "██╔═══╝  ", "██║      ", "╚═╝      "],
        'Q': ["  █████╗  ", "██╔═══██╗ ", "██║   ██║ ", "██║   ██║ ", "╚██████╔╝ ", "      ╚═╝█"],
        'R': ["██████╗  ", "██╔══██╗ ", "██████╔╝ ", "██╔══██╗ ", "██║  ██║ ", "╚═╝  ╚═╝ "],
        "S": ["██████╗  ", "██╔════╝ ", "███████╗ ", "╚════██║ ", "██████╔╝ ", "╚═════╝  "],
        "T": ["████████╗", "╚══██╔══╝", "   ██║   ", "   ██║   ", "   ██║   ", "   ╚═╝   "],
        "U": ["██╗   ██╗", "██║   ██║", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
        "V": ["██╗    ██╗", "██║    ██║", "██║    ██║", "╚██╗  ██╔╝", " ╚████╔╝  ", "   ╚══╝   "],
        'W': ["██╗    ██╗", "██║    ██║", "██║ █╗ ██║", "██║███╗██║", "████╔████║", "╚══╝╚═══╝"],
        "X": ["██╗   ██╗", "╚██╗ ██╔╝", "  ╚███╔╝ ", "  ██╔██╗ ", "██╔╝  ██╗", "╚═╝   ╚═╝"],
        "Y": ["██╗   ██╗", "╚██╗ ██╔╝", " ╚████╔╝ ", "  ╚██╔╝  ", "   ██║   ", "   ╚═╝   "],
        "Z": ["███████╗", "╚══███╔╝", " ███╔╝ ", "███╔╝  ", "███████╗", "╚══════╝"],
        '0': [' █████╗', '██╔══██╗', '██║  ██║', '██║  ██║', ' █████╔╝', '  ╚═══╝ '],
        '1': ['██═╗', '██╔╝', '██╔╝', '██╔╝', '██╔╝', '╚═╝ '],
        '2': ['██████╗', '╚═══██╗', '█████╔╝', '██╔═══╝', '███████╗', '╚══════╝ '],
        '3': ['██████╗', '╚═══██╗', '██████╔╝', '╚══███╗', '██████╔╝', '╚════╝ '],
        '4': ['██╗ ██╗', '██║ ██║', '██████║', '╚═══██║', '    ██║', '    ╚═╝ '],
        '5': ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝ '],
        '6': ['██████╗', '██╔════╝', '███████╗', '██╔══██╗', '╚██████╔╝', '╚═════╝ '],
        '7': ['███████═╗', '╚════██ ║', '     ██╔╝', '     ██╔╝', '     ██╔╝', '     ╚═╝ '],
        '8': ['██████╗', '██╔══██╗', '███████║', '██╔══██║', '╚██████║', '╚═════╝ '],
        '9': ['███████╗', '██╔══██╗', '███████╝', '  ╚══██╗', ' ██████║', ' ╚═════╝'],
        ' ': ["      ", "      ", "      ", "      ", "      ", "      "],
        'BLOCK': ["██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████", "██████████"],
        'SMILE': [
            "  ██  ",
            "      ",
            "█    █",
            " ████ "
        ]
    }
};

// =================================================================
// 3. LOGIQUE DE FORMATAGE (PROCESSOR)
// =================================================================

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