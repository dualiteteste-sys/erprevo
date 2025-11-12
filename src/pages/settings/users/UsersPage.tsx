import React, { useState, useEffect } from 'react';
import { UsersFilters as Filters, EmpresaUser, UserRole } from '@/features/users/types';
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery';
import { UsersTable } from '@/features/users/UsersTable';
import { EditUserRoleDrawer } from '@/features/users/EditUserRoleDrawer';
import Input from '@/components/ui/forms/Input';
import MultiSelect from '@/components/ui/MultiSelect';
import { Loader2, Users, UserPlus } from 'lucide-react';
import { useCan } from '@/hooks/useCan';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/contexts/ToastProvider';
import { deletePendingInvitation } from '@/services/users';
import { InviteUserDialog } from '@/features/users/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const roleOptions: { value: UserRole, label: string }[] = [
  { value: 'OWNER', label: 'Proprietário' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'OPS', label: 'Operações' },
  { value: 'READONLY', label: 'Somente Leitura' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'INACTIVE', label: 'Inativo' },
];

export default function UsersPage() {
  const { data, isLoading, isError, errorMsg, fetchFirstPage, filters, setFilters } = useUsersQuery();
  const [rows, setRows] = useState<EmpresaUser[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmpresaUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EmpresaUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const canManage = useCan('usuarios', 'manage');
  const { addToast } = useToast();

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage, filters]);

  useEffect(() => {
    if (data) {
      setRows(data);
    }
  }, [data]);

  const handleFilterChange = (patch: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const handleEditRole = (user: EmpresaUser) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleUserUpdate = () => {
    fetchFirstPage();
  };

  const handleOpenDeleteModal = (user: EmpresaUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deletePendingInvitation(userToDelete.user_id);
      addToast('Convite excluído com sucesso!', 'success');
      setRows(prev => prev.filter(r => r.user_id !== userToDelete.user_id));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Erro ao excluir convite.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOptimisticInsert = (newUser: EmpresaUser) => {
    setRows(prev => [newUser, ...prev]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        {canManage && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Usuário
          </Button>
        )}
      </div>

      <div className="mb-4 p-4 border bg-gray-50/50 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar por nome ou email"
            placeholder="Digite para buscar..."
            value={filters.q || ''}
            onChange={(e) => handleFilterChange({ q: e.target.value })}
          />
          <MultiSelect
            label="Papel"
            options={roleOptions}
            selected={filters.role || []}
            onChange={(roles) => handleFilterChange({ role: roles as UserRole[] })}
            placeholder="Todos os papéis"
          />
          <MultiSelect
            label="Status"
            options={statusOptions}
            selected={filters.status || []}
            onChange={(status) => handleFilterChange({ status: status as any[] })}
            placeholder="Todos os status"
          />
        </div>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : isError ? (
        <div className="text-center text-red-500 p-8">{errorMsg}</div>
      ) : rows.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">Nenhum usuário encontrado</h3>
          <p className="mt-1 text-sm">Tente ajustar os filtros ou convide um novo usuário.</p>
        </div>
      ) : (
        <UsersTable
          rows={rows}
          onEditRole={handleEditRole}
          onDeleteInvite={handleOpenDeleteModal}
        />
      )}
      
      <EditUserRoleDrawer
        open={isEditOpen}
        user={selectedUser}
        onClose={() => setIsEditOpen(false)}
        onSaved={handleUserUpdate}
        onUserDeactivated={handleUserUpdate}
        onUserReactivated={handleUserUpdate}
        onOwnershipTransferred={handleUserUpdate}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Convite"
        description="Tem certeza que deseja excluir este convite? Esta ação não pode ser desfeita."
        confirmText="Confirmar Exclusão"
        isLoading={isDeleting}
        variant="danger"
      />
      
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Convidar novo usuário</DialogTitle>
                <DialogDescription>
                    O usuário receberá um e-mail com instruções para acessar a empresa.
                </DialogDescription>
            </DialogHeader>
            <InviteUserDialog 
                onClose={() => setIsInviteOpen(false)} 
                onOptimisticInsert={handleOptimisticInsert}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
