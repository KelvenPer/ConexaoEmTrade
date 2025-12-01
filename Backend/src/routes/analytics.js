const express = require("express");
const prisma = require("../prisma");
const { requireAuthUser } = require("../auth/requireAuth");
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");

const router = express.Router();

function buildParameterizedQuery(template, params) {
  if (!template) {
    throw new Error("Query SQL vazia.");
  }

  const preparedParams = [];
  const finalQuery = template.replace(/['"]?{{\s*(\w+)\s*}}['"]?/g, (_, key) => {
    if (!(key in params)) {
      throw new Error(`Parametro nao suportado na query: ${key}`);
    }
    preparedParams.push(params[key]);
    return "?";
  });

  const normalized = finalQuery.trim().toLowerCase();
  if (!normalized.startsWith("select")) {
    throw new Error("Apenas queries de leitura (SELECT) sao permitidas no SQL Lab.");
  }

  return { finalQuery, params: preparedParams };
}

router.post("/run-kpi", async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;

    const jbpIdRaw = req.body?.jbpId ?? req.query?.jbpId;
    const jbpId = Number(jbpIdRaw);
    if (Number.isNaN(jbpId) || !jbpId) {
      return res.status(400).json({ message: "jbpId obrigatorio para executar KPI." });
    }

    const scope = await resolveScope(user);
    const where = applyScopeToWhere({ id: jbpId }, scope, {
      supplierField: "supplierId",
      retailField: "retailId",
    });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este JBP." });
    }

    const jbp = await prisma.TBLJBP.findFirst({
      where,
      select: {
        id: true,
        supplierId: true,
        retailId: true,
        periodStart: true,
        periodEnd: true,
        kpiQueryId: true,
      },
    });

    if (!jbp) {
      return res.status(404).json({ message: "JBP nao encontrado." });
    }

    if (!jbp.kpiQueryId) {
      return res.status(400).json({ message: "Nenhuma query de KPI vinculada a este JBP." });
    }

    const query = await prisma.TBLQUERY.findUnique({
      where: { id: jbp.kpiQueryId },
      select: {
        id: true,
        name: true,
        description: true,
        sqlQuery: true,
      },
    });

    if (!query) {
      return res.status(404).json({ message: "Query de KPI nao encontrada." });
    }

    const { finalQuery, params } = buildParameterizedQuery(query.sqlQuery, {
      jbpId: jbp.id,
      supplierId: jbp.supplierId,
      retailId: jbp.retailId,
      periodStart: jbp.periodStart,
      periodEnd: jbp.periodEnd,
    });

    const rows = await prisma.$queryRawUnsafe(finalQuery, ...params);
    const firstRow = Array.isArray(rows) && rows.length ? rows[0] : null;
    const firstValue =
      firstRow && typeof firstRow === "object" ? firstRow[Object.keys(firstRow)[0]] : null;

    return res.json({
      queryId: query.id,
      queryName: query.name,
      value: firstValue,
      rows,
    });
  } catch (error) {
    console.error("Erro ao executar KPI do JBP:", error);
    return res.status(500).json({ message: "Erro ao executar KPI do JBP.", error: error.message });
  }
});

module.exports = router;
