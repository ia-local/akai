// Menu.js (à la racine du projet)
const { app, shell, Menu, MenuItem, BrowserWindow } = require('electron');

// Détecte si nous sommes en mode développement (pour afficher les outils de dev dans le menu)
const isDev = process.env.NODE_ENV !== 'production';

function createWindow(filePath, options = {}) {
  const window = new BrowserWindow({
    width: 987,
    height: 610,
    ...options,
  });

  // Load the file *after* the window is created
  window.loadFile(path.join(__dirname, filePath)); // Load the file

  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load ${filePath}: ${errorDescription} (Error Code: ${errorCode})`);
    // ... (Your error handling code)
  });

  return window;
}

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
        label: 'Sutdio',
        submenu: [
            {
            label: 'DATA',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/media_data.html');
            }
            },
            { type: 'separator' },
            {
            label: 'CODE',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/code_timeline.html');
            }
            },
            { type: 'separator' },
            {
            label: 'EDIT',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/fusion_visuel.html');
            }
            },
            { type: 'separator' },
            {
            label: 'FUSION',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/fusion_visuel.html');
            }
            },
            { type: 'separator' },
            {
            label: 'FAIRLIGHT',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/fairlight_audio.html');
            }
            },
            { type: 'separator' },            
            {
            label: 'DELIVERY',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/delivery.html');
            }
            }
        ]
    },
    {
        label: 'Quantum',
        submenu: [
{
                label: 'QUANTUM COMPUTE',
                accelerator: 'CmdOrCtrl+Shift+Q', // Petit raccourci clavier bonus
                click: () => {
                    // CRÉATION DE LA FENÊTRE AVEC LE RATIO D'OR (FIBONACCI)
                    // Largeur 987 / Hauteur 610 ≈ 1.618 (Phi)
                    const win = new BrowserWindow({ 
                        width: 987, 
                        height: 610, 
                        minWidth: 610, // On garde les proportions minimales
                        minHeight: 377,
                        webPreferences: { 
                            nodeIntegration: true, 
                            contextIsolation: false 
                        },
                        backgroundColor: '#0d0d0d', // Fond noir pour éviter le flash blanc
                        title: "Quantum Compute Engine [Phi Ratio]"
                    });
                    
                    win.loadFile('public/html/quantum_compute.html'); 
                }
            },
            {
            label: 'INDEX',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/index.html');
            }
            },
            {
            label: 'Prev',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/slider_ia_prev.html');
            }
            },
            {
            label: 'Next',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/slider_ia_next.html');
            }
            },
            { type: 'separator' },
            {
            label: 'Config',
            click: () => {
              // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
              const aboutWindow = new BrowserWindow({ /* ... */ });
              aboutWindow.loadFile('public/html/config.html');
            }
            },
        ]
    },
    {
      label: 'Models',
      submenu: [
        {
          label: 'Groq',
          role:'system',
          models:'',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
        {
          label: 'llama',
          models:'llama-3.1-8b-instant',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
        {
          label: 'Gemini',
          models:'gemini-3-pro-preview',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },

        {
          label: 'Qwant',
          models:'qwen/qwen3-32b',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
        { type: 'separator' },
        {
          label: '🧑‍🎤 Avatars',
          models:'anonymous-7b-ar',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
                {
          label: '🎨 Images',
          models:'gemini-3-pro-image-preview',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
        {
          label: '💿 video',
          models:'  VEO_FAST = veo-3.1-fast-generate-preview',
          models:'VEO = veo-3.1-generate-preview',
          click: () => {
            // Affichez une boîte de dialogue ou une fenêtre avec les informations "À propos"
            const aboutWindow = new BrowserWindow({ /* ... */ });
            aboutWindow.loadFile('models/about.html');
          }
        },
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