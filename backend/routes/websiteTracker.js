'use strict';

const express               = require('express');
const router                = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { scanWebsites }      = require('../controllers/websiteTrackerController');
const {
  getWebsiteReport,
  getScanHistory,
} = require('../services/reports/reportStorageService');

// ── Scan endpoint (unchanged) ─────────────────────────────────────────────────
// GET /api/website-tracker/scan
router.get('/scan', authenticateToken, scanWebsites);

// ── Report read endpoints ─────────────────────────────────────────────────────

// GET /api/website-tracker/report
// Returns the latest stored website tracker report for the authenticated user.
// No Gmail API call — reads directly from MongoDB.
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await getWebsiteReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ message: 'No website report found. Run a scan first.' });
    }
    res.json(report);
  } catch (err) {
    console.error('GET /website-tracker/report error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve website report' });
  }
});

// GET /api/website-tracker/history
// Returns scan history entries for this module (newest first, max 50).
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const history = await getScanHistory(req.user.userId, limit);
    res.json({ history });
  } catch (err) {
    console.error('GET /website-tracker/history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
