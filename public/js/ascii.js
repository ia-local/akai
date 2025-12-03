// scripts.js
import {
    TensorWindows,
    TensorReplie,
    TensorRendu,
    asciiArt,
    baseCharWidth,
    baseCharHeight,
    maxLetterHeightInLines,
    maxLetterWidthInChars,
    effectiveBaseLetterHeight,
    effectiveBaseLetterWidth,
    paddingBetweenLetters
} from './ascii-art.js';

// --- Variables Globales Canvas ---
const canvas = document.getElementById('wordCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId; // Pour stocker l'ID de la frame d'animation

// --- Variables Globales pour l'animation ---
let letters = []; // Tableau pour stocker les objets des lettres en cours d'animation (utilisé aussi pour le test de mot/phrase)
let currentWord = ""; // Le mot ou la phrase en cours de construction/test (garde la casse originale)
let isAnimating = false; // Pour éviter de lancer plusieurs animations
let testLetterObject = null; // Variable pour la lettre unique testée
let isPhraseMode = false; // Nouvelle variable pour indiquer si on est en mode phrase
let currentColor = { r: 255, g: 165, b: 0 }; // Couleur initiale (orange)

// --- Variables Globales Tone.js ---
let synth;

// --- Variables Globales SpeechSynthesis ---
let speechSynth;
let frenchVoice = null;
let voicesLoaded = false; // Nouvelle variable pour suivre l'état de chargement des voix

// --- URL du serveur Node.js Groq ---
const GROQ_SERVER_URL = 'http://localhost:3145'; // Assurez-vous que c'est le bon port

// --- Fonction pour calculer la fréquence d'une note à partir d'un diapason A4 ---
// n: nombre de demi-tons par rapport à A4 (0 pour A4, 1 pour A#4, -1 pour G#4, etc.)
// a4Frequency: fréquence de A4 en Hz (par exemple, 432 ou 440)
function calculateFrequency(n, a4Frequency = 432) {
    return a4Frequency * Math.pow(2, n / 12);
}

// Définition du diapason A4 à 432 Hz
const A4_432HZ = 432;

// Mappage des lettres et chiffres à des fréquences en Hz (calculées à partir de A4=432Hz)
// Les demi-tons sont comptés par rapport à A4 (0)
const letterFrequencies = {
    'A': calculateFrequency(-9, A4_432HZ),   // C4
    'B': calculateFrequency(-7, A4_432HZ),   // D4
    'C': calculateFrequency(-5, A4_432HZ),   // E4
    'D': calculateFrequency(-4, A4_432HZ),   // F4
    'E': calculateFrequency(-2, A4_432HZ),   // G4
    'F': calculateFrequency(0, A4_432HZ),    // A4
    'G': calculateFrequency(2, A4_432HZ),    // B4
    'H': calculateFrequency(3, A4_432HZ),    // C5
    'I': calculateFrequency(5, A4_432HZ),    // D5
    'J': calculateFrequency(7, A4_432HZ),    // E5
    'K': calculateFrequency(8, A4_432HZ),    // F5
    'L': calculateFrequency(10, A4_432HZ),   // G5
    'M': calculateFrequency(12, A4_432HZ),   // A5
    'N': calculateFrequency(14, A4_432HZ),   // B5
    'O': calculateFrequency(15, A4_432HZ),   // C6
    'P': calculateFrequency(17, A4_432HZ),   // D6
    'Q': calculateFrequency(19, A4_432HZ),   // E6
    'R': calculateFrequency(20, A4_432HZ),   // F6
    'S': calculateFrequency(22, A4_432HZ),   // G6
    'T': calculateFrequency(24, A4_432HZ),   // A6
    'U': calculateFrequency(26, A4_432HZ),   // B6
    'V': calculateFrequency(27, A4_432HZ),   // C7
    'W': calculateFrequency(29, A4_432HZ),   // D7
    'X': calculateFrequency(31, A4_432HZ),   // E7
    'Y': calculateFrequency(32, A4_432HZ),   // F7
    'Z': calculateFrequency(34, A4_432HZ),   // G7
    
    // Fréquences pour les chiffres
    '0': calculateFrequency(-1, A4_432HZ),   // A#3/Bb3
    '1': calculateFrequency(1, A4_432HZ),    // A#4/Bb4
    '2': calculateFrequency(4, A4_432HZ),    // C#5/Db5
    '3': calculateFrequency(6, A4_432HZ),    // D#5/Eb5
    '4': calculateFrequency(9, A4_432HZ),    // F#5/Gb5
    '5': calculateFrequency(11, A4_432HZ),   // G#5/Ab5
    '6': calculateFrequency(13, A4_432HZ),   // A#5/Bb5
    '7': calculateFrequency(16, A4_432HZ),   // C#6/Db6
    '8': calculateFrequency(18, A4_432HZ),   // D#6/Eb6
    '9': calculateFrequency(21, A4_432HZ)    // F#6/Gb6
};

// Définition des dimensions des caractères ASCII en pixels
// Ces variables sont maintenant importées de ascii-art.js

// --- Éléments du DOM ---
const startButton = document.getElementById('start-button');
const generateRandomWordButton = document.getElementById('generate-random-word-button');
const customWordInput = document.getElementById('custom-word-input');
const buildCustomWordButton = document.getElementById('build-custom-word-button');
const wordDisplay = document.getElementById('word-display');
const letterInput = document.getElementById('letter-input');
const testLetterButton = document.getElementById('test-letter-button');
const phraseInput = document.getElementById('phrase-input');
const buildCustomPhraseButton = document.getElementById('build-custom-phrase-button');

// Color controls
const redSlider = document.getElementById('red-slider');
const greenSlider = document.getElementById('green-slider');
const blueSlider = document.getElementById('blue-slider');
const redValueSpan = document.getElementById('red-value');
const greenValueSpan = document.getElementById('green-value');
const blueValueSpan = document.getElementById('blue-value');
const colorPreview = document.getElementById('color-preview');
const applyColorButton = document.getElementById('apply-color-button');

// New button for random phrase generation
const generateRandomPhraseButton = document.getElementById('generate-random-phrase-button');


// --- Initialisation du Canvas ---
function initCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6; // Ajusté pour le 2D
    console.log('Canvas initialisé.');

    window.addEventListener('resize', onWindowResize, false);
    animateCanvas(); // Lancer la boucle de rendu du canvas
}

// --- Initialisation de Tone.js ---
function initToneJS() {
    synth = new Tone.Synth().toDestination();
    console.log('Tone.js initialisé.');
}

// --- Initialisation de SpeechSynthesis ---
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynth = window.speechSynthesis;
        speechSynth.onvoiceschanged = () => {
            const voices = speechSynth.getVoices();
            frenchVoice = voices.find(voice => voice.lang === 'fr-FR' || voice.lang.startsWith('fr-'));
            if (!frenchVoice) {
                console.warn("Aucune voix française trouvée, utilisation de la voix par défaut.");
            } else {
                console.log("Voix française trouvée :", frenchVoice.name);
            }
            voicesLoaded = true; // Les voix sont chargées
        };
        // Si les voix sont déjà chargées avant que l'événement ne se déclenche
        if (speechSynth.getVoices().length > 0) {
            const voices = speechSynth.getVoices();
            frenchVoice = voices.find(voice => voice.lang === 'fr-FR' || voice.lang.startsWith('fr-'));
            if (!frenchVoice) {
                console.warn("Aucune voix française trouvée au démarrage, utilisation de la voix par défaut.");
            } else {
                console.log("Voix française trouvée au démarrage :", frenchVoice.name);
            }
            voicesLoaded = true;
        }
        console.log('SpeechSynthesis initialisé.');
    } else {
        console.warn("L'API SpeechSynthesis n'est pas supportée par ce navigateur.");
    }
}

// --- Fonction pour dessiner une lettre ASCII sur le canvas ---
// Prend la lettre, sa position X, Y sur le canvas, et un facteur d'opacité (pour l'animation)
function drawLetterASCII(letter, x, y, opacity = 1, customCharWidth = baseCharWidth, customCharHeight = baseCharHeight) {
    const art = asciiArt[letter.toUpperCase()];
    
    ctx.globalAlpha = opacity; // Appliquer l'opacité
    ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`; // Utiliser la couleur dynamique
    ctx.font = `${customCharHeight}px monospace`; // Définir la police pour le dessin des caractères

    if (!art) {
        // Pour les caractères non définis, dessiner un grand point d'interrogation rouge
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Calculer le centre de la "boîte" du caractère pour le '?'
        ctx.fillText('?', x + (customCharWidth * maxLetterWidthInChars / 2), y + (customCharHeight * maxLetterHeightInLines / 2));
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1;
        return;
    }
    
    art.forEach((line, lineIndex) => {
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            ctx.fillText(char, x + charIndex * customCharWidth, y + lineIndex * customCharHeight);
        }
    });
    ctx.globalAlpha = 1; // Réinitialiser l'opacité globale
}

// --- Boucle d'animation du Canvas ---
function animateCanvas() {
    animationFrameId = requestAnimationFrame(animateCanvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas à chaque frame

    if (testLetterObject) {
        // Si une lettre unique est en mode test, la dessiner
        drawLetterASCII(testLetterObject.letter, testLetterObject.x, testLetterObject.y, testLetterObject.opacity, testLetterObject.charWidth, testLetterObject.charHeight);
    } else {
        // Sinon, mettre à jour et dessiner chaque lettre en cours d'animation (mode construction de mot ou test de mot/phrase)
        letters.forEach(letterObj => {
            // Pour le mode test de mot/phrase, les lettres sont déjà positionnées statiquement (currentX = targetX)
            // Pour l'animation de mot, elles se déplacent vers targetX
            if (isAnimating) { // Seulement si une animation est en cours
                letterObj.currentX += (letterObj.targetX - letterObj.currentX) * 0.05;
                letterObj.currentY += (letterObj.targetY - letterObj.currentY) * 0.05;
                letterObj.opacity += (letterObj.targetOpacity - letterObj.opacity) * 0.1;
            }
            drawLetterASCII(letterObj.letter, letterObj.currentX, letterObj.currentY, letterObj.opacity, letterObj.charWidth, letterObj.charHeight);
        });
    }
}

// --- Gestion du redimensionnement de la fenêtre ---
function onWindowResize() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    
    if (!isAnimating) {
        if (testLetterObject) { // Si une seule lettre a été testée
            // Recalculer la position pour la lettre unique
            const letter = testLetterObject.letter;
            const artWidth = asciiArt[letter] ? asciiArt[letter].reduce((max, line) => Math.max(max, line.length), 0) * testLetterObject.charWidth : 0;
            const artHeight = asciiArt[letter] ? asciiArt[letter].length * testLetterObject.charHeight : 0;

            testLetterObject.x = (canvas.width / 2) - (artWidth / 2);
            testLetterObject.y = (canvas.height / 2) - (artHeight / 2);
        } else if (letters.length > 0) { // Si un mot ou une phrase a été construit ou testé
            if (isPhraseMode) {
                // Reconstruire la phrase avec la nouvelle taille du canvas
                updatePhraseDisplay(currentWord); // Utilise la fonction de mise à jour pour le redimensionnement
            } else {
                // Recalculer les positions pour un mot statique
                const wordToUse = currentWord;
                const totalWordPixelWidth = (wordToUse.length * effectiveBaseLetterWidth) + ((wordToUse.length - 1) * paddingBetweenLetters);
                const startX = (canvas.width / 2) - (totalWordPixelWidth / 2);
                const startY = (canvas.height / 2) - (effectiveBaseLetterHeight / 2);

                letters.forEach((letterObj, index) => {
                    letterObj.currentX = startX + (index * (effectiveBaseLetterWidth + paddingBetweenLetters));
                    letterObj.currentY = startY;
                    letterObj.opacity = 1;
                    letterObj.charWidth = baseCharWidth; // Reset to base size
                    letterObj.charHeight = baseCharHeight; // Reset to base size
                });
            }
        }
    }
}

// --- Fonction utilitaire de délai ---
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- Fonction pour réinitialiser la scène ---
function resetScene() {
    cancelAnimationFrame(animationFrameId); // Arrêter l'ancienne boucle d'animation
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas
    letters = []; // Vider le tableau des lettres
    currentWord = "";
    testLetterObject = null; // Réinitialiser la lettre testée unique
    isPhraseMode = false; // Réinitialiser le mode phrase
    wordDisplay.textContent = "";
    animateCanvas(); // Redémarrer la boucle d'animation pour un canvas vide
}

// --- Algorithme de construction du mot (asynchrone avec animation) ---
async function buildWordAnimation(wordToBuild) {
    console.log(`Démarrage de l'animation pour le mot: ${wordToBuild}`);
    if (isAnimating) {
        console.log("L'animation est déjà en cours.");
        return;
    }

    if (!wordToBuild || wordToBuild.trim() === '') {
        wordDisplay.textContent = "Veuillez entrer un mot.";
        return;
    }

    const undefinedChars = wordToBuild.split('').filter(char => !asciiArt[char.toUpperCase()]);
    if (undefinedChars.length > 0) {
        wordDisplay.textContent = `Caractères non définis: ${undefinedChars.join(', ')}`;
        console.warn(`Certains caractères du mot ne sont pas définis dans asciiArt: ${undefinedChars.join(', ')}`);
    }

    isAnimating = true;
    disableUIButtons(true);
    startButton.textContent = "Animation en cours...";

    resetScene(); // Nettoyer la scène avant de commencer
    isPhraseMode = false; // S'assurer que le mode phrase est désactivé

    currentWord = wordToBuild; // Garder la casse originale pour la prononciation
    const normalizedWord = wordToBuild.toUpperCase(); // Pour la recherche ASCII

    const totalWordPixelWidth = (normalizedWord.length * effectiveBaseLetterWidth) + ((normalizedWord.length - 1) * paddingBetweenLetters);
    const startX = (canvas.width / 2) - (totalWordPixelWidth / 2);
    const startY = (canvas.height / 2) - (effectiveBaseLetterHeight / 2);

    await Tone.start();
    console.log('Contexte audio Tone.js démarré.');

    for (let i = 0; i < normalizedWord.length; i++) {
        const char = normalizedWord[i];
        wordDisplay.textContent = currentWord.substring(0, i + 1); // Afficher la partie du mot original

        const targetX = startX + (i * (effectiveBaseLetterWidth + paddingBetweenLetters));
        const targetY = startY;

        const randomX = Math.random() * canvas.width;
        const randomY = Math.random() * canvas.height;

        const letterObj = {
            letter: char,
            currentX: randomX,
            currentY: randomY,
            targetX: targetX,
            targetY: targetY,
            opacity: 0,
            targetOpacity: 1,
            charWidth: baseCharWidth, // Utilisation de la taille de base
            charHeight: baseCharHeight // Utilisation de la taille de base
        };
        letters.push(letterObj);

        const frequency = letterFrequencies[char]; // Utiliser char pour la fréquence (déjà en majuscule si c'est une lettre)
        if (frequency) {
            synth.triggerAttackRelease(frequency, '8n');
        }

        await delay(800); // Délai pour l'animation visuelle et le son de chaque lettre
    }

    // --- Ajout du délai avant la prononciation du mot entier ---
    await delay(500); // Délai de 500ms après la fin de l'animation visuelle
    speakText(wordToBuild); // Prononce le mot entier

    console.log("Visualisation du mot terminée !");
    isAnimating = false;
    disableUIButtons(false);
    startButton.textContent = "Démarrer la Visualisation (AMOUR)";
}

// --- Fonction pour générer un mot aléatoire (via API Groq) ---
async function generateRandomWordFromAPI() {
    disableUIButtons(true);

    try {
        const response = await fetch(`${GROQ_SERVER_URL}/generate-MOT`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Envoyer un corps vide
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        const generatedWord = data.text.trim(); // Le mot généré

        if (generatedWord) {
            customWordInput.value = generatedWord; // Mettre le mot dans le champ personnalisé
            buildWordAnimation(generatedWord); // Animer le mot généré
        } else {
            console.warn("Aucun mot n'a pu être généré par l'API.");
        }
    } catch (error) {
        console.error("Erreur lors de la génération du mot via API:", error);
    } finally {
        disableUIButtons(false);
    }
}

// --- Fonction pour générer une phrase aléatoire (via API Groq) en streaming ---
async function generateRandomPhraseFromAPI() {
    disableUIButtons(true);
    resetScene(); // Nettoyer la scène avant de commencer le streaming
    isPhraseMode = true;
    wordDisplay.textContent = "Génération de la phrase...";
    phraseInput.value = ""; // Clear input field
    currentWord = ""; // Reset current word for streaming

    try {
        const eventSource = new EventSource(`${GROQ_SERVER_URL}/generate-PHRASE`);
        let fullPhrase = '';

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.text) {
                fullPhrase += data.text;
                updatePhraseDisplay(fullPhrase);
                // No delay here, the browser handles the SSE pacing
            }
        };

        eventSource.addEventListener('start', (event) => {
            console.log('Streaming started.');
            wordDisplay.textContent = "Génération de la phrase...";
        });

        eventSource.addEventListener('end', async (event) => {
            console.log('Streaming ended.');
            eventSource.close();
            if (fullPhrase) {
                phraseInput.value = fullPhrase;
                localStorage.setItem('lastPhrase', fullPhrase);
                await delay(300); // Small delay before speaking the complete phrase
                speakText(fullPhrase);
            } else {
                wordDisplay.textContent = "Aucune phrase générée.";
            }
            disableUIButtons(false);
        });

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
            wordDisplay.textContent = `Erreur de streaming: ${error.message || 'Connexion perdue'}`;
            fullPhrase = ''; // Clear phrase on error
            disableUIButtons(false);
        };

    } catch (error) {
        console.error("Erreur lors de la génération de la phrase via API:", error);
        wordDisplay.textContent = `Erreur: ${error.message}`;
        disableUIButtons(false);
    }
}


// --- Module d'entraînement: Afficher une seule lettre ou un mot pour test ---
async function displaySingleLetterTest(clearCanvas = true) {
    const textToSpeak = letterInput.value.trim();
    console.log(`[TEST] displaySingleLetterTest appelé pour le texte: "${textToSpeak}"`);
    
    if (isAnimating) {
        cancelAnimationFrame(animationFrameId);
        isAnimating = false;
        console.log("[TEST] Animation en cours arrêtée pour le test.");
    }
    
    disableUIButtons(false); // Réactiver tous les boutons de contrôle
    startButton.textContent = "Démarrer la Visualisation (AMOUR)";

    if (clearCanvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    letters = []; // Vider le tableau des lettres pour le nouveau test
    testLetterObject = null; // S'assurer que la lettre unique n'est pas affichée
    isPhraseMode = false; // Désactiver le mode phrase

    if (textToSpeak === "") {
        wordDisplay.textContent = "Veuillez entrer une lettre ou un mot.";
        animateCanvas();
        return;
    }

    currentWord = textToSpeak; // Garder la casse originale pour la prononciation
    const normalizedText = textToSpeak.toUpperCase(); // Pour la recherche ASCII

    if (normalizedText.length === 1) {
        // Mode test de lettre/chiffre unique
        const char = normalizedText[0];
        wordDisplay.textContent = `Test de : "${textToSpeak}"`; // Afficher l'original

        if (!asciiArt[char]) {
            console.warn(`[TEST] Aucune définition ASCII art pour le caractère "${char}".`);
            wordDisplay.textContent = `Erreur: "${char}" non défini pour l'ASCII art`;
            
            ctx.fillStyle = '#FF0000'; // Utiliser la couleur rouge pour l'erreur
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Calculer le centre de la "boîte" du caractère pour le '?'
            ctx.fillText('?', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            
            testLetterObject = null; // Pas de lettre unique à afficher
        } else {
            const artWidth = asciiArt[char].reduce((max, line) => Math.max(max, line.length), 0) * baseCharWidth;
            const artHeight = asciiArt[char].length * baseCharHeight;

            const centerX = (canvas.width / 2) - (artWidth / 2);
            const centerY = (canvas.height / 2) - (artHeight / 2);

            testLetterObject = {
                letter: char,
                x: centerX,
                y: centerY,
                opacity: 1,
                charWidth: baseCharWidth,
                charHeight: baseCharHeight
            };
            console.log(`[TEST] Affichage ASCII de "${char}" réussi. Coordonnées: (${centerX}, ${centerY})`);
        }
        // Prononciation immédiate pour une seule lettre
        speakText(textToSpeak);
    } else {
        // Mode test de mot/nombre entier (non animé)
        wordDisplay.textContent = `Test du mot/nombre: "${textToSpeak}"`; // Afficher l'original
        
        const totalWordPixelWidth = (normalizedText.length * effectiveBaseLetterWidth) + ((normalizedText.length - 1) * paddingBetweenLetters);
        const startX = (canvas.width / 2) - (totalWordPixelWidth / 2);
        const startY = (canvas.height / 2) - (effectiveBaseLetterHeight / 2);

        for (let i = 0; i < normalizedText.length; i++) {
            const char = normalizedText[i];
            const targetX = startX + (i * (effectiveBaseLetterWidth + paddingBetweenLetters));
            const targetY = startY;

            if (!asciiArt[char]) {
                console.warn(`[TEST] Caractère "${char}" non défini pour l'ASCII art dans le mot/nombre.`);
                letters.push({
                    letter: '?',
                    currentX: targetX,
                    currentY: targetY,
                    opacity: 1,
                    charWidth: baseCharWidth,
                    charHeight: baseCharHeight
                });
            } else {
                letters.push({
                    letter: char,
                    currentX: targetX,
                    currentY: targetY,
                    opacity: 1,
                    charWidth: baseCharWidth,
                    charHeight: baseCharHeight
                });
            }
        }
        console.log(`[TEST] Affichage ASCII du mot/nombre "${textToSpeak}" réussi.`);
        // --- Ajout du délai avant la prononciation du mot/phrase entier dans le mode test ---
        await delay(300); // Délai de 300ms après l'affichage visuel
        speakText(textToSpeak); // Prononce le mot/phrase entier
    }
}

// --- Fonction pour mettre à jour la visualisation de la phrase sur le canvas ---
// Cette fonction est maintenant utilisée pour le rendu progressif du streaming et pour le rendu instantané des phrases personnalisées.
function updatePhraseDisplay(phraseToDisplay) {
    const normalizedPhrase = phraseToDisplay.toUpperCase();
    wordDisplay.textContent = `Visualisation de la phrase: "${phraseToDisplay}"`;

    const maxCanvasWidth = canvas.width * 0.9; // 90% de la largeur du canvas pour la marge
    const maxCanvasHeight = canvas.height * 0.9; // 90% de la hauteur du canvas pour la marge
    const linePadding = effectiveBaseLetterHeight / 2; // Espacement entre les lignes

    let calculatedCharWidth = baseCharWidth;
    let calculatedCharHeight = baseCharHeight;
    let lines = [];
    let attempt = 0;
    const maxAttempts = 50; // Nombre max de tentatives de redimensionnement
    const scaleStep = 0.9; // Réduire de 10% à chaque itération

    // Fonction interne pour calculer la mise en page avec une taille de caractère donnée
    function calculateLayout(phrase, charW, charH) {
        const words = phrase.split(' ').filter(word => word.length > 0);
        let tempLines = [];
        let currentLineWords = []; // Stocker les mots pour la ligne courante
        
        const effectiveLetterWidthScaled = maxLetterWidthInChars * charW;
        const scaledPaddingBetweenLetters = paddingBetweenLetters * (charW / baseCharWidth);
        const scaledLinePadding = linePadding * (charH / baseCharHeight);
        const maxLinePixelWidth = canvas.width * 0.9; // 90% de la largeur du canvas pour les lignes
        
        // Définir l'espacement entre les mots pour le calcul du layout
        const scaledWordSpacingPixel = 2 * scaledPaddingBetweenLetters; // Deux fois l'espacement entre lettres

        for (const word of words) {
            const wordChars = word.split('');
            
            // Calculer la largeur en pixels du mot lui-même
            const wordContentPixelWidth = wordChars.reduce((sum, char) => {
                return sum + effectiveLetterWidthScaled;
            }, 0) + (wordChars.length > 1 ? (wordChars.length - 1) * scaledPaddingBetweenLetters : 0);

            // Calculer la largeur actuelle de la ligne en pixels
            let currentLinePixelWidth = currentLineWords.reduce((sum, w) => {
                const wChars = w.split('');
                return sum + (wChars.length * effectiveLetterWidthScaled) + (wChars.length > 1 ? (wChars.length - 1) * scaledPaddingBetweenLetters : 0) + scaledWordSpacingPixel;
            }, 0);
            // Soustraire le dernier wordSpacingPixel si ce n'est pas la première itération
            if (currentLineWords.length > 0) {
                currentLinePixelWidth -= scaledWordSpacingPixel;
            }

            // Largeur si le word est ajouté à la ligne courante (avec un espace si nécessaire)
            const potentialNewWidth = currentLinePixelWidth + (currentLineWords.length > 0 ? scaledWordSpacingPixel : 0) + wordContentPixelWidth;

            if (potentialNewWidth <= maxLinePixelWidth || currentLineWords.length === 0) {
                // Le word tient sur la ligne courante ou c'est le premier word de la ligne
                currentLineWords.push(word);
            } else {
                // Le word ne tient pas, commencer une nouvelle ligne
                if (currentLineWords.length > 0) {
                    tempLines.push(currentLineWords);
                }
                currentLineWords = [word]; // Commencer une nouvelle ligne avec ce word
            }
        }
        if (currentLineWords.length > 0) {
            tempLines.push(currentLineWords); // Ajouter la dernière ligne
        }

        let longestLinePixelWidth = 0;
        tempLines.forEach(line => {
            let linePixelWidth = 0;
            line.forEach((w, index) => {
                const wChars = w.split('');
                linePixelWidth += (wChars.length * effectiveLetterWidthScaled) + (wChars.length > 1 ? (wChars.length - 1) * scaledPaddingBetweenLetters : 0);
                if (index < line.length - 1) { // Ajouter l'espacement après chaque word sauf le dernier
                    linePixelWidth += scaledWordSpacingPixel;
                }
            });
            longestLinePixelWidth = Math.max(longestLinePixelWidth, linePixelWidth);
        });

        const totalHeightNeeded = tempLines.length * (maxLetterHeightInLines * charH) + (tempLines.length - 1) * scaledLinePadding;

        return {
            lines: tempLines, // Tableau de tableaux de words
            longestPixelWidth: longestLinePixelWidth,
            totalHeightNeeded: totalHeightNeeded
        };
    }

    let layout = calculateLayout(normalizedPhrase, calculatedCharWidth, calculatedCharHeight);
    
    while (
        (layout.longestPixelWidth > maxCanvasWidth || layout.totalHeightNeeded > maxCanvasHeight) &&
        calculatedCharWidth > 1 && calculatedCharHeight > 1 && attempt < maxAttempts
    ) {
        calculatedCharWidth *= scaleStep;
        calculatedCharHeight *= scaleStep;
        layout = calculateLayout(normalizedPhrase, calculatedCharWidth, calculatedCharHeight);
        attempt++;
    }

    // Vérifier si le layout final s'adapte après les tentatives de redimensionnement
    if (layout.longestPixelWidth <= maxCanvasWidth && layout.totalHeightNeeded <= maxCanvasHeight) {
        // Layout fits
    } else if (normalizedPhrase.length > 0) {
        // Fallback if scaling fails to fit the phrase (e.g., very long single word)
        wordDisplay.textContent = "Phrase trop longue à afficher.";
        letters = []; // Clear letters if it can't fit
        return;
    }

    lines = layout.lines;

    // Recalculer ces valeurs après la boucle de scaling pour s'assurer qu'elles sont à jour
    const finalEffectiveLetterWidthScaled = maxLetterWidthInChars * calculatedCharWidth;
    const finalScaledPaddingBetweenLetters = paddingBetweenLetters * (calculatedCharWidth / baseCharWidth);
    const finalScaledLinePadding = linePadding * (calculatedCharHeight / baseCharHeight);
    const finalWordSpacingPixel = 2 * finalScaledPaddingBetweenLetters; // Espacement entre les words

    // Remplir le tableau des lettres pour le dessin
    let currentY = (canvas.height / 2) - (layout.totalHeightNeeded / 2);
    letters = []; // Clear letters for re-drawing

    lines.forEach((line) => { // Chaque 'line' est un tableau de words
        let linePixelWidth = 0;
        line.forEach((word, wordIndex) => {
            const wordChars = word.split('');
            linePixelWidth += (wordChars.length * finalEffectiveLetterWidthScaled) + (wordChars.length > 1 ? (wordChars.length - 1) * finalScaledPaddingBetweenLetters : 0);
            if (wordIndex < line.length - 1) { // Ajouter l'espacement après chaque word sauf le dernier
                linePixelWidth += finalWordSpacingPixel;
            }
        });

        const startX = (canvas.width / 2) - (linePixelWidth / 2);
        
        let charX = startX;

        line.forEach((word, wordIndex) => {
            const wordChars = word.split('');
            for (let i = 0; i < wordChars.length; i++) {
                const char = wordChars[i];
                
                // Ne pas dessiner les espaces (s'il y en avait, ils seraient traités par wordSpacingPixel)
                // Mais pour les caractères non ASCII art, on peut les dessiner comme '?'
                const charToDraw = asciiArt[char] ? char : '?';

                letters.push({
                    letter: charToDraw,
                    currentX: charX,
                    currentY: currentY,
                    opacity: 1,
                    charWidth: calculatedCharWidth,
                    charHeight: calculatedCharHeight
                });

                charX += finalEffectiveLetterWidthScaled;
                if (i < wordChars.length - 1) { // Espacement entre les lettres du word
                    charX += finalScaledPaddingBetweenLetters;
                }
            }
            if (wordIndex < line.length - 1) { // Espacement entre les words
                charX += finalWordSpacingPixel;
            }
        });
        currentY += (maxLetterHeightInLines * calculatedCharHeight) + finalScaledLinePadding;
    });
}

// --- Fonction pour visualiser une phrase complète (instantanément, avec adaptation de taille) ---
// Cette fonction est désormais utilisée pour les phrases personnalisées et le chargement initial.
async function buildPhraseVisualization(phraseToBuild, doSpeak = true) {
    console.log(`Visualisation de la phrase: "${phraseToBuild}"`);
    if (isAnimating) {
        console.log("L'animation est déjà en cours.");
        return;
    }

    if (!phraseToBuild || phraseToBuild.trim() === '') {
        wordDisplay.textContent = "Veuillez entrer une phrase.";
        resetScene(); // Clear canvas if input is empty
        return;
    }

    localStorage.setItem('lastPhrase', phraseToBuild);
    disableUIButtons(true);
    resetScene();
    isPhraseMode = true;
    currentWord = phraseToBuild;

    // Affiche la phrase entière instantanément
    updatePhraseDisplay(phraseToBuild);

    if (doSpeak) {
        await delay(300); // Petit délai avant de prononcer la phrase complète
        speakText(phraseToBuild);
    }
    disableUIButtons(false);
}


// --- Fonction utilitaire pour la prononciation ---
function speakText(text) {
    if (speechSynth) {
        if (speechSynth.speaking) {
            speechSynth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.pitch = 1.0;
        utterance.rate = 0.8;

        // Attendre que les voix soient chargées si elles ne le sont pas déjà
        if (!voicesLoaded) {
            speechSynth.onvoiceschanged = () => {
                const voices = speechSynth.getVoices();
                frenchVoice = voices.find(voice => voice.lang === 'fr-FR' || voice.lang.startsWith('fr-'));
                if (frenchVoice) {
                    utterance.voice = frenchVoice;
                } else {
                    utterance.voice = voices.find(voice => voice.default) || voices[0];
                    console.warn("Aucune voix française trouvée après chargement, utilisation de la voix par défaut.");
                }
                speechSynth.speak(utterance);
                voicesLoaded = true;
                console.log(`Prononciation de "${text}" via SpeechSynthesis (voix chargée).`);
            };
        } else {
            if (frenchVoice) {
                utterance.voice = frenchVoice;
            } else {
                const voices = speechSynth.getVoices();
                utterance.voice = voices.find(voice => voice.default) || voices[0];
                console.warn("Aucune voix française trouvée, utilisation de la voix par default.");
            }
            speechSynth.speak(utterance);
            console.log(`Prononciation de "${text}" via SpeechSynthesis.`);
        }
    } else {
        console.warn("L'API SpeechSynthesis n'est pas disponible pour la prononciation.");
    }
}

// --- Fonction pour activer/désactiver les boutons UI ---
function disableUIButtons(disable) {
    startButton.disabled = disable;
    generateRandomWordButton.disabled = disable;
    customWordInput.disabled = disable;
    buildCustomWordButton.disabled = disable;
    testLetterButton.disabled = disable;
    letterInput.disabled = disable;
    phraseInput.disabled = disable;
    buildCustomPhraseButton.disabled = disable;
    applyColorButton.disabled = disable; // Disable color button too
    generateRandomPhraseButton.disabled = disable; // Disable new phrase button
}

// --- Fonction pour mettre à jour la couleur et l'aperçu ---
function updateColorPreview() {
    currentColor.r = parseInt(redSlider.value);
    currentColor.g = parseInt(greenSlider.value);
    currentColor.b = parseInt(blueSlider.value);

    redValueSpan.textContent = currentColor.r;
    greenValueSpan.textContent = currentColor.g;
    blueValueSpan.textContent = currentColor.b;

    colorPreview.style.backgroundColor = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
    
    // Force redraw of current content with new color
    if (isPhraseMode && currentWord) {
        updatePhraseDisplay(currentWord); // Re-visualize with new color
    } else if (testLetterObject || (letters.length > 0 && !isAnimating)) {
        // If a single letter is tested or a word is displayed statically
        // We can just rely on animateCanvas to redraw with new color
        // No explicit function call needed here as animateCanvas runs continuously
    }
}


// --- Initialisation au chargement de la fenêtre ---
window.onload = function () {
    initCanvas();
    initToneJS();
    initSpeechSynthesis(); // Initialisation de la synthèse vocale

    startButton.addEventListener('click', () => buildWordAnimation("AMOUR"));
    generateRandomWordButton.addEventListener('click', generateRandomWordFromAPI);
    buildCustomWordButton.addEventListener('click', () => buildWordAnimation(customWordInput.value));
    letterInput.addEventListener('input', () => displaySingleLetterTest(true)); // Teste en temps réel
    testLetterButton.addEventListener('click', () => displaySingleLetterTest(true)); // Force le test

    buildCustomPhraseButton.addEventListener('click', () => {
        buildPhraseVisualization(phraseInput.value, true); // Visualisation avec prononciation
    });

    // Écouteurs pour les sliders de couleur
    redSlider.addEventListener('input', updateColorPreview);
    greenSlider.addEventListener('input', updateColorPreview);
    blueSlider.addEventListener('input', updateColorPreview);
    applyColorButton.addEventListener('click', updateColorPreview); // Force update on click

    // Nouvel écouteur pour la génération de phrase aléatoire (maintenant en streaming)
    generateRandomPhraseButton.addEventListener('click', generateRandomPhraseFromAPI);


    // Charger la phrase sauvegardée au démarrage
    const savedPhrase = localStorage.getItem('lastPhrase');
    if (savedPhrase) {
        phraseInput.value = savedPhrase;
        updatePhraseDisplay(savedPhrase); // Visualisation sans prononciation au chargement
    } else {
        // Afficher un mot par défaut au chargement si aucune phrase sauvegardée
        displaySingleLetterTest(true);
    }

    // Initialiser les sliders et l'aperçu de couleur avec la couleur par défaut
    redSlider.value = currentColor.r;
    greenSlider.value = currentColor.g;
    blueSlider.value = currentColor.b;
    updateColorPreview(); // Set initial color on canvas and preview
    
    console.log('Écouteurs des boutons attachés.');
};
