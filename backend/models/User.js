const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false,
    minlength: 8
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  // Google OAuth Tokens (Encrypted)
  accessToken: {
    type: String,
    required: false,
    select: false // Don't include in default queries for security
  },
  refreshToken: {
    type: String,
    required: false,
    select: false
  },
  tokenExpiry: {
    type: Date,
    required: false
  },
  // Token Management
  lastTokenRefresh: {
    type: Date,
    required: false
  },
  tokenStatus: {
    type: String,
    enum: ['valid', 'expired', 'invalid', 'refreshing'],
    default: 'invalid'
  },
  // OAuth Information
  oauthProvider: {
    type: String,
    default: 'google'
  },
  oauthScopes: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
