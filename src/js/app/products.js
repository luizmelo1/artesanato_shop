/**
 * Módulo de Gestão de Produtos
 * Carrega, filtra, renderiza e cria cards de produtos
 */

import { debugLog, debugError } from '../utils/debug.js';
import { createPictureWithFallback } from '../helpers/image-fallback.js';

/**
 * Busca produtos do Firestore, salva no estado e no cache.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function fetchProducts(dom, state) {
    debugLog('=== fetchProducts ===');
    debugLog('Iniciando busca de produtos...');
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
        
        // Busca produtos ativos SEM orderBy (evita necessidade de índice)
        // Vamos ordenar no cliente após receber os dados
        const snapshot = await db.collection('products')
            .where('active', '==', true)
            .get();
        
        debugLog('Snapshot recebido:', snapshot.size, 'documentos');
        
        // Converte documentos para array de produtos
        state.products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Sem nome',
                category: data.category || 'Outros',
                price: data.price || 0,
                description: data.description || '',
                link: data.link || '',
                image: data.image || ''
            };
        });
        
        // Ordena produtos por nome no cliente (já que removemos orderBy da query)
        state.products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        
        debugLog('Produtos carregados do Firestore:', state.products.length, 'itens');
        debugLog('Primeiros 3 produtos:', state.products.slice(0, 3));

        // Cache desativado - não salva mais no localStorage
        // cache.set(state.products);

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
        if (dom.products.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
            debugLog('Loader desativado');
        }
    }
}

/**
 * Função removida - cache desativado, produtos sempre vêm do Firestore
 */
export async function updateCacheInBackground() {
    // Cache removido - não faz mais nada
}

/**
 * Força atualização completa da lista de produtos:
 * recarrega direto do Firestore (cache já desativado)
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function forceRefresh(dom, state) {
    debugLog('Forçando atualização...');
    // Cache desativado - não precisa limpar
    // cache.clear();
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
 */
export function loadProducts(dom, products, filter = 'all') {
    debugLog('=== loadProducts ===');
    debugLog('DOM:', dom);
    debugLog('Products array length:', products.length);
    debugLog('Filter:', filter);
    
    if (!dom.products.container) {
        debugLog('Container de produtos não encontrado');
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
            renderProducts(dom, products, filter);
        }, 300);
    } else {
        // Primeira carga ou sem produtos: renderiza diretamente
        debugLog('Primeira carga, renderizando diretamente');
        renderProducts(dom, products, filter);
    }
}

/**
 * Renderiza os cards de produtos com animação de entrada.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} filterCategory - Categoria para filtrar.
 */
function renderProducts(dom, products, filter) {
    debugLog('=== renderProducts ===');
    debugLog('Filter:', filter);
    debugLog('Total products:', products.length);
    
    // Mostra o loader (acessível)
    if (dom.products.loader) {
        dom.products.loader.classList.remove('hidden');
        dom.products.loader.setAttribute('aria-busy', 'true');
    }

    // Limpa o container antes de adicionar novos produtos
    dom.products.container.replaceChildren();

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

    // Cria e adiciona os cards de produtos com animação escalonada
    let index = 0;
    for (const product of filteredProducts) {
        const productCard = createProductCard(product, index);
        dom.products.container.appendChild(productCard);
        index++;
    }

    debugLog('Cards criados:', index);

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
