import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { Plus, Trash2, ShieldAlert, UserPlus, Phone, Mail, Lock, UserCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsersViewProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  users,
  onAddUser,
  onDeleteUser
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Safeguard view - screen should confirm if user is actually admin
  const isAuthorized = currentUser.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthorized) {
      setError('Apenas administradores podem cadastrar novos usuários.');
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios do formulário.');
      return;
    }

    // Check duplicate email
    const duplicate = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (duplicate) {
      setError('Este e-mail já está sendo utilizado por outro usuário cadastrado.');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
      role
    };

    onAddUser(newUser);
    setSuccess(`Usuário "${newUser.name}" cadastrado com sucesso!`);
    
    // Clear form
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('user');

    setTimeout(() => setSuccess(''), 4000);
  };

  if (!isAuthorized) {
    return (
      <div id="unauthorized-message" className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm max-w-2xl mx-auto text-center py-16">
        <ShieldAlert className="h-14 w-14 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          O cadastro e gerenciamento de usuários é um privilégio administrativo exclusivo. Entre em contato com seu administrador de ti para obter novos acessos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 font-sans selection:bg-blue-100">
      
      {/* Cadastro Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Novo Usuário</h3>
            <p className="text-xs text-gray-400">Atribua perfil e credenciais administrativas</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-700 text-xs font-semibold">
            <UserCheck className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome completo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Nome Completo
            </label>
            <input
              id="user-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome completo"
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              E-mail para Login
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail size={15} />
              </span>
              <input
                id="user-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Telefone / Celular
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Phone size={15} />
              </span>
              <input
                id="user-phone-input"
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(99) 99999-9999"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock size={15} />
              </span>
              <input
                id="user-password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Defina uma senha robusta"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>
          </div>

          {/* Perfil (Administrador ou Usuário) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
              Nível de Acesso (Perfil)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  role === 'user'
                    ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Usuário Comum
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Administrador
              </button>
            </div>
          </div>

          <button
            id="user-add-submit-btn"
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 cursor-pointer mt-4"
          >
            Cadastrar Usuário
          </button>
        </form>
      </div>

      {/* Lista de Usuários do Sistema */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-1">Usuários do Sistema</h3>
        <p className="text-xs text-gray-400 mb-5">
          Lista de colaboradores cadastrados com acessos autorizados ao painel de finanças
        </p>

        <div className="space-y-3.5 max-h-[500px] overflow-y-auto no-scrollbar">
          <AnimatePresence>
            {users.map(u => {
              const matchesCurrentUser = u.id === currentUser.id;
              return (
                <motion.div
                  id={`user-item-card-${u.id}`}
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
                      u.role === 'admin' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role === 'admin' ? <Shield size={16} /> : u.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {u.name}
                        </span>
                        {matchesCurrentUser && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[9px] font-bold">
                            VOCÊ
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[9px] font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-gray-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span className="font-mono">{u.phone}</span>
                      </div>
                    </div>
                  </div>

                  {!matchesCurrentUser && (
                    <button
                      id={`user-delete-btn-${u.id}`}
                      onClick={() => onDeleteUser(u.id)}
                      className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
