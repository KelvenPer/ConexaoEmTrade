"use client";

import { useEffect, useState } from "react";

export default function ConfigUsuariosPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    login: "",
    email: "",
    password: "",
    role: "user",
    status: "ativo", // novo campo
  });

  async function carregarUsuarios() {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`${apiBaseUrl}/api/usuarios`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar usuários.");
      }
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleNovo() {
    setEditingId(null);
    setForm({
      name: "",
      login: "",
      email: "",
      password: "",
      role: "user",
      status: "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleEditar(usuario) {
    setEditingId(usuario.id);
    setForm({
      name: usuario.name || "",
      login: usuario.login || "",
      email: usuario.email || "",
      password: "",
      role: usuario.role || "user",
      status: usuario.status || "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.login || !form.email) {
      setErrorMsg("Nome, login e e-mail são obrigatórios.");
      return;
    }

    if (!editingId && !form.password) {
      setErrorMsg("Senha é obrigatória para novo usuário.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        login: form.login,
        email: form.email,
        role: form.role,
        status: form.status, // envia status
      };

      if (form.password) {
        payload.password = form.password;
      }

      const url = editingId
        ? `${apiBaseUrl}/api/usuarios/${editingId}`
        : `${apiBaseUrl}/api/usuarios`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar usuário.");
      }

      setSuccessMsg(
        editingId
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso."
      );
      setForm((prev) => ({
        ...prev,
        password: "",
      }));

      await carregarUsuarios();
      if (!editingId) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`${apiBaseUrl}/api/usuarios/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir usuário.");
      }
      setSuccessMsg("Usuário excluído com sucesso.");
      await carregarUsuarios();
      if (editingId === id) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir usuário.");
    }
  }

  async function handleToggleStatus(usuario) {
    const novoStatus = usuario.status === "ativo" ? "inativo" : "ativo";

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`${apiBaseUrl}/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar status.");
      }
      setSuccessMsg("Status do usuário atualizado com sucesso.");
      await carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao atualizar status.");
    }
  }

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
        Usuários
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Administração de usuários que acessam o Conexão em Trade. Somente
        usuários ativos conseguem fazer login.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.5fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulário */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {editingId ? "Editar usuário" : "Novo usuário"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleNovo}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 11,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                Limpar formulário
              </button>
            )}
          </div>

          <form
            onSubmit={handleSalvar}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Field label="Nome">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome completo"
                style={inputStyle}
              />
            </Field>

            <Field label="Login">
              <input
                type="text"
                name="login"
                value={form.login}
                onChange={handleChange}
                placeholder="seu.login"
                style={inputStyle}
              />
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="voce@empresa.com"
                style={inputStyle}
              />
            </Field>

            <Field label={editingId ? "Nova senha (opcional)" : "Senha"}>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  editingId ? "Deixe em branco para manter" : "••••••••"
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Perfil">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{ ...inputStyle, paddingRight: 28 }}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>

            {errorMsg && (
              <div style={{ fontSize: 12, color: "#b91c1c" }}>{errorMsg}</div>
            )}
            {successMsg && (
              <div style={{ fontSize: 12, color: "#15803d" }}>{successMsg}</div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                padding: "9px 14px",
                borderRadius: 999,
                border: "none",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? editingId
                  ? "Salvando..."
                  : "Criando..."
                : editingId
                ? "Salvar alterações"
                : "Criar usuário"}
            </button>
          </form>
        </section>

        {/* Lista */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Lista de usuários
            </h2>
            <button
              type="button"
              onClick={carregarUsuarios}
              style={{
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                padding: "4px 10px",
                background: "#ffffff",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Nenhum usuário cadastrado ainda.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f9fafb",
                      textAlign: "left",
                    }}
                  >
                    <Th>Nome</Th>
                    <Th>Login</Th>
                    <Th>E-mail</Th>
                    <Th>Perfil</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Td>{u.name}</Td>
                      <Td>{u.login}</Td>
                      <Td>{u.email}</Td>
                      <Td>{u.role}</Td>
                      <Td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            backgroundColor:
                              u.status === "ativo"
                                ? "rgba(22,163,74,0.08)"
                                : "rgba(148,163,184,0.18)",
                            color:
                              u.status === "ativo" ? "#15803d" : "#4b5563",
                          }}
                        >
                          {u.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </Td>
                      <Td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </Td>
                      <Td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleEditar(u)}
                            style={smallButton}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            style={smallButton}
                          >
                            {u.status === "ativo" ? "Inativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(u.id)}
                            style={{ ...smallButton, color: "#b91c1c" }}
                          >
                            Excluir
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  outline: "none",
};

const Th = ({ children }) => (
  <th
    style={{
      padding: "6px 8px",
      fontWeight: 600,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#6b7280",
    }}
  >
    {children}
  </th>
);

const Td = ({ children }) => (
  <td
    style={{
      padding: "6px 8px",
      color: "#111827",
    }}
  >
    {children}
  </td>
);

const smallButton = {
  border: "none",
  background: "none",
  fontSize: 11,
  cursor: "pointer",
  color: "#0f172a",
  padding: 0,
};
