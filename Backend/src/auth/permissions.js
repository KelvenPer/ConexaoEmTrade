const { ModuleCode, PermissionLevel, UserRole, UserSector } = require("@prisma/client");
const prisma = require("../prisma");

const MODULE_ALIASES = {
  dashboard: ModuleCode.DASHBOARD,
  marketing: ModuleCode.MARKETING,
  trade: ModuleCode.TRADE,
  "retail-media": ModuleCode.RETAIL_MEDIA,
  retail_media: ModuleCode.RETAIL_MEDIA,
  ecommerce: ModuleCode.ECOMMERCE,
  comercial: ModuleCode.COMERCIAL,
  analytics: ModuleCode.ANALYTICS,
  dados: ModuleCode.ANALYTICS,
  config: ModuleCode.CONFIG,
  configuracoes: ModuleCode.CONFIG,
  contracts: ModuleCode.CONTRACTS,
  contratos: ModuleCode.CONTRACTS,
};

function coerceModuleCode(module) {
  if (!module) return null;
  if (Object.values(ModuleCode).includes(module)) return module;
  const key = String(module).toLowerCase();
  return MODULE_ALIASES[key] || null;
}

function permissionSatisfies(granted, required) {
  if (required === PermissionLevel.MANAGE) {
    return granted === PermissionLevel.MANAGE;
  }
  return granted === PermissionLevel.VIEW || granted === PermissionLevel.MANAGE;
}

function serializePermission(policy) {
  return {
    module: String(policy.module || "").toLowerCase(),
    level: String(policy.permission || "").toLowerCase(),
  };
}

async function buildUserPermissions(user) {
  if (!user) {
    return { policies: [], client: [] };
  }

  const sectorFilter = user.sector
    ? [{ sector: user.sector }, { sector: UserSector.GLOBAL }]
    : [{ sector: UserSector.GLOBAL }];

  let policies = await prisma.tBLACCESSPOLICY.findMany({
    where: {
      role: user.role,
      accessChannel: user.accessChannel,
      OR: sectorFilter,
    },
    orderBy: { module: "asc" },
  });

  if (!policies.length && user.role === UserRole.PLATFORM_ADMIN) {
    policies = Object.values(ModuleCode).map((module) => ({
      module,
      permission: PermissionLevel.MANAGE,
    }));
  }

  return {
    policies,
    client: policies.map(serializePermission),
  };
}

function hasPermission(policies, module, requiredLevel = PermissionLevel.VIEW) {
  const targetModule = coerceModuleCode(module);
  if (!targetModule) return false;
  return policies.some(
    (policy) =>
      policy.module === targetModule &&
      permissionSatisfies(policy.permission, requiredLevel)
  );
}

function requirePermission(policies, module, requiredLevel = PermissionLevel.VIEW) {
  if (!hasPermission(policies, module, requiredLevel)) {
    throw new Error("Acesso negado para este módulo.");
  }
}

module.exports = {
  buildUserPermissions,
  hasPermission,
  requirePermission,
  PermissionLevel,
  ModuleCode,
  coerceModuleCode,
};
