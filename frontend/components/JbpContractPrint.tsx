import React, { forwardRef } from "react";

type JbpContractProps = {
  header: {
    name: string;
    supplierName: string;
    retailName?: string;
    year?: string;
    periodStart?: string;
    periodEnd?: string;
    totalBudget?: string;
    strategy?: string;
  };
  items: any[];
};

export const JbpContractPrint = forwardRef<HTMLDivElement, JbpContractProps>(
  ({ header, items }, ref) => {
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div style={{ display: "none" }}>
        {/* Bloco invisivel na tela, renderizado apenas na impressao */}
        <div ref={ref} className="print-content p-10 font-serif text-slate-900">
          <header className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide">
                Acordo Comercial - JBP {header.year}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Joint Business Plan / Plano de Negocios Conjunto
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase">
                Documento no
              </div>
              <div className="text-lg font-mono font-bold">
                JBP-{header.year || "0000"}-{(header.name || "DOC").slice(0, 6).toUpperCase()}
              </div>
            </div>
          </header>

          <section className="mb-8 text-sm leading-relaxed text-justify">
            <p className="mb-4">
              Pelo presente instrumento particular, de um lado{" "}
              <strong>SUPER MAXI VAREJO LTDA</strong>, doravante denominado{" "}
              <strong>VAREJO</strong>, e de outro lado{" "}
              <strong>{header.supplierName.toUpperCase()}</strong>, doravante
              denominada <strong>INDUSTRIA</strong>, estabelecem o presente
              Plano Conjunto de Negocios (JBP) para o periodo de{" "}
              <strong>{header.year}</strong>.
            </p>
          </section>

          <section className="mb-8 border border-slate-300 rounded p-4 bg-slate-50">
            <h3 className="font-bold text-sm uppercase mb-3 border-b border-slate-200 pb-1">
              1. Resumo do Acordo
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-500 uppercase">
                  Nome do Plano
                </span>
                <span className="font-semibold">{header.name}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500 uppercase">
                  Vigencia
                </span>
                <span className="font-semibold">
                  {header.periodStart
                    ? new Date(header.periodStart).toLocaleDateString("pt-BR")
                    : "..."}{" "}
                  ate{" "}
                  {header.periodEnd
                    ? new Date(header.periodEnd).toLocaleDateString("pt-BR")
                    : "..."}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-500 uppercase">
                  Objetivo Estrategico
                </span>
                <span>{header.strategy || "Nao informado."}</span>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="font-bold text-sm uppercase mb-3 border-b border-slate-800 pb-1">
              2. Investimentos e Iniciativas
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-300 p-2 text-left">
                    Ativo / Iniciativa
                  </th>
                  <th className="border border-slate-300 p-2 text-center">
                    Tipo
                  </th>
                  <th className="border border-slate-300 p-2 text-center">
                    Qtd
                  </th>
                  <th className="border border-slate-300 p-2 text-right">
                    Valor Unit.
                  </th>
                  <th className="border border-slate-300 p-2 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center border border-slate-300"
                    >
                      Nenhum item vinculado.
                    </td>
                  </tr>
                )}
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2">
                      <strong>{it.asset?.name}</strong>
                      <br />
                      <span className="text-slate-500">{it.description}</span>
                    </td>
                    <td className="border border-slate-300 p-2 text-center uppercase text-[10px]">
                      {it.initiativeType}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">
                      {it.quantity}
                    </td>
                    <td className="border border-slate-300 p-2 text-right">
                      {Number(it.negotiatedUnitPrice || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-bold">
                      {Number(it.totalValue || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan={4}
                    className="border border-slate-300 p-2 text-right"
                  >
                    TOTAL DO INVESTIMENTO
                  </td>
                  <td className="border border-slate-300 p-2 text-right text-sm">
                    {items
                      .reduce(
                        (acc, i) => acc + Number(i.totalValue || 0),
                        0
                      )
                      .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="mb-12 text-xs text-justify text-slate-600 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 uppercase mb-2">
              3. Disposicoes Gerais
            </h3>
            <p>
              3.1. O pagamento das verbas aqui acordadas esta condicionado a
              comprovacao da execucao (Proof of Performance).
            </p>
            <p>
              3.2. Este acordo anula e substitui quaisquer tratativas anteriores
              sobre os mesmos ativos.
            </p>
            <p>
              3.3. As partes elegem o foro da Comarca de Sao Paulo/SP para
              dirimir quaisquer duvidas.
            </p>
          </section>

          <section className="mt-20 grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="border-t border-slate-900 pt-2 font-bold">
                {header.supplierName}
              </div>
              <div className="text-xs text-slate-500">Representante Industria</div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-900 pt-2 font-bold">
                Super Maxi Varejo
              </div>
              <div className="text-xs text-slate-500">Diretoria Comercial</div>
            </div>
          </section>

          <footer className="mt-20 text-[10px] text-center text-slate-400 border-t border-slate-200 pt-4">
            Gerado eletronicamente pela plataforma Conexao em Trade em {dataEmissao}.
          </footer>
        </div>
      </div>
    );
  }
);

JbpContractPrint.displayName = "JbpContractPrint";
