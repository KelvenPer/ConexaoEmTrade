// Seed multi-tenant básico
const {
  PrismaClient,
  TenantType,
  UserRole,
  AccessChannel,
  UserSector,
  ModuleCode,
  PermissionLevel,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUserByEmailOrLogin({ email, login, data }) {
  const existing = await prisma.tBLUSER.findFirst({
    where: {
      OR: [{ email }, { login }],
    },
  });

  if (existing) {
    return prisma.tBLUSER.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.tBLUSER.create({ data });
}

async function upsertPolicy(policy) {
  const { role, accessChannel, sector = UserSector.GLOBAL, module, permission } = policy;
  const sectorValue = sector || UserSector.GLOBAL;
  await prisma.tBLACCESSPOLICY.upsert({
    where: {
      role_accessChannel_sector_module_permission: {
        role,
        accessChannel,
        sector: sectorValue,
        module,
        permission,
      },
    },
    update: {},
    create: {
      role,
      accessChannel,
      sector: sectorValue,
      module,
      permission,
    },
  });
}

async function seedPolicies() {
  const basePolicies = [
    // Plataforma (Kelven) - controla tudo
    ...Object.values(ModuleCode).map((module) => ({
      role: UserRole.PLATFORM_ADMIN,
      accessChannel: AccessChannel.interno,
      sector: UserSector.GLOBAL,
      module,
      permission: PermissionLevel.MANAGE,
    })),
    // Super admin do varejo - controla tudo dentro do tenant
    ...Object.values(ModuleCode).map((module) => ({
      role: UserRole.SUPER_ADMIN,
      accessChannel: AccessChannel.varejo,
      sector: UserSector.GLOBAL,
      module,
      permission: PermissionLevel.MANAGE,
    })),
    // Tenant admin (varejo) - controla apenas o seu setor e configuracoes basicas
    {
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.varejo,
      sector: UserSector.GLOBAL,
      module: ModuleCode.DASHBOARD,
      permission: PermissionLevel.VIEW,
    },
    {
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.varejo,
      sector: UserSector.GLOBAL,
      module: ModuleCode.CONFIG,
      permission: PermissionLevel.MANAGE,
    },
    // Setores especificos para tenant admin
    ...[
      { sector: UserSector.MARKETING, module: ModuleCode.MARKETING },
      { sector: UserSector.TRADE_MARKETING, module: ModuleCode.TRADE },
      { sector: UserSector.COMERCIAL, module: ModuleCode.COMERCIAL },
      { sector: UserSector.ANALITICA, module: ModuleCode.ANALYTICS },
    ].map(({ sector, module }) => ({
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.varejo,
      sector,
      module,
      permission: PermissionLevel.MANAGE,
    })),
    // Usuarios do varejo - visao somente do seu setor + dashboard
    {
      role: UserRole.USER,
      accessChannel: AccessChannel.varejo,
      sector: UserSector.GLOBAL,
      module: ModuleCode.DASHBOARD,
      permission: PermissionLevel.VIEW,
    },
    ...[
      { sector: UserSector.MARKETING, module: ModuleCode.MARKETING },
      { sector: UserSector.TRADE_MARKETING, module: ModuleCode.TRADE },
      { sector: UserSector.COMERCIAL, module: ModuleCode.COMERCIAL },
      { sector: UserSector.ANALITICA, module: ModuleCode.ANALYTICS },
    ].map(({ sector, module }) => ({
      role: UserRole.USER,
      accessChannel: AccessChannel.varejo,
      sector,
      module,
      permission: PermissionLevel.VIEW,
    })),
    // Industria: acesso somente leitura ao que estiver vinculado (contratos/execucao)
    ...[
      ModuleCode.DASHBOARD,
      ModuleCode.TRADE,
      ModuleCode.MARKETING,
      ModuleCode.RETAIL_MEDIA,
      ModuleCode.ECOMMERCE,
      ModuleCode.ANALYTICS,
      ModuleCode.CONTRACTS,
    ].map((module) => ({
      role: UserRole.USER,
      accessChannel: AccessChannel.industria,
      sector: UserSector.GLOBAL,
      module,
      permission: PermissionLevel.VIEW,
    })),
  ];

  for (const policy of basePolicies) {
    // eslint-disable-next-line no-await-in-loop
    await upsertPolicy(policy);
  }
}

async function main() {
  // 1) Tenant interno (plataforma)
  const platformTenant = await prisma.tBLTENANT.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Conexão em Trade - Plataforma",
      type: TenantType.INTERNAL,
      status: "ativo",
    },
  });

  // 2) Tenants exemplo
  const nestleTenant = await prisma.tBLTENANT.create({
    data: {
      name: "Nestlé Brasil",
      type: TenantType.INDUSTRIA,
      status: "ativo",
    },
  });

  const varejoTenant = await prisma.tBLTENANT.create({
    data: {
      name: "Varejo X Supermercados",
      type: TenantType.VAREJO,
      status: "ativo",
    },
  });

  // 3) Fornecedor (indústria) ligado ao tenant Nestlé
  const nestleSupplier = await prisma.tBLFORN.create({
    data: {
      tenantId: nestleTenant.id,
      name: "Nestlé",
      document: "00.000.000/0001-00",
      segment: "Alimentos",
      channel: "INDUSTRIA",
      status: "ativo",
    },
  });

  await prisma.tBLPROD.createMany({
    data: [
      {
        tenantId: nestleTenant.id,
        supplierId: nestleSupplier.id,
        code: "NES-ACHO-200G",
        description: "Achocolatado em po 200g",
        brand: "Nescau",
        category: "Achocolatado",
        status: "ativo",
      },
      {
        tenantId: nestleTenant.id,
        supplierId: nestleSupplier.id,
        code: "NES-LEITE-1L",
        description: "Leite integral 1L",
        brand: "Nestle",
        category: "Lacteos",
        status: "ativo",
      },
    ],
    skipDuplicates: true,
  });

  // 4) Varejo ligado ao tenant Varejo X
  const varejoX = await prisma.tBLRETAIL.create({
    data: {
      tenantId: varejoTenant.id,
      name: "Varejo X Supermercados",
      document: "11.111.111/0001-11",
      segment: "Supermercado",
      channel: "VAREJO",
      status: "ativo",
    },
  });

  // 4.1) Parceria ativa entre NestlǸ e Varejo X (contrato para liberar visualizacao)
  await prisma.tBLPARTNERSHIP.create({
    data: {
      tenantId: varejoTenant.id, // armazenamos a parceria no tenant do varejo
      supplierId: nestleSupplier.id,
      retailId: varejoX.id,
      status: "ativo",
      validFrom: new Date(),
    },
  });

  await seedPolicies();

  // 5) Usuário plataforma (PLATFORM_ADMIN)
  const kelvenPasswordHash = await bcrypt.hash("senha-forte-kelven", 10);
  await upsertUserByEmailOrLogin({
    email: "kelven.silva@plataforma.com",
    login: "kelven.silva",
    data: {
      name: "Kelven Silva",
      email: "kelven.silva@plataforma.com",
      login: "kelven.silva",
      passwordHash: kelvenPasswordHash,
      role: UserRole.PLATFORM_ADMIN,
      accessChannel: AccessChannel.interno,
      tenantId: platformTenant.id,
      sector: UserSector.ANALITICA,
      status: "ativo",
    },
  });

  // 6) Usuário indústria Nestlé (somente leitura)
  const nestleAdminHash = await bcrypt.hash("senha-nestle", 10);
  await upsertUserByEmailOrLogin({
    email: "trade.nestle@exemplo.com",
    login: "nestle.admin",
    data: {
      name: "Gerente Trade Nestlé",
      email: "trade.nestle@exemplo.com",
      login: "nestle.admin",
      passwordHash: nestleAdminHash,
      role: UserRole.USER,
      accessChannel: AccessChannel.industria,
      tenantId: nestleTenant.id,
      supplierId: nestleSupplier.id,
      sector: UserSector.TRADE_MARKETING,
      status: "ativo",
    },
  });

  // 7) Usuário super admin Varejo X
  const varejoAdminHash = await bcrypt.hash("senha-varejo", 10);
  await upsertUserByEmailOrLogin({
    email: "trade@varejox.com",
    login: "varejo.admin",
    data: {
      name: "Gerente Trade Varejo X",
      email: "trade@varejox.com",
      login: "varejo.admin",
      passwordHash: varejoAdminHash,
      role: UserRole.SUPER_ADMIN,
      accessChannel: AccessChannel.varejo,
      tenantId: varejoTenant.id,
      retailId: varejoX.id,
      sector: UserSector.TRADE_MARKETING,
      status: "ativo",
    },
  });

  // 8) Usuário tenant_admin (varejo) - Marketing
  const varejoMktHash = await bcrypt.hash("senha-marketing", 10);
  await upsertUserByEmailOrLogin({
    email: "marketing@varejox.com",
    login: "varejo.marketing",
    data: {
      name: "Marketing Varejo X",
      email: "marketing@varejox.com",
      login: "varejo.marketing",
      passwordHash: varejoMktHash,
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.varejo,
      tenantId: varejoTenant.id,
      retailId: varejoX.id,
      sector: UserSector.MARKETING,
      status: "ativo",
    },
  });

  console.log("Seed multi-tenant concluído ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
