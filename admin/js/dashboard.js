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

// Inicializar
async function initDashboard() {
    await loadStats();
}

// Aguarda DOM e Firebase (usando top-level await pattern)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initDashboard());
} else {
    void initDashboard();
}
