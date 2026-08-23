'use strict';

const { EirmsClient } = require('./eirmsClient');
const { EirmsConfig } = require('./config');
const { InMemoryTokenStore } = require('./tokenStore');
const { EirmsApiError } = require('./httpPost');
const { signRequest, buildSignedEnvelope } = require('./crypto/sign');
const { encryptPayload } = require('./crypto/encrypt');

module.exports = {
  EirmsClient,
  EirmsConfig,
  InMemoryTokenStore,
  EirmsApiError,
  // Exposed for advanced use (e.g. building a token store backed by Redis
  // that also wants to reuse the signing helpers directly) and for testing.
  signRequest,
  buildSignedEnvelope,
  encryptPayload,
};
