const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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

// Dynamic pricing calculation matching our engine
const calculatePricing = (item) => {
  const custo = calculateCustoDinamico(item.custo_tipo, item.detalhes_custo, item.custo);
  const frete = item.frete;
  const embalagem = item.embalagem || 0;
  const imposto = item.imposto || 0;
  const comissao = item.comissao || 0;
  const margemDesejada = item.margem || 0;
  const precoAtual = item.preco_atual;

  const custoTotal = custo + frete + embalagem;
  const taxasPercentFracao = (imposto + comissao) / 100;
  const margemDesejadaFracao = margemDesejada / 100;
  const denominator = 1 - taxasPercentFracao - margemDesejadaFracao;

  let precoIdeal = 0;
  if (denominator > 0) {
    precoIdeal = custoTotal / denominator;
  } else {
    precoIdeal = custoTotal / 0.1;
  }

  const impostoValor = precoAtual * (imposto / 100);
  const comissaoValor = precoAtual * (comissao / 100);
  const lucro = precoAtual - (custoTotal + impostoValor + comissaoValor);
  const margemCalculada = precoAtual > 0 ? (lucro / precoAtual) * 100 : -100;

  return {
    custo,
    preco_ideal: parseFloat(precoIdeal.toFixed(2)),
    lucro: parseFloat(lucro.toFixed(2)),
    margem_obtida: parseFloat(margemCalculada.toFixed(1))
  };
};

async function main() {
  console.log('Starting seed...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin', salt);
  const clientPassword = await bcrypt.hash('cliente', salt);

  // Clean DB
  await prisma.alert.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productionCost.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('Cleaned existing database records.');

  // 1. Create Companies
  // Admin Company
  const adminCompany = await prisma.company.create({
    data: {
      nome: 'Admin Master Inc.',
      email: 'admin@precificacao.com',
      telefone: '11999999999',
      plano: 'master',
      status: 'ativo'
    }
  });

  // Client Companies
  const companyJoao = await prisma.company.create({
    data: {
      nome: 'João Vendedor E-commerce',
      email: 'joao@vendedor.com',
      telefone: '11988888888',
      plano: 'pro',
      status: 'ativo'
    }
  });

  const companyMaria = await prisma.company.create({
    data: {
      nome: 'Maria E-commerce Store',
      email: 'maria@ecom.com',
      telefone: '21977777777',
      plano: 'pro',
      status: 'ativo'
    }
  });

  const companyPedro = await prisma.company.create({
    data: {
      nome: 'Pedro Imports',
      email: 'pedro@import.com',
      telefone: '31966666666',
      plano: 'pro',
      status: 'bloqueado'
    }
  });

  const companyAna = await prisma.company.create({
    data: {
      nome: 'Ana Modas Premium',
      email: 'ana@moda.com',
      telefone: '41955555555',
      plano: 'pro',
      status: 'ativo'
    }
  });

  console.log('Seeded companies.');

  // 2. Create Users
  // Admin Master
  await prisma.user.create({
    data: {
      company_id: adminCompany.id,
      nome: 'Admin Geral',
      email: 'admin@precificacao.com',
      senha: adminPassword,
      role: 'admin'
    }
  });

  // Client Users
  const userJoao = await prisma.user.create({
    data: {
      company_id: companyJoao.id,
      nome: 'João Vendedor',
      email: 'joao@vendedor.com',
      senha: clientPassword,
      role: 'cliente'
    }
  });

  const userMaria = await prisma.user.create({
    data: {
      company_id: companyMaria.id,
      nome: 'Maria E-commerce',
      email: 'maria@ecom.com',
      senha: clientPassword,
      role: 'cliente'
    }
  });

  const userPedro = await prisma.user.create({
    data: {
      company_id: companyPedro.id,
      nome: 'Pedro Imports',
      email: 'pedro@import.com',
      senha: clientPassword,
      role: 'cliente'
    }
  });

  const userAna = await prisma.user.create({
    data: {
      company_id: companyAna.id,
      nome: 'Ana Modas',
      email: 'ana@moda.com',
      senha: clientPassword,
      role: 'cliente'
    }
  });

  console.log('Seeded users.');

  // 3. Create Subscriptions
  const addThirtyDays = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  };

  const trialEndsAtDate = new Date();
  trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 2);

  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 2);

  await prisma.subscription.createMany({
    data: [
      { company_id: companyJoao.id, plan: 'pro', status: 'active', trial_ends_at: trialEndsAtDate, expires_at: addThirtyDays() },
      { company_id: companyMaria.id, plan: 'pro', status: 'active', trial_ends_at: trialEndsAtDate, expires_at: addThirtyDays() },
      { company_id: companyPedro.id, plan: 'pro', status: 'expired', trial_ends_at: trialEndsAtDate, expires_at: expiredDate },
      { company_id: companyAna.id, plan: 'pro', status: 'active', trial_ends_at: trialEndsAtDate, expires_at: addThirtyDays() }
    ]
  });

  console.log('Seeded subscriptions.');

  // 3.5 Seed Production Costs for Joao
  const tableCost = await prisma.productionCost.create({
    data: {
      company_id: companyJoao.id,
      sku: "TAB-IND-01",
      nome: "Mesa de Escritório Industrial - Ficha",
      custo_tipo: "fabricacao",
      detalhes_custo: JSON.stringify({
        insumos: [
          { nome: "Tampo de Madeira Maciça", quantidade: 1, custo: 90.0 },
          { nome: "Pés de Ferro (Par)", quantidade: 1, custo: 45.0 },
          { nome: "Parafusos e Fixadores", quantidade: 10, custo: 0.5 }
        ],
        mao_de_obra: 30.0,
        custo_operacional: 15.0
      }),
      custo_total: 185.00
    }
  });

  const dressCost = await prisma.productionCost.create({
    data: {
      company_id: companyJoao.id,
      sku: "VES-CAN-02",
      nome: "Vestido Midi Canelado Elegance - Ficha",
      custo_tipo: "confeccao",
      detalhes_custo: JSON.stringify({
        tecido_preco: 25.0,
        tecido_consumo: 1.2,
        aviamentos: [
          { nome: "Zíper Invisível", custo: 1.5 },
          { nome: "Linha de Costura", custo: 0.8 },
          { nome: "Etiquetas e Tags", custo: 2.0 }
        ],
        servicos: [
          { nome: "Corte e Modelagem", custo: 4.0 },
          { nome: "Costura (Oficina)", custo: 10.0 },
          { nome: "Acabamento e Passadoria", custo: 2.5 }
        ]
      }),
      custo_total: 50.80
    }
  });

  console.log('Seeded production costs.');

  // 4. Seed Products for Joao (companyJoao)
  const joaoProducts = [
    { nome: "Teclado Mecânico RGB Gamer", sku: "KB-RGB-01", marketplace: "mercado_livre", custo: 120.00, frete: 25.00, embalagem: 5.0, imposto: 6.0, comissao: 12.0, margem: 15.0, preco_atual: 220.00 },
    { nome: "Mouse Wireless Recarregável", sku: "MS-WRL-02", marketplace: "shopee", custo: 35.00, frete: 12.00, embalagem: 3.0, imposto: 6.0, comissao: 20.0, margem: 25.0, preco_atual: 85.00 },
    { nome: "Fone Bluetooth Premium ANC", sku: "HP-ANC-99", marketplace: "amazon", custo: 180.00, frete: 18.00, embalagem: 5.0, imposto: 6.0, comissao: 15.0, margem: 20.0, preco_atual: 230.00 }, // Prejuízo
    { nome: "Carregador Rápido USB-C 20W", sku: "CH-USBC-20", marketplace: "magalu", custo: 15.00, frete: 10.00, embalagem: 2.0, imposto: 6.0, comissao: 16.0, margem: 30.0, preco_atual: 55.00 },
    { nome: "Cabo HDMI 2.1 Ultra HD 2m", sku: "CB-HDMI-21", marketplace: "shein", custo: 18.00, frete: 8.00, embalagem: 2.0, imposto: 6.0, comissao: 14.0, margem: 20.0, preco_atual: 40.00 },
    { nome: "Suporte de Mesa Articulado Monitor", sku: "SP-MON-01", marketplace: "tiktok_shop", custo: 80.00, frete: 22.00, embalagem: 4.0, imposto: 6.0, comissao: 15.0, margem: 25.0, preco_atual: 110.00 }, // Prejuízo
    { nome: "Smartwatch Sport Track GPS", sku: "SW-GPS-05", marketplace: "olist", custo: 290.00, frete: 35.00, embalagem: 8.0, imposto: 6.0, comissao: 21.0, margem: 15.0, preco_atual: 480.00 },
    { nome: "Ring Light de Mesa USB", sku: "RL-USB-06", marketplace: "webcontinental", custo: 25.00, frete: 15.00, embalagem: 3.0, imposto: 6.0, comissao: 16.0, margem: 15.0, preco_atual: 65.00 },
    {
      nome: "Mesa de Escritório Industrial",
      sku: "TAB-IND-01",
      marketplace: "mercado_livre",
      custo_tipo: "fabricacao",
      detalhes_custo: {
        insumos: [
          { nome: "Tampo de Madeira Maciça", quantidade: 1, custo: 90.0 },
          { nome: "Pés de Ferro (Par)", quantidade: 1, custo: 45.0 },
          { nome: "Parafusos e Fixadores", quantidade: 10, custo: 0.5 }
        ],
        mao_de_obra: 30.0,
        custo_operacional: 15.0
      },
      frete: 45.00,
      embalagem: 10.0,
      imposto: 6.0,
      comissao: 12.0,
      margem: 18.0,
      preco_atual: 350.00
    },
    {
      nome: "Vestido Midi Canelado Elegance",
      sku: "VES-CAN-02",
      marketplace: "shopee",
      custo_tipo: "confeccao",
      detalhes_custo: {
        tecido_preco: 25.0,
        tecido_consumo: 1.2,
        aviamentos: [
          { nome: "Zíper Invisível", custo: 1.5 },
          { nome: "Linha de Costura", custo: 0.8 },
          { nome: "Etiquetas e Tags", custo: 2.0 }
        ],
        servicos: [
          { nome: "Corte e Modelagem", custo: 4.0 },
          { nome: "Costura (Oficina)", custo: 10.0 },
          { nome: "Acabamento e Passadoria", custo: 2.5 }
        ]
      },
      frete: 14.00,
      embalagem: 3.0,
      imposto: 6.0,
      comissao: 20.0,
      margem: 25.0,
      preco_atual: 99.90
    }
  ];

  for (const item of joaoProducts) {
    const calc = calculatePricing(item);
    
    let prodCostId = null;
    if (item.sku === 'TAB-IND-01') prodCostId = tableCost.id;
    if (item.sku === 'VES-CAN-02') prodCostId = dressCost.id;

    const prod = await prisma.product.create({
      data: {
        company_id: companyJoao.id,
        nome: item.nome,
        sku: item.sku,
        marketplace: item.marketplace,
        custo_tipo: item.custo_tipo || 'revenda',
        detalhes_custo: item.detalhes_custo ? JSON.stringify(item.detalhes_custo) : null,
        custo: calc.custo,
        frete: item.frete,
        embalagem: item.embalagem,
        imposto: item.imposto,
        comissao: item.comissao,
        margem: item.margem,
        preco_atual: item.preco_atual,
        preco_ideal: calc.preco_ideal,
        lucro: calc.lucro,
        status: 'ativo',
        production_cost_id: prodCostId
      }
    });

    // Create automatic alert based on profit margin
    if (calc.lucro < 0) {
      await prisma.alert.create({
        data: {
          company_id: companyJoao.id,
          tipo: 'prejuizo',
          mensagem: `O produto '${prod.nome}' (SKU: ${prod.sku}) está com margem negativa (${calc.margem_obtida}%) no ${prod.marketplace.toUpperCase()}. Risco de prejuízo por venda!`,
          status: 'nao_lido'
        }
      });
    } else if (calc.margem_obtida < 5.0) {
      await prisma.alert.create({
        data: {
          company_id: companyJoao.id,
          tipo: 'margem_baixa',
          mensagem: `O produto '${prod.nome}' (SKU: ${prod.sku}) está com margem muito baixa (${calc.margem_obtida}%) no ${prod.marketplace.toUpperCase()}.`,
          status: 'nao_lido'
        }
      });
    }
  }

  // 5. Seed Products for Maria (companyMaria)
  const mariaProducts = [
    { nome: "Kit Esponja de Maquiagem Faciais", sku: "KT-ESP-01", marketplace: "shopee", custo: 8.00, frete: 6.00, embalagem: 1.5, imposto: 6.0, comissao: 20.0, margem: 25.0, preco_atual: 25.00 },
    { nome: "Organizador de Acrílico Giratório", sku: "ORG-ACR-02", marketplace: "mercado_livre", custo: 45.00, frete: 18.00, embalagem: 4.0, imposto: 6.0, comissao: 12.0, margem: 18.0, preco_atual: 95.00 }
  ];

  for (const item of mariaProducts) {
    const calc = calculatePricing(item);
    const prod = await prisma.product.create({
      data: {
        company_id: companyMaria.id,
        nome: item.nome,
        sku: item.sku,
        marketplace: item.marketplace,
        custo_tipo: item.custo_tipo || 'revenda',
        detalhes_custo: item.detalhes_custo ? JSON.stringify(item.detalhes_custo) : null,
        custo: calc.custo,
        frete: item.frete,
        embalagem: item.embalagem,
        imposto: item.imposto,
        comissao: item.comissao,
        margem: item.margem,
        preco_atual: item.preco_atual,
        preco_ideal: calc.preco_ideal,
        lucro: calc.lucro,
        status: 'ativo'
      }
    });

    if (calc.lucro < 0) {
      await prisma.alert.create({
        data: {
          company_id: companyMaria.id,
          tipo: 'prejuizo',
          mensagem: `O produto '${prod.nome}' (SKU: ${prod.sku}) está com margem negativa (${calc.margem_obtida}%) no ${prod.marketplace.toUpperCase()}. Risco de prejuízo por venda!`,
          status: 'nao_lido'
        }
      });
    }
  }

  // Welcome Alert for other tenants
  await prisma.alert.create({
    data: {
      company_id: companyAna.id,
      tipo: 'taxa',
      mensagem: 'Assinatura confirmada. Aproveite as ferramentas premium!',
      status: 'nao_lido'
    }
  });

  // Delinquent alert for Pedro
  await prisma.alert.create({
    data: {
      company_id: companyPedro.id,
      tipo: 'taxa',
      mensagem: 'Assinatura pendente. Atualize seus dados de faturamento para evitar bloqueio definitivo.',
      status: 'nao_lido'
    }
  });

  console.log('Seeded products & alerts.');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error running seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
