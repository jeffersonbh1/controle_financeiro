import React, { useState, useMemo } from 'react';
import { User, Category, Transaction, FamilyGroup, FixedExpense } from '../types';
import { LucideIcon } from './LucideIcon';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarDays, 
  Briefcase, 
  FileText, 
  AlertCircle,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardViewProps {
  currentUser: User;
  categories: Category[];
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
  familyGroups?: FamilyGroup[];
  users?: User[];
  fixedExpenses?: FixedExpense[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  categories,
  transactions,
  setActiveTab,
  familyGroups = [],
  users = [],
  fixedExpenses = []
}) => {
  // Filter state for month
  const [selectedMonth, setSelectedMonth] = useState('2026-05'); // Default to May 2026 (per metadata current year is 2026)

  // List of available months based on transactions + current month
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-05');
    transactions.forEach(tx => {
      if (tx.date) {
        months.add(tx.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filter transactions by user AND month (co-owned by family group if active)
  const userTransactions = useMemo(() => {
    const group = familyGroups?.find(g => g.memberIds.includes(currentUser?.id || ''));
    const allowedUserIds = group ? group.memberIds : [currentUser?.id || ''];
    return transactions.filter(tx => allowedUserIds.includes(tx.userId));
  }, [transactions, currentUser, familyGroups]);

  const filteredTransactions = useMemo(() => {
    return userTransactions.filter(tx => tx.date && tx.date.startsWith(selectedMonth));
  }, [userTransactions, selectedMonth]);

  // Track pending programmed fixed expenses for checklist reminder
  const pendingFixedExpenses = useMemo(() => {
    const group = familyGroups?.find(g => g.memberIds.includes(currentUser?.id || ''));
    const allowedUserIds = group ? group.memberIds : [currentUser?.id || ''];
    return fixedExpenses.filter(fe => {
      const isOwned = allowedUserIds.includes(fe.userId);
      const isPaid = fe.paidMonths.includes(selectedMonth);
      return isOwned && !isPaid;
    });
  }, [fixedExpenses, familyGroups, currentUser, selectedMonth]);

  const pendingFixedTotal = useMemo(() => {
    return pendingFixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
  }, [pendingFixedExpenses]);

  const allFixedExpensesCount = useMemo(() => {
    const group = familyGroups?.find(g => g.memberIds.includes(currentUser?.id || ''));
    const allowedUserIds = group ? group.memberIds : [currentUser?.id || ''];
    return fixedExpenses.filter(fe => allowedUserIds.includes(fe.userId)).length;
  }, [fixedExpenses, familyGroups, currentUser]);

  // Calculate totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    return {
      income,
      expense,
      balance: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0
    };
  }, [filteredTransactions]);

  // Aggregate Data for Category Pie Chart (Expenses only)
  const categoryChartData = useMemo(() => {
    const temp: Record<string, { value: number; color: string; name: string }> = {};
    
    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense' && tx.categoryId) {
        const cat = categories.find(c => c.id === tx.categoryId);
        const name = cat ? cat.name : 'Outras Despesas';
        const color = cat ? cat.color : '#6B7280';
        
        if (!temp[tx.categoryId]) {
          temp[tx.categoryId] = { value: 0, color, name };
        }
        temp[tx.categoryId].value += tx.amount;
      }
    });

    return Object.values(temp).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // Aggregate Data for Daily Flow (Bar Chart / Area Flow)
  const dailyFlowData = useMemo(() => {
    const daysInMonth: Record<string, { fiaActive: string; receita: number; despesa: number }> = {};
    
    // Default mock empty days for selected month (showing e.g., 5, 10, 15, 20, 25, 30 to make it neat)
    const days = ['01', '05', '10', '15', '20', '25', '28', '30'];
    days.forEach(d => {
      const dayStr = `${selectedMonth.split('-')[1]}/${d}`;
      daysInMonth[dayStr] = { fiaActive: dayStr, receita: 0, despesa: 0 };
    });

    // Feed transactions
    filteredTransactions.forEach(tx => {
      try {
        const dateParts = tx.date.split('-');
        const day = dateParts[2];
        const dayFormatted = `${dateParts[1]}/${day}`;
        
        if (!daysInMonth[dayFormatted]) {
          // Create on the fly
          daysInMonth[dayFormatted] = { fiaActive: dayFormatted, receita: 0, despesa: 0 };
        }
        
        if (tx.type === 'income') {
          daysInMonth[dayFormatted].receita += tx.amount;
        } else {
          daysInMonth[dayFormatted].despesa += tx.amount;
        }
      } catch (e) {
        // Safe wrap
      }
    });

    return Object.values(daysInMonth).sort((a, b) => {
      return a.fiaActive.localeCompare(b.fiaActive);
    });
  }, [filteredTransactions, selectedMonth]);

  // Helper formatting currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-100">
      {/* Top Welcome Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
        <div>
          <h2 id="dashboard-hero-title" className="text-2xl font-bold text-gray-900 tracking-tight">
            Olá, {currentUser?.name || 'Usuário'}! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Aqui está a visão geral das suas finanças pessoais para o mês selecionado.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CalendarDays className="h-5 w-5 text-gray-400" />
          <select
            id="dashboard-month-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3.5 py-2 hover:bg-gray-100/50 outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
          >
            {availableMonths.map(m => {
              const [year, month] = m.split('-');
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, 15);
              const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card Saldo Geral */}
        <div 
          id="metric-balance-card"
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Saldo Restante
            </span>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 id="metric-balance-value" className={`text-3xl font-extrabold tracking-tight ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatBRL(totals.balance)}
            </h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <PiggyBank size={14} className="text-slate-400" />
              Taxa de poupança: <span className="font-semibold text-emerald-400">{totals.savingsRate.toFixed(1)}%</span>
            </p>
          </div>
        </div>

        {/* Card Receitas do Mês */}
        <div 
          id="metric-income-card"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Receitas de {selectedMonth.split('-')[1]}/2026
            </span>
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 id="metric-income-value" className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {formatBRL(totals.income)}
            </h3>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
              <ArrowUpRight size={14} /> Entrada de recursos
            </p>
          </div>
        </div>

        {/* Card Despesas do Mês */}
        <div 
          id="metric-expense-card"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Despesas de {selectedMonth.split('-')[1]}/2026
            </span>
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 id="metric-expense-value" className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {formatBRL(totals.expense)}
            </h3>
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
              <ArrowDownRight size={14} /> Saída de recursos
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Despesas Fixas Programadas */}
      {allFixedExpensesCount > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-xs border transition-all animate-fade-in">
          {pendingFixedExpenses.length > 0 ? (
            <div className="bg-amber-50/75 border-amber-200/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-500/10 text-amber-700 rounded-xl shrink-0 mt-0.5">
                  <CalendarCheck size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 leading-tight">
                    Despesas Fixas Pendentes ({pendingFixedExpenses.length})
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1 font-medium">
                    Detectamos <span className="font-bold text-amber-950">{pendingFixedExpenses.length}</span> {pendingFixedExpenses.length === 1 ? 'despesa' : 'despesas'} pendente(s) para {selectedMonth.split('-')[1]}/2026, somando <span className="font-bold text-amber-950">{formatBRL(pendingFixedTotal)}</span>. Evite multas e juros por atraso!
                  </p>
                </div>
              </div>
              <button
                id="dashboard-go-to-fixed-button"
                onClick={() => setActiveTab('fixed-expenses')}
                className="self-start sm:self-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-amber-600/15 cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                Quitar ou Lançar Agora
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border-emerald-150/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                  <Check size={20} className="stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 leading-tight">
                    Tudo em Dia por Aqui! 🎉
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed mt-1 font-medium">
                    Nenhuma despesa fixa pendente encontrada para a competência de {selectedMonth.split('-')[1]}/2026. Todas as contas foram marcadas como pagas e lançadas!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('fixed-expenses')}
                className="self-start sm:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Configurar Lançamentos
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seção de Gráficos e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Fluxo Diário/Semanal de Receitas x Despesas */}
        <div id="chart-flow-container" className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-gray-900">Fluxo Financeiro Mensal</h4>
              <p className="text-xs text-gray-400 mt-0.5">Distribuição temporal de receitas e despesas</p>
            </div>
          </div>
          
          <div className="h-80 w-full min-h-[300px]">
            {filteredTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <AlertCircle size={28} className="text-gray-300" />
                <span className="text-sm">Nenhum dado financeiro para este período.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyFlowData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="fiaActive" 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94A3B8" 
                    fontSize={11}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94A3B8" 
                    fontSize={11}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatBRL(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="receita" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria (Pie Chart) */}
        <div id="chart-category-container" className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div>
            <h4 className="text-base font-bold text-gray-900">Gastos por Categoria</h4>
            <p className="text-xs text-gray-400 mt-0.5">Quais categorias mais consumiram saldo</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center min-h-[200px] my-4">
            {categoryChartData.length === 0 ? (
              <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                <AlertCircle size={28} className="text-gray-300" />
                <span className="text-sm">Nenhuma despesa para exibir.</span>
              </div>
            ) : (
              <>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="55%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [formatBRL(Number(value)), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Subtitle list */}
                <div className="w-full max-h-36 overflow-y-auto no-scrollbar space-y-1.5 mt-2">
                  {categoryChartData.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="text-gray-900 font-bold">{formatBRL(entry.value)}</span>
                    </div>
                  ))}
                  {categoryChartData.length > 5 && (
                    <div className="text-[10px] text-gray-400 text-center pt-1 font-semibold">
                      + {categoryChartData.length - 5} outras categorias
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recentes Lançamentos */}
      <div id="dashboard-recent-transactions" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-gray-900">Histórico de Lançamentos Recentes</h4>
            <p className="text-xs text-gray-400 mt-0.5">Últimos movimentos financeiros registrados neste mês</p>
          </div>
          <button 
            onClick={() => setActiveTab('expenses')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Novo Lançamento <ArrowUpRight size={14} />
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <FileText size={32} className="text-gray-300" />
            <p className="text-sm">Nenhum lançamento foi efetuado em {selectedMonth.split('-')[1]}/2026.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.slice(0, 5).map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  const txUser = users.find(u => u.id === tx.userId);
                  return (
                    <tr id={`tx-row-${tx.id}`} key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm">{tx.description}</span>
                          {txUser && txUser.id !== currentUser.id && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold" title={`Lançado por ${txUser.name}`}>
                              {txUser.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isExpense ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border" style={{ borderColor: `${cat?.color || '#E2E8F0'}30`, backgroundColor: `${cat?.color || '#F1F5F9'}10`, color: cat?.color }}>
                            {cat ? <LucideIcon name={cat.icon} size={12} /> : null}
                            <span>{cat?.name || 'Despesa'}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-emerald-100 bg-emerald-50 text-emerald-700">
                            {cat ? <LucideIcon name={cat.icon} size={12} /> : null}
                            <span>{cat?.name || 'Receita'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-500 font-mono">
                        {tx.date.split('-').reverse().join('/')}
                      </td>
                      <td className={`py-3.5 px-4 text-sm font-bold text-right ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
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
  );
};
