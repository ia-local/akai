/**
 * Fichier: modalSystem.js
 * Rôle: Fonctions de gestion du composant Modal (Show/Hide/Data mapping) UNIQUEMENT.
 *
 * NOTE: Les fonctions d'alerte critique (showSystemAlert) sont dans ia-utile.js.
 * La logique de navigation (changeMissionView) est dans cal.js.
 */

/**
 * Affiche la fenêtre modale et mappe les données de la mission.
 * @param {object} missionData - Les données de la mission (jour, tache_principale, etc.).
 */
function showModal(missionData) {
    const modal = document.getElementById('mission-modal');
    
    // Éléments pour l'édition/affichage
    const saveButton = document.getElementById('save-button');
    const tacheField = document.getElementById('modal-tache');
    const audioField = document.getElementById('modal-audio');
    const messageDisplay = document.getElementById('modal-message'); 
    
    // Déterminer si le jour fait partie du Défi RUP
    const isDefiDay = missionData && missionData.jour && missionData.tache_principale !== 'Hors Défi RUP';

    if (!modal) {
        console.error("Erreur: Le conteneur modal 'mission-modal' est introuvable.");
        return;
    }

    // --- Mappage des données ---
    if (document.getElementById('modal-mission-id')) {
        document.getElementById('modal-mission-id').value = missionData.jour;
    }
    if (document.getElementById('modal-date')) {
        document.getElementById('modal-date').textContent = missionData.date;
    }

    if (!isDefiDay) {
        // Cas : Jour Hors Défi RUP
        if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = `Jour Hors Cycle RUP`;
        if (document.getElementById('modal-day-label')) document.getElementById('modal-day-label').textContent = ``;
        
        if (tacheField) tacheField.value = "Ce jour n'est pas une mission du cycle RUP de 28 jours.";
        if (audioField) audioField.value = "";
        
        if (messageDisplay) messageDisplay.textContent = "Opérations de Modification (CRUD) désactivées pour les jours hors cycle.";
        
        // Désactiver l'édition
        if (tacheField) tacheField.disabled = true;
        if (audioField) audioField.disabled = true;
        if (saveButton) saveButton.style.display = 'none';

    } else {
        // Cas : Jour de Défi RUP (J1 à J28)
        const tacheSummary = missionData.tache_principale ? missionData.tache_principale.substring(0, 30) + '...' : 'Mission RUP';

        if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = `Mission : ${missionData.jour}`;
        if (document.getElementById('modal-day-label')) document.getElementById('modal-day-label').textContent = `Tâche : ${tacheSummary}`;
        
        if (tacheField) tacheField.value = missionData.tache_principale || '';
        if (audioField) audioField.value = missionData.routine_audio || '';
        if (messageDisplay) messageDisplay.textContent = "";

        // Activer l'édition
        if (tacheField) tacheField.disabled = false;
        if (audioField) audioField.disabled = false;
        if (saveButton) saveButton.style.display = 'inline-block';
    }

    modal.classList.add('is-visible');
}

/**
 * Masque la fenêtre modale.
 */
function hideModal() {
    document.getElementById('mission-modal').classList.remove('is-visible');
}