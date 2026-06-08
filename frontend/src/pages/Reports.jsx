import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, Printer } from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('geral');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/reports');
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="text-sm font-semibold text-gray-500 mt-2">Carregando relatórios...</p>
      </div>
    );
  }

  const allProducts = reports?.allProducts || [];
  const mostProfitable = reports?.mostProfitable || [];
  const lowestMargins = reports?.lowestMargins || [];

  // Summary statistics
  const totalProducts = allProducts.length;
  const criticalCount = allProducts.filter(p => p.margem_obtida < 5).length;
  const criticalPercent = totalProducts > 0 ? ((criticalCount / totalProducts) * 100).toFixed(0) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-full animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Relatórios Financeiros</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visão analítica de lucratividade, margem e performance de preços.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-250 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Warning Insights bar */}
      {criticalCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-3xl print:hidden">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-450">Insight de Margem de Lucro</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Atenção: <span className="font-bold">{criticalCount} produtos ({criticalPercent}%)</span> do seu catálogo estão com margens líquidas abaixo de 5%. Considere reajustar o markup divisor desses itens na calculadora para evitar prejuízos operacionais.
            </p>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 print:hidden">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'geral' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Visão Geral ({totalProducts})
        </button>
        <button
          onClick={() => setActiveTab('lucrativos')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'lucrativos' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Mais Lucrativos (Top 5)
        </button>
        <button
          onClick={() => setActiveTab('alertas')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'alertas' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Margem Crítica / Risco
        </button>
      </div>

      {/* Tab Contents: 1. Geral */}
      {activeTab === 'geral' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden transition-colors">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-6 font-display hidden print:block">Relatório de Produtos — PrecificaPro</h4>
          
          {allProducts.length === 0 ? (
            <p className="text-sm font-semibold text-gray-500 text-center py-10">Nenhum produto cadastrado para gerar relatórios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3">Dados do SKU</th>
                    <th className="py-3">Canal</th>
                    <th className="py-3 text-right">Custo Físico</th>
                    <th className="py-3 text-right">Taxas (Imp+Com)</th>
                    <th className="py-3 text-right">Preço de Venda</th>
                    <th className="py-3 text-right">Preço Ideal Min</th>
                    <th className="py-3 text-right">Lucro Un.</th>
                    <th className="py-3 text-right">Margem Líquida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {allProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{p.nome}</p>
                          <span className="text-xs text-gray-450 dark:text-gray-500">{p.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 uppercase text-xs">{p.marketplace.replace('_', ' ')}</td>
                      <td className="py-4 text-right">R$ {(p.custo + p.frete + p.embalagem).toFixed(2)}</td>
                      <td className="py-4 text-right text-gray-500 dark:text-gray-400">R$ {(p.preco_atual * ((p.imposto + p.comissao)/100)).toFixed(2)}</td>
                      <td className="py-4 text-right text-gray-900 dark:text-white font-bold">R$ {p.preco_atual.toFixed(2)}</td>
                      <td className="py-4 text-right text-emerald-650 dark:text-emerald-400">R$ {p.preco_ideal.toFixed(2)}</td>
                      <td className={`py-4 text-right font-bold ${p.lucro < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        R$ {p.lucro.toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.margem_obtida < 5 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                          {p.margem_obtida.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: 2. Mais Lucrativos */}
      {activeTab === 'lucrativos' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostProfitable.map((p, index) => (
              <div 
                key={p.id} 
                className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all hover:scale-101"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm font-display">
                    #{index + 1}
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    {p.marketplace.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{p.nome}</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">SKU: {p.sku}</p>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Preço de Venda</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">R$ {p.preco_atual.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-450 uppercase tracking-wider block text-emerald-500">Lucro Líquido</span>
                    <span className="text-base font-extrabold text-emerald-500 flex items-center gap-1">
                      R$ {p.lucro.toFixed(2)}
                      <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-emerald-50/20 dark:bg-emerald-950/10 p-2.5 rounded-xl text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    Margem Líquida Real: <span className="font-extrabold text-emerald-600 dark:text-emerald-450">{p.margem_obtida}%</span>
                  </span>
                </div>

              </div>
            ))}
          </div>

          {mostProfitable.length === 0 && (
            <p className="text-sm font-semibold text-gray-500 text-center py-10">Sem dados suficientes.</p>
          )}

        </div>
      )}

      {/* Tab Contents: 3. Margem Crítica */}
      {activeTab === 'alertas' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lowestMargins.map((p) => {
              const isNegative = p.margem_obtida < 0;
              return (
                <div 
                  key={p.id} 
                  className={`bg-white dark:bg-gray-900 border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors ${isNegative ? 'border-rose-100 dark:border-rose-900/30' : 'border-gray-150 dark:border-gray-800'}`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isNegative ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450'}`}>
                        {isNegative ? 'Crítico (Prejuízo)' : 'Margem Alerta'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.marketplace.replace('_', ' ')}</span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{p.nome}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500">SKU: {p.sku}</p>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Preço Praticado</span>
                        <span className="text-sm font-extrabold text-gray-800 dark:text-white">R$ {p.preco_atual.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-450 uppercase tracking-wider block text-rose-500">Lucro Líquido</span>
                        <span className={`text-sm font-bold flex items-center gap-0.5 ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          R$ {p.lucro.toFixed(2)}
                          <ArrowDown className="w-3 h-3 shrink-0" />
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-450 uppercase tracking-wider block text-emerald-500 font-semibold">Preço Ideal Mín</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450">R$ {p.preco_ideal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-xl text-center text-xs font-semibold ${isNegative ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'}`}>
                    Margem Líquida Obtida: <span className="font-extrabold">{p.margem_obtida.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {lowestMargins.length === 0 && (
            <p className="text-sm font-semibold text-gray-500 text-center py-10">Nenhum produto crítico detectado.</p>
          )}

        </div>
      )}

    </div>
  );
};

export default Reports;
