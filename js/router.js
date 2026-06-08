/* --- Client-Side Hash Router --- */
import { api } from './api.js';

// Route handler maps
const routes = {};

export const router = {
    // Register route handler
    on(path, handler) {
        routes[path] = handler;
    },

    // Get current route path
    getPath() {
        const hash = window.location.hash || '#/dashboard';
        return hash;
    },

    // Navigate to a hash path programmatically
    navigate(path) {
        window.location.hash = path;
    },

    // Core Routing Orchestrator
    async route() {
        const hash = this.getPath();
        const user = api.getCurrentUser();
        
        // 1. Auth Guard and Redirect Rules
        const isAuthRoute = ['#/login', '#/cadastro', '#/recuperar-senha'].includes(hash);
        
        if (!user && !isAuthRoute) {
            this.navigate('#/login');
            return;
        }

        if (user && isAuthRoute) {
            // Already logged in, redirect to respective dashboard
            if (user.tipo === 'admin') {
                this.navigate('#/admin');
            } else {
                this.navigate('#/dashboard');
            }
            return;
        }

        // 2. Permission Guard for Admin Routes
        const isAdminRoute = hash.startsWith('#/admin');
        if (isAdminRoute && user && user.tipo !== 'admin') {
            // Client trying to access admin view
            this.navigate('#/dashboard');
            window.app?.showToast("Acesso Negado: Apenas administradores podem acessar esta página.", "error");
            return;
        }

        // Adjust client hash redirects if admin clicks a client link or vice versa
        let targetHash = hash;
        if (hash === '#/dashboard' && user && user.tipo === 'admin') {
            this.navigate('#/admin');
            return;
        }

        // 3. Toggle Layout Visibility (Auth Portal vs App Dashboard Portal)
        const appContainer = document.getElementById('app-container');
        const authContainer = document.getElementById('auth-container');
        
        if (isAuthRoute) {
            appContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
        } else {
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            // Build the appropriate sidebar navigation menu if not already populated
            window.app?.syncSidebarAndHeader(user);
        }

        // 4. Resolve Route Handler
        const handler = routes[targetHash];
        const viewEl = isAuthRoute 
            ? document.getElementById('auth-container')
            : document.getElementById('app-view');

        if (handler) {
            try {
                // Render view
                await handler(viewEl, user);
                // Synchronize global layout adjustments (e.g. active menu items)
                if (!isAuthRoute) {
                    this.updateActiveSidebarItem(targetHash);
                    // Close mobile sidebar after route transition
                    document.getElementById('app-sidebar').classList.remove('open');
                }
            } catch (err) {
                console.error("Erro ao carregar rota:", err);
                viewEl.innerHTML = `
                    <div class="visual-panel" style="text-align: center; padding: 4rem;">
                        <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--danger); margin: 0 auto 1.5rem;"></i>
                        <h2 class="panel-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Erro no Carregamento</h2>
                        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 1.5rem;">Ocorreu uma falha ao renderizar esta visualização.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">Recarregar Página</button>
                    </div>
                `;
                lucide.createIcons();
            }
        } else {
            // 404 Route Not Found
            viewEl.innerHTML = `
                <div class="visual-panel" style="text-align: center; padding: 5rem 2rem;">
                    <i data-lucide="compass" style="width: 64px; height: 64px; color: var(--text-muted); margin: 0 auto 1.5rem;"></i>
                    <h2 class="panel-title" style="font-size: 1.8rem; margin-bottom: 0.5rem; font-family: var(--font-display);">Página Não Encontrada</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">A rota solicitada <strong>${hash}</strong> não existe ou está temporariamente indisponível.</p>
                    <a href="#/dashboard" class="btn btn-primary">Voltar para o Início</a>
                </div>
            `;
            lucide.createIcons();
        }
    },

    // Highlight active item in sidebar
    updateActiveSidebarItem(hash) {
        const menuItems = document.querySelectorAll('#sidebar-menu-list li');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('href') === hash) {
                item.classList.add('active');
                
                // Keep parent dropdown expanded if it is a sublink
                const parentDropdown = item.closest('.nav-item-dropdown');
                if (parentDropdown) {
                    parentDropdown.classList.add('open');
                }
            } else {
                item.classList.remove('active');
            }
        });
    }
};

// Initialize router listener for dynamic transitions
window.addEventListener('hashchange', () => router.route());
