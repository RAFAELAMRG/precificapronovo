import React from 'react';
import { 
  TrendingUp, 
  LayoutDashboard, 
  Package, 
  Calculator, 
  FileText, 
  Bell, 
  Layers, 
  Settings, 
  Users, 
  CreditCard, 
  LogOut,
  X,
  Plus,
  Factory
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, user, activePath, onNavigate }) => {
  const isAdmin = user?.role === 'admin';

  const clientMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', path: '/produtos', icon: Package },
    { name: 'Fichas de Custo', path: '/producao', icon: Factory },
    { name: 'Precificação', path: '/precificacao', icon: Calculator },
    { name: 'Relatórios', path: '/relatorios', icon: FileText },
    { name: 'Alertas', path: '/alertas', icon: Bell },
    { name: 'Marketplaces', path: '/marketplaces', icon: Layers },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  const adminMenu = [
    { name: 'Dashboard Master', path: '/admin', icon: LayoutDashboard },
    { name: 'Clientes SaaS', path: '/admin/clientes', icon: Users },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenu : clientMenu;

  const handleLogout = () => {
    localStorage.removeItem('precificapro_token');
    localStorage.removeItem('precificapro_user');
    window.location.href = '#/login';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-150 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Precifica<span className="text-emerald-500">Pro</span>
            </span>
          </div>
          <button 
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path || (item.path === '/produtos' && activePath === '/produtos/novo');
            const isProducts = item.path === '/produtos';
            
            return (
              <div key={item.path} className="relative group/menu flex items-center">
                <button
                  onClick={() => {
                    onNavigate(item.path);
                    onClose();
                  }}
                  className={`
                    flex items-center flex-1 gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isProducts ? 'pr-12' : ''}
                    ${isActive 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-105 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span className="flex-1 text-left">{item.name}</span>
                </button>
                {isProducts && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('/produtos/novo');
                      onClose();
                    }}
                    className={`
                      absolute right-2 p-1.5 rounded-lg transition-all
                      ${isActive 
                        ? 'text-white hover:bg-white/20' 
                        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                    title="Cadastrar Novo Produto"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-emerald-600 dark:bg-emerald-500">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                {user?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                {isAdmin ? 'Administrador Master' : 'Vendedor Cliente'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
