'use strict';

/**
 * DriveReport.js
 *
 * Stores the latest Drive classification result for each user.
 * One document per user (upserted on every scan).
 * Collection: driveReports
 */

const mongoose = require('mongoose');

const driveReportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one latest report per user
      index:    true,
    },
    // Summary from driveClassifierService
    summary: {
      totalFiles:      { type: Number, default: 0 },
      totalSizeBytes:  { type: Number, default: 0 },
      // categories array: [{ name, count, sizeBytes }]
      categories:      { type: mongoose.Schema.Types.Mixed, default: [] },
    },
    // Count per category key (Documents, Images, Videos, …)
    categoryCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Full classified file list
    // Each entry: { id, name, mimeType, classifiedCategory, classificationMethod, sizeBytes, … }
    classifiedFiles: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Drive Decay Detector — storage breakdown by category (Documents, Media, …)
    decaySummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Drive Decay Detector — scored file list with decayScore / isJunk
    decayFiles: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Drive Decay Detector — count of duplicate checksum groups
    duplicateGroups: { type: Number, default: 0 },
    // Drive Decay Detector — total files in last decay scan
    decayTotalFiles: { type: Number, default: 0 },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
    decayLastScanned: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DriveReport', driveReportSchema);
