/**
 * Módulo de Gestão do Modal
 * Controla abertura, fechamento e zoom de imagens
 */

import * as ZoomHelpers from '../helpers/zoom.js';
import { debugLog } from '../utils/debug.js';
import { createPictureWithFallback, updatePictureSource } from '../helpers/image-fallback.js';

/**
 * Abre o modal para um produto específico.
 * Preenche título, preço, descrição, imagens e links.
 * @param {object} dom - Referências DOM
 * @param {Array} products - Lista de produtos
 * @param {number} productId - ID do produto a ser exibido.
 * @param {object} state - Estado da aplicação (para guardar elemento focado)
 */
export function openModal(dom, products, productId, state) {
    debugLog('Abrindo modal para produto:', productId);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Armazenar elemento que tinha foco antes do modal abrir
    state.previouslyFocusedElement = document.activeElement;

    // Resetar o estado do modal
    dom.modal.container.classList.remove('closing');
    
    // Impedir rolagem do fundo enquanto o modal estiver aberto (inclui mobile)
    state.scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.top = `-${state.scrollLockY}px`;
    document.body.classList.add('no-scroll');
    
    // Abrir o modal usando o método nativo do <dialog>
    dom.modal.container.showModal();
    
    // Ativar a classe active para animação
    requestAnimationFrame(() => {
        dom.modal.container.classList.add('active');
        
        // Focar no botão de fechar após a animação inicial
        setTimeout(() => {
            const closeButton = dom.modal.container.querySelector('.close-modal');
            if (closeButton) {
                closeButton.focus();
            }
        }, 100);
    });
    
    dom.modal.productTitle.textContent = product.name;
    dom.modal.price.textContent = `R$ ${product.price.toFixed(2)}`;
    dom.modal.description.textContent = product.description;
    
    // Configurar imagens
    const imgs = Array.isArray(product.images) && product.images.length 
        ? product.images 
        : [product.image];
    
    if (dom.modal.mainImage && dom.modal.imageContainer) {
        // Substitui o <img> por <picture> para suporte a WebP com fallback
        const existingPicture = dom.modal.imageContainer.querySelector('picture');
        
        if (existingPicture) {
            // Se já existe um picture, apenas atualiza a fonte
            updatePictureSource(existingPicture, imgs[0], product.name);
        } else {
            // Remove o <img> antigo e cria um <picture> novo
            const oldImg = dom.modal.mainImage;
            const newPicture = createPictureWithFallback(imgs[0], product.name, {
                loading: 'eager',
                width: 800,
                height: 600,
                draggable: false
            });
            
            // Adiciona o ID ao <img> dentro do <picture> para manter compatibilidade
            const newImg = newPicture.querySelector('img');
            if (newImg) {
                newImg.id = 'modal-main-image';
            }
            
            oldImg.replaceWith(newPicture);
            
            // Atualiza a referência no DOM
            dom.modal.mainImage = newImg;
        }
    }
    
    // Configurar miniaturas com fallback WebP
    if (dom.modal.thumbs) {
        dom.modal.thumbs.innerHTML = '';
        dom.modal.thumbs.style.display = imgs.length > 1 ? '' : 'none';
        
        let idx = 0;
        for (const src of imgs) {
            const thumbPicture = createPictureWithFallback(src, product.name, {
                loading: 'lazy',
                width: 72,
                height: 72,
                className: idx === 0 ? 'active' : ''
            });
            
            // Adiciona data-src para troca de imagem ao clicar
            const thumbImg = thumbPicture.querySelector('img');
            if (thumbImg) {
                thumbImg.dataset.src = src;
            }
            
            dom.modal.thumbs.appendChild(thumbPicture);
            idx++;
        }
    }
    
    // Configurar links
    dom.modal.buyLink.href = product.link;
    dom.modal.detailsLink.href = product.link;
}

/**
 * Atualiza a posição do zoom da imagem principal conforme o mouse se move.
 * Só atua quando o container está no estado "zoomed".
 * @param {object} dom - Referências DOM
 * @param {MouseEvent} e
 */
export function handleImageZoom(dom, e) {
    const imageContainer = dom.modal.imageContainer;
    const image = dom.modal.mainImage;
    
    if (!imageContainer || !image || !imageContainer.classList.contains('zoomed')) return;

    const rect = imageContainer.getBoundingClientRect();
    const scale = window.innerWidth < 600 ? 1.5 : 2.5; // Zoom maior para melhor visualização
    const { x, y } = ZoomHelpers.calculateZoomPosition(e, rect, scale);
    ZoomHelpers.applyZoomTransform(image, x, y, scale);
}

/**
 * Inicia o zoom por toque (pinch-to-zoom) em dispositivos móveis.
 * @param {object} dom - Referências DOM
 * @param {TouchEvent} e
 */
export function handleTouchStart(dom, e) {
    const imageContainer = dom.modal.imageContainer;
    const image = dom.modal.mainImage;
    
    if (!imageContainer || !image) return;
    
    // Verifica se há dois toques (pinch gesture)
    if (e.touches.length === 2) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const touchState = ZoomHelpers.getTouchZoomState();
        touchState.initialDistance = ZoomHelpers.getTouchDistance(touch1, touch2);
        touchState.isZooming = true;
        
        // Marca o container como zoomed
        imageContainer.classList.add('zoomed');
    }
}

/**
 * Processa o movimento do zoom por toque.
 * @param {object} dom - Referências DOM
 * @param {TouchEvent} e
 */
export function handleTouchMove(dom, e) {
    const imageContainer = dom.modal.imageContainer;
    const image = dom.modal.mainImage;
    
    const touchState = ZoomHelpers.getTouchZoomState();
    
    if (!imageContainer || !image || !touchState.isZooming) return;
    
    if (e.touches.length === 2) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calcula a nova distância entre os toques
        const currentDistance = ZoomHelpers.getTouchDistance(touch1, touch2);
        
        // Calcula o nível de zoom baseado na mudança de distância
        const scale = currentDistance / touchState.initialDistance;
        
        // Limita o zoom entre 1x e 3x
        const clampedScale = Math.max(1, Math.min(3, scale));
        
        // Calcula o ponto central entre os dois toques
        const center = ZoomHelpers.getTouchCenter(touch1, touch2);
        const rect = imageContainer.getBoundingClientRect();
        
        // Calcula a posição do zoom
        const { x, y } = ZoomHelpers.calculateTouchZoomPosition(
            center.x, center.y, rect, clampedScale
        );
        
        // Armazena o estado atual
        touchState.currentScale = clampedScale;
        touchState.lastPosX = x;
        touchState.lastPosY = y;
        
        // Aplica o zoom
        ZoomHelpers.applyZoomTransform(image, x, y, clampedScale);
    }
}

/**
 * Finaliza o zoom por toque.
 * @param {object} dom - Referências DOM
 * @param {TouchEvent} e
 */
export function handleTouchEnd(dom, e) {
    const imageContainer = dom.modal.imageContainer;
    const image = dom.modal.mainImage;
    
    if (!imageContainer || !image) return;
    
    const touchState = ZoomHelpers.getTouchZoomState();
    
    // Se ainda há um toque (um dedo levantado, outro ainda na tela)
    if (e.touches.length < 2) {
        // Se o zoom foi pequeno (próximo de 1), reseta completamente
        if (touchState.currentScale < 1.2) {
            imageContainer.classList.remove('zoomed');
            ZoomHelpers.resetTransform(image);
        }
        
        touchState.isZooming = false;
    }
}

/**
 * Alterna o estado de zoom da imagem principal (apenas desktop).
 * No primeiro clique ativa e posiciona o zoom; no segundo, reseta.
 * @param {object} dom - Referências DOM
 * @param {MouseEvent} e
 */
export function toggleImageZoom(dom, e) {
    const imageContainer = dom.modal.imageContainer;
    const image = dom.modal.mainImage;
    
    if (!imageContainer || !image) return;

    if (imageContainer.classList.contains('zoomed')) {
        imageContainer.classList.remove('zoomed');
        ZoomHelpers.resetTransform(image);
    } else {
        imageContainer.classList.add('zoomed');
        handleImageZoom(dom, e);
    }
}

/**
 * Fecha o modal com animação, garantindo que o estado de zoom seja resetado.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export function closeModal(dom, state) {
    if (dom.modal.imageContainer?.classList.contains('zoomed')) {
        dom.modal.imageContainer.classList.remove('zoomed');
        ZoomHelpers.resetTransform(dom.modal.mainImage);
    }
    
    dom.modal.container.classList.add('closing');
    dom.modal.container.classList.remove('active');
    
    dom.modal.container.addEventListener('transitionend', () => {
        dom.modal.container.classList.remove('closing');
        
        // Fechar o modal usando o método nativo do <dialog>
        dom.modal.container.close();
        
        // Reativar rolagem do fundo ao fechar o modal
        document.body.classList.remove('no-scroll');
        // Limpa o deslocamento aplicado e restaura a rolagem na posição anterior
        if (typeof state.scrollLockY === 'number') {
            const y = state.scrollLockY;
            state.scrollLockY = null;
            document.body.style.top = '';
            window.scrollTo(0, y);
        } else {
            document.body.style.top = '';
        }
        
        // Restaurar foco para o elemento que estava focado antes do modal abrir
        if (state.previouslyFocusedElement) {
            state.previouslyFocusedElement.focus();
            state.previouslyFocusedElement = null;
        }
    }, { once: true });
}
