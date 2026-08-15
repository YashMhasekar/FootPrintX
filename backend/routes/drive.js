'use strict';

const express         = require('express');
const router          = express.Router();
const { authenticateToken } = require('../middleware/auth');
const driveController = require('../controllers/driveController');

// All Drive routes require a valid JWT — authenticateToken sets req.user
router.get('/summary', authenticateToken, driveController.getSummary);
router.get('/files',   authenticateToken, driveController.getScoredFiles);

module.exports = router;
