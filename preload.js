// preload.js (à la racine du projet)

const { contextBridge, ipcRenderer } = require('electron');

// Expose des fonctions spécifiques au monde du rendu via le contexte bridge.
// Le renderer (frontend) pourra appeler ces fonctions sans avoir un accès direct à Node.js.
contextBridge.exposeInMainWorld('electronAPI', {
    // Exemple de fonction pour envoyer un message au processus principal
    sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),
    // Exemple de fonction pour écouter des messages du processus principal
    onMessage: (callback) => ipcRenderer.on('message-from-main', (event, ...args) => callback(...args)),
    // Ajoutez ici d'autres fonctions que votre frontend pourrait avoir besoin d'appeler
    // pour interagir avec le système ou le backend via le processus principal.
});