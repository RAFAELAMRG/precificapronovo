import React, { useState, useEffect } from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [criticalProducts, setCriticalProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch metrics and charts
      const metricsResponse = await api.get('/dashboard/metrics');
      if (metricsResponse.data.success) {
        setMetrics(metricsResponse.data.metrics);
        setCharts(metricsResponse.data.charts);
      }

      // Fetch products to filter critical products (negative margins)
      const productsResponse = await api.get('/products');
      if (productsResponse.data.success) {
        const negativeMarginProds = productsResponse.data.products.filter(p => p.margem_obtida < 0);
        setCriticalProducts(negativeMarginProds);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(
        err.response?.data?.message || 
        'Erro ao carregar dados do painel de controle. Verifique sua conexão ou status de assinatura.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Skeleton Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-20 text-center space-y-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-8 rounded-3xl shadow-lg transition-colors">
        <div className="flex justify-center">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-2xl">
            <AlertTriangle className="w-12 h-12" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Ops! Acesso Restrito ou Falha</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {error}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/10 active:scale-98 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm transition-colors">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Resumo de Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analise de rentabilidade baseada no seu catálogo ativo.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Dados
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Products */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">Geral</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">{metrics?.totalProducts ?? 0}</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Produtos Cadastrados</p>
          </div>
        </div>

        {/* Estimated Monthly Profit */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/10">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">Estimativa</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              R$ {(metrics?.estimatedMonthlyProfit ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Lucro Estimado (Mensal)</p>
          </div>
        </div>

        {/* Average Margin */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">Médio</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">{metrics?.averageMargin ?? 0}%</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Margem Líquida Média</p>
          </div>
        </div>

        {/* Critical Status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl ${(metrics?.productsLoss ?? 0) > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">Status</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              {metrics?.productsLoss ?? 0}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Anúncios em Prejuízo</p>
          </div>
        </div>

      </div>

      {/* Extra KPI details block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 pb-4 sm:pb-0 sm:pr-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Produtos Saudáveis</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-bold text-gray-800 dark:text-white">{metrics?.productsProfitable ?? 0}</span>
          </div>
        </div>
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 py-4 sm:py-0 sm:px-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Desatualizados / Taxas Reajustadas</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-bold text-gray-800 dark:text-white">{metrics?.productsDesatualizados ?? 0}</span>
          </div>
        </div>
        <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Marketplace Principal</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span className="text-lg font-bold text-gray-800 dark:text-white">{metrics?.bestMarketplace ?? 'Nenhum'}</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart: Faturamento e Lucro */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 font-display">Histórico de Performance (Últimos 6 meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.area || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderRadius: '16px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="faturamento" name="Faturamento Estimado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFat)" />
                <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLuc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Marketplace Profit Share */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 font-display">Distribuição por Canal</h3>
          <div className="h-72 relative flex flex-col justify-center items-center">
            {!(charts?.donut?.length) ? (
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Sem dados de canais ativos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.donut || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(charts?.donut || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `R$ ${value}`}
                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Critical products alert list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">Alerta Crítico: Produtos Operando em Prejuízo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Precificação incorreta que está reduzindo sua margem.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full">
            {criticalProducts.length} Críticos
          </span>
        </div>

        {criticalProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Excelente! Nenhum produto operando com margem negativa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800">
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Produto</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Canal</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Preço Atual</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase text-rose-500">Lucro Líquido</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase text-rose-500">Margem</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Preço Ideal Mín.</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {criticalProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{prod.nome}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{prod.sku}</p>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{prod.marketplace.replace('_', ' ')}</td>
                    <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">R$ {prod.preco_atual.toFixed(2)}</td>
                    <td className="py-4 text-sm font-bold text-rose-600 dark:text-rose-400">R$ {prod.lucro.toFixed(2)}</td>
                    <td className="py-4 text-sm font-bold text-rose-600 dark:text-rose-400">{prod.margem_obtida}%</td>
                    <td className="py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">R$ {prod.preco_ideal.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <a 
                        href="#/produtos"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all"
                      >
                        Corrigir <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
