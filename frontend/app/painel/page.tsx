"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Store,
  Megaphone,
  FileText,
  Clock,
} from "lucide-react";

const kpis = {
  totalInvestido: 4500000,
  roiMedio: 14.2,
  jbpsAtivos: 12,
  campanhasEmCurso: 8,
  lojasAuditadas: 1450,
};

const pipelineStatus = [
  { label: "JBPs em Negociacao", value: 3, color: "bg-yellow-500" },
  { label: "Aprovados (Aguard. Mkt)", value: 5, color: "bg-blue-500" },
  { label: "Campanhas em Veiculacao", value: 8, color: "bg-purple-500" },
  { label: "Execucao Finalizada", value: 12, color: "bg-green-500" },
];

const alertList = [
  { id: 1, type: "critico", msg: "NESTLE: JBP anual excedeu 15% do budget previsto.", time: "2h atras" },
  { id: 2, type: "aviso", msg: "Campanha 'Pascoa 2025' aguardando arte ha 3 dias.", time: "5h atras" },
  { id: 3, type: "info", msg: "3 novas lojas cadastradas no Cluster Ouro.", time: "1d atras" },
];

const performanceData = [
  { fornecedor: "Nestle", investido: 1200000, retorno: 14500000, status: "Bom" },
  { fornecedor: "Unilever", investido: 850000, retorno: 7200000, status: "Atencao" },
  { fornecedor: "P&G", investido: 600000, retorno: 5100000, status: "Bom" },
  { fornecedor: "Danone", investido: 450000, retorno: 3800000, status: "Otimo" },
];

type Tone = "blue" | "purple" | "orange" | "green";

const toneStyles: Record<Tone, { iconBg: string; badge: string }> = {
  blue: { iconBg: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  purple: { iconBg: "bg-purple-50 text-purple-600", badge: "bg-purple-50 text-purple-700" },
  orange: { iconBg: "bg-orange-50 text-orange-600", badge: "bg-orange-50 text-orange-700" },
  green: { iconBg: "bg-green-50 text-green-600", badge: "bg-green-50 text-green-700" },
};

type KpiCardProps = {
  title: string;
  value: string;
  delta: string;
  icon: ReactNode;
  tone: Tone;
};

export default function DashboardGeralPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Torre de Controle</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visao unificada de Trade Marketing: Planejamento, Tatica e Execucao.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-300 text-xs font-semibold px-3 py-2 rounded shadow-sm text-slate-700 outline-none hover:bg-slate-50">
            <option>Visao: Geral (Varejo)</option>
            <option>Visao: Por Industria</option>
            <option>Visao: Por Categoria</option>
          </select>
          <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded shadow hover:bg-slate-800 flex items-center gap-2">
            <TrendingUp size={14} />
            Atualizar KPIs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Investimento Contratado (JBP)"
          value={kpis.totalInvestido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          delta="+12% vs ano ant."
          icon={<FileText size={20} />}
          tone="blue"
        />
        <KpiCard
          title="Campanhas Ativas"
          value={kpis.campanhasEmCurso.toString()}
          delta="3 Iniciando essa semana"
          icon={<Megaphone size={20} />}
          tone="purple"
        />
        <KpiCard
          title="Lojas Auditadas (PoP)"
          value={kpis.lojasAuditadas.toString()}
          delta="85% de Cobertura"
          icon={<Store size={20} />}
          tone="orange"
        />
        <KpiCard
          title="ROI Estimado"
          value={`${kpis.roiMedio}%`}
          delta="Meta: > 10%"
          icon={<TrendingUp size={20} />}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <BarChart3 size={16} /> Fluxo da Operacao
            </h3>
            <span className="text-xs text-slate-400">Atualizado agora</span>
          </div>

          <div className="relative pt-2 pb-6">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center text-blue-700 font-bold">
                  {kpis.jbpsAtivos}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700">Planejamento (JBP)</div>
                  <div className="text-[10px] text-slate-500">Verba Travada</div>
                </div>
              </div>

              <div className="h-0.5 bg-slate-200 flex-1 mx-2" />

              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-12 h-12 rounded-full bg-purple-50 border-2 border-purple-500 flex items-center justify-center text-purple-700 font-bold">
                  {pipelineStatus[1].value}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700">Tatica (Mkt)</div>
                  <div className="text-[10px] text-slate-500">Artes &amp; Midia</div>
                </div>
              </div>

              <div className="h-0.5 bg-slate-200 flex-1 mx-2" />

              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-12 h-12 rounded-full bg-orange-50 border-2 border-orange-500 flex items-center justify-center text-orange-700 font-bold">
                  {kpis.lojasAuditadas.toLocaleString("pt-BR")}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700">Execucao (Loja)</div>
                  <div className="text-[10px] text-slate-500">Tarefas Geradas</div>
                </div>
              </div>

              <div className="h-0.5 bg-slate-200 flex-1 mx-2" />

              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center text-green-700 font-bold">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700">Analitico</div>
                  <div className="text-[10px] text-slate-500">Proof of Perf.</div>
                </div>
              </div>
            </div>

            <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-100 -z-0" />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase">Performance por Fornecedor (Top 4)</h4>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 font-medium bg-slate-50">
                <tr>
                  <th className="p-2 rounded-l">Parceiro</th>
                  <th className="p-2 text-right">Investido</th>
                  <th className="p-2 text-right">Venda (Sell-out)</th>
                  <th className="p-2 text-center rounded-r">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {performanceData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-700">{d.fornecedor}</td>
                    <td className="p-2 text-right font-mono">
                      {d.investido.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {d.retorno.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          d.status === "Otimo"
                            ? "bg-green-100 text-green-700"
                            : d.status === "Bom"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-500" /> Alertas &amp; Pendencias
            </h3>
            <div className="space-y-3">
              {alertList.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 p-3 bg-slate-50 rounded border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-1 shrink-0 rounded-full ${
                      alert.type === "critico"
                        ? "bg-red-500"
                        : alert.type === "aviso"
                          ? "bg-yellow-500"
                          : "bg-blue-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs text-slate-700 font-medium leading-tight mb-1">{alert.msg}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs text-blue-600 font-bold hover:bg-blue-50 rounded border border-dashed border-blue-200">
              Ver todas as pendencias
            </button>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-bold uppercase mb-1">Acoes Rapidas</h3>
            <p className="text-xs text-slate-400 mb-4">Inicie novos processos</p>

            <div className="grid grid-cols-2 gap-2">
              <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded text-left transition-colors">
                <div className="text-lg font-bold mb-1">+ JBP</div>
                <div className="text-[9px] text-slate-400">Novo Acordo</div>
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded text-left transition-colors">
                <div className="text-lg font-bold mb-1">+ Campanha</div>
                <div className="text-[9px] text-slate-400">Nova Midia</div>
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded text-left transition-colors">
                <div className="text-lg font-bold mb-1">Audit</div>
                <div className="text-[9px] text-slate-400">Ver Fotos PDV</div>
              </button>
              <button className="bg-blue-600 hover:bg-blue-500 p-3 rounded text-left transition-colors">
                <div className="text-lg font-bold mb-1">Relatorios</div>
                <div className="text-[9px] text-blue-200">Exportar BI</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, delta, icon, tone }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>{icon}</div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${styles.badge}`}>{delta}</span>
      </div>
      <div className="text-slate-500 text-xs font-semibold uppercase mt-2">{title}</div>
      <div className="text-slate-900 text-2xl font-bold mt-0.5">{value}</div>
    </div>
  );
}
