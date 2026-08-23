# EIRMS API Reference

Language-agnostic reference for EIRMS endpoints.

## Request Envelope

Every request is wrapped as:

```json
{
  "request": { /* payload */ },
  "signature": "<base64 SHA512withRSA signature of request>",
  "certificate": "<base64 certificate>"
}
```

## Endpoints

### `POST /auth/login`
**Request:**
```json
{ "clientId": "...", "clientSecret": "...", "apikey": "...", "tin": "..." }
```
**Response:** `accessToken`, `refreshToken`, `expiresIn`, `encryptionKey`.

### `POST /auth/refresh`
Exchanges `refreshToken` for a new `accessToken`.

### `POST /v1/register`
Registers sales documents (`INV`, `CRE`, `DEB`) and returns `irn`.

### `POST /v1/cancel`
Cancels a registered document by `irn`.

### `POST /v1/receipt/sales`
Registers a payment receipt.

### `POST /v1/receipt/withholding`
Registers a withholding tax receipt.

## Tax Codes
`VAT15` (15%), `VAT10` (10%), `VAT0` (0%), `VATEX` (Exempt), `TOT2` (Turnover 2%), `VWHT` (Withheld).
