import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Wallet, LogIn, ShieldAlert, KeyRound, Mail, UserCheck, Users, DollarSign, UserPlus, Phone, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { isSupabaseConfigured } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, users, onRegister }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const isDbConnected = isSupabaseConfigured();

  const handleLoginSubmit = (e: React.FormEvent) => {
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    if (regPassword.length < 3) {
      setError('A senha deve conter no mínimo 3 caracteres.');
      return;
    }

    // Check if email already taken
    const emailExists = users.some(u => u.email.toLowerCase() === regEmail.toLowerCase().trim());
    if (emailExists) {
      setError('Este endereço de e-mail já está cadastrado.');
      return;
    }

    // Create new user object
    const newUser: User = {
      id: 'user-' + Date.now().toString(),
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      role: 'user' as UserRole,
      password: regPassword
    };

    // Register user (saves to DB/localStorage)
    onRegister(newUser);
    
    // Automatically log the newly registered user in
    onLogin(newUser);
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
        {/* Subtle decorative background blur gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full -ml-10 -mb-10 blur-xl" />

        {/* Header App logo and name */}
        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white rounded-2xl mb-3 select-none shadow-xl shadow-emerald-500/25">
            <DollarSign className="h-9 w-9 opacity-95 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">
            Nosso Din Din
          </h1>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Controle financeiro integrado em parceria
          </p>
        </div>

        {/* Database Sync Connection Status Badge */}
        <div className="flex justify-center mb-6 z-10 relative">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isDbConnected 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80 shadow-sm shadow-emerald-100/5' 
              : 'bg-amber-50 text-amber-700 border border-amber-100/85 hover:bg-amber-100/40 transition-colors'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isDbConnected ? 'Banco em Nuvem Ativo (Supabase)' : 'Armazenamento Local Autônomo'}
          </span>
        </div>

        {/* Mode Selector Tabs (Login vs Register) */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl mb-6 relative z-10 border border-gray-200/50">
          <button
            type="button"
            onClick={() => { setActiveMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'register'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Criar Conta
          </button>
        </div>

        {/* Error Alert Panel */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium"
          >
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form Mode */}
        {activeMode === 'login' ? (
          <motion.form 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLoginSubmit} 
            className="space-y-4 relative z-10"
          >
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 mt-2 cursor-pointer border border-emerald-700/10"
            >
              <LogIn className="h-4 w-4" />
              Entrar no Sistema
            </button>
          </motion.form>
        ) : (
          /* Register Form Mode */
          <motion.form 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleRegisterSubmit} 
            className="space-y-4 relative z-10"
          >
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
                Nome de Usuário *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
                E-mail de Cadastro *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="exemplo@carteira.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1 text-gray-500">
                Celular / Telefone <span className="text-[10px] font-normal lowercase">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-sm placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
                  Senha *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Mín. 3 dgt"
                    className="w-full pl-9 pr-2 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-xs placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirmpassword" className="block text-xs font-semibold text-gray-700 tracking-wider uppercase mb-1.5 ml-1">
                  Confirmar *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-confirmpassword"
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Mín. 3 dgt"
                    className="w-full pl-9 pr-2 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-250 focus:border-emerald-500 rounded-xl text-gray-900 text-xs placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 mt-4 cursor-pointer border border-emerald-700/10"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar e Acessar
            </button>
          </motion.form>
        )}

        {/* Demo Quick Access Section - Only visible in Login Mode */}
        {activeMode === 'login' && (
          <>
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
                className="py-2.5 px-3 bg-emerald-50/20 hover:bg-emerald-50 border border-emerald-100/60 rounded-xl text-xs font-medium text-emerald-900 flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Usuário Comum</span>
                <span className="text-[10px] text-emerald-700/80 font-normal">user@carteira.com</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
