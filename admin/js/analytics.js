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
    // Renderizar insights e sugestões
    const insightsContainer = document.getElementById('admin-insights');
    if (insightsContainer) {
        insightsContainer.innerHTML = `
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">🆕 Produtos Adicionados Recentemente</h2>
                    <a href="products.html" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8125rem;">Ver Todos</a>
                </div>
                <div class="product-list" id="recent-products-list"></div>
            </div>
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">💡 Insights Automáticos</h2>
                </div>
                <div class="insights-grid">
                    ${stats.insights.map(i => {
                        const hasDescription = i.includes('sem descrição');
                        const filterType = hasDescription ? 'no-description' : 'no-link';
                        return `
                        <a href="products.html?filter=${filterType}" class="insight-card-link">
                            <div class="insight-card ${hasDescription ? 'info' : 'warning'}">
                                <div class="insight-header">
                                    <span class="insight-icon">${hasDescription ? '📝' : '🔗'}</span>
                                    <span class="insight-title">${hasDescription ? 'Produtos sem Descrição' : 'Produtos sem Link'}</span>
                                </div>
                                <p class="insight-message">${i}</p>
                            </div>
                        </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    // Renderizar dashboard principal
    const container = document.getElementById('analytics-container');
    if (!container) return;
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-header">
                    <div>
                        <div class="stat-title">Total de Produtos</div>
                    </div>
                    <div class="stat-icon">📦</div>
                </div>
                <div class="stat-value">${stats.totalProducts}</div>
                <div class="stat-detail">
                    ${stats.activeProducts} ativos • ${stats.inactiveProducts} inativos
                    <span class="stat-trend up">↑ 0%</span>
                </div>
            </div>
            <div class="stat-card green">
                <div class="stat-header">
                    <div>
                        <div class="stat-title">Preço Médio</div>
                    </div>
                    <div class="stat-icon">💰</div>
                </div>
                <div class="stat-value">R$ ${stats.averagePrice.toFixed(0)}</div>
                <div class="stat-detail">
                    Min: R$ ${stats.minPrice.toFixed(0)} • Max: R$ ${stats.maxPrice.toFixed(0)}
                </div>
            </div>
            <div class="stat-card purple">
                <div class="stat-header">
                    <div>
                        <div class="stat-title">Categorias</div>
                    </div>
                    <div class="stat-icon">🏷️</div>
                </div>
                <div class="stat-value">${stats.totalCategories}</div>
                <div class="stat-detail">
                    ${stats.productsByCategory.length} com produtos
                </div>
            </div>
            <div class="stat-card orange">
                <div class="stat-header">
                    <div>
                        <div class="stat-title">Score de Qualidade</div>
                    </div>
                    <div class="stat-icon">✨</div>
                </div>
                <div class="stat-value">${stats.score}%</div>
                <div class="stat-detail">
                    <span>Bom</span>
                    <span class="stat-trend up">↑ Melhorando</span>
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
    `;
    renderPieChartsAligned(stats.productsByCategory, stats.activeProducts, stats.inactiveProducts);
    // Renderiza gráficos de pizza alinhados e com ajuste manual de tamanho
    function renderPieChartsAligned(categoryData, active, inactive) {
        const container = document.getElementById('category-chart');
        if (!container) return;
        container.innerHTML = `
            <div class="pie-charts-container">
                <div class="pie-chart-wrapper">
                    <label for="categoryPieWidth" class="chart-label">Tamanho gráfico categoria:</label>
                    <input type="range" id="categoryPieWidth" min="200" max="500" value="320" class="chart-slider">
                    <canvas id="categoryPieChart" class="pie-chart-canvas"></canvas>
                </div>
                <div class="pie-chart-wrapper">
                    <label for="statusPieWidth" class="chart-label">Tamanho gráfico status:</label>
                    <input type="range" id="statusPieWidth" min="200" max="500" value="320" class="chart-slider">
                    <canvas id="statusPieChart" class="pie-chart-canvas"></canvas>
                </div>
            </div>
        `;
        // Gráfico de categoria
        const catCtx = document.getElementById('categoryPieChart').getContext('2d');
        const catLabels = categoryData.map(c => c.name);
        const catData = categoryData.map(c => c.count);
        const catColors = [
            '#6366f1', '#10b981', '#f59e42', '#ef4444', '#3b82f6', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#eab308', '#14b8a6', '#f43f5e'
        ];
        new Chart(catCtx, {
            type: 'pie',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: catColors,
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: { size: 14 },
                            color: '#222',
                            boxWidth: 20,
                            padding: 16,
                            textAlign: 'center'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.dataset.data[idx];
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} produtos (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
        // Gráfico de status (ativos/inativos)
        const statusCtx = document.getElementById('statusPieChart').getContext('2d');
        let statusLabels = ['Ativos'];
        let statusData = [active];
        let statusColors = ['#10b981'];
        if (inactive > 0) {
            statusLabels.push('Inativos');
            statusData.push(inactive);
            statusColors.push('#ef4444');
        }
        new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusColors,
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14 },
                            color: '#222',
                            boxWidth: 20,
                            padding: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.dataset.data[idx];
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} produtos (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
        // Slider para ajuste manual dos gráficos
        document.getElementById('categoryPieWidth').addEventListener('input', function() {
            document.getElementById('categoryPieChart').style.width = this.value + 'px';
        });
        document.getElementById('statusPieWidth').addEventListener('input', function() {
            document.getElementById('statusPieChart').style.width = this.value + 'px';
        });
    }
    renderRecentProducts(stats.recentProducts);
    renderPriceDistributionChart(stats.priceDistribution);
// Gráfico de pizza de produtos ativos vs. inativos
function renderStatusPieChart(active, inactive) {
    const container = document.getElementById('category-chart');
    if (!container) return;
    // Cria um novo canvas abaixo do gráfico de categoria
    let statusChartDiv = document.getElementById('status-pie-chart');
    if (!statusChartDiv) {
        statusChartDiv = document.createElement('div');
        statusChartDiv.id = 'status-pie-chart';
        statusChartDiv.style.marginTop = '2rem';
        statusChartDiv.innerHTML = '<canvas id="statusPieChart" style="max-width:320px;"></canvas>';
        container.appendChild(statusChartDiv);
    }
    const ctx = document.getElementById('statusPieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Ativos', 'Inativos'],
            datasets: [{
                data: [active, inactive],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        color: '#222',
                        boxWidth: 20,
                        padding: 16,
                        textAlign: 'center'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.dataset.data[idx];
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} produtos (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}
function renderPriceDistributionChart(priceDistribution) {
    const chartContainer = document.getElementById('price-distribution-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:420px;">
        <label for="barChartWidth" style="margin-bottom:0.5rem;font-weight:600;">Ajuste a largura do gráfico:</label>
        <input type="range" id="barChartWidth" min="320" max="900" value="700" style="width:220px;margin-bottom:1rem;">
        <canvas id="priceBarChart" style="max-width:900px;min-width:320px;width:700px;"></canvas>
      </div>`;
    const ctx = document.getElementById('priceBarChart').getContext('2d');
    const labels = priceDistribution.map(r => r.range);
    const data = priceDistribution.map(r => r.count);
    const barColors = labels.map((_, i) => i % 2 === 0 ? '#6366f1' : '#10b981');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Produtos',
                data,
                backgroundColor: barColors,
                borderRadius: 10,
                maxBarThickness: 60
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y} produtos`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'center',
                    color: '#222',
                    font: { weight: 'bold', size: 16 },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Faixa de Preço',
                        font: { size: 18 }
                    },
                    ticks: {
                        font: { size: 16 },
                        maxRotation: 30,
                        minRotation: 0
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Quantidade de Produtos',
                        font: { size: 18 }
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 16 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
    // Slider para ajuste manual do tamanho do gráfico
    const slider = document.getElementById('barChartWidth');
    slider.addEventListener('input', function() {
      document.getElementById('priceBarChart').style.width = this.value + 'px';
      chart.resize();
    });
}
}

function renderCategoryChart(categoryData) {
    const chartContainer = document.getElementById('category-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="categoryPieChart" style="max-width:400px;"></canvas>';
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    const labels = categoryData.map(c => c.name);
    const data = categoryData.map(c => c.count);
    const backgroundColors = [
        '#6366f1', '#10b981', '#f59e42', '#ef4444', '#3b82f6', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#eab308', '#14b8a6', '#f43f5e'
    ];
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 16 },
                        color: '#222',
                        boxWidth: 24,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.dataset.data[idx];
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} produtos (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderRecentProducts(products) {
    const container = document.getElementById('recent-products-list');
    if (!container) return;
    container.innerHTML = products.map(product => `
        <div class="product-item">
            <img src="${product.image || 'placeholder.png'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category || 'Sem categoria'}</div>
            </div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            <span class="badge success">✓ Ativo</span>
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
