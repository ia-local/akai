// Menu.js (à la racine du projet)

const { app, shell, Menu } = require('electron'); // <-- AJOUTER 'Menu' ici !

// Détecte si nous sommes en mode développement (pour afficher les outils de dev dans le menu)
const isDev = process.env.NODE_ENV !== 'production';

const template = [
    // ... (votre code de menu existant) ...
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
        label: 'Vue',
        submenu: [
            { role: 'reload', label: 'Recharger' },
            { role: 'forceReload', label: 'Forcer le rechargement' },
            // Gardons l'option DevTools dans le menu 'Vue' pour un accès manuel
            { role: 'toggleDevTools', label: 'Outils de développement' },
            { type: 'separator' },
            { role: 'resetZoom', label: 'Réinitialiser le zoom' },
            { role: 'zoomIn', label: 'Zoom avant' },
            { role: 'zoomOut', label: 'Zoom arrière' },
            { type: 'separator' },
            { role: 'togglefullscreen', label: 'Plein écran' }
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
                label: 'En savoir plus sur Electron',
                click: async () => {
                    await shell.openExternal('https://electronjs.org');
                }
            },
            {
                label: 'GitHub du projet',
                click: async () => {
                    await shell.openExternal('https://github.com/[VotreOrganisation]/[VotreRepo]');
                }
            }
        ]
    }
];

// Menu spécifique à macOS
if (process.platform === 'darwin') {
    template.unshift({
        label: app.name,
        submenu: [
            { role: 'about', label: `À propos de ${app.name}` },
            { type: 'separator' },
            { role: 'services', submenu: [] },
            { type: 'separator' },
            { role: 'hide', label: `Masquer ${app.name}` },
            { role: 'hideOthers', label: 'Masquer les autres' },
            { role: 'unhide', label: 'Afficher tout' },
            { type: 'separator' },
            { role: 'quit', label: 'Quitter' }
        ]
    });

    // Supprimer le sous-menu "Développement" du template macOS si non souhaité
    // Ou le rendre conditionnel si vous voulez un menu "Développement" séparé pour macOS en dev
    /*
    if (isDev) {
        template.push({
            label: 'Développement',
            submenu: [
                { role: 'toggledevtools', label: 'Outils de développement' },
                { role: 'reload', label: 'Recharger' },
                { role: 'forcereload', label: 'Forcer le rechargement' }
            ]
        });
    }
    */
}

const appMenu = Menu.buildFromTemplate(template);

module.exports = appMenu;