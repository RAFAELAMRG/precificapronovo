import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Factory,
  Layers,
  Sparkles,
  Gem
} from 'lucide-react';
import api from '../services/api';

const ProductionCosts = () => {
  const [productionCosts, setProductionCosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Cadastrar Ficha de Custo');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [id, setId] = useState(null);
  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [custoTipo, setCustoTipo] = useState('fabricacao'); // 'fabricacao', 'confeccao', 'semijoia'

  // Fabrication fields
  const [insumos, setInsumos] = useState([{ nome: '', quantidade: 1, custo: 0 }]);
  const [maoDeObra, setMaoDeObra] = useState('0');
  const [custoOperacional, setCustoOperacional] = useState('0');

  // Confecção fields
  const [tecidoPreco, setTecidoPreco] = useState('0');
  const [tecidoConsumo, setTecidoConsumo] = useState('0');
  const [tecidoUnidade, setTecidoUnidade] = useState('m'); // 'm', 'cm', 'unid'
  const [aviamentos, setAviamentos] = useState([{ nome: '', custo: 0 }]);
  const [servicos, setServicos] = useState([{ nome: '', custo: 0 }]);

  // Semijoia fields
  const [brutoPreco, setBrutoPreco] = useState('0');
  const [peso, setPeso] = useState('0');
  const [banhoTipo, setBanhoTipo] = useState('peso'); // 'peso' or 'fixo'
  const [banhoPreco, setBanhoPreco] = useState('0');
  const [cravejamentoPreco, setCravejamentoPreco] = useState('0');
  const [pedras, setPedras] = useState([{ nome: '', quantidade: 1, custo: 0 }]);
  const [servicosSemi, setServicosSemi] = useState([{ nome: '', custo: 0 }]);

  // Live total computed cost
  const [custoTotal, setCustoTotal] = useState(0);

  useEffect(() => {
    fetchCostSheets();
  }, []);

  // Update total calculated cost based on sub-form inputs
  useEffect(() => {
    if (custoTipo === 'fabricacao') {
      const insumosSum = insumos.reduce((acc, item) => {
        const qty = parseFloat(item.quantidade) || 0;
        const val = parseFloat(item.custo) || 0;
        return acc + (qty * val);
      }, 0);
      const mo = parseFloat(maoDeObra) || 0;
      const co = parseFloat(custoOperacional) || 0;
      setCustoTotal(insumosSum + mo + co);
    } else if (custoTipo === 'confeccao') {
      const tp = parseFloat(tecidoPreco) || 0;
      const tc = parseFloat(tecidoConsumo) || 0;
      let tecidoCusto;
      if (tecidoUnidade === 'cm') {
        tecidoCusto = tp * (tc / 100);
      } else if (tecidoUnidade === 'unid') {
        tecidoCusto = tp;
      } else {
        tecidoCusto = tp * tc;
      }
      const aviamentosSum = aviamentos.reduce((acc, item) => acc + (parseFloat(item.custo) || 0), 0);
      const servicosSum = servicos.reduce((acc, item) => acc + (parseFloat(item.custo) || 0), 0);
      setCustoTotal(tecidoCusto + aviamentosSum + servicosSum);
    } else if (custoTipo === 'semijoia') {
      const bp = parseFloat(brutoPreco) || 0;
      const pg = parseFloat(peso) || 0;
      const bPrc = parseFloat(banhoPreco) || 0;
      const banhoCusto = banhoTipo === 'peso' ? pg * bPrc : bPrc;
      const cravCusto = parseFloat(cravejamentoPreco) || 0;
      const pedrasCusto = pedras.reduce((acc, p) => acc + ((parseFloat(p.quantidade) || 0) * (parseFloat(p.custo) || 0)), 0);
      const servicosSemiCusto = servicosSemi.reduce((acc, s) => acc + (parseFloat(s.custo) || 0), 0);
      setCustoTotal(bp + banhoCusto + cravCusto + pedrasCusto + servicosSemiCusto);
    }
  }, [custoTipo, insumos, maoDeObra, custoOperacional, tecidoPreco, tecidoConsumo, tecidoUnidade, aviamentos, servicos, brutoPreco, peso, banhoTipo, banhoPreco, cravejamentoPreco, pedras, servicosSemi]);

  const fetchCostSheets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/production-costs');
      if (response.data.success) {
        setProductionCosts(response.data.productionCosts);
      }
    } catch (err) {
      console.error('Error fetching cost sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setId(null);
    setNome('');
    setSku('');
    setCustoTipo('fabricacao');
    setInsumos([{ nome: '', quantidade: 1, custo: 0 }]);
    setMaoDeObra('0');
    setCustoOperacional('0');
    setTecidoPreco('0');
    setTecidoConsumo('0');
    setTecidoUnidade('m');
    setAviamentos([{ nome: '', custo: 0 }]);
    setServicos([{ nome: '', custo: 0 }]);
    setBrutoPreco('0');
    setPeso('0');
    setBanhoTipo('peso');
    setBanhoPreco('0');
    setCravejamentoPreco('0');
    setPedras([{ nome: '', quantidade: 1, custo: 0 }]);
    setServicosSemi([{ nome: '', custo: 0 }]);
    setError('');
    setSuccess('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalTitle('Cadastrar Ficha de Custo');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sheet) => {
    resetForm();
    setId(sheet.id);
    setNome(sheet.nome);
    setSku(sheet.sku);
    setCustoTipo(sheet.custo_tipo);

    if (sheet.detalhes_custo) {
      try {
        const det = typeof sheet.detalhes_custo === 'string'
          ? JSON.parse(sheet.detalhes_custo)
          : sheet.detalhes_custo;
        
        if (sheet.custo_tipo === 'fabricacao') {
          if (det.insumos && Array.isArray(det.insumos)) setInsumos(det.insumos);
          if (det.mao_de_obra !== undefined) setMaoDeObra(det.mao_de_obra.toString());
          if (det.custo_operacional !== undefined) setCustoOperacional(det.custo_operacional.toString());
        } else if (sheet.custo_tipo === 'confeccao') {
          if (det.tecido_preco !== undefined) setTecidoPreco(det.tecido_preco.toString());
          if (det.tecido_consumo !== undefined) setTecidoConsumo(det.tecido_consumo.toString());
          if (det.tecido_unidade) setTecidoUnidade(det.tecido_unidade);
          if (det.aviamentos && Array.isArray(det.aviamentos)) setAviamentos(det.aviamentos);
          if (det.servicos && Array.isArray(det.servicos)) setServicos(det.servicos);
        } else if (sheet.custo_tipo === 'semijoia') {
          if (det.bruto_preco !== undefined) setBrutoPreco(det.bruto_preco.toString());
          if (det.peso !== undefined) setPeso(det.peso.toString());
          if (det.banho_tipo) setBanhoTipo(det.banho_tipo);
          if (det.banho_preco !== undefined) setBanhoPreco(det.banho_preco.toString());
          if (det.cravejamento_preco !== undefined) setCravejamentoPreco(det.cravejamento_preco.toString());
          if (det.pedras && Array.isArray(det.pedras)) setPedras(det.pedras);
          if (det.servicos && Array.isArray(det.servicos)) setServicosSemi(det.servicos);
        }
      } catch (e) {
        console.error('Error parsing details:', e);
      }
    }

    setModalTitle('Editar Ficha de Custo');
    setIsModalOpen(true);
  };

  // Fabricante helpers
  const handleAddInsumo = () => {
    setInsumos([...insumos, { nome: '', quantidade: 1, custo: 0 }]);
  };
  const handleRemoveInsumo = (index) => {
    const newInsumos = insumos.filter((_, i) => i !== index);
    setInsumos(newInsumos.length > 0 ? newInsumos : [{ nome: '', quantidade: 1, custo: 0 }]);
  };
  const handleInsumoChange = (index, field, value) => {
    const newInsumos = [...insumos];
    newInsumos[index][field] = value;
    setInsumos(newInsumos);
  };

  // Confecção helpers
  const handleAddAviamento = () => {
    setAviamentos([...aviamentos, { nome: '', custo: 0 }]);
  };
  const handleRemoveAviamento = (index) => {
    const newAviamentos = aviamentos.filter((_, i) => i !== index);
    setAviamentos(newAviamentos.length > 0 ? newAviamentos : [{ nome: '', custo: 0 }]);
  };
  const handleAviamentoChange = (index, field, value) => {
    const newAviamentos = [...aviamentos];
    newAviamentos[index][field] = value;
    setAviamentos(newAviamentos);
  };

  const handleAddServico = () => {
    setServicos([...servicos, { nome: '', custo: 0 }]);
  };
  const handleRemoveServico = (index) => {
    const newServicos = servicos.filter((_, i) => i !== index);
    setServicos(newServicos.length > 0 ? newServicos : [{ nome: '', custo: 0 }]);
  };
  const handleServicoChange = (index, field, value) => {
    const newServicos = [...servicos];
    newServicos[index][field] = value;
    setServicos(newServicos);
  };

  // Semijoia helpers
  const handleAddPedra = () => setPedras([...pedras, { nome: '', quantidade: 1, custo: 0 }]);
  const handleRemovePedra = (i) => { const n = pedras.filter((_, idx) => idx !== i); setPedras(n.length > 0 ? n : [{ nome: '', quantidade: 1, custo: 0 }]); };
  const handlePedraChange = (i, field, val) => { const n = [...pedras]; n[i][field] = val; setPedras(n); };

  const handleAddServicoSemi = () => setServicosSemi([...servicosSemi, { nome: '', custo: 0 }]);
  const handleRemoveServicoSemi = (i) => { const n = servicosSemi.filter((_, idx) => idx !== i); setServicosSemi(n.length > 0 ? n : [{ nome: '', custo: 0 }]); };
  const handleServicoSemiChange = (i, field, val) => { const n = [...servicosSemi]; n[i][field] = val; setServicosSemi(n); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !sku) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    setFormLoading(true);
    setError('');

    let detalhesCusto = null;
    if (custoTipo === 'fabricacao') {
      detalhesCusto = {
        insumos,
        mao_de_obra: parseFloat(maoDeObra) || 0,
        custo_operacional: parseFloat(custoOperacional) || 0
      };
    } else if (custoTipo === 'confeccao') {
      detalhesCusto = {
        tecido_preco: parseFloat(tecidoPreco) || 0,
        tecido_consumo: parseFloat(tecidoConsumo) || 0,
        tecido_unidade: tecidoUnidade,
        aviamentos,
        servicos
      };
    } else if (custoTipo === 'semijoia') {
      detalhesCusto = {
        bruto_preco: parseFloat(brutoPreco) || 0,
        peso: parseFloat(peso) || 0,
        banho_tipo: banhoTipo,
        banho_preco: parseFloat(banhoPreco) || 0,
        cravejamento_preco: parseFloat(cravejamentoPreco) || 0,
        pedras,
        servicos: servicosSemi
      };
    }

    const payload = {
      nome: nome.trim(),
      sku: sku.trim().toUpperCase(),
      custo_tipo: custoTipo,
      detalhes_custo: detalhesCusto
    };

    try {
      let response;
      if (id) {
        response = await api.put(`/production-costs/${id}`, payload);
      } else {
        response = await api.post('/production-costs', payload);
      }

      if (response.data.success) {
        setSuccess('Ficha de custo salva com sucesso!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchCostSheets();
        }, 850);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar ficha de custo.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Ficha de Custo? Todos os produtos vinculados a ela passarão a usar custos de Revenda (manuais).')) return;
    try {
      const response = await api.delete(`/production-costs/${sheetId}`);
      if (response.data.success) {
        fetchCostSheets();
      }
    } catch (err) {
      console.error('Error deleting cost sheet:', err);
      alert('Erro ao excluir ficha de custo.');
    }
  };

  const filteredCosts = productionCosts.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) || 
    c.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Percent calculation breakdowns
  const tp = parseFloat(tecidoPreco) || 0;
  const tc = parseFloat(tecidoConsumo) || 0;
  let tecidoTotal;
  if (tecidoUnidade === 'cm') tecidoTotal = tp * (tc / 100);
  else if (tecidoUnidade === 'unid') tecidoTotal = tp;
  else tecidoTotal = tp * tc;
  const aviamentosTotal = aviamentos.reduce((acc, it) => acc + (parseFloat(it.custo) || 0), 0);
  const servicosTotal = servicos.reduce((acc, it) => acc + (parseFloat(it.custo) || 0), 0);
  const totalConfeccaoSum = tecidoTotal + aviamentosTotal + servicosTotal;

  const pctTecido = totalConfeccaoSum > 0 ? (tecidoTotal / totalConfeccaoSum) * 100 : 0;
  const pctAviamentos = totalConfeccaoSum > 0 ? (aviamentosTotal / totalConfeccaoSum) * 100 : 0;
  const pctServicos = totalConfeccaoSum > 0 ? (servicosTotal / totalConfeccaoSum) * 100 : 0;

  const insumosTotal = insumos.reduce((acc, it) => acc + ((parseFloat(it.quantidade) || 0) * (parseFloat(it.custo) || 0)), 0);
  const moTotal = parseFloat(maoDeObra) || 0;
  const coTotal = parseFloat(custoOperacional) || 0;
  const totalFabricanteSum = insumosTotal + moTotal + coTotal;

  const pctInsumos = totalFabricanteSum > 0 ? (insumosTotal / totalFabricanteSum) * 100 : 0;
  const pctMo = totalFabricanteSum > 0 ? (moTotal / totalFabricanteSum) * 100 : 0;
  const pctOperacional = totalFabricanteSum > 0 ? (coTotal / totalFabricanteSum) * 100 : 0;

  // Semijoia breakdowns
  const bpVal = parseFloat(brutoPreco) || 0;
  const pesoVal = parseFloat(peso) || 0;
  const banhoVal = parseFloat(banhoPreco) || 0;
  const banhoCustoVal = banhoTipo === 'peso' ? pesoVal * banhoVal : banhoVal;
  const cravVal = parseFloat(cravejamentoPreco) || 0;
  const pedrasCustoVal = pedras.reduce((acc, p) => acc + ((parseFloat(p.quantidade) || 0) * (parseFloat(p.custo) || 0)), 0);
  const servicosSemiTotal = servicosSemi.reduce((acc, s) => acc + (parseFloat(s.custo) || 0), 0);
  const totalSemijoiaSum = bpVal + banhoCustoVal + cravVal + pedrasCustoVal + servicosSemiTotal;
  const pctBruto = totalSemijoiaSum > 0 ? (bpVal / totalSemijoiaSum) * 100 : 0;
  const pctBanho = totalSemijoiaSum > 0 ? (banhoCustoVal / totalSemijoiaSum) * 100 : 0;
  const pctCrav = totalSemijoiaSum > 0 ? ((cravVal + pedrasCustoVal) / totalSemijoiaSum) * 100 : 0;
  const pctServSemi = totalSemijoiaSum > 0 ? (servicosSemiTotal / totalSemijoiaSum) * 100 : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Fichas de Custo (Produção)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie os custos de fabricação e confecção que abastecem os anúncios do marketplace.
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/15 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Ficha de Custo
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-3xl transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-450 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por SKU ou Nome da Ficha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of sheets / Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-3">Carregando fichas de custo...</p>
          </div>
        ) : filteredCosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Factory className="w-12 h-12 text-gray-400 dark:text-gray-500/70 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nenhuma ficha de custo encontrada</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Crie fichas de custo para os seus produtos fabricados para centralizar o cálculo da matéria prima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800">
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Nome da Ficha</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">SKU Base</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Origem/Tipo</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Custo Unitário Total</th>
                  <th className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCosts.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${sheet.custo_tipo === 'semijoia' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500' : sheet.custo_tipo === 'confeccao' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-500' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-500'}`}>
                          {sheet.custo_tipo === 'semijoia' ? <Gem className="w-4 h-4" /> : sheet.custo_tipo === 'confeccao' ? <Layers className="w-4 h-4" /> : <Factory className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{sheet.nome}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {sheet.sku}
                      </span>
                    </td>
                    <td className="py-4">
                      {sheet.custo_tipo === 'fabricacao' ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 uppercase tracking-wider">
                          Fabricação (COGS)
                        </span>
                      ) : sheet.custo_tipo === 'confeccao' ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20 uppercase tracking-wider">
                          Confecção (Moda)
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 uppercase tracking-wider">
                          Semijoia / Bijuteria
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm font-extrabold text-gray-900 dark:text-white">
                      R$ {sheet.custo_total.toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(sheet)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Editar Ficha"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sheet.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Deletar Ficha"
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

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">{modalTitle}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Nome da Ficha de Custo *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Camiseta Algodão Orgânico Ficha"
                      className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        SKU Base * (Para Vínculo Automático)
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Ex: TSHIRT-ORG-01"
                        className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Tipo de Ficha *
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-55 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setCustoTipo('fabricacao')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${custoTipo === 'fabricacao' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-205'}`}
                        >
                          Indústria
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustoTipo('confeccao')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${custoTipo === 'confeccao' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-205'}`}
                        >
                          Moda
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustoTipo('semijoia')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${custoTipo === 'semijoia' ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-205'}`}
                        >
                          Joia/Semi
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fabricação inputs */}
                  {custoTipo === 'fabricacao' && (
                    <div className="space-y-4 p-5 bg-gray-50/40 dark:bg-gray-950/60 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 shadow-inner">
                      
                      <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Insumos / Matérias-Primas
                        </span>
                        <button
                          type="button"
                          onClick={handleAddInsumo}
                          className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <div className="col-span-6">Nome do Insumo</div>
                        <div className="col-span-2 text-center">Qtd</div>
                        <div className="col-span-3">Preço Unit.</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {insumos.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center hover:bg-gray-100/50 dark:hover:bg-gray-900/40 p-1 rounded-xl transition-colors">
                            <div className="col-span-6">
                              <input
                                type="text"
                                placeholder="ex: Tampo de Madeira"
                                required
                                value={item.nome}
                                onChange={(e) => handleInsumoChange(index, 'nome', e.target.value)}
                                className="w-full px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                placeholder="1"
                                required
                                step="any"
                                value={item.quantidade}
                                onChange={(e) => handleInsumoChange(index, 'quantidade', e.target.value)}
                                className="w-full text-center px-2 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                              />
                            </div>
                            <div className="col-span-3 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                              <input
                                type="number"
                                placeholder="0.00"
                                required
                                step="0.01"
                                value={item.custo}
                                onChange={(e) => handleInsumoChange(index, 'custo', e.target.value)}
                                className="w-full pl-8 pr-2 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveInsumo(index)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-gray-150 dark:border-gray-800 pt-4 mt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Mão de Obra Direta</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={maoDeObra}
                              onChange={(e) => setMaoDeObra(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Custo Operacional Indireto</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={custoOperacional}
                              onChange={(e) => setCustoOperacional(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confecção inputs */}
                  {custoTipo === 'confeccao' && (
                    <div className="space-y-4 p-5 bg-gray-50/40 dark:bg-gray-950/60 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 shadow-inner">
                      
                      <div className="space-y-3 pb-3 border-b border-gray-150 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          Tecido Principal
                        </span>
                        {/* Unit selector */}
                        <div className="flex gap-1.5">
                          {['m', 'cm', 'unid'].map(u => (
                            <button key={u} type="button" onClick={() => setTecidoUnidade(u)}
                              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                tecidoUnidade === u
                                  ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                                  : 'text-gray-400 border-gray-200 dark:border-gray-800 hover:border-purple-300'
                              }`}>
                              {u === 'unid' ? 'Por Peça' : u === 'm' ? 'Metro (m)' : 'Centímetro (cm)'}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                              {tecidoUnidade === 'unid' ? 'Custo por Peça (R$)' : `Preço do ${tecidoUnidade === 'cm' ? 'cm' : 'Metro'}`}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={tecidoPreco}
                                onChange={(e) => setTecidoPreco(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                              />
                            </div>
                          </div>
                          {tecidoUnidade !== 'unid' && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Consumo p/ Unidade</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tecidoConsumo}
                                  onChange={(e) => setTecidoConsumo(e.target.value)}
                                  className="w-full px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">{tecidoUnidade}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-1 border-b border-gray-150 dark:border-gray-800">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            Aviamentos & Acessórios
                          </span>
                          <button
                            type="button"
                            onClick={handleAddAviamento}
                            className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>

                        <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <div className="col-span-8">Nome do Aviamento</div>
                          <div className="col-span-3">Custo</div>
                          <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {aviamentos.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center hover:bg-gray-100/50 dark:hover:bg-gray-900/40 p-1 rounded-xl transition-colors">
                              <div className="col-span-8">
                                <input
                                  type="text"
                                  placeholder="ex: Zíper Invisível"
                                  required
                                  value={item.nome}
                                  onChange={(e) => handleAviamentoChange(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                                />
                              </div>
                              <div className="col-span-3 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  required
                                  step="0.01"
                                  value={item.custo}
                                  onChange={(e) => handleAviamentoChange(index, 'custo', e.target.value)}
                                  className="w-full pl-8 pr-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                                />
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAviamento(index)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-1 border-b border-gray-150 dark:border-gray-800">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                            Serviços & Oficinas Outsourced
                          </span>
                          <button
                            type="button"
                            onClick={handleAddServico}
                            className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>

                        <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <div className="col-span-8">Serviço/Oficina</div>
                          <div className="col-span-3">Custo</div>
                          <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {servicos.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center hover:bg-gray-100/50 dark:hover:bg-gray-900/40 p-1 rounded-xl transition-colors">
                              <div className="col-span-8">
                                <input
                                  type="text"
                                  placeholder="ex: Costura (Oficina)"
                                  required
                                  value={item.nome}
                                  onChange={(e) => handleServicoChange(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                                />
                              </div>
                              <div className="col-span-3 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  required
                                  step="0.01"
                                  value={item.custo}
                                  onChange={(e) => handleServicoChange(index, 'custo', e.target.value)}
                                  className="w-full pl-8 pr-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                                />
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveServico(index)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Semijoia inputs */}
                  {custoTipo === 'semijoia' && (
                    <div className="space-y-4 p-5 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl animate-in slide-in-from-top-2 duration-200 shadow-inner">
                      
                      {/* Metal Base */}
                      <div className="space-y-3 pb-3 border-b border-amber-150 dark:border-amber-900/20">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Metal Base / Bruto
                        </span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Custo do Bruto/Metal (R$)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                              <input type="number" step="0.01" value={brutoPreco} onChange={e => setBrutoPreco(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Peso da Peça (g)</label>
                            <div className="relative">
                              <input type="number" step="0.01" value={peso} onChange={e => setPeso(e.target.value)}
                                className="w-full px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">g</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Banho/Galvânica */}
                      <div className="space-y-3 pb-3 border-b border-amber-150 dark:border-amber-900/20">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          Banho / Galvânica
                        </span>
                        <div className="flex gap-1.5">
                          {[['peso', 'Por Peso (R$/g)'], ['fixo', 'Valor Fixo (R$/peça)']].map(([val, label]) => (
                            <button key={val} type="button" onClick={() => setBanhoTipo(val)}
                              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                banhoTipo === val
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'text-gray-400 border-gray-200 dark:border-gray-800 hover:border-amber-300'
                              }`}>{label}</button>
                          ))}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                          <input type="number" step="0.001" value={banhoPreco} onChange={e => setBanhoPreco(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                            {banhoTipo === 'peso' ? '/ g' : '/ peça'}
                          </span>
                        </div>
                        {banhoTipo === 'peso' && pesoVal > 0 && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            → Custo do banho: R$ {banhoCustoVal.toFixed(2)} ({pesoVal}g × R$ {banhoVal.toFixed(3)}/g)
                          </p>
                        )}
                      </div>

                      {/* Cravejamento */}
                      <div className="pb-3 border-b border-amber-150 dark:border-amber-900/20">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Cravejamento / Cravação (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">R$</span>
                          <input type="number" step="0.01" value={cravejamentoPreco} onChange={e => setCravejamentoPreco(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                        </div>
                      </div>

                      {/* Pedras */}
                      <div className="space-y-3 pb-3 border-b border-amber-150 dark:border-amber-900/20">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Pedras / Gemas
                          </span>
                          <button type="button" onClick={handleAddPedra}
                            className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <div className="col-span-5">Nome</div>
                          <div className="col-span-2 text-center">Qtd</div>
                          <div className="col-span-4">Custo Unit.</div>
                          <div className="col-span-1"></div>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {pedras.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center hover:bg-amber-50/50 dark:hover:bg-amber-900/10 p-1 rounded-xl transition-colors">
                              <div className="col-span-5">
                                <input type="text" placeholder="ex: Zircônia 2mm" value={item.nome}
                                  onChange={e => handlePedraChange(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              </div>
                              <div className="col-span-2">
                                <input type="number" placeholder="1" step="1" value={item.quantidade}
                                  onChange={e => handlePedraChange(index, 'quantidade', e.target.value)}
                                  className="w-full text-center px-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              </div>
                              <div className="col-span-4 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                                <input type="number" placeholder="0.00" step="0.01" value={item.custo}
                                  onChange={e => handlePedraChange(index, 'custo', e.target.value)}
                                  className="w-full pl-8 pr-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              </div>
                              <div className="col-span-1 text-center">
                                <button type="button" onClick={() => handleRemovePedra(index)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Serviços de Acabamento */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                            Serviços de Acabamento
                          </span>
                          <button type="button" onClick={handleAddServicoSemi}
                            className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {servicosSemi.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center hover:bg-amber-50/50 dark:hover:bg-amber-900/10 p-1 rounded-xl transition-colors">
                              <div className="col-span-8">
                                <input type="text" placeholder="ex: Polimento, Limpeza" value={item.nome}
                                  onChange={e => handleServicoSemiChange(index, 'nome', e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              </div>
                              <div className="col-span-3 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                                <input type="number" placeholder="0.00" step="0.01" value={item.custo}
                                  onChange={e => handleServicoSemiChange(index, 'custo', e.target.value)}
                                  className="w-full pl-8 pr-2 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none" />
                              </div>
                              <div className="col-span-1 text-center">
                                <button type="button" onClick={() => handleRemoveServicoSemi(index)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Panel */}
                <div className="bg-gray-55 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Resumo da Composição
                      </h4>
                    </div>

                    {/* Total Unit Cost Showcase */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-center space-y-1">
                      <p className="text-xs font-semibold text-gray-450 dark:text-gray-550 uppercase tracking-widest">
                        Custo Base Unitário
                      </p>
                      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        R$ {custoTotal.toFixed(2)}
                      </h2>
                    </div>

                    {/* Cost Breakdown Progress Bars */}
                    {custoTipo === 'fabricacao' && totalFabricanteSum > 0 && (
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Distribuição de Custos
                        </p>
                        
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${pctInsumos}%` }} className="bg-blue-500 transition-all duration-300" />
                          <div style={{ width: `${pctMo}%` }} className="bg-teal-500 transition-all duration-300" />
                          <div style={{ width: `${pctOperacional}%` }} className="bg-amber-500 transition-all duration-300" />
                        </div>

                        <div className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                              Insumos & Matérias-Primas:
                            </span>
                            <span>R$ {insumosTotal.toFixed(2)} ({pctInsumos.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                              Mão de Obra Direta:
                            </span>
                            <span>R$ {moTotal.toFixed(2)} ({pctMo.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                              Operacional Indireto:
                            </span>
                            <span>R$ {coTotal.toFixed(2)} ({pctOperacional.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {custoTipo === 'confeccao' && totalConfeccaoSum > 0 && (
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Distribuição de Custos
                        </p>
                        
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${pctTecido}%` }} className="bg-purple-500 transition-all duration-300" />
                          <div style={{ width: `${pctAviamentos}%` }} className="bg-pink-500 transition-all duration-300" />
                          <div style={{ width: `${pctServicos}%` }} className="bg-indigo-500 transition-all duration-300" />
                        </div>

                        <div className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                              Tecidos & Malha principal:
                            </span>
                            <span>R$ {tecidoTotal.toFixed(2)} ({pctTecido.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                              Aviamentos & Detalhes:
                            </span>
                            <span>R$ {aviamentosTotal.toFixed(2)} ({pctAviamentos.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                              Serviços & Oficinas:
                            </span>
                            <span>R$ {servicosTotal.toFixed(2)} ({pctServicos.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {custoTipo === 'semijoia' && totalSemijoiaSum > 0 && (
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Distribuição de Custos
                        </p>
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${pctBruto}%` }} className="bg-amber-500 transition-all duration-300" />
                          <div style={{ width: `${pctBanho}%` }} className="bg-yellow-400 transition-all duration-300" />
                          <div style={{ width: `${pctCrav}%` }} className="bg-rose-400 transition-all duration-300" />
                          <div style={{ width: `${pctServSemi}%` }} className="bg-orange-400 transition-all duration-300" />
                        </div>
                        <div className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Metal Base (Bruto):</span>
                            <span>R$ {bpVal.toFixed(2)} ({pctBruto.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>Banho / Galvânica:</span>
                            <span>R$ {banhoCustoVal.toFixed(2)} ({pctBanho.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>Pedras & Cravação:</span>
                            <span>R$ {(cravVal + pedrasCustoVal).toFixed(2)} ({pctCrav.toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>Serviços & Acabamento:</span>
                            <span>R$ {servicosSemiTotal.toFixed(2)} ({pctServSemi.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save buttons */}
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-[2] py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-600/60 rounded-2xl shadow-lg shadow-emerald-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Salvar Ficha de Custo
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionCosts;
