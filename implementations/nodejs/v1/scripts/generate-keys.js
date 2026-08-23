'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function encodeLength(len) {
  if (len < 128) return Buffer.from([len]);
  const octets = [];
  while (len > 0) { octets.unshift(len & 0xff); len >>= 8; }
  return Buffer.from([0x80 | octets.length, ...octets]);
}

function asn1(tag, ...children) {
  const body = Buffer.concat(children.map(c => typeof c === 'string' ? Buffer.from(c, 'hex') : c));
  return Buffer.concat([Buffer.from([tag]), encodeLength(body.length), body]);
}

function seq(...children) { return asn1(0x30, ...children); }
function set(...children) { return asn1(0x31, ...children); }
function int(val) {
  let buf = typeof val === 'number' ? Buffer.from([val]) : val;
  if (buf[0] & 0x80) buf = Buffer.concat([Buffer.from([0]), buf]);
  return asn1(0x02, buf);
}
function oid(hex) { return asn1(0x06, hex); }
function nullVal() { return Buffer.from([0x05, 0x00]); }
function bitString(buf) { return asn1(0x03, Buffer.concat([Buffer.from([0x00]), buf])); }
function utctime(date) {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return asn1(0x17, Buffer.from(yy + mm + dd + hh + min + ss + 'Z', 'ascii'));
}
function utf8String(str) { return asn1(0x0c, Buffer.from(str, 'utf8')); }

function generateKeyPairAndCertificate() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });

  const oidSha256WithRsa = '2a864886f70d01010b';
  const oidCommonName = '550403';
  const oidOrg = '55040a';

  const sigAlg = seq(oid(oidSha256WithRsa), nullVal());
  const name = seq(
    set(seq(oid(oidCommonName), utf8String('EIRMS Taxpayer'))),
    set(seq(oid(oidOrg), utf8String('Ministry of Revenue Taxpayer')))
  );

  const v3Tag = asn1(0xa0, int(2));
  const serial = int(Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89]));
  const validity = seq(utctime(new Date()), utctime(new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000)));

  const tbsCert = seq(v3Tag, serial, sigAlg, name, validity, name, pubDer);

  const signer = crypto.createSign('SHA256');
  signer.update(tbsCert);
  const sig = signer.sign(privateKey);

  const certDer = seq(tbsCert, sigAlg, bitString(sig));
  const certPem = '-----BEGIN CERTIFICATE-----\n' + certDer.toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END CERTIFICATE-----\n';

  return { privKeyPem, certPem };
}

function main() {
  const certsDir = path.join(__dirname, '..', 'certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const { privKeyPem, certPem } = generateKeyPairAndCertificate();

  const privKeyPath = path.join(certsDir, 'private_key.pem');
  const certPath = path.join(certsDir, 'certificate.txt');

  fs.writeFileSync(privKeyPath, privKeyPem, 'utf8');
  fs.writeFileSync(certPath, certPem, 'utf8');

  const privKeyB64 = Buffer.from(privKeyPem).toString('base64');
  const certB64 = Buffer.from(certPem).toString('base64');

  console.log('Keys and Certificate generated successfully!');
  console.log('Private key saved to:', privKeyPath);
  console.log('Certificate saved to:', certPath);
  console.log('\n--- Base64 Values ---');
  console.log('mor.private_key_b64:');
  console.log(privKeyB64);
  console.log('\nmor.certificate_b64:');
  console.log(certB64);
}

if (require.main === module) {
  main();
}

module.exports = { generateKeyPairAndCertificate };
