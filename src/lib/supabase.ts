import { createClient } from '@supabase/supabase-js';
import { User, Category, Transaction, FamilyGroup, FixedExpense } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to determine if Supabase is configured and reachable
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// SQL commands to easily help the user initialize their database tables
export const SUPABASE_SCHEMA_SQL = `-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Transações / Lançamentos
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  "categoryId" TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Grupos Familiares
CREATE TABLE IF NOT EXISTS public.family_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "memberIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Despesas Fixas
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "categoryId" TEXT,
  "dueDay" INTEGER NOT NULL CHECK ("dueDay" BETWEEN 1 AND 31),
  "paidMonths" JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar leitura/escrita aberta (Desligar RLS ou criar políticas irrestritas para teste)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses DISABLE ROW LEVEL SECURITY;
`;

export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Try carrying out a simple select on categories table (if exists) or just check metadata
    const { data, error } = await supabase.from('categories').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('relation "public.categories" does not exist')) {
        // Tables are not created yet, but connection is successful!
        return true;
      }
      console.warn("Supabase check warning: ", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase connect failed: ", err);
    return false;
  }
}

// FETCH ALL SECTOR DATA
export async function fetchSupabaseData() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [usersRes, categoriesRes, transactionsRes, groupsRes, fixedRes] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('transactions').select('*'),
    supabase.from('family_groups').select('*'),
    supabase.from('fixed_expenses').select('*')
  ]);

  // If tables do not exist yet, we will capture 'relation does not exist' and know they must be initialized
  const errors = [
    usersRes.error && usersRes.error.message,
    categoriesRes.error && categoriesRes.error.message,
    transactionsRes.error && transactionsRes.error.message,
    groupsRes.error && groupsRes.error.message,
    fixedRes.error && fixedRes.error.message
  ].filter(Boolean);

  if (errors.some(e => e?.includes('relation "public.'))) {
    throw new Error('TABLES_NOT_FOUND');
  }

  return {
    users: usersRes.data as User[] || [],
    categories: categoriesRes.data as Category[] || [],
    transactions: transactionsRes.data as Transaction[] || [],
    // Parse JSON values for memberIds and paidMonths back to arrays
    familyGroups: (groupsRes.data || []).map(g => ({
      ...g,
      memberIds: Array.isArray(g.memberIds) ? g.memberIds : JSON.parse(g.memberIds || '[]')
    })) as FamilyGroup[],
    fixedExpenses: (fixedRes.data || []).map(f => ({
      ...f,
      paidMonths: Array.isArray(f.paidMonths) ? f.paidMonths : JSON.parse(f.paidMonths || '[]')
    })) as FixedExpense[]
  };
}

// UPSERTS - we insert or update values in tables
export async function saveUser(user: User) {
  if (!supabase) return;
  const { error } = await supabase.from('users').upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
  if (error) console.error("Error saving user to Supabase:", error);
}

export async function deleteUser(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) console.error("Error deleting user from Supabase:", error);
}

export async function saveCategory(cat: Category) {
  if (!supabase) return;
  const { error } = await supabase.from('categories').upsert({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    type: cat.type
  });
  if (error) console.error("Error saving category to Supabase:", error);
}

export async function deleteCategory(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) console.error("Error deleting category from Supabase:", error);
}

export async function saveTransaction(tx: Transaction) {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').upsert({
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    categoryId: tx.categoryId,
    date: tx.date
  });
  if (error) console.error("Error saving transaction to Supabase:", error);
}

export async function deleteTransaction(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error("Error deleting transaction from Supabase:", error);
}

export async function saveFamilyGroup(g: FamilyGroup) {
  if (!supabase) return;
  const { error } = await supabase.from('family_groups').upsert({
    id: g.id,
    name: g.name,
    memberIds: JSON.stringify(g.memberIds)
  });
  if (error) console.error("Error saving family group to Supabase:", error);
}

export async function deleteFamilyGroup(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('family_groups').delete().eq('id', id);
  if (error) console.error("Error deleting family group from Supabase:", error);
}

export async function saveFixedExpense(fe: FixedExpense) {
  if (!supabase) return;
  const { error } = await supabase.from('fixed_expenses').upsert({
    id: fe.id,
    userId: fe.userId,
    description: fe.description,
    amount: fe.amount,
    categoryId: fe.categoryId,
    dueDay: fe.dueDay,
    paidMonths: JSON.stringify(fe.paidMonths)
  });
  if (error) console.error("Error saving fixed expense to Supabase:", error);
}

export async function deleteFixedExpense(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) console.error("Error deleting fixed expense from Supabase:", error);
}

// BATCH REINITIALIZATION / FACTORY RESET FOR SUPABASE
export async function batchResetSupabase(
  defaultUsers: User[],
  defaultCategories: Category[],
  defaultTransactions: Transaction[],
  defaultFixedExpenses: FixedExpense[]
) {
  if (!supabase) return;

  // Clear existing items in parallel
  await Promise.all([
    supabase.from('transactions').delete().neq('id', 'dummy_value_to_match_all'),
    supabase.from('fixed_expenses').delete().neq('id', 'dummy_value'),
    supabase.from('family_groups').delete().neq('id', 'dummy_value'),
    supabase.from('categories').delete().neq('id', 'dummy_value'),
    supabase.from('users').delete().neq('id', 'dummy_value'),
  ]);

  // Insert base records
  // 1. Users
  for (const u of defaultUsers) {
    await saveUser(u);
  }
  // 2. Categories
  for (const c of defaultCategories) {
    await saveCategory(c);
  }
  // 3. Transactions
  for (const t of defaultTransactions) {
    await saveTransaction(t);
  }
  // 4. Fixed Expenses
  for (const f of defaultFixedExpenses) {
    await saveFixedExpense(f);
  }
}
