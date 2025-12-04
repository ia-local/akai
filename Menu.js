// Menu.js (à la racine du projet)
const { app, shell, Menu, MenuItem, BrowserWindow } = require('electron');
const path = require('path'); // Nécessaire pour les chemins

// Détecte si nous sommes en mode développement
const isDev = process.env.NODE_ENV !== 'production';

// Fonction utilitaire pour créer des fenêtres
function createSecondaryWindow(filePath, title = "Studio AV") {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#121212',
        title: title,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // À adapter selon tes besoins de sécurité
        }
    });
    // On remonte d'un niveau si on est dans public/html, sinon chemin direct
    // Ici on utilise path.join pour être sûr
    win.loadFile(path.join(__dirname, filePath));
    return win;
}

const template = [
    {
        label: 'Fichier',
        submenu: [
            { label: 'Nouveau', accelerator: 'CmdOrCtrl+N', click: () => console.log('Nouveau fichier') },
            { label: 'Ouvrir', accelerator: 'CmdOrCtrl+O', click: () => console.log('Ouvrir fichier') },
            { type: 'separator' },
            { label: 'Enregistrer', accelerator: 'CmdOrCtrl+S', click: () => console.log('Enregistrer') },
            { label: 'Enregistrer sous...', click: () => console.log('Enregistrer sous') },
            { type: 'separator' },
            { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
        ]
    },
    {
        label: 'Édition',
        submenu: [
            { role: 'undo', label: 'Annuler' },
            { role: 'redo', label: 'Rétablir' },
            { type: 'separator' },
            { role: 'cut', label: 'Couper' },
            { role: 'copy', label: 'Copier' },
            { role: 'paste', label: 'Coller' },
            { role: 'delete', label: 'Supprimer' },
            { type: 'separator' },
            { role: 'selectAll', label: 'Tout sélectionner' }
        ]
    },
    {
        label: 'Studio', // Correction typo (Sutdio -> Studio)
        submenu: [
            {
                label: '📁 DATA (Media Pool)',
                accelerator: 'CmdOrCtrl+1',
                click: () => createSecondaryWindow('public/html/media_data.html', 'Studio AV - Data Manager')
            },
            { type: 'separator' },
            {
                label: '✂️ EDIT (Timeline)', // Redirection logique vers cut_timeline
                accelerator: 'CmdOrCtrl+2',
                click: () => createSecondaryWindow('public/html/cut_timeline.html', 'Studio AV - Timeline Editor')
            },
            { type: 'separator' },
            {
                label: '🎨 FUSION (Compositing)',
                accelerator: 'CmdOrCtrl+3',
                click: () => createSecondaryWindow('public/html/fusion_visuel.html', 'Studio AV - Fusion Engine')
            },
            { type: 'separator' },
            {
                label: '🎵 FAIRLIGHT (Audio)',
                accelerator: 'CmdOrCtrl+4',
                click: () => createSecondaryWindow('public/html/fairlight_audio.html', 'Studio AV - Audio Mixer')
            },
            { type: 'separator' },            
            {
                label: '🚀 DELIVERY (Export)',
                accelerator: 'CmdOrCtrl+5',
                click: () => createSecondaryWindow('public/html/delivery.html', 'Studio AV - Delivery')
            },
            { type: 'separator' },
            {
                label: '📜 CODE (Editor)',
                click: () => createSecondaryWindow('public/html/code_timeline.html', 'Studio AV - Code Editor')
            }
        ]
    },
    {
        label: 'Quantum',
        submenu: [
            {
                label: 'QUANTUM COMPUTE',
                accelerator: 'CmdOrCtrl+Shift+Q',
                click: () => {
                    const win = new BrowserWindow({ 
                        width: 987, 
                        height: 610, 
                        minWidth: 610,
                        minHeight: 377,
                        webPreferences: { nodeIntegration: true, contextIsolation: false },
                        backgroundColor: '#0d0d0d',
                        title: "Quantum Compute Engine [Phi Ratio]"
                    });
                    win.loadFile(path.join(__dirname, 'public/html/quantum_compute.html')); 
                }
            },
            { label: 'INDEX', click: () => createSecondaryWindow('public/index.html') },
            { type: 'separator' },
            { label: 'Config', click: () => createSecondaryWindow('public/html/config.html') },
        ]
    },
    {
      label: 'Models (IA)',
      submenu: [
        { label: 'Groq API', click: () => createSecondaryWindow('models/about.html') },
        { label: 'Llama 3.1', click: () => console.log('Model Llama Selected') },
        { label: 'Gemini Pro', click: () => console.log('Model Gemini Selected') },
        { type: 'separator' },
        { label: 'Video Gen (Veo)', click: () => console.log('Veo Selected') }
      ]
    },  
    {
        label: 'Vue',
        submenu: [
            { role: 'reload', label: 'Recharger' },
            { role: 'toggleDevTools', label: 'Outils de développement' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Fenêtre',
        submenu: [
            { role: 'minimize', label: 'Réduire' },
            { role: 'close', label: 'Fermer' }
        ]
    },
    {
        label: 'Aide',
        submenu: [
            {
                label: '📚 Documentation Technique',
                accelerator: 'F1',
                click: () => {
                    // Ouvre la documentation locale que nous avons créée dans /docs
                    const docWin = new BrowserWindow({
                        width: 1024, 
                        height: 768,
                        title: "Studio AV - Documentation",
                        autoHideMenuBar: true
                    });
                    docWin.loadFile(path.join(__dirname, 'docs/index.html'));
                }
            },
            { type: 'separator' },
            {
                label: 'GitHub du projet',
                click: async () => { await shell.openExternal('https://github.com/ia-local/akai/'); }
            }
        ]
    }
];

// Menu spécifique à macOS (inchangé, juste pour rappel)
if (process.platform === 'darwin') {
    template.unshift({
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    });
}

const appMenu = Menu.buildFromTemplate(template);
module.exports = appMenu;