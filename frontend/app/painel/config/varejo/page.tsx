"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeletionBlockInfo, DeletionConflictModal } from "../../components/DeletionConflictModal";

type Varejo = {
  id: number;
  tenantId?: number;
  name: string;
  document?: string | null;
  segment?: string | null;
  channel?: string | null;
  status: string;
  createdAt?: string;
};

type Usuario = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  accessChannel?: string;
  retailId?: number | null;
  tenantId?: number | null;
};

export default function ConfigVarejoPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [varejos, setVarejos] = useState<Varejo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [linkMsg, setLinkMsg] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ id: number; tenantId?: number | null; name: string } | null>(null);
  const [blockInfo, setBlockInfo] = useState<DeletionBlockInfo | null>(null);

  const [form, setForm] = useState({
    name: "",
    document: "",
    segment: "",
    channel: "VAREJO",
    status: "ativo",
  });

  const varejoMap = useMemo(() => {
    const map = new Map<number, Varejo>();
    varejos.forEach((v) => map.set(v.id, v));
    return map;
  }, [varejos]);

  function getTokenOrFail() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("conexao_trade_token")
        : null;
    return token || "";
  }

  const carregarVarejos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/varejos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao carregar varejos.");

      setVarejos(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar varejos.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    carregarVarejos();
  }, [carregarVarejos]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNovo() {
    setEditingId(null);
    setForm({
      name: "",
      document: "",
      segment: "",
      channel: "VAREJO",
      status: "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
    setLastCreated(null);
  }

  function handleEditar(v: Varejo) {
    setEditingId(v.id);
    setForm({
      name: v.name || "",
      document: v.document || "",
      segment: v.segment || "",
      channel: v.channel || "VAREJO",
      status: v.status || "ativo",
    });
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name) {
      setErrorMsg("Nome do varejo e obrigatorio.");
      return;
    }

    try {
      setSaving(true);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const payload = {
        name: form.name,
        document: form.document || null,
        segment: form.segment || null,
        channel: form.channel || "VAREJO",
        status: form.status || "ativo",
      };

      const url = editingId
        ? `${apiBaseUrl}/api/varejos/${editingId}`
        : `${apiBaseUrl}/api/varejos`;
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
      if (!res.ok) throw new Error(data.message || "Erro ao salvar varejo.");

      setSuccessMsg(
        editingId ? "Varejo atualizado com sucesso." : "Varejo criado com sucesso."
      );

      await carregarVarejos();

      if (!editingId && data?.varejo) {
        setLastCreated({
          id: data.varejo.id,
          tenantId: data.varejo.tenantId,
          name: data.varejo.name,
        });
        setLinkModalOpen(true);
      }

      if (!editingId) handleNovo();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao salvar varejo.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!window.confirm("Deseja realmente excluir este varejo?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      setBlockInfo(null);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/varejos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data?.conflicts) && data.conflicts.length) {
          const nome = varejoMap.get(id)?.name || "Varejo";
          setBlockInfo({
            title: `Nao foi possivel excluir ${nome}`,
            message: data.message || "Este varejo possui vinculacoes que impedem a exclusao.",
            conflicts: data.conflicts,
          });
        }
        setErrorMsg(data.message || "Erro ao excluir varejo.");
        return;
      }

      setSuccessMsg(data.message || "Varejo excluido/inativado com sucesso.");
      await carregarVarejos();
      if (editingId === id) handleNovo();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao excluir varejo.";
      setErrorMsg(message);
    }
  }

  async function handleToggleStatus(v: Varejo) {
    const novoStatus = v.status === "ativo" ? "inativo" : "ativo";
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/varejos/${v.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar status.");

      setSuccessMsg("Status do varejo atualizado.");
      await carregarVarejos();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao atualizar status.";
      setErrorMsg(message);
    }
  }

  async function carregarUsuariosSePreciso() {
    if (usuarios.length > 0) return;
    try {
      setLinkLoading(true);
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao carregar usuarios.");
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar usuarios.";
      setLinkMsg(message);
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleVincularUsuario() {
    if (!lastCreated) {
      setLinkModalOpen(false);
      return;
    }
    if (!selectedUserId) {
      setLinkMsg("Selecione um usuario para vincular.");
      return;
    }
    try {
      setLinkLoading(true);
      setLinkMsg("");
      const token = getTokenOrFail();
      if (!token) throw new Error("Token ausente. Faca login novamente.");

      const res = await fetch(`${apiBaseUrl}/api/usuarios/${selectedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: lastCreated.tenantId,
          retailId: lastCreated.id,
          supplierId: null,
          accessChannel: "varejo",
          role: "TENANT_ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao vincular usuario.");

      setLinkMsg("Usuario vinculado como admin deste varejo.");
      setSelectedUserId("");
      await carregarUsuariosSePreciso();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao vincular usuario.";
      setLinkMsg(message);
    } finally {
      setLinkLoading(false);
    }
  }

  const usuariosAtivos = usuarios.filter((u) => u.status === "ativo");

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
        Varejo
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Cadastre redes ou clientes de varejo. Cada cadastro cria um novo tenant para
        isolar acessos e permitir vinculo de fornecedores e produtos.
      </p>

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
              {editingId ? "Editar varejo" : "Novo varejo (gera tenant)"}
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
            <Field label="Nome do varejo">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex.: Supermercado Lima"
                style={inputStyle}
              />
            </Field>

            <Field label="Documento (CNPJ/CPF)">
              <input
                type="text"
                name="document"
                value={form.document}
                onChange={handleChange}
                placeholder="00.000.000/0001-00"
                style={inputStyle}
              />
            </Field>

            <Field label="Segmento">
              <input
                type="text"
                name="segment"
                value={form.segment}
                onChange={handleChange}
                placeholder="Ex.: Supermercado, Farma, Conveniencia"
                style={inputStyle}
              />
            </Field>

            <Field label="Canal">
              <input
                type="text"
                name="channel"
                value={form.channel}
                onChange={handleChange}
                placeholder="VAREJO, FARMA..."
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
              {saving
                ? editingId
                  ? "Salvando..."
                  : "Criando..."
                : editingId
                ? "Salvar alteracoes"
                : "Criar varejo/tenant"}
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
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Lista de varejos</h2>
            <button
              type="button"
              onClick={carregarVarejos}
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
          ) : varejos.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Nenhum varejo cadastrado ainda.</div>
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
                    <Th>Nome</Th>
                    <Th>Documento</Th>
                    <Th>Segmento</Th>
                    <Th>Canal</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Acao</Th>
                  </tr>
                </thead>
                <tbody>
                  {varejos.map((v) => (
                    <tr key={v.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <Td>{v.name}</Td>
                      <Td>{v.document || "-"}</Td>
                      <Td>{v.segment || "-"}</Td>
                      <Td>{v.channel || "-"}</Td>
                      <Td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            backgroundColor:
                              v.status === "ativo" ? "rgba(22,163,74,0.08)" : "rgba(148,163,184,0.18)",
                            color: v.status === "ativo" ? "#15803d" : "#4b5563",
                          }}
                        >
                          {v.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </Td>
                      <Td>
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </Td>
                      <Td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => handleEditar(v)} style={smallButton}>
                            Editar
                          </button>
                          <button type="button" onClick={() => handleToggleStatus(v)} style={smallButton}>
                            {v.status === "ativo" ? "Inativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(v.id)}
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

      {linkModalOpen && lastCreated && (
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
              width: 400,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Vincular usuario ao varejo</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {lastCreated.name} - tenant #{lastCreated.tenantId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false);
                  setLinkMsg("");
                  setSelectedUserId("");
                }}
                style={{ ...smallButton, fontSize: 14 }}
                aria-label="Fechar"
              >
                x
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 10 }}>
              Deseja adicionar um usuario para administrar este varejo agora? Ele sera marcado como TENANT_ADMIN no canal varejo.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>Usuario</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                onFocus={carregarUsuariosSePreciso}
                style={{ ...inputStyle, paddingRight: 28 }}
              >
                <option value="">Selecione um usuario ativo</option>
                {usuariosAtivos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {linkMsg && (
              <div style={{ fontSize: 12, color: linkMsg.toLowerCase().includes("erro") ? "#b91c1c" : "#15803d", marginTop: 6 }}>
                {linkMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false);
                  setLinkMsg("");
                  setSelectedUserId("");
                }}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Agora nao
              </button>
              <button
                type="button"
                onClick={handleVincularUsuario}
                disabled={linkLoading}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: "#0f172a",
                  color: "#fff",
                  cursor: linkLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {linkLoading ? "Vinculando..." : "Vincular usuario"}
              </button>
            </div>
          </div>
        </div>
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
