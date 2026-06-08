import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Percent,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

const MARKETPLACES = [
  { id: 'mercado_livre', name: 'Mercado Livre' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'magalu', name: 'Magalu' },
  { id: 'shein', name: 'Shein' },
  { id: 'tiktok_shop', name: 'TikTok Shop' },
  { id: 'olist', name: 'Olist' },
  { id: 'webcontinental', name: 'Webcontinental' }
];

const Products = ({ autoOpenAdd }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Cadastrar Produto');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [id, setId] = useState(null);
  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [marketplace, setMarketplace] = useState('mercado_livre');
  const [custo, setCusto] = useState('0');
  const [frete, setFrete] = useState('0');
  const [embalagem, setEmbalagem] = useState('0');
  const [imposto, setImposto] = useState('6.0'); // Default standard imposto in Brazil
  const [comissao, setComissao] = useState('18.0'); // Default commission rate
  const [margem, setMargem] = useState('15.0'); // Desired margin rate
  const [precoAtual, setPrecoAtual] = useState('0');

  // Specialized cost calculation modes
  const [custoTipo, setCustoTipo] = useState('revenda'); // 'revenda', 'fabricacao', 'confeccao'
  const [productionCosts, setProductionCosts] = useState([]);
  const [productionCostId, setProductionCostId] = useState('');

  // Preview calculations
  const [previewMetrics, setPreviewMetrics] = useState({
    precoIdeal: 0,
    lucro: 0,
    margemObtida: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCostSheets();
  }, []);

  useEffect(() => {
    if (autoOpenAdd) {
      handleOpenAddModal();
    }
  }, [autoOpenAdd]);

  useEffect(() => {
    if (!isModalOpen && window.location.hash === '#/produtos/novo') {
      window.location.hash = '#/produtos';
    }
  }, [isModalOpen]);

  // Update calculations live as user inputs form data
  useEffect(() => {
    runFormPreview();
  }, [custo, frete, embalagem, imposto, comissao, margem, precoAtual]);

  // Dynamically calculate cost based on selected cost sheet
  useEffect(() => {
    if (productionCostId) {
      const selectedSheet = productionCosts.find(c => c.id === productionCostId);
      if (selectedSheet) {
        setCusto(selectedSheet.custo_total.toString());
        setCustoTipo(selectedSheet.custo_tipo);
      }
    }
  }, [productionCostId, productionCosts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostSheets = async () => {
    try {
      const response = await api.get('/production-costs');
      if (response.data.success) {
        setProductionCosts(response.data.productionCosts);
      }
    } catch (err) {
      console.error('Error fetching cost sheets:', err);
    }
  };

  const runFormPreview = () => {
    const c = parseFloat(custo) || 0;
    const f = parseFloat(frete) || 0;
    const emb = parseFloat(embalagem) || 0;
    const imp = parseFloat(imposto) || 0;
    const com = parseFloat(comissao) || 0;
    const m = parseFloat(margem) || 0;
    const p = parseFloat(precoAtual) || 0;

    const totalCusto = c + f + emb;
    
    // Ideal Price formula
    const taxasFrac = (imp + com) / 100;
    const margemFrac = m / 100;
    const denominator = 1 - taxasFrac - margemFrac;
    const ideal = denominator > 0 ? (totalCusto / denominator) : (totalCusto / 0.1);

    // Lucro formula
    const impostoVal = p * (imp / 100);
    const comissaoVal = p * (com / 100);
    const profit = p - (totalCusto + impostoVal + comissaoVal);

    // Real margin
    const marginReal = p > 0 ? (profit / p) * 100 : 0;

    setPreviewMetrics({
      precoIdeal: ideal,
      lucro: profit,
      margemObtida: marginReal
    });
  };

  const resetForm = () => {
    setId(null);
    setNome('');
    setSku('');
    setMarketplace('mercado_livre');
    setCusto('0');
    setFrete('0');
    setEmbalagem('0');
    setImposto('6.0');
    setComissao('18.0');
    setMargem('15.0');
    setPrecoAtual('0');
    
    // Specialized cost types resets
    setCustoTipo('revenda');
    setProductionCostId('');

    setError('');
    setSuccess('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalTitle('Cadastrar Produto');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    resetForm();
    setId(prod.id);
    setNome(prod.nome);
    setSku(prod.sku);
    setMarketplace(prod.marketplace);
    setCusto(prod.custo.toString());
    setFrete(prod.frete.toString());
    setEmbalagem(prod.embalagem.toString());
    setImposto(prod.imposto.toString());
    setComissao(prod.comissao.toString());
    setMargem(prod.margem.toString());
    setPrecoAtual(prod.preco_atual.toString());

    // Load specialized fields
    const cTipo = prod.custo_tipo || 'revenda';
    setCustoTipo(cTipo);
    setProductionCostId(prod.production_cost_id || '');

    setModalTitle('Editar Produto');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !sku || !marketplace) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    setFormLoading(true);
    setError('');

    const payload = {
      nome: nome.trim(),
      sku: sku.trim().toUpperCase(),
      marketplace,
      custo: parseFloat(custo) || 0,
      frete: parseFloat(frete) || 0,
      embalagem: parseFloat(embalagem) || 0,
      imposto: parseFloat(imposto) || 0,
      comissao: parseFloat(comissao) || 0,
      margem: parseFloat(margem) || 0,
      preco_atual: parseFloat(precoAtual) || 0,
      custo_tipo: custoTipo,
      production_cost_id: productionCostId || null
    };

    try {
      let response;
      if (id) {
        response = await api.put(`/products/${id}`, payload);
      } else {
        response = await api.post('/products', payload);
      }

      if (response.data.success) {
        setSuccess('Salvo com sucesso!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchProducts();
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar o produto.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await api.delete(`/products/${productId}`);
      if (response.data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erro ao excluir produto.');
    }
  };

  // Filter products based on search and marketplace select
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesMarketplace = filterMarketplace ? p.marketplace === filterMarketplace : true;
    return matchesSearch && matchesMarketplace;
  });



  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Produtos & Anúncios</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie os preços, comissões e margens por marketplace.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/15 transition-all"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Produto
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-3xl transition-colors">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-450 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por SKU ou Nome do Produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        {/* Filter select */}
        <div className="relative min-w-[200px] flex items-center">
          <Filter className="absolute left-3.5 w-4 h-4 text-gray-450 dark:text-gray-500" />
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Todos Canais</option>
            {MARKETPLACES.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden transition-colors">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-3">Carregando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-500/70 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nenhum produto cadastrado</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">Adicione novos produtos ou integre seus canais no menu "Marketplaces" para começar a analisar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800">
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Dados do Produto</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Canal de Venda</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Custo Unitário</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Preço Venda</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Preço Ideal Min</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Lucro Líquido</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Margem Real</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{prod.nome}</p>
                          {prod.custo_tipo === 'fabricacao' && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 uppercase tracking-wider">
                              Indústria
                            </span>
                          )}
                          {prod.custo_tipo === 'confeccao' && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20 uppercase tracking-wider">
                              Moda
                            </span>
                          )}
                          {(prod.custo_tipo === 'revenda' || !prod.custo_tipo) && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 uppercase tracking-wider">
                              Revenda
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{prod.sku}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                        {prod.marketplace.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {(prod.custo + prod.frete + prod.embalagem).toFixed(2)}
                    </td>
                    <td className="py-4 text-sm font-bold text-gray-900 dark:text-white">
                      R$ {prod.preco_atual.toFixed(2)}
                    </td>
                    <td className="py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      R$ {prod.preco_ideal.toFixed(2)}
                    </td>
                    <td className={`py-4 text-sm font-bold ${prod.lucro < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      R$ {prod.lucro.toFixed(2)}
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${prod.margem_obtida < 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                        {prod.margem_obtida.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">{modalTitle}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <Check className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Layout Split: Inputs on left, Live Calculations on right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Inputs Columns */}
                <div className="space-y-4">
                  
                  {/* Nome */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Teclado Mecânico RGB"
                      className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* SKU / Marketplace */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">SKU / Identificador *</label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Ex: KB-RGB-01"
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Canal de Venda *</label>
                      <select
                        value={marketplace}
                        onChange={(e) => setMarketplace(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {MARKETPLACES.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Origem do Custo Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Origem do Custo (Ficha de Custo vs. Revenda)
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-55 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setProductionCostId('');
                          setCustoTipo('revenda');
                          setCusto('0');
                        }}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${!productionCostId ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                      >
                        Revenda (Manual)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (productionCosts.length > 0) {
                            setProductionCostId(productionCosts[0].id);
                          } else {
                            alert('Nenhuma ficha de custo cadastrada. Por favor, crie uma na aba "Fichas de Custo" primeiro.');
                          }
                        }}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${productionCostId ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                      >
                        Ficha de Custo
                      </button>
                    </div>
                  </div>

                  {/* Dropdown if linked to a Cost Sheet */}
                  {productionCostId && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Selecionar Ficha de Custo
                      </label>
                      <select
                        value={productionCostId}
                        onChange={(e) => setProductionCostId(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {productionCosts.map(sheet => (
                          <option key={sheet.id} value={sheet.id}>
                            {sheet.nome} (SKU: {sheet.sku}) - R$ {sheet.custo_total.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custo / Frete / Embalagem */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Custo Prod. (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        disabled={!!productionCostId}
                        value={custo}
                        onChange={(e) => setCusto(e.target.value)}
                        className={`w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 ${productionCostId ? 'bg-gray-100 dark:bg-gray-800 text-gray-550 dark:text-gray-405 font-bold cursor-not-allowed' : 'bg-gray-50/50 dark:bg-gray-800/40'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Frete Envio (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={frete}
                        onChange={(e) => setFrete(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Embalagem (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={embalagem}
                        onChange={(e) => setEmbalagem(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Imposto / Comissão / Margem Desejada */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Imposto (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={imposto}
                        onChange={(e) => setImposto(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Comissão (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={comissao}
                        onChange={(e) => setComissao(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Margem Desejada (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={margem}
                        onChange={(e) => setMargem(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Preço Atual */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Preço de Venda Praticado (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={precoAtual}
                      onChange={(e) => setPrecoAtual(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                </div>

                {/* Live Preview Panel (Aesthetics) */}
                <div className="bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Pré-visualização do Cálculo</h4>
                    
                    {/* Live Metric display */}
                    <div className="space-y-4">
                      
                      {/* Price ideal */}
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Preço Sugerido (Ideal):</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {previewMetrics.precoIdeal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Profit */}
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Lucro Líquido p/ Unidade:</span>
                        <span className={`text-lg font-bold ${previewMetrics.lucro < 0 ? 'text-rose-650 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          R$ {previewMetrics.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Margin obtained */}
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Margem Líquida Real:</span>
                        <span className={`text-lg font-bold px-2 py-0.5 rounded ${previewMetrics.margemObtida < 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                          {previewMetrics.margemObtida.toFixed(1)}%
                        </span>
                      </div>

                      {/* Cost total info */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Soma Custos Físicos:</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          R$ {(parseFloat(custo) + parseFloat(frete) + parseFloat(embalagem)).toFixed(2)}
                        </span>
                      </div>
                      {productionCostId && (
                        <div className="pl-3 border-l-2 border-emerald-400 space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-405">
                            <span>Vínculo de Ficha:</span>
                            <span className="font-bold text-emerald-500">Ativado (Custo Travado)</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Fees total info */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Imposto ({imposto}%) + Comissão ({comissao}%):</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          R$ {((parseFloat(precoAtual) || 0) * ((parseFloat(imposto) + parseFloat(comissao)) / 100)).toFixed(2)}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Profit indicator box */}
                  <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 ${previewMetrics.lucro < 0 ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30'}`}>
                    {previewMetrics.lucro < 0 ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-550 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-450">Operação com Prejuízo!</p>
                          <p className="text-xs text-rose-600 dark:text-rose-400/90 mt-0.5">O preço praticado não cobre os custos operacionais e impostos. Aumente o valor para no mínimo R$ {previewMetrics.precoIdeal.toFixed(2)} para atingir a margem desejada de {margem}%.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-550 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-450">Margem Saudável</p>
                          <p className="text-xs text-emerald-605 dark:text-emerald-400/90 mt-0.5 font-medium">A precificação atual está gerando lucro líquido positivo de R$ {previewMetrics.lucro.toFixed(2)} por unidade vendida.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Explaining e-commerce math */}
                  <div className="mt-4 p-3.5 bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/10 dark:border-purple-900/20 rounded-2xl text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      Como funciona a precificação?
                    </span>
                    As taxas de marketplace (Comissão e Imposto) incidem sobre o **Preço de Venda Final** (método de cálculo por dentro). O preço ideal (sugerido) garante que após pagar todas as taxas e cobrir o custo físico da peça, você ainda tenha a margem de {margem}% livre.
                  </div>

                </div>

              </div>

              {/* Form Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/60 rounded-xl shadow-md transition-all"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
