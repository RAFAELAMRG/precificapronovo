import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  KeyRound, 
  CreditCard, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  Check, 
  Search,
  Plus
} from 'lucide-react';
import api from '../services/api';

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals management
  const [activeModal, setActiveModal] = useState(''); // '', 'plan', 'password'
  const [selectedClient, setSelectedClient] = useState(null);

  // Form states
  const [newPlan, setNewPlan] = useState('pro');
  const [daysToAdd, setDaysToAdd] = useState('');
  const [manualRelease, setManualRelease] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Create guest client form states
  const [createNomeEmpresa, setCreateNomeEmpresa] = useState('');
  const [createNomeResponsavel, setCreateNomeResponsavel] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createSenha, setCreateSenha] = useState('');
  const [createDiasTeste, setCreateDiasTeste] = useState('15');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/clients');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (client) => {
    const nextStatus = client.status === 'ativo' ? 'bloqueado' : 'ativo';
    const confirmMsg = `Deseja realmente ${nextStatus === 'bloqueado' ? 'BLOQUEAR' : 'DESBLOQUEAR'} a empresa '${client.nome}'?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setActionError('');
    try {
      const response = await api.put(`/admin/clients/${client.id}/status`, {
        status: nextStatus
      });

      if (response.data.success) {
        setActionSuccess(`Status de ${client.nome} alterado para ${nextStatus.toUpperCase()}!`);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchClients();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erro ao alterar status do cliente.');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const openPlanModal = (client) => {
    setSelectedClient(client);
    setNewPlan(client.plano || 'pro');
    setDaysToAdd('');
    setManualRelease(!!client.manual_release);
    setTrialEndsAt(client.trial_ends_at ? client.trial_ends_at.split('T')[0] : '');
    setExpiresAt(client.expires_at ? client.expires_at.split('T')[0] : '');
    setActiveModal('plan');
  };

  const openPasswordModal = (client) => {
    setSelectedClient(client);
    setNovaSenha('');
    setActiveModal('password');
  };

  const openCreateModal = () => {
    setCreateNomeEmpresa('');
    setCreateNomeResponsavel('');
    setCreateEmail('');
    setCreateSenha('');
    setCreateDiasTeste('15');
    setActiveModal('create');
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    
    try {
      const response = await api.post('/admin/clients', {
        nomeEmpresa: createNomeEmpresa,
        nomeResponsavel: createNomeResponsavel,
        email: createEmail,
        senha: createSenha,
        diasTeste: parseInt(createDiasTeste) || 15
      });

      if (response.data.success) {
        setActionSuccess(response.data.message);
        setTimeout(() => setActionSuccess(''), 4000);
        setActiveModal('');
        fetchClients();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erro ao cadastrar convidado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    setActionLoading(true);
    setActionError('');
    
    try {
      const response = await api.put(`/admin/clients/${selectedClient.id}/plan`, {
        plan: newPlan,
        daysToAdd: daysToAdd ? parseInt(daysToAdd) : undefined,
        manual_release: manualRelease,
        trial_ends_at: trialEndsAt || undefined,
        expires_at: expiresAt || null
      });

      if (response.data.success) {
        setActionSuccess(`Faturamento de '${selectedClient.nome}' alterado com sucesso!`);
        setTimeout(() => setActionSuccess(''), 3000);
        setActiveModal('');
        fetchClients();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erro ao alterar faturamento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!selectedClient || !novaSenha) return;

    setActionLoading(true);
    setActionError('');

    try {
      const response = await api.post(`/admin/clients/${selectedClient.id}/reset-password`, {
        novaSenha
      });

      if (response.data.success) {
        setActionSuccess(`Senha do usuário de '${selectedClient.nome}' redefinida!`);
        setTimeout(() => setActionSuccess(''), 3000);
        setActiveModal('');
        fetchClients();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Erro ao resetar senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    return c.nome.toLowerCase().includes(search.toLowerCase()) || 
           c.usuario_nome.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Gerenciamento de Clientes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie os acessos das empresas cadastradas no SaaS, altere planos e redefina credenciais.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Convidado
          </button>
          <button 
            onClick={fetchClients}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-105 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Lista
          </button>
        </div>
      </div>

      {/* Error and Success banners */}
      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl text-sm font-semibold text-rose-600 dark:text-rose-450 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl text-sm font-semibold text-emerald-700 dark:text-emerald-450 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {actionSuccess}
        </div>
      )}

      {/* Search Input bar */}
      <div className="relative bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-3xl transition-colors">
        <Search className="absolute left-7 top-7 w-5 h-5 text-gray-450 dark:text-gray-550" />
        <input
          type="text"
          placeholder="Filtrar por nome de empresa, e-mail do vendedor ou Razão Social..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Clients Listing table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-semibold text-gray-400 mt-2">Carregando carteira de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500 text-center py-10">Nenhum cliente cadastrado correspondente à busca.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3">Empresa / Razão Social</th>
                  <th className="py-3">Responsável</th>
                  <th className="py-3">IDs Gateway Asaas</th>
                  <th className="py-3">Plano</th>
                  <th className="py-3">Assinatura Status</th>
                  <th className="py-3">Liberação Manual</th>
                  <th className="py-3">Vencimento / Trial</th>
                  <th className="py-3">Acesso SaaS</th>
                  <th className="py-3 text-right">Ações de Suporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                {filteredClients.map((client) => {
                  const isBlocked = client.status === 'bloqueado';
                  
                  return (
                    <tr key={client.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{client.nome}</p>
                          <span className="text-xs text-gray-450 dark:text-gray-500">ID: {client.id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{client.usuario_nome}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{client.usuario_email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <div className="space-y-0.5">
                          <p><span className="text-gray-400">Cus:</span> <span className="font-mono text-[10px] bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">{client.asaas_customer_id || 'Não Criado'}</span></p>
                          <p><span className="text-gray-400">Sub:</span> <span className="font-mono text-[10px] bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">{client.asaas_subscription_id || 'Não Criado'}</span></p>
                        </div>
                      </td>
                      <td className="py-4 font-bold uppercase text-xs text-emerald-650 dark:text-emerald-400">{client.plano}</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${client.status_assinatura === 'active' || client.status_assinatura === 'trial' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-455' : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-455'}`}>
                          {client.status_assinatura.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${client.manual_release ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-450' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>
                          {client.manual_release ? 'LIBERADO' : 'NÃO'}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="space-y-0.5">
                          <p>Venc: {client.expires_at ? new Date(client.expires_at).toLocaleDateString('pt-BR') : '-'}</p>
                          <p className="text-[10px] text-gray-400">Trial: {client.trial_ends_at ? new Date(client.trial_ends_at).toLocaleDateString('pt-BR') : '-'}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isBlocked ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-455'}`}>
                          {isBlocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Toggle active / block */}
                          <button
                            onClick={() => handleToggleStatus(client)}
                            className={`p-1.5 rounded-lg border transition-colors ${isBlocked ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/30 text-rose-600'}`}
                            title={isBlocked ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                          >
                            {isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          
                          {/* Edit plan */}
                          <button
                            onClick={() => openPlanModal(client)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                            title="Alterar Plano"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Reset pass */}
                          <button
                            onClick={() => openPasswordModal(client)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                            title="Resetar Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Alteration Modal */}
      {activeModal === 'plan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-850 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-4">Editar Faturamento & Assinatura</h3>
            <p className="text-xs text-gray-500 mb-6">Cliente: <span className="font-bold text-gray-700 dark:text-white">{selectedClient?.nome}</span></p>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Selecione o Plano</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <option value="pro">Plano Único Pro (R$ 19,90)</option>
                  <option value="free">Plano Free / Testes (R$ 0,00)</option>
                </select>
              </div>

              {/* Manual release override */}
              <div className="flex items-center gap-2.5 py-2">
                <input
                  type="checkbox"
                  id="manualRelease"
                  checked={manualRelease}
                  onChange={(e) => setManualRelease(e.target.checked)}
                  className="w-4.5 h-4.5 text-emerald-500 border-gray-350 rounded focus:ring-emerald-500"
                />
                <label htmlFor="manualRelease" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Liberar Acesso Manual (Manual Release)
                </label>
              </div>

              {/* Trial Ends At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Expiração do Trial</label>
                <input
                  type="date"
                  value={trialEndsAt}
                  onChange={(e) => setTrialEndsAt(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Vencimento da Assinatura</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                />
              </div>

              {/* Quick Extend */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Estender Expiração (Dias a somar)</label>
                <input
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal('')}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-850 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-4">Resetar Senha de Acesso</h3>
            <p className="text-xs text-gray-500 mb-6">Cliente: <span className="font-bold text-gray-700 dark:text-white">{selectedClient?.nome}</span></p>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nova Senha Provisória</label>
                <input
                  type="text"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal('')}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-850 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-4">Cadastrar Novo Convidado (Trial)</h3>
            <p className="text-xs text-gray-500 mb-6">Crie uma conta de empresa e usuário com acesso trial de 15 dias (ou mais) pré-liberado.</p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Razão Social / Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  value={createNomeEmpresa}
                  onChange={(e) => setCreateNomeEmpresa(e.target.value)}
                  placeholder="Ex: Minha Loja Virtual Ltda"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  value={createNomeResponsavel}
                  onChange={(e) => setCreateNomeResponsavel(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">E-mail de Acesso (Login) *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="Ex: mariana@email.com"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Senha de Acesso *</label>
                <input
                  type="password"
                  required
                  value={createSenha}
                  onChange={(e) => setCreateSenha(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Dias de Teste (Trial)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={createDiasTeste}
                  onChange={(e) => setCreateDiasTeste(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-55/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal('')}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminClients;
