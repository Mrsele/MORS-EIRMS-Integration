# EIRMS Connector — Node.js Client (v1)

Lightweight Node.js client for Ethiopia's EIRMS e-invoicing API.

## Requirements
Node.js 18+

## Quick Start

```bash
npm install
npm run generate-keys
npm test
```

## Configuration

Initialize configuration from `.env`, JSON file, or parameter object:

```js
const { EirmsClient, EirmsConfig } = require('./src');

// From .env
const config = EirmsConfig.fromEnv();

// From JSON file
const config = EirmsConfig.fromJsonFile('./mor_config.json');

// From parameter object
const config = EirmsConfig.fromSystemParameters(morParams);

const client = new EirmsClient(config);
```

## API Methods

- `client.registerInvoice(payload)` → `{ irn, raw }`
- `client.cancelInvoice(payload)` → `{ success, data, raw }`
- `client.registerPaymentReceipt(payload)` → `{ data, raw }`
- `client.registerWithholdingReceipt(payload)` → `{ data, raw }`
- `client.post(path, payload)` → raw response (low-level escape hatch)

## Run Examples
```bash
npm run example:register-invoice
npm run example:register-payment
```
