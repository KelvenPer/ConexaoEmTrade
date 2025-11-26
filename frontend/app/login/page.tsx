"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login"); // 'login' ou 'email'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier || !password) {
      setErrorMsg("Preencha o usuario (login/e-mail) e a senha.");
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

      if (data.token) {
        localStorage.setItem("conexao_trade_token", data.token);
        localStorage.setItem("conexao_trade_user", JSON.stringify(data.user));
      }

      router.push("/painel");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoToRegister() {
    router.push("/registro");
  }

  function handleForgotPassword() {
    alert("Fluxo de 'Esqueci minha senha' ainda sera implementado.");
  }

  const labelText = mode === "login" ? "Login" : "E-mail";
  const placeholderText =
    mode === "login" ? "seu.login" : "voce@empresa.com";

  return (
    <div className="login-page">
      <span className="login-aurora login-aurora--one" />
      <span className="login-aurora login-aurora--two" />

      <div className="login-layout">
        <div className="login-hero">
          <div className="login-hero__brand">
            <div className="login-avatar">CT</div>
            <div>
              <p className="login-eyebrow">Conexao em Trade</p>
              <h1 className="login-title">
                Dados, varejo e industria falando a mesma lingua.
              </h1>
              <p className="login-subtitle">
                CRM focado em Trade Marketing para conectar planejamento,
                execucao e resultados em tempo real.
              </p>
            </div>
          </div>

          <div className="login-highlights">
            <div className="login-bubble">JBP + PDV</div>
            <div className="login-bubble">Rotinas com alertas</div>
            <div className="login-bubble">Visao 360</div>
          </div>

          <ul className="login-list">
            <li>Organize campanhas, execucoes em loja e JBP em um so painel.</li>
            <li>Priorize rotinas criticas com alertas claros e acionaveis.</li>
            <li>Compartilhe resultados rapidos com o time e lideranca.</li>
          </ul>
        </div>

        <div className="login-card">
          <div className="login-card__header">
            <p className="login-card__eyebrow">Bem-vindo de volta</p>
            <h2 className="login-card__title">Acesse seu painel</h2>
            <p className="login-card__muted">
              Use o login interno ou seu e-mail cadastrado para continuar.
            </p>
          </div>

          <div className="login-toggle">
            <button
              type="button"
              className={`login-toggle__btn ${mode === "login" ? "is-active" : ""}`}
              onClick={() => setMode("login")}
            >
              Entrar com login
            </button>
            <button
              type="button"
              className={`login-toggle__btn ${mode === "email" ? "is-active" : ""}`}
              onClick={() => setMode("email")}
            >
              Entrar com e-mail
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">{labelText}</label>
              <input
                className="login-input"
                type={mode === "email" ? "email" : "text"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={placeholderText}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Senha</label>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            {errorMsg && <div className="login-error">{errorMsg}</div>}

            <div className="login-actions">
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <button
                type="button"
                className="login-link"
                onClick={handleForgotPassword}
                aria-label="Esqueci minha senha"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>

          <div className="login-footer">
            <button
              type="button"
              className="login-link login-link--bold"
              onClick={handleGoToRegister}
            >
              Criar nova conta
            </button>
            <p className="login-meta">
              Plataforma de portfolio em Trade Marketing para planejar JBP,
              projetos JVC, execucao em PDV e analise de resultados com foco no
              varejo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
