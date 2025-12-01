"use client";

import React from "react";
import { Clock, Upload, MoreHorizontal, CheckCircle2 } from "lucide-react";

const columns = [
  { key: "criacao", title: "Em Criacao" },
  { key: "aprovacao", title: "Aprovacao Industria" },
  { key: "pronto", title: "Pronto / Arte OK" },
  { key: "veiculando", title: "Veiculando" },
] as const;

const cards = [
  {
    id: 1,
    type: "BANNER APP",
    title: "Ofertas de Pascoa",
    ref: "JBP Nestle #123",
    status: "criacao",
    deadline: "Hoje",
    preview: "/placeholder-banner.jpg",
    tags: ["Brief pronto", "KitKat"],
  },
  {
    id: 2,
    type: "VIDEO",
    title: "Jornada Cashback",
    ref: "Campanha Wallet #77",
    status: "aprovacao",
    deadline: "Amanha",
    preview: "",
    tags: ["Aguardando aprovacao"],
  },
  {
    id: 3,
    type: "POST FEED",
    title: "Live Danone + Influencer",
    ref: "JBP Verão #210",
    status: "pronto",
    deadline: "Entregar ate sexta",
    preview: "/placeholder-banner.jpg",
    tags: ["Arte ok", "Copy revisada"],
  },
  {
    id: 4,
    type: "PUSH",
    title: "Push Flash Sale",
    ref: "Retail Media App",
    status: "veiculando",
    deadline: "On air",
    preview: "/placeholder-banner.jpg",
    tags: ["Go live 09:00"],
  },
];

const badgeTone: Record<string, string> = {
  criacao: "bg-amber-50 text-amber-700",
  aprovacao: "bg-blue-50 text-blue-700",
  pronto: "bg-green-50 text-green-700",
  veiculando: "bg-purple-50 text-purple-700",
};

export default function MarketingKanbanPage() {
  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500 font-bold">Marketing & Conteudo</p>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Criativo</h1>
          <p className="text-sm text-slate-500">Arraste cards de criacao para aprovacao e veiculacao. Cards nascem com briefing do JBP.</p>
        </div>
        <button className="px-4 py-2 text-xs bg-slate-900 text-white rounded shadow hover:bg-slate-800 flex items-center gap-2">
          <Upload size={14} />
          Nova peca
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[520px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{col.title}</span>
              <span className={`text-[11px] font-bold px-2 py-1 rounded ${badgeTone[col.key]}`}>{cards.filter((c) => c.status === col.key).length} cards</span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {cards
                .filter((c) => c.status === col.key)
                .map((card) => (
                  <div key={card.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">{card.type}</span>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{card.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Ref: {card.ref}</p>
                    </div>

                    <div className="h-32 bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                      {card.preview ? (
                        <img src={card.preview} alt={card.title} className="h-full w-full object-cover rounded opacity-60" />
                      ) : (
                        <span className="text-[11px] text-slate-400">Sem arte anexada</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
                        <span className="text-white text-xs font-bold">Ver Arte / Aprovar</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-300 border border-white" title="Designer" />
                          <div className="w-6 h-6 rounded-full bg-green-500 border border-white flex items-center justify-center text-[8px] text-white font-bold" title="Aprovado Trade">
                            ✓
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">Deadline: {card.deadline}</span>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
