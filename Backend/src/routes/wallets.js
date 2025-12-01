const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { requireAuthUser } = require('../auth/requireAuth');

async function requireAuth(req, res) {
  return requireAuthUser(req, res);
}

/**
 * @swagger
 * /wallets:
 *   get:
 *     summary: Retrieve a supplier's wallet for a specific year.
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the supplier.
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *         description: The year of the wallet.
 *     responses:
 *       200:
 *         description: The wallet for the given supplier and year.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TBLWALLET'
 *       404:
 *         description: Wallet not found.
 *       400:
 *         description: Bad request, missing parameters.
 */
router.get('/', async (req, res) => {
  const { supplierId, year } = req.query;

  if (!supplierId || !year) {
    return res.status(400).json({ message: 'supplierId and year are required parameters.' });
  }

  const supplierIdNumber = parseInt(supplierId, 10);
  const yearNumber = parseInt(year, 10);

  if (isNaN(supplierIdNumber) || isNaN(yearNumber)) {
    return res.status(400).json({ message: 'Invalid supplierId or year.' });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const wallet = await prisma.TBLWALLET.findFirst({
      where: {
        supplierId: supplierIdNumber,
        year: yearNumber,
        status: 'aberto',
      },
    });

    if (!wallet) {
      // Retorna 200 com payload nulo para evitar quebra no cliente
      return res.json({ wallet: null, message: 'Nenhuma carteira ativa para este fornecedor/ano.' });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
