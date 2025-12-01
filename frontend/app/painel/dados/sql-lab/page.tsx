"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Save,
  Database,
  Search,
  Terminal,
  Code2,
  BarChart3,
  Copy,
  CheckCircle2,
  Table as TableIcon,
} from "lucide-react";

const savedQueries = [
  { id: 1, name: "KPI: Sell-out Mensal (JBP)", updated: "2h atras", type: "kpi" },
  { id: 2, name: "Auditoria: Lojas sem Foto", updated: "1d atras", type: "list" },
  { id: 3, name: "Fin: Consumo de Wallet por Canal", updated: "3d atras", type: "chart" },
];

const mockResult = [
  { mes: "Nov/2025", canal: "ASSAI", venda_total: 450000, meta: 400000, atingimento: "112%" },
  { mes: "Nov/2025", canal: "ATACADAO", venda_total: 320000, meta: 350000, atingimento: "91%" },
  { mes: "Nov/2025", canal: "CARREFOUR", venda_total: 180000, meta: 180000, atingimento: "100%" },
];

export default function SqlLabPage() {
  const [activeQueryId, setActiveQueryId] = useState<number | null>(1);
  const [sqlCode, setSqlCode] = useState(`-- KPI: Performance de Vendas por Canal
SELECT 
  to_char(date, 'Mon/YYYY') as mes,
  retail.name as canal,
  SUM(sales.value) as venda_total
FROM TBLDAILY_SALES sales
JOIN TBLRETAIL retail ON sales.retailId = retail.id
WHERE 
  sales.supplierId = {{supplier_id}} 
  AND sales.date BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY 1, 2
ORDER BY 3 DESC`);

  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "json">("results");

  useEffect(() => {
    const regex = /{{(.*?)}}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(sqlCode)) !== null) {
      found.push(match[1]);
    }
    setVariables([...new Set(found)]);
  }, [sqlCode]);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(mockResult);
      setIsRunning(false);
      setActiveTab("results");
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -m-6 overflow-hidden bg-slate-50">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase text-slate-500 mb-2">Biblioteca de Queries</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar script..."
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {savedQueries.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQueryId(q.id)}
              className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${
                activeQueryId === q.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    q.type === "kpi" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {q.type.toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-400">{q.updated}</span>
              </div>
              <div className="text-xs font-medium text-slate-700 group-hover:text-blue-700 truncate">{q.name}</div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button className="w-full py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
            + Nova Query
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Database className="text-blue-600" size={18} />
            <div>
              <div className="text-sm font-bold text-slate-800">KPI: Sell-out Mensal (JBP)</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Postgres Prod • Read-Only
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded flex items-center gap-2">
              <Save size={14} /> Salvar
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isRunning ? "Executando..." : (
                <>
                  <Play size={14} fill="currentColor" /> Executar (Run)
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 flex flex-col relative group">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-800 text-slate-500 text-[10px] text-right pt-4 pr-2 select-none font-mono">
            1
            <br />
            2
            <br />
            3
            <br />
            4
            <br />
            5
            <br />
            6
            <br />
            7
            <br />
            8
            <br />
            9
            <br />
            10
          </div>

          <textarea
            value={sqlCode}
            onChange={(e) => setSqlCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent text-blue-100 font-mono text-sm p-4 pl-10 outline-none resize-none leading-relaxed selection:bg-blue-500/30"
          />

          {variables.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-3 flex items-center gap-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Terminal size={12} /> Parametros de Teste:
              </div>
              {variables.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <label className="text-xs text-blue-300 font-mono">{`{{${v}}}`}</label>
                  <input
                    type="text"
                    placeholder="Valor..."
                    onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                    className="bg-slate-900 border border-slate-600 text-white text-xs px-2 py-1 rounded w-32 focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[40%] bg-white border-t border-slate-200 flex flex-col">
          <div className="flex border-b border-slate-200 bg-slate-50 px-2">
            <button
              onClick={() => setActiveTab("results")}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "results" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <TableIcon size={14} /> Tabela de Dados
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "json" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Code2 size={14} /> JSON Raw
            </button>
            <div className="ml-auto flex items-center px-4 text-[10px] text-slate-400">
              {results ? `${results.length} linhas retornadas em 800ms` : "Aguardando execucao..."}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {!results && !isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Play size={40} className="mb-2 opacity-20" />
                <p className="text-sm">Execute a query para ver os resultados aqui.</p>
              </div>
            )}

            {isRunning && (
              <div className="h-full flex items-center justify-center text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
              </div>
            )}

            {results && activeTab === "results" && (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold sticky top-0 shadow-sm">
                  <tr>
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="p-3 border-b border-slate-200 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50">
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="p-3 font-mono">
                          {typeof val === "number" && val > 1000 ? val.toLocaleString("pt-BR") : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {results && activeTab === "json" && (
              <div className="p-4 bg-slate-50 h-full overflow-auto">
                <pre className="text-xs font-mono text-slate-700">{JSON.stringify(results, null, 2)}</pre>
              </div>
            )}
          </div>

          {results && (
            <div className="p-2 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
              <div className="flex items-center gap-2 mr-auto px-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Query valida</span>
              </div>

              <button className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2">
                <Copy size={12} /> Copiar SQL
              </button>
              <button className="px-3 py-1 bg-blue-600 border border-blue-600 rounded text-xs font-bold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2">
                <BarChart3 size={12} /> Salvar como Widget JBP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
