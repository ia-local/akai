// public/js/modalSystem.js

export class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.initOverlay();
    }

    // Initialisation Robuste
    initOverlay() {
        let overlay = document.getElementById('generic-modal-overlay');

        // 1. Si l'overlay n'existe pas du tout dans le HTML, on le crée
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'generic-modal-overlay';
            overlay.className = 'c-modal-overlay';
            document.body.appendChild(overlay);
        }

        // 2. Si l'overlay existe mais est vide (pas de boîte interne), on injecte la structure
        if (!overlay.querySelector('.c-modal-box')) {
            overlay.innerHTML = `
                <div class="c-modal-box">
                    <header class="c-modal-header">
                        <h3 id="generic-modal-title" class="c-modal-title">Titre</h3>
                        <button id="generic-modal-close-btn" class="c-modal-close">&times;</button>
                    </header>
                    <div id="generic-modal-body" class="c-modal-body"></div>
                    <div id="generic-modal-footer" class="c-modal-footer"></div>
                </div>
            `;
            
            // 3. On attache les événements MAINTENANT (car les éléments viennent d'être créés)
            this.attachEvents(overlay);
        }
    }

    // Gestion séparée des événements pour éviter les doublons
    attachEvents(overlay) {
        // Fermeture au clic sur le fond
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'generic-modal-overlay') this.close();
        });
        
        // Fermeture via le bouton X
        const closeBtn = document.getElementById('generic-modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Écouteur Escape (Global)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    /**
     * Ouvre une modale avec contenu
     */
    show(title, contentHtml, footerHtml = '', onOpenCallback = null) {
        const overlay = document.getElementById('generic-modal-overlay');
        const titleEl = document.getElementById('generic-modal-title');
        const bodyEl = document.getElementById('generic-modal-body');
        const footerEl = document.getElementById('generic-modal-footer');

        // Sécurité : Si les éléments internes n'ont pas été trouvés
        if (!titleEl || !bodyEl) {
            console.error("ModalSystem: Structure interne manquante. Relance de initOverlay().");
            this.activeModal = null; // Reset
            document.getElementById('generic-modal-overlay').innerHTML = ''; // Force Clean
            this.initOverlay(); // Retry
            return this.show(title, contentHtml, footerHtml, onOpenCallback); // Retry call
        }

        titleEl.textContent = title;
        bodyEl.innerHTML = contentHtml;
        
        if (footerEl) {
            footerEl.innerHTML = footerHtml;
            footerEl.style.display = footerHtml ? 'flex' : 'none';
        }

        if (overlay) {
            overlay.classList.add('is-visible');
            this.activeModal = true;
            
            // Callback après affichage (pour initialiser les sliders, etc.)
            if (onOpenCallback && typeof onOpenCallback === 'function') {
                setTimeout(() => onOpenCallback(), 50); 
            }
        }
    }

    close() {
        const overlay = document.getElementById('generic-modal-overlay');
        if (overlay) {
            overlay.classList.remove('is-visible');
            this.activeModal = false;
            
            setTimeout(() => {
                const bodyEl = document.getElementById('generic-modal-body');
                if(bodyEl) bodyEl.innerHTML = '';
            }, 300);
        }
    }
}