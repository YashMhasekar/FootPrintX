const { OAuth2Client } = require('google-auth-library');
const { encryptToken, decryptToken } = require('./encryption');

const GOOGLE_OAUTH_SCOPES = [
  // --- existing scopes (unchanged) ---
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  // --- Feature 1: Drive decay + email unsubscribe ---
  'https://www.googleapis.com/auth/drive.metadata.readonly', // metadata-only Drive scan
  'https://www.googleapis.com/auth/gmail.send',              // send mailto: unsubscribe emails
  'https://www.googleapis.com/auth/gmail.settings.basic',    // create sender-filter as fallback
  // --- Feature 2: Email classifier + bulk delete ---
  'https://www.googleapis.com/auth/gmail.modify'             // trash / batch-delete emails
];

// Utility function to store encrypted Google OAuth tokens
const storeGoogleTokens = async (user, tokens) => {
  try {
    const { access_token, refresh_token, expiry_date } = tokens;

    // Encrypt sensitive tokens
    user.accessToken = encryptToken(access_token);
    user.refreshToken = refresh_token ? encryptToken(refresh_token) : null;
    user.tokenExpiry = expiry_date ? new Date(expiry_date) : null;
    user.lastTokenRefresh = new Date();
    user.tokenStatus = 'valid';
    user.oauthProvider = 'google';
    user.oauthScopes = GOOGLE_OAUTH_SCOPES;

    await user.save();
    console.log(`Tokens stored successfully for user: ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error storing Google tokens:', error);
    return false;
  }
};

// Utility function to check if Google OAuth token is valid
const isGoogleTokenValid = (user) => {
  try {
    if (!user.accessToken) return false;
    if (!user.tokenExpiry) return true; // If no expiry, assume valid

    const now = new Date();
    const expiry = new Date(user.tokenExpiry);

    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return now < (expiry.getTime() - bufferTime);
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

// Utility function to get decrypted access token
const getDecryptedAccessToken = (user) => {
  try {
    if (!user.accessToken) return null;
    return decryptToken(user.accessToken);
  } catch (error) {
    console.error('Error decrypting access token:', error);
    return null;
  }
};

// Utility function to refresh expired Google OAuth tokens
const refreshGoogleToken = async (user) => {
  try {
    if (!user.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Decrypt refresh token
    const decryptedRefreshToken = decryptToken(user.refreshToken);
    if (!decryptedRefreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Update status to refreshing
    user.tokenStatus = 'refreshing';
    await user.save();

    // Create a new OAuth2Client for token refresh
    const refreshClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );

    // Refresh the token
    const { tokens } = await refreshClient.refreshToken(decryptedRefreshToken);

    // Store new tokens
    await storeGoogleTokens(user, tokens);

    console.log(`Token refreshed successfully for user: ${user.email}`);
    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing Google token:', error);

    // Update status to invalid
    user.tokenStatus = 'invalid';
    await user.save();

    throw error;
  }
};

module.exports = {
  GOOGLE_OAUTH_SCOPES,
  storeGoogleTokens,
  isGoogleTokenValid,
  getDecryptedAccessToken,
  refreshGoogleToken
};
