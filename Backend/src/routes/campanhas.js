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

// GET /api/campanhas/calendar
// Retorna campanhas com peças aprovadas dentro de um período
router.get("/calendar", async (req, res) => {
  try {
    const { start, end, supplierId } = req.query;

    // Período padrão: do 1º dia do mês atual até +60 dias
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0); // fim do mês +2

    const startDate = start ? new Date(start) : defaultStart;
    const endDate = end ? new Date(end) : defaultEnd;

    const where = {
      ...(supplierId ? { supplierId: Number(supplierId) || undefined } : {}),
      itens: {
        some: {
          approvalStatus: "aprovado",
          goLiveDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    };

    const campanhas = await prisma.TBLCAMPANHA.findMany({
      where,
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      include: {
        supplier: true,
        itens: {
          where: {
            approvalStatus: "aprovado",
            goLiveDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            asset: true,
          },
          orderBy: { goLiveDate: "asc" },
        },
      },
    });

    const result = campanhas.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      supplierId: c.supplierId,
      supplierName: c.supplier?.name || null,
      channel: c.channel,
      periodStart: c.startDate,
      periodEnd: c.endDate,
      items: c.itens.map((it) => ({
        id: it.id,
        title: it.title,
        contentType: it.contentType,
        approvalStatus: it.approvalStatus,
        artDeadline: it.artDeadline,
        approvalDeadline: it.approvalDeadline,
        goLiveDate: it.goLiveDate,
        creativeUrl: it.creativeUrl,
        urlDestino: it.urlDestino,
        notes: it.notes,
        assetId: it.assetId,
        assetName: it.asset?.name || null,
        assetChannel: it.asset?.channel || null,
      })),
    }));

    return res.json({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      campanhas: result,
    });
  } catch (error) {
    console.error("Erro ao carregar calendário de campanhas:", error);
    return res
      .status(500)
      .json({ message: "Erro ao carregar calendário de campanhas." });
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
        .json({ message: "Fornecedor e nome da campanha sao obrigatorios." });
    }

    const sid = Number(supplierId);
    if (Number.isNaN(sid)) {
      return res.status(400).json({ message: "Fornecedor invalido." });
    }

    const fornecedor = await prisma.TBLFORN.findUnique({
      where: { id: sid },
      select: { id: true },
    });
    if (!fornecedor) {
      return res.status(400).json({ message: "Fornecedor nao encontrado." });
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
      if (Number.isNaN(jid)) {
        return res.status(400).json({ message: "JBP invalido." });
      }

      const jbp = await prisma.TBLJBP.findUnique({
        where: { id: jid },
        select: { id: true, supplierId: true },
      });
      if (!jbp) {
        return res.status(400).json({ message: "JBP nao encontrado." });
      }
      if (jbp.supplierId !== sid) {
        return res
          .status(400)
          .json({ message: "JBP informado nao pertence ao fornecedor." });
      }

      dataToCreate.jbpId = jid;
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
    let supplierIdToUse = existente.supplierId;

    if (supplierId !== undefined) {
      const sid = Number(supplierId);
      if (Number.isNaN(sid)) {
        return res.status(400).json({ message: "Fornecedor invalido." });
      }

      const fornecedor = await prisma.TBLFORN.findUnique({
        where: { id: sid },
        select: { id: true },
      });
      if (!fornecedor) {
        return res.status(400).json({ message: "Fornecedor nao encontrado." });
      }

      dataToUpdate.supplierId = sid;
      supplierIdToUse = sid;
    }

    if (jbpId !== undefined) {
      if (!jbpId) {
        dataToUpdate.jbpId = null;
      } else {
        const jid = Number(jbpId);
        if (Number.isNaN(jid)) {
          return res.status(400).json({ message: "JBP invalido." });
        }

        const jbp = await prisma.TBLJBP.findUnique({
          where: { id: jid },
          select: { id: true, supplierId: true },
        });
        if (!jbp) {
          return res.status(400).json({ message: "JBP nao encontrado." });
        }
        if (jbp.supplierId !== supplierIdToUse) {
          return res
            .status(400)
            .json({ message: "JBP informado nao pertence ao fornecedor." });
        }

        dataToUpdate.jbpId = jid;
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
      // NOVOS
      creativeUrl,
      approvalStatus,
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
      creativeUrl: creativeUrl || null,
      approvalStatus: approvalStatus || "rascunho",
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
      // NOVOS
      creativeUrl,
      approvalStatus,
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
    if (creativeUrl !== undefined) {
      dataToUpdate.creativeUrl = creativeUrl || null;
    }
    if (approvalStatus !== undefined) {
      dataToUpdate.approvalStatus = approvalStatus;
    }

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
