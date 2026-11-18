import type {
  FixedExpense,
  FixedExpenseHistoryFilters,
  FixedExpensePayment,
} from "../types/fixedExpense";

/**
 * Categoria única usada ao registrar o pagamento de um gasto fixo. O
 * back-end reaproveita a categoria padrão "Gastos Fixos" ao criar a
 * movimentação do pagamento.
 */
export const FIXED_EXPENSE_CATEGORY = "Gastos Fixos";

/** Cor usada caso a categoria padrão precise ser criada pelo front-end. */
export const FIXED_EXPENSE_CATEGORY_COLOR = "#030862";

/** Quantidade de dias disponível no select de vencimento. */
export const DUE_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

/** Data de hoje no formato `YYYY-MM-DD`, sem deslocamento de fuso horário. */
export function getTodayISO(): string {
  const now = new Date();
  const offsetInMilliseconds = now.getTimezoneOffset() * 60 * 1000;

  return new Date(now.getTime() - offsetInMilliseconds)
    .toISOString()
    .slice(0, 10);
}

/** Chave do mês atual no formato `YYYY-MM`. */
export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Nome do mês atual em português, usado no status da listagem. */
export function getCurrentMonthLabel(date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}

/** Verifica se o gasto já teve um pagamento no mês informado. */
export function hasPaymentInMonth(
  expense: FixedExpense,
  monthKey = getMonthKey(),
): boolean {
  return expense.payments.some((payment) =>
    payment.paidAt.startsWith(monthKey),
  );
}

/** Verifica se o gasto já foi pago no mês corrente. */
export function isPaidThisMonth(expense: FixedExpense): boolean {
  return hasPaymentInMonth(expense, getMonthKey());
}

/** Texto amigável exibido na coluna de vencimento. */
export function formatDueDay(dueDay: number): string {
  return `Todo dia ${dueDay}`;
}

/** Ordena os gastos fixos pelo dia de vencimento. */
export function sortFixedExpenses(expenses: FixedExpense[]): FixedExpense[] {
  return [...expenses].sort(
    (first, second) =>
      first.dueDay - second.dueDay ||
      first.title.localeCompare(second.title, "pt-BR"),
  );
}

/** Ordena os pagamentos do mais recente para o mais antigo. */
export function sortPaymentsByDate(
  payments: FixedExpensePayment[],
): FixedExpensePayment[] {
  return [...payments].sort((first, second) =>
    second.paidAt.localeCompare(first.paidAt),
  );
}

/**
 * Aplica o filtro de período a uma lista de pagamentos em memória.
 *
 * O histórico da tela usa o filtro do servidor
 * (`GET /fixed-expenses/:id/payments?startDate=&endDate=`); esta função é
 * apenas um utilitário local.
 */
export function filterPaymentsByDate(
  payments: FixedExpensePayment[],
  filters: FixedExpenseHistoryFilters,
): FixedExpensePayment[] {
  return payments.filter((payment) => {
    if (filters.startDate && payment.paidAt < filters.startDate) {
      return false;
    }

    if (filters.endDate && payment.paidAt > filters.endDate) {
      return false;
    }

    return true;
  });
}

export { formatTransactionDate as formatFixedExpenseDate } from "./transactions";
