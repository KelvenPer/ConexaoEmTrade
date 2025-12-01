import React, { useEffect, useState } from "react";

export type MixItem = {
  type: "PRODUCT" | "BRAND" | "CATEGORY";
  id?: number | string;
  label: string;
  brandCriteria?: string | null;
  categoryCriteria?: string | null;
};

type Product = { id: number; code: string; description: string; brand: string };

interface ProductMixSelectorProps {
  maxSlots: number;
  products: Product[];
  value: MixItem[];
  onChange: (newMix: MixItem[]) => void;
}

export function ProductMixSelector({
  maxSlots,
  products,
  value,
  onChange,
}: ProductMixSelectorProps) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<MixItem[]>([]);

  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }

    const term = search.toLowerCase();
    const results: MixItem[] = [];

    const uniqueBrands = Array.from(
      new Set(products.map((p) => p.brand || "").filter((b) => b))
    );
    uniqueBrands
      .filter((m) => m.toLowerCase().includes(term))
      .forEach((m) =>
        results.push({ type: "BRAND", id: m, label: `Marca: ${m}`, brandCriteria: m })
      );

    const prodsMatch = products
      .filter(
        (p) =>
          p.description.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term)
      )
      .slice(0, 5);
    prodsMatch.forEach((p) =>
      results.push({
        type: "PRODUCT",
        id: p.id,
        label: `${p.code} - ${p.description}`,
      })
    );

    setSuggestions(results);
  }, [search, products]);

  function addItem(item: MixItem) {
    if (value.some((v) => v.id === item.id && v.type === item.type)) return;
    onChange([...value, item]);
    setSearch("");
    setSuggestions([]);
  }

  function removeItem(index: number) {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  }

  const slotsUsed = value.length;
  const slotsOpen = Math.max(0, maxSlots - slotsUsed);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        Mix de Produtos / Escopo
      </label>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Digite produto, marca ou categoria..."
          className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
        />

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-slate-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
            {suggestions.map((sug, idx) => (
              <button
                key={`${sug.type}-${sug.id}-${idx}`}
                type="button"
                onClick={() => addItem(sug)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-2"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    sug.type === "BRAND"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {sug.type === "BRAND" ? "MARCA" : "SKU"}
                </span>
                <span className="text-slate-700 truncate">{sug.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 min-h-[30px] p-2 bg-slate-50 rounded border border-slate-100">
        {value.length === 0 && (
          <span className="text-xs text-slate-400 italic">
            Nenhum item vinculado. {maxSlots} espaços em aberto.
          </span>
        )}

        {value.map((item, idx) => (
          <div
            key={`${item.type}-${item.id}-${idx}`}
            className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm"
          >
            <span
              className={`text-[9px] font-bold ${
                item.type === "BRAND" ? "text-purple-600" : "text-blue-600"
              }`}
            >
              {item.type === "BRAND" ? "M" : "P"}
            </span>
            <span className="text-xs text-slate-700 max-w-[150px] truncate">
              {item.label}
            </span>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="ml-1 text-slate-400 hover:text-red-500 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
        <span>
          Itens selecionados: <strong>{slotsUsed}</strong>
        </span>
        <span
          className={
            slotsOpen > 0 ? "text-orange-600 font-bold" : "text-green-600 font-bold"
          }
        >
          {slotsOpen > 0 ? `${slotsOpen} A DEFINIR` : "COMPLETO"}
        </span>
      </div>
    </div>
  );
}
