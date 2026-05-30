import { User, Category, Transaction } from './types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Jefferson (Admin)',
    email: 'admin@carteira.com',
    phone: '(11) 99999-9999',
    role: 'admin',
    password: 'admin'
  },
  {
    id: 'user-regular',
    name: 'Ana Souza',
    email: 'user@carteira.com',
    phone: '(11) 98888-8888',
    role: 'user',
    password: 'user'
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Despesas
  { id: 'cat-alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#EF4444', type: 'expense' }, // Red
  { id: 'cat-combustivel', name: 'Combustível', icon: 'Car', color: '#F59E0B', type: 'expense' }, // Amber
  { id: 'cat-moradia', name: 'Moradia', icon: 'Home', color: '#3B82F6', type: 'expense' }, // Blue
  { id: 'cat-saude', name: 'Saúde', icon: 'HeartPulse', color: '#10B981', type: 'expense' }, // Emerald
  { id: 'cat-lazer', name: 'Lazer / Viagens', icon: 'Sparkles', color: '#8B5CF6', type: 'expense' }, // Purple
  { id: 'cat-compras', name: 'Compras', icon: 'ShoppingBag', color: '#EC4899', type: 'expense' }, // Pink
  { id: 'cat-educacao', name: 'Educação', icon: 'GraduationCap', color: '#6366F1', type: 'expense' }, // Indigo
  
  // Receitas
  { id: 'cat-salario', name: 'Salário', icon: 'Briefcase', color: '#10B981', type: 'income' }, // Emerald
  { id: 'cat-investimentos', name: 'Investimentos', icon: 'TrendingUp', color: '#06B6D4', type: 'income' }, // Cyan
  { id: 'cat-reembolso', name: 'Reembolsos', icon: 'Receipt', color: '#14B8A6', type: 'income' }, // Teal
  { id: 'cat-outros', name: 'Outros Rendimentos', icon: 'PiggyBank', color: '#84CC16', type: 'income' } // Lime
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  // Receitas de Maio 2026
  {
    id: 'tx-re-1',
    userId: 'user-regular',
    type: 'income',
    amount: 5500.00,
    description: 'Salário Mensal Principal',
    categoryId: 'cat-salario',
    date: '2026-05-01'
  },
  {
    id: 'tx-re-2',
    userId: 'user-regular',
    type: 'income',
    amount: 350.00,
    description: 'Rendimento de Fundos Imobiliários',
    categoryId: 'cat-investimentos',
    date: '2026-05-15'
  },
  {
    id: 'tx-re-3',
    userId: 'user-regular',
    type: 'income',
    amount: 150.00,
    description: 'Venda de desapegos',
    categoryId: 'cat-outros',
    date: '2026-05-22'
  },

  // Despesas de Maio 2026
  {
    id: 'tx-dp-1',
    userId: 'user-regular',
    type: 'expense',
    amount: 1350.00,
    description: 'Aluguel do Apartamento',
    categoryId: 'cat-moradia',
    date: '2026-05-05'
  },
  {
    id: 'tx-dp-2',
    userId: 'user-regular',
    type: 'expense',
    amount: 450.00,
    description: 'Compras de Supermercado',
    categoryId: 'cat-alimentacao',
    date: '2026-05-08'
  },
  {
    id: 'tx-dp-3',
    userId: 'user-regular',
    type: 'expense',
    amount: 120.00,
    description: 'Abastecimento Carro',
    categoryId: 'cat-combustivel',
    date: '2026-05-10'
  },
  {
    id: 'tx-dp-4',
    userId: 'user-regular',
    type: 'expense',
    amount: 85.00,
    description: 'Farmácia e Medicamentos',
    categoryId: 'cat-saude',
    date: '2026-05-12'
  },
  {
    id: 'tx-dp-5',
    userId: 'user-regular',
    type: 'expense',
    amount: 199.90,
    description: 'Jantar Restaurante Italiano',
    categoryId: 'cat-alimentacao',
    date: '2026-05-18'
  },
  {
    id: 'tx-dp-6',
    userId: 'user-regular',
    type: 'expense',
    amount: 350.00,
    description: 'Roupas novas e calçado',
    categoryId: 'cat-compras',
    date: '2026-05-20'
  },
  {
    id: 'tx-dp-7',
    userId: 'user-regular',
    type: 'expense',
    amount: 150.00,
    description: 'Curso Online de Finanças',
    categoryId: 'cat-educacao',
    date: '2026-05-25'
  },
  {
    id: 'tx-dp-8',
    userId: 'user-regular',
    type: 'expense',
    amount: 180.00,
    description: 'Ingresso Show e Cinema',
    categoryId: 'cat-lazer',
    date: '2026-05-28'
  },

  // Admin transactions to have some separate active data
  {
    id: 'tx-ad-re-1',
    userId: 'user-admin',
    type: 'income',
    amount: 7500.00,
    description: 'Salário Diretoria',
    categoryId: 'cat-salario',
    date: '2026-05-01'
  },
  {
    id: 'tx-ad-dp-1',
    userId: 'user-admin',
    type: 'expense',
    amount: 2100.00,
    description: 'Parcela Financiamento Casa',
    categoryId: 'cat-moradia',
    date: '2026-05-05'
  },
  {
    id: 'tx-ad-dp-2',
    userId: 'user-admin',
    type: 'expense',
    amount: 600.00,
    description: 'Supermercado Gourmet',
    categoryId: 'cat-alimentacao',
    date: '2026-05-12'
  },
  {
    id: 'tx-ad-dp-3',
    userId: 'user-admin',
    type: 'expense',
    amount: 250.00,
    description: 'Abastecimento de Combustível',
    categoryId: 'cat-combustivel',
    date: '2026-05-15'
  }
];
