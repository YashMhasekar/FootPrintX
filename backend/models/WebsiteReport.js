'use strict';

/**
 * WebsiteReport.js
 *
 * Stores the latest website tracker scan result for each user.
 * One document per user (upserted on every scan).
 * Collection: websiteReports
 */

const mongoose = require('mongoose');

const websiteReportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one latest report per user
      index:    true,
    },
    // Top-level stats from websiteTrackerService
    totalWebsites:  { type: Number, default: 0 },
    activeCount:    { type: Number, default: 0 },
    inactiveCount:  { type: Number, default: 0 },
    // Count per category (Shopping, Social, Finance, …)
    categoryCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Full website list
    // Each entry: { id, websiteName, domain, logoUrl, category, emailCount,
    //               firstSeen, lastSeen, status, confidence, sampleEmails }
    websites: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebsiteReport', websiteReportSchema);
