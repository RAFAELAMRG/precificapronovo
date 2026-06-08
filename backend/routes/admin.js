const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Middleware to restrict access to ADMIN role only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acesso negado. Recurso reservado ao Administrador Master.' });
  }
};

// Apply auth and admin middleware to all routes in this router
router.use(authMiddleware);
router.use(adminOnly);

// @route   GET /api/admin/metrics
// @desc    Get master admin KPI dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({ where: { status: 'ativo' } });
    const blockedCompanies = await prisma.company.count({ where: { status: 'bloqueado' } });
    
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ativo' } });

    // MRR is calculated as: active companies * R$ 19.90 (Plano Pro)
    const PLAN_PRICE = 19.90;
    const mrr = activeCompanies * PLAN_PRICE;
    const monthlyBilling = mrr * 0.95; // Faturamento líquido (subtraindo taxas de gateway simuladas)

    // Calculate signups in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = await prisma.company.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Simulated online users (static randomized value for premium effect)
    const onlineUsers = Math.floor(Math.random() * 5) + 3;

    return res.json({
      success: true,
      metrics: {
        totalClients: totalCompanies - 1, // Exclude the admin itself
        activeClients: Math.max(0, activeCompanies - 1),
        blockedClients: blockedCompanies,
        subscriptionsCount: activeSubscriptions,
        mrr: parseFloat(mrr.toFixed(2)),
        monthlyBilling: parseFloat(monthlyBilling.toFixed(2)),
        newSignups: Math.max(0, newSignups - 1), // Exclude admin
        onlineUsers
      }
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return res.status(500).json({ message: 'Erro ao carregar métricas administrativas.' });
  }
});

// @route   GET /api/admin/clients
// @desc    List all client companies and their details
router.get('/clients', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            created_at: true
          }
        },
        subscription: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Filter out the administrator company from the list to display only clients
    const clientsOnly = companies.filter(c => !c.users.some(u => u.role === 'admin'));

    const clientsFormatted = clientsOnly.map(c => {
      const mainUser = c.users[0] || { nome: 'Sem usuário', email: '-' };
      const sub = c.subscription || { 
        plan: 'pro', 
        status: 'trial', 
        trial_ends_at: new Date(), 
        expires_at: null, 
        manual_release: false,
        asaas_customer_id: null,
        asaas_subscription_id: null
      };
      
      return {
        id: c.id,
        nome: c.nome,
        email: c.email,
        telefone: c.telefone,
        status: c.status,
        created_at: c.created_at,
        plano: c.plano,
        usuario_nome: mainUser.nome,
        usuario_email: mainUser.email,
        status_assinatura: sub.status,
        vencimento: sub.expires_at || sub.trial_ends_at,
        trial_ends_at: sub.trial_ends_at,
        expires_at: sub.expires_at,
        manual_release: sub.manual_release,
        asaas_customer_id: sub.asaas_customer_id,
        asaas_subscription_id: sub.asaas_subscription_id
      };
    });

    return res.json({ success: true, clients: clientsFormatted });
  } catch (error) {
    console.error('Admin fetch clients error:', error);
    return res.status(500).json({ message: 'Erro ao buscar clientes.' });
  }
});

// @route   PUT /api/admin/clients/:id/status
// @desc    Block or activate a client company
router.put('/clients/:id/status', async (req, res) => {
  const { status } = req.body; // 'ativo' or 'bloqueado'
  
  if (!status || (status !== 'ativo' && status !== 'bloqueado')) {
    return res.status(400).json({ message: 'Status inválido. Use "ativo" ou "bloqueado".' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update Company status
      await tx.company.update({
        where: { id: req.params.id },
        data: { status }
      });

      // 2. Sync Subscription status
      const subStatus = status === 'ativo' ? 'active' : 'blocked';
      await tx.subscription.update({
        where: { company_id: req.params.id },
        data: { status: subStatus }
      });
    });

    return res.json({
      success: true,
      message: `Cliente ${status === 'ativo' ? 'ativado' : 'bloqueado'} com sucesso.`
    });
  } catch (error) {
    console.error('Admin update status error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar o status do cliente.' });
  }
});

// @route   PUT /api/admin/clients/:id/plan
// @desc    Change subscription parameters, plan or extend expiration date
router.put('/clients/:id/plan', async (req, res) => {
  const { plan, daysToAdd, manual_release, trial_ends_at, expires_at } = req.body;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Update Company Plan type if provided
      let company = null;
      if (plan) {
        company = await tx.company.update({
          where: { id: req.params.id },
          data: { plano: plan }
        });
      }

      // Update subscription parameters
      const currentSub = await tx.subscription.findUnique({
        where: { company_id: req.params.id }
      });

      if (currentSub) {
        const dataToUpdate = {};
        
        if (manual_release !== undefined) {
          dataToUpdate.manual_release = !!manual_release;
        }
        
        if (trial_ends_at !== undefined) {
          dataToUpdate.trial_ends_at = new Date(trial_ends_at);
        }
        
        if (expires_at !== undefined) {
          dataToUpdate.expires_at = expires_at ? new Date(expires_at) : null;
        }

        if (daysToAdd && !isNaN(parseInt(daysToAdd))) {
          let baseDate = currentSub.expires_at ? new Date(currentSub.expires_at) : new Date();
          baseDate.setDate(baseDate.getDate() + parseInt(daysToAdd));
          dataToUpdate.expires_at = baseDate;
          dataToUpdate.status = 'active';
        }

        if (plan) {
          dataToUpdate.plan = plan;
        }

        await tx.subscription.update({
          where: { id: currentSub.id },
          data: dataToUpdate
        });
      }

      return company || await tx.company.findUnique({ where: { id: req.params.id } });
    });

    return res.json({ success: true, message: 'Faturamento do cliente atualizado com sucesso.', company: updated });
  } catch (error) {
    console.error('Admin update plan error:', error);
    return res.status(500).json({ message: 'Erro ao alterar o faturamento do cliente.' });
  }
});


// @route   POST /api/admin/clients/:id/reset-password
// @desc    Reset password for a client's user
router.post('/clients/:id/reset-password', async (req, res) => {
  const { novaSenha } = req.body;

  if (!novaSenha || novaSenha.length < 4) {
    return res.status(400).json({ message: 'Senha inválida. Forneça uma senha com no mínimo 4 caracteres.' });
  }

  try {
    // Find client main user
    const clientUser = await prisma.user.findFirst({
      where: { company_id: req.params.id }
    });

    if (!clientUser) {
      return res.status(404).json({ message: 'Usuário associado ao cliente não encontrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);

    await prisma.user.update({
      where: { id: clientUser.id },
      data: { senha: hashedPassword }
    });

    return res.json({ success: true, message: `Senha do usuário '${clientUser.nome}' redefinida com sucesso.` });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return res.status(500).json({ message: 'Erro ao redefinir senha do cliente.' });
  }
});

// @route   POST /api/admin/clients
// @desc    Create a new guest client company, user and manual release trial subscription
router.post('/clients', async (req, res) => {
  const { nomeEmpresa, nomeResponsavel, email, senha, diasTeste } = req.body;

  if (!nomeEmpresa || !nomeResponsavel || !email || !senha) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios (nomeEmpresa, nomeResponsavel, email, senha).' });
  }

  const trialDays = parseInt(diasTeste) || 15;

  try {
    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está sendo utilizado no sistema.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          nome: nomeEmpresa,
          email: email.toLowerCase(),
          telefone: '',
          plano: 'pro',
          status: 'ativo'
        }
      });

      // 2. Create User linked to Company
      const user = await tx.user.create({
        data: {
          company_id: company.id,
          nome: nomeResponsavel,
          email: email.toLowerCase(),
          senha: hashedPassword,
          role: 'cliente'
        }
      });

      // 3. Create active subscription with manual release
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + trialDays);

      await tx.subscription.create({
        data: {
          company_id: company.id,
          plan: 'pro',
          status: 'trial',
          trial_ends_at: trialEndsAt,
          expires_at: expiresAt,
          manual_release: true
        }
      });

      // 4. Create welcome notification alert
      await tx.alert.create({
        data: {
          company_id: company.id,
          tipo: 'taxa',
          mensagem: `Seja bem-vindo ao PrecificaPro! Sua conta experimental (Convidado) foi ativada com sucesso por ${trialDays} dias de acesso liberado.`,
          status: 'nao_lido'
        }
      });

      return { company, user };
    });

    return res.status(201).json({
      success: true,
      message: `Empresa '${result.company.nome}' e usuário '${result.user.nome}' criados com sucesso!`,
      client: {
        id: result.company.id,
        nome: result.company.nome,
        usuario_nome: result.user.nome,
        usuario_email: result.user.email
      }
    });

  } catch (error) {
    console.error('Admin create client error:', error);
    return res.status(500).json({ message: 'Erro interno ao criar convidado. Tente novamente mais tarde.' });
  }
});

module.exports = router;
