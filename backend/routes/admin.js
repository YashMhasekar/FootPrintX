const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllUsersTokens } = require('../controllers/authController');

// GET /api/admin/users/tokens
router.get('/users/tokens', authenticateToken, getAllUsersTokens);

module.exports = router;
