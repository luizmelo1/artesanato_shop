/**
 * Módulo de Event Listeners
 * Gerencia delegação de eventos para toda aplicação
 */

import * as Utils from '../utils/functions.js';
import * as GlobalHandlers from '../handlers/global-events.js';
import { debugLog } from '../utils/debug.js';

/**
 * Registra listeners com delegação de eventos para reduzir custos de performance.
 * - Produtos: abre modal ao clicar em "Ver Detalhes";
 * - Categorias: aplica filtro e estado ativo;
 * - Navegação: fecha menu mobile ao navegar;
 * - Footer: rolagem suave para âncoras;
 * - Modal: fechar, alternar zoom, trocar miniaturas.
 * @param {object} dom - Referências DOM
 * @param {object} callbacks - Funções de callback para eventos
 */
export function setupEventListeners(dom, callbacks) {
    debugLog('Configurando event listeners...');
    const revealIfHidden = () => {
        const section = dom.products?.section;
        if (section?.classList.contains('hidden-until-interaction')) {
            section.classList.remove('hidden-until-interaction');
            section.removeAttribute('aria-hidden');
            // dispara animação de entrada
            section.classList.add('fade-in-reveal');
            // remove a classe após a animação para evitar efeitos colaterais
            setTimeout(() => section.classList.remove('fade-in-reveal'), 600);

            // Reaplica animação de entrada nos cards, caso já tenham sido renderidos em background
            const cards = section.querySelectorAll('.product-card');
            if (cards.length) {
                let idx = 0;
                for (const card of cards) {
                    card.style.animation = 'none';
                    // força reflow para reiniciar animação
                    // eslint-disable-next-line no-unused-expressions
                    card.offsetHeight;
                    card.style.animation = `fadeIn 0.5s ease forwards ${idx * 0.08}s`;
                    idx++;
                }
            }
        }
    };

    const hideIfNoSelection = () => {
        const section = dom.products?.section;
        if (section && !section.classList.contains('hidden-until-interaction')) {
            section.classList.add('hidden-until-interaction');
            section.setAttribute('aria-hidden', 'true');
        }
        if (dom.products?.container) {
            dom.products.container.replaceChildren();
        }
        if (dom.products?.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
        }
    };

    const updateClearBtnVisibility = () => {
        const container = document.querySelector('.categories');
        if (!container) return;
        const clearBtn = container.querySelector('.clear-filters');
        if (!clearBtn) return;

        const activeCats = dom.products?.categories
            ? Array.from(dom.products.categories).filter(c => c.classList.contains('active') && c.dataset.category !== 'all')
            : [];
        const hasActiveCats = activeCats.length > 0;
        const hasSearch = !!(dom.products?.searchInput?.value.trim());
        if (hasActiveCats || hasSearch) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }

        // Atualiza o contador de filtros ativos (apenas categorias)
        const badge = clearBtn.querySelector('.filters-count');
        if (badge) {
            if (activeCats.length > 0) {
                badge.textContent = `(${activeCats.length})`;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    };
    
    // Event listener para busca de produtos
    if (dom.products.searchInput) {
        dom.products.searchInput.addEventListener('input', Utils.debounce((e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            revealIfHidden();
            updateClearBtnVisibility();
            callbacks.onSearch(searchTerm);
        }, 300));
    }

    // Delegação de eventos para os botões de produto (Ver Detalhes)
    if (dom.products.container) {
        dom.products.container.addEventListener('click', (e) => {
            const detailsButton = e.target.closest('.btn-details');
            if (detailsButton) {
                e.preventDefault();
                const productId = Number.parseInt(detailsButton.dataset.id, 10);
                callbacks.onOpenModal(productId);
            }
        });
    }

    // === Funções auxiliares para categorias ===
    const clearAllCategories = () => {
        for (const c of dom.products.categories) {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
        }
    };

    const deactivateAllCategory = () => {
        for (const c of dom.products.categories) {
            if (c.dataset.category === 'all') {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            }
        }
    };

    const handleAllCategoryClick = (btn) => {
        const nowActive = !btn.classList.contains('active');
        clearAllCategories();
        if (nowActive) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        }
    };

    const handleSpecificCategoryClick = (btn) => {
        deactivateAllCategory();
        const willActivate = !btn.classList.contains('active');
        btn.classList.toggle('active');
        btn.setAttribute('aria-pressed', willActivate ? 'true' : 'false');
    };

    const getActiveCategories = () => {
        return Array.from(dom.products.categories)
            .filter(c => c.classList.contains('active') && c.dataset.category !== 'all')
            .map(c => c.dataset.category);
    };

    const isAllCategoryActive = () => {
        return Array.from(dom.products.categories).some(c => c.dataset.category === 'all' && c.classList.contains('active'));
    };

    // Delegação de eventos para os botões de categoria
    const categoriesContainer = document.querySelector('.categories');
    if (categoriesContainer) {
        debugLog('Configurando eventos das categorias com delegação');
        categoriesContainer.addEventListener('click', (e) => {
            // Limpar filtros
            const clearBtn = e.target.closest('.clear-filters');
            if (clearBtn) {
                clearAllCategories();
                if (dom.products.searchInput) dom.products.searchInput.value = '';
                hideIfNoSelection();
                updateClearBtnVisibility();
                return;
            }

            const btn = e.target.closest('.category');
            if (!btn) return;

            revealIfHidden();

            const clickedCat = btn.dataset.category;
            const isAll = clickedCat === 'all';

            if (isAll) {
                handleAllCategoryClick(btn);
            } else {
                handleSpecificCategoryClick(btn);
            }

            // Coleta categorias ativas (exceto 'all')
            const selected = getActiveCategories();

            // Se nada selecionado, considera 'all'
            const hasSearch = !!(dom.products?.searchInput?.value.trim());
            if (selected.length === 0 && !hasSearch) {
                if (isAllCategoryActive()) {
                    // 'Todos' ativo sem busca: mostrar todos
                    revealIfHidden();
                    callbacks.onCategoryChange('all');
                    updateClearBtnVisibility();
                    return;
                }
                // Nenhum filtro (nem 'Todos') e nenhuma busca: não exibir produtos
                hideIfNoSelection();
                updateClearBtnVisibility();
                return;
            }
            const filterParam = selected.length ? selected : 'all';
            
            // Recarrega produtos com múltiplas categorias
            callbacks.onCategoryChange(filterParam);
            updateClearBtnVisibility();
        });

        // Navegação por teclado entre categorias (setas esquerda/direita)
        categoriesContainer.addEventListener('keydown', (e) => {
            const categoryButton = e.target.closest('.category');
            if (!categoryButton) return;

            const categories = Array.from(dom.products.categories);
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
    if (dom.nav.menu) {
        dom.nav.menu.addEventListener('click', (e) => {
            const navLink = e.target.closest('a');
            if (navLink) {
                // Fecha menu mobile após clicar em um link
                if (window.innerWidth <= 768) {
                    dom.nav.container.classList.remove('active');
                }
            }
        });
    }

    // Delegação de eventos para links do footer (scroll suave para âncoras)
    if (dom.footer.container) {
        dom.footer.container.addEventListener('click', (e) => {
            const footerLink = e.target.closest('a');
            if (footerLink?.getAttribute('href')?.startsWith('#')) {
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
    if (dom.modal.container) {
        dom.modal.container.addEventListener('click', (e) => {
            // Fecha modal ao clicar na área externa
            if (e.target === dom.modal.container) {
                callbacks.onCloseModal();
                return;
            }

            // Fecha modal ao clicar no botão X
            if (e.target.closest('.close-modal')) {
                callbacks.onCloseModal();
                return;
            }

            // Fecha modal ao clicar em "Ver na Loja"
            const actionButton = e.target.closest('.modal-actions .btn');
            if (actionButton?.classList.contains('btn-details')) {
                e.preventDefault();
                callbacks.onCloseModal();
                return;
            }

            // Ativa/desativa zoom ao clicar na imagem (desktop apenas)
            const mainImage = e.target.closest('#modal-main-image');
            if (mainImage && window.innerWidth >= 768) {
                callbacks.onToggleZoom(e);
            }
        });

        // Movimento do mouse para controlar o zoom
        dom.modal.container.addEventListener('mousemove', (e) => {
            if (dom.modal.imageContainer?.classList.contains('zoomed')) {
                callbacks.onImageZoom(e);
            }
        });

        // Eventos de toque para zoom em dispositivos móveis
        if (dom.modal.imageContainer) {
            dom.modal.imageContainer.addEventListener('touchstart', (e) => {
                callbacks.onTouchStart(e);
            }, { passive: false });

            dom.modal.imageContainer.addEventListener('touchmove', (e) => {
                callbacks.onTouchMove(e);
            }, { passive: false });

            dom.modal.imageContainer.addEventListener('touchend', (e) => {
                callbacks.onTouchEnd(e);
            }, { passive: false });
        }

        // Delegação de eventos para as miniaturas de imagem
        if (dom.modal.thumbs) {
            dom.modal.thumbs.addEventListener('click', (e) => {
                const thumb = e.target.closest('img');
                if (thumb) {
                    // Desativa zoom ao trocar de imagem
                    if (dom.modal.imageContainer?.classList.contains('zoomed')) {
                        callbacks.onToggleZoom(e);
                    }
                    // Atualiza imagem principal
                    dom.modal.mainImage.src = thumb.dataset.src;
                    // Atualiza estado das miniaturas
                    for (const img of dom.modal.thumbs.querySelectorAll('img')) {
                        img.classList.remove('active');
                    }
                    thumb.classList.add('active');
                }
            });
        }
    }

    // Registra eventos globais (teclado e redimensionamento)
    setupGlobalEvents(dom, callbacks);

    // Estado inicial do botão limpar filtros
    updateClearBtnVisibility();
}

/**
 * Registra eventos globais não ligados a elementos específicos:
 * - Teclado (Escape)
 * - Redimensionamento da janela
 * - Scroll-to-top
 * @param {object} dom - Referências DOM
 * @param {object} callbacks - Funções de callback para eventos
 */
export function setupGlobalEvents(dom, callbacks) {
    // Cria uma estrutura de app temporária para os handlers globais
    const appContext = {
        DOM: dom,
        closeModal: callbacks.onCloseModal
    };

    document.addEventListener('keydown', GlobalHandlers.handleKeyPress(appContext));
    window.addEventListener('resize', GlobalHandlers.handleResize(appContext));

    // Scroll-to-top: mostrar/ocultar com scroll e ação de clique
    const btn = dom.ui?.scrollToTop;
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
}
