import { AlertTriangle, UserX } from "lucide-react";

import type { AdminUser } from "../../types/admin";
import ModalShell from "../modals/ModalShell";

type DeleteUserModalProps = {
  isOpen: boolean;
  user: AdminUser | null;
  isDeleting?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação de exclusão. A página controla `isDeleting`/`error` e chama
 * DELETE /api/admin/users/:id, que remove em cascata tudo que pertence ao
 * usuário (contas financeiras, movimentações, gastos fixos e categorias).
 */
function DeleteUserModal({
  isOpen,
  user,
  isDeleting = false,
  error = "",
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!isOpen || !user) {
    return null;
  }

  const initial = user.name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "?";

  return (
    <ModalShell
      isOpen
      size="sm"
      title="Excluir conta de usuário?"
      description="Esta ação é permanente e não poderá ser desfeita."
      icon={<UserX size={20} aria-hidden="true" />}
      onClose={isDeleting ? () => undefined : onClose}
    >
      <div className="mt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={19} aria-hidden="true" />
          </span>

          <p className="text-sm leading-relaxed text-rose-800">
            O usuário perderá o acesso ao Organizaê e todos os dados vinculados
            a esta conta (contas financeiras, movimentações e gastos fixos)
            serão removidos permanentemente.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-base font-bold text-[#4F26E9]">
            {initial}
          </span>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-slate-900"
              title={user.name}
            >
              {user.name}
            </p>
            <p
              className="mt-0.5 truncate text-sm text-slate-500"
              title={user.email}
            >
              {user.email}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-rose-400 disabled:active:scale-100"
          >
            {isDeleting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Excluindo...
              </>
            ) : (
              <>
                <UserX size={17} aria-hidden="true" />
                Excluir conta
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default DeleteUserModal;
