'use strict';

/**
 * AutoCleanupReport.js
 *
 * Stores the statistics from email cleanup operations (trash / delete).
 * One document per user — updated each time a cleanup action runs.
 * Collection: autoCleanupReports
 */

const mongoose = require('mongoose');

const autoCleanupReportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one latest report per user
      index:    true,
    },
    // Cumulative totals updated on each cleanup action
    totalTrashed:         { type: Number, default: 0 },
    totalDeleted:         { type: Number, default: 0 },
    totalFailed:          { type: Number, default: 0 },
    // Last cleanup action details
    lastAction: {
      type:     { type: String, enum: ['trash', 'delete', 'verify'], default: 'trash' },
      dryRun:   { type: Boolean, default: false },
      trashed:  { type: Number, default: 0 },
      deleted:  { type: Number, default: 0 },
      failed:   { type: Number, default: 0 },
      emailIds: { type: [String], default: [] },
      at:       { type: Date, default: Date.now },
    },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AutoCleanupReport', autoCleanupReportSchema);
