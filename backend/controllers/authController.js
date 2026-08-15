const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const googleClient = require('../config/googleClient');
const {
  GOOGLE_OAUTH_SCOPES,
  storeGoogleTokens,
  isGoogleTokenValid,
  getDecryptedAccessToken,
  refreshGoogleToken
} = require('../utils/tokenHelpers');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/auth/google
const googleAuthInit = (req, res) => {
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_SCOPES,
      redirect_uri: redirectUri
    });

    console.log('Generated Google OAuth URL:', authUrl);
    console.log('Using redirect URI:', redirectUri);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    res.status(500).json({ message: 'Failed to generate OAuth URL', error: error.message });
  }
};

// GET /api/auth/google/callback
const googleCallbackGet = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3009'}?error=oauth_failed&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3009'}?error=no_code&message=${encodeURIComponent('No authorization code received')}`
      );
    }

    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: googleClient });
    const userInfo = await oauth2.userinfo.get();
    const { email, given_name, family_name, picture, id: googleId } = userInfo.data;

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      user = new User({
        firstName: given_name || 'Unknown',
        lastName: family_name || 'User',
        email,
        googleId,
        avatar: picture,
        password: null
      });
      await user.save();
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    }

    await storeGoogleTokens(user, tokens);

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3009';
    const redirectUrl = `${frontendUrl}/auth/google/callback?auth=success&token=${encodeURIComponent(token)}&user=${encodeURIComponent(
      JSON.stringify({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        googleId: user.googleId,
        hasValidGoogleToken: isGoogleTokenValid(user),
        tokenExpiry: user.tokenExpiry,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      })
    )}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google authentication error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3009';
    res.redirect(
      `${frontendUrl}/auth/google/callback?error=auth_failed&message=${encodeURIComponent('Google authentication failed')}`
    );
  }
};

// POST /api/auth/google/callback
const googleCallbackPost = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: googleClient });
    const userInfo = await oauth2.userinfo.get();
    const { email, given_name, family_name, picture, id: googleId } = userInfo.data;

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      user = new User({
        firstName: given_name || 'Unknown',
        lastName: family_name || 'User',
        email,
        googleId,
        avatar: picture,
        password: null
      });
      await user.save();
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    }

    await storeGoogleTokens(user, tokens);

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      googleId: user.googleId,
      hasValidGoogleToken: isGoogleTokenValid(user),
      tokenExpiry: user.tokenExpiry,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({ message: 'Google authentication successful', user: userResponse, token });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// POST /api/auth/google/reauth
const googleReauth = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_SCOPES,
      redirect_uri: redirectUri,
      prompt: 'consent'
    });

    res.json({ authUrl, message: 'Re-authentication URL generated' });
  } catch (error) {
    console.error('Error generating re-authentication URL:', error);
    res.status(500).json({ message: 'Failed to generate re-authentication URL' });
  }
};

// GET /api/auth/google/token
const getGoogleToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      '+accessToken +refreshToken +tokenExpiry +tokenStatus +lastTokenRefresh +oauthScopes'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.accessToken) {
      return res.status(400).json({
        message: 'No Google access token available. Please re-authenticate with Google.',
        requiresReauth: true
      });
    }

    if (user.tokenExpiry && new Date() > user.tokenExpiry) {
      try {
        const newAccessToken = await refreshGoogleToken(user);
        return res.json({
          accessToken: newAccessToken,
          message: 'Token refreshed successfully',
          tokenStatus: 'refreshed',
          lastRefresh: new Date()
        });
      } catch (refreshError) {
        return res.status(401).json({
          message: 'Access token expired and refresh failed. Please re-authenticate with Google.',
          requiresReauth: true,
          tokenStatus: 'expired'
        });
      }
    }

    const decryptedToken = getDecryptedAccessToken(user);
    if (!decryptedToken) {
      return res.status(500).json({
        message: 'Failed to decrypt access token. Please re-authenticate.',
        requiresReauth: true
      });
    }

    res.json({
      accessToken: decryptedToken,
      message: 'Valid access token retrieved',
      tokenStatus: 'valid',
      tokenExpiry: user.tokenExpiry,
      lastRefresh: user.lastTokenRefresh,
      oauthScopes: user.oauthScopes
    });
  } catch (error) {
    console.error('Error getting Google access token:', error);
    res.status(500).json({ message: 'Failed to retrieve access token' });
  }
};

// GET /api/auth/google/tokens/debug
const getTokenDebug = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      '+accessToken +refreshToken +tokenExpiry +tokenStatus +lastTokenRefresh +oauthScopes +oauthProvider'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Encrypted token information retrieved',
      user: {
        _id: user._id,
        email: user.email,
        googleId: user.googleId,
        oauthProvider: user.oauthProvider,
        oauthScopes: user.oauthScopes,
        tokenStatus: user.tokenStatus,
        tokenExpiry: user.tokenExpiry,
        lastTokenRefresh: user.lastTokenRefresh,
        hasAccessToken: !!user.accessToken,
        accessTokenLength: user.accessToken ? user.accessToken.length : 0,
        hasRefreshToken: !!user.refreshToken,
        refreshTokenLength: user.refreshToken ? user.refreshToken.length : 0,
        accessTokenEncrypted: user.accessToken ? user.accessToken.includes(':') : false,
        refreshTokenEncrypted: user.refreshToken ? user.refreshToken.includes(':') : false
      }
    });
  } catch (error) {
    console.error('Error getting token debug info:', error);
    res.status(500).json({ message: 'Failed to retrieve token debug information' });
  }
};

// GET /api/admin/users/tokens
const getAllUsersTokens = async (req, res) => {
  try {
    const users = await User.find({}).select(
      'firstName lastName email googleId oauthProvider tokenStatus tokenExpiry lastTokenRefresh oauthScopes createdAt lastLogin'
    );

    const tokenSummary = users.map((user) => ({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      googleId: user.googleId,
      oauthProvider: user.oauthProvider,
      tokenStatus: user.tokenStatus,
      tokenExpiry: user.tokenExpiry,
      lastTokenRefresh: user.lastTokenRefresh,
      oauthScopes: user.oauthScopes,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      tokenAge: user.lastTokenRefresh
        ? Math.floor((new Date() - new Date(user.lastTokenRefresh)) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.json({
      message: 'All users token status retrieved',
      totalUsers: users.length,
      usersWithTokens: users.filter((u) => u.tokenStatus !== 'invalid').length,
      usersWithoutTokens: users.filter((u) => u.tokenStatus === 'invalid').length,
      users: tokenSummary
    });
  } catch (error) {
    console.error('Error getting all users token status:', error);
    res.status(500).json({ message: 'Failed to retrieve users token status' });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({ firstName, lastName, email, phone, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.status(201).json({ message: 'User registered successfully', user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please use Google sign-in for this account' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({ message: 'Login successful', user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  googleAuthInit,
  googleCallbackGet,
  googleCallbackPost,
  googleReauth,
  getGoogleToken,
  getTokenDebug,
  getAllUsersTokens,
  register,
  login
};
