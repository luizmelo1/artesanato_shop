// Dashboard - Estatísticas e informações gerais

// Aguarda Firebase estar disponível e retorna instâncias
async function getFirebaseServices() {
    return new Promise((resolve) => {
        const maxAttempts = 100; // 10 segundos
        let attempts = 0;
        
        const checkFirebase = () => {
            attempts++;
            
            if (typeof firebase === 'undefined') {
                if (attempts >= maxAttempts) {
                    resolve({ db: null, ready: false, error: 'Firebase não carregado' });
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            if (!firebase.apps || firebase.apps.length === 0) {
                if (attempts >= maxAttempts) {
                    resolve({ db: null, ready: false, error: 'Firebase não inicializado' });
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            if (!firebase.firestore) {
                if (attempts >= maxAttempts) {
                    resolve({ db: null, ready: false, error: 'Firestore não disponível' });
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            try {
                const db = firebase.firestore();
                resolve({ db, ready: true });
            } catch (error) {
                resolve({ db: null, ready: false, error: error.message });
            }
        };
        
        checkFirebase();
    });
}

// Carregar estatísticas
async function loadStats() {
    const { db, ready, error } = await getFirebaseServices();
    
    if (!ready || !db) {
        console.error('Erro ao carregar estatísticas:', error);
        return;
    }
    
    try {
        // Total de produtos
        const productsSnapshot = await db.collection('products').get();
        document.getElementById('total-products').textContent = productsSnapshot.size;
        
        // Total de categorias
        const categoriesSnapshot = await db.collection('categories').get();
        document.getElementById('total-categories').textContent = categoriesSnapshot.size;
        
        // Produto mais recente
        const latestProduct = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        if (latestProduct.empty) {
            document.getElementById('latest-product').textContent = 'Nenhum';
        } else {
            const product = latestProduct.docs[0].data();
            document.getElementById('latest-product').textContent = product.name;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar produtos recentes
async function loadRecentProducts() {
    const container = document.getElementById('recent-products-list');
    if (!container) return;
    
    container.innerHTML = '<p class="empty-state">⏳ Carregando produtos...</p>';
    
    const { db, ready, error } = await getFirebaseServices();
    
    if (!ready || !db) {
        console.error('Firebase não disponível:', error);
        container.innerHTML = '<p class="error">❌ Erro ao carregar produtos</p>';
        return;
    }
    
    try {
        const snapshot = await db.collection('products').where('active', '==', true).get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="empty-state">📦 Nenhum produto ativo cadastrado.</p>';
            return;
        }
        
        // Converte para array e pega os 5 mais recentes
        const allProducts = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            allProducts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt || new Date(0)
            });
        });
        
        // Ordena por data de criação (mais recentes primeiro)
        allProducts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        // Pega apenas os 5 primeiros
        const recentProducts = allProducts.slice(0, 5);
        
        // Renderiza produtos
        let html = '';
        recentProducts.forEach((product) => {
            const imgSrc = product.image || '';
            const imgHtml = imgSrc 
                ? `<img src="${imgSrc}" alt="${product.name || 'Produto'}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` 
                : `<div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border-radius:8px;font-size:30px;">📦</div>`;
            
            html += `
                <div class="product-item">
                    ${imgHtml}
                    <div class="product-info">
                        <h4>${product.name || 'Sem nome'}</h4>
                        <p>${product.category || 'Sem categoria'}</p>
                        <span class="price">R$ ${product.price ? Number(product.price).toFixed(2) : '0.00'}</span>
                    </div>
                    <span class="status active">✓ Ativo</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="error">❌ Erro ao carregar produtos</p>';
    }
}

// Inicializar
async function initDashboard() {
    await loadStats();
    await loadRecentProducts();
}

// Aguarda DOM e Firebase (usando top-level await pattern)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initDashboard());
} else {
    void initDashboard();
}
