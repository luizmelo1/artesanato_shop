// Importações principais
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
        // Estado principal
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

        // Inicializa DOM
        this.DOM = initializeDOM();
        debugLog('DOM inicializado:', this.DOM);
        debugLog('Container de produtos:', this.DOM.products.container);
        debugLog('Botões de categoria:', this.DOM.products.categories);

        // Carrega categorias se existir container
        if (this.DOM.products.categoriesContainer) {
            await this.loadCategoriesData();
        }

        // Ativa botão "Todos"
        this.activateAllCategoryButton();

        // Configura event listeners antes de carregar produtos
        this.setupEventListeners();

        // Carrega produtos
        await this.loadProductsData();

        // Inicializa slideshow
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
                // Atualiza referência DOM após renderizar categorias
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
            debugLog('Ativando botão "Todos"...');
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
        debugLog('Buscando produtos do Firestore...');
        
        try {
            await ProductsModule.fetchProducts(this.DOM, this.state);
            debugLog('Produtos carregados:', this.state.products.length, 'itens');
            
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
        // Callbacks principais
        const callbacks = {
            // Busca de produtos
            onSearch: (searchTerm) => {
                ProductsModule.filterProductsBySearch(this.DOM, this.state.products, searchTerm);
            },
            
            onCategoryChange: (categories) => {
                ProductsModule.loadProducts(this.DOM, this.state.products, categories);
            },

            // Modal de produto
            onOpenModal: (productId) => {
                ModalModule.openModal(this.DOM, this.state.products, productId, this.state);
            },

            onCloseModal: () => {
                ModalModule.closeModal(this.DOM, this.state);
            },

            // Zoom de imagem
            onImageZoom: (e) => {
                ModalModule.handleImageZoom(this.DOM, e);
            },

            onToggleZoom: (e) => {
                ModalModule.toggleImageZoom(this.DOM, e);
            },

            // Eventos de toque
            onTouchStart: (e) => {
                ModalModule.handleTouchStart(this.DOM, e);
            },

            onTouchMove: (e) => {
                ModalModule.handleTouchMove(this.DOM, e);
            },

            onTouchEnd: (e) => {
                ModalModule.handleTouchEnd(this.DOM, e);
            },

            // Paginação de produtos
            onLoadMore: async () => {
                await ProductsModule.loadMoreProducts(this.DOM, this.state);
            }
        };

        // Configura listeners
        EventsModule.setupEventListeners(this.DOM, callbacks);
    }

    /**
     * Força atualização dos produtos
     */
    async forceRefresh() {
        await ProductsModule.forceRefresh(this.DOM, this.state);
    }
}

// Instância global
const app = new ArtesanatoShop();

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded');
    app.initialize();
});

// Exporta instância para debug
export default app;
