// Filtro multi-tenant com validação de canal e contratos ativos
const { UserRole, AccessChannel } = require("@prisma/client");
const prisma = require("../prisma");

function normalizeChannel(channel) {
  if (!channel) return AccessChannel.industria;
  const value = String(channel).toLowerCase();
  if (value === "varejo") return AccessChannel.varejo;
  if (value === "interno") return AccessChannel.interno;
  return AccessChannel.industria;
}

async function getActivePartnerships({ supplierId, retailId }) {
  const today = new Date();
  return prisma.TBLPARTNERSHIP.findMany({
    where: {
      status: "ativo",
      ...(supplierId ? { supplierId: Number(supplierId) } : {}),
      ...(retailId ? { retailId: Number(retailId) } : {}),
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: today } }] },
        { OR: [{ validTo: null }, { validTo: { gte: today } }] },
      ],
    },
    select: { supplierId: true, retailId: true },
  });
}

async function resolveScope(user) {
  if (!user) {
    return { denyAll: true };
  }

  const channel = normalizeChannel(user.accessChannel);
  const tenantId = user.tenantId ? Number(user.tenantId) : null;

  if (user.role === UserRole.PLATFORM_ADMIN) {
    return { isPlatformAdmin: true, tenantId: null, supplierIds: [], retailIds: [] };
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    if (!tenantId) {
      return { denyAll: true };
    }
    const [suppliers, retails] = await Promise.all([
      prisma.TBLFORN.findMany({
        where: { tenantId },
        select: { id: true },
      }),
      prisma.TBLRETAIL.findMany({
        where: { tenantId },
        select: { id: true },
      }),
    ]);

    return {
      tenantId,
      supplierIds: suppliers.map((s) => s.id),
      retailIds: retails.map((r) => r.id),
      isPlatformAdmin: false,
    };
  }

  // Tenant admin sem supplier/retail: enxerga todo o tenant
  if (user.role === UserRole.TENANT_ADMIN && !user.supplierId && !user.retailId) {
    const [suppliers, retails] = await Promise.all([
      prisma.TBLFORN.findMany({
        where: { tenantId },
        select: { id: true },
      }),
      prisma.TBLRETAIL.findMany({
        where: { tenantId },
        select: { id: true },
      }),
    ]);

    return {
      tenantId,
      supplierIds: suppliers.map((s) => s.id),
      retailIds: retails.map((r) => r.id),
      isPlatformAdmin: false,
    };
  }

  // Canal indústria
  if (channel === AccessChannel.industria && user.supplierId) {
    const supplierId = Number(user.supplierId);
    const partnerships = await getActivePartnerships({ supplierId });
    return {
      tenantId,
      supplierIds: [supplierId],
      retailIds: partnerships.map((p) => p.retailId),
      isPlatformAdmin: false,
    };
  }

  // Canal varejo
  if (channel === AccessChannel.varejo && user.retailId) {
    const retailId = Number(user.retailId);
    const partnerships = await getActivePartnerships({ retailId });
    return {
      tenantId,
      supplierIds: partnerships.map((p) => p.supplierId),
      retailIds: [retailId],
      isPlatformAdmin: false,
    };
  }

  // Canal interno: restringe ao tenant
  if (channel === AccessChannel.interno && tenantId) {
    return { tenantId, supplierIds: [], retailIds: [], isPlatformAdmin: false };
  }

  return { denyAll: true };
}

function applyScopeToWhere(baseWhere = {}, scope = {}, opts = {}) {
  if (scope.denyAll) {
    return { ...baseWhere, id: -1 };
  }

  if (scope.isPlatformAdmin) {
    return { ...baseWhere };
  }

  const where = { ...baseWhere };
  const {
    supplierField = "supplierId",
    retailField = "retailId",
    tenantField = null,
    allowNullRetail = false,
  } = opts;

  if (tenantField && scope.tenantId) {
    if (
      baseWhere[tenantField] &&
      Number(baseWhere[tenantField]) !== Number(scope.tenantId)
    ) {
      return { id: -1 };
    }
    where[tenantField] = Number(scope.tenantId);
  }

  if (supplierField && scope.supplierIds && scope.supplierIds.length) {
    if (baseWhere[supplierField] !== undefined && baseWhere[supplierField] !== null) {
      const requested = Number(baseWhere[supplierField]);
      if (!scope.supplierIds.includes(requested)) {
        return { id: -1 };
      }
      where[supplierField] = requested;
    } else {
      where[supplierField] = { in: scope.supplierIds };
    }
  }

  if (retailField && scope.retailIds && scope.retailIds.length) {
    if (baseWhere[retailField] !== undefined && baseWhere[retailField] !== null) {
      const requested = Number(baseWhere[retailField]);
      const allowed = allowNullRetail ? [...scope.retailIds, null] : scope.retailIds;
      if (!allowed.includes(requested)) {
        return { id: -1 };
      }
      where[retailField] = requested;
    } else {
      where[retailField] = allowNullRetail
        ? { in: [...scope.retailIds, null] }
        : { in: scope.retailIds };
    }
  }

  // Sem escopo válido => bloqueia
  if (
    supplierField &&
    !scope.isPlatformAdmin &&
    !scope.supplierIds?.length &&
    !scope.retailIds?.length &&
    tenantField === null
  ) {
    return { ...where, id: -1 };
  }

  return where;
}

module.exports = {
  normalizeChannel,
  resolveScope,
  applyScopeToWhere,
  getActivePartnerships,
};
