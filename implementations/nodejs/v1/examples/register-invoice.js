'use strict';

/**
 * Example: register a sales invoice with EIRMS.
 *
 * Run with: npm run example:register-invoice
 * (after copying .env.example to .env and filling in real credentials)
 */

require('dotenv').config();
const { EirmsClient, EirmsConfig } = require('../src');

async function main() {
  const config = EirmsConfig.fromEnv();
  const client = new EirmsClient(config);

  // Build this from your own invoice data — the connector does not know
  // about invoice lines, tax codes, etc. See docs/API_REFERENCE.md for
  // the full shape and the tax code reference table.
  const invoicePayload = {
    Buyer: {
      City: 'Addis Ababa',
      Email: 'buyer@example.com',
      HouseNumber: '123',
      IdNumber: '',
      IdType: '',
      Tin: '0000012345',
      LegalName: 'Example Buyer PLC',
      Phone: '+251911000000',
      Region: 13,
      Country: '70',
      Zone: '',
      Kebele: '',
      VatNumber: '00000000000000000000',
      Wereda: '',
    },
    Document: {
      DocumentNumber: 1001,
      Date: new Date().toISOString().slice(0, 19).replace('T', 'T'),
      Type: 'INV',
    },
    Items: [
      {
        Nature: 'goods',
        TaxCode: 'VAT15',
        TaxRate: 15.0,
        UnitPrice: 100.0,
        Quantity: 2,
        Discount: 0.0,
        TotalLineAmount: 230.0,
      },
    ],
  };

  try {
    const { irn, raw } = await client.registerInvoice(invoicePayload);
    console.log('Invoice registered. IRN:', irn);
    console.log('Full response:', JSON.stringify(raw, null, 2));
  } catch (err) {
    console.error('Registration failed:', err.message);
    if (err.body) console.error('EIRMS response body:', JSON.stringify(err.body, null, 2));
    process.exitCode = 1;
  }
}

main();
