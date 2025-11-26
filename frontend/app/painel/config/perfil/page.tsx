"use client";

import { useEffect, useState } from "react";

type UserProfile = {
  name: string;
  email: string;
  login: string;
  role: string;
};

export default function PerfilPage() {
  const [user, setUser] = useState<UserProfile>({
    name: "Usuario",
    email: "",
    login: "",
    role: "user",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("conexao_trade_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed?.name || "Usuario",
          email: parsed?.email || "",
          login: parsed?.login || "",
          role: parsed?.role || "user",
        });
      } catch {
        // ignore parse errors
      }
    }
  }, []);

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
