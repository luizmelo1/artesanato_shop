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
const imagesInput = document.getElementById('product-images');
const imagesPreview = document.getElementById('images-preview');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.querySelector('.progress-bar');
const uploadStatus = document.querySelector('.upload-status');

// Array para armazenar URLs de imagens temporariamente
let selectedImages = [];

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
    selectedImages = [];
    modalTitle.textContent = 'Novo Produto';
    productForm.reset();
    imagesPreview.innerHTML = '';
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
    
    // Mostrar imagens atuais
    selectedImages = product.images || (product.image ? [product.image] : []);
    renderImagesPreview();
    
    modal.classList.add('show');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('show');
    productForm.reset();
    currentProductId = null;
}

// Função auxiliar para validar e fazer upload de imagens
async function validateAndUploadImages() {
    // Validar arquivos de imagem ANTES de fazer upload
    if (globalThis.ValidationModule) {
        const imageValidation = globalThis.ValidationModule.validateImageFiles(
            imagesInput.files,
            { maxFiles: 10, maxSize: 5 * 1024 * 1024 }
        );
        
        if (!imageValidation.valid) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-upload-error';
            errorDiv.innerHTML = `
                <strong>Erro nos arquivos de imagem:</strong>
                <ul>${imageValidation.errors.map(err => `<li>${err}</li>`).join('')}</ul>
            `;
            imagesPreview.before(errorDiv);
            
            throw new Error('Validação de imagens falhou');
        }
    }
    
    const newImageUrls = await uploadMultipleImages(Array.from(imagesInput.files));
    selectedImages = [...selectedImages, ...newImageUrls];
}

// Salvar produto
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';
    
    try {
        // Limpar erros anteriores
        if (globalThis.ValidationModule) {
            globalThis.ValidationModule.clearAllErrors();
        }
        
        // Upload de novas imagens (se houver)
        if (imagesInput.files.length > 0) {
            await validateAndUploadImages();
        }
        
        // Dados do produto
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            price: Number(document.getElementById('product-price').value),
            description: document.getElementById('product-description').value.trim(),
            link: document.getElementById('product-link').value.trim(),
            active: document.getElementById('product-active').checked,
            images: selectedImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Validar dados do produto
        if (globalThis.ValidationModule) {
            const validation = globalThis.ValidationModule.validateProduct(productData);
            
            if (!validation.valid) {
                // Mostrar erros de validação
                globalThis.ValidationModule.showValidationErrors(validation.errors);
                
                // Scroll para o primeiro erro
                const firstError = document.querySelector('.input-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                
                throw new Error('Validação falhou');
            }
            
            // Usar dados sanitizados
            Object.assign(productData, validation.sanitized);
        }
        
        // Garantir compatibilidade: salvar primeira imagem como 'image'
        if (selectedImages.length > 0) {
            productData.image = selectedImages[0];
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

// Upload de múltiplas imagens
async function uploadMultipleImages(files) {
    if (files.length === 0) return [];
    
    uploadProgress.classList.remove('hidden');
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            showNotification(`${file.name} não é uma imagem`, 'error');
            continue;
        }
        
        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification(`${file.name} muito grande (máximo 5MB)`, 'error');
            continue;
        }
        
        try {
            uploadStatus.textContent = `Enviando imagem ${i + 1} de ${files.length}...`;
            const url = await uploadSingleImage(file, i, files.length);
            uploadedUrls.push(url);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            showNotification(`Erro ao enviar ${file.name}`, 'error');
        }
    }
    
    uploadProgress.classList.add('hidden');
    uploadStatus.textContent = '';
    progressBar.style.width = '0%';
    
    return uploadedUrls;
}

// Upload de uma única imagem
async function uploadSingleImage(file, index, total) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const fileName = `products/${timestamp}_${index}_${file.name}`;
        const uploadTask = storage.ref().child(fileName).put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const totalProgress = ((index + (progress / 100)) / total) * 100;
                progressBar.style.width = totalProgress + '%';
            },
            (error) => reject(error),
            async () => {
                try {
                    const url = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(url);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

// Renderizar preview de imagens
function renderImagesPreview() {
    imagesPreview.innerHTML = selectedImages.map((url, index) => `
        <div class="image-preview-item">
            <img src="${url}" alt="Imagem ${index + 1}">
            <button type="button" class="remove-image" onclick="removeImage(${index})" title="Remover imagem">×</button>
            <span class="image-order">#${index + 1}</span>
        </div>
    `).join('');
}

// Remover imagem do array
function removeImage(index) {
    selectedImages.splice(index, 1);
    renderImagesPreview();
}

// Preview de novas imagens selecionadas
imagesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Remover erros anteriores de imagem
    const oldError = document.querySelector('.image-upload-error');
    if (oldError) oldError.remove();
    
    // Validar arquivos ANTES de criar previews
    if (globalThis.ValidationModule) {
        const validation = globalThis.ValidationModule.validateImageFiles(
            files,
            { maxFiles: 10, maxSize: 5 * 1024 * 1024 }
        );
        
        if (!validation.valid) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-upload-error';
            errorDiv.innerHTML = `
                <strong>⚠️ Erro nos arquivos selecionados:</strong>
                <ul>${validation.errors.map(err => `<li>${err}</li>`).join('')}</ul>
            `;
            imagesPreview.before(errorDiv);
            
            // Limpar input
            imagesInput.value = '';
            return;
        }
        
        // Usar apenas arquivos válidos
        const dataTransfer = new DataTransfer();
        for (const file of validation.validFiles) {
            dataTransfer.items.add(file);
        }
        imagesInput.files = dataTransfer.files;
    }
    
    // Criar previews locais das novas imagens
    const previewPromises = files.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target.result === 'string') {
                    resolve(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(previewPromises).then(previews => {
        // Adiciona previews temporários (serão substituídos por URLs após upload)
        const existingCount = selectedImages.length;
        let index = 0;
        for (const preview of previews) {
            const tempDiv = document.createElement('div');
            tempDiv.className = 'image-preview-item';
            tempDiv.innerHTML = `
                <img src="${preview}" alt="Nova imagem ${index + 1}">
                <span class="image-order">#${existingCount + index + 1}</span>
                <span style="position:absolute;top:0.5rem;left:0.5rem;background:rgba(0,0,0,0.7);color:white;padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;">Aguardando upload</span>
            `;
            imagesPreview.appendChild(tempDiv);
            index++;
        }
    });
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
