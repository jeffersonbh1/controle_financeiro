import React, { useState, useEffect } from 'react';
import { User, Category, Transaction, FamilyGroup, FixedExpense } from './types';
import { DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS } from './mockData';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CategoriesView } from './components/CategoriesView';
import { TransactionsView } from './components/TransactionsView';
import { UsersView } from './components/UsersView';
import { ReportsView } from './components/ReportsView';
import { FamilyGroupsView } from './components/FamilyGroupsView';
import { FixedExpensesView } from './components/FixedExpensesView';
import { Menu, Wallet, LogOut, RefreshCw, Database, AlertCircle, CheckCircle, Copy, Info, Terminal, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  supabase,
  isSupabaseConfigured,
  fetchSupabaseData,
  saveUser,
  deleteUser,
  saveCategory,
  deleteCategory,
  saveTransaction,
  deleteTransaction,
  saveFamilyGroup,
  deleteFamilyGroup,
  saveFixedExpense,
  deleteFixedExpense,
  batchResetSupabase,
  SUPABASE_SCHEMA_SQL,
  checkSupabaseConnection
} from './lib/supabase';

export default function App() {
  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'loading' | 'success' | 'unconfigured' | 'error' | 'no_tables'>('idle');
  const [supabaseMessage, setSupabaseMessage] = useState('');
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // 1. Core database states backed by localStorage

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('financas_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('financas_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('financas_transactions');
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('financas_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>(() => {
    const saved = localStorage.getItem('financas_family_groups');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem('financas_fixed_expenses');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'fe-1',
        userId: 'user-regular',
        description: 'Aluguel do Apartamento',
        amount: 1350.00,
        categoryId: 'cat-moradia',
        dueDay: 5,
        paidMonths: ['2026-04']
      },
      {
        id: 'fe-2',
        userId: 'user-regular',
        description: 'Plano de Internet Fibra',
        amount: 120.00,
        categoryId: 'cat-moradia',
        dueDay: 10,
        paidMonths: ['2026-04', '2026-05']
      },
      {
        id: 'fe-3',
        userId: 'user-regular',
        description: 'Assinatura Netflix 4K',
        amount: 55.90,
        categoryId: 'cat-lazer',
        dueDay: 15,
        paidMonths: ['2026-04']
      },
      {
        id: 'fe-4',
        userId: 'user-regular',
        description: 'Mensalidade Curso de Inglês',
        amount: 250.00,
        categoryId: 'cat-educacao',
        dueDay: 20,
        paidMonths: []
      }
    ];
  });

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('financas_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('financas_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('financas_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('financas_family_groups', JSON.stringify(familyGroups));
  }, [familyGroups]);

  useEffect(() => {
    localStorage.setItem('financas_fixed_expenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('financas_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('financas_current_user');
    }
  }, [currentUser]);

  // Supabase Fetcher Implementation
  const loadSupabaseData = async () => {
    if (!isSupabaseConfigured()) {
      setSupabaseStatus('unconfigured');
      return;
    }

    setSupabaseStatus('loading');
    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setSupabaseStatus('error');
        setSupabaseMessage('Não foi possível conectar à API do Supabase. Verifique suas credenciais em .env ou no painel de segredos.');
        return;
      }

      const data = await fetchSupabaseData();
      
      // Auto-load into React local states
      if (data.users.length > 0) setUsers(data.users);
      if (data.categories.length > 0) setCategories(data.categories);
      if (data.transactions.length > 0) setTransactions(data.transactions);
      
      setFamilyGroups(data.familyGroups);
      setFixedExpenses(data.fixedExpenses);

      setSupabaseStatus('success');
    } catch (error: any) {
      if (error && error.message === 'TABLES_NOT_FOUND') {
        setSupabaseStatus('no_tables');
        setSupabaseMessage('Tudo pronto! Porém, a estrutura de tabelas ainda precisa ser criada utilizando o script SQL fornecido.');
      } else {
        setSupabaseStatus('error');
        setSupabaseMessage(error?.message || 'Erro de sincronização.');
      }
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  const handlePushStateToSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    if (window.confirm('Deseja enviar todos os seus dados locais ativos para as tabelas do Supabase? Isso irá sobrescrever registros conflitantes.')) {
      setSupabaseStatus('loading');
      try {
        await batchResetSupabase(users, categories, transactions, fixedExpenses);
        setSupabaseStatus('success');
        alert('Sincronização concluída! Todos os dados locais foram publicados no Supabase.');
      } catch (err: any) {
        setSupabaseStatus('error');
        setSupabaseMessage('Erro ao exportar dados: ' + err.message);
      }
    }
  };

  // Actions / Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMobileMenuOpen(false);
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [user, ...prev]);
    saveUser(user);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteUser(id);
  };

  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
    saveCategory(category);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if category is used first to avoid breaking transactions referentials
    const isUsed = transactions.some(tx => tx.categoryId === id);
    if (isUsed) {
      alert('Esta categoria não pode ser removida pois possui lançamentos associados!');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    deleteCategory(id);
  };

  const handleAddTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    saveTransaction(tx);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteTransaction(id);
  };

  const handleAddFamilyGroup = (group: FamilyGroup) => {
    setFamilyGroups(prev => [...prev, group]);
    saveFamilyGroup(group);
  };

  const handleDeleteFamilyGroup = (id: string) => {
    setFamilyGroups(prev => prev.filter(g => g.id !== id));
    deleteFamilyGroup(id);
  };

  const handleAddMemberToGroup = (groupId: string, userId: string) => {
    setFamilyGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId) {
          const cleanPrevAndInclude = g.memberIds.includes(userId) ? g.memberIds : [...g.memberIds, userId];
          return { ...g, memberIds: cleanPrevAndInclude };
        }
        return { ...g, memberIds: g.memberIds.filter(id => id !== userId) };
      });
      // Find the one updated and sync to Supabase
      const targetedGroup = updated.find(g => g.id === groupId);
      if (targetedGroup) saveFamilyGroup(targetedGroup);
      
      // Also sync other groups that had changes
      updated.forEach(g => {
        if (g.id !== groupId) saveFamilyGroup(g);
      });
      return updated;
    });
  };

  const handleRemoveMemberFromGroup = (groupId: string, userId: string) => {
    setFamilyGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId) {
          return { ...g, memberIds: g.memberIds.filter(id => id !== userId) };
        }
        return g;
      });
      const targetedGroup = updated.find(g => g.id === groupId);
      if (targetedGroup) saveFamilyGroup(targetedGroup);
      return updated;
    });
  };

  const handleAddFixedExpense = (expense: FixedExpense) => {
    setFixedExpenses(prev => [...prev, expense]);
    saveFixedExpense(expense);
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(fe => fe.id !== id));
    deleteFixedExpense(id);
  };

  const handleToggleFixedExpensePaid = (id: string, month: string, shouldAddTransaction: boolean) => {
    setFixedExpenses(prev => {
      const updated = prev.map(fe => {
        if (fe.id === id) {
          const hasPaid = fe.paidMonths.includes(month);
          const paidMonths = hasPaid
            ? fe.paidMonths.filter(m => m !== month)
            : [...fe.paidMonths, month];
          const newFe = { ...fe, paidMonths };
          saveFixedExpense(newFe);
          return newFe;
        }
        return fe;
      });
      return updated;
    });
  };

  // Helper to reset database to factory mock data instantly for evaluation
  const handleResetData = async () => {
    if (window.confirm('Deseja realmente reiniciar todo o banco de dados para os valores originais do teste?')) {
      setUsers(DEFAULT_USERS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions(DEFAULT_TRANSACTIONS);
      setFamilyGroups([]);
      localStorage.removeItem('financas_fixed_expenses');
      const standardFixed = [
        {
          id: 'fe-1',
          userId: 'user-regular',
          description: 'Aluguel do Apartamento',
          amount: 1350.00,
          categoryId: 'cat-moradia',
          dueDay: 5,
          paidMonths: ['2026-04']
        },
        {
          id: 'fe-2',
          userId: 'user-regular',
          description: 'Plano de Internet Fibra',
          amount: 120.00,
          categoryId: 'cat-moradia',
          dueDay: 10,
          paidMonths: ['2026-04', '2026-05']
        },
        {
          id: 'fe-3',
          userId: 'user-regular',
          description: 'Assinatura Netflix 4K',
          amount: 55.90,
          categoryId: 'cat-lazer',
          dueDay: 15,
          paidMonths: ['2026-04']
        },
        {
          id: 'fe-4',
          userId: 'user-regular',
          description: 'Mensalidade Curso de Inglês',
          amount: 250.00,
          categoryId: 'cat-educacao',
          dueDay: 20,
          paidMonths: []
        }
      ];
      setFixedExpenses(standardFixed);
      setCurrentUser(DEFAULT_USERS[1]); // Login back as standard user
      setActiveTab('dashboard');

      if (supabaseStatus === 'success') {
        try {
          await batchResetSupabase(DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS, standardFixed);
          alert('Banco de dados Supabase reiniciado com sucesso!');
        } catch (err) {
          console.error("Error resetting Supabase database model:", err);
        }
      }
    }
  };

  // Safely auto-route user if permissions mismatch (non-admin trying to load /users tab)
  useEffect(() => {
    if (activeTab === 'users' && currentUser?.role !== 'admin') {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser]);

  // If not authenticated, force LoginView
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} users={users} />;
  }

  // Active view router mapping
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            currentUser={currentUser} 
            categories={categories} 
            transactions={transactions} 
            setActiveTab={setActiveTab}
            familyGroups={familyGroups}
            users={users}
            fixedExpenses={fixedExpenses}
          />
        );
      case 'fixed-expenses':
        return (
          <FixedExpensesView
            currentUser={currentUser}
            categories={categories}
            transactions={transactions}
            fixedExpenses={fixedExpenses}
            familyGroups={familyGroups}
            users={users}
            onAddFixedExpense={handleAddFixedExpense}
            onDeleteFixedExpense={handleDeleteFixedExpense}
            onToggleFixedExpensePaid={handleToggleFixedExpensePaid}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'expenses':
        return (
          <TransactionsView 
            currentUser={currentUser} 
            categories={categories} 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            onDeleteTransaction={handleDeleteTransaction}
            initialType="expense"
            familyGroups={familyGroups}
            users={users}
          />
        );
      case 'incomes':
        return (
          <TransactionsView 
            currentUser={currentUser} 
            categories={categories} 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction} 
            onDeleteTransaction={handleDeleteTransaction}
            initialType="income"
            familyGroups={familyGroups}
            users={users}
          />
        );
      case 'categories':
        return (
          <CategoriesView 
            categories={categories} 
            onAddCategory={handleAddCategory} 
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'reports':
        return (
          <ReportsView 
            categories={categories} 
            transactions={transactions} 
            currentUser={currentUser}
            familyGroups={familyGroups}
            users={users}
          />
        );
      case 'family-group':
        return (
          <FamilyGroupsView
            currentUser={currentUser}
            users={users}
            familyGroups={familyGroups}
            onAddFamilyGroup={handleAddFamilyGroup}
            onDeleteFamilyGroup={handleDeleteFamilyGroup}
            onAddMemberToGroup={handleAddMemberToGroup}
            onRemoveMemberFromGroup={handleRemoveMemberFromGroup}
          />
        );
      case 'users':
        return (
          <UsersView 
            currentUser={currentUser} 
            users={users} 
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Tela não encontrada.
          </div>
        );
    }
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard': return 'Painel Financeiro';
      case 'fixed-expenses': return 'Despesas Fixas e Agendamentos';
      case 'expenses': return 'Lançar Nova Despesa';
      case 'incomes': return 'Lançar Nova Receita';
      case 'categories': return 'Minhas Categorias';
      case 'reports': return 'Relatório Combinado';
      case 'family-group': return 'Gerenciamento de Grupo Familiar';
      case 'users': return 'Acessos e Usuários';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans select-text text-gray-800">
      
      {/* Desktop Sidebar (Collapsible) */}
      <div className="hidden md:block">
        <Sidebar 
          currentUser={currentUser} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content viewport block */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar relative">
        
        {/* Header Ribbon / Navigation Bar */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 sticky top-0 z-20 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle float button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumb / Title indication */}
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">
                Sistema de Finanças
              </span>
              <h2 className="text-lg font-bold text-gray-800 font-sans tracking-tight">
                {getBreadcrumb()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase status indicator pill */}
            <button
              id="supabase-status-indicator"
              onClick={() => setShowSqlDialog(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border select-none ${
                supabaseStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200'
                  : supabaseStatus === 'loading'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                  : supabaseStatus === 'no_tables'
                  ? 'bg-amber-50 text-amber-750 hover:bg-amber-100/80 border-amber-255'
                  : 'bg-rose-50 text-rose-750 hover:bg-rose-100/80 border-rose-255'
              }`}
              title="Ver status de integração Supabase e comandos SQL"
            >
              <Database size={13} className="shrink-0" />
              <span className="hidden sm:inline">
                {supabaseStatus === 'success' && 'Supabase Sincronizado'}
                {supabaseStatus === 'loading' && 'Carregando Supabase...'}
                {supabaseStatus === 'no_tables' && 'Supabase Pede Tabelas'}
                {supabaseStatus === 'unconfigured' && 'Instalar Supabase'}
                {supabaseStatus === 'error' && 'Erro de Conectividade'}
              </span>
              <span className="sm:hidden font-mono text-[10px]">
                {supabaseStatus === 'success' && 'Supabase'}
                {supabaseStatus === 'loading' && 'Lendo...'}
                {supabaseStatus === 'no_tables' && 'SQL'}
                {supabaseStatus === 'unconfigured' && 'N/A'}
                {supabaseStatus === 'error' && 'Erro'}
              </span>
            </button>

            {/* Quick Refresh Database Tooltip Button */}
            <button 
              onClick={handleResetData}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Restaurar dados padrões de fábrica"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Restaurar Demo</span>
            </button>

            <div className="h-6 w-[1px] bg-gray-100 hidden sm:block" />

            {/* Account information / level badge */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-950">{currentUser.name}</p>
                <p className="text-[10px] text-gray-400 font-bold capitalize tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
                </p>
              </div>
              <div className="h-8.5 w-8.5 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center font-mono uppercase border border-blue-100 text-xs">
                {currentUser.name.substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Core application screen viewport */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Mobile Drawer Slide Navigation Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Nav Drawer Column */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-100 flex flex-col z-50 md:hidden p-5"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5 font-bold text-lg text-slate-100">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-extrabold text-base select-none">
                    $
                  </div>
                  <span>FinControl</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 bg-slate-800 text-slate-200 rounded-lg cursor-pointer text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              <div className="flex-1 space-y-1.5">
                {[
                  { id: 'dashboard', label: 'Painel Geral' },
                  { id: 'fixed-expenses', label: 'Despesas Fixas' },
                  { id: 'expenses', label: 'Lançar Despesa' },
                  { id: 'incomes', label: 'Lançar Receita' },
                  { id: 'categories', label: 'Categorias' },
                  { id: 'reports', label: 'Relatórios' },
                  { id: 'family-group', label: 'Grupo Familiar' },
                  ...(currentUser.role === 'admin' ? [{ id: 'users', label: 'Usuários do Sistema' }] : []),
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Supabase connection detail and SQL script dialog modal */}
      <AnimatePresence>
        {showSqlDialog && (
          <>
            {/* Dark fuzzy backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSqlDialog(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 pointer-events-auto"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[720px] bg-white rounded-2xl shadow-xl border border-gray-100 z-[60] flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                    <Database size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-none">
                      Integração Supabase
                    </h3>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium leading-none">
                      Gerencie a conexão e copie a estrutura das tabelas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlDialog(false)}
                  className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300/80 text-gray-700 rounded-xl font-bold text-xs transition duration-150 cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {/* Scrollable content pane */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Integration Status Tracker Card */}
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                  supabaseStatus === 'success'
                    ? 'bg-emerald-50/70 border-emerald-150 text-emerald-900'
                    : supabaseStatus === 'loading'
                    ? 'bg-blue-50/70 border-blue-150 text-blue-900'
                    : supabaseStatus === 'no_tables'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-rose-50/70 border-rose-150 text-rose-900'
                }`}>
                  <div className="flex items-start gap-3">
                    {supabaseStatus === 'success' ? (
                      <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    ) : supabaseStatus === 'no_tables' ? (
                      <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    ) : (
                      <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                    )}
                    
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">
                        Status atual: {' '}
                        <span className="capitalize font-extrabold underline decoration-2">
                          {supabaseStatus === 'success' && 'Conectado e Ativo'}
                          {supabaseStatus === 'loading' && 'Verificando conexão...'}
                          {supabaseStatus === 'no_tables' && 'Conectado sem Tabelas'}
                          {supabaseStatus === 'unconfigured' && 'Não Configurado'}
                          {supabaseStatus === 'error' && 'Falha na Conexão'}
                        </span>
                      </h4>
                      <p className="text-xs font-semibold opacity-85 mt-1 leading-relaxed">
                        {supabaseStatus === 'success' && 'Seu aplicativo está lendo e persistindo todas as informações diretamente do seu banco de dados Supabase em tempo real!'}
                        {supabaseStatus === 'no_tables' && 'A conexão foi estabelecida com sucesso! Porém, o Supabase retornou que as tabelas de finanças não existem ainda. Siga as instruções abaixo para criá-las no editor de SQL.'}
                        {supabaseStatus === 'unconfigured' && 'Nenhuma variável VITE_SUPABASE_URL foi encontrada no ambiente de execução. Adicione as chaves no arquivo \`.env\` ou na aba de segredos do criador de apps.'}
                        {supabaseStatus === 'error' && (supabaseMessage || 'Verifique se as chaves fornecidas estão corretas e se as requisições não estão sendo bloqueadas por CORS.')}
                      </p>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  {supabaseStatus === 'success' && (
                    <div className="flex flex-wrap gap-2.5 mt-2 pt-2 border-t border-emerald-250/30">
                      <button
                        onClick={loadSupabaseData}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Recarregar do Supabase
                      </button>
                      <button
                        onClick={handlePushStateToSupabase}
                        className="px-3.5 py-2 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-250 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Exportar Meus Dados Atuais para o Supabase
                      </button>
                    </div>
                  )}

                  {supabaseStatus === 'no_tables' && (
                    <div className="flex gap-2.5 mt-2 pt-2 border-t border-amber-250/30">
                      <button
                        onClick={handlePushStateToSupabase}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Terminal size={12} />
                        Enviar Dados Padrões (Criar Registros)
                      </button>
                      <button
                        onClick={loadSupabaseData}
                        className="px-4 py-2 bg-white hover:bg-amber-100/20 text-amber-800 border border-amber-250 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Testar Novamente
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions Block */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-gray-800 font-bold text-sm">
                    <Info size={16} className="text-blue-600" />
                    <span>Como inicializar o Banco no Supabase</span>
                  </div>
                  <ol className="text-xs text-gray-400 space-y-2 pl-4 list-decimal leading-relaxed">
                    <li>Entre no seu painel do <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline hover:text-blue-700">Supabase</a>.</li>
                    <li>Navegue até a seção de <strong>SQL Editor</strong> no menu lateral esquerdo.</li>
                    <li>Clique em <strong>New Query</strong> para abrir uma aba de comandos em branco.</li>
                    <li>Copie o script SQL apresentado abaixo, cole-o na aba e clique em <strong>Run</strong> no canto inferior direito.</li>
                    <li>PRONTO! Volte ao painel e clique em "Testar Novamente" ou recarregue a página!</li>
                  </ol>
                </div>

                {/* SQL Code Sandbox Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-900 font-bold">
                      <Terminal size={14} className="text-slate-600" />
                      <span>Script SQL de Criação das Tabelas</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span className="text-emerald-600">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 text-[11px] rounded-xl overflow-x-auto font-mono leading-relaxed h-64 border border-slate-950 select-all">
                    {SUPABASE_SCHEMA_SQL}
                  </pre>
                </div>

              </div>

              {/* Informative Footer banner */}
              <div className="p-4 bg-gray-50 border-t border-gray-150 text-center">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium select-all">
                  Configurado para: <span className="font-mono text-gray-600 font-bold">https://fjlluvervbapxakmorxh.supabase.co</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
