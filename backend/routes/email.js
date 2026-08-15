'use strict';

const express          = require('express');
const router           = express.Router();
const { authenticateToken } = require('../middleware/auth');
const emailController  = require('../controllers/emailController');

// All Email routes require a valid JWT — authenticateToken sets req.user
router.post('/scan',              authenticateToken, emailController.scanSubscriptions);
router.get('/subscriptions',      authenticateToken, emailController.getSubscriptions);
router.post('/unsubscribe',       authenticateToken, emailController.unsubscribeOne);
router.post('/unsubscribe/bulk',  authenticateToken, emailController.unsubscribeBulk);

module.exports = router;
