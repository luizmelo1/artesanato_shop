/**
 * Arquivo principal de funcionalidades do site.
 *
 * Este módulo centraliza:
 * - Utilitários (cache, debounce, throttle, lazy-load)
 * - Helpers de zoom para o modal
 * - Handlers globais (teclado e resize)
 * - Objeto App com ciclo de vida, renderização e delegação de eventos
 *
 * Estrutura de Produtos (src/db/products.json):
 * {
 *   id: number,           // ID único do produto
 *   name: string,         // Nome do produto
 *   category: string,     // Categoria (decoracao, personalizados, funkopop, quadros)
 *   price: number,        // Preço em reais
 *   description: string,  // Descrição completa do produto
 *   image: string,        // URL da imagem principal
 *   images?: string[],    // Array de URLs (opcional, para galeria)
 *   link: string          // Link para compra (WhatsApp, Instagram, etc)
 * }
 *
 * Performance e Otimizações:
 * - Scripts com defer: carregamento não bloqueia HTML
 * - Detecção de página: evita erros com elementos não existentes
 * - Animações GPU-accelerated: translateZ(0) + will-change
 * - Transições suaves: fade-out → fade-in ao trocar categorias
 * - Lazy loading: imagens carregadas sob demanda
 * - Loader visual: feedback durante carregamento
 *
 * Migração Futura (Opcional):
 * - React: Para componentes reutilizáveis e estado global
 * - Framer Motion: Animações declarativas avançadas
 * - Next.js: SSR, SEO otimizado e rotas dinâmicas
 * - TypeScript: Type safety e melhor DX
 *
 * Nota de arquitetura:
 * - Delegação de eventos reduz listeners e melhora performance
 * - Cache em localStorage com versionamento e expiração
 * - Todas as animações usam CSS transitions para performance otimizada
 */
// Utilidades
const Utils = {
    // Cache do localStorage com versionamento
    cache: {
        CACHE_KEY: 'artesanato_products',
    CACHE_VERSION: '1.2', // Incrementar quando houver mudanças nos produtos
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas em milissegundos

        /**
         * Salvar produtos no cache.
         * @param {Array<object>} data - Lista de produtos a serem armazenados.
         * @returns {boolean} true em caso de sucesso, false caso contrário.
         */
        set(data) {
            try {
                const cacheData = {
                    data: data,
                    version: this.CACHE_VERSION,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
                console.log('Produtos salvos no cache');
                return true;
            } catch (error) {
                console.warn('Erro ao salvar cache:', error);
                return false;
            }
        },

    /**
     * Recuperar produtos do cache.
     * Aplica validações de versão e expiração.
     * @returns {Array<object>|null} Lista de produtos ou null se inválido/expirado.
     */
        get() {
            try {
                const cached = localStorage.getItem(this.CACHE_KEY);
                if (!cached) {
                    console.log('Cache vazio');
                    return null;
                }

                const cacheData = JSON.parse(cached);
                const now = Date.now();
                
                // Verificar se a versão do cache está atualizada
                if (cacheData.version !== this.CACHE_VERSION) {
                    console.log('Versão do cache desatualizada');
                    this.clear();
                    return null;
                }

                // Verificar se o cache expirou
                if (now - cacheData.timestamp > this.CACHE_DURATION) {
                    console.log('Cache expirado');
                    this.clear();
                    return null;
                }

                console.log('Produtos carregados do cache');
                return cacheData.data;
            } catch (error) {
                console.warn('Erro ao ler cache:', error);
                this.clear();
                return null;
            }
        },

    /**
     * Limpar cache do localStorage por chave.
     */
        clear() {
            localStorage.removeItem(this.CACHE_KEY);
            console.log('Cache limpo');
        },

        /**
         * Verificar se o cache está válido (existe, versão e prazo válidos).
         * @returns {boolean}
         */
        isValid() {
            return this.get() !== null;
        }
    },

    /**
     * Debounce: atrasa a execução de uma função até que pare de ser chamada por "wait" ms.
     * Útil para buscas ao digitar ou resize.
     * @template {Function} F
     * @param {F} func - Função a ser executada com debounce.
     * @param {number} wait - Tempo de espera em ms.
     * @returns {F} Uma nova função com comportamento de debounce.
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle: limita a frequência de execução de uma função para no máximo 1 vez a cada "limit" ms.
     * Útil para scroll e eventos de alta frequência.
     * @template {Function} F
     * @param {F} func - Função a ser "throttled".
     * @param {number} limit - Janela de tempo em ms.
     * @returns {F} Uma nova função com comportamento de throttle.
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Lazy loading de imagem: atribui o src da imagem quando entra na viewport.
     * Requer que o elemento possua data-src.
     * @param {HTMLImageElement} img - Elemento de imagem a ser observado.
     */
    lazyLoadImage(img) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });
        observer.observe(img);
    }
};

// Funções auxiliares para o zoom de imagem do modal
const ImageZoomHelpers = {
    /**
     * Calcula a posição relativa do mouse dentro do container de imagem.
     * @param {MouseEvent} e
     * @param {DOMRect} containerRect - BoundingClientRect do container.
     * @returns {{moveX:number, moveY:number}} Percentuais de deslocamento.
     */
    calculateZoomPosition(e, containerRect) {
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        const moveX = (x / containerRect.width) * 100;
        const moveY = (y / containerRect.height) * 100;
        return { moveX, moveY };
    },

    /**
     * Aplica transformação CSS de zoom e translate na imagem principal do modal.
     * @param {HTMLImageElement} image
     * @param {number} moveX
     * @param {number} moveY
     */
    applyZoomTransform(image, moveX, moveY) {
        // Define o nível de zoom de forma adaptativa
        const scale = window.innerWidth < 600 ? 1.5 : 2;
        image.style.transform = `scale(${scale}) translate(${50 - moveX}%, ${50 - moveY}%)`;
    },

    /**
     * Remove transformações aplicadas na imagem.
     * @param {HTMLImageElement} image
     */
    resetTransform(image) {
        image.style.transform = '';
    }
};

// Handlers de eventos globais (teclado e redimensionamento)
const GlobalEventHandlers = {
    /**
     * Handler de teclado global (Escape fecha modal e/ou menu).
     * @param {typeof App} app - Instância do App.
     * @returns {(e: KeyboardEvent) => void}
     */
    handleKeyPress(app) {
        return (e) => {
            if (e.key === 'Escape') {
                // Se modal estiver aberto
                if (app.DOM.modal.container.classList.contains('active')) {
                    // Se zoom estiver ativo, desativa o zoom primeiro
                    if (app.DOM.modal.imageContainer?.classList.contains('zoomed')) {
                        app.DOM.modal.imageContainer.classList.remove('zoomed');
                        ImageZoomHelpers.resetTransform(app.DOM.modal.mainImage);
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
    },

    /**
     * Handler global de resize: garante estado consistente ao mudar o tamanho da tela.
     * - Remove zoom em telas pequenas;
     * - Fecha menu mobile quando a tela volta a ser grande.
     * @param {typeof App} app
     * @returns {() => void}
     */
    handleResize(app) {
        return () => {
            // Remove zoom em telas pequenas (mobile)
            if (window.innerWidth < 768 && app.DOM.modal.imageContainer?.classList.contains('zoomed')) {
                app.DOM.modal.imageContainer.classList.remove('zoomed');
                ImageZoomHelpers.resetTransform(app.DOM.modal.mainImage);
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
};

// Estado global da aplicação
const App = {
    DOM: null,
    products: [],

    /**
     * Inicializa e guarda as referências a elementos do DOM usados pela aplicação.
     * Detecta a página atual para evitar erros com elementos não existentes.
     * @returns {object} Estrutura com referências DOM agrupadas.
     */
    initializeDOM() {
        // Detecção inteligente de página atual
        const isProductsPage = document.getElementById('products-container') !== null;
        const isIndexPage = document.querySelector('.hero') !== null;
        
        console.log('Página detectada:', isProductsPage ? 'products.html' : isIndexPage ? 'index.html' : 'desconhecida');
        
        this.DOM = {
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
        
        return this.DOM;
    },

    /**
     * Inicializa a aplicação:
     * - Coleta referências do DOM
     * - Carrega produtos do cache ou da API
     * - Renderiza UI e registra eventos
     */
    async initialize() {
        console.log('Inicializando aplicação...');
        this.initializeDOM();
        
        try {
            // Tenta carregar produtos do cache primeiro
            const cachedProducts = Utils.cache.get();
            
            if (cachedProducts) {
                // Usa produtos do cache (carregamento instantâneo)
                this.products = cachedProducts;
                console.log('Produtos carregados do cache:', this.products.length, 'itens');
                
                if (this.DOM.products.container) {
                    this.loadProducts('all');
                    this.setupEventListeners();
                }
                
                this.initHeroSlideshow();
                
                // Verifica atualizações em segundo plano
                this.updateCacheInBackground();
            } else {
                // Carrega produtos da API se não houver cache
                await this.fetchProducts();
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            if (this.DOM.products.container) {
                this.DOM.products.container.replaceChildren();
                const p = document.createElement('p');
                p.className = 'no-results';
                p.setAttribute('role', 'alert');
                p.textContent = 'Não foi possível carregar os produtos.';
                this.DOM.products.container.appendChild(p);
            }
        }
    },

    /**
     * Busca produtos do arquivo JSON (simulando API), salva no estado e no cache.
     */
    async fetchProducts() {
        console.log('Buscando produtos da API...');
        try {
            // Indica carregamento (acessível)
            if (this.DOM.products.loader) {
                this.DOM.products.loader.classList.remove('hidden');
                this.DOM.products.loader.setAttribute('aria-busy', 'true');
            }

            const response = await fetch('./src/db/products.json');
            if (!response.ok) throw new Error('Falha ao carregar produtos');

            this.products = await response.json();
            console.log('Produtos carregados da API:', this.products.length, 'itens');

            // Salva no cache para próximas visitas
            Utils.cache.set(this.products);

            if (this.DOM.products.container) {
                this.loadProducts('all');
                this.setupEventListeners();
            }

            this.initHeroSlideshow();
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            if (this.DOM.products.container) {
                // Mensagem de erro acessível
                this.DOM.products.container.replaceChildren();
                const alert = document.createElement('p');
                alert.className = 'no-results';
                alert.setAttribute('role', 'alert');
                alert.textContent = 'Não foi possível carregar os produtos no momento. Tente novamente mais tarde.';
                this.DOM.products.container.appendChild(alert);
            }
        } finally {
            if (this.DOM.products.loader) {
                this.DOM.products.loader.classList.add('hidden');
                this.DOM.products.loader.setAttribute('aria-busy', 'false');
            }
        }
    },

    /**
     * Verifica atualizações do catálogo em background sem bloquear a UI.
     * Se houver mudanças, atualiza o cache para uso no próximo carregamento.
     */
    async updateCacheInBackground() {
        try {
            console.log('Verificando atualizações em background...');
            const response = await fetch('./src/db/products.json');
            if (!response.ok) return;
            
            const newProducts = await response.json();
            
            // Compara produtos atuais com novos
            if (JSON.stringify(newProducts) !== JSON.stringify(this.products)) {
                console.log('Novos produtos disponíveis, atualizando cache...');
                Utils.cache.set(newProducts);
            } else {
                console.log('Produtos estão atualizados');
            }
        } catch (error) {
            console.warn('Não foi possível verificar atualizações:', error);
        }
    },

    /**
     * Força atualização completa da lista de produtos:
     * limpa o cache e recarrega da origem.
     */
    async forceRefresh() {
        console.log('Forçando atualização...');
        Utils.cache.clear();
        await this.fetchProducts();
        if (this.DOM.products.container) {
            this.loadProducts('all');
        }
        console.log('Produtos atualizados com sucesso!');
    },

    /**
     * Renderiza os cards de produtos de acordo com a categoria informada.
     * Com transições suaves de fade-out → fade-in para melhor UX.
     * @param {string} [filterCategory='all'] - Categoria alvo (ou 'all' para todas).
     */
    loadProducts(filterCategory = 'all') {
        console.log('Carregando produtos para categoria:', filterCategory);
        
        if (!this.DOM.products.container) {
            console.log('Container de produtos não encontrado');
            return;
        }
        
        // Pega produtos atuais para animar saída
        const currentProducts = this.DOM.products.container.querySelectorAll('.product-card');
        
        // Se existem produtos, anima fade-out antes de remover
        if (currentProducts.length > 0) {
            currentProducts.forEach(card => {
                card.classList.add('fade-out');
            });
            
            // Aguarda animação de saída completar (300ms)
            setTimeout(() => {
                this.renderProducts(filterCategory);
            }, 300);
        } else {
            // Primeira carga ou sem produtos: renderiza diretamente
            this.renderProducts(filterCategory);
        }
    },

    /**
     * Renderiza os cards de produtos com animação de entrada.
     * @param {string} filterCategory - Categoria para filtrar.
     */
    renderProducts(filterCategory) {
        // Mostra o loader (acessível)
        if (this.DOM.products.loader) {
            this.DOM.products.loader.classList.remove('hidden');
            this.DOM.products.loader.setAttribute('aria-busy', 'true');
        }

        // Limpa o container antes de adicionar novos produtos
        this.DOM.products.container.replaceChildren();

        // Pequeno delay para transição mais suave
        setTimeout(() => {
            // Filtra produtos pela categoria selecionada
            const filteredProducts = filterCategory === 'all'
                ? this.products
                : this.products.filter(product => product.category === filterCategory);

            console.log('Produtos filtrados:', filteredProducts);

            // Cria e adiciona os cards de produtos com animação escalonada
            filteredProducts.forEach((product, index) => {
                const productCard = this.createProductCard(product, index);
                this.DOM.products.container.appendChild(productCard);
            });

            // Esconde o loader após renderizar
            if (this.DOM.products.loader) {
                this.DOM.products.loader.classList.add('hidden');
                this.DOM.products.loader.setAttribute('aria-busy', 'false');
            }

            console.log('Produtos carregados com sucesso');
        }, 200); // 200ms de delay para UX mais suave
    },

        /**
         * Filtra produtos por termo de busca no nome e descrição.
         * @param {string} searchTerm - Termo de busca digitado pelo usuário.
         */
        filterProductsBySearch(searchTerm) {
            if (!this.DOM.products.container) return;
        
            // Se busca está vazia, mostra todos os produtos da categoria ativa
            if (!searchTerm) {
                const activeCategory = document.querySelector('.category.active');
                const category = activeCategory ? activeCategory.dataset.category : 'all';
                this.loadProducts(category);
                return;
            }
        
            // Filtra produtos que contêm o termo de busca no nome ou descrição
            const filteredProducts = this.products.filter(product => {
                const nameMatch = product.name.toLowerCase().includes(searchTerm);
                const descMatch = product.description.toLowerCase().includes(searchTerm);
                return nameMatch || descMatch;
            });
        
            // Renderiza produtos filtrados
            this.renderFilteredProducts(filteredProducts);
        },
    
        /**
         * Renderiza lista específica de produtos (usado pela busca).
         * @param {Array} products - Array de produtos para renderizar.
         */
        renderFilteredProducts(products) {
            // Mostra o loader (acessível)
            if (this.DOM.products.loader) {
                this.DOM.products.loader.classList.remove('hidden');
                this.DOM.products.loader.setAttribute('aria-busy', 'true');
            }

            // Limpa container
            this.DOM.products.container.replaceChildren();

            setTimeout(() => {
                if (products.length === 0) {
                    // Exibe mensagem quando não há resultados
                    const p = document.createElement('p');
                    p.className = 'no-results';
                    p.textContent = 'Nenhum produto encontrado.';
                    this.DOM.products.container.appendChild(p);
                } else {
                    // Renderiza produtos encontrados
                    products.forEach((product, index) => {
                        const productCard = this.createProductCard(product, index);
                        this.DOM.products.container.appendChild(productCard);
                    });
                }

                // Esconde loader
                if (this.DOM.products.loader) {
                    this.DOM.products.loader.classList.add('hidden');
                    this.DOM.products.loader.setAttribute('aria-busy', 'false');
                }
            }, 200);
        },

    /**
     * Cria o elemento de card de produto de forma segura (sem innerHTML).
     * @param {object} product
     * @param {number} index - usado para animar entrada escalonada
     * @returns {HTMLDivElement}
     */
    createProductCard(product, index = 0) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.08}s`;

        // Imagem
        const imageWrap = document.createElement('div');
        imageWrap.className = 'product-image';
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = product.image;
        img.alt = product.name;
        imageWrap.appendChild(img);

        // Info
        const info = document.createElement('div');
        info.className = 'product-info';

        const title = document.createElement('h3');
        title.className = 'product-title';
        title.textContent = product.name;

        const desc = document.createElement('p');
        desc.className = 'product-description';
        const short = (product.description || '').slice(0, 80) + '...';
        desc.textContent = short;

        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = `R$ ${Number(product.price).toFixed(2)}`;

        const actions = document.createElement('div');
        actions.className = 'product-actions';

        const details = document.createElement('a');
        details.href = '#';
        details.className = 'btn-details';
        details.dataset.id = String(product.id);
        details.textContent = 'Ver Detalhes';

        const buy = document.createElement('a');
        buy.href = product.link;
        buy.className = 'btn-buy';
        buy.target = '_blank';
        buy.rel = 'noopener noreferrer';
        buy.textContent = 'Comprar';

        actions.appendChild(details);
        actions.appendChild(buy);

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(price);
        info.appendChild(actions);

        card.appendChild(imageWrap);
        card.appendChild(info);
        return card;
    },

    /**
     * Abre o modal para um produto específico.
     * Preenche título, preço, descrição, imagens e links.
     * @param {number} productId - ID do produto a ser exibido.
     */
    openModal(productId) {
        console.log('Abrindo modal para produto:', productId);
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Armazenar elemento que tinha foco antes do modal abrir
        this.previouslyFocusedElement = document.activeElement;

        // Resetar o estado do modal
        this.DOM.modal.container.style.visibility = 'visible';
        this.DOM.modal.container.classList.remove('closing');
        
    // Impedir rolagem do fundo enquanto o modal estiver aberto (inclui mobile)
    this.scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.top = `-${this.scrollLockY}px`;
    document.body.classList.add('no-scroll');
        
        // Ativar o modal com a animação
        requestAnimationFrame(() => {
            this.DOM.modal.container.classList.add('active');
            
            // Focar no botão de fechar após a animação inicial
            setTimeout(() => {
                const closeButton = this.DOM.modal.container.querySelector('.close-modal');
                if (closeButton) {
                    closeButton.focus();
                }
            }, 100);
        });
        
        this.DOM.modal.productTitle.textContent = product.name;
        this.DOM.modal.price.textContent = `R$ ${product.price.toFixed(2)}`;
        this.DOM.modal.description.textContent = product.description;
        
        // Configurar imagens
        const imgs = Array.isArray(product.images) && product.images.length 
            ? product.images 
            : [product.image];
        
        if (this.DOM.modal.mainImage) {
            this.DOM.modal.mainImage.src = imgs[0];
            this.DOM.modal.mainImage.alt = product.name;
            this.DOM.modal.mainImage.draggable = false;
        }
        
        // Configurar miniaturas
        if (this.DOM.modal.thumbs) {
            this.DOM.modal.thumbs.innerHTML = '';
            this.DOM.modal.thumbs.style.display = imgs.length > 1 ? '' : 'none';
            
            imgs.forEach((src, idx) => {
                const thumb = document.createElement('img');
                thumb.src = src;
                thumb.dataset.src = src;
                if (idx === 0) thumb.classList.add('active');
                this.DOM.modal.thumbs.appendChild(thumb);
            });
        }
        
        // Configurar links
        this.DOM.modal.buyLink.href = product.link;
        this.DOM.modal.detailsLink.href = product.link;
    },

    /**
     * Atualiza a posição do zoom da imagem principal conforme o mouse se move.
     * Só atua quando o container está no estado "zoomed".
     * @param {MouseEvent} e
     */
    handleImageZoom(e) {
        const imageContainer = this.DOM.modal.imageContainer;
        const image = this.DOM.modal.mainImage;
        
        if (!imageContainer || !image || !imageContainer.classList.contains('zoomed')) return;

        const rect = imageContainer.getBoundingClientRect();
        const { moveX, moveY } = ImageZoomHelpers.calculateZoomPosition(e, rect);
        ImageZoomHelpers.applyZoomTransform(image, moveX, moveY);
    },

    /**
     * Alterna o estado de zoom da imagem principal (apenas desktop).
     * No primeiro clique ativa e posiciona o zoom; no segundo, reseta.
     * @param {MouseEvent} e
     */
    toggleImageZoom(e) {
        const imageContainer = this.DOM.modal.imageContainer;
        const image = this.DOM.modal.mainImage;
        
        if (!imageContainer || !image) return;

        if (!imageContainer.classList.contains('zoomed')) {
            imageContainer.classList.add('zoomed');
            this.handleImageZoom(e);
        } else {
            imageContainer.classList.remove('zoomed');
            ImageZoomHelpers.resetTransform(image);
        }
    },

    /**
     * Fecha o modal com animação, garantindo que o estado de zoom seja resetado.
     */
    closeModal() {
        if (this.DOM.modal.imageContainer?.classList.contains('zoomed')) {
            this.DOM.modal.imageContainer.classList.remove('zoomed');
            ImageZoomHelpers.resetTransform(this.DOM.modal.mainImage);
        }
        
        this.DOM.modal.container.classList.add('closing');
        this.DOM.modal.container.classList.remove('active');
        
        this.DOM.modal.container.addEventListener('transitionend', () => {
            this.DOM.modal.container.classList.remove('closing');
            this.DOM.modal.container.style.visibility = 'hidden';
            
            // Reativar rolagem do fundo ao fechar o modal
            document.body.classList.remove('no-scroll');
            // Limpa o deslocamento aplicado e restaura a rolagem na posição anterior
            if (typeof this.scrollLockY === 'number') {
                const y = this.scrollLockY;
                this.scrollLockY = null;
                document.body.style.top = '';
                window.scrollTo(0, y);
            } else {
                document.body.style.top = '';
            }
            
            // Restaurar foco para o elemento que estava focado antes do modal abrir
            if (this.previouslyFocusedElement) {
                this.previouslyFocusedElement.focus();
                this.previouslyFocusedElement = null;
            }
        }, { once: true });
    },

    // Configurar event listeners
    // Configura delegação de eventos para toda a aplicação
    /**
     * Registra listeners com delegação de eventos para reduzir custos de performance.
     * - Produtos: abre modal ao clicar em "Ver Detalhes";
     * - Categorias: aplica filtro e estado ativo;
     * - Navegação: fecha menu mobile ao navegar;
     * - Footer: rolagem suave para âncoras;
     * - Modal: fechar, alternar zoom, trocar miniaturas.
     */
    setupEventListeners() {
        console.log('Configurando event listeners...');
        
            // Event listener para busca de produtos
            if (this.DOM.products.searchInput) {
                this.DOM.products.searchInput.addEventListener('input', Utils.debounce((e) => {
                    const searchTerm = e.target.value.trim().toLowerCase();
                    this.filterProductsBySearch(searchTerm);
                }, 300));
            }
        
        // Delegação de eventos para os botões de produto (Ver Detalhes)
        if (this.DOM.products.container) {
            this.DOM.products.container.addEventListener('click', (e) => {
                const detailsButton = e.target.closest('.btn-details');
                if (detailsButton) {
                    e.preventDefault();
                    const productId = parseInt(detailsButton.dataset.id);
                    this.openModal(productId);
                }
            });
        }

        // Delegação de eventos para os botões de categoria
        const categoriesContainer = document.querySelector('.categories');
        if (categoriesContainer) {
            console.log('Configurando eventos das categorias com delegação');
            categoriesContainer.addEventListener('click', (e) => {
                const categoryButton = e.target.closest('.category');
                if (categoryButton) {
                    console.log('Categoria clicada:', categoryButton.dataset.category);
                    
                    // Remove classe active e aria-pressed de todas as categorias
                    this.DOM.products.categories.forEach(c => {
                        c.classList.remove('active');
                        c.setAttribute('aria-pressed', 'false');
                    });
                    
                    // Adiciona active e aria-pressed na categoria clicada
                    categoryButton.classList.add('active');
                    categoryButton.setAttribute('aria-pressed', 'true');
                    
                    // Recarrega produtos filtrados
                    this.loadProducts(categoryButton.dataset.category);
                }
            });

            // Navegação por teclado entre categorias (setas esquerda/direita)
            categoriesContainer.addEventListener('keydown', (e) => {
                const categoryButton = e.target.closest('.category');
                if (!categoryButton) return;

                const categories = Array.from(this.DOM.products.categories);
                const currentIndex = categories.indexOf(categoryButton);
                let targetIndex;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    targetIndex = (currentIndex + 1) % categories.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    targetIndex = (currentIndex - 1 + categories.length) % categories.length;
                } else {
                    return;
                }

                // Foca na próxima/anterior categoria
                categories[targetIndex].focus();
            });
        }

        // Delegação de eventos para o menu de navegação
        if (this.DOM.nav.menu) {
            this.DOM.nav.menu.addEventListener('click', (e) => {
                const navLink = e.target.closest('a');
                if (navLink) {
                    // Fecha menu mobile após clicar em um link
                    if (window.innerWidth <= 768) {
                        this.DOM.nav.container.classList.remove('active');
                    }
                }
            });
        }

        // Toggle do menu mobile removido daqui (centralizado em header.js para evitar duplicidade)

        // Delegação de eventos para links do footer (scroll suave para âncoras)
        if (this.DOM.footer.container) {
            this.DOM.footer.container.addEventListener('click', (e) => {
                const footerLink = e.target.closest('a');
                if (footerLink && footerLink.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = footerLink.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }

        // Delegação de eventos para o modal e suas interações
        if (this.DOM.modal.container) {
            this.DOM.modal.container.addEventListener('click', (e) => {
                // Fecha modal ao clicar na área externa
                if (e.target === this.DOM.modal.container) {
                    this.closeModal();
                    return;
                }

                // Fecha modal ao clicar no botão X
                if (e.target.closest('.close-modal')) {
                    this.closeModal();
                    return;
                }

                // Fecha modal ao clicar em "Ver na Loja"
                const actionButton = e.target.closest('.modal-actions .btn');
                if (actionButton && actionButton.classList.contains('btn-details')) {
                    e.preventDefault();
                    this.closeModal();
                    return;
                }

                // Ativa/desativa zoom ao clicar na imagem (desktop apenas)
                const mainImage = e.target.closest('#modal-main-image');
                if (mainImage && window.innerWidth >= 768) {
                    this.toggleImageZoom(e);
                }
            });

            // Movimento do mouse para controlar o zoom
            this.DOM.modal.container.addEventListener('mousemove', (e) => {
                if (this.DOM.modal.imageContainer?.classList.contains('zoomed')) {
                    this.handleImageZoom(e);
                }
            });

            // Delegação de eventos para as miniaturas de imagem
            if (this.DOM.modal.thumbs) {
                this.DOM.modal.thumbs.addEventListener('click', (e) => {
                    const thumb = e.target.closest('img');
                    if (thumb) {
                        // Desativa zoom ao trocar de imagem
                        if (this.DOM.modal.imageContainer?.classList.contains('zoomed')) {
                            this.toggleImageZoom(e);
                        }
                        // Atualiza imagem principal
                        this.DOM.modal.mainImage.src = thumb.dataset.src;
                        // Atualiza estado das miniaturas
                        this.DOM.modal.thumbs.querySelectorAll('img')
                            .forEach(img => img.classList.remove('active'));
                        thumb.classList.add('active');
                    }
                });
            }
        }

        // Registra eventos globais (teclado e redimensionamento)
        this.setupGlobalEvents();
    },

    /**
     * Registra eventos globais não ligados a elementos específicos:
     * - Teclado (Escape)
     * - Redimensionamento da janela
     */
    setupGlobalEvents() {
        document.addEventListener('keydown', GlobalEventHandlers.handleKeyPress(this));
        window.addEventListener('resize', GlobalEventHandlers.handleResize(this));

        // Scroll-to-top: mostrar/ocultar com scroll e ação de clique
        const btn = this.DOM.ui?.scrollToTop;
        if (btn) {
            // Atualiza visibilidade no load inicial
            const toggleVisibility = () => {
                if (window.scrollY > 300) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            };
            toggleVisibility();

            // Usa throttle para melhor performance em scroll
            window.addEventListener('scroll', Utils.throttle(toggleVisibility, 150));

            // Rolagem suave ao topo
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    },

    /**
     * Controla o slideshow do hero (troca de imagens de fundo a cada 10s).
     * Usa crossfade suave entre imagens com transições CSS.
     */
    initHeroSlideshow() {
        if (!this.DOM.hero.backgrounds?.length) return;
        
        let currentIndex = 0;
        const backgrounds = this.DOM.hero.backgrounds;
        
        // Troca de slide a cada 10 segundos com crossfade suave
        setInterval(() => {
            // Calcula próximo índice
            const nextIndex = (currentIndex + 1) % backgrounds.length;
            
            // Remove classe active da imagem atual (fade out)
            backgrounds[currentIndex].classList.remove('active');
            
            // Adiciona classe active na próxima imagem (fade in)
            // O CSS cuida da transição suave entre elas
            backgrounds[nextIndex].classList.add('active');
            
            // Atualiza índice atual
            currentIndex = nextIndex;
        }, 10000);
    }
};

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    App.initialize();
});