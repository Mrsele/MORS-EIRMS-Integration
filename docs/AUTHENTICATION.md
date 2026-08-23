# Authentication, Signing & Encryption

## Credentials Required
- `clientId`, `clientSecret`, `apikey`, `tin`
- RSA Private Key (`private_key.pem`)
- Certificate (`certificate.txt` / Base64)

## Signing Algorithm
Every request envelope contains:
- `signature`: Base64 of `RSA-SHA512` over compact JSON `request`.
- `certificate`: Base64 string of X.509 certificate.

```
signature = base64( RSA_SHA512_Sign(private_key, compact_json(request)) )
```

## Token Lifecycle
1. `POST /auth/login` → returns `accessToken`, `refreshToken`, `encryptionKey`.
2. Header: `Authorization: Bearer <accessToken>`.
3. Auto-refreshes using `refreshToken` prior to expiration. On `401`, invalidates token cache and retries once.

## Payload Encryption
Business payloads (`/v1/*`) are encrypted with **AES-256-CBC**:
- Prepend 16-byte random IV to ciphertext.
- Base64-encode result into `{ "data": "<iv+ciphertext>" }`.
- Sign the encrypted envelope.
