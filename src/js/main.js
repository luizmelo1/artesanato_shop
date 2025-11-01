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
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeProductModal();
    }
});

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
