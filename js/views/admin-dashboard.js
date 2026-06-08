/* --- Admin View Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';
import { PLANS } from '../db.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/admin', renderAdminDashboard);
router.on('#/admin/clientes', renderClientsList);
router.on('#/admin/assinaturas', renderSubscriptionsList);
router.on('#/admin/planos', renderPlansList);
router.on('#/admin/relatorios', renderAdminReports);
router.on('#/admin/logs', renderSystemLogs);
router.on('#/admin/configuracoes', renderAdminSettings);

// ==========================================
// RENDERERS
// ==========================================

function renderAdminDashboard(container, user) {
    const metrics = api.getAdminDashboardMetrics();
    const clients = api.getClients().slice(0, 5); // show last 5 clients

    container.innerHTML = `
        <!-- Metrics Summary Cards -->
        <div class="metrics-grid">
            <div class="metric-card primary-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Clientes Totais</span>
                    <div class="metric-card-icon"><i data-lucide="users"></i></div>
                </div>
                <div class="metric-card-value">${metrics.totalClients}</div>
                <div class="metric-card-footer">
                    <span class="metric-trend up"><i data-lucide="arrow-up-right"></i>${metrics.growthRate}</span>
                    <span class="metric-label">Crescimento mensal</span>
                </div>
            </div>

            <div class="metric-card success-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Clientes Ativos</span>
                    <div class="metric-card-icon" style="color: var(--success); background-color: var(--success-light);"><i data-lucide="user-check"></i></div>
                </div>
                <div class="metric-card-value">${metrics.activeClients}</div>
                <div class="metric-card-footer">
                    <span class="metric-label">Em dia com o serviço</span>
                </div>
            </div>

            <div class="metric-card danger-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Inadimplentes</span>
                    <div class="metric-card-icon" style="color: var(--danger); background-color: var(--danger-light);"><i data-lucide="user-x"></i></div>
                </div>
                <div class="metric-card-value">${metrics.blockedClients}</div>
                <div class="metric-card-footer">
                    <span class="metric-trend down"><i data-lucide="arrow-down-right"></i>3.2%</span>
                    <span class="metric-label">Taxa de Churn</span>
                </div>
            </div>

            <div class="metric-card warning-accent">
                <div class="metric-card-header">
                    <span class="metric-card-title">Receita Recorrente (MRR)</span>
                    <div class="metric-card-icon" style="color: var(--warning); background-color: var(--warning-light);"><i data-lucide="dollar-sign"></i></div>
                </div>
                <div class="metric-card-value">R$ ${parseFloat(metrics.mrr).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="metric-card-footer">
                    <span class="metric-label">Simulado com planos ativos</span>
                </div>
            </div>
        </div>

        <div class="dashboard-row">
            <!-- Growth Chart panel -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Evolução do Faturamento (MRR)</h2>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Últimos 6 meses</span>
                </div>
                <div class="chart-container">
                    <svg class="svg-chart" viewBox="0 0 600 280">
                        <defs>
                            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.4"/>
                                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
                            </linearGradient>
                        </defs>
                        <!-- Grid Lines -->
                        <line class="chart-grid-line" x1="50" y1="50" x2="550" y2="50"></line>
                        <line class="chart-grid-line" x1="50" y1="120" x2="550" y2="120"></line>
                        <line class="chart-grid-line" x1="50" y1="190" x2="550" y2="190"></line>
                        
                        <!-- Axis Labels -->
                        <text class="chart-axis-text" x="30" y="55">R$ 5k</text>
                        <text class="chart-axis-text" x="30" y="125">R$ 3k</text>
                        <text class="chart-axis-text" x="30" y="195">R$ 1k</text>
                        
                        <text class="chart-axis-text" x="70" y="240">Dez</text>
                        <text class="chart-axis-text" x="160" y="240">Jan</text>
                        <text class="chart-axis-text" x="250" y="240">Fev</text>
                        <text class="chart-axis-text" x="340" y="240">Mar</text>
                        <text class="chart-axis-text" x="430" y="240">Abr</text>
                        <text class="chart-axis-text" x="520" y="240">Mai</text>

                        <!-- Area Gradient -->
                        <path class="chart-line-gradient" d="M 75 220 L 75 180 L 165 170 L 255 160 L 345 130 L 435 90 L 525 60 L 525 220 Z"></path>

                        <!-- Chart Line -->
                        <path class="chart-line" d="M 75 180 L 165 170 L 255 160 L 345 130 L 435 90 L 525 60"></path>

                        <!-- Chart Dots -->
                        <circle class="chart-dot" cx="75" cy="180" r="5"></circle>
                        <circle class="chart-dot" cx="165" cy="170" r="5"></circle>
                        <circle class="chart-dot" cx="255" cy="160" r="5"></circle>
                        <circle class="chart-dot" cx="345" cy="130" r="5"></circle>
                        <circle class="chart-dot" cx="435" cy="90" r="5"></circle>
                        <circle class="chart-dot" cx="525" cy="60" r="5"></circle>
                    </svg>
                </div>
            </div>

            <!-- Platform Stats Panel -->
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Status da Plataforma</h2>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <span style="font-size: 0.9rem; font-weight: 500;"><i data-lucide="radio" style="width: 16px; height: 16px; color: var(--success); vertical-align: middle; margin-right: 6px;"></i> Usuários Online</span>
                        <strong style="font-size: 1.1rem; color: var(--success); font-family: var(--font-display);">${metrics.onlineUsers}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <span style="font-size: 0.9rem; font-weight: 500;"><i data-lucide="user-plus" style="width: 16px; height: 16px; color: var(--primary); vertical-align: middle; margin-right: 6px;"></i> Novos Clientes (30d)</span>
                        <strong style="font-size: 1.1rem; font-family: var(--font-display);">${metrics.newSignups}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9rem; font-weight: 500;"><i data-lucide="activity" style="width: 16px; height: 16px; color: var(--info); vertical-align: middle; margin-right: 6px;"></i> Tempo de Atividade</span>
                        <strong style="font-size: 0.9rem; font-family: var(--font-display);">99.98%</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Registered Clients -->
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Clientes Registrados Recentemente</h2>
                <a href="#/admin/clientes" class="btn btn-secondary btn-sm">Ver Todos</a>
            </div>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Cadastro</th>
                            <th>Plano</th>
                            <th>Assinatura</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(c => `
                            <tr>
                                <td>
                                    <div style="display: flex; flex-direction: column;">
                                        <strong style="color: var(--text-primary); font-weight: 600;">${c.nome}</strong>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${c.email}</span>
                                    </div>
                                </td>
                                <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                                <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary);">${PLANS[c.plano]?.name || c.plano}</span></td>
                                <td><span class="badge ${c.status_assinatura === 'ativo' ? 'status-pago' : 'status-inadimplente'}">${c.status_assinatura === 'ativo' ? 'Ativa' : 'Atrasada'}</span></td>
                                <td><span class="badge ${c.status === 'ativo' ? 'status-active' : 'status-blocked'}">${c.status === 'ativo' ? 'Ativo' : 'Bloqueado'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderClientsList(container) {
    const clients = api.getClients();

    container.innerHTML = `
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Base de Clientes SaaS</h2>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${clients.length} clientes cadastrados</span>
            </div>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>E-mail</th>
                            <th>Cadastro</th>
                            <th>Plano</th>
                            <th>Status</th>
                            <th style="text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(c => `
                            <tr>
                                <td><strong>${c.nome}</strong></td>
                                <td>${c.email}</td>
                                <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                                <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary);">${PLANS[c.plano]?.name || 'Plano Pro'}</span></td>
                                <td>
                                    <span class="badge ${c.status === 'ativo' ? 'status-active' : 'status-blocked'}">
                                        ${c.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                                        <button class="btn btn-secondary btn-sm btn-reset" data-id="${c.id}" data-nome="${c.nome}" title="Resetar Senha">
                                            <i data-lucide="key-round" style="width: 14px; height: 14px;"></i>
                                        </button>
                                        ${c.status === 'ativo' 
                                            ? `<button class="btn btn-danger btn-sm btn-status" data-id="${c.id}" data-action="block" title="Bloquear Cliente">Bloquear</button>`
                                            : `<button class="btn btn-primary btn-sm btn-status" style="background-color: var(--success); color: white;" data-id="${c.id}" data-action="unblock" title="Liberar Cliente">Liberar</button>`
                                        }
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Bind action events
    // 1. Block/Unblock Actions
    container.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            
            if (action === 'block') {
                api.blockClient(userId);
                window.app.showToast("Cliente bloqueado com sucesso.", "success");
            } else {
                api.unblockClient(userId);
                window.app.showToast("Cliente desbloqueado com sucesso.", "success");
            }
            renderClientsList(container); // re-render
        });
    });

    // 2. Reset Password Modal
    container.querySelectorAll('.btn-reset').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-nome');

            const bodyHtml = `
                <p style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">Defina a nova senha temporária para <strong>${name}</strong>:</p>
                <div class="form-group">
                    <label class="form-label" for="reset-pwd-input">Nova Senha</label>
                    <input type="password" id="reset-pwd-input" class="form-control" placeholder="Mínimo 4 caracteres" required>
                </div>
            `;
            const footerHtml = `
                <button class="btn btn-secondary btn-sm" id="modal-cancel-btn">Cancelar</button>
                <button class="btn btn-danger btn-sm" id="modal-save-btn">Resetar Senha</button>
            `;

            const close = window.app.showModal(`Redefinir Senha — ${name}`, bodyHtml, footerHtml);
            
            document.getElementById('modal-cancel-btn').addEventListener('click', close);
            document.getElementById('modal-save-btn').addEventListener('click', () => {
                const newPassword = document.getElementById('reset-pwd-input').value;
                if (newPassword.length < 4) {
                    window.app.showToast("A senha precisa ter no mínimo 4 caracteres.", "warning");
                    return;
                }
                api.resetClientPassword(userId, newPassword);
                window.app.showToast("Senha do cliente redefinida.", "success");
                close();
            });
        });
    });
}

function renderSubscriptionsList(container) {
    const clients = api.getClients();

    container.innerHTML = `
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Assinaturas e Pagamentos</h2>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Acompanhamento de fluxo de caixa recorrente</span>
            </div>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Plano</th>
                            <th>Mensalidade</th>
                            <th>Próximo Vencimento</th>
                            <th>Status Assinatura</th>
                            <th>Método de Faturamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(c => `
                            <tr>
                                <td>
                                    <div style="display: flex; flex-direction: column;">
                                        <strong>${c.nome}</strong>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${c.email}</span>
                                    </div>
                                </td>
                                <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary);">${PLANS[c.plano]?.name || 'Plano Pro'}</span></td>
                                <td><strong>R$ ${(PLANS[c.plano]?.price || 19.90).toFixed(2)}</strong></td>
                                <td>${c.vencimento ? new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                <td>
                                    <span class="badge ${c.status_assinatura === 'ativo' ? 'status-pago' : 'status-inadimplente'}">
                                        ${c.status_assinatura === 'ativo' ? 'Paga' : 'Inadimplente'}
                                    </span>
                                </td>
                                <td>Cartão de Crédito (Gateway Stripe)</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderPlansList(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 0 auto; padding-top: 1rem;">
            <div class="metric-card primary-accent" style="align-items: center; text-align: center; padding: 2.5rem 1.5rem; position: relative;">
                <span class="badge" style="background-color: var(--primary-light); color: var(--primary); margin-bottom: 1rem; font-size: 0.8rem; font-weight:700;">Plano Comercializado</span>
                <h3 style="font-size: 1.8rem; font-family: var(--font-display); color: var(--text-primary); margin-bottom: 0.25rem;">Plano Único Pro</h3>
                <div style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">R$ 19,90<span style="font-size: 1rem; color: var(--text-muted);">/mês</span></div>
                <div class="dropdown-divider" style="width: 100%; margin: 1.5rem 0;"></div>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; text-align: left; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem; width: 100%;">
                    <li><i data-lucide="check" style="width: 16px; height: 16px; color: var(--success); float: left; margin-right: 8px;"></i> Cadastros de produtos ilimitados (Até 5.000 SKUs)</li>
                    <li><i data-lucide="check" style="width: 16px; height: 16px; color: var(--success); float: left; margin-right: 8px;"></i> Integrações completas com Mercado Livre, Shopee, Shein, etc.</li>
                    <li><i data-lucide="check" style="width: 16px; height: 16px; color: var(--success); float: left; margin-right: 8px;"></i> Alertas automatizados de prejuízos e margens baixas</li>
                    <li><i data-lucide="check" style="width: 16px; height: 16px; color: var(--success); float: left; margin-right: 8px;"></i> Relatório Venda a Venda detalhado</li>
                    <li><i data-lucide="check" style="width: 16px; height: 16px; color: var(--success); float: left; margin-right: 8px;"></i> Painel de tráfego Ads com ACOS, TACOS e ROAS</li>
                </ul>
                <button class="btn btn-primary" style="width: 100%; cursor: not-allowed;" disabled>Ativo para todos os Clientes</button>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderAdminReports(container) {
    container.innerHTML = `
        <div class="dashboard-row" style="grid-template-columns: 1fr;">
            <div class="visual-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Distribuição de Status de Assinantes</h2>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Auditoria de pagamentos</span>
                </div>
                <div class="chart-container" style="justify-content: space-around; padding: 2rem 0; flex-wrap: wrap; gap: 2rem;">
                    <!-- SVG Pie representation -->
                    <svg viewBox="0 0 200 200" style="width: 200px; height: 200px;">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border-color)" stroke-width="40" />
                        <!-- Ativos (80%) -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--success)" stroke-width="40" 
                                stroke-dasharray="402.1 502.6" stroke-dashoffset="0" transform="rotate(-90 100 100)" />
                        <!-- Inadimplentes (20%) -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--danger)" stroke-width="40" 
                                stroke-dasharray="100.5 502.6" stroke-dashoffset="-402.1" transform="rotate(-90 100 100)" />
                    </svg>
 
                    <div style="display: flex; flex-direction: column; gap: 1rem; justify-content: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; border-radius: var(--radius-sm); background-color: var(--success);"></div>
                            <span style="font-size: 0.9rem; font-weight: 500;">Assinantes Ativos (80%)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; border-radius: var(--radius-sm); background-color: var(--danger);"></div>
                            <span style="font-size: 0.9rem; font-weight: 500;">Contas em Atraso (20%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderSystemLogs(container) {
    const logs = api.getSystemLogs();

    container.innerHTML = `
        <div class="table-panel">
            <div class="panel-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h2 class="panel-title">Logs de Atividade do Sistema</h2>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Auditoria e rastreamento de ações dos usuários</span>
            </div>
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Usuário</th>
                            <th>E-mail</th>
                            <th>Ação Executada</th>
                            <th>Detalhes Técnicos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(l => `
                            <tr>
                                <td>${new Date(l.created_at).toLocaleDateString('pt-BR')} ${new Date(l.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td>
                                <td><strong>${l.usuario_nome}</strong></td>
                                <td>${l.usuario_email || '-'}</td>
                                <td><span class="badge" style="background-color: var(--border-color); color: var(--text-primary); font-weight: 600;">${l.acao}</span></td>
                                <td style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.detalhes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderAdminSettings(container) {
    container.innerHTML = `
        <div class="visual-panel" style="max-width: 650px;">
            <div class="panel-header">
                <h2 class="panel-title">Manutenção do Sistema</h2>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">Configure ou redefina o banco de dados de simulação da plataforma para os parâmetros padrão.</p>
            
            <div class="dropdown-divider" style="margin: 1.5rem 0;"></div>
            
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-danger" id="reset-database-btn">
                    <i data-lucide="refresh-cw"></i> Redefinir Banco para os Valores Originais
                </button>
            </div>
        </div>
    `;

    lucide.createIcons();

    document.getElementById('reset-database-btn').addEventListener('click', () => {
        if (confirm("ATENÇÃO: Isso apagará todos os novos produtos, alterações de taxas e cadastros que você efetuou durante o teste e recarregará a base original. Deseja continuar?")) {
            import('../db.js').then(module => {
                module.db.reset();
                window.app.showToast("Banco de dados resetado com sucesso!", "success");
                router.navigate('#/admin');
            });
        }
    });
}
