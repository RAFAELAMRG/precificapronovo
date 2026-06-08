/* --- Marketplace & Account Integrations Controller --- */
import { router } from '../router.js';
import { api } from '../api.js';

// Route registration
router.on('#/marketplaces', renderMarketplaceSettings);

// Module state to preserve active tab during re-renders
let currentActiveTab = 'fees';

function renderMarketplaceSettings(container, user) {
    const settings = api.getMarketplaceSettings();
    const integrations = api.getIntegrations();

    container.innerHTML = `
        <!-- Dynamic Sub-Nav Tab bar -->
        <div style="display: flex; gap: 1.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; padding-bottom: 0.1rem;">
            <button class="tab-toggle-btn ${currentActiveTab === 'fees' ? 'active' : ''}" id="tab-btn-fees" style="padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; border-bottom: 3px solid ${currentActiveTab === 'fees' ? 'var(--primary)' : 'transparent'}; color: ${currentActiveTab === 'fees' ? 'var(--primary)' : 'var(--text-secondary)'}; transition: all var(--transition-fast);">
                Taxas dos Canais
            </button>
            <button class="tab-toggle-btn ${currentActiveTab === 'integrations' ? 'active' : ''}" id="tab-btn-integrations" style="padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; border-bottom: 3px solid ${currentActiveTab === 'integrations' ? 'var(--primary)' : 'transparent'}; color: ${currentActiveTab === 'integrations' ? 'var(--primary)' : 'var(--text-secondary)'}; transition: all var(--transition-fast);">
                Contas Integradas (Simulação de API)
            </button>
        </div>

        <!-- TAB 1: FEES CONFIGURATION -->
        <div id="tab-content-fees" class="${currentActiveTab === 'fees' ? '' : 'hidden'}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 650px; margin: 0;">
                    Abaixo você pode customizar as taxas padrões cobradas por cada canal de venda. 
                    Ao salvar as alterações, <strong>todos os seus produtos cadastrados serão recalculados automaticamente</strong> com base nas novas taxas configuradas.
                </p>
                <button class="btn btn-secondary" id="add-mkt-btn">
                    <i data-lucide="plus"></i> Novo Marketplace
                </button>
            </div>

            <form id="marketplaces-settings-form">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    ${Object.values(settings).map(m => `
                        <div class="visual-panel" style="border-top: 4px solid var(--primary);">
                            <div class="panel-header" style="margin-bottom: 0.5rem;">
                                <span class="marketplace-badge ${m.id}" style="font-size: 0.9rem; padding: 4px 8px;">
                                    ${m.name}
                                </span>
                                <i data-lucide="store" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="fee-pct-${m.id}">Comissão Percentual (%)</label>
                                <input type="number" step="0.1" min="0" max="100" id="fee-pct-${m.id}" class="form-control" value="${m.percentFee}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="fee-flat-${m.id}">Taxa Fixa por Venda (R$)</label>
                                <input type="number" step="0.01" min="0" id="fee-flat-${m.id}" class="form-control" value="${m.flatFee}" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="ship-limit-${m.id}">Frete Grátis Obrigatório acima de (R$)</label>
                                <input type="number" step="1" min="0" id="ship-limit-${m.id}" class="form-control" value="${m.freeShippingThreshold}" required>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem;">
                    <i data-lucide="save"></i> Salvar Taxas e Atualizar Produtos
                </button>
            </form>
        </div>

        <!-- TAB 2: ACTIVE INTEGRATIONS (ML, Shopee, Shein, TikTok Shop) -->
        <div id="tab-content-integrations" class="${currentActiveTab === 'integrations' ? '' : 'hidden'}">
            <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 800px; margin-bottom: 2rem;">
                Conecte suas contas de marketplaces para <strong>sincronizar anúncios automaticamente</strong>. 
                O sistema fará a leitura de preços e avisará na hora caso identifique algum produto sendo vendido com prejuízo devido a taxas desatualizadas.
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
                <!-- BLING ERP CARD -->
                ${renderIntegrationCard('bling', 'Bling ERP (Integrador)', integrations.bling, 'purple-theme')}

                <!-- MERCADO LIVRE CARD -->
                ${renderIntegrationCard('mercado_livre', 'Mercado Livre', integrations.mercado_livre, 'yellow-theme')}
                
                <!-- SHOPEE CARD -->
                ${renderIntegrationCard('shopee', 'Shopee', integrations.shopee, 'orange-theme')}
                
                <!-- SHEIN CARD -->
                ${renderIntegrationCard('shein', 'Shein', integrations.shein, 'black-theme')}
                
                <!-- TIKTOK SHOP CARD -->
                ${renderIntegrationCard('tiktok_shop', 'TikTok Shop', integrations.tiktok_shop, 'cyan-theme')}
            </div>
        </div>
    `;

    lucide.createIcons();

    // ==========================================
    // TAB TRIGGER SWITCH LISTENERS
    // ==========================================
    const tabFeesBtn = document.getElementById('tab-btn-fees');
    const tabIntegrationsBtn = document.getElementById('tab-btn-integrations');
    const tabFeesContent = document.getElementById('tab-content-fees');
    const tabIntegrationsContent = document.getElementById('tab-content-integrations');

    const switchTab = (target) => {
        currentActiveTab = target;
        if (target === 'fees') {
            tabFeesBtn.style.borderBottom = '3px solid var(--primary)';
            tabFeesBtn.style.color = 'var(--primary)';
            tabIntegrationsBtn.style.borderBottom = '3px solid transparent';
            tabIntegrationsBtn.style.color = 'var(--text-secondary)';
            
            tabFeesContent.classList.remove('hidden');
            tabIntegrationsContent.classList.add('hidden');
        } else {
            tabIntegrationsBtn.style.borderBottom = '3px solid var(--primary)';
            tabIntegrationsBtn.style.color = 'var(--primary)';
            tabFeesBtn.style.borderBottom = '3px solid transparent';
            tabFeesBtn.style.color = 'var(--text-secondary)';
            
            tabIntegrationsContent.classList.remove('hidden');
            tabFeesContent.classList.add('hidden');
        }
    };

    tabFeesBtn.addEventListener('click', () => switchTab('fees'));
    tabIntegrationsBtn.addEventListener('click', () => switchTab('integrations'));

    // ==========================================
    // ACTIONS REGISTRATION - TAB 1: FEES
    // ==========================================
    const addMktBtn = document.getElementById('add-mkt-btn');
    if (addMktBtn) {
        addMktBtn.addEventListener('click', () => {
            const bodyHtml = `
                <form id="modal-mkt-form" class="auth-form" style="gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" for="m-mkt-name">Nome do Marketplace</label>
                        <input type="text" id="m-mkt-name" class="form-control" placeholder="Ex: AliExpress" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="m-mkt-pct">Comissão Percentual (%)</label>
                            <input type="number" step="0.1" min="0" max="100" id="m-mkt-pct" class="form-control" placeholder="10.0" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="m-mkt-flat">Taxa Fixa (R$)</label>
                            <input type="number" step="0.01" min="0" id="m-mkt-flat" class="form-control" placeholder="5.00" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="m-mkt-ship">Frete Grátis Obrigatório acima de (R$)</label>
                        <input type="number" step="1" min="0" id="m-mkt-ship" class="form-control" placeholder="100" required>
                    </div>
                </form>
            `;
            const footerHtml = `
                <button class="btn btn-secondary btn-sm" id="modal-cancel-btn">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="modal-save-btn">Cadastrar Canal</button>
            `;

            const close = window.app.showModal("Adicionar Novo Marketplace", bodyHtml, footerHtml);

            document.getElementById('modal-cancel-btn').addEventListener('click', close);
            document.getElementById('modal-save-btn').addEventListener('click', () => {
                const mktForm = document.getElementById('modal-mkt-form');
                if (!mktForm.reportValidity()) return;

                const name = document.getElementById('m-mkt-name').value;
                const percentFee = document.getElementById('m-mkt-pct').value;
                const flatFee = document.getElementById('m-mkt-flat').value;
                const shipThreshold = document.getElementById('m-mkt-ship').value;

                const res = api.addMarketplace(name, percentFee, flatFee, shipThreshold);
                if (res.success) {
                    window.app.showToast(`Marketplace '${name}' cadastrado com sucesso!`, "success");
                    close();
                    renderMarketplaceSettings(container, user); // re-render
                } else {
                    window.app.showToast(res.message, "error");
                }
            });
        });
    }

    const feesForm = document.getElementById('marketplaces-settings-form');
    if (feesForm) {
        feesForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const updatedSettings = {};
            Object.keys(settings).forEach(mktId => {
                updatedSettings[mktId] = {
                    id: mktId,
                    name: settings[mktId].name,
                    percentFee: parseFloat(document.getElementById(`fee-pct-${mktId}`).value) || 0,
                    flatFee: parseFloat(document.getElementById(`fee-flat-${mktId}`).value) || 0,
                    freeShippingThreshold: parseFloat(document.getElementById(`ship-limit-${mktId}`).value) || 0
                };
            });

            api.saveMarketplaceSettings(updatedSettings);
            window.app.showToast("Taxas de marketplaces salvas! Produtos recalculados com sucesso.", "success");
            router.navigate('#/dashboard');
        });
    }

    // ==========================================
    // ACTIONS REGISTRATION - TAB 2: INTEGRATIONS
    // ==========================================
    
    // 1. Bind Connect Buttons
    container.querySelectorAll('.btn-connect-api').forEach(btn => {
        btn.addEventListener('click', () => {
            const mktId = btn.getAttribute('data-mkt');
            const mktName = btn.getAttribute('data-mkt-name');

            const bodyHtml = `
                <form id="modal-connect-form" class="auth-form" style="gap: 1rem; text-align: center;">
                    <div class="logo-container" style="justify-content: center; margin-bottom: 0.5rem;">
                        <span class="marketplace-badge ${mktId}" style="font-size: 1rem; padding: 6px 12px;">${mktName}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        O sistema irá redirecioná-lo para autenticação de chaves de API segura do canal.
                    </p>
                    
                    <div class="form-group" style="text-align: left;">
                        <label class="form-label" for="conn-user">Identificador da Loja (Apelido)</label>
                        <input type="text" id="conn-user" class="form-control" placeholder="Ex: joao_vendas_${mktId}" required>
                    </div>
                    
                    <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <i data-lucide="shield-check" style="width: 14px; height: 14px; vertical-align: middle; color: var(--success); margin-right: 4px;"></i> Autenticação segura OAuth 2.0 SSL
                    </div>
                </form>
            `;

            const footerHtml = `
                <button class="btn btn-secondary btn-sm" id="conn-cancel-btn">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="conn-submit-btn">Autorizar Integração</button>
            `;

            const close = window.app.showModal(`Conectar Conta ${mktName}`, bodyHtml, footerHtml);

            document.getElementById('conn-cancel-btn').addEventListener('click', close);
            document.getElementById('conn-submit-btn').addEventListener('click', () => {
                const connForm = document.getElementById('modal-connect-form');
                if (!connForm.reportValidity()) return;

                const username = document.getElementById('conn-user').value;

                // Show dynamic spinner in modal
                const modalBody = document.querySelector('.modal-body');
                modalBody.innerHTML = `
                    <div style="text-align: center; padding: 2rem 0;">
                        <div class="logo-icon" style="margin: 0 auto 1.5rem; animation: spin 1s linear infinite; width: 42px; height: 42px;">
                            <i data-lucide="refresh-cw"></i>
                        </div>
                        <strong>Autenticando com o ${mktName}...</strong>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">Aguardando retorno do token OAuth...</p>
                    </div>
                `;
                document.querySelector('.modal-footer').classList.add('hidden');
                lucide.createIcons();

                setTimeout(() => {
                    api.connectIntegration(mktId, username);
                    window.app.showToast(`Conta '${username}' do ${mktName} integrada com sucesso!`, "success");
                    close();
                    renderMarketplaceSettings(container, user); // re-render
                }, 1500);
            });
        });
    });

    // 2. Bind Disconnect Buttons
    container.querySelectorAll('.btn-disconnect-api').forEach(btn => {
        btn.addEventListener('click', () => {
            const mktId = btn.getAttribute('data-mkt');
            const mktName = btn.getAttribute('data-mkt-name');

            if (confirm(`Deseja realmente desconectar a conta do ${mktName}? Todos os anúncios importados dela serão limpos.`)) {
                api.disconnectIntegration(mktId);
                window.app.showToast(`Integração com ${mktName} removida.`, "info");
                renderMarketplaceSettings(container, user); // re-render
            }
        });
    });

    // 3. Bind Sync Buttons
    container.querySelectorAll('.btn-sync-api').forEach(btn => {
        btn.addEventListener('click', () => {
            const mktId = btn.getAttribute('data-mkt');
            const mktName = btn.getAttribute('data-mkt-name');

            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="refresh-cw" style="animation: spin 1.2s linear infinite; width: 14px; height: 14px;"></i> Sincronizando...`;
            lucide.createIcons({ attrs: { 'data-lucide': true } });

            setTimeout(() => {
                let res;
                if (mktId === 'bling') {
                    res = api.syncBlingProducts(user.id);
                } else {
                    res = api.syncIntegrationProducts(mktId);
                }

                if (res.success) {
                    if (res.count > 0) {
                        if (mktId === 'bling') {
                            window.app.showToast(`Integração concluída! Bling ERP importou 2 SKUs com precificações multicanais distribuídas.`, "success", 5000);
                        } else {
                            window.app.showToast(`Sincronização concluída! ${res.count} anúncios importados com aviso de PREJUÍZO de venda.`, "warning", 5000);
                        }
                    } else {
                        window.app.showToast(`Sincronização concluída. Nenhum anúncio novo encontrado para importar do ${mktName}.`, "info");
                    }
                } else {
                    window.app.showToast(res.message, "error");
                }
                renderMarketplaceSettings(container, user); // re-render
            }, 1800);
        });
    });
}

// ==========================================
// CARD GENERATION HELPER
// ==========================================
function renderIntegrationCard(mktId, name, state, themeClass) {
    const isConnected = state.connected;

    return `
        <div class="visual-panel integration-card ${themeClass}" style="border-left: 5px solid ${isConnected ? 'var(--success)' : 'var(--border-color)'}; display: flex; flex-direction: column; justify-content: space-between; height: 230px;">
            <div>
                <div class="panel-header" style="margin-bottom: 0.75rem;">
                    <span class="marketplace-badge ${mktId}" style="font-size: 0.95rem; padding: 4px 10px;">
                        ${name}
                    </span>
                    <span class="badge ${isConnected ? 'status-active' : 'status-blocked'}" style="font-size: 0.7rem; padding: 2px 8px;">
                        ${isConnected ? 'Viculado' : 'Desconectado'}
                    </span>
                </div>
                
                ${isConnected 
                    ? `
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            Conta ativa: <strong style="color: var(--text-primary);">${state.username}</strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Chave API: ••••••••_token</div>
                        </div>
                    `
                    : `
                        <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1.5rem;">
                            Conecte o canal para puxar anúncios cadastrados e detectar divergências de margem e taxas em lote.
                        </p>
                    `
                }
            </div>

            <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem; justify-content: flex-end;">
                ${isConnected 
                    ? `
                        <button class="btn btn-secondary btn-sm text-danger btn-disconnect-api" data-mkt="${mktId}" data-mkt-name="${name}">Desconectar</button>
                        <button class="btn btn-primary btn-sm btn-sync-api" data-mkt="${mktId}" data-mkt-name="${name}">
                            <i data-lucide="refresh-cw"></i> Sincronizar
                        </button>
                    `
                    : `
                        <button class="btn btn-primary btn-sm btn-connect-api" style="width: 100%;" data-mkt="${mktId}" data-mkt-name="${name}">
                            <i data-lucide="link"></i> Conectar Canal
                        </button>
                    `
                }
            </div>
        </div>
    `;
}

// Add simple spinning animation style rule dynamically if not exists
if (!document.getElementById('integration-spin-style')) {
    const style = document.createElement('style');
    style.id = 'integration-spin-style';
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .integration-card.yellow-theme { background: linear-gradient(to bottom right, rgba(255, 241, 89, 0.02), var(--bg-card)); }
        .integration-card.orange-theme { background: linear-gradient(to bottom right, rgba(255, 87, 34, 0.02), var(--bg-card)); }
        .integration-card.black-theme { background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.04), var(--bg-card)); }
        .integration-card.cyan-theme { background: linear-gradient(to bottom right, rgba(0, 242, 254, 0.02), var(--bg-card)); }
        .integration-card.purple-theme { background: linear-gradient(to bottom right, rgba(139, 92, 246, 0.02), var(--bg-card)); }
    `;
    document.head.appendChild(style);
}
