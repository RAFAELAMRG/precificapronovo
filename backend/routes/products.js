const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const subscriptionMiddleware = require('../middleware/subscription');

const prisma = new PrismaClient();

// Guard all product routes with authentication and subscription billing checks
router.use(authMiddleware);
router.use(subscriptionMiddleware);

const calculateCustoDinamico = (custo_tipo, detalhes_custo, custoPadrao = 0) => {
  if (!custo_tipo || custo_tipo === 'revenda') {
    return parseFloat(custoPadrao) || 0;
  }

  let detalhes = detalhes_custo;
  if (typeof detalhes === 'string') {
    try {
      detalhes = JSON.parse(detalhes);
    } catch (e) {
      return parseFloat(custoPadrao) || 0;
    }
  }

  if (!detalhes) {
    return parseFloat(custoPadrao) || 0;
  }

  if (custo_tipo === 'fabricacao') {
    const insumos = Array.isArray(detalhes.insumos) ? detalhes.insumos : [];
    const somaInsumos = insumos.reduce((acc, item) => {
      const qty = parseFloat(item.quantidade) || 0;
      const c = parseFloat(item.custo) || 0;
      return acc + (qty * c);
    }, 0);
    const maoDeObra = parseFloat(detalhes.mao_de_obra) || 0;
    const custoOperacional = parseFloat(detalhes.custo_operacional) || 0;
    return parseFloat((somaInsumos + maoDeObra + custoOperacional).toFixed(2));
  }

  if (custo_tipo === 'confeccao') {
    const tecidoPreco = parseFloat(detalhes.tecido_preco) || 0;
    const tecidoConsumo = parseFloat(detalhes.tecido_consumo) || 0;
    const tecidoUnidade = detalhes.tecido_unidade || 'm';

    let tecidoCusto = 0;
    if (tecidoUnidade === 'cm') {
      tecidoCusto = tecidoPreco * (tecidoConsumo / 100);
    } else if (tecidoUnidade === 'unid') {
      tecidoCusto = tecidoPreco;
    } else {
      tecidoCusto = tecidoPreco * tecidoConsumo;
    }

    const aviamentos = Array.isArray(detalhes.aviamentos) ? detalhes.aviamentos : [];
    const somaAviamentos = aviamentos.reduce((acc, item) => acc + (parseFloat(item.custo) || 0), 0);

    const servicos = Array.isArray(detalhes.servicos) ? detalhes.servicos : [];
    const somaServicos = servicos.reduce((acc, item) => acc + (parseFloat(item.custo) || 0), 0);

    return parseFloat((tecidoCusto + somaAviamentos + somaServicos).toFixed(2));
  }

  return parseFloat(custoPadrao) || 0;
};

// Helper to calculate product financial values
const runPricingEngine = (productData) => {
  const custoTipo = productData.custo_tipo || 'revenda';
  const detalhesCusto = productData.detalhes_custo;
  const custo = calculateCustoDinamico(custoTipo, detalhesCusto, productData.custo);
  
  const frete = parseFloat(productData.frete) || 0;
  const embalagem = parseFloat(productData.embalagem) || 0;
  const imposto = parseFloat(productData.imposto) || 0; // % (e.g. 6.0)
  const comissao = parseFloat(productData.comissao) || 0; // % (e.g. 18.0)
  const margemDesejada = parseFloat(productData.margem) || 0; // % (e.g. 15.0)
  const precoAtual = parseFloat(productData.preco_atual) || 0;

  const custoTotal = custo + frete + embalagem;
  
  // 1. Calculate Ideal Price
  // Formula: Preco Ideal = Custo Total / (1 - taxas_percent - margem_desejada_percent)
  const taxasPercentFracao = (imposto + comissao) / 100;
  const margemDesejadaFracao = margemDesejada / 100;
  const denominator = 1 - taxasPercentFracao - margemDesejadaFracao;
  
  let precoIdeal = 0;
  if (denominator > 0) {
    precoIdeal = custoTotal / denominator;
  } else {
    // If taxes and margin are >= 100%, price goes to infinity. We use a high fallback or show 0.
    precoIdeal = custoTotal / 0.1; // Defaulting to at least a 10% margin denominator
  }

  // 2. Calculate Lucro on Current Price (preco_atual)
  const impostoValor = precoAtual * (imposto / 100);
  const comissaoValor = precoAtual * (comissao / 100);
  const lucro = precoAtual - (custoTotal + impostoValor + comissaoValor);

  // 3. Calculate Margin Obtida
  const margemCalculada = precoAtual > 0 ? (lucro / precoAtual) * 100 : -100;

  return {
    custo: parseFloat(custo.toFixed(2)),
    frete,
    embalagem,
    imposto,
    comissao,
    margem: margemDesejada, // Keep desired margin
    preco_atual: precoAtual,
    preco_ideal: parseFloat(precoIdeal.toFixed(2)),
    lucro: parseFloat(lucro.toFixed(2)),
    margem_obtida: parseFloat(margemCalculada.toFixed(1))
  };
};

// Helper to update alerts based on product health
const updateAlertsForProduct = async (tx, product, companyId) => {
  const calculations = runPricingEngine(product);
  
  // Remove existing alerts for this SKU
  await tx.alert.deleteMany({
    where: {
      company_id: companyId,
      mensagem: { contains: `(SKU: ${product.sku})` }
    }
  });

  // Check if warning triggers are met
  if (calculations.lucro < 0) {
    // Critical Alert: Prejuízo
    await tx.alert.create({
      data: {
        company_id: companyId,
        tipo: 'prejuizo',
        mensagem: `O produto '${product.nome}' (SKU: ${product.sku}) está gerando margem negativa (${calculations.margem_obtida}%) no ${product.marketplace.toUpperCase()}. Risco de prejuízo por venda!`,
        status: 'nao_lido'
      }
    });
  } else if (calculations.margem_obtida < 5.0) {
    // Low Margin warning
    await tx.alert.create({
      data: {
        company_id: companyId,
        tipo: 'margem_baixa',
        mensagem: `O produto '${product.nome}' (SKU: ${product.sku}) está com margem muito baixa (${calculations.margem_obtida}%) no ${product.marketplace.toUpperCase()}.`,
        status: 'nao_lido'
      }
    });
  }
};

// @route   GET /api/products
// @desc    Get all company products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { company_id: req.user.company_id },
      include: {
        production_cost: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Inject calculated margin obtained dynamically for convenience
    const productsWithCalculatedMetrics = products.map(p => {
      const metrics = runPricingEngine(p);
      return {
        ...p,
        margem_obtida: metrics.margem_obtida
      };
    });

    return res.json({ success: true, products: productsWithCalculatedMetrics });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      },
      include: {
        production_cost: true
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const metrics = runPricingEngine(product);
    return res.json({
      success: true,
      product: {
        ...product,
        margem_obtida: metrics.margem_obtida
      }
    });
  } catch (error) {
    console.error('Fetch product error:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados do produto.' });
  }
});

// @route   POST /api/products
// @desc    Create a product
router.post('/', authMiddleware, async (req, res) => {
  const { nome, sku, marketplace, custo, frete, embalagem, imposto, comissao, margem, preco_atual, custo_tipo, detalhes_custo, production_cost_id } = req.body;

  const custoTipo = custo_tipo || 'revenda';
  const isCustoRequired = custoTipo === 'revenda' && !production_cost_id;

  if (!nome || !sku || !marketplace || (isCustoRequired && custo === undefined) || frete === undefined || preco_atual === undefined) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    let finalCusto = custo;
    let finalCustoTipo = custoTipo;
    let finalDetalhesCusto = detalhes_custo;

    if (production_cost_id) {
      const costSheet = await prisma.productionCost.findFirst({
        where: {
          id: production_cost_id,
          company_id: req.user.company_id
        }
      });
      if (!costSheet) {
        return res.status(400).json({ message: 'Ficha de custo associada não encontrada.' });
      }
      finalCusto = costSheet.custo_total;
      finalCustoTipo = costSheet.custo_tipo;
      finalDetalhesCusto = null; // Decoupled
    }

    const calcPayload = {
      ...req.body,
      custo: finalCusto,
      custo_tipo: finalCustoTipo,
      detalhes_custo: finalDetalhesCusto
    };

    const calc = runPricingEngine(calcPayload);

    const newProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          company_id: req.user.company_id,
          nome,
          sku,
          marketplace,
          custo_tipo: finalCustoTipo,
          detalhes_custo: finalDetalhesCusto ? (typeof finalDetalhesCusto === 'string' ? finalDetalhesCusto : JSON.stringify(finalDetalhesCusto)) : null,
          custo: calc.custo,
          frete: calc.frete,
          embalagem: calc.embalagem,
          imposto: calc.imposto,
          comissao: calc.comissao,
          margem: calc.margem,
          preco_atual: calc.preco_atual,
          preco_ideal: calc.preco_ideal,
          lucro: calc.lucro,
          status: 'ativo',
          production_cost_id: production_cost_id || null
        }
      });

      await updateAlertsForProduct(tx, prod, req.user.company_id);
      return prod;
    });

    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar o produto.' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    // Determine target production cost link
    let targetProductionCostId = existingProduct.production_cost_id;
    if (req.body.production_cost_id !== undefined) {
      targetProductionCostId = req.body.production_cost_id || null;
    }

    let finalCusto = req.body.custo !== undefined ? req.body.custo : existingProduct.custo;
    let finalCustoTipo = req.body.custo_tipo !== undefined ? req.body.custo_tipo : existingProduct.custo_tipo;
    let finalDetalhesCusto = req.body.detalhes_custo !== undefined ? req.body.detalhes_custo : existingProduct.detalhes_custo;

    if (targetProductionCostId) {
      const costSheet = await prisma.productionCost.findFirst({
        where: {
          id: targetProductionCostId,
          company_id: req.user.company_id
        }
      });
      if (!costSheet) {
        return res.status(400).json({ message: 'Ficha de custo associada não encontrada.' });
      }
      finalCusto = costSheet.custo_total;
      finalCustoTipo = costSheet.custo_tipo;
      finalDetalhesCusto = null; // Decoupled
    } else {
      if (req.body.production_cost_id === null) {
        finalCustoTipo = 'revenda';
      }
    }

    const mergedData = {
      ...existingProduct,
      ...req.body,
      custo: finalCusto,
      custo_tipo: finalCustoTipo,
      detalhes_custo: finalDetalhesCusto
    };

    const calc = runPricingEngine(mergedData);

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id: req.params.id },
        data: {
          nome: req.body.nome || existingProduct.nome,
          sku: req.body.sku || existingProduct.sku,
          marketplace: req.body.marketplace || existingProduct.marketplace,
          custo_tipo: finalCustoTipo,
          detalhes_custo: finalDetalhesCusto !== undefined
            ? (finalDetalhesCusto ? (typeof finalDetalhesCusto === 'string' ? finalDetalhesCusto : JSON.stringify(finalDetalhesCusto)) : null)
            : existingProduct.detalhes_custo,
          custo: calc.custo,
          frete: calc.frete,
          embalagem: calc.embalagem,
          imposto: calc.imposto,
          comissao: calc.comissao,
          margem: calc.margem,
          preco_atual: calc.preco_atual,
          preco_ideal: calc.preco_ideal,
          lucro: calc.lucro,
          status: req.body.status || existingProduct.status,
          production_cost_id: targetProductionCostId
        }
      });

      await updateAlertsForProduct(tx, prod, req.user.company_id);

      if (calc.preco_atual !== existingProduct.preco_atual) {
        await tx.pricingHistory.create({
          data: {
            company_id: req.user.company_id,
            product_id: existingProduct.id,
            preco_anterior: existingProduct.preco_atual,
            preco_novo: calc.preco_atual,
            lucro_anterior: existingProduct.lucro,
            lucro_novo: calc.lucro
          }
        });
      }

      return prod;
    });

    return res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Erro ao editar o produto.' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated alerts first
      await tx.alert.deleteMany({
        where: {
          company_id: req.user.company_id,
          mensagem: { contains: `(SKU: ${existingProduct.sku})` }
        }
      });

      // 2. Delete product
      await tx.product.delete({
        where: { id: req.params.id }
      });
    });

    return res.json({ success: true, message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Erro ao remover o produto.' });
  }
});

// @route   POST /api/products/sync-integration
// @desc    Simulate pulling products from channels (e.g. Shopee / ML)
router.post('/sync-integration', authMiddleware, async (req, res) => {
  const { channel } = req.body; // e.g. "shopee", "mercado_livre"
  
  if (!channel) {
    return res.status(400).json({ message: 'Canal de integração não especificado.' });
  }

  // Pre-configured mocks
  const mockIntegrations = {
    shopee: [
      { nome: "Fone Bluetooth JBL Tune 510", sku: "JBL-T510-MOCK", custo: 130.0, frete: 15.0, embalagem: 4.0, imposto: 6.0, comissao: 20.0, margem: 15.0, preco_atual: 155.0 } // Prejuízo
    ],
    mercado_livre: [
      { nome: "Caixa de Som Inteligente Alexa Echo Dot", sku: "ALX-ECHO-MOCK", custo: 180.0, frete: 25.0, embalagem: 6.0, imposto: 8.0, comissao: 12.0, margem: 20.0, preco_atual: 220.0 } // Prejuízo
    ],
    bling: [
      { nome: "Headset Gamer Pro 7.1", sku: "HS-PRO-Bling", custo: 150.0, frete: 25.0, embalagem: 5.0, imposto: 6.0, comissao: 15.0, margem: 18.0, preco_atual: 240.0 },
      { nome: "Mini Projetor Portátil LED Smart", sku: "PRJ-MINI-Bling", custo: 210.0, frete: 30.0, embalagem: 10.0, imposto: 8.0, comissao: 18.0, margem: 15.0, preco_atual: 290.0 },
      {
        nome: "Camiseta Algodão Orgânico Premium",
        sku: "TSHIRT-ORG-Bling",
        custo_tipo: "confeccao",
        detalhes_custo: {
          tecido_preco: 35.0,
          tecido_consumo: 0.6,
          aviamentos: [{ nome: "Etiqueta", custo: 1.5 }, { nome: "Tag Reciclado", custo: 2.0 }],
          servicos: [{ nome: "Costura Oficina", custo: 8.0 }, { nome: "Corte", custo: 2.5 }]
        },
        frete: 12.0,
        embalagem: 3.5,
        imposto: 6.0,
        comissao: 16.0,
        margem: 22.0,
        preco_atual: 89.90
      }
    ]
  };

  const imports = mockIntegrations[channel.toLowerCase()] || [];
  if (imports.length === 0) {
    return res.json({ success: true, count: 0, message: 'Nenhum produto pendente de sincronização.' });
  }

  try {
    let syncedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of imports) {
        // Avoid importing if the SKU already exists for this channel
        const exists = await tx.product.findFirst({
          where: {
            company_id: req.user.company_id,
            sku: item.sku,
            marketplace: channel.toLowerCase()
          }
        });

        if (!exists) {
          const calc = runPricingEngine(item);
          const newProd = await tx.product.create({
            data: {
              company_id: req.user.company_id,
              nome: item.nome,
              sku: item.sku,
              marketplace: channel.toLowerCase(),
              custo_tipo: item.custo_tipo || 'revenda',
              detalhes_custo: item.detalhes_custo ? (typeof item.detalhes_custo === 'string' ? item.detalhes_custo : JSON.stringify(item.detalhes_custo)) : null,
              custo: calc.custo,
              frete: calc.frete,
              embalagem: calc.embalagem,
              imposto: calc.imposto,
              comissao: calc.comissao,
              margem: calc.margem,
              preco_atual: calc.preco_atual,
              preco_ideal: calc.preco_ideal,
              lucro: calc.lucro,
              status: 'ativo'
            }
          });

          await updateAlertsForProduct(tx, newProd, req.user.company_id);
          syncedCount++;
        }
      }
    });

    return res.json({
      success: true,
      count: syncedCount,
      message: `${syncedCount} anúncios sincronizados com sucesso do canal ${channel.toUpperCase()}.`
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar anúncios.' });
  }
});

// @route   PUT /api/products/sync-price-correction/:id
// @desc    Update and push corrected pricing to the integration channel
router.put('/sync-price-correction/:id', authMiddleware, async (req, res) => {
  const { newPrice } = req.body;

  if (newPrice === undefined || isNaN(parseFloat(newPrice))) {
    return res.status(400).json({ message: 'Preço de correção inválido.' });
  }

  try {
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        company_id: req.user.company_id
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const payload = {
      ...existing,
      preco_atual: parseFloat(newPrice)
    };

    const calc = runPricingEngine(payload);

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id: req.params.id },
        data: {
          preco_atual: calc.preco_atual,
          preco_ideal: calc.preco_ideal,
          lucro: calc.lucro
        }
      });

      await updateAlertsForProduct(tx, prod, req.user.company_id);

      if (calc.preco_atual !== existing.preco_atual) {
        await tx.pricingHistory.create({
          data: {
            company_id: req.user.company_id,
            product_id: existing.id,
            preco_anterior: existing.preco_atual,
            preco_novo: calc.preco_atual,
            lucro_anterior: existing.lucro,
            lucro_novo: calc.lucro
          }
        });
      }

      return prod;
    });

    return res.json({
      success: true,
      product: updated,
      message: `Preço atualizado para R$ ${calc.preco_atual.toFixed(2)} e sincronizado com o marketplace.`
    });

  } catch (error) {
    console.error('Price sync correction error:', error);
    return res.status(500).json({ message: 'Erro ao enviar correção de preço.' });
  }
});

module.exports = router;
module.exports.runPricingEngine = runPricingEngine; // Export logic for reports/dashboard
module.exports.updateAlertsForProduct = updateAlertsForProduct;
module.exports.calculateCustoDinamico = calculateCustoDinamico;
