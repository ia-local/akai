/**
 * STUDIO AV DOCS - SPA CONTROLLER (v3.0 SECTION DISPLAY)
 * Gestion d'affichage Synchrone (Display None/Block)
 */

// --- CONFIGURATION ---
const sectionsIds = ['intro', 'install', 'architecture', 'quantum', 'midi', 'api', 'ai'];

// --- DOM ELEMENTS ---
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const allNavLinks = document.querySelectorAll('nav a, aside a');
const allSections = document.querySelectorAll('main section');
const mainContainer = document.querySelector('main');

// --- 1. CORE : SHOW SECTION ---
function activateSection(targetId) {
    // 1. Masquer toutes les sections
    allSections.forEach(sec => {
        sec.classList.remove('active-section');
    });

    // 2. Afficher la cible
    const targetSec = document.getElementById(targetId);
    if (targetSec) {
        targetSec.classList.add('active-section');
        // Reset scroll du container main (remet en haut de page)
        mainContainer.scrollTop = 0; 
    }

    // 3. Mise à jour des Menus (Classes CSS)
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${targetId}`) {
            link.classList.add('active');
        }
    });

    // 4. Mise à jour Pagination
    const index = sectionsIds.indexOf(targetId);
    if (index !== -1) updatePaginationButtons(index);
}

// --- 2. CLICK HANDLERS (NAVIGATION) ---
allNavLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        if (this.getAttribute('target') === '_blank') return;
        
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1); // Enlève le #
        activateSection(targetId);
    });
});

// --- 3. GESTION BOUTONS PREV/NEXT ---
function updatePaginationButtons(index) {
    // PREV
    if (index <= 0) {
        btnPrev.disabled = true;
        btnPrev.querySelector('.label').innerText = "START";
        btnPrev.onclick = null;
    } else {
        btnPrev.disabled = false;
        btnPrev.querySelector('.label').innerText = sectionsIds[index - 1].toUpperCase();
        btnPrev.onclick = () => activateSection(sectionsIds[index - 1]);
    }

    // NEXT
    if (index >= sectionsIds.length - 1) {
        btnNext.disabled = true;
        btnNext.querySelector('.label').innerText = "END";
        btnNext.onclick = null;
    } else {
        btnNext.disabled = false;
        btnNext.querySelector('.label').innerText = sectionsIds[index + 1].toUpperCase();
        btnNext.onclick = () => activateSection(sectionsIds[index + 1]);
    }
}

// --- 4. QUANTUM SIMULATOR (Inchangé) ---
let quantumIndex = 1;
const MAX_INDEX = 4;
const indexDescriptions = {
    1: "Standard (Reset)", 2: "Boost (Dessin Top)", 
    3: "Fusion (Blend Overlay)", 4: "Quantum Front (WebGL)"
};

window.cycleQuantumIndex = function() {
    quantumIndex++;
    if (quantumIndex > MAX_INDEX) quantumIndex = 1;
    document.getElementById('idx-val').innerText = quantumIndex;
    document.getElementById('idx-desc').innerText = `(${indexDescriptions[quantumIndex]})`;
    
    const viz = document.getElementById('demo-viz');
    viz.className = 'layer-viz';
    viz.classList.add(`state-${quantumIndex}`);
};

// --- INITIALISATION ---
// Charge la première section au démarrage
activateSection('intro');