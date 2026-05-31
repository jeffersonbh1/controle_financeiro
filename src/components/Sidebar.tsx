import React from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MinusCircle, 
  Tags, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Wallet,
  Home,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'fixed-expenses', label: 'Despesas Fixas', icon: Calendar },
    { id: 'expenses', label: 'Lançar Despesa', icon: MinusCircle, color: 'text-rose-500' },
    { id: 'incomes', label: 'Lançar Receita', icon: PlusCircle, color: 'text-emerald-500' },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'family-group', label: 'Grupo Familiar', icon: Home },
    ...(isAdmin ? [{ id: 'users', label: 'Usuários do Sistema', icon: Users }] : []),
  ];

  return (
    <motion.aside
      id="sidebar-navigation"
      animate={{ width: collapsed ? 76 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-slate-900 text-slate-100 flex flex-col h-screen h-max-screen sticky top-0 shrink-0 select-none z-30 shadow-2xl border-r border-slate-800"
    >
      {/* Sidebar Header */}
      <div className="p-4.5 flex items-center justify-between border-b border-slate-800/60 overflow-hidden min-h-[73px]">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5 font-bold text-base text-slate-100 tracking-tight whitespace-nowrap"
          >
            <div className="flex items-center justify-center w-8.5 h-8.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 shrink-0">
              <DollarSign className="h-4.5 w-4.5 font-black" />
            </div>
            <span>Nosso Din Din</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-8.5 h-8.5 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 shrink-0 mx-auto">
            <DollarSign className="h-4.5 w-4.5 font-black" />
          </div>
        )}
        
        {/* Toggle Button */}
        {!collapsed && (
          <button
            id="sidebar-toggle-close"
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-200 transition-colors hidden md:block cursor-pointer"
            title="Recolher Menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Options */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              id={`sidebar-item-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${item.color || (isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}`} />
              
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Tooltip for collapsed view */}
              {collapsed && (
                <div className="absolute left-16 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Switch Button for tiny view responsive */}
      <div className="p-3 border-t border-slate-800 md:hidden flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 bg-slate-800 text-slate-200 rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Database sync connection status */}
      <div className="px-4 py-2 bg-slate-950/20 text-[10px] flex items-center gap-2 text-slate-400 select-none border-t border-slate-800/40 min-h-[28px]">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        {!collapsed && (
          <span className="truncate font-mono">
            {isSupabaseConfigured() ? 'Sincronizado Supabase' : 'Offline (Banco Local)'}
          </span>
        )}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold font-mono text-sm uppercase shrink-0 border border-blue-500/20">
            {(currentUser?.name || 'US').substring(0, 2)}
          </div>
          
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
                {currentUser?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize font-mono mt-0.5">
                {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
              </p>
            </motion.div>
          )}

          {!collapsed && (
            <button
              id="sidebar-logout"
              onClick={onLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              title="Sair do Sistema"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        
        {collapsed && (
          <button
            id="sidebar-logout-collapsed"
            onClick={onLogout}
            className="w-full mt-4 p-2 bg-slate-800/40 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl text-slate-400 transition-all flex justify-center cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </motion.aside>
  );
};
