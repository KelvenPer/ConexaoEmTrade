"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeletionBlockInfo, DeletionConflictModal } from "../../components/DeletionConflictModal";

type Produto = {
  id: number;
  code: string;
  description: string;
  complement?: string | null;
  brand?: string | null;
  category?: string | null;
  status: string;
  supplierId: number;
  supplier?: { id: number; name: string };
  createdAt?: string;
};

type Fornecedor = {
  id: number;
  name: string;
};

export default function ConfigProdutosPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMsg, setCsvMsg] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [dbForm, setDbForm] = useState({
    driver: "postgres",
    connectionString: "",
    query: "select code, description, complement, brand, category, supplierName from produtos",
  });
  const [dbMsg, setDbMsg] = useState("");
  const [dbLoading, setDbLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    complement: "",
    brand: "",
    category: "",
    supplierId: "",
    status: "ativo",
  });
  const [blockInfo, setBlockInfo] = useState<DeletionBlockInfo | null>(null);

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

  const carregarBase = useCallback(async () => {
    try {
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const [resProd, resFor] = await Promise.all([
        fetch(`${apiBaseUrl}/api/produtos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/fornecedores/ativos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dataProd = await resProd.json();
      const dataFor = await resFor.json();

      if (!resProd.ok) throw new Error(dataProd.message || "Erro ao carregar produtos.");
      if (!resFor.ok) throw new Error(dataFor.message || "Erro ao carregar fornecedores.");

      setProdutos(dataProd);
      setFornecedores(dataFor);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar dados.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    setLoading(true);
    carregarBase();
  }, [carregarBase]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNovo() {
    setEditingId(null);
    setForm({
      code: "",
      description: "",
      complement: "",
      brand: "",
      category: "",
      supplierId: "",
      status: "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleEditar(p: Produto) {
    setEditingId(p.id);
    setForm({
      code: p.code || "",
      description: p.description || "",
      complement: p.complement || "",
      brand: p.brand || "",
      category: p.category || "",
      supplierId: String(p.supplierId || ""),
      status: p.status || "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.code || !form.description || !form.supplierId) {
      setErrorMsg("Codigo, descricao e fornecedor sao obrigatorios.");
      return;
    }

    try {
      setSaving(true);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const payload = {
        code: form.code,
        description: form.description,
        complement: form.complement || null,
        brand: form.brand || null,
        category: form.category || null,
        supplierId: Number(form.supplierId),
        status: form.status || "ativo",
      };

      const url = editingId
        ? `${apiBaseUrl}/api/produtos/${editingId}`
        : `${apiBaseUrl}/api/produtos`;
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
      if (!res.ok) throw new Error(data.message || "Erro ao salvar produto.");

      setSuccessMsg(
        editingId ? "Produto atualizado com sucesso." : "Produto criado com sucesso."
      );
      await carregarBase();
      if (!editingId) handleNovo();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao salvar produto.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      setErrorMsg("");
      setSuccessMsg("");
      setBlockInfo(null);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/produtos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data?.conflicts) && data.conflicts.length) {
          const nome = produtos.find((p) => p.id === id)?.description || "Produto";
          setBlockInfo({
            title: `Nao foi possivel excluir ${nome}`,
            message: data.message || "Este produto possui vinculacoes que impedem a exclusao.",
            conflicts: data.conflicts,
          });
        }
        setErrorMsg(data.message || "Erro ao excluir produto.");
        return;
      }

      setSuccessMsg("Produto excluido com sucesso.");
      await carregarBase();
      if (editingId === id) handleNovo();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao excluir produto.";
      setErrorMsg(message);
    }
  }

  async function handleToggleStatus(p: Produto) {
    const novoStatus = p.status === "ativo" ? "inativo" : "ativo";
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/produtos/${p.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar status.");

      setSuccessMsg("Status do produto atualizado.");
      await carregarBase();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao atualizar status.";
      setErrorMsg(message);
    }
  }

  async function handleImportCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCsvMsg("");
    if (!csvFile) {
      setCsvMsg("Selecione um arquivo CSV.");
      return;
    }
    try {
      setCsvLoading(true);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");
      const text = await readFileWithFallbackEncoding(csvFile);
      const res = await fetch(`${apiBaseUrl}/api/produtos/import-csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          csv: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao importar CSV.");
      setCsvMsg(data.message || "Importacao concluida.");
      await carregarBase();
      setCsvFile(null);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao importar CSV.";
      setCsvMsg(message);
    } finally {
      setCsvLoading(false);
    }
  }

  async function handleImportDb(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDbMsg("");
    if (!dbForm.connectionString || !dbForm.query) {
      setDbMsg("Informe connectionString e query.");
      return;
    }
    try {
      setDbLoading(true);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");
      const res = await fetch(`${apiBaseUrl}/api/produtos/import-db`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driver: dbForm.driver,
          connectionString: dbForm.connectionString,
          query: dbForm.query,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao importar via banco.");
      setDbMsg(data.message || "Importacao concluida.");
      await carregarBase();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao importar via banco.";
      setDbMsg(message);
    } finally {
      setDbLoading(false);
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
        Produtos
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Base de produtos para vincular em JBPs, campanhas e planos. Cadastre itens com
        codigo, marca, categoria e fornecedor responsavel.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setCsvModalOpen(true)}
          style={{
            border: "none",
            background: "#0f172a",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          Importar via CSV
        </button>
        <button
          type="button"
          onClick={() => setDbModalOpen(true)}
          style={{
            border: "none",
            background: "#0f172a",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          Importar via banco de dados
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.5fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
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
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>
              {editingId ? "Editar produto" : "Novo produto"}
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

          <form onSubmit={handleSalvar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Codigo interno">
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="SKU interno ou codigo ERP"
                style={inputStyle}
              />
            </Field>

            <Field label="Descricao">
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nome comercial do produto"
                style={inputStyle}
              />
            </Field>

            <Field label="Complemento">
              <input
                type="text"
                name="complement"
                value={form.complement}
                onChange={handleChange}
                placeholder="Variante, tamanho, sabor..."
                style={inputStyle}
              />
            </Field>

            <Field label="Marca">
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Ex.: Nescau"
                style={inputStyle}
              />
            </Field>

            <Field label="Categoria">
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ex.: Bebidas, Achocolatados"
                style={inputStyle}
              />
            </Field>

            <Field label="Fornecedor">
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                style={{ ...inputStyle, paddingRight: 28 }}
              >
                <option value="">Selecione</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
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

            {errorMsg && <div style={{ fontSize: 12, color: "#b91c1c" }}>{errorMsg}</div>}
            {successMsg && <div style={{ fontSize: 12, color: "#15803d" }}>{successMsg}</div>}

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
              {saving ? (editingId ? "Salvando..." : "Criando...") : editingId ? "Salvar alteracoes" : "Criar produto"}
            </button>
          </form>
        </section>

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
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Lista de produtos</h2>
            <button
              type="button"
              onClick={carregarBase}
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
          ) : produtos.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Nenhum produto cadastrado ainda.
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
                  <tr style={{ backgroundColor: "#f9fafb", textAlign: "left" }}>
                    <Th>Codigo</Th>
                    <Th>Descricao</Th>
                    <Th>Marca</Th>
                    <Th>Categoria</Th>
                    <Th>Fornecedor</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Acao</Th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <Td>{p.code}</Td>
                      <Td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span>{p.description}</span>
                          {p.complement ? (
                            <span style={{ fontSize: 11, color: "#6b7280" }}>{p.complement}</span>
                          ) : null}
                        </div>
                      </Td>
                      <Td>{p.brand || "-"}</Td>
                      <Td>{p.category || "-"}</Td>
                      <Td>{supplierMap.get(p.supplierId) || p.supplier?.name || "-"}</Td>
                      <Td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            backgroundColor:
                              p.status === "ativo" ? "rgba(22,163,74,0.08)" : "rgba(148,163,184,0.18)",
                            color: p.status === "ativo" ? "#15803d" : "#4b5563",
                          }}
                        >
                          {p.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </Td>
                      <Td>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </Td>
                      <Td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => handleEditar(p)} style={smallButton}>
                            Editar
                          </button>
                          <button type="button" onClick={() => handleToggleStatus(p)} style={smallButton}>
                            {p.status === "ativo" ? "Inativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(p.id)}
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

      {csvModalOpen && (
        <Modal onClose={() => setCsvModalOpen(false)} title="Importar produtos via CSV">
          <form onSubmit={handleImportCsv} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Arquivo CSV">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                style={inputStyle}
              />
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Colunas esperadas: code/codigo, description/descricao, complement/complemento, brand/marca, category/categoria, supplierName/fornecedor (ou supplierId).
                Sem coluna de id (gerado automaticamente).
              </span>
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                      <th style={sampleTh}>Codigo</th>
                      <th style={sampleTh}>Descricao</th>
                      <th style={sampleTh}>Complemento</th>
                      <th style={sampleTh}>Marca</th>
                      <th style={sampleTh}>Categoria</th>
                      <th style={sampleTh}>Fornecedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={sampleTd}>NES-ACHO-200G</td>
                      <td style={sampleTd}>Achocolatado em po 200g</td>
                      <td style={sampleTd}>tradicional</td>
                      <td style={sampleTd}>Nescau</td>
                      <td style={sampleTd}>Achocolatado</td>
                      <td style={sampleTd}>Nestle Industria de Alimentos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Field>

            {csvMsg && <div style={{ fontSize: 12, color: csvMsg.toLowerCase().includes("erro") ? "#b91c1c" : "#15803d" }}>{csvMsg}</div>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                style={{ ...smallButton, fontSize: 12, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={csvLoading}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: csvLoading ? "not-allowed" : "pointer",
                }}
              >
                {csvLoading ? "Importando..." : "Importar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dbModalOpen && (
        <Modal onClose={() => setDbModalOpen(false)} title="Importar produtos via banco de dados">
          <form onSubmit={handleImportDb} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Driver">
              <select
                value={dbForm.driver}
                onChange={(e) => setDbForm((prev) => ({ ...prev, driver: e.target.value }))}
                style={{ ...inputStyle, paddingRight: 28 }}
              >
                <option value="postgres">Postgres</option>
              </select>
            </Field>

            <Field label="Connection string">
              <input
                type="text"
                value={dbForm.connectionString}
                onChange={(e) => setDbForm((prev) => ({ ...prev, connectionString: e.target.value }))}
                placeholder="postgres://user:pass@host:5432/dbname"
                style={inputStyle}
              />
            </Field>

            <Field label="Query">
              <textarea
                value={dbForm.query}
                onChange={(e) => setDbForm((prev) => ({ ...prev, query: e.target.value }))}
                rows={5}
                style={{ ...inputStyle, fontFamily: "monospace" }}
              />
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                A query deve retornar colunas: code, description, complement, brand, category e supplierName (ou supplierId). Status opcional.
                Exemplo: SELECT code, description, complement, brand, category, supplierName FROM produtos;
              </span>
            </Field>

            {dbMsg && <div style={{ fontSize: 12, color: dbMsg.toLowerCase().includes("erro") ? "#b91c1c" : "#15803d" }}>{dbMsg}</div>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDbModalOpen(false)}
                style={{ ...smallButton, fontSize: 12, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={dbLoading}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: dbLoading ? "not-allowed" : "pointer",
                }}
              >
                {dbLoading ? "Importando..." : "Importar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {blockInfo && (
        <DeletionConflictModal
          info={blockInfo}
          onClose={() => setBlockInfo(null)}
        />
      )}
    </div>
  );
}

async function readFileWithFallbackEncoding(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
  let text = utf8Decoder.decode(buf);
  if (text.includes("\uFFFD")) {
    const latin1Decoder = new TextDecoder("iso-8859-1", { fatal: false });
    const alt = latin1Decoder.decode(buf);
    // prefer the version with fewer replacement chars
    const countUtf8 = (text.match(/\uFFFD/g) || []).length;
    const countAlt = (alt.match(/\uFFFD/g) || []).length;
    text = countAlt < countUtf8 ? alt : text;
  }
  return text;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      role="dialog"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          width: 540,
          maxWidth: "90vw",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{ ...smallButton, fontSize: 14 }}
            aria-label="Fechar modal"
          >
            x
          </button>
        </div>
        <div>{children}</div>
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

const sampleTh: React.CSSProperties = {
  padding: "6px 8px",
  fontWeight: 700,
  fontSize: 11,
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  color: "#0f172a",
  background: "#f1f5f9",
};

const sampleTd: React.CSSProperties = {
  padding: "6px 8px",
  fontSize: 12,
  borderRight: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
  color: "#0f172a",
  background: "#ffffff",
};
