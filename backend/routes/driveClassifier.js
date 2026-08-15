'use strict';

const express                   = require('express');
const router                    = express.Router();
const { authenticateToken }     = require('../middleware/auth');
const driveClassifierController = require('../controllers/driveClassifierController');
const {
  getDriveReport,
  getScanHistory,
} = require('../services/reports/reportStorageService');

// ── Scan endpoint (unchanged) ─────────────────────────────────────────────────
// GET /api/drive-classifier/classify
router.get('/classify', authenticateToken, driveClassifierController.classifyFiles);

// ── Report read endpoints ─────────────────────────────────────────────────────

// GET /api/drive-classifier/report
// Returns the latest stored Drive classification report for the authenticated user.
// No Drive API call — reads directly from MongoDB.
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await getDriveReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ message: 'No Drive report found. Run a classify scan first.' });
    }
    res.json(report);
  } catch (err) {
    console.error('GET /drive-classifier/report error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve Drive report' });
  }
});

// GET /api/drive-classifier/history
// Returns scan history entries for this module (newest first, max 50).
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const history = await getScanHistory(req.user.userId, limit);
    res.json({ history });
  } catch (err) {
    console.error('GET /drive-classifier/history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
