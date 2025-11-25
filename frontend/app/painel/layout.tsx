"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings2,
  Users,
  Factory,
  Boxes,
  Megaphone,
  CalendarDays,
  LineChart,
} from "lucide-react";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-header">
          <div className="app-shell__sidebar-header-logo">CT</div>
          <div className="app-shell__sidebar-header-title">
            <span className="app-shell__sidebar-header-title-main">
              Conexão em Trade
            </span>
            <span className="app-shell__sidebar-header-title-sub">
              Painel de Trade Marketing &amp; Dados
            </span>
          </div>
        </div>

        <nav className="app-shell__sidebar-nav">
          <NavGroup title="Principal">
            <NavItem
              href="/painel"
              pathname={pathname}
              icon={<LayoutDashboard size={16} />}
            >
              Dashboard Geral
            </NavItem>
          </NavGroup>

          <NavGroup title="Trade Marketing">
            <NavItem
              href="/painel/trade/jbp-jvc"
              pathname={pathname}
              icon={<Boxes size={16} />}
            >
              JBP &amp; JVC
            </NavItem>
          </NavGroup>

          <NavGroup title="Marketing">
            <NavItem
              href="/painel/marketing/calendario"
              pathname={pathname}
              icon={<CalendarDays size={16} />}
            >
              Calendário de campanhas
            </NavItem>
            <NavItem
              href="/painel/marketing/campanhas"
              pathname={pathname}
              icon={<Megaphone size={16} />}
            >
              Campanhas &amp; conteúdo
            </NavItem>
            <NavItem
              href="/painel/marketing/resultados"
              pathname={pathname}
              icon={<LineChart size={16} />}
            >
              Resultados de campanha
            </NavItem>
          </NavGroup>

          <NavGroup title="Configurações">
            <NavItem
              href="/painel/config/usuarios"
              pathname={pathname}
              icon={<Users size={16} />}
            >
              Usuários
            </NavItem>
            <NavItem
              href="/painel/config/fornecedores"
              pathname={pathname}
              icon={<Factory size={16} />}
            >
              Fornecedores
            </NavItem>
            <NavItem
              href="/painel/config/ativos"
              pathname={pathname}
              icon={<Settings2 size={16} />}
            >
              Ativos de mídia
            </NavItem>
          </NavGroup>
        </nav>

        <div className="app-shell__sidebar-footer">
          <div>Conexão em Trade · v0.1</div>
          <div>Ambiente de demonstração</div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-left">
            <div className="app-shell__topbar-title">Visão de Portfólio</div>
            <div className="app-shell__topbar-sub">
              Acompanhe JBP, campanhas, execução em loja e resultados em uma
              visão única.
            </div>
          </div>

          <div className="app-shell__topbar-right">
            <span className="app-shell__env-tag">
              • Ambiente de demonstração
            </span>
            <button type="button" className="app-shell__primary-cta">
              + Nova campanha
            </button>
            <div className="app-shell__user-chip">KS</div>
          </div>
        </header>

        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="app-shell__nav-group-title">{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function NavItem({
  href,
  pathname,
  icon,
  children,
}: {
  href: string;
  pathname: string | null;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const isActive =
    pathname === href || (pathname || "").startsWith(href + "/");

  return (
    <Link
      href={href}
      className={
        "app-shell__nav-item" +
        (isActive ? " app-shell__nav-item--active" : "")
      }
    >
      {icon && <span className="app-shell__nav-item-icon">{icon}</span>}
      <span className="app-shell__nav-label">{children}</span>
    </Link>
  );
}
