'use strict';

/**
 * Minimal in-memory token store, keyed by branchCode. Good enough for a
 * single process / short-lived script. For a long-running server where
 * tokens should survive a restart, implement the same three methods
 * (get/set/clear) against Redis, a database row, or a file, and pass an
 * instance of that into EirmsClient instead.
 */
class InMemoryTokenStore {
  constructor() {
    this._store = new Map();
  }

  /** @param {string} branchCode @returns {object|null} */
  async get(branchCode) {
    return this._store.get(branchCode) || null;
  }

  /**
   * @param {string} branchCode
   * @param {{accessToken: string, refreshToken: string, encryptionKey: string, expiresAt: number}} tokenData
   */
  async set(branchCode, tokenData) {
    this._store.set(branchCode, tokenData);
  }

  /** @param {string} branchCode */
  async clear(branchCode) {
    this._store.delete(branchCode);
  }
}

module.exports = { InMemoryTokenStore };
