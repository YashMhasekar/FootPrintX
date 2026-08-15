'use strict';

/**
 * EmailReport.js
 *
 * Stores the latest email classification scan result for each user.
 * One document per user (upserted on every scan).
 * Collection: emailReports
 */

const mongoose = require('mongoose');

const emailReportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one latest report per user
      index:    true,
    },
    // Top-level scan stats
    totalEmails:    { type: Number, default: 0 },
    summary: {
      keep:   { type: Number, default: 0 },
      review: { type: Number, default: 0 },
      delete: { type: Number, default: 0 },
    },
    // Count per category (Personal, Work, Financial, …)
    categoryCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Full classified map — stored as Mixed to preserve dynamic category keys
    // Shape: { Personal: [{id, from, subject, date, snippet}], … }
    classified: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

module.exports = mongoose.model('EmailReport', emailReportSchema);
