// admin/js/analytics.js - Analytics Dashboard

/**
 * Calcula estatísticas avançadas dos produtos
 */
export async function getProductAnalytics() {
    try {
        const db = firebase.firestore();
        // Busca todos os produtos
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Busca todas as categorias
        const categoriesSnapshot = await db.collection('categories').get();
        const categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Estatísticas gerais
        // Distribuição de preços
        const priceRanges = [0, 50, 100, 200, 500, 1000];
        const priceDistribution = priceRanges.map((min, i) => {
            const max = priceRanges[i + 1] || Infinity;
            return {
                range: max === Infinity ? `R$ ${min}+` : `R$ ${min} - R$ ${max}`,
                count: products.filter(p => p.price >= min && p.price < max).length
            };
        });

        // Score de qualidade
        const score = Math.round(
            (
                (products.filter(p => p.image && p.image !== '').length / products.length) * 0.3 +
                (products.filter(p => p.description && p.description.trim() !== '').length / products.length) * 0.3 +
                (products.filter(p => p.link && p.link !== '').length / products.length) * 0.2 +
                (products.filter(p => p.active).length / products.length) * 0.2
            ) * 100
        );

        // Insights automáticos
        const insights = [];
        if (products.filter(p => !p.image || p.image === '').length > 0) {
            insights.push('Existem produtos sem imagem.');
        }
        if (products.filter(p => !p.description || p.description.trim() === '').length > 0) {
            insights.push('Existem produtos sem descrição.');
        }
        if (products.filter(p => !p.link || p.link === '').length > 0) {
            insights.push('Existem produtos sem link.');
        }
        if (products.filter(p => !p.active).length > 5) {
            insights.push('Há muitos produtos inativos.');
        }
        if (products.length > 0 && score > 90) {
            insights.push('Catálogo com excelente qualidade!');
        }

        const stats = {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.active).length,
            inactiveProducts: products.filter(p => !p.active).length,
            totalCategories: categories.length,
            averagePrice: calculateAverage(products.map(p => p.price)),
            minPrice: Math.min(...products.map(p => p.price)),
            maxPrice: Math.max(...products.map(p => p.price)),
            productsByCategory: groupByCategory(products),
            recentProducts: products
                .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
                .slice(0, 5),
            productsWithoutImage: products.filter(p => !p.image || p.image === '').length,
            productsWithoutDescription: products.filter(p => !p.description || p.description.trim() === '').length,
            productsWithoutLink: products.filter(p => !p.link || p.link === '').length,
            priceDistribution,
            score,
            insights
        };
        return stats;
    } catch (error) {
        console.error('Erro ao calcular analytics:', error);
        throw error;
    }
}

function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
}

function groupByCategory(products) {
    const grouped = {};
    products.forEach(product => {
        const category = product.category || 'Sem categoria';
        if (!grouped[category]) {
            grouped[category] = {
                name: category,
                count: 0,
                totalValue: 0,
                products: []
            };
        }
        grouped[category].count++;
        grouped[category].totalValue += product.price;
        grouped[category].products.push(product);
    });
    return Object.values(grouped)
        .sort((a, b) => b.count - a.count);
}

export function renderAnalyticsDashboard(stats) {
    const container = document.getElementById('analytics-container');
    if (!container) return;
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📦 Total de Produtos</h3>
                <div class="stat-value">${stats.totalProducts}</div>
                <p class="stat-detail">
                    ${stats.activeProducts} ativos • ${stats.inactiveProducts} inativos
                </p>
            </div>
            <div class="stat-card">
                <h3>🏷️ Categorias</h3>
                <div class="stat-value">${stats.totalCategories}</div>
                <p class="stat-detail">
                    ${stats.productsByCategory.length} com produtos
                </p>
            </div>
            <div class="stat-card">
                <h3>💰 Preço Médio</h3>
                <div class="stat-value">R$ ${stats.averagePrice.toFixed(2)}</div>
                <p class="stat-detail">
                    Min: R$ ${stats.minPrice.toFixed(2)} • Max: R$ ${stats.maxPrice.toFixed(2)}
                </p>
            </div>
            <div class="stat-card">
                <h3>⚠️ Pendências</h3>
                <div class="stat-value">${
                    stats.productsWithoutImage + 
                    stats.productsWithoutDescription + 
                    stats.productsWithoutLink
                }</div>
                <p class="stat-detail">
                    ${stats.productsWithoutImage} sem imagem<br>
                    ${stats.productsWithoutDescription} sem descrição<br>
                    ${stats.productsWithoutLink} sem link
                </p>
            </div>
            <div class="stat-card">
                <h3>⭐ Score de Qualidade</h3>
                <div class="stat-value">${stats.score} / 100</div>
                <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 0.5rem;">
                    <div style="background: linear-gradient(90deg, #10b981, #3b82f6); width: ${stats.score}%; height: 100%;"></div>
                </div>
            </div>
        </div>
        <div class="card mt-4">
            <h2>📊 Produtos por Categoria</h2>
            <div id="category-chart"></div>
        </div>
        <div class="card mt-4">
            <h2>💸 Distribuição de Preços</h2>
            <div id="price-distribution-chart"></div>
        </div>
        <div class="card mt-4">
            <h2>🆕 Produtos Adicionados Recentemente</h2>
            <div id="recent-products-list"></div>
        </div>
        <div class="card mt-4">
            <h2>🔎 Insights Automáticos</h2>
            <ul>
                ${stats.insights.map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>
        ${generateQualityAlerts(stats)}
    `;
    renderCategoryChart(stats.productsByCategory);
    renderRecentProducts(stats.recentProducts);
    renderPriceDistributionChart(stats.priceDistribution);
function renderPriceDistributionChart(priceDistribution) {
    const chartContainer = document.getElementById('price-distribution-chart');
    if (!chartContainer) return;
    const maxCount = Math.max(...priceDistribution.map(r => r.count));
    chartContainer.innerHTML = priceDistribution.map(range => `
        <div style="margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between;">
                <span>${range.range}</span>
                <span>${range.count} produtos</span>
            </div>
            <div style="background: #e0e0e0; height: 16px; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #6366f1, #10b981); width: ${(range.count / maxCount) * 100}%; height: 100%;"></div>
            </div>
        </div>
    `).join('');
}
}

function renderCategoryChart(categoryData) {
    const chartContainer = document.getElementById('category-chart');
    if (!chartContainer) return;
    const maxCount = Math.max(...categoryData.map(c => c.count));
    chartContainer.innerHTML = categoryData.map(category => `
        <div class="chart-bar-item" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 600;">${category.name}</span>
                <span style="color: var(--primary);">${category.count} produtos</span>
            </div>
            <div style="background: #e0e0e0; height: 24px; border-radius: 12px; overflow: hidden;">
                <div style="
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    height: 100%;
                    width: ${(category.count / maxCount) * 100}%;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    padding: 0 0.5rem;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                ">
                    R$ ${category.totalValue.toFixed(2)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderRecentProducts(products) {
    const container = document.getElementById('recent-products-list');
    if (!container) return;
    container.innerHTML = products.map(product => `
        <div class="product-item">
            <img src="${product.image || 'placeholder.png'}" alt="${product.name}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.category || 'Sem categoria'}</p>
                <span class="price">R$ ${product.price.toFixed(2)}</span>
            </div>
            <span class="status ${product.active ? 'active' : 'inactive'}">
                ${product.active ? '✓ Ativo' : '✕ Inativo'}
            </span>
        </div>
    `).join('');
}

function generateQualityAlerts(stats) {
    const alerts = [];
    if (stats.productsWithoutImage > 0) {
        alerts.push({
            type: 'warning',
            icon: '📷',
            title: 'Produtos sem Imagem',
            message: `${stats.productsWithoutImage} produto(s) sem imagem. Adicione imagens para melhorar a aparência da loja.`
        });
    }
    if (stats.productsWithoutDescription > 0) {
        alerts.push({
            type: 'info',
            icon: '📝',
            title: 'Produtos sem Descrição',
            message: `${stats.productsWithoutDescription} produto(s) sem descrição. Descrições ajudam os clientes a conhecer melhor os produtos.`
        });
    }
    if (stats.inactiveProducts > 5) {
        alerts.push({
            type: 'info',
            icon: '💤',
            title: 'Muitos Produtos Inativos',
            message: `Você tem ${stats.inactiveProducts} produtos inativos. Considere ativá-los ou removê-los.`
        });
    }
    if (alerts.length === 0) {
        return `
            <div class="card mt-4" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                <h2>✨ Tudo Certo!</h2>
                <p>Sua loja está em ótimo estado. Continue assim! 🎉</p>
            </div>
        `;
    }
    return `
        <div class="card mt-4">
            <h2>💡 Sugestões de Melhoria</h2>
            ${alerts.map(alert => `
                <div class="alert alert-${alert.type}" style="
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border-radius: 8px;
                    background: ${alert.type === 'warning' ? '#fef3c7' : '#dbeafe'};
                    border-left: 4px solid ${alert.type === 'warning' ? '#f59e0b' : '#3b82f6'};
                ">
                    <strong>${alert.icon} ${alert.title}</strong>
                    <p style="margin: 0.5rem 0 0 0;">${alert.message}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function initRealtimeAnalytics() {
    const db = firebase.firestore();
    db.collection('products').onSnapshot(async () => {
        const stats = await getProductAnalytics();
        renderAnalyticsDashboard(stats);
    });
}
