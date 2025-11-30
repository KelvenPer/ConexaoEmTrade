// backend/src/routes/jbp.js
const express = require("express");
const { UserRole, AccessChannel } = require("@prisma/client");
const prisma = require("../prisma");
const { resolveScope, applyScopeToWhere, normalizeChannel } = require("../auth/multiTenantFilter");
const { requireAuthUser } = require("../auth/requireAuth");

const router = express.Router();

async function getScopedWhere(req, res, baseWhere, opts = {}) {
  const user = await requireAuthUser(req, res);
  if (!user) return { user: null, where: { id: -1 }, scope: null };
  const scope = await resolveScope(user);
  const where = applyScopeToWhere(baseWhere, scope, opts);
  if (where.id === -1) {
    res.status(403).json({ message: "Acesso negado para este recurso." });
  }
  return { user, scope, where };
}

function assertCanWrite(user) {
  const channel = normalizeChannel(user.accessChannel);
  if (
    user.role === UserRole.PLATFORM_ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.TENANT_ADMIN
  ) {
    return;
  }
  if (channel === AccessChannel.industria && user.supplierId) return;
  if (channel === AccessChannel.varejo && user.retailId) return;
  throw new Error("Permissao negada para alterar JBPs.");
}

async function loadJbpInScope(req, res, id) {
  const { user, scope, where } = await getScopedWhere(
    req,
    res,
    { id: Number(id) }
  );
  if (!user || where.id === -1) return { user: null, scope, jbp: null };

  const jbp = await prisma.TBLJBP.findFirst({ where });
  if (!jbp) {
    res.status(404).json({ message: "JBP nao encontrado." });
    return { user: null, scope, jbp: null };
  }

  return { user, scope, jbp };
}

/**
 * GET /api/jbp
 * Lista JBPs com filtros opcionais ?year=2025&supplierId=1
 */
router.get("/", async (req, res) => {
  try {
    const { year, supplierId } = req.query;
    const baseWhere = {};

    if (year) {
      const y = Number(year);
      if (!Number.isNaN(y)) baseWhere.year = y;
    }

    if (supplierId) {
      const s = Number(supplierId);
      if (!Number.isNaN(s)) baseWhere.supplierId = s;
    }

    const { user, where } = await getScopedWhere(req, res, baseWhere);
    if (!user || where.id === -1) return;

    const jbps = await prisma.TBLJBP.findMany({
      where,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: {
        supplier: true,
        itens: {
          include: { asset: true, product: true },
        },
      },
    });

    res.json(jbps);
  } catch (error) {
    console.error("Erro ao listar JBP:", error);
    res.status(500).json({ message: "Erro ao listar JBP." });
  }
});

/**
 * GET /api/jbp/:id
 * Detalhe de um JBP, incluindo fornecedor e itens (com ativo)
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const { user, where } = await getScopedWhere(req, res, { id });
    if (!user || where.id === -1) return;

    const jbp = await prisma.TBLJBP.findFirst({
      where,
      include: {
        supplier: true,
        itens: {
          include: { asset: true, product: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!jbp) {
      return res.status(404).json({ message: "JBP nao encontrado." });
    }

    res.json(jbp);
  } catch (error) {
    console.error("Erro ao buscar JBP:", error);
    res.status(500).json({ message: "Erro ao buscar JBP." });
  }
});

/**
 * POST /api/jbp
 * Cria um novo JBP (apenas cabecalho)
 */
router.post("/", async (req, res) => {
  try {
    const {
      supplierId,
      retailId,
      name,
      year,
      periodStart,
      periodEnd,
      strategy,
      kpiSummary,
      totalBudget,
      status,
      createdById,
    } = req.body;

    if (!supplierId || !name) {
      return res
        .status(400)
        .json({ message: "Fornecedor e nome do plano sao obrigatorios." });
    }

    const supplierIdNumber = Number(supplierId);
    if (Number.isNaN(supplierIdNumber)) {
      return res.status(400).json({ message: "Fornecedor invalido." });
    }

    const retailIdNumber =
      retailId !== undefined && retailId !== null && retailId !== ""
        ? Number(retailId)
        : null;
    if (retailIdNumber !== null && Number.isNaN(retailIdNumber)) {
      return res.status(400).json({ message: "Varejo invalido." });
    }

    const { user, where } = await getScopedWhere(req, res, {
      supplierId: supplierIdNumber,
      retailId: retailIdNumber,
    });
    if (!user || where.id === -1) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const dataToCreate = {
      supplierId: supplierIdNumber,
      retailId: retailIdNumber,
      name,
      strategy: strategy || null,
      kpiSummary: kpiSummary || null,
      status: status || "rascunho",
    };

    if (year !== undefined && year !== null && year !== "") {
      const y = Number(year);
      if (!Number.isNaN(y)) dataToCreate.year = y;
    }

    if (periodStart) {
      const d = new Date(periodStart);
      if (!isNaN(d.getTime())) dataToCreate.periodStart = d;
    }

    if (periodEnd) {
      const d = new Date(periodEnd);
      if (!isNaN(d.getTime())) dataToCreate.periodEnd = d;
    }

    if (totalBudget !== undefined && totalBudget !== null && totalBudget !== "") {
      const tb = Number(totalBudget);
      if (!Number.isNaN(tb)) dataToCreate.totalBudget = tb;
    }

    if (createdById) {
      const cb = Number(createdById);
      if (!Number.isNaN(cb)) dataToCreate.createdById = cb;
    }

    const novo = await prisma.TBLJBP.create({
      data: dataToCreate,
    });

    res.status(201).json(novo);
  } catch (error) {
    console.error("Erro ao criar JBP:", error);
    res.status(500).json({ message: "Erro ao criar JBP." });
  }
});

/**
 * PUT /api/jbp/:id
 * Atualiza cabecalho de um JBP
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, id);
    if (!user || !jbp) return;

    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const {
      supplierId,
      retailId,
      name,
      year,
      periodStart,
      periodEnd,
      strategy,
      kpiSummary,
      totalBudget,
      status,
    } = req.body;

    const dataToUpdate = {};

    if (supplierId !== undefined) {
      const s = Number(supplierId);
      if (Number.isNaN(s)) {
        return res.status(400).json({ message: "Fornecedor invalido." });
      }
      dataToUpdate.supplierId = s;
      const { where } = await getScopedWhere(req, res, {
        id,
        supplierId: s,
        retailId: jbp.retailId,
      });
      if (where.id === -1) return;
    }

    if (retailId !== undefined) {
      if (retailId === null || retailId === "") {
        dataToUpdate.retailId = null;
      } else {
        const r = Number(retailId);
        if (Number.isNaN(r)) {
          return res.status(400).json({ message: "Varejo invalido." });
        }
        dataToUpdate.retailId = r;
        const { where } = await getScopedWhere(req, res, {
          id,
          supplierId: dataToUpdate.supplierId || jbp.supplierId,
          retailId: r,
        });
        if (where.id === -1) return;
      }
    }

    if (name !== undefined) dataToUpdate.name = name;
    if (strategy !== undefined) dataToUpdate.strategy = strategy || null;
    if (kpiSummary !== undefined) dataToUpdate.kpiSummary = kpiSummary || null;
    if (status !== undefined) dataToUpdate.status = status;

    if (year !== undefined) {
      if (year === null || year === "") {
        dataToUpdate.year = null;
      } else {
        const y = Number(year);
        if (!Number.isNaN(y)) dataToUpdate.year = y;
      }
    }

    if (periodStart !== undefined) {
      if (!periodStart) {
        dataToUpdate.periodStart = null;
      } else {
        const d = new Date(periodStart);
        if (!isNaN(d.getTime())) dataToUpdate.periodStart = d;
      }
    }

    if (periodEnd !== undefined) {
      if (!periodEnd) {
        dataToUpdate.periodEnd = null;
      } else {
        const d = new Date(periodEnd);
        if (!isNaN(d.getTime())) dataToUpdate.periodEnd = d;
      }
    }

    if (totalBudget !== undefined) {
      if (totalBudget === null || totalBudget === "") {
        dataToUpdate.totalBudget = null;
      } else {
        const tb = Number(totalBudget);
        if (!Number.isNaN(tb)) dataToUpdate.totalBudget = tb;
      }
    }

    const atualizado = await prisma.TBLJBP.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar JBP:", error);
    res.status(500).json({ message: "Erro ao atualizar JBP." });
  }
});

/**
 * DELETE /api/jbp/:id
 * Remove um JBP e seus itens
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, id);
    if (!user || !jbp) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    await prisma.TBLJBPITEM.deleteMany({ where: { jbpId: id } });
    await prisma.TBLJBP.delete({ where: { id } });

    res.json({ message: "JBP e itens removidos com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir JBP:", error);
    res.status(500).json({ message: "Erro ao excluir JBP." });
  }
});

/**
 * POST /api/jbp/:id/itens
 * Cria novo item de JBP
 */
router.post("/:id/itens", async (req, res) => {
  try {
    const jbpId = Number(req.params.id);
    if (Number.isNaN(jbpId)) {
      return res.status(400).json({ message: "JBP invalido." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, jbpId);
    if (!user || !jbp) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const {
      assetId,
      productId,
      description,
      initiativeType,
      periodStart,
      periodEnd,
      storeScope,
      unit,
      quantity,
      negotiatedUnitPrice,
      totalValue,
      notes,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: "Ativo e obrigatorio." });
    }

    const assetIdNumber = Number(assetId);
    if (Number.isNaN(assetIdNumber)) {
      return res.status(400).json({ message: "Ativo invalido." });
    }

    const dataToCreate = {
      jbpId,
      assetId: assetIdNumber,
      productId: productId ? Number(productId) : null,
      description: description || null,
      initiativeType: initiativeType || "JBP",
      storeScope: storeScope || null,
      unit: unit || null,
      notes: notes || null,
    };

    if (periodStart) {
      const d = new Date(periodStart);
      if (!isNaN(d.getTime())) dataToCreate.periodStart = d;
    }

    if (periodEnd) {
      const d = new Date(periodEnd);
      if (!isNaN(d.getTime())) dataToCreate.periodEnd = d;
    }

    if (quantity !== undefined && quantity !== null && quantity !== "") {
      const q = Number(quantity);
      if (!Number.isNaN(q)) dataToCreate.quantity = q;
    }

    if (
      negotiatedUnitPrice !== undefined &&
      negotiatedUnitPrice !== null &&
      negotiatedUnitPrice !== ""
    ) {
      const p = Number(negotiatedUnitPrice);
      if (!Number.isNaN(p)) dataToCreate.negotiatedUnitPrice = p;
    }

    if (totalValue !== undefined && totalValue !== null && totalValue !== "") {
      const t = Number(totalValue);
      if (!Number.isNaN(t)) {
        dataToCreate.totalValue = t;
      }
    } else if (
      dataToCreate.quantity !== undefined &&
      dataToCreate.negotiatedUnitPrice !== undefined
    ) {
      dataToCreate.totalValue =
        dataToCreate.quantity * dataToCreate.negotiatedUnitPrice;
    }

    const item = await prisma.TBLJBPITEM.create({
      data: dataToCreate,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Erro ao criar item JBP:", error);
    res.status(500).json({ message: "Erro ao criar item JBP." });
  }
});

/**
 * PUT /api/jbp/itens/:itemId
 * Atualiza um item de JBP
 */
router.put("/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Item invalido." });
    }

    const existente = await prisma.TBLJBPITEM.findUnique({
      where: { id: itemId },
    });

    if (!existente) {
      return res.status(404).json({ message: "Item nao encontrado." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, existente.jbpId);
    if (!user || !jbp) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const {
      assetId,
      productId,
      description,
      initiativeType,
      periodStart,
      periodEnd,
      storeScope,
      unit,
      quantity,
      negotiatedUnitPrice,
      totalValue,
      notes,
    } = req.body;

    const dataToUpdate = {};

    if (assetId !== undefined) {
      const a = Number(assetId);
      if (!Number.isNaN(a)) dataToUpdate.assetId = a;
      else return res.status(400).json({ message: "Ativo invalido." });
    }

    if (productId !== undefined) {
      if (productId === null || productId === "") {
        dataToUpdate.productId = null;
      } else {
        const pId = Number(productId);
        if (Number.isNaN(pId)) {
          return res.status(400).json({ message: "Produto invalido." });
        }
        dataToUpdate.productId = pId;
      }
    }

    if (description !== undefined) dataToUpdate.description = description || null;
    if (initiativeType !== undefined)
      dataToUpdate.initiativeType = initiativeType || "JBP";
    if (storeScope !== undefined) dataToUpdate.storeScope = storeScope || null;
    if (unit !== undefined) dataToUpdate.unit = unit || null;
    if (notes !== undefined) dataToUpdate.notes = notes || null;

    if (periodStart !== undefined) {
      if (!periodStart) {
        dataToUpdate.periodStart = null;
      } else {
        const d = new Date(periodStart);
        if (!isNaN(d.getTime())) dataToUpdate.periodStart = d;
      }
    }

    if (periodEnd !== undefined) {
      if (!periodEnd) {
        dataToUpdate.periodEnd = null;
      } else {
        const d = new Date(periodEnd);
        if (!isNaN(d.getTime())) dataToUpdate.periodEnd = d;
      }
    }

    if (quantity !== undefined) {
      if (quantity === null || quantity === "") {
        dataToUpdate.quantity = null;
      } else {
        const q = Number(quantity);
        if (!Number.isNaN(q)) dataToUpdate.quantity = q;
      }
    }

    if (negotiatedUnitPrice !== undefined) {
      if (negotiatedUnitPrice === null || negotiatedUnitPrice === "") {
        dataToUpdate.negotiatedUnitPrice = null;
      } else {
        const p = Number(negotiatedUnitPrice);
        if (!Number.isNaN(p)) dataToUpdate.negotiatedUnitPrice = p;
      }
    }

    if (totalValue !== undefined) {
      if (totalValue === null || totalValue === "") {
        dataToUpdate.totalValue = null;
      } else {
        const t = Number(totalValue);
        if (!Number.isNaN(t)) dataToUpdate.totalValue = t;
      }
    }

    // recalcula se necessario
    const finalData = { ...dataToUpdate };

    const qFinal =
      finalData.quantity !== undefined ? finalData.quantity : existente.quantity;
    const pFinal =
      finalData.negotiatedUnitPrice !== undefined
        ? finalData.negotiatedUnitPrice
        : existente.negotiatedUnitPrice;

    if (
      (finalData.totalValue === undefined || finalData.totalValue === null) &&
      qFinal !== null &&
      qFinal !== undefined &&
      pFinal !== null &&
      pFinal !== undefined
    ) {
      finalData.totalValue = qFinal * pFinal;
    }

    const atualizado = await prisma.TBLJBPITEM.update({
      where: { id: itemId },
      data: finalData,
    });

    res.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar item JBP:", error);
    res.status(500).json({ message: "Erro ao atualizar item JBP." });
  }
});

/**
 * DELETE /api/jbp/itens/:itemId
 */
router.delete("/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Item invalido." });
    }

    const existente = await prisma.TBLJBPITEM.findUnique({
      where: { id: itemId },
    });

    if (!existente) {
      return res.status(404).json({ message: "Item nao encontrado." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, existente.jbpId);
    if (!user || !jbp) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    await prisma.TBLJBPITEM.delete({
      where: { id: itemId },
    });

    res.json({ message: "Item removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir item JBP:", error);
    res.status(500).json({ message: "Erro ao excluir item JBP." });
  }
});

// POST /api/jbp/:id/gerar-contrato
router.post("/:id/gerar-contrato", async (req, res) => {
  try {
    const jbpId = Number(req.params.id);
    if (Number.isNaN(jbpId)) {
      return res.status(400).json({ message: "JBP invalido." });
    }

    const { user, jbp } = await loadJbpInScope(req, res, jbpId);
    if (!user || !jbp) return;
    try {
      assertCanWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const fullJbp = await prisma.TBLJBP.findUnique({
      where: { id: jbpId },
      include: {
        supplier: true,
        itens: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!fullJbp) {
      return res.status(404).json({ message: "JBP nao encontrado." });
    }

    const [campanhaExistente, execPlanoExistente, retailPlanoExistente] =
      await Promise.all([
        prisma.TBLCAMPANHA.findFirst({ where: { jbpId: fullJbp.id } }),
        prisma.TBLEXECPLANO.findFirst({ where: { jbpId: fullJbp.id } }),
        prisma.TBLRETAILMEDIA_PLANO.findFirst({ where: { jbpId: fullJbp.id } }),
      ]);

    // 3) CAMPANHA DE MARKETING (Calendario)
    let campanha = campanhaExistente;
    if (!campanha) {
      campanha = await prisma.TBLCAMPANHA.create({
        data: {
          supplierId: fullJbp.supplierId,
          retailId: fullJbp.retailId || null,
          jbpId: fullJbp.id,
          name: fullJbp.name || "Campanha vinculada ao JBP",
          objective:
            fullJbp.strategy ||
            "Campanha criada automaticamente a partir do JBP.",
          channel: "MULTICANAL",
          startDate: fullJbp.periodStart,
          endDate: fullJbp.periodEnd,
          status: "planejada",
        },
      });

      if (fullJbp.itens.length > 0) {
        const campanhaItensData = fullJbp.itens.map((it) => ({
          campanhaId: campanha.id,
          jbpItemId: it.id,
          assetId: it.assetId,
          title: it.description || it.asset?.name || "Peca vinculada ao JBP",
          contentType: it.asset?.type || null,
          artDeadline: it.periodStart || null,
          approvalDeadline: it.periodStart || null,
          goLiveDate: it.periodStart || null,
          urlDestino: null,
          notes: it.notes || null,
        }));

        if (campanhaItensData.length > 0) {
          await prisma.TBLCAMPANHAITEM.createMany({
            data: campanhaItensData,
          });
        }
      }
    }

    // 4) EXECUCAO EM LOJA
    const itensLoja = fullJbp.itens.filter(
      (it) => it.asset?.channel === "LOJA_FISICA"
    );

    let execPlano = execPlanoExistente;
    if (!execPlano && itensLoja.length > 0) {
      execPlano = await prisma.TBLEXECPLANO.create({
        data: {
          supplierId: fullJbp.supplierId,
          retailId: fullJbp.retailId || null,
          jbpId: fullJbp.id,
          name: `Execucao em Loja - ${fullJbp.name}`,
          periodStart: fullJbp.periodStart,
          periodEnd: fullJbp.periodEnd,
          status: "planejado",
        },
      });

      const tarefasData = itensLoja.map((it) => ({
        planoExecId: execPlano.id,
        jbpItemId: it.id,
        assetId: it.assetId,
        storeScope: it.storeScope || "Todas as lojas",
        checklist: null,
        deadline: it.periodStart || null,
        status: "pendente",
        photoUrl: null,
        notes: it.notes || null,
      }));

      if (tarefasData.length > 0) {
        await prisma.TBLEXECTAREFA.createMany({
          data: tarefasData,
        });
      }
    }

    // 5) RETAIL MEDIA (E-commerce / App)
    const itensDigital = fullJbp.itens.filter(
      (it) =>
        it.asset?.channel === "ECOMMERCE" || it.asset?.channel === "APP"
    );

    let retailPlano = retailPlanoExistente;
    if (!retailPlano && itensDigital.length > 0) {
      const canalPlano =
        itensDigital.some((it) => it.asset?.channel === "APP") &&
        itensDigital.some((it) => it.asset?.channel === "ECOMMERCE")
          ? "MULTICANAL"
          : itensDigital[0].asset.channel || "ECOMMERCE";

      retailPlano = await prisma.TBLRETAILMEDIA_PLANO.create({
        data: {
          supplierId: fullJbp.supplierId,
          retailId: fullJbp.retailId || null,
          jbpId: fullJbp.id,
          name: `Retail Media - ${fullJbp.name}`,
          channel: canalPlano,
          periodStart: fullJbp.periodStart,
          periodEnd: fullJbp.periodEnd,
          status: "planejado",
        },
      });

      const retailData = itensDigital.map((it) => ({
        planoRetailId: retailPlano.id,
        jbpItemId: it.id,
        assetId: it.assetId,
        pageType: null,
        position: null,
        device: "ambos",
        impressionsTarget: null,
        clicksTarget: null,
        cpcNegociado: it.negotiatedUnitPrice || null,
        totalValue: it.totalValue || null,
        notes: it.notes || null,
      }));

      if (retailData.length > 0) {
        await prisma.TBLRETAILMEDIA_ITEM.createMany({
          data: retailData,
        });
      }
    }

    return res.json({
      message: "Contrato gerado / sincronizado com sucesso.",
      jbpId: fullJbp.id,
      campanhaId: campanha?.id || null,
      execPlanoId: execPlano?.id || null,
      retailPlanoId: retailPlano?.id || null,
      resumo: {
        totalItensJbp: fullJbp.itens.length,
        itensLoja: itensLoja.length,
        itensDigital: itensDigital.length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar contrato a partir do JBP:", error);
    return res
      .status(500)
      .json({ message: "Erro ao gerar contrato a partir do JBP." });
  }
});

module.exports = router;
