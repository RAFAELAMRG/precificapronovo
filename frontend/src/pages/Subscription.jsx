import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Check, 
  Copy, 
  CreditCard, 
  QrCode, 
  LogOut, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import api from '../services/api';

const Subscription = () => {
  const [activeTab, setActiveTab] = useState('pix');
  const [subStatus, setSubStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // PIX State
  const [pixDetails, setPixDetails] = useState(null);
  const [copied, setCopied] = useState(false);

  // Credit Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');

  const fetchSubscriptionStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await api.get('/subscriptions/status');
      if (response.data.success) {
        setSubStatus(response.data.subscription);
        // If subscription or trial is already active, redirect back to dashboard
        if (response.data.subscription.trialActive || response.data.subscription.subActive || response.data.subscription.manual_release) {
          window.location.hash = response.data.subscription.plan === 'master' ? '#/admin' : '#/dashboard';
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError('Erro ao carregar dados de faturamento. Tente novamente.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('precificapro_token');
    localStorage.removeItem('precificapro_user');
    window.location.hash = '#/login';
    window.location.reload();
  };

  const handlePixCheckout = async () => {
    setError('');
    setSuccessMsg('');
    setLoadingCheckout(true);

    try {
      const response = await api.post('/subscriptions/checkout', {
        billingType: 'PIX'
      });

      if (response.data.success) {
        setPixDetails(response.data);
      }
    } catch (err) {
      console.error('PIX checkout error:', err);
      setError(err.response?.data?.message || 'Erro ao gerar pagamento via PIX.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleCreditCardCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv || !cardCpf) {
      setError('Preencha todos os campos do cartão de crédito.');
      return;
    }

    // Split expiry MM/YY
    const parts = cardExpiry.split('/');
    if (parts.length !== 2) {
      setError('A validade deve estar no formato MM/AA.');
      return;
    }

    const expiryMonth = parts[0].trim();
    const expiryYear = '20' + parts[1].trim(); // Assuming 20YY format

    setLoadingCheckout(true);

    try {
      const response = await api.post('/subscriptions/checkout', {
        billingType: 'CREDIT_CARD',
        creditCardInfo: {
          holderName: cardName,
          number: cardNumber.replace(/\s+/g, ''),
          expiryMonth,
          expiryYear,
          ccv: cardCvv,
          cpfCnpj: cardCpf.replace(/[.-]/g, '')
        }
      });

      if (response.data.success) {
        setSuccessMsg('Assinatura via Cartão de Crédito autorizada e ativada com sucesso!');
        setTimeout(() => {
          window.location.hash = '#/dashboard';
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error('Credit card checkout error:', err);
      setError(err.response?.data?.message || 'Erro ao processar assinatura via cartão.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleCopyPix = () => {
    if (pixDetails?.pixCode) {
      navigator.clipboard.writeText(pixDetails.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to format Card Number
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Helper to format Expiry
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  // Auto trigger PIX creation when switching to PIX tab if not already generated
  useEffect(() => {
    if (activeTab === 'pix' && !pixDetails && subStatus) {
      handlePixCheckout();
    }
  }, [activeTab, subStatus]);

  if (loadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Validando sua conta...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12 transition-colors duration-200 relative overflow-hidden">
      
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      
      <div className="w-full max-w-4xl z-10">
        
        {/* Top Header Controls */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-emerald-500 shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white font-display">
              Precifica<span className="text-emerald-500">Pro</span>
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>

        {/* Access Restriction Banner */}
        <div className="flex items-center gap-3 p-4 mb-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
          <Lock className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-rose-700 dark:text-rose-400">Acesso Restrito: </span>
            <span className="text-rose-600 dark:text-rose-300">
              Sua conta experimental (Trial) ou assinatura ativa expirou. Assine para continuar utilizando.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Plan Info Card (2 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-3xl shadow-lg p-6 relative overflow-hidden flex flex-col justify-between h-full">
              
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Plano Recomendado
                  </span>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-4">
                    Assinatura Mensal
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Cancele a qualquer momento sem taxas ocultas.
                  </p>
                </div>

                <div className="flex items-baseline gap-1.5 my-4">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">R$ 19,90</span>
                  <span className="text-sm font-semibold text-gray-500">/ mês</span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800/80 my-4" />

                <ul className="space-y-3.5">
                  {[
                    'Calculadora de Preço Ideal automatizada',
                    'Acompanhamento de Lucro Real e Margem',
                    'Alerta de risco de prejuízo financeiro',
                    'Integração multi-canal (Shopee, ML)',
                    'Relatórios e gráficos de rentabilidade',
                    'Painel SaaS rápido e responsivo'
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 border border-gray-150/50 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Seus dados de pagamento estão 100% seguros. Processado em ambiente Sandbox homologado pelo Asaas.
                </p>
              </div>

            </div>
          </div>

          {/* Checkout Box Container (3 columns) */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-3xl shadow-lg p-6 flex flex-col min-h-[500px]">
              
              {/* Payment Tab Headers */}
              <div className="grid grid-cols-2 p-1 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl mb-6">
                <button
                  onClick={() => setActiveTab('pix')}
                  className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === 'pix' 
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pagar via PIX
                </button>
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === 'card' 
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão de Crédito
                </button>
              </div>

              {/* Status Alert Banners */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 mb-6 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 p-3.5 mb-6 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Checkout Forms Panel */}
              <div className="flex-1 flex flex-col justify-center">
                
                {/* 1. PIX TAB PANEL */}
                {activeTab === 'pix' && (
                  <div className="space-y-6 text-center">
                    {loadingCheckout ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
                        <p className="text-sm text-gray-500">Gerando cobrança PIX no Asaas...</p>
                      </div>
                    ) : pixDetails ? (
                      <div className="space-y-6 flex flex-col items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Escaneie o QR Code abaixo usando o aplicativo do seu banco para ativar na hora.
                        </p>
                        
                        {/* QR Code Container */}
                        <div className="p-4 bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-3xl shadow-inner flex items-center justify-center w-52 h-52 relative overflow-hidden">
                          {pixDetails.encodedImage && pixDetails.encodedImage !== 'MOCK_PIX_QR_CODE' ? (
                            <img 
                              src={`data:image/png;base64,${pixDetails.encodedImage}`} 
                              alt="Pix QR Code" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            // Premium simulated Sandbox QR Code Visual
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl relative border-2 border-dashed border-emerald-500/30">
                              <QrCode className="w-20 h-20 text-emerald-500" />
                              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mt-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                Sandbox QR Code
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PIX Copy & Paste Input */}
                        <div className="w-full space-y-2">
                          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">
                            Código PIX Copia e Cola
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={pixDetails.pixCode}
                              className="flex-1 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none"
                            />
                            <button
                              onClick={handleCopyPix}
                              className="flex items-center justify-center p-3 text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl transition-colors shadow-md shadow-emerald-500/10"
                            >
                              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800/80 w-full pt-4" />

                        {/* Status Checker Controls */}
                        <div className="w-full flex flex-col gap-2.5">
                          <button
                            onClick={fetchSubscriptionStatus}
                            className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/15 transition-all"
                          >
                            Confirmar Pagamento
                          </button>
                          <p className="text-xs text-gray-400">
                            Após transferir os R$ 19,90, clique no botão acima para liberar o sistema caso a confirmação demore.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-sm text-gray-500 mb-4">Nenhum pagamento gerado.</p>
                        <button
                          onClick={handlePixCheckout}
                          className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl"
                        >
                          Gerar Cobrança PIX
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CREDIT CARD TAB PANEL */}
                {activeTab === 'card' && (
                  <form onSubmit={handleCreditCardCheckout} className="space-y-4">
                    {/* Cardholder name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Nome impresso no Cartão
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: JOÃO DA SILVA"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Expiration + CVV grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                          Validade
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                          CVV
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-center"
                        />
                      </div>
                    </div>

                    {/* CPF/CNPJ Owner */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        CPF ou CNPJ do Titular
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 000.000.000-00"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(e.target.value)}
                        className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loadingCheckout}
                        className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/60 rounded-2xl shadow-lg shadow-emerald-500/15 transition-all"
                      >
                        {loadingCheckout ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Ativar Assinatura via Cartão
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Subscription;
