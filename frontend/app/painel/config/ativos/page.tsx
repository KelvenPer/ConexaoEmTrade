"use client";

import { useEffect, useState } from "react";

export default function ConfigAtivosPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    channel: "",
    type: "",
    format: "",
    unit: "",
    basePrice: "",
    currency: "BRL",
    status: "ativo",
    description: "",
  });

  async function carregarAtivos() {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`${apiBaseUrl}/api/ativos`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar ativos.");
      }
      setAtivos(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar ativos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtivos();
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
      channel: "",
      type: "",
      format: "",
      unit: "",
      basePrice: "",
      currency: "BRL",
      status: "ativo",
      description: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleEditar(ativo) {
    setEditingId(ativo.id);
    setForm({
      name: ativo.name || "",
      channel: ativo.channel || "",
      type: ativo.type || "",
      format: ativo.format || "",
      unit: ativo.unit || "",
      basePrice:
        ativo.basePrice !== null && ativo.basePrice !== undefined
          ? String(ativo.basePrice)
          : "",
      currency: ativo.currency || "BRL",
      status: ativo.status || "ativo",
      description: ativo.description || "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.channel) {
      setErrorMsg("Nome e canal são obrigatórios.");
      return;
    }

    let basePriceNumber = null;
    if (form.basePrice !== "") {
      const n = Number(form.basePrice);
      if (Number.isNaN(n)) {
        setErrorMsg("Valor base inválido.");
        return;
      }
      basePriceNumber = n;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        channel: form.channel,
        type: form.type || null,
        format: form.format || null,
        unit: form.unit || null,
        basePrice: basePriceNumber,
        currency: form.currency || "BRL",
        status: form.status,
        description: form.description || null,
      };

      const url = editingId
        ? `${apiBaseUrl}/api/ativos/${editingId}`
        : `${apiBaseUrl}/api/ativos`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar ativo.");
      }

      setSuccessMsg(
        editingId
          ? "Ativo atualizado com sucesso."
          : "Ativo criado com sucesso."
      );

      await carregarAtivos();
      if (!editingId) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar ativo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este ativo?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`${apiBaseUrl}/api/ativos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir ativo.");
      }
      setSuccessMsg("Ativo excluído com sucesso.");
      await carregarAtivos();
      if (editingId === id) {
        handleNovo();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir ativo.");
    }
  }

  async function handleToggleStatus(ativo) {
    const novoStatus = ativo.status === "ativo" ? "inativo" : "ativo";

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`${apiBaseUrl}/api/ativos/${ativo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar status.");
      }
      setSuccessMsg("Status do ativo atualizado com sucesso.");
      await carregarAtivos();
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
        Ativos de Marketing & Trade
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Catálogo de ativos que o Super Maxi oferece para as indústrias:
        pontas de gôndola, banners de e-commerce, TV de loja, app, etc. Esse
        cadastro será usado em JBP, campanhas e visão do fornecedor.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.6fr)",
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
              {editingId ? "Editar ativo" : "Novo ativo"}
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
            <Field label="Nome do ativo *">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex.: Ponta de Gôndola, Banner Home E-commerce"
                style={inputStyle}
              />
            </Field>

            <Field label="Canal *">
              <select
                name="channel"
                value={form.channel}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Selecione o canal</option>
                <option value="LOJA_FISICA">Loja física</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="APP">App</option>
                <option value="JORNAL">Jornal / Impresso</option>
                <option value="CARRINHO">Carrinho</option>
                <option value="OUTRO">Outro</option>
              </select>
            </Field>

            <Field label="Tipo">
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                <option value="IN_STORE">In-store</option>
                <option value="ONLINE">Online</option>
                <option value="APP">App</option>
                <option value="OFFSITE">Off-site</option>
              </select>
            </Field>

            <Field label="Formato">
              <input
                type="text"
                name="format"
                value={form.format}
                onChange={handleChange}
                placeholder="Ex.: 970x250, vídeo 30s, cartaz A3"
                style={inputStyle}
              />
            </Field>

            <Field label="Unidade de venda">
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="Ex.: por semana, por mês, por inserção"
                style={inputStyle}
              />
            </Field>

            <Field label="Valor base (opcional)">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  name="basePrice"
                  value={form.basePrice}
                  onChange={handleChange}
                  placeholder="Ex.: 5000,00"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  style={{ ...inputStyle, maxWidth: 90 }}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
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

            <Field label="Descrição / observações">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Use este campo para detalhar o ativo: posição, regras, observações..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
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
                : "Criar ativo"}
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
              Lista de ativos
            </h2>
            <button
              type="button"
              onClick={carregarAtivos}
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
          ) : ativos.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Nenhum ativo cadastrado ainda. Use o formulário ao lado para
              cadastrar os primeiros.
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
                    <Th>Canal</Th>
                    <Th>Tipo</Th>
                    <Th>Unidade</Th>
                    <Th>Valor base</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((a) => {
                    const price =
                      a.basePrice !== null && a.basePrice !== undefined
                        ? Number(a.basePrice)
                        : null;

                    const formattedPrice =
                      price !== null && !Number.isNaN(price)
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: a.currency || "BRL",
                          }).format(price)
                        : "-";

                    return (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <Td>{a.name}</Td>
                        <Td>{a.channel}</Td>
                        <Td>{a.type || "-"}</Td>
                        <Td>{a.unit || "-"}</Td>
                        <Td>{formattedPrice}</Td>
                        <Td>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 11,
                              backgroundColor:
                                a.status === "ativo"
                                  ? "rgba(22,163,74,0.08)"
                                  : "rgba(148,163,184,0.18)",
                              color:
                                a.status === "ativo" ? "#15803d" : "#4b5563",
                            }}
                          >
                            {a.status === "ativo" ? "Ativo" : "Inativo"}
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
                              onClick={() => handleEditar(a)}
                              style={smallButton}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(a)}
                              style={smallButton}
                            >
                              {a.status === "ativo" ? "Inativar" : "Ativar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluir(a.id)}
                              style={{ ...smallButton, color: "#b91c1c" }}
                            >
                              Excluir
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
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
