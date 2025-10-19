// Variáveis e seleção de elementos
let products = [];
const productsContainer = document.getElementById('products-container');
const categories = document.querySelectorAll('.category');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const modalProductTitle = document.getElementById('modal-product-title');
const modalPrice = document.getElementById('modal-price');
const modalDescription = document.getElementById('modal-description');
const modalImage = document.getElementById('modal-image');
const modalBuyLink = document.getElementById('modal-buy-link');
const modalDetailsLink = document.getElementById('modal-details-link');
const closeModal = document.querySelector('.close-modal');
const adminPanel = document.getElementById('admin-panel');
const adminToggle = document.getElementById('admin-toggle');
const productForm = document.getElementById('product-form');
const cancelProduct = document.getElementById('cancel-product');
const mobileMenu = document.querySelector('.mobile-menu');
const nav = document.querySelector('nav');

// Carregar produtos do arquivo JSON
async function fetchProducts() {
    try {
        const res = await fetch('./db/products.json');
        if (!res.ok) throw new Error('Falha ao carregar produtos: ' + res.status);
        products = await res.json();
        loadProducts();
    } catch (err) {
        console.error(err);
        productsContainer.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    }
}

// Carregar produtos na página
function loadProducts(filterCategory = 'all') {
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
        modalImage.src = product.image;
        modalImage.alt = product.name;
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

// Alternar painel admin
adminToggle.addEventListener('click', function(e) {
    e.preventDefault();
    adminPanel.style.display = adminPanel.style.display === 'block' ? 'none' : 'block';
});

// Cancelar adição de produto
cancelProduct.addEventListener('click', function() {
    productForm.reset();
    adminPanel.style.display = 'none';
});

// Adicionar novo produto (local apenas)
productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        description: document.getElementById('product-description').value,
        image: document.getElementById('product-image').value,
        link: document.getElementById('product-link').value
    };
    
    products.push(newProduct);
    loadProducts();
    productForm.reset();
    adminPanel.style.display = 'none';
    
    alert('Produto adicionado com sucesso!');
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

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
});
