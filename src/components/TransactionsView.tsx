import React, { useState, useMemo } from 'react';
import { User, Category, Transaction } from '../types';
import { LucideIcon } from './LucideIcon';
import { Plus, Trash2, PiggyBank, Receipt, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionsViewProps {
  currentUser: User;
  categories: Category[];
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  initialType?: 'expense' | 'income';
  users?: User[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentUser,
  categories,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  initialType = 'expense',
  users = []
}) => {
  const [activeType, setActiveType] = useState<'expense' | 'income'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); // Default to today in YYYY-MM-DD
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'desc-asc'>('date-desc');

  const formatAmountMask = (rawValue: string): string => {
    const clean = rawValue.replace(/\D/g, '');
    if (!clean) return '';
    const num = parseInt(clean, 10);
    if (isNaN(num) || num === 0) return '';
    const valueInCent = num / 100;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valueInCent);
  };

  // Filter categories by type
  const typeCategories = useMemo(() => {
    return categories.filter(cat => cat.type === activeType);
  }, [categories, activeType]);

  // Handle local state or defaults when tab switches
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setActiveType(newType);
    setCategoryId('');
    setAlert(null);
  };

  // Filter and sort transactions owned by this user and matching the active type
  const sortedTransactions = useMemo(() => {
    const filtered = transactions.filter(
      tx => tx.userId === currentUser.id && tx.type === activeType
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.id.localeCompare(a.id);
      }
      if (sortBy === 'date-asc') {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.id.localeCompare(b.id);
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'desc-asc') {
        return a.description.localeCompare(b.description);
      }
      return 0;
    });
  }, [transactions, currentUser.id, activeType, sortBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
    const parsedAmount = parseFloat(cleanAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlert({ type: 'error', message: 'Por favor, informe um valor numérico válido maior que zero.' });
      return;
    }

    if (!description.trim()) {
      setAlert({ type: 'error', message: 'Por favor, insira uma descrição.' });
      return;
    }

    if (activeType === 'expense' && !categoryId) {
      setAlert({ type: 'error', message: 'Por favor, selecione uma categoria para a despesa.' });
      return;
    }

    if (!date) {
      setAlert({ type: 'error', message: 'Por favor, selecione uma data válida.' });
      return;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: activeType,
      amount: parsedAmount,
      description: description.trim(),
      categoryId: activeType === 'expense' ? categoryId : categoryId || undefined,
      date
    };

    onAddTransaction(newTx);
    
    // Clear form
    setAmount('');
    setDescription('');
    setCategoryId('');
    
    setAlert({ 
      type: 'success', 
      message: `${activeType === 'expense' ? 'Despesa' : 'Receita'} registrada com sucesso!` 
    });

    // Auto dismiss alert
    setTimeout(() => setAlert(null), 3500);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 font-sans selection:bg-blue-100">
      
      {/* Transaction Addition Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
        <div>
          {/* Tabs for choosing expense or income */}
          <div className="grid grid-cols-2 p-1.5 bg-gray-50 rounded-2xl mb-6">
            <button
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeType === 'expense'
                  ? 'bg-white shadow-sm text-rose-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Excluir / Despesas
            </button>
            <button
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeType === 'income'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Adicionar / Receitas
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">
              {activeType === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
            </h3>
            <p className="text-xs text-gray-400">
              Preencha o formulário para registrar a movimentação financeira
            </p>
          </div>

          {alert && (
            <div className={`p-3 text-xs font-semibold rounded-xl mb-4.5 flex gap-2 ${
              alert.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{alert.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Valor (Amount) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                Valor do Lançamento
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 font-mono font-bold text-sm">
                  R$
                </span>
                <input
                  id="transaction-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={e => setAmount(formatAmountMask(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm font-bold transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
                  required
                />
              </div>
            </div>

            {/* Input Descrição */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                Descrição / Detalhe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <FileText size={16} />
                </span>
                <input
                  id="transaction-desc-input"
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={activeType === 'expense' ? 'Ex: Jantar de negócios, mercado...' : 'Ex: Salário, freelancer, bônus...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
                  required
                />
              </div>
            </div>

            {/* Categoria Select */}
            {(activeType === 'expense' || typeCategories.length > 0) && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                  Categoria correspondente
                </label>
                {typeCategories.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-medium">
                    Aviso: Crie pelo menos uma categoria de despesa primeiro.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="transaction-category-select"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer appearance-none"
                      required={activeType === 'expense'}
                    >
                      <option value="">Selecione uma categoria</option>
                      {typeCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                      ▼
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Data (Date input) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                Data do Lançamento
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Calendar size={16} />
                </span>
                <input
                  id="transaction-date-input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                  required
                />
              </div>
            </div>

            <button
              id="transaction-submit-btn"
              type="submit"
              disabled={activeType === 'expense' && typeCategories.length === 0}
              className={`w-full py-3 text-white font-semibold text-sm rounded-xl transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Registrar {activeType === 'expense' ? 'Despesa' : 'Receita'}
            </button>
          </form>
        </div>
      </div>

      {/* Transactions History Overview */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {activeType === 'expense' ? 'Suas Despesas Lançadas' : 'Suas Receitas Lançadas'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeType === 'expense' 
                  ? 'Listagem organizada de todas as saídas registradas na sua conta' 
                  : 'Listagem organizada de todas as entradas registradas na sua conta'}
              </p>
            </div>
            
            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <span className="text-xs font-semibold text-gray-400">Ordenar:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="pl-2 px-7 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 focus:border-blue-500 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-100"
                >
                  <option value="date-desc">Mais Recentes</option>
                  <option value="date-asc">Mais Antigas</option>
                  <option value="amount-desc">Maior Valor</option>
                  <option value="amount-asc">Menor Valor</option>
                  <option value="desc-asc">Descrição (A-Z)</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[9px]">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="py-24 text-center text-gray-400">
              <Receipt size={40} className="mx-auto text-gray-200 mb-2.5" />
              <p className="text-sm">Nenhum lançamento efetuado ou registrado.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {sortedTransactions.map(tx => {
                const isExpense = tx.type === 'expense';
                const cat = categories.find(c => c.id === tx.categoryId);

                return (
                  <div
                    id={`tx-card-${tx.id}`}
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: cat?.color ? `${cat.color}15` : (isExpense ? '#FFF1F2' : '#ECFDF5'),
                          borderColor: cat?.color ? `${cat.color}30` : (isExpense ? '#FFE4E6' : '#D1FAE5'),
                          color: cat?.color || (isExpense ? '#EF4444' : '#10B981')
                        }}
                      >
                        <LucideIcon name={cat?.icon || (isExpense ? 'MinusCircle' : 'PlusCircle')} size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{cat?.name || (isExpense ? 'Despesa' : 'Receita')}</span>
                          <span>•</span>
                          <span className="font-mono">{tx.date.split('-').reverse().join('/')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-extrabold ${isExpense ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {isExpense ? '-' : '+'} {formatBRL(tx.amount)}
                      </span>
                      <button
                        id={`tx-delete-btn-${tx.id}`}
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover Lançamento"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
