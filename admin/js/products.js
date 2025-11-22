// Gerenciamento de Produtos

let currentProductId = null;
let allProducts = [];
let allCategories = [];

// Elementos do DOM
const productsTable = document.getElementById('products-table-body');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const productForm = document.getElementById('product-form');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const statusFilter = document.getElementById('status-filter');
const imageInput = document.getElementById('product-image');
const imagePreview = document.getElementById('image-preview');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.querySelector('.progress-bar');

// Carregar produtos
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').orderBy('name').get();
        allProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderProducts();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos', 'error');
    }
}

// Carregar categorias
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        allCategories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        updateCategorySelects();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Atualizar selects de categoria
function updateCategorySelects() {
    const selects = [
        document.getElementById('product-category'),
        categoryFilter
    ];
    
    for (const select of selects) {
        const currentValue = select.value;
        select.innerHTML = select === categoryFilter 
            ? '<option value="">Todas as categorias</option>' 
            : '<option value="">Selecione uma categoria</option>';
        
        for (const cat of allCategories) {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        }
        
        if (currentValue) select.value = currentValue;
    }
}

// Renderizar produtos
function renderProducts() {
    const filtered = filterProducts();
    
    if (filtered.length === 0) {
        productsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">Nenhum produto encontrado</td>
            </tr>
        `;
        return;
    }
    
    productsTable.innerHTML = filtered.map(product => `
        <tr>
            <td>
                <img src="${product.image || '../src/img/placeholder.png'}" 
                     alt="${product.name}" 
                     class="product-thumb">
            </td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>R$ ${Number(product.price).toFixed(2)}</td>
            <td>
                <span class="status ${product.active ? 'active' : 'inactive'}">
                    ${product.active ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="actions">
                <button class="btn-icon" onclick="editProduct('${product.id}')" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon btn-danger" onclick="deleteProduct('${product.id}', '${product.name}')" title="Excluir">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtrar produtos
function filterProducts() {
    let filtered = [...allProducts];
    
    // Filtro de busca
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtro de categoria
    const categoryValue = categoryFilter.value;
    if (categoryValue) {
        filtered = filtered.filter(p => p.category === categoryValue);
    }
    
    // Filtro de status
    const statusValue = statusFilter.value;
    if (statusValue !== '') {
        const isActive = statusValue === 'true';
        filtered = filtered.filter(p => p.active === isActive);
    }
    
    return filtered;
}

// Abrir modal (novo produto)
function openModal() {
    currentProductId = null;
    modalTitle.textContent = 'Novo Produto';
    productForm.reset();
    imagePreview.innerHTML = '';
    uploadProgress.classList.add('hidden');
    modal.classList.add('show');
}

// Editar produto
async function editProduct(productId) {
    currentProductId = productId;
    modalTitle.textContent = 'Editar Produto';
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Preencher formulário
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-link').value = product.link || '';
    document.getElementById('product-active').checked = product.active;
    
    // Mostrar imagem atual
    if (product.image) {
        imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
    }
    
    modal.classList.add('show');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('show');
    productForm.reset();
    currentProductId = null;
}

// Salvar produto
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';
    
    try {
        // Dados do produto
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            price: Number(document.getElementById('product-price').value),
            description: document.getElementById('product-description').value.trim(),
            link: document.getElementById('product-link').value.trim(),
            active: document.getElementById('product-active').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Upload de imagem (se houver)
        if (imageInput.files.length > 0) {
            const imageUrl = await uploadImage(imageInput.files[0]);
            productData.image = imageUrl;
        }
        
        // Salvar no Firestore
        if (currentProductId) {
            // Atualizar
            await db.collection('products').doc(currentProductId).update(productData);
            showNotification('Produto atualizado com sucesso!', 'success');
        } else {
            // Criar novo
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            showNotification('Produto criado com sucesso!', 'success');
        }
        
        closeModal();
        loadProducts();
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showNotification('Erro ao salvar produto', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar';
    }
});

// Upload de imagem
async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            reject(new Error('Arquivo não é uma imagem'));
            return;
        }
        
        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Imagem muito grande (máximo 5MB)'));
            return;
        }
        
        // Nome único
        const timestamp = Date.now();
        const fileName = `products/${timestamp}_${file.name}`;
        
        // Upload
        const uploadTask = storage.ref().child(fileName).put(file);
        
        // Mostrar progresso
        uploadProgress.classList.remove('hidden');
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progresso
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
            },
            (error) => {
                // Erro
                uploadProgress.classList.add('hidden');
                reject(error);
            },
            async () => {
                // Sucesso
                try {
                    const url = await uploadTask.snapshot.ref.getDownloadURL();
                    uploadProgress.classList.add('hidden');
                    resolve(url);
                } catch (error) {
                    uploadProgress.classList.add('hidden');
                    reject(error);
                }
            }
        );
    });
}

// Preview de imagem
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target.result === 'string') {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            }
        };
        reader.readAsDataURL(file);
    }
});

// Excluir produto
async function deleteProduct(productId, productName) {
    if (!confirm(`Tem certeza que deseja excluir "${productName}"?`)) {
        return;
    }
    
    try {
        await db.collection('products').doc(productId).delete();
        showNotification('Produto excluído com sucesso!', 'success');
        loadProducts();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showNotification('Erro ao excluir produto', 'error');
    }
}

// Notificação
function showNotification(message, type = 'info') {
    // Criar elemento
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Remover após 3s
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event listeners para filtros
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);
statusFilter.addEventListener('change', renderProducts);

// Fechar modal ao clicar fora
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});
