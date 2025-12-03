/**
 * Artesanato Shop - Aplicação Principal
 * Ponto de entrada modular da aplicação
 */

// Importações de módulos
import { initializeDOM } from './app/dom.js';
import * as ProductsModule from './app/products.js';
import * as CategoriesModule from './app/categories.js';
import * as ModalModule from './app/modal.js';
import * as EventsModule from './app/events.js';
import * as SlideshowModule from './app/slideshow.js';
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

        // Carrega categorias dinamicamente do Firestore (se estiver na página de produtos)
        if (this.DOM.products.categoriesContainer) {
            await this.loadCategoriesData();
        }

        // Ativa o botão "Todos" por padrão
        this.activateAllCategoryButton();

        // Configura event listeners ANTES de carregar produtos
        // Isso garante que os botões de categoria tenham handlers anexados
        this.setupEventListeners();

        // Carrega produtos do Firestore
        await this.loadProductsData();

        // Inicializa slideshow do hero
        SlideshowModule.initHeroSlideshow(this.DOM);

        debugLog('=== FIM DA INICIALIZAÇÃO ===');
    }

    /**
     * Carrega categorias do Firestore e renderiza botões
     */
    async loadCategoriesData() {
        try {
            debugLog('Carregando categorias do Firestore...');
            const categories = await CategoriesModule.loadCategories(this.DOM);
            
            if (categories.length > 0) {
                debugLog('Renderizando botões de categorias...');
                CategoriesModule.renderCategoryButtons(this.DOM, categories);
                // Atualiza a referência DOM após renderizar as categorias
                this.DOM.products.categories = this.DOM.products.categoriesContainer.querySelectorAll('.category');
                debugLog('Referência de categorias atualizada:', this.DOM.products.categories.length, 'botões');
            } else {
                debugLog('Nenhuma categoria encontrada, mantendo botões padrão');
            }
        } catch (error) {
            debugError('Erro ao carregar categorias:', error);
        }
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
     * Carrega produtos do Firestore
     */
    async loadProductsData() {
        debugLog('=== loadProductsData ===');
        debugLog('Buscando produtos do Firestore...');
        
        try {ebugLog('Produtos carregados:', this.state.products.length, 'itens');
            
            if (this.DOM.products.container) {
                debugLog('Renderizando produtos...');
                ProductsModule.loadProducts(this.DOM, this.state.products, 'all');
            } else {
                debugLog('ERRO: Container de produtos não encontrado!');
            }
        } catch (error) {
            debugError('Erro ao carregar produtos:', error);
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
            },

            // Paginação
            onLoadMore: async () => {
                await ProductsModule.loadMoreProducts(this.DOM, this.state);
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
