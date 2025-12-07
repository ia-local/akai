/**
 * MEDIA DESKTOP CONTROLLER (V2.5 FINAL)
 * Orchestre le bureau virtuel, les modales et le DataManager.
 */

// Import correct grâce au 'export' ajouté dans dataManager.js
import { ModalSystem } from './ui/modalSystem.js';
import { DataManager } from './dataManager.js'; 

// Initialisation des instances
// Note: io() suppose que le script socket.io est chargé dans le HTML
const socket = (typeof io !== 'undefined') ? io() : null; 
const modalSystem = new ModalSystem();
const dataManager = new DataManager(); // Instance unique

let currentView = 'desktop';

// --- LOGIQUE MIDI STATUS ---
function updateMidiStatus(isConnected) {
    const statusDot = document.getElementById('status-midi');
    if (statusDot) {
        statusDot.classList.remove('status-online', 'status-offline');
        statusDot.classList.add(isConnected ? 'status-online' : 'status-offline');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialisation Socket.io et Écoute Statut MIDI
    if(socket) {
        // Le statut du contrôleur MIDI est généralement lié au statut du serveur Socket
        socket.on('connect', () => {
            console.log("✅ Desktop: Connected to Socket Server");
            updateMidiStatus(true);
        });
        socket.on('disconnect', () => {
            console.warn("❌ Desktop: Disconnected from Socket Server");
            updateMidiStatus(false);
        });
        // Initialiser l'état au chargement (si déjà connecté)
        updateMidiStatus(socket.connected); 
        
    } else {
        console.warn("⚠️ Socket.io non détecté.");
    }

    // 2. Chargement des données (Await est crucial ici)
    await dataManager.init();

    // 3. Initialisation Interface
    renderDesktop(); // Vue par défaut
    initBrowserAside();
    
    // Rendre le dataManager accessible globalement pour les onclick HTML (previewAsset)
    window.currentDataManager = dataManager;
});

// --- NOUVELLE FONCTION CENTRALE DE ROUTAGE ---
function routeModule(type, link) {
    if (link) {
        // Logique de Redirection vers le fichier HTML externe
        // Le chemin est relatif à la racine statique du serveur (déjà configurée)
        const redirectPath = `/html/${link}`; 
        console.log(`🧭 ROUTING: Redirection vers ${redirectPath}`);
        
        // Pour simuler la transition MIDI globale, on pourrait ajouter une transition ici
        // (La fonction main.js gère la transition en général, mais on le fait ici pour la cohérence)
        document.body.classList.add('studio-fade-out'); 
        
        setTimeout(() => {
            window.location.href = redirectPath;
        }, 100); // Délai court pour la transition locale
        
    } else {
        // Ouverture de la Modale (Server, MIDI, AI)
        openModuleModal(type);
    }
}


// --- GESTION DES ICÔNES BUREAU (Vue Desktop) ---
function renderDesktop() {
    currentView = 'desktop';
    const container = document.getElementById('desktop-container');
    
    if(!container) return;

    // Reset Grid Style
    container.className = "desktop-grid"; 
    
    // Utiliser la structure HTML existante (maintenant sémantique ul/li)

    initDesktopIconsListeners();
}

function initDesktopIconsListeners() {
    // La sélection doit cibler les éléments LI qui ont le rôle de bouton
    const icons = document.querySelectorAll('#desktop-container > li');
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            const moduleType = icon.dataset.module;
            const moduleLink = icon.dataset.link; // Récupère l'attribut data-link
            
            routeModule(moduleType, moduleLink);
        });
    });
}

// --- GESTION DE L'ASIDE BROWSER (Navigation) ---
function initBrowserAside() {
    const folders = document.querySelectorAll('.folder-item');
    folders.forEach(folder => {
        folder.addEventListener('click', () => {
            // Style Active
            folders.forEach(f => f.classList.remove('text-white', 'bg-[#333]'));
            folder.classList.add('text-white', 'bg-[#333]');

            const category = folder.dataset.category;
            loadCategoryView(category);
        });
    });
}

// --- CHARGEMENT DE LA VUE CATEGORIE ---
function loadCategoryView(category) {
    currentView = 'browser';
    const container = document.getElementById('desktop-container');
    
    // Loader Visuel
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
            <span class="text-4xl mb-2 animate-spin">⟳</span>
            <span>Scanning /data/${category}...</span>
        </div>`;

    // Simulation Latence pour effet "OS"
    setTimeout(() => {
        // Appel à la méthode qui manquait dans dataManager.js
        const assets = dataManager.getAssetsByCategory(category);
        renderMediaGrid(assets, category);
        updateInspector(category, assets.length);
    }, 200);
}

// --- RENDU DE LA GRILLE MEDIA ---
function renderMediaGrid(assets, category) {
    const container = document.getElementById('desktop-container');
    // Le container redevient une grille simple de div pour le contenu media, ce qui est correct.
    container.className = "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"; 

    let html = `
        <div class="col-span-full flex justify-between items-center border-b border-gray-700 pb-2 mb-2 sticky top-0 bg-[#0d0d0d] z-10">
            <div class="flex items-center gap-2">
                <button id="back-btn" class="text-gray-400 hover:text-white text-xs px-2 py-1 bg-[#222] rounded flex items-center gap-1 border border-gray-600 transition-colors">
                    <span>⬅</span> BACK
                </button>
                <span class="text-blue-400 font-bold uppercase text-sm">/ ${category}</span>
                <span class="text-gray-600 text-xs ml-2">(${assets.length} items)</span>
            </div>
            <div class="text-[10px] text-gray-500">SORT: DATE ▼</div>
        </div>
    `;

    if (!assets || assets.length === 0) {
        html += `<div class="col-span-full text-center text-gray-600 italic mt-10">Folder is empty.</div>`;
    } else {
        assets.forEach(asset => {
            html += createAssetCard(asset);
        });
    }

    container.innerHTML = html;

    // Attachement événements
    const backBtn = document.getElementById('back-btn');
    if(backBtn) backBtn.addEventListener('click', renderDesktop);
    
    document.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('dblclick', () => window.previewAsset(card.dataset.id));
    });
}

function createAssetCard(asset) {
    let icon = '📄';
    let color = 'text-gray-600';
    let cat = asset.category ? asset.category.toUpperCase() : 'FILE';
    
    if (cat === 'VIDEO') { icon = '🎬'; color = 'text-blue-500'; }
    if (cat === 'AUDIO') { icon = '🎵'; color = 'text-green-500'; }
    if (cat === 'VISUEL' || cat === 'IMAGE') { icon = '🖼️'; color = 'text-yellow-500'; }
    if (cat === 'ASCII') { icon = '👾'; color = 'text-pink-500'; }

    return `
        <div class="media-card bg-[#1a1a1a] rounded border border-[#333] hover:border-blue-500 cursor-pointer overflow-hidden group relative h-28 flex flex-col justify-between p-2 transition-all hover:bg-[#222]" data-id="${asset.id}">
            <div class="flex justify-center items-center flex-1 text-3xl ${color}">${icon}</div>
            <div class="text-[10px] text-gray-300 truncate w-full text-center font-mono bg-black/50 rounded px-1 py-0.5">${asset.name}</div>
        </div>
    `;
}

function updateInspector(category, count) {
    const inspector = document.getElementById('inspector-content');
    if(!inspector) return;

    inspector.innerHTML = `
        <div class="mb-4">
            <h4 class="font-bold text-white uppercase text-xs">Current View</h4>
            <div class="text-blue-400 font-mono text-sm">/data/${category}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
            <div class="bg-black p-2 rounded">Count: <span class="text-white">${count}</span></div>
            <div class="bg-black p-2 rounded">Type: <span class="text-white">${category.toUpperCase()}</span></div>
        </div>
    `;
}

// --- GLOBALE : PREVIEW ASSET ---
window.previewAsset = (id) => {
    // Utilisation de l'instance stockée dans window ou via module si scope accessible
    const asset = dataManager.getAssetById(id);
    if (!asset) return;
    
    let content = `<div class="p-8 text-center text-gray-400 font-mono">No Preview Available</div>`;
    const url = dataManager._getAbsoluteAssetUrl(asset.url); // Appel sécurisé

    if (asset.category === 'VISUEL' || asset.category === 'IMAGE') {
        content = `<img src="${url}" class="max-h-[60vh] mx-auto border border-gray-700 shadow-2xl">`;
    } 
    if (asset.category === 'VIDEO') {
        content = `<video src="${url}" controls autoplay class="max-h-[60vh] w-full border border-gray-700 shadow-2xl"></video>`;
    }
    
    modalSystem.show(asset.name, `<div class="flex justify-center bg-black p-4 min-h-[300px] items-center">${content}</div>`);
};

// --- CONTENU DES MODALES MODULES ---
function openModuleModal(type) {
    let title = "";
    let content = "";
    let footer = ""; 
    
    switch(type) {
        case 'server':
            title = "DATA SERVER MONITOR";
            // Récupération dynamique des stats depuis DataManager
            // Utilisation de safe navigation (?.) au cas où les tableaux sont vides
            const stats = {
                video: dataManager.assets.video?.length || 0,
                audio: dataManager.assets.audio?.length || 0,
                img: dataManager.assets.images?.length || 0,
                scripts: dataManager.assets.scripts?.length || 0,
                total: dataManager.allAssets?.length || 0
            };
            
            content = `
                <div class="grid grid-cols-2 gap-4 p-4">
                    <div class="bg-[#111] p-3 rounded border border-gray-700">
                        <div class="text-xs text-gray-500 uppercase">Total Assets</div>
                        <div class="text-2xl text-blue-400 font-mono">${stats.total}</div>
                    </div>
                    <div class="bg-[#111] p-3 rounded border border-gray-700">
                        <div class="text-xs text-gray-500 uppercase">System Uptime</div>
                        <div class="text-xl text-green-400 font-mono">ONLINE</div>
                    </div>
                    <div class="col-span-2 bg-[#1a1a1a] p-3 rounded space-y-1">
                        <div class="flex justify-between text-xs border-b border-gray-800 pb-1"><span>🎬 Video Clips</span> <span class="text-white font-mono">${stats.video}</span></div>
                        <div class="flex justify-between text-xs border-b border-gray-800 pb-1"><span>🎵 Audio Tracks</span> <span class="text-white font-mono">${stats.audio}</span></div>
                        <div class="flex justify-between text-xs border-b border-gray-800 pb-1"><span>🖼️ Images</span> <span class="text-white font-mono">${stats.img}</span></div>
                        <div class="flex justify-between text-xs pt-1"><span>📜 Scripts</span> <span class="text-white font-mono">${stats.scripts}</span></div>
                    </div>
                </div>`;
            break;
            
        case 'midi':
            title = "AKAI MPD218 CONFIG";
            
            // Logique pour déterminer l'état de la connexion MIDI pour la modale
            const midiStatus = socket && socket.connected ? "Connecté" : "Déconnecté";
            const statusColor = socket && socket.connected ? "text-green-500" : "text-red-500";
            
            content = `
                <div class="p-6 flex flex-col items-center">
                    <div class="mb-4 text-center">
                        <div class="text-sm font-bold text-gray-400">Statut: <span class="${statusColor}">${midiStatus}</span></div>
                        <div class="text-[10px] text-gray-600">via Socket.IO (localhost:3145)</div>
                    </div>
                    <div class="grid grid-cols-4 gap-2 mb-6 p-4 bg-[#111] rounded border border-gray-700 shadow-lg">
                        ${Array(16).fill(0).map((_, i) => 
                            `<div class="w-12 h-12 bg-[#2a2a2a] rounded flex items-center justify-center text-[10px] text-gray-600 font-bold border border-[#333]">P${i+1}</div>`
                        ).join('')}
                    </div>
                    <div class="text-xs text-gray-500">Les Pads MIDI 8-13 contrôlent la navigation principale.</div>
                </div>`;
            break;

        case 'keyboard':
             title = "SHORTCUT MAPPER";
             content = `<div class="p-4 text-xs text-gray-400 font-mono">
                [SPACE] Play/Pause<br>
                [Q] Quantum Mode<br>
                [TAB] AI Assistant
             </div>`;
             break;

        case 'quantum':
             title = "QUANTUM CPU";
             content = `<div class="p-8 text-center"><span class="text-purple-500 text-4xl animate-pulse">⚛️</span><br><span class="text-xs text-gray-500 mt-2">Computing Probabilities...</span></div>`;
             break;

        case 'ai':
             title = "NEURAL AGENT";
             content = `<div class="p-8 text-center"><span class="text-green-500 text-4xl">🧠</span><br><span class="text-xs text-gray-500 mt-2">Agent Ready. Waiting for prompt.</span></div>`;
             break;
             
        default:
             title = "MODULE INFO";
             content = `<div class="p-4 text-gray-500">Module ${type} non encore implémenté.</div>`;
    }

    if(title) modalSystem.show(title, content, footer);
}