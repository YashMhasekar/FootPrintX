'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

// ---------------------------------------------------------------------------
// Key derivation
//
// ENCRYPTION_KEY env var is expected to be a 64-character hex string
// (32 bytes). If it is shorter or absent we SHA-256-hash whatever is
// provided so we always end up with exactly 32 bytes regardless of input
// length. The same derivation runs on both encrypt and decrypt so the key
// is always consistent within a process.
// ---------------------------------------------------------------------------
function deriveKey(secret) {
  // If the secret is already a 64-char hex string treat it as raw bytes.
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex'); // 32 bytes exactly
  }
  // Otherwise hash it to get a stable 32-byte key.
  return crypto.createHash('sha256').update(secret).digest();
}

// Stable fallback so tokens remain decryptable across server restarts in dev.
const RAW_SECRET = process.env.ENCRYPTION_KEY
  || process.env.JWT_SECRET
  || 'footprintx-dev-encryption-key';
const KEY = deriveKey(RAW_SECRET);

// ---------------------------------------------------------------------------
// encryptToken
//
// Encrypts a UTF-8 string with AES-256-CBC.
// Stored format: <16-byte iv as hex>:<ciphertext as hex>
// The IV is generated fresh for every call so identical plaintexts produce
// different ciphertexts (standard CBC practice).
// ---------------------------------------------------------------------------
const encryptToken = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // preserve original fallback behaviour
  }
};

// ---------------------------------------------------------------------------
// decryptToken
//
// Decrypts a value produced by encryptToken.
// Format expected: <iv hex>:<ciphertext hex>
//
// Backwards-compatibility note:
//   Tokens stored before this update were encrypted with the now-removed
//   crypto.createCipher(), which derives its own key/IV from the password
//   using OpenSSL EVP_BytesToKey — it does NOT use the IV in the stored
//   string. Those tokens will fail createDecipheriv decryption. When that
//   happens the function returns the raw encrypted string unchanged so that
//   the caller (tokenHelpers.refreshGoogleToken) can detect a stale token
//   and trigger re-authentication rather than crashing. Users re-authenticating
//   via Google OAuth will have their tokens re-encrypted with the new scheme.
// ---------------------------------------------------------------------------
const decryptToken = (encryptedText) => {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText; // not encrypted — return as-is
    }

    const parts = encryptedText.split(':');
    const ivHex = parts.shift();          // first 32 hex chars = 16 bytes
    const ciphertext = parts.join(':');   // remainder (re-join in case ciphertext itself had colons)

    if (ivHex.length !== IV_LENGTH * 2) {
      // Malformed stored value — return as-is
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Decryption failed — most likely a legacy token encrypted with the
    // old createCipher(). Return the raw value so callers can detect the
    // failure and prompt re-authentication.
    console.warn('Decryption failed (possibly legacy token):', error.message);
    return encryptedText;
  }
};

module.exports = { encryptToken, decryptToken };
