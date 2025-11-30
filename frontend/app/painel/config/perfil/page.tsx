"use client";

import { useEffect, useState } from "react";

type UserProfile = {
  name: string;
  email: string;
  login: string;
  role: string;
  sector?: string;
};

const sectorLabels: Record<string, string> = {
  MARKETING: "Marketing",
  TRADE_MARKETING: "Trade marketing",
  COMERCIAL: "Comercial",
  ANALITICA: "Área analítica",
};

export default function PerfilPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window === "undefined") {
      return {
        name: "Usuario",
        email: "",
        login: "",
        role: "user",
        sector: "",
      };
    }

    const storedUser = localStorage.getItem("conexao_trade_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return {
          name: parsed?.name || "Usuario",
          email: parsed?.email || "",
          login: parsed?.login || "",
          role: parsed?.role || "user",
          sector: parsed?.sector || "",
        };
      } catch {
        // segue com defaults abaixo
      }
    }

    return {
      name: "Usuario",
      email: "",
      login: "",
      role: "user",
      sector: "",
    };
  });
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("conexao_trade_token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setStatusMsg(data?.message || "Nao foi possivel sincronizar seus dados agora.");
          return;
        }

        setUser({
          name: data?.name || "Usuario",
          email: data?.email || "",
          login: data?.login || "",
          role: data?.role || "user",
          sector: data?.sector || "",
        });
        localStorage.setItem("conexao_trade_user", JSON.stringify(data));
        setStatusMsg("");
      } catch {
        setStatusMsg("Nao foi possivel sincronizar seus dados agora.");
      }
    })();
  }, [apiBaseUrl]);

  return (
    <div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
          color: "#0f172a",
        }}
      >
        Perfil
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Revise e atualize seus dados. A foto e a troca de senha tambem podem ser acessadas pelo menu do avatar.
      </p>
      {statusMsg && (
        <p style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>
          {statusMsg}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 620,
        }}
      >
        <Field label="Nome completo">
          <div className="panel-input panel-input--solid">{user.name}</div>
        </Field>
        <Field label="E-mail">
          <div className="panel-input panel-input--solid">{user.email || "-"}</div>
        </Field>
        <Field label="Login">
          <div className="panel-input panel-input--solid">{user.login || "-"}</div>
        </Field>
        <Field label="Perfil de acesso">
          <div className="panel-input panel-input--solid">{user.role}</div>
        </Field>
        <Field label="Setor">
          <div className="panel-input panel-input--solid">
            {sectorLabels[user.sector || ""] || user.sector || "-"}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
