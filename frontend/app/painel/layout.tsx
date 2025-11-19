// frontend/app/painel/layout.jsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PainelLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // se um dia você quiser checar token aqui, dá pra fazer nesse useEffect
  useEffect(() => {
    // exemplo futuro:
    // const token = localStorage.getItem("conexao_trade_token");
    // if (!token) router.push("/login");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          backgroundColor: "#020617",
          color: "#e5e7eb",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "8px 10px 16px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Conexão em Trade
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Painel de Trade Marketing & Dados
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 4,
            fontSize: 13,
          }}
        >
          <Section title="Principal">
            <NavItem href="/painel" pathname={pathname}>
              Dashboard Geral
            </NavItem>
          </Section>

          <Section title="Trade Marketing">
            <NavItem href="/painel/trade" pathname={pathname}>
              Painel de Trade
            </NavItem>
            <NavItem href="/painel/trade/jbp-jvc" pathname={pathname}>
              JBP &amp; JVC
            </NavItem>
            <NavItem href="/painel/trade/execucao" pathname={pathname}>
              Execução em Loja
            </NavItem>
            <NavItem href="/painel/trade/retail-media" pathname={pathname}>
              Retail Media
            </NavItem>
          </Section>

          <Section title="Marketing">
            <NavItem href="/painel/marketing/calendario" pathname={pathname}>
              Calendário de Campanhas
            </NavItem>
            <NavItem href="/painel/marketing/campanhas" pathname={pathname}>
              Campanhas &amp; Conteúdo
            </NavItem>
            <NavItem href="/painel/marketing/resultados" pathname={pathname}>
              Resultados de Campanha
            </NavItem>
          </Section>

          <Section title="Indústria">
            <NavItem href="/painel/industria/parceiros" pathname={pathname}>
              Parceiros &amp; Contas
            </NavItem>
            <NavItem
              href="/painel/industria/visao-fornecedor"
              pathname={pathname}
            >
              Visão por Fornecedor
            </NavItem>
            <NavItem href="/painel/industria/acordos" pathname={pathname}>
              Acordos Comerciais
            </NavItem>
          </Section>

          <Section title="Área de Dados">
            <NavItem href="/painel/dados/sql-lab" pathname={pathname}>
              SQL Lab / Relatórios
            </NavItem>
            <NavItem href="/painel/dados/bi" pathname={pathname}>
              Painéis de BI
            </NavItem>
          </Section>

          <Section title="Configurações">
            <NavItem href="/painel/config/usuarios" pathname={pathname}>
              Usuários
            </NavItem>
            <NavItem href="/painel/config/fornecedores" pathname={pathname}>
              Fornecedores
            </NavItem>
          </Section>
        </nav>

        <div
          style={{
            paddingTop: 8,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            marginTop: 8,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          <div>Portfólio • Kelven Silva</div>
        </div>
      </aside>

      {/* Área principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header
          style={{
            height: 56,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <div style={{ fontSize: 14, color: "#4b5563" }}>
            Visão de Portfólio • Ambiente de demonstração
          </div>
          <button
            type="button"
            onClick={() => {
              // placeholder: depois você pode limpar token, etc.
              // localStorage.removeItem("conexao_trade_token");
              // localStorage.removeItem("conexao_trade_user");
              router.push("/login");
            }}
            style={{
              fontSize: 12,
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "6px 12px",
              backgroundColor: "#ffffff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </header>

        {/* Conteúdo */}
        <main
          style={{
            flex: 1,
            padding: 24,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#6b7280",
          padding: "4px 8px",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function NavItem({ href, pathname, children }) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        textDecoration: "none",
        fontSize: 12,
        color: isActive ? "#0f172a" : "#e5e7eb",
        backgroundColor: isActive ? "#e5e7eb" : "transparent",
        display: "block",
      }}
    >
      {children}
    </Link>
  );
}
