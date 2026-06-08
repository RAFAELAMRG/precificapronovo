import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, UserMinus, ShieldAlert, BarChart3, RefreshCw, Radio } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../services/api';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/metrics');
      if (response.data.success) {
        setMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mocked faturamento evolution of the SaaS
  const chartData = [
    { month: 'Jan', mrr: 19.90, net: 18.90 },
    { month: 'Fev', mrr: 39.80, net: 37.81 },
    { month: 'Mar', mrr: 79.60, net: 75.62 },
    { month: 'Abr', mrr: 99.50, net: 94.52 },
    { month: 'Mai', mrr: (metrics?.activeClients * 19.90) || 119.40, net: (metrics?.monthlyBilling) || 113.43 }
  ];

  if (loading) {
    return (
      <div className="p-6 text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="text-sm font-semibold text-gray-505 mt-2">Carregando painel admin...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Banner info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 text-white p-6 rounded-3xl shadow-lg border border-gray-800">
        <div>
          <h3 className="text-xl font-bold font-display">Painel Master Admin</h3>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Console Geral do SaaS PrecificaPro. Monitoramento de Tenants ativos e Faturamento de Assinaturas.
          </p>
        </div>
        <button 
          onClick={fetchAdminMetrics}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recarregar Métricas
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Customers */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start text-gray-400">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Clientes</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">{metrics?.totalClients}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Empresas Cadastradas</p>
          </div>
        </div>

        {/* MRR (Monthly Recurring Revenue) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/10">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Recorrente</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              R$ {metrics?.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MRR (Faturamento Bruto)</p>
          </div>
        </div>

        {/* Faturamento Líquido */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start text-gray-400">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">Líquido</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              R$ {metrics?.monthlyBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receita Líquida Estimada</p>
          </div>
        </div>

        {/* Online users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start text-gray-400">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Radio className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">Tempo Real</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">{metrics?.onlineUsers}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usuários Ativos Online</p>
          </div>
        </div>

      </div>

      {/* Extra KPI Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm transition-colors">
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 pb-4 sm:pb-0 sm:pr-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Clientes Ativos</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-lg font-bold text-gray-800 dark:text-white">{metrics?.activeClients}</span>
          </div>
        </div>
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 py-4 sm:py-0 sm:px-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Clientes Bloqueados (Inadimplência)</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{metrics?.blockedClients}</span>
          </div>
        </div>
        <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Novos Clientes (30 dias)</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-450">+{metrics?.newSignups}</span>
          </div>
        </div>
      </div>

      {/* Chart representing MRR growth */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-colors">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 font-display">Crescimento MRR do SaaS (R$)</h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="mrr" name="MRR Recorrente" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
