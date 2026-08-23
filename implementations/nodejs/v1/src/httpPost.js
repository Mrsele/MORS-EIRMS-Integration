'use strict';

/**
 * POST a JSON body and return the parsed JSON response. Throws an
 * EirmsApiError on any non-2xx response, carrying the status code and the
 * raw response body so callers can inspect MOR's actual error message
 * instead of a generic failure.
 */
class EirmsApiError extends Error {
  constructor(message, { status, body, path } = {}) {
    super(message);
    this.name = 'EirmsApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

async function httpPost(url, jsonBody, headers = {}, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify(jsonBody),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new EirmsApiError(`Request to ${url} timed out after ${timeoutMs}ms`, { path: url });
    }
    throw new EirmsApiError(`Request to ${url} failed: ${err.message}`, { path: url });
  } finally {
    clearTimeout(timer);
  }

  let body;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { rawText: text };
  }

  if (!response.ok) {
    throw new EirmsApiError(
      `EIRMS API error (${response.status}) for ${url}: ${
        body.message || JSON.stringify(body)
      }`,
      { status: response.status, body, path: url }
    );
  }

  return body;
}

module.exports = { httpPost, EirmsApiError };
