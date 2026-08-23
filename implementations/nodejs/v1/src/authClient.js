'use strict';

const { buildSignedEnvelope } = require('./crypto/sign');
const { httpPost } = require('./httpPost');

const EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000; // refresh 5 min before actual expiry

/**
 * Handles login, refresh, and token caching against a single EirmsConfig.
 * Not usually used directly — EirmsClient wraps this and exposes the
 * business endpoints. Exposed separately so it can be unit tested and
 * reused (e.g. a CLI that just verifies credentials).
 */
class AuthClient {
  /**
   * @param {import('./config').EirmsConfig} config
   * @param {{get: Function, set: Function, clear: Function}} tokenStore
   */
  constructor(config, tokenStore) {
    this.config = config;
    this.tokenStore = tokenStore;
    this._seeded = false;
  }

  async _ensureSeeded() {
    if (this._seeded) return;
    this._seeded = true;

    if (this.config.initialAccessToken) {
      const existing = await this.tokenStore.get(this.config.branchCode);
      if (!existing) {
        let expiresAtMs = Date.now() + 3 * 3600 * 1000;
        if (this.config.initialExpiresAt) {
          expiresAtMs = this.config.initialExpiresAt < 1e11
            ? this.config.initialExpiresAt * 1000
            : this.config.initialExpiresAt;
        }

        await this.tokenStore.set(this.config.branchCode, {
          accessToken: this.config.initialAccessToken,
          refreshToken: this.config.initialRefreshToken || '',
          encryptionKey: this.config.initialEncryptionKey || '',
          expiresAt: expiresAtMs,
        });
      }
    }
  }

  /** Returns a valid access token, logging in or refreshing as needed. */
  async getAccessToken() {
    await this._ensureSeeded();

    const cached = await this.tokenStore.get(this.config.branchCode);
    if (cached && cached.expiresAt > Date.now() + EXPIRY_SAFETY_MARGIN_MS) {
      return cached.accessToken;
    }

    if (cached && cached.refreshToken) {
      try {
        return await this._refresh(cached.refreshToken);
      } catch {
        // Refresh token itself may have expired — fall through to a full login.
      }
    }

    return this._login();
  }

  /** Returns the current session's encryptionKey (logs in first if needed). */
  async getEncryptionKey() {
    await this.getAccessToken();
    const cached = await this.tokenStore.get(this.config.branchCode);
    return cached ? cached.encryptionKey : '';
  }

  /** Clears the cached token for this config's branch — call after a 401. */
  async invalidate() {
    await this.tokenStore.clear(this.config.branchCode);
  }

  _checkSigningCredentials() {
    if (!this.config.privateKeyPem || !this.config.certificatePem) {
      throw new Error(
        'EIRMS authentication requires both privateKey and certificate. Please configure EIRMS_PRIVATE_KEY_PATH and EIRMS_CERTIFICATE_PATH.'
      );
    }
  }

  async _login() {
    this._checkSigningCredentials();

    const innerRequest = {
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      apikey: this.config.apiKey,
      tin: this.config.tin,
    };

    const envelope = buildSignedEnvelope(
      innerRequest,
      this.config.privateKeyPem,
      this.config.certificatePem
    );

    const response = await httpPost(`${this.config.baseUrl}/auth/login`, envelope);
    return this._cacheTokenResponse(response);
  }

  async _refresh(refreshToken) {
    this._checkSigningCredentials();

    const envelope = buildSignedEnvelope(
      { refreshToken },
      this.config.privateKeyPem,
      this.config.certificatePem
    );

    const response = await httpPost(`${this.config.baseUrl}/auth/refresh`, envelope);
    return this._cacheTokenResponse(response);
  }

  async _cacheTokenResponse(response) {
    const data = response.data || response;
    if (!data.accessToken) {
      throw new Error('EIRMS auth response did not include an accessToken');
    }

    const expiresInMs = (data.expiresIn || 10800) * 1000;
    await this.tokenStore.set(this.config.branchCode, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || '',
      encryptionKey: data.encryptionKey || '',
      expiresAt: Date.now() + expiresInMs,
    });

    return data.accessToken;
  }
}

module.exports = { AuthClient };
