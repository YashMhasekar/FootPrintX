'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken } = require('../middleware/auth');
const {
  scanEmails,
  trashEmails,
  deleteEmails,
  verifyDeletion,
} = require('../controllers/emailClassificationController');
const {
  getEmailReport,
  getAutoCleanupReport,
  getScanHistory,
} = require('../services/reports/reportStorageService');

// ── Scan & mutation endpoints (unchanged) ────────────────────────────────────
router.post('/scan',   authenticateToken, scanEmails);
router.post('/trash',  authenticateToken, trashEmails);
router.post('/delete', authenticateToken, deleteEmails);
router.post('/verify', authenticateToken, verifyDeletion);

// ── Report read endpoints ────────────────────────────────────────────────────

// GET /api/email-classification/report
// Returns the latest stored email classification report for the authenticated user.
// No Gmail API call — reads directly from MongoDB.
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await getEmailReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ message: 'No email report found. Run a scan first.' });
    }
    res.json(report);
  } catch (err) {
    console.error('GET /email-classification/report error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve email report' });
  }
});

// GET /api/email-classification/cleanup-report
// Returns the latest stored auto-cleanup statistics for the authenticated user.
router.get('/cleanup-report', authenticateToken, async (req, res) => {
  try {
    const report = await getAutoCleanupReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ message: 'No cleanup report found. Run a cleanup action first.' });
    }
    res.json(report);
  } catch (err) {
    console.error('GET /email-classification/cleanup-report error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve cleanup report' });
  }
});

// GET /api/email-classification/history
// Returns scan history entries for this module (newest first, max 50).
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const history = await getScanHistory(req.user.userId, limit);
    res.json({ history });
  } catch (err) {
    console.error('GET /email-classification/history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

module.exports = router;
