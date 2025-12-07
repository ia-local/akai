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
    const isDefiDay = missionData && missionData.jour && missionData.tache_principale !== 'Hors Défi RUP' && missionData.jour !== 'N/A';

    if (!modal) {
        console.error("Erreur: Le conteneur modal 'mission-modal' est introuvable.");
        return;
    }

    // --- Mappage des données de base ---
    if (document.getElementById('modal-mission-id')) {
        // Stocker l'ID pour la fonction saveMission() et la navigation changeMissionView()
        document.getElementById('modal-mission-id').value = missionData.jour;
    }
    if (document.getElementById('modal-date')) {
        document.getElementById('modal-date').textContent = missionData.date;
    }

    if (!isDefiDay) {
        // Cas : Jour Hors Défi RUP ou N/A
        if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = `Jour Hors Cycle RUP`;
        if (document.getElementById('modal-day-label')) document.getElementById('modal-day-label').textContent = ``;
        
        if (tacheField) tacheField.value = "Ce jour n'est pas une mission du cycle RUP de 28 jours.";
        if (audioField) audioField.value = "";
        
        if (messageDisplay) messageDisplay.textContent = "Opérations de Modification (CRUD) désactivées pour les jours hors cycle.";
        
        // Désactiver l'édition
        if (tacheField) tacheField.disabled = true;
        if (audioField) audioField.disabled = true;
        if (saveButton) saveButton.style.display = 'none';

        // Nettoyer les champs de production
        if (document.getElementById('prod-code')) document.getElementById('prod-code').textContent = 'N/A';
        if (document.getElementById('prod-script')) document.getElementById('prod-script').textContent = 'N/A';
        if (document.getElementById('prod-video')) document.getElementById('prod-video').textContent = 'N/A';

    } else {
        // Cas : Jour de Défi RUP (J1 à J28)
        const tacheSummary = missionData.tache_principale ? missionData.tache_principale.substring(0, 30).trim() + '...' : 'Mission RUP';

        if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = `Mission : ${missionData.jour}`;
        if (document.getElementById('modal-day-label')) document.getElementById('modal-day-label').textContent = `Tâche : ${tacheSummary}`;
        
        if (tacheField) tacheField.value = missionData.tache_principale || '';
        if (audioField) audioField.value = missionData.routine_audio || '';
        if (messageDisplay) messageDisplay.textContent = "";

        // Activer l'édition
        if (tacheField) tacheField.disabled = false;
        if (audioField) audioField.disabled = false;
        if (saveButton) saveButton.style.display = 'inline-block';
        
        // Remplir les champs de production (fait dans cal.js mais pour la robustesse)
        if (document.getElementById('prod-code')) document.getElementById('prod-code').textContent = missionData.production_digitale?.code || 'TODO';
        if (document.getElementById('prod-script')) document.getElementById('prod-script').textContent = missionData.production_digitale?.script_ia || 'TODO';
        if (document.getElementById('prod-video')) document.getElementById('prod-video').textContent = missionData.production_digitale?.video || 'TODO';

    }

    // Affiche la modale en ajoutant la classe is-visible
    modal.classList.add('is-visible');
}

/**
 * Masque la fenêtre modale.
 */
function hideModal() {
    document.getElementById('mission-modal').classList.remove('is-visible');
}