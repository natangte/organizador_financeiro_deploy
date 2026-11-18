/**
 * Tipos compartilhados do painel administrativo.
 *
 * Os nomes seguem o padrão em inglês usado pelo restante do front-end
 * (`id`, `name`, `email`, `createdAt`). A camada `lib/adminApi.ts` normaliza
 * eventuais variações devolvidas pelo back-end (ex.: `nome`, `criadoEm`).
 */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  /** Data de cadastro no formato ISO 8601. */
  createdAt: string;
};

export type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminMetrics = {
  users: number;
  accounts: number;
  transactions: number;
  fixedExpenses: number;
};
