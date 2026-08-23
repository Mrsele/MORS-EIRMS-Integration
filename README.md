# EIRMS Integration Connector

A lightweight connector for Ethiopia's Ministry of Revenue (**MOR**) **EIRMS** e-invoicing API.

## Features
- **Authentication**: Token login, refresh, caching.
- **Security**: RSA-SHA512 request signing & AES-256 payload encryption.
- **Endpoints**: Invoices, Credit/Debit notes, Payment Receipts, Withholding Receipts.

## Project Structure
```
MORS-EIRMS-Integration/
├── docs/                      # Protocol specifications
├── implementations/
│   ├── nodejs/v1/             # Node.js implementation
│   ├── python/                # Python implementation
│   └── php/                   # PHP implementation
```

## Quick Start (Node.js)

```bash
cd implementations/nodejs/v1
npm install
npm run generate-keys
npm test
```

## Configuration Options
Supports `.env`, `mor_config.json`, or direct system parameter objects.

```bash
npm run example:register-invoice
```

## License
MIT
