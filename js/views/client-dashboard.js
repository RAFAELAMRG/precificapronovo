/* --- Client View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db, PLANS, MARKETPLACES } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/dashboard', renderClientDashboard);
router.on('#/inventario', renderClientInventory);
router.on('#/relatorios', renderClientReports);
router.on('#/relatorios/dre', (container, user) => {
    router.navigate('#/financeiro/resumo');
});
router.on('#/relatorios/vendas', (container, user) => renderClientReports(container, user, 'vendas'));
router.on('#/relatorios/ads', (container, user) => renderClientReports(container, user, 'ads'));
router.on('#/alertas', renderClientAlerts);
router.on('#/configuracoes', renderClientSettings);

// ==========================================
// RENDERERS & MODULE STATES
// ==========================================
let reportStartDate = '';
let reportEndDate = '';
let reportMktFilter = 'all';

function renderClientDashboard(container, user) {
    const metrics = api.getClientDashboardMetrics(user.id);
    const products = api.getProducts(user.id).slice(0, 5); // top 5
    const alerts = api.getAlerts(user.id).filter(a => a.status === 'nao_lido').slice(0, 3); // top 3 unread
    const settings = api.getMarketplaceSettings();

    container.innerHTML = `
        <!-- Metrics Cards -->
        <div class="metrics-grid">
            <div class="metric-card primary-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Total de Produtos</span>
                    <div class="metric-card-icon"><i data-lucide="package"></i></div>
                </div>
                <div class="metric-card-value">${metrics.totalProducts}</div>
                <div class="metric-card-footer">
                    <span class="metric-label">SKUs cadastrados</span>
                </div>
            </div>

            <div class="metric-card success-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Produtos Lucrativos</span>
                    <div class="metric-card-icon" style="color: var(--success); background-color: var(--success-light);"><i data-lucide="trending-up"></i></div>
                </div>
                <div class="metric-card-value">${metrics.profitableProducts}</div>
                <div class="metric-card-footer">
                    <span class="metric-label">Margem superior a 0%</span>
                </div>
            </div>

            <div class="metric-card danger-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Produtos em Prejuízo</span>
                    <div class="metric-card-icon" style="color: var(--danger); background-color: var(--danger-light);"><i data-lucide="alert-octagon"></i></div>
                </div>
                <div class="metric-card-value">${metrics.lossProducts}</div>
                <div class="metric-card-footer">
                    ${metrics.lossProducts > 0 
                        ? `<span class="metric-trend down"><i data-lucide="arrow-down-right"></i>Atenção</span>`
                        : `<span class="metric-trend up" style="color: var(--success);"><i data-lucide="check"></i>Tudo ok</span>`
                    }
                    <span class="metric-label">Margem negativa</span>
                </div>
            </div>

            <div class="metric-card warning-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Lucro Mensal Estimado</span>
                    <div class="metric-card-icon" style="color: var(--warning); background-color: var(--warning-light);"><i data-lucide="dollar-sign"></i></div>
                </div>
                <div class="metric-card-value">R$ ${parseFloat(metrics.estimatedProfit).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="metric-card-footer">
                    <span class="metric-label">Baseado em média de 15 vendas/SKU</span>
                </div>
            </div>
        </div>

        <!-- Middle row statistics -->
        <div class="dashboard-row">
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Lucratividade Média por Canal</h2>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Margem (%) por Marketplace</span>
                </div>
                <div class="chart-container">
                    <svg class="svg-chart" viewBox="0 0 600 280">
                        <!-- Horizontal Grid Lines -->
                        <line class="chart-grid-line" x1="50" y1="50" x2="550" y2="50"></line>
                        <line class="chart-grid-line" x1="50" y1="120" x2="550" y2="120"></line>
                        <line class="chart-grid-line" x1="50" y1="190" x2="550" y2="190"></line>
                        
                        <!-- Axis text -->
                        <text class="chart-axis-text" x="30" y="55">40%</text>
                        <text class="chart-axis-text" x="30" y="125">20%</text>
                        <text class="chart-axis-text" x="30" y="195">0%</text>
                        
                        <!-- Bars -->
                        <!-- ML (15% margem) -> height calculation: 190 - 15*3.5 = 137.5 -->
                        <rect class="chart-bar" x="80" y="137.5" width="40" height="52.5"></rect>
                        <text class="chart-axis-text" x="90" y="215">ML</text>
                        
                        <!-- Shopee (25% margem) -> height: 190 - 25*3.5 = 102.5 -->
                        <rect class="chart-bar secondary" x="170" y="102.5" width="40" height="87.5"></rect>
                        <text class="chart-axis-text" x="175" y="215">Shopee</text>
                        
                        <!-- Amazon (-5% margem) -> height goes downwards: y=190, height = 17.5 -->
                        <rect class="chart-bar" style="fill: var(--danger);" x="260" y="190" width="40" height="17.5"></rect>
                        <text class="chart-axis-text" x="265" y="215">Amazon</text>
                        
                        <!-- Magalu (30% margem) -> height: 190 - 30*3.5 = 85 -->
                        <rect class="chart-bar secondary" x="350" y="85" width="40" height="105"></rect>
                        <text class="chart-axis-text" x="355" y="215">Magalu</text>
 
                        <!-- Shein (20% margem) -> height: 190 - 20*3.5 = 120 -->
                        <rect class="chart-bar secondary" x="440" y="120" width="40" height="70"></rect>
                        <text class="chart-axis-text" x="448" y="215">Shein</text>
                    </svg>
                </div>
            </div>
 
            <!-- Panel side details -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Resumo de Canal</h2>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1.25rem; height: 100%; justify-content: center;">
                    <div style="text-align: center; padding: 1.5rem; background-color: rgba(99, 102, 241, 0.05); border-radius: var(--radius-lg); border: 1px dashed var(--primary);">
                        <span style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Mais Rentável</span>
                        <h3 style="font-size: 1.6rem; color: var(--primary); font-family: var(--font-display); margin-top: 0.25rem;">${metrics.bestMarketplace}</h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Canal com maior contribuição de lucro líquido estimado.</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                        <span style="font-size: 0.85rem; font-weight: 500;">Margem Média Geral</span>
                        <strong style="font-size: 1.1rem; color: var(--success); font-family: var(--font-display);">${metrics.averageMargin}%</strong>
                    </div>
                </div>
            </div>
        </div>
 
        <div class="dashboard-row" style="grid-template-columns: 1fr 1fr;">
            <!-- Critical Notifications Section -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Alertas Críticos Pendentes</h2>
                    <span class="badge" style="background-color: var(--danger-light); color: var(--danger); font-weight: 700;">${metrics.unreadAlerts}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${alerts.length === 0 
                        ? `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">Nenhum alerta crítico ativo para seus produtos. Bom trabalho!</p>`
                        : alerts.map(a => `
                            <div class="alert-item-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-page);">
                                <div class="alert-icon-wrap ${a.tipo === 'prejuizo' ? 'danger' : 'warning'}">
                                    <i data-lucide="${a.tipo === 'prejuizo' ? 'alert-octagon' : 'alert-triangle'}"></i>
                                </div>
                                <div class="alert-body-wrap">
                                    <p class="alert-item-text" style="font-size: 0.85rem;">${a.mensagem}</p>
                                    <span class="alert-item-time">${new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
 
            <!-- Recent products list -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Produtos Recentes</h2>
                    <a href="#/produtos" class="btn btn-secondary btn-sm">Ver Catálogo</a>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${products.length === 0 
                        ? `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">Nenhum produto cadastrado no momento.</p>`
                        : products.map(p => `
                            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                                <div style="display: flex; flex-direction: column;">
                                    <strong style="font-size: 0.9rem; color: var(--text-primary);">${p.nome}</strong>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku} • <span class="marketplace-badge ${p.marketplace}" style="font-size: 0.65rem; padding: 1px 4px;">${settings[p.marketplace]?.name || p.marketplace}</span></span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; font-size: 0.95rem;">R$ ${p.preco_atual.toFixed(2)}</div>
                                    <span class="badge ${p.margem > 0 ? 'status-lucro' : 'status-prejuizo'}" style="font-size: 0.7rem; padding: 1px 6px;">${p.margem}% margem</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderClientReports(container, user, initialTab = 'geral') {
    const settings = api.getMarketplaceSettings();
    
    container.innerHTML = `
        <div class="page-header" style="margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); margin-bottom: 0.25rem;">Relatórios & Performance</h1>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Análise detalhada de DRE, Venda a Venda e Gestão de Ads.</p>
            </div>
        </div>

        <!-- GLOBAL FILTER BAR -->
        <div class="visual-panel" style="margin-bottom: 2rem; padding: 1.25rem 1.5rem;">
            <div style="display: flex; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap;">
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; flex: 1; min-width: 300px;">
                    <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Data de Início</label>
                        <input type="date" id="report-filter-start" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${reportStartDate}">
                    </div>
                    <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Data de Fim</label>
                        <input type="date" id="report-filter-end" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${reportEndDate}">
                    </div>
                    <div class="form-group" style="margin: 0; flex: 1; min-width: 180px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Marketplace</label>
                        <select id="report-filter-mkt" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                            <option value="all" ${reportMktFilter === 'all' ? 'selected' : ''}>Todos os Canais</option>
                            ${Object.values(settings).map(m => `<option value="${m.id}" ${reportMktFilter === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-export-pdf" style="font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; height: 38px; padding: 0 1rem; border-radius: var(--radius-md); transition: all var(--transition-fast);">
                    <i data-lucide="download" style="width: 16px; height: 16px;"></i> Gerar Relatório (PDF)
                </button>
            </div>
        </div>

        <div class="tab-menu" style="display: flex; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color);">
            <button class="tab-btn ${initialTab === 'geral' ? 'active' : ''}" id="btn-tab-geral" style="padding: 0.75rem 0.5rem; font-weight: ${initialTab === 'geral' ? '600' : '500'}; border-bottom: 3px solid ${initialTab === 'geral' ? 'var(--primary)' : 'transparent'}; color: ${initialTab === 'geral' ? 'var(--primary)' : 'var(--text-secondary)'}; background: none; border: none; cursor: pointer; transition: all var(--transition-fast);">
                Geral Consolidado
            </button>
            <button class="tab-btn ${initialTab === 'dre' ? 'active' : ''}" id="btn-tab-dre" style="padding: 0.75rem 0.5rem; font-weight: ${initialTab === 'dre' ? '600' : '500'}; border-bottom: 3px solid ${initialTab === 'dre' ? 'var(--primary)' : 'transparent'}; color: ${initialTab === 'dre' ? 'var(--primary)' : 'var(--text-secondary)'}; background: none; border: none; cursor: pointer; transition: all var(--transition-fast);">
                DRE & Projeções
            </button>
            <button class="tab-btn ${initialTab === 'vendas' ? 'active' : ''}" id="btn-tab-venda" style="padding: 0.75rem 0.5rem; font-weight: ${initialTab === 'vendas' ? '600' : '500'}; border-bottom: 3px solid ${initialTab === 'vendas' ? 'var(--primary)' : 'transparent'}; color: ${initialTab === 'vendas' ? 'var(--primary)' : 'var(--text-secondary)'}; background: none; border: none; cursor: pointer; transition: all var(--transition-fast);">
                Análise Venda a Venda
            </button>
            <button class="tab-btn ${initialTab === 'ads' ? 'active' : ''}" id="btn-tab-ads" style="padding: 0.75rem 0.5rem; font-weight: ${initialTab === 'ads' ? '600' : '500'}; border-bottom: 3px solid ${initialTab === 'ads' ? 'var(--primary)' : 'transparent'}; color: ${initialTab === 'ads' ? 'var(--primary)' : 'var(--text-secondary)'}; background: none; border: none; cursor: pointer; transition: all var(--transition-fast);">
                Gestão de Ads (ACOS/TACOS)
            </button>
        </div>

        <!-- TAB CONTENT WRAPPERS -->
        <div id="tab-content-geral" class="tab-panel-content" style="${initialTab === 'geral' ? '' : 'display: none;'}">
            <!-- Consolidated General Content -->
        </div>

        <div id="tab-content-dre" class="tab-panel-content" style="${initialTab === 'dre' ? '' : 'display: none;'}">
            <!-- DRE Content will be placed here -->
        </div>

        <div id="tab-content-venda" class="tab-panel-content" style="${initialTab === 'vendas' ? '' : 'display: none;'}">
            <!-- Venda a Venda Content will be placed here -->
        </div>

        <div id="tab-content-ads" class="tab-panel-content" style="${initialTab === 'ads' ? '' : 'display: none;'}">
            <!-- Ads Content will be placed here -->
        </div>
    `;

    // Render each sub-tab initially
    renderGeralTab();
    renderDreTab();
    renderVendaTab();
    renderAdsTab();

    // Hook up filter bar change events
    const startInput = document.getElementById('report-filter-start');
    const endInput = document.getElementById('report-filter-end');
    const mktSelect = document.getElementById('report-filter-mkt');
    const pdfBtn = document.getElementById('btn-export-pdf');

    const updateAllReportTabs = () => {
        reportStartDate = startInput.value;
        reportEndDate = endInput.value;
        reportMktFilter = mktSelect.value;

        renderGeralTab();
        renderDreTab();
        renderVendaTab();
        renderAdsTab();
        lucide.createIcons();
    };

    startInput.addEventListener('change', updateAllReportTabs);
    endInput.addEventListener('change', updateAllReportTabs);
    mktSelect.addEventListener('change', updateAllReportTabs);

    pdfBtn.addEventListener('click', () => {
        window.print();
    });

    // Tab Switching Logic
    const tabButtons = [
        { btn: document.getElementById('btn-tab-geral'), panel: document.getElementById('tab-content-geral') },
        { btn: document.getElementById('btn-tab-dre'), panel: document.getElementById('tab-content-dre') },
        { btn: document.getElementById('btn-tab-venda'), panel: document.getElementById('tab-content-venda') },
        { btn: document.getElementById('btn-tab-ads'), panel: document.getElementById('tab-content-ads') }
    ];

    tabButtons.forEach(tab => {
        tab.btn.addEventListener('click', () => {
            tabButtons.forEach(t => {
                t.btn.classList.remove('active');
                t.btn.style.borderBottom = '3px solid transparent';
                t.btn.style.color = 'var(--text-secondary)';
                t.btn.style.fontWeight = '500';
                t.panel.style.display = 'none';
            });
            tab.btn.classList.add('active');
            tab.btn.style.borderBottom = '3px solid var(--primary)';
            tab.btn.style.color = 'var(--primary)';
            tab.btn.style.fontWeight = '600';
            tab.panel.style.display = 'block';
            
            // Refresh icons inside active panel
            lucide.createIcons();
        });
    });

    lucide.createIcons();

    // HELPER SUB-RENDERERS
    function renderGeralTab() {
        const panel = document.getElementById('tab-content-geral');
        
        // 1. Fetch data
        let orders = api.getOrders(user.id).filter(o => o.status !== 'cancelado');
        const products = api.getProducts(user.id);
        const campaigns = api.getAdsCampaigns(user.id);
        
        // Load operational expenses
        let expenses = [];
        try {
            const stored = localStorage.getItem("precificapro_despesas_operacionais");
            if (stored) expenses = JSON.parse(stored);
        } catch (e) { console.error(e); }
        if (expenses.length === 0) {
            expenses = [
                { data: "2026-05-15", valor: 19.90 },
                { data: "2026-05-10", valor: 350.00 }
            ];
        }

        // Apply filters
        if (reportMktFilter !== 'all') {
            orders = orders.filter(o => o.marketplace === reportMktFilter);
        }
        if (reportStartDate) {
            const start = new Date(reportStartDate + 'T00:00:00');
            orders = orders.filter(o => new Date(o.data) >= start);
            expenses = expenses.filter(e => new Date(e.data + 'T12:00:00') >= start);
        }
        if (reportEndDate) {
            const end = new Date(reportEndDate + 'T23:59:59');
            orders = orders.filter(o => new Date(o.data) <= end);
            expenses = expenses.filter(e => new Date(e.data + 'T12:00:00') <= end);
        }

        // 2. Compute metrics
        let faturamento = 0;
        let cogs = 0;
        let comissaoFees = 0;
        let freteLogistics = 0;
        let impostos = 0;
        let custoExtra = 0;
        
        // Channel grouping
        const channelsData = {
            amazon: { pedidos: 0, faturamento: 0, liquido: 0, ads: 0, lucro: 0 },
            mercado_livre: { pedidos: 0, faturamento: 0, liquido: 0, ads: 0, lucro: 0 },
            shopee: { pedidos: 0, faturamento: 0, liquido: 0, ads: 0, lucro: 0 }
        };

        orders.forEach(o => {
            const mkt = o.marketplace;
            faturamento += o.preco_venda;
            cogs += o.custo || 0;
            comissaoFees += (o.comissao || 0) + (o.taxa_fixa || 0);
            freteLogistics += o.frete || 0;
            const oImposto = o.imposto || (o.preco_venda * 0.1);
            impostos += oImposto;
            const oExtra = o.custo_extra || 0;
            custoExtra += oExtra;

            const oNet = o.preco_venda - (o.comissao || 0) - (o.taxa_fixa || 0) - (o.frete || 0);

            if (channelsData[mkt]) {
                channelsData[mkt].pedidos += 1;
                channelsData[mkt].faturamento += o.preco_venda;
                channelsData[mkt].liquido += oNet;
                channelsData[mkt].lucro += (oNet - oImposto - (o.custo || 0) - oExtra);
            }
        });

        // Ads Campaign calculations
        let adsSpend = 0;
        let filteredCampaigns = campaigns;
        if (reportMktFilter !== 'all') {
            filteredCampaigns = campaigns.filter(c => c.marketplace === reportMktFilter);
        }
        filteredCampaigns.forEach(c => {
            adsSpend += c.investimento;
            const mkt = c.marketplace;
            if (channelsData[mkt]) {
                channelsData[mkt].ads += c.investimento;
                channelsData[mkt].lucro -= c.investimento;
            }
        });

        // Operational Expenses
        const opExpensesTotal = expenses.reduce((sum, e) => sum + e.valor, 0);

        // Refund projections (conservatively simulated at 1.2% of faturamento)
        const refundLosses = faturamento * 0.012;

        // Mathematical derivations
        const liquidoMarketplace = faturamento - comissaoFees - freteLogistics;
        const lucroLiquidoReal = liquidoMarketplace - cogs - impostos - adsSpend - opExpensesTotal - custoExtra - refundLosses;
        const marginLiquida = faturamento > 0 ? (lucroLiquidoReal / faturamento) * 100 : 0;

        // Deductions & Expenses totals
        const totalDeducoes = comissaoFees + impostos;
        const totalAdsOp = adsSpend + opExpensesTotal;

        const formatMoney = (val) => `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // 3. Inventory & Curva ABC stats
        const stockTotalValue = products.reduce((sum, p) => sum + (p.custo * (p.estoque || 0)), 0);
        const totalEstoqueItens = products.reduce((sum, p) => sum + (p.estoque || 0), 0);
        
        let curvaA = 0, curvaB = 0, curvaCZ = 0;
        // Simple mock curve counts based on João Vendedor products count
        if (products.length > 0) {
            curvaA = Math.max(1, Math.round(products.length * 0.25));
            curvaB = Math.max(1, Math.round(products.length * 0.35));
            curvaCZ = Math.max(0, products.length - curvaA - curvaB);
        }

        panel.innerHTML = `
            <!-- Dossier Overview Metrics -->
            <div class="metrics-grid" style="margin-bottom: 1.5rem;">
                <div class="metric-card primary-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Faturamento Consolidado</span>
                        <div class="metric-card-icon"><i data-lucide="trending-up"></i></div>
                    </div>
                    <div class="metric-card-value">${formatMoney(faturamento)}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Total bruto faturado</span>
                    </div>
                </div>

                <div class="metric-card warning-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Deduções & Impostos</span>
                        <div class="metric-card-icon" style="color: var(--warning); background-color: var(--warning-light);"><i data-lucide="percent"></i></div>
                    </div>
                    <div class="metric-card-value">${formatMoney(totalDeducoes)}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Comissões + Tarifas + Impostos</span>
                    </div>
                </div>

                <div class="metric-card danger-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Ads & Fixas Operacionais</span>
                        <div class="metric-card-icon"><i data-lucide="activity"></i></div>
                    </div>
                    <div class="metric-card-value">${formatMoney(totalAdsOp)}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Marketing + Gastos Operacionais</span>
                    </div>
                </div>

                <div class="metric-card ${lucroLiquidoReal >= 0 ? 'success-accent' : 'danger-accent'}">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Lucro Líquido Real</span>
                        <div class="metric-card-icon" style="color: ${lucroLiquidoReal >= 0 ? 'var(--success)' : 'var(--danger)'}; background-color: ${lucroLiquidoReal >= 0 ? 'var(--success-light)' : 'var(--danger-light)'};"><i data-lucide="check-circle"></i></div>
                    </div>
                    <div class="metric-card-value" style="color: ${lucroLiquidoReal >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(lucroLiquidoReal)}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Margem Líquida Limpa: <strong>${marginLiquida.toFixed(2)}%</strong></span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem; align-items: flex-start;">
                <!-- Left Block: Channels Comparative Grid -->
                <div class="table-panel" style="margin-bottom: 0;">
                    <div class="panel-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);">
                        <h2 class="panel-title" style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">Desempenho Comparativo por Canal</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="modern-table" style="font-size: 0.82rem;">
                            <thead>
                                <tr>
                                    <th>Marketplace</th>
                                    <th style="text-align: center;">Pedidos</th>
                                    <th style="text-align: right;">Faturamento</th>
                                    <th style="text-align: right;">Líq. Recebido</th>
                                    <th style="text-align: right;">Ads Spend</th>
                                    <th style="text-align: right;">Lucro Real</th>
                                    <th style="text-align: center;">Margem %</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(channelsData).map(key => {
                                    const c = channelsData[key];
                                    const name = key === 'amazon' ? 'Amazon' : (key === 'mercado_livre' ? 'Mercado Livre' : 'Shopee');
                                    const cMargin = c.faturamento > 0 ? (c.lucro / c.faturamento) * 100 : 0;
                                    const badgeClass = cMargin >= 20 ? 'status-lucro' : (cMargin > 0 ? 'status-pending' : 'status-prejuizo');
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <span class="marketplace-badge ${key}">${name}</span>
                                            </td>
                                            <td style="text-align: center; font-weight: 600;">${c.pedidos}</td>
                                            <td style="text-align: right; font-weight: 500; color: var(--text-primary);">${formatMoney(c.faturamento)}</td>
                                            <td style="text-align: right;">${formatMoney(c.liquido)}</td>
                                            <td style="text-align: right; color: var(--danger); font-family: monospace;">-${formatMoney(c.ads)}</td>
                                            <td style="text-align: right; font-weight: 700; color: ${c.lucro >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(c.lucro)}</td>
                                            <td style="text-align: center;">
                                                <span class="badge ${badgeClass}" style="font-weight: 700;">
                                                    ${cMargin.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right Block: Operational Cost Ray-X -->
                <div class="visual-panel" style="gap: 1.25rem;">
                    <h2 class="panel-title" style="font-size: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; color: var(--text-primary);">Dedução e Auditoria de Custos</h2>
                    <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.85rem;">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                <span>Custos Diretos (COGS)</span>
                                <strong>${formatMoney(cogs)}</strong>
                            </div>
                            <div style="height: 6px; background-color: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background-color: var(--primary); width: ${faturamento > 0 ? (cogs / faturamento) * 100 : 0}%"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                <span>Comissões e Tarifas Mkt</span>
                                <strong>${formatMoney(comissaoFees)}</strong>
                            </div>
                            <div style="height: 6px; background-color: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background-color: var(--warning); width: ${faturamento > 0 ? (comissaoFees / faturamento) * 100 : 0}%"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                <span>Investimento em Ads</span>
                                <strong>${formatMoney(adsSpend)}</strong>
                            </div>
                            <div style="height: 6px; background-color: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background-color: var(--danger); width: ${faturamento > 0 ? (adsSpend / faturamento) * 100 : 0}%"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                <span>Impostos e Custos Eventuais</span>
                                <strong>${formatMoney(impostos + custoExtra)}</strong>
                            </div>
                            <div style="height: 6px; background-color: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background-color: var(--text-muted); width: ${faturamento > 0 ? ((impostos + custoExtra) / faturamento) * 100 : 0}%"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                                <span>Estimativa de Reembolsos</span>
                                <strong>${formatMoney(refundLosses)}</strong>
                            </div>
                            <div style="height: 6px; background-color: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background-color: #f43f5e; width: ${faturamento > 0 ? (refundLosses / faturamento) * 100 : 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Third Row: Inventory & Curva ABC audit summary -->
            <div class="visual-panel" style="padding: 1.5rem;">
                <h2 class="panel-title" style="font-size: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; color: var(--text-primary);">Dossiê de Estoque & Curva ABC</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Produtos Cadastrados</span>
                        <strong style="font-size: 1.25rem; color: var(--text-primary);">${products.length} SKUs</strong>
                        <span>Total de unidades ativas: <strong>${totalEstoqueItens} unidades</strong></span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Valor do Ativo Direct (Estoque)</span>
                        <strong style="font-size: 1.25rem; color: var(--text-primary);">${formatMoney(stockTotalValue)}</strong>
                        <span>Custo unitário ponderado do ativo em estoque</span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Distribuição Curva ABC</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                            <span class="badge status-active" style="font-weight: 800; font-size: 0.7rem; border-radius: var(--radius-sm);">Curva A: ${curvaA}</span>
                            <span class="badge status-pending" style="font-weight: 800; font-size: 0.7rem; border-radius: var(--radius-sm);">Curva B: ${curvaB}</span>
                            <span class="badge status-blocked" style="font-weight: 800; font-size: 0.7rem; border-radius: var(--radius-sm);">Curva C/Z: ${curvaCZ}</span>
                        </div>
                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Impacto na curva de faturamento do vendedor</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderDreTab() {
        const panel = document.getElementById('tab-content-dre');
        let orders = api.getOrders(user.id).filter(o => o.status !== 'cancelado');
        
        // Filter by global filters
        if (reportMktFilter !== 'all') {
            orders = orders.filter(o => o.marketplace === reportMktFilter);
        }
        if (reportStartDate) {
            const [y, m, d] = reportStartDate.split('-').map(Number);
            const start = new Date(y, m - 1, d, 0, 0, 0, 0);
            orders = orders.filter(o => new Date(o.data) >= start);
        }
        if (reportEndDate) {
            const [y, m, d] = reportEndDate.split('-').map(Number);
            const end = new Date(y, m - 1, d, 23, 59, 59, 999);
            orders = orders.filter(o => new Date(o.data) <= end);
        }
        
        let revenue = 0;
        let costs = 0;
        let fees = 0;
        let frete = 0;
        
        orders.forEach(o => {
            revenue += o.preco_venda;
            costs += o.custo;
            fees += (o.comissao + o.taxa_fixa);
            frete += o.frete;
        });

        const profit = revenue - costs - fees - frete;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Dynamic 6-month chart calculation
        const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const referenceDate = reportEndDate ? new Date(reportEndDate) : new Date();
        
        const activeMonths = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
            activeMonths.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                label: monthsNames[d.getMonth()]
            });
        }
        
        const monthlyData = activeMonths.map(m => {
            let monthRevenue = 0;
            let monthFees = 0;
            orders.forEach(o => {
                const oDate = new Date(o.data);
                if (oDate.getFullYear() === m.year && oDate.getMonth() === m.month) {
                    monthRevenue += o.preco_venda;
                    monthFees += (o.comissao + o.taxa_fixa + o.frete);
                }
            });
            return { revenue: monthRevenue, fees: monthFees };
        });
        
        const maxVal = Math.max(
            ...monthlyData.map(d => Math.max(d.revenue, d.fees)),
            1000 // default minimum max value of 1k
        );
        
        const getY = (val) => 190 - (val / maxVal) * 140;
        const getX = (index) => 75 + index * 90;
        
        let revPath = "";
        let feesPath = "";
        
        monthlyData.forEach((d, idx) => {
            const rx = getX(idx);
            const ry = getY(d.revenue);
            const fx = rx;
            const fy = getY(d.fees);
            
            if (idx === 0) {
                revPath = `M ${rx} ${ry}`;
                feesPath = `M ${fx} ${fy}`;
            } else {
                revPath += ` L ${rx} ${ry}`;
                feesPath += ` L ${fx} ${fy}`;
            }
        });

        panel.innerHTML = `
            <div class="metrics-grid" style="margin-bottom: 1.5rem;">
                <div class="metric-card primary-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Faturamento Acumulado</span>
                        <div class="metric-card-icon"><i data-lucide="dollar-sign"></i></div>
                    </div>
                    <div class="metric-card-value">R$ ${revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Vendas brutas liquidadas</span>
                    </div>
                </div>

                <div class="metric-card danger-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Dedução de Taxas</span>
                        <div class="metric-card-icon"><i data-lucide="percent"></i></div>
                    </div>
                    <div class="metric-card-value">R$ ${fees.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Comissões + Tarifas Fixas</span>
                    </div>
                </div>

                <div class="metric-card warning-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Custos Logísticos (Frete)</span>
                        <div class="metric-card-icon"><i data-lucide="truck"></i></div>
                    </div>
                    <div class="metric-card-value">R$ ${frete.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Total de envios pagos</span>
                    </div>
                </div>

                <div class="metric-card ${profit >= 0 ? 'success-accent' : 'danger-accent'}">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Lucro Líquido Real</span>
                        <div class="metric-card-icon" style="color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}; background-color: ${profit >= 0 ? 'var(--success-light)' : 'var(--danger-light)'};">
                            <i data-lucide="${profit >= 0 ? 'trending-up' : 'trending-down'}"></i>
                        </div>
                    </div>
                    <div class="metric-card-value">R$ ${profit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Margem líquida: <strong>${margin.toFixed(1)}%</strong></span>
                    </div>
                </div>
            </div>

            <div class="dashboard-row" style="grid-template-columns: 1fr;">
                <div class="visual-panel">
                    <div class="panel-header">
                        <h2 class="panel-title">Projeção de Vendas vs Custo de Taxas (Demonstrativo Semestral)</h2>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Projeções financeiras baseadas em filtros selecionados</span>
                    </div>
                    
                    <div class="chart-container">
                        <svg class="svg-chart" viewBox="0 0 600 280">
                            <line class="chart-grid-line" x1="50" y1="50" x2="550" y2="50"></line>
                            <line class="chart-grid-line" x1="50" y1="120" x2="550" y2="120"></line>
                            <line class="chart-grid-line" x1="50" y1="190" x2="550" y2="190"></line>
                            
                            <text class="chart-axis-text" x="15" y="55">R$ ${Math.round(maxVal).toLocaleString('pt-BR')}</text>
                            <text class="chart-axis-text" x="15" y="125">R$ ${Math.round(maxVal/2).toLocaleString('pt-BR')}</text>
                            <text class="chart-axis-text" x="15" y="195">0</text>
                            
                            <!-- Line chart for sales -->
                            <path class="chart-line" d="${revPath}" style="stroke: var(--success); fill: none; filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.25));"></path>
                            <!-- Line chart for fees -->
                            <path class="chart-line" d="${feesPath}" style="stroke: var(--danger); fill: none; filter: drop-shadow(0 4px 6px rgba(239, 68, 68, 0.2));"></path>
                            
                            ${activeMonths.map((m, idx) => `
                                <text class="chart-axis-text" x="${getX(idx) - 12}" y="240">${m.label}</text>
                            `).join('')}
                        </svg>
                    </div>
                    
                    <div style="display: flex; gap: 2rem; justify-content: center; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; border-radius: var(--radius-full); background-color: var(--success);"></div>
                            <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">Faturamento</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; border-radius: var(--radius-full); background-color: var(--danger);"></div>
                            <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">Taxas & Fretes Dedução</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderVendaTab() {
        const panel = document.getElementById('tab-content-venda');
        const orders = api.getOrders(user.id);
        
        panel.innerHTML = `
            <div class="table-panel">
                <div class="panel-header" style="flex-wrap: wrap; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                    <h2 class="panel-title">Extrato de Vendas Unitário</h2>
                    
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        <!-- Filters -->
                        <div class="form-group" style="margin: 0; min-width: 140px;">
                            <select id="filter-order-status" class="form-control" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">
                                <option value="all">Todos Status</option>
                                <option value="entregue">Entregue</option>
                                <option value="enviado">Enviado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Pedido ID</th>
                                <th>Data</th>
                                <th>Marketplace</th>
                                <th>Produto (SKU)</th>
                                <th style="text-align: right;">Preço Venda</th>
                                <th style="text-align: right;">Custos (Log+Forn)</th>
                                <th style="text-align: right;">Taxas Retidas</th>
                                <th style="text-align: right;">Lucro Líquido</th>
                                <th>Margem</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body">
                            <!-- Rows will be injected here -->
                        </tbody>
                    </table>
                </div>
                
                <div id="orders-summary-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background-color: var(--bg-page); border-top: 1px solid var(--border-color); border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg); font-size: 0.85rem; color: var(--text-secondary); flex-wrap: wrap; gap: 0.5rem;">
                    <!-- Totals will be injected here -->
                </div>
            </div>
        `;

        const statusSelect = document.getElementById('filter-order-status');

        const updateTable = () => {
            const statusFilter = statusSelect.value;
            
            const filteredOrders = orders.filter(o => {
                const matchMkt = (reportMktFilter === 'all' || o.marketplace === reportMktFilter);
                const matchStatus = (statusFilter === 'all' || o.status === statusFilter);
                
                let matchDate = true;
                if (reportStartDate) {
                    const [y, m, d] = reportStartDate.split('-').map(Number);
                    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
                    matchDate = matchDate && (new Date(o.data) >= start);
                }
                if (reportEndDate) {
                    const [y, m, d] = reportEndDate.split('-').map(Number);
                    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
                    matchDate = matchDate && (new Date(o.data) <= end);
                }
                
                return matchMkt && matchStatus && matchDate;
            });

            const tbody = document.getElementById('orders-table-body');
            const summary = document.getElementById('orders-summary-bar');
            
            if (filteredOrders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma venda encontrada para os filtros selecionados.</td></tr>`;
                summary.innerHTML = `<span>Mostrando 0 pedidos</span><strong>Margem Média: 0.0%</strong>`;
                return;
            }

            tbody.innerHTML = filteredOrders.map(o => {
                const totalCosts = o.custo + o.frete;
                const totalFees = o.comissao + o.taxa_fixa;
                const isProfitable = o.lucro > 0;
                
                let statusBadge = '';
                if (o.status === 'entregue') statusBadge = '<span class="badge" style="background-color: var(--success-light); color: var(--success); font-weight:600;">Entregue</span>';
                else if (o.status === 'enviado') statusBadge = '<span class="badge" style="background-color: var(--primary-light); color: var(--primary); font-weight:600;">Enviado</span>';
                else statusBadge = '<span class="badge" style="background-color: var(--danger-light); color: var(--danger); font-weight:600;">Cancelado</span>';

                return `
                    <tr>
                        <td><strong style="color: var(--text-primary); font-family: monospace;">#${o.pedido_id}</strong></td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(o.data).toLocaleDateString('pt-BR')}</td>
                        <td><span class="marketplace-badge ${o.marketplace}">${settings[o.marketplace]?.name || o.marketplace}</span></td>
                        <td>
                            <div style="display: flex; flex-direction: column; max-width: 200px;">
                                <span style="font-weight: 500; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.nome_produto}</span>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${o.sku}</span>
                            </div>
                        </td>
                        <td style="text-align: right; font-weight: 600; color: var(--text-primary);">R$ ${o.preco_venda.toFixed(2)}</td>
                        <td style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">R$ ${totalCosts.toFixed(2)} <span style="font-size:0.7rem; color:var(--text-muted);">(${o.custo.toFixed(0)}+${o.frete.toFixed(0)})</span></td>
                        <td style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">R$ ${totalFees.toFixed(2)} <span style="font-size:0.7rem; color:var(--text-muted);">(${o.comissao.toFixed(0)}+${o.taxa_fixa.toFixed(0)})</span></td>
                        <td style="text-align: right; font-weight: 700; color: ${isProfitable ? 'var(--success)' : 'var(--danger)'};">R$ ${o.lucro.toFixed(2)}</td>
                        <td>
                            <span class="badge ${isProfitable ? 'status-lucro' : 'status-prejuizo'}" style="font-size: 0.75rem; font-weight: 700;">
                                ${o.margem > 0 ? '+' : ''}${o.margem.toFixed(1)}%
                            </span>
                        </td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }).join('');

            const nonCancelled = filteredOrders.filter(o => o.status !== 'cancelado');
            let sumMargin = 0;
            let sumProfit = 0;
            let sumRevenue = 0;
            nonCancelled.forEach(o => {
                sumMargin += o.margem;
                sumProfit += o.lucro;
                sumRevenue += o.preco_venda;
            });
            const avgMargin = nonCancelled.length > 0 ? (sumMargin / nonCancelled.length) : 0;
            
            summary.innerHTML = `
                <span>Exibindo <strong>${filteredOrders.length}</strong> transações (sendo ${nonCancelled.length} ativas)</span>
                <span>Lucro Acumulado Filtro: <strong style="color: ${sumProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">R$ ${sumProfit.toFixed(2)}</strong></span>
                <strong>Margem Média: ${avgMargin.toFixed(1)}%</strong>
            `;
        };

        statusSelect.addEventListener('change', updateTable);
        
        updateTable();
    }

    function renderAdsTab() {
        const panel = document.getElementById('tab-content-ads');
        let campaigns = api.getAdsCampaigns(user.id);
        
        // Filter campaigns by marketplace
        if (reportMktFilter !== 'all') {
            campaigns = campaigns.filter(c => c.marketplace === reportMktFilter);
        }
        
        // Filter orders by global filters to compute TACOS
        let filteredOrders = api.getOrders(user.id).filter(o => o.status !== "cancelado");
        if (reportMktFilter !== 'all') {
            filteredOrders = filteredOrders.filter(o => o.marketplace === reportMktFilter);
        }
        if (reportStartDate) {
            const [y, m, d] = reportStartDate.split('-').map(Number);
            const start = new Date(y, m - 1, d, 0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(o => new Date(o.data) >= start);
        }
        if (reportEndDate) {
            const [y, m, d] = reportEndDate.split('-').map(Number);
            const end = new Date(y, m - 1, d, 23, 59, 59, 999);
            filteredOrders = filteredOrders.filter(o => new Date(o.data) <= end);
        }

        let totalSpend = 0;
        let totalAttributedRevenue = 0;
        let totalClicks = 0;
        
        campaigns.forEach(c => {
            totalSpend += c.investimento;
            totalAttributedRevenue += c.faturamento_atribuido;
            totalClicks += c.cliques;
        });

        let totalSalesRevenue = 0;
        filteredOrders.forEach(o => {
            totalSalesRevenue += o.preco_venda;
        });

        const acos = totalAttributedRevenue > 0 ? (totalSpend / totalAttributedRevenue) * 100 : 0;
        const tacos = totalSalesRevenue > 0 ? (totalSpend / totalSalesRevenue) * 100 : 0;
        const roas = totalSpend > 0 ? totalAttributedRevenue / totalSpend : 0;

        const summary = {
            totalSpend: totalSpend.toFixed(2),
            totalAttributedRevenue: totalAttributedRevenue.toFixed(2),
            totalClicks,
            acos: acos.toFixed(1),
            tacos: tacos.toFixed(1),
            roas: roas.toFixed(2),
            totalSalesRevenue: totalSalesRevenue.toFixed(2)
        };

        panel.innerHTML = `
            <!-- Ads Cards Dashboard -->
            <div class="metrics-grid" style="margin-bottom: 1.5rem;">
                <div class="metric-card warning-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Investimento em Ads</span>
                        <div class="metric-card-icon" style="color: var(--warning); background-color: var(--warning-light);"><i data-lucide="target"></i></div>
                    </div>
                    <div class="metric-card-value">R$ ${parseFloat(summary.totalSpend).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Valor total alocado em tráfego</span>
                    </div>
                </div>

                <div class="metric-card success-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Receita por Anúncios</span>
                        <div class="metric-card-icon" style="color: var(--success); background-color: var(--success-light);"><i data-lucide="trending-up"></i></div>
                    </div>
                    <div class="metric-card-value">R$ ${parseFloat(summary.totalAttributedRevenue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Vendas diretas geradas por campanhas</span>
                    </div>
                </div>

                <div class="metric-card primary-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">ACOS (Ad Cost of Sales)</span>
                        <div class="metric-card-icon" style="color: var(--primary); background-color: var(--primary-light);"><i data-lucide="percent"></i></div>
                    </div>
                    <div class="metric-card-value">${summary.acos}%</div>
                    <div class="metric-card-footer">
                        <span class="badge ${parseFloat(summary.acos) > 25.0 ? 'status-prejuizo' : 'status-lucro'}" style="font-size:0.7rem; padding:1px 6px;">
                            ${parseFloat(summary.acos) > 25.0 ? 'ACOS Elevado (>25%)' : 'Excelente Retorno'}
                        </span>
                    </div>
                </div>

                <div class="metric-card info-accent">
                    <div class="metric-card-header">
                        <span class="metric-card-title">TACOS (Total Ad Cost of Sales)</span>
                        <div class="metric-card-icon" style="color: #06b6d4; background-color: rgba(6, 182, 212, 0.08);"><i data-lucide="pie-chart"></i></div>
                    </div>
                    <div class="metric-card-value">${summary.tacos}%</div>
                    <div class="metric-card-footer">
                        <span class="metric-label">Impacto no faturamento total</span>
                    </div>
                </div>
            </div>

            <!-- Campaign Manager Widget -->
            <div class="table-panel" style="margin-bottom: 1.5rem;">
                <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                    <h2 class="panel-title">Gerenciador Simulado de Campanhas</h2>
                    <span class="badge" style="background-color: var(--primary-light); color: var(--primary); font-weight:700;">Simulador Live</span>
                </div>
                <div class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Nome da Campanha</th>
                                <th>Canal</th>
                                <th style="text-align: right;">Orçamento (Spend)</th>
                                <th style="text-align: right;">Cliques</th>
                                <th style="text-align: right;">Faturamento Gerado</th>
                                <th style="text-align: right;">ROAS</th>
                                <th>ACOS</th>
                                <th>Status</th>
                                <th style="text-align: center;">Ajuste Rápido (Live)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${campaigns.length === 0 
                                ? `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma campanha de tráfego registrada.</td></tr>`
                                : campaigns.map(c => {
                                    const roas = c.investimento > 0 ? (c.faturamento_atribuido / c.investimento) : 0;
                                    const acos = c.faturamento_atribuido > 0 ? ((c.investimento / c.faturamento_atribuido) * 100) : 0;
                                    const isAcosOk = acos <= 25;
                                    return `
                                        <tr>
                                            <td><strong>${c.nome}</strong></td>
                                            <td><span class="marketplace-badge ${c.marketplace}">${settings[c.marketplace]?.name || c.marketplace}</span></td>
                                            <td style="text-align: right; font-weight:600; color: var(--text-primary);">R$ ${c.investimento.toFixed(2)}</td>
                                            <td style="text-align: right; color: var(--text-secondary);">${c.cliques}</td>
                                            <td style="text-align: right; font-weight:600; color: var(--success);">R$ ${c.faturamento_atribuido.toFixed(2)}</td>
                                            <td style="text-align: right; font-weight:700; color: var(--text-primary);">${roas.toFixed(2)}x</td>
                                            <td>
                                                <span class="badge ${isAcosOk ? 'status-lucro' : 'status-prejuizo'}" style="font-weight:700;">
                                                    ${acos.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge" style="background-color: ${c.status === 'ativo' ? 'var(--success-light)' : 'var(--border-color)'}; color: ${c.status === 'ativo' ? 'var(--success)' : 'var(--text-muted)'}; font-weight:700;">
                                                    ${c.status === 'ativo' ? 'Ativo' : 'Pausado'}
                                                </span>
                                            </td>
                                            <td style="text-align: center;">
                                                <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                                                    <input type="range" class="camp-slider" data-camp-id="${c.id}" min="50" max="1000" step="10" value="${c.investimento}" style="width: 100px; cursor: pointer;">
                                                    <span style="font-size:0.75rem; font-family:monospace; min-width: 50px; text-align: left;">R$ ${c.investimento.toFixed(0)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="visual-panel" style="background-color: rgba(6, 182, 212, 0.03); border: 1px dashed #06b6d4; border-radius: var(--radius-lg); padding: 1.25rem;">
                <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                    <div style="color: #06b6d4; background-color: rgba(6, 182, 212, 0.1); border-radius: var(--radius-full); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink:0;">
                        <i data-lucide="zap" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div>
                        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">Como funciona o simulador de Ads?</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">O slide de **Ajuste Rápido** altera dinamicamente o investimento na campanha. O faturamento atribuído e cliques são recalculados com base no ROI histórico da campanha. As métricas agregadas de **ACOS** e **TACOS** respondem instantaneamente na tela.</p>
                    </div>
                </div>
            </div>
        `;

        const sliders = panel.querySelectorAll('.camp-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = `R$ ${val.toFixed(0)}`;
            });

            slider.addEventListener('change', (e) => {
                const campId = e.target.getAttribute('data-camp-id');
                const val = parseFloat(e.target.value);

                api.updateCampaignBudget(user.id, campId, val);
                renderAdsTab();
                lucide.createIcons();
            });
        });
    }
}

function renderClientAlerts(container, user) {
    const alerts = api.getAlerts(user.id);

    container.innerHTML = `
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Central de Alertas e Notificações</h2>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${alerts.filter(a => a.status === 'nao_lido').length} alertas não lidos</span>
            </div>
            
            <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                ${alerts.length === 0 
                    ? `<p style="text-align: center; color: var(--text-muted); padding: 3rem 0;">Sua caixa de alertas está vazia.</p>`
                    : alerts.map(a => `
                        <div class="alert-item-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; background-color: ${a.status === 'nao_lido' ? 'rgba(99,102,241,0.03)' : 'var(--bg-card)'}; position: relative;">
                            <div style="display: flex; gap: 1rem;">
                                <div class="alert-icon-wrap ${a.tipo === 'prejuizo' ? 'danger' : 'warning'}" style="width: 36px; height: 36px;">
                                    <i data-lucide="${a.tipo === 'prejuizo' ? 'alert-octagon' : 'alert-triangle'}"></i>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <strong style="font-size: 0.95rem; color: var(--text-primary);">${a.tipo === 'prejuizo' ? 'Alerta de Prejuízo Detectado' : 'Alerta de Ajuste / Margem Estreita'}</strong>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-right: 2rem;">${a.mensagem}</p>
                                </div>
                            </div>
                            ${a.status === 'nao_lido' 
                                ? `<span style="position: absolute; top: 1.25rem; right: 1.25rem; width: 8px; height: 8px; background-color: var(--primary); border-radius: var(--radius-full);" title="Não Lido"></span>`
                                : ''
                            }
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderClientSettings(container, user) {
    const subs = db.get("subscriptions");
    const sub = subs.find(s => s.user_id === user.id) || { plano: "pro", status: "ativo", vencimento: "-" };
    const currentPlan = PLANS[sub.plano] || PLANS["pro"];

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.5rem;">
            <!-- Profile Info Panel -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Configurações de Conta</h2>
                </div>
                <form id="profile-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="profile-name">Nome Completo</label>
                            <input type="text" id="profile-name" class="form-control" value="${user.nome}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="profile-email">E-mail Cadastrado</label>
                            <input type="email" id="profile-email" class="form-control" value="${user.email}" disabled>
                        </div>
                    </div>
                    
                    <div class="dropdown-divider"></div>
                    
                    <div class="panel-header" style="padding-top: 0.5rem;">
                        <h2 class="panel-title" style="font-size: 1rem;">Alterar Senha de Acesso</h2>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="pwd-old">Senha Atual</label>
                            <input type="password" id="pwd-old" class="form-control" placeholder="••••••••" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="pwd-new">Nova Senha</label>
                            <input type="password" id="pwd-new" class="form-control" placeholder="Mínimo 4 caracteres" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="align-self: flex-start;">Atualizar Senha</button>
                </form>
            </div>

            <!-- Subscription Panel -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Assinatura Atual</h2>
                </div>
                
                <div style="text-align: center; padding: 1.5rem; background-color: rgba(99, 102, 241, 0.05); border-radius: var(--radius-lg); border: 1px dashed var(--primary); display: flex; flex-direction: column; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--primary);">Plano Único</span>
                    <h3 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary);">${currentPlan.name}</h3>
                    <div style="font-weight: 800; font-size: 1.25rem;">R$ ${currentPlan.price.toFixed(2)}/mês</div>
                    
                    <div class="dropdown-divider" style="margin: 0.75rem 0;"></div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Status de cobrança</span>
                        <strong style="color: var(--success); font-weight: 700;">Ativo</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>Vencimento do plano</span>
                        <strong>${new Date(sub.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-secondary" style="width: 100%; border-color: transparent; color: var(--text-muted); cursor: not-allowed;" disabled>
                        Sem Upgrades Disponíveis (Plano Único)
                    </button>
                    <button class="btn btn-secondary" style="width: 100%; border-color: transparent; color: var(--danger);">
                        Cancelar Assinatura
                    </button>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Password Update Logic
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldPwd = document.getElementById('pwd-old').value;
        const newPwd = document.getElementById('pwd-new').value;

        if (user.senha !== oldPwd) {
            window.app.showToast("Senha atual incorreta.", "error");
            return;
        }

        if (newPwd.length < 4) {
            window.app.showToast("A nova senha deve possuir ao menos 4 caracteres.", "warning");
            return;
        }

        // Update database
        const users = db.get("users");
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].senha = newPwd;
            db.set("users", users);
            user.senha = newPwd; // Update temporary state
            sessionStorage.setItem("precificapro_session", JSON.stringify(user));
            
            window.app.showToast("Senha de acesso atualizada com sucesso!", "success");
            form.reset();
        }
    });
}

function renderClientInventory(container, user) {
    const products = api.getProducts(user.id);
    const settings = api.getMarketplaceSettings();

    // Separate products for Amazon FBA and Mercado Livre Full
    const amazonFbaProducts = products.filter(p => p.marketplace === 'amazon' && p.fulfillment === 'fba');
    const mlFullProducts = products.filter(p => p.marketplace === 'mercado_livre' && p.fulfillment === 'full');

    container.innerHTML = `
        <div class="page-header" style="margin-bottom: 1.5rem;">
            <div>
                <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); margin-bottom: 0.25rem;">Inventário FBA e Full</h1>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Acompanhamento de estoques validados, custo de ativos e faturamento potencial no Amazon FBA e Mercado Livre Full.</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); gap: 2.5rem; align-items: start;">
            <!-- LEFT SIDE: AMAZON FBA -->
            <div class="visual-panel" id="fba-panel">
                <div class="panel-header" style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="marketplace-badge amazon" style="font-size: 0.9rem; padding: 4px 10px; font-weight: 700;">Amazon FBA</span>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Fulfillment by Amazon</span>
                </div>
                
                <!-- Metrics -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <div class="metric-card primary-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Unidades em Estoque</span>
                        <div id="fba-total-units" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">0</div>
                    </div>
                    <div class="metric-card warning-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Custo do Ativo</span>
                        <div id="fba-total-cost" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00</div>
                    </div>
                    <div class="metric-card success-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Faturamento Estimado</span>
                        <div id="fba-total-revenue" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00</div>
                    </div>
                    <div class="metric-card success-accent" style="padding: 0.75rem 1rem;" id="fba-profit-card">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Lucro Líquido / Margem</span>
                        <div id="fba-total-profit" style="font-size: 1.2rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00 (0%)</div>
                    </div>
                </div>

                <!-- Search Bar -->
                <div style="margin-bottom: 1rem;">
                    <input type="text" id="fba-search" class="form-control" placeholder="Buscar SKU ou Produto na Amazon..." style="width: 100%; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                </div>

                <!-- Table -->
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="modern-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr>
                                <th>Produto / SKU</th>
                                <th style="text-align: center;">Qtd</th>
                                <th style="text-align: right;">Custo Unit.</th>
                                <th style="text-align: right;">Preço Unit.</th>
                                <th style="text-align: right;">Val. Estoque</th>
                            </tr>
                        </thead>
                        <tbody id="fba-table-body">
                            <!-- Dynamic rows -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- RIGHT SIDE: MERCADO LIVRE FULL -->
            <div class="visual-panel" id="full-panel">
                <div class="panel-header" style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="marketplace-badge mercado_livre" style="font-size: 0.9rem; padding: 4px 10px; font-weight: 700;">Mercado Livre Full</span>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Fulfillment Mercado Livre</span>
                </div>
                
                <!-- Metrics -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <div class="metric-card primary-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Unidades em Estoque</span>
                        <div id="full-total-units" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">0</div>
                    </div>
                    <div class="metric-card warning-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Custo do Ativo</span>
                        <div id="full-total-cost" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00</div>
                    </div>
                    <div class="metric-card success-accent" style="padding: 0.75rem 1rem;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Faturamento Estimado</span>
                        <div id="full-total-revenue" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00</div>
                    </div>
                    <div class="metric-card success-accent" style="padding: 0.75rem 1rem;" id="full-profit-card">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Lucro Líquido / Margem</span>
                        <div id="full-total-profit" style="font-size: 1.2rem; font-weight: 700; font-family: var(--font-display); margin-top: 0.15rem;">R$ 0,00 (0%)</div>
                    </div>
                </div>

                <!-- Search Bar -->
                <div style="margin-bottom: 1rem;">
                    <input type="text" id="full-search" class="form-control" placeholder="Buscar SKU ou Produto no Mercado Livre..." style="width: 100%; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                </div>

                <!-- Table -->
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="modern-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr>
                                <th>Produto / SKU</th>
                                <th style="text-align: center;">Qtd</th>
                                <th style="text-align: right;">Custo Unit.</th>
                                <th style="text-align: right;">Preço Unit.</th>
                                <th style="text-align: right;">Val. Estoque</th>
                            </tr>
                        </thead>
                        <tbody id="full-table-body">
                            <!-- Dynamic rows -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const updateFbaView = (filterText = '') => {
        const query = filterText.toLowerCase().trim();
        const filtered = amazonFbaProducts.filter(p => p.nome.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
        
        let units = 0;
        let totalCost = 0;
        let totalRevenue = 0;
        let totalProfit = 0;

        const tbody = document.getElementById('fba-table-body');
        tbody.innerHTML = '';

        filtered.forEach(p => {
            const qty = p.estoque || 0;
            const assetCost = p.custo * qty;
            const assetRevenue = p.preco_atual * qty;
            const profitPerUnit = p.preco_atual - p.custo - p.frete - p.taxas;
            const assetProfit = profitPerUnit * qty;

            units += qty;
            totalCost += assetCost;
            totalRevenue += assetRevenue;
            totalProfit += assetProfit;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; color: var(--text-primary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.nome}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku}</span>
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600;">${qty}</td>
                <td style="text-align: right;">R$ ${p.custo.toFixed(2)}</td>
                <td style="text-align: right;">R$ ${p.preco_atual.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 600;">R$ ${assetCost.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum produto em FBA encontrado.</td></tr>`;
        }

        const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        document.getElementById('fba-total-units').textContent = units;
        document.getElementById('fba-total-cost').textContent = `R$ ${totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        document.getElementById('fba-total-revenue').textContent = `R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        
        const profitDiv = document.getElementById('fba-total-profit');
        profitDiv.textContent = `R$ ${totalProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${marginPercent.toFixed(1)}%)`;
        
        const profitCard = document.getElementById('fba-profit-card');
        profitCard.className = 'metric-card';
        if (totalProfit < 0) {
            profitCard.classList.add('danger-accent');
            profitDiv.style.color = 'var(--danger)';
        } else if (marginPercent < 5) {
            profitCard.classList.add('warning-accent');
            profitDiv.style.color = 'var(--warning-hover)';
        } else {
            profitCard.classList.add('success-accent');
            profitDiv.style.color = 'var(--success)';
        }
    };

    const updateFullView = (filterText = '') => {
        const query = filterText.toLowerCase().trim();
        const filtered = mlFullProducts.filter(p => p.nome.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
        
        let units = 0;
        let totalCost = 0;
        let totalRevenue = 0;
        let totalProfit = 0;

        const tbody = document.getElementById('full-table-body');
        tbody.innerHTML = '';

        filtered.forEach(p => {
            const qty = p.estoque || 0;
            const assetCost = p.custo * qty;
            const assetRevenue = p.preco_atual * qty;
            const profitPerUnit = p.preco_atual - p.custo - p.frete - p.taxas;
            const assetProfit = profitPerUnit * qty;

            units += qty;
            totalCost += assetCost;
            totalRevenue += assetRevenue;
            totalProfit += assetProfit;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; color: var(--text-primary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.nome}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku}</span>
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600;">${qty}</td>
                <td style="text-align: right;">R$ ${p.custo.toFixed(2)}</td>
                <td style="text-align: right;">R$ ${p.preco_atual.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 600;">R$ ${assetCost.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum produto em ML Full encontrado.</td></tr>`;
        }

        const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        document.getElementById('full-total-units').textContent = units;
        document.getElementById('full-total-cost').textContent = `R$ ${totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        document.getElementById('full-total-revenue').textContent = `R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        
        const profitDiv = document.getElementById('full-total-profit');
        profitDiv.textContent = `R$ ${totalProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${marginPercent.toFixed(1)}%)`;
        
        const profitCard = document.getElementById('full-profit-card');
        profitCard.className = 'metric-card';
        if (totalProfit < 0) {
            profitCard.classList.add('danger-accent');
            profitDiv.style.color = 'var(--danger)';
        } else if (marginPercent < 5) {
            profitCard.classList.add('warning-accent');
            profitDiv.style.color = 'var(--warning-hover)';
        } else {
            profitCard.classList.add('success-accent');
            profitDiv.style.color = 'var(--success)';
        }
    };

    // Event listeners for independent search filtering
    const fbaSearch = document.getElementById('fba-search');
    const fullSearch = document.getElementById('full-search');

    fbaSearch.addEventListener('input', () => {
        updateFbaView(fbaSearch.value);
    });

    fullSearch.addEventListener('input', () => {
        updateFullView(fullSearch.value);
    });

    // Initial load
    updateFbaView();
    updateFullView();
}
