const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscriptionService = {
  // Check if a company has an active session permission (SaaS gating logic)
  async checkAccess(companyId) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { company_id: companyId }
      });

      if (!sub) {
        console.warn(`[Gating] Company ${companyId} has no subscription record.`);
        return { hasAccess: false, status: 'expired', reason: 'Assinatura inexistente.' };
      }

      // Rule 1: Admin Master manual release override
      if (sub.manual_release) {
        return { hasAccess: true, status: sub.status, manual: true };
      }

      const now = new Date();
      const status = sub.status ? sub.status.toLowerCase() : '';

      // Rule 2: Active Trial check
      if (status === 'trial') {
        const isTrialActive = now <= new Date(sub.trial_ends_at);
        return {
          hasAccess: isTrialActive,
          status: 'trial',
          trialEndsAt: sub.trial_ends_at,
          reason: isTrialActive ? null : 'Período experimental encerrado.'
        };
      }

      // Rule 3: Active Paid Subscription check
      if (status === 'active' || status === 'ativo') {
        if (!sub.expires_at) {
          return { hasAccess: false, status: 'expired', reason: 'Vencimento inválido.' };
        }
        const isExpired = now > new Date(sub.expires_at);
        return {
          hasAccess: !isExpired,
          status: 'active',
          expiresAt: sub.expires_at,
          reason: !isExpired ? null : 'Sua assinatura mensal expirou.'
        };
      }

      // Rule 4: Delinquent / Cancelled / Suspended states block access
      return {
        hasAccess: false,
        status: sub.status,
        reason: `Assinatura suspensa. Status: ${sub.status.toUpperCase()}.`
      };

    } catch (error) {
      console.error('[Gating] Check Access Error:', error);
      return { hasAccess: false, status: 'error', reason: 'Erro interno ao validar assinatura.' };
    }
  }
};

module.exports = subscriptionService;
