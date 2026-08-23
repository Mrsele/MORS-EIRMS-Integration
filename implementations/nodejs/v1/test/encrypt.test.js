'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { encryptPayload } = require('../src/crypto/encrypt');

function decryptForTest(encryptedB64, key) {
  const raw = Buffer.from(encryptedB64, 'base64');
  const iv = raw.subarray(0, 16);
  const ciphertext = raw.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

test('encryptPayload output can be decrypted back to the original payload', () => {
  const key = crypto.randomBytes(32);
  const keyB64 = key.toString('base64');
  const payload = { Buyer: { Tin: '123' }, Items: [{ Nature: 'goods' }] };

  const { data } = encryptPayload(payload, keyB64);
  const decrypted = decryptForTest(data, key);

  assert.deepEqual(decrypted, payload);
});

test('encryptPayload produces a different ciphertext each call (random IV)', () => {
  const keyB64 = crypto.randomBytes(32).toString('base64');
  const payload = { same: 'payload' };

  const first = encryptPayload(payload, keyB64);
  const second = encryptPayload(payload, keyB64);

  assert.notEqual(first.data, second.data);
});

test('encryptPayload throws on a key that is not 32 bytes decoded', () => {
  const shortKeyB64 = Buffer.from('too-short').toString('base64');
  assert.throws(() => encryptPayload({ a: 1 }, shortKeyB64), /32/);
});

test('encryptPayload throws when no key is provided', () => {
  assert.throws(() => encryptPayload({ a: 1 }, ''), /required/);
});
