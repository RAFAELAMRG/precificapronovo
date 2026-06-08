/* --- Central Application Shell Controller --- */
import { router } from './router.js';
import { api } from './api.js';

// Import views to ensure route registration occurs
import './views/auth.js';
import './views/admin-dashboard.js';
import './views/client-dashboard.js';
import './views/products.js';
import './views/marketplaces.js';
import './views/curva-abc.js';
import './views/ads.js';
import './views/reembolsos.js';
import './views/financeiro.js';
import './views/vendas.js';

class AppShell {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.isSidebarRenderedForUser = null;
        
        this.initTheme();
        this.initShellListeners();
    }

    // ==========================================
    // THEME MANAGEMENT
    // ==========================================
    initTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.showToast(`Tema ${this.currentTheme === 'light' ? 'Claro' : 'Escuro'} ativado.`, 'info');
    }

    // ==========================================
    // TOAST NOTIFICATIONS MANAGER
    // ==========================================
    showToast(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'alert-octagon';
        if (type === 'warning') icon = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" aria-label="Fechar">
                <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        
        container.appendChild(toast);
        lucide.createIcons({ attrs: { 'data-lucide': true } });

        // Close button click listener
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    // ==========================================
    // SHELL & DROPDOWN EVENT LISTENERS
    // ==========================================
    initShellListeners() {
        // Theme button click
        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());

        // Mobile sidebar control
        const sidebar = document.getElementById('app-sidebar');
        document.getElementById('mobile-sidebar-open').addEventListener('click', () => {
            sidebar.classList.add('open');
        });
        document.getElementById('mobile-sidebar-close').addEventListener('click', () => {
            sidebar.classList.remove('open');
        });

        // Dropdown toggles
        this.setupDropdown('profile-dropdown-toggle', 'profile-dropdown-menu');
        this.setupDropdown('alerts-dropdown-toggle', 'alerts-dropdown-menu');

        // Logout triggers
        const handleLogout = () => {
            api.logout();
            this.showToast("Sessão encerrada com sucesso.", "success");
            this.isSidebarRenderedForUser = null;
            router.navigate('#/login');
        };

        document.getElementById('sidebar-logout-btn').addEventListener('click', handleLogout);
        document.getElementById('dropdown-logout-btn').addEventListener('click', handleLogout);

        // Mark all alerts read
        document.getElementById('mark-all-alerts-read').addEventListener('click', (e) => {
            e.stopPropagation();
            const user = api.getCurrentUser();
            if (user) {
                api.markAlertsAsRead(user.id);
                this.updateAlertsBell(user.id);
                this.showToast("Todos os alertas marcados como lidos.", "success");
            }
        });
    }

    setupDropdown(triggerId, menuId) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m.id !== menuId) m.classList.remove('show');
            });
            menu.classList.toggle('show');
        });

        // Close on window click
        window.addEventListener('click', () => {
            menu.classList.remove('show');
        });

        // Prevent closing when clicking inside
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ==========================================
    // SIDEBAR & SHELL METADATA SYNCHRONIZATION
    // ==========================================
    syncSidebarAndHeader(user) {
        if (!user) return;
        
        // Prevent unnecessary sidebar rebuilds
        if (this.isSidebarRenderedForUser === user.id) {
            // Just update client alert counter
            if (user.tipo === 'cliente') {
                this.updateAlertsBell(user.id);
            }
            return;
        }

        this.isSidebarRenderedForUser = user.id;

        // Sync header details
        document.getElementById('sidebar-user-name').textContent = user.nome;
        document.getElementById('sidebar-user-role').textContent = user.tipo === 'admin' ? 'Administrador' : 'Cliente';
        document.getElementById('sidebar-user-avatar').textContent = user.nome.charAt(0).toUpperCase();
        document.getElementById('topbar-user-avatar').textContent = user.nome.charAt(0).toUpperCase();
        document.getElementById('profile-menu-name').textContent = user.nome;
        document.getElementById('profile-menu-email').textContent = user.email;

        // Build navigation menu items dynamically based on role permissions
        const menuList = document.getElementById('sidebar-menu-list');
        menuList.innerHTML = '';

        const clientLinks = [
            { href: '#/dashboard', icon: 'layout-dashboard', text: 'Dashboard' },
            { href: '#/vendas', icon: 'dollar-sign', text: 'Vendas' },
            { href: '#/curva-abc', icon: 'trending-up', text: 'Curva ABC' },
            { 
                text: 'Ads', 
                icon: 'target', 
                badge: 'Beta',
                sublinks: [
                    { href: '#/ads/amazon', text: 'Amazon' },
                    { href: '#/ads/mercado_livre', text: 'Meli' },
                    { href: '#/ads/shopee', text: 'Shopee' }
                ]
            },
            { 
                text: 'Analítico', 
                icon: 'bar-chart-2',
                sublinks: [
                    { href: '#/relatorios/vendas', text: 'Desempenho Anúncios' },
                    { href: '#/financeiro/resumo', text: 'Resumo Financeiro' },
                    { href: '#/dashboard', text: 'Gráficos de Vendas' }
                ]
            },
            { 
                text: 'Gerenciamento',
                icon: 'briefcase',
                sublinks: [
                    { href: '#/produtos', text: 'Produtos' },
                    { href: '#/inventario', text: 'Inventário FBA/Full' },
                    { href: '#/precificacao', text: 'Precificação' },
                    { href: '#/marketplaces', text: 'Marketplaces' }
                ]
            },
            { 
                text: 'Relatório',
                icon: 'clipboard-list',
                sublinks: [
                    { href: '#/reembolsos', text: 'Reembolsos' },
                    { href: '#/alertas', text: 'Alertas' }
                ]
            },
            { 
                text: 'Financeiro', 
                icon: 'landmark', 
                badge: 'Beta',
                sublinks: [
                    { href: '#/financeiro/resumo', text: 'Resumo' },
                    { href: '#/financeiro/categorias', text: 'Categorias de Despesas' },
                    { href: '#/financeiro/despesas', text: 'Despesas Operacionais' }
                ]
            },
            { href: '#/configuracoes', icon: 'settings', text: 'Configurações', separator: true }
        ];

        const adminLinks = [
            { href: '#/admin', icon: 'shield', text: 'Dashboard Admin' },
            { href: '#/admin/clientes', icon: 'users', text: 'Clientes' },
            { href: '#/admin/assinaturas', icon: 'credit-card', text: 'Assinaturas' },
            { href: '#/admin/planos', icon: 'award', text: 'Planos' },
            { href: '#/admin/relatorios', icon: 'trending-up', text: 'Relatórios' },
            { href: '#/admin/logs', icon: 'database', text: 'Logs do Sistema' },
            { href: '#/admin/configuracoes', icon: 'sliders', text: 'Configurações', separator: true }
        ];

        const links = user.tipo === 'admin' ? adminLinks : clientLinks;

        links.forEach(link => {
            if (link.separator) {
                const sep = document.createElement('li');
                sep.className = 'nav-separator';
                menuList.appendChild(sep);
            }

            const li = document.createElement('li');
            
            if (link.sublinks) {
                li.className = 'nav-item nav-item-dropdown';
                const badgeHtml = link.badge 
                    ? `<span class="badge" style="background-color: var(--warning-light); color: var(--warning-hover); font-weight: 800; font-size: 0.65rem; padding: 1px 5px; margin-left: 0.5rem; border-radius: var(--radius-sm);">Beta</span>` 
                    : '';
                
                li.innerHTML = `
                    <a href="javascript:void(0)" class="nav-dropdown-toggle">
                        <i data-lucide="${link.icon}"></i>
                        <span>${link.text}${badgeHtml}</span>
                        <i data-lucide="chevron-right" class="arrow-icon"></i>
                    </a>
                    <ul class="nav-sub-list">
                        ${link.sublinks.map(sub => `
                            <li class="nav-sub-item">
                                <a href="${sub.href}">
                                    <span>${sub.text}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                `;
                
                // Toggle open/closed state on click
                const toggle = li.querySelector('.nav-dropdown-toggle');
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    li.classList.toggle('open');
                });
            } else {
                li.className = 'nav-item';
                li.innerHTML = `
                    <a href="${link.href}">
                        <i data-lucide="${link.icon}"></i>
                        <span>${link.text}</span>
                    </a>
                `;
            }
            menuList.appendChild(li);
        });

        // Hide/Show client specific actions in header (like alert bell)
        const alertsContainer = document.getElementById('topbar-alerts-container');
        if (user.tipo === 'admin') {
            alertsContainer.classList.add('hidden');
        } else {
            alertsContainer.classList.remove('hidden');
            this.updateAlertsBell(user.id);
        }

        // Render Lucide icons
        lucide.createIcons();
    }

    updateAlertsBell(userId) {
        const alerts = api.getAlerts(userId);
        const unread = alerts.filter(a => a.status === 'nao_lido');
        const badge = document.getElementById('alerts-count-badge');
        const list = document.getElementById('alerts-dropdown-list');

        // Update badge UI
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // Populate Alert dropdown listing
        list.innerHTML = '';
        if (alerts.length === 0) {
            list.innerHTML = '<p class="empty-alerts">Nenhum alerta pendente</p>';
            return;
        }

        alerts.slice(0, 5).forEach(alert => {
            const card = document.createElement('div');
            card.className = 'alert-item-card';
            
            let color = 'info';
            let icon = 'info';
            if (alert.tipo === 'prejuizo') {
                color = 'danger';
                icon = 'alert-octagon';
            } else if (alert.tipo === 'taxa' || alert.tipo === 'desatualizado') {
                color = 'warning';
                icon = 'alert-triangle';
            }

            card.innerHTML = `
                <div class="alert-icon-wrap ${color}">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="alert-body-wrap">
                    <p class="alert-item-text">${alert.mensagem}</p>
                    <span class="alert-item-time">${new Date(alert.created_at).toLocaleDateString('pt-BR')} ${new Date(alert.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;
            list.appendChild(card);
        });

        lucide.createIcons({ attrs: { 'data-lucide': true } });
    }

    // ==========================================
    // DIALOG OVERLAY & MODAL SYSTEM
    // ==========================================
    showModal(title, bodyHtml, footerHtml = '', sizeClass = '') {
        const container = document.getElementById('modal-container');
        const card = document.getElementById('modal-card');

        // Reset class to default modal-card and add size class if specified
        card.className = `modal-card ${sizeClass}`.trim();

        card.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close-btn" id="modal-close-trigger" aria-label="Fechar">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        `;

        container.classList.remove('hidden');
        // Small delay to trigger smooth scale-in animation
        setTimeout(() => container.classList.add('show'), 50);

        lucide.createIcons();

        // Bind close button
        const closeModal = () => {
            container.classList.remove('show');
            setTimeout(() => {
                container.classList.add('hidden');
                card.innerHTML = '';
            }, 300);
        };

        document.getElementById('modal-close-trigger').addEventListener('click', closeModal);
        
        // Also close if clicking outside the modal content
        container.addEventListener('click', (e) => {
            if (e.target === container) closeModal();
        });

        return closeModal;
    }
}

// Instantiate globally so components can trigger toasts/modals
window.app = new AppShell();

// Set Header Title according to route
window.addEventListener('hashchange', () => {
    const hash = router.getPath();
    const titles = {
        '#/dashboard': 'Painel do Vendedor',
        '#/vendas': 'Vendas',
        '#/produtos': 'Gestão de Produtos',
        '#/inventario': 'Inventário FBA e Full',
        '#/curva-abc': 'Curva ABC (Análise de Faturamento)',
        '#/reembolsos': 'Reembolso por Produto (Devoluções)',
        '#/ads/amazon': 'Amazon Ads Performance',
        '#/ads/mercado_livre': 'Mercado Livre Ads Performance',
        '#/ads/shopee': 'Shopee Ads Performance',
        '#/relatorios': 'Relatórios Financeiros',
        '#/relatorios/dre': 'Demonstrativo Financeiro (DRE)',
        '#/relatorios/vendas': 'Desempenho por Anúncio (Vendas)',
        '#/relatorios/ads': 'Gestão de Ads (ACOS/TACOS)',
        '#/financeiro/resumo': 'DRE - Financeiro',
        '#/financeiro/categorias': 'Categorias de Despesas',
        '#/financeiro/despesas': 'Despesas Operacionais',
        '#/alertas': 'Alertas Financeiros',
        '#/marketplaces': 'Configuração de Marketplaces',
        '#/configuracoes': 'Configurações de Perfil',
        
        // Admin
        '#/admin': 'Painel Administrativo',
        '#/admin/clientes': 'Gestão de Clientes',
        '#/admin/assinaturas': 'Controle de Assinaturas',
        '#/admin/planos': 'Gerenciador de Planos',
        '#/admin/relatorios': 'Relatórios Administrativos',
        '#/admin/logs': 'Auditoria e Logs',
        '#/admin/configuracoes': 'Configurações Gerais'
    };
    
    const pageTitle = titles[hash] || 'PrecificaPro';
    document.getElementById('current-page-title').textContent = pageTitle;
});

// Trigger initial routing now that app is fully loaded and initialized
router.route();
