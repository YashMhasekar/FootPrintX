'use strict';

/**
 * ScanHistory.js
 *
 * One entry per scan across all modules.
 * Unlike the other report models, this is append-only — every scan appends
 * a new history record. Dashboard can read the full timeline or filter by module.
 * Collection: scanHistory
 */

const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    // Which module produced this entry
    module: {
      type:     String,
      enum:     ['emailClassification', 'driveClassifier', 'driveDecay', 'websiteTracker', 'breachRadar', 'autoCleanup'],
      required: true,
    },
    // How long the scan took in milliseconds
    durationMs: { type: Number, default: 0 },
    // Whether the scan completed successfully or errored
    status: {
      type:     String,
      enum:     ['success', 'error', 'partial'],
      default:  'success',
    },
    // Optional short summary (e.g. "Classified 234 emails", "Score: 72/100")
    summary: { type: String, default: '' },
    // When the scan ran
    timestamp: { type: Date, default: Date.now },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index to allow fast per-user history lookups sorted by time
scanHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
