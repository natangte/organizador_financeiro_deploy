import type { LucideIcon } from "lucide-react";

export type AdminMetricTone = "brand" | "blue" | "emerald" | "amber";

type AdminMetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: AdminMetricTone;
  isLoading?: boolean;
};

/**
 * Card de indicador do relatório do sistema.
 *
 * TODO [BACKEND]: Os valores são abastecidos por GET /api/admin/metrics. A
 * contagem de usuários deve considerar a mesma base exibida em
 * GET /api/admin/users para evitar divergência entre as duas telas.
 */

const toneClasses: Record<AdminMetricTone, string> = {
  brand: "bg-indigo-50 text-[#4F26E9]",
  blue: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
};

function AdminMetricCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  isLoading = false,
}: AdminMetricCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>

      <p
        className={`mt-4 text-3xl font-bold tracking-tight ${
          isLoading ? "animate-pulse text-slate-300" : "text-[#0B0B45]"
        }`}
      >
        {isLoading ? "—" : new Intl.NumberFormat("pt-BR").format(value)}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        Total registrado no Organizaê
      </p>
    </article>
  );
}

export default AdminMetricCard;
