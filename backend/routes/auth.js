const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'precificapro_secret_token_123456_super_secure';

// Rate Limiter for Authentication routes (Brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 request cycles
  message: { message: 'Muitas tentativas de acesso a partir deste IP. Tente novamente em 15 minutos.' }
});

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      company_id: user.company_id,
      nome: user.nome,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new client company and user
router.post('/register', authLimiter, async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios (nome, email, senha).' });
  }

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

    // Run in Transaction to ensure database integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          nome: `${nome} Empreendimentos`,
          email: email.toLowerCase(),
          telefone: telefone || '',
          plano: 'pro',
          status: 'ativo'
        }
      });

      // 2. Create User linked to Company
      const user = await tx.user.create({
        data: {
          company_id: company.id,
          nome,
          email: email.toLowerCase(),
          senha: hashedPassword,
          role: 'cliente'
        }
      });

      // 3. Create 2-day free trial subscription
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 2); // Exactly 2 days grace period
      
      await tx.subscription.create({
        data: {
          company_id: company.id,
          plan: 'pro',
          status: 'trial',
          trial_ends_at: trialEndsAt,
          manual_release: false
        }
      });

      // 4. Create a welcome alert
      await tx.alert.create({
        data: {
          company_id: company.id,
          tipo: 'taxa',
          mensagem: `Seja bem-vindo ao PrecificaPro! Sua conta experimental (Trial) foi ativada com sucesso por 2 dias. Ative sua assinatura recorrente para liberar acesso ilimitado.`,
          status: 'nao_lido'
        }
      });

      return { company, user };
    });

    const token = generateToken(result.user);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.role,
        company_id: result.user.company_id
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Erro interno ao realizar o cadastro. Tente novamente mais tarde.' });
  }
});

// @route   POST /api/auth/login
// @desc    Log in a user and return token
router.post('/login', authLimiter, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Por favor, informe e-mail e senha.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true }
    });

    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas. E-mail ou senha incorretos.' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas. E-mail ou senha incorretos.' });
    }

    // Check Company status
    if (user.company.status === 'bloqueado') {
      return res.status(403).json({ message: 'Esta conta está suspensa ou bloqueada. Entre em contato com o suporte.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Erro interno no servidor. Tente novamente mais tarde.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        company: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Auth verify error:', error);
    return res.status(500).json({ message: 'Erro interno ao validar a sessão.' });
  }
});

module.exports = router;
