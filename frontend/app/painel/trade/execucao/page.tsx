"use client";

import React from "react";
import { MapPin, Filter, Camera, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const photoFeed = [
  {
    id: 1,
    store: "Carrefour Centro",
    city: "Sao Paulo",
    cluster: "Ouro",
    status: "validado",
    tags: ["Preco OK", "Frente cheia"],
    img: "https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=600&q=60",
    time: "Ha 1h",
  },
  {
    id: 2,
    store: "Assai Guarulhos",
    city: "Guarulhos",
    cluster: "Prata",
    status: "pendente",
    tags: ["Aguardando validacao"],
    img: "https://images.unsplash.com/photo-1585162423051-94f5461d1f83?auto=format&fit=crop&w=600&q=60",
    time: "Ha 2h",
  },
  {
    id: 3,
    store: "Extra Paulista",
    city: "Sao Paulo",
    cluster: "Ouro",
    status: "rejeitado",
    tags: ["Ruptura detectada"],
    img: "https://images.unsplash.com/photo-1585162423425-dcb5cf4a2c82?auto=format&fit=crop&w=600&q=60",
    time: "Ha 3h",
  },
  {
    id: 4,
    store: "Pao de Acucar Morumbi",
    city: "Sao Paulo",
    cluster: "Ouro",
    status: "validado",
    tags: ["Planograma OK"],
    img: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=60",
    time: "Ha 4h",
  },
];

const statusStyle: Record<string, { color: string; chip: string }> = {
  validado: { color: "text-green-600", chip: "bg-green-100 text-green-700" },
  pendente: { color: "text-amber-600", chip: "bg-amber-100 text-amber-700" },
  rejeitado: { color: "text-red-600", chip: "bg-red-100 text-red-700" },
};

export default function ExecucaoLojaPage() {
  return (
    <div className="grid grid-cols-3 gap-6 pb-10">
      <div className="col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">Execucao em Loja</p>
            <h1 className="text-xl font-bold text-slate-900">Feed em Tempo Real</h1>
          </div>
          <button className="px-3 py-2 text-xs bg-slate-900 text-white rounded shadow hover:bg-slate-800 flex items-center gap-2">
            <Camera size={14} />
            Upload Foto
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <MapPin size={14} className="text-blue-600" />
            <span>Mapa rapido (clusters)</span>
          </div>
          <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
            Mapa ilustrativo
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Ouro", "Prata", "Bronze"].map((cluster) => (
              <span key={cluster} className="px-2 py-1 text-[11px] rounded-full bg-white border border-slate-200 text-slate-600">
                Cluster {cluster}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600">Filtros rapidos</p>
            <Filter size={14} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="px-3 py-2 rounded bg-blue-50 text-blue-700 border border-blue-100 text-left">Somente ruptura</button>
            <button className="px-3 py-2 rounded bg-slate-50 text-slate-700 border border-slate-200 text-left">Cluster Ouro</button>
            <button className="px-3 py-2 rounded bg-slate-50 text-slate-700 border border-slate-200 text-left">Hoje</button>
            <button className="px-3 py-2 rounded bg-slate-50 text-slate-700 border border-slate-200 text-left">Com geolocalizacao</button>
          </div>
        </div>

        <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg p-3 text-xs flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5" />
          <div>
            <p className="font-bold">Alerta critico</p>
            <p>Ruptura detectada na loja Assai Guarulhos. Acione promotor imediatamente.</p>
          </div>
        </div>
      </div>

      <div className="col-span-2 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {photoFeed.map((item) => {
            const style = statusStyle[item.status];
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="h-44 bg-slate-100 relative">
                  <img src={item.img} alt={item.store} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <span className={`px-2 py-1 text-[11px] font-bold rounded ${style.chip}`}>{item.status.toUpperCase()}</span>
                    <span className="px-2 py-1 text-[11px] font-bold rounded bg-white/80 text-slate-700 border border-white">
                      {item.cluster}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded">{item.time}</div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.store}</p>
                      <p className="text-[11px] text-slate-500">{item.city}</p>
                    </div>
                    <div className="flex gap-1">
                      {item.status === "validado" && <CheckCircle2 size={16} className="text-green-600" />}
                      {item.status === "rejeitado" && <XCircle size={16} className="text-red-600" />}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100">
                      Validar
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded hover:bg-slate-100">
                      Solicitar nova foto
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
