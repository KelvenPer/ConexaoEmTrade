"use client";

import { useEffect, useState } from "react";

export default function CalendarioCampanhasPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [suppliers, setSuppliers] = useState([]);
  const [ativos, setAtivos] = useState([]);
  const [campanhas, setCampanhas] = useState([]);

  const [selectedCampanhaId, setSelectedCampanhaId] = useState(null);
  const [selectedCampanha, setSelectedCampanha] = useState(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
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
  });

  // carregar bases (fornecedores, ativos) e lista
  useEffect(() => {
    carregarBase();
    carregarListaCampanhas();
  }, []);

  async function carregarBase() {
    try {
      setErrorMsg("");

      const [resFor, resAtv] = await Promise.all([
        fetch(`${apiBaseUrl}/api/fornecedores`),
        fetch(`${apiBaseUrl}/api/ativos/ativos`),
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
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.message || "Erro ao carregar dados base (fornecedores/ativos)."
      );
    }
  }

  async function carregarListaCampanhas() {
    try {
      setLoadingList(true);
      setErrorMsg("");
      const res = await fetch(`${apiBaseUrl}/api/campanhas`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao listar campanhas.");
      }

      setCampanhas(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao listar campanhas.");
    } finally {
      setLoadingList(false);
    }
  }

  async function carregarDetalheCampanha(id) {
    try {
      setLoadingDetail(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${apiBaseUrl}/api/campanhas/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar campanha.");
      }

      setSelectedCampanhaId(id);
      setSelectedCampanha(data);

      setHeaderForm({
        supplierId: String(data.supplierId),
        jbpId:
          data.jbpId !== null && data.jbpId !== undefined
            ? String(data.jbpId)
            : "",
        name: data.name || "",
        objective: data.objective || "",
        channel: data.channel || "",
        startDate: data.startDate ? data.startDate.substring(0, 10) : "",
        endDate: data.endDate ? data.endDate.substring(0, 10) : "",
        status: data.status || "planejada",
      });

      setItems(data.itens || []);
      resetItemForm();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao carregar campanha.");
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleHeaderChange(e) {
    const { name, value } = e.target;
    setHeaderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleItemChange(e) {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetHeaderForm() {
    setSelectedCampanhaId(null);
    setSelectedCampanha(null);
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
    });
  }

  async function handleSalvarHeader(e) {
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
        supplierId: headerForm.supplierId,
        jbpId: headerForm.jbpId || null,
        name: headerForm.name,
        objective: headerForm.objective || null,
        channel: headerForm.channel || null,
        startDate: headerForm.startDate || null,
        endDate: headerForm.endDate || null,
        status: headerForm.status || "planejada",
      };

      let url = `${apiBaseUrl}/api/campanhas`;
      let method = "POST";

      if (selectedCampanhaId) {
        url = `${apiBaseUrl}/api/campanhas/${selectedCampanhaId}`;
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

      await carregarListaCampanhas();

      if (!selectedCampanhaId) {
        await carregarDetalheCampanha(data.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar campanha.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleSalvarItem(e) {
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
        jbpItemId: itemForm.jbpItemId || null,
        assetId: itemForm.assetId,
        title: itemForm.title || null,
        contentType: itemForm.contentType || null,
        artDeadline: itemForm.artDeadline || null,
        approvalDeadline: itemForm.approvalDeadline || null,
        goLiveDate: itemForm.goLiveDate || null,
        urlDestino: itemForm.urlDestino || null,
        notes: itemForm.notes || null,
      };

      let url;
      let method;

      if (editingItemId) {
        url = `${apiBaseUrl}/api/campanhas/itens/${editingItemId}`;
        method = "PUT";
      } else {
        url = `${apiBaseUrl}/api/campanhas/${selectedCampanhaId}/itens`;
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
          ? "Peça da campanha atualizada com sucesso."
          : "Peça da campanha criada com sucesso."
      );

      await carregarDetalheCampanha(selectedCampanhaId);
      resetItemForm();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar peça.");
    } finally {
      setSavingItem(false);
    }
  }

  function handleEditarItem(item) {
    setEditingItemId(item.id);
    setItemForm({
      jbpItemId:
        item.jbpItemId !== null && item.jbpItemId !== undefined
          ? String(item.jbpItemId)
          : "",
      assetId: String(item.assetId),
      title: item.title || "",
      contentType: item.contentType || "",
      artDeadline: item.artDeadline
        ? item.artDeadline.substring(0, 10)
        : "",
      approvalDeadline: item.approvalDeadline
        ? item.approvalDeadline.substring(0, 10)
        : "",
      goLiveDate: item.goLiveDate ? item.goLiveDate.substring(0, 10) : "",
      urlDestino: item.urlDestino || "",
      notes: item.notes || "",
    });
  }

  async function handleExcluirItem(itemId) {
    if (!window.confirm("Deseja realmente excluir esta peça da campanha?"))
      return;

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(
        `${apiBaseUrl}/api/campanhas/itens/${itemId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao excluir peça.");
      }

      setSuccessMsg("Peça da campanha removida com sucesso.");
      if (selectedCampanhaId) {
        await carregarDetalheCampanha(selectedCampanhaId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao excluir peça.");
    }
  }

  const totalPecas = items.length;

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
      {/* Coluna esquerda: lista de campanhas */}
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
              Calendário de Campanhas
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Planeje e acompanhe as campanhas de marketing conectadas aos
              JBPs. Cada campanha pode ter várias peças (banners, vídeos, push,
              etc.) com seus prazos de criação e veiculação.
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

        {loadingList ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Carregando campanhas...
          </div>
        ) : campanhas.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Nenhuma campanha cadastrada ainda. Clique em &quot;Nova campanha&quot;
            para começar.
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
              const qtdItens = c.itens?.length || 0;

              const periodText = [
                c.startDate
                  ? new Date(c.startDate).toLocaleDateString("pt-BR")
                  : null,
                c.endDate
                  ? new Date(c.endDate).toLocaleDateString("pt-BR")
                  : null,
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
                    {c.supplier?.name || "Fornecedor não encontrado"} •{" "}
                    {c.channel || "Canal não definido"}{" "}
                    {periodText && `• ${periodText}`} • {qtdItens} peças
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Coluna direita: detalhe da campanha */}
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
                    {f.name || f.nome || f.fantasia}
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

        {/* Peças da campanha */}
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
              {totalPecas} peças
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
                placeholder="ID item JBP"
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

            <Field label="Data veiculação">
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
              Nenhuma peça cadastrada ainda. Use o formulário acima para criar as
              entregas da campanha.
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
                    <Th>Tipo</Th>
                    <Th>Arte</Th>
                    <Th>Aprovação</Th>
                    <Th>Veiculação</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const assetName = it.asset?.name || `Ativo ${it.assetId}`;
                    return (
                      <tr
                        key={it.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <Td>
                          {it.title || "(sem título)"}
                          {it.urlDestino && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#2563eb",
                              }}
                            >
                              {it.urlDestino}
                            </div>
                          )}
                        </Td>
                        <Td>{assetName}</Td>
                        <Td>{it.contentType || "-"}</Td>
                        <Td>
                          {it.artDeadline
                            ? new Date(it.artDeadline).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </Td>
                        <Td>
                          {it.approvalDeadline
                            ? new Date(
                                it.approvalDeadline
                              ).toLocaleDateString("pt-BR")
                            : "-"}
                        </Td>
                        <Td>
                          {it.goLiveDate
                            ? new Date(it.goLiveDate).toLocaleDateString(
                                "pt-BR"
                              )
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
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
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
  fontSize: 12,
  outline: "none",
};

const Th = ({ children }) => (
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

const Td = ({ children }) => (
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

const smallButton = {
  border: "none",
  background: "none",
  fontSize: 11,
  cursor: "pointer",
  color: "#0f172a",
  padding: 0,
};
