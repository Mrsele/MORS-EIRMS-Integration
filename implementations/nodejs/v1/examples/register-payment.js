'use strict';

/**
 * Example: register a sales payment receipt with EIRMS, referencing a
 * previously registered invoice's IRN.
 *
 * Run with: npm run example:register-payment
 */

require('dotenv').config();
const { EirmsClient, EirmsConfig } = require('../src');

async function main() {
  const config = EirmsConfig.fromEnv();
  const client = new EirmsClient(config);

  const receiptPayload = {
    Irn: process.env.EXAMPLE_INVOICE_IRN || 'REPLACE_WITH_A_REAL_IRN',
    AmountPaid: 230.0,
    PaymentMethod: 'CASH',
    PaymentDate: new Date().toISOString().slice(0, 19),
  };

  try {
    const { data, raw } = await client.registerPaymentReceipt(receiptPayload);
    console.log('Payment receipt registered:', JSON.stringify(data, null, 2));
    console.log('Full response:', JSON.stringify(raw, null, 2));
  } catch (err) {
    console.error('Receipt registration failed:', err.message);
    if (err.body) console.error('EIRMS response body:', JSON.stringify(err.body, null, 2));
    process.exitCode = 1;
  }
}

main();
