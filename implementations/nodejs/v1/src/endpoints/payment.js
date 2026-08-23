'use strict';

/**
 * POST /v1/receipt/sales — register a payment receipt against a previously
 * registered invoice.
 *
 * @param {import('../eirmsClient').EirmsClient} client
 * @param {object} payload
 * @returns {Promise<{raw: object, data: object}>}
 */
async function registerReceipt(client, payload) {
  const response = await client.post('/v1/receipt/sales', payload);
  const data = (response.body && response.body.data) || response.body || response.data || {};
  return { data, raw: response };
}

module.exports = { registerReceipt };
