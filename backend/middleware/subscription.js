const subscriptionService = require('../services/subscriptions/subscriptionService');

module.exports = async (req, res, next) => {
  // 1. By-pass gating checks for Master Admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  if (!req.user || !req.user.company_id) {
    return res.status(401).json({ message: 'Não autorizado. Identificador da empresa não localizado.' });
  }

  try {
    // 2. Query subscription check rules
    const check = await subscriptionService.checkAccess(req.user.company_id);
    
    if (check.hasAccess) {
      return next(); // Proceed to controller
    }

    // 3. Return 403 Block with billing code
    return res.status(403).json({
      code: 'SUBSCRIPTION_REQUIRED',
      message: check.reason || 'Sua assinatura PrecificaPro expirou ou é inválida.',
      status: check.status,
      trialEndsAt: check.trialEndsAt,
      expiresAt: check.expiresAt
    });

  } catch (error) {
    console.error('[Gating Middleware] Error checking subscription:', error);
    return res.status(500).json({ message: 'Erro ao validar status da assinatura.' });
  }
};
