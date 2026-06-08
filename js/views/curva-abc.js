/* --- Curva ABC View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/curva-abc', renderCurvaAbc);

// ==========================================
// MODULE LEVEL FILTER STATE
// ==========================================
let abcDatePreset = 'all';
let abcStartDate = '';
let abcEndDate = '';
let abcMktFilter = 'all';
let abcClassFilter = 'all';
let abcMaskSensitive = false;

function renderCurvaAbc(container, user) {
    const settings = api.getMarketplaceSettings();

    // RENDER OUTER LAYOUT
    container.innerHTML = `
        <!-- Explanation Block -->
        <div class="visual-panel" style="margin-bottom: 2rem; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 0.75rem;">
            <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); font-weight: 700;">Curva ABC</h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto; line-height: 1.6;">
                A <strong>Curva ABC</strong> mostra quais produtos realmente impactam o faturamento e o lucro da sua operação. Ela classifica os itens em A, B e C, de acordo com sua <strong>importância</strong> nos resultados.
            </p>
            <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 800px; margin: 0 auto; line-height: 1.6;">
                Com essa análise, você identifica onde concentrar estoque, investimento e atenção. Isso evita desperdícios e decisões no achismo. Mais clareza para crescer com <strong>controle e rentabilidade</strong>.
            </p>
        </div>

        <!-- FILTER BAR -->
        <div class="visual-panel" style="margin-bottom: 2rem; padding: 1.25rem 1.5rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-end; justify-content: space-between; flex-wrap: wrap;">
                
                <!-- Filters inputs group -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex-grow: 1; align-items: flex-end;">
                    
                    <!-- Date range presets -->
                    <div class="form-group" style="margin: 0; min-width: 140px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Período</label>
                        <select id="abc-date-preset" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                            <option value="all" ${abcDatePreset === 'all' ? 'selected' : ''}>Todos os Períodos</option>
                            <option value="this_month" ${abcDatePreset === 'this_month' ? 'selected' : ''}>Esse mês</option>
                            <option value="last_month" ${abcDatePreset === 'last_month' ? 'selected' : ''}>Mês passado</option>
                            <option value="last_30_days" ${abcDatePreset === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        </select>
                    </div>

                    <!-- Start date custom -->
                    <div class="form-group" id="abc-start-group" style="margin: 0; min-width: 130px; ${abcDatePreset !== 'all' ? 'display:none;' : ''}">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Data de Início</label>
                        <input type="date" id="abc-start-date" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${abcStartDate}">
                    </div>

                    <!-- End date custom -->
                    <div class="form-group" id="abc-end-group" style="margin: 0; min-width: 130px; ${abcDatePreset !== 'all' ? 'display:none;' : ''}">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Data de Fim</label>
                        <input type="date" id="abc-end-date" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${abcEndDate}">
                    </div>

                    <!-- Marketplace select dropdown -->
                    <div class="form-group" style="margin: 0; min-width: 160px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Marketplace</label>
                        <select id="abc-mkt-select" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                            <option value="all" ${abcMktFilter === 'all' ? 'selected' : ''}>Todos os Canais</option>
                            ${Object.values(settings).map(m => `<option value="${m.id}" ${abcMktFilter === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Classification Filter (A, B, C, Z) -->
                    <div class="form-group" style="margin: 0; min-width: 140px;">
                        <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Classificação</label>
                        <select id="abc-class-select" class="form-control" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                            <option value="all" ${abcClassFilter === 'all' ? 'selected' : ''}>Todas as Curvas</option>
                            <option value="A" ${abcClassFilter === 'A' ? 'selected' : ''}>Curva A (Top 80%)</option>
                            <option value="B" ${abcClassFilter === 'B' ? 'selected' : ''}>Curva B (Próx. 15%)</option>
                            <option value="C" ${abcClassFilter === 'C' ? 'selected' : ''}>Curva C (Mín. 5%)</option>
                            <option value="Z" ${abcClassFilter === 'Z' ? 'selected' : ''}>Curva Z (Sem Vendas)</option>
                        </select>
                    </div>
                </div>

                <!-- Custom Right Actions: Date display & eye hide toggle -->
                <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
                    <span id="abc-date-range-text" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; font-family: monospace;"></span>
                    
                    <button class="topbar-action-btn" id="abc-mask-btn" title="Ocultar/Exibir Valores">
                        <i data-lucide="${abcMaskSensitive ? 'eye-off' : 'eye'}" id="abc-mask-icon" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>

            </div>
        </div>

        <!-- 4 SUMMARY CARDS BOX -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;" id="abc-cards-container">
            <!-- Rendered dynamically -->
        </div>

        <!-- PRODUCTS CLASSIFICATION TABLE PANEL -->
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Lista de Classificação de SKUs</h2>
                <span id="abc-total-items-count" class="badge" style="background-color: var(--primary-light); color: var(--primary); font-weight: 700;">0 Produtos</span>
            </div>
            
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Produto / SKU</th>
                            <th style="text-align: center;">Unidades Vendidas</th>
                            <th style="text-align: right;">Fat. Total</th>
                            <th style="text-align: right;">Lucro Bruto</th>
                            <th style="text-align: right;">Lucro Pós Ads</th>
                            <th style="text-align: center;">MPA (Margem Ads)</th>
                            <th style="text-align: center;">Curva</th>
                        </tr>
                    </thead>
                    <tbody id="abc-table-body">
                        <!-- Rendered dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // FUNCTIONS FOR DATA CALCULATION AND RENDERING
    const executeAbcCalculations = () => {
        const products = api.getProducts(user.id);
        const orders = api.getOrders(user.id).filter(o => o.status !== 'cancelado');
        const campaigns = api.getAdsCampaigns(user.id);

        // 1. Preset or custom Date filter
        let filteredOrders = orders;
        let finalStartDate = abcStartDate;
        let finalEndDate = abcEndDate;

        if (abcDatePreset !== 'all') {
            const today = new Date();
            let start = null;
            let end = null;
            if (abcDatePreset === 'this_month') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
            } else if (abcDatePreset === 'last_month') {
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
            } else if (abcDatePreset === 'last_30_days') {
                start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = today;
            }
            if (start && end) {
                filteredOrders = orders.filter(o => {
                    const oDate = new Date(o.data);
                    return oDate >= start && oDate <= end;
                });
                finalStartDate = start.toISOString().split('T')[0];
                finalEndDate = end.toISOString().split('T')[0];
            }
        } else if (abcStartDate || abcEndDate) {
            filteredOrders = orders.filter(o => {
                let match = true;
                const oDate = new Date(o.data);
                if (abcStartDate) {
                    const [y, m, d] = abcStartDate.split('-').map(Number);
                    const s = new Date(y, m - 1, d, 0, 0, 0, 0);
                    match = match && (oDate >= s);
                }
                if (abcEndDate) {
                    const [y, m, d] = abcEndDate.split('-').map(Number);
                    const e = new Date(y, m - 1, d, 23, 59, 59, 999);
                    match = match && (oDate <= e);
                }
                return match;
            });
        }

        // 2. Marketplace filter
        let finalOrders = filteredOrders;
        let finalCampaigns = campaigns;
        if (abcMktFilter !== 'all') {
            finalOrders = filteredOrders.filter(o => o.marketplace === abcMktFilter);
            finalCampaigns = campaigns.filter(c => c.marketplace === abcMktFilter);
        }

        // 3. Group by unique SKU
        const skuMap = {};
        
        // Seed with all current products of this user
        products.forEach(p => {
            // Seed base sku map entry if it doesn't exist
            if (!skuMap[p.sku]) {
                skuMap[p.sku] = {
                    sku: p.sku,
                    nome: p.nome,
                    unidadesVendidas: 0,
                    faturamento: 0,
                    lucroBruto: 0,
                    investimentoAds: 0,
                    lucroPosAds: 0,
                    marketplace: p.marketplace
                };
            }
        });

        // Add sales from orders
        finalOrders.forEach(o => {
            if (skuMap[o.sku]) {
                skuMap[o.sku].unidadesVendidas += 1;
                skuMap[o.sku].faturamento += o.preco_venda;
                skuMap[o.sku].lucroBruto += o.lucro;
            }
        });

        // Add Ads spend
        finalCampaigns.forEach(c => {
            const name = c.nome.toLowerCase();
            let targetSku = null;
            if (name.includes("teclado")) targetSku = "KB-RGB-01";
            else if (name.includes("mouse")) targetSku = "MS-WRL-02";
            else if (name.includes("fone")) targetSku = "HP-ANC-99";
            else if (name.includes("suporte")) targetSku = "SP-MON-01";

            if (targetSku && skuMap[targetSku]) {
                skuMap[targetSku].investimentoAds += c.investimento;
            }
        });

        // Calculate lucros pós ads & margins
        const skuList = Object.values(skuMap);
        skuList.forEach(item => {
            item.lucroPosAds = item.lucroBruto - item.investimentoAds;
            item.mpa = item.faturamento > 0 ? (item.lucroPosAds / item.faturamento) * 100 : 0;
        });

        // 4. Sort and classify
        skuList.sort((a, b) => b.faturamento - a.faturamento);

        const totalRevenueAll = skuList.reduce((sum, item) => sum + item.faturamento, 0);
        let cumulative = 0;

        skuList.forEach(item => {
            if (item.faturamento === 0) {
                item.classificacao = 'Z';
            } else {
                const prevPct = totalRevenueAll > 0 ? (cumulative / totalRevenueAll) * 100 : 0;
                cumulative += item.faturamento;
                if (prevPct < 80) {
                    item.classificacao = 'A';
                } else if (prevPct < 95) {
                    item.classificacao = 'B';
                } else {
                    item.classificacao = 'C';
                }
            }
        });

        // 5. Aggregate cards metrics
        const cards = {
            A: { unidadesVendidas: 0, produtosDiferentes: 0, faturamento: 0, lucroBruto: 0, lucroPosAds: 0 },
            B: { unidadesVendidas: 0, produtosDiferentes: 0, faturamento: 0, lucroBruto: 0, lucroPosAds: 0 },
            C: { unidadesVendidas: 0, produtosDiferentes: 0, faturamento: 0, lucroBruto: 0, lucroPosAds: 0 },
            Z: { unidadesVendidas: 0, produtosDiferentes: 0, faturamento: 0, lucroBruto: 0, lucroPosAds: 0 }
        };

        skuList.forEach(item => {
            const cls = item.classificacao;
            cards[cls].unidadesVendidas += item.unidadesVendidas;
            cards[cls].produtosDiferentes += 1;
            cards[cls].faturamento += item.faturamento;
            cards[cls].lucroBruto += item.lucroBruto;
            cards[cls].lucroPosAds += item.lucroPosAds;
        });

        // Format dates text
        let dateRangeText = "";
        if (finalStartDate && finalEndDate) {
            const dStart = new Date(finalStartDate + 'T12:00:00');
            const dEnd = new Date(finalEndDate + 'T12:00:00');
            dateRangeText = `${dStart.toLocaleDateString('pt-BR')} a ${dEnd.toLocaleDateString('pt-BR')}`;
        } else {
            const allDates = orders.map(o => new Date(o.data));
            if (allDates.length > 0) {
                const minDate = new Date(Math.min(...allDates));
                const maxDate = new Date(Math.max(...allDates));
                dateRangeText = `${minDate.toLocaleDateString('pt-BR')} a ${maxDate.toLocaleDateString('pt-BR')}`;
            } else {
                dateRangeText = "Sem Vendas";
            }
        }

        return {
            skuList,
            cards,
            dateRangeText
        };
    };

    const getProductIcon = (sku) => {
        const s = sku.toLowerCase();
        if (s.includes("kb-rgb")) return "keyboard";
        if (s.includes("ms-wrl")) return "mouse";
        if (s.includes("hp-anc")) return "headphones";
        if (s.includes("ch-usbc")) return "zap";
        if (s.includes("cb-hdmi")) return "cpu";
        if (s.includes("sp-mon")) return "monitor";
        if (s.includes("sw-gps")) return "watch";
        if (s.includes("rl-usb")) return "lightbulb";
        return "package";
    };

    const formatMoney = (val) => {
        if (abcMaskSensitive) return "R$ ***";
        return `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    const refreshDashboardView = () => {
        const data = executeAbcCalculations();

        // 1. Update Date range text
        document.getElementById('abc-date-range-text').textContent = `(${data.dateRangeText})`;

        // 2. Render 4 cards
        const cardsBox = document.getElementById('abc-cards-container');
        const c = data.cards;

        const classAccents = {
            A: { color: 'var(--success)', border: 'success-accent', title: 'Curva A', label: 'Top 80% Receita' },
            B: { color: 'var(--primary)', border: 'primary-accent', title: 'Curva B', label: 'Médio 15% Receita' },
            C: { color: 'var(--warning)', border: 'warning-accent', title: 'Curva C', label: 'Baixo 5% Receita' },
            Z: { color: 'var(--text-muted)', border: '', title: 'Curva Z', label: 'Sem faturamento' }
        };

        cardsBox.innerHTML = ['A', 'B', 'C', 'Z'].map(cls => {
            const cfg = classAccents[cls];
            const info = c[cls];

            const brutMargin = info.faturamento > 0 ? (info.lucroBruto / info.faturamento) * 100 : 0;
            const adsMargin = info.faturamento > 0 ? (info.lucroPosAds / info.faturamento) * 100 : 0;

            const marginBrutaSign = brutMargin >= 0 ? '+' : '';
            const marginAdsSign = adsMargin >= 0 ? '+' : '';

            // Custom border mapping
            let borderStyle = '';
            if (cls === 'A') borderStyle = 'border-top: 4px solid var(--success);';
            else if (cls === 'B') borderStyle = 'border-top: 4px solid var(--primary);';
            else if (cls === 'C') borderStyle = 'border-top: 4px solid var(--warning);';
            else borderStyle = 'border-top: 4px solid var(--text-muted);';

            return `
                <div class="metric-card ${cfg.border}" style="${borderStyle} padding: 1.25rem; gap: 0.75rem;">
                    <div class="metric-card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 800; font-size: 1rem; color: var(--text-primary); font-family: var(--font-display);">${cfg.title}</span>
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${cfg.label}</span>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--text-secondary);">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Unidades Vendidas:</span>
                            <strong style="color: var(--text-primary);">${info.unidadesVendidas}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Produtos Diferentes:</span>
                            <strong style="color: var(--text-primary);">${info.produtosDiferentes}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 0.4rem; margin-top: 0.2rem;">
                            <span>Faturamento:</span>
                            <strong style="color: var(--text-primary);">${formatMoney(info.faturamento)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Lucro Bruto:</span>
                            <strong style="color: var(--text-primary);">${formatMoney(info.lucroBruto)} <span style="font-size:0.7rem; color:var(--text-muted);">(${marginBrutaSign}${brutMargin.toFixed(1)}%)</span></strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 0.4rem; margin-top: 0.2rem; color: ${info.lucroPosAds >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                            <span>Lucro Pós Ads:</span>
                            <strong>${formatMoney(info.lucroPosAds)} <span style="font-size:0.7rem; color:var(--text-muted);">(${marginAdsSign}${adsMargin.toFixed(1)}%)</span></strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 3. Render Table
        const tbody = document.getElementById('abc-table-body');
        tbody.innerHTML = '';

        let tableRows = data.skuList;
        if (abcClassFilter !== 'all') {
            tableRows = tableRows.filter(p => p.classificacao === abcClassFilter);
        }

        document.getElementById('abc-total-items-count').textContent = `${tableRows.length} SKUs`;

        tableRows.forEach(p => {
            let badgeClass = 'status-lucro';
            if (p.classificacao === 'B') badgeClass = 'status-pending';
            else if (p.classificacao === 'C') badgeClass = 'status-blocked';
            else if (p.classificacao === 'Z') badgeClass = 'status-prejuizo';

            // Custom curve badge colors
            let styleBadge = '';
            if (p.classificacao === 'A') styleBadge = 'background-color: var(--success-light); color: var(--success); font-weight: 800; font-size: 0.85rem; border-radius: var(--radius-full); width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;';
            else if (p.classificacao === 'B') styleBadge = 'background-color: var(--primary-light); color: var(--primary); font-weight: 800; font-size: 0.85rem; border-radius: var(--radius-full); width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;';
            else if (p.classificacao === 'C') styleBadge = 'background-color: var(--warning-light); color: var(--warning-hover); font-weight: 800; font-size: 0.85rem; border-radius: var(--radius-full); width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;';
            else styleBadge = 'background-color: var(--border-color); color: var(--text-muted); font-weight: 800; font-size: 0.85rem; border-radius: var(--radius-full); width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;';

            const mpaSign = p.mpa >= 0 ? '+' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="alert-icon-wrap info" style="width: 32px; height: 32px; border-radius: var(--radius-md); background-color: var(--primary-light); color: var(--primary);">
                            <i data-lucide="${getProductIcon(p.sku)}" style="width: 16px; height: 16px;"></i>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <strong style="color: var(--text-primary); font-weight: 600;">${p.nome}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.sku}</span>
                        </div>
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600; font-size: 0.95rem;">${p.unidadesVendidas}</td>
                <td style="text-align: right; font-weight: 600; color: var(--text-primary);">${formatMoney(p.faturamento)}</td>
                <td style="text-align: right; color: var(--text-secondary);">${formatMoney(p.lucroBruto)}</td>
                <td style="text-align: right; font-weight: 700; color: ${p.lucroPosAds >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(p.lucroPosAds)}</td>
                <td style="text-align: center;">
                    <span class="badge ${p.mpa >= 10 ? 'status-lucro' : (p.mpa > 0 ? 'status-pending' : 'status-prejuizo')}" style="font-weight: 700; font-size: 0.75rem; padding: 2px 8px;">
                        ${mpaSign}${p.mpa.toFixed(1)}%
                    </span>
                </td>
                <td style="text-align: center;">
                    <span style="${styleBadge}">${p.classificacao}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (tableRows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
                        Nenhum SKU encontrado nesta classificação.
                    </td>
                </tr>
            `;
        }

        lucide.createIcons();
    };

    // BIND INTERACTIVE FILTER EVENT LISTENERS
    const presetSelect = document.getElementById('abc-date-preset');
    const startDateInput = document.getElementById('abc-start-date');
    const endDateInput = document.getElementById('abc-end-date');
    const mktSelect = document.getElementById('abc-mkt-select');
    const classSelect = document.getElementById('abc-class-select');
    const maskBtn = document.getElementById('abc-mask-btn');
    const startGroup = document.getElementById('abc-start-group');
    const endGroup = document.getElementById('abc-end-group');

    presetSelect.addEventListener('change', () => {
        abcDatePreset = presetSelect.value;
        if (abcDatePreset === 'all') {
            startGroup.style.display = 'block';
            endGroup.style.display = 'block';
        } else {
            startGroup.style.display = 'none';
            endGroup.style.display = 'none';
        }
        refreshDashboardView();
    });

    startDateInput.addEventListener('change', () => {
        abcStartDate = startDateInput.value;
        refreshDashboardView();
    });

    endDateInput.addEventListener('change', () => {
        abcEndDate = endDateInput.value;
        refreshDashboardView();
    });

    mktSelect.addEventListener('change', () => {
        abcMktFilter = mktSelect.value;
        refreshDashboardView();
    });

    classSelect.addEventListener('change', () => {
        abcClassFilter = classSelect.value;
        refreshDashboardView();
    });

    maskBtn.addEventListener('click', () => {
        abcMaskSensitive = !abcMaskSensitive;
        const iconEl = document.getElementById('abc-mask-icon');
        iconEl.setAttribute('data-lucide', abcMaskSensitive ? 'eye-off' : 'eye');
        lucide.createIcons();
        refreshDashboardView();
    });

    // Execute first load view populate
    refreshDashboardView();
}
