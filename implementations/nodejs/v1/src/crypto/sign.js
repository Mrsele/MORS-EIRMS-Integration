'use strict';

const crypto = require('crypto');

/**
 * Serialize an object to the exact compact JSON form that will be sent on
 * the wire. Signing must happen over these exact bytes.
 * @param {object} obj
 * @returns {string}
 */
function toCompactJson(obj) {
  return JSON.stringify(obj);
}

/**
 * Sign a request object with SHA512withRSA (PKCS#1 v1.5), as required by
 * EIRMS. See docs/AUTHENTICATION.md for the full spec.
 *
 * @param {object} requestObj - the object that will be sent as `request`
 * @param {string} privateKeyPem - PEM-encoded RSA private key
 * @returns {string} base64-encoded signature
 */
function signRequest(requestObj, privateKeyPem) {
  const payload = toCompactJson(requestObj);
  const signer = crypto.createSign('RSA-SHA512');
  signer.update(payload, 'utf8');
  signer.end();
  return signer.sign(privateKeyPem).toString('base64');
}

function cleanCertificate(cert) {
  if (!cert) return '';
  const cleaned = cert
    .replace(/-----\s*BEGIN\s+[^-]+-----/gi, '')
    .replace(/-----\s*END\s+[^-]+-----/gi, '')
    .replace(/\s+/g, '');
  return cleaned || cert;
}

/**
 * Wrap a request payload into the signed envelope EIRMS expects.
 *
 * @param {object} requestObj
 * @param {string} privateKeyPem
 * @param {string} certificatePem
 * @returns {{request: object, signature: string, certificate: string}}
 */
function buildSignedEnvelope(requestObj, privateKeyPem, certificatePem) {
  return {
    request: requestObj,
    signature: signRequest(requestObj, privateKeyPem),
    certificate: cleanCertificate(certificatePem),
  };
}

module.exports = { toCompactJson, signRequest, buildSignedEnvelope };
