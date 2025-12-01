"use client";

import React, { useState } from "react";
import {
  Filter,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
  Zap,
  Calendar,
  Layers,
} from "lucide-react";

const kpiCards = [
  { title: "Sell-out Total", value: "R$ 4.2M", delta: "+12%", trend: "up", meta: "95%" },
  { title: "Investimento JBP", value: "R$ 450k", delta: "+5%", trend: "up", meta: "100%" },
  { title: "ROI Medio", value: "9.2x", delta: "-2%", trend: "down", meta: "Meta: 10x" },
  { title: "Ruptura Virtual", value: "4.5%", delta: "-1.2%", trend: "up", meta: "Bom (<5%)", status: "good" },
];

const insights = [
  { type: "warning", text: "Atencao: A loja 'Carrefour Limao' esta com ruptura critica em Chocolates (12%)." },
  { type: "info", text: "Dica: O JBP de Verao atingiu 80% da meta com apenas 50% do budget gasto." },
];

export default function AnalyticsPage() {
  const [periodo, setPeriodo] = useState("Este Mes");

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex justify-between items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-blue-600" size={24} />
            Visao Executiva: Trade Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">Consolidado de vendas (sell-out), execucao e retorno financeiro.</p>
        </div>

        <div className="flex gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <Calendar size={14} /> {periodo}
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg hidden group-hover:block z-10 w-32">
              <button onClick={() => setPeriodo("Este Mes")} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">
                Este Mes
              </button>
              <button onClick={() => setPeriodo("Trimestre")} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">
                Trimestre
              </button>
              <button onClick={() => setPeriodo("YTD (Ano)")} className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-50">
                YTD (Ano)
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <Filter size={14} /> Filtros
          </button>

          <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white border border-slate-900 rounded-lg text-xs font-bold hover:bg-slate-800 shadow">
            <Download size={14} /> Exportar PPT
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((ins, idx) => (
          <div
            key={idx}
            className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${
              ins.type === "warning" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {ins.type === "warning" ? <AlertTriangle size={16} /> : <Zap size={16} />}
            <span className="text-xs font-semibold">{ins.text}</span>
            {ins.type === "warning" && (
              <button className="ml-auto text-[10px] font-bold uppercase underline hover:text-orange-950">Criar Tarefa PDV</button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{kpi.title}</span>
              <span
                className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
                  kpi.trend === "up"
                    ? kpi.title.includes("Ruptura")
                      ? "text-red-600 bg-red-50"
                      : "text-green-600 bg-green-50"
                    : kpi.title.includes("Ruptura")
                      ? "text-green-600 bg-green-50"
                      : "text-red-600 bg-red-50"
                }`}
              >
                {kpi.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.delta}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
            <div className="mt-3 text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Target size={10} /> Target: {kpi.meta}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Evolucao Sell-out vs Meta (YTD)</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="h-64 flex items-end gap-4 px-2 pb-2 border-b border-slate-100 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((v) => (
                <div key={v} className="w-full border-t border-slate-100 text-[9px] text-slate-300 relative">
                  <span className="absolute -top-2 -left-6">{v}%</span>
                </div>
              ))}
            </div>

            {[45, 52, 48, 60, 72, 68, 85, 92, 88, 75, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 z-10 group cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity">
                  R$ {h}k
                </div>
                <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all" style={{ height: `${h}%` }} />
                <span className="text-[9px] text-slate-400 font-bold uppercase">M{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Share por Canal</h3>

          <div className="space-y-4">
            {[
              { label: "Cash & Carry (Atacarejo)", val: 45, color: "bg-blue-600" },
              { label: "Supermercados", val: 30, color: "bg-cyan-500" },
              { label: "Farma / Perfumaria", val: 15, color: "bg-purple-500" },
              { label: "E-commerce (1P/3P)", val: 10, color: "bg-orange-400" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.label}</span>
                  <span>{item.val}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Insight do Canal</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O canal <span className="text-orange-600 font-semibold">E-commerce</span> cresceu 2.5 p.p. em relacao ao mes anterior, impulsionado pelas campanhas de Retail Media no App.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Performance por Categoria</h3>
          <button className="text-xs text-blue-600 font-bold hover:underline">Ver Relatorio Completo</button>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3 text-right">Venda (R$)</th>
              <th className="px-6 py-3 text-right">Crescimento</th>
              <th className="px-6 py-3 text-right">Margem</th>
              <th className="px-6 py-3 text-center">Status JBP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { cat: "Chocolates", val: "1.2M", grow: "+8%", margem: "32%", status: "Aprovado" },
              { cat: "Cafes", val: "850k", grow: "-2%", margem: "28%", status: "Negociacao" },
              { cat: "Lacteos", val: "2.1M", grow: "+12%", margem: "18%", status: "Aprovado" },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-bold text-slate-700">{row.cat}</td>
                <td className="px-6 py-3 text-right text-slate-600 font-mono">{row.val}</td>
                <td className={`px-6 py-3 text-right font-bold ${row.grow.includes("+") ? "text-green-600" : "text-red-600"}`}>
                  {row.grow}
                </td>
                <td className="px-6 py-3 text-right text-slate-600">{row.margem}</td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === "Aprovado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
