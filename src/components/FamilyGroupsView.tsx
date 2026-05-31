import React, { useState, useMemo } from 'react';
import { User, FamilyGroup } from '../types';
import { Users, Plus, Trash2, UserPlus, UserMinus, ShieldAlert, Check, HelpCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FamilyGroupsViewProps {
  currentUser: User;
  users: User[];
  familyGroups: FamilyGroup[];
  onAddFamilyGroup: (group: FamilyGroup) => void;
  onDeleteFamilyGroup: (id: string) => void;
  onAddMemberToGroup: (groupId: string, userId: string) => void;
  onRemoveMemberFromGroup: (groupId: string, userId: string) => void;
}

export const FamilyGroupsView: React.FC<FamilyGroupsViewProps> = ({
  currentUser,
  users,
  familyGroups,
  onAddFamilyGroup,
  onDeleteFamilyGroup,
  onAddMemberToGroup,
  onRemoveMemberFromGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedInitialUsers, setSelectedInitialUsers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find users who are not in any family group
  const availableUsers = useMemo(() => {
    return users.filter(u => {
      // Check if user is in any family group memberIds list
      return !familyGroups.some(g => g.memberIds.includes(u.id));
    });
  }, [users, familyGroups]);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupName.trim()) {
      setError('Por favor, defina um nome para o grupo familiar.');
      return;
    }

    // Verify duplicate group name
    const nameExists = familyGroups.some(
      g => g.name.toLowerCase() === groupName.trim().toLowerCase()
    );
    if (nameExists) {
      setError('Já existe um grupo familiar cadastrado com este nome.');
      return;
    }

    const newGroupId = `group-${Date.now()}`;
    const initialMembers = [...selectedInitialUsers];
    if (!initialMembers.includes(currentUser.id)) {
      initialMembers.push(currentUser.id);
    }
    const newGroup: FamilyGroup = {
      id: newGroupId,
      name: groupName.trim(),
      memberIds: initialMembers,
    };

    onAddFamilyGroup(newGroup);
    setSuccess(`Grupo familiar "${newGroup.name}" cadastrado com sucesso!`);
    setGroupName('');
    setSelectedInitialUsers([]);

    setTimeout(() => setSuccess(''), 4000);
  };

  const toggleInitialUserSelection = (userId: string) => {
    setSelectedInitialUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Get active group of current user
  const currentUserGroup = useMemo(() => {
    return familyGroups.find(g => g.memberIds.includes(currentUser.id));
  }, [familyGroups, currentUser]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 font-sans selection:bg-blue-100">
      
      {/* Cadastro do Grupo Familiar Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm self-start">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Novo Grupo Familiar</h3>
            <p className="text-xs text-gray-400">Agrupe usuários para compartilhar receitas e despesas</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-700 text-xs font-semibold">
            <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="space-y-4">
          {/* Nome do grupo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Nome do Grupo Familiar
            </label>
            <input
              id="family-group-name-input"
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Ex: Família Silva, Mansão Wayne..."
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-gray-900 text-sm transition-all focus:ring-2 focus:ring-blue-500/10 outline-none"
              required
            />
          </div>

          {/* Selecionar membros iniciais */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">
              Selecionar Membros Iniciais
            </label>
            <p className="text-[10px] text-gray-400 mb-2 pl-1">
              Apenas os usuários sem grupo familiar associado são mostrados abaixo:
            </p>

            {availableUsers.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-center text-xs text-gray-400 font-medium">
                Nenhum usuário disponível para novos grupos.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar border border-gray-100 p-2 rounded-xl bg-gray-50/30">
                {availableUsers.map(u => {
                  const isSelected = selectedInitialUsers.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleInitialUserSelection(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-5 w-5 bg-blue-100 text-blue-800 rounded-md flex items-center justify-center font-bold text-[10px] uppercase">
                          {u.name.substring(0, 2)}
                        </div>
                        <span className="truncate max-w-[170px]">{u.name} ({u.role === 'admin' ? 'Admin' : 'User'})</span>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            id="family-group-add-submit-btn"
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Cadastrar Grupo Familiar
          </button>
        </form>

        {/* Informative advice */}
        <div className="mt-5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-2.5">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-blue-950 font-normal leading-relaxed">
            <span className="font-bold">Como funciona?</span> Ao agrupar usuários no mesmo grupo familiar, todas as receitas, despesas e relatórios serão consolidados e dinamicamente compartilhados em tempo real entre todos os seus integrantes.
          </div>
        </div>
      </div>

      {/* Lista de Grupos Familiares */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">Grupos Familiares Ativos</h3>
          <p className="text-xs text-gray-400">
            Gerencie integrantes e vincule usuários para unificar a gestão financeira
          </p>

          {currentUserGroup && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" />
                Seu grupo atual: <strong className="text-emerald-950">{currentUserGroup.name}</strong>
              </span>
              <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800 font-bold">
                CONECTADO
              </span>
            </div>
          )}
        </div>

        {familyGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <h4 className="text-sm font-bold text-gray-700">Nenhum Grupo Familiar Ativo</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
              Crie seu primeiro grupo familiar no formulário lateral para integrar as despesas de seus familiares.
            </p>
          </div>
        ) : (
          <div className="space-y-5 max-h-[550px] overflow-y-auto no-scrollbar">
            <AnimatePresence>
              {familyGroups.map(group => {
                const isGroupOfCurrentUser = group.memberIds.includes(currentUser.id);
                
                // Fetch group users
                const groupMembers = users.filter(u => group.memberIds.includes(u.id));
                
                // Users eligible to be added to THIS group
                const availableForThisGroup = users.filter(u => {
                  return !familyGroups.some(g => g.memberIds.includes(u.id));
                });

                return (
                  <motion.div
                    id={`family-group-card-${group.id}`}
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-5 rounded-2xl border transition-all ${
                      isGroupOfCurrentUser 
                        ? 'bg-blue-50/10 border-blue-100 shadow-sm' 
                        : 'bg-gray-50/30 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 leading-tight">
                            {group.name}
                          </h4>
                          {isGroupOfCurrentUser && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-extrabold text-[9px]">
                              MEU GRUPO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ID: {group.id} • {groupMembers.length} participante(s)
                        </p>
                      </div>

                      <button
                        id={`delete-family-group-btn-${group.id}`}
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir o grupo "${group.name}"? Todos os membros serão desvinculados.`)) {
                            onDeleteFamilyGroup(group.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Excluir Grupo Familiar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Members List */}
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Membros do Grupo
                      </p>
                      {groupMembers.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Sem nenhum membro vinculado neste grupo.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupMembers.map(member => {
                            const isMe = member.id === currentUser.id;
                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100 shadow-3xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6.5 w-6.5 bg-blue-100 text-blue-800 font-bold rounded-lg flex items-center justify-center text-[10px] uppercase">
                                    {member.name.substring(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                      {member.name} {isMe && <span className="text-[9px] text-blue-500 font-bold">(Você)</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate font-mono">
                                      {member.email}
                                    </p>
                                  </div>
                                </div>
                                
                                <button
                                  id={`remove-member-${group.id}-${member.id}`}
                                  onClick={() => onRemoveMemberFromGroup(group.id, member.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                  title="Retirar do Grupo Familiar"
                                >
                                  <UserMinus size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Add Member Dropdown / Mini layout */}
                    <div className="bg-white/50 p-2.5 rounded-xl border border-gray-100 shadow-4xs">
                      <div className="flex items-center gap-2">
                        <UserPlus size={13} className="text-blue-600 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          Incluir novo usuário no grupo
                        </span>
                      </div>
                      {availableForThisGroup.length === 0 ? (
                        <p className="text-[10px] text-gray-400 mt-1 italic pl-5">
                          Nenhum usuário sem grupo disponível no momento.
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-2">
                          <select
                            id={`add-member-select-${group.id}`}
                            defaultValue=""
                            onChange={e => {
                              const selectedVal = e.target.value;
                              if (selectedVal) {
                                onAddMemberToGroup(group.id, selectedVal);
                                e.target.value = ""; // Reset selection after processing
                              }
                            }}
                            className="flex-1 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 text-gray-800 text-xs font-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                          >
                            <option value="">Selecione um usuário para incluir...</option>
                            {availableForThisGroup.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
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
