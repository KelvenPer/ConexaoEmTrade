// Aplica filtro multi-tenant para restringir consultas por papel/canal
const { UserRole, AccessChannel } = require("@prisma/client");

function normalizeChannel(channel) {
  if (!channel) return AccessChannel.industria;
  const value = String(channel).toLowerCase();
  if (value === "varejo") return AccessChannel.varejo;
  if (value === "interno") return AccessChannel.interno;
  return AccessChannel.industria;
}

function buildMultiTenantWhere(user, baseWhere = {}) {
  if (!user) {
    // Sem usuário autenticado, retorna filtro que não encontra registros
    return { ...baseWhere, id: -1 };
  }

  const channel = normalizeChannel(user.accessChannel);

  if (user.role === UserRole.PLATFORM_ADMIN) {
    return baseWhere;
  }

  if (channel === AccessChannel.industria && user.supplierId) {
    return { ...baseWhere, supplierId: user.supplierId };
  }

  if (channel === AccessChannel.varejo && user.retailId) {
    return { ...baseWhere, retailId: user.retailId };
  }

  // fallback seguro: nada retorna
  return { ...baseWhere, id: -1 };
}

module.exports = {
  buildMultiTenantWhere,
  normalizeChannel,
};
