import React, { useState } from 'react';
import { Category } from '../types';
import { CURATED_ICONS, LucideIcon } from './LucideIcon';
import { Plus, Trash2, Check, FolderHeart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoriesViewProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#64748B', // Slate
  '#1E293B'  // Dark Charcoal
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('Utensils');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage('');

    if (!name.trim()) {
      setInfoMessage('Por favor, informe um nome para a categoria.');
      return;
    }

    // Verify existing names for same type
    const exists = categories.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.type === type
    );

    if (exists) {
      setInfoMessage('Já existe uma categoria cadastrada com este nome.');
      return;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type
    };

    onAddCategory(newCategory);
    setName('');
    // Successful notification
    setInfoMessage(`Categoria "${newCategory.name}" cadastrada com sucesso!`);
    setTimeout(() => setInfoMessage(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 font-sans selection:bg-blue-100">
      
      {/* Cadastro de Categoria Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Plus size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Nova Categoria</h3>
            <p className="text-xs text-gray-400">Personalize com ícones e cores exclusivas</p>
          </div>
        </div>

        {infoMessage && (
          <div className={`p-3 text-xs font-semibold rounded-xl mb-4.5 flex items-start gap-2 ${infoMessage.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
            <Info size={16} className="shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Nome da Categoria
            </label>
            <input
              id="category-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Combustível, Restaurante..."
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
            />
          </div>

          {/* Tipo (Despesas ou Renda/Receitas) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 pl-1">
              Finalidade / Tipo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (type !== 'expense') {
                    setSelectedIcon('Utensils');
                    setSelectedColor('#EF4444');
                  }
                }}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${type === 'expense' ? 'bg-rose-500 animate-pulse' : 'bg-gray-400'}`} />
                Despesas
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  if (type !== 'income') {
                    setSelectedIcon('Briefcase');
                    setSelectedColor('#10B981');
                  }
                }}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-extrabold shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${type === 'income' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                Receita / Renda
              </button>
            </div>
          </div>

          {/* Grid de Cores */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
              Cor Identificadora
            </label>
            <div className="grid grid-cols-6 gap-2.5">
              {PRESET_COLORS.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border border-white hover:scale-110 active:scale-95 transition-all relative flex items-center justify-center cursor-pointer shadow-inner shadow-black/5"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check size={14} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Ícones (Pickers como no mockup do celular) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
              Ícone da Despesa/Receita
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-2xl max-h-48 overflow-y-auto no-scrollbar border border-gray-200/50">
              {CURATED_ICONS.map(iconName => (
                <button
                  type="button"
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
                    selectedIcon === iconName
                      ? 'bg-slate-900 border border-slate-900 text-white shadow-md'
                      : 'bg-white hover:bg-gray-100/50 text-gray-500 border border-gray-200/50'
                  }`}
                  title={iconName}
                >
                  <LucideIcon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          <button
            id="category-add-submit-btn"
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Cadastrar Categoria
          </button>
        </form>
      </div>

      {/* Categorias Cadastradas List */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-1">Categorias Existentes</h3>
        <p className="text-xs text-gray-400 mb-5">Visualize ou limpe as categorias do seu plano de contas</p>

        {categories.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FolderHeart size={40} className="mx-auto text-gray-200 mb-2.5" />
            <p className="text-sm">Nenhuma categoria cadastrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[550px] overflow-y-auto no-scrollbar pr-1">
            {/* Seccionado por tipo para ficar super organizado */}
            {(['expense', 'income'] as const).map(catType => {
              const list = categories.filter(c => c.type === catType);
              if (list.length === 0) return null;

              return (
                <div key={catType} className="space-y-2.5">
                  <div className="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 pb-1 flex items-center justify-between">
                    <span>{catType === 'expense' ? 'Categorias de Despesa' : 'Categorias de Receita'}</span>
                    <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full text-[10px]">{list.length}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AnimatePresence>
                      {list.map(cat => (
                        <motion.div
                          id={`category-card-${cat.id}`}
                          key={cat.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50 rounded-xl group transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner"
                              style={{ backgroundColor: cat.color }}
                            >
                              <LucideIcon name={cat.icon} size={18} />
                            </div>
                            <span className="text-sm font-semibold text-gray-800 truncate">
                              {cat.name}
                            </span>
                          </div>

                          <button
                            id={`category-delete-btn-${cat.id}`}
                            type="button"
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Remover Categoria"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
