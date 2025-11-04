/**
 * Módulo de Inicialização do DOM
 * Coleta e organiza referências de elementos DOM
 */

/**
 * Inicializa e guarda as referências a elementos do DOM usados pela aplicação.
 * Detecta a página atual para evitar erros com elementos não existentes.
 * @returns {object} Estrutura com referências DOM agrupadas.
 */
export function initializeDOM() {
    // Detecção inteligente de página atual
    const isProductsPage = document.getElementById('products-container') !== null;
    const isIndexPage = document.querySelector('.hero') !== null;
    
    console.log('Página detectada:', isProductsPage ? 'products.html' : isIndexPage ? 'index.html' : 'desconhecida');
    
    return {
        products: {
            container: document.getElementById('products-container'),
            loader: document.getElementById('products-loader'),
            searchInput: document.getElementById('product-search'),
            categories: isProductsPage ? document.querySelectorAll('.category') : null,
            grid: document.querySelector('.products-grid')
        },
        modal: {
            container: document.getElementById('product-modal'),
            title: document.getElementById('modal-title'),
            productTitle: document.getElementById('modal-product-title'),
            price: document.getElementById('modal-price'),
            description: document.getElementById('modal-description'),
            mainImage: document.getElementById('modal-main-image'),
            thumbs: document.getElementById('modal-thumbs'),
            buyLink: document.getElementById('modal-buy-link'),
            detailsLink: document.getElementById('modal-details-link'),
            closeButton: document.querySelector('.close-modal'),
            imageContainer: document.querySelector('.modal-main-image')
        },
        nav: {
            container: document.querySelector('nav'),
            mobileMenu: document.querySelector('.mobile-menu'),
            menu: document.querySelector('nav ul')
        },
        footer: {
            container: document.querySelector('.footer-links')
        },
        ui: {
            scrollToTop: document.getElementById('scroll-to-top')
        },
        hero: {
            backgrounds: document.querySelectorAll('.hero-bg')
        }
    };
}
