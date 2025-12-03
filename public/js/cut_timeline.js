import { ModalSystem } from './modalSystem.js';

window.modalSystem = new ModalSystem();

// Simulation de chargement des clips pour la vue "Strip"
const stripContainer = document.getElementById('cut-timeline-strip');

async function loadCutTimeline() {
    // Ici on pourrait charger la même session que l'Editor
    const clips = [
        { name: "Intro.mp4", duration: 5 },
        { name: "Scene_1.mov", duration: 12 },
        { name: "Interview.mp4", duration: 45 },
        { name: "B-Roll.jpg", duration: 3 }
    ];

    stripContainer.innerHTML = '';
    
    // Curseur central fixe
    const cursor = document.createElement('div');
    cursor.style.cssText = "position:absolute; left:50%; top:0; bottom:0; width:2px; background:orange; z-index:10; height:100px;";
    stripContainer.appendChild(cursor);

    clips.forEach(clip => {
        const el = document.createElement('div');
        el.className = 'cut-clip';
        el.textContent = clip.name;
        // Largeur proportionnelle (ex: 10px par seconde)
        el.style.width = `${clip.duration * 10}px`;
        stripContainer.appendChild(el);
    });
}

loadCutTimeline();