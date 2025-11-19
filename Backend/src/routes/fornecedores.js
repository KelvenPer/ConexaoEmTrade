// backend/src/routes/suppliers.js
const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// GET /api/fornecedores/ativos -> listar apenas fornecedores ativos
router.get("/ativos", async (req, res) => {
  try {
    const fornecedores = await prisma.TBLFORN.findMany({
      where: { status: "ativo" },
      orderBy: { name: "asc" },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao listar fornecedores ativos:", error);
    res
      .status(500)
      .json({ message: "Erro ao listar fornecedores ativos." });
  }
});

// GET /api/fornecedores -> listar todos
router.get("/", async (req, res) => {
  try {
    const fornecedores = await prisma.TBLFORN.findMany({
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
    const id = Number(req.params.id);

    const fornecedor = await prisma.TBLFORN.findUnique({
      where: { id },
    });

    if (!fornecedor) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
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
    const { name, document, segment, channel, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nome é obrigatório." });
    }

    const novoFornecedor = await prisma.TBLFORN.create({
      data: {
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
    const id = Number(req.params.id);
    const { name, document, segment, channel, status } = req.body;

    const fornecedorExiste = await prisma.TBLFORN.findUnique({
      where: { id },
    });

    if (!fornecedorExiste) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
    }

    const fornecedorAtualizado = await prisma.TBLFORN.update({
      where: { id },
      data: {
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
    const id = Number(req.params.id);

    const fornecedorExiste = await prisma.TBLFORN.findUnique({
      where: { id },
    });

    if (!fornecedorExiste) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
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
