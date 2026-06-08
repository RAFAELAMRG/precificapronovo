import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: email,
        senha: password
      });

      if (response.data.success) {
        localStorage.setItem('precificapro_token', response.data.token);
        localStorage.setItem('precificapro_user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard or admin dashboard
        if (response.data.user.role === 'admin') {
          window.location.href = '#/admin';
        } else {
          window.location.href = '#/dashboard';
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Erro ao realizar o login. Verifique sua conexão ou credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-200">
      
      {/* Stripe-like background glow */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        
        {/* Logo and Brand Title */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-emerald-500 shadow-md mb-3">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-display">
            Precifica<span className="text-emerald-500">Pro</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1.5">
            SaaS de Precificação Inteligente para Marketplaces
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 rounded-3xl shadow-xl px-8 py-8">
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Acesse sua conta
          </h2>

          {/* Form Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-6 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Endereço de E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Senha de Acesso
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/60 rounded-2xl shadow-lg shadow-emerald-500/10 active:scale-98 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar na Plataforma'
              )}
            </button>
          </form>
          
          <div className="border-t border-gray-100 dark:border-gray-800 my-6"></div>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem uma conta?{' '}
            <a 
              href="#/cadastro" 
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
            >
              Cadastre-se grátis
            </a>
          </p>

        </div>

        {/* Floating Demo Info */}
        {(window.location.search.includes('dev=true') || window.location.hash.includes('dev=true')) && (
          <div className="mt-8 text-center bg-gray-100/50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800/40 rounded-2xl p-4 animate-in fade-in duration-300">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Acessos rápidos de demonstração</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-semibold dark:text-white">Cliente: </span>
                <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">joao@vendedor.com</code> / <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">cliente</code>
              </div>
              <div className="hidden sm:block">|</div>
              <div>
                <span className="font-semibold dark:text-white">Admin Master: </span>
                <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">admin@precificacao.com</code> / <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-150 dark:border-gray-700">admin</code>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
