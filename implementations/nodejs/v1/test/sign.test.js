'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { signRequest, buildSignedEnvelope, toCompactJson } = require('../src/crypto/sign');

// Generate a throwaway RSA key pair for testing signing round-trips.
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' });

test('toCompactJson produces no extra whitespace', () => {
  const json = toCompactJson({ a: 1, b: 'two' });
  assert.equal(json, '{"a":1,"b":"two"}');
});

test('signRequest produces a signature that verifies against the same payload', () => {
  const payload = { clientId: 'abc', clientSecret: 'xyz', apikey: 'k', tin: '123' };
  const signatureB64 = signRequest(payload, privateKeyPem);

  const verifier = crypto.createVerify('RSA-SHA512');
  verifier.update(toCompactJson(payload), 'utf8');
  verifier.end();

  const isValid = verifier.verify(publicKeyPem, Buffer.from(signatureB64, 'base64'));
  assert.equal(isValid, true);
});

test('signRequest signature does NOT verify against a tampered payload', () => {
  const payload = { clientId: 'abc', clientSecret: 'xyz', apikey: 'k', tin: '123' };
  const signatureB64 = signRequest(payload, privateKeyPem);

  const tampered = { ...payload, tin: '999' };
  const verifier = crypto.createVerify('RSA-SHA512');
  verifier.update(toCompactJson(tampered), 'utf8');
  verifier.end();

  const isValid = verifier.verify(publicKeyPem, Buffer.from(signatureB64, 'base64'));
  assert.equal(isValid, false);
});

test('buildSignedEnvelope returns request/signature/certificate keys', () => {
  const payload = { foo: 'bar' };
  const envelope = buildSignedEnvelope(payload, privateKeyPem, 'FAKE_CERT_BASE64');

  assert.deepEqual(envelope.request, payload);
  assert.equal(typeof envelope.signature, 'string');
  assert.ok(envelope.signature.length > 0);
  assert.equal(envelope.certificate, 'FAKE_CERT_BASE64');
});
