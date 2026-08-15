const express = require('express');
const cors = require('cors');

const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/user');
const adminRoutes = require('./routes/admin');
const driveRoutes = require('./routes/drive');
const emailRoutes = require('./routes/email');
const emailClassificationRoutes  = require('./routes/emailClassification');
const driveClassifierRoutes      = require('./routes/driveClassifier');
const websiteTrackerRoutes       = require('./routes/websiteTracker');
const breachRadarRoutes          = require('./routes/breachRadar');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes  — paths match the original server.js exactly
app.use('/api/auth',  authRoutes);   // /api/auth/register, /api/auth/login, /api/auth/google/...
app.use('/api/user',  userRoutes);   // /api/user/profile, /api/user/change-password
app.use('/api/admin', adminRoutes);  // /api/admin/users/tokens
// Feature 1 — Drive decay + email subscription manager
app.use('/api/drive', driveRoutes);  // /api/drive/summary, /api/drive/files
app.use('/api/email', emailRoutes);  // /api/email/scan, /api/email/subscriptions, /api/email/unsubscribe
// Feature 2 — Email classification + bulk delete
app.use('/api/email-classification', emailClassificationRoutes);  // /api/email-classification/scan|trash|delete|verify
// Feature 3 — Drive File Classifier
app.use('/api/drive-classifier', driveClassifierRoutes);          // /api/drive-classifier/classify
// Feature 4 — Website Tracker
app.use('/api/website-tracker', websiteTrackerRoutes);            // /api/website-tracker/scan
// Feature 5 — Privacy & Security Radar (Breach Radar)
app.use('/api/breach-radar', breachRadarRoutes);                  // /api/breach-radar/scan

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

module.exports = app;
