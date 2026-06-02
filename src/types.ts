export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex color or Tailwind color name
  type: 'expense' | 'income';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  categoryId?: string; // Links to Category.id for expenses
  date: string; // YYYY-MM-DD
}

export interface FixedExpense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId?: string;
  dueDay: number; // day of the month (1-31)
  paidMonths: string[]; // array of YYYY-MM when it was paid/launched
}

