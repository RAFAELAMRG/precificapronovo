/* --- Product Refunds View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/reembolsos', renderReembolsos);

// ==========================================
// MODULE FILTER STATE
// ==========================================
let refundDatePreset = 'last_30_days';
let refundSearchQuery = '';
let refundMktFilter = 'all';
let refundMaskSensitive = false;

function renderReembolsos(container, user) {
    const settings = api.getMarketplaceSettings();

    container.innerHTML = `
        <!-- Explanation Header Block -->
        <div class="visual-panel" style="margin-bottom: 1.5rem; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
            <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); font-weight: 700;">Reembolso por produto</h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto; line-height: 1.6;">
                O reembolso por produto mostra o número de devoluções e estornos por item. Ele ajuda a identificar produtos que parecem lucrativos, mas geram prejuízo oculto.
            </p>
            <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 800px; margin: 0 auto; line-height: 1.6;">
                Também permite ver quais itens estão sendo mais reembolsados e investigar o motivo. Com isso, você ajusta preço, descrição, logística ou até pausa o produto. Mais controle sobre perdas invisíveis da operação.
            </p>
        </div>

        <!-- Warning banner -->
        <div style="background-color: var(--warning-light); border: 1px solid var(--warning); border-radius: var(--radius-md); padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; color: var(--warning-hover);">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px; flex-shrink: 0;"></i>
            <span>Esta funcionalidade está em aprimoramento, por enquanto está disponível para <strong>AMAZON</strong> e <strong>MERCADO LIVRE</strong>. Em caso de problemas ou dúvidas, por favor entre em contato <a href="javascript:void(0)" style="font-weight: 700; text-decoration: underline; color: inherit;">clicando aqui</a>.</span>
        </div>

        <!-- CONTROL FILTER BAR -->
        <div class="visual-panel" style="margin-bottom: 2rem; padding: 1rem 1.5rem;">
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex-grow: 1;">
                    <!-- Search Input -->
                    <input type="text" id="refund-search" class="form-control" placeholder="Pesquisar SKU ou Produto..." style="max-width: 250px; padding: 0.45rem 0.75rem; font-size: 0.85rem;" value="${refundSearchQuery}">

                    <!-- Date preset select -->
                    <select id="refund-date-select" class="form-control" style="max-width: 180px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option value="last_30_days" ${refundDatePreset === 'last_30_days' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="this_month" ${refundDatePreset === 'this_month' ? 'selected' : ''}>Este mês</option>
                        <option value="last_month" ${refundDatePreset === 'last_month' ? 'selected' : ''}>Mês passado</option>
                        <option value="all" ${refundDatePreset === 'all' ? 'selected' : ''}>Todo o período</option>
                    </select>

                    <!-- Marketplace select (Amazon and ML only) -->
                    <select id="refund-mkt-select" class="form-control" style="max-width: 180px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option value="all" ${refundMktFilter === 'all' ? 'selected' : ''}>Todos os Canais</option>
                        <option value="amazon" ${refundMktFilter === 'amazon' ? 'selected' : ''}>Amazon</option>
                        <option value="mercado_livre" ${refundMktFilter === 'mercado_livre' ? 'selected' : ''}>Mercado Livre</option>
                    </select>

                    <!-- Mock Category Dropdown -->
                    <select class="form-control" style="max-width: 160px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option>Todas Categorias</option>
                    </select>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
                    <span id="refund-date-range-text" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; font-family: monospace;"></span>
                    
                    <button class="topbar-action-btn" id="refund-mask-btn" title="Ocultar/Exibir Valores">
                        <i data-lucide="${refundMaskSensitive ? 'eye-off' : 'eye'}" id="refund-mask-icon" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>

            </div>
        </div>

        <!-- TABLE PANEL -->
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Lista de Perdas por Produto</h2>
                <span id="refund-table-count" class="badge" style="background-color: var(--primary-light); color: var(--primary); font-weight: 700;">0 Produtos</span>
            </div>

            <div class="table-responsive">
                <table class="modern-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th style="text-align: center;">Unidades Vendidas</th>
                            <th style="text-align: center;">Unidades Reembolsadas</th>
                            <th style="text-align: right;">Total Faturado</th>
                            <th style="text-align: right;">Faturamento Reembolsado</th>
                            <th style="text-align: center;">Taxa de Reembolso</th>
                            <th style="text-align: right;">Lucro Pós Ads</th>
                            <th style="text-align: center;">MPA (Margem Ads)</th>
                            <th style="text-align: center; width: 60px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="refund-table-body">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // CALCULATIONS & RENDERS ENGINE
    const executeRefundCalculations = () => {
        const products = api.getProducts(user.id).filter(p => p.marketplace === 'amazon' || p.marketplace === 'mercado_livre');
        const campaigns = api.getAdsCampaigns(user.id);
        const orders = api.getOrders(user.id).filter(o => (o.marketplace === 'amazon' || o.marketplace === 'mercado_livre') && o.status !== 'cancelado');

        // 1. Filter by Date range
        let filteredOrders = orders;
        let dateScaling = 1.0;
        let dateLabel = "";

        if (refundDatePreset !== 'all') {
            const today = new Date();
            let start = null;
            let end = null;
            if (refundDatePreset === 'last_30_days') {
                start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = today;
                dateScaling = 1.0;
            } else if (refundDatePreset === 'this_month') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
                dateScaling = (today.getDate() / 30);
            } else if (refundDatePreset === 'last_month') {
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
                dateScaling = 0.95;
            }
            if (start && end) {
                filteredOrders = orders.filter(o => {
                    const oDate = new Date(o.data);
                    return oDate >= start && oDate <= end;
                });
                dateLabel = `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
            }
        } else {
            dateScaling = 1.5;
            const allDates = orders.map(o => new Date(o.data));
            if (allDates.length > 0) {
                const min = new Date(Math.min(...allDates));
                const max = new Date(Math.max(...allDates));
                dateLabel = `${min.toLocaleDateString('pt-BR')} a ${max.toLocaleDateString('pt-BR')}`;
            } else {
                dateLabel = "Sem Vendas";
            }
        }

        // 2. Filter by Marketplace
        let finalOrders = filteredOrders;
        let finalProducts = products;
        if (refundMktFilter !== 'all') {
            finalOrders = filteredOrders.filter(o => o.marketplace === refundMktFilter);
            finalProducts = products.filter(p => p.marketplace === refundMktFilter);
        }

        // Compile SKU refund stats
        const skuMap = {};
        
        finalProducts.forEach(p => {
            if (!skuMap[p.sku]) {
                skuMap[p.sku] = {
                    sku: p.sku,
                    nome: p.nome,
                    unidadesVendidas: 0,
                    unidadesReembolsadas: 0,
                    faturamento: 0,
                    lucroBruto: 0,
                    investimentoAds: 0,
                    marketplace: p.marketplace,
                    precoUnit: p.preco_atual
                };
            }
        });

        // Add sales count
        finalOrders.forEach(o => {
            if (skuMap[o.sku]) {
                skuMap[o.sku].unidadesVendidas += 1;
                skuMap[o.sku].faturamento += o.preco_venda;
                skuMap[o.sku].lucroBruto += o.lucro;
            }
        });

        // Deterministic mock refunded units based on SKU name and date scale
        Object.keys(skuMap).forEach(sku => {
            const item = skuMap[sku];
            let refundQty = 0;
            if (sku.includes("KB-RGB")) refundQty = 2;
            else if (sku.includes("HP-ANC")) refundQty = 1;
            else if (sku.includes("CH-USBC")) refundQty = 9;
            else if (sku.includes("SP-MON")) refundQty = 1;
            else if (sku.includes("SW-GPS")) refundQty = 1;
            else if (sku.includes("RL-USB")) refundQty = 1;

            item.unidadesReembolsadas = Math.min(item.unidadesVendidas, Math.round(refundQty * dateScaling));
        });

        // Add Ads spend
        campaigns.forEach(c => {
            const name = c.nome.toLowerCase();
            let targetSku = null;
            if (name.includes("teclado")) targetSku = "KB-RGB-01";
            else if (name.includes("fone")) targetSku = "HP-ANC-99";
            else if (name.includes("suporte")) targetSku = "SP-MON-01";

            if (targetSku && skuMap[targetSku]) {
                skuMap[targetSku].investimentoAds += c.investimento;
            }
        });

        // Calculate refund details and margins
        const rows = Object.values(skuMap).map(item => {
            const faturamentoReembolsado = item.unidadesReembolsadas * item.precoUnit;
            const taxaReembolso = item.unidadesVendidas > 0 ? (item.unidadesReembolsadas / item.unidadesVendidas) * 100 : 0;
            
            // Refund reduces total faturamento and profit
            const totalFaturado = item.faturamento;
            const lucroPosAds = (item.lucroBruto - item.investimentoAds) - faturamentoReembolsado;
            const mpa = totalFaturado > 0 ? (lucroPosAds / totalFaturado) * 100 : 0;

            return {
                ...item,
                totalFaturado,
                faturamentoReembolsado,
                taxaReembolso,
                lucroPosAds,
                mpa
            };
        });

        // Sort by refund rate descending
        rows.sort((a, b) => b.taxaReembolso - a.taxaReembolso);

        return {
            rows,
            dateLabel
        };
    };

    const formatMoney = (val) => {
        if (refundMaskSensitive) return "R$ ***";
        return `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    const refreshRefundDashboard = () => {
        const data = executeRefundCalculations();

        // 1. Date label
        document.getElementById('refund-date-range-text').textContent = `(${data.dateLabel})`;

        // 2. Render table rows
        const tbody = document.getElementById('refund-table-body');
        tbody.innerHTML = '';

        let filteredRows = data.rows;
        if (refundSearchQuery) {
            const query = refundSearchQuery.toLowerCase();
            filteredRows = filteredRows.filter(r => r.nome.toLowerCase().includes(query) || r.sku.toLowerCase().includes(query));
        }

        document.getElementById('refund-table-count').textContent = `${filteredRows.length} Produtos`;

        filteredRows.forEach(r => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'status-lucro';
            if (r.taxaReembolso > 5.0) badgeClass = 'status-prejuizo';
            else if (r.taxaReembolso > 2.0) badgeClass = 'status-pending';

            const mpaSign = r.mpa >= 0 ? '+' : '';

            tr.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: var(--text-primary); font-weight: 600;">${r.nome}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${r.sku} • <span class="marketplace-badge ${r.marketplace}" style="font-size: 0.65rem; padding: 1px 4px;">${r.marketplace === 'mercado_livre' ? 'Meli' : 'Amazon'}</span></span>
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600;">${refundMaskSensitive ? "***" : r.unidadesVendidas}</td>
                <td style="text-align: center; font-weight: 700; color: ${r.unidadesReembolsadas > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${refundMaskSensitive ? "***" : r.unidadesReembolsadas}</td>
                <td style="text-align: right; font-weight: 500; color: var(--text-primary);">${formatMoney(r.totalFaturado)}</td>
                <td style="text-align: right; font-weight: 600; color: ${r.faturamentoReembolsado > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${formatMoney(r.faturamentoReembolsado)}</td>
                <td style="text-align: center;">
                    <span class="badge ${badgeClass}" style="font-weight: 700;">
                        ${refundMaskSensitive ? "***%" : `${r.taxaReembolso.toFixed(2)}%`}
                    </span>
                </td>
                <td style="text-align: right; font-weight: 700; color: ${r.lucroPosAds >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(r.lucroPosAds)}</td>
                <td style="text-align: center;">
                    <span class="badge ${r.mpa >= 10 ? 'status-lucro' : (r.mpa > 0 ? 'status-pending' : 'status-prejuizo')}" style="font-weight: 700;">
                        ${mpaSign}${r.mpa.toFixed(1)}%
                    </span>
                </td>
                <td style="text-align: center;">
                    <button class="btn-icon-only btn-edit" title="Ver Detalhes do Reembolso" style="padding: 0.2rem;">
                        <i data-lucide="search" style="width: 14px; height: 14px;"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);

            // Details simulation click listener
            tr.querySelector('.btn-edit').addEventListener('click', () => {
                const bodyHtml = `
                    <div style="text-align: left; display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem;">
                        <p>Histórico detalhado de devoluções para o SKU <strong>${r.sku}</strong> no canal <strong>${r.marketplace === 'mercado_livre' ? 'Mercado Livre' : 'Amazon'}</strong>.</p>
                        <div style="background-color: var(--primary-light); padding: 1rem; border-radius: var(--radius-md); border: 1px dashed var(--primary); display:flex; flex-direction:column; gap:0.5rem;">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Unidades Reembolsadas:</span>
                                <strong>${r.unidadesReembolsadas} unidades</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; color: var(--danger); font-weight:700;">
                                <span>Perda Financeira Estimada:</span>
                                <strong>${formatMoney(r.faturamentoReembolsado)}</strong>
                            </div>
                        </div>
                        <div class="table-responsive" style="margin-top: 0.5rem;">
                            <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-secondary); display:block; margin-bottom:0.5rem;">Últimas Ocorrências</strong>
                            <table class="modern-table" style="font-size:0.75rem;">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Motivo Indicado</th>
                                        <th style="text-align:right;">Estorno</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${r.unidadesReembolsadas === 0 
                                        ? `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Nenhum reembolso registrado.</td></tr>`
                                        : Array.from({ length: r.unidadesReembolsadas }).map((_, idx) => {
                                            const motives = [
                                                "Desistência de Compra (Arrependimento)",
                                                "Produto não serviu / Tamanho inadequado",
                                                "Produto com avaria ou defeito de fábrica",
                                                "Atraso logístico de entrega"
                                            ];
                                            const dates = ["2026-05-27", "2026-05-24", "2026-05-18", "2026-05-10"];
                                            return `
                                                <tr>
                                                    <td>${new Date(dates[idx % dates.length]).toLocaleDateString('pt-BR')}</td>
                                                    <td>${motives[idx % motives.length]}</td>
                                                    <td style="text-align:right; font-weight:600; color:var(--danger);">${formatMoney(r.precoUnit)}</td>
                                                </tr>
                                            `;
                                        }).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                window.app.showModal(`Dossiê de Devolução — ${r.nome}`, bodyHtml, `<button class="btn btn-secondary btn-sm" id="refund-modal-close">Fechar</button>`);
                document.getElementById('refund-modal-close').addEventListener('click', () => {
                    const overlay = document.getElementById('modal-container');
                    overlay.classList.remove('show');
                    setTimeout(() => overlay.classList.add('hidden'), 300);
                });
            });
        });

        if (filteredRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">Nenhum produto com devoluções encontrado.</td></tr>`;
        }

        lucide.createIcons();
    };

    // FILTER REGISTRATION LISTENERS
    const searchInput = document.getElementById('refund-search');
    const dateSelect = document.getElementById('refund-date-select');
    const mktSelect = document.getElementById('refund-mkt-select');
    const maskBtn = document.getElementById('refund-mask-btn');

    searchInput.addEventListener('input', () => {
        refundSearchQuery = searchInput.value;
        refreshRefundDashboard();
    });

    dateSelect.addEventListener('change', () => {
        refundDatePreset = dateSelect.value;
        refreshRefundDashboard();
    });

    mktSelect.addEventListener('change', () => {
        refundMktFilter = mktSelect.value;
        refreshRefundDashboard();
    });

    maskBtn.addEventListener('click', () => {
        refundMaskSensitive = !refundMaskSensitive;
        const iconEl = document.getElementById('refund-mask-icon');
        iconEl.setAttribute('data-lucide', refundMaskSensitive ? 'eye-off' : 'eye');
        lucide.createIcons();
        refreshRefundDashboard();
    });

    // Run first populate
    refreshRefundDashboard();
}
