/**
 * Artesanato Shop - Aplicação Principal
 * Ponto de entrada modular da aplicação
 */

// Importações de módulos
import { initializeDOM } from './app/dom.js';
import * as ProductsModule from './app/products.js';
import * as ModalModule from './app/modal.js';
import * as EventsModule from './app/events.js';
import * as SlideshowModule from './app/slideshow.js';
import { cache } from './utils/cache.js';
import { debugLog, debugError } from './utils/debug.js';

/**
 * Classe principal da aplicação
 */
class ArtesanatoShop {
    constructor() {
        // Estado da aplicação
        this.state = {
            products: [],
            previouslyFocusedElement: null,
            scrollLockY: null
        };

        // Referências DOM
        this.DOM = null;
    }

    /**
     * Inicializa a aplicação
     */
    async initialize() {
        debugLog('=== INÍCIO DA INICIALIZAÇÃO ===');

        // Inicializa referências DOM
        this.DOM = initializeDOM();
        debugLog('DOM inicializado:', this.DOM);
        debugLog('Container de produtos:', this.DOM.products.container);
        debugLog('Botões de categoria:', this.DOM.products.categories);

        // Ativa o botão "Todos" por padrão
        this.activateAllCategoryButton();

        // Carrega produtos (cache ou API)
        await this.loadProductsData();

        // Inicializa slideshow do hero
        SlideshowModule.initHeroSlideshow(this.DOM);

        // Configura event listeners apenas uma vez após carregar produtos
        this.setupEventListeners();

        debugLog('=== FIM DA INICIALIZAÇÃO ===');
    }

    /**
     * Ativa o botão "Todos" por padrão na página de produtos
     */
    activateAllCategoryButton() {
        if (this.DOM?.products?.categories) {
            debugLog('Ativando botão "Todos" por padrão...');
            const allButton = Array.from(this.DOM.products.categories)
                .find(btn => btn.dataset.category === 'all');
            debugLog('Botão "Todos" encontrado:', allButton);
            if (allButton) {
                allButton.classList.add('active');
                allButton.setAttribute('aria-pressed', 'true');
                debugLog('Botão "Todos" ativado com sucesso');
            } else {
                debugLog('ERRO: Botão "Todos" não encontrado!');
            }
        } else {
            debugLog('Não é página de produtos ou categorias não encontradas');
        }
    }

    /**
     * Carrega produtos do cache ou da API
     */
    async loadProductsData() {
        const cachedProducts = cache.get();
        debugLog('Cache recuperado:', cachedProducts);
        
        if (cachedProducts && cache.isValid()) {
            await this.loadFromCache(cachedProducts);
        } else {
            await this.loadFromAPI();
        }
    }

    /**
     * Carrega produtos do cache
     */
    async loadFromCache(cachedProducts) {
        debugLog('Produtos carregados do cache:', cachedProducts.length, 'itens');
        this.state.products = cachedProducts;
        
        if (this.DOM.products.container) {
            debugLog('Chamando loadProducts com cache...');
            ProductsModule.loadProducts(this.DOM, this.state.products, 'all');
        } else {
            debugLog('ERRO: Container de produtos não encontrado!');
        }
        
        // Verifica atualizações em background
        ProductsModule.updateCacheInBackground(this.state.products);
    }

    /**
     * Carrega produtos da API
     */
    async loadFromAPI() {
        debugLog('Cache inválido ou não encontrado, buscando da API...');
        try {
            await ProductsModule.fetchProducts(this.DOM, this.state);
            debugLog('Produtos buscados da API:', this.state.products.length, 'itens');
            
            if (this.DOM.products.container) {
                debugLog('Chamando loadProducts com API...');
                ProductsModule.loadProducts(this.DOM, this.state.products, 'all');
            } else {
                debugLog('ERRO: Container de produtos não encontrado!');
            }
        } catch (error) {
            debugError('Erro ao inicializar aplicação:', error);
        }
    }

    /**
     * Configura todos os event listeners da aplicação
     */
    setupEventListeners() {
        // Callbacks para os eventos
        const callbacks = {
            // Produtos e busca
            onSearch: (searchTerm) => {
                ProductsModule.filterProductsBySearch(this.DOM, this.state.products, searchTerm);
            },
            
            onCategoryChange: (categories) => {
                ProductsModule.loadProducts(this.DOM, this.state.products, categories);
            },

            // Modal
            onOpenModal: (productId) => {
                ModalModule.openModal(this.DOM, this.state.products, productId, this.state);
            },

            onCloseModal: () => {
                ModalModule.closeModal(this.DOM, this.state);
            },

            // Zoom
            onImageZoom: (e) => {
                ModalModule.handleImageZoom(this.DOM, e);
            },

            onToggleZoom: (e) => {
                ModalModule.toggleImageZoom(this.DOM, e);
            },

            // Touch events
            onTouchStart: (e) => {
                ModalModule.handleTouchStart(this.DOM, e);
            },

            onTouchMove: (e) => {
                ModalModule.handleTouchMove(this.DOM, e);
            },

            onTouchEnd: (e) => {
                ModalModule.handleTouchEnd(this.DOM, e);
            }
        };

        // Configura os listeners com delegação de eventos
        EventsModule.setupEventListeners(this.DOM, callbacks);
    }

    /**
     * Força atualização dos produtos
     */
    async forceRefresh() {
        await ProductsModule.forceRefresh(this.DOM, this.state);
    }
}

// Instância global da aplicação
const app = new ArtesanatoShop();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded');
    app.initialize();
});

// Exporta a instância para uso em console/debug
export default app;
