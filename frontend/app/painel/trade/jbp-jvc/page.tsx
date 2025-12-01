"use client";

import type React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { JbpContractPrint } from "@/components/JbpContractPrint";
import { ProductMixSelector, MixItem } from "@/components/ProductMixSelector";

// ============================================================================
// TIPOS
// ============================================================================
type Supplier = {
  id: number;
  name?: string;
  nome?: string;
  fantasia?: string;
};

type Asset = {
  id: number;
  name: string;
  channel?: string | null;
  type?: string | null;
  format?: string | null;
};

type Product = {
  id: number;
  code: string;
  description: string;
  brand: string;
};

type JbpItem = {
  id: number;
  assetId: number;
  initiativeType?: string | null;
  description?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  storeScope?: string | null;
  unit?: string | null;
  quantity?: number | null;
  negotiatedUnitPrice?: number | null;
  totalValue?: number | null;
  notes?: string | null;
  asset?: Asset | null;
  mix?: Array<{
    id?: number;
    productId?: number | null;
    product?: Product | null;
    brandCriteria?: string | null;
    categoryCriteria?: string | null;
    type?: string;
    label?: string;
  }>;
};

type ModalData = {
  jbp: Jbp | null;
  wallet: WalletData | null;
};

type Jbp = {
  id: number;
  supplierId: number;
  name: string;
  year?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  strategy?: string | null;
  kpiSummary?: string | null;
  totalBudget?: number | null;
  status?: string;
  itens?: JbpItem[];
  supplier?: Supplier;
};

type WalletData = {
  totalBudget: number;
  consumedBudget: number;
};

// ============================================================================
// COMPONENTES VISUAIS AUXILIARES
// ============================================================================

const TabButton = ({
  id,
  label,
  active,
  onClick,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "10px 16px",
      borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
      fontWeight: active ? 600 : 500,
      color: active ? "#0f172a" : "#64748b",
      background: "none",
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none",
      cursor: "pointer",
      fontSize: 13,
      transition: "all 0.2s",
    }}
  >
    {label}
  </button>
);

const WalletWidget = ({
  totalJbp,
  wallet,
  loading,
  error,
  onRefresh,
}: {
  totalJbp: number;
  wallet: WalletData | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) => {
  if (loading) {
    return (
      <div className="p-4 border border-slate-200 rounded bg-slate-50 text-xs text-slate-600">
        Carregando carteira...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-amber-200 rounded bg-amber-50 text-xs text-amber-700 flex justify-between items-center">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1 text-amber-800 text-[11px] font-bold bg-white border border-amber-200 rounded hover:bg-amber-100"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-4 border border-slate-200 rounded bg-slate-50 text-xs text-slate-500">
        Nenhuma carteira ativa para este fornecedor/ano.
      </div>
    );
  }

  const projected = wallet.consumedBudget + totalJbp;
  const percent = wallet.totalBudget > 0 ? (projected / wallet.totalBudget) * 100 : 0;
  const isOver = percent > 100;

  return (
    <div className="p-4 border border-slate-200 rounded bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Wallet / Saldo do Fornecedor
          </h4>
          <p className="text-[11px] text-slate-500">
            Consumo projetado considerando o total deste JBP.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[11px] px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
        >
          Recarregar
        </button>
      </div>

      <div className="flex justify-between text-xs text-slate-600 mb-2">
        <div>
          <div className="uppercase text-[10px] text-slate-400 font-bold">
            Teto anual
          </div>
          <div className="font-semibold text-slate-800">
            {wallet.totalBudget.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
        </div>
        <div className="text-right">
          <div className="uppercase text-[10px] text-slate-400 font-bold">
            Consumido + Plano
          </div>
          <div
            className={`font-semibold ${
              isOver ? "text-red-600" : "text-slate-800"
            }`}
          >
            {projected.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded overflow-hidden mb-2">
        <div
          className={`h-full ${isOver ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(percent, 100)}%`, transition: "width 0.3s ease" }}
        />
      </div>
      <div className="text-[11px] text-slate-600">
        {isOver
          ? `Atenção: excede a verba em ${(projected - wallet.totalBudget).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}.`
          : `Saldo após plano: ${(wallet.totalBudget - projected).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}.`}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL (PÁGINA)
// ============================================================================

export default function JbpJvcPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const componentRef = useRef<HTMLDivElement>(null);

  // Estados de Dados
  const [jbps, setJbps] = useState<Jbp[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ativos, setAtivos] = useState<Asset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  // Estados de UI/Seleção
  const [selectedJbpId, setSelectedJbpId] = useState<number | null>(null);
  const [selectedJbp, setSelectedJbp] = useState<Jbp | null>(null);
  const [activeTab, setActiveTab] = useState<"geral" | "financeiro" | "itens">(
    "geral"
  );
  const [loadingList, setLoadingList] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Formulários
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

  const [items, setItems] = useState<JbpItem[]>([]);
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
  const [productMix, setProductMix] = useState<MixItem[]>([]);
  const [modalData, setModalData] = useState<ModalData>({ jbp: null, wallet: null });
  const [modalOpen, setModalOpen] = useState(false);
  // Estados para o Financeiro Avançado
  const [financialData, setFinancialData] = useState({
    rebate: "",
    marketing: "",
    sellIn: "",
    salesBase: "",
    salesTarget: "",
    paymentMethod: "ND",
  });

  const itensTotal = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.totalValue || 0), 0),
    [items]
  );
  const totalJbpNumber = useMemo(
    () => Number(headerForm.totalBudget || 0),
    [headerForm.totalBudget]
  );
  const walletSaldoPosPlano = useMemo(() => {
    if (!wallet) return null;
    return wallet.totalBudget - wallet.consumedBudget - totalJbpNumber;
  }, [wallet, totalJbpNumber]);
  const prazoStatus = useMemo(() => {
    if (!headerForm.periodEnd) return "No prazo";
    const end = new Date(headerForm.periodEnd);
    return Number.isNaN(end.getTime()) || end.getTime() >= Date.now()
      ? "No prazo"
      : "Atrasado";
  }, [headerForm.periodEnd]);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");

    if (!headerForm.supplierId) {
      setWallet(null);
      setWalletLoading(false);
      return;
    }

    const ano = headerForm.year ? Number(headerForm.year) : new Date().getFullYear();

    try {
      const res = await apiFetch(
        `${apiBaseUrl}/api/wallets?supplierId=${headerForm.supplierId}&year=${ano}`
      );
      const data = await res.json().catch(() => ({} as any));

      // Backend pode retornar { wallet: null } quando não houver carteira ativa
      if (res.status === 404) {
        // fallback para backends antigos que ainda retornam 404
        setWallet(null);
        setWalletError(data.message || "");
      } else if (data && data.wallet === null) {
        setWallet(null);
        setWalletError("");
      } else if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar carteira.");
      } else {
        setWallet({
          totalBudget: Number(data.totalBudget || 0),
          consumedBudget: Number(data.consumedBudget || 0),
        });
      }
    } catch (err: any) {
      setWallet(null);
      setWalletError(err.message || "Erro de conexão ao buscar wallet.");
    } finally {
      setWalletLoading(false);
    }
  }, [apiBaseUrl, headerForm.supplierId, headerForm.year]);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined" || !componentRef.current) return;

    const printContents = componentRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Contrato_JBP_${headerForm.year || "2025"}</title>
          <style>
            body { margin: 0; padding: 24px; font-family: serif; color: #0f172a; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [headerForm.year]);

  // --------------------------------------------------------------------------
  // CARREGAMENTOS INICIAIS
  // --------------------------------------------------------------------------
  const carregarBase = useCallback(async () => {
    try {
      const [resFor, resAtv, resProd] = await Promise.all([
        apiFetch(`${apiBaseUrl}/api/fornecedores`),
        apiFetch(`${apiBaseUrl}/api/ativos/ativos`),
        apiFetch(`${apiBaseUrl}/api/produtos`),
      ]);
      const dataFor = await resFor.json();
      const dataAtv = await resAtv.json();
      const dataProdRaw = await resProd.json();
      const dataProd: Product[] = Array.isArray(dataProdRaw)
        ? dataProdRaw.map((p: any) => ({
            id: p.id,
            code: p.code || String(p.id),
            description: p.description || p.nome || p.name || p.code || "Produto",
            brand: p.brand || p.marca || "",
          }))
        : [];
      setSuppliers(Array.isArray(dataFor) ? dataFor : []);
      setAtivos(Array.isArray(dataAtv) ? dataAtv : []);
      setProducts(dataProd);
    } catch (err) {
      console.error(err);
    }
  }, [apiBaseUrl]);

  const carregarListaJbps = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await apiFetch(`${apiBaseUrl}/api/jbp`);
      const data = await res.json();
      if (res.ok) setJbps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    carregarBase();
    carregarListaJbps();
  }, [carregarBase, carregarListaJbps]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Soma automatica das verbas financeiras para atualizar o total do plano
  useEffect(() => {
    const r = Number(financialData.rebate) || 0;
    const m = Number(financialData.marketing) || 0;
    const s = Number(financialData.sellIn) || 0;
    const total = r + m + s;

    if (total >= 0 && total !== Number(headerForm.totalBudget)) {
      setHeaderForm((prev) => ({ ...prev, totalBudget: String(total) }));
    }
  }, [financialData]);

  // --------------------------------------------------------------------------
  // LÓGICA DE DETALHES E FORMULÁRIOS
  // --------------------------------------------------------------------------

  async function carregarDetalheJbp(id: number) {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res = await apiFetch(`${apiBaseUrl}/api/jbp/${id}`);
      const data = await res.json();

      if (res.ok) {
        setSelectedJbpId(id);
        setSelectedJbp(data);
        // Preenche formulário
        setHeaderForm({
          supplierId: String(data.supplierId),
          name: data.name || "",
          year: data.year ? String(data.year) : "",
          periodStart: data.periodStart
            ? data.periodStart.substring(0, 10)
            : "",
          periodEnd: data.periodEnd ? data.periodEnd.substring(0, 10) : "",
          strategy: data.strategy || "",
          kpiSummary: data.kpiSummary || "",
          totalBudget:
            data.totalBudget !== null ? String(data.totalBudget) : "",
          status: data.status || "rascunho",
        });
        setItems(data.itens || []);
        resetItemForm();
        setProductMix([]);
        setActiveTab("geral"); // Volta para aba principal ao carregar
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar JBP.");
    }
  }

  function handleNovoJbp() {
    setSelectedJbpId(null);
    setSelectedJbp(null);
    setItems([]);
    setHeaderForm({
      supplierId: "",
      name: "",
      year: new Date().getFullYear().toString(),
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
    setActiveTab("geral");
  }

  // Inputs Handlers
  function handleHeaderChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setHeaderForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
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
    setProductMix([]);
  }

  async function abrirModalDetalhe(jbpId: number) {
    try {
      const res = await apiFetch(`${apiBaseUrl}/api/jbp/${jbpId}`);
      const data: Jbp = await res.json();
      if (!res.ok) throw new Error("Erro ao carregar detalhes do JBP.");

      let walletDetail: WalletData | null = null;
      try {
        const ano = data.year || new Date().getFullYear();
        const wRes = await apiFetch(
          `${apiBaseUrl}/api/wallets?supplierId=${data.supplierId}&year=${ano}`
        );
        const wData = await wRes.json().catch(() => ({} as any));
        if (wRes.ok && wData && wData.wallet === null) {
          walletDetail = null;
        } else if (wRes.ok && wData.totalBudget !== undefined) {
          walletDetail = {
            totalBudget: Number(wData.totalBudget || 0),
            consumedBudget: Number(wData.consumedBudget || 0),
          };
        }
      } catch {
        walletDetail = null;
      }

      setModalData({ jbp: data, wallet: walletDetail });
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao abrir resumo do plano.");
    }
  }

  // --------------------------------------------------------------------------
  // SALVAR DADOS (HEADER E ITENS)
  // --------------------------------------------------------------------------

  async function handleSalvarHeader(e: React.FormEvent) {
    e.preventDefault();
    if (!headerForm.supplierId || !headerForm.name) {
      setErrorMsg("Fornecedor e Nome do Plano são obrigatórios.");
      return;
    }

    try {
      setSavingHeader(true);
      const payload = {
        ...headerForm,
        year: headerForm.year ? Number(headerForm.year) : null,
        totalBudget: headerForm.totalBudget
          ? Number(headerForm.totalBudget)
          : null,
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

      if (res.ok) {
        setSuccessMsg(
          selectedJbpId ? "JBP atualizado!" : "JBP criado com sucesso!"
        );
        await carregarListaJbps();
        if (!selectedJbpId) {
          // Se criou novo, carrega o detalhe dele
          await carregarDetalheJbp(data.id);
        }
        setProductMix([]);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleSalvarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJbpId) {
      setErrorMsg("Salve o JBP antes de adicionar itens.");
      return;
    }
    if (!itemForm.assetId) {
      setErrorMsg("Selecione um Ativo.");
      return;
    }

    try {
      setSavingItem(true);
      const payload = {
        ...itemForm,
        assetId: Number(itemForm.assetId),
        quantity: itemForm.quantity ? Number(itemForm.quantity) : null,
        negotiatedUnitPrice: itemForm.negotiatedUnitPrice
          ? Number(itemForm.negotiatedUnitPrice)
          : null,
        totalValue: itemForm.totalValue ? Number(itemForm.totalValue) : null,
        mix: productMix,
      };

      let url = `${apiBaseUrl}/api/jbp/${selectedJbpId}/itens`;
      let method = "POST";
      if (editingItemId) {
        url = `${apiBaseUrl}/api/jbp/itens/${editingItemId}`;
        method = "PUT";
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg("Item salvo com sucesso.");
        await carregarDetalheJbp(selectedJbpId); // Recarrega itens
        resetItemForm();
      } else {
        const d = await res.json();
        throw new Error(d.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar item.");
    } finally {
      setSavingItem(false);
    }
  }

  // Função específica para transição de status (workflow)
  async function handleStatusTransition(novoStatus: string) {
    if (!selectedJbpId) return;

    if (
      novoStatus === "aprovado" &&
      !confirm(
        "Confirma a aprovação deste JBP? Isso irá travar os valores."
      )
    ) {
      return;
    }

    try {
      setSavingHeader(true);
      const res = await apiFetch(`${apiBaseUrl}/api/jbp/${selectedJbpId}`, {
        method: "PUT",
        body: JSON.stringify({ status: novoStatus }),
      });

      if (res.ok) {
        setSuccessMsg(`Status alterado para: ${novoStatus.toUpperCase()}`);
        setHeaderForm((prev) => ({ ...prev, status: novoStatus }));
        await carregarListaJbps();
      } else {
        const d = await res.json();
        throw new Error(d.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao mudar status.");
    } finally {
      setSavingHeader(false);
    }
  }

  async function handleExcluirItem(idItem: number) {
    if (!confirm("Excluir item?")) return;
    try {
      const res = await apiFetch(`${apiBaseUrl}/api/jbp/itens/${idItem}`, {
        method: "DELETE",
      });
      if (res.ok && selectedJbpId) {
        await carregarDetalheJbp(selectedJbpId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleEditarItem(it: JbpItem) {
    setEditingItemId(it.id);
    setItemForm({
      assetId: String(it.assetId),
      initiativeType: it.initiativeType || "JBP",
      description: it.description || "",
      periodStart: it.periodStart ? it.periodStart.substring(0, 10) : "",
      periodEnd: it.periodEnd ? it.periodEnd.substring(0, 10) : "",
      storeScope: it.storeScope || "",
      unit: it.unit || "",
      quantity: it.quantity ? String(it.quantity) : "",
      negotiatedUnitPrice: it.negotiatedUnitPrice
        ? String(it.negotiatedUnitPrice)
        : "",
      totalValue: it.totalValue ? String(it.totalValue) : "",
      notes: it.notes || "",
    });
    const mixFromItem: MixItem[] =
      it.mix?.map((m) => ({
        type: m.brandCriteria ? "BRAND" : "PRODUCT",
        id: m.productId || m.id,
        label:
          m.product?.description ||
          m.brandCriteria ||
          m.categoryCriteria ||
          "Item",
        brandCriteria: m.brandCriteria || undefined,
        categoryCriteria: m.categoryCriteria || undefined,
      })) || [];
    setProductMix(mixFromItem);
    // Troca para a aba de itens caso nao esteja
    setActiveTab("itens");
  }


  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  return (
    <>
    <div className="panel-grid jbp-page">
      {/* ================= COLUNA ESQUERDA: LISTA DE JBP ================= */}
      <section className="panel-card bg-slate-900 text-slate-50 shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">JBP & JVC</h1>
            <p className="text-xs text-slate-200">Gestao de Acordos</p>
          </div>
          <button
            onClick={handleNovoJbp}
            className="px-3 py-1 bg-white text-slate-900 border border-slate-200 rounded-md text-xs font-bold hover:bg-slate-100 shadow-sm"
          >
            + Novo
          </button>
        </div>

        {/* LISTA DE JBPS RESTAURADA */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
          {loadingList && (
            <div className="text-xs text-slate-200 p-2">Carregando...</div>
          )}
          {!loadingList && jbps.length === 0 && (
            <div className="text-xs text-slate-200 p-2">
              Nenhum plano encontrado.
            </div>
          )}
          {jbps.map((j) => {
            const active = selectedJbpId === j.id;
            const totalCard = Number(j.totalBudget || 0).toLocaleString(
              "pt-BR",
              { style: "currency", currency: "BRL" }
            );
            return (
              <div
                key={j.id}
                className={`p-3 rounded-lg border transition-all ${
                  active
                    ? "bg-white border-blue-300 text-slate-900 shadow ring-2 ring-blue-200"
                    : "bg-slate-800 border-slate-700 hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold truncate">
                    {j.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {j.status || "Rascunho"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 flex justify-between">
                  <span className="font-semibold">
                    {j.supplier?.name || "Fornecedor..."} - {j.year || "--"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 flex justify-between mt-1">
                  <span className="font-mono text-slate-100">{totalCard}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => carregarDetalheJbp(j.id)}
                    className="text-[11px] px-2 py-1 bg-white text-slate-800 rounded border border-slate-200 hover:bg-slate-100"
                  >
                    Abrir
                  </button>
                  {j.status?.toLowerCase() === "aprovado" && (
                    <button
                      onClick={() => abrirModalDetalhe(j.id)}
                      className="text-[11px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Resumo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= COLUNA DIREITA: DETALHE COM TABS ================= */}
      <section className="flex flex-col gap-4">
        {/* Header do Painel Direito */}
        <div className="panel-card p-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {selectedJbpId ? "Editar Plano JBP" : "Criar Novo Plano"}
            </h2>
            <p className="text-xs text-slate-500">
              {headerForm.name || "Sem nome definido"}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedJbpId && (
              <button
                onClick={() => handlePrint && handlePrint()}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50 flex items-center gap-2 shadow-sm"
              >
                <span>📄</span> Exportar PDF
              </button>
            )}
            <button
              onClick={handleSalvarHeader}
              disabled={savingHeader}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {savingHeader ? "Salvando..." : "Salvar Cabeçalho"}
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-2">
          <TabButton
            id="geral"
            label="Visão Geral"
            active={activeTab === "geral"}
            onClick={() => setActiveTab("geral")}
          />
          <TabButton
            id="financeiro"
            label="Financeiro & Wallet"
            active={activeTab === "financeiro"}
            onClick={() => setActiveTab("financeiro")}
          />
          <TabButton
            id="itens"
            label={`Ativos & Mix (${items.length})`}
            active={activeTab === "itens"}
            onClick={() => setActiveTab("itens")}
          />
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="bg-white rounded-b-lg shadow-sm border border-t-0 border-slate-200 p-6 min-h-[400px]">
          {/* MENSAGENS DE ERRO/SUCESSO GLOBAIS */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200">
              {successMsg}
            </div>
          )}

          {/* ABA 1: VISÃO GERAL (Formulário Principal) */}
          {activeTab === "geral" && (
            <div className="animate-fade-in grid grid-cols-2 gap-6">
              <Field label="Fornecedor *">
                <select
                  name="supplierId"
                  value={headerForm.supplierId}
                  onChange={handleHeaderChange}
                  className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.nome}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome do Plano *">
                <input
                  type="text"
                  name="name"
                  value={headerForm.name}
                  onChange={handleHeaderChange}
                  placeholder="Ex: JBP 2025 - Varejo X"
                  className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                />
              </Field>

              <Field label="Ano">
                <input
                  type="number"
                  name="year"
                  value={headerForm.year}
                  onChange={handleHeaderChange}
                  className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                />
              </Field>

              {/* SUBSTITUI STATUS DROPDOWN POR WORKFLOW DE AÇÕES */}
              <div className="col-span-2 bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Fase Atual
                  </div>
                  <div
                    className={`text-sm font-bold uppercase ${
                      headerForm.status === "aprovado"
                        ? "text-green-600"
                        : headerForm.status === "negociacao"
                        ? "text-orange-600"
                        : "text-slate-600"
                    }`}
                  >
                    {headerForm.status === "rascunho" && "📝 Rascunho Inicial"}
                    {headerForm.status === "negociacao" && "🤝 Em Negociação"}
                    {headerForm.status === "aprovado" && "✅ Aprovado / Vigente"}
                    {headerForm.status === "em_execucao" && "🚀 Em Execução"}
                  </div>
                </div>

                <div className="flex gap-2">
                  {headerForm.status === "rascunho" && (
                    <button
                      type="button"
                      onClick={() => handleStatusTransition("negociacao")}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow-sm"
                    >
                      Enviar para Negociação
                    </button>
                  )}

                  {headerForm.status === "negociacao" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusTransition("rascunho")}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50"
                      >
                        Devolver / Ajustar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusTransition("aprovado")}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm"
                      >
                        Aprovar Plano
                      </button>
                    </>
                  )}

                  {headerForm.status === "aprovado" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 mr-2">
                        Plano travado.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStatusTransition("negociacao")}
                        className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-300"
                      >
                        Reabrir Negociação
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* FIM DO BLOCO DE WORKFLOW */}

              <Field label="Início">
                <input
                  type="date"
                  name="periodStart"
                  value={headerForm.periodStart}
                  onChange={handleHeaderChange}
                  className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                />
              </Field>

              <Field label="Fim">
                <input
                  type="date"
                  name="periodEnd"
                  value={headerForm.periodEnd}
                  onChange={handleHeaderChange}
                  className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                />
              </Field>

              <div className="col-span-2">
                <Field label="Resumo Estratégico">
                  <textarea
                    name="strategy"
                    value={headerForm.strategy}
                    onChange={handleHeaderChange}
                    rows={3}
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                    placeholder="Objetivos de crescimento..."
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ABA 2: FINANCEIRO ESTRATEGICO */}
          {activeTab === "financeiro" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <WalletWidget
                totalJbp={totalJbpNumber}
                wallet={wallet}
                loading={walletLoading}
                error={walletError}
                onRefresh={fetchWallet}
              />

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-4 border-b border-slate-200 pb-2">
                    Composicao da Verba
                  </h4>
                  <div className="space-y-4">
                    <Field label="Rebate / Sell-out (R$)">
                      <input
                        type="number"
                        value={financialData.rebate}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, rebate: e.target.value })
                        }
                        placeholder="Ex: Bonificacao por meta"
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      />
                    </Field>
                    <Field label="Midia & Trade (R$)">
                      <input
                        type="number"
                        value={financialData.marketing}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, marketing: e.target.value })
                        }
                        placeholder="Ex: Tabloide, Digital, Ponta"
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      />
                    </Field>
                    <Field label="Desconto em Nota / Sell-in (R$)">
                      <input
                        type="number"
                        value={financialData.sellIn}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, sellIn: e.target.value })
                        }
                        placeholder="Ex: Desconto no boleto"
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      />
                    </Field>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">
                        TOTAL DO PLANO:
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {Number(headerForm.totalBudget).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-4 border-b border-slate-200 pb-2">
                    Analise de Retorno (ROI)
                  </h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Venda Base (Ano Ant.)">
                      <input
                        type="number"
                        value={financialData.salesBase}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, salesBase: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-slate-50"
                      />
                    </Field>
                    <Field label="Meta de Venda (Projecao)">
                      <input
                        type="number"
                        value={financialData.salesTarget}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, salesTarget: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-blue-200 rounded bg-blue-50 font-semibold text-blue-800"
                      />
                    </Field>
                  </div>

                  {Number(financialData.salesTarget) > 0 && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Crescimento</div>
                        <div
                          className={`text-lg font-bold ${
                            ((Number(financialData.salesTarget) / Number(financialData.salesBase || 1)) - 1) > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {(
                            ((Number(financialData.salesTarget) / Number(financialData.salesBase || 1)) - 1) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      <div className="text-center border-l border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase">% Investimento</div>
                        <div
                          className={`text-lg font-bold ${
                            (Number(headerForm.totalBudget) / Number(financialData.salesTarget)) * 100 > 15
                              ? "text-orange-500"
                              : "text-slate-800"
                          }`}
                        >
                          {(
                            (Number(headerForm.totalBudget) / Number(financialData.salesTarget)) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                        <div className="text-[9px] text-slate-400">(Ideal: &lt; 15%)</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Field label="Forma de Pagamento">
                      <select
                        value={financialData.paymentMethod}
                        onChange={(e) =>
                          setFinancialData({ ...financialData, paymentMethod: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      >
                        <option value="ND">Nota de Debito (Boleto)</option>
                        <option value="DESC">Desconto em Duplicata</option>
                        <option value="DEP">Deposito Bancario</option>
                        <option value="PROD">Bonificacao em Produto</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ABA 3: ITENS (Tabela + Formulário de Item) */}
          {activeTab === "itens" && (
            <div className="animate-fade-in flex flex-col gap-6">
              {!selectedJbpId ? (
                <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded border border-dashed border-slate-300">
                  Salve o cabeçalho do plano antes de adicionar itens.
                </div>
              ) : (
                <>
                  {/* Formulário de Adição/Edição de Item */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
                      {editingItemId ? "Editar Item" : "Adicionar Novo Item"}
                    </h4>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="col-span-2">
                        <Field label="Ativo *">
                          <select
                            name="assetId"
                            value={itemForm.assetId}
                            onChange={handleItemChange}
                            className="w-full p-2 text-xs border border-slate-300 rounded"
                          >
                            <option value="">Selecione...</option>
                            {ativos.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.channel})
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Tipo">
                        <select
                          name="initiativeType"
                          value={itemForm.initiativeType}
                          onChange={handleItemChange}
                          className="w-full p-2 text-xs border border-slate-300 rounded"
                        >
                          <option value="JBP">JBP</option>
                          <option value="JVC">JVC</option>
                          <option value="PROMO">Promo</option>
                        </select>
                      </Field>
                      <Field label="Qtd de Espacos">
                        <input
                          type="number"
                          name="quantity"
                          value={itemForm.quantity}
                          onChange={handleItemChange}
                          className="w-full p-2 text-xs border border-slate-300 rounded"
                        />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Descrição">
                          <input
                            type="text"
                            name="description"
                            value={itemForm.description}
                            onChange={handleItemChange}
                            className="w-full p-2 text-xs border border-slate-300 rounded"
                            placeholder="Ex: Ponta de Gôndola - 50 lojas"
                          />
                        </Field>
                      </div>
                      <Field label="R$ Unit.">
                        <input
                          type="number"
                          name="negotiatedUnitPrice"
                          value={itemForm.negotiatedUnitPrice}
                          onChange={handleItemChange}
                          className="w-full p-2 text-xs border border-slate-300 rounded"
                        />
                      </Field>
                    <Field label="R$ Total">
                      <input
                        type="number"
                        name="totalValue"
                        value={itemForm.totalValue}
                        onChange={handleItemChange}
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                        placeholder="Calculado..."
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <ProductMixSelector
                      maxSlots={Number(itemForm.quantity) || 0}
                      products={products}
                      value={productMix}
                      onChange={setProductMix}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                      {editingItemId && (
                        <button
                          onClick={resetItemForm}
                          className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        onClick={handleSalvarItem}
                        disabled={savingItem}
                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-900"
                      >
                        {savingItem
                          ? "Salvando..."
                          : editingItemId
                          ? "Atualizar Item"
                          : "Adicionar Item"}
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Itens */}
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ativo</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Qtd</th>
                          <th className="p-3">Mix / Produtos</th>
                          <th className="p-3">Total (R$)</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-4 text-center text-slate-400"
                            >
                              Nenhum item cadastrado.
                            </td>
                          </tr>
                        )}
                        {items.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-700">
                              {it.asset?.name}
                              <div className="text-[10px] text-slate-400 font-normal">
                                {it.description}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  it.initiativeType === "JVC"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {it.initiativeType}
                            </span>
                          </td>
                          <td className="p-3">{it.quantity}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(it.mix || []).map((m, idx) => (
                                <span
                                  key={`${it.id}-mix-${idx}`}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    m.brandCriteria
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {m.product?.description ||
                                    m.brandCriteria ||
                                    m.categoryCriteria ||
                                    "Item"}
                                </span>
                              ))}
                              {((it.quantity || 0) - ((it.mix || []).length || 0)) > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                  {Math.max(
                                    0,
                                    (it.quantity || 0) - ((it.mix || []).length || 0)
                                  )}{" "}
                                  a definir
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            {Number(it.totalValue || 0).toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" }
                            )}
                            </td>
                            <td className="p-3 text-right gap-2">
                              <button
                                onClick={() => handleEditarItem(it)}
                                className="text-blue-600 hover:underline mr-2"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleExcluirItem(it.id)}
                                className="text-red-600 hover:underline"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* STICKY FOOTER DE RESUMO FINANCEIRO */}
        {selectedJbpId && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: "auto",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.05)",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Investimento Total
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {totalJbpNumber.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Soma dos Itens
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: items.length > 0 ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {itensTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Saldo da Wallet
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {wallet
                    ? (walletSaldoPosPlano ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor:
                    headerForm.status === "aprovado"
                      ? "#dcfce7"
                      : "#f1f5f9",
                  color:
                    headerForm.status === "aprovado"
                      ? "#166534"
                      : "#475569",
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Status: {headerForm.status?.toUpperCase()}
              </div>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor:
                    prazoStatus === "No prazo" ? "#e0f2fe" : "#fee2e2",
                  color:
                    prazoStatus === "No prazo" ? "#0ea5e9" : "#b91c1c",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {prazoStatus}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Componente invisivel para impressao do contrato */}
      <JbpContractPrint
        ref={componentRef}
        header={{
          name: headerForm.name,
          supplierName:
            suppliers.find((s) => String(s.id) === headerForm.supplierId)?.name ||
            "Industria",
          year: headerForm.year,
          periodStart: headerForm.periodStart,
          periodEnd: headerForm.periodEnd,
          strategy: headerForm.strategy,
        }}
        items={items}
      />
    </div>

    {modalOpen && modalData.jbp && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Cabeçalho */}
          <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-800">
                  {modalData.jbp.name || "Sem Nome"}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                    modalData.jbp.status === "aprovado"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {modalData.jbp.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {modalData.jbp.supplier?.name || "Fornecedor"} • {modalData.jbp.year || "—"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold">Valor Total</div>
              <div className="text-2xl font-bold text-blue-600">
                {Number(modalData.jbp.totalBudget || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          </div>

          {/* Corpo */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border border-slate-100 bg-white shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Dados Gerais</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>
                    <strong>Período:</strong>{" "}
                    {modalData.jbp.periodStart ? new Date(modalData.jbp.periodStart).toLocaleDateString("pt-BR") : "—"}{" "}
                    até{" "}
                    {modalData.jbp.periodEnd ? new Date(modalData.jbp.periodEnd).toLocaleDateString("pt-BR") : "—"}
                  </li>
                  <li>
                    <strong>Estratégia:</strong> {modalData.jbp.strategy || "—"}
                  </li>
                  <li>
                    <strong>KPI:</strong> {modalData.jbp.kpiSummary || "—"}
                  </li>
                </ul>
              </div>

            <div className="p-4 rounded-lg border border-slate-100 bg-slate-50 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Saúde Financeira</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-700 font-semibold">Soma dos Itens:</span>
                  <span className="font-bold text-slate-900">
                    {(modalData.jbp.itens || [])
                      .reduce((acc, i) => acc + Number(i.totalValue || 0), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-700 font-semibold">Wallet consumida:</span>
                  <span className="font-bold text-slate-900">
                    {modalData.wallet
                      ? `${modalData.wallet.consumedBudget.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} / ${modalData.wallet.totalBudget.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`
                      : "—"}
                  </span>
                </li>
                <li className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-700 font-semibold">% Investimento (sobre total itens):</span>
                  <span className="font-bold text-slate-900">
                    {Number(modalData.jbp.totalBudget || 0) > 0
                      ? (
                          ((modalData.jbp.itens || []).reduce(
                            (acc, i) => acc + Number(i.totalValue || 0),
                            0
                          ) /
                            Number(modalData.jbp.totalBudget || 1)) *
                          100
                        ).toFixed(1) + "%"
                      : "—"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
                🛒 Ativos & Mix de Produtos
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">
                  {(modalData.jbp.itens || []).length}
                </span>
              </h4>

              <div className="space-y-3">
                {(modalData.jbp.itens || []).map((it, idx) => (
                  <div
                    key={`${it.id}-${idx}`}
                    className="flex gap-4 p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {(it.asset?.name || "AT").substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-slate-800">{it.asset?.name || "Ativo"}</h5>
                        <span className="font-mono font-bold text-slate-700 text-sm">
                          {Number(it.totalValue || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {it.description || "—"} • {it.quantity || 0} Inserções
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {(it.mix || []).map((m, midx) => (
                          <span
                            key={`${it.id}-mix-${midx}`}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold flex items-center gap-1 ${
                              m.brandCriteria
                                ? "bg-purple-50 border-purple-100 text-purple-800"
                                : "bg-blue-50 border-blue-100 text-blue-800"
                            }`}
                          >
                            {m.brandCriteria ? "🏷️" : "📦"}{" "}
                            {m.product?.description || m.brandCriteria || m.categoryCriteria || "Item"}
                          </span>
                        ))}
                        {((it.quantity || 0) - ((it.mix || []).length || 0)) > 0 && (
                        <span className="px-2 py-0.5 rounded-md border text-[10px] font-semibold bg-amber-50 border-amber-100 text-amber-800">
                          {Math.max(0, (it.quantity || 0) - ((it.mix || []).length || 0))} a definir
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                ))}
                {(modalData.jbp.itens || []).length === 0 && (
                  <div className="p-3 text-xs text-slate-500">Nenhum item adicionado.</div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé de ações */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                handlePrint();
                setModalOpen(false);
              }}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded shadow-sm hover:bg-slate-50 flex items-center gap-2"
            >
              📄 Imprimir PDF
            </button>
            {headerForm.status === "rascunho" && (
              <button
                onClick={() => {
                  handleStatusTransition("negociacao");
                  setModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow-sm hover:bg-blue-700"
              >
                Enviar p/ Negociação
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// Componente simples para Labels
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
