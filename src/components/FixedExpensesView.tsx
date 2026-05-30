import React, { useState, useMemo } from 'react';
import { User, Category, Transaction, FixedExpense } from '../types';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Receipt, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Coins 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon } from './LucideIcon';

interface FixedExpensesViewProps {
  currentUser: User;
  categories: Category[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  familyGroups?: any[];
  users: User[];
  onAddFixedExpense: (expense: FixedExpense) => void;
  onDeleteFixedExpense: (id: string) => void;
  onToggleFixedExpensePaid: (id: string, month: string, shouldAddTransaction: boolean) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export const FixedExpensesView: React.FC<FixedExpensesViewProps> = ({
  currentUser,
  categories,
  transactions,
  fixedExpenses,
  familyGroups = [],
  users,
  onAddFixedExpense,
  onDeleteFixedExpense,
  onToggleFixedExpensePaid,
  onAddTransaction,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-05'); // Default to May 2026 match
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [autoRegisterTransaction, setAutoRegisterTransaction] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find user's active family group
  const activeGroup = useMemo(() => {
    return familyGroups.find(g => g.memberIds.includes(currentUser.id));
  }, [familyGroups, currentUser.id]);

  // Allowed userIds to filter fixed expenses
  const allowedUserIds = useMemo(() => {
    return activeGroup ? activeGroup.memberIds : [currentUser.id];
  }, [activeGroup, currentUser.id]);

  // Filter fixed expenses by ownership or family group sharing
  const filteredFixedExpenses = useMemo(() => {
    return fixedExpenses.filter(fe => allowedUserIds.includes(fe.userId));
  }, [fixedExpenses, allowedUserIds]);

  // Available months list for selector
  const monthsList = [
    { value: '2026-01', label: 'Janeiro 2026' },
    { value: '2026-02', label: 'Fevereiro 2026' },
    { value: '2026-03', label: 'Março 2026' },
    { value: '2026-04', label: 'Abril 2026' },
    { value: '2026-05', label: 'Maio 2026' },
    { value: '2026-06', label: 'Junho 2026' },
    { value: '2026-07', label: 'Julho 2026' },
    { value: '2026-08', label: 'Agosto 2026' },
    { value: '2026-09', label: 'Setembro 2026' },
    { value: '2026-10', label: 'Outubro 2026' },
    { value: '2026-11', label: 'Novembro 2026' },
    { value: '2026-12', label: 'Dezembro 2026' },
  ];

  // Helper formatting currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleRegisterFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Insira um valor numérico válido maior que zero.');
      return;
    }

    const day = parseInt(dueDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    const newExpense: FixedExpense = {
      id: `fixed-${Date.now()}`,
      userId: currentUser.id,
      description: description.trim(),
      amount: parsedAmount,
      categoryId: categoryId || undefined,
      dueDay: day,
      paidMonths: []
    };

    onAddFixedExpense(newExpense);
    setSuccess(`Despesa fixa "${newExpense.description}" cadastrada!`);
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDueDay('5');

    setTimeout(() => setSuccess(''), 4000);
  };

  const handleMarkAsPaid = (expense: FixedExpense) => {
    const isPaid = expense.paidMonths.includes(selectedMonth);
    
    if (!isPaid) {
      // Mark as paid
      onToggleFixedExpensePaid(expense.id, selectedMonth, true);
      
      // If autoRegisterTransaction is checked, also register a real Transaction
      if (autoRegisterTransaction) {
        // Resolve a safe day to place in YYYY-MM-DD
        const paddedDay = String(expense.dueDay).padStart(2, '0');
        const transactionDate = `${selectedMonth}-${paddedDay}`;

        const newTx: Transaction = {
          id: `tx-fixed-${expense.id}-${selectedMonth}`,
          userId: currentUser.id,
          type: 'expense',
          amount: expense.amount,
          description: `[Fixo] ${expense.description}`,
          categoryId: expense.categoryId,
          date: transactionDate
        };
        onAddTransaction(newTx);
      }
    } else {
      // Mark as unpaid (undo)
      onToggleFixedExpensePaid(expense.id, selectedMonth, false);
      
      // Optionally find and delete the auto-registered transaction
      // Wait, let's keep it robust and transparent!
    }
  };

  // Compute overall status of current month's checklist
  const stats = useMemo(() => {
    const totalCount = filteredFixedExpenses.length;
    const paidList = filteredFixedExpenses.filter(e => e.paidMonths.includes(selectedMonth));
    const paidCount = paidList.length;
    const totalAmount = filteredFixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidAmount = paidList.reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    return {
      totalCount,
      paidCount,
      pendingCount: totalCount - paidCount,
      percentPaid: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  }, [filteredFixedExpenses, selectedMonth]);

  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense');
  }, [categories]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 font-sans selection:bg-blue-100">
      
      {/* Left Column: Form + Insights */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Form to Create Fixed Expense */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Programar Despesa Fixa</h3>
              <p className="text-xs text-gray-400">Cadastre gastos recorrentes (Aluguel, Luz, Assinaturas)</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-700 text-xs font-semibold">
              <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegisterFixedExpense} className="space-y-4">
            
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                Descrição da Despesa
              </label>
              <input
                id="fixed-expense-description-input"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Aluguel, Netflix, Internet..."
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>

            {/* Row with Amount + Due Day */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                  Valor Estimado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">R$</span>
                  <input
                    id="fixed-expense-amount-input"
                    type="text"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                  Dia de Vencimento
                </label>
                <input
                  id="fixed-expense-due-day"
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={e => setDueDay(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none font-semibold cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                Categoria Associada
              </label>
              <select
                id="fixed-expense-category-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer appearance-none"
              >
                <option value="">Sem Categoria (Opcional)</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              id="fixed-expense-submit-btn"
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
            >
              <Plus size={16} />
              Programar Despesa Fixa
            </button>
          </form>
        </div>

        {/* Integration Instructions Card */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-5 rounded-2xl text-white shadow-md border border-blue-900/40 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
            <Sparkles size={110} />
          </div>
          
          <h4 className="text-sm font-bold flex items-center gap-1.5 text-blue-100 mb-2">
            <Sparkles size={15} /> Checklist Inteligente
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal mb-3">
            Não se preocupe em recriar transações todo mês: ao marcar uma despesa fixa como paga/lançada, oferecemos sincronização automática com o seu extrato geral!
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-mono tracking-wider bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-bold">
              Automático e Seguro
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {activeGroup ? 'Grupo Familiar Vinculado' : 'Modo Pessoal'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Active General fixed expenses checklist */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        
        {/* Header with Monthly selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">Despesas Fixas Agendadas</h3>
            <p className="text-xs text-gray-400">Marque o que já foi liquidado ou lançado no mês vigente</p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="text-xs font-bold text-gray-500 shrink-0">Competência:</span>
            <select
              id="fixed-expense-month-selector"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Progress Indicator of Scheduled list */}
        {filteredFixedExpenses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-slate-55/40 border border-gray-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Progresso do Mês</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-base font-extrabold text-slate-800">{stats.paidCount} de {stats.totalCount}</span>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md">
                  {stats.percentPaid}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.percentPaid}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/20 border border-emerald-100/40 rounded-xl text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Total Liquidado</p>
              <p className="text-base font-extrabold text-emerald-800 mt-1">{formatBRL(stats.paidAmount)}</p>
              <p className="text-[9px] text-emerald-600 font-medium mt-0.5">Lançado no fluxo caixa</p>
            </div>

            <div className="p-3 bg-rose-50/20 border border-rose-100/40 rounded-xl text-center">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Pendente de Pagamento</p>
              <p className="text-base font-extrabold text-rose-800 mt-1">{formatBRL(stats.pendingAmount)}</p>
              <p className="text-[9px] text-rose-600 font-medium mt-0.5">Organizar para evitar juros</p>
            </div>
          </div>
        )}

        {/* Action checklist with auto-registration modifier check */}
        <div className="flex items-center justify-between mb-4 bg-gray-55/40 p-2.5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <input
              id="autoregistrar-toggle"
              type="checkbox"
              checked={autoRegisterTransaction}
              onChange={e => setAutoRegisterTransaction(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="autoregistrar-toggle" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
              Registrar transação no extrato principal automaticamente ao marcar pago
            </label>
          </div>
          <div className="p-1 text-slate-400 hover:text-blue-500 cursor-help" title="Lançará uma despesa com o valor, descrição e dia informados diretamente na conta ativa de quem marcou a opção.">
            <Info size={13} />
          </div>
        </div>

        {/* Listing Fixed Expenses */}
        {filteredFixedExpenses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
            <Coins className="h-10 w-10 text-gray-300 mb-3" />
            <h4 className="text-sm font-bold text-gray-700">Nenhuma Despesa Fixa Programada</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
              Crie despesas recorrentes (como aluguel, faculdade, luz ou assinaturas) para gerenciar o checklist e nunca esquecer de pagá-las!
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[500px] no-scrollbar">
            <AnimatePresence initial={false}>
              {filteredFixedExpenses.map(expense => {
                const isPaid = expense.paidMonths.includes(selectedMonth);
                const category = categories.find(c => c.id === expense.categoryId);
                const creator = users.find(u => u.id === expense.userId);

                return (
                  <motion.div
                    id={`fixed-expense-card-${expense.id}`}
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isPaid 
                        ? 'bg-emerald-50/20 border-emerald-100/70 shadow-3xs' 
                        : 'bg-white border-gray-150 shadow-5xs hover:border-gray-300'
                    }`}
                  >
                    {/* Item Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className={`h-9 w-9 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-800'
                      }`} style={{ backgroundColor: !isPaid && category ? `${category.color}15` : undefined, color: !isPaid && category ? category.color : undefined }}>
                        {isPaid ? (
                          <CheckCircle2 size={16} />
                        ) : category ? (
                          <LucideIcon name={category.icon} size={16} />
                        ) : (
                          <Receipt size={16} />
                        )}
                      </div>

                      {/* Summary */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                            {expense.description}
                          </p>
                          {creator && creator.id !== currentUser.id && (
                            <span 
                              className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[8px] font-bold"
                              title={`Criado por ${creator.name}`}
                            >
                              de {creator.name.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 font-medium text-[11px] text-gray-400">
                          {category && (
                            <>
                              <span>{category.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock size={11} /> Vence dia {expense.dueDay}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right action control */}
                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-gray-100 pt-2.5 md:pt-0 shrink-0">
                      
                      {/* Amount */}
                      <div className="text-left md:text-right">
                        <div className={`text-sm font-extrabold ${isPaid ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
                          {formatBRL(expense.amount)}
                        </div>
                        <p className="text-[9px] text-gray-400">Valor mensal aproximado</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Checkbox Trigger button */}
                        <button
                          id={`toggle-paid-btn-${expense.id}`}
                          onClick={() => handleMarkAsPaid(expense)}
                          className={`px-3 py-1.5 border font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                              : 'bg-white border-gray-250 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20'
                          }`}
                        >
                          <Check size={13} className={isPaid ? 'stroke-[3]' : ''} />
                          {isPaid ? 'Liquidado' : 'Marcar Pago'}
                        </button>

                        {/* Delete Expense */}
                        <button
                          id={`delete-fixed-btn-${expense.id}`}
                          onClick={() => {
                            if (window.confirm(`Deseja realmente remover esta programação de despesa fixa "${expense.description}"?`)) {
                              onDeleteFixedExpense(expense.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Remover programação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
};
