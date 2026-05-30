import React, { useState } from 'react';
import { User } from '../types';
import { DEFAULT_USERS } from '../mockData';
import { Wallet, LogIn, ShieldAlert, KeyRound, Mail, UserCheck, Users, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Lookup user
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('E-mail ou senha incorretos. Tente novamente.');
    }
  };

  const handleDemoLogin = (userType: 'admin' | 'regular') => {
    const demoEmail = userType === 'admin' ? 'admin@carteira.com' : 'user@carteira.com';
    const demoPassword = userType === 'admin' ? 'admin' : 'user';
    
    const foundUser = users.find(u => u.email.toLowerCase() === demoEmail && u.password === demoPassword);
    if (foundUser) {
      onLogin(foundUser);
    } else {
      // Fallback in case list changed
      const fallback = users.find(u => u.role === userType);
      if (fallback) onLogin(fallback);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-gray-50/70 p-4 font-sans selection:bg-blue-100 selection:text-blue-900">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 relative overflow-hidden"
      >
        {/* Subtle accent blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/5 rounded-full -ml-10 -mb-10 blur-xl" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white rounded-2xl mb-4 select-none shadow-xl shadow-emerald-500/25">
            <DollarSign className="h-9 w-9 opacity-95 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">
            Nosso Din Din
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 text-center">
            Gerencie seus gastos e receitas de forma simples e intuitiva
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm"
          >
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
              E-mail do Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@carteira.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-blue-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-blue-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/15 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Entrar no Sistema
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">
            OU ACESSE COM CONTAS DEMO
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            id="demo-admin-btn"
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-slate-500" />
            <span>Administrador</span>
            <span className="text-[10px] text-gray-400 font-normal">admin@carteira.com</span>
          </button>
          <button
            id="demo-user-btn"
            type="button"
            onClick={() => handleDemoLogin('regular')}
            className="py-2.5 px-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-xs font-medium text-blue-900 flex flex-col items-center gap-1 transition-all cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Usuário Comum</span>
            <span className="text-[10px] text-blue-600/75 font-normal">user@carteira.com</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
