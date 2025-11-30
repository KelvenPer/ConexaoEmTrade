// backend/src/routes/suppliers.js
const express = require("express");
const { UserRole } = require("@prisma/client");
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
    supplierField: "id",
    retailField: null,
  });
}

function assertCanManage(currentUser, targetTenantId) {
  if (
    currentUser.role !== UserRole.PLATFORM_ADMIN &&
    currentUser.role !== UserRole.TENANT_ADMIN &&
    currentUser.role !== UserRole.SUPER_ADMIN
  ) {
    throw new Error("Apenas admin pode gerenciar fornecedores.");
  }
  if (
    (currentUser.role === UserRole.TENANT_ADMIN || currentUser.role === UserRole.SUPER_ADMIN) &&
    Number(targetTenantId) !== Number(currentUser.tenantId)
  ) {
    throw new Error("Tenant invalido para este admin.");
  }
}

// GET /api/fornecedores/ativos -> listar apenas fornecedores ativos
router.get("/ativos", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const where = await scopedWhere(user, { status: "ativo" });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const fornecedores = await prisma.TBLFORN.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao listar fornecedores ativos:", error);
    res.status(500).json({ message: "Erro ao listar fornecedores ativos." });
  }
});

// GET /api/fornecedores -> listar todos
router.get("/", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const where = await scopedWhere(user, {});
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const fornecedores = await prisma.TBLFORN.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao listar fornecedores:", error);
    res.status(500).json({ message: "Erro ao listar fornecedores." });
  }
});

// GET /api/fornecedores/:id -> buscar 1 fornecedor
router.get("/:id", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const id = Number(req.params.id);

    const where = await scopedWhere(user, { id });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const fornecedor = await prisma.TBLFORN.findFirst({ where });

    if (!fornecedor) {
      return res.status(404).json({ message: "Fornecedor nao encontrado." });
    }

    res.json(fornecedor);
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    res.status(500).json({ message: "Erro ao buscar fornecedor." });
  }
});

// POST /api/fornecedores -> criar fornecedor
router.post("/", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const { name, document, segment, channel, status, tenantId } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nome e obrigatorio." });
    }

    const targetTenantId = tenantId || currentUser.tenantId;
    if (!targetTenantId) {
      return res.status(400).json({ message: "tenantId obrigatorio." });
    }

    try {
      assertCanManage(currentUser, targetTenantId);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const novoFornecedor = await prisma.TBLFORN.create({
      data: {
        tenantId: Number(targetTenantId),
        name,
        document: document || null,
        segment: segment || null,
        channel: channel || null,
        status: status || "ativo",
      },
    });

    res.status(201).json({
      message: "Fornecedor criado com sucesso.",
      fornecedor: novoFornecedor,
    });
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ message: "Erro ao criar fornecedor." });
  }
});

// PUT /api/fornecedores/:id -> atualizar fornecedor
router.put("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const id = Number(req.params.id);
    const { name, document, segment, channel, status, tenantId } = req.body;

    const fornecedorExiste = await prisma.TBLFORN.findUnique({
      where: { id },
    });

    if (!fornecedorExiste) {
      return res.status(404).json({ message: "Fornecedor nao encontrado." });
    }

    const targetTenantId = tenantId || fornecedorExiste.tenantId;
    try {
      assertCanManage(currentUser, targetTenantId);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const fornecedorAtualizado = await prisma.TBLFORN.update({
      where: { id },
      data: {
        tenantId: Number(targetTenantId),
        name: name ?? fornecedorExiste.name,
        document: document ?? fornecedorExiste.document,
        segment: segment ?? fornecedorExiste.segment,
        channel: channel ?? fornecedorExiste.channel,
        status: status ?? fornecedorExiste.status,
      },
    });

    res.json({
      message: "Fornecedor atualizado com sucesso.",
      fornecedor: fornecedorAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ message: "Erro ao atualizar fornecedor." });
  }
});

// DELETE /api/fornecedores/:id -> deletar fornecedor
router.delete("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;

    const id = Number(req.params.id);

    const fornecedorExiste = await prisma.TBLFORN.findUnique({
      where: { id },
    });

    if (!fornecedorExiste) {
      return res.status(404).json({ message: "Fornecedor nao encontrado." });
    }

    try {
      assertCanManage(currentUser, fornecedorExiste.tenantId);
    } catch (err) {
      return res.status(403).json({ message: err.message });
    }

    const [
      jbpCnt,
      campCnt,
      execCnt,
      retailMediaCnt,
      vendasCnt,
      userCnt,
      productCnt,
      partnershipCnt,
    ] = await Promise.all([
      prisma.TBLJBP.count({ where: { supplierId: id } }),
      prisma.TBLCAMPANHA.count({ where: { supplierId: id } }),
      prisma.TBLEXECPLANO.count({ where: { supplierId: id } }),
      prisma.TBLRETAILMEDIA_PLANO.count({ where: { supplierId: id } }),
      prisma.TBLVENDASRESUMO.count({ where: { supplierId: id } }),
      prisma.TBLUSER.count({ where: { supplierId: id } }),
      prisma.TBLPROD.count({ where: { supplierId: id } }),
      prisma.TBLPARTNERSHIP.count({ where: { supplierId: id } }),
    ]);

    if (jbpCnt + campCnt + execCnt + retailMediaCnt + vendasCnt + userCnt + productCnt + partnershipCnt > 0) {
      const [
        jbps,
        campanhas,
        execPlanos,
        retailPlanos,
        vendas,
        usuarios,
        produtos,
        parcerias,
      ] = await Promise.all([
        jbpCnt
          ? prisma.TBLJBP.findMany({ where: { supplierId: id }, select: { id: true, name: true }, take: 5 })
          : [],
        campCnt
          ? prisma.TBLCAMPANHA.findMany({
              where: { supplierId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        execCnt
          ? prisma.TBLEXECPLANO.findMany({
              where: { supplierId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        retailMediaCnt
          ? prisma.TBLRETAILMEDIA_PLANO.findMany({
              where: { supplierId: id },
              select: { id: true, name: true },
              take: 5,
            })
          : [],
        vendasCnt
          ? prisma.TBLVENDASRESUMO.findMany({
              where: { supplierId: id },
              select: { id: true, ano: true, mes: true, channel: true },
              take: 5,
            })
          : [],
        userCnt
          ? prisma.TBLUSER.findMany({
              where: { supplierId: id },
              select: { id: true, name: true, email: true },
              take: 5,
            })
          : [],
        productCnt
          ? prisma.TBLPROD.findMany({
              where: { supplierId: id },
              select: { id: true, code: true, description: true },
              take: 5,
            })
          : [],
        partnershipCnt
          ? prisma.TBLPARTNERSHIP.findMany({
              where: { supplierId: id },
              select: { id: true, status: true, retail: { select: { name: true } } },
              take: 5,
            })
          : [],
      ]);

      const conflicts = [];
      if (productCnt) {
        conflicts.push({
          type: "produtos",
          label: "Produtos vinculados",
          count: productCnt,
          samples: produtos.map((p) => `${p.code || `Produto #${p.id}`} - ${p.description || "sem descricao"}`),
        });
      }
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
      if (vendasCnt) {
        conflicts.push({
          type: "vendas",
          label: "Historico de vendas",
          count: vendasCnt,
          samples: vendas.map((v) => {
            const mes = v.mes ? `/${v.mes}` : "";
            return `Resumo ${v.ano}${mes} (${v.channel || "canal"})`;
          }),
        });
      }
      if (partnershipCnt) {
        conflicts.push({
          type: "parcerias",
          label: "Parcerias com varejo",
          count: partnershipCnt,
          samples: parcerias.map((p) => `Parceria com ${p.retail?.name || "varejo"} (${p.status || "ativo"})`),
        });
      }

      return res.status(400).json({
        message:
          "Fornecedor possui vinculacoes (produtos, usuarios, planos ou campanhas). Inative-o ou remova os vinculos antes de excluir.",
        conflicts,
      });
    }

    // Remove contratos/parcerias antes de excluir o fornecedor para evitar violacao de FK
    await prisma.$transaction([
      prisma.TBLPARTNERSHIP.deleteMany({ where: { supplierId: id } }),
      prisma.TBLFORN.delete({ where: { id } }),
    ]);

    res.json({ message: "Fornecedor e contratos vinculados deletados com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    res.status(500).json({ message: "Erro ao deletar fornecedor." });
  }
});

module.exports = router;
