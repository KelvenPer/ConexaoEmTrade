// backend/src/routes/initiatives.js
const express = require("express");
const { InitiativeType, UserRole } = require("@prisma/client");
const prisma = require("../prisma");
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");
const { requireAuthUser } = require("../auth/requireAuth");
const { PermissionLevel, ModuleCode, hasPermission } = require("../auth/permissions");

const router = express.Router();

async function scopedWhere(user, baseWhere = {}) {
  const scope = await resolveScope(user);
  return applyScopeToWhere(baseWhere, scope, {
    tenantField: null,
    supplierField: "supplierId",
    retailField: "retailId",
    allowNullRetail: true,
  });
}

function assertWrite(user) {
  if (
    user.role === UserRole.PLATFORM_ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.TENANT_ADMIN
  ) {
    return;
  }
  if (
    hasPermission(user.permissionRecords || [], ModuleCode.TRADE, PermissionLevel.MANAGE) ||
    hasPermission(user.permissionRecords || [], ModuleCode.MARKETING, PermissionLevel.MANAGE)
  ) {
    return;
  }
  throw new Error("Permissao negada para gerenciar iniciativas.");
}

// GET /api/iniciativas
router.get("/", async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;

    const { type, supplierId, retailId, jbpId, status } = req.query;

    const baseWhere = {};
    if (type && Object.values(InitiativeType).includes(type)) baseWhere.type = type;
    if (supplierId) {
      const sid = Number(supplierId);
      if (!Number.isNaN(sid)) baseWhere.supplierId = sid;
    }
    if (retailId) {
      const rid = Number(retailId);
      if (!Number.isNaN(rid)) baseWhere.retailId = rid;
    }
    if (jbpId) {
      const jid = Number(jbpId);
      if (!Number.isNaN(jid)) baseWhere.jbpId = jid;
    }
    if (status) baseWhere.status = String(status);

    const where = await scopedWhere(user, baseWhere);
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const iniciativas = await prisma.TBLINITIATIVE.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        retail: true,
        produtos: { include: { product: true } },
        ativos: { include: { asset: true } },
      },
    });

    res.json(iniciativas);
  } catch (error) {
    console.error("Erro ao listar iniciativas:", error);
    res.status(500).json({ message: "Erro ao listar iniciativas." });
  }
});

// POST /api/iniciativas
router.post("/", async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    try {
      assertWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const {
      type,
      name,
      objective,
      channel,
      supplierId,
      retailId,
      jbpId,
      startDate,
      endDate,
      status,
      totalBudget,
      notes,
      productIds = [],
      assetIds = [],
    } = req.body;

    if (!type || !Object.values(InitiativeType).includes(type)) {
      return res.status(400).json({ message: "Tipo de iniciativa invalido." });
    }
    if (!name) {
      return res.status(400).json({ message: "Nome da iniciativa é obrigatorio." });
    }

    const parsedSupplierId = supplierId ? Number(supplierId) : null;
    const parsedRetailId = retailId ? Number(retailId) : null;
    const parsedJbpId = jbpId ? Number(jbpId) : null;

    const where = await scopedWhere(user, {
      supplierId: parsedSupplierId || undefined,
      retailId: parsedRetailId || undefined,
    });
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const data = {
      type,
      name,
      objective: objective || null,
      channel: channel || null,
      supplierId: parsedSupplierId || null,
      retailId: parsedRetailId || null,
      jbpId: parsedJbpId || null,
      status: status || "planejada",
      notes: notes || null,
    };

    if (startDate) {
      const d = new Date(startDate);
      if (!Number.isNaN(d.getTime())) data.startDate = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!Number.isNaN(d.getTime())) data.endDate = d;
    }
    if (totalBudget !== undefined && totalBudget !== null && totalBudget !== "") {
      const b = Number(totalBudget);
      if (!Number.isNaN(b)) data.totalBudget = b;
    }

    const created = await prisma.TBLINITIATIVE.create({
      data,
    });

    if (Array.isArray(productIds) && productIds.length) {
      await prisma.TBLINITIATIVE_PRODUCT.createMany({
        data: productIds.map((pid) => ({
          initiativeId: created.id,
          productId: Number(pid),
        })),
      });
    }

    if (Array.isArray(assetIds) && assetIds.length) {
      await prisma.TBLINITIATIVE_ASSET.createMany({
        data: assetIds.map((aid) => ({
          initiativeId: created.id,
          assetId: Number(aid),
        })),
      });
    }

    const full = await prisma.TBLINITIATIVE.findUnique({
      where: { id: created.id },
      include: {
        produtos: { include: { product: true } },
        ativos: { include: { asset: true } },
      },
    });

    res.status(201).json(full);
  } catch (error) {
    console.error("Erro ao criar iniciativa:", error);
    res.status(500).json({ message: "Erro ao criar iniciativa." });
  }
});

// GET /api/iniciativas/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido." });

    const user = await requireAuthUser(req, res);
    if (!user) return;

    const where = await scopedWhere(user, { id });
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const iniciativa = await prisma.TBLINITIATIVE.findFirst({
      where,
      include: {
        supplier: true,
        retail: true,
        jbp: true,
        produtos: { include: { product: true } },
        ativos: { include: { asset: true } },
      },
    });

    if (!iniciativa) return res.status(404).json({ message: "Iniciativa nao encontrada." });

    res.json(iniciativa);
  } catch (error) {
    console.error("Erro ao buscar iniciativa:", error);
    res.status(500).json({ message: "Erro ao buscar iniciativa." });
  }
});

// PUT /api/iniciativas/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido." });

    const user = await requireAuthUser(req, res);
    if (!user) return;
    try {
      assertWrite(user);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const existing = await prisma.TBLINITIATIVE.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Iniciativa nao encontrada." });

    const where = await scopedWhere(user, { id });
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const {
      name,
      objective,
      channel,
      supplierId,
      retailId,
      jbpId,
      startDate,
      endDate,
      status,
      totalBudget,
      notes,
      productIds,
      assetIds,
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (objective !== undefined) data.objective = objective || null;
    if (channel !== undefined) data.channel = channel || null;
    if (status !== undefined) data.status = status || "planejada";
    if (notes !== undefined) data.notes = notes || null;

    if (supplierId !== undefined) {
      const sid = supplierId ? Number(supplierId) : null;
      if (sid && Number.isNaN(sid)) return res.status(400).json({ message: "Fornecedor invalido." });
      data.supplierId = sid;
    }
    if (retailId !== undefined) {
      const rid = retailId ? Number(retailId) : null;
      if (rid && Number.isNaN(rid)) return res.status(400).json({ message: "Varejo invalido." });
      data.retailId = rid;
    }
    if (jbpId !== undefined) {
      const jid = jbpId ? Number(jbpId) : null;
      if (jid && Number.isNaN(jid)) return res.status(400).json({ message: "JBP invalido." });
      data.jbpId = jid;
    }

    if (startDate !== undefined) {
      if (!startDate) data.startDate = null;
      else {
        const d = new Date(startDate);
        if (!Number.isNaN(d.getTime())) data.startDate = d;
      }
    }
    if (endDate !== undefined) {
      if (!endDate) data.endDate = null;
      else {
        const d = new Date(endDate);
        if (!Number.isNaN(d.getTime())) data.endDate = d;
      }
    }
    if (totalBudget !== undefined) {
      if (totalBudget === null || totalBudget === "") {
        data.totalBudget = null;
      } else {
        const b = Number(totalBudget);
        if (!Number.isNaN(b)) data.totalBudget = b;
      }
    }

    const updated = await prisma.TBLINITIATIVE.update({
      where: { id },
      data,
    });

    if (Array.isArray(productIds)) {
      await prisma.TBLINITIATIVE_PRODUCT.deleteMany({ where: { initiativeId: id } });
      if (productIds.length) {
        await prisma.TBLINITIATIVE_PRODUCT.createMany({
          data: productIds.map((pid) => ({
            initiativeId: id,
            productId: Number(pid),
          })),
        });
      }
    }

    if (Array.isArray(assetIds)) {
      await prisma.TBLINITIATIVE_ASSET.deleteMany({ where: { initiativeId: id } });
      if (assetIds.length) {
        await prisma.TBLINITIATIVE_ASSET.createMany({
          data: assetIds.map((aid) => ({
            initiativeId: id,
            assetId: Number(aid),
          })),
        });
      }
    }

    const full = await prisma.TBLINITIATIVE.findUnique({
      where: { id: updated.id },
      include: {
        produtos: { include: { product: true } },
        ativos: { include: { asset: true } },
      },
    });

    res.json(full);
  } catch (error) {
    console.error("Erro ao atualizar iniciativa:", error);
    res.status(500).json({ message: "Erro ao atualizar iniciativa." });
  }
});

module.exports = router;
