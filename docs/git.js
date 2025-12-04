/**
 * STUDIO AV DOCS - SCRIPT (v2.3)
 * Gère la navigation, l'Active State automatique et la Pagination.
 */

// --- CONFIGURATION ---
const sections = ['intro', 'install', 'architecture', 'quantum', 'api'];
let currentSectionIndex = 0;

// --- DOM ELEMENTS ---
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const navLinks = document.querySelectorAll('nav a, aside a');

// --- 1. NAVIGATION CLICK ---
navLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if(this.getAttribute('target') === '_blank') return;
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1); // enleve le #
        scrollToSection(targetId);
    });
});

// --- 2. SCROLL TO LOGIC ---
function scrollToSection(id) {
    const el = document.getElementById(id);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth' });
        // Mise à jour manuelle de l'index si clic
        const idx = sections.indexOf(id);
        if(idx !== -1) updatePaginationState(idx);
    }
}

// --- 3. AUTO-DETECT SECTION ON SCROLL (Observer) ---
const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px', // Active quand la section est en haut de page
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            const newIndex = sections.indexOf(id);
            
            if (newIndex !== -1) {
                updatePaginationState(newIndex);
                updateSidebarActive(id);
            }
        }
    });
}, observerOptions);

// Observer toutes les sections
sections.forEach(id => {
    const el = document.getElementById(id);
    if(el) observer.observe(el);
});

// --- 4. UPDATE UI STATE ---
function updatePaginationState(index) {
    currentSectionIndex = index;

    // Gestion Bouton Précédent
    if (index === 0) {
        btnPrev.disabled = true;
        btnPrev.querySelector('.label').innerText = "START";
    } else {
        btnPrev.disabled = false;
        btnPrev.querySelector('.label').innerText = sections[index - 1].toUpperCase();
    }

    // Gestion Bouton Suivant
    if (index === sections.length - 1) {
        btnNext.disabled = true;
        btnNext.querySelector('.label').innerText = "END";
    } else {
        btnNext.disabled = false;
        btnNext.querySelector('.label').innerText = sections[index + 1].toUpperCase();
    }
}

function updateSidebarActive(id) {
    document.querySelectorAll('aside a, nav a').forEach(a => {
        a.classList.remove('active');
        if(a.getAttribute('href') === `#${id}`) {
            a.classList.add('active');
        }
    });
}

// --- 5. PAGINATION CLICK LISTENERS ---
btnPrev.addEventListener('click', () => {
    if(currentSectionIndex > 0) {
        scrollToSection(sections[currentSectionIndex - 1]);
    }
});

btnNext.addEventListener('click', () => {
    if(currentSectionIndex < sections.length - 1) {
        scrollToSection(sections[currentSectionIndex + 1]);
    }
});


// --- 6. SIMULATEUR QUANTUM (PAD 15 LOGIC) ---
// (Code inchangé pour la démo)
let quantumIndex = 1;
const MAX_INDEX = 4;

const indexDescriptions = {
    1: "Standard (Reset)",
    2: "Boost (Dessin Top)",
    3: "Fusion (Blend Overlay)",
    4: "Quantum Front (WebGL)"
};

function cycleQuantumIndex() {
    quantumIndex++;
    if (quantumIndex > MAX_INDEX) quantumIndex = 1;
    const displayVal = document.getElementById('idx-val');
    const displayDesc = document.getElementById('idx-desc');
    const vizContainer = document.getElementById('demo-viz');

    displayVal.innerText = quantumIndex;
    displayDesc.innerText = `(${indexDescriptions[quantumIndex]})`;

    vizContainer.className = 'layer-viz';
    vizContainer.classList.add(`state-${quantumIndex}`);
    console.log(`🌌 [DOCS SIMULATOR] Switched to Index ${quantumIndex}`);
}
window.cycleQuantumIndex = cycleQuantumIndex;

// Init
updatePaginationState(0);