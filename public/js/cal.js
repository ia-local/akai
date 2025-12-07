// Fichier: cal.js

// --- Constantes et État Global ---
const API_BASE_URL = window.location.origin;

/**
 * Fichier: cal.js
 * Rôle: Gestion du rendu du calendrier RUP, et synchronisation du temps avec le moteur de Timeline (Playhead).
 * DÉPEND DE : timelineEngineAPI.js (pour window.timelineEngine) et modalSystem.js
 */

// Chemins et Références DOM
const CALENDAR_PATH = API_BASE_URL + '/json/Defi_RUP_Vide_28J.json'; 
const grid = document.getElementById('calendar-grid');

// Dates et Constantes de Temps
const START_DATE_CHALLENGE = new Date('2025-11-17'); 
const TODAY = new Date('2025-11-17').toDateString(); // Jour 1 simulé
const MS_IN_DAY = 24 * 60 * 60 * 1000;

let currentMonth = new Date('2025-11-01').getMonth(); 
let currentYear = new Date('2025-11-01').getFullYear(); 

// Couleurs de Phase pour le Rendu du Calendrier
const phaseColors = {
    "I. Capture & Initialisation": { primary: '#FFC107', secondary: '#403518' },
    "II. Élaboration & Monétisation": { primary: '#28A745', secondary: '#1D3B23' },
    "III. Construction & Amélioration": { primary: '#DC3545', secondary: '#3D1B20' },
    "IV. Transition & Clôture": { primary: '#17A2B8', secondary: '#193940' }
};

let RUP_DEFI_DATA_GLOBAL = null; 


// =======================================================
// I. SYNCHRONISATION TEMPORELLE (Playhead)
// =======================================================

/**
 * Calcule le Timecode en millisecondes depuis le début du Défi.
 */
function calculateTimelineTimecode(dateString) {
    const missionDate = new Date(dateString);
    const offsetMs = missionDate.getTime() - START_DATE_CHALLENGE.getTime();
    return Math.max(0, offsetMs); 
}

/**
 * 🛑 CONTRÔLE DE LA TIMELINE
 * Déplace le Playhead de la Timeline via l'API exposée (timelineEngineAPI.js).
 */
function goToTimelinePosition(timecodeMs) {
    if (window.timelineEngine && typeof window.timelineEngine.setPosition === 'function') {
        window.timelineEngine.setPosition(timecodeMs);
    } else {
        console.warn('❌ API Timeline non exposée. Mouvement Playhead ignoré.');
    }
}

/**
 * Fonction utilitaire de formatage Timecode (H:M:S)
 */
function formatTimecode(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/**
 * 💡 SYNCHRONISATION INVERSE: Met à jour le Calendrier RUP en fonction du Timecode de la Timeline.
 */
function updateCalendarFromTimeline(currentTimelineMs) {
    if (!RUP_DEFI_DATA_GLOBAL || !document.getElementById('timecode-display')) return;

    const dayNumber = Math.floor(currentTimelineMs / MS_IN_DAY); 
    const targetJour = `J${dayNumber + 1}`;

    const timeWithinDay = currentTimelineMs % MS_IN_DAY;
    document.getElementById('timecode-display').textContent = `${targetJour} | ${formatTimecode(timeWithinDay)}`;

    document.querySelectorAll('.calendar-case').forEach(c => c.classList.remove('is-active-from-timeline'));
    
    const activeCase = document.querySelector(`.calendar-case[data-rup-day="${targetJour}"]`);

    if (activeCase) {
        activeCase.classList.add('is-active-from-timeline');
    }
}

// =======================================================
// II. FONCTIONS DU MODAL ET CRUD
// =======================================================

/**
 * Charge les données de la mission quotidienne (READ) et gère la modale.
 */
async function loadMissionDataForModal(dayData) {
    if (dayData.tache_principale === 'Hors Défi RUP' || dayData.jour === 'N/A') {
        showModal(dayData);
        return;
    }

    try {
        const missionData = dayData;
        
        // --- Mappage de l'Interface Modale (COMPLET) ---
        
        // Header / ID
        if (document.getElementById('modal-mission-id')) document.getElementById('modal-mission-id').value = missionData.jour || '';
        if (document.getElementById('modal-day-label')) document.getElementById('modal-day-label').textContent = missionData.jour || 'N/A';
        
        // ASIDE GAUCHE (Inputs CRUD)
        if (document.getElementById('modal-tache')) document.getElementById('modal-tache').value = missionData.tache_principale || '';
        if (document.getElementById('modal-audio')) document.getElementById('modal-audio').value = missionData.routine_audio || '';
        if (document.getElementById('modal-date')) document.getElementById('modal-date').textContent = missionData.date || '';
        if (document.getElementById('modal-rup-day')) document.getElementById('modal-rup-day').textContent = missionData.jour || '';
        
        // TABLEAU DE PRODUCTION
        if (document.getElementById('prod-code')) document.getElementById('prod-code').textContent = missionData.production_digitale?.code || 'TODO';
        if (document.getElementById('prod-script')) document.getElementById('prod-script').textContent = missionData.production_digitale?.script_ia || 'TODO';
        if (document.getElementById('prod-video')) document.getElementById('prod-video').textContent = missionData.production_digitale?.video || 'TODO';

        // CANVAS
        if (document.getElementById('canvas-render')) {
            document.getElementById('canvas-render').innerHTML = `<p class="text-gray-500">J${missionData.jour.substring(1)} - Tâche: ${missionData.tache_principale.substring(0, 30).trim()}...</p>`;
        }
        
        // PROMPT INPUT
        if (document.getElementById('ia-prompt-input')) {
            document.getElementById('ia-prompt-input').value = missionData.tache_principale ? `/meta_style [SCENE]${missionData.tache_principale}` : '';
        }
        
        // 2. SYNCHRONISATION TIMELINE (Déplacement du Playhead)
        const timecodeMs = calculateTimelineTimecode(missionData.date);
        goToTimelinePosition(timecodeMs); 

        // 3. AFFICHAGE DE LA MODALE
        showModal(missionData);
        
    } catch (error) {
        console.error("Erreur lors du chargement des données de mission:", error);
    }
}

/**
 * Simule la mise à jour (UPDATE) des données de la mission.
 */
function saveMission() {
    const id = document.getElementById('modal-mission-id').value;
    const dataToSave = {
        tache_principale: document.getElementById('modal-tache').value,
        routine_audio: document.getElementById('modal-audio').value,
        production_digitale: { 
            code: document.getElementById('prod-code').textContent, 
            script_ia: document.getElementById('prod-script').textContent,
            video: document.getElementById('prod-video').textContent,
        }
    };
    
    // TEMPORAIRE: Mise à jour globale simulée
    const dayToUpdate = RUP_DEFI_DATA_GLOBAL.jours_du_cycle.find(d => d.jour === id);
    if (dayToUpdate) {
        dayToUpdate.tache_principale = dataToSave.tache_principale;
        dayToUpdate.routine_audio = dataToSave.routine_audio;
        dayToUpdate.production_digitale = dataToSave.production_digitale;
    }
    
    console.log(`[CRUD SIMULÉ] Mise à jour de ${id} enregistrée.`);
    
    renderMonthCalendar(currentMonth, currentYear, RUP_DEFI_DATA_GLOBAL.jours_du_cycle);
    hideModal(); 
}

function changeMissionView(step) {
    if (!RUP_DEFI_DATA_GLOBAL) return;
    
    const missions = RUP_DEFI_DATA_GLOBAL.jours_du_cycle;
    const currentMissionId = document.getElementById('modal-mission-id').value;
    const currentIndex = missions.findIndex(d => d.jour === currentMissionId);
    
    if (currentIndex !== -1) {
        const newIndex = currentIndex + step;
        if (newIndex >= 0 && newIndex < missions.length) {
            loadMissionDataForModal(missions[newIndex]);
        } else {
            console.warn("Fin de la séquence de missions.");
        }
    }
}

// =======================================================
// III. RENDU ET CHARGEMENT DE LA GRILLE
// =======================================================

function updateMonthLabel() {
    const date = new Date(currentYear, currentMonth);
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('current-month-label').textContent = date.toLocaleDateString('fr-FR', options);
}

function changeMonth(step) {
    currentMonth += step;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    updateMonthLabel();
    if (RUP_DEFI_DATA_GLOBAL) {
        renderMonthCalendar(currentMonth, currentYear, RUP_DEFI_DATA_GLOBAL.jours_du_cycle);
    } else {
        loadCalendarData();
    }
}

async function loadCalendarData() {
    grid.innerHTML = '<p>Chargement des données RUP...</p>';
    
    try {
        const response = await fetch(CALENDAR_PATH);
        if (!response.ok) throw new Error("Fichier JSON du défi non trouvé. Vérifiez le chemin : " + CALENDAR_PATH);
        
        RUP_DEFI_DATA_GLOBAL = await response.json();
        
        // Mise à jour des infos générales
        document.getElementById('model-name').textContent = RUP_DEFI_DATA_GLOBAL.metadata.titre_defi;
        document.getElementById('role-rup').textContent = RUP_DEFI_DATA_GLOBAL.metadata.role_rup;

        updateMonthLabel();
        renderMonthCalendar(currentMonth, currentYear, RUP_DEFI_DATA_GLOBAL.jours_du_cycle);

    } catch (error) {
        grid.innerHTML = `<p style="color: red;">ERREUR FATALE: ${error.message}</p>`;
        console.error(error);
        if (!RUP_DEFI_DATA_GLOBAL) RUP_DEFI_DATA_GLOBAL = { jours_du_cycle: [] };
    }
}

function renderMonthCalendar(month, year, defiDays) {
    const date = new Date(year, month, 1);
    let startDay = (date.getDay() === 0) ? 6 : date.getDay() - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    grid.innerHTML = '';

    for (let i = 0; i < startDay; i++) {
        const emptyCase = document.createElement('div');
        emptyCase.className = 'calendar-case case-empty';
        grid.appendChild(emptyCase);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        const currentDayString = currentDate.toDateString();
        
        const caseElement = document.createElement('div');
        caseElement.className = 'calendar-case';

        const challengeDay = defiDays.find(d => new Date(d.date).toDateString() === currentDayString);

        if (challengeDay) {
            const phaseName = challengeDay.phase.split(' (')[0];
            const phaseInfo = phaseColors[phaseName] || { primary: '#6c757d', secondary: '#444' };
            
            caseElement.classList.add('is-challenge-day');
            if (currentDayString === TODAY) caseElement.classList.add('is-current');
            
            caseElement.setAttribute('style', `
                --phase-color: ${phaseInfo.primary};
                --phase-bg-color: ${phaseInfo.secondary};
            `);
            
            // Ajout de l'attribut data-rup-day pour la synchro inverse
            caseElement.setAttribute('data-rup-day', challengeDay.jour);

            caseElement.innerHTML = `
                <div class="case-date">${i}</div>
                <div class="case-header" title="${challengeDay.tache_principale}">${challengeDay.jour}</div>
                <div class="case-progress">Progression: ${challengeDay.progression_pourcent.toFixed(2)}%</div>
                <div class="case-task-summary">${challengeDay.tache_principale.substring(0, 30)}...</div>
            `;
            
            caseElement.addEventListener('click', () => loadMissionDataForModal(challengeDay));

        } else {
            caseElement.classList.add('case-empty');
            caseElement.style.cursor = 'default';
            caseElement.innerHTML = `<div class="case-date">${i}</div><div class="case-task-summary">Hors Défi RUP</div>`;
             
            const emptyDayData = { jour: 'N/A', date: currentDate.toISOString().split('T')[0], tache_principale: 'Hors Défi RUP', routine_audio: '' };
            caseElement.addEventListener('click', () => loadMissionDataForModal(emptyDayData));
        }

        grid.appendChild(caseElement);
    }
}


// --- Initialisation et Écouteur d'Événement ---
document.addEventListener('DOMContentLoaded', () => {
    currentMonth = 10; 
    currentYear = 2025;
    updateMonthLabel();
    loadCalendarData();
    
    // 💡 SYNCHRONISATION INVERSE: Écoute l'événement déclenché par timelineEngineAPI.js
    window.addEventListener('timeline:timeUpdate', (event) => {
        updateCalendarFromTimeline(event.detail.timeMs);
    });
});