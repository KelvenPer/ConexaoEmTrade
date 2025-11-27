const prisma = require("../prisma");

async function resolveTenantContext({ tenantId, supplierId, retailId }) {
  let resolvedTenantId = tenantId ? Number(tenantId) : null;
  let resolvedSupplierId = supplierId ? Number(supplierId) : null;
  let resolvedRetailId = retailId ? Number(retailId) : null;

  let supplier = null;
  let retail = null;

  if (resolvedSupplierId) {
    supplier = await prisma.TBLFORN.findUnique({
      where: { id: resolvedSupplierId },
      select: { id: true, tenantId: true },
    });
    if (!supplier) {
      throw new Error("Fornecedor (supplierId) não encontrado.");
    }
    resolvedTenantId = resolvedTenantId ?? supplier.tenantId;
  }

  if (resolvedRetailId) {
    retail = await prisma.TBLRETAIL.findUnique({
      where: { id: resolvedRetailId },
      select: { id: true, tenantId: true },
    });
    if (!retail) {
      throw new Error("Varejo (retailId) não encontrado.");
    }
    resolvedTenantId = resolvedTenantId ?? retail.tenantId;
  }

  if (!resolvedTenantId) {
    throw new Error("tenantId é obrigatório (ou informe supplierId/retailId para inferir).");
  }

  if (supplier && supplier.tenantId !== resolvedTenantId) {
    throw new Error("tenantId não corresponde ao fornecedor informado.");
  }

  if (retail && retail.tenantId !== resolvedTenantId) {
    throw new Error("tenantId não corresponde ao varejo informado.");
  }

  return { tenantId: resolvedTenantId, supplierId: resolvedSupplierId, retailId: resolvedRetailId };
}

module.exports = { resolveTenantContext };
