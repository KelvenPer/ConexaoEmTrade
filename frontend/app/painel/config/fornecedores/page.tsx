"use client";

import { useEffect, useState } from "react";

export default function ConfigFornecedoresPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    document: "",
    segment: "",
    channel: "",
    status: "ativo",
  });

  async function carregarFornecedores() {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`${apiBaseUrl}/api/fornecedores`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar fornecedores.");
      }
      setFornecedores(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFornecedores();
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
      document: "",
      segment: "",
      channel: "",
      status: "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleEditar(f) {
    setEditingId(f.id);
    setForm({
      name: f.name || "",
      document: f.document || "",
      segment: f.segment || "",
      channel: f.channel || "",
      status: f.status || "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name) {
      setErrorMsg("Nome do fornecedor é obrigatório.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        document: form.document || null,
        segment: form.segment || null,
        channel: form.channel || null,
        status: form.status || "ativo",
      };

      const url = editingId
        ? `${apiBaseUrl}/api/fornecedores/${editingId}`
        : `${apiBaseUrl}/api/fornecedores`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar fornecedor.");
      }

      setSuccessMsg(
        editingId
          ? "Fornecedor atualizado com sucesso."
          : "Fornecedor criado com sucesso."
      );

      await carregarFornecedores();
      if (!editingId) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar fornecedor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id) {
    if (
      !window.confirm("Tem certeza que deseja excluir este fornecedor?")
    )
      return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`${apiBaseUrl}/api/fornecedores/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir fornecedor.");
      }
      setSuccessMsg("Fornecedor excluído com sucesso.");
      await carregarFornecedores();
      if (editingId === id) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir fornecedor.");
    }
  }

  async function handleToggleStatus(f) {
    const novoStatus = f.status === "ativo" ? "inativo" : "ativo";
    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${apiBaseUrl}/api/fornecedores/${f.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar status.");
      }

      setSuccessMsg("Status atualizado com sucesso.");
      await carregarFornecedores();
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
        Fornecedores
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Administração da base de fornecedores, utilizada em Trade, Indústria e
        Painéis de BI. Você pode cadastrar, editar, ativar/inativar e remover
        fornecedores.
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
              {editingId ? "Editar fornecedor" : "Novo fornecedor"}
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
            <Field label="Nome do fornecedor">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex.: Indústria XPTO Alimentos"
                style={inputStyle}
              />
            </Field>

            <Field label="Documento (CNPJ/CPF)">
              <input
                type="text"
                name="document"
                value={form.document}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                style={inputStyle}
              />
            </Field>

            <Field label="Segmento">
              <input
                type="text"
                name="segment"
                value={form.segment}
                onChange={handleChange}
                placeholder="Ex.: Bebidas, Alimentos, Higiene"
                style={inputStyle}
              />
            </Field>

            <Field label="Canal principal">
              <input
                type="text"
                name="channel"
                value={form.channel}
                onChange={handleChange}
                placeholder="Ex.: Varejo alimentar, Farma, Cash & Carry"
                style={inputStyle}
              />
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
                : "Criar fornecedor"}
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
              Lista de fornecedores
            </h2>
            <button
              type="button"
              onClick={carregarFornecedores}
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
          ) : fornecedores.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Nenhum fornecedor cadastrado ainda.
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
                    <Th>Documento</Th>
                    <Th>Segmento</Th>
                    <Th>Canal</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.map((f) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Td>{f.name}</Td>
                      <Td>{f.document || "-"}</Td>
                      <Td>{f.segment || "-"}</Td>
                      <Td>{f.channel || "-"}</Td>
                      <Td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            backgroundColor:
                              f.status === "ativo"
                                ? "rgba(22,163,74,0.08)"
                                : "rgba(148,163,184,0.18)",
                            color:
                              f.status === "ativo" ? "#15803d" : "#4b5563",
                          }}
                        >
                          {f.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
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
                            onClick={() => handleEditar(f)}
                            style={smallButton}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(f)}
                            style={smallButton}
                          >
                            {f.status === "ativo"
                              ? "Inativar"
                              : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(f.id)}
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
