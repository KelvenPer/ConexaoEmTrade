"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CalendarItem = {
  id: number;
  title: string | null;
  contentType: string | null;
  approvalStatus: string;
  artDeadline: string | null;
  approvalDeadline: string | null;
  goLiveDate: string | null;
  creativeUrl: string | null;
  urlDestino: string | null;
  notes: string | null;
  assetId: number;
  assetName: string | null;
  assetChannel: string | null;
};

type CalendarCampaign = {
  id: number;
  name: string;
  status: string;
  supplierId: number;
  supplierName: string | null;
  channel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  items: CalendarItem[];
};

type Supplier = {
  id: number;
  name?: string;
  nome?: string;
  fantasia?: string;
};

type ApiCalendarResponse = {
  start: string;
  end: string;
  campanhas: CalendarCampaign[];
};

const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const PAGE_DAYS = 7; // agrupamos por semana para paginar o calendário

function dateDiffDays(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function toInputDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDayArray(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatMonthRangeLabel(start: Date | null, end: Date | null) {
  if (!start || !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const s = start.toLocaleDateString("pt-BR", opts);
  const e = end.toLocaleDateString("pt-BR", opts);
  return s === e ? s : `${s} - ${e}`;
}

// paleta simples por status
const STATUS_COLORS: Record<
  string,
  { bar: string; pillBg: string; pillText: string }
> = {
  aprovado: {
    bar: "#22c55e",
    pillBg: "#dcfce7",
    pillText: "#166534",
  },
  em_producao: {
    bar: "#6366f1",
    pillBg: "#e0e7ff",
    pillText: "#312e81",
  },
  planejada: {
    bar: "#0ea5e9",
    pillBg: "#e0f2fe",
    pillText: "#075985",
  },
  encerrada: {
    bar: "#9ca3af",
    pillBg: "#e5e7eb",
    pillText: "#111827",
  },
};

export default function CalendarioCampanhasPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [data, setData] = useState<CalendarCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chunkIndex, setChunkIndex] = useState(0);

  // periodo padrao: mes atual
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  }, []);

  // carrega fornecedores + calendario quando as datas mudam
  useEffect(() => {
    if (!startDate || !endDate) return;
    carregarSuppliers();
    carregarCalendario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, supplierFilter]);

  // quando o range muda, resetamos a página do calendário
  useEffect(() => {
    setChunkIndex(0);
  }, [startDate, endDate]);

  async function carregarSuppliers() {
    try {
      const res = await apiFetch(`${apiBaseUrl}/api/fornecedores`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar fornecedores.");
      }
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function carregarCalendario() {
    try {
      setLoading(true);
      setErrorMsg("");

      const params = new URLSearchParams();
      if (startDate) params.append("start", startDate);
      if (endDate) params.append("end", endDate);
      if (supplierFilter) params.append("supplierId", supplierFilter);

      const res = await apiFetch(
        `${apiBaseUrl}/api/campanhas/calendar?${params.toString()}`
      );
      const json: ApiCalendarResponse | { message?: string } = await res.json();

      if (!res.ok || !("campanhas" in json)) {
        const maybeMessage = (json as { message?: string }).message;
        throw new Error(maybeMessage || "Erro ao carregar calendario.");
      }

      setData(json.campanhas);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar calendario.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  const rangeStart = startDate ? new Date(startDate) : null;
  const rangeEnd = endDate ? new Date(endDate) : null;

  const days =
    rangeStart && rangeEnd ? buildDayArray(rangeStart, rangeEnd) : [];

  // cria páginas (semanas) para o calendário
  const dayChunks: Date[][] = [];
  for (let i = 0; i < days.length; i += PAGE_DAYS) {
    dayChunks.push(days.slice(i, i + PAGE_DAYS));
  }

  // garante que o índice atual nunca saia do limite quando o tamanho do range muda
  useEffect(() => {
    setChunkIndex((i) =>
      i >= dayChunks.length ? Math.max(dayChunks.length - 1, 0) : i
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  const safeChunkIndex =
    chunkIndex >= dayChunks.length ? Math.max(dayChunks.length - 1, 0) : chunkIndex;
  const activeDays = dayChunks[safeChunkIndex] || [];
  const chunkStart = activeDays[0] || null;
  const chunkEnd = activeDays[activeDays.length - 1] || null;

  const rangeLabel = formatMonthRangeLabel(rangeStart, rangeEnd);

  return (
    <div className="calendar-page">
      <section className="calendar-hero ct-card">
        <div className="calendar-hero__top">
          <div>
            <p className="calendar-eyebrow">Marketing / Calendario</p>
            <h1 className="calendar-title">Calendario de campanhas</h1>
            <p className="calendar-sub">
              Visao macro das campanhas e pecas aprovadas no tempo, por
              fornecedor e canal. Cada faixa abaixo e uma peca aprovada alinhada
              ao periodo selecionado.
            </p>
          </div>

          <div className="calendar-hero__actions">
            <div className="calendar-chip">
              {rangeLabel || "Periodo customizado"}
            </div>
            <button
              type="button"
              onClick={carregarCalendario}
              className="ct-btn-secondary"
            >
              Recarregar
            </button>
          </div>
        </div>

        <div className="calendar-filters">
          <Field label="Fornecedor">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="calendar-input"
            >
              <option value="">Todos</option>
              {suppliers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.nome || f.fantasia}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Inicio do periodo">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="calendar-input"
            />
          </Field>

          <Field label="Fim do periodo">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="calendar-input"
            />
          </Field>

          <div className="calendar-quickpills">
            <span className="calendar-pill is-active">Todas</span>
            <span className="calendar-pill">Ativas</span>
            <span className="calendar-pill">Planejadas</span>
          </div>
        </div>

        {errorMsg && <div className="calendar-error">{errorMsg}</div>}
      </section>

      <section className="calendar-board ct-card">
        <div className="calendar-toolbar">
          <div>
            <div className="calendar-toolbar__title">Linha do tempo</div>
            <div className="calendar-toolbar__muted">
              {days.length > 0
                ? `${days.length} dias em exibicao`
                : "Defina o periodo para ver o calendario"}
            </div>
          </div>
          <div className="calendar-toolbar__filters">
            <span className="calendar-chip light">
              {data.length} campanhas encontradas
            </span>
            <span className="calendar-pill">Semana</span>
            <span className="calendar-pill is-active">Mes</span>
            <span className="calendar-pill">Trim.</span>
            {dayChunks.length > 1 && (
              <div className="calendar-nav">
                <button
                  type="button"
                  className="calendar-nav__btn"
                  onClick={() => setChunkIndex((i) => Math.max(0, i - 1))}
                  disabled={safeChunkIndex === 0}
                >
                  ◀
                </button>
                <span className="calendar-nav__label">
                  Pag {safeChunkIndex + 1}/{dayChunks.length}
                </span>
                <button
                  type="button"
                  className="calendar-nav__btn"
                  onClick={() =>
                    setChunkIndex((i) =>
                      Math.min(dayChunks.length - 1, i + 1)
                    )
                  }
                  disabled={safeChunkIndex === dayChunks.length - 1}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="calendar-scroll">
          <div
            className="calendar-grid"
            style={
              {
                "--days-count": activeDays.length || 1,
              } as React.CSSProperties
            }
          >
            {activeDays.length > 0 && (
              <div className="calendar-grid__header">
                <div className="calendar-grid__spacer">Campanhas</div>
                {activeDays.map((d) => {
                  const dow = DAY_NAMES_SHORT[d.getDay()];
                  const dayNum = d.getDate();
                  return (
                    <div
                      key={d.toISOString()}
                      className="calendar-grid__day"
                    >
                      <span className="calendar-grid__dow">{dow}</span>
                      <span className="calendar-grid__number">
                        {String(dayNum).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="calendar-empty">Carregando campanhas...</div>
            ) : data.length === 0 ? (
              <div className="calendar-empty">
                Nenhuma campanha com pecas aprovadas nesse periodo. Ajuste as
                datas ou aguarde novas aprovacoes.
              </div>
            ) : (
              <div className="calendar-grid__body">
                {data.map((c) => {
                  const statusKey = (c.status || "").toLowerCase();
                  const palette =
                    STATUS_COLORS[statusKey] || STATUS_COLORS["planejada"];

                  let bar:
                    | { leftPct: number; widthPct: number }
                    | null = null;

                  if (chunkStart && chunkEnd && c.items.length > 0) {
                    const dates: Date[] = [];

                    if (c.periodStart) {
                      const d = new Date(c.periodStart);
                      if (!Number.isNaN(d.getTime())) {
                        dates.push(d);
                      }
                    }
                    if (c.periodEnd) {
                      const d = new Date(c.periodEnd);
                      if (!Number.isNaN(d.getTime())) {
                        dates.push(d);
                      }
                    }

                    c.items.forEach((it) => {
                      const main =
                        it.goLiveDate ||
                        it.approvalDeadline ||
                        it.artDeadline;
                      if (main) {
                        const d = new Date(main);
                        if (!Number.isNaN(d.getTime())) {
                          dates.push(d);
                        }
                      }
                    });

                    if (dates.length > 0) {
                      const min = new Date(
                        Math.min(...dates.map((d) => d.getTime()))
                      );
                      const max = new Date(
                        Math.max(...dates.map((d) => d.getTime()))
                      );

                      const startClip = min < chunkStart ? chunkStart : min;
                      const endClip = max > chunkEnd ? chunkEnd : max;

                      const chunkDuration = Math.max(
                        1,
                        dateDiffDays(chunkStart, chunkEnd)
                      );
                      const offsetDays = dateDiffDays(
                        chunkStart,
                        startClip
                      );
                      const durationDays = Math.max(
                        1,
                        dateDiffDays(startClip, endClip)
                      );

                      let leftPct = (offsetDays / chunkDuration) * 100;
                      let widthPct = (durationDays / chunkDuration) * 100;

                      if (leftPct < 0) leftPct = 0;
                      if (leftPct > 100) leftPct = 100;
                      if (leftPct + widthPct > 100) {
                        widthPct = 100 - leftPct;
                      }
                      if (widthPct < 2) widthPct = 2;

                      bar = { leftPct, widthPct };
                    }
                  }

                  const totalPecas = c.items.length;

                  return (
                    <div key={c.id} className="calendar-row">
                      <div className="calendar-row__meta">
                        <div className="calendar-row__title">{c.name}</div>
                        <div className="calendar-row__subtitle">
                          {c.supplierName || "Fornecedor nao informado"} -{" "}
                          {c.channel || "Canal nao definido"}
                        </div>
                        <div className="calendar-row__tags">
                          <span
                            className="calendar-status"
                            style={{
                              backgroundColor: palette.pillBg,
                              color: palette.pillText,
                            }}
                          >
                            {c.status || "Planejada"}
                          </span>
                          <span className="calendar-meta">
                            {totalPecas} peca{totalPecas === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="calendar-row__track">
                        {days.length > 0 && (
                          <div className="calendar-row__grid">
                            {days.map((d) => (
                              <div
                                key={`grid-${d.toISOString()}`}
                                className="calendar-row__grid-cell"
                              />
                            ))}
                          </div>
                        )}

                        {bar && (
                          <div
                            className="calendar-row__bar"
                            style={{
                              left: `${bar.leftPct}%`,
                              width: `${bar.widthPct}%`,
                              backgroundColor: palette.bar,
                              boxShadow:
                                "0 14px 28px rgba(15,23,42,0.18)",
                            }}
                          >
                            <div className="calendar-row__bar-text">
                              {formatDate(c.periodStart)} -{" "}
                              {formatDate(c.periodEnd)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="calendar-field">
      <label className="calendar-field__label">{label}</label>
      {children}
    </div>
  );
}
