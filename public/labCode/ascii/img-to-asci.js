const Jimp = require('jimp');
const fs = require('fs');
const ascii = require('ascii-image-converter');

// Chemin vers l'image d'entrée et le fichier de sortie
const inputImagePath = 'data/example.webp';
const outputAsciiPath = 'output/ascii.txt';

// Fonction pour convertir l'image en ASCII
async function convertImageToAscii() {
  try {
    // Charger l'image avec Jimp
    const image = await Jimp.read(inputImagePath);
    
    // Redimensionner l'image (facultatif, adapté à la taille d'affichage ASCII)
    image.resize(100, Jimp.AUTO); // Redimensionne à une largeur de 100 pixels, conserve le ratio

    // Convertir l'image en buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    // Convertir le buffer de l'image en ASCII
    const asciiArt = await ascii.convert(buffer, {
      width: 100,  // Largeur de l'ASCII
      height: 100, // Hauteur de l'ASCII
    });

    // Écrire le résultat dans le fichier de sortie
    fs.writeFileSync(outputAsciiPath, asciiArt);
    console.log(`L'image a été convertie en ASCII et enregistrée dans ${outputAsciiPath}`);
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image en ASCII:', error);
  }
}

// Appeler la fonction pour démarrer le processus de conversion
convertImageToAscii();
