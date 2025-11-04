/**
 * Módulo de Gestão de Produtos
 * Carrega, filtra, renderiza e cria cards de produtos
 */

import * as Utils from '../utils/functions.js';
import { cache } from '../utils/cache.js';

/**
 * Busca produtos do arquivo JSON (simulando API), salva no estado e no cache.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function fetchProducts(dom, state) {
    console.log('Buscando produtos da API...');
    try {
        // Indica carregamento (acessível)
        if (dom.products.loader) {
            dom.products.loader.classList.remove('hidden');
            dom.products.loader.setAttribute('aria-busy', 'true');
        }

        const response = await fetch('./src/db/products.json');
        if (!response.ok) throw new Error('Falha ao carregar produtos');

        state.products = await response.json();
        console.log('Produtos carregados da API:', state.products.length, 'itens');

        // Salva no cache para próximas visitas
        cache.set(state.products);

        return state.products;
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
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
        }
    }
}

/**
 * Verifica atualizações do catálogo em background sem bloquear a UI.
 * Se houver mudanças, atualiza o cache para uso no próximo carregamento.
 * @param {Array} currentProducts - Produtos atuais em memória
 */
export async function updateCacheInBackground(currentProducts) {
    try {
        console.log('Verificando atualizações em background...');
        const response = await fetch('./src/db/products.json');
        if (!response.ok) return;
        
        const newProducts = await response.json();
        
        // Compara produtos atuais com novos
        if (JSON.stringify(newProducts) !== JSON.stringify(currentProducts)) {
            console.log('Novos produtos disponíveis, atualizando cache...');
            cache.set(newProducts);
        } else {
            console.log('Produtos estão atualizados');
        }
    } catch (error) {
        console.warn('Não foi possível verificar atualizações:', error);
    }
}

/**
 * Força atualização completa da lista de produtos:
 * limpa o cache e recarrega da origem.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function forceRefresh(dom, state) {
    console.log('Forçando atualização...');
    cache.clear();
    await fetchProducts(dom, state);
    if (dom.products.container) {
        loadProducts(dom, state.products, 'all');
    }
    console.log('Produtos atualizados com sucesso!');
}

/**
 * Renderiza os cards de produtos de acordo com a categoria informada.
 * Com transições suaves de fade-out → fade-in para melhor UX.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} [filterCategory='all'] - Categoria alvo (ou 'all' para todas).
 */
export function loadProducts(dom, products, filter = 'all') {
    console.log('Carregando produtos para filtro:', filter);
    
    if (!dom.products.container) {
        console.log('Container de produtos não encontrado');
        return;
    }
    
    // Pega produtos atuais para animar saída
    const currentProducts = dom.products.container.querySelectorAll('.product-card');
    
    // Se existem produtos, anima fade-out antes de remover
    if (currentProducts.length > 0) {
        currentProducts.forEach(card => {
            card.classList.add('fade-out');
        });
        
        // Aguarda animação de saída completar (300ms)
        setTimeout(() => {
            renderProducts(dom, products, filter);
        }, 300);
    } else {
        // Primeira carga ou sem produtos: renderiza diretamente
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
    // Mostra o loader (acessível)
    if (dom.products.loader) {
        dom.products.loader.classList.remove('hidden');
        dom.products.loader.setAttribute('aria-busy', 'true');
    }

    // Limpa o container antes de adicionar novos produtos
    dom.products.container.replaceChildren();

    // Pequeno delay para transição mais suave
    setTimeout(() => {
        // Filtra produtos pela categoria selecionada
        let filteredProducts = products;
        if (Array.isArray(filter)) {
            filteredProducts = products.filter(p => filter.includes(p.category));
        } else if (filter !== 'all') {
            filteredProducts = products.filter(p => p.category === filter);
        }

        console.log('Produtos filtrados:', filteredProducts);

        // Cria e adiciona os cards de produtos com animação escalonada
        filteredProducts.forEach((product, index) => {
            const productCard = createProductCard(product, index);
            dom.products.container.appendChild(productCard);
        });

        // Esconde o loader após renderizar
        if (dom.products.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
        }

        console.log('Produtos carregados com sucesso');
    }, 200); // 200ms de delay para UX mais suave
}

/**
 * Filtra produtos por termo de busca no nome e descrição.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {string} searchTerm - Termo de busca digitado pelo usuário.
 */
export function filterProductsBySearch(dom, products, searchTerm) {
    if (!dom.products.container) return;

    // Se busca está vazia, mostra todos os produtos da categoria ativa
    if (!searchTerm) {
        const selected = Array.from(document.querySelectorAll('.category.active'))
            .map(c => c.dataset.category)
            .filter(cat => cat !== 'all');
        const allBtn = document.querySelector('.category[data-category="all"]');
        const isAllActive = allBtn ? allBtn.classList.contains('active') : false;
        if (selected.length === 0 && !isAllActive) {
            // Sem filtros (e 'Todos' inativo) e sem busca: não exibe produtos
            if (dom.products.section) {
                dom.products.section.classList.add('hidden-until-interaction');
                dom.products.section.setAttribute('aria-hidden', 'true');
            }
            dom.products.container.replaceChildren();
            if (dom.products.loader) {
                dom.products.loader.classList.add('hidden');
                dom.products.loader.setAttribute('aria-busy', 'false');
            }
            return;
        }
        const filterParam = selected.length ? selected : 'all';
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
        const selected = Array.from(document.querySelectorAll('.category.active'))
            .map(c => c.dataset.category)
            .filter(cat => cat !== 'all');
        const byCategory = selected.length ? products.filter(p => selected.includes(p.category)) : products;

        if (byCategory.length === 0) {
            // Exibe mensagem quando não há resultados
            const p = document.createElement('p');
            p.className = 'no-results';
            p.textContent = 'Nenhum produto encontrado.';
            dom.products.container.appendChild(p);
        } else {
            // Renderiza produtos encontrados
            byCategory.forEach((product, index) => {
                const productCard = createProductCard(product, index);
                dom.products.container.appendChild(productCard);
            });
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
}
