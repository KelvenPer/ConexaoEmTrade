// backend/src/routes/ativos.js
const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

/**
 * GET /api/ativos
 * Lista todos os ativos (independente de status)
 */
router.get("/", async (req, res) => {
  try {
    const ativos = await prisma.TBLATV.findMany({
      orderBy: { name: "asc" },
    });
    res.json(ativos);
  } catch (error) {
    console.error("Erro ao listar ativos:", error);
    res.status(500).json({ message: "Erro ao listar ativos." });
  }
});

/**
 * GET /api/ativos/ativos
 * Lista apenas ativos com status = 'ativo'
 * (essa rota vamos usar depois em JBP/Campanhas)
 */
router.get("/ativos", async (req, res) => {
  try {
    const ativos = await prisma.TBLATV.findMany({
      where: { status: "ativo" },
      orderBy: { name: "asc" },
    });
    res.json(ativos);
  } catch (error) {
    console.error("Erro ao listar ativos ativos:", error);
    res.status(500).json({ message: "Erro ao listar ativos ativos." });
  }
});

/**
 * POST /api/ativos
 * Cria um novo ativo
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      channel,
      type,
      format,
      unit,
      basePrice,
      currency,
      description,
      status,
    } = req.body;

    if (!name || !channel) {
      return res
        .status(400)
        .json({ message: "Nome e canal são obrigatórios." });
    }

    const basePriceNumber =
      basePrice !== undefined &&
      basePrice !== null &&
      basePrice !== ""
        ? Number(basePrice)
        : null;

    const ativo = await prisma.TBLATV.create({
      data: {
        name,
        channel,
        type: type || null,
        format: format || null,
        unit: unit || null,
        basePrice: basePriceNumber,
        currency: currency || "BRL",
        description: description || null,
        status: status || "ativo",
      },
    });

    res.status(201).json(ativo);
  } catch (error) {
    console.error("Erro ao criar ativo:", error);
    res.status(500).json({ message: "Erro ao criar ativo." });
  }
});

/**
 * PUT /api/ativos/:id
 * Atualiza um ativo
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      channel,
      type,
      format,
      unit,
      basePrice,
      currency,
      description,
      status,
    } = req.body;

    const existente = await prisma.TBLATV.findUnique({
      where: { id },
    });

    if (!existente) {
      return res.status(404).json({ message: "Ativo não encontrado." });
    }

    const basePriceNumber =
      basePrice !== undefined &&
      basePrice !== null &&
      basePrice !== ""
        ? Number(basePrice)
        : existente.basePrice;

    const ativoAtualizado = await prisma.TBLATV.update({
      where: { id },
      data: {
        name: name ?? existente.name,
        channel: channel ?? existente.channel,
        type: type ?? existente.type,
        format: format ?? existente.format,
        unit: unit ?? existente.unit,
        basePrice: basePrice !== undefined
          ? basePriceNumber
          : existente.basePrice,
        currency: currency ?? existente.currency,
        description: description ?? existente.description,
        status: status ?? existente.status,
      },
    });

    res.json(ativoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar ativo:", error);
    res.status(500).json({ message: "Erro ao atualizar ativo." });
  }
});

/**
 * DELETE /api/ativos/:id
 * Exclui um ativo
 * (no futuro você pode trocar por "soft delete" se quiser)
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existente = await prisma.TBLATV.findUnique({
      where: { id },
    });

    if (!existente) {
      return res.status(404).json({ message: "Ativo não encontrado." });
    }

    await prisma.TBLATV.delete({
      where: { id },
    });

    res.json({ message: "Ativo excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir ativo:", error);
    res.status(500).json({ message: "Erro ao excluir ativo." });
  }
});

module.exports = router;
