'use strict';

const { AuthClient } = require('./authClient');
const { InMemoryTokenStore } = require('./tokenStore');
const { buildSignedEnvelope } = require('./crypto/sign');
const { encryptPayload } = require('./crypto/encrypt');
const { httpPost, EirmsApiError } = require('./httpPost');

const invoiceEndpoint = require('./endpoints/invoice');
const cancellationEndpoint = require('./endpoints/cancellation');
const paymentEndpoint = require('./endpoints/payment');
const withholdingEndpoint = require('./endpoints/withholding');

/**
 * The main entry point for talking to EIRMS. One instance per credential
 * set (per branch, if you're a multi-branch taxpayer).
 *
 * @example
 * const { EirmsClient, EirmsConfig } = require('@eirms-connector/nodejs');
 * const client = new EirmsClient(EirmsConfig.fromEnv());
 * const { irn } = await client.registerInvoice(invoicePayload);
 */
class EirmsClient {
  /**
   * @param {import('./config').EirmsConfig} config
   * @param {object} [opts]
   * @param {{get: Function, set: Function, clear: Function}} [opts.tokenStore] - defaults to in-memory
   */
  constructor(config, opts = {}) {
    this.config = config;
    this.tokenStore = opts.tokenStore || new InMemoryTokenStore();
    this.auth = new AuthClient(config, this.tokenStore);
  }

  /**
   * Low-level: send a signed (and, if enabled, encrypted) business request
   * to a given EIRMS path. All endpoint helpers below are thin wrappers
   * around this. Exposed publicly so new/unlisted endpoints can be called
   * without waiting on a connector update.
   *
   * @param {string} path - e.g. "/v1/register"
   * @param {object} payload - plaintext business payload
   * @returns {Promise<object>} parsed JSON response
   */
  async post(path, payload) {
    return this._postWithRetry(path, payload, /* retriedOn401 */ false);
  }

  async _postWithRetry(path, payload, retriedOn401) {
    const accessToken = await this.auth.getAccessToken();

    let requestBody = payload;
    if (this.config.encryptPayloads) {
      const encryptionKey = await this.auth.getEncryptionKey();
      requestBody = encryptPayload(payload, encryptionKey);
    }

    const envelope = buildSignedEnvelope(
      requestBody,
      this.config.privateKeyPem,
      this.config.certificatePem
    );

    try {
      return await httpPost(`${this.config.baseUrl}${path}`, envelope, {
        Authorization: `Bearer ${accessToken}`,
      });
    } catch (err) {
      if (err instanceof EirmsApiError && err.status === 401 && !retriedOn401) {
        await this.auth.invalidate();
        return this._postWithRetry(path, payload, /* retriedOn401 */ true);
      }
      throw err;
    }
  }

  // ── Business endpoints ──────────────────────────────────────────────
  // Payload shape for each is documented in docs/API_REFERENCE.md. This
  // client deliberately does not validate or transform business fields —
  // build the payload in your application layer and pass it straight in.

  /** POST /v1/register — register an invoice/credit note/debit note. */
  registerInvoice(payload) {
    return invoiceEndpoint.register(this, payload);
  }

  /** POST /v1/cancel — cancel a previously registered document. */
  cancelInvoice(payload) {
    return cancellationEndpoint.cancel(this, payload);
  }

  /** POST /v1/receipt/sales — register a payment receipt. */
  registerPaymentReceipt(payload) {
    return paymentEndpoint.registerReceipt(this, payload);
  }

  /** POST /v1/receipt/withholding — register a withholding tax receipt. */
  registerWithholdingReceipt(payload) {
    return withholdingEndpoint.registerReceipt(this, payload);
  }
}

module.exports = { EirmsClient };
