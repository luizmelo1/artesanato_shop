/**
 * Módulo de Gestão de Produtos
 * Carrega, filtra, renderiza e cria cards de produtos
 */

import { debugLog, debugError } from '../utils/debug.js';
import { createPictureWithFallback } from '../helpers/image-fallback.js';

// Configuração de paginação
const PRODUCTS_PER_PAGE = 20;
let lastVisibleDoc = null;
let hasMoreProducts = true;
let isLoadingMore = false;

/**
 * Busca produtos do Firestore com paginação e salva no estado.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 * @param {boolean} loadMore - Se true, carrega mais produtos (paginação)
 */
export async function fetchProducts(dom, state, loadMore = false) {
    debugLog('=== fetchProducts ===');
    debugLog('Iniciando busca de produtos... LoadMore:', loadMore);
    
    // Evita múltiplas requisições simultâneas
    if (isLoadingMore) {
        debugLog('Já está carregando produtos, ignorando...');
        return state.products;
    }
    
    // Verifica se ainda há mais produtos para carregar
    if (loadMore && !hasMoreProducts) {
        debugLog('Não há mais produtos para carregar');
        return state.products;
    }
    
    isLoadingMore = true;
    
    try {
        // Indica carregamento (acessível)
        if (dom.products.loader) {
            dom.products.loader.classList.remove('hidden');
            dom.products.loader.setAttribute('aria-busy', 'true');
            debugLog('Loader ativado');
        }

        // Verifica se Firebase está configurado
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            const error = new Error('Firebase não está configurado. Impossível carregar produtos.');
            debugError(error.message);
            state.products = [];
            throw error;
        }

        debugLog('Buscando produtos do Firestore...');
        const db = firebase.firestore();
        
        // Construir query com paginação
        let query = db.collection('products')
            .where('active', '==', true)
            .orderBy('name')
            .limit(PRODUCTS_PER_PAGE);
        
        // Se está carregando mais, começa após o último documento
        if (loadMore && lastVisibleDoc) {
            query = query.startAfter(lastVisibleDoc);
            debugLog('Carregando após documento:', lastVisibleDoc.id);
        } else if (!loadMore) {
            // Reset para primeira página
            lastVisibleDoc = null;
            hasMoreProducts = true;
        }
        
        const snapshot = await query.get();
        
        debugLog('Snapshot recebido:', snapshot.size, 'documentos');
        
        // Verifica se há mais produtos
        hasMoreProducts = snapshot.size === PRODUCTS_PER_PAGE;
        debugLog('Há mais produtos:', hasMoreProducts);
        
        // Salva último documento para próxima paginação
        if (snapshot.docs.length > 0) {
            lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
            debugLog('Último documento:', lastVisibleDoc.id);
        }
        
        // Converte documentos para array de produtos
        const newProducts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Sem nome',
                category: data.category || 'Outros',
                price: data.price || 0,
                description: data.description || '',
                link: data.link || '',
                image: data.image || '',
                images: data.images || []
            };
        });
        
        // Se loadMore, adiciona ao array existente, senão substitui
        if (loadMore) {
            state.products = [...state.products, ...newProducts];
            debugLog('Produtos adicionados. Total:', state.products.length);
        } else {
            state.products = newProducts;
            debugLog('Produtos carregados:', state.products.length, 'itens');
        }
        
        debugLog('Primeiros 3 produtos:', state.products.slice(0, 3));

        return state.products;
    } catch (err) {
        debugError('ERRO ao buscar produtos:', err);
        debugError('Erro detalhado:', err.message, err.stack);
        if (dom.products.container) {
            // Mensagem de erro acessível
            dom.products.container.replaceChildren();
            const alert = document.createElement('p');
            alert.className = 'no-results';
            alert.setAttribute('role', 'alert');
            alert.textContent = 'Não foi possível carregar os produtos no momento. Tente novamente mais tarde.';
            dom.products.container.appendChild(alert);
        }
        throw err;
    } finally {
        isLoadingMore = false;
        if (dom.products.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
            debugLog('Loader desativado');
        }
    }
}

/**
 * Verifica se há mais produtos disponíveis para carregar
 * @returns {boolean}
 */
export function hasMore() {
    return hasMoreProducts;
}

/**
 * Carrega próxima página de produtos (infinite scroll)
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function loadMoreProducts(dom, state) {
    debugLog('=== loadMoreProducts ===');
    
    if (!hasMoreProducts || isLoadingMore) {
        debugLog('Não pode carregar mais produtos');
        return;
    }
    
    await fetchProducts(dom, state, true);
    
    // Renderiza apenas os novos produtos
    const filter = getCurrentFilter(dom);
    loadProducts(dom, state.products, filter, true);
}

/**
 * Obtém filtro atual ativo
 * @param {object} dom - Referências DOM
 * @returns {string|Array}
 */
function getCurrentFilter(dom) {
    if (!dom.products.categories) return 'all';
    
    const selected = Array.from(dom.products.categories)
        .filter(c => c.classList.contains('active') && c.dataset.category !== 'all')
        .map(c => c.dataset.category);
    
    return selected.length > 0 ? selected : 'all';
}

/**
 * Força atualização completa da lista de produtos do Firestore.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function forceRefresh(dom, state) {
    debugLog('Forçando atualização...');
    await fetchProducts(dom, state);
    if (dom.products.container) {
        loadProducts(dom, state.products, 'all');
    }
    debugLog('Produtos atualizados com sucesso!');
}

/**
 * Renderiza os cards de produtos de acordo com a categoria informada.
 * Com transições suaves de fade-out → fade-in para melhor UX.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} [filterCategory='all'] - Categoria alvo (ou 'all' para todas).
 * @param {boolean} [append=false] - Se true, adiciona produtos sem limpar container
 */
export function loadProducts(dom, products, filter = 'all', append = false) {
    debugLog('=== loadProducts ===');
    debugLog('DOM:', dom);
    debugLog('Products array length:', products.length);
    debugLog('Filter:', filter);
    debugLog('Append mode:', append);
    
    if (!dom.products.container) {
        debugLog('Container de produtos não encontrado');
        return;
    }
    
    if (append) {
        // Modo append: adiciona novos produtos sem animação de saída
        renderProducts(dom, products, filter, append);
        return;
    }
    
    // Pega produtos atuais para animar saída
    const currentProducts = dom.products.container.querySelectorAll('.product-card');
    debugLog('Current products to fade out:', currentProducts.length);
    
    // Se existem produtos, anima fade-out antes de remover
    if (currentProducts.length > 0) {
        for (const card of currentProducts) {
            card.classList.add('fade-out');
        }
        
        // Aguarda animação de saída completar (300ms)
        setTimeout(() => {
            renderProducts(dom, products, filter, false);
        }, 300);
    } else {
        // Primeira carga ou sem produtos: renderiza diretamente
        debugLog('Primeira carga, renderizando diretamente');
        renderProducts(dom, products, filter, false);
    }
}

/**
 * Renderiza os cards de produtos com animação de entrada.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} filterCategory - Categoria para filtrar.
 * @param {boolean} append - Se true, adiciona ao container existente
 */
function renderProducts(dom, products, filter, append = false) {
    debugLog('=== renderProducts ===');
    debugLog('Filter:', filter);
    debugLog('Total products:', products.length);
    debugLog('Append mode:', append);
    
    // Mostra o loader (acessível)
    if (dom.products.loader) {
        dom.products.loader.classList.remove('hidden');
        dom.products.loader.setAttribute('aria-busy', 'true');
    }

    // Limpa o container apenas se não estiver em modo append
    if (!append) {
        dom.products.container.replaceChildren();
    }

    // Filtra produtos pela categoria selecionada
    let filteredProducts = products;
    if (Array.isArray(filter)) {
        filteredProducts = products.filter(p => filter.includes(p.category));
        debugLog('Filtrando por categorias:', filter);
    } else if (filter !== 'all') {
        filteredProducts = products.filter(p => p.category === filter);
        debugLog('Filtrando por categoria:', filter);
    }

    debugLog('Produtos filtrados:', filteredProducts.length);

    // Em modo append, calcula índice inicial baseado nos cards existentes
    let startIndex = 0;
    if (append) {
        const existingCards = dom.products.container.querySelectorAll('.product-card');
        startIndex = existingCards.length;
        debugLog('Índice inicial para append:', startIndex);
        
        // Filtra apenas produtos novos (não renderizados ainda)
        const existingIds = new Set(
            Array.from(existingCards).map(card => {
                const detailsBtn = card.querySelector('.btn-details');
                return detailsBtn ? detailsBtn.dataset.id : null;
            }).filter(Boolean)
        );
        
        filteredProducts = filteredProducts.filter(p => !existingIds.has(p.id));
        debugLog('Novos produtos para renderizar:', filteredProducts.length);
    }

    // Cria e adiciona os cards de produtos com animação escalonada
    let index = startIndex;
    for (const product of filteredProducts) {
        const productCard = createProductCard(product, index);
        dom.products.container.appendChild(productCard);
        index++;
    }

    debugLog('Cards criados:', index - startIndex);

    // Esconde o loader após renderizar
    if (dom.products.loader) {
        dom.products.loader.classList.add('hidden');
        dom.products.loader.setAttribute('aria-busy', 'false');
    }

    debugLog('Produtos carregados com sucesso');
}

/**
 * Filtra produtos por termo de busca no nome e descrição.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} searchTerm - Termo de busca digitado pelo usuário.
 */
export function filterProductsBySearch(dom, products, searchTerm) {
    if (!dom.products.container) return;

    // Se busca está vazia, reaplica filtro de categoria ativo
    if (!searchTerm) {
        const selected = dom.products.categories 
            ? Array.from(dom.products.categories)
                .filter(c => c.classList.contains('active') && c.dataset.category !== 'all')
                .map(c => c.dataset.category)
            : [];
        const filterParam = selected.length > 0 ? selected : 'all';
        loadProducts(dom, products, filterParam);
        return;
    }

    // Filtra produtos que contêm o termo de busca no nome ou descrição
    const filteredProducts = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const descMatch = product.description.toLowerCase().includes(searchTerm);
        return nameMatch || descMatch;
    });

    // Renderiza produtos filtrados
    renderFilteredProducts(dom, filteredProducts);
}

/**
 * Renderiza lista específica de produtos (usado pela busca).
 * @param {object} dom - Referências DOM
 * @param {Array} products - Array de produtos para renderizar.
 */
function renderFilteredProducts(dom, products) {
    // Mostra o loader (acessível)
    if (dom.products.loader) {
        dom.products.loader.classList.remove('hidden');
        dom.products.loader.setAttribute('aria-busy', 'true');
    }

    // Limpa container
    dom.products.container.replaceChildren();

    setTimeout(() => {
        // Aplica filtros de categoria ativos também, se houver
        const selected = dom.products.categories
            ? Array.from(dom.products.categories)
                .filter(c => c.classList.contains('active') && c.dataset.category !== 'all')
                .map(c => c.dataset.category)
            : [];
        const byCategory = selected.length > 0 
            ? products.filter(p => selected.includes(p.category)) 
            : products;

        if (byCategory.length === 0) {
            // Exibe mensagem quando não há resultados
            const p = document.createElement('p');
            p.className = 'no-results';
            p.textContent = 'Nenhum produto encontrado.';
            dom.products.container.appendChild(p);
        } else {
            // Renderiza produtos encontrados
            let index = 0;
            for (const product of byCategory) {
                const productCard = createProductCard(product, index);
                dom.products.container.appendChild(productCard);
                index++;
            }
        }

        // Esconde loader
        if (dom.products.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
        }
    }, 200);
}

/**
 * Cria o elemento de card de produto de forma segura (sem innerHTML).
 * @param {object} product - Dados do produto
 * @param {number} index - usado para animar entrada escalonada
 * @returns {HTMLDivElement}
 */
export function createProductCard(product, index = 0) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.08}s`;

    // Imagem com fallback WebP
    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-image';
    const picture = createPictureWithFallback(product.image, product.name, {
        loading: 'lazy',
        width: 400,
        height: 300
    });
    imageWrap.appendChild(picture);

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
}
