import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

import DeleteUserModal from "../../components/admin/DeleteUserModal";
import AdminUsersTable from "../../components/admin/AdminUsersTable";
import { deleteAdminUser, fetchAdminUsers } from "../../lib/adminApi";
import type { AdminUser } from "../../types/admin";

const PAGE_SIZE = 6;

function AdminUsers() {
  const [remoteUsers, setRemoteUsers] = useState<AdminUser[]>([]);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState("");

  const totalUsers = remoteTotal;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, totalPages);
  const users = remoteUsers;

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await fetchAdminUsers({
          page: visiblePage,
          limit: PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setRemoteUsers(result.items);
        setRemoteTotal(result.total);

        if (result.page > result.totalPages) {
          setCurrentPage(result.totalPages);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários do painel admin:", error);

        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os usuários cadastrados.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, visiblePage]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 4500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleOpenDelete = useCallback((user: AdminUser) => {
    setDeleteError("");
    setDeletingUser(user);
  }, []);

  const handleCloseDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setDeletingUser(null);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser || isDeleting) {
      return;
    }

    const userToDelete = deletingUser;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAdminUser(userToDelete.id);
      setReloadKey((currentKey) => currentKey + 1);

      setFeedback(`Conta de ${userToDelete.name} excluída com sucesso.`);
      setDeletingUser(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta do usuário.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deletingUser, isDeleting]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
    },
    [totalPages],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-[#0B0B45]">
          Usuários
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Gerencie as contas dos usuários cadastrados no Organizaê.
        </p>
      </header>

      {feedback && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5"
        >
          <CheckCircle2
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="flex-1 text-sm font-medium text-emerald-800">
            {feedback}
          </p>

          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Fechar mensagem de sucesso"
            className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {!isLoading && loadError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-rose-600"
            />

            <div>
              <p className="text-sm font-semibold text-rose-800">{loadError}</p>
              <p className="mt-0.5 text-xs text-rose-600">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <AdminUsersTable
        users={users}
        totalUsers={totalUsers}
        currentPage={visiblePage}
        totalPages={totalPages}
        isLoading={isLoading}
        onDelete={handleOpenDelete}
        onPageChange={handlePageChange}
      />

      <DeleteUserModal
        isOpen={Boolean(deletingUser)}
        user={deletingUser}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AdminUsers;
