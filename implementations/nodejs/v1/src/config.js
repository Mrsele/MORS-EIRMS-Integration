'use strict';

const fs = require('fs');

/**
 * Build a config object for one credential set ("branch" in the loose sense
 * of "one clientId/clientSecret pair"). Most integrations only need one of
 * these; multi-branch taxpayers can construct several EirmsClient instances,
 * one per branch, each with its own EirmsConfig.
 *
 * This module intentionally does NOT read process.env itself beyond a
 * convenience default export — pass explicit values in for anything beyond
 * a single-branch setup so credential resolution stays visible and testable.
 */
class EirmsConfig {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl - EIRMS API base URL
   * @param {string} opts.clientId
   * @param {string} opts.clientSecret
   * @param {string} opts.apiKey
   * @param {string} opts.tin - seller TIN
   * @param {string} [opts.privateKeyPath] - path to PEM/RSA private key file
   * @param {string} [opts.privateKeyPem] - private key contents directly (alternative to path)
   * @param {string} [opts.certificatePath] - path to certificate file
   * @param {string} [opts.certificatePem] - certificate contents directly (alternative to path)
   * @param {boolean} [opts.encryptPayloads=true] - encrypt business-call payloads
   * @param {string} [opts.branchCode] - optional label for multi-branch setups (logging/cache key only)
   */
  constructor(opts = {}) {
    const required = ['baseUrl', 'clientId', 'clientSecret', 'apiKey', 'tin'];
    const missing = required.filter((k) => !opts[k]);
    if (missing.length) {
      throw new Error(
        `EirmsConfig is missing required field(s): ${missing.join(', ')}`
      );
    }

    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.apiKey = opts.apiKey;
    this.tin = opts.tin;
    this.encryptPayloads = opts.encryptPayloads !== false;
    this.branchCode = opts.branchCode || 'default';

    this.sellerVat = opts.sellerVat || '';
    this.systemNumber = opts.systemNumber || '';

    // Pre-seeded token support
    this.initialAccessToken = opts.accessToken || '';
    this.initialRefreshToken = opts.refreshToken || '';
    this.initialEncryptionKey = opts.encryptionKey || '';
    this.initialExpiresAt = opts.expiresAt ? Number(opts.expiresAt) : null;

    const hasPrecachedToken = Boolean(this.initialAccessToken && this.initialEncryptionKey);

    this.privateKeyPem = opts.privateKeyPem || this._readFile(opts.privateKeyPath, 'private key', !hasPrecachedToken);
    this.certificatePem = opts.certificatePem || this._readFile(opts.certificatePath, 'certificate', !hasPrecachedToken);
  }

  _readFile(path, label, required = true) {
    if (!path) {
      if (required) {
        throw new Error(
          `EirmsConfig: no ${label} provided (pass either a *Path or a *Pem option)`
        );
      }
      return '';
    }
    if (!fs.existsSync(path)) {
      if (required) {
        throw new Error(`EirmsConfig: ${label} file not found at "${path}"`);
      }
      return '';
    }
    return fs.readFileSync(path, 'utf8').trim();
  }

  /** Build config directly from system parameters object (supporting mor.* dot-notation or camelCase). */
  static fromSystemParameters(params = {}) {
    return new EirmsConfig({
      baseUrl: params['mor.url'] || params.baseUrl || params.url,
      clientId: params['mor.client_id'] || params.clientId || params.client_id,
      clientSecret: params['mor.client_secret'] || params.clientSecret || params.client_secret,
      apiKey: params['mor.api_key'] || params.apiKey || params.api_key,
      tin: params['mor.seller_tin'] || params.tin || params.seller_tin,
      sellerVat: params['mor.seller_vat'] || params.sellerVat || params.seller_vat,
      systemNumber: params['mor.system_number'] || params.systemNumber || params.system_number,
      privateKeyPath: params['mor.private_key_path'] || params.privateKeyPath,
      privateKeyPem: params['mor.private_key_pem'] || params.privateKeyPem,
      certificatePath: params['mor.certificate_path'] || params.certificatePath,
      certificatePem: params['mor.certificate_pem'] || params.certificatePem,
      accessToken: params['mor.access_token'] || params.accessToken || params.access_token,
      refreshToken: params['mor.refresh_token'] || params.refreshToken || params.refresh_token,
      encryptionKey: params['mor.encryption_key'] || params.encryptionKey || params.encryption_key,
      expiresAt: params['mor.token_expires_at'] || params.expiresAt || params.token_expires_at,
      encryptPayloads: params['mor.encrypt_payloads'] !== false && params.encryptPayloads !== false,
      branchCode: params['mor.branch_code'] || params.branchCode,
    });
  }

  /** Load config directly from a JSON file (e.g. ./mor_config.json). */
  static fromJsonFile(filePath = './mor_config.json') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`EirmsConfig: JSON config file not found at "${filePath}"`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return EirmsConfig.fromSystemParameters(parsed);
  }

  /** Build config from environment variables (see .env.example). */
  static fromEnv(env = process.env) {
    return new EirmsConfig({
      baseUrl: env.EIRMS_BASE_URL,
      clientId: env.EIRMS_CLIENT_ID,
      clientSecret: env.EIRMS_CLIENT_SECRET,
      apiKey: env.EIRMS_API_KEY,
      tin: env.EIRMS_TIN,
      sellerVat: env.EIRMS_SELLER_VAT,
      systemNumber: env.EIRMS_SYSTEM_NUMBER,
      privateKeyPath: env.EIRMS_PRIVATE_KEY_PATH,
      certificatePath: env.EIRMS_CERTIFICATE_PATH,
      accessToken: env.EIRMS_ACCESS_TOKEN,
      refreshToken: env.EIRMS_REFRESH_TOKEN,
      encryptionKey: env.EIRMS_ENCRYPTION_KEY,
      expiresAt: env.EIRMS_TOKEN_EXPIRES_AT,
      encryptPayloads: env.EIRMS_ENCRYPT_PAYLOADS !== 'false',
      branchCode: env.EIRMS_BRANCH_CODE,
    });
  }
}

module.exports = { EirmsConfig };
