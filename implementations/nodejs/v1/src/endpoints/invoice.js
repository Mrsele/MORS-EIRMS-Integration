'use strict';

/**
 * POST /v1/register — register a sales document (invoice/credit note/debit
 * note) and return its IRN. See docs/API_REFERENCE.md for the payload shape.
 *
 * @param {import('../eirmsClient').EirmsClient} client
 * @param {object} payload - { Buyer, Document, Items }
 * @returns {Promise<{irn: string, raw: object}>}
 */
async function register(client, payload) {
  const response = await client.post('/v1/register', payload);
  const data = (response.body && response.body.data) || response.body || response.data || {};
  return { irn: data.irn || null, raw: response };
}

module.exports = { register };
