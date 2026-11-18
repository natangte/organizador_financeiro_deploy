import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { LogOut } from "lucide-react";

import logoImg from "../../assets/logo_projeto.png";

const ADMIN_TABS = [
  { label: "usuários", to: "/admin", end: true },
  { label: "relatório do sistema", to: "/admin/relatorio", end: false },
];

type AdminTab = (typeof ADMIN_TABS)[number];

/**
 * Aba de navegação administrativa.
 *
 * O indicador roxo fica posicionado logo abaixo do texto (e não no rodapé do
 * header), mantendo o mesmo padrão visual das demais navegações do Organizaê.
 */
function AdminTabLink({ tab }: { tab: AdminTab }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `flex h-12 shrink-0 items-center px-3 text-sm font-medium whitespace-nowrap transition md:h-16 ${
          isActive ? "text-white" : "text-indigo-100/70 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <span className="relative inline-flex items-center py-1.5">
          {tab.label}

          <span
            aria-hidden="true"
            className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full transition ${
              isActive ? "bg-[#635BFF]" : "bg-transparent"
            }`}
          />
        </span>
      )}
    </NavLink>
  );
}

/**
 * Estrutura compartilhada das telas administrativas.
 *
 * O cabeçalho escuro concentra a navegação entre a listagem de usuários e o
 * relatório do sistema, mantendo a identidade visual do Organizaê.
 *
 * TODO [BACKEND]: A guarda real de acesso está em `AdminAccessGuard`
 * (App.tsx). Este componente não deve ser usado como barreira de segurança;
 * o back-end precisa validar a role ADMIN em todas as chamadas /api/admin/*.
 */
function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isReportPage = pathname.startsWith("/admin/relatorio");
  const sectionTitle = isReportPage ? "Relatório do sistema" : "Usuários";

  function handleExitAdmin() {
    localStorage.removeItem("admin_access");
    localStorage.removeItem("user_role");
    localStorage.removeItem("access_token");

    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-svh bg-slate-50">
      <header className="sticky top-0 z-30 bg-[#0B085C] text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            <Link
              to="/admin"
              className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
              aria-label="Ir para o início do painel administrativo"
            >
              <img
                src={logoImg}
                alt=""
                aria-hidden="true"
                className="h-[52px] w-[52px] select-none object-contain"
                draggable={false}
              />

              <span className="text-lg font-bold tracking-tight">Organizaê</span>
            </Link>

            <nav
              aria-label="Seções do painel administrativo"
              className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
            >
              {ADMIN_TABS.map((tab) => (
                <AdminTabLink key={tab.to} tab={tab} />
              ))}
            </nav>

            <button
              type="button"
              onClick={handleExitAdmin}
              aria-label="Sair do painel administrativo"
              title="Sair do painel administrativo"
              className="ml-auto inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-indigo-100/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Sair do painel</span>
            </button>
          </div>

          <nav
            aria-label="Seções do painel administrativo"
            className="flex items-center overflow-x-auto border-t border-white/10 md:hidden"
          >
            {ADMIN_TABS.map((tab) => (
              <AdminTabLink key={tab.to} tab={tab} />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pt-8 pb-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#4F26E9] uppercase">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B0B45]">
            Administrador — {sectionTitle}
          </h1>
        </div>

        <div className="py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
