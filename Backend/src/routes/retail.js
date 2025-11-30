// backend/src/routes/retail.js
const express = require("express");
const { UserRole, TenantType } = require("@prisma/client");
const prisma = require("../prisma");
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");
const { requireAuthUser } = require("../auth/requireAuth");

const router = express.Router();

async function requireAuth(req, res) {
  return requireAuthUser(req, res);
}

async function scopedWhere(user, baseWhere = {}) {
  const scope = await resolveScope(user);
  return applyScopeToWhere(baseWhere, scope, {
    tenantField: "tenantId",
    supplierField: null,
    retailField: "id",
  });
}

function assertAdmin(currentUser) {
  if (
    currentUser.role !== UserRole.PLATFORM_ADMIN &&
    currentUser.role !== UserRole.TENANT_ADMIN &&
    currentUser.role !== UserRole.SUPER_ADMIN
  ) {
    throw new Error("Apenas admin pode gerenciar varejos.");
  }
}

// GET /api/varejos/ativos
router.get("/ativos", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const where = await scopedWhere(user, { status: "ativo" });
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const varejos = await prisma.TBLRETAIL.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json(varejos);
  } catch (error) {
    console.error("Erro ao listar varejos ativos:", error);
    res.status(500).json({ message: "Erro ao listar varejos ativos." });
  }
});

// GET /api/varejos
router.get("/", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const where = await scopedWhere(user, {});
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const varejos = await prisma.TBLRETAIL.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json(varejos);
  } catch (error) {
    console.error("Erro ao listar varejos:", error);
    res.status(500).json({ message: "Erro ao listar varejos." });
  }
});

// GET /api/varejos/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const where = await scopedWhere(user, { id });
    if (where.id === -1) return res.status(403).json({ message: "Acesso negado." });

    const varejo = await prisma.TBLRETAIL.findFirst({ where });
    if (!varejo) {
      return res.status(404).json({ message: "Varejo nao encontrado." });
    }

    res.json(varejo);
  } catch (error) {
    console.error("Erro ao buscar varejo:", error);
    res.status(500).json({ message: "Erro ao buscar varejo." });
  }
});

// POST /api/varejos -> cria tenant do tipo VAREJO + registro
router.post("/", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    if (currentUser.role !== UserRole.PLATFORM_ADMIN) {
      return res.status(403).json({ message: "Apenas admin da plataforma cria um novo varejo/tenant." });
    }

    const { name, document, segment, channel, status } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "Nome do varejo e obrigatorio." });
    }

    const tenant = await prisma.TBLTENANT.create({
      data: {
        name,
        type: TenantType.VAREJO,
        status: status || "ativo",
      },
    });

    const varejo = await prisma.TBLRETAIL.create({
      data: {
        tenantId: tenant.id,
        name,
        document: document || null,
        segment: segment || null,
        channel: channel || "VAREJO",
        status: status || "ativo",
      },
    });

    res.status(201).json({
      message: "Varejo criado com sucesso.",
      varejo,
      tenant,
    });
  } catch (error) {
    console.error("Erro ao criar varejo:", error);
    res.status(500).json({ message: "Erro ao criar varejo." });
  }
});

// PUT /api/varejos/:id
router.put("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    assertAdmin(currentUser);

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const varejo = await prisma.TBLRETAIL.findUnique({ where: { id } });
    if (!varejo) {
      return res.status(404).json({ message: "Varejo nao encontrado." });
    }

    // Respeita escopo
    const where = await scopedWhere(currentUser, { id });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    if (
      (currentUser.role === UserRole.TENANT_ADMIN || currentUser.role === UserRole.SUPER_ADMIN) &&
      Number(currentUser.tenantId) !== Number(varejo.tenantId)
    ) {
      return res.status(403).json({ message: "Tenant invalido para este admin." });
    }

    const { name, document, segment, channel, status } = req.body || {};

    const atualizado = await prisma.TBLRETAIL.update({
      where: { id },
      data: {
        name: name ?? varejo.name,
        document: document ?? varejo.document,
        segment: segment ?? varejo.segment,
        channel: channel ?? varejo.channel,
        status: status ?? varejo.status,
      },
    });

    // Mantem tenant sincronizado com nome/status se alterar
    await prisma.TBLTENANT.update({
      where: { id: varejo.tenantId },
      data: {
        name: name ?? varejo.name,
        status: status ?? varejo.status,
      },
    });

    res.json({
      message: "Varejo atualizado com sucesso.",
      varejo: atualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar varejo:", error);
    res.status(500).json({ message: "Erro ao atualizar varejo." });
  }
});

// DELETE /api/varejos/:id
router.delete("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    if (currentUser.role !== UserRole.PLATFORM_ADMIN) {
      return res.status(403).json({ message: "Apenas admin da plataforma pode excluir varejo/tenant." });
    }

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const varejo = await prisma.TBLRETAIL.findUnique({ where: { id } });
    if (!varejo) {
      return res.status(404).json({ message: "Varejo nao encontrado." });
    }

    const [jbpCnt, campCnt, execCnt, retailMediaCnt, userCnt] = await Promise.all([
      prisma.TBLJBP.count({ where: { retailId: id } }),
      prisma.TBLCAMPANHA.count({ where: { retailId: id } }),
      prisma.TBLEXECPLANO.count({ where: { retailId: id } }),
      prisma.TBLRETAILMEDIA_PLANO.count({ where: { retailId: id } }),
      prisma.TBLUSER.count({ where: { retailId: id } }),
    ]);

    if (jbpCnt + campCnt + execCnt + retailMediaCnt + userCnt > 0) {
      const [jbps, campanhas, execPlanos, retailPlanos, usuarios] = await Promise.all([
        jbpCnt
          ? prisma.TBLJBP.findMany({
              where: { retailId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        campCnt
          ? prisma.TBLCAMPANHA.findMany({
              where: { retailId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        execCnt
          ? prisma.TBLEXECPLANO.findMany({
              where: { retailId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        retailMediaCnt
          ? prisma.TBLRETAILMEDIA_PLANO.findMany({
              where: { retailId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        userCnt
          ? prisma.TBLUSER.findMany({
              where: { retailId: id },
              select: { id: true, name: true, email: true },
              take: 5,
            })
          : [],
      ]);

      const conflicts = [];
      if (userCnt) {
        conflicts.push({
          type: "usuarios",
          label: "Usuarios vinculados",
          count: userCnt,
          samples: usuarios.map((u) => u.name || u.email || `Usuario #${u.id}`),
        });
      }
      if (jbpCnt) {
        conflicts.push({
          type: "jbps",
          label: "Planos/JBP",
          count: jbpCnt,
          samples: jbps.map((j) => j.name || `JBP #${j.id}`),
        });
      }
      if (campCnt) {
        conflicts.push({
          type: "campanhas",
          label: "Campanhas",
          count: campCnt,
          samples: campanhas.map((c) => c.name || `Campanha #${c.id}`),
        });
      }
      if (execCnt) {
        conflicts.push({
          type: "execPlanos",
          label: "Planos de execucao",
          count: execCnt,
          samples: execPlanos.map((p) => p.name || `Plano #${p.id}`),
        });
      }
      if (retailMediaCnt) {
        conflicts.push({
          type: "retailMedia",
          label: "Planos de Retail Media",
          count: retailMediaCnt,
          samples: retailPlanos.map((p) => p.name || `Retail media #${p.id}`),
        });
      }

      return res.status(400).json({
        message: "Varejo possui vinculacoes (usuarios, planos ou campanhas). Inative-o ou remova os vinculos antes de excluir.",
        conflicts,
      });
    }

    await prisma.$transaction([
      prisma.TBLPARTNERSHIP.deleteMany({ where: { retailId: id } }),
      prisma.TBLRETAIL.delete({ where: { id } }),
      prisma.TBLTENANT.update({
        where: { id: varejo.tenantId },
        data: { status: "inativo" },
      }),
    ]);

    res.json({ message: "Varejo excluido/inativado com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir varejo:", error);
    res.status(500).json({ message: "Erro ao excluir varejo." });
  }
});

module.exports = router;
