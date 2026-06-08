import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, Menu, ChevronDown, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const Topbar = ({ onMenuOpen, pageTitle, user, theme, onThemeToggle }) => {
  const [alerts, setAlerts] = useState([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const alertsRef = useRef(null);
  const profileRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const unreadCount = alerts.filter(a => a.status === 'nao_lido').length;

  useEffect(() => {
    if (!isAdmin && user) {
      fetchAlerts();
      // Poll alerts every 60 seconds
      const interval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside handlers to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setIsAlertsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      if (response.data.success) {
        setAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts in Topbar:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await api.put('/alerts/read');
      if (response.data.success) {
        setAlerts(prev => prev.map(a => ({ ...a, status: 'lido' })));
      }
    } catch (error) {
      console.error('Error marking alerts as read:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('precificapro_token');
    localStorage.removeItem('precificapro_user');
    window.location.href = '#/login';
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 transition-colors duration-200">
      
      {/* Left side: Hamburger menu (mobile) and Page Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuOpen}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white font-display">
          {pageTitle}
        </h2>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Alerts Bell Dropdown (Clients only) */}
        {!isAdmin && (
          <div className="relative" ref={alertsRef}>
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
              title="Alertas Financeiros"
            >
              <Bell className="w-5.5 h-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>

            {/* Alerts Feed Dropdown Menu */}
            {isAlertsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Alertas Financeiros</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    >
                      Marcar todos como lidos
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum alerta pendente</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Seus produtos estão com margens saudáveis.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 transition-colors ${alert.status === 'nao_lido' ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : 'bg-transparent'}`}
                      >
                        <div className="flex gap-2.5">
                          <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${alert.tipo === 'prejuizo' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-3">
                              {alert.mensagem}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                              {new Date(alert.created_at).toLocaleDateString('pt-BR')} às {new Date(alert.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle (Light/Dark) */}
        <button
          onClick={onThemeToggle}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun className="w-5.5 h-5.5" /> : <Moon className="w-5.5 h-5.5" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-medium text-sm">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500">Logado como</p>
                <p className="text-sm font-semibold text-gray-800 truncate dark:text-white mt-0.5">{user?.nome}</p>
              </div>
              
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  window.location.hash = '#/configuracoes';
                }}
                className="flex items-center w-full gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center w-full gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
