// Variáveis e seleção de elementos
let products = [];
const productsContainer = document.getElementById('products-container');
const categories = document.querySelectorAll('.category');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const modalProductTitle = document.getElementById('modal-product-title');
const modalPrice = document.getElementById('modal-price');
const modalDescription = document.getElementById('modal-description');
const modalMainImage = document.getElementById('modal-main-image');
const modalThumbs = document.getElementById('modal-thumbs');
const modalBuyLink = document.getElementById('modal-buy-link');
const modalDetailsLink = document.getElementById('modal-details-link');
const closeModal = document.querySelector('.close-modal');
const mobileMenu = document.querySelector('.mobile-menu');
const nav = document.querySelector('nav');

// Carregar produtos do arquivo JSON
async function fetchProducts() {
    try {
        const res = await fetch('./src/db/products.json');
        if (!res.ok) throw new Error('Falha ao carregar produtos: ' + res.status);
        products = await res.json();
        if (productsContainer) loadProducts();
    } catch (err) {
        console.error(err);
        if (productsContainer) productsContainer.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    }
}

// Carregar produtos na página
function loadProducts(filterCategory = 'all') {
    if (!productsContainer) return; // nothing to do on pages without product container
    productsContainer.innerHTML = '';
    
    const filteredProducts = filterCategory === 'all' 
        ? products 
        : products.filter(product => product.category === filterCategory);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}...</p>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <a href="#" class="btn-details" data-id="${product.id}">Ver Detalhes</a>
                    <a href="${product.link}" class="btn-buy" target="_blank">Comprar</a>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.btn-details').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = parseInt(this.getAttribute('data-id'));
            openProductModal(productId);
        });
    });
}

// Abrir modal do produto
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        modalProductTitle.textContent = product.name;
        modalPrice.textContent = `R$ ${product.price.toFixed(2)}`;
        modalDescription.textContent = product.description;
        // determine images list (prefer product.images)
            const imgs = Array.isArray(product.images) && product.images.length ? product.images : (product.image ? [product.image] : []);
            // re-query elements to ensure they exist in the current DOM
            const modalMain = document.getElementById('modal-main-image');
            const thumbsContainer = document.getElementById('modal-thumbs');

            // debug info (will appear in browser console)
            console.debug('Opening product modal', { id: productId, imgs, modalMainExists: !!modalMain, thumbsExists: !!thumbsContainer });

            // set main image
            if (modalMain) {
                if (imgs.length) {
                    modalMain.src = imgs[0];
                    // prevent native browser image drag which interferes with pointer dragging
                    modalMain.draggable = false;
                    modalMain.alt = product.name;
                } else {
                    modalMain.removeAttribute('src');
                    modalMain.alt = product.name;
                }
            }

            // populate thumbnails
            if (thumbsContainer) {
                thumbsContainer.innerHTML = '';
                imgs.forEach((src, idx) => {
                    const thumb = document.createElement('img');
                    thumb.src = src;
                    if (idx === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => {
                        if (modalMain) modalMain.src = src;
                        thumbsContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbsContainer.appendChild(thumb);
                });
                // if there is only one image, hide thumbs container to avoid empty space
                if (imgs.length <= 1) thumbsContainer.style.display = 'none'; else thumbsContainer.style.display = '';
            }
        modalBuyLink.href = product.link;
        modalDetailsLink.href = product.link;
        modal.style.display = 'block';
    }
}

// Fechar modal
function closeProductModal() {
    // reset zoom state if present
    const container = document.querySelector('.modal-main-image');
    const img = document.getElementById('modal-main-image');
    if (container && container.classList.contains('zoomed')) {
        container.classList.remove('zoomed');
        if (img) img.style.transform = '';
    }
    modal.style.display = 'none';
}

// Filtrar produtos por categoria
categories.forEach(category => {
    category.addEventListener('click', function() {
        categories.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const category = this.getAttribute('data-category');
        loadProducts(category);
    });
});



// Menu mobile
mobileMenu.addEventListener('click', function() {
    nav.classList.toggle('active');
});

// Fechar modal ao clicar fora
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeProductModal();
    }
});

// Fechar modal com ESC
// Zoom / pan for modal main image
(function(){
    const container = document.querySelector('.modal-main-image');
    const img = document.getElementById('modal-main-image');
    if (!container || !img) return; // nothing to do if modal not present

    let isZoomed = false;
    const scale = 2; // zoom level
    let tx = 0, ty = 0; // current translate
    let startX = 0, startY = 0; // pointer start
    let startTx = 0, startTy = 0;
    let pointerId = null;
    let moved = false;

    function applyTransform() {
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${isZoomed ? scale : 1})`;
    }

    function clampOffsets(x, y) {
        // use layout sizes (offsetWidth) which are not affected by CSS transforms
        const cW = container.clientWidth;
        const cH = container.clientHeight;
        const iW = img.offsetWidth;
        const iH = img.offsetHeight;
        const scaledW = iW * (isZoomed ? scale : 1);
        const scaledH = iH * (isZoomed ? scale : 1);
        const overflowX = Math.max(0, scaledW - cW);
        const overflowY = Math.max(0, scaledH - cH);
        const minX = -overflowX / 2;
        const maxX = overflowX / 2;
        const minY = -overflowY / 2;
        const maxY = overflowY / 2;
        return [Math.min(maxX, Math.max(minX, x)), Math.min(maxY, Math.max(minY, y))];
    }

    function enableZoom(centerX, centerY) {
        isZoomed = true;
        container.classList.add('zoomed');
        // center on click position: compute relative offsets
        const cRect = container.getBoundingClientRect();
        const iRect = img.getBoundingClientRect();
        // click position relative to image center
        const relX = (centerX - iRect.left) - iRect.width/2;
        const relY = (centerY - iRect.top) - iRect.height/2;
        // scale the relative amounts and clamp
        tx = -relX * (scale - 1);
        ty = -relY * (scale - 1);
        [tx, ty] = clampOffsets(tx, ty);
        applyTransform();
    }

    function disableZoom() {
        isZoomed = false;
        container.classList.remove('zoomed');
        tx = 0; ty = 0;
        img.style.transform = '';
    }

    function onPointerDown(e) {
        // only react when zoomed
        if (!isZoomed) return;
        pointerId = e.pointerId;
        startX = e.clientX; startY = e.clientY;
        startTx = tx; startTy = ty;
        moved = false;
        container.setPointerCapture(pointerId);
    }

    function onPointerMove(e) {
        if (pointerId === null || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        tx = startTx + dx; ty = startTy + dy;
        [tx, ty] = clampOffsets(tx, ty);
        applyTransform();
    }

    function onPointerUp(e) {
        if (pointerId === null || e.pointerId !== pointerId) return;
        try { container.releasePointerCapture(pointerId); } catch (err) {}
        pointerId = null;
    }

    // Toggle zoom on click (but not when the user dragged)
    container.addEventListener('pointerdown', function(e){
        // prevent default browser behaviors like image drag or touch scrolling while interacting
        if (e.cancelable) e.preventDefault();
        // start possible drag only when zoomed
        if (isZoomed) onPointerDown(e);
        // track for click toggling
        startX = e.clientX; startY = e.clientY;
        moved = false;
    });

    container.addEventListener('pointermove', function(e){
        if (isZoomed) onPointerMove(e);
        if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) moved = true;
    });

    container.addEventListener('pointerup', function(e){
        if (isZoomed) onPointerUp(e);
        // if it was a simple click (no move) toggle zoom
        if (!moved) {
            if (!isZoomed) enableZoom(e.clientX, e.clientY); else disableZoom();
        }
    });

    // also support mouseleave to stop dragging
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('lostpointercapture', onPointerUp);

    // If modal is closed, ensure zoom reset
    const originalClose = closeProductModal;
    // replace closeProductModal with wrapped version
    window.closeProductModal = function(){
        try { disableZoom(); } catch(e){}
        originalClose();
    }

    // handle Escape key to exit zoom first, then close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            if (isZoomed) {
                disableZoom();
            } else {
                closeProductModal();
            }
        }
    });

})();

// Close modal when clicking the close button
if (closeModal) closeModal.addEventListener('click', closeProductModal);

// Controle do slideshow do hero
function initHeroSlideshow() {
    const backgrounds = document.querySelectorAll('.hero-bg');
    if (!backgrounds || backgrounds.length === 0) return; // nothing to do when no hero backgrounds present
    let currentIndex = 0;

    function showNextSlide() {
        // guard against unexpected state
        if (!backgrounds[currentIndex]) return;
        backgrounds[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % backgrounds.length;
        if (backgrounds[currentIndex]) backgrounds[currentIndex].classList.add('active');
    }

    // Trocar slide a cada 10 segundos
    setInterval(showNextSlide, 10000);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
    initHeroSlideshow();
});
