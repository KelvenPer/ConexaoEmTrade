"use client";

import { useEffect, useState } from "react";

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

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMonthRange(days: Date[]) {
  if (!days.length) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
  };
  const a = first.toLocaleDateString("pt-BR", opts);
  const b = last.toLocaleDateString("pt-BR", opts);
  return a === b ? a : `${a} · ${b}`;
}

function getBarColor(channel: string | null) {
  switch (channel) {
    case "LOJA_FISICA":
      return "#fef3c7"; // amarelo suave
    case "ECOMMERCE":
      return "#dbeafe"; // azul
    case "APP":
      return "#dcfce7"; // verde
    case "MULTICANAL":
      return "#fee2e2"; // vermelho claro
    default:
      return "#e5e7eb"; // cinza
  }
}

// calcula em quais colunas do grid a barra começa/termina
function getBarSpan(
  startStr: string | null,
  endStr: string | null,
  rangeStart: Date,
  totalDays: number
): { startCol: number; endCol: number } | null {
  if (!startStr && !endStr) return null;

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (startStr) {
    const d = new Date(startStr);
    if (!Number.isNaN(d.getTime())) startDate = d;
  }

  if (endStr) {
    const d = new Date(endStr);
    if (!Number.isNaN(d.getTime())) endDate = d;
  }

  // se só tiver uma das datas, considera 1 dia
  if (!startDate && endDate) startDate = endDate;
  if (!endDate && startDate) endDate = startDate;
  if (!startDate || !endDate) return null;

  let startIndex = Math.floor(dateDiffDays(rangeStart, startDate));
  let endIndex = Math.floor(dateDiffDays(rangeStart, endDate));

  if (endIndex < 0 || startIndex > totalDays - 1) return null;

  if (startIndex < 0) startIndex = 0;
  if (endIndex > totalDays - 1) endIndex = totalDays - 1;
  if (endIndex < startIndex) endIndex = startIndex;

  return {
    startCol: startIndex + 1,
    endCol: endIndex + 2, // grid é exclusivo no fim
  };
}

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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Inicializa período padrão (1º dia do mês até +2 meses)
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  }, []);

  // Carregar fornecedores + calendário quando período estiver pronto
  useEffect(() => {
    if (!startDate || !endDate) return;
    carregarSuppliers();
    carregarCalendario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, supplierFilter]);

  async function carregarSuppliers() {
    try {
      const res = await fetch(`${apiBaseUrl}/api/fornecedores`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao carregar fornecedores.");
      }
      setSuppliers(data);
    } catch (err: any) {
      console.warn("Erro ao carregar fornecedores:", err);
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

      const res = await fetch(
        `${apiBaseUrl}/api/campanhas/calendar?${params.toString()}`
      );
      const json: ApiCalendarResponse | { message?: string } =
        await res.json();

      if (!res.ok) {
        // ex: ID inválido, etc
        setData([]);
        setErrorMsg((json as any).message || "Erro ao carregar calendário.");
        return;
      }

      if (!("campanhas" in json)) {
        // resposta inesperada, não quebra a tela
        setData([]);
        setErrorMsg("Resposta inesperada do servidor de calendário.");
        return;
      }

      setData(json.campanhas);
    } catch (err: any) {
      console.warn("Erro ao carregar calendário:", err);
      setErrorMsg(err.message || "Erro ao carregar calendário.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // range de timeline
  const rangeStart = startDate ? new Date(startDate) : null;
  const rangeEnd = endDate ? new Date(endDate) : null;

  const days: Date[] = [];
  if (rangeStart && rangeEnd) {
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // layout tipo planner: largura fixa por dia + scroll horizontal
  const DAY_COL_WIDTH = 56; // px
  const dayCount = days.length || 1;
  const minWidth = 220 + dayCount * DAY_COL_WIDTH;
  const gridTemplateAll = `220px repeat(${dayCount}, ${DAY_COL_WIDTH}px)`;
  const gridTemplateDays = `repeat(${dayCount}, ${DAY_COL_WIDTH}px)`;

  const totalRangeDays = days.length || 1;

  function toggleExpanded(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Header + filtros */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
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
                maxWidth: 520,
              }}
            >
              Visão macro das campanhas e peças aprovadas no tempo, por
              fornecedor e canal. Cada barra representa uma peça creative
              aprovada para veiculação.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              {data.length} campanhas no período
            </span>
            <button
              type="button"
              onClick={carregarCalendario}
              style={{
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                padding: "4px 12px",
                background: "#ffffff",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>

        {/* filtros */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <Field label="Fornecedor">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos</option>
              {suppliers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.nome || f.fantasia}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Início do período">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Fim do período">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {errorMsg && (
          <div
            style={{
              fontSize: 12,
              color: "#b91c1c",
            }}
          >
            {errorMsg}
          </div>
        )}
      </section>

      {/* Grid principal: header da timeline + linhas de campanhas, todos dentro do mesmo scroll horizontal */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth }}>
            {/* Cabeçalho timeline com dias */}
            {days.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  <span>{formatMonthRange(days)}</span>
                  <span>{days.length} dias em exibição</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplateAll,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div />{/* coluna vazia para labels */}
                  {days.map((d) => {
                    const weekday = WEEKDAYS[d.getDay()];
                    const dayNum = d.getDate();
                    return (
                      <div
                        key={d.toISOString()}
                        style={{
                          textAlign: "center",
                          fontSize: 10,
                          paddingBottom: 4,
                          paddingTop: 2,
                          borderLeft: "1px solid #f3f4f6",
                          color: "#6b7280",
                        }}
                      >
                        <div>{weekday}</div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {String(dayNum).padStart(2, "0")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Carregando campanhas aprovadas...
              </div>
            ) : data.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  paddingTop: 8,
                }}
              >
                Nenhuma campanha com peças aprovadas nesse período. Ajuste o
                filtro de datas ou aguarde novas aprovações.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {data.map((c) => {
                  const isExpanded = expandedId === c.id;
                  const totalPecas = c.items.length;

                  return (
                    <div key={c.id}>
                      {/* Linha da campanha: label + faixa de dias com barras */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: gridTemplateAll,
                          alignItems: "stretch",
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          backgroundColor: isExpanded
                            ? "#eff6ff"
                            : "#f9fafb",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleExpanded(c.id)}
                      >
                        {/* Coluna de informações da campanha */}
                        <div
                          style={{
                            padding: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 6,
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
                              {c.status || "aprovada"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                            }}
                          >
                            {c.supplierName ||
                              "Fornecedor não informado"}{" "}
                            • {c.channel || "Canal não definido"} •{" "}
                            {totalPecas} peça
                            {totalPecas === 1 ? "" : "s"}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#4b5563",
                            }}
                          >
                            {formatDate(c.periodStart)} →{" "}
                            {formatDate(c.periodEnd)}
                          </div>
                        </div>

                        {/* Coluna timeline: grid por dia + barras das peças */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: gridTemplateDays,
                            position: "relative",
                          }}
                        >
                          {/* linhas verticais leves */}
                          {days.map((d) => (
                            <div
                              key={`col-${c.id}-${d.toISOString()}`}
                              style={{
                                borderLeft: "1px solid #f3f4f6",
                              }}
                            />
                          ))}

                          {/* barras das peças aprovadas */}
                          {rangeStart &&
                            c.items.map((it) => {
                              const barSpan = getBarSpan(
                                it.artDeadline || it.goLiveDate,
                                it.goLiveDate || it.approvalDeadline,
                                rangeStart,
                                totalRangeDays
                              );
                              if (!barSpan) return null;

                              const color = getBarColor(c.channel);

                              return (
                                <div
                                  key={it.id}
                                  title={
                                    (it.title || "(sem título)") +
                                    (it.goLiveDate
                                      ? ` • Go live: ${formatDate(
                                          it.goLiveDate
                                        )}`
                                      : "")
                                  }
                                  style={{
                                    gridColumn: `${barSpan.startCol} / ${barSpan.endCol}`,
                                    margin: "3px 2px",
                                    padding: "2px 6px",
                                    borderRadius: 999,
                                    backgroundColor: color,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 10,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    alignSelf: "center",
                                  }}
                                >
                                  {it.title || "(sem título)"}
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Escopo expandido com detalhes das peças aprovadas */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 4,
                            marginBottom: 6,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            padding: 10,
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          {c.items.length === 0 ? (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                              }}
                            >
                              Nenhuma peça aprovada vinculada a esta
                              campanha no período.
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
                                      backgroundColor: "#eef2ff",
                                      textAlign: "left",
                                    }}
                                  >
                                    <Th>Peça</Th>
                                    <Th>Ativo</Th>
                                    <Th>Canal</Th>
                                    <Th>Go live</Th>
                                    <Th>Arte</Th>
                                    <Th>Destino</Th>
                                    <Th>Notas</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.items.map((it) => (
                                    <tr
                                      key={it.id}
                                      style={{
                                        borderBottom:
                                          "1px solid #e5e7eb",
                                      }}
                                    >
                                      <Td>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection:
                                              "column",
                                            gap: 2,
                                          }}
                                        >
                                          <span>
                                            {it.title ||
                                              "(sem título)"}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 10,
                                              color: "#6b7280",
                                            }}
                                          >
                                            {it.contentType ||
                                              "-"}
                                          </span>
                                        </div>
                                      </Td>
                                      <Td>{it.assetName || "-"}</Td>
                                      <Td>
                                        {it.assetChannel || "—"}
                                      </Td>
                                      <Td>
                                        {formatDate(
                                          it.goLiveDate
                                        )}
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
                                              textDecoration:
                                                "underline",
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
                                              textDecoration:
                                                "underline",
                                            }}
                                          >
                                            Link
                                          </a>
                                        ) : (
                                          "-"
                                        )}
                                      </Td>
                                      <Td>{it.notes || "-"}</Td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
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
      color: "#4b5563",
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
