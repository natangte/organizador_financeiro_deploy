import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import type { AdminUser } from "../../types/admin";
import TransactionsEmptyState from "../transactions/TransactionsEmptyState";

type AdminUsersTableProps = {
  users: AdminUser[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onDelete: (user: AdminUser) => void;
  onPageChange: (page: number) => void;
};

/**
 * Tabela de usuários do painel administrativo.
 *
 * A paginação é controlada por `AdminUsers`, que envia `page`/`limit` para
 * GET /api/admin/users. Este componente apenas renderiza a página atual e
 * delega a confirmação de exclusão para a modal.
 *
 * TODO [BACKEND]: Manter o contrato de paginação (`items`, `total`, `page`,
 * `totalPages`) estável para que a tabela continue funcionando sem
 * normalizações adicionais em `lib/adminApi.ts`.
 */

/** Formata a data de cadastro aceitando ISO completo ou `YYYY-MM-DD`. */
function formatRegistrationDate(value: string): string {
  if (!value) {
    return "—";
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getUserInitial(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "?";
}

function DeleteUserButton({
  user,
  onDelete,
}: {
  user: AdminUser;
  onDelete: (user: AdminUser) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onDelete(user)}
      aria-label={`Excluir conta de ${user.name}`}
      title="Excluir conta de usuário"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:outline-none"
    >
      <Trash2 size={17} aria-hidden="true" />
    </button>
  );
}

function AdminUsersTable({
  users,
  totalUsers,
  currentPage,
  totalPages,
  isLoading = false,
  onDelete,
  onPageChange,
}: AdminUsersTableProps) {
  const userNoun = totalUsers === 1 ? "usuário cadastrado" : "usuários cadastrados";
  const badgeNoun = totalUsers === 1 ? "usuário" : "usuários";

  return (
    <section
      aria-labelledby="admin-users-table-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#4F26E9]">
            <Users size={18} aria-hidden="true" />
          </span>

          <div>
            <h2
              id="admin-users-table-heading"
              className="text-base font-bold text-slate-900"
            >
              Usuários cadastrados
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Contas que já possuem acesso ao Organizaê.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4F26E9]">
          {totalUsers} {badgeNoun}
        </span>
      </header>

      {isLoading ? (
        <div className="space-y-3 p-5" aria-label="Carregando usuários">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <TransactionsEmptyState
          compact
          icon={Users}
          title="Nenhum usuário cadastrado"
          description="As contas dos usuários aparecerão aqui assim que alguém se cadastrar no Organizaê."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <caption className="sr-only">
                Lista de usuários cadastrados no Organizaê
              </caption>

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th
                    scope="col"
                    className="w-[40%] px-5 py-3 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
                  >
                    Nome
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
                  >
                    Data de cadastro
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
                  >
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-[#4F26E9]">
                          {getUserInitial(user.name)}
                        </span>

                        <span
                          className="max-w-[260px] truncate text-sm font-semibold text-slate-900"
                          title={user.name}
                        >
                          {user.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className="block max-w-[280px] truncate text-sm text-slate-600"
                        title={user.email}
                      >
                        {user.email || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-600">
                      {formatRegistrationDate(user.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <DeleteUserButton user={user} onDelete={onDelete} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {users.map((user) => (
              <li key={user.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-[#4F26E9]">
                      {getUserInitial(user.name)}
                    </span>

                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold text-slate-900"
                        title={user.name}
                      >
                        {user.name}
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs text-slate-500"
                        title={user.email}
                      >
                        {user.email || "—"}
                      </p>
                    </div>
                  </div>

                  <DeleteUserButton user={user} onDelete={onDelete} />
                </div>

                <p className="mt-2 pl-12 text-xs text-slate-500">
                  Cadastrado em {formatRegistrationDate(user.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <UserRound size={14} aria-hidden="true" className="text-slate-400" />
          {totalUsers} {userNoun}
        </p>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs font-medium text-slate-500">
            Página {currentPage} de {totalPages}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#4F26E9] hover:text-[#4F26E9] disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:border-slate-100 disabled:hover:text-slate-300"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Próxima página"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#4F26E9] hover:text-[#4F26E9] disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:border-slate-100 disabled:hover:text-slate-300"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default AdminUsersTable;
