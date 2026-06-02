import React, { useState, useMemo } from 'react';
import { User, Category, Transaction } from '../types';
import { LucideIcon } from './LucideIcon';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Coins, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Activity,
  Edit2,
  ListFilter,
  Lightbulb,
  Check,
  Loader2,
  Cloud,
  CloudOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { isSupabaseConfigured } from '../lib/supabase';

interface BudgetsViewProps {
  currentUser: User;
  categories: Category[];
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  onUpdateCategoryBudget: (categoryId: string, limitValue: number) => any;
  onDeleteCategoryBudget: (categoryId: string) => any;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  currentUser,
  categories,
  transactions,
  categoryBudgets,
  onUpdateCategoryBudget,
  onDeleteCategoryBudget
}) => {
  // DB status check
  const dbConnected = isSupabaseConfigured();

  // Local active sub-tab switching
  const [subTab, setSubTab] = useState<'tracking' | 'setup'>('tracking');
  
  // Date selector for tracker analysis
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // Default to current month, e.g. "2026-06"
  });

  // Local state for temporary input editing before saving
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Individual item asynchronous interaction states
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedFeedbackIds, setSavedFeedbackIds] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  // Get only expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter(cat => cat.type === 'expense');
  }, [categories]);

  // Extract all months present in transaction history
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Make sure current calendar month is always at least present
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonthStr);
    
    transactions.forEach(tx => {
      if (tx.date) {
        months.add(tx.date.substring(0, 7)); // Year-Month
      }
    });

    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filter current user transactions of type expense for selected month
  const monthExpenses = useMemo(() => {
    return transactions.filter(tx => 
      tx.userId === currentUser.id && 
      tx.type === 'expense' &&
      tx.date && 
      tx.date.startsWith(selectedMonth)
    );
  }, [transactions, currentUser, selectedMonth]);

  // Sum up spent amount for each category in the selected month
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(tx => {
      if (tx.categoryId) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      }
    });
    return map;
  }, [monthExpenses]);

  // Assemble budget data matching current configured budgets
  const activeBudgetsData = useMemo(() => {
    return expenseCategories
      .filter(cat => categoryBudgets[cat.id] !== undefined && categoryBudgets[cat.id] > 0)
      .map(cat => {
        const limit = categoryBudgets[cat.id];
        const spent = categorySpentMap[cat.id] || 0;
        const remaining = limit - spent;
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return {
          category: cat,
          limit,
          spent,
          remaining,
          percentage
        };
      });
  }, [expenseCategories, categoryBudgets, categorySpentMap]);

  // Aggregate stats across all configured budgets
  const stats = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let warningCategoriesCount = 0;
    let exceededCategoriesCount = 0;

    activeBudgetsData.forEach(item => {
      totalBudgeted += item.limit;
      totalSpent += item.spent;
      if (item.percentage >= 100) {
        exceededCategoriesCount++;
      } else if (item.percentage >= 80) {
        warningCategoriesCount++;
      }
    });

    const netRemaining = totalBudgeted - totalSpent;
    const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    return {
      totalBudgeted,
      totalSpent,
      netRemaining,
      overallPercentage,
      warningCategoriesCount,
      exceededCategoriesCount
    };
  }, [activeBudgetsData]);

  // Format currency helpers
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Inline inputs logic
  const handleInputChange = (categoryId: string, val: string) => {
    // Sanitizes to numbers or decimals
    const clean = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    setEditingValues(prev => ({
      ...prev,
      [categoryId]: clean
    }));
  };

  const handleSaveBudget = async (categoryId: string) => {
    const valStr = editingValues[categoryId];
    if (valStr === undefined || valStr.trim() === '') return;

    const val = parseFloat(valStr);
    if (isNaN(val) || val <= 0) {
      alert('Por favor digite um valor numérico válido maior que zero.');
      return;
    }

    setSavingIds(prev => ({ ...prev, [categoryId]: true }));
    try {
      await onUpdateCategoryBudget(categoryId, val);
      setSavedFeedbackIds(prev => ({ ...prev, [categoryId]: true }));
      // Success feedback via clearing individual edits state
      setEditingValues(prev => {
        const copy = { ...prev };
        delete copy[categoryId];
        return copy;
      });
      setTimeout(() => {
        setSavedFeedbackIds(prev => {
          const copy = { ...prev };
          delete copy[categoryId];
          return copy;
        });
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar no banco de dados. Tente novamente.');
    } finally {
      setSavingIds(prev => {
        const copy = { ...prev };
        delete copy[categoryId];
        return copy;
      });
    }
  };

  const handleRemoveBudgetClick = async (categoryId: string) => {
    if (window.confirm('Tem certeza de que deseja remover o objetivo de gastos desta categoria?')) {
      setDeletingIds(prev => ({ ...prev, [categoryId]: true }));
      try {
        await onDeleteCategoryBudget(categoryId);
        setEditingValues(prev => {
          const copy = { ...prev };
          delete copy[categoryId];
          return copy;
        });
      } catch (e) {
        console.error(e);
        alert('Erro ao remover do banco de dados.');
      } finally {
        setDeletingIds(prev => {
          const copy = { ...prev };
          delete copy[categoryId];
          return copy;
        });
      }
    }
  };

  // Convert month representation to Brazilian full string
  const translateMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 15);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-6" id="budgets-panel-container">
      {/* Upper header section */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <Target size={240} className="stroke-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono tracking-wider text-blue-100 uppercase">
                <Activity size={12} className="text-emerald-400" /> Metas de Sobrevivência Financeira
              </span>
              {dbConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-black font-mono text-emerald-200 uppercase tracking-wider">
                  <Cloud size={11} className="text-emerald-400 animate-pulse" /> Supabase Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-black font-mono text-amber-200 uppercase tracking-wider">
                  <CloudOff size={11} className="text-amber-400" /> Modo Cache Local
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans text-white">
              Objetivos & Orçamentos Mensais
            </h1>
            <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-medium">
              Defina tetos de gastos inteligentes para cada categoria e monitore a rapidez com que você consome seus recursos. Mantenha as finanças saudáveis antes de ultrapassar o limite.
            </p>
          </div>

          <div className="flex bg-slate-900/45 p-1 rounded-2xl border border-white/15 self-start md:self-center shrink-0 shadow-sm">
            <button
              onClick={() => setSubTab('tracking')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'tracking'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Activity size={14} />
              Acompanhamento
            </button>
            <button
              onClick={() => setSubTab('setup')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'setup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Edit2 size={14} />
              Definir Objetivos
            </button>
          </div>
        </div>
      </div>

      {subTab === 'tracking' ? (
        // TAB 1: ACCOMPANHAMENTO (PROGRESS TRACKER & INDICATORS)
        <div className="space-y-6" id="budgets-dashboard-tracker">
          
          {/* Tracker Filters and Overview Controls Row */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150/75 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                <ListFilter size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight">Período de Monitoramento</h4>
                <p className="text-xs text-gray-400 mt-0.5">Analise as transações conforme o mês correspondente</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="budget-month-selector" className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Mês:</label>
              <select
                id="budget-month-selector"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200/80 focus:border-blue-500 rounded-xl text-xs font-black text-gray-700 cursor-pointer outline-none transition-all focus:ring-2 focus:ring-blue-100"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{translateMonthName(m)}</option>
                ))}
              </select>
            </div>
          </div>

          {activeBudgetsData.length === 0 ? (
            /* EMPTY STATE IN TRACKING TAB */
            <div className="bg-white p-12 text-center rounded-3xl border border-gray-150/80 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <Target size={30} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-gray-900">Nenhum Objetivo de Gastos Cadastrado</h3>
                <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Para começar a monitorar a sua saúde financeira, configure metas ou tetos máximos para as suas categorias de despesas (como Alimentação, Veículo, Lazer, etc.) na aba de cadastro.
                </p>
              </div>
              <button
                onClick={() => setSubTab('setup')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Definir Meu Primeiro Objetivo
              </button>
            </div>
          ) : (
            <>
              {/* TOP STRATEGIC METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 1. TOTAL BUDGET VALUE */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150/70 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Orçamento Total</span>
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Target size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{formatBRL(stats.totalBudgeted)}</h3>
                    <p className="text-xs text-gray-400 mt-1">Soma das metas estipuladas</p>
                  </div>
                </div>

                {/* 2. ACTUAL TOTAL EXPENSES OF BUDGETS */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150/70 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-sans">Efetuado (Gasto)</span>
                    <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                      <Coins size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{formatBRL(stats.totalSpent)}</h3>
                    <p className="text-xs mt-1 font-semibold flex items-center gap-1.5 text-rose-600">
                      <TrendingUp size={11} className="shrink-0 animate-pulse" />
                      {stats.overallPercentage}% do orçamento geral
                    </p>
                  </div>
                </div>

                {/* 3. ECONOMY/REMAINING RATIO */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150/70 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-sans">Margem Restante</span>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${
                      stats.netRemaining >= 0 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      {stats.netRemaining >= 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold ${stats.netRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatBRL(Math.abs(stats.netRemaining))}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.netRemaining >= 0 ? 'Abaixo do teto planejado' : 'Ultrapassou o teto total'}
                    </p>
                  </div>
                </div>

                {/* 4. EXCEEDED INDICATOR */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150/70 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest font-sans">Status por Categoria</span>
                    <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                      <AlertCircle size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {stats.exceededCategoriesCount} Estourada(s)
                    </h3>
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      {stats.warningCategoriesCount} próximas do limite (&gt;=80%)
                    </p>
                  </div>
                </div>

              </div>

              {/* BAR CHART OVERVIEW OF BUDGET VS ACTUALLY SPENT */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150/70 shadow-xs">
                <h4 className="text-base font-bold text-gray-900 mb-1.5 tracking-tight flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                  Barra Geral de Utilização do Orçamento
                </h4>
                <p className="text-xs text-gray-400 mb-5 leading-normal">Visão consolidada de todas as metas ativas para o mês selecionado</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-500">Progresso Geral</span>
                    <span className={stats.overallPercentage >= 100 ? 'text-rose-600 font-extrabold' : 'text-blue-600 font-extrabold'}>
                      {stats.overallPercentage}% ({formatBRL(stats.totalSpent)} de {formatBRL(stats.totalBudgeted)})
                    </span>
                  </div>
                  
                  {/* Visual Progress Bar Wrapper */}
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-150 p-0.5 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(stats.overallPercentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        stats.overallPercentage >= 100
                          ? 'bg-gradient-to-r from-rose-500 to-red-600'
                          : stats.overallPercentage >= 80
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500'
                      }`}
                    />
                  </div>

                  <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                    <Lightbulb size={12} className="text-blue-500 shrink-0" />
                    <span>
                      {stats.netRemaining >= 0 
                        ? `Excelente! Você ainda tem ${formatBRL(stats.netRemaining)} disponíveis de crédito para este mês antes de estourar.` 
                        : `Cuidado! Você excedeu o limite do seu planejamento total em ${formatBRL(Math.abs(stats.netRemaining))}.`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST OF BUDGETS PROGRESS PER CATEGORY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1 font-mono">Consumo Detalhado por Categoria (Metas Individuais)</h4>
                  <span className="text-xs text-gray-400 font-semibold">{activeBudgetsData.length} categorias cadastradas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBudgetsData.map((item) => {
                    const progressColor = item.percentage >= 100 
                      ? 'text-rose-600 border-rose-100 bg-rose-50' 
                      : item.percentage >= 80 
                      ? 'text-amber-600 border-amber-100 bg-amber-50' 
                      : 'text-emerald-600 border-emerald-100 bg-emerald-50';

                    const fillBarColor = item.percentage >= 100
                      ? 'bg-rose-500'
                      : item.percentage >= 80
                      ? 'bg-amber-500'
                      : item.category.color; // Falling back to specified category color

                    return (
                      <div 
                        id={`budget-card-${item.category.id}`}
                        key={item.category.id} 
                        className="bg-white p-5 rounded-2xl border border-gray-150/70 shadow-xs hover:border-blue-100 transition-all duration-200 hover:shadow-sm space-y-4"
                      >
                        {/* Title content and icons */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: `${item.category.color}15`,
                                borderColor: `${item.category.color}35`,
                                color: item.category.color
                              }}
                            >
                              <LucideIcon name={item.category.icon} size={18} />
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-gray-900 leading-snug">{item.category.name}</h5>
                              <p className="text-[11px] text-gray-400 mt-0.5">Meta: <span className="font-bold text-gray-600">{formatBRL(item.limit)} / mês</span></p>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 border ${progressColor}`}>
                            {item.percentage}%
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-150 p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: fillBarColor }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-medium">Gasto: <span className="font-extrabold text-slate-800 font-mono">{formatBRL(item.spent)}</span></span>
                            
                            {item.remaining >= 0 ? (
                              <span className="text-emerald-600 font-semibold">Faltam {formatBRL(item.remaining)}</span>
                            ) : (
                              <span className="text-rose-600 font-extrabold">Excedeu em {formatBRL(Math.abs(item.remaining))}</span>
                            )}
                          </div>
                        </div>

                        {/* Recommendation advice indicator badge */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-[10.5px] italic text-gray-400">
                            {item.percentage >= 100 
                              ? '⚠️ Compras congeladas nesta categoria' 
                              : item.percentage >= 80 
                              ? '⚡ Atenção! Reduza gastos supérfluos' 
                              : '✅ Consumo saudável sob controle'
                            }
                          </span>

                          <button 
                            onClick={() => {
                              // Auto-opens preset value in editing modal
                              setSubTab('setup');
                              setEditingValues(prev => ({
                                ...prev,
                                [item.category.id]: String(item.limit)
                              }));
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 size={10} />
                            Reajustar Meta
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      ) : (
        // TAB 2: DEFINE TARGETS (MANAGE AND ASSIGN SPENDING LIMITS)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="budgets-management-setup">
          
          {/* Main Grid left: config rows */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-150/85 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Estipular Limites para Categorias</h3>
                <span className="text-xs text-gray-400 font-semibold">{expenseCategories.length} Categorias de Despesas</span>
              </div>
              <p className="text-xs text-gray-400 leading-normal mb-5">
                Digite um teto máximo que pretende gastar no mês em cada uma das categorias. Deixe em branco se a categoria não possuir limite estabelecido.
              </p>

              <div id="expense-budgets-grid-setup" className="space-y-3.5">
                {expenseCategories.map((cat) => {
                  const hasBudget = categoryBudgets[cat.id] !== undefined && categoryBudgets[cat.id] > 0;
                  const currentLimit = categoryBudgets[cat.id];
                  
                  // Controlled local input value
                  const isEditingLocal = editingValues[cat.id] !== undefined;
                  const valToShow = isEditingLocal 
                    ? editingValues[cat.id] 
                    : (currentLimit ? String(currentLimit) : '');

                  return (
                    <div 
                      key={cat.id} 
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                        hasBudget 
                          ? 'bg-slate-50 border-gray-200 shadow-3xs' 
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Left: icon/name */}
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}35`,
                            color: cat.color
                          }}
                        >
                          <LucideIcon name={cat.icon} size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 block leading-tight">{cat.name}</span>
                          <span className="text-[10.5px] font-bold tracking-wide mt-1 inline-block">
                            {hasBudget ? (
                              <span className="text-blue-600 bg-blue-50/55 px-1.5 py-0.5 rounded-md border border-blue-100/50">
                                Meta Ativa: {formatBRL(currentLimit)}/mês
                              </span>
                            ) : (
                              <span className="text-gray-400">Sem orçamento configurado</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Right: Numeric limit configurations input */}
                      <div className="flex items-center gap-2 max-w-sm sm:w-auto w-full self-stretch sm:self-center">
                        <div className="relative flex-1 min-w-[125px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">R$</span>
                          <input
                            type="text"
                            placeholder="Ilimitado"
                            value={valToShow}
                            disabled={savingIds[cat.id] || deletingIds[cat.id]}
                            onChange={(e) => handleInputChange(cat.id, e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-400 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs font-extrabold text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100 text-right"
                          />
                        </div>

                        {/* Save Confirmation or Sync Button */}
                        <button
                          onClick={() => handleSaveBudget(cat.id)}
                          disabled={!isEditingLocal || savingIds[cat.id] || deletingIds[cat.id]}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 select-none ${
                            savingIds[cat.id]
                              ? 'bg-blue-100 text-blue-600 cursor-wait'
                              : savedFeedbackIds[cat.id]
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-bounce'
                              : isEditingLocal
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/10'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/50'
                          }`}
                          title="Salvar objetivo"
                        >
                          {savingIds[cat.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : savedFeedbackIds[cat.id] ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Check size={14} />
                          )}
                          <span>
                            {savingIds[cat.id] 
                              ? 'Sincronizando...' 
                              : savedFeedbackIds[cat.id] 
                              ? 'Salvo!' 
                              : 'Salvar'}
                          </span>
                        </button>

                        {/* Reset / Delete Button */}
                        {hasBudget && (
                          <button
                            onClick={() => handleRemoveBudgetClick(cat.id)}
                            disabled={savingIds[cat.id] || deletingIds[cat.id]}
                            className={`p-2.5 rounded-xl transition-all border shrink-0 flex items-center justify-center ${
                              deletingIds[cat.id]
                                ? 'bg-rose-100 text-rose-400 cursor-wait border-rose-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border-rose-100/40 cursor-pointer'
                            }`}
                            title="Remover Meta de Gasto"
                          >
                            {deletingIds[cat.id] ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right hand informational tips cards sidebar */}
          <div className="space-y-6">
            
            {/* Guide Card panel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="text-blue-400 shrink-0" size={20} />
                <h4 className="text-sm font-bold tracking-tight">Como Funcionam as Metas?</h4>
              </div>
              
              <ul className="space-y-3.5 text-xs text-slate-300 leading-normal pl-0.5">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-extrabold">1.</span>
                  <span><strong>Defina Tetos de Gastos:</strong> Preencha o valor limite desejado para as categorias de despesas que deseja monitorar e clique em "Salvar".</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-extrabold">2.</span>
                  <span><strong>Acompanhe o Consumo:</strong> Acesse a aba "Acompanhamento" para ver as barras de progresso atualizarem de acordo com as transações realizadas no mês selecionado.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-extrabold">3.</span>
                  <span><strong>Monitore Alertas de Risco:</strong> O sistema exibirá o progresso em amarelo quando ultrapassar 80% e em vermelho com texto explicativo se você estourar o orçamento definido.</span>
                </li>
              </ul>
            </div>

            {/* Smart Advice Box */}
            <div className="bg-amber-50/50 border border-amber-150 p-6 rounded-2xl shadow-3xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <Lightbulb size={20} className="text-amber-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Dica do Planejador</h4>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                "Não estipule orçamentos excessivamente apertados no início. Analise sua média de gastos do mês anterior através da aba <strong>Relatórios</strong> e defina um orçamento de transição que seja realista para você e os seus hábitos!"
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
