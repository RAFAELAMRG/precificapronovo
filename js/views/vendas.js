/* --- Vendas (Sales List) View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/vendas', renderVendas);

// ==========================================
// STATE MANAGEMENT & DATA SEEDING
// ==========================================
let salesDatePreset = 'mock_screenshot'; // Default to match screenshot dates
let salesMktFilter = 'all';
let salesFulfillmentFilter = 'all';
let salesExpandedOrders = {
    "o-mock-1": true // Expanded by default to match Screenshot 2
};

const MOCK_SALES = [
    {
        id: "o-mock-1",
        user_id: "u-2",
        pedido_id: "701-729636-130191",
        data: "2025-02-07T16:09:03Z",
        sku: "JO-001",
        nome_produto: "Bola de Futebol",
        marketplace: "amazon",
        preco_venda: 60.00,
        custo: 20.00,
        frete: 14.05, // Taxa FBA
        comissao: 9.00, // Comissão
        imposto: 6.00,
        custo_extra: 0.00,
        status: "entregue",
        fulfillment: "fba",
        asin: "B0B8MKYRDVCC",
        store: "Amazon teste"
    },
    {
        id: "o-mock-2",
        user_id: "u-2",
        pedido_id: "701-729636-130195",
        data: "2025-02-07T16:09:03Z",
        sku: "JO-005",
        nome_produto: "Capacete de Moto",
        marketplace: "amazon",
        preco_venda: 161.00,
        custo: 42.00,
        frete: 22.10, // FBA shipping
        comissao: 16.10, // Comissão
        imposto: 16.10,
        custo_extra: 0.00,
        status: "entregue",
        fulfillment: "fba",
        asin: "B08MKYRDVCC",
        store: "Amazon teste"
    }
];

function seedMockSales() {
    const orders = db.get("orders");
    if (!orders.some(o => o.id === "o-mock-1")) {
        // Push mocks to active orders
        orders.push(...MOCK_SALES);
        db.set("orders", orders);
    }
}

// Run initial seed on load
seedMockSales();

// ==========================================
// RENDER MODULE VIEW
// ==========================================
function renderVendas(container, user) {
    seedMockSales();
    const settings = api.getMarketplaceSettings();

    container.innerHTML = `
        <style>
            /* Custom CSS elements for Sales orders listing */
            .sales-container {
                display: flex;
                gap: 2rem;
                align-items: flex-start;
                flex-wrap: wrap;
                margin-bottom: 2rem;
            }
            .sales-left-column {
                flex: 1 1 320px;
                max-width: 420px;
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
            }
            .sales-right-column {
                flex: 2 2 600px;
                min-width: 320px;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            .sales-order-card {
                background-color: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-sm);
                overflow: hidden;
                transition: all var(--transition-normal);
                margin-bottom: 1.25rem;
            }
            .sales-order-card:hover {
                box-shadow: var(--shadow-md);
                border-color: var(--border-focus);
            }
            .sales-order-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.85rem 1.25rem;
                background-color: rgba(148, 163, 184, 0.02);
                border-bottom: 1px solid var(--border-color);
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            .sales-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
            }
            .sales-status-dot.green { background-color: var(--success); }
            .sales-status-dot.yellow { background-color: var(--warning); }
            .sales-status-dot.red { background-color: var(--danger); }
            
            .sales-fulfillment-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                background-color: var(--primary-light);
                color: var(--primary);
                font-weight: 700;
                font-size: 0.7rem;
                padding: 1px 6px;
                border-radius: var(--radius-sm);
            }
            .sales-fulfillment-badge i {
                width: 10px;
                height: 10px;
            }
            
            /* Order card table details */
            .sales-grid-row {
                display: grid;
                grid-template-columns: 2.2fr 0.5fr 1fr 1fr 1.2fr 1fr 1fr 1fr 1fr 1fr;
                align-items: center;
                padding: 1.25rem;
                gap: 0.5rem;
                font-size: 0.82rem;
                border-bottom: 1px solid var(--border-color);
            }
            .sales-grid-header {
                display: grid;
                grid-template-columns: 2.2fr 0.5fr 1fr 1fr 1.2fr 1fr 1fr 1fr 1fr 1fr;
                padding: 0.65rem 1.25rem;
                background-color: rgba(148, 163, 184, 0.05);
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                color: var(--text-muted);
                letter-spacing: 0.5px;
                border-bottom: 1px solid var(--border-color);
            }
            .sales-grid-col-right {
                text-align: right;
            }
            .sales-grid-col-center {
                text-align: center;
            }
            
            /* Drawer styles */
            .sales-detail-drawer {
                background-color: rgba(148, 163, 184, 0.01);
                border-top: 1px solid var(--border-color);
                padding: 1.25rem;
                display: none;
            }
            .sales-detail-drawer.show {
                display: flex;
                gap: 1.5rem;
                flex-wrap: wrap;
            }
            .sales-detail-card {
                background-color: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: 0.75rem 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                min-width: 140px;
            }
            .sales-detail-card-title {
                font-size: 0.7rem;
                color: var(--text-muted);
                font-weight: 700;
                text-transform: uppercase;
            }
            .sales-detail-card-value {
                font-size: 0.88rem;
                color: var(--text-primary);
                font-weight: 600;
            }
            .sales-receipt-item {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
                padding: 0.3rem 0;
                color: var(--text-secondary);
            }
            .sales-receipt-item.total {
                font-weight: 700;
                color: var(--text-primary);
                border-top: 1px solid var(--border-color);
                padding-top: 0.5rem;
                margin-top: 0.5rem;
            }
            
            /* Expand/Collapse Chevron */
            .sales-toggle-chevron {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0.4rem;
                cursor: pointer;
                background-color: rgba(148, 163, 184, 0.02);
                transition: background-color var(--transition-fast);
            }
            .sales-toggle-chevron:hover {
                background-color: rgba(148, 163, 184, 0.05);
            }
            .sales-toggle-chevron i {
                transition: transform var(--transition-fast);
                color: var(--text-muted);
            }
            .sales-order-card.expanded .sales-toggle-chevron i {
                transform: rotate(180deg);
            }
        </style>

        <div class="sales-container">
            <!-- Left Column: Explanation Text -->
            <div class="sales-left-column">
                <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 0.5rem;">
                    Vendas
                </h2>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; text-align: justify; margin: 0;">
                    Aqui, conseguimos visualizar a listagem de vendas realizadas, com detalhes como o nome do produto, SKU, <em>quantidade vendida</em>, preço unitário, valor líquido recebido do marketplace, impostos, custos do produto, lucro e margem de cada item vendido.
                </p>

                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 1rem; margin-bottom: 0.5rem;">
                    Visão Detalhada
                </h3>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; text-align: justify; margin: 0;">
                    Temos uma visão ainda mais detalhada de um pedido específico, incluindo a data de criação e aprovação, ID do pedido, ASIN e um extrato completo dos valores envolvidos na venda, como comissões, taxas, impostos, custos do produto e o lucro final.
                </p>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                    Em um futuro próximo, saber quem comprou de você poderá proporcionar insights valiosos para otimizar suas estratégias de vendas.
                </p>
            </div>

            <!-- Right Column: Interactive Panel -->
            <div class="sales-right-column">
                
                <!-- Title header with breadcrumb -->
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h1 style="font-size: 1.6rem; font-family: var(--font-display); font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                        <a href="#/dashboard" style="color: var(--text-muted); font-size: 1.2rem; display: flex; align-items: center;"><i data-lucide="chevron-left" style="width: 20px; height: 20px;"></i> Vendas</a>
                    </h1>
                </div>

                <!-- Control and filter bar -->
                <div class="visual-panel" style="padding: 1rem 1.25rem;">
                    <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                        <!-- Left filter toggle -->
                        <button class="btn btn-secondary btn-sm" id="btn-sales-advanced-filters" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; border-radius: var(--radius-md); font-weight: 600;">
                            <i data-lucide="sliders" style="width: 14px; height: 14px;"></i>
                            Filtros Avançados
                        </button>

                        <!-- Central range text -->
                        <span id="sales-date-range-display" style="font-family: monospace; font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">
                            14/01/2025 a 12/02/2025
                        </span>

                        <!-- Right select tools -->
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <select id="sales-date-preset" class="form-control" style="max-width: 130px; padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); height: auto;">
                                <option value="mock_screenshot" ${salesDatePreset === 'mock_screenshot' ? 'selected' : ''}>Janeiro/Fevereiro 2025</option>
                                <option value="this_month" ${salesDatePreset === 'this_month' ? 'selected' : ''}>Este Mês</option>
                                <option value="last_month" ${salesDatePreset === 'last_month' ? 'selected' : ''}>Mês Passado</option>
                                <option value="all" ${salesDatePreset === 'all' ? 'selected' : ''}>Todo o Período</option>
                            </select>
                            
                            <select id="sales-mkt-select" class="form-control" style="max-width: 110px; padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); height: auto;">
                                <option value="all" ${salesMktFilter === 'all' ? 'selected' : ''}>Todas</option>
                                <option value="amazon" ${salesMktFilter === 'amazon' ? 'selected' : ''}>Amazon</option>
                                <option value="mercado_livre" ${salesMktFilter === 'mercado_livre' ? 'selected' : ''}>Mercado Livre</option>
                                <option value="shopee" ${salesMktFilter === 'shopee' ? 'selected' : ''}>Shopee</option>
                            </select>

                            <select id="sales-fulfillment-select" class="form-control" style="max-width: 110px; padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); height: auto;">
                                <option value="all" ${salesFulfillmentFilter === 'all' ? 'selected' : ''}>Todos Envios</option>
                                <option value="fba" ${salesFulfillmentFilter === 'fba' ? 'selected' : ''}>FBA / Full</option>
                                <option value="sem" ${salesFulfillmentFilter === 'sem' ? 'selected' : ''}>Sem Full</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Column headers -->
                <div class="sales-grid-header">
                    <span>Item</span>
                    <span class="sales-grid-col-center">Qtd</span>
                    <span class="sales-grid-col-right">Total</span>
                    <span class="sales-grid-col-right">Preço Unit.</span>
                    <span class="sales-grid-col-right">Líq. Mkt</span>
                    <span class="sales-grid-col-right">Imposto</span>
                    <span class="sales-grid-col-right">Custo Prod.</span>
                    <span class="sales-grid-col-right">Custo Extra</span>
                    <span class="sales-grid-col-right">Lucro</span>
                    <span class="sales-grid-col-center">Margem</span>
                </div>

                <!-- Orders wrapper list -->
                <div id="sales-orders-list-wrapper">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;

    // 3. Execution Engine
    const populateSalesList = () => {
        const orders = db.get("orders");
        const listWrapper = document.getElementById('sales-orders-list-wrapper');
        listWrapper.innerHTML = '';

        // Filter algorithm
        let filteredOrders = orders;
        let startRange = null;
        let endRange = null;

        // Apply Date Preset filter
        if (salesDatePreset === 'mock_screenshot') {
            startRange = new Date("2025-01-14T00:00:00Z");
            endRange = new Date("2025-02-12T23:59:59Z");
        } else if (salesDatePreset === 'this_month') {
            const today = new Date();
            startRange = new Date(today.getFullYear(), today.getMonth(), 1);
            endRange = today;
        } else if (salesDatePreset === 'last_month') {
            const today = new Date();
            startRange = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endRange = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        }

        if (startRange && endRange) {
            filteredOrders = orders.filter(o => {
                const oDate = new Date(o.data);
                return oDate >= startRange && oDate <= endRange;
            });
            document.getElementById('sales-date-range-display').textContent = `${startRange.toLocaleDateString('pt-BR')} a ${endRange.toLocaleDateString('pt-BR')}`;
        } else {
            document.getElementById('sales-date-range-display').textContent = "Todo o período";
        }

        // Apply Marketplace Filter
        if (salesMktFilter !== 'all') {
            filteredOrders = filteredOrders.filter(o => o.marketplace === salesMktFilter);
        }

        // Apply Fulfillment Filter
        if (salesFulfillmentFilter !== 'all') {
            filteredOrders = filteredOrders.filter(o => {
                const isFull = o.fulfillment === 'fba' || o.fulfillment === 'full';
                return salesFulfillmentFilter === 'fba' ? isFull : !isFull;
            });
        }

        // Sort orders chronologically descending
        filteredOrders.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Format helpers
        const formatMoney = (val) => `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        filteredOrders.forEach(o => {
            // Calculations
            const qty = 1; // Default
            const total = o.preco_venda;
            const unitPrice = o.preco_venda;
            
            // Deductions
            const commission = o.comissao || 0;
            const mktFees = (o.frete || 0) + commission + (o.taxa_fixa || 0);
            const netMkt = total - mktFees;
            
            const tax = o.imposto || (total * 0.1); // default 10% tax if not set
            const extraCost = o.custo_extra || 0;
            const productCost = o.custo || 0;
            
            const profit = netMkt - tax - productCost - extraCost;
            const margin = total > 0 ? (profit / total) * 100 : 0;

            // Save updated calculated lucro/margem values to active database object
            // (If different, update it to stay synchronous)
            if (o.lucro !== profit || o.margem !== margin || o.imposto !== tax) {
                o.lucro = profit;
                o.margem = margin;
                o.imposto = tax;
                // Save back to db
                const activeOrders = db.get("orders");
                const targetIdx = activeOrders.findIndex(ao => ao.id === o.id);
                if (targetIdx !== -1) {
                    activeOrders[targetIdx] = o;
                    db.set("orders", activeOrders);
                }
            }

            // Accordion row cards
            const cardId = o.id;
            const isExpanded = salesExpandedOrders[cardId] || false;
            const cardClass = isExpanded ? 'expanded' : '';
            const drawerShowClass = isExpanded ? 'show' : '';
            
            let statusColor = 'green';
            if (o.status === 'cancelado') statusColor = 'red';
            else if (o.status === 'pendente') statusColor = 'yellow';

            const formattedDate = new Date(o.data).toLocaleDateString('pt-BR') + ' ' + new Date(o.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});

            const card = document.createElement('div');
            card.className = `sales-order-card ${cardClass}`;
            card.innerHTML = `
                <!-- Order Card Top Header Line -->
                <div class="sales-order-card-header">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span class="sales-status-dot ${statusColor}"></span>
                        <strong>${formattedDate}</strong>
                        ${o.fulfillment ? `<span class="sales-fulfillment-badge"><i data-lucide="package"></i>${o.fulfillment.toUpperCase()}</span>` : ''}
                    </div>
                    <span style="font-weight: 700; color: var(--text-primary); text-transform: uppercase;">
                        ${o.store || (o.marketplace === 'mercado_livre' ? 'Mercado Livre' : 'Amazon')}
                    </span>
                </div>

                <!-- Main Grid Row -->
                <div class="sales-grid-row">
                    <!-- Product Description -->
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div style="width: 28px; height: 28px; background-color: var(--primary-light); color: var(--primary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink:0;">
                            <i data-lucide="package" style="width: 14px; height: 14px;"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <strong style="color: var(--text-primary);">${o.nome_produto}</strong>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">SKU: ${o.sku}</span>
                        </div>
                    </div>
                    
                    <span class="sales-grid-col-center">${qty}</span>
                    <span class="sales-grid-col-right" style="font-weight: 600;">${formatMoney(total)}</span>
                    <span class="sales-grid-col-right">${formatMoney(unitPrice)}</span>
                    <span class="sales-grid-col-right" style="color: var(--text-primary); font-weight: 500;">${formatMoney(netMkt)}</span>
                    <span class="sales-grid-col-right" style="color: var(--danger); font-family: monospace;">-${formatMoney(tax)}</span>
                    <span class="sales-grid-col-right" style="color: var(--text-secondary);">${formatMoney(productCost)}</span>
                    <span class="sales-grid-col-right" style="color: ${extraCost > 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-family: monospace;">${extraCost > 0 ? `-${formatMoney(extraCost)}` : formatMoney(0)}</span>
                    <span class="sales-grid-col-right" style="font-weight: 700; color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(profit)}</span>
                    
                    <div class="sales-grid-col-center">
                        <span class="badge" style="background-color: ${margin >= 20 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${margin >= 20 ? 'var(--success)' : 'var(--warning-hover)'}; font-weight: 800; font-size: 0.72rem; border-radius: 20px; padding: 2px 8px;">
                            ${margin.toFixed(2)}%
                        </span>
                    </div>
                </div>

                <!-- Collapsible Detailed Drawer -->
                <div class="sales-detail-drawer ${drawerShowClass}">
                    <!-- Left stats cards -->
                    <div style="flex: 1 1 300px; display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; gap: 1rem;">
                            <div class="sales-detail-card" style="flex: 1;">
                                <span class="sales-detail-card-title">Data de criação</span>
                                <span class="sales-detail-card-value">${new Date(o.data).toLocaleDateString('pt-BR')}, ${new Date(o.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="sales-detail-card" style="flex: 1;">
                                <span class="sales-detail-card-title">Data de aprovação</span>
                                <span class="sales-detail-card-value">${new Date(o.data).toLocaleDateString('pt-BR')}, ${new Date(o.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                        
                        <div class="sales-detail-card">
                            <span class="sales-detail-card-title" style="margin-bottom: 0.25rem;">Rastreamento e Identificadores</span>
                            <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.25rem; color: var(--text-secondary);">
                                <div><strong>ID do pedido:</strong> <span style="font-family: monospace;">${o.pedido_id}</span></div>
                                ${o.asin ? `<div><strong>ASIN:</strong> <span style="font-family: monospace;">${o.asin}</span></div>` : `<div><strong>ASIN / MLB:</strong> <span style="font-family: monospace;">${o.id}</span></div>`}
                            </div>
                        </div>
                    </div>

                    <!-- Right Receipt Receipt Breakdown -->
                    <div style="flex: 1 1 250px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem;">
                        <div class="sales-receipt-item">
                            <span>Total dos itens</span>
                            <span style="color: var(--success); font-weight: 600;">+${formatMoney(total)}</span>
                        </div>
                        <div class="sales-receipt-item">
                            <span>Comissão</span>
                            <span style="color: var(--danger); font-weight: 500;">-${formatMoney(commission)}</span>
                        </div>
                        <div class="sales-receipt-item">
                            <span>Taxa FBA / Envio</span>
                            <span style="color: var(--danger); font-weight: 500;">-${formatMoney(o.frete || 0)}</span>
                        </div>
                        <div class="sales-receipt-item">
                            <span>Imposto</span>
                            <span style="color: var(--danger); font-weight: 500;">-${formatMoney(tax)}</span>
                        </div>
                        <div class="sales-receipt-item">
                            <span>Custo dos produtos</span>
                            <span style="color: var(--danger); font-weight: 500;">-${formatMoney(productCost)}</span>
                        </div>
                        ${extraCost > 0 ? `
                            <div class="sales-receipt-item">
                                <span>Custo eventual</span>
                                <span style="color: var(--danger); font-weight: 500;">-${formatMoney(extraCost)}</span>
                            </div>
                        ` : ''}

                        <!-- Eventual cost addition link -->
                        <div style="text-align: right; margin: 0.5rem 0 0.25rem;">
                            <a href="javascript:void(0)" class="btn-add-eventual-cost-trigger" style="color: var(--primary); font-weight: 700; font-size: 0.75rem; text-decoration: underline; display: inline-flex; align-items: center; gap: 0.25rem;">
                                <i data-lucide="plus-circle" style="width: 12px; height: 12px;"></i>
                                + Adicionar custo eventual
                            </a>
                        </div>

                        <!-- Lucro do Pedido Card Block -->
                        <div style="background-color: var(--success-light); color: var(--success-hover); border-radius: var(--radius-sm); padding: 0.6rem 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 700; font-size: 0.8rem;">
                                <i data-lucide="check-circle" style="width: 16px; height: 16px; color: var(--success);"></i>
                                Lucro do pedido
                            </div>
                            <strong style="font-size: 0.95rem;">${formatMoney(profit)}</strong>
                        </div>
                    </div>
                </div>

                <!-- Bottom Chevron Collapse toggle trigger -->
                <div class="sales-toggle-chevron">
                    <i data-lucide="chevron-down" style="width: 18px; height: 18px;"></i>
                </div>
            `;

            // Expand/Collapse drawer binder
            const toggleDrawer = () => {
                const isOpen = !salesExpandedOrders[cardId];
                salesExpandedOrders[cardId] = isOpen;
                card.classList.toggle('expanded', isOpen);
                card.querySelector('.sales-detail-drawer').classList.toggle('show', isOpen);
            };

            card.querySelector('.sales-toggle-chevron').addEventListener('click', toggleDrawer);

            // Cost eventual addition modal trigger binder
            card.querySelector('.btn-add-eventual-cost-trigger').addEventListener('click', (e) => {
                e.stopPropagation(); // Stop chevron click trigger
                
                const bodyHtml = `
                    <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <p>Adicione um custo eventual (ex: embalagem extra, devolução logística local, brinde ou seguro) para o pedido <strong>${o.pedido_id}</strong>.</p>
                        <p>Este valor será subtraído do lucro bruto e da margem de rentabilidade calculada para esta transação específica.</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valor do Custo Eventual (R$)</label>
                        <input type="number" id="eventual-cost-value" class="form-control" placeholder="0.00" step="0.01" min="0" value="${o.custo_extra || ''}">
                    </div>
                `;
                const footerHtml = `
                    <button class="btn btn-secondary btn-sm" id="modal-cost-cancel">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="modal-cost-save">Salvar Custo</button>
                `;

                const closeModal = window.app.showModal("Adicionar Custo Eventual", bodyHtml, footerHtml);

                document.getElementById('modal-cost-cancel').addEventListener('click', closeModal);
                document.getElementById('modal-cost-save').addEventListener('click', () => {
                    const extraVal = parseFloat(document.getElementById('eventual-cost-value').value) || 0;
                    if (extraVal < 0) {
                        window.app.showToast("Por favor, digite um valor maior ou igual a zero.", "error");
                        return;
                    }

                    // Update order in database
                    const activeOrdersList = db.get("orders");
                    const index = activeOrdersList.findIndex(ao => ao.id === o.id);
                    if (index !== -1) {
                        activeOrdersList[index].custo_extra = extraVal;
                        db.set("orders", activeOrdersList);
                    }

                    window.app.showToast("Custo eventual atualizado com sucesso!", "success");
                    closeModal();
                    populateSalesList();
                });
            });

            listWrapper.appendChild(card);
        });

        if (filteredOrders.length === 0) {
            listWrapper.innerHTML = `
                <div class="visual-panel" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 1.5rem;"></i>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem;">Nenhuma venda encontrada</h3>
                    <p style="font-size: 0.85rem;">Tente ajustar as datas ou filtros para encontrar os registros.</p>
                </div>
            `;
        }

        lucide.createIcons();
    };

    // 4. Bind Interactive Events
    const advancedFiltersBtn = document.getElementById('btn-sales-advanced-filters');
    const datePresetSelect = document.getElementById('sales-date-preset');
    const mktFilterSelect = document.getElementById('sales-mkt-select');
    const fulfillmentFilterSelect = document.getElementById('sales-fulfillment-select');

    advancedFiltersBtn.addEventListener('click', () => {
        window.app.showToast("Carregando filtros avançados...", "info", 1500);
    });

    datePresetSelect.addEventListener('change', () => {
        salesDatePreset = datePresetSelect.value;
        populateSalesList();
    });

    mktFilterSelect.addEventListener('change', () => {
        salesMktFilter = mktFilterSelect.value;
        populateSalesList();
    });

    fulfillmentFilterSelect.addEventListener('change', () => {
        salesFulfillmentFilter = fulfillmentFilterSelect.value;
        populateSalesList();
    });

    // Run first populate on load
    populateSalesList();
}
