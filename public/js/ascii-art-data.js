// public/js/ascii-art-data.js

export const baseCharWidth = 10;
export const baseCharHeight = 10;


// Utiliser les définitions fournies par l'utilisateur (0 et 1)
export const asciiBit = 
{
    // |0> - État de base 0
    '0': [
        ' █████╗',
        '██╔══██╗',
        '██║  ██║',
        '██║  ██║',
        ' █████╔╝',
        '  ╚═══╝ '
    ],
    // |1> - État de base 1
    '1': [
        '██═╗',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '╚═╝ '
    ]
};
// Export des caractères Tensor (A-Z, 0-9)
export const asciiArt = 
{
    'A': [ // Ajusté pour un style bloc plus cohérent
        "  ██  ",
        " ████ ",
        "██  ██",
        "██████",
        "██  ██"
    ],
    "B": [
        "██████╗  ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    "C": [
        " █████╗  ",
        "██╔═══╝  ",
        "██║      ",
        "██║      ",
        "╚█████╗  ",
        " ╚════╝  "
    ],
    "D": [
        "██████╗  ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    'E': [
        "███████╗",
        "██╔════╝",
        "█████╗  ",
        "██╔══╝  ",
        "███████╗",
        "╚══════╝"
    ],
    'F': [ // Ajout de la lettre F
        "███████╗",
        "██╔════╝",
        "█████╗  ",
        "██╔══╝  ",
        "██║     ",
        "╚═╝     "
    ],
    "G": [
        "██████╗   ",
        "██╔═══╝   ",
        "██║  ████╗",
        "██║    ██║",
        "╚███████╔╝",
        " ╚══════╝ "
    ],
    "H": [
        "██╗  ██╗",
        "██║  ██║",
        "███████║",
        "██╔══██║",
        "██║  ██║",
        "╚═╝  ╚═╝"
    ],
    "I": [
        "███████╗",
        " ╚███╔╝ ",
        "  ███╔╝ ",
        "  ███╔╝ ",
        "███████╗",
        "╚══════╝"
    ],
    "J": [
        "     ███╗",
        "     ███║",
        "     ███║",
        "██╗  ███║",
        " ██████╔╝",
        "  ╚════╝ "
    ],
    "K": [
        "██╗  ██╗",
        "██║ ██║ ",
        "█████╔╝ ",
        "██╔═██╗ ",
        "██║  ██╗",
        "╚═╝  ╚═╝"
    ],
    "L": [
        "██╗      ",
        "██║      ",
        "██║      ",
        "██║      ",
        "██████╗  ",
        "╚═════╝  "
    ],
    'M': [
        "██╗     ██╗",
        "███╗   ███║",
        "██╔████╔██║",
        "██║╚██╔╝██║",
        "██║ ╚═╝ ██║",
        "╚═╝     ╚═╝"
    ],
    "N": [
        " ███╗   ██╗",
        " ████╗  ██║",
        " ██╔██╗ ██║",
        " ██║╚██╗██║",
        " ██║ ╚████║",
        " ╚═╝  ╚═══╝"
    ],
    'O': [
        " ██████╗",
        "██╔═══██╗",
        "██║   ██║",
        "██║   ██║",
        "╚██████╔╝",
        " ╚═════╝"
    ],
    "P": [
        "██████╗  ",
        "██╔══██╗ ",
        "██████╔╝ ",
        "██╔═══╝  ",
        "██║      ",
        "╚═╝      "
    ],
    'Q': [ // Ajusté pour être basé sur 'O' avec une queue intégrée
        "  █████╗  ",
        "██╔═══██╗ ",
        "██║   ██║ ",
        "██║   ██║ ",
        "╚██████╔╝ ",
        "      ╚═╝█" // Queue plus intégrée et utilisant des caractères de bordure
    ],
    'R': [ // Ajusté pour un style bloc plus cohérent
        "██████╗  ",
        "██╔══██╗ ",
        "██████╔╝ ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "╚═╝  ╚═╝ "
    ],
    "S": [
        "██████╗  ",
        "██╔════╝ ",
        "███████╗ ",
        "╚════██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    "T": [
        "████████╗",
        "╚══██╔══╝",
        "   ██║   ",
        "   ██║   ",
        "   ██║   ",
        "   ╚═╝   "
    ],
    "U": [
        "██╗   ██╗",
        "██║   ██║",
        "██║   ██║",
        "██║   ██║",
        "╚██████╔╝",
        " ╚═════╝ "
    ],
    "V": [
        "██╗    ██╗",
        "██║    ██║",
        "██║    ██║",
        "╚██╗  ██╔╝",
        " ╚████╔╝  ",
        "   ╚══╝   "
    ],
    'W': [ // Ajout de la lettre W
        "██╗    ██╗",
        "██║    ██║",
        "██║ █╗ ██║",
        "██║███╗██║",
        "████╔████║",
        "╚══╝╚═══╝"
    ],
    "X": [
        "██╗   ██╗",
        "╚██╗ ██╔╝",
        "  ╚███╔╝ ",
        "  ██╔██╗ ",
        "██╔╝  ██╗",
        "╚═╝   ╚═╝"
    ],
    "Y": [
        "██╗   ██╗",
        "╚██╗ ██╔╝",
        " ╚████╔╝ ",
        "  ╚██╔╝  ",
        "   ██║   ",
        "   ╚═╝   "
    ],
    "Z": [
        "███████╗",
        "╚══███╔╝",
        " ███╔╝ ",
        "███╔╝  ",
        "███████╗",
        "╚══════╝"
    ],
    '0': [
        ' █████╗',
        '██╔══██╗',
        '██║  ██║',
        '██║  ██║',
        ' █████╔╝',
        '  ╚═══╝ '
    ],
    '1': [
        '██═╗',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '╚═╝ '
    ],
    '2': [
        '██████╗',
        '╚═══██╗',
        '█████╔╝',
        '██╔═══╝',
        '███████╗',
        '╚══════╝ '
    ],
    '3': [
        '██████╗',
        '╚═══██╗',
        '██████╔╝',
        '╚══███╗',
        '██████╔╝',
        '╚════╝ '
    ],
    '4': [
        '██╗ ██╗',
        '██║ ██║',
        '██████║',
        '╚═══██║',
        '    ██║',
        '    ╚═╝ '
    ],
    '5': [
        '███████╗',
        '██╔════╝',
        '███████╗',
        '╚════██║',
        '███████║',
        '╚══════╝ '
    ],
    '6': [
        '██████╗',
        '██╔════╝',
        '███████╗',
        '██╔══██╗',
        '╚██████╔╝',
        '╚═════╝ '
    ],
    '7': [
        '███████═╗',
        '╚════██ ║',
        '     ██╔╝',
        '     ██╔╝',
        '     ██╔╝',
        '     ╚═╝ '
    ],
    '8': [
        '██████╗',
        '██╔══██╗',
        '███████║',
        '██╔══██║',
        '╚██████║',
        '╚═════╝ '
    ],
    '9':[
        '███████╗',
        '██╔══██╗',
        '███████╝',
        '  ╚══██╗',
        ' ██████║',
        ' ╚═════╝'
    ],
    // Caractère pour l'espace (important pour le mode phrase)
    ' ': [
        "       ",
        "       ",
        "       ",
        "       ",
        "       ",
        "       "
    ],
    '0': asciiBit['0'], // Remplacement pour garantir que 0 et 1 sont les mêmes dans les deux maps
    '1': asciiBit['1'],
};


// --- ASSOCIATIONS DE LONGUEURS D'ONDE / FRÉQUENCES ---
// Ces valeurs sont utilisées par quantum_logique.js pour la visualisation WebGL/Couleur.
// Les fréquences sont arbitraires pour l'audio/visuel, mais basées sur une analogie.

export const quantumWavelengths = {
    // État |0> (Bas - plus stable, énergie basse) -> Couleur Rouge/Infra-rouge
    '0': {
        color: { r: 255, g: 0, b: 0, hex: '#FF0000' }, // Rouge
        frequencyHz: 432.00, // Fréquence audio basse (simulée)
        wavelengthNm: 700 // Longueur d'onde élevée (rouge, proche IR)
    },
    // État |1> (Haut - moins stable, énergie haute) -> Couleur Cyan/Bleu/UV
    '1': {
        color: { r: 0, g: 255, b: 255, hex: '#00FFFF' }, // Cyan (Quantum Cyan)
        frequencyHz: 864.00, // Fréquence audio haute (simulée, octave au-dessus)
        wavelengthNm: 470 // Longueur d'onde basse (cyan, proche UV)
    }
};


// Calculs automatiques des dimensions max
export let maxLetterHeightInLines = 0;
export let maxLetterWidthInChars = 0;

for (const key in asciiArt) {
    const def = asciiArt[key];
    if (def.length > maxLetterHeightInLines) maxLetterHeightInLines = def.length;
    def.forEach(line => {
        if (line.length > maxLetterWidthInChars) maxLetterWidthInChars = line.length;
    });
}

// NOTE: effectiveBaseLetterWidth et effectiveBaseLetterHeight ne sont pas définis ici
// mais seraient calculés dans un fichier JS externe ou une étape de construction
export const effectiveBaseLetterHeight = maxLetterHeightInLines * baseCharHeight;
export const effectiveBaseLetterWidth = maxLetterWidthInChars * baseCharWidth;
export const paddingBetweenLetters = baseCharWidth;