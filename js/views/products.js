/* --- Products and Pricing Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { PLANS, db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/produtos', renderProductsCatalog);
router.on('#/precificacao', renderStandaloneCalculator);

// Module level state to persist active products sub-tab
let activeProductTab = 'catalog';

// ==========================================
// VIEW RENDERERS: PRODUCT CATALOG & CURVA ABC
// ==========================================

function renderProductsCatalog(container, user) {
    const products = api.getProducts(user.id);
    const settings = api.getMarketplaceSettings();
    
    // Limits
    const subs = db.get("subscriptions");
    const sub = subs.find(s => s.user_id === user.id) || { plano: "bronze" };
    const currentPlan = PLANS[sub.plano];

    // Build Curva ABC Calculation
    const sorted = [...products].map(p => {
        const monthlySales = 15; // Simulated monthly sales frequency per item
        const revenue = p.preco_atual * monthlySales;
        const profit = (p.preco_atual - (p.custo + p.frete + p.taxas)) * monthlySales;
        return { ...p, revenue, profit };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRev = sorted.reduce((sum, p) => sum + p.revenue, 0);
    let cumulative = 0;
    
    const abcProducts = sorted.map(p => {
        cumulative += p.revenue;
        const pct = totalRev > 0 ? (cumulative / totalRev) * 100 : 0;
        let classification = 'C';
        
        // standard Curva ABC thresholds: Class A: top 70%, Class B: next 20%, Class C: remaining 10%
        if (pct <= 72) classification = 'A';
        else if (pct <= 92) classification = 'B';
        
        return { ...p, pct, classification };
    });

    container.innerHTML = `
        <!-- Sub-Nav Tab headers -->
        <div style="display: flex; gap: 1.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem;">
            <button class="tab-toggle-btn ${activeProductTab === 'catalog' ? 'active' : ''}" id="p-tab-btn-catalog" style="padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; border-bottom: 3px solid ${activeProductTab === 'catalog' ? 'var(--primary)' : 'transparent'}; color: ${activeProductTab === 'catalog' ? 'var(--primary)' : 'var(--text-secondary)'}; transition: all var(--transition-fast);">
                Catálogo de SKUs
            </button>
            <button class="tab-toggle-btn ${activeProductTab === 'abc' ? 'active' : ''}" id="p-tab-btn-abc" style="padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; border-bottom: 3px solid ${activeProductTab === 'abc' ? 'var(--primary)' : 'transparent'}; color: ${activeProductTab === 'abc' ? 'var(--primary)' : 'var(--text-secondary)'}; transition: all var(--transition-fast);">
                Curva ABC (Análise de Estoque)
            </button>
        </div>

        <!-- TAB 1: SKU CATALOG -->
        <div id="p-tab-content-catalog" class="${activeProductTab === 'catalog' ? '' : 'hidden'}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; gap: 0.75rem; flex-grow: 1; max-width: 500px;">
                    <input type="text" id="catalog-search" class="form-control" placeholder="Buscar por Nome ou SKU..." style="max-width: 300px;">
                    <select id="catalog-filter-mkt" class="form-control" style="max-width: 200px;">
                        <option value="">Todos os Marketplaces</option>
                        ${Object.values(settings).map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">
                        Limite do Plano: <strong>${products.length}/${currentPlan.maxProducts}</strong> produtos
                    </span>
                    <button class="btn btn-primary" id="add-product-btn">
                        <i data-lucide="plus"></i> Cadastrar Produto
                    </button>
                </div>
            </div>

            <div class="table-panel">
                <div class="table-responsive">
                    <table class="modern-table" id="products-table">
                        <thead>
                            <tr>
                                <th>Produto / SKU</th>
                                <th>Canal</th>
                                <th>Custo Compra</th>
                                <th>Frete Envio</th>
                                <th>Comissão Canal</th>
                                <th>Preço Venda</th>
                                <th>Margem Líquida</th>
                                <th style="text-align: right;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="products-table-body">
                            <!-- Loaded dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB 2: CURVA ABC ANALYSIS -->
        <div id="p-tab-content-abc" class="${activeProductTab === 'abc' ? '' : 'hidden'}">
            <div class="metrics-grid">
                <div class="metric-card success-accent" style="padding: 1.25rem;">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Classe A (Faturamento Alto)</span>
                        <span class="badge status-lucro">70% do Fluxo</span>
                    </div>
                    <div class="metric-card-value" style="font-size: 1.6rem; margin-top: 0.25rem;">
                        ${abcProducts.filter(p => p.classification === 'A').length} Produtos
                    </div>
                    <span class="metric-label" style="font-size: 0.75rem;">Itens mais valiosos da sua operação. Evite ruptura de estoque!</span>
                </div>

                <div class="metric-card primary-accent" style="padding: 1.25rem;">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Classe B (Faturamento Médio)</span>
                        <span class="badge" style="background-color: var(--primary-light); color: var(--primary);">20% do Fluxo</span>
                    </div>
                    <div class="metric-card-value" style="font-size: 1.6rem; margin-top: 0.25rem;">
                        ${abcProducts.filter(p => p.classification === 'B').length} Produtos
                    </div>
                    <span class="metric-label" style="font-size: 0.75rem;">Itens intermediários com boa recorrência de vendas.</span>
                </div>

                <div class="metric-card" style="padding: 1.25rem;">
                    <div class="metric-card-header">
                        <span class="metric-card-title">Classe C (Faturamento Baixo)</span>
                        <span class="badge" style="background-color: var(--border-color); color: var(--text-secondary);">10% do Fluxo</span>
                    </div>
                    <div class="metric-card-value" style="font-size: 1.6rem; margin-top: 0.25rem;">
                        ${abcProducts.filter(p => p.classification === 'C').length} Produtos
                    </div>
                    <span class="metric-label" style="font-size: 0.75rem;">Itens com baixa saída ou ticket baixo. Otimizar margens.</span>
                </div>
            </div>

            <div class="table-panel">
                <div class="panel-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                    <h2 class="panel-title">Distribuição de Lucratividade (Matriz ABC)</h2>
                </div>
                <div class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Classificação</th>
                                <th>Produto / SKU</th>
                                <th>Faturamento Mensal Est.</th>
                                <th>Acumulado (R$)</th>
                                <th>Acumulado (%)</th>
                                <th>Lucro Mensal Est.</th>
                                <th>Status Canal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${abcProducts.length === 0 
                                ? `<tr><td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--text-muted);">Adicione produtos para gerar a classificação ABC.</td></tr>`
                                : abcProducts.map((p, idx) => {
                                    let badgeColor = 'status-lucro';
                                    if (p.classification === 'B') badgeColor = 'status-pending';
                                    if (p.classification === 'C') badgeColor = 'status-blocked';
                                    
                                    // calculate running cumulative sum
                                    let runningSum = abcProducts.slice(0, idx + 1).reduce((sum, item) => sum + item.revenue, 0);

                                    return `
                                        <tr>
                                            <td><span class="badge ${badgeColor}" style="font-weight: 800; font-size: 0.85rem; padding: 2px 10px;">Classe ${p.classification}</span></td>
                                            <td>
                                                <div style="display: flex; flex-direction: column;">
                                                    <strong style="color: var(--text-primary);">${p.nome}</strong>
                                                    <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku}</span>
                                                </div>
                                            </td>
                                            <td>R$ ${p.revenue.toFixed(2)}</td>
                                            <td>R$ ${runningSum.toFixed(2)}</td>
                                            <td><strong>${p.pct.toFixed(1)}%</strong></td>
                                            <td style="color: ${p.profit > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                                R$ ${p.profit.toFixed(2)}
                                            </td>
                                            <td><span class="marketplace-badge ${p.marketplace}">${settings[p.marketplace]?.name || p.marketplace}</span></td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // ==========================================
    // TAB TRIGGER SWITCH LISTENERS
    // ==========================================
    const tabCatalogBtn = document.getElementById('p-tab-btn-catalog');
    const tabAbcBtn = document.getElementById('p-tab-btn-abc');
    const tabCatalogContent = document.getElementById('p-tab-content-catalog');
    const tabAbcContent = document.getElementById('p-tab-content-abc');

    const switchProductTab = (target) => {
        activeProductTab = target;
        if (target === 'catalog') {
            tabCatalogBtn.style.borderBottom = '3px solid var(--primary)';
            tabCatalogBtn.style.color = 'var(--primary)';
            tabAbcBtn.style.borderBottom = '3px solid transparent';
            tabAbcBtn.style.color = 'var(--text-secondary)';
            
            tabCatalogContent.classList.remove('hidden');
            tabAbcContent.classList.add('hidden');
        } else {
            tabAbcBtn.style.borderBottom = '3px solid var(--primary)';
            tabAbcBtn.style.color = 'var(--primary)';
            tabCatalogBtn.style.borderBottom = '3px solid transparent';
            tabCatalogBtn.style.color = 'var(--text-secondary)';
            
            tabAbcContent.classList.remove('hidden');
            tabCatalogContent.classList.add('hidden');
        }
    };

    tabCatalogBtn.addEventListener('click', () => switchProductTab('catalog'));
    tabAbcBtn.addEventListener('click', () => router.navigate('#/curva-abc'));

    // ==========================================
    // RENDER SKU CATALOG LISTING ROWS
    // ==========================================
    const renderTableRows = (filterSearch = '', filterMkt = '') => {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let filtered = products;
        
        if (filterSearch) {
            const q = filterSearch.toLowerCase();
            filtered = filtered.filter(p => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        
        if (filterMkt) {
            filtered = filtered.filter(p => p.marketplace === filterMkt);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
                        Nenhum produto encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'status-lucro';
            if (p.margem < 0) {
                badgeClass = 'status-prejuizo';
            } else if (p.margem < 5) {
                badgeClass = 'status-pending';
            }

            const cloudIcon = p.imported 
                ? ` <i data-lucide="cloud" style="width: 12px; height: 12px; vertical-align: middle; color: var(--primary); margin-left: 4px;" title="Sincronizado via API"></i>` 
                : '';

            const correctBtn = (p.imported && p.margem < 0)
                ? `<button class="btn btn-primary btn-sm btn-correct-price" data-id="${p.id}" style="background-color: var(--success); color: white; padding: 0.25rem 0.5rem; font-size: 0.75rem;">Corrigir Preço</button>`
                : '';

            tr.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: var(--text-primary); font-weight: 600;">${p.nome}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku}${cloudIcon}</span>
                    </div>
                </td>
                <td><span class="marketplace-badge ${p.marketplace}">${settings[p.marketplace]?.name || p.marketplace}</span></td>
                <td>R$ ${p.custo.toFixed(2)}</td>
                <td>R$ ${p.frete.toFixed(2)}</td>
                <td>R$ ${p.taxas.toFixed(2)}</td>
                <td><strong>R$ ${p.preco_atual.toFixed(2)}</strong></td>
                <td><span class="badge ${badgeClass}">${p.margem.toFixed(1)}%</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                        ${correctBtn}
                        <button class="btn-icon-only btn-edit" data-id="${p.id}" title="Editar Produto">
                            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn-icon-only danger btn-delete" data-id="${p.id}" title="Excluir Produto">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        lucide.createIcons();

        // Bind Correct Price API simulations
        tbody.querySelectorAll('.btn-correct-price').forEach(btn => {
            btn.addEventListener('click', () => {
                const prodId = btn.getAttribute('data-id');
                const prod = api.getProduct(prodId);
                if (prod) {
                    const mktName = settings[prod.marketplace]?.name || prod.marketplace;
                    const suggestedPrice = api.suggestPriceForDesiredMargin(prod.custo, prod.frete, 15, prod.marketplace);

                    const bodyHtml = `
                        <div style="text-align: center; display: flex; flex-direction: column; gap: 1rem;">
                            <div class="logo-container" style="justify-content: center;">
                                <span class="marketplace-badge ${prod.marketplace}" style="font-size: 1rem; padding: 6px 12px;">${mktName}</span>
                            </div>
                            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                                O anúncio '${prod.nome}' (SKU: ${prod.sku}) está listado no ${mktName} por <strong>R$ ${prod.preco_atual.toFixed(2)}</strong>, gerando prejuízo devido à margem negativa de <strong>${prod.margem}%</strong>.
                            </p>
                            <div style="background-color: var(--primary-light); padding: 1rem; border-radius: var(--radius-md); border: 1px dashed var(--primary); text-align: left; font-size: 0.85rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>Preço Atual no Canal:</span>
                                    <strong>R$ ${prod.preco_atual.toFixed(2)}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: var(--success); font-weight: 700;">
                                    <span>Preço Sugerido (15% margem):</span>
                                    <strong>R$ ${parseFloat(suggestedPrice).toFixed(2)}</strong>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
                                    Preço calculado considerando comissão de ${settings[prod.marketplace]?.percentFee}% + R$ ${settings[prod.marketplace]?.flatFee} de taxa fixa.
                                </div>
                            </div>
                        </div>
                    `;
                    const footerHtml = `
                        <button class="btn btn-secondary btn-sm" id="corr-cancel-btn">Cancelar</button>
                        <button class="btn btn-primary btn-sm" id="corr-submit-btn" style="background-color: var(--success); color: white;">Confirmar & Sincronizar Preço</button>
                    `;

                    const close = window.app.showModal("Corrigir Preço no Marketplace", bodyHtml, footerHtml);

                    document.getElementById('corr-cancel-btn').addEventListener('click', close);
                    document.getElementById('corr-submit-btn').addEventListener('click', () => {
                        const modalBody = document.querySelector('.modal-body');
                        modalBody.innerHTML = `
                            <div style="text-align: center; padding: 2rem 0;">
                                <div class="logo-icon" style="margin: 0 auto 1.5rem; animation: spin 1.2s linear infinite; width: 42px; height: 42px;">
                                    <i data-lucide="refresh-cw"></i>
                                </div>
                                <strong>Enviando novo preço para o ${mktName}...</strong>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">Executando chamada API PUT /items/${prod.sku}...</p>
                            </div>
                        `;
                        document.querySelector('.modal-footer').classList.add('hidden');
                        lucide.createIcons();

                        setTimeout(() => {
                            api.syncPriceCorrection(prod.id, suggestedPrice);
                            window.app.showToast("Preço do anúncio sincronizado com sucesso no marketplace!", "success");
                            close();
                            renderProductsCatalog(container, user); // re-render
                        }, 1600);
                    });
                }
            });
        });

        // Bind Edit
        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const prodId = btn.getAttribute('data-id');
                const prod = api.getProduct(prodId);
                if (prod) openProductModal(user, prod, () => {
                    renderProductsCatalog(container, user); // Refresh on save
                });
            });
        });

        // Bind Delete
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const prodId = btn.getAttribute('data-id');
                const prod = api.getProduct(prodId);
                if (confirm(`Deseja excluir definitivamente o produto '${prod.nome}'?`)) {
                    const res = api.deleteProduct(prodId);
                    if (res.success) {
                        window.app.showToast("Produto excluído com sucesso.", "success");
                        renderProductsCatalog(container, user); // re-render catalog
                    } else {
                        window.app.showToast(res.message, "error");
                    }
                }
            });
        });
    };

    // Initial render call
    renderTableRows();

    // Catalog filters listeners
    const searchInput = document.getElementById('catalog-search');
    const filterMktSelect = document.getElementById('catalog-filter-mkt');
    
    if (searchInput && filterMktSelect) {
        searchInput.addEventListener('input', () => {
            renderTableRows(searchInput.value, filterMktSelect.value);
        });

        filterMktSelect.addEventListener('change', () => {
            renderTableRows(searchInput.value, filterMktSelect.value);
        });
    }

    // Add Product button trigger
    const addProdBtn = document.getElementById('add-product-btn');
    if (addProdBtn) {
        addProdBtn.addEventListener('click', () => {
            openProductModal(user, null, () => {
                renderProductsCatalog(container, user);
            });
        });
    }
}

// ==========================================
// DIALOG MODAL FOR PRODUCT EDIT & CREATE (WITH INLINE CALCULATOR!)
function openProductModal(user, product = null, onSaveSuccess) {
    const isEdit = !!product;
    const title = isEdit ? `Configurar SKU — ${product.sku}` : "Precificação de SKU Multicanal";
    const settings = api.getMarketplaceSettings();
    
    // Fetch all listings for this SKU to load current configurations
    const allProducts = api.getProducts(user.id);
    const skuProducts = isEdit ? allProducts.filter(p => p.sku === product.sku) : [];
    
    // Cost of purchase is unified for a SKU. Load from existing or leave empty
    const costValue = isEdit ? (skuProducts[0]?.custo || product.custo) : '';
    const nameValue = isEdit ? (skuProducts[0]?.nome || product.nome) : '';
    const skuValue = isEdit ? (skuProducts[0]?.sku || product.sku) : '';

    const bodyHtml = `
        <form class="auth-form" id="modal-product-form" style="gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
                <label class="form-label" for="prod-name">Nome do Produto</label>
                <input type="text" id="prod-name" class="form-control" placeholder="Ex: Headset Gamer HyperX" value="${nameValue}" required>
            </div>

            <div class="form-row" style="margin-bottom: 0.5rem;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="prod-sku">SKU (Código Único)</label>
                    <input type="text" id="prod-sku" class="form-control" placeholder="Ex: HD-RGB-02" value="${skuValue}" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="prod-cost">Custo de Aquisição Unitário (R$)</label>
                    <input type="number" step="0.01" min="0.01" id="prod-cost" class="form-control" placeholder="Custo do fornecedor (R$)" value="${costValue}" required>
                </div>
            </div>

            <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <label class="form-label" style="font-weight: 700; margin-bottom: 0.75rem; display: block; color: var(--text-primary);">Precificação e Custos por Canal de Venda</label>
                
                <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 0.25rem;">
                    ${Object.values(settings).map(m => {
                        const listing = skuProducts.find(p => p.marketplace === m.id);
                        const enabled = isEdit ? !!listing : (m.id === 'mercado_livre' || m.id === 'shopee');
                        const preco = listing ? listing.preco_atual : '';
                        const frete = listing ? listing.frete : '';
                        const estoque = listing ? (listing.estoque || 0) : 0;
                        const fulfillment = listing ? (listing.fulfillment || 'sem') : 'sem';
                        
                        let fulfillmentSelect = '';
                        if (m.id === 'mercado_livre') {
                            fulfillmentSelect = `
                                <select class="form-control chan-fulfillment" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;">
                                    <option value="sem" ${fulfillment === 'sem' ? 'selected' : ''}>Sem Full</option>
                                    <option value="full" ${fulfillment === 'full' ? 'selected' : ''}>ML Full</option>
                                </select>
                            `;
                        } else if (m.id === 'amazon') {
                            fulfillmentSelect = `
                                <select class="form-control chan-fulfillment" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;">
                                    <option value="sem" ${fulfillment === 'sem' ? 'selected' : ''}>Sem FBA</option>
                                    <option value="fba" ${fulfillment === 'fba' ? 'selected' : ''}>Amazon FBA</option>
                                </select>
                            `;
                        } else {
                            fulfillmentSelect = `
                                <span style="font-size: 0.75rem; color: var(--text-muted);">Normal</span>
                                <input type="hidden" class="chan-fulfillment" value="sem">
                            `;
                        }
                        
                        return `
                            <div class="channel-pricing-row" data-mkt="${m.id}" style="display: grid; grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr; gap: 0.5rem; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-page); transition: all var(--transition-fast);">
                                <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">
                                    <input type="checkbox" class="chan-enable" ${enabled ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary);">
                                    <span>${m.name}</span>
                                </label>
                                
                                <div class="form-group" style="margin: 0;">
                                    <input type="number" step="0.01" min="0.01" class="form-control chan-price" placeholder="Preço" value="${preco}" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" required>
                                </div>
                                
                                <div class="form-group" style="margin: 0;">
                                    <input type="number" step="0.01" min="0" class="form-control chan-shipping" placeholder="Frete" value="${frete}" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" required>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <input type="number" min="0" step="1" class="form-control chan-estoque" placeholder="Qtd" value="${estoque}" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" required>
                                </div>
                                
                                <div class="form-group" style="margin: 0; display: flex; align-items: center; justify-content: center;">
                                    ${fulfillmentSelect}
                                </div>
                                
                                <div style="text-align: right; display: flex; flex-direction: column; gap: 0.25rem;">
                                    <span class="badge chan-margin-badge" style="font-size: 0.8rem; font-weight: 700; padding: 3px 8px; min-width: 60px; text-align: center; display: inline-block;">0.0%</span>
                                    <span class="chan-fee-text" style="font-size: 0.7rem; color: var(--text-muted);">Taxa: R$ 0.00</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </form>
    `;

    const footerHtml = `
        <button class="btn btn-secondary btn-sm" id="modal-cancel-btn">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="modal-save-btn">Salvar Alterações</button>
    `;

    const close = window.app.showModal(title, bodyHtml, footerHtml, 'modal-lg');

    const form = document.getElementById('modal-product-form');
    const costInput = document.getElementById('prod-cost');

    const updatePreviewCalculations = () => {
        const cost = parseFloat(costInput.value) || 0;
        const rows = document.querySelectorAll('.channel-pricing-row');
        
        rows.forEach(row => {
            const mkt = row.getAttribute('data-mkt');
            const checkbox = row.querySelector('.chan-enable');
            const priceInput = row.querySelector('.chan-price');
            const shippingInput = row.querySelector('.chan-shipping');
            const estoqueInput = row.querySelector('.chan-estoque');
            const fulfillmentSelect = row.querySelector('.chan-fulfillment');
            const feeText = row.querySelector('.chan-fee-text');
            const marginBadge = row.querySelector('.chan-margin-badge');
            
            if (checkbox.checked) {
                priceInput.disabled = false;
                shippingInput.disabled = false;
                estoqueInput.disabled = false;
                if (fulfillmentSelect) fulfillmentSelect.disabled = false;
                priceInput.required = true;
                shippingInput.required = true;
                estoqueInput.required = true;
                
                const price = parseFloat(priceInput.value) || 0;
                const shipping = parseFloat(shippingInput.value) || 0;
                
                const res = api.calculateMargin(cost, shipping, price, mkt);
                
                feeText.textContent = `Taxa: R$ ${parseFloat(res.fees).toFixed(2)}`;
                marginBadge.textContent = `${res.margin}%`;
                
                marginBadge.className = 'badge';
                marginBadge.style.backgroundColor = '';
                marginBadge.style.color = '';
                
                if (parseFloat(res.margin) < 0) {
                    marginBadge.classList.add('status-prejuizo');
                } else if (parseFloat(res.margin) < 5) {
                    marginBadge.classList.add('status-pending');
                } else {
                    marginBadge.classList.add('status-lucro');
                }
                
                row.style.backgroundColor = 'rgba(99, 102, 241, 0.03)';
                row.style.borderColor = 'var(--primary-light)';
            } else {
                priceInput.disabled = true;
                shippingInput.disabled = true;
                estoqueInput.disabled = true;
                if (fulfillmentSelect) fulfillmentSelect.disabled = true;
                priceInput.required = false;
                shippingInput.required = false;
                estoqueInput.required = false;
                
                priceInput.value = '';
                shippingInput.value = '';
                estoqueInput.value = '0';
                feeText.textContent = 'Taxa: R$ 0.00';
                marginBadge.textContent = 'Inativo';
                
                marginBadge.className = 'badge';
                marginBadge.style.backgroundColor = 'var(--border-color)';
                marginBadge.style.color = 'var(--text-muted)';
                
                row.style.backgroundColor = 'var(--bg-page)';
                row.style.borderColor = 'var(--border-color)';
            }
        });
    };

    // Listeners setup
    costInput.addEventListener('input', updatePreviewCalculations);
    
    document.querySelectorAll('.channel-pricing-row').forEach(row => {
        const checkbox = row.querySelector('.chan-enable');
        const priceInput = row.querySelector('.chan-price');
        const shippingInput = row.querySelector('.chan-shipping');
        const estoqueInput = row.querySelector('.chan-estoque');
        const fulfillmentSelect = row.querySelector('.chan-fulfillment');
        
        checkbox.addEventListener('change', updatePreviewCalculations);
        priceInput.addEventListener('input', updatePreviewCalculations);
        shippingInput.addEventListener('input', updatePreviewCalculations);
        estoqueInput.addEventListener('input', updatePreviewCalculations);
        if (fulfillmentSelect && fulfillmentSelect.tagName === 'SELECT') {
            fulfillmentSelect.addEventListener('change', updatePreviewCalculations);
        }
    });

    updatePreviewCalculations();

    document.getElementById('modal-cancel-btn').addEventListener('click', close);
    
    document.getElementById('modal-save-btn').addEventListener('click', () => {
        if (!form.reportValidity()) return;

        const channelsPayload = [];
        let anyChannelEnabled = false;
        
        document.querySelectorAll('.channel-pricing-row').forEach(row => {
            const mkt = row.getAttribute('data-mkt');
            const enabled = row.querySelector('.chan-enable').checked;
            const priceVal = parseFloat(row.querySelector('.chan-price').value) || 0;
            const shippingVal = parseFloat(row.querySelector('.chan-shipping').value) || 0;
            const estoqueVal = parseInt(row.querySelector('.chan-estoque').value) || 0;
            const fulfillmentVal = row.querySelector('.chan-fulfillment').value || 'sem';
            
            channelsPayload.push({
                marketplace: mkt,
                enabled: enabled,
                preco: priceVal,
                frete: shippingVal,
                estoque: estoqueVal,
                fulfillment: fulfillmentVal
            });
            
            if (enabled) anyChannelEnabled = true;
        });

        if (!anyChannelEnabled) {
            window.app.showToast("Selecione ao menos um canal de venda para precificar este SKU.", "warning");
            return;
        }

        const payload = {
            oldSku: isEdit ? skuValue : null,
            nome: document.getElementById('prod-name').value,
            sku: document.getElementById('prod-sku').value,
            custo: parseFloat(costInput.value) || 0,
            canais: channelsPayload
        };

        const result = api.saveMultiChannelProduct(payload);
        if (result.success) {
            window.app.showToast(isEdit ? "Canais de precificação atualizados!" : "SKU precificado nos canais selecionados!", "success");
            close();
            if (onSaveSuccess) onSaveSuccess();
        } else {
            window.app.showToast(result.message, "error");
        }
    });
}

// ==========================================
// VIEW RENDERER: STANDALONE PRICING CALCULATOR
// ==========================================
function renderStandaloneCalculator(container) {
    const settings = api.getMarketplaceSettings();

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: start;">
            <!-- Calculator input card -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Calculadora de Custos e Margens</h2>
                </div>
                <div class="auth-form" style="gap: 1.25rem;">
                    <div class="form-group">
                        <label class="form-label" for="calc-mkt">Selecione o Canal de Venda (Marketplace)</label>
                        <select id="calc-mkt" class="form-control">
                            ${Object.values(settings).map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="calc-cost">Custo do Produto (R$)</label>
                            <input type="number" step="0.01" min="0" id="calc-cost" class="form-control" placeholder="100.00" value="100.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="calc-shipping">Custo de Frete Envio (R$)</label>
                            <input type="number" step="0.01" min="0" id="calc-shipping" class="form-control" placeholder="20.00" value="20.00">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="calc-price">Preço Proposto de Venda (R$)</label>
                            <input type="number" step="0.01" min="0" id="calc-price" class="form-control" placeholder="200.00" value="180.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="calc-target-margin">Margem Desejada (%)</label>
                            <input type="number" step="0.5" id="calc-target-margin" class="form-control" placeholder="20" value="20">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dynamic Results Card Panel (Premium View) -->
            <div class="visual-panel primary-accent" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="panel-header">
                    <h2 class="panel-title">Demonstrativo Financeiro</h2>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 1.25rem; margin: 1.5rem 0;">
                    <!-- Commission fee description -->
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">Taxa + Comissão Canal:</span>
                        <strong style="font-family: var(--font-display); font-size: 1.05rem;" id="calc-res-fees">R$ 0.00</strong>
                    </div>

                    <!-- Net profit -->
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">Lucro Líquido Real:</span>
                        <strong style="font-family: var(--font-display); font-size: 1.05rem;" id="calc-res-profit">R$ 0.00</strong>
                    </div>

                    <!-- Resulting Margin -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">Margem Líquida Resultante:</span>
                        <span class="badge" id="calc-res-margin" style="font-size: 0.85rem; padding: 4px 10px;">0.0%</span>
                    </div>

                    <!-- Suggested price target -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">Preço Sugerido para Margem Alvo:</span>
                        <strong style="font-family: var(--font-display); font-size: 1.15rem; color: var(--primary);" id="calc-res-suggested">R$ 0.00</strong>
                    </div>
                </div>

                <!-- Action helper message -->
                <div style="padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; background-color: var(--primary-light); color: var(--primary); font-weight: 500; text-align: center;" id="calc-verdict">
                    A margem está saudável! Bom preço de venda.
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Interactive updates logic
    const costInput = document.getElementById('calc-cost');
    const shippingInput = document.getElementById('calc-shipping');
    const priceInput = document.getElementById('calc-price');
    const marginTargetInput = document.getElementById('calc-target-margin');
    const mktSelect = document.getElementById('calc-mkt');

    const updateCalculatorScreen = () => {
        const cost = parseFloat(costInput.value) || 0;
        const shipping = parseFloat(shippingInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const targetMargin = parseFloat(marginTargetInput.value) || 0;
        const mkt = mktSelect.value;

        // Perform calculation
        const res = api.calculateMargin(cost, shipping, price, mkt);
        const suggested = api.suggestPriceForDesiredMargin(cost, shipping, targetMargin, mkt);

        // Update elements
        document.getElementById('calc-res-fees').textContent = `R$ ${parseFloat(res.fees).toFixed(2)}`;
        document.getElementById('calc-res-profit').textContent = `R$ ${parseFloat(res.profit).toFixed(2)}`;
        
        const marginBadge = document.getElementById('calc-res-margin');
        marginBadge.textContent = `${res.margin}%`;

        marginBadge.className = 'badge';
        const verdictEl = document.getElementById('calc-verdict');
        
        if (parseFloat(res.margin) < 0) {
            marginBadge.classList.add('status-prejuizo');
            verdictEl.textContent = "Cuidado: Este preço está gerando PREJUÍZO de venda!";
            verdictEl.style.backgroundColor = 'var(--danger-light)';
            verdictEl.style.color = 'var(--danger-hover)';
        } else if (parseFloat(res.margin) < 5) {
            marginBadge.classList.add('status-pending');
            verdictEl.textContent = "Atenção: A margem é muito estreita (<5%). Risco alto.";
            verdictEl.style.backgroundColor = 'var(--warning-light)';
            verdictEl.style.color = 'var(--warning-hover)';
        } else {
            marginBadge.classList.add('status-lucro');
            verdictEl.textContent = "Parabéns: A margem está saudável e lucrativa.";
            verdictEl.style.backgroundColor = 'var(--success-light)';
            verdictEl.style.color = 'var(--success-hover)';
        }

        document.getElementById('calc-res-suggested').textContent = suggested > 0 ? `R$ ${parseFloat(suggested).toFixed(2)}` : 'Impossível atingir';
    };

    // Bind event listeners
    [costInput, shippingInput, priceInput, marginTargetInput, mktSelect].forEach(input => {
        input.addEventListener('input', updateCalculatorScreen);
    });

    // Run initial calculation
    updateCalculatorScreen();
}
