const personnage = [
    [' ', ' ', ' ', '█', ' ', ' '],
    [' ', ' ', '█', '█', '█', ' '],
    [' ', '█', '█', '█', '█', ' '],
    ['█', '█', '█', '█', '█', '█'],
    [' ', ' ', '█', ' ', ' ', ' '],
    [' ', ' ', '█', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', 'O', ' '] // ball
  ];
  
  // Pour ajouter des bras et des jambes :
  const brasGauche = [' ', '/', ' '];
  const brasDroit = [' ', '\\', ' '];
  const jambeGauche = ['/', ' ', ' '];
  const jambeDroite = ['\\', ' ', ' '];
  
  // Fonction pour afficher le personnage
  function afficherPersonnage(personnage) {
    let output = '';
    personnage.forEach(ligne => {
      output += ligne.join('') + '\n';
    });
    console.log(output);
  }
  
  afficherPersonnage(personnage);