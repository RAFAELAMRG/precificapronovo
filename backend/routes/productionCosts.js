const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const subscriptionMiddleware = require('../middleware/subscription');

const prisma = new PrismaClient();

// Import pricing logic and helpers from products route
const {
  calculateCustoDinamico,
  runPricingEngine,
  updateAlertsForProduct
} = require('./products');

// Guard all production cost routes with authentication and subscription checks
router.use(authMiddleware);
router.use(subscriptionMiddleware);

// Helper to recalculate and update all products linked to a production cost sheet
const syncProductsWithCostSheet = async (tx, productionCost, companyId) => {
  const linkedProducts = await tx.product.findMany({
    where: {
      production_cost_id: productionCost.id,
      company_id: companyId
    }
  });

  for (const product of linkedProducts) {
    const updatedProductPayload = {
      ...product,
      custo: productionCost.custo_total,
      custo_tipo: productionCost.custo_tipo
    };

    const metrics = runPricingEngine(updatedProductPayload);

    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: {
        custo: metrics.custo,
        custo_tipo: productionCost.custo_tipo,
        preco_ideal: metrics.preco_ideal,
        lucro: metrics.lucro
      }
    });

    // Recalculate alerts
    await updateAlertsForProduct(tx, updatedProduct, companyId);
  }
};

// @route   GET /api/production-costs
// @desc    Get all production cost sheets for the company
router.get('/', async (req, res) => {
  try {
    const costs = await prisma.productionCost.findMany({
      where: { company_id: req.user.company_id },
      orderBy: { created_at: 'desc' }
    });

    return res.json({ success: true, productionCosts: costs });
  } catch (error) {
    console.error('Fetch production costs error:', error);
    return res.status(500).json({ message: 'Erro ao carregar fichas de custo.' });
  }
});

// @route   GET /api/production-costs/:id
// @desc    Get a single production cost sheet by ID
router.get('/:id', async (req, res) => {
  try {
    const cost = await prisma.productionCost.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!cost) {
      return res.status(404).json({ message: 'Ficha de custo não encontrada.' });
    }

    return res.json({ success: true, productionCost: cost });
  } catch (error) {
    console.error('Fetch production cost detail error:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados da ficha de custo.' });
  }
});

// @route   POST /api/production-costs
// @desc    Create a new production cost sheet
router.post('/', async (req, res) => {
  const { sku, nome, custo_tipo, detalhes_custo } = req.body;

  if (!sku || !nome || !custo_tipo || !detalhes_custo) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  if (custo_tipo !== 'fabricacao' && custo_tipo !== 'confeccao') {
    return res.status(400).json({ message: 'Tipo de custo inválido.' });
  }

  try {
    // Check if SKU is unique for this company
    const existing = await prisma.productionCost.findFirst({
      where: {
        company_id: req.user.company_id,
        sku: sku.trim()
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Já existe uma ficha de custo cadastrada para este SKU.' });
    }

    const calculatedCusto = calculateCustoDinamico(custo_tipo, detalhes_custo, 0);

    const newCostSheet = await prisma.$transaction(async (tx) => {
      const sheet = await tx.productionCost.create({
        data: {
          company_id: req.user.company_id,
          sku: sku.trim(),
          nome: nome.trim(),
          custo_tipo,
          detalhes_custo: typeof detalhes_custo === 'string' ? detalhes_custo : JSON.stringify(detalhes_custo),
          custo_total: calculatedCusto
        }
      });

      // Automatically link any existing products with the same SKU (if they don't have a cost sheet linked yet)
      const matchingProducts = await tx.product.findMany({
        where: {
          company_id: req.user.company_id,
          sku: sku.trim(),
          production_cost_id: null
        }
      });

      for (const product of matchingProducts) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            production_cost_id: sheet.id,
            custo_tipo: custo_tipo
          }
        });
      }

      // Sync linked products
      await syncProductsWithCostSheet(tx, sheet, req.user.company_id);

      return sheet;
    });

    return res.status(201).json({ success: true, productionCost: newCostSheet });
  } catch (error) {
    console.error('Create production cost sheet error:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar a ficha de custo.' });
  }
});

// @route   PUT /api/production-costs/:id
// @desc    Update a production cost sheet
router.put('/:id', async (req, res) => {
  const { sku, nome, custo_tipo, detalhes_custo } = req.body;

  try {
    const existing = await prisma.productionCost.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Ficha de custo não encontrada.' });
    }

    const targetSku = sku ? sku.trim() : existing.sku;

    // Check SKU uniqueness if changed
    if (sku && sku.trim() !== existing.sku) {
      const skuConflict = await prisma.productionCost.findFirst({
        where: {
          company_id: req.user.company_id,
          sku: targetSku,
          id: { not: req.params.id }
        }
      });

      if (skuConflict) {
        return res.status(400).json({ message: 'Já existe uma ficha de custo cadastrada para o novo SKU.' });
      }
    }

    const targetCustoTipo = custo_tipo || existing.custo_tipo;
    const targetDetalhes = detalhes_custo !== undefined ? detalhes_custo : JSON.parse(existing.detalhes_custo);

    const calculatedCusto = calculateCustoDinamico(targetCustoTipo, targetDetalhes, 0);

    const updatedCostSheet = await prisma.$transaction(async (tx) => {
      const sheet = await tx.productionCost.update({
        where: { id: req.params.id },
        data: {
          sku: targetSku,
          nome: nome ? nome.trim() : existing.nome,
          custo_tipo: targetCustoTipo,
          detalhes_custo: typeof targetDetalhes === 'string' ? targetDetalhes : JSON.stringify(targetDetalhes),
          custo_total: calculatedCusto
        }
      });

      // Update all linked products' custos and recalculate metrics
      await syncProductsWithCostSheet(tx, sheet, req.user.company_id);

      return sheet;
    });

    return res.json({ success: true, productionCost: updatedCostSheet });
  } catch (error) {
    console.error('Update production cost sheet error:', error);
    return res.status(500).json({ message: 'Erro ao editar a ficha de custo.' });
  }
});

// @route   DELETE /api/production-costs/:id
// @desc    Delete a production cost sheet
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.productionCost.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Ficha de custo não encontrada.' });
    }

    await prisma.$transaction(async (tx) => {
      // Find products that are linked to this cost sheet
      const linkedProducts = await tx.product.findMany({
        where: {
          production_cost_id: req.params.id,
          company_id: req.user.company_id
        }
      });

      // For all linked products, before removing the sheet, they will be set to 'revenda' cost type
      // but keep their calculated cost (custo) as a fallback manual price.
      for (const product of linkedProducts) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            production_cost_id: null,
            custo_tipo: 'revenda' // revert back to revenda
          }
        });
      }

      // Delete the production cost sheet
      await tx.productionCost.delete({
        where: { id: req.params.id }
      });
    });

    return res.json({ success: true, message: 'Ficha de custo removida com sucesso.' });
  } catch (error) {
    console.error('Delete production cost sheet error:', error);
    return res.status(500).json({ message: 'Erro ao deletar a ficha de custo.' });
  }
});

module.exports = router;
