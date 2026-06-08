/* --- Ads Performance Views Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/ads/amazon', (container, user) => renderAdsChannel(container, user, 'amazon'));
router.on('#/ads/mercado_livre', (container, user) => renderAdsChannel(container, user, 'mercado_livre'));
router.on('#/ads/shopee', (container, user) => renderAdsChannel(container, user, 'shopee'));

// ==========================================
// MODULE FILTER STATE
// ==========================================
let adsDatePreset = 'last_30_days';
let adsSearchQuery = '';
let adsStatusFilter = 'all';
let adsMaskSensitive = false;

function renderAdsChannel(container, user, marketplaceId) {
    const settings = api.getMarketplaceSettings();
    const currentMkt = settings[marketplaceId] || { name: marketplaceId };

    container.innerHTML = `
        <!-- Warning Banner -->
        <div style="background-color: var(--warning-light); border: 1px solid var(--warning); border-radius: var(--radius-md); padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; color: var(--warning-hover);">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px; flex-shrink: 0;"></i>
            <span>Esta funcionalidade está em aprimoramento, em caso de problemas ou dúvidas, por favor entre em contato <a href="javascript:void(0)" style="font-weight: 700; text-decoration: underline; color: inherit;">clicando aqui</a>.</span>
        </div>

        <!-- Title Header -->
        <div class="page-header" style="margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <a href="#/dashboard" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-md); border: 1px solid var(--border-color); color: var(--text-secondary); transition: all var(--transition-fast);" title="Voltar ao Painel">
                    <i data-lucide="chevron-left" style="width: 18px; height: 18px;"></i>
                </a>
                <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); margin: 0;">
                    ${currentMkt.name} Ads
                </h1>
            </div>
        </div>

        <!-- CONTROL BAR -->
        <div class="visual-panel" style="margin-bottom: 2rem; padding: 1rem 1.5rem;">
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex-grow: 1;">
                    <!-- Search input -->
                    <input type="text" id="ads-search" class="form-control" placeholder="Buscar SKU ou Produto..." style="max-width: 250px; padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${adsSearchQuery}">

                    <!-- Date Preset selector -->
                    <select id="ads-date-select" class="form-control" style="max-width: 180px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option value="last_30_days" ${adsDatePreset === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="this_month" ${adsDatePreset === 'this_month' ? 'selected' : ''}>Este mês</option>
                        <option value="last_month" ${adsDatePreset === 'last_month' ? 'selected' : ''}>Mês passado</option>
                        <option value="all" ${adsDatePreset === 'all' ? 'selected' : ''}>Todo o período</option>
                    </select>

                    <!-- Status select filter -->
                    <select id="ads-status-select" class="form-control" style="max-width: 160px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option value="all" ${adsStatusFilter === 'all' ? 'selected' : ''}>Todas Campanhas</option>
                        <option value="ativo" ${adsStatusFilter === 'ativo' ? 'selected' : ''}>Somente Ativas</option>
                        <option value="pausado" ${adsStatusFilter === 'pausado' ? 'selected' : ''}>Somente Pausadas</option>
                    </select>

                    <!-- Items per page (Visual mockup) -->
                    <select class="form-control" style="max-width: 160px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option>10 itens por página</option>
                        <option>25 itens por página</option>
                        <option>50 itens por página</option>
                    </select>
                </div>

                <!-- Eye mask control -->
                <button class="topbar-action-btn" id="ads-mask-btn" title="Ocultar/Exibir Valores">
                    <i data-lucide="${adsMaskSensitive ? 'eye-off' : 'eye'}" id="ads-mask-icon" style="width: 18px; height: 18px;"></i>
                </button>
            </div>
        </div>

        <!-- 7 METRICS CARDS -->
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
            <!-- Row 1: 4 Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Custo Ads</span>
                    <div id="ads-card-custo" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);">R$ 0,00</div>
                </div>
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Custo Brands</span>
                        <i data-lucide="info" style="width: 12px; height: 12px; color: var(--text-muted);" title="Investimento alocado em campanhas de marca/Brands patrocinadas"></i>
                    </div>
                    <div id="ads-card-custo-brands" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);">R$ 0,00</div>
                </div>
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Faturamento Ads</span>
                    <div id="ads-card-faturamento-ads" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); color: var(--primary);">R$ 0,00</div>
                </div>
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Faturamento Total</span>
                    <div id="ads-card-faturamento-total" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);">R$ 0,00</div>
                </div>
            </div>

            <!-- Row 2: 3 Cards (Centered) -->
            <div style="display: flex; gap: 1.25rem; justify-content: center; flex-wrap: wrap;">
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem; min-width: 220px; flex: 1; max-width: 320px;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Total Vendido Ads</span>
                    <div id="ads-card-total-vendido" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);">0</div>
                </div>
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem; min-width: 220px; flex: 1; max-width: 320px;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">ACOS</span>
                        <i data-lucide="info" style="width: 12px; height: 12px; color: var(--text-muted);" title="Custo de Ads dividido pelo faturamento de Ads"></i>
                    </div>
                    <div id="ads-card-acos" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); color: var(--success);">0,00%</div>
                </div>
                <div class="metric-card" style="padding: 1.25rem; gap: 0.5rem; min-width: 220px; flex: 1; max-width: 320px;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">TACOS</span>
                        <i data-lucide="info" style="width: 12px; height: 12px; color: var(--text-muted);" title="Custo de Ads dividido pelo faturamento total do produto"></i>
                    </div>
                    <div id="ads-card-tacos" style="font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);">0,00%</div>
                </div>
            </div>
        </div>

        <!-- ADS DATATABLE PANEL -->
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Anúncios Patrocinados</h2>
                <span id="ads-table-count" class="badge" style="background-color: var(--primary-light); color: var(--primary); font-weight: 700;">0 Itens</span>
            </div>

            <div class="table-responsive">
                <table class="modern-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th style="width: 60px; text-align: center;">Imagem</th>
                            <th>Título / SKU</th>
                            <th style="text-align: right;">Custo Ads</th>
                            <th style="text-align: right;">Fat. Ads</th>
                            <th style="text-align: center;">Vendas Ads</th>
                            <th style="text-align: center;">Vendas Orgânicas</th>
                            <th style="text-align: right;">Fat. Total</th>
                            <th style="text-align: center;">ACOS</th>
                            <th style="text-align: center;">TACOS</th>
                            <th style="text-align: center;">Taxa Conversão Ads</th>
                        </tr>
                    </thead>
                    <tbody id="ads-table-body">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // CORE LOGIC CALCULATIONS & RE-RENDERS
    const executeAdsCalculations = () => {
        const products = api.getProducts(user.id).filter(p => p.marketplace === marketplaceId);
        const campaigns = api.getAdsCampaigns(user.id).filter(c => c.marketplace === marketplaceId);
        const orders = api.getOrders(user.id).filter(o => o.marketplace === marketplaceId && o.status !== 'cancelado');

        // Apply filters
        // 1. Date filters on orders
        let filteredOrders = orders;
        let dateScalingFactor = 1.0; // scale factor if date filters reduce campaign spend mockup

        if (adsDatePreset !== 'all') {
            const today = new Date();
            let start = null;
            let end = null;
            if (adsDatePreset === 'last_30_days') {
                start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = today;
                dateScalingFactor = 1.0;
            } else if (adsDatePreset === 'this_month') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
                dateScalingFactor = (today.getDate() / 30); // fraction of the month
            } else if (adsDatePreset === 'last_month') {
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
                dateScalingFactor = 0.95;
            }
            if (start && end) {
                filteredOrders = orders.filter(o => {
                    const oDate = new Date(o.data);
                    return oDate >= start && oDate <= end;
                });
            }
        } else {
            dateScalingFactor = 1.5; // expand spend for all time
        }

        // 2. Map ads data per product
        const items = [];

        products.forEach(p => {
            // Find campaign matching this SKU
            const skuLower = p.sku.toLowerCase();
            const matchingCamp = campaigns.find(c => {
                const name = c.nome.toLowerCase();
                if (skuLower.includes("kb-rgb") && name.includes("teclado")) return true;
                if (skuLower.includes("ms-wrl") && name.includes("mouse")) return true;
                if (skuLower.includes("hp-anc") && name.includes("fone")) return true;
                if (skuLower.includes("sp-mon") && name.includes("suporte")) return true;
                return false;
            });

            // Filter campaign status if requested
            if (adsStatusFilter !== 'all') {
                const status = matchingCamp ? matchingCamp.status : 'pausado';
                if (status !== adsStatusFilter) return; // skip
            }

            // Apply search query filter
            if (adsSearchQuery) {
                const query = adsSearchQuery.toLowerCase();
                if (!p.nome.toLowerCase().includes(query) && !p.sku.toLowerCase().includes(query)) {
                    return; // skip
                }
            }

            // Calculation mapping
            const custoAds = matchingCamp ? (matchingCamp.investimento * dateScalingFactor) : 0;
            const fatAds = matchingCamp ? (matchingCamp.faturamento_atribuido * dateScalingFactor) : 0;
            const unitPrice = p.preco_atual || 50;
            const vendasAds = fatAds > 0 ? Math.round(fatAds / unitPrice) : 0;

            // Organic sales calculation
            const orderCount = filteredOrders.filter(o => o.sku === p.sku).length;
            const vendasOrganicas = Math.max(2, orderCount + Math.round((p.estoque || 0) * 0.12 * dateScalingFactor));
            const fatTotal = (vendasAds + vendasOrganicas) * unitPrice;

            const acos = fatAds > 0 ? (custoAds / fatAds) * 100 : 0;
            const tacos = fatTotal > 0 ? (custoAds / fatTotal) * 100 : 0;

            // Conversion rate
            const cliques = matchingCamp ? Math.round(matchingCamp.cliques * dateScalingFactor) : 0;
            const convRate = cliques > 0 ? ((vendasAds / cliques) * 100) : 0;

            // Brands spend simulated portion (Sponsored Brands represents part of the spend)
            const custoBrands = marketplaceId === 'shopee' ? 0 : (custoAds * 0.15); // Shopee doesn't have "Brands" specifically like Amazon SB, so keep 0, Amazon/Meli get 15%

            items.push({
                product: p,
                custoAds,
                custoBrands,
                fatAds,
                vendasAds,
                vendasOrganicas,
                fatTotal,
                acos,
                tacos,
                convRate
            });
        });

        // Sum aggregates
        let sumCusto = 0;
        let sumCustoBrands = 0;
        let sumFatAds = 0;
        let sumFatTotal = 0;
        let sumVendidoAds = 0;

        items.forEach(it => {
            sumCusto += it.custoAds;
            sumCustoBrands += it.custoBrands;
            sumFatAds += it.fatAds;
            sumFatTotal += it.fatTotal;
            sumVendidoAds += it.vendasAds;
        });

        const overallAcos = sumFatAds > 0 ? (sumCusto / sumFatAds) * 100 : 0;
        const overallTacos = sumFatTotal > 0 ? (sumCusto / sumFatTotal) * 100 : 0;

        return {
            items,
            aggregates: {
                custo: sumCusto,
                custoBrands: sumCustoBrands,
                fatAds: sumFatAds,
                fatTotal: sumFatTotal,
                totalVendido: sumVendidoAds,
                acos: overallAcos,
                tacos: overallTacos
            }
        };
    };

    const formatValue = (val, isPercentage = false) => {
        if (adsMaskSensitive) return isPercentage ? "***%" : "R$ ***";
        if (isPercentage) return `${val.toFixed(2)}%`;
        return `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
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

    const refreshAdsDashboard = () => {
        const data = executeAdsCalculations();
        const agg = data.aggregates;

        // Populate Cards
        document.getElementById('ads-card-custo').textContent = formatValue(agg.custo);
        document.getElementById('ads-card-custo-brands').textContent = formatValue(agg.custoBrands);
        document.getElementById('ads-card-faturamento-ads').textContent = formatValue(agg.fatAds);
        document.getElementById('ads-card-faturamento-total').textContent = formatValue(agg.fatTotal);
        document.getElementById('ads-card-total-vendido').textContent = adsMaskSensitive ? "***" : agg.totalVendido;
        document.getElementById('ads-card-acos').textContent = formatValue(agg.acos, true);
        document.getElementById('ads-card-tacos').textContent = formatValue(agg.tacos, true);

        // Styling indicators for ACOShealth
        const acosDiv = document.getElementById('ads-card-acos');
        const acosCard = acosDiv.closest('.metric-card');
        acosCard.className = 'metric-card';
        if (agg.acos > 25) {
            acosCard.classList.add('danger-accent');
            acosDiv.style.color = 'var(--danger)';
        } else if (agg.acos > 0 && agg.acos < 15) {
            acosCard.classList.add('success-accent');
            acosDiv.style.color = 'var(--success)';
        } else {
            acosCard.classList.add('warning-accent');
            acosDiv.style.color = 'var(--warning-hover)';
        }

        // Populate Table rows
        const tbody = document.getElementById('ads-table-body');
        tbody.innerHTML = '';
        document.getElementById('ads-table-count').textContent = `${data.items.length} Itens`;

        data.items.forEach(it => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--radius-sm); background-color: var(--primary-light); color: var(--primary); margin: 0 auto;">
                        <i data-lucide="${getProductIcon(it.product.sku)}" style="width: 16px; height: 16px;"></i>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: var(--text-primary); font-weight: 600;">${it.product.nome}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${it.product.sku}</span>
                    </div>
                </td>
                <td style="text-align: right; font-weight: 500;">${formatValue(it.custoAds)}</td>
                <td style="text-align: right; font-weight: 500;">${formatValue(it.fatAds)}</td>
                <td style="text-align: center; font-weight: 600;">${adsMaskSensitive ? "***" : it.vendasAds}</td>
                <td style="text-align: center; color: var(--text-secondary);">${adsMaskSensitive ? "***" : it.vendasOrganicas}</td>
                <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${formatValue(it.fatTotal)}</td>
                <td style="text-align: center;">
                    <span class="badge ${it.acos > 25.0 ? 'status-prejuizo' : (it.acos > 0 ? 'status-lucro' : 'status-pending')}" style="font-weight: 700;">
                        ${formatValue(it.acos, true)}
                    </span>
                </td>
                <td style="text-align: center; color: var(--text-secondary); font-weight: 500;">
                    ${formatValue(it.tacos, true)}
                </td>
                <td style="text-align: center; font-weight: 600; color: var(--primary);">
                    ${adsMaskSensitive ? "***%" : `${it.convRate.toFixed(2)}%`}
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (data.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">Nenhum anúncio patrocinado atende aos filtros atuais.</td></tr>`;
        }

        lucide.createIcons();
    };

    // FILTER REGISTRATION LISTENERS
    const searchInput = document.getElementById('ads-search');
    const dateSelect = document.getElementById('ads-date-select');
    const statusSelect = document.getElementById('ads-status-select');
    const maskBtn = document.getElementById('ads-mask-btn');

    searchInput.addEventListener('input', () => {
        adsSearchQuery = searchInput.value;
        refreshAdsDashboard();
    });

    dateSelect.addEventListener('change', () => {
        adsDatePreset = dateSelect.value;
        refreshAdsDashboard();
    });

    statusSelect.addEventListener('change', () => {
        adsStatusFilter = statusSelect.value;
        refreshAdsDashboard();
    });

    maskBtn.addEventListener('click', () => {
        adsMaskSensitive = !adsMaskSensitive;
        const iconEl = document.getElementById('ads-mask-icon');
        iconEl.setAttribute('data-lucide', adsMaskSensitive ? 'eye-off' : 'eye');
        lucide.createIcons();
        refreshAdsDashboard();
    });

    // Run Initial Load view
    refreshAdsDashboard();
}
