"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------- Tipos base ----------
type Supplier = {
  id: number;
  name?: string;
  nome?: string;
  fantasia?: string;
};

type Asset = {
  id: number;
  name: string;
  channel: string;
};

type CampanhaItem = {
  id: number;
  campanhaId: number;
  jbpItemId: number | null;
  assetId: number;
  title: string | null;
  contentType: string | null;
  artDeadline: string | null;
  approvalDeadline: string | null;
  goLiveDate: string | null;
  urlDestino: string | null;
  notes: string | null;
  creativeUrl: string | null;
  approvalStatus: string;
  asset?: Asset;
};

type Campanha = {
  id: number;
  supplierId: number;
  jbpId: number | null;
  name: string;
  objective: string | null;
  channel: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  supplier?: Supplier;
  itens?: CampanhaItem[];
};

// ---------- Helpers ----------
function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function supplierLabel(s: Supplier): string {
  return s.name || s.nome || s.fantasia || `Fornecedor #${s.id}`;
}

// ---------- Página ----------
export default function CampanhasConteudoPage() {
  // base
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ativos, setAtivos] = useState<Asset[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // seleção
  const [selectedCampanhaId, setSelectedCampanhaId] = useState<
    number | null
  >(null);
  const [items, setItems] = useState<CampanhaItem[]>([]);

  // forms
  const [headerForm, setHeaderForm] = useState({
    supplierId: "",
    jbpId: "",
    name: "",
    objective: "",
    channel: "",
    startDate: "",
    endDate: "",
    status: "planejada",
  });

  const [itemForm, setItemForm] = useState({
    jbpItemId: "",
    assetId: "",
    title: "",
    contentType: "",
    artDeadline: "",
    approvalDeadline: "",
    goLiveDate: "",
    urlDestino: "",
    notes: "",
    creativeUrl: "",
    approvalStatus: "rascunho",
  });

  const [editingItemId, setEditingItemId] = useState<number | null>(
    null
  );

  // feedback
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---------- carregamento inicial ----------
  useEffect(() => {
    carregarBase();
    carregarListaCampanhas();
  }, []);

  async function carregarBase() {
    try {
      setLoadingBase(true);
      const [resFor, resAtv] = await Promise.all([
        fetch(`${API_BASE}/api/fornecedores`),
        fetch(`${API_BASE}/api/ativos/ativos`),
      ]);

      const dataFor = await resFor.json();
      const dataAtv = await resAtv.json();

      if (!resFor.ok) {
        throw new Error(dataFor.message || "Erro ao carregar fornecedores.");
      }
      if (!resAtv.ok) {
        throw new Error(dataAtv.message || "Erro ao carregar ativos.");
      }

      setSuppliers(dataFor);
      setAtivos(dataAtv);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Erro ao carregar dados base (fornecedores/ativos)."
      );
    } finally {
      setLoadingBase(false);
    }
  }

  async function carregarListaCampanhas() {
    try {
      setLoadingList(true);
      const res = await fetch(`${API_BASE}/api/campanhas`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao listar campanhas.");
      }

      setCampanhas(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao listar campanhas.");
    } finally {
      setLoadingList(false);
    }
  }

  async function carregarDetalheCampanha(id: number) {
    try {
      setLoadingDetail(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${API_BASE}/api/campanhas/${id}`);
      const data: Campanha = await res.json();

      if (!res.ok) {
        throw new Error((data as any).message || "Erro ao carregar campanha.");
      }

      setSelectedCampanhaId(id);
      setItems(data.itens || []);

      setHeaderForm({
        supplierId: String(data.supplierId),
        jbpId:
          data.jbpId !== null && data.jbpId !== undefined
            ? String(data.jbpId)
            : "",
        name: data.name || "",
        objective: data.objective || "",
        channel: data.channel || "",
        startDate: toInputDate(data.startDate),
        endDate: toInputDate(data.endDate),
        status: data.status || "planejada",
      });

      resetItemForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar campanha.");
    } finally {
      setLoadingDetail(false);
    }
  }

  // ---------- handlers de formulário ----------
  function handleHeaderChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setHeaderForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetHeaderForm() {
    setSelectedCampanhaId(null);
    setItems([]);
    setHeaderForm({
      supplierId: "",
      jbpId: "",
      name: "",
      objective: "",
      channel: "",
      startDate: "",
      endDate: "",
      status: "planejada",
    });
    resetItemForm();
    setErrorMsg("");
    setSuccessMsg("");
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemForm({
      jbpItemId: "",
      assetId: "",
      title: "",
      contentType: "",
      artDeadline: "",
      approvalDeadline: "",
      goLiveDate: "",
      urlDestino: "",
      notes: "",
      creativeUrl: "",
      approvalStatus: "rascunho",
    });
  }

  // ---------- salvar cabeçalho ----------
  async function handleSalvarHeader(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!headerForm.supplierId || !headerForm.name) {
      setErrorMsg("Fornecedor e nome da campanha são obrigatórios.");
      return;
    }

    try {
      setSavingHeader(true);

      const payload = {
        supplierId: Number(headerForm.supplierId),
        jbpId: headerForm.jbpId ? Number(headerForm.jbpId) : null,
        name: headerForm.name,
        objective: headerForm.objective || null,
        channel: headerForm.channel || null,
        startDate: headerForm.startDate || null,
        endDate: headerForm.endDate || null,
        status: headerForm.status || "planejada",
      };

      let url = `${API_BASE}/api/campanhas`;
      let method: "POST" | "PUT" = "POST";

      if (selectedCampanhaId) {
        url = `${API_BASE}/api/campanhas/${selectedCampanhaId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar campanha.");
      }

      setSuccessMsg(
        selectedCampanhaId
          ? "Campanha atualizada com sucesso."
          : "Campanha criada com sucesso."
      );

      // recarrega lista
      await carregarListaCampanhas();

      // se for nova, já carregar o detalhe
      if (!selectedCampanhaId) {
        await carregarDetalheCampanha(data.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar campanha.");
    } finally {
      setSavingHeader(false);
    }
  }

  // ---------- salvar item ----------
  async function handleSalvarItem(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedCampanhaId) {
      setErrorMsg("Salve a campanha antes de adicionar peças.");
      return;
    }
    if (!itemForm.assetId) {
      setErrorMsg("Selecione um ativo para a peça.");
      return;
    }

    try {
      setSavingItem(true);

      const payload = {
        jbpItemId: itemForm.jbpItemId ? Number(itemForm.jbpItemId) : null,
        assetId: Number(itemForm.assetId),
        title: itemForm.title || null,
        contentType: itemForm.contentType || null,
        artDeadline: itemForm.artDeadline || null,
        approvalDeadline: itemForm.approvalDeadline || null,
        goLiveDate: itemForm.goLiveDate || null,
        urlDestino: itemForm.urlDestino || null,
        notes: itemForm.notes || null,
        creativeUrl: itemForm.creativeUrl || null,
        approvalStatus: itemForm.approvalStatus || "rascunho",
      };

      let url: string;
      let method: "POST" | "PUT";

      if (editingItemId) {
        url = `${API_BASE}/api/campanhas/itens/${editingItemId}`;
        method = "PUT";
      } else {
        url = `${API_BASE}/api/campanhas/${selectedCampanhaId}/itens`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar peça.");
      }

      setSuccessMsg(
        editingItemId
          ? "Peça atualizada com sucesso."
          : "Peça criada com sucesso."
      );

      await carregarDetalheCampanha(selectedCampanhaId);
      resetItemForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar peça.");
    } finally {
      setSavingItem(false);
    }
  }

  function handleEditarItem(item: CampanhaItem) {
    setEditingItemId(item.id);
    setItemForm({
      jbpItemId:
        item.jbpItemId !== null && item.jbpItemId !== undefined
          ? String(item.jbpItemId)
          : "",
      assetId: String(item.assetId),
      title: item.title || "",
      contentType: item.contentType || "",
      artDeadline: toInputDate(item.artDeadline),
      approvalDeadline: toInputDate(item.approvalDeadline),
      goLiveDate: toInputDate(item.goLiveDate),
      urlDestino: item.urlDestino || "",
      notes: item.notes || "",
      creativeUrl: item.creativeUrl || "",
      approvalStatus: item.approvalStatus || "rascunho",
    });
  }

  async function handleExcluirItem(itemId: number) {
    if (!window.confirm("Deseja realmente excluir esta peça?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(
        `${API_BASE}/api/campanhas/itens/${itemId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir peça.");
      }

      setSuccessMsg("Peça excluída com sucesso.");
      if (selectedCampanhaId) {
        await carregarDetalheCampanha(selectedCampanhaId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir peça.");
    }
  }

  const totalPecas = items.length;

  // ---------- UI ----------
  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.5fr)",
        gap: 18,
        alignItems: "flex-start",
      }}
    >
      {/* COLUNA ESQUERDA: lista de campanhas */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Campanhas & Conteúdo
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Área onde Marketing detalha as campanhas vindas dos JBPs,
              cria peças, anexa artes (creatives) e envia para aprovação
              do Trade. Apenas ações aprovadas aparecerão no Calendário de
              Campanhas.
            </p>
          </div>

          <button
            type="button"
            onClick={resetHeaderForm}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "6px 12px",
              background: "#ffffff",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Nova campanha
          </button>
        </div>

        <div
          style={{
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            Campanhas cadastradas
          </span>
          <button
            type="button"
            onClick={carregarListaCampanhas}
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

        {loadingList || loadingBase ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Carregando campanhas...
          </div>
        ) : campanhas.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Nenhuma campanha cadastrada ainda. Clique em &quot;Nova
            campanha&quot; para começar.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {campanhas.map((c) => {
              const isActive = selectedCampanhaId === c.id;
              const qtdItens = c.itens?.length ?? 0;

              const periodo = [
                c.startDate ? formatDateBR(c.startDate) : null,
                c.endDate ? formatDateBR(c.endDate) : null,
              ]
                .filter(Boolean)
                .join(" → ");

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => carregarDetalheCampanha(c.id)}
                  style={{
                    textAlign: "left",
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    backgroundColor: isActive ? "#e0f2fe" : "#f9fafb",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: "#0f172a",
                        color: "#e0f2fe",
                      }}
                    >
                      {c.status || "planejada"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {c.supplier
                      ? supplierLabel(c.supplier)
                      : "Fornecedor não informado"}{" "}
                    • {c.channel || "Canal não definido"}{" "}
                    {periodo && `• ${periodo}`} • {qtdItens} peça
                    {qtdItens === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* COLUNA DIREITA: detalhe da campanha + peças */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Cabeçalho da campanha */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              {selectedCampanhaId
                ? "Editar campanha"
                : "Nova campanha de marketing"}
            </h2>

            {loadingDetail && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Carregando detalhe...
              </span>
            )}
          </div>

          <form
            onSubmit={handleSalvarHeader}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <Field label="Fornecedor *">
              <select
                name="supplierId"
                value={headerForm.supplierId}
                onChange={handleHeaderChange}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {suppliers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {supplierLabel(f)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="JBP relacionado (opcional)">
              <input
                type="number"
                name="jbpId"
                value={headerForm.jbpId}
                onChange={handleHeaderChange}
                placeholder="ID do JBP"
                style={inputStyle}
              />
            </Field>

            <Field label="Nome da campanha *">
              <input
                type="text"
                name="name"
                value={headerForm.name}
                onChange={handleHeaderChange}
                placeholder="Ex.: Volta às Aulas 2025"
                style={inputStyle}
              />
            </Field>

            <Field label="Canal principal">
              <select
                name="channel"
                value={headerForm.channel}
                onChange={handleHeaderChange}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                <option value="LOJA_FISICA">Loja física</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="APP">App</option>
                <option value="MULTICANAL">Multicanal</option>
              </select>
            </Field>

            <Field label="Início">
              <input
                type="date"
                name="startDate"
                value={headerForm.startDate}
                onChange={handleHeaderChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Fim">
              <input
                type="date"
                name="endDate"
                value={headerForm.endDate}
                onChange={handleHeaderChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={headerForm.status}
                onChange={handleHeaderChange}
                style={inputStyle}
              >
                <option value="planejada">Planejada</option>
                <option value="em_producao">Em produção</option>
                <option value="aprovada">Aprovada</option>
                <option value="veiculando">Veiculando</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Objetivo">
                <textarea
                  name="objective"
                  value={headerForm.objective}
                  onChange={handleHeaderChange}
                  rows={2}
                  placeholder="Ex.: aumentar sell-out em 10% na categoria, crescer base de clientes no app..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
            </div>

            {errorMsg && (
              <div
                style={{
                  gridColumn: "1 / -1",
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
                  gridColumn: "1 / -1",
                  fontSize: 12,
                  color: "#15803d",
                }}
              >
                {successMsg}
              </div>
            )}

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <button
                type="submit"
                disabled={savingHeader}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: savingHeader ? "not-allowed" : "pointer",
                }}
              >
                {savingHeader
                  ? "Salvando..."
                  : selectedCampanhaId
                  ? "Salvar campanha"
                  : "Criar campanha"}
              </button>
            </div>
          </form>
        </section>

        {/* Peças & entregas */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Peças & entregas da campanha
            </h2>

            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              {totalPecas} peça{totalPecas === 1 ? "" : "s"}
            </span>
          </div>

          <form
            onSubmit={handleSalvarItem}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Field label="Ativo *">
              <select
                name="assetId"
                value={itemForm.assetId}
                onChange={handleItemChange}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {ativos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.channel})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título da peça">
              <input
                type="text"
                name="title"
                value={itemForm.title}
                onChange={handleItemChange}
                placeholder="Ex.: Banner home 970x250"
                style={inputStyle}
              />
            </Field>

            <Field label="Tipo de conteúdo">
              <input
                type="text"
                name="contentType"
                value={itemForm.contentType}
                onChange={handleItemChange}
                placeholder="banner, vídeo, push..."
                style={inputStyle}
              />
            </Field>

            <Field label="JBP Item (opcional)">
              <input
                type="number"
                name="jbpItemId"
                value={itemForm.jbpItemId}
                onChange={handleItemChange}
                placeholder="ID do item no JBP"
                style={inputStyle}
              />
            </Field>

            <Field label="Prazo arte">
              <input
                type="date"
                name="artDeadline"
                value={itemForm.artDeadline}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Prazo aprovação">
              <input
                type="date"
                name="approvalDeadline"
                value={itemForm.approvalDeadline}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Data veiculação (go live)">
              <input
                type="date"
                name="goLiveDate"
                value={itemForm.goLiveDate}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="URL de destino">
              <input
                type="text"
                name="urlDestino"
                value={itemForm.urlDestino}
                onChange={handleItemChange}
                placeholder="https://..."
                style={inputStyle}
              />
            </Field>

            <div style={{ gridColumn: "1 / 3" }}>
              <Field label="Link da arte (creative)">
                <input
                  type="text"
                  name="creativeUrl"
                  value={itemForm.creativeUrl}
                  onChange={handleItemChange}
                  placeholder="Link para a arte (Canva, Figma, imagem...)"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ gridColumn: "3 / -1" }}>
              <Field label="Status de aprovação">
                <select
                  name="approvalStatus"
                  value={itemForm.approvalStatus}
                  onChange={handleItemChange}
                  style={inputStyle}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="pendente_trade">Pendente Trade</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="reprovado">Reprovado</option>
                </select>
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Notas">
                <textarea
                  name="notes"
                  value={itemForm.notes}
                  onChange={handleItemChange}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              {editingItemId && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  style={{
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    padding: "7px 12px",
                    background: "#ffffff",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar edição
                </button>
              )}
              <button
                type="submit"
                disabled={savingItem}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  border: "none",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: savingItem ? "not-allowed" : "pointer",
                }}
              >
                {savingItem
                  ? "Salvando peça..."
                  : editingItemId
                  ? "Salvar peça"
                  : "Adicionar peça"}
              </button>
            </div>
          </form>

          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Nenhuma peça cadastrada ainda. Use o formulário acima para
              configurar as entregas da campanha.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f9fafb",
                      textAlign: "left",
                    }}
                  >
                    <Th>Peça</Th>
                    <Th>Ativo</Th>
                    <Th>Canal</Th>
                    <Th>Go live</Th>
                    <Th>Aprovação</Th>
                    <Th>Arte</Th>
                    <Th>Destino</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <Td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <span>{it.title || "(sem título)"}</span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#6b7280",
                            }}
                          >
                            {it.contentType || "-"}
                          </span>
                        </div>
                      </Td>
                      <Td>{it.asset?.name || `Ativo #${it.assetId}`}</Td>
                      <Td>{it.asset?.channel || "-"}</Td>
                      <Td>{formatDateBR(it.goLiveDate)}</Td>
                      <Td>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 999,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            backgroundColor:
                              it.approvalStatus === "aprovado"
                                ? "#dcfce7"
                                : it.approvalStatus === "reprovado"
                                ? "#fee2e2"
                                : it.approvalStatus === "pendente_trade"
                                ? "#fef3c7"
                                : "#e5e7eb",
                            color:
                              it.approvalStatus === "aprovado"
                                ? "#166534"
                                : it.approvalStatus === "reprovado"
                                ? "#991b1b"
                                : it.approvalStatus === "pendente_trade"
                                ? "#92400e"
                                : "#374151",
                          }}
                        >
                          {it.approvalStatus || "rascunho"}
                        </span>
                      </Td>
                      <Td>
                        {it.creativeUrl ? (
                          <a
                            href={it.creativeUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 10,
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            Ver arte
                          </a>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td>
                        {it.urlDestino ? (
                          <a
                            href={it.urlDestino}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 10,
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            Link
                          </a>
                        ) : (
                          "-"
                        )}
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
                            onClick={() => handleEditarItem(it)}
                            style={smallButton}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirItem(it.id)}
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
      </section>
    </div>
  );
}

// ---------- componentes utilitários ----------
function Field(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {props.label}
      </label>
      {props.children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 12,
  outline: "none",
};

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    style={{
      padding: "6px 8px",
      fontWeight: 600,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#6b7280",
      whiteSpace: "nowrap",
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
      verticalAlign: "top",
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
