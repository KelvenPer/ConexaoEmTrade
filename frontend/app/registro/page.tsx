"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !login || !email || !password || !passwordConfirm) {
      setErrorMsg("Preencha todos os campos.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMsg("As senhas não conferem.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${apiBaseUrl}/api/auth/novoCadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          login,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Erro ao criar usuário.");
        return;
      }

      setSuccessMsg(
        "Usuário criado com sucesso! Redirecionando para a tela de login..."
      );
      setPassword("");
      setPasswordConfirm("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setErrorMsg("Erro inesperado ao criar usuário.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin() {
    router.push("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: 24,
          borderRadius: 12,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            color: "#0f172a",
          }}
        >
          Criar nova conta
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Faça seu cadastro usando a rota&nbsp;
          <code
            style={{
              background: "#f3f4f6",
              padding: 2,
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            POST /api/auth/novoCadastro
          </code>
          .
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Digite seu nome completo"
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
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Defina um login de acesso"
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
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Defina uma senha"
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
              Confirmar senha
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Repita a senha"
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

          {successMsg && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#15803d",
              }}
            >
              {successMsg}
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
            {loading ? "Criando conta..." : "Criar conta"}
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
            onClick={handleBackToLogin}
            style={{
              border: "none",
              background: "none",
              color: "#0f172a",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Voltar para login
          </button>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          Após criar sua conta, use seu login ou e-mail na tela de acesso do
          Conexão em Trade para entrar na plataforma.
        </p>
      </div>
    </main>
  );
}

