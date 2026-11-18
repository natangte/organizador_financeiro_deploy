import { useEffect, useState } from "react";

import type { LucideIcon } from "lucide-react";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarClock,
  Users,
  Wallet,
} from "lucide-react";

import AdminMetricCard from "../../components/admin/AdminMetricCard";
import type { AdminMetricTone } from "../../components/admin/AdminMetricCard";
import { fetchAdminMetrics } from "../../lib/adminApi";
import type { AdminMetrics } from "../../types/admin";

type AdminMetricDefinition = {
  key: keyof AdminMetrics;
  label: string;
  icon: LucideIcon;
  tone: AdminMetricTone;
};

const METRIC_CARDS: AdminMetricDefinition[] = [
  {
    key: "users",
    label: "Usuários cadastrados",
    icon: Users,
    tone: "brand",
  },
  {
    key: "accounts",
    label: "Contas financeiras cadastradas",
    icon: Wallet,
    tone: "blue",
  },
  {
    key: "transactions",
    label: "Movimentações realizadas",
    icon: ArrowLeftRight,
    tone: "emerald",
  },
  {
    key: "fixedExpenses",
    label: "Gastos fixos cadastrados",
    icon: CalendarClock,
    tone: "amber",
  },
];

/** Indicadores inicialmente zerados, aguardando os dados do banco. */
const INITIAL_METRICS: AdminMetrics = {
  users: 0,
  accounts: 0,
  transactions: 0,
  fixedExpenses: 0,
};

function AdminSystemReport() {
  const [metrics, setMetrics] = useState<AdminMetrics>({ ...INITIAL_METRICS });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await fetchAdminMetrics();

        if (isMounted) {
          setMetrics(result);
        }
      } catch (error) {
        console.error("Erro ao carregar indicadores do painel admin:", error);

        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os indicadores do sistema.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-[#0B0B45]">
          Relatório do sistema
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Acompanhe os números de uso do Organizaê.
        </p>
      </header>

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

      <section
        aria-label="Indicadores de uso do sistema"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {METRIC_CARDS.map((metric) => (
          <AdminMetricCard
            key={metric.key}
            label={metric.label}
            value={metrics[metric.key]}
            icon={metric.icon}
            tone={metric.tone}
            isLoading={isLoading}
          />
        ))}
      </section>
    </div>
  );
}

export default AdminSystemReport;
