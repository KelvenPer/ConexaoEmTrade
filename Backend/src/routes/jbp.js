const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { requireAuthUser } = require('../auth/requireAuth');
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");
const { approveJbp } = require("../services/jbpService");

async function requireAuth(req, res) {
  return requireAuthUser(req, res);
}

// GET all JBPs
router.get('/', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const jbps = await prisma.TBLJBP.findMany({
      include: {
        supplier: true,
        retail: true,
      },
    });
    res.json(jbps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching JBPs', error: error.message });
  }
});

// GET a single JBP by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const jbp = await prisma.TBLJBP.findUnique({
      where: { id: parseInt(id) },
      include: {
        itens: {
          include: {
            asset: true,
            product: true,
            mix: { include: { product: true } },
          },
        },
        supplier: true,
        retail: true,
        kpiQuery: true,
      },
    });
    if (!jbp) {
      return res.status(404).json({ message: 'JBP not found' });
    }
    res.json(jbp);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching JBP', error: error.message });
  }
});

// CREATE a new JBP
router.post('/', async (req, res) => {
  const { supplierId, retailId, name, year, periodStart, periodEnd, strategy, kpiSummary, totalBudget, status, createdById } = req.body;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const supplierIdNumber = parseInt(supplierId, 10);
    const totalBudgetNumber = totalBudget ? parseFloat(totalBudget) : 0;
    
    // --- INÍCIO DA LÓGICA DA WALLET ---
    const anoJbp = year ? Number(year) : new Date().getFullYear();

    const wallet = await prisma.TBLWALLET.findFirst({
      where: {
        supplierId: supplierIdNumber,
        year: anoJbp,
        status: 'aberto',
      },
    });

    // Validar saldo
    if (wallet && totalBudgetNumber > (wallet.totalBudget - wallet.consumedBudget)) {
      return res.status(400).json({ message: `Orçamento do JBP (R$${totalBudgetNumber.toFixed(2)}) excede o saldo disponível na carteira do fornecedor (R$${(wallet.totalBudget - wallet.consumedBudget).toFixed(2)}).` });
    }
    // --- FIM DA LÓGICA DA WALLET ---

    const dataToCreate = {
      supplierId: supplierIdNumber,
      retailId: retailId ? parseInt(retailId, 10) : undefined,
      name,
      year: year ? parseInt(year, 10) : undefined,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      strategy,
      kpiSummary,
      totalBudget: totalBudgetNumber,
      status,
      createdById: createdById ? parseInt(createdById, 10) : undefined,
      walletId: wallet ? wallet.id : undefined, // Adiciona o walletId
      kpiQueryId: req.body.kpiQueryId ? parseInt(req.body.kpiQueryId, 10) : undefined,
    };

    const newJbp = await prisma.TBLJBP.create({
      data: dataToCreate,
    });
    
    // Se o JBP foi criado com sucesso e tem um orçamento, atualiza o 'consumedBudget' da wallet.
    if (newJbp && wallet && totalBudgetNumber > 0) {
        await prisma.TBLWALLET.update({
            where: { id: wallet.id },
            data: { consumedBudget: { increment: totalBudgetNumber } }
        });
    }

    res.status(201).json(newJbp);
  } catch (error) {
  res.status(500).json({ message: 'Error creating JBP', error: error.message });
  }
});

// APPROVE a JBP with automation
router.post('/:id/approve', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const jbpId = Number(req.params.id);
    if (Number.isNaN(jbpId)) {
      return res.status(400).json({ message: "ID do JBP invalido." });
    }

    const scope = await resolveScope(user);
    const where = applyScopeToWhere({ id: jbpId }, scope, {
      supplierField: "supplierId",
      retailField: "retailId",
    });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este JBP." });
    }

    const existing = await prisma.TBLJBP.findFirst({ where });
    if (!existing) {
      return res.status(404).json({ message: "JBP nao encontrado." });
    }

    const result = await approveJbp({ jbpId, userId: user.id });
    return res.json({
      message: "JBP aprovado e automacoes disparadas com sucesso.",
      jbp: result,
    });
  } catch (error) {
    console.error("Erro ao aprovar JBP:", error);
    return res.status(500).json({ message: "Erro ao aprovar JBP.", error: error.message });
  }
});

// UPDATE a JBP
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const dataToUpdate = { ...req.body };

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const jbpIdNumber = parseInt(id, 10);
    const originalJbp = await prisma.TBLJBP.findUnique({ where: { id: jbpIdNumber } });
    if (!originalJbp) {
        return res.status(404).json({ message: "JBP n?o encontrado." });
    }

    const supplierIdNumber = dataToUpdate.supplierId
      ? parseInt(dataToUpdate.supplierId, 10)
      : originalJbp.supplierId;
    const totalBudgetNumber =
      dataToUpdate.totalBudget !== undefined && dataToUpdate.totalBudget !== null && dataToUpdate.totalBudget !== ""
        ? parseFloat(dataToUpdate.totalBudget)
        : originalJbp.totalBudget || 0;
    const budgetDifference = totalBudgetNumber - (originalJbp.totalBudget || 0);

    // --- IN?CIO DA L?GICA DA WALLET ---
    const anoJbp = dataToUpdate.year
      ? Number(dataToUpdate.year)
      : originalJbp.year || new Date().getFullYear();
    const wallet = await prisma.TBLWALLET.findFirst({
      where: {
        supplierId: supplierIdNumber,
        year: anoJbp,
        status: 'aberto',
      },
    });

    // Validar saldo
    if (wallet && budgetDifference > (wallet.totalBudget - wallet.consumedBudget)) {
      return res.status(400).json({ message: `O ajuste no or?amento (R$${budgetDifference.toFixed(2)}) excede o saldo dispon?vel na carteira (R$${(wallet.totalBudget - wallet.consumedBudget).toFixed(2)}).` });
    }
    // --- FIM DA L?GICA DA WALLET ---

    dataToUpdate.walletId = wallet ? wallet.id : null; // Atualiza ou remove o walletId
    dataToUpdate.totalBudget = totalBudgetNumber;
    if (dataToUpdate.supplierId) dataToUpdate.supplierId = supplierIdNumber;
    if (dataToUpdate.year) dataToUpdate.year = anoJbp;
    if (dataToUpdate.periodStart) dataToUpdate.periodStart = new Date(dataToUpdate.periodStart);
    if (dataToUpdate.periodEnd) dataToUpdate.periodEnd = new Date(dataToUpdate.periodEnd);
    if (dataToUpdate.kpiQueryId !== undefined) {
      if (dataToUpdate.kpiQueryId === null || dataToUpdate.kpiQueryId === "" || dataToUpdate.kpiQueryId === "null") {
        dataToUpdate.kpiQueryId = null;
      } else {
        const parsedKpiQueryId = Number(dataToUpdate.kpiQueryId);
        if (Number.isNaN(parsedKpiQueryId)) {
          return res.status(400).json({ message: "kpiQueryId invalido." });
        }
        dataToUpdate.kpiQueryId = parsedKpiQueryId;
      }
    }

    const updatedJbp = await prisma.TBLJBP.update({
      where: { id: jbpIdNumber },
      data: dataToUpdate,
    });
    
    // Atualiza o 'consumedBudget' da wallet com a diferen?a
    if (wallet && budgetDifference !== 0) {
        await prisma.TBLWALLET.update({
            where: { id: wallet.id },
            data: { consumedBudget: { increment: budgetDifference } }
        });
    }

    res.json(updatedJbp);
  } catch (error) {
    res.status(500).json({ message: 'Error updating JBP', error: error.message });
  }
});
// DELETE a JBP
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await requireAuth(req, res);
        if (!user) return;

        const jbpIdNumber = parseInt(id, 10);
        const jbpToDelete = await prisma.TBLJBP.findUnique({ where: { id: jbpIdNumber }});

        if (!jbpToDelete) {
            return res.status(404).json({ message: "JBP não encontrado." });
        }

        const budgetToReturn = jbpToDelete.totalBudget || 0;
        
        // Deleta o JBP (as deleções em cascata devem cuidar dos itens)
        await prisma.TBLJBP.delete({
            where: { id: jbpIdNumber },
        });

        // Se o JBP tinha uma wallet e um orçamento, devolve o valor para a carteira
        if (jbpToDelete.walletId && budgetToReturn > 0) {
            await prisma.TBLWALLET.update({
                where: { id: jbpToDelete.walletId },
                data: { consumedBudget: { decrement: budgetToReturn } }
            });
        }

        res.status(204).send();
    } catch (error) {
        // Tratar erro de violação de chave estrangeira, caso a cascata não esteja configurada
        if (error.code === 'P2003') {
            return res.status(409).json({ message: 'Não é possível deletar o JBP pois ele possui itens ou outros registros associados.' });
        }
        res.status(500).json({ message: 'Error deleting JBP', error: error.message });
    }
});

// CREATE an item for a JBP
router.post('/:id/itens', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const jbpId = Number(id);
    if (Number.isNaN(jbpId)) {
      return res.status(400).json({ message: 'ID do JBP invalido.' });
    }

    const {
      assetId,
      productId,
      initiativeType,
      description,
      periodStart,
      periodEnd,
      unit,
      quantity,
      negotiatedUnitPrice,
      totalValue,
      notes,
      mix = [],
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: 'Ativo � obrigat�rio.' });
    }

    const dataToCreate = {
      jbpId,
      assetId: Number(assetId),
      productId: productId ? Number(productId) : null,
      initiativeType: initiativeType || 'JBP',
      description: description || null,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      unit: unit || null,
      quantity: quantity !== undefined && quantity !== '' ? Number(quantity) : null,
      negotiatedUnitPrice:
        negotiatedUnitPrice !== undefined && negotiatedUnitPrice !== ''
          ? Number(negotiatedUnitPrice)
          : null,
      totalValue: totalValue !== undefined && totalValue !== '' ? Number(totalValue) : null,
      notes: notes || null,
    };

    const created = await prisma.TBLJBPITEM.create({
      data: dataToCreate,
    });

    if (Array.isArray(mix) && mix.length > 0) {
      const mixData = mix.map((m) => ({
        jbpItemId: created.id,
        productId: m.productId || m.id || null,
        brandCriteria: m.type === 'BRAND' ? m.label || m.brandCriteria || null : m.brandCriteria || null,
        categoryCriteria: m.categoryCriteria || null,
      }));
      if (mixData.length > 0) {
        await prisma.TBLJBPITEM_MIX.createMany({ data: mixData });
      }
    }

    const createdWithMix = await prisma.TBLJBPITEM.findUnique({
      where: { id: created.id },
      include: { asset: true, product: true, mix: { include: { product: true } } },
    });

    res.status(201).json(createdWithMix);
  } catch (error) {
    console.error('Erro ao criar item de JBP:', error);
    res.status(500).json({ message: 'Error creating JBP item', error: error.message });
  }
});

// UPDATE an item
router.put('/itens/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const idNumber = Number(itemId);
    if (Number.isNaN(idNumber)) {
      return res.status(400).json({ message: 'ID do item invalido.' });
    }

    const existing = await prisma.TBLJBPITEM.findUnique({ where: { id: idNumber } });
    if (!existing) {
      return res.status(404).json({ message: 'Item de JBP n�o encontrado.' });
    }

    const {
      assetId,
      productId,
      initiativeType,
      description,
      periodStart,
      periodEnd,
      unit,
      quantity,
      negotiatedUnitPrice,
      totalValue,
      notes,
      mix = [],
    } = req.body;

    const dataToUpdate = {};

    if (assetId !== undefined) {
      const aid = Number(assetId);
      if (Number.isNaN(aid)) {
        return res.status(400).json({ message: 'Ativo invalido.' });
      }
      dataToUpdate.assetId = aid;
    }
    if (productId !== undefined) {
      dataToUpdate.productId = productId ? Number(productId) : null;
    }
    if (initiativeType !== undefined) dataToUpdate.initiativeType = initiativeType || 'JBP';
    if (description !== undefined) dataToUpdate.description = description || null;
    if (periodStart !== undefined) {
      dataToUpdate.periodStart = periodStart ? new Date(periodStart) : null;
    }
    if (periodEnd !== undefined) {
      dataToUpdate.periodEnd = periodEnd ? new Date(periodEnd) : null;
    }
    if (unit !== undefined) dataToUpdate.unit = unit || null;
    if (quantity !== undefined) {
      dataToUpdate.quantity =
        quantity !== '' && quantity !== null && quantity !== undefined ? Number(quantity) : null;
    }
    if (negotiatedUnitPrice !== undefined) {
      dataToUpdate.negotiatedUnitPrice =
        negotiatedUnitPrice !== '' && negotiatedUnitPrice !== null && negotiatedUnitPrice !== undefined
          ? Number(negotiatedUnitPrice)
          : null;
    }
    if (totalValue !== undefined) {
      dataToUpdate.totalValue =
        totalValue !== '' && totalValue !== null && totalValue !== undefined ? Number(totalValue) : null;
    }
    if (notes !== undefined) dataToUpdate.notes = notes || null;

    const updated = await prisma.TBLJBPITEM.update({
      where: { id: idNumber },
      data: dataToUpdate,
    });

    await prisma.TBLJBPITEM_MIX.deleteMany({ where: { jbpItemId: idNumber } });
    if (Array.isArray(mix) && mix.length > 0) {
      const mixData = mix.map((m) => ({
        jbpItemId: idNumber,
        productId: m.productId || m.id || null,
        brandCriteria: m.type === 'BRAND' ? m.label || m.brandCriteria || null : m.brandCriteria || null,
        categoryCriteria: m.categoryCriteria || null,
      }));
      if (mixData.length > 0) {
        await prisma.TBLJBPITEM_MIX.createMany({ data: mixData });
      }
    }

    const updatedWithMix = await prisma.TBLJBPITEM.findUnique({
      where: { id: idNumber },
      include: { asset: true, product: true, mix: { include: { product: true } } },
    });

    res.json(updatedWithMix);
  } catch (error) {
    console.error('Erro ao atualizar item de JBP:', error);
    res.status(500).json({ message: 'Error updating JBP item', error: error.message });
  }
});

// DELETE an item
router.delete('/itens/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const idNumber = Number(itemId);
    if (Number.isNaN(idNumber)) {
      return res.status(400).json({ message: 'ID do item invalido.' });
    }

    const existing = await prisma.TBLJBPITEM.findUnique({ where: { id: idNumber } });
    if (!existing) {
      return res.status(404).json({ message: 'Item de JBP n�o encontrado.' });
    }

    await prisma.TBLJBPITEM.delete({ where: { id: idNumber } });
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir item de JBP:', error);
    res.status(500).json({ message: 'Error deleting JBP item', error: error.message });
  }
});


module.exports = router;
