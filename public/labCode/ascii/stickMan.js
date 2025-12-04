const stickman = [
    [' ', ' ', '█', ' ', ' '],
    ['█', '█', '█', '█', '█'],
    [' ', ' ', '█', ' ', ' '],
    ['█', ' ', ' ', ' ', '█'],
    ['█', '█', '█', '█', '█']
  ];
// Définir les éléments du personnage
const tete = [' ', ' ', '░', '░', ' ', ' '];
const corps = [
    [' ', '░', '░', '░', '░', ' '],
    ['░', '░', '░', '░', '░', '░'],
];
const brasGauche = [' ', '/', '░'];
const brasDroit = [' ', '\\', '░'];
const jambeGauche = ['/', '░', '░'];
const jambeDroite = ['\\', '░', '░'];

// Assembler le personnage
const personnage = [
  ...tete,
  ...corps,
  brasGauche,
  brasDroit,
  jambeGauche,
  jambeDroite,
];

// Fonction pour afficher le personnage
function afficherPersonnage(personnage) {
  let output = '';
  personnage.forEach(ligne => {
    output += ligne.join('') + '\n';
  });
  console.log(output);
}

afficherPersonnage(personnage);
  function drawStickman(stickman) {
    let output = '';
    stickman.forEach(row => {
      output += row.join('') + '\n';
    });
    return output;
  }
  
  console.log(drawStickman(stickman));