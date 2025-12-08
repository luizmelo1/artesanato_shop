/**
 * Módulo de Ações em Lote para Admin
 * Gerencia seleção e operações em múltiplos produtos no painel administrativo
 */

// Estado de seleção
let selectedProducts = new Set();

/**
 * Inicializa o sistema de ações em lote
 */
function initBulkActions() {
    const selectAllBar = document.getElementById('select-all-products');
    const selectAllTable = document.getElementById('select-all-table');
    const bulkActionButton = document.getElementById('bulk-action-button');
    const bulkModal = document.getElementById('bulk-actions-modal');
    
    if (!selectAllBar || !bulkActionButton || !bulkModal) {
        console.error('Elementos de bulk actions não encontrados');
        return;
    }
    
    // Event listener para "Selecionar Todos" da barra
    selectAllBar.addEventListener('change', (e) => {
        handleSelectAll(e.target.checked);
        updateBulkUI();
    });
    
    // Event listener para "Selecionar Todos" da tabela
    if (selectAllTable) {
        selectAllTable.addEventListener('change', (e) => {
            handleSelectAll(e.target.checked);
            updateBulkUI();
        });
    }
    
    // Event listener para o botão de ações
    bulkActionButton.addEventListener('click', () => {
        openBulkModal();
    });
    
    // Event listeners para as ações do modal
    setupBulkActionListeners(bulkModal);
    
    console.log('Bulk actions inicializado com sucesso');
}

/**
 * Configura listeners dos checkboxes dos produtos
 */
function setupProductCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            handleProductSelection(e.target);
            updateBulkUI();
        });
    });
    
    console.log('Checkboxes configurados:', checkboxes.length);
}

/**
 * Manipula a seleção/deseleção de todos os produtos
 */
function handleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
        const productId = checkbox.dataset.productId;
        const row = checkbox.closest('tr');
        
        if (checked) {
            selectedProducts.add(productId);
            row?.classList.add('selected');
        } else {
            selectedProducts.delete(productId);
            row?.classList.remove('selected');
        }
    });
    
    // Sincroniza ambos os checkboxes "Selecionar Todos"
    const selectAllBar = document.getElementById('select-all-products');
    const selectAllTable = document.getElementById('select-all-table');
    if (selectAllBar) selectAllBar.checked = checked;
    if (selectAllTable) selectAllTable.checked = checked;
    
    console.log('Select all:', checked, 'Total selecionados:', selectedProducts.size);
}

/**
 * Manipula a seleção individual de um produto
 */
function handleProductSelection(checkbox) {
    const productId = checkbox.dataset.productId;
    const row = checkbox.closest('tr');
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
        row?.classList.add('selected');
    } else {
        selectedProducts.delete(productId);
        row?.classList.remove('selected');
    }
    
    // Atualiza os checkboxes "Selecionar Todos"
    const allCheckboxes = document.querySelectorAll('.product-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    
    const selectAllBar = document.getElementById('select-all-products');
    const selectAllTable = document.getElementById('select-all-table');
    if (selectAllBar) selectAllBar.checked = allChecked;
    if (selectAllTable) selectAllTable.checked = allChecked;
    
    console.log('Produto', productId, checkbox.checked ? 'selecionado' : 'desmarcado');
}

/**
 * Atualiza a interface da barra de ações em lote
 */
function updateBulkUI() {
    const bulkBar = document.getElementById('bulk-actions-bar');
    const selectedCount = document.getElementById('selected-count');
    const bulkActionButton = document.getElementById('bulk-action-button');
    
    const count = selectedProducts.size;
    
    // Mostra/esconde a barra
    if (count > 0) {
        bulkBar?.classList.remove('hidden');
    } else {
        bulkBar?.classList.add('hidden');
    }
    
    // Atualiza contador
    if (selectedCount) {
        selectedCount.textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
    }
    
    // Habilita/desabilita botão
    if (bulkActionButton) {
        bulkActionButton.disabled = count === 0;
    }
    
    console.log('UI atualizada:', count, 'produtos selecionados');
}

/**
 * Abre o modal de ações em lote
 */
function openBulkModal() {
    const modal = document.getElementById('bulk-actions-modal');
    const countElement = document.getElementById('bulk-modal-count');
    
    if (!modal) return;
    
    // Atualiza contador no modal
    if (countElement) {
        countElement.textContent = selectedProducts.size;
    }
    
    modal.style.display = 'flex';
    console.log('Modal de bulk actions aberto');
}

/**
 * Fecha o modal de ações em lote
 */
function closeBulkModal() {
    const modal = document.getElementById('bulk-actions-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal de bulk actions fechado');
    }
}

/**
 * Configura listeners para as ações do modal
 */
function setupBulkActionListeners(modal) {
    const actionButtons = modal.querySelectorAll('.bulk-action-item');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            handleBulkAction(action);
        });
    });
}

/**
 * Executa uma ação em lote
 */
async function handleBulkAction(action) {
    console.log('Executando ação em lote:', action);
    
    const productIds = Array.from(selectedProducts);
    
    if (productIds.length === 0) {
        console.log('Nenhum produto selecionado');
        return;
    }
    
    // Fecha o modal
    closeBulkModal();
    
    try {
        switch (action) {
            case 'delete':
                await bulkDeleteProducts(productIds);
                break;
            case 'activate':
                await bulkUpdateStatus(productIds, true);
                break;
            case 'deactivate':
                await bulkUpdateStatus(productIds, false);
                break;
            case 'change-category':
                await bulkChangeCategory(productIds);
                break;
            case 'change-price':
                await bulkChangePrice(productIds);
                break;
            default:
                console.log('Ação não reconhecida:', action);
        }
    } catch (error) {
        console.error('Erro ao executar ação em lote:', error);
        showNotification('Erro ao executar ação. Tente novamente.', 'error');
    }
}

/**
 * Exclui múltiplos produtos
 */
async function bulkDeleteProducts(productIds) {
    const confirmed = confirm(`Deseja realmente excluir ${productIds.length} produto(s)?\n\nEsta ação não pode ser desfeita.`);
    
    if (!confirmed) return;
    
    try {
        const batch = db.batch();
        
        productIds.forEach(id => {
            const docRef = db.collection('products').doc(id);
            batch.delete(docRef);
        });
        
        await batch.commit();
        
        console.log('Produtos excluídos com sucesso:', productIds.length);
        showNotification(`${productIds.length} produto(s) excluído(s) com sucesso!`, 'success');
        
        // Limpa seleção e recarrega
        clearSelection();
        await loadProducts();
    } catch (error) {
        console.error('Erro ao excluir produtos:', error);
        throw error;
    }
}

/**
 * Atualiza status (ativo/inativo) de múltiplos produtos
 */
async function bulkUpdateStatus(productIds, active) {
    try {
        const batch = db.batch();
        
        productIds.forEach(id => {
            const docRef = db.collection('products').doc(id);
            batch.update(docRef, { active });
        });
        
        await batch.commit();
        
        const status = active ? 'ativado(s)' : 'desativado(s)';
        console.log(`Produtos ${status}:`, productIds.length);
        showNotification(`${productIds.length} produto(s) ${status} com sucesso!`, 'success');
        
        clearSelection();
        await loadProducts();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
    }
}

/**
 * Altera categoria de múltiplos produtos
 */
async function bulkChangeCategory(productIds) {
    // Busca categorias disponíveis
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => doc.data().name);
    
    if (categories.length === 0) {
        alert('Nenhuma categoria cadastrada. Cadastre categorias primeiro.');
        return;
    }
    
    const categoryList = categories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n');
    const input = prompt(`Escolha a nova categoria:\n\n${categoryList}\n\nDigite o número ou o nome da categoria:`);
    
    if (!input) return;
    
    // Verifica se é número ou nome
    let newCategory;
    const categoryIndex = parseInt(input) - 1;
    if (!isNaN(categoryIndex) && categoryIndex >= 0 && categoryIndex < categories.length) {
        newCategory = categories[categoryIndex];
    } else if (categories.includes(input)) {
        newCategory = input;
    } else {
        alert('Categoria inválida.');
        return;
    }
    
    try {
        const batch = db.batch();
        
        productIds.forEach(id => {
            const docRef = db.collection('products').doc(id);
            batch.update(docRef, { category: newCategory });
        });
        
        await batch.commit();
        
        console.log('Categoria atualizada:', productIds.length, 'produtos');
        showNotification(`Categoria de ${productIds.length} produto(s) alterada para "${newCategory}"!`, 'success');
        
        clearSelection();
        await loadProducts();
    } catch (error) {
        console.error('Erro ao alterar categoria:', error);
        throw error;
    }
}

/**
 * Altera preço de múltiplos produtos
 */
async function bulkChangePrice(productIds) {
    const action = prompt('Escolha a operação:\n\n1 - Definir preço fixo\n2 - Aplicar desconto (%)\n3 - Aplicar acréscimo (%)\n\nDigite o número da opção:');
    
    if (!action || !['1', '2', '3'].includes(action)) return;
    
    const value = parseFloat(prompt('Digite o valor:'));
    
    if (isNaN(value) || value < 0) {
        alert('Valor inválido.');
        return;
    }
    
    try {
        const batch = db.batch();
        
        if (action === '1') {
            // Preço fixo
            productIds.forEach(id => {
                const docRef = db.collection('products').doc(id);
                batch.update(docRef, { price: value });
            });
        } else {
            // Desconto ou acréscimo - precisa buscar preços atuais
            const products = await Promise.all(
                productIds.map(id => db.collection('products').doc(id).get())
            );
            
            products.forEach(doc => {
                if (doc.exists) {
                    const currentPrice = doc.data().price || 0;
                    let newPrice;
                    
                    if (action === '2') {
                        // Desconto
                        newPrice = currentPrice * (1 - value / 100);
                    } else {
                        // Acréscimo
                        newPrice = currentPrice * (1 + value / 100);
                    }
                    
                    batch.update(doc.ref, { price: Math.max(0.01, parseFloat(newPrice.toFixed(2))) });
                }
            });
        }
        
        await batch.commit();
        
        console.log('Preços atualizados:', productIds.length, 'produtos');
        showNotification(`Preço de ${productIds.length} produto(s) atualizado com sucesso!`, 'success');
        
        clearSelection();
        await loadProducts();
    } catch (error) {
        console.error('Erro ao alterar preços:', error);
        throw error;
    }
}

/**
 * Limpa a seleção atual
 */
function clearSelection() {
    selectedProducts.clear();
    
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('tr')?.classList.remove('selected');
    });
    
    const selectAllBar = document.getElementById('select-all-products');
    const selectAllTable = document.getElementById('select-all-table');
    if (selectAllBar) selectAllBar.checked = false;
    if (selectAllTable) selectAllTable.checked = false;
    
    updateBulkUI();
    console.log('Seleção limpa');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBulkActions);
} else {
    initBulkActions();
}

// Expõe funções globalmente para uso em products.js
globalThis.setupProductCheckboxListeners = setupProductCheckboxListeners;
globalThis.closeBulkModal = closeBulkModal;
