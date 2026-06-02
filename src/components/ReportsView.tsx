import React, { useState, useMemo } from 'react';
import { Category, Transaction, User } from '../types';
import { LucideIcon } from './LucideIcon';
import { 
  BarChart3, 
  Calendar, 
  Tags, 
  Printer, 
  SlidersHorizontal, 
  Trash2, 
  FileSpreadsheet, 
  Check, 
  Coins, 
  Search,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsViewProps {
  categories: Category[];
  transactions: Transaction[];
  currentUser?: User;
  users?: User[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  categories,
  transactions,
  currentUser,
  users = []
}) => {
  // Filter core states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all'); // all, expense, income
  const [startDate, setStartDate] = useState<string>('2026-05-01'); // Nice starting value
  const [endDate, setEndDate] = useState<string>('2026-05-31'); // Nice ending value
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Process filters TOGETHER - "sendo possível aplicar todos esses filtros juntos"
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 0. User filtering
      if (currentUser && tx.userId !== currentUser.id) {
        return false;
      }

      // 1. Category Filter
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory) {
        return false;
      }

      // 2. Type Filter (despesa vs receita)
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }

      // 3. Date Range Filter
      if (startDate && tx.date < startDate) {
        return false;
      }
      if (endDate && tx.date > endDate) {
        return false;
      }

      // 4. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const cat = categories.find(c => c.id === tx.categoryId);
        const matchesCat = cat ? cat.name.toLowerCase().includes(query) : false;
        
        if (!matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterCategory, filterType, startDate, endDate, searchQuery, categories, currentUser]);

  // Sort transactions (latest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  // Calculations for filtered subset
  const metrics = useMemo(() => {
    let totalExpenses = 0;
    let totalIncomes = 0;
    
    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        totalExpenses += tx.amount;
      } else {
        totalIncomes += tx.amount;
      }
    });

    return {
      expenses: totalExpenses,
      incomes: totalIncomes,
      balance: totalIncomes - totalExpenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Categorical percentage bars representation (for expenses mostly)
  const categorySummary = useMemo(() => {
    const expensesGroup: Record<string, { amount: number; color: string; name: string }> = {};
    let totalExpenseFiltered = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense' && tx.categoryId) {
        const cat = categories.find(c => c.id === tx.categoryId);
        const name = cat ? cat.name : 'Desconhecido';
        const color = cat ? cat.color : '#6B7280';

        totalExpenseFiltered += tx.amount;
        if (!expensesGroup[tx.categoryId]) {
          expensesGroup[tx.categoryId] = { amount: 0, color, name };
        }
        expensesGroup[tx.categoryId].amount += tx.amount;
      }
    });

    return Object.values(expensesGroup).map(g => ({
      ...g,
      percentage: totalExpenseFiltered > 0 ? (g.amount / totalExpenseFiltered) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories]);

  // Auto clean all filter values
  const handleResetFilters = () => {
    setFilterCategory('all');
    setFilterType('all');
    setStartDate('2026-05-01');
    setEndDate('2026-05-31');
    setSearchQuery('');
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-blue-100 print:bg-white print:p-0">
      
      {/* Printable Heading (Only visible in print) */}
      <div className="hidden print:block border-b border-gray-400 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatório Consolidado de Gastos Pessoais</h1>
        <p className="text-xs text-gray-500 mt-1">
          Período: {startDate.split('-').reverse().join('/')} até {endDate.split('-').reverse().join('/')}
        </p>
      </div>

      {/* Filter and Control Panel Box */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Filtros de Relatório</h3>
              <p className="text-xs text-gray-400">Combine filtros para analisar dados profundos de seus gastos</p>
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Filtrar Categoria
            </label>
            <div className="relative">
              <select
                id="report-category-filter"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-blue-500 rounded-xl text-gray-800 text-xs transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'expense' ? 'Despesa' : 'Receita'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de fluxo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Tipo de Fluxo
            </label>
            <select
              id="report-type-filter"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-blue-500 rounded-xl text-gray-800 text-xs transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer"
            >
              <option value="all">Receitas e Despesas (Tudo)</option>
              <option value="expense">Apenas Despesas (Gastos)</option>
              <option value="income">Apenas Receitas (Rendimentos)</option>
            </select>
          </div>

          {/* Data inicial */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Data de Início
            </label>
            <div className="relative">
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-blue-500 rounded-xl text-gray-800 text-xs transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Data final */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Data de Término
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-blue-500 rounded-xl text-gray-800 text-xs transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Linha adicional de busca livre */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Search size={14} />
            </span>
            <input
              id="report-search-query"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquise por palavra-chave na descrição ou categoria"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-800 text-xs transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-blue-600/10"
          >
            <Printer size={14} /> 
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Metrics of filtered results */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Período Selecionado</span>
          <p className="text-xs font-semibold text-gray-800 mt-1 uppercase font-mono">
            {startDate.split('-').reverse().join('/')} ~ {endDate.split('-').reverse().join('/')}
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total de Receitas</span>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{formatBRL(metrics.incomes)}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Total de Despesas (Gastos)</span>
          <p className="text-lg font-extrabold text-rose-700 mt-0.5">{formatBRL(metrics.expenses)}</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resultado Líquido</span>
          <p className={`text-lg font-extrabold mt-0.5 ${metrics.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatBRL(metrics.balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main List Table (8 columns span) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between print:col-span-12">
          <div>
            <div className="flex items-center justify-between mb-4.5">
              <div>
                <h4 className="text-base font-bold text-gray-900">Lançamentos Identificados</h4>
                <p className="text-xs text-gray-400 mt-0.5">Detalhe das movimentações financeiras coincidentes com os filtros</p>
              </div>
              <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-xl text-xs font-bold font-mono">
                {metrics.count} registros
              </span>
            </div>

            {sortedTransactions.length === 0 ? (
              <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-2">
                <BarChart3 size={40} className="text-gray-200" />
                <p className="text-sm">Nenhum registro se enquadra nos filtros atuais.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedTransactions.map((tx) => {
                      const isExpense = tx.type === 'expense';
                      const cat = categories.find(c => c.id === tx.categoryId);
                      const txUser = users.find(u => u.id === tx.userId);

                      return (
                        <tr id={`report-tx-${tx.id}`} key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 text-xs font-bold text-gray-500 font-mono">
                            {tx.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">{tx.description}</span>
                              {txUser && currentUser && txUser.id !== currentUser.id && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold" title={`Lançado por ${txUser.name}`}>
                                  {txUser.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isExpense ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border border-rose-100 bg-rose-50/30 text-rose-700">
                                {cat ? <LucideIcon name={cat.icon} size={11} /> : null}
                                <span>{cat?.name || 'Despesa'}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border border-emerald-100 bg-emerald-50/30 text-emerald-700">
                                {cat ? <LucideIcon name={cat.icon} size={11} /> : null}
                                <span>{cat?.name || 'Receita'}</span>
                              </div>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-sm font-extrabold text-right ${isExpense ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {isExpense ? '-' : '+'} {formatBRL(tx.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Breakdown of Spending Category weights (4 columns span) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 mb-1">Pesos por Categoria</h4>
            <p className="text-xs text-gray-400 mb-5">Porcentagem das categorias nas despesas filtradas</p>

            {categorySummary.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                Nenhuma despesa para exibir peso proporcional.
              </div>
            ) : (
              <div className="space-y-4">
                {categorySummary.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                      <span className="truncate">{item.name}</span>
                      <span className="text-gray-900 font-bold">{formatBRL(item.amount)}</span>
                    </div>
                    
                    {/* Visual gauge */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${item.percentage}%`, 
                          backgroundColor: item.color 
                        }} 
                      />
                    </div>
                    
                    <div className="text-right text-[10px] text-gray-400 font-bold">
                      {item.percentage.toFixed(1)}% do total gasto
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
