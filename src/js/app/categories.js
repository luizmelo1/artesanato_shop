/**
 * Módulo de Gestão de Categorias
 * Carrega categorias do Firestore e renderiza botões dinamicamente
 */

import { debugLog, debugError } from '../utils/debug.js';

/**
 * Carrega categorias do Firestore e cria botões dinamicamente
 * @param {object} dom - Referências DOM
 * @returns {Promise<Array>} Array de categorias
 */
export async function loadCategories(dom) {
    debugLog('=== loadCategories ===');
    
    try {
        // Verifica se Firebase está configurado
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            debugError('Firebase não está configurado');
            return [];
        }

        debugLog('Buscando categorias do Firestore...');
        const db = firebase.firestore();
        const snapshot = await db.collection('categories')
            .orderBy('name')
            .get();
        
        debugLog('Categorias recebidas:', snapshot.size, 'documentos');
        
        // Converte documentos para array de categorias
        const categories = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Sem nome',
                slug: data.slug || data.name?.toLowerCase() || 'outros',
                description: data.description || ''
            };
        });
        
        debugLog('Categorias carregadas:', categories);
        
        return categories;
    } catch (error) {
        debugError('Erro ao carregar categorias:', error);
        return [];
    }
}

/**
 * Renderiza botões de categoria dinamicamente
 * @param {object} dom - Referências DOM
 * @param {Array} categories - Array de categorias
 */
export function renderCategoryButtons(dom, categories) {
    debugLog('=== renderCategoryButtons ===');
    
    if (!dom.products.categoriesContainer) {
        debugError('Container de categorias não encontrado');
        return;
    }
    
    const container = dom.products.categoriesContainer;
    
    // Remove apenas os botões de categoria existentes (não remove "Todos" nem "Limpar filtros")
    const categoryButtons = container.querySelectorAll('.category:not([data-category="all"]):not(.clear-filters)');
    for (const btn of categoryButtons) {
        btn.remove();
    }
    
    // Pega referência do botão "Todos" e "Limpar filtros" para inserir antes deles
    const clearButton = container.querySelector('.clear-filters');
    const insertBefore = clearButton || null;
    
    // Adiciona categorias do Firestore antes do botão "Limpar filtros"
    debugLog('Renderizando', categories.length, 'categorias');
    for (const category of categories) {
        const btn = document.createElement('button');
        btn.className = 'category';
        btn.dataset.category = category.slug;
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = category.name;
        
        if (insertBefore) {
            container.insertBefore(btn, insertBefore);
        } else {
            container.appendChild(btn);
        }
    }
    
    // Atualiza a referência de categorias no DOM após renderizar
    dom.products.categories = container.querySelectorAll('.category');
    
    debugLog('Botões de categoria renderizados com sucesso');
    debugLog('Total de botões após renderização:', dom.products.categories.length);
}
