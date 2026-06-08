import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import PricingCalculator from './pages/PricingCalculator';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Marketplaces from './pages/Marketplaces';
import SettingsPage from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import Subscription from './pages/Subscription';
import ProductionCosts from './pages/ProductionCosts';
import api from './services/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activePath, setActivePath] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [initializing, setInitializing] = useState(true);

  // Initialize Session & Theme
  useEffect(() => {
    const savedToken = localStorage.getItem('precificapro_token');
    const savedUser = localStorage.getItem('precificapro_user');
    const savedTheme = localStorage.getItem('precificapro_theme') || 'light';

    setToken(savedToken);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Simple Hash routing initialization
    const hash = window.location.hash.replace('#', '') || '/';
    setActivePath(hash);

    setInitializing(false);

    // Setup listener for hash changes
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '') || '/';
      setActivePath(currentHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync token to check session validity with backend
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(response => {
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('precificapro_user', JSON.stringify(response.data.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('precificapro_token');
          localStorage.removeItem('precificapro_user');
          setUser(null);
          setToken(null);
          window.location.hash = '#/login';
        });
    }
  }, [token]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('precificapro_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleNavigate = (path) => {
    window.location.hash = `#${path}`;
    setActivePath(path);
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Routing Guard logic
  const isLoggedIn = !!token;
  const isAuthPage = activePath === '/login' || activePath === '/cadastro' || activePath === '/assinatura';

  // Redirect logic
  if (!isLoggedIn && !isAuthPage) {
    // If not logged in and trying to access app, redirect to login
    window.location.hash = '#/login';
    return <Login />;
  }

  if (isLoggedIn && (isAuthPage || activePath === '/')) {
    // If logged in and trying to go to login or home, redirect to dashboard/admin
    const target = user?.role === 'admin' ? '/admin' : '/dashboard';
    window.location.hash = `#${target}`;
    return null;
  }

  // Render View based on path
  const renderView = () => {
    switch (activePath) {
      case '/login':
        return <Login />;
      case '/cadastro':
        return <Register />;
      case '/assinatura':
        return <Subscription />;
      case '/dashboard':
        return <Dashboard />;
      case '/produtos':
      case '/produtos/novo':
        return <Products autoOpenAdd={activePath === '/produtos/novo'} />;
      case '/producao':
        return <ProductionCosts />;
      case '/precificacao':
        return <PricingCalculator />;
      case '/relatorios':
        return <Reports />;
      case '/alertas':
        return <Alerts />;
      case '/marketplaces':
        return <Marketplaces />;
      case '/configuracoes':
        return <SettingsPage user={user} />;
      case '/admin':
        return <AdminDashboard />;
      case '/admin/clientes':
        return <AdminClients />;
      default:
        return user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activePath) {
      case '/dashboard': return 'Dashboard de Vendas';
      case '/produtos':
      case '/produtos/novo': return 'Cadastro de Produtos';
      case '/producao': return 'Fichas de Custo (Produção)';
      case '/precificacao': return 'Engine de Precificação';
      case '/relatorios': return 'Relatórios de Lucratividade';
      case '/alertas': return 'Alertas Financeiros';
      case '/marketplaces': return 'Canais Integrados';
      case '/configuracoes': return 'Configurações de Conta';
      case '/admin': return 'Painel SaaS Administrativo';
      case '/admin/clientes': return 'Carteira de Clientes SaaS';
      default: return 'PrecificaPro';
    }
  };

  // Render Layout
  if (isAuthPage) {
    return renderView();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        activePath={activePath} 
        onNavigate={handleNavigate}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Topbar 
          onMenuOpen={() => setIsSidebarOpen(true)} 
          pageTitle={getPageTitle()} 
          user={user}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        {/* View content panel */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-55 dark:bg-gray-950">
          {renderView()}
        </main>
      </div>

    </div>
  );
};

export default App;
