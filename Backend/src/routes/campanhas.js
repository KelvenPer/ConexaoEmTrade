// backend/src/routes/campanhas.js
const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

/**
 * GET /api/campanhas
 * Lista campanhas, com filtros opcionais:
 *  - ?supplierId=1
 *  - ?jbpId=1
 *  - ?status=planejada
 */
router.get("/", async (req, res) => {
  try {
    const { supplierId, jbpId, status } = req.query;

    const where = {};

    if (supplierId) {
      const sid = Number(supplierId);
      if (!Number.isNaN(sid)) {
        where.supplierId = sid;
      }
    }

    if (jbpId) {
      const jid = Number(jbpId);
      if (!Number.isNaN(jid)) {
        where.jbpId = jid;
      }
    }

    if (status) {
      where.status = status;
    }

    const campanhas = await prisma.TBLCAMPANHA.findMany({
      where,
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      include: {
        supplier: true,
        jbp: true,
        itens: {
          include: {
            asset: true,
            jbpItem: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    return res.json(campanhas);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    return res.status(500).json({ message: "Erro ao listar campanhas." });
  }
});

/**
 * GET /api/campanhas/:id
 * Detalhe de uma campanha + itens
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const campanha = await prisma.TBLCAMPANHA.findUnique({
      where: { id },
      include: {
        supplier: true,
        jbp: true,
        itens: {
          include: {
            asset: true,
            jbpItem: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!campanha) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    return res.json(campanha);
  } catch (error) {
    console.error("Erro ao buscar campanha:", error);
    return res.status(500).json({ message: "Erro ao buscar campanha." });
  }
});

/**
 * POST /api/campanhas
 * Cria uma campanha (cabeçalho)
 */
router.post("/", async (req, res) => {
  try {
    const {
      supplierId,
      jbpId,
      name,
      objective,
      channel,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!supplierId || !name) {
      return res
        .status(400)
        .json({ message: "Fornecedor e nome da campanha são obrigatórios." });
    }

    const sid = Number(supplierId);
    if (Number.isNaN(sid)) {
      return res.status(400).json({ message: "Fornecedor inválido." });
    }

    const dataToCreate = {
      supplierId: sid,
      name,
      objective: objective || null,
      channel: channel || null,
      status: status || "planejada",
    };

    if (jbpId) {
      const jid = Number(jbpId);
      if (!Number.isNaN(jid)) {
        dataToCreate.jbpId = jid;
      }
    }

    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) dataToCreate.startDate = d;
    }

    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) dataToCreate.endDate = d;
    }

    const campanha = await prisma.TBLCAMPANHA.create({
      data: dataToCreate,
    });

    return res.status(201).json(campanha);
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return res.status(500).json({ message: "Erro ao criar campanha." });
  }
});

/**
 * PUT /api/campanhas/:id
 * Atualiza cabeçalho da campanha
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const existente = await prisma.TBLCAMPANHA.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    const {
      supplierId,
      jbpId,
      name,
      objective,
      channel,
      startDate,
      endDate,
      status,
    } = req.body;

    const dataToUpdate = {};

    if (supplierId !== undefined) {
      const sid = Number(supplierId);
      if (!Number.isNaN(sid)) dataToUpdate.supplierId = sid;
    }

    if (jbpId !== undefined) {
      if (!jbpId) {
        dataToUpdate.jbpId = null;
      } else {
        const jid = Number(jbpId);
        if (!Number.isNaN(jid)) dataToUpdate.jbpId = jid;
      }
    }

    if (name !== undefined) dataToUpdate.name = name;
    if (objective !== undefined) dataToUpdate.objective = objective || null;
    if (channel !== undefined) dataToUpdate.channel = channel || null;
    if (status !== undefined) dataToUpdate.status = status;

    if (startDate !== undefined) {
      if (!startDate) {
        dataToUpdate.startDate = null;
      } else {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) dataToUpdate.startDate = d;
      }
    }

    if (endDate !== undefined) {
      if (!endDate) {
        dataToUpdate.endDate = null;
      } else {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) dataToUpdate.endDate = d;
      }
    }

    const atualizada = await prisma.TBLCAMPANHA.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json(atualizada);
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return res.status(500).json({ message: "Erro ao atualizar campanha." });
  }
});

/**
 * DELETE /api/campanhas/:id
 * (Opcional) Remove campanha e seus itens
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const existente = await prisma.TBLCAMPANHA.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    await prisma.TBLCAMPANHAITEM.deleteMany({ where: { campanhaId: id } });
    await prisma.TBLCAMPANHA.delete({ where: { id } });

    return res.json({ message: "Campanha removida com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return res.status(500).json({ message: "Erro ao excluir campanha." });
  }
});

/**
 * POST /api/campanhas/:id/itens
 * Cria item de campanha a partir de um ativo (e opcionalmente de um JBPITEM)
 */
router.post("/:id/itens", async (req, res) => {
  try {
    const campanhaId = Number(req.params.id);
    if (Number.isNaN(campanhaId)) {
      return res.status(400).json({ message: "Campanha inválida." });
    }

    const {
      jbpItemId,
      assetId,
      title,
      contentType,
      artDeadline,
      approvalDeadline,
      goLiveDate,
      urlDestino,
      notes,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: "Ativo é obrigatório." });
    }

    const assetIdNumber = Number(assetId);
    if (Number.isNaN(assetIdNumber)) {
      return res.status(400).json({ message: "Ativo inválido." });
    }

    const dataToCreate = {
      campanhaId,
      assetId: assetIdNumber,
      title: title || null,
      contentType: contentType || null,
      urlDestino: urlDestino || null,
      notes: notes || null,
    };

    if (jbpItemId) {
      const jid = Number(jbpItemId);
      if (!Number.isNaN(jid)) dataToCreate.jbpItemId = jid;
    }

    if (artDeadline) {
      const d = new Date(artDeadline);
      if (!isNaN(d.getTime())) dataToCreate.artDeadline = d;
    }

    if (approvalDeadline) {
      const d = new Date(approvalDeadline);
      if (!isNaN(d.getTime())) dataToCreate.approvalDeadline = d;
    }

    if (goLiveDate) {
      const d = new Date(goLiveDate);
      if (!isNaN(d.getTime())) dataToCreate.goLiveDate = d;
    }

    const item = await prisma.TBLCAMPANHAITEM.create({
      data: dataToCreate,
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Erro ao criar item de campanha:", error);
    return res.status(500).json({ message: "Erro ao criar item de campanha." });
  }
});

/**
 * PUT /api/campanhas/itens/:itemId
 * Atualiza um item de campanha
 */
router.put("/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Item inválido." });
    }

    const existente = await prisma.TBLCAMPANHAITEM.findUnique({
      where: { id: itemId },
    });

    if (!existente) {
      return res.status(404).json({ message: "Item de campanha não encontrado." });
    }

    const {
      jbpItemId,
      assetId,
      title,
      contentType,
      artDeadline,
      approvalDeadline,
      goLiveDate,
      urlDestino,
      notes,
    } = req.body;

    const dataToUpdate = {};

    if (jbpItemId !== undefined) {
      if (!jbpItemId) {
        dataToUpdate.jbpItemId = null;
      } else {
        const jid = Number(jbpItemId);
        if (!Number.isNaN(jid)) dataToUpdate.jbpItemId = jid;
      }
    }

    if (assetId !== undefined) {
      const aid = Number(assetId);
      if (!Number.isNaN(aid)) dataToUpdate.assetId = aid;
    }

    if (title !== undefined) dataToUpdate.title = title || null;
    if (contentType !== undefined)
      dataToUpdate.contentType = contentType || null;
    if (urlDestino !== undefined) dataToUpdate.urlDestino = urlDestino || null;
    if (notes !== undefined) dataToUpdate.notes = notes || null;

    if (artDeadline !== undefined) {
      if (!artDeadline) {
        dataToUpdate.artDeadline = null;
      } else {
        const d = new Date(artDeadline);
        if (!isNaN(d.getTime())) dataToUpdate.artDeadline = d;
      }
    }

    if (approvalDeadline !== undefined) {
      if (!approvalDeadline) {
        dataToUpdate.approvalDeadline = null;
      } else {
        const d = new Date(approvalDeadline);
        if (!isNaN(d.getTime())) dataToUpdate.approvalDeadline = d;
      }
    }

    if (goLiveDate !== undefined) {
      if (!goLiveDate) {
        dataToUpdate.goLiveDate = null;
      } else {
        const d = new Date(goLiveDate);
        if (!isNaN(d.getTime())) dataToUpdate.goLiveDate = d;
      }
    }

    const atualizado = await prisma.TBLCAMPANHAITEM.update({
      where: { id: itemId },
      data: dataToUpdate,
    });

    return res.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar item de campanha:", error);
    return res
      .status(500)
      .json({ message: "Erro ao atualizar item de campanha." });
  }
});

/**
 * DELETE /api/campanhas/itens/:itemId
 */
router.delete("/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Item inválido." });
    }

    const existente = await prisma.TBLCAMPANHAITEM.findUnique({
      where: { id: itemId },
    });

    if (!existente) {
      return res
        .status(404)
        .json({ message: "Item de campanha não encontrado." });
    }

    await prisma.TBLCAMPANHAITEM.delete({ where: { id: itemId } });

    return res.json({ message: "Item de campanha removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir item de campanha:", error);
    return res
      .status(500)
      .json({ message: "Erro ao excluir item de campanha." });
  }
});

module.exports = router;
