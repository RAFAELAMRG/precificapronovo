import React, { useState, useEffect } from 'react';
import { Layers, Check, RefreshCw, Loader2, Link2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const INTEGRATIONS_LIST = [
  { id: 'mercado_livre', name: 'Mercado Livre', type: 'Marketplace', logo: 'ML', color: 'from-amber-400 to-yellow-500' },
  { id: 'shopee', name: 'Shopee', type: 'Marketplace', logo: 'SP', color: 'from-orange-500 to-red-500' },
  { id: 'bling', name: 'Bling ERP', type: 'Sistema de Gestão (ERP)', logo: 'BL', color: 'from-blue-600 to-sky-500' }
];

const Marketplaces = () => {
  const [integrations, setIntegrations] = useState({
    mercado_livre: { connected: false, username: '' },
    shopee: { connected: false, username: '' },
    bling: { connected: false, username: '' }
  });
  
  const [loadingChannel, setLoadingChannel] = useState('');
  const [syncingChannel, setSyncingChannel] = useState('');
  const [connectionUser, setConnectionUser] = useState('');
  const [activeForm, setActiveForm] = useState('');
  const [alertInfo, setAlertInfo] = useState('');

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    const saved = localStorage.getItem('precificapro_integrations');
    if (saved) {
      setIntegrations(JSON.parse(saved));
    }
  };

  const handleConnect = (channelId) => {
    if (!connectionUser) return;
    
    setLoadingChannel(channelId);
    setTimeout(() => {
      const updated = {
        ...integrations,
        [channelId]: { connected: true, username: connectionUser }
      };
      setIntegrations(updated);
      localStorage.setItem('precificapro_integrations', JSON.stringify(updated));
      
      setConnectionUser('');
      setActiveForm('');
      setLoadingChannel('');
      setAlertInfo(`Integração com ${channelId.toUpperCase().replace('_', ' ')} conectada com sucesso!`);
      setTimeout(() => setAlertInfo(''), 3000);
    }, 1000);
  };

  const handleDisconnect = async (channelId) => {
    if (!window.confirm(`Deseja desconectar a integração com o ${channelId.toUpperCase().replace('_', ' ')}? Anúncios sincronizados serão removidos.`)) return;

    setLoadingChannel(channelId);
    
    // Simulate cleanup by letting the backend know if Bling was disconnected,
    // but locally we can also clean up or just call the sync simulation
    setTimeout(() => {
      const updated = {
        ...integrations,
        [channelId]: { connected: false, username: '' }
      };
      setIntegrations(updated);
      localStorage.setItem('precificapro_integrations', JSON.stringify(updated));
      setLoadingChannel('');
      
      setAlertInfo(`Integração com ${channelId.toUpperCase().replace('_', ' ')} desconectada.`);
      setTimeout(() => setAlertInfo(''), 3000);
    }, 800);
  };

  const handleSync = async (channelId) => {
    setSyncingChannel(channelId);
    try {
      const response = await api.post('/products/sync-integration', {
        channel: channelId
      });

      if (response.data.success) {
        setAlertInfo(response.data.message);
        setTimeout(() => setAlertInfo(''), 4000);
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      alert('Erro ao sincronizar anúncios.');
    } finally {
      setSyncingChannel('');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Conexões & Integrações</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vincule suas contas de marketplaces ou ERP para puxar anúncios e sincronizar reajustes automaticamente.</p>
      </div>

      {/* Global Connection alert banner */}
      {alertInfo && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl text-sm font-semibold text-emerald-700 dark:text-emerald-450 transition-all flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {alertInfo}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {INTEGRATIONS_LIST.map((item) => {
          const status = integrations[item.id] || { connected: false, username: '' };
          const isConnected = status.connected;
          const isFormActive = activeForm === item.id;
          const isChannelLoading = loadingChannel === item.id;
          const isSyncing = syncingChannel === item.id;

          return (
            <div 
              key={item.id}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors"
            >
              <div>
                {/* Header card info */}
                <div className="flex justify-between items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center font-bold text-white font-display text-lg`}>
                    {item.logo}
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {isConnected ? 'Conectado' : 'Indisponível'}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white font-display">{item.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.type}</p>
                  
                  {isConnected && (
                    <p className="text-xs font-semibold text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                      Conta vinculada: <span className="text-gray-800 dark:text-white font-bold">{status.username}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Form connection display */}
              {isFormActive && (
                <div className="mt-6 space-y-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificador / Apelido da Conta</label>
                  <input
                    type="text"
                    required
                    value={connectionUser}
                    onChange={(e) => setConnectionUser(e.target.value)}
                    placeholder="Ex: MinhaLojaOficial"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(item.id)}
                      disabled={!connectionUser || isChannelLoading}
                      className="flex-1 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {isChannelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Confirmar
                    </button>
                    <button
                      onClick={() => setActiveForm('')}
                      className="px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Actions footer */}
              {!isFormActive && (
                <div className="mt-8 flex gap-2 border-t border-gray-100 dark:border-gray-850 pt-4">
                  {isConnected ? (
                    <>
                      {/* Sync button */}
                      <button
                        onClick={() => handleSync(item.id)}
                        disabled={isSyncing}
                        className="flex-1 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/60 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 active:scale-98 transition-all"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Sincronizar Anúncios</span>
                      </button>
                      
                      {/* Disconnect button */}
                      <button
                        onClick={() => handleDisconnect(item.id)}
                        disabled={isChannelLoading}
                        className="px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl transition-colors"
                      >
                        Desconectar
                      </button>
                    </>
                  ) : (
                    /* Connect button */
                    <button
                      onClick={() => setActiveForm(item.id)}
                      className="w-full py-3 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <Link2 className="w-4 h-4" />
                      Vincular Canal de Vendas
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* API syncing description help banner */}
      <div className="p-5 bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-900/20 rounded-3xl">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Nota sobre sincronização e simulação
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
          Ao clicar em **Sincronizar Anúncios**, o PrecificaPro simula uma puxada de dados da API do marketplace trazendo anúncios com margens de lucro defasadas (erros reais). Isso serve para testar as capacidades de alerta do motor financeiro. Você poderá corrigir os valores na tela de **Produtos** ou diretamente no painel.
        </p>
      </div>

    </div>
  );
};

export default Marketplaces;
