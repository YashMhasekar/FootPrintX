const { OAuth2Client } = require('google-auth-library');

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

/**
 * Creates a fresh OAuth2Client instance.
 * Use this in services that need per-request credential isolation
 * (Drive, Gmail services) so they don't share state with the singleton below.
 */
function createOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

// Singleton kept for backward-compatibility with authController.js which
// calls googleClient.generateAuthUrl / getToken / setCredentials directly.
const googleClient = createOAuthClient();

module.exports = googleClient;
module.exports.createOAuthClient = createOAuthClient;
