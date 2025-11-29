"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeletionBlockInfo, DeletionConflictModal } from "../../components/DeletionConflictModal";

type Usuario = {
  id: number;
  name: string;
  login: string;
  email: string;
  role: string;
  status: string;
  photoUrl?: string | null;
  accessChannel?: string | null;
  supplierId?: number | null;
  createdAt?: string;
};

type Fornecedor = {
  id: number;
  name: string;
};

export default function ConfigUsuariosPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [blockInfo, setBlockInfo] = useState<DeletionBlockInfo | null>(null);

  const [form, setForm] = useState({
    name: "",
    login: "",
    email: "",
    password: "",
    role: "USER",
    status: "ativo",
    accessChannel: "industria",
    supplierId: "",
  });

  const supplierMap = useMemo(() => {
    const map = new Map<number, string>();
    fornecedores.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [fornecedores]);

  function getTokenOrFail() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("conexao_trade_token")
        : null;
    return token || "";
  }

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = getTokenOrFail();
      if (!token) {
        throw new Error("Token ausente. Faca login novamente.");
      }

      const res = await fetch(`${apiBaseUrl}/api/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar usuarios.");
      }
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar usuarios.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const carregarFornecedores = useCallback(async () => {
    try {
      const token = getTokenOrFail();
      if (!token) {
        throw new Error("Token ausente. Faca login novamente.");
      }

      const res = await fetch(`${apiBaseUrl}/api/fornecedores/ativos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar fornecedores.");
      }
      setFornecedores(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar fornecedores.";
      setErrorMsg(message);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    carregarUsuarios();
    carregarFornecedores();
  }, [carregarUsuarios, carregarFornecedores]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "role" && value === "PLATFORM_ADMIN") {
      setForm((prev) => ({
        ...prev,
        role: value,
        accessChannel: "interno", // super admin usa canal interno
        supplierId: "",
      }));
      return;
    }
    if (name === "accessChannel" && value !== "industria") {
      setForm((prev) => ({
        ...prev,
        accessChannel: value,
        supplierId: "",
      }));
      return;
    }

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
      role: "USER",
      status: "ativo",
      accessChannel: "industria",
      supplierId: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleEditar(usuario: Usuario) {
    setEditingId(usuario.id);
    setForm({
      name: usuario.name || "",
      login: usuario.login || "",
      email: usuario.email || "",
      password: "",
      role: usuario.role || "USER",
      status: usuario.status || "ativo",
      accessChannel: usuario.accessChannel || "industria",
      supplierId: usuario.supplierId != null ? String(usuario.supplierId) : "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.login || !form.email) {
      setErrorMsg("Nome, login e e-mail sao obrigatorios.");
      return;
    }

    if (!editingId && !form.password) {
      setErrorMsg("Senha e obrigatoria para novo usuario.");
      return;
    }

    const supplierIdParsed =
      form.accessChannel === "industria" && form.supplierId
        ? Number(form.supplierId)
        : null;

    try {
      setSaving(true);
      const token = getTokenOrFail();
      if (!token) {
        throw new Error("Token ausente. Faca login novamente.");
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        login: form.login,
        email: form.email,
        role: form.role,
        status: form.status,
        accessChannel: form.accessChannel,
        supplierId: form.accessChannel === "industria" ? supplierIdParsed : null,
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar usuario.");
      }

      setSuccessMsg(
        editingId ? "Usuario atualizado com sucesso." : "Usuario criado com sucesso."
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
      const message = err instanceof Error ? err.message : "Erro ao salvar usuario.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir este usuario?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      setBlockInfo(null);
      const token = getTokenOrFail();
      if (!token) {
        throw new Error("Token ausente. Faca login novamente.");
      }

      const res = await fetch(`${apiBaseUrl}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data?.conflicts) && data.conflicts.length) {
          const nome = usuarios.find((u) => u.id === id)?.name || "Usuario";
          setBlockInfo({
            title: `Nao foi possivel excluir ${nome}`,
            message: data.message || "Este usuario possui vinculacoes que impedem a exclusao.",
            conflicts: data.conflicts,
          });
        }
        setErrorMsg(data.message || "Erro ao excluir usuario.");
        return;
      }
      setSuccessMsg("Usuario excluido com sucesso.");
      await carregarUsuarios();
      if (editingId === id) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao excluir usuario.";
      setErrorMsg(message);
    }
  }

  async function handleToggleStatus(usuario: Usuario) {
    const novoStatus = usuario.status === "ativo" ? "inativo" : "ativo";

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const token = getTokenOrFail();
      if (!token) {
        throw new Error("Token ausente. Faca login novamente.");
      }

      const res = await fetch(`${apiBaseUrl}/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar status.");
      }
      setSuccessMsg("Status do usuario atualizado com sucesso.");
      await carregarUsuarios();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao atualizar status.";
      setErrorMsg(message);
    }
  }

  return (
    <>
      <div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
          color: "#0f172a",
        }}
      >
        Usuarios
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Administracao de usuarios que acessam o Conexao em Trade. Somente
        usuarios ativos conseguem fazer login.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.5fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulario */}
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
              {editingId ? "Editar usuario" : "Novo usuario"}
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
                Limpar formulario
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
                placeholder={editingId ? "Deixe em branco para manter" : "********"}
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
                <option value="USER">Usuario</option>
                <option value="TENANT_ADMIN">Tenant Admin</option>
                <option value="PLATFORM_ADMIN">Super Admin (plataforma)</option>
              </select>
            </Field>

            <Field label="Segmento">
              <select
                name="accessChannel"
                value={form.accessChannel}
                onChange={handleChange}
                disabled={form.role === "PLATFORM_ADMIN"}
                style={{
                  ...inputStyle,
                  paddingRight: 28,
                  background: form.role === "PLATFORM_ADMIN" ? "#f3f4f6" : "#fff",
                }}
              >
                <option value="industria">Industria</option>
                <option value="varejo">Varejo</option>
                <option value="interno">Super Admin</option>
              </select>
            </Field>

            <Field label="Fornecedor (apenas Industria)">
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                disabled={form.accessChannel !== "industria"}
                style={{
                  ...inputStyle,
                  paddingRight: 28,
                  background:
                    form.accessChannel === "industria" ? "#fff" : "#f3f4f6",
                }}
              >
                <option value="">Sem vinculo</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Selecione um fornecedor para acessos de industria.
              </span>
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
                ? "Salvar alteracoes"
                : "Criar usuario"}
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
              Lista de usuarios
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
              Nenhum usuario cadastrado ainda.
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
                    <Th>Segmento</Th>
                    <Th>Fornecedor</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Acao</Th>
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
                      <Td>{u.accessChannel || "-"}</Td>
                      <Td>
                        {u.supplierId
                          ? supplierMap.get(u.supplierId) || `ID ${u.supplierId}`
                          : "-"}
                      </Td>
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
      {blockInfo && (
        <DeletionConflictModal
          info={blockInfo}
          onClose={() => setBlockInfo(null)}
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

const inputStyle: React.CSSProperties = {
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  outline: "none",
};

const Th = ({ children }: { children: React.ReactNode }) => (
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

const Td = ({ children }: { children: React.ReactNode }) => (
  <td
    style={{
      padding: "6px 8px",
      color: "#111827",
    }}
  >
    {children}
  </td>
);

const smallButton: React.CSSProperties = {
  border: "none",
  background: "none",
  fontSize: 11,
  cursor: "pointer",
  color: "#0f172a",
  padding: 0,
};
