// Seed multi-tenant básico
const { PrismaClient, TenantType, UserRole, AccessChannel } = require("@prisma/client");
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
      status: "ativo",
    },
  });

  // 6) Usuário admin Nestlé (TENANT_ADMIN)
  const nestleAdminHash = await bcrypt.hash("senha-nestle", 10);
  await upsertUserByEmailOrLogin({
    email: "trade.nestle@exemplo.com",
    login: "nestle.admin",
    data: {
      name: "Gerente Trade Nestlé",
      email: "trade.nestle@exemplo.com",
      login: "nestle.admin",
      passwordHash: nestleAdminHash,
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.industria,
      tenantId: nestleTenant.id,
      supplierId: nestleSupplier.id,
      status: "ativo",
    },
  });

  // 7) Usuário admin Varejo X (TENANT_ADMIN)
  const varejoAdminHash = await bcrypt.hash("senha-varejo", 10);
  await upsertUserByEmailOrLogin({
    email: "trade@varejox.com",
    login: "varejo.admin",
    data: {
      name: "Gerente Trade Varejo X",
      email: "trade@varejox.com",
      login: "varejo.admin",
      passwordHash: varejoAdminHash,
      role: UserRole.TENANT_ADMIN,
      accessChannel: AccessChannel.varejo,
      tenantId: varejoTenant.id,
      retailId: varejoX.id,
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
