// Gerenciamento de Categorias

let currentCategoryId = null;
let allCategories = [];

// Elementos do DOM
const categoriesList = document.getElementById('categories-list');
const modal = document.getElementById('category-modal');
const modalTitle = document.getElementById('modal-title');
const categoryForm = document.getElementById('category-form');

// Carregar categorias
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        allCategories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderCategories();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showNotification('Erro ao carregar categorias', 'error');
    }
}

// Renderizar categorias
function renderCategories() {
    if (allCategories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma categoria cadastrada ainda.</p>
                <button class="btn btn-primary" onclick="openModal()">
                    Criar primeira categoria
                </button>
            </div>
        `;
        return;
    }
    
    categoriesList.innerHTML = allCategories.map(category => `
        <div class="category-card">
            <div class="category-info">
                <h3>${category.name}</h3>
                <p class="category-description">${category.description || 'Sem descrição'}</p>
                <div class="category-meta">
                    <span class="product-count">
                        📦 ${category.productCount || 0} produtos
                    </span>
                    <span class="status ${category.active ? 'active' : 'inactive'}">
                        ${category.active ? '✓ Ativa' : '✕ Inativa'}
                    </span>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-icon" onclick="editCategory('${category.id}')" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon btn-danger" onclick="deleteCategory('${category.id}', '${category.name}')" title="Excluir">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// Abrir modal (nova categoria)
function openModal() {
    currentCategoryId = null;
    modalTitle.textContent = 'Nova Categoria';
    categoryForm.reset();
    modal.classList.add('show');
}

// Editar categoria
async function editCategory(categoryId) {
    currentCategoryId = categoryId;
    modalTitle.textContent = 'Editar Categoria';
    
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Preencher formulário
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    document.getElementById('category-active').checked = category.active;
    
    modal.classList.add('show');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('show');
    categoryForm.reset();
    currentCategoryId = null;
}

// Salvar categoria
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = categoryForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';
    
    try {
        const categoryData = {
            name: document.getElementById('category-name').value.trim(),
            description: document.getElementById('category-description').value.trim(),
            active: document.getElementById('category-active').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentCategoryId) {
            // Atualizar
            await db.collection('categories').doc(currentCategoryId).update(categoryData);
            // Atualizar produtos com essa categoria
            if (categoryData.name !== allCategories.find(c => c.id === currentCategoryId).name) {
                const oldName = allCategories.find(c => c.id === currentCategoryId).name;
                await updateProductsCategory(oldName, categoryData.name);
            }
            showNotification('Categoria atualizada com sucesso!', 'success');
        } else {
            // Criar nova
            categoryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            categoryData.productCount = 0;
            await db.collection('categories').add(categoryData);
            showNotification('Categoria criada com sucesso!', 'success');
        }
        
        closeModal();
        loadCategories();
        
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        showNotification('Erro ao salvar categoria', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar';
    }
});

// Atualizar nome da categoria nos produtos
async function updateProductsCategory(oldName, newName) {
    try {
        const snapshot = await db.collection('products')
            .where('category', '==', oldName)
            .get();
        
        const batch = db.batch();
        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { category: newName });
        }
        
        await batch.commit();
    } catch (error) {
        console.error('Erro ao atualizar produtos:', error);
    }
}

// Excluir categoria
async function deleteCategory(categoryId, categoryName) {
    try {
        // Buscar o slug da categoria para verificar produtos
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        if (!categoryDoc.exists) {
            showNotification('Categoria não encontrada', 'error');
            return;
        }
        const categorySlug = categoryDoc.data().slug || categoryDoc.data().name;
        // Verificar em tempo real se existem produtos com esta categoria
        const productsSnapshot = await db.collection('products')
            .where('category', '==', categorySlug)
            .limit(1)
            .get();
        const productCount = productsSnapshot.size;
        // Se houver produtos, contar quantos são
        if (productCount > 0) {
            const allProductsSnapshot = await db.collection('products')
                .where('category', '==', categorySlug)
                .get();
            const totalProducts = allProductsSnapshot.size;
            // Mostra lista de produtos
            let productNames = [];
            for (const doc of allProductsSnapshot.docs.slice(0, 5)) {
                productNames.push(`• ${doc.data().name}`);
            }
            const moreProducts = totalProducts > 5 ? `\n... e mais ${totalProducts - 5} produto(s)` : '';
            alert(`⚠️ Não é possível excluir a categoria "${categoryName}"!\n\n` +
                  `Esta categoria contém ${totalProducts} produto(s):\n\n` +
                  `${productNames.join('\n')}${moreProducts}\n\n` +
                  `❌ Você precisa primeiro:\n` +
                  `1. Excluir esses produtos, OU\n` +
                  `2. Mover eles para outra categoria\n\n` +
                  `Depois você poderá excluir esta categoria.`);
            return;
        }
        // Se não tem produtos, pede confirmação
        if (!confirm(`✅ Confirmar exclusão?\n\n` +
                     `Categoria: "${categoryName}"\n` +
                     `Produtos: 0 (nenhum)\n\n` +
                     `Esta ação não pode ser desfeita.`)) {
            return;
        }
        // Exclui a categoria
        await db.collection('categories').doc(categoryId).delete();
        showNotification('✓ Categoria excluída com sucesso!', 'success');
        loadCategories();
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showNotification('Erro ao excluir categoria: ' + error.message, 'error');
    }
}

// Atualizar contagem de produtos nas categorias
async function updateProductCounts() {
    try {
        const productsSnapshot = await db.collection('products').get();
        const counts = {};
        
        for (const doc of productsSnapshot.docs) {
            const category = doc.data().category;
            counts[category] = (counts[category] || 0) + 1;
        }
        
        const batch = db.batch();
        for (const category of allCategories) {
            const ref = db.collection('categories').doc(category.id);
            batch.update(ref, { productCount: counts[category.name] || 0 });
        }
        
        await batch.commit();
        loadCategories();
    } catch (error) {
        console.error('Erro ao atualizar contagens:', error);
    }
}

// Notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fechar modal ao clicar fora
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    // Atualizar contagens periodicamente
    setInterval(updateProductCounts, 30000); // A cada 30 segundos
});
