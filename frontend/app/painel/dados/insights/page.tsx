"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from "lucide-react";

const insightsFeed = [
  {
    id: 1,
    type: "critical",
    category: "Ruptura Virtual",
    title: "Queda brusca de vendas: Loja Centro",
    description:
      "A venda de 'Chocolates' zerou nos ultimos 3 dias na loja Centro, mas o estoque consta como positivo (150un). Provavel gondola vazia ou produto fantasma.",
    impact: "Perda estimada: R$ 4.500/semana",
    date: "Ha 2 horas",
    actionLabel: "Criar Tarefa de Auditoria",
    actionType: "task",
  },
  {
    id: 2,
    type: "opportunity",
    category: "Sugestao de JBP",
    title: "Oportunidade de Mix: Bebidas Vegetais",
    description:
      "A categoria de Bebidas Vegetais cresceu 15% no Cluster A, mas sua participacao (Share) caiu. A marca 'Natureza' esta ganhando espaco.",
    impact: "Potencial: +R$ 12.000/mes",
    date: "Ha 1 dia",
    actionLabel: "Ver Analise de Categoria",
    actionType: "link",
  },
  {
    id: 3,
    type: "warning",
    category: "Performance JBP",
    title: "Investimento Alto, Retorno Baixo",
    description: "O JBP 'Verao 2025' consumiu 80% da verba de midia, mas o sell-out cresceu apenas 2%. Recomendamos pausar os banners do App.",
    impact: "ROI atual: 0.8 (Negativo)",
    date: "Ha 3 dias",
    actionLabel: "Revisar Campanha",
    actionType: "link",
  },
];

const chatHistoryMock = [
  { role: "user", text: "Como esta a performance da Nestle no Nordeste?" },
  { role: "ai", text: "A Nestle cresceu 8% no Nordeste este mes, impulsionada pelo Varejo Alimentar (+12%). Porem, o canal Farma teve retracao de -3%." },
];

export default function InsightsPage() {
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 animate-fade-in pb-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={24} />
              Insights & Oportunidades
            </h1>
            <p className="text-sm text-slate-500 mt-1">Analise proativa gerada por IA sobre seus dados de Trade.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 flex items-center gap-1">
              <Lightbulb size={12} /> 3 Novos Insights
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {insightsFeed.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border shadow-sm bg-white transition-all hover:shadow-md ${
                item.type === "critical" ? "border-l-4 border-l-red-500" : item.type === "opportunity" ? "border-l-4 border-l-green-500" : "border-l-4 border-l-yellow-500"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {item.type === "critical" && <AlertTriangle size={16} className="text-red-500" />}
                  {item.type === "opportunity" && <TrendingUp size={16} className="text-green-500" />}
                  {item.type === "warning" && <AlertTriangle size={16} className="text-yellow-500" />}

                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{item.category}</span>
                </div>
                <span className="text-[10px] text-slate-400">{item.date}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{item.description}</p>

              <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded border border-slate-100 w-fit">
                <span className="text-xs font-semibold text-slate-500">Impacto:</span>
                <span className="text-xs font-bold text-slate-800">{item.impact}</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                <div className="flex gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Util">
                    <ThumbsUp size={16} />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Nao util">
                    <ThumbsDown size={16} />
                  </button>
                </div>

                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold text-white shadow-sm transition-transform active:scale-95 ${
                    item.type === "critical" ? "bg-red-600 hover:bg-red-700" : item.type === "opportunity" ? "bg-green-600 hover:bg-green-700" : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  {item.actionLabel} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[350px] bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Trade AI</h3>
              <p className="text-[10px] text-slate-300">Pergunte sobre seus dados</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center mt-1">
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="bg-white p-3 rounded-r-lg rounded-bl-lg border border-slate-200 shadow-sm text-xs text-slate-700">
              Ola! Analisei seus dados de venda de ontem. Encontrei 3 anomalias em lojas do Cluster Ouro. Quer que eu detalhe?
            </div>
          </div>

          {chatHistoryMock.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center mt-1">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg shadow-sm text-xs max-w-[85%] ${
                  msg.role === "user" ? "bg-slate-800 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-white border-t border-slate-200">
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ex: Qual o ROI da Nestle?"
              className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-purple-500 outline-none"
            />
            <button className="absolute right-2 top-1.5 p-1 text-purple-600 hover:bg-purple-50 rounded">
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <span className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] text-slate-600 cursor-pointer border border-slate-200">
              📉 Maiores quedas
            </span>
            <span className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] text-slate-600 cursor-pointer border border-slate-200">
              🏆 Top Produtos
            </span>
            <span className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] text-slate-600 cursor-pointer border border-slate-200">
              💰 Oportunidades JBP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
