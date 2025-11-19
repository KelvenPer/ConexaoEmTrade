"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login"); // 'login' ou 'email'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier || !password) {
      setErrorMsg("Preencha o usuário (login/e-mail) e a senha.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginOrEmail: identifier,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Erro ao tentar fazer login.");
        return;
      }

      // Guarda o token para usar depois (ex: em requests autenticados)
      if (data.token) {
        localStorage.setItem("conexao_trade_token", data.token);
        localStorage.setItem("conexao_trade_user", JSON.stringify(data.user));
      }

      // Redireciona para a home / dashboard depois do login
      router.push("/painel");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoToRegister() {
    router.push("/registro"); // vamos criar essa página já já
  }

  function handleForgotPassword() {
    // por enquanto só um alerta; depois você implementa o fluxo real
    alert("Fluxo de 'Esqueci minha senha' ainda será implementado.");
  }

  const labelText = mode === "login" ? "Login" : "E-mail";
  const placeholderText =
    mode === "login" ? "seu.login" : "voce@empresa.com";

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 4,
            color: "#0f172a",
          }}
        >
          Conexão em Trade
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 20,
          }}
        >
          Dados, varejo e indústria falando a mesma língua.
        </p>

        {/* Botões para escolher modo de login */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border:
                mode === "login"
                  ? "1px solid #0f172a"
                  : "1px solid #e5e7eb",
              backgroundColor: mode === "login" ? "#0f172a" : "#ffffff",
              color: mode === "login" ? "#ffffff" : "#374151",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Entrar com login
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border:
                mode === "email"
                  ? "1px solid #0f172a"
                  : "1px solid #e5e7eb",
              backgroundColor: mode === "email" ? "#0f172a" : "#ffffff",
              color: mode === "email" ? "#ffffff" : "#374151",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Entrar com e-mail
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              {labelText}
            </label>
            <input
              type={mode === "email" ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={placeholderText}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#b91c1c",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <button
            type="button"
            onClick={handleGoToRegister}
            style={{
              border: "none",
              background: "none",
              color: "#0f172a",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Criar nova conta
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              border: "none",
              background: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          Plataforma de portfólio em Trade Marketing, criada para demonstrar
          planejamento (JBP), projetos de JVC, execução em PDV e análise de
          resultados com foco em varejo.
        </p>
      </div>
    </div>
  );
}
