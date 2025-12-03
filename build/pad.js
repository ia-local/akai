const socket = io(); // Se connecte au serveur WebSocket

// Écoute les événements 'midi_event' du serveur
socket.on('midi_event', (data) => {
    if (data.address.startsWith('/pad/')) {
        // Extrait le numéro du pad de l'adresse OSC (ex: /pad/0/press -> 0)
        const padNumber = parseInt(data.address.split('/')[2]); 
        
        // Les pads MIDI sont souvent 0-15. Votre HTML utilise 1-16.
        // Assurez-vous que le mapping correspond.
        // Si Sonic Pi envoie /pad/0/press pour le premier pad, alors en HTML il faut #pad1.
        // Il y a un décalage entre les pads Sonic Pi (0-15) et votre image (1-16).
        // On va assumer que le Pad 0 de MIDI est le Pad 1 de votre interface pour l'exemple.
        const htmlPadId = `pad${padNumber + 1}`; 
        const padElement = document.getElementById(htmlPadId);

        if (padElement) {
            padElement.classList.add('active'); // Ajoute la classe 'active'
            setTimeout(() => {
                padElement.classList.remove('active'); // Retire la classe après un court délai
            }, 100); // Durée de l'effet lumineux en millisecondes
        }
    }
});