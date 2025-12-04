const personnage = [
    ['\\',' 0',' '], // Tête et épaules
    ['','│','\\'], // Bras
    ['/',' ','\\'] // Corps et jambes
  ];
  
  function afficherPersonnage(personnage) {
    let output = '';
    personnage.forEach(ligne => {
      output += ligne.join('') + '<br>'; // Utiliser <br> pour les sauts de ligne en HTML
    });
    document.getElementById('stickman-container').innerHTML = output;
  }
  
  // Sélectionner l'élément HTML où afficher le personnage
  const container = document.getElementById('stickman-container');
  
  // Afficher le personnage
  afficherPersonnage(personnage);