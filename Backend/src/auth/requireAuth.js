const prisma = require("../prisma");
const { getUserFromRequest } = require("./token");
const { normalizeChannel } = require("./multiTenantFilter");

async function requireAuthUser(req, res) {
  const decoded = getUserFromRequest(req);
  if (!decoded) {
    res.status(401).json({ message: "Token ausente ou invalido." });
    return null;
  }

  const userId = decoded.sub || decoded.id;
  const user = await prisma.TBLUSER.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      login: true,
      role: true,
      status: true,
      accessChannel: true,
      tenantId: true,
      supplierId: true,
      retailId: true,
    },
  });

  if (!user || user.status !== "ativo") {
    res.status(401).json({ message: "Usuario inativo ou nao encontrado." });
    return null;
  }

  return {
    ...user,
    accessChannel: normalizeChannel(user.accessChannel || decoded.accessChannel),
  };
}

module.exports = { requireAuthUser };
