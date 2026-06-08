/* --- Authentication Views Module --- */
import { router } from '../router.js';
import { api } from '../api.js';

// ==========================================
// ROUTE REGISTRATION
// ==========================================
router.on('#/login', renderLogin);
router.on('#/cadastro', renderSignup);
router.on('#/recuperar-senha', renderRecovery);

// ==========================================
// VIEW RENDERERS
// ==========================================

function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="auth-logo">
                    <div class="logo-icon">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <span>Precifica<span>Pro</span></span>
                </div>
                <h2 class="auth-title">Bem-vindo de volta</h2>
                <p class="auth-subtitle">Acesse sua conta para gerenciar sua precificação</p>
            </div>
            
            <div id="auth-alert" class="auth-message-banner error hidden"></div>

            <form class="auth-form" id="login-form">
                <div class="form-group">
                    <label class="form-label" for="login-email">E-mail</label>
                    <input type="email" id="login-email" class="form-control" placeholder="nome@empresa.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="login-password">Senha</label>
                    <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
                </div>
                
                <div class="auth-options">
                    <label class="auth-checkbox-label">
                        <input type="checkbox" id="login-remember">
                        <span>Lembrar de mim</span>
                    </label>
                    <a href="#/recuperar-senha" class="auth-link">Esqueceu a senha?</a>
                </div>
                
                <button type="submit" class="auth-submit-btn">Entrar no Painel</button>
            </form>
            
            <div class="auth-footer">
                Não tem uma conta? <a href="#/cadastro" class="auth-link">Criar conta grátis</a>
            </div>

            <!-- Fast User Switch Demo Helper -->
            <div class="demo-accounts-helper">
                <div class="demo-title">Contas de Teste (1-Clique)</div>
                <div class="demo-buttons">
                    <button class="demo-switch-btn" id="demo-btn-client">
                        <span class="demo-switch-role">Portal Cliente</span>
                        <span class="demo-switch-email">joao@vendedor.com</span>
                    </button>
                    <button class="demo-switch-btn" id="demo-btn-admin">
                        <span class="demo-switch-role">Portal Admin</span>
                        <span class="demo-switch-email">admin@precificacao.com</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Mount Lucide icons
    lucide.createIcons();

    // Bind login form submit
    const form = document.getElementById('login-form');
    const alertBanner = document.getElementById('auth-alert');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const res = api.login(email, password);
        if (res.success) {
            window.app.showToast(`Login efetuado! Bem-vindo, ${res.user.nome}.`, "success");
            
            if (res.user.tipo === 'admin') {
                router.navigate('#/admin');
            } else {
                router.navigate('#/dashboard');
            }
        } else {
            alertBanner.innerHTML = `<i data-lucide="alert-octagon"></i> <span>${res.message}</span>`;
            alertBanner.classList.remove('hidden');
            lucide.createIcons();
        }
    });

    // Bind demo fast logins
    document.getElementById('demo-btn-client').addEventListener('click', () => {
        document.getElementById('login-email').value = "joao@vendedor.com";
        document.getElementById('login-password').value = "cliente";
        form.requestSubmit();
    });
    
    document.getElementById('demo-btn-admin').addEventListener('click', () => {
        document.getElementById('login-email').value = "admin@precificacao.com";
        document.getElementById('login-password').value = "admin";
        form.requestSubmit();
    });
}

function renderSignup(container) {
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="auth-logo">
                    <div class="logo-icon">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <span>Precifica<span>Pro</span></span>
                </div>
                <h2 class="auth-title">Crie sua conta</h2>
                <p class="auth-subtitle">Comece a precificar de forma inteligente hoje mesmo</p>
            </div>
            
            <div id="auth-alert" class="auth-message-banner error hidden"></div>

            <form class="auth-form" id="signup-form">
                <div class="form-group">
                    <label class="form-label" for="signup-name">Nome Completo</label>
                    <input type="text" id="signup-name" class="form-control" placeholder="Seu Nome" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="signup-email">E-mail Corporativo</label>
                    <input type="email" id="signup-email" class="form-control" placeholder="nome@empresa.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="signup-password">Senha de Acesso</label>
                    <input type="password" id="signup-password" class="form-control" placeholder="Mínimo 6 caracteres" required minlength="4">
                </div>
                <div class="form-group">
                    <label class="form-label" for="signup-confirm">Confirme sua Senha</label>
                    <input type="password" id="signup-confirm" class="form-control" placeholder="••••••••" required>
                </div>
                
                <div class="auth-options" style="font-size: 0.75rem;">
                    Ao se cadastrar, você concorda com nossos Termos de Uso.
                </div>
                
                <button type="submit" class="auth-submit-btn">Criar Conta Grátis</button>
            </form>
            
            <div class="auth-footer">
                Já possui conta? <a href="#/login" class="auth-link">Fazer login</a>
            </div>
        </div>
    `;
    
    lucide.createIcons();

    const form = document.getElementById('signup-form');
    const alertBanner = document.getElementById('auth-alert');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (password !== confirm) {
            alertBanner.innerHTML = `<i data-lucide="alert-octagon"></i> <span>As senhas digitadas não coincidem.</span>`;
            alertBanner.classList.remove('hidden');
            lucide.createIcons();
            return;
        }

        const res = api.register(name, email, password);
        if (res.success) {
            window.app.showToast("Conta criada! Seu Plano Pro está ativo.", "success");
            router.navigate('#/dashboard');
        } else {
            alertBanner.innerHTML = `<i data-lucide="alert-octagon"></i> <span>${res.message}</span>`;
            alertBanner.classList.remove('hidden');
            lucide.createIcons();
        }
    });
}

function renderRecovery(container) {
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="auth-logo">
                    <div class="logo-icon">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <span>Precifica<span>Pro</span></span>
                </div>
                <h2 class="auth-title">Recuperação de senha</h2>
                <p class="auth-subtitle">Enviaremos as instruções de redefinição para seu e-mail</p>
            </div>
            
            <div id="auth-alert" class="auth-message-banner hidden"></div>

            <form class="auth-form" id="recovery-form">
                <div class="form-group">
                    <label class="form-label" for="recovery-email">E-mail Cadastrado</label>
                    <input type="email" id="recovery-email" class="form-control" placeholder="nome@empresa.com" required>
                </div>
                
                <button type="submit" class="auth-submit-btn">Enviar Instruções</button>
            </form>
            
            <div class="auth-footer">
                Lembrou a senha? <a href="#/login" class="auth-link">Voltar para o Login</a>
            </div>
        </div>
    `;
    
    lucide.createIcons();

    const form = document.getElementById('recovery-form');
    const alertBanner = document.getElementById('auth-alert');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email').value;

        const res = api.recoverPassword(email);
        if (res.success) {
            alertBanner.className = "auth-message-banner success";
            alertBanner.innerHTML = `<i data-lucide="check-circle"></i> <span>${res.message}</span>`;
            alertBanner.classList.remove('hidden');
            
            // Disable form inputs
            form.querySelector('button').disabled = true;
            form.querySelector('input').disabled = true;
        } else {
            alertBanner.className = "auth-message-banner error";
            alertBanner.innerHTML = `<i data-lucide="alert-octagon"></i> <span>${res.message}</span>`;
            alertBanner.classList.remove('hidden');
        }
        lucide.createIcons();
    });
}
