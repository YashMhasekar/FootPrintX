'use strict';

/**
 * BreachReport.js
 *
 * Stores the latest Privacy & Security Radar scan result for each user.
 * One document per user (upserted on every scan).
 * Collection: breachReports
 */

const mongoose = require('mongoose');

const breachReportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one latest report per user
      index:    true,
    },
    // Score from breachRadarService
    score:   { type: Number, default: 0 },
    level:   { type: String, default: 'Unknown' },
    summary: { type: String, default: '' },
    // Full alert array
    alerts:          { type: mongoose.Schema.Types.Mixed, default: [] },
    // Prioritised recommendation list
    recommendations: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Raw statistics object
    statistics:      { type: mongoose.Schema.Types.Mixed, default: {} },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BreachReport', breachReportSchema);
