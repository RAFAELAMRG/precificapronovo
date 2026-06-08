const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || 'your_asaas_webhook_security_token';

// @route   POST /api/webhooks/asaas
// @desc    Receive payment and billing callbacks from Asaas
router.post('/asaas', async (req, res) => {
  const tokenHeader = req.headers['asaas-access-token'];
  
  // Security token check (if configured in Asaas Panel and .env)
  if (WEBHOOK_TOKEN && tokenHeader !== WEBHOOK_TOKEN) {
    console.warn('[Webhook] Unauthorized webhook call attempt. Token mismatched.');
    return res.status(401).json({ message: 'Não autorizado. Token de segurança inválido.' });
  }

  const { event, payment, subscription: asaasSub } = req.body;
  
  if (!event) {
    return res.status(400).json({ message: 'Evento não especificado no payload.' });
  }

  console.log(`[Webhook] Asaas Event Received: ${event}`);

  try {
    // 1. PAYMENT_RECEIVED or PAYMENT_CONFIRMED: Activate tenant account!
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const asaasSubId = payment.subscription;
      const asaasCustId = payment.customer;
      
      if (!asaasSubId && !asaasCustId) {
        return res.status(400).json({ message: 'Informações do pagamento ausentes.' });
      }

      // Find the subscription by Asaas IDs
      const tenantSub = await prisma.subscription.findFirst({
        where: {
          OR: [
            { asaas_subscription_id: asaasSubId },
            { asaas_customer_id: asaasCustId }
          ]
        }
      });

      if (!tenantSub) {
        console.error(`[Webhook] Tenant subscription not found for Asaas ID: sub=${asaasSubId}, cust=${asaasCustId}`);
        return res.status(404).json({ message: 'Inquilino não localizado para os IDs fornecidos.' });
      }

      // Compute expiration: dueDate of current cycle + 3 days of grace period
      const paymentDueDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
      const expirationDate = new Date(paymentDueDate);
      expirationDate.setDate(expirationDate.getDate() + 3); // 3 days grace period

      await prisma.$transaction(async (tx) => {
        // Activate Subscription
        await tx.subscription.update({
          where: { id: tenantSub.id },
          data: {
            status: 'active',
            expires_at: expirationDate,
            // If webhook triggered before manual checkout response returns subscription id, link it
            asaas_subscription_id: asaasSubId || tenantSub.asaas_subscription_id,
            asaas_customer_id: asaasCustId || tenantSub.asaas_customer_id
          }
        });

        // Add success alert
        await tx.alert.create({
          data: {
            company_id: tenantSub.company_id,
            tipo: 'taxa',
            mensagem: `Pagamento mensal da sua assinatura Asaas foi confirmado com sucesso. Acesso liberado até ${expirationDate.toLocaleDateString('pt-BR')}. Obrigado!`,
            status: 'nao_lido'
          }
        });
      });

      console.log(`[Webhook] Successfully activated Subscription for company: ${tenantSub.company_id}`);
    }

    // 2. PAYMENT_OVERDUE: Block client account!
    else if (event === 'PAYMENT_OVERDUE') {
      const asaasSubId = payment.subscription;
      const asaasCustId = payment.customer;

      const tenantSub = await prisma.subscription.findFirst({
        where: {
          OR: [
            { asaas_subscription_id: asaasSubId },
            { asaas_customer_id: asaasCustId }
          ]
        }
      });

      if (tenantSub) {
        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: tenantSub.id },
            data: { status: 'expired' } // Gating middleware will block access
          });

          await tx.alert.create({
            data: {
              company_id: tenantSub.company_id,
              tipo: 'prejuizo',
              mensagem: 'Sua assinatura mensal Asaas está atrasada. Efetue o pagamento para reativar seu acesso.',
              status: 'nao_lido'
            }
          });
        });
        console.log(`[Webhook] Blocked account due to overdue invoice: company=${tenantSub.company_id}`);
      }
    }

    // 3. SUBSCRIPTION_CREATED: Update database mapping
    else if (event === 'SUBSCRIPTION_CREATED') {
      const asaasSubId = asaasSub?.id;
      const asaasCustId = asaasSub?.customer;

      // Find company using asaas_customer_id if we synced it, or by matching emails
      const tenantSub = await prisma.subscription.findFirst({
        where: { asaas_customer_id: asaasCustId }
      });

      if (tenantSub && asaasSubId) {
        await prisma.subscription.update({
          where: { id: tenantSub.id },
          data: { asaas_subscription_id: asaasSubId }
        });
        console.log(`[Webhook] Subscription ID linked: ${asaasSubId}`);
      }
    }

    // 4. SUBSCRIPTION_CANCELLED: Set cancelled status
    else if (event === 'SUBSCRIPTION_CANCELLED') {
      const asaasSubId = asaasSub?.id;
      
      const tenantSub = await prisma.subscription.findFirst({
        where: { asaas_subscription_id: asaasSubId }
      });

      if (tenantSub) {
        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: tenantSub.id },
            data: { status: 'cancelled' }
          });

          await tx.alert.create({
            data: {
              company_id: tenantSub.company_id,
              tipo: 'prejuizo',
              mensagem: 'Sua assinatura PrecificaPro foi cancelada no Asaas.',
              status: 'nao_lido'
            }
          });
        });
        console.log(`[Webhook] Subscription cancelled: company=${tenantSub.company_id}`);
      }
    }

    // Return 200 OK to Asaas to confirm reception
    return res.json({ success: true, received: true });

  } catch (error) {
    console.error('[Webhook Error] Error processing webhook event:', error);
    return res.status(500).json({ message: 'Erro interno ao processar webhook.' });
  }
});

module.exports = router;
