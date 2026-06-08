const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const subscriptionMiddleware = require('../middleware/subscription');

const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(subscriptionMiddleware);

// @route   GET /api/alerts
// @desc    Get all alerts for the authenticated tenant company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { company_id: req.user.company_id },
      orderBy: { created_at: 'desc' }
    });

    return res.json({ success: true, alerts });
  } catch (error) {
    console.error('Fetch alerts error:', error);
    return res.status(500).json({ message: 'Erro ao carregar os alertas.' });
  }
});

// @route   PUT /api/alerts/read
// @desc    Mark all alerts as read for the company
router.put('/read', authMiddleware, async (req, res) => {
  try {
    await prisma.alert.updateMany({
      where: {
        company_id: req.user.company_id,
        status: 'nao_lido'
      },
      data: {
        status: 'lido'
      }
    });

    return res.json({ success: true, message: 'Todos os alertas marcados como lidos.' });
  } catch (error) {
    console.error('Mark alerts read error:', error);
    return res.status(500).json({ message: 'Erro ao limpar alertas.' });
  }
});

module.exports = router;
