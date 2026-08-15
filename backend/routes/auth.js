const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  googleAuthInit,
  googleCallbackGet,
  googleCallbackPost,
  googleReauth,
  getGoogleToken,
  getTokenDebug,
  getAllUsersTokens,
  register,
  login
} = require('../controllers/authController');

// Standard auth
router.post('/register', register);
router.post('/login', login);

// Google OAuth
router.get('/google', googleAuthInit);
router.get('/google/callback', googleCallbackGet);
router.post('/google/callback', googleCallbackPost);
router.post('/google/reauth', authenticateToken, googleReauth);
router.get('/google/token', authenticateToken, getGoogleToken);
router.get('/google/tokens/debug', authenticateToken, getTokenDebug);

// (admin routes are mounted separately in app.js to preserve /api/admin/... paths)

module.exports = router;
