"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function JbpJvcPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [jbps, setJbps] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<any[]>([]);

  const [selectedJbpId, setSelectedJbpId] = useState<number | null>(null);
  const [selectedJbp, setSelectedJbp] = useState<any>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [headerForm, setHeaderForm] = useState({
    supplierId: "",
    name: "",
    year: "",
    periodStart: "",
    periodEnd: "",
    strategy: "",
    kpiSummary: "",
    totalBudget: "",
    status: "rascunho",
  });

  const [items, setItems] = useState<any[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    assetId: "",
    initiativeType: "JBP",
    description: "",
    periodStart: "",
    periodEnd: "",
    storeScope: "",
    unit: "",
    quantity: "",
    negotiatedUnitPrice: "",
    totalValue: "",
    notes: "",
  });

  // Carregar fornecedores, ativos, e lista de JBPs
  useEffect(() => {
    carregarBase();
    carregarListaJbps();
  }, []);

  async function carregarBase() {
    try {
      // Fornecedores
      const resFor = await apiFetch(`${apiBaseUrl}/api/fornecedores`);
      const dataFor = await resFor.json();

      // Ativos (apenas ativos)
      const resAtv = await apiFetch(`${apiBaseUrl}/api/ativos/ativos`);
      const dataAtv = await resAtv.json();

      if (!resFor.ok) throw new Error(dataFor.message || "Erro ao carregar fornecedores.");
      if (!resAtv.ok) throw new Error(dataAtv.message || "Erro ao carregar ativos.");

      setSuppliers(dataFor);
      setAtivos(dataAtv);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar dados base (fornecedores/ativos).");
    }
  }

  async function carregarListaJbps() {
    try {
      setLoadingList(true);
      setErrorMsg("");
      const res = await apiFetch(`${apiBaseUrl}/api/jbp`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao listar JBPs.");
      }
      setJbps(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao listar JBPs.");
    } finally {
      setLoadingList(false);
    }
  }

  async function carregarDetalheJbp(id: number) {
    try {
      setLoadingDetail(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await apiFetch(`${apiBaseUrl}/api/jbp/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar JBP.");
      }

      setSelectedJbpId(id);
      setSelectedJbp(data);

      setHeaderForm({
        supplierId: String(data.supplierId),
        name: data.name || "",
        year: data.year !== null && data.year !== undefined ? String(data.year) : "",
        periodStart: data.periodStart ? data.periodStart.substring(0, 10) : "",
        periodEnd: data.periodEnd ? data.periodEnd.substring(0, 10) : "",
        strategy: data.strategy || "",
        kpiSummary: data.kpiSummary || "",
        totalBudget:
          data.totalBudget !== null && data.totalBudget !== undefined
            ? String(data.totalBudget)
            : "",
        status: data.status || "rascunho",
      });

      setItems(data.itens || []);
      resetItemForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar JBP.");
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleHeaderChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setHeaderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleItemChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetHeaderForm() {
    setSelectedJbpId(null);
    setSelectedJbp(null);
    setItems([]);
    setHeaderForm({
      supplierId: "",
      name: "",
      year: "",
      periodStart: "",
      periodEnd: "",
      strategy: "",
      kpiSummary: "",
      totalBudget: "",
      status: "rascunho",
    });
    resetItemForm();
    setErrorMsg("");
    setSuccessMsg("");
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemForm({
      assetId: "",
      initiativeType: "JBP",
      description: "",
      periodStart: "",
      periodEnd: "",
      storeScope: "",
      unit: "",
      quantity: "",
      negotiatedUnitPrice: "",
      totalValue: "",
      notes: "",
    });
  }

  async function handleSalvarHeader(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!headerForm.supplierId || !headerForm.name) {
      setErrorMsg("Fornecedor e nome do plano são obrigatórios.");
      return;
    }

    try {
      setSavingHeader(true);

      const payload = {
        supplierId: headerForm.supplierId,
        name: headerForm.name,
        year: headerForm.year || null,
        periodStart: headerForm.periodStart || null,
        periodEnd: headerForm.periodEnd || null,
        strategy: headerForm.strategy || null,
        kpiSummary: headerForm.kpiSummary || null,
        totalBudget: headerForm.totalBudget || null,
        status: headerForm.status || "rascunho",
      };

      let url = `${apiBaseUrl}/api/jbp`;
      let method = "POST";

      if (selectedJbpId) {
        url = `${apiBaseUrl}/api/jbp/${selectedJbpId}`;
        method = "PUT";
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar JBP.");
      }

      setSuccessMsg(
        selectedJbpId
          ? "Plano JBP atualizado com sucesso."
          : "Plano JBP criado com sucesso."
      );

      await carregarListaJbps();

      if (!selectedJbpId) {
        // acabou de criar, carrega detalhe
        await carregarDetalheJbp(data.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar JBP.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleSalvarItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedJbpId) {
      setErrorMsg("Salve o cabeçalho do JBP antes de adicionar itens.");
      return;
    }

    if (!itemForm.assetId) {
      setErrorMsg("Selecione um ativo para o item.");
      return;
    }

    try {
      setSavingItem(true);

      const payload = {
        assetId: itemForm.assetId,
        initiativeType: itemForm.initiativeType || "JBP",
        description: itemForm.description || null,
        periodStart: itemForm.periodStart || null,
        periodEnd: itemForm.periodEnd || null,
        storeScope: itemForm.storeScope || null,
        unit: itemForm.unit || null,
        quantity: itemForm.quantity || null,
        negotiatedUnitPrice: itemForm.negotiatedUnitPrice || null,
        totalValue: itemForm.totalValue || null,
        notes: itemForm.notes || null,
      };

      let url;
      let method;

      if (editingItemId) {
        url = `${apiBaseUrl}/api/jbp/itens/${editingItemId}`;
        method = "PUT";
      } else {
        url = `${apiBaseUrl}/api/jbp/${selectedJbpId}/itens`;
        method = "POST";
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar item.");
      }

      setSuccessMsg(
        editingItemId
          ? "Item do JBP atualizado com sucesso."
          : "Item do JBP criado com sucesso."
      );

      await carregarDetalheJbp(selectedJbpId);
      resetItemForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar item.");
    } finally {
      setSavingItem(false);
    }
  }

  function handleEditarItem(item: any) {
    setEditingItemId(item.id);
    setItemForm({
      assetId: String(item.assetId),
      initiativeType: item.initiativeType || "JBP",
      description: item.description || "",
      periodStart: item.periodStart ? item.periodStart.substring(0, 10) : "",
      periodEnd: item.periodEnd ? item.periodEnd.substring(0, 10) : "",
      storeScope: item.storeScope || "",
      unit: item.unit || "",
      quantity:
        item.quantity !== null && item.quantity !== undefined
          ? String(item.quantity)
          : "",
      negotiatedUnitPrice:
        item.negotiatedUnitPrice !== null &&
        item.negotiatedUnitPrice !== undefined
          ? String(item.negotiatedUnitPrice)
          : "",
      totalValue:
        item.totalValue !== null && item.totalValue !== undefined
          ? String(item.totalValue)
          : "",
      notes: item.notes || "",
    });
  }

  async function handleExcluirItem(itemId: number) {
    if (!window.confirm("Deseja realmente excluir este item do JBP?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await apiFetch(`${apiBaseUrl}/api/jbp/itens/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir item.");
      }

      setSuccessMsg("Item do JBP removido com sucesso.");
      if (selectedJbpId) {
        await carregarDetalheJbp(selectedJbpId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir item.");
    }
  }

  async function handleGerarContrato() {
    if (!selectedJbpId) {
      alert("Selecione um JBP antes de gerar contrato.");
      return;
    }

    try {
      const res = await apiFetch(
        `${apiBaseUrl}/api/jbp/${selectedJbpId}/gerar-contrato`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao gerar contrato.");
      }

      alert(
        `Contrato gerado/sincronizado com sucesso!\n\n` +
          `Campanha ID: ${data.campanhaId || "-"}\n` +
          `Plano Execução ID: ${data.execPlanoId || "-"}\n` +
          `Plano Retail Media ID: ${data.retailPlanoId || "-"}`
      );
    } catch (err: any) {
      console.error(err);
      alert(
        (err as Error).message ||
          "Erro ao gerar contrato a partir do JBP."
      );
    }
  }

  function calcularResumo() {
    if (!items || items.length === 0) {
      return {
        totalItens: 0,
        totalJvc: 0,
        valorTotal: 0,
        valorJvc: 0,
      };
    }

    let totalItens = items.length;
    let totalJvc = 0;
    let valorTotal = 0;
    let valorJvc = 0;

    items.forEach((it) => {
      const v =
        it.totalValue !== null && it.totalValue !== undefined
          ? Number(it.totalValue)
          : 0;

      valorTotal += v;
      if (it.initiativeType === "JVC") {
        totalJvc += 1;
        valorJvc += v;
      }
    });

    return { totalItens, totalJvc, valorTotal, valorJvc };
  }

  const resumo = calcularResumo();

   const supplierName =
     selectedJbp?.supplier?.name ||
     suppliers.find((s) => s.id === Number(headerForm.supplierId))?.name ||
     "Fornecedor não definido";

   const periodHeaderText = [
     headerForm.periodStart
       ? new Date(headerForm.periodStart).toLocaleDateString("pt-BR")
       : null,
     headerForm.periodEnd
       ? new Date(headerForm.periodEnd).toLocaleDateString("pt-BR")
       : null,
   ]
     .filter(Boolean)
     .join(" → ");

  return (
    <div className="panel-grid jbp-page">
      {/* Coluna esquerda: lista de planos */}
      <section className="panel-card panel-card--soft">
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
              JBP & JVC
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Planos conjuntos entre Super Maxi e indústria. Use essa área para
              estruturar o JBP, cadastrar ativos contratados e destacar
              iniciativas de criação de valor (JVC).
            </p>
          </div>

          <button
            type="button"
            onClick={resetHeaderForm}
            className="ct-btn-secondary"
          >
            Novo JBP
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
            Planos cadastrados
          </span>
          <button
            type="button"
            onClick={carregarListaJbps}
            className="ct-btn-secondary"
          >
            Atualizar
          </button>
        </div>

        {loadingList ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Carregando planos...
          </div>
        ) : jbps.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Nenhum JBP cadastrado ainda. Clique em &quot;Novo JBP&quot; para
            começar.
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
            {jbps.map((j) => {
              const isActive = selectedJbpId === j.id;
              const totalItens = j.itens?.length || 0;

              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => carregarDetalheJbp(j.id)}
                  style={{
                    textAlign: "left",
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    backgroundColor: isActive ? "#fef9c3" : "#f9fafb",
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
                      {j.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: "#0f172a",
                        color: "#fefce8",
                      }}
                    >
                      {j.status || "rascunho"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {j.supplier?.name || "Fornecedor não encontrado"} •{" "}
                    {j.year ? j.year : "Ano não definido"} • {totalItens} itens
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Coluna direita: detalhe do JBP */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Cabeçalho do plano */}
        <section className="panel-card">
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
              {selectedJbpId ? "Editar plano JBP" : "Novo plano JBP"}
            </h2>

            {selectedJbpId && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ct-btn-secondary"
              >
                Ver JBP completo
              </button>
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
                    {f.name || f.nome || f.fantasia}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nome do plano *">
              <input
                type="text"
                name="name"
                value={headerForm.name}
                onChange={handleHeaderChange}
                placeholder="Ex.: JBP 2025 - ACME"
                style={inputStyle}
              />
            </Field>

            <Field label="Ano">
              <input
                type="number"
                name="year"
                value={headerForm.year}
                onChange={handleHeaderChange}
                placeholder="Ex.: 2025"
                style={inputStyle}
              />
            </Field>

            <Field label="Período (início)">
              <input
                type="date"
                name="periodStart"
                value={headerForm.periodStart}
                onChange={handleHeaderChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Período (fim)">
              <input
                type="date"
                name="periodEnd"
                value={headerForm.periodEnd}
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
                <option value="rascunho">Rascunho</option>
                <option value="negociacao">Negociação</option>
                <option value="aprovado">Aprovado</option>
                <option value="em_execucao">Em execução</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </Field>

            <Field label="Verba total prevista (R$)">
              <input
                type="number"
                step="0.01"
                name="totalBudget"
                value={headerForm.totalBudget}
                onChange={handleHeaderChange}
                placeholder="Ex.: 500000,00"
                style={inputStyle}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Resumo estratégico">
                <textarea
                  name="strategy"
                  value={headerForm.strategy}
                  onChange={handleHeaderChange}
                  placeholder="Objetivos principais deste JBP (crescimento, categorias foco, shopper, etc.)"
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="KPIs principais">
                <textarea
                  name="kpiSummary"
                  value={headerForm.kpiSummary}
                  onChange={handleHeaderChange}
                  placeholder="Ex.: crescimento de 8% em sell-out, aumento de share em 2 p.p., expansão de distribuição em 30 lojas..."
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
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
                className="ct-btn-primary"
              >
                {savingHeader
                  ? "Salvando..."
                  : selectedJbpId
                  ? "Salvar cabeçalho"
                  : "Criar plano JBP"}
              </button>
            </div>
          </form>
        </section>

        {/* Itens do plano (Ativos & iniciativas) */}
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
              Ativos & iniciativas do plano
            </h2>
            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              {resumo.totalItens} itens • {resumo.totalJvc} JVC
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

            <Field label="Tipo">
              <select
                name="initiativeType"
                value={itemForm.initiativeType}
                onChange={handleItemChange}
                style={inputStyle}
              >
                <option value="JBP">JBP</option>
                <option value="JVC">JVC</option>
                <option value="PROMO">Promo</option>
                <option value="DADOS">Dados</option>
              </select>
            </Field>

            <Field label="Período início">
              <input
                type="date"
                name="periodStart"
                value={itemForm.periodStart}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Período fim">
              <input
                type="date"
                name="periodEnd"
                value={itemForm.periodEnd}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Descrição">
              <input
                type="text"
                name="description"
                value={itemForm.description}
                onChange={handleItemChange}
                placeholder="Ex.: Ponta Q2 em 50 lojas"
                style={inputStyle}
              />
            </Field>

            <Field label="Escopo de lojas">
              <input
                type="text"
                name="storeScope"
                value={itemForm.storeScope}
                onChange={handleItemChange}
                placeholder="Todas as lojas, Top 50..."
                style={inputStyle}
              />
            </Field>

            <Field label="Unidade">
              <input
                type="text"
                name="unit"
                value={itemForm.unit}
                onChange={handleItemChange}
                placeholder="por semana, por mês..."
                style={inputStyle}
              />
            </Field>

            <Field label="Qtd">
              <input
                type="number"
                name="quantity"
                value={itemForm.quantity}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="R$ unitário">
              <input
                type="number"
                step="0.01"
                name="negotiatedUnitPrice"
                value={itemForm.negotiatedUnitPrice}
                onChange={handleItemChange}
                style={inputStyle}
              />
            </Field>

            <Field label="R$ total">
              <input
                type="number"
                step="0.01"
                name="totalValue"
                value={itemForm.totalValue}
                onChange={handleItemChange}
                placeholder="Opcional (pode ser calculado)"
                style={inputStyle}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Notas">
                <textarea
                  name="notes"
                  value={itemForm.notes}
                  onChange={handleItemChange}
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
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
                  className="ct-btn-secondary"
                >
                  Cancelar edição
                </button>
              )}
              <button
                type="submit"
                disabled={savingItem}
                className="ct-btn-primary"
              >
                {savingItem
                  ? "Salvando item..."
                  : editingItemId
                  ? "Salvar item"
                  : "Adicionar item"}
              </button>
            </div>
          </form>

          {/* Tabela de itens já cadastrados */}
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Nenhum item cadastrado ainda. Use o formulário acima para adicionar
              ativos ao plano.
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
                    <Th>Ativo</Th>
                    <Th>Tipo</Th>
                    <Th>Período</Th>
                    <Th>Qtd</Th>
                    <Th>R$ unit.</Th>
                    <Th>R$ total</Th>
                    <Th>Escopo</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const assetName = it.asset?.name || `ID ${it.assetId}`;
                    const price =
                      it.negotiatedUnitPrice !== null &&
                      it.negotiatedUnitPrice !== undefined
                        ? Number(it.negotiatedUnitPrice)
                        : null;
                    const total =
                      it.totalValue !== null && it.totalValue !== undefined
                        ? Number(it.totalValue)
                        : null;

                    const periodText = [
                      it.periodStart
                        ? new Date(it.periodStart).toLocaleDateString("pt-BR")
                        : null,
                      it.periodEnd
                        ? new Date(it.periodEnd).toLocaleDateString("pt-BR")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" → ");

                    return (
                      <tr
                        key={it.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <Td>
                          {assetName}
                          {it.description && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#6b7280",
                              }}
                            >
                              {it.description}
                            </div>
                          )}
                          {it.initiativeType === "JVC" && (
                            <div
                              style={{
                                display: "inline-block",
                                marginTop: 2,
                                padding: "1px 6px",
                                borderRadius: 999,
                                backgroundColor: "rgba(147,51,234,0.10)",
                                color: "#7c3aed",
                                fontSize: 9,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              JVC
                            </div>
                          )}
                        </Td>
                        <Td>{it.initiativeType}</Td>
                        <Td>{periodText || "-"}</Td>
                        <Td>{it.quantity ?? "-"}</Td>
                        <Td>
                          {price !== null
                            ? price.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "-"}
                        </Td>
                        <Td>
                          {total !== null
                            ? total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "-"}
                        </Td>
                        <Td>{it.storeScope || "-"}</Td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Resumo JVC */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
              color: "#0f172a",
            }}
          >
            Resumo de valor conjunto (JVC)
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Use esse bloco para apresentar rapidamente ao fornecedor quais
            iniciativas de JVC estão dentro do plano — é um ótimo argumento de
            parceria, além do investimento de mídia tradicional.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 8,
              fontSize: 12,
              color: "#0f172a",
            }}
          >
            <div>
              <strong>{resumo.totalItens}</strong> itens no JBP
            </div>
            <div>
              <strong>{resumo.totalJvc}</strong> iniciativas JVC
            </div>
            <div>
              Valor total JBP:{" "}
              <strong>
                {resumo.valorTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <div>
              Valor em JVC:{" "}
              <strong>
                {resumo.valorJvc.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
          </div>

          {items.filter((it) => it.initiativeType === "JVC").length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Nenhuma iniciativa marcada como JVC ainda. Na tabela acima, selecione
              &quot;JVC&quot; em &quot;Tipo&quot; para destacar projetos de
              criação de valor conjunto.
            </div>
          ) : (
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 12,
                color: "#4b5563",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {items
                .filter((it) => it.initiativeType === "JVC")
                .map((it) => (
                  <li key={it.id}>
                    <strong>{it.asset?.name || `Ativo ${it.assetId}`}</strong> –{" "}
                    {it.description || "sem descrição"}{" "}
                    {it.totalValue !== null &&
                      it.totalValue !== undefined &&
                      ` • ${Number(it.totalValue).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}`}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </section>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <form
            onSubmit={handleSalvarHeader}
            style={{
              width: "100%",
              maxWidth: 920,
              maxHeight: "80vh",
              backgroundColor: "#ffffff",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 25px 55px rgba(15,23,42,0.45)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Cabeçalho do modal */}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#9ca3af",
                    marginBottom: 4,
                  }}
                >
                  Visão de portfólio
                </div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#0f172a",
                  }}
                >
                  {headerForm.name || "JBP sem nome"}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                  }}
                >
                  {supplierName} • {headerForm.year || "ano não definido"}{" "}
                  {periodHeaderText && `• ${periodHeaderText}`}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                {/* Status editável direto no modal */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    Status
                  </span>
                  <select
                    name="status"
                    value={headerForm.status}
                    onChange={handleHeaderChange}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      fontSize: 11,
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <option value="rascunho">RASCUNHO</option>
                    <option value="negociacao">NEGOCIAÇÃO</option>
                    <option value="aprovado">APROVADO</option>
                    <option value="em_execucao">EM EXECUÇÃO</option>
                    <option value="encerrado">ENCERRADO</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "4px 10px",
                    background: "transparent",
                    fontSize: 11,
                    color: "#e5e7eb",
                  }}
                >
                  Fechar
                </button>
              </div>
            </header>

            {/* Corpo scrollável do modal */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 4,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Bloco: resumo de cabeçalho editável (pontos-chave) */}
              <section
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#0f172a",
                  }}
                >
                  Resumo do plano
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  <Field label="Fornecedor">
                    <input
                      type="text"
                      value={supplierName}
                      readOnly
                      style={{
                        ...inputStyle,
                        backgroundColor: "#e5e7eb",
                        cursor: "not-allowed",
                      }}
                    />
                  </Field>

                  <Field label="Ano">
                    <input
                      type="number"
                      name="year"
                      value={headerForm.year}
                      onChange={handleHeaderChange}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Verba total prevista (R$)">
                    <input
                      type="number"
                      step="0.01"
                      name="totalBudget"
                      value={headerForm.totalBudget}
                      onChange={handleHeaderChange}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Período início">
                    <input
                      type="date"
                      name="periodStart"
                      value={headerForm.periodStart}
                      onChange={handleHeaderChange}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Período fim">
                    <input
                      type="date"
                      name="periodEnd"
                      value={headerForm.periodEnd}
                      onChange={handleHeaderChange}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Nome do plano">
                    <input
                      type="text"
                      name="name"
                      value={headerForm.name}
                      onChange={handleHeaderChange}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  <Field label="Resumo estratégico">
                    <textarea
                      name="strategy"
                      value={headerForm.strategy}
                      onChange={handleHeaderChange}
                      rows={2}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                      }}
                    />
                  </Field>

                  <Field label="KPIs principais">
                    <textarea
                      name="kpiSummary"
                      value={headerForm.kpiSummary}
                      onChange={handleHeaderChange}
                      rows={2}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                      }}
                    />
                  </Field>
                </div>
              </section>

              {/* Bloco: visão dos itens do JBP */}
              <section
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#0f172a",
                  }}
                >
                  Itens do plano (JBP & JVC)
                </h3>

                {items.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Nenhum item cadastrado ainda para este plano. Volte ao painel para
                    adicionar ativos.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {items.map((it) => {
                      const assetName = it.asset?.name || `Ativo ${it.assetId}`;
                      const periodText = [
                        it.periodStart
                          ? new Date(it.periodStart).toLocaleDateString("pt-BR")
                          : null,
                        it.periodEnd
                          ? new Date(it.periodEnd).toLocaleDateString("pt-BR")
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" → ");

                      const total =
                        it.totalValue !== null && it.totalValue !== undefined
                          ? Number(it.totalValue)
                          : null;

                      return (
                        <div
                          key={it.id}
                          style={{
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            padding: 8,
                            backgroundColor:
                              it.initiativeType === "JVC"
                                ? "rgba(250, 232, 255, 0.85)"
                                : "#f9fafb",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {assetName}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 10,
                              }}
                            >
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  backgroundColor: "#111827",
                                  color: "#f9fafb",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {it.initiativeType}
                              </span>
                              {total !== null && (
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "#0f172a",
                                  }}
                                >
                                  {total.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {it.description && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#4b5563",
                                marginBottom: 2,
                              }}
                            >
                              {it.description}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 10,
                              color: "#6b7280",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 10,
                            }}
                          >
                            {periodText && <span>Período: {periodText}</span>}
                            {it.storeScope && <span>Lojas: {it.storeScope}</span>}
                            {it.quantity !== null &&
                              it.quantity !== undefined &&
                              `Quantidade: ${it.quantity}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Rodapé do modal */}
            <footer
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                {resumo.totalItens} itens • {resumo.totalJvc} JVC • Valor total:{" "}
                {resumo.valorTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  type="submit"
                  className="ct-btn-primary"
                >
                  Salvar alterações do JBP
                </button>
                <button
                  type="button"
                  onClick={handleGerarContrato}
                  className="ct-btn-primary"
                >
                  Gerar contrato
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel-field">
      <label className="panel-field__label">{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #dbeafe",
  fontSize: 12,
  outline: "none",
  boxShadow: "0 6px 16px rgba(14, 165, 233, 0.06)",
  background: "#ffffff",
};

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="panel-table__th">{children}</th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="panel-table__td">{children}</td>
);

const smallButton = {
  border: "none",
  background: "none",
  fontSize: 11,
  cursor: "pointer",
  color: "#0f172a",
  padding: 0,
};
