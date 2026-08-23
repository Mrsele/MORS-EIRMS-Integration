'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { EirmsClient } = require('../src/eirmsClient');
const { EirmsConfig } = require('../src/config');

function startMockServer() {
  let tokenIssued = 0;
  let shouldReject401Once = true;

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');

      if (req.url === '/auth/login') {
        tokenIssued += 1;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: {
              accessToken: `token-${tokenIssued}`,
              refreshToken: `refresh-${tokenIssued}`,
              expiresIn: 10800,
              encryptionKey: crypto.randomBytes(32).toString('base64'),
            },
          })
        );
        return;
      }

      if (req.url === '/v1/register') {
        const authHeader = req.headers['authorization'] || '';
        // Force exactly one 401 to exercise the retry path, then succeed.
        if (shouldReject401Once) {
          shouldReject401Once = false;
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'token expired' }));
          return;
        }
        assert.ok(authHeader.startsWith('Bearer token-'));
        assert.ok(parsed.request);
        assert.ok(parsed.signature);
        assert.ok(parsed.certificate);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ body: { data: { irn: 'IRN-TEST-123' } } }));
        return;
      }

      res.writeHead(404, {});
      res.end('{}');
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('EirmsClient.registerInvoice performs login, retries once on 401, and returns the IRN', async () => {
  const server = await startMockServer();
  const { port } = server.address();

  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eirms-int-'));
  fs.writeFileSync(path.join(tmp, 'key.pem'), pem);
  fs.writeFileSync(path.join(tmp, 'cert.txt'), 'FAKE_CERT_BASE64');

  const config = new EirmsConfig({
    baseUrl: `http://127.0.0.1:${port}`,
    clientId: 'cid',
    clientSecret: 'secret',
    apiKey: 'key',
    tin: '123',
    privateKeyPath: path.join(tmp, 'key.pem'),
    certificatePath: path.join(tmp, 'cert.txt'),
    encryptPayloads: true,
  });

  const client = new EirmsClient(config);

  const { irn } = await client.registerInvoice({
    Buyer: { Tin: '999' },
    Document: { DocumentNumber: 1, Type: 'INV', Date: '01-01-2026T00:00:00' },
    Items: [],
  });

  assert.equal(irn, 'IRN-TEST-123');

  server.close();
});

test('AuthClient initializes and reuses pre-seeded session tokens without login', async () => {
  const config = new EirmsConfig({
    baseUrl: 'http://127.0.0.1:9999',
    clientId: 'cid',
    clientSecret: 'secret',
    apiKey: 'key',
    tin: '123',
    accessToken: 'precached-access-token',
    encryptionKey: crypto.randomBytes(32).toString('base64'),
    expiresAt: Math.floor((Date.now() + 3600000) / 1000),
  });

  const client = new EirmsClient(config);
  const token = await client.auth.getAccessToken();
  const encKey = await client.auth.getEncryptionKey();

  assert.equal(token, 'precached-access-token');
  assert.ok(encKey.length > 0);
});

test('EirmsConfig.fromSystemParameters and fromJsonFile correctly load config', () => {
  const jsonPath = path.join(__dirname, '..', 'mor_config.json');
  assert.ok(fs.existsSync(jsonPath));

  const config = EirmsConfig.fromJsonFile(jsonPath);
  assert.equal(config.baseUrl, 'https://core.mor.gov.et');
  assert.equal(config.clientId, '57f42f97-a7b8-44c2-b451-4520a8922553');
  assert.equal(config.tin, '0000025458');
  assert.equal(config.sellerVat, '43256663343256663322');
  assert.equal(config.systemNumber, 'E53E72C110');
});
