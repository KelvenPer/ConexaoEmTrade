const prisma = require("../prisma");
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");

const JBP_APPROVED = ["aprovado", "aprovada"];
const JBP_NEGOCIACAO = ["rascunho", "negociacao", "em_aprovacao"];
const CAMPANHA_ATIVA = ["veiculando", "em_veiculacao"];
const CAMPANHA_TATICA = ["planejada", "em_producao", "aprovada"];
const EXEC_PENDENTE = ["pendente", "em_execucao"];
const EXEC_CONCLUIDA = ["concluida", "finalizada"];

function normalizeStatus(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function countStatuses(rows, statusList) {
  const allowed = new Set(statusList.map(normalizeStatus));
  return rows.reduce((acc, row) => {
    const status = normalizeStatus(row.status);
    return allowed.has(status) ? acc + (row?._count?.id || 0) : acc;
  }, 0);
}

function buildScopedWhere(baseWhere, scope, opts) {
  const scoped = applyScopeToWhere(baseWhere, scope, opts);
  if (scoped.id === -1) {
    return { id: -1 };
  }
  return scoped;
}

function buildExecScope(scope) {
  if (scope.isPlatformAdmin) return {};

  const or = [];
  if (scope.supplierIds?.length) {
    or.push({ planoExec: { supplierId: { in: scope.supplierIds } } });
  }
  if (scope.retailIds?.length) {
    or.push({ planoExec: { retailId: { in: scope.retailIds } } });
    or.push({ store: { retailId: { in: scope.retailIds } } });
  }
  if (scope.tenantId) {
    or.push({ planoExec: { supplier: { tenantId: scope.tenantId } } });
    or.push({ store: { retail: { tenantId: scope.tenantId } } });
  }

  if (!or.length) {
    return { id: -1 };
  }
  return { OR: or };
}

function buildSupplierWhere(scope) {
  if (scope.isPlatformAdmin) return {};
  if (scope.supplierIds?.length) return { id: { in: scope.supplierIds } };
  if (scope.tenantId) return { tenantId: scope.tenantId };
  return { id: -1 };
}

function formatTimeAgo(date) {
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

async function getDashboardOverview(user) {
  const scope = await resolveScope(user);
  const yearFilter = new Date().getFullYear();

  const jbpWhere = buildScopedWhere(
    { year: yearFilter },
    scope,
    { supplierField: "supplierId", retailField: "retailId" }
  );

  const campanhaWhere = buildScopedWhere(
    {},
    scope,
    { supplierField: "supplierId", retailField: "retailId", allowNullRetail: true }
  );

  const vendasWhere = buildScopedWhere(
    { ano: yearFilter },
    scope,
    { supplierField: "supplierId", retailField: "retailId", allowNullRetail: true }
  );

  const execWhere = buildExecScope(scope);

  const [investimentoJBP, campanhasAtivas, lojasAuditadas, vendasTotal, statusJBP, statusCampanha, statusExecucao, topFornecedores, walletCandidates, jbpAtivosCount] =
    await Promise.all([
      prisma.TBLJBP.aggregate({
        _sum: { totalBudget: true },
        where: { ...jbpWhere, status: { in: JBP_APPROVED } },
      }),
      prisma.TBLCAMPANHA.count({
        where: { ...campanhaWhere, status: { in: CAMPANHA_ATIVA } },
      }),
      prisma.TBLEXECTAREFA.groupBy({
        by: ["storeId"],
        where: { ...execWhere, status: { in: EXEC_CONCLUIDA } },
        _count: { storeId: true },
      }),
      prisma.TBLVENDASRESUMO.aggregate({
        _sum: { sellOutValue: true },
        where: vendasWhere,
      }),
      prisma.TBLJBP.groupBy({
        by: ["status"],
        _count: { id: true },
        where: jbpWhere,
      }),
      prisma.TBLCAMPANHA.groupBy({
        by: ["status"],
        _count: { id: true },
        where: campanhaWhere,
      }),
      prisma.TBLEXECTAREFA.groupBy({
        by: ["status"],
        _count: { id: true },
        where: execWhere,
      }),
      prisma.TBLFORN.findMany({
        where: buildSupplierWhere(scope),
        take: 4,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          jbps: {
            where: {
              year: yearFilter,
              status: { in: JBP_APPROVED },
              ...(scope.retailIds?.length ? { retailId: { in: scope.retailIds } } : {}),
            },
            select: { totalBudget: true },
          },
          vendasResumos: {
            where: { ano: yearFilter },
            select: { sellOutValue: true },
          },
        },
      }),
      prisma.TBLWALLET.findMany({
        where: buildScopedWhere({}, scope, { supplierField: "supplierId", retailField: null }),
        select: {
          id: true,
          totalBudget: true,
          consumedBudget: true,
          updatedAt: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.TBLJBP.count({
        where: { ...jbpWhere, status: { in: JBP_APPROVED } },
      }),
    ]);

  const investido = investimentoJBP._sum.totalBudget || 0;
  const retorno = vendasTotal._sum.sellOutValue || 0;
  const roi = investido > 0 ? ((retorno - investido) / investido) * 100 : 0;

  const pipeline = {
    jbpNegociacao: countStatuses(statusJBP, JBP_NEGOCIACAO),
    mktTatica: countStatuses(statusCampanha, CAMPANHA_TATICA),
    lojaExecucao: countStatuses(statusExecucao, EXEC_PENDENTE),
    analitico: countStatuses(statusExecucao, EXEC_CONCLUIDA),
  };

  const formattedSuppliers = topFornecedores.map((f) => {
    const inv = f.jbps.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
    const ret = f.vendasResumos.reduce((acc, curr) => acc + (curr.sellOutValue || 0), 0);
    const margem = inv > 0 ? ret / inv : 0;
    let status = "Bom";
    if (margem > 10) status = "Otimo";
    if (margem < 5) status = "Atencao";
    return {
      fornecedor: f.name,
      investido: inv,
      retorno: ret,
      status,
    };
  });

  const alertasCriticos = walletCandidates
    .map((w) => {
      const ratio = w.totalBudget > 0 ? (w.consumedBudget / w.totalBudget) * 100 : 0;
      return {
        type: ratio >= 110 ? "critico" : "aviso",
        msg: `${w.supplier?.name || "Fornecedor"}: Wallet estourada (${ratio.toFixed(0)}%)`,
        time: formatTimeAgo(w.updatedAt),
        ratio,
      };
    })
    .filter((a) => a.ratio >= 90)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5)
    .map(({ ratio, ...rest }) => rest);

  return {
    kpis: {
      totalInvestido: investido,
      campanhasEmCurso: campanhasAtivas,
      lojasAuditadas: lojasAuditadas.length,
      roiMedio: Number(roi.toFixed(1)),
      jbpsAtivos: jbpAtivosCount,
    },
    pipeline,
    table: formattedSuppliers,
    alerts: alertasCriticos,
  };
}

module.exports = { getDashboardOverview };
