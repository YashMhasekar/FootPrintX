// Use the environment variable when deployed (e.g. Netlify sets REACT_APP_API_URL).
// Falls back to localhost:5000 so local development keeps working without any changes.
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    let data;
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        console.error('JSON parsing error:', error);
        throw new Error('Invalid response format from server');
      }
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned an invalid response format');
    }
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return this.handleResponse(response);
  }

  // Get Google OAuth URL
  async getGoogleAuthUrl() {
    try {
      const response = await fetch(`${this.baseURL}/auth/google`);
      return this.handleResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection or try again later.');
      }
      throw error;
    }
  }

  // Google OAuth callback
  async googleAuthCallback(code) {
    const response = await fetch(`${this.baseURL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    const data = await this.handleResponse(response);
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  // Register user
  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await this.handleResponse(response);
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await this.handleResponse(response);
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the server is running.');
      }
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    const response = await fetch(`${this.baseURL}/user/profile`, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await fetch(`${this.baseURL}/user/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    
    return this.handleResponse(response);
  }

  // Change password
  async changePassword(passwordData) {
    const response = await fetch(`${this.baseURL}/user/change-password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    
    return this.handleResponse(response);
  }

  // Logout (clear local storage)
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get stored JWT token
  getToken() {
    return localStorage.getItem('token');
  }

  // Google OAuth Token Management for Website Tracker
  async getGoogleAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/token`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting Google access token:', error);
      throw error;
    }
  }

  // Check if user has valid Google OAuth token
  async checkGoogleTokenValidity() {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/token`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      const data = await this.handleResponse(response);
      return {
        isValid: true,
        accessToken: data.accessToken,
        message: data.message
      };
    } catch (error) {
      if (error.message.includes('requiresReauth')) {
        return {
          isValid: false,
          requiresReauth: true,
          message: 'Token expired, re-authentication required'
        };
      }
      return {
        isValid: false,
        requiresReauth: false,
        message: error.message
      };
    }
  }

  // Re-authenticate with Google (for expired tokens)
  async reauthenticateGoogle() {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/reauth`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error initiating Google re-authentication:', error);
      throw error;
    }
  }

  // Debug: Get encrypted token information for current user
  async getGoogleTokenDebugInfo() {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/tokens/debug`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting token debug info:', error);
      throw error;
    }
  }

  // Admin: Get all users' token status
  async getAllUsersTokenStatus() {
    try {
      const response = await fetch(`${this.baseURL}/admin/users/tokens`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error getting all users token status:', error);
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Feature 1 — Drive Decay Detector
  // -----------------------------------------------------------------------

  // GET /api/drive/summary
  // Returns storage usage broken down by category (fast, no ML call).
  async getDriveSummary() {
    const response = await fetch(`${this.baseURL}/drive/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/drive/files
  // Returns the full file list scored by the ML microservice.
  async getScoredFiles() {
    const response = await fetch(`${this.baseURL}/drive/files`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // -----------------------------------------------------------------------
  // Feature 1 — Email Subscription Manager
  // -----------------------------------------------------------------------

  // POST /api/email/scan
  // Scans Gmail for subscription-style senders and caches results in MongoDB.
  async scanSubscriptions() {
    const response = await fetch(`${this.baseURL}/email/scan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/email/subscriptions
  // Returns the cached subscription list (fast reload, no Gmail call).
  async getSubscriptions() {
    const response = await fetch(`${this.baseURL}/email/subscriptions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // POST /api/email/unsubscribe
  // Unsubscribes from a single sender.
  // subscription: { senderEmail, unsubscribeMethod, unsubscribeUrl?,
  //                 unsubscribeMailto? }
  async unsubscribeOne(subscription) {
    const response = await fetch(`${this.baseURL}/email/unsubscribe`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(subscription),
    });
    return this.handleResponse(response);
  }

  // POST /api/email/unsubscribe/bulk
  // Unsubscribes from multiple senders in one call.
  // subscriptions: Array<{ senderEmail, unsubscribeMethod, ... }>
  async unsubscribeBulk(subscriptions) {
    const response = await fetch(`${this.baseURL}/email/unsubscribe/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ subscriptions }),
    });
    return this.handleResponse(response);
  }

  // -----------------------------------------------------------------------
  // Feature 2 — Email Classification + Bulk Delete
  // -----------------------------------------------------------------------

  // GET /api/email-classification/report
  // Returns the latest stored email classification report (no Gmail call).
  async getEmailReport() {
    const response = await fetch(`${this.baseURL}/email-classification/report`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/email-classification/cleanup-report
  // Returns the latest stored auto-cleanup statistics.
  async getCleanupReport() {
    const response = await fetch(`${this.baseURL}/email-classification/cleanup-report`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/email-classification/history
  // Returns scan history for the email classification module.
  async getEmailScanHistory(limit = 50) {
    const response = await fetch(`${this.baseURL}/email-classification/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // POST /api/email-classification/scan
  // Fetches emails from Gmail, classifies them, and returns categorised results.
  // Optional query params forwarded via caller: maxResults, query.
  async scanEmails() {
    const response = await fetch(`${this.baseURL}/email-classification/scan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // POST /api/email-classification/trash
  // Moves emailIds to Gmail Trash (recoverable for 30 days).
  // emailIds: string[]   dryRun: boolean (default false)
  async trashEmails(emailIds, dryRun = false) {
    const response = await fetch(`${this.baseURL}/email-classification/trash`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ emailIds, dryRun }),
    });
    return this.handleResponse(response);
  }

  // POST /api/email-classification/delete
  // Permanently deletes emailIds via Gmail batchDelete. Cannot be undone.
  // emailIds: string[]   dryRun: boolean (default false)
  async deleteEmails(emailIds, dryRun = false) {
    const response = await fetch(`${this.baseURL}/email-classification/delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ emailIds, dryRun }),
    });
    return this.handleResponse(response);
  }

  // POST /api/email-classification/verify
  // Checks whether the supplied emailIds were successfully deleted/trashed.
  // emailIds: string[]
  async verifyDeletion(emailIds) {
    const response = await fetch(`${this.baseURL}/email-classification/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ emailIds }),
    });
    return this.handleResponse(response);
  }

  // -----------------------------------------------------------------------
  // Feature 3 — Drive File Classifier
  // -----------------------------------------------------------------------

  // GET /api/drive-classifier/report
  // Returns the latest stored Drive classification report (no Drive API call).
  async getDriveReport() {
    const response = await fetch(`${this.baseURL}/drive-classifier/report`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/drive-classifier/history
  async getDriveScanHistory(limit = 50) {
    const response = await fetch(`${this.baseURL}/drive-classifier/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/drive-classifier/classify
  // Fetches all Drive files, classifies them by MIME type (with OpenAI
  // fallback for ambiguous types), and returns:
  //   { summary, categoryCounts, classifiedFiles }
  async classifyDriveFiles() {
    const response = await fetch(`${this.baseURL}/drive-classifier/classify`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // -----------------------------------------------------------------------
  // Feature 4 — Website Tracker
  // -----------------------------------------------------------------------

  // GET /api/website-tracker/report
  // Returns the latest stored website tracker report (no Gmail call).
  async getWebsiteReport() {
    const response = await fetch(`${this.baseURL}/website-tracker/report`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/website-tracker/history
  async getWebsiteScanHistory(limit = 50) {
    const response = await fetch(`${this.baseURL}/website-tracker/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/website-tracker/scan
  // Scans Gmail inbox, extracts sender domains, groups and categorises them.
  // Returns: { totalWebsites, categoryCounts, activeCount, inactiveCount, websites[] }
  // Optional: maxMessages query param (default 300)
  async scanWebsites({ maxMessages } = {}) {
    const params = maxMessages ? `?maxMessages=${maxMessages}` : '';
    const response = await fetch(`${this.baseURL}/website-tracker/scan${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // -----------------------------------------------------------------------
  // Feature 5 — Privacy & Security Radar (Breach Radar)
  // -----------------------------------------------------------------------

  // GET /api/breach-radar/report
  // Returns the latest stored breach radar report (no Drive/Gmail call).
  async getBreachReport() {
    const response = await fetch(`${this.baseURL}/breach-radar/report`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/breach-radar/risk-score
  // Returns the latest stored digital risk score.
  async getDigitalRiskScore() {
    const response = await fetch(`${this.baseURL}/breach-radar/risk-score`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/breach-radar/history
  async getBreachScanHistory(limit = 50) {
    const response = await fetch(`${this.baseURL}/breach-radar/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // GET /api/breach-radar/scan
  // Runs a full Privacy & Security Radar scan using Drive, Drive Classifier,
  // and Website Tracker data.
  // Returns: { score, level, summary, alerts[], recommendations[], statistics }
  async scanBreachRadar() {
    const response = await fetch(`${this.baseURL}/breach-radar/scan`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;