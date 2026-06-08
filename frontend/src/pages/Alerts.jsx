import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import api from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // 'todos', 'nao_lido', 'lido'

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alerts');
      if (response.data.success) {
        setAlerts(response.data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts in Alerts page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await api.put('/alerts/read');
      if (response.data.success) {
        setAlerts(prev => prev.map(a => ({ ...a, status: 'lido' })));
      }
    } catch (err) {
      console.error('Error marking alerts as read:', err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'nao_lido') return a.status === 'nao_lido';
    if (filter === 'lido') return a.status === 'lido';
    return true;
  });

  const unreadCount = alerts.filter(a => a.status === 'nao_lido').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Alertas & Notificações</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Alertas automáticos gerados pelo motor de cálculo quando margens ou lucros caem abaixo do ideal.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            className="p-2.5 border border-gray-250 dark:border-gray-800 rounded-xl hover:bg-gray-55/60 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-colors"
            >
              <Check className="w-4.5 h-4.5" />
              Limpar Todos Alertas
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2 rounded-2xl w-fit transition-colors">
        <button
          onClick={() => setFilter('todos')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'todos' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Todos ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('nao_lido')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'nao_lido' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Não Lidos ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('lido')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filter === 'lido' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Lidos ({alerts.length - unreadCount})
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-xs font-semibold text-gray-400 mt-2">Buscando notificações...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800/80 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nenhum alerta nesta categoria!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Seus preços operam dentro das margens recomendadas.</p>
          </div>
        ) : (
          filteredAlerts.map((a) => {
            const isLoss = a.tipo === 'prejuizo';
            const isWarning = a.tipo === 'margem_baixa';
            const isUnread = a.status === 'nao_lido';

            return (
              <div
                key={a.id}
                className={`flex gap-4 p-5 rounded-3xl border transition-all hover:shadow-sm 
                  ${isLoss 
                    ? 'bg-rose-50/20 dark:bg-rose-950/5 border-rose-100 dark:border-rose-900/20' 
                    : isWarning 
                      ? 'bg-amber-50/20 dark:bg-amber-950/5 border-amber-100 dark:border-amber-900/20' 
                      : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800'
                  }
                `}
              >
                {/* Icon box based on type */}
                <div className={`p-3 rounded-2xl shrink-0 h-fit
                  ${isLoss 
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500' 
                    : isWarning 
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-550' 
                      : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500'
                  }
                `}>
                  {isLoss ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>

                {/* Body details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {a.tipo === 'prejuizo' ? 'Prejuízo Crítico' : a.tipo === 'margem_baixa' ? 'Margem Alerta' : 'Notificação'}
                    </span>
                    {isUnread && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455">
                        Novo
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 leading-relaxed">
                    {a.mensagem}
                  </p>
                  
                  <span className="text-[11px] text-gray-450 dark:text-gray-500 mt-2 block font-medium">
                    Gerado em {new Date(a.created_at).toLocaleDateString('pt-BR')} às {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Alerts;
