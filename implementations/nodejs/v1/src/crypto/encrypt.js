'use strict';

const crypto = require('crypto');

/**
 * Encrypt a business payload for EIRMS using AES-256-CBC with a random IV,
 * per the session encryptionKey returned at login. IV is prepended to the
 * ciphertext before base64 encoding, matching what the server expects to
 * split back out. See docs/AUTHENTICATION.md.
 *
 * @param {object} payload - plaintext business payload
 * @param {string} encryptionKeyB64 - base64 AES-256 key from the login response
 * @returns {{data: string}} the encrypted envelope to send as `request`
 */
function encryptPayload(payload, encryptionKeyB64) {
  if (!encryptionKeyB64) {
    throw new Error('encryptPayload: encryptionKeyB64 is required');
  }

  const key = Buffer.from(encryptionKeyB64, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `encryptPayload: decoded key is ${key.length} bytes, expected 32 (AES-256)`
    );
  }

  const iv = crypto.randomBytes(16);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  // Node's cipheriv applies PKCS#7 padding automatically for CBC mode.
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return { data: Buffer.concat([iv, ciphertext]).toString('base64') };
}

module.exports = { encryptPayload };
