// backend/src/routes/suppliers.js
const express = require("express");
const { UserRole } = require("@prisma/client");
const prisma = require("../prisma");
const { getUserFromRequest } = require("../auth/token");

const router = express.Router();

function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: "Token ausente ou invalido." });
    return null;
  }
  return user;
}

function assertCanManage(currentUser, targetTenantId) {
  if (
    currentUser.role !== UserRole.PLATFORM_ADMIN &&
    currentUser.role !== UserRole.TENANT_ADMIN
  ) {
    throw new Error("Apenas admin pode gerenciar fornecedores.");
  }
  if (
    currentUser.role === UserRole.TENANT_ADMIN &&
    Number(targetTenantId) !== Number(currentUser.tenantId)
  ) {
    throw new Error("Tenant invalido para este admin.");
  }
}

// GET /api/fornecedores/ativos -> listar apenas fornecedores ativos
router.get("/ativos", async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const where =
      user.role === UserRole.PLATFORM_ADMIN
        ? { status: "ativo" }
        : { status: "ativo", tenantId: user.tenantId };

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
    const user = requireAuth(req, res);
    if (!user) return;

    const where =
      user.role === UserRole.PLATFORM_ADMIN
        ? {}
        : { tenantId: user.tenantId };

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
    const user = requireAuth(req, res);
    if (!user) return;

    const id = Number(req.params.id);

    const fornecedor = await prisma.TBLFORN.findFirst({
      where:
        user.role === UserRole.PLATFORM_ADMIN
          ? { id }
          : { id, tenantId: user.tenantId },
    });

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
    const currentUser = requireAuth(req, res);
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
    const currentUser = requireAuth(req, res);
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
    const currentUser = requireAuth(req, res);
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

    await prisma.TBLFORN.delete({
      where: { id },
    });

    res.json({ message: "Fornecedor deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    res.status(500).json({ message: "Erro ao deletar fornecedor." });
  }
});

module.exports = router;
