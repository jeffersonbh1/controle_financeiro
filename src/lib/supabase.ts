import { createClient } from '@supabase/supabase-js';
import { User, Category, Transaction, FixedExpense } from '../types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

// 1. Users Mapping
export function mapFromDBUser(row: any): User {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'user',
    password: row.password || '',
  };
}

export function mapToDBUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    password: user.password || '',
  };
}

// 3. Categories Mapping
export function mapFromDBCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name || '',
    icon: row.icon || 'Folder',
    color: row.color || '#3B82F6',
    type: row.type || 'expense',
  };
}

export function mapToDBCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    type: category.type,
  };
}

// 4. Transactions Mapping
export function mapFromDBTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id || row.userId || '',
    type: row.type || 'expense',
    amount: Number(row.amount) || 0,
    description: row.description || '',
    categoryId: row.category_id || row.categoryId || undefined,
    date: row.date || new Date().toISOString().substring(0, 10),
  };
}

export function mapToDBTransaction(tx: Transaction) {
  return {
    id: tx.id,
    user_id: tx.userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    category_id: tx.categoryId || null,
    date: tx.date,
  };
}

// 5. Fixed Expenses Mapping
export function mapFromDBFixedExpense(row: any): FixedExpense {
  let paidMonths: string[] = [];
  if (Array.isArray(row.paid_months)) {
    paidMonths = row.paid_months;
  } else if (Array.isArray(row.paidMonths)) {
    paidMonths = row.paidMonths;
  } else if (typeof row.paid_months === 'string') {
    try {
      paidMonths = JSON.parse(row.paid_months);
    } catch {
      paidMonths = [];
    }
  }
  return {
    id: row.id,
    userId: row.user_id || row.userId || '',
    description: row.description || '',
    amount: Number(row.amount) || 0,
    categoryId: row.category_id || row.categoryId || undefined,
    dueDay: Number(row.due_day) || Number(row.dueDay) || 5,
    paidMonths,
  };
}

export function mapToDBFixedExpense(fe: FixedExpense) {
  return {
    id: fe.id,
    user_id: fe.userId,
    description: fe.description,
    amount: fe.amount,
    category_id: fe.categoryId || null,
    due_day: fe.dueDay,
    paid_months: fe.paidMonths,
  };
}

// Database Operations
export async function saveUserDB(user: User) {
  if (!supabase) return;
  const { error } = await supabase.from('users').upsert(mapToDBUser(user));
  if (error) console.error('Error saving user to DB:', error);
}

export async function deleteUserDB(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) console.error('Error deleting user from DB:', error);
}

export async function saveCategoryDB(category: Category) {
  if (!supabase) return;
  const { error } = await supabase.from('categories').upsert(mapToDBCategory(category));
  if (error) console.error('Error saving category to DB:', error);
}

export async function deleteCategoryDB(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) console.error('Error deleting category from DB:', error);
}

export async function saveTransactionDB(tx: Transaction) {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').upsert(mapToDBTransaction(tx));
  if (error) console.error('Error saving transaction to DB:', error);
}

export async function deleteTransactionDB(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Error deleting transaction from DB:', error);
}

export async function saveFixedExpenseDB(fe: FixedExpense) {
  if (!supabase) return;
  const { error } = await supabase.from('fixed_expenses').upsert(mapToDBFixedExpense(fe));
  if (error) console.error('Error saving fixed expense to DB:', error);
}

export async function deleteFixedExpenseDB(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) console.error('Error deleting fixed expense from DB:', error);
}

// Full Synchronized Load
export async function loadFullDBData() {
  if (!supabase) return null;
  try {
    const [
      { data: dUsers, error: errUsers },
      { data: dCategories, error: errCategories },
      { data: dTransactions, error: errTransactions },
      { data: dFixedExpenses, error: errFixedExpenses }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('fixed_expenses').select('*')
    ]);

    if (errUsers || errCategories || errTransactions || errFixedExpenses) {
      console.warn('Some tables could not be loaded from Supabase. Falling back to local state.', {
        errUsers, errCategories, errTransactions, errFixedExpenses
      });
      return null;
    }

    const parsedUsers = (dUsers || []).map(mapFromDBUser);

    return {
      users: parsedUsers,
      categories: (dCategories || []).map(mapFromDBCategory),
      transactions: (dTransactions || []).map(mapFromDBTransaction),
      familyGroups: [],
      fixedExpenses: (dFixedExpenses || []).map(mapFromDBFixedExpense)
    };
  } catch (err) {
    console.error('Failed to load data from Supabase backend. Working with local cache state.', err);
    return null;
  }
}
