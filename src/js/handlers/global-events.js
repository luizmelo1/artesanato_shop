/**
 * Módulo de Handlers de Eventos Globais
 * Gerencia eventos de teclado e redimensionamento
 */

import * as ZoomHelpers from '../helpers/zoom.js';

/**
 * Handler de teclado global (Escape fecha modal e/ou menu).
 * @param {object} app - Instância do App.
 * @returns {(e: KeyboardEvent) => void}
 */
export function handleKeyPress(app) {
    return (e) => {
        if (e.key === 'Escape') {
            // Se modal estiver aberto
            if (app.DOM.modal.container.classList.contains('active')) {
                // Se zoom estiver ativo, desativa o zoom primeiro
                if (app.DOM.modal.imageContainer?.classList.contains('zoomed')) {
                    app.DOM.modal.imageContainer.classList.remove('zoomed');
                    ZoomHelpers.resetTransform(app.DOM.modal.mainImage);
                } else {
                    // Caso contrário, fecha o modal
                    app.closeModal();
                }
            }
            // Fecha menu mobile se estiver aberto
            if (app.DOM.nav.container?.classList.contains('active')) {
                app.DOM.nav.container.classList.remove('active');
                if (app.DOM.nav.mobileMenu) {
                    app.DOM.nav.mobileMenu.setAttribute('aria-expanded', 'false');
                }
            }
        }
    };
}

/**
 * Handler global de resize: garante estado consistente ao mudar o tamanho da tela.
 * - Remove zoom em telas pequenas;
 * - Fecha menu mobile quando a tela volta a ser grande.
 * @param {object} app
 * @returns {() => void}
 */
export function handleResize(app) {
    return () => {
        // Remove zoom em telas pequenas (mobile)
        if (window.innerWidth < 768 && app.DOM.modal.imageContainer?.classList.contains('zoomed')) {
            app.DOM.modal.imageContainer.classList.remove('zoomed');
            ZoomHelpers.resetTransform(app.DOM.modal.mainImage);
        }
        // Fecha menu mobile ao aumentar a tela
        if (window.innerWidth > 768 && app.DOM.nav.container?.classList.contains('active')) {
            app.DOM.nav.container.classList.remove('active');
            if (app.DOM.nav.mobileMenu) {
                app.DOM.nav.mobileMenu.setAttribute('aria-expanded', 'false');
            }
        }
    };
}
