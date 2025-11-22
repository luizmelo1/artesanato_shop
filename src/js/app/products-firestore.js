/**
 * Módulo de Integração com Firebase/Firestore
 * Permite buscar produtos do Firestore ao invés do products.json
 * 
 * INSTRUÇÕES:
 * 1. Adicione o Firebase SDK ao HTML:
 *    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
 * 
 * 2. Configure o Firebase (copie de admin/js/firebase-config.js):
 *    <script>
 *      const firebaseConfig = { ... };
 *      firebase.initializeApp(firebaseConfig);
 *      const db = firebase.firestore();
 *    </script>
 * 
 * 3. No products.js, substitua:
 *    import { fetchProducts } from './products.js';
 *    por:
 *    import { fetchProductsFromFirestore as fetchProducts } from './products-firestore.js';
 */

import { cache } from '../utils/cache.js';
import { debugLog, debugError } from '../utils/debug.js';

/**
 * Busca produtos do Firestore, salva no estado e no cache.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 */
export async function fetchProductsFromFirestore(dom, state) {
    debugLog('=== fetchProductsFromFirestore ===');
    debugLog('Iniciando busca de produtos do Firestore...');
    
    try {
        // Verifica se Firebase está configurado
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase não está configurado. Adicione os scripts do Firebase ao HTML.');
        }
        
        // Indica carregamento
        if (dom.products.loader) {
            dom.products.loader.classList.remove('hidden');
            dom.products.loader.setAttribute('aria-busy', 'true');
            debugLog('Loader ativado');
        }

        debugLog('Buscando produtos do Firestore...');
        const db = firebase.firestore();
        const snapshot = await db.collection('products')
            .where('active', '==', true)
            .orderBy('name')
            .get();
        
        debugLog('Snapshot recebido:', snapshot.size, 'documentos');
        
        // Converte documentos para array de produtos
        state.products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Sem nome',
                category: data.category || 'Outros',
                price: data.price || 0,
                description: data.description || '',
                link: data.link || '',
                image: data.image || ''
            };
        });
        
        debugLog('Produtos carregados do Firestore:', state.products.length, 'itens');
        debugLog('Primeiros 3 produtos:', state.products.slice(0, 3));

        // Salva no cache para próximas visitas
        cache.set(state.products);
        debugLog('Produtos salvos no cache');

        return state.products;
        
    } catch (err) {
        debugError('ERRO ao buscar produtos do Firestore:', err);
        debugError('Erro detalhado:', err.message, err.stack);
        
        // Tenta usar cache como fallback
        const cachedProducts = cache.get();
        if (cachedProducts && cachedProducts.length > 0) {
            debugLog('Usando produtos do cache como fallback');
            state.products = cachedProducts;
            return cachedProducts;
        }
        
        // Se não tem cache, mostra erro
        if (dom.products.container) {
            dom.products.container.replaceChildren();
            const alert = document.createElement('p');
            alert.className = 'no-results';
            alert.setAttribute('role', 'alert');
            alert.textContent = 'Não foi possível carregar os produtos no momento. Tente novamente mais tarde.';
            dom.products.container.appendChild(alert);
        }
        throw err;
        
    } finally {
        if (dom.products.loader) {
            dom.products.loader.classList.add('hidden');
            dom.products.loader.setAttribute('aria-busy', 'false');
            debugLog('Loader desativado');
        }
    }
}

/**
 * Observa mudanças no Firestore em tempo real e atualiza os produtos automaticamente.
 * @param {object} dom - Referências DOM
 * @param {object} state - Estado da aplicação
 * @param {Function} callback - Função a ser chamada quando houver mudanças
 * @returns {Function} - Função para cancelar o listener
 */
export function listenToProductChanges(dom, state, callback) {
    debugLog('=== listenToProductChanges ===');
    debugLog('Iniciando listener de mudanças em tempo real...');
    
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase não está configurado');
        }
        
        const db = firebase.firestore();
        
        // Cria listener em tempo real
        const unsubscribe = db.collection('products')
            .where('active', '==', true)
            .orderBy('name')
            .onSnapshot(
                (snapshot) => {
                    debugLog('Snapshot atualizado:', snapshot.size, 'documentos');
                    
                    // Atualiza produtos
                    state.products = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.name || 'Sem nome',
                            category: data.category || 'Outros',
                            price: data.price || 0,
                            description: data.description || '',
                            link: data.link || '',
                            image: data.image || ''
                        };
                    });
                    
                    // Atualiza cache
                    cache.set(state.products);
                    debugLog('Cache atualizado com novos dados');
                    
                    // Chama callback para atualizar UI
                    if (typeof callback === 'function') {
                        callback(state.products);
                    }
                },
                (error) => {
                    debugError('Erro no listener:', error);
                }
            );
        
        debugLog('Listener configurado com sucesso');
        return unsubscribe;
        
    } catch (err) {
        debugError('Erro ao configurar listener:', err);
        return () => {}; // Retorna função vazia
    }
}

/**
 * Busca categorias do Firestore para os filtros.
 * @returns {Promise<Array>} - Lista de categorias
 */
export async function fetchCategoriesFromFirestore() {
    debugLog('=== fetchCategoriesFromFirestore ===');
    
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase não está configurado');
        }
        
        const db = firebase.firestore();
        const snapshot = await db.collection('categories')
            .where('active', '==', true)
            .orderBy('name')
            .get();
        
        const categories = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                description: data.description || ''
            };
        });
        
        debugLog('Categorias carregadas:', categories.length);
        return categories;
        
    } catch (err) {
        debugError('Erro ao buscar categorias:', err);
        return [];
    }
}
