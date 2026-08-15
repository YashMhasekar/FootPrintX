'use strict';

/**
 * DigitalRiskScore.js
 *
 * Stores the computed digital risk score for each user.
 * Derived from the latest BreachReport score and other module signals.
 * One document per user (upserted whenever a breach radar scan completes).
 * Collection: digitalRiskScores
 */

const mongoose = require('mongoose');

const digitalRiskScoreSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one score per user
      index:    true,
    },
    // Overall score (0–100, higher is safer)
    score: { type: Number, default: 0 },
    // Human-readable level: 'Excellent' | 'Good' | 'Needs Attention' | 'At Risk'
    level: { type: String, default: 'Unknown' },
    // Breakdown by module
    breakdown: {
      emailRisk:    { type: Number, default: 0 },   // 0 = low risk, 100 = high risk
      driveRisk:    { type: Number, default: 0 },
      websiteRisk:  { type: Number, default: 0 },
      breachScore:  { type: Number, default: 0 },   // raw breach radar score (0-100)
    },
    // Component counts driving the score
    components: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Scan metadata
    lastScanned: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DigitalRiskScore', digitalRiskScoreSchema);
