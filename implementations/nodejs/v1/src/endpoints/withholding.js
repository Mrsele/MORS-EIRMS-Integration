'use strict';

/**
 * POST /v1/receipt/withholding — register a withholding tax receipt.
 *
 * @param {import('../eirmsClient').EirmsClient} client
 * @param {object} payload
 * @returns {Promise<{raw: object, data: object}>}
 */
async function registerReceipt(client, payload) {
  const response = await client.post('/v1/receipt/withholding', payload);
  const data = (response.body && response.body.data) || response.body || response.data || {};
  return { data, raw: response };
}

module.exports = { registerReceipt };
