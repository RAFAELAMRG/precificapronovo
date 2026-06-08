/* --- DRE - Financeiro View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { db } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/financeiro/resumo', renderFinanceiroResumo);
router.on('#/financeiro/categorias', renderCategoriasDespesas);
router.on('#/financeiro/despesas', renderDespesasOperacionais);

// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE SEEDING
// ==========================================
let dreMktFilter = 'all';
let dreDatePreset = '12/2025'; // Matches Screenshot 1
let dreIncludeRefundCosts = true;
let dreMaskSensitive = false;
let dreExpandedRows = {
    faturamento: true,       // Expanded by default in Screenshot 1
    liquido_marketplace: true // Expanded by default in Screenshot 1
};

const DEFAULT_CATEGORIES = [
    "Logística & Embalagens",
    "Ferramentas SaaS & Assinaturas",
    "Infraestrutura & Escritório",
    "Marketing & Tráfego Pago"
];

const DEFAULT_EXPENSES = [
    { id: "e-1", data: "2026-05-15", categoria: "Ferramentas SaaS & Assinaturas", descricao: "Assinatura PrecificaPro", valor: 19.90 },
    { id: "e-2", data: "2026-05-10", categoria: "Logística & Embalagens", descricao: "Caixas de Papelão e Embalagem", valor: 350.00 }
];

function getCategories() {
    let cats = db.get("despesa_categorias");
    if (!cats || cats.length === 0) {
        db.set("despesa_categorias", DEFAULT_CATEGORIES);
        cats = DEFAULT_CATEGORIES;
    }
    return cats;
}

function getExpenses() {
    let exps = db.get("despesas_operacionais");
    if (!exps || exps.length === 0) {
        db.set("despesas_operacionais", DEFAULT_EXPENSES);
        exps = DEFAULT_EXPENSES;
    }
    return exps;
}

// ==========================================
// CATEGORIAS DE DESPESAS VIEW
// ==========================================
function renderCategoriasDespesas(container, user) {
    const renderList = () => {
        const categories = getCategories();
        const expenses = getExpenses();

        const getExpenseCount = (catName) => expenses.filter(e => e.categoria === catName).length;
        const getExpenseSum = (catName) => expenses.filter(e => e.categoria === catName).reduce((sum, e) => sum + e.valor, 0);

        const getCategoryIcon = (name) => {
            const n = name.toLowerCase();
            if (n.includes("logística") || n.includes("embalagem")) return { icon: "truck", class: "logistica" };
            if (n.includes("saas") || n.includes("assinatura") || n.includes("ferramenta")) return { icon: "cpu", class: "saas" };
            if (n.includes("infra") || n.includes("escritório") || n.includes("aluguel") || n.includes("luz")) return { icon: "building-2", class: "infra" };
            if (n.includes("marketing") || n.includes("tráfego") || n.includes("ads") || n.includes("tráfego pago")) return { icon: "megaphone", class: "mkt" };
            return { icon: "tag", class: "custom" };
        };

        const formatMoney = (val) => `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        container.innerHTML = `
            <style>
                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 1.25rem;
                    margin-top: 1.5rem;
                }
                .category-card {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    position: relative;
                    transition: all var(--transition-normal);
                    box-shadow: var(--shadow-sm);
                }
                .category-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--border-focus);
                }
                .category-icon-wrap {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .category-icon-wrap.logistica { background-color: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .category-icon-wrap.saas { background-color: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
                .category-icon-wrap.infra { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .category-icon-wrap.mkt { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
                .category-icon-wrap.custom { background-color: rgba(148, 163, 184, 0.1); color: #64748b; }
                
                .category-info {
                    flex: 1;
                    min-width: 0;
                }
                .category-info h3 {
                    font-family: var(--font-display);
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 0.25rem 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .category-info span {
                    font-size: 0.78rem;
                    color: var(--text-secondary);
                    display: block;
                }
                .category-info strong {
                    font-size: 0.78rem;
                    color: var(--text-muted);
                    display: block;
                    margin-top: 0.15rem;
                }
                .category-actions {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    display: flex;
                    gap: 0.35rem;
                    opacity: 0;
                    transition: opacity var(--transition-fast);
                }
                .category-card:hover .category-actions {
                    opacity: 1;
                }
                .category-action-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border-color);
                    background-color: var(--bg-card);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .category-action-btn:hover {
                    background-color: var(--bg-sidebar-hover);
                    color: var(--text-primary);
                }
                .category-action-btn.delete:hover {
                    background-color: var(--danger-light);
                    color: var(--danger);
                    border-color: rgba(239, 68, 68, 0.2);
                }
                .add-category-card {
                    border: 2px dashed var(--border-color);
                    background-color: transparent;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    min-height: 96px;
                    transition: all var(--transition-normal);
                    border-radius: var(--radius-lg);
                }
                .add-category-card:hover {
                    border-color: var(--primary);
                    background-color: var(--bg-card);
                }
                .add-category-card i {
                    color: var(--text-muted);
                    transition: color var(--transition-fast);
                }
                .add-category-card:hover i {
                    color: var(--primary);
                }
                .add-category-card span {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    transition: color var(--transition-fast);
                }
                .add-category-card:hover span {
                    color: var(--primary);
                }
            </style>

            <div class="page-header" style="margin-bottom: 1.5rem;">
                <div>
                    <h1 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); margin-bottom: 0.25rem;">Categorias de Despesas</h1>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">Organize e gerencie os canais de custos operacionais do seu negócio.</p>
                </div>
            </div>

            <div class="category-grid">
                ${categories.map(cat => {
                    const iconMeta = getCategoryIcon(cat);
                    const count = getExpenseCount(cat);
                    const sum = getExpenseSum(cat);
                    const isDefault = DEFAULT_CATEGORIES.includes(cat);

                    return `
                        <div class="category-card">
                            <div class="category-icon-wrap ${iconMeta.class}">
                                <i data-lucide="${iconMeta.icon}"></i>
                            </div>
                            <div class="category-info">
                                <h3 title="${cat}">${cat}</h3>
                                <span>${count} despesas lançadas</span>
                                ${count > 0 ? `<strong>Total: ${formatMoney(sum)}</strong>` : '<strong>Nenhum gasto</strong>'}
                            </div>
                            ${!isDefault ? `
                                <div class="category-actions">
                                    <button class="category-action-btn delete btn-delete-cat" data-name="${cat}" title="Excluir Categoria">
                                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
                
                <div class="add-category-card" id="btn-add-category-card">
                    <i data-lucide="plus-circle" style="width: 28px; height: 28px;"></i>
                    <span>Nova Categoria</span>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Bind delete listeners
        container.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                
                const bodyHtml = `
                    <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                        <p>Deseja realmente excluir a categoria <strong>"${name}"</strong>?</p>
                        <p style="margin-top: 0.5rem; color: var(--danger);"><strong>Atenção:</strong> Lançamentos de despesas vinculados a esta categoria não serão apagados, mas ficarão marcados sem categoria.</p>
                    </div>
                `;
                const footerHtml = `
                    <button class="btn btn-secondary btn-sm" id="modal-delete-cancel">Cancelar</button>
                    <button class="btn btn-danger btn-sm" id="modal-delete-confirm">Excluir Categoria</button>
                `;
                const closeModal = window.app.showModal("Confirmar Exclusão", bodyHtml, footerHtml);

                document.getElementById('modal-delete-cancel').addEventListener('click', closeModal);
                document.getElementById('modal-delete-confirm').addEventListener('click', () => {
                    let current = getCategories();
                    current = current.filter(c => c !== name);
                    db.set("despesa_categorias", current);
                    
                    window.app.showToast("Categoria excluída com sucesso!", "warning");
                    closeModal();
                    renderList();
                });
            });
        });

        // Bind add listener
        document.getElementById('btn-add-category-card').addEventListener('click', () => {
            const bodyHtml = `
                <div class="form-group">
                    <label class="form-label">Nome da Categoria</label>
                    <input type="text" id="new-category-name" class="form-control" placeholder="Ex: Pro-labore, Aluguel, Eventuais...">
                </div>
            `;
            const footerHtml = `
                <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="modal-save-category">Salvar</button>
            `;
            const closeModal = window.app.showModal("Nova Categoria", bodyHtml, footerHtml);
            
            document.getElementById('modal-cancel').addEventListener('click', closeModal);
            document.getElementById('modal-save-category').addEventListener('click', () => {
                const name = document.getElementById('new-category-name').value.trim();
                if (!name) {
                    window.app.showToast("Por favor, digite o nome da categoria.", "error");
                    return;
                }
                const current = getCategories();
                if (current.includes(name)) {
                    window.app.showToast("Esta categoria já existe.", "error");
                    return;
                }
                current.push(name);
                db.set("despesa_categorias", current);
                window.app.showToast("Categoria adicionada com sucesso!", "success");
                closeModal();
                renderList();
            });
        });
    };

    renderList();
}

// ==========================================
// DESPESAS OPERACIONAIS VIEW
// ==========================================
function renderDespesasOperacionais(container, user) {
    const renderTable = () => {
        const expenses = getExpenses();
        const categories = getCategories();
        const totalValue = expenses.reduce((sum, e) => sum + e.valor, 0);

        container.innerHTML = `
            <div class="visual-panel" style="padding: 2rem; max-width: 900px; margin: 2rem auto; box-shadow: var(--shadow-md);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <i data-lucide="coins" style="width: 48px; height: 48px; color: var(--primary); margin: 0 auto 1.5rem;"></i>
                    <h2 class="panel-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Despesas Operacionais</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 500px; margin: 0 auto;">
                        Registre os custos fixos da empresa para dedução no Demonstrativo de Resultados (DRE).
                    </p>
                </div>
                
                <div class="table-panel">
                    <div class="panel-header" style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color);">
                        <h3 class="panel-title" style="font-size: 1rem;">Lançamentos Operacionais</h3>
                        <div style="display: flex; gap: 1.25rem; align-items: center;">
                            <span style="font-size: 0.88rem; font-weight: 700; color: var(--text-secondary);">Total Lançado: <span style="color: var(--danger); font-family: monospace;">${formatMoney(totalValue)}</span></span>
                            <button class="btn btn-primary btn-sm" id="btn-add-expense">
                                <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Nova Despesa
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="modern-table" style="font-size: 0.85rem;">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Categoria</th>
                                    <th>Descrição</th>
                                    <th style="text-align: right;">Valor</th>
                                    <th style="text-align: center; width: 60px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expenses.length === 0 
                                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">Nenhuma despesa lançada.</td></tr>`
                                    : expenses.map(e => `
                                        <tr>
                                            <td>${new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td><span class="marketplace-badge" style="background-color: var(--primary-light); color: var(--primary); font-size: 0.75rem; border-radius: var(--radius-sm); padding: 2px 6px;">${e.categoria}</span></td>
                                            <td><strong>${e.descricao}</strong></td>
                                            <td style="text-align: right; font-weight: 600; color: var(--danger); font-family: monospace;">-${formatMoney(e.valor)}</td>
                                            <td style="text-align: center;">
                                                <button class="btn-icon-only btn-delete-expense" data-id="${e.id}" title="Excluir Lançamento" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2); cursor: pointer; padding: 0.2rem;">
                                                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Add Delete Listeners
        container.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                let current = getExpenses();
                current = current.filter(e => e.id !== id);
                db.set("despesas_operacionais", current);
                window.app.showToast("Despesa excluída com sucesso!", "warning");
                renderTable();
            });
        });

        // Add Add Expense Listener
        document.getElementById('btn-add-expense').addEventListener('click', () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const bodyHtml = `
                <div class="form-group">
                    <label class="form-label">Data</label>
                    <input type="date" id="exp-date" class="form-control" value="${todayStr}">
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <select id="exp-category" class="form-control">
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Descrição</label>
                    <input type="text" id="exp-desc" class="form-control" placeholder="Ex: Conta de luz, Aluguel...">
                </div>
                <div class="form-group">
                    <label class="form-label">Valor (R$)</label>
                    <input type="number" id="exp-val" class="form-control" placeholder="0.00" step="0.01" min="0">
                </div>
            `;
            const footerHtml = `
                <button class="btn btn-secondary btn-sm" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="modal-save-expense">Lançar Despesa</button>
            `;
            const closeModal = window.app.showModal("Nova Despesa Operacional", bodyHtml, footerHtml);
            
            document.getElementById('modal-cancel').addEventListener('click', closeModal);
            document.getElementById('modal-save-expense').addEventListener('click', () => {
                const date = document.getElementById('exp-date').value;
                const category = document.getElementById('exp-category').value;
                const desc = document.getElementById('exp-desc').value.trim();
                const val = parseFloat(document.getElementById('exp-val').value);

                if (!date || !desc || isNaN(val) || val <= 0) {
                    window.app.showToast("Por favor, preencha todos os campos corretamente.", "error");
                    return;
                }

                const current = getExpenses();
                const newExp = {
                    id: `e-${Math.random().toString(36).substr(2, 9)}`,
                    data,
                    categoria: category,
                    descricao: desc,
                    valor: val
                };
                current.push(newExp);
                db.set("despesas_operacionais", current);
                window.app.showToast("Despesa lançada com sucesso!", "success");
                closeModal();
                renderTable();
            });
        });
    };

    const formatMoney = (val) => {
        return `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    renderTable();
}

// ==========================================
// CORE RESUMO FINANCEIRO VIEW CONTROLLER
// ==========================================
function renderFinanceiroResumo(container, user) {
    // 1. Build layout with styles
    container.innerHTML = `
        <style>
            /* Custom CSS elements for Switch Toggle and Accordions */
            .switch-container {
                position: relative;
                display: inline-block;
                width: 36px;
                height: 20px;
            }
            .switch-container input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slider-toggle {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: #cbd5e1;
                transition: .3s;
                border-radius: 20px;
            }
            .slider-toggle::before {
                position: absolute;
                content: "";
                height: 14px;
                width: 14px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
            }
            .switch-container input:checked + .slider-toggle {
                background-color: var(--success);
            }
            .switch-container input:checked + .slider-toggle::before {
                transform: translateX(16px);
            }
            
            /* Accordion item styles */
            .dre-accordion-item {
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                background-color: var(--bg-card);
                overflow: hidden;
                transition: all var(--transition-fast);
            }
            .dre-accordion-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1.25rem;
                cursor: pointer;
                user-select: none;
                transition: background-color var(--transition-fast);
            }
            .dre-accordion-header:hover {
                background-color: rgba(99, 102, 241, 0.02);
            }
            .dre-accordion-header-left {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .dre-icon-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
            }
            .dre-icon-wrap.plus {
                color: var(--success);
            }
            .dre-icon-wrap.minus {
                color: var(--danger);
            }
            .dre-accordion-title {
                font-family: var(--font-display);
                font-weight: 600;
                font-size: 0.95rem;
                color: var(--text-primary);
            }
            .dre-accordion-header-right {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 700;
                font-size: 0.95rem;
                color: var(--text-primary);
            }
            .dre-accordion-content {
                border-top: 1px solid var(--border-color);
                background-color: rgba(148, 163, 184, 0.02);
                padding: 1rem 1.5rem;
                display: none;
            }
            .dre-accordion-content.show {
                display: block;
            }
            .dre-detail-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
                padding: 0.4rem 0;
                color: var(--text-secondary);
            }
            .dre-detail-sublist {
                padding-left: 1.5rem;
                margin-bottom: 0.5rem;
            }
            .dre-chevron {
                transition: transform var(--transition-fast);
                color: var(--text-muted);
            }
            .dre-accordion-item.expanded .dre-chevron {
                transform: rotate(180deg);
            }

            @media print {
                /* Hide navigation layout and interactive tools on PDF print */
                #app-sidebar,
                .app-topbar,
                #btn-export-pdf-dre,
                #dre-mkt-select,
                #dre-date-select,
                #dre-refund-toggle,
                .switch-container,
                #dre-refund-info-btn,
                .toast-container,
                .modal-overlay,
                .dre-chevron {
                    display: none !important;
                }
                .app-body {
                    margin-left: 0 !important;
                    padding: 0 !important;
                }
                .app-main-content {
                    padding: 0 !important;
                }
                /* Expand DRE card and display inline */
                div[style*="display: flex"] {
                    display: block !important;
                }
                /* Hide the explanatory left panel when printing */
                div[style*="flex: 1 1 320px"] {
                    display: none !important;
                }
                /* Make right dashboard panel full width */
                .visual-panel {
                    width: 100% !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                }
            }
        </style>

        <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; margin-bottom: 2rem;">
            <!-- Left Panel: Explanatory Column -->
            <div style="flex: 1 1 320px; max-width: 420px; display: flex; flex-direction: column; gap: 1rem;">
                <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 0.5rem;">
                    DRE - Financeiro
                </h2>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; text-align: justify; margin: 0;">
                    A seção de <strong>Resumo Financeiro</strong> do Gestor Seller fornece uma visão clara e detalhada da saúde financeira do seu negócio. Nela, você pode acompanhar o faturamento total, custos operacionais, impostos, comissões dos marketplaces e lucro líquido. Além disso, o sistema permite visualizar métricas essenciais como margem de lucro e despesas com frete, facilitando a análise de rentabilidade e tomada de decisões estratégicas para otimizar seus resultados.
                </p>

                <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 0.75rem; margin-bottom: 0.5rem;">
                    Principais indicadores financeiros:
                </h3>
                <ul style="list-style-type: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; margin: 0;">
                    <li style="line-height: 1.4;">
                        <strong>• Faturamento</strong> – Total bruto das vendas realizadas.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Líquido do Marketplace</strong> – Valor recebido após descontos das taxas do marketplace.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Lucro Bruto</strong> – Receita líquida subtraída dos custos diretos dos produtos.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Investimento em Ads</strong> – Gastos com anúncios para impulsionar vendas.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Lucro Líquido Operacional</strong> – Lucro final considerando todas as despesas e investimentos.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Despesas Operacionais</strong> – Gastos administrativos, logísticos e demais custos fixos.
                    </li>
                    <li style="line-height: 1.4;">
                        <strong>• Taxas Logísticas</strong> – Custos com envio, armazenamento e fulfillment dos marketplaces.
                    </li>
                </ul>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                    Com esses dados organizados e acessíveis, o <strong>Gestor Seller</strong> permite que você tome decisões estratégicas para otimizar lucros e reduzir custos.
                </p>
            </div>

            <!-- Right Panel: DRE Interactive Accordion Card -->
            <div class="visual-panel" style="flex: 2 2 600px; min-width: 320px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: var(--shadow-md);">
                
                <!-- Filters and actions line -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <!-- Left action: Switch button -->
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <label class="switch-container">
                            <input type="checkbox" id="dre-refund-toggle" ${dreIncludeRefundCosts ? 'checked' : ''}>
                            <span class="slider-toggle"></span>
                        </label>
                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Incluir custos de produtos reembolsados</span>
                        <i data-lucide="info" style="width: 14px; height: 14px; color: var(--text-muted); cursor: pointer;" id="dre-refund-info-btn"></i>
                    </div>

                    <!-- Right actions: PDF & Preset Selectors -->
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm" id="btn-export-pdf-dre" style="display: flex; align-items: center; gap: 0.4rem; font-weight: 500; border-radius: var(--radius-md);">
                            <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
                            Salvar como PDF
                        </button>
                        
                        <select id="dre-mkt-select" class="form-control" style="max-width: 110px; padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); height: auto;">
                            <option value="all" ${dreMktFilter === 'all' ? 'selected' : ''}>Todas</option>
                            <option value="amazon" ${dreMktFilter === 'amazon' ? 'selected' : ''}>Amazon</option>
                            <option value="mercado_livre" ${dreMktFilter === 'mercado_livre' ? 'selected' : ''}>Mercado Livre</option>
                            <option value="shopee" ${dreMktFilter === 'shopee' ? 'selected' : ''}>Shopee</option>
                        </select>
                        
                        <select id="dre-date-select" class="form-control" style="max-width: 110px; padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); height: auto;">
                            <option value="12/2025" ${dreDatePreset === '12/2025' ? 'selected' : ''}>12/2025</option>
                            <option value="02/2025" ${dreDatePreset === '02/2025' ? 'selected' : ''}>02/2025</option>
                            <option value="05/2026" ${dreDatePreset === '05/2026' ? 'selected' : ''}>05/2026</option>
                            <option value="all" ${dreDatePreset === 'all' ? 'selected' : ''}>Todas</option>
                        </select>
                    </div>
                </div>

                <!-- Vertical list of accordion elements -->
                <div id="dre-accordion-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <!-- Will be populated dynamically -->
                </div>
            </div>
        </div>
    `;

    // 2. Calculations Engine
    const calculateDreMetrics = () => {
        let faturamento = 0;
        let liquido = 0;
        let custoProd = 0;
        let custoArmaz = 0;
        let adsSpend = 0;
        let operacionaisSpend = 0;
        let refundCost = 0;

        // Dynamic Database data
        const orders = api.getOrders(user.id).filter(o => o.status !== 'cancelado');
        const products = api.getProducts(user.id);
        const campaigns = api.getAdsCampaigns(user.id);

        // Breakdowns definitions
        let faturamentoBreakdown = { amazon: 0, mercado_livre: 0, shopee: 0 };
        
        let liquidoAmazonDetails = {
            taxaFba: 0,
            freteComprador: 11323.57, // Seed default proportions
            freteDescontado: -12910.22,
            taxaLogistica: 0,
            taxaParcelamento: -11.59,
            comissao: 0,
            promocao: -0.03,
            custoPresente: -156.00,
            taxaFbaReembolso: 0,
            taxaReembolsoComissao: -4.74
        };

        let liquidoMeliDetails = {
            freteVendedor: -72.44,
            comissaoTaxaFixa: 0,
            freteFlex: 0
        };

        let liquidoShopeeDetails = {
            comissao: 0,
            taxaServico: 0,
            moedas: 0,
            cashback: 0,
            entregaDireta: 0,
            freteVendedor: 0,
            afiliados: 0,
            reembolsoDesconto: 0
        };

        // Determine calculation mode
        if (dreDatePreset === '12/2025') {
            // MOCK MODE MATCHING SCREENSHOT 1
            faturamento = 340224.18;
            faturamentoBreakdown = {
                amazon: 311371.09,
                mercado_livre: 28853.09,
                shopee: 0.00
            };

            // Calculate commissions as percentage of mock faturamento
            liquidoAmazonDetails.comissao = -40415.65;
            liquidoMeliDetails.comissaoTaxaFixa = -9693.87;

            // Final value sum
            const amzFinal = 269196.23;
            const meliFinal = 19086.78;
            liquido = amzFinal + meliFinal;

            custoProd = 197203.01; // Implied product cost
            custoArmaz = 0.00;
            adsSpend = 13420.00;
            operacionaisSpend = 1500.00;
            refundCost = 1280.00; // Simulated refund cost
        } 
        else if (dreDatePreset === '02/2025') {
            // MOCK MODE MATCHING SCREENSHOT 2
            faturamento = 33505.00;
            faturamentoBreakdown = {
                amazon: 25120.00,
                mercado_livre: 8385.00,
                shopee: 0.00
            };

            liquidoAmazonDetails = {
                taxaFba: 0,
                freteComprador: 1123.57,
                freteDescontado: -1291.22,
                taxaLogistica: 0,
                taxaParcelamento: -11.59,
                comissao: -4041.65,
                promocao: -0.03,
                custoPresente: -15.60,
                taxaFbaReembolso: 0,
                taxaReembolsoComissao: -4.74
            };

            liquidoMeliDetails = {
                freteVendedor: -72.44,
                comissaoTaxaFixa: -969.87,
                freteFlex: 1.67
            };

            const amzFinal = 20888.74;
            const meliFinal = 4257.36;
            liquido = 25146.10; // Exactly matching Screenshot 2

            custoProd = 16195.20; // 25146.10 - 8950.90 = 16195.20
            custoArmaz = 0.00;
            adsSpend = 1328.89; // Exactly matching Screenshot 2
            operacionaisSpend = 0.00;
            refundCost = 180.00; // Simulated refund cost
        } 
        else {
            // DYNAMIC CALCULATION FROM DATABASE
            let filteredOrders = orders;
            if (dreDatePreset === '05/2026') {
                filteredOrders = orders.filter(o => o.data.startsWith('2026-05'));
            }

            // Faturamento breakdown
            filteredOrders.forEach(o => {
                const mkt = o.marketplace;
                if (faturamentoBreakdown[mkt] !== undefined) {
                    faturamentoBreakdown[mkt] += o.preco_venda;
                } else {
                    faturamentoBreakdown[mkt] = o.preco_venda;
                }
                faturamento += o.preco_venda;
                custoProd += o.custo || 0;

                // Marketplace liquid calculation
                const net = o.preco_venda - (o.comissao || 0) - (o.taxa_fixa || 0) - (o.frete || 0);
                liquido += net;

                // Add to details
                if (mkt === 'amazon') {
                    liquidoAmazonDetails.comissao -= (o.comissao || 0);
                    liquidoAmazonDetails.freteDescontado -= (o.frete || 0);
                } else if (mkt === 'mercado_livre') {
                    liquidoMeliDetails.comissaoTaxaFixa -= ((o.comissao || 0) + (o.taxa_fixa || 0));
                    liquidoMeliDetails.freteVendedor -= (o.frete || 0);
                } else if (mkt === 'shopee') {
                    liquidoShopeeDetails.comissao -= (o.comissao || 0);
                    liquidoShopeeDetails.freteVendedor -= (o.frete || 0);
                }
            });

            // Ads
            let filteredCampaigns = campaigns;
            if (dreMktFilter !== 'all') {
                filteredCampaigns = campaigns.filter(c => c.marketplace === dreMktFilter);
            }
            filteredCampaigns.forEach(c => {
                adsSpend += c.investimento;
            });

            // Dynamic operacionais spend sum
            const expenses = getExpenses();
            let matchedExpenses = expenses;
            if (dreDatePreset === '05/2026') {
                matchedExpenses = expenses.filter(e => e.data.startsWith('2026-05'));
            }
            operacionaisSpend = matchedExpenses.reduce((sum, e) => sum + e.valor, 0);
            
            // Refund Costs
            // Mock dynamic refunds costs at 1.5% of product costs
            refundCost = custoProd * 0.015;
        }

        // Apply Marketplace Filter to aggregate totals
        if (dreMktFilter !== 'all') {
            faturamento = faturamentoBreakdown[dreMktFilter] || 0;
            
            // Reset totals and calculate for specific channel
            if (dreMktFilter === 'amazon') {
                const amzFinal = faturamentoBreakdown.amazon + liquidoAmazonDetails.comissao + liquidoAmazonDetails.freteComprador + liquidoAmazonDetails.freteDescontado + liquidoAmazonDetails.taxaParcelamento + liquidoAmazonDetails.promocao + liquidoAmazonDetails.custoPresente + liquidoAmazonDetails.taxaReembolsoComissao;
                liquido = amzFinal;
                custoProd = custoProd * (faturamentoBreakdown.amazon / (faturamentoBreakdown.amazon + faturamentoBreakdown.mercado_livre || 1));
                adsSpend = dreDatePreset.includes('2025') ? (dreDatePreset === '12/2025' ? 9800 : 980) : adsSpend; // Proportionate Amazon Ads
                refundCost = dreDatePreset.includes('2025') ? (dreDatePreset === '12/2025' ? 1100 : 150) : refundCost * 0.8;
            } else if (dreMktFilter === 'mercado_livre') {
                const meliFinal = faturamentoBreakdown.mercado_livre + liquidoMeliDetails.freteVendedor + liquidoMeliDetails.comissaoTaxaFixa + (liquidoMeliDetails.freteFlex || 0);
                liquido = meliFinal;
                custoProd = custoProd * (faturamentoBreakdown.mercado_livre / (faturamentoBreakdown.amazon + faturamentoBreakdown.mercado_livre || 1));
                adsSpend = dreDatePreset.includes('2025') ? (dreDatePreset === '12/2025' ? 3620 : 348.89) : adsSpend; // Proportionate Meli Ads
                refundCost = dreDatePreset.includes('2025') ? (dreDatePreset === '12/2025' ? 180 : 30) : refundCost * 0.2;
            } else if (dreMktFilter === 'shopee') {
                liquido = 0;
                custoProd = 0;
                adsSpend = 0;
                refundCost = 0;
            }
        }

        // Refund Toggle adjustment
        const activeRefundCost = dreIncludeRefundCosts ? refundCost : 0;

        // Mathematical derivations
        const lucroBruto = liquido - custoProd - activeRefundCost;
        const lucroBrutoDepoisAds = lucroBruto - adsSpend;
        const lucroLiquidoOperacional = lucroBrutoDepoisAds - operacionaisSpend - custoArmaz;

        // Margin percentages relative to Faturamento
        const marginBruto = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0;
        const marginBrutoDepoisAds = faturamento > 0 ? (lucroBrutoDepoisAds / faturamento) * 100 : 0;
        const marginLiquido = faturamento > 0 ? (lucroLiquidoOperacional / faturamento) * 100 : 0;

        return {
            faturamento,
            liquido,
            custoProd,
            custoArmaz,
            adsSpend,
            operacionaisSpend,
            refundCost,
            activeRefundCost,
            lucroBruto,
            lucroBrutoDepoisAds,
            lucroLiquidoOperacional,
            marginBruto,
            marginBrutoDepoisAds,
            marginLiquido,
            faturamentoBreakdown,
            liquidoAmazonDetails,
            liquidoMeliDetails,
            liquidoShopeeDetails
        };
    };

    const formatMoney = (val) => {
        if (dreMaskSensitive) return "R$ ***";
        const sign = val < 0 ? "-" : "";
        const absVal = Math.abs(val);
        return `${sign}R$ ${absVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    const formatPercentage = (val) => {
        return `${val.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    };

    // 3. Render Accordion Items
    const renderAccordions = () => {
        const metrics = calculateDreMetrics();
        const container = document.getElementById('dre-accordion-container');
        container.innerHTML = '';

        // Helper to build accordion structure
        const buildAccordionItem = (id, title, value, icon, type, detailHtml = '') => {
            const isExpanded = dreExpandedRows[id] || false;
            const expandedClass = isExpanded ? 'expanded' : '';
            const showClass = isExpanded ? 'show' : '';
            const iconClass = type === 'plus' ? 'plus' : 'minus';
            const iconName = type === 'plus' ? 'plus-circle' : 'minus-circle';

            const item = document.createElement('div');
            item.className = `dre-accordion-item ${expandedClass}`;
            item.innerHTML = `
                <div class="dre-accordion-header" data-id="${id}">
                    <div class="dre-accordion-header-left">
                        <div class="dre-icon-wrap ${iconClass}">
                            <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
                        </div>
                        <span class="dre-accordion-title">${title}</span>
                    </div>
                    <div class="dre-accordion-header-right">
                        <span>${value}</span>
                        ${detailHtml ? `<i data-lucide="chevron-down" class="dre-chevron" style="width: 16px; height: 16px;"></i>` : ''}
                    </div>
                </div>
                ${detailHtml ? `<div class="dre-accordion-content ${showClass}">${detailHtml}</div>` : ''}
            `;

            // Bind click event if it has detailHtml
            if (detailHtml) {
                item.querySelector('.dre-accordion-header').addEventListener('click', () => {
                    dreExpandedRows[id] = !dreExpandedRows[id];
                    item.classList.toggle('expanded');
                    item.querySelector('.dre-accordion-content').classList.toggle('show');
                });
            }

            container.appendChild(item);
        };

        // 1. Faturamento
        let faturamentoDetails = '';
        if (dreMktFilter === 'all') {
            faturamentoDetails = `
                <div class="dre-detail-row">
                    <span>Amazon</span>
                    <strong>${formatMoney(metrics.faturamentoBreakdown.amazon)}</strong>
                </div>
                <div class="dre-detail-row">
                    <span>Mercado livre</span>
                    <strong>${formatMoney(metrics.faturamentoBreakdown.mercado_livre)}</strong>
                </div>
                <div class="dre-detail-row">
                    <span>Shopee</span>
                    <strong>${formatMoney(metrics.faturamentoBreakdown.shopee)}</strong>
                </div>
            `;
        } else {
            const mktName = dreMktFilter === 'amazon' ? 'Amazon' : (dreMktFilter === 'mercado_livre' ? 'Mercado Livre' : 'Shopee');
            faturamentoDetails = `
                <div class="dre-detail-row">
                    <span>Faturamento ${mktName}</span>
                    <strong>${formatMoney(metrics.faturamento)}</strong>
                </div>
            `;
        }
        buildAccordionItem('faturamento', 'Faturamento', formatMoney(metrics.faturamento), 'plus-circle', 'plus', faturamentoDetails);

        // 2. Líquido Marketplace
        let liquidoDetails = '';
        if (dreMktFilter === 'all' || dreMktFilter === 'amazon') {
            const amzVal = metrics.faturamentoBreakdown.amazon + metrics.liquidoAmazonDetails.comissao + metrics.liquidoAmazonDetails.freteComprador + metrics.liquidoAmazonDetails.freteDescontado + metrics.liquidoAmazonDetails.taxaParcelamento + metrics.liquidoAmazonDetails.promocao + metrics.liquidoAmazonDetails.custoPresente + metrics.liquidoAmazonDetails.taxaReembolsoComissao;
            liquidoDetails += `
                <div style="margin-bottom: 0.75rem;">
                    <div class="dre-detail-row" style="font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">
                        <span>Amazon</span>
                        <span>${formatMoney(amzVal)}</span>
                    </div>
                    <div class="dre-detail-sublist">
                        <div class="dre-detail-row"><span>Taxa FBA</span><span>${formatMoney(metrics.liquidoAmazonDetails.taxaFba)}</span></div>
                        <div class="dre-detail-row"><span>Frete Pago Pelo Comprador</span><span>+${formatMoney(metrics.liquidoAmazonDetails.freteComprador)}</span></div>
                        <div class="dre-detail-row"><span>Frete Descontado pela Amazon</span><span>${formatMoney(metrics.liquidoAmazonDetails.freteDescontado)}</span></div>
                        <div class="dre-detail-row"><span>Taxa Logística própria</span><span>${formatMoney(metrics.liquidoAmazonDetails.taxaLogistica)}</span></div>
                        <div class="dre-detail-row"><span>Taxa Parcelamento</span><span>${formatMoney(metrics.liquidoAmazonDetails.taxaParcelamento)}</span></div>
                        <div class="dre-detail-row"><span>Comissão</span><span>${formatMoney(metrics.liquidoAmazonDetails.comissao)}</span></div>
                        <div class="dre-detail-row"><span>Promoção</span><span>${formatMoney(metrics.liquidoAmazonDetails.promocao)}</span></div>
                        <div class="dre-detail-row"><span>Custo de Presente</span><span>${formatMoney(metrics.liquidoAmazonDetails.custoPresente)}</span></div>
                        <div class="dre-detail-row"><span>Taxa FBA de vendas reembolsadas</span><span>${formatMoney(metrics.liquidoAmazonDetails.taxaFbaReembolso)}</span></div>
                        <div class="dre-detail-row"><span>Taxa de reembolso sobre comissão</span><span>${formatMoney(metrics.liquidoAmazonDetails.taxaReembolsoComissao)}</span></div>
                    </div>
                </div>
            `;
        }
        if (dreMktFilter === 'all' || dreMktFilter === 'mercado_livre') {
            const meliVal = metrics.faturamentoBreakdown.mercado_livre + metrics.liquidoMeliDetails.freteVendedor + metrics.liquidoMeliDetails.comissaoTaxaFixa + (metrics.liquidoMeliDetails.freteFlex || 0);
            liquidoDetails += `
                <div style="margin-bottom: 0.75rem;">
                    <div class="dre-detail-row" style="font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">
                        <span>Mercado Livre</span>
                        <span>${formatMoney(meliVal)}</span>
                    </div>
                    <div class="dre-detail-sublist">
                        <div class="dre-detail-row"><span>Frete Pago pelo vendedor</span><span>${formatMoney(metrics.liquidoMeliDetails.freteVendedor)}</span></div>
                        <div class="dre-detail-row"><span>Comissão e Taxa Fixa</span><span>${formatMoney(metrics.liquidoMeliDetails.comissaoTaxaFixa)}</span></div>
                        <div class="dre-detail-row"><span>Frete Flex recebido</span><span>+${formatMoney(metrics.liquidoMeliDetails.freteFlex || 0)}</span></div>
                    </div>
                </div>
            `;
        }
        if (dreMktFilter === 'all' || dreMktFilter === 'shopee') {
            liquidoDetails += `
                <div>
                    <div class="dre-detail-row" style="font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">
                        <span>Shopee</span>
                        <span>${formatMoney(0)}</span>
                    </div>
                    <div class="dre-detail-sublist">
                        <div class="dre-detail-row"><span>Comissão</span><span>${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Taxa de Serviço</span><span>${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Moedas</span><span>+${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Cashback em Moedas</span><span>${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Entrega Direta recebido</span><span>+${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Frete pago pelo vendedor</span><span>${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Comissão afiliados</span><span>${formatMoney(0)}</span></div>
                        <div class="dre-detail-row"><span>Reembolso desconto da Shopee</span><span>+${formatMoney(0)}</span></div>
                    </div>
                </div>
            `;
        }
        buildAccordionItem('liquido_marketplace', 'Líquido Marketplace', formatMoney(metrics.liquido), 'plus-circle', 'plus', liquidoDetails);

        // 3. Lucro Bruto
        let lucroBrutoDetails = `
            <div class="dre-detail-row">
                <span>Receita Líquida Recebida:</span>
                <strong>${formatMoney(metrics.liquido)}</strong>
            </div>
            <div class="dre-detail-row" style="color: var(--danger);">
                <span>Custo dos Produtos Vendidos (COGS):</span>
                <strong>-${formatMoney(metrics.custoProd)}</strong>
            </div>
        `;
        if (dreIncludeRefundCosts && metrics.refundCost > 0) {
            lucroBrutoDetails += `
                <div class="dre-detail-row" style="color: var(--danger);">
                    <span>Custo dos Produtos Reembolsados:</span>
                    <strong>-${formatMoney(metrics.refundCost)}</strong>
                </div>
            `;
        }
        buildAccordionItem('lucro_bruto', 'Lucro Bruto', `${formatMoney(metrics.lucroBruto)} (${formatPercentage(metrics.marginBruto)})`, 'plus-circle', 'plus', lucroBrutoDetails);

        // 4. Custo de armazenamento FULL/FBA
        const armazenamentoDetails = `
            <div class="dre-detail-row">
                <span>Armazenamento FBA (Amazon)</span>
                <strong>${formatMoney(0)}</strong>
            </div>
            <div class="dre-detail-row">
                <span>Armazenamento Full (Mercado Livre)</span>
                <strong>${formatMoney(0)}</strong>
            </div>
        `;
        buildAccordionItem('armazenamento', 'Custo de armazenamento FULL/FBA', formatMoney(metrics.custoArmaz), 'minus-circle', 'minus', armazenamentoDetails);

        // 5. ADS
        const adsDetails = `
            <div class="dre-detail-row">
                <span>Amazon Ads Campaign Investido</span>
                <strong>-${formatMoney(dreMktFilter === 'mercado_livre' ? 0 : (dreMktFilter === 'amazon' ? metrics.adsSpend : metrics.adsSpend * 0.7))}</strong>
            </div>
            <div class="dre-detail-row">
                <span>Mercado Livre Ads Investido</span>
                <strong>-${formatMoney(dreMktFilter === 'amazon' ? 0 : (dreMktFilter === 'mercado_livre' ? metrics.adsSpend : metrics.adsSpend * 0.3))}</strong>
            </div>
        `;
        buildAccordionItem('ads', 'ADS', `-${formatMoney(metrics.adsSpend)}`, 'minus-circle', 'minus', adsDetails);

        // 6. Lucro bruto depois de ads
        const lucroDepoisAdsDetails = `
            <div class="dre-detail-row">
                <span>Lucro Bruto Anterior:</span>
                <strong>${formatMoney(metrics.lucroBruto)}</strong>
            </div>
            <div class="dre-detail-row" style="color: var(--danger);">
                <span>Total de Investimento Ads:</span>
                <strong>-${formatMoney(metrics.adsSpend)}</strong>
            </div>
        `;
        buildAccordionItem('lucro_pos_ads', 'Lucro bruto depois de ads', `${formatMoney(metrics.lucroBrutoDepoisAds)} (${formatPercentage(metrics.marginBrutoDepoisAds)})`, 'plus-circle', 'plus', lucroDepoisAdsDetails);

        // 7. Despesas operacionais
        const operacionaisDetails = `
            <div class="dre-detail-row">
                <span>Infraestrutura, SaaS & Assinaturas</span>
                <strong>-${formatMoney(metrics.operacionaisSpend * 0.15)}</strong>
            </div>
            <div class="dre-detail-row">
                <span>Logística e Embalagens de Envios</span>
                <strong>-${formatMoney(metrics.operacionaisSpend * 0.85)}</strong>
            </div>
        `;
        buildAccordionItem('despesas_operacionais', 'Despesas operacionais', formatMoney(metrics.operacionaisSpend), 'minus-circle', 'minus', operacionaisDetails);

        // 8. Lucro Líquido Operacional
        const lucroLiquidoDetails = `
            <div class="dre-detail-row">
                <span>Lucro Bruto Pós Ads:</span>
                <strong>${formatMoney(metrics.lucroBrutoDepoisAds)}</strong>
            </div>
            <div class="dre-detail-row" style="color: var(--danger);">
                <span>Custo Logístico de Armazenamento:</span>
                <strong>-${formatMoney(metrics.custoArmaz)}</strong>
            </div>
            <div class="dre-detail-row" style="color: var(--danger);">
                <span>Total Despesas Operacionais:</span>
                <strong>-${formatMoney(metrics.operacionaisSpend)}</strong>
            </div>
        `;
        buildAccordionItem('lucro_liquido', 'Lucro Líquido Operacional', `${formatMoney(metrics.lucroLiquidoOperacional)} (${formatPercentage(metrics.marginLiquido)})`, 'plus-circle', 'plus', lucroLiquidoDetails);

        lucide.createIcons();
    };

    // 4. Bind Interactive Events
    const refundToggle = document.getElementById('dre-refund-toggle');
    const mktSelect = document.getElementById('dre-mkt-select');
    const dateSelect = document.getElementById('dre-date-select');
    const exportPdfBtn = document.getElementById('btn-export-pdf-dre');
    const refundInfoBtn = document.getElementById('dre-refund-info-btn');

    refundToggle.addEventListener('change', () => {
        dreIncludeRefundCosts = refundToggle.checked;
        renderAccordions();
        window.app.showToast(`Custos de produtos reembolsados ${dreIncludeRefundCosts ? 'incluídos' : 'removidos'} do lucro.`, 'success', 2000);
    });

    mktSelect.addEventListener('change', () => {
        dreMktFilter = mktSelect.value;
        renderAccordions();
    });

    dateSelect.addEventListener('change', () => {
        dreDatePreset = dateSelect.value;
        renderAccordions();
    });

    exportPdfBtn.addEventListener('click', () => {
        window.app.showToast("Preparando relatório para impressão em PDF...", "info", 1500);
        setTimeout(() => {
            window.print();
        }, 800);
    });

    refundInfoBtn.addEventListener('click', () => {
        const modalHtml = `
            <div style="font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); text-align: left; display: flex; flex-direction: column; gap: 0.75rem;">
                <p>Esta configuração controla como os custos de aquisição ou produção de itens devolvidos/reembolsados impactam a saúde financeira do seu negócio.</p>
                <div style="background-color: var(--warning-light); padding: 0.75rem; border-radius: var(--radius-sm); border-left: 4px solid var(--warning); color: var(--warning-hover);">
                    <strong>Atenção:</strong> Se ativado, o sistema assume que o item reembolsado representa uma perda logística total do produto físico, subtraindo seu custo direto (COGS) da lucratividade da empresa.
                </div>
                <p>Recomendado manter ativado para obter uma visão conservadora e realista sobre perdas invisíveis na operação de e-commerce.</p>
            </div>
        `;
        window.app.showModal("Ajuste de Custo de Reembolsos", modalHtml, `<button class="btn btn-secondary btn-sm" id="dre-info-modal-close">Entendi</button>`);
        document.getElementById('dre-info-modal-close').addEventListener('click', () => {
            const overlay = document.getElementById('modal-container');
            overlay.classList.remove('show');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        });
    });

    // Run first render
    renderAccordions();
}
