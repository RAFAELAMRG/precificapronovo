import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, HelpCircle, AlertCircle, Percent } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const MARKETPLACES_DEFAULT = {
  mercado_livre: { name: 'Mercado Livre', comissao: 12.0, imposto: 6.0, frete: 25.0, flatFee: 6.0 },
  shopee: { name: 'Shopee', comissao: 20.0, imposto: 6.0, frete: 12.0, flatFee: 4.0 },
  amazon: { name: 'Amazon', comissao: 15.0, imposto: 6.0, frete: 18.0, flatFee: 0.0 },
  magalu: { name: 'Magalu', comissao: 16.0, imposto: 6.0, frete: 10.0, flatFee: 5.0 },
  shein: { name: 'Shein', comissao: 14.0, imposto: 6.0, frete: 8.0, flatFee: 3.0 },
  tiktok_shop: { name: 'TikTok Shop', comissao: 15.0, imposto: 6.0, frete: 12.0, flatFee: 2.0 }
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const PricingCalculator = () => {
  const [selectedChannel, setSelectedChannel] = useState('mercado_livre');
  const [custo, setCusto] = useState('100.00');
  const [frete, setFrete] = useState('25.00');
  const [embalagem, setEmbalagem] = useState('5.00');
  const [imposto, setImposto] = useState('6.0');
  const [comissao, setComissao] = useState('12.0');
  const [margem, setMargem] = useState('15.0');
  
  // Results states
  const [results, setResults] = useState({
    precoIdeal: 0,
    breakEven: 0,
    custosFisicos: 0,
    lucroValor: 0,
    taxasValor: 0
  });

  useEffect(() => {
    // Load pre-configured rates when changing channels
    if (selectedChannel && MARKETPLACES_DEFAULT[selectedChannel]) {
      const channel = MARKETPLACES_DEFAULT[selectedChannel];
      setComissao(channel.comissao.toString());
      setImposto(channel.imposto.toString());
      setFrete((channel.frete + channel.flatFee).toString());
    }
  }, [selectedChannel]);

  useEffect(() => {
    calculateRates();
  }, [custo, frete, embalagem, imposto, comissao, margem]);

  const calculateRates = () => {
    const c = parseFloat(custo) || 0;
    const f = parseFloat(frete) || 0;
    const emb = parseFloat(embalagem) || 0;
    const imp = parseFloat(imposto) || 0;
    const com = parseFloat(comissao) || 0;
    const m = parseFloat(margem) || 0;

    const custosFisicos = c + f + emb;
    
    // Formula ideal price
    const impostoFrac = imp / 100;
    const comissaoFrac = com / 100;
    const margemFrac = m / 100;
    
    const denominatorIdeal = 1 - (impostoFrac + comissaoFrac + margemFrac);
    const precoIdeal = denominatorIdeal > 0 ? (custosFisicos / denominatorIdeal) : (custosFisicos / 0.1);

    // Formula Break Even (margin = 0)
    const denominatorBreakEven = 1 - (impostoFrac + comissaoFrac);
    const breakEven = denominatorBreakEven > 0 ? (custosFisicos / denominatorBreakEven) : (custosFisicos / 0.1);

    // Calculation values on Preco Ideal
    const taxasValor = precoIdeal * (impostoFrac + comissaoFrac);
    const lucroValor = precoIdeal - custosFisicos - taxasValor;

    setResults({
      precoIdeal: parseFloat(precoIdeal.toFixed(2)),
      breakEven: parseFloat(breakEven.toFixed(2)),
      custosFisicos: parseFloat(custosFisicos.toFixed(2)),
      lucroValor: parseFloat(lucroValor.toFixed(2)),
      taxasValor: parseFloat(taxasValor.toFixed(2))
    });
  };

  const chartData = [
    { name: 'Lucro Líquido', value: results.lucroValor },
    { name: 'Custo Físico', value: results.custosFisicos },
    { name: 'Taxas & Impostos', value: results.taxasValor }
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Calculadora de Precificação</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Faça simulações financeiras antes de anunciar ou reajustar seus preços nos canais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Inputs Sandbox */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-base font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              Simular Produto
            </h4>
            
            {/* Quick Channel Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Perfil Base:</span>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
              >
                <option value="custom">Personalizado</option>
                {Object.entries(MARKETPLACES_DEFAULT).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Costs Input section */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custos do Produto (R$)</h5>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Preço de Custo (Distribuidor)</label>
                <input
                  type="number"
                  step="0.01"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Frete e Logística (Envio)</label>
                <input
                  type="number"
                  step="0.01"
                  value={frete}
                  onChange={(e) => setFrete(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Embalagem e Manuseio</label>
                <input
                  type="number"
                  step="0.01"
                  value={embalagem}
                  onChange={(e) => setEmbalagem(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Fees and Target Margin section */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Encargos & Metas (%)</h5>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Impostos sobre Vendas (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={imposto}
                  onChange={(e) => {
                    setSelectedChannel('custom');
                    setImposto(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Comissão do Marketplace (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={comissao}
                  onChange={(e) => {
                    setSelectedChannel('custom');
                    setComissao(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Margem Líquida Desejada (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={margem}
                  onChange={(e) => setMargem(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

          </div>

          {/* Quick formula help disclaimer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl text-xs text-gray-500 dark:text-gray-400/90 leading-relaxed">
            <span className="font-bold text-gray-800 dark:text-white block mb-1">Como funciona a precificação por Markup Divisor?</span>
            O sistema calcula o preço final baseado na comissão e imposto cobrados sobre o valor total da venda, acrescido de sua margem de lucro. A fórmula real é: 
            <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded ml-1 font-semibold">Preço Ideal = Custo Total / (1 - Taxas% - Margem%)</code>
          </div>

        </div>

        {/* Right side: Dynamic Graph Results */}
        <div className="space-y-6">
          
          {/* Results Summary Box */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors">
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Preço Recomendado</h4>
              
              {/* Calculated Ideal Price */}
              <div className="bg-emerald-500/10 p-5 rounded-2xl text-center border border-emerald-500/10">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Vender Por No Mínimo</p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-display">
                  R$ {results.precoIdeal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>

              {/* Breakdown numbers */}
              <div className="space-y-2.5 pt-2">
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    Lucro Esperado:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {results.lucroValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({margem}%)
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    Custo total do produto:
                  </span>
                  <span className="font-semibold text-gray-850 dark:text-gray-200">
                    R$ {results.custosFisicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    Taxas & Comissão:
                  </span>
                  <span className="font-semibold text-gray-850 dark:text-gray-200">
                    R$ {results.taxasValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
                
                {/* Break even display */}
                <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Break-Even (Margem Zero):</span>
                  <span className="font-bold text-gray-800 dark:text-white">
                    R$ {results.breakEven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* Recharts Pie composition */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-colors">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Composição da Venda</h4>
            
            <div className="h-60 relative flex justify-center items-center">
              {results.precoIdeal <= 0 ? (
                <p className="text-xs text-gray-400">Digite os custos para ver a composição</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PricingCalculator;
