"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

const STATUS_STYLE: Record<
  string,
  { bg: string; text: string; softBg?: string }
> = {
  planejada: { bg: "#0ea5e9", text: "#f8fafc", softBg: "#e0f2fe" },
  em_producao: { bg: "#6366f1", text: "#f8fafc", softBg: "#e0e7ff" },
  aprovada: { bg: "#22c55e", text: "#f8fafc", softBg: "#dcfce7" },
  veiculando: { bg: "#a855f7", text: "#f8fafc", softBg: "#f3e8ff" },
  encerrada: { bg: "#9ca3af", text: "#0f172a", softBg: "#f3f4f6" },
};

// ---------- Pagina ----------
export default function CampanhasConteudoPage() {
  // base
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ativos, setAtivos] = useState<Asset[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // selecao
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

  const [editingItemId, setEditingItemId] = useState<number | null>(null);

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
        apiFetch(`${API_BASE}/api/fornecedores`),
        apiFetch(`${API_BASE}/api/ativos/ativos`),
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
      const res = await apiFetch(`${API_BASE}/api/campanhas`);
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

      const res = await apiFetch(`${API_BASE}/api/campanhas/${id}`);
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

  // ---------- handlers de formulario ----------
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

  // ---------- salvar cabecalho ----------
  async function handleSalvarHeader(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!headerForm.supplierId || !headerForm.name) {
      setErrorMsg("Fornecedor e nome da campanha sao obrigatorios.");
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

      const isEditing = Boolean(selectedCampanhaId);
      const url = isEditing
        ? `${API_BASE}/api/campanhas/${selectedCampanhaId}`
        : `${API_BASE}/api/campanhas`;
      const method: "POST" | "PUT" = isEditing ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
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

      await carregarListaCampanhas();

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
      setErrorMsg("Salve a campanha antes de adicionar pecas.");
      return;
    }
    if (!itemForm.assetId) {
      setErrorMsg("Selecione um ativo para a peca.");
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

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar peca.");
      }

      setSuccessMsg(
        editingItemId
          ? "Peca atualizada com sucesso."
          : "Peca criada com sucesso."
      );

      await carregarDetalheCampanha(selectedCampanhaId);
      resetItemForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar peca.");
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
    if (!window.confirm("Deseja realmente excluir esta peca?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await apiFetch(
        `${API_BASE}/api/campanhas/itens/${itemId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir peca.");
      }

      setSuccessMsg("Peca excluida com sucesso.");
      if (selectedCampanhaId) {
        await carregarDetalheCampanha(selectedCampanhaId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir peca.");
    }
  }

  const totalPecas = items.length;

  const listaCampanhas = useMemo(() => {
    return campanhas.map((c) => {
      const qtdItens = c.itens?.length ?? 0;
      const periodo = [c.startDate, c.endDate]
        .map((d) => (d ? formatDateBR(d) : null))
        .filter(Boolean)
        .join(" - ");
      return { ...c, qtdItens, periodo };
    });
  }, [campanhas]);

  // ---------- UI ----------
  return (
    <div className="panel-grid">
      {/* COLUNA ESQUERDA: lista de campanhas */}
      <section className="panel-card panel-card--soft">
        <header className="panel-card__header">
          <div>
            <p className="panel-eyebrow">Marketing / Campanhas</p>
            <h1 className="panel-title">Campanhas & Conteudo</h1>
            <p className="panel-sub">
              Area onde Marketing detalha campanhas vindas dos JBPs, cria pecas,
              anexa artes (creatives) e envia para aprovacao do Trade. Apenas
              acoes aprovadas aparecem no Calendario de Campanhas.
            </p>
          </div>
          <button
            type="button"
            onClick={resetHeaderForm}
            className="panel-ghost"
          >
            Nova campanha
          </button>
        </header>

        <div className="panel-toolbar">
          <span className="panel-muted">Campanhas cadastradas</span>
          <button
            type="button"
            onClick={carregarListaCampanhas}
            className="panel-ghost"
          >
            Atualizar
          </button>
        </div>

        {loadingList || loadingBase ? (
          <div className="panel-muted">Carregando campanhas...</div>
        ) : listaCampanhas.length === 0 ? (
          <div className="panel-muted">
            Nenhuma campanha cadastrada ainda. Clique em &quot;Nova campanha&quot;.
          </div>
        ) : (
          <div className="panel-list">
            {listaCampanhas.map((c) => {
              const isActive = selectedCampanhaId === c.id;
              const palette =
                STATUS_STYLE[c.status?.toLowerCase()] || STATUS_STYLE.planejada;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => carregarDetalheCampanha(c.id)}
                  className="panel-list__item"
                  style={{
                    backgroundColor: isActive ? palette.softBg || "#e0f2fe" : "",
                  }}
                >
                  <div className="panel-list__item-top">
                    <span className="panel-list__item-title">{c.name}</span>
                    <span
                      className="panel-badge"
                      style={{
                        backgroundColor: palette.bg,
                        color: palette.text,
                      }}
                    >
                      {c.status || "planejada"}
                    </span>
                  </div>
                  <div className="panel-list__item-sub">
                    {c.supplier
                      ? supplierLabel(c.supplier)
                      : "Fornecedor nao informado"} {""} {c.channel || "Canal nao definido"} {" "}
                    {c.periodo} {c.qtdItens} peca
                    {c.qtdItens === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* COLUNA DIREITA: detalhe da campanha + pecas */}
      <section className="panel-stack">
        {/* Cabecalho da campanha */}
        <section className="panel-card">
          <div className="panel-card__header">
            <h2 className="panel-title panel-title--sm">
              {selectedCampanhaId
                ? "Editar campanha"
                : "Nova campanha de marketing"}
            </h2>
            {loadingDetail && (
              <span className="panel-muted">Carregando detalhe...</span>
            )}
          </div>

          <form
            onSubmit={handleSalvarHeader}
            className="panel-form panel-form--2"
          >
            <Field label="Fornecedor *">
              <select
                name="supplierId"
                value={headerForm.supplierId}
                onChange={handleHeaderChange}
                className="panel-input"
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
                className="panel-input"
              />
            </Field>

            <Field label="Nome da campanha *">
              <input
                type="text"
                name="name"
                value={headerForm.name}
                onChange={handleHeaderChange}
                placeholder="Ex.: Volta as Aulas 2025"
                className="panel-input"
              />
            </Field>

            <Field label="Canal principal">
              <select
                name="channel"
                value={headerForm.channel}
                onChange={handleHeaderChange}
                className="panel-input"
              >
                <option value="">Selecione</option>
                <option value="LOJA_FISICA">Loja fisica</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="APP">App</option>
                <option value="MULTICANAL">Multicanal</option>
              </select>
            </Field>

            <Field label="Inicio">
              <input
                type="date"
                name="startDate"
                value={headerForm.startDate}
                onChange={handleHeaderChange}
                className="panel-input"
              />
            </Field>

            <Field label="Fim">
              <input
                type="date"
                name="endDate"
                value={headerForm.endDate}
                onChange={handleHeaderChange}
                className="panel-input"
              />
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={headerForm.status}
                onChange={handleHeaderChange}
                className="panel-input"
              >
                <option value="planejada">Planejada</option>
                <option value="em_producao">Em producao</option>
                <option value="aprovada">Aprovada</option>
                <option value="veiculando">Veiculando</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </Field>

            <div className="panel-form__full">
              <Field label="Objetivo">
                <textarea
                  name="objective"
                  value={headerForm.objective}
                  onChange={handleHeaderChange}
                  rows={2}
                  className="panel-input panel-textarea"
                  placeholder="Ex.: aumentar sell-out em 10% na categoria, crescer base de clientes no app..."
                />
              </Field>
            </div>

            {errorMsg && (
              <div className="panel-feedback panel-feedback--error">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="panel-feedback panel-feedback--success">
                {successMsg}
              </div>
            )}

            <div className="panel-actions panel-actions--end panel-form__full">
              <button
                type="submit"
                disabled={savingHeader}
                className="ct-btn-primary"
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

        {/* Pecas & entregas */}
        <section className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-title panel-title--sm">
                Pecas & entregas da campanha
              </h2>
              <p className="panel-muted">
                Cadastre as pecas aprovadas, prazos e links de arte/destino.
              </p>
            </div>
            <span className="panel-pill">
              {totalPecas} peca{totalPecas === 1 ? "" : "s"}
            </span>
          </div>

          <form
            onSubmit={handleSalvarItem}
            className="panel-form panel-form--4 panel-form--tight"
          >
            <Field label="Ativo *">
              <select
                name="assetId"
                value={itemForm.assetId}
                onChange={handleItemChange}
                className="panel-input"
              >
                <option value="">Selecione</option>
                {ativos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.channel})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Titulo da peca">
              <input
                type="text"
                name="title"
                value={itemForm.title}
                onChange={handleItemChange}
                placeholder="Ex.: Banner home 970x250"
                className="panel-input"
              />
            </Field>

            <Field label="Tipo de conteudo">
              <input
                type="text"
                name="contentType"
                value={itemForm.contentType}
                onChange={handleItemChange}
                placeholder="banner, video, push..."
                className="panel-input"
              />
            </Field>

            <Field label="JBP Item (opcional)">
              <input
                type="number"
                name="jbpItemId"
                value={itemForm.jbpItemId}
                onChange={handleItemChange}
                placeholder="ID do item no JBP"
                className="panel-input"
              />
            </Field>

            <Field label="Prazo arte">
              <input
                type="date"
                name="artDeadline"
                value={itemForm.artDeadline}
                onChange={handleItemChange}
                className="panel-input"
              />
            </Field>

            <Field label="Prazo aprovacao">
              <input
                type="date"
                name="approvalDeadline"
                value={itemForm.approvalDeadline}
                onChange={handleItemChange}
                className="panel-input"
              />
            </Field>

            <Field label="Data veiculacao (go live)">
              <input
                type="date"
                name="goLiveDate"
                value={itemForm.goLiveDate}
                onChange={handleItemChange}
                className="panel-input"
              />
            </Field>

            <Field label="URL de destino">
              <input
                type="text"
                name="urlDestino"
                value={itemForm.urlDestino}
                onChange={handleItemChange}
                placeholder="https://..."
                className="panel-input"
              />
            </Field>

            <div className="panel-form__span2">
              <Field label="Link da arte (creative)">
                <input
                  type="text"
                  name="creativeUrl"
                  value={itemForm.creativeUrl}
                  onChange={handleItemChange}
                  placeholder="Link para a arte (Canva, Figma, imagem...)"
                  className="panel-input"
                />
              </Field>
            </div>

            <div className="panel-form__span2">
              <Field label="Status de aprovacao">
                <select
                  name="approvalStatus"
                  value={itemForm.approvalStatus}
                  onChange={handleItemChange}
                  className="panel-input"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="pendente_trade">Pendente Trade</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="reprovado">Reprovado</option>
                </select>
              </Field>
            </div>

            <div className="panel-form__full">
              <Field label="Notas">
                <textarea
                  name="notes"
                  value={itemForm.notes}
                  onChange={handleItemChange}
                  rows={2}
                  className="panel-input panel-textarea"
                />
              </Field>
            </div>

            <div className="panel-actions panel-actions--end panel-form__full">
              {editingItemId && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="panel-ghost"
                >
                  Cancelar edicao
                </button>
              )}
              <button
                type="submit"
                disabled={savingItem}
                className="ct-btn-primary"
              >
                {savingItem
                  ? "Salvando peca..."
                  : editingItemId
                  ? "Salvar peca"
                  : "Adicionar peca"}
              </button>
            </div>
          </form>

          {items.length === 0 ? (
            <div className="panel-muted">
              Nenhuma peca cadastrada ainda. Use o formulario acima para
              configurar as entregas da campanha.
            </div>
          ) : (
            <div className="panel-table__wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <Th>Peca</Th>
                    <Th>Ativo</Th>
                    <Th>Canal</Th>
                    <Th>Go live</Th>
                    <Th>Aprovacao</Th>
                    <Th>Arte</Th>
                    <Th>Destino</Th>
                    <Th>Acoes</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <Td>
                        <div className="panel-table__cell">
                          <span>{it.title || "(sem titulo)"}</span>
                          <span className="panel-muted">
                            {it.contentType || "-"}
                          </span>
                        </div>
                      </Td>
                      <Td>{it.asset?.name || "Ativo #"}</Td>
                      <Td>{it.asset?.channel || "-"}</Td>
                      <Td>{formatDateBR(it.goLiveDate)}</Td>
                      <Td>
                        <span
                          className="panel-badge panel-badge--soft"
                          style={{
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
                            className="panel-link"
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
                            className="panel-link"
                          >
                            Link
                          </a>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td>
                        <div className="panel-actions panel-actions--inline">
                          <button
                            type="button"
                            onClick={() => handleEditarItem(it)}
                            className="panel-link-btn"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirItem(it.id)}
                            className="panel-link-btn panel-link-btn--danger"
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

// ---------- componentes utilitarios ----------
function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel-field">
      <label className="panel-field__label">{props.label}</label>
      {props.children}
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="panel-table__th">{children}</th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="panel-table__td">{children}</td>
);
