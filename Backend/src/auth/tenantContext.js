const prisma = require("../prisma");

async function resolveTenantContext({
  tenantId,
  supplierId,
  retailId,
  allowRelationOverride = false,
}) {
  const defaultTenantId = Number(process.env.DEFAULT_TENANT_ID || 1);
  let resolvedTenantId = tenantId ? Number(tenantId) : null;
  const resolvedSupplierId = supplierId ? Number(supplierId) : null;
  const resolvedRetailId = retailId ? Number(retailId) : null;

  let supplier = null;
  let retail = null;

  if (resolvedSupplierId) {
    supplier = await prisma.TBLFORN.findUnique({
      where: { id: resolvedSupplierId },
      select: { id: true, tenantId: true },
    });
    if (!supplier) {
      throw new Error("Fornecedor (supplierId) nao encontrado.");
    }
    resolvedTenantId = resolvedTenantId ?? supplier.tenantId;
  }

  if (resolvedRetailId) {
    retail = await prisma.TBLRETAIL.findUnique({
      where: { id: resolvedRetailId },
      select: { id: true, tenantId: true },
    });
    if (!retail) {
      throw new Error("Varejo (retailId) nao encontrado.");
    }
    resolvedTenantId = resolvedTenantId ?? retail.tenantId;
  }

  if (!resolvedTenantId) {
    if (allowRelationOverride) {
      resolvedTenantId = defaultTenantId;
    } else {
      throw new Error("tenantId e obrigatorio (ou informe supplierId/retailId para inferir).");
    }
  }

  if (supplier && supplier.tenantId !== resolvedTenantId) {
    if (allowRelationOverride) {
      resolvedTenantId = supplier.tenantId;
    } else {
      throw new Error("tenantId nao corresponde ao fornecedor informado.");
    }
  }

  if (retail && retail.tenantId !== resolvedTenantId) {
    if (allowRelationOverride) {
      resolvedTenantId = retail.tenantId;
    } else {
      throw new Error("tenantId nao corresponde ao varejo informado.");
    }
  }

  return { tenantId: resolvedTenantId, supplierId: resolvedSupplierId, retailId: resolvedRetailId };
}

module.exports = { resolveTenantContext };
