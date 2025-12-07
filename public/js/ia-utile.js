/**
 * Fichier: ia-utile.js
 * Rôle: Fonctions utilitaires IA/Système pour la gestion des alertes critiques et des tests d'API.
 * NOTE: Dépend de modalSystem.js (pour showSystemAlert) et du DOM (pour les IDs -modal).
 */

// --- Variables Globales (Simulées) ---
const ALERTE_SIMULEE_LOW_STOCK = 8; // Seuil bas pour la démo
const LOW_STOCK_THRESHOLD = 10; 
// Le base URL est défini dans cal.js: const API_BASE_URL = window.location.origin;

// =======================================================
// A. FONCTIONS D'ALERTE SYSTÈME (Fonctionnelles)
// =======================================================

function showSystemAlert(type, data = {}) {
    const container = document.getElementById('global-alert-container');
    if (!container) return;

    // ... (La logique showSystemAlert est inchangée et est fonctionnelle) ...
    let title = "ALERTE SYSTÈME CRITIQUE";
    let message = "Veuillez vérifier les logs serveur.";
    let action = "Action Requise";
    let className = "alert--danger";

    if (type === 'ASYNC_FAIL_3X') {
        title = "🔴 ERREUR FATALE (ASYNC_FAIL_3X)";
        message = `Échec de l'exécution d'une tâche critique (${data.tache_id || 'UNKNOWN'}). Résilience compromise. Dernier code: ${data.http_code || 500}.`;
        action = `[ACTION RUP]: Redémarrer la boucle RUP ou exécuter la tâche en mode DEBUG via le Terminal.`;
        className = "alert--danger";
    } else if (type === 'QI_STORE_LOW_STOCK') {
        title = "🔥 ALERTE ÉCONOMIQUE (QI_STORE_LOW_STOCK)";
        message = `Le produit ${data.product_id || 'QM-XXX'} est en rupture de stock imminent (${data.stock_restant || ALERTE_SIMULEE_LOW_STOCK} unités restantes). Flux de revenus RUP menacé.`;
        action = `[ACTION RUP]: Lancer la production vidéo pour la prochaine offre ou réapprovisionner le stock via le Dashboard MMD (/nodeJs.html).`;
        className = "alert--warning";
    }

    const alertHtml = `
        <div class="c-system-alert ${className}">
            <h4>${title}</h4>
            <p>${message}</p>
            <p class="alert-action-text">${action}</p>
            <button class="c-alert-close-btn" onclick="hideSystemAlert()">&#x2715;</button>
        </div>
    `;

    container.innerHTML = alertHtml;
    container.style.display = 'block';
}

function hideSystemAlert() {
    const container = document.getElementById('global-alert-container');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// =======================================================
// B. FONCTIONS UTILITAIRES D'API (CORRIGÉES POUR LES IDS -modal)
// =======================================================

/**
 * 🛠️ FONCTION CORRIGÉE
 * Simule le calcul de la Taxe Circulaire (Appelle /api/ciat/calculate_tax du server.js).
 */
async function calculateTax() {
    // 🛑 CORRECTION ICI : Utilisation de l'ID "-modal"
    const value = document.getElementById('transaction-value-modal').value;
    // 🛑 CORRECTION ICI : Utilisation de l'ID "-modal"
    const resultElement = document.getElementById('tax-result-modal');

    if (!value || isNaN(value)) {
        resultElement.textContent = "Erreur: Valeur de transaction requise.";
        return;
    }

    // SIMULATION AVANT L'APPEL API: Vérification du seuil d'alerte pour la démo
    if (ALERTE_SIMULEE_LOW_STOCK <= LOW_STOCK_THRESHOLD) {
        showSystemAlert('QI_STORE_LOW_STOCK', {
            product_id: 'QM-001 (Regex Snippet)',
            stock_restant: ALERTE_SIMULEE_LOW_STOCK
        });
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/ciat/calculate_tax`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactionValue: parseFloat(value),
                circularityScore: 0.85, 
                activityType: "REUSE"
            })
        });

        const data = await response.json();
        
        if (data.error) {
            resultElement.textContent = `ERREUR: ${data.error}`;
            showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Taxation API', http_code: response.status });
            return;
        }

        const type = data.isSubvention ? 'SUBVENTION RUP' : 'TAXE RUP';
        resultElement.textContent = `
[${data.transactionId}]
Taux Appliqué: ${data.finalRateApplied * 100}%
Montant (${type}): ${data.calculatedTaxAmount.toFixed(2)} €
Notes: ${data.gamification}
        `;
        
    } catch (error) {
        resultElement.textContent = `Erreur FATALE: Connexion au serveur échouée.`;
        showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Connexion Serveur', http_code: 503 });
    }
}


/**
 * 🛠️ FONCTION CORRIGÉE
 * Simule la génération de Hook (Appelle /api/chat-command du server.js).
 */
async function generateHook() {
    // 🛑 CORRECTION ICI : Utilisation de l'ID "-modal"
    const theme = document.getElementById('hook-theme-modal').value || "RUP";
    // 🛑 CORRECTION ICI : Utilisation de l'ID "-modal"
    const resultElement = document.getElementById('hook-result-modal');
    resultElement.textContent = "Génération du Hook IA en cours...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: "/titre",
                promptBody: `Génère un titre pour une vidéo courte sur le thème '${theme}' et le Revenu Passif Progressif.`,
                messages: [{ role: "user", content: "Générer un Hook" }]
            })
        });

        const data = await response.json();

        if (data.success) {
            resultElement.textContent = data.responseText;
        } else {
            resultElement.textContent = `Erreur IA: ${data.error}`;
            showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Hook IA', http_code: response.status });
        }
        
    } catch (error) {
        resultElement.textContent = `Erreur FATALE: Connexion au serveur échouée.`;
        showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Connexion Serveur', http_code: 503 });
    }
}

/**
 * 🛠️ NOUVELLE FONCTION
 * Rafraîchit les statuts RUP dans l'Aside du Modal (Appelle /api/status et /api/update/gui).
 */
async function fetchStatus() {
    // 🛑 CORRECTION ICI : Utilisation des IDs du Modal
    const rupStatusEl = document.getElementById('rup-status-modal');
    const rupContributionEl = document.getElementById('rup-contribution-modal');

    rupStatusEl.textContent = 'Connexion...';
    rupContributionEl.textContent = '...';

    try {
        // Fetch Statut principal du scheduler
        const statusResponse = await fetch(`${API_BASE_URL}/api/status`);
        const statusData = await statusResponse.json();
        
        // Fetch Données GUI (pour Contribution Cumulée)
        const guiResponse = await fetch(`${API_BASE_URL}/api/update/gui`);
        const guiData = await guiResponse.json();

        if (statusData.status === 'OK' && guiData.status === 'OK') {
            rupStatusEl.textContent = statusData.service || 'Actif';
            // Utilisation des données du RUP
            rupContributionEl.textContent = `${guiData.data_snapshot.contribution_rup_cumulee || 0.00} €`;
            rupStatusEl.style.color = 'var(--color-success)';

        } else {
            rupStatusEl.textContent = 'HORS LIGNE';
            rupStatusEl.style.color = 'var(--color-danger)';
            showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Statut RUP', http_code: statusResponse.status });
        }
        
    } catch (error) {
        rupStatusEl.textContent = 'ÉCHEC CONNEXION';
        rupStatusEl.style.color = 'var(--color-danger)';
        showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Check API', http_code: 503 });
    }
}

// Fichier: ia-utile.js (Version corrigée et mise à jour)

// ... (Le code des fonctions showSystemAlert, hideSystemAlert, calculateTax, et fetchStatus reste le même) ...

/**
 * Gère l'exécution du prompt IA depuis le modal (Appelle /api/chat-command du server.js).
 */
async function generateContentFromPrompt() {
    const promptInput = document.getElementById('ia-prompt-input').value;
    const resultElement = document.getElementById('modal-message'); 
    
    if (!promptInput) {
        resultElement.textContent = "Erreur: Le prompt IA est vide.";
        return;
    }
    
    resultElement.textContent = "Exécution Groq/AGI en cours...";
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: promptInput.split(' ')[0],
                promptBody: promptInput.substring(promptInput.indexOf(' ') + 1),
                messages: [{ role: "user", content: promptInput }]
            })
        });

        const data = await response.json();

        if (data.success) {
            const generatedText = data.responseText;
            
            // 🛑 NOUVEAU : MISE À JOUR DU CANVAS
            const canvasRenderEl = document.getElementById('canvas-render');
            if (canvasRenderEl) {
                // Style Terminal/Code pour le rendu IA
                canvasRenderEl.innerHTML = `
                    <pre style="color: var(--color-success); font-family: monospace; padding: 10px;">
                        TITLE_PREVIEW_GENERATED:
                        ${generatedText}
                    </pre>
                `;
                canvasRenderEl.style.backgroundColor = '#161b22'; // Assurer le fond sombre
            }

            // Mise à jour de la table de production (pour l'exemple)
            const prodScriptEl = document.getElementById('prod-script');
            if (prodScriptEl) prodScriptEl.textContent = generatedText.substring(0, 50) + '...';
            
            resultElement.textContent = "✅ Génération IA OK. Aperçu Canvas et Production mis à jour.";
        } else {
            resultElement.textContent = `❌ Erreur IA: ${data.error}`;
            showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Génération Contenu', http_code: response.status });
        }
    } catch (error) {
        resultElement.textContent = `❌ Erreur FATALE: Connexion au serveur échouée.`;
        showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Connexion Server/Prompt', http_code: 503 });
    }
}


/**
 * 🛠️ Mise à jour de la fonction generateHook pour cibler les nouveaux IDs (-modal)
 * (Utile pour le bloc de test rapide dans l'Aside)
 */
async function generateHook() {
    // 🛑 CORRECTION ICI : Utilisation de l'ID "-modal"
    const theme = document.getElementById('hook-theme-modal').value || "RUP";
    const resultElement = document.getElementById('hook-result-modal');
    resultElement.textContent = "Génération du Hook IA en cours...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: "/titre",
                promptBody: `Génère un titre pour une vidéo courte sur le thème '${theme}' et le Revenu Passif Progressif.`,
                messages: [{ role: "user", content: "Générer un Hook" }]
            })
        });

        const data = await response.json();

        if (data.success) {
            const generatedText = data.responseText;
            resultElement.textContent = generatedText;
            
            // 🛑 NOUVEAU : MISE À JOUR DU CANVAS DE PRÉVISUALISATION
            const canvasRenderEl = document.getElementById('canvas-render');
            if (canvasRenderEl) {
                canvasRenderEl.innerHTML = `
                    <pre style="color: #ffc107; font-family: monospace; padding: 10px; font-size: 0.8em;">
                        HOOK_PREVIEW: 
                        ${generatedText}
                    </pre>
                `;
                 canvasRenderEl.style.backgroundColor = '#21262d'; 
            }

        } else {
            resultElement.textContent = `❌ Erreur IA: ${data.error}`;
            showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Hook IA', http_code: response.status });
        }
        
    } catch (error) {
        resultElement.textContent = `❌ Erreur FATALE: Connexion au serveur échouée.`;
        showSystemAlert('ASYNC_FAIL_3X', { tache_id: 'Connexion Server/Prompt', http_code: 503 });
    }
}