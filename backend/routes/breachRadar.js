'use strict';

const express               = require('express');
const router                = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { scan }              = require('../controllers/breachRadarController');
const {
  getBreachReport,
  getDigitalRiskScore,
  getScanHistory,
} = require('../services/reports/reportStorageService');

// ── Scan endpoint (unchanged) ─────────────────────────────────────────────────
// GET /api/breach-radar/scan
router.get('/scan', authenticateToken, scan);

// ── Report read endpoints ─────────────────────────────────────────────────────

// GET /api/breach-radar/report
// Returns the latest stored breach radar report for the authenticated user.
// No Drive or Gmail API call — reads directly from MongoDB.
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await getBreachReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ message: 'No breach report found. Run a scan first.' });
    }
    res.json(report);
  } catch (err) {
    console.error('GET /breach-radar/report error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve breach report' });
  }
});

// GET /api/breach-radar/risk-score
// Returns the latest computed digital risk score for the authenticated user.
router.get('/risk-score', authenticateToken, async (req, res) => {
  try {
    const score = await getDigitalRiskScore(req.user.userId);
    if (!score) {
      return res.status(404).json({ message: 'No risk score found. Run a breach radar scan first.' });
    }
    res.json(score);
  } catch (err) {
    console.error('GET /breach-radar/risk-score error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve digital risk score' });
  }
});

// GET /api/breach-radar/history
// Returns scan history entries for this module (newest first, max 50).
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const history = await getScanHistory(req.user.userId, limit);
    res.json({ history });
  } catch (err) {
    console.error('GET /breach-radar/history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
