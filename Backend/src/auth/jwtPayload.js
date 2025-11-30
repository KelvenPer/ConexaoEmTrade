// Helper para construir o payload do JWT com contexto multi-tenant
const { UserRole, AccessChannel } = require("@prisma/client");

function buildJwtPayload(user) {
  if (!user) return null;

  return {
    sub: user.id,
    id: user.id, // compatibilidade com código legada
    tenantId: user.tenantId,
    role: user.role || UserRole.USER,
    accessChannel: user.accessChannel || AccessChannel.industria,
    supplierId: user.supplierId ?? null,
    retailId: user.retailId ?? null,
    email: user.email,
    name: user.name,
    sector: user.sector,
  };
}

module.exports = { buildJwtPayload };
