/**
 * SYSTEME MODAL MODULAIRE (V2.2)
 * Supporte : HTML brut, Menus dynamiques, Mise à jour live.
 */
export class ModalSystem {
    constructor() {
        this.activeModal = false;
        this.initOverlay();
    }

    // --- INITIALISATION (Inchangé car robuste) ---
    initOverlay() {
        let overlay = document.getElementById('generic-modal-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'generic-modal-overlay';
            overlay.className = 'c-modal-overlay';
            document.body.appendChild(overlay);
        }

        if (!overlay.querySelector('.c-modal-box')) {
            overlay.innerHTML = `
                <div class="c-modal-box">
                    <header class="c-modal-header">
                        <h3 id="generic-modal-title" class="c-modal-title">System</h3>
                        <button id="generic-modal-close-btn" class="c-modal-close">&times;</button>
                    </header>
                    <div id="generic-modal-body" class="c-modal-body"></div>
                    <div id="generic-modal-footer" class="c-modal-footer"></div>
                </div>
            `;
            this.attachEvents(overlay);
        }
    }

    attachEvents(overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'generic-modal-overlay') this.close();
        });
        
        const closeBtn = document.getElementById('generic-modal-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    // --- FONCTIONS D'AFFICHAGE ---

    /**
     * Affiche une modale standard avec contenu HTML
     */
    show(title, contentHtml, footerHtml = '', onOpenCallback = null) {
        this._render(title, contentHtml, footerHtml);
        this._open(onOpenCallback);
    }

    /**
     * NOUVEAU : Affiche un Menu Système interactif
     * @param {string} title - Titre de la fenêtre
     * @param {Array} items - Liste d'objets { icon, label, action, color }
     */
    showMenu(title, items) {
        // Construction du HTML du menu
        let listHtml = `<ul class="c-modal-menu">`;
        
        items.forEach((item, index) => {
            const colorClass = item.color ? `text-${item.color}-400` : 'text-gray-300';
            // On utilise un attribut data-index pour retrouver l'action
            listHtml += `
                <li class="c-menu-item" data-index="${index}">
                    <span class="menu-icon ${colorClass}">${item.icon || '•'}</span>
                    <span class="menu-label">${item.label}</span>
                    <span class="menu-arrow">›</span>
                </li>
            `;
        });
        listHtml += `</ul>`;

        this._render(title, listHtml, '');
        
        // Attachement des événements de clic spécifiques au menu
        const listItems = document.querySelectorAll('.c-menu-item');
        listItems.forEach(li => {
            li.addEventListener('click', () => {
                const index = li.getAttribute('data-index');
                const action = items[index].action;
                if (action) {
                    action(); // Exécute la fonction liée
                    // Optionnel : this.close(); // Fermer après clic ?
                }
            });
        });

        this._open();
    }

    /**
     * NOUVEAU : Met à jour le contenu d'une modale déjà ouverte (Logs, Stats)
     */
    updateContent(newHtml) {
        const bodyEl = document.getElementById('generic-modal-body');
        if (bodyEl && this.activeModal) {
            bodyEl.innerHTML = newHtml;
        }
    }

    // --- MÉTHODES PRIVÉES (Interne) ---

    _render(title, body, footer) {
        const titleEl = document.getElementById('generic-modal-title');
        const bodyEl = document.getElementById('generic-modal-body');
        const footerEl = document.getElementById('generic-modal-footer');

        if (!titleEl || !bodyEl) {
            this.initOverlay(); // Retry
            return;
        }

        titleEl.textContent = title;
        bodyEl.innerHTML = body;
        
        if (footerEl) {
            footerEl.innerHTML = footer;
            footerEl.style.display = footer ? 'flex' : 'none';
        }
    }

    _open(callback) {
        const overlay = document.getElementById('generic-modal-overlay');
        if (overlay) {
            overlay.classList.add('is-visible');
            this.activeModal = true;
            if (callback) setTimeout(() => callback(), 50);
        }
    }

    close() {
        const overlay = document.getElementById('generic-modal-overlay');
        if (overlay) {
            overlay.classList.remove('is-visible');
            this.activeModal = false;
            // Nettoyage après transition CSS (300ms)
            setTimeout(() => {
                const bodyEl = document.getElementById('generic-modal-body');
                if(bodyEl) bodyEl.innerHTML = '';
            }, 300);
        }
    }
}