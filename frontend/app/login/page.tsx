"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type EntryMode = "industria" | "varejo";
type ShakeField = "identifier" | "password" | null;

export default function LoginPage() {
  const router = useRouter();

  const [entryMode, setEntryMode] = useState<EntryMode>("industria");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [nudgeField, setNudgeField] = useState<ShakeField>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const accessChannel = entryMode === "industria" ? "industria" : "varejo";

  function markTouched(field: "identifier" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function nudge(field: ShakeField) {
    if (!field) return;
    setNudgeField(field);
    setTimeout(() => setNudgeField(null), 520);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier || !password) {
      setErrorMsg("Preencha Login / Email e a senha para continuar.");
      if (!identifier) nudge("identifier");
      if (!password) nudge("password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          accessChannel,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Erro ao tentar fazer login.");
        return;
      }

      const token = data.access_token || data.token;
      if (token) {
        localStorage.setItem("conexao_trade_token", token);
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

  const placeholderText =
    entryMode === "industria"
      ? "login corporativo ou email"
      : "login do varejo ou email";

  const modeHint =
    entryMode === "industria"
      ? "Acesso para industria, fabricantes e distribuidores."
      : "Acesso para times de loja, compradores e varejo.";

  const emptyIdentifierHint =
    !identifier && touched.identifier
      ? entryMode === "industria"
        ? "Use seu login interno ou e-mail corporativo."
        : "Use o login ou e-mail cadastrado pelo varejo."
      : "";

  const emptyPasswordHint =
    !password && touched.password
      ? "Senha obrigatoria para validar seu acesso."
      : "";

  return (
    <div className="login-page">
      <span className="login-aurora login-aurora--one" />
      <span className="login-aurora login-aurora--two" />

      <div className="login-layout">
        <div className="login-hero">
          <div className="login-hero__brand">
            <div>
              <p className="login-eyebrow">Conexao em Trade</p>
              <h1 className="login-title">
                Dados, varejo e industria falando a mesma lingua.
              </h1>
              <p className="login-subtitle">
                Plataforma real de Trade Marketing para conectar planejamento,
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
              Digite seu login ou e-mail cadastrado. Reconhecemos os dois
              automaticamente.
            </p>
          </div>

          <div className="login-toggle">
            <button
              type="button"
              className={`login-toggle__btn ${entryMode === "industria" ? "is-active" : ""}`}
              onClick={() => {
                setEntryMode("industria");
                setErrorMsg("");
                nudge("identifier");
              }}
            >
              Entrar como Industria
            </button>
            <button
              type="button"
              className={`login-toggle__btn ${entryMode === "varejo" ? "is-active" : ""}`}
              onClick={() => {
                setEntryMode("varejo");
                setErrorMsg("");
                nudge("identifier");
              }}
            >
              Entrar como Varejo
            </button>
          </div>
          <div className="login-mode-hint" aria-live="polite">
            {modeHint}
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <div className="login-field__header">
                <label className="login-label">Login / Email</label>
                <span className="login-pill">{entryMode}</span>
              </div>
              <input
                className={`login-input ${nudgeField === "identifier" ? "is-shaking" : ""} ${!identifier && touched.identifier ? "is-empty" : ""}`}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trimStart())}
                onBlur={() => markTouched("identifier")}
                placeholder={placeholderText}
              />
              <div className={`login-hint ${identifier ? "is-hidden" : ""}`}>
                {emptyIdentifierHint ||
                  (entryMode === "industria"
                    ? "Pode ser o login interno ou o e-mail corporativo."
                    : "Aceitamos login ou e-mail do varejo cadastrado.")}
              </div>
            </div>

            <div className="login-field">
              <div className="login-field__header">
                <label className="login-label">Senha</label>
                {!password && touched.password && (
                  <span className="login-pill login-pill--alert">faltando</span>
                )}
              </div>
              <input
                className={`login-input ${nudgeField === "password" ? "is-shaking" : ""} ${!password && touched.password ? "is-empty" : ""}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                placeholder="********"
              />
              <div className={`login-hint ${password ? "is-hidden" : ""}`}>
                {emptyPasswordHint || "Com oito caracteres voce passa direto."}
              </div>
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
              Plataforma real de Trade Marketing para planejar JBP, projetos JVC,
              executar no PDV e analisar resultados com foco no varejo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
