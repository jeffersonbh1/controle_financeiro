import React, { useState, useEffect } from 'react';
import { User, Category, Transaction, FixedExpense } from './types';
import { DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS } from './mockData';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CategoriesView } from './components/CategoriesView';
import { TransactionsView } from './components/TransactionsView';
import { UsersView } from './components/UsersView';
import { ReportsView } from './components/ReportsView';
import { FixedExpensesView } from './components/FixedExpensesView';
import { BudgetsView } from './components/BudgetsView';
import { Menu, Wallet, LogOut, RefreshCw, Users, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  loadFullDBData,
  saveUserDB,
  deleteUserDB,
  saveCategoryDB,
  deleteCategoryDB,
  saveTransactionDB,
  deleteTransactionDB,
  saveFixedExpenseDB,
  deleteFixedExpenseDB,
  saveCategoryBudgetDB,
  deleteCategoryBudgetDB
} from './lib/supabase';

export default function App() {
  // 1. Core database states backed by localStorage

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('financas_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch (e) {
      console.error('Error parsing financas_users', e);
      return DEFAULT_USERS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('financas_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error('Error parsing financas_categories', e);
      return DEFAULT_CATEGORIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('financas_transactions');
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    } catch (e) {
      console.error('Error parsing financas_transactions', e);
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('financas_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error parsing financas_current_user', e);
      return null;
    }
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    try {
      const saved = localStorage.getItem('financas_fixed_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing financas_fixed_expenses', e);
    }
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

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('financas_category_budgets');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error parsing financas_category_budgets', e);
      return {};
    }
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
    localStorage.setItem('financas_fixed_expenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem('financas_category_budgets', JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('financas_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('financas_current_user');
    }
  }, [currentUser]);

  // Silent automatic sync from Supabase database on app startup
  useEffect(() => {
    async function loadDB() {
      const dbData = await loadFullDBData();
      if (dbData) {
        console.log('Dados importados com sucesso do Supabase!');
        if (dbData.users.length > 0) setUsers(dbData.users);
        if (dbData.categories.length > 0) setCategories(dbData.categories);
        setTransactions(dbData.transactions);
        setFixedExpenses(dbData.fixedExpenses);
        if (dbData.categoryBudgets && Object.keys(dbData.categoryBudgets).length > 0) {
          setCategoryBudgets(dbData.categoryBudgets);
        }

        const savedCurrentUserString = localStorage.getItem('financas_current_user');
        if (savedCurrentUserString) {
          try {
            const savedUser = JSON.parse(savedCurrentUserString);
            const freshUser = dbData.users.find(u => u.id === savedUser.id);
            if (freshUser) {
              setCurrentUser(freshUser);
            }
          } catch (e) {
            console.error('Erro ao sincronizar usuario logado na inicializacao', e);
          }
        }
      }
    }
    loadDB();
  }, []);

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
    saveUserDB(user);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteUserDB(id);
  };

  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
    saveCategoryDB(category);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if category is used first to avoid breaking transactions referentials
    const isUsed = transactions.some(tx => tx.categoryId === id);
    if (isUsed) {
      alert('Esta categoria não pode ser removida pois possui lançamentos associados!');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    deleteCategoryDB(id);
  };

  const handleUpdateCategoryBudget = async (categoryId: string, limitValue: number) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryId]: limitValue
    }));
    await saveCategoryBudgetDB(categoryId, limitValue);
  };

  const handleDeleteCategoryBudget = async (categoryId: string) => {
    setCategoryBudgets(prev => {
      const copy = { ...prev };
      delete copy[categoryId];
      return copy;
    });
    await deleteCategoryBudgetDB(categoryId);
  };

  const handleAddTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    saveTransactionDB(tx);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteTransactionDB(id);
  };

  const handleAddFixedExpense = (expense: FixedExpense) => {
    setFixedExpenses(prev => [...prev, expense]);
    saveFixedExpenseDB(expense);
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(fe => fe.id !== id));
    deleteFixedExpenseDB(id);
  };

  const handleToggleFixedExpensePaid = (id: string, month: string, shouldAddTransaction: boolean) => {
    setFixedExpenses(prev => prev.map(fe => {
      if (fe.id === id) {
        const hasPaid = fe.paidMonths.includes(month);
        const paidMonths = hasPaid
          ? fe.paidMonths.filter(m => m !== month)
          : [...fe.paidMonths, month];
        const updated = { ...fe, paidMonths };
        saveFixedExpenseDB(updated);
        return updated;
      }
      return fe;
    }));
  };

  // Helper to reset database to factory mock data instantly for evaluation
  const handleResetData = () => {
    if (window.confirm('Deseja realmente reiniciar todo o banco de dados para os valores originais do teste?')) {
      setUsers(DEFAULT_USERS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions(DEFAULT_TRANSACTIONS);
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
    return <LoginView onLogin={handleLogin} users={users} onRegister={handleAddUser} />;
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
            users={users}
          />
        );
      case 'budgets':
        return (
          <BudgetsView 
            currentUser={currentUser}
            categories={categories}
            transactions={transactions}
            categoryBudgets={categoryBudgets}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onDeleteCategoryBudget={handleDeleteCategoryBudget}
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
      case 'budgets': return 'Objetivos e Metas de Gastos';
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
                <p className="text-xs font-bold text-gray-950">{currentUser?.name || 'Usuário'}</p>
                <p className="text-[10px] text-gray-400 font-bold capitalize tracking-wider">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
                </p>
              </div>
              <div className="h-8.5 w-8.5 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center font-mono uppercase border border-blue-100 text-xs">
                {(currentUser?.name || 'US').substring(0, 2)}
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
                <div className="flex items-center gap-2.5 font-bold text-base text-slate-100">
                  <div className="flex items-center justify-center w-8.5 h-8.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 shrink-0">
                    <DollarSign className="h-4.5 w-4.5 font-black" />
                  </div>
                  <span>Nosso Din Din</span>
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
                  { id: 'budgets', label: 'Metas de Gastos' },
                  ...(currentUser?.role === 'admin' ? [{ id: 'users', label: 'Usuários do Sistema' }] : []),
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
                  <p className="text-xs font-bold text-slate-100">{currentUser?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser?.role || 'Usuário'}</p>
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

    </div>
  );
}
