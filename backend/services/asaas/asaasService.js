const axios = require('axios');

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

// Base headers configured for Asaas API
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY
});

const asaasService = {
  // 1. Create a Customer in Asaas
  async createCustomer(name, email, phone) {
    try {
      console.log(`[Asaas] Creating customer: ${name} (${email})`);
      const response = await axios.post(`${ASAAS_API_URL}/customers`, {
        name,
        email: email.toLowerCase(),
        phone: phone || ''
      }, { headers: getHeaders() });

      return response.data;
    } catch (error) {
      console.error('[Asaas] Create Customer Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas.');
    }
  },

  // 2. Create a Monthly Subscription in Asaas (PIX or Credit Card)
  async createSubscription(customerId, billingType, value, nextDueDate, creditCardInfo = null) {
    try {
      console.log(`[Asaas] Creating subscription for customer ${customerId} using ${billingType}`);
      
      const payload = {
        customer: customerId,
        billingType, // 'PIX' or 'CREDIT_CARD'
        value,
        nextDueDate, // YYYY-MM-DD
        cycle: 'MONTHLY',
        description: 'Assinatura PrecificaPro - Precificação de Marketplaces'
      };

      // Add Credit Card parameters if billing type is credit card
      if (billingType === 'CREDIT_CARD' && creditCardInfo) {
        payload.creditCard = {
          holderName: creditCardInfo.holderName,
          number: creditCardInfo.number,
          expiryMonth: creditCardInfo.expiryMonth,
          expiryYear: creditCardInfo.expiryYear,
          ccv: creditCardInfo.ccv
        };
        // In sandbox we can mock billing details
        payload.creditCardHolderInfo = {
          name: creditCardInfo.holderName,
          email: creditCardInfo.email || 'checkout@precificapro.com',
          cpfCnpj: creditCardInfo.cpfCnpj || '00000000000',
          postalCode: creditCardInfo.postalCode || '01001000', // Default SP
          addressNumber: '100',
          phone: creditCardInfo.phone || '11999999999'
        };
      }

      const response = await axios.post(`${ASAAS_API_URL}/subscriptions`, payload, { headers: getHeaders() });
      return response.data;
    } catch (error) {
      console.error('[Asaas] Create Subscription Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas.');
    }
  },

  // 3. Get Pix QR Code Details for a Payment
  async getPixQrCode(paymentId) {
    try {
      console.log(`[Asaas] Fetching PIX QR Code for payment ${paymentId}`);
      const response = await axios.get(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        headers: getHeaders()
      });
      return response.data; // Returns { success: true, encodedImage (base64), payload (text copy-paste) }
    } catch (error) {
      console.error('[Asaas] Fetch PIX QR Code Error:', error.response?.data || error.message);
      throw new Error('Erro ao gerar QR Code do pagamento PIX.');
    }
  },

  // 4. Cancel active subscription in Asaas
  async cancelSubscription(subscriptionId) {
    try {
      console.log(`[Asaas] Canceling subscription: ${subscriptionId}`);
      const response = await axios.delete(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('[Asaas] Cancel Subscription Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao cancelar assinatura no Asaas.');
    }
  }
};

module.exports = asaasService;
