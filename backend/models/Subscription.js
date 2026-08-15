'use strict';

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    // userId replaces sessionUserId from the Feature1 standalone server.
    // Typed as an ObjectId reference to keep it consistent with the rest of
    // the main project's data model (User._id).
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    senderEmail: { type: String, required: true },
    senderName:  String,
    category:    { type: String, default: 'Other' },
    emailCount:  { type: Number, default: 0 },
    latestSubject: String,
    latestDate:    Date,
    unsubscribeMethod: {
      type:    String,
      enum:    ['one-click', 'mailto', 'link', 'none'],
      default: 'none',
    },
    unsubscribeUrl:     String,
    unsubscribeMailto:  String,
    oneClickSupported:  { type: Boolean, default: false },
    bodyLinkOnly:       { type: Boolean, default: false },
    status: {
      type:    String,
      enum:    ['active', 'unsubscribe_sent', 'manual_pending', 'filtered', 'failed'],
      default: 'active',
    },
    lastActionAt: Date,
  },
  { timestamps: true }
);

// Compound unique index — one record per (user, sender).
// Mirrors the { sessionUserId, senderEmail } unique index from Feature1.
subscriptionSchema.index({ userId: 1, senderEmail: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
