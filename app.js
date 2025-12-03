// main.js (à la racine du projet)

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// La variable isDev n'est plus utilisée pour l'ouverture automatique des DevTools
// const isDev = process.env.NODE_ENV !== 'production';
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

    // --- C'est ici que le changement intervient ! ---
    // Supprimez ou commentez la ligne suivante pour empêcher l'ouverture automatique des DevTools au démarrage :
    /*
    if (isDev) {
        mainWindow.webContents.openDevTools();
        console.log("DevTools ouverts car l'application est en mode développement.");
    } else {
        console.log("DevTools non ouverts car l'application est en mode production.");
    }
    */
    // Les DevTools ne s'ouvriront plus automatiquement au lancement de la fenêtre.
    // Ils seront accessibles uniquement via le menu "Vue > Outils de développement".
    // ----------------------------------------------------

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    const appMenu = require('./Menu');
    Menu.setApplicationMenu(appMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- Communication Inter-Processus (IPC) ---
ipcMain.on('message-from-renderer', (event, arg) => {
    console.log(`Message du renderer: ${arg}`);
    event.reply('message-from-main', 'Bien reçu du processus principal !');
});