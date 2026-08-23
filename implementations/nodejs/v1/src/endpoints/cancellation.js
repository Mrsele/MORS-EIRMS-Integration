'use strict';

/**
 * POST /v1/cancel — cancel a previously registered document.
 *
 * @param {import('../eirmsClient').EirmsClient} client
 * @param {object} payload - identifies the document to cancel (e.g. { irn, reason })
 * @returns {Promise<{success: boolean, raw: object}>}
 */
async function cancel(client, payload) {
  const response = await client.post('/v1/cancel', payload);
  const data = (response.body && response.body.data) || response.body || response.data || {};
  return { success: true, data, raw: response };
}

module.exports = { cancel };
