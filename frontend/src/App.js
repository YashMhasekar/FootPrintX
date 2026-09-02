import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Features from './components/Features';
import About from './components/About';
import Security from './components/Security';
import WebsiteTracker from './components/WebsiteTracker';
import GoogleAuthCallback from './components/GoogleAuthCallback';
import DriveCleanup from './pages/DriveCleanup';
import EmailManager from './pages/EmailManager';
import DriveClassifier from './pages/DriveClassifier';
import EmailHealth from './pages/EmailHealth';
import StorageAnalytics from './pages/StorageAnalytics';
import DigitalWellness from './pages/DigitalWellness';
import PhotosScanner from './pages/PhotosScanner';
import AutoCleanup from './pages/AutoCleanup';
import DigitalRiskScore from './pages/DigitalRiskScore';
import DataLeakMonitor from './pages/DataLeakMonitor';
import AIRiskPredictor from './pages/AIRiskPredictor';
import InstantLeakAlerts from './pages/InstantLeakAlerts';
import BreachRadarPage from './pages/BreachRadarPage';

// ── Demo Mode (public — no auth required) ──────────────────────────────────
import DemoLayout from './components/demo/DemoLayout';
import DemoDashboard from './components/demo/DemoDashboard';
import DemoDigitalRiskScore from './pages/demo/DemoDigitalRiskScore';
import DemoDriveCleanup from './pages/demo/DemoDriveCleanup';
import DemoEmailManager from './pages/demo/DemoEmailManager';
import DemoBreachRadarPage from './pages/demo/DemoBreachRadarPage';
import DemoDriveClassifier from './pages/demo/DemoDriveClassifier';
import DemoWebsiteTracker from './pages/demo/DemoWebsiteTracker';
import DemoEmailClassificationPage from './pages/demo/DemoEmailClassificationPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
  };

  // Handle Google OAuth callback redirect
  useEffect(() => {
    console.log('App.js: Checking for OAuth callback parameters...');
    console.log('App.js: Current URL:', window.location.href);
    console.log('App.js: URL search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth'); // Backend sends 'auth', not 'authStatus'
    const token = urlParams.get('token');
    const userData = urlParams.get('user'); // Backend sends 'user', not 'userData'
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('message');

    console.log('App.js: OAuth parameters found:', { authStatus, token: token ? 'present' : 'missing', userData: userData ? 'present' : 'missing', error, errorMessage });

    if (authStatus === 'success' && token && userData) {
      try {
        console.log('App.js: Processing successful OAuth callback...');
        console.log('App.js: Raw values - authStatus:', authStatus, 'token length:', token?.length, 'userData length:', userData?.length);
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', userData);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Parse user data
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        console.log('App.js: Parsed user data:', parsedUser);
        
        // Update state
        const userToSet = {
          name: `${parsedUser.firstName} ${parsedUser.lastName}`,
          email: parsedUser.email,
          avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.firstName}+${parsedUser.lastName}&background=0D9488&color=fff`
        };
        console.log('App.js: Setting user state:', userToSet);
        
        setIsLoggedIn(true);
        setUser(userToSet);

        // Clean up URL parameters and redirect to dashboard
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('App.js: OAuth callback processed successfully, user logged in');
        
        // Redirect to dashboard after successful login
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('App.js: Error parsing user data:', error);
      }
    } else if (error) {
      console.error('App.js: OAuth error:', error, errorMessage);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('App.js: No OAuth callback parameters found');
    }
  }, []);

  // Check for existing login on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const isLoggedInStored = localStorage.getItem('isLoggedIn');

        if (storedUser && storedToken && isLoggedInStored === 'true') {
          const parsedUser = JSON.parse(storedUser);
          
          // Check if the stored data already has the correct structure
          let userToSet;
          if (parsedUser.name) {
            // Data already has the correct structure
            userToSet = parsedUser;
          } else if (parsedUser.firstName && parsedUser.lastName) {
            // Data has firstName/lastName structure, convert to name structure
            userToSet = {
              name: `${parsedUser.firstName} ${parsedUser.lastName}`,
              email: parsedUser.email,
              avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.firstName}+${parsedUser.lastName}&background=0D9488&color=fff`
            };
          } else {
            // Invalid data structure
            throw new Error('Invalid user data structure');
          }
          
          setIsLoggedIn(true);
          setUser(userToSet);
          
          // Update localStorage with the correct structure
          localStorage.setItem('user', JSON.stringify(userToSet));
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Protected Route Component
  const ProtectedRoute = ({ children, redirectTo = "/" }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return <Navigate to={redirectTo} replace />;
    }

    return children;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={<Homepage onLogin={handleLogin} isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />} 
          />
          <Route 
            path="/auth/google/callback" 
            element={<GoogleAuthCallback onLogin={handleLogin} />} 
          />
          <Route 
            path="/features" 
            element={<Features />} 
          />
          <Route 
            path="/about" 
            element={<About />} 
          />
          <Route 
            path="/security" 
            element={<Security />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/website-tracker" 
            element={
              <ProtectedRoute>
                <WebsiteTracker user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Feature 1 — Drive Decay Detector */}
          <Route
            path="/drive-cleanup"
            element={
              <ProtectedRoute>
                <DriveCleanup />
              </ProtectedRoute>
            }
          />

          {/* Feature 1 — Email Subscription Manager */}
          <Route
            path="/email-manager"
            element={
              <ProtectedRoute>
                <EmailManager />
              </ProtectedRoute>
            }
          />

          {/* Feature 3 — Drive File Classifier */}
          <Route
            path="/drive-classifier"
            element={
              <ProtectedRoute>
                <DriveClassifier />
              </ProtectedRoute>
            }
          />

          {/* Analytics pages — Dashboard metric cards */}
          <Route path="/email-health" element={<ProtectedRoute><EmailHealth /></ProtectedRoute>} />
          <Route path="/storage-analytics" element={<ProtectedRoute><StorageAnalytics /></ProtectedRoute>} />
          <Route path="/digital-wellness" element={<ProtectedRoute><DigitalWellness /></ProtectedRoute>} />

          {/* Module pages — Dashboard module cards */}
          <Route path="/photos-scanner" element={<ProtectedRoute><PhotosScanner /></ProtectedRoute>} />
          <Route path="/auto-cleanup" element={<ProtectedRoute><AutoCleanup /></ProtectedRoute>} />
          <Route path="/digital-risk-score" element={<ProtectedRoute><DigitalRiskScore /></ProtectedRoute>} />

          {/* Coming Soon — Premium modules */}
          <Route path="/data-leak-monitor" element={<ProtectedRoute><DataLeakMonitor /></ProtectedRoute>} />
          <Route path="/ai-risk-predictor" element={<ProtectedRoute><AIRiskPredictor /></ProtectedRoute>} />
          <Route path="/instant-leak-alerts" element={<ProtectedRoute><InstantLeakAlerts /></ProtectedRoute>} />

          {/* Feature 5 — Privacy & Security Radar */}
          <Route path="/breach-radar" element={<ProtectedRoute><BreachRadarPage /></ProtectedRoute>} />

          {/* ── Demo Mode — public, no auth required ──────────────────── */}
          {/* /demo renders DemoDashboard (has its own DemoHeader) */}
          <Route path="/demo" element={<DemoDashboard />} />

          {/* All /demo/* sub-pages share DemoLayout (DemoHeader + Outlet) */}
          <Route path="/demo" element={<DemoLayout />}>
            <Route path="digital-risk-score"    element={<DemoDigitalRiskScore />} />
            <Route path="drive-cleanup"         element={<DemoDriveCleanup />} />
            <Route path="email-manager"         element={<DemoEmailManager />} />
            <Route path="breach-radar"          element={<DemoBreachRadarPage />} />
            <Route path="drive-classifier"      element={<DemoDriveClassifier />} />
            <Route path="website-tracker"       element={<DemoWebsiteTracker />} />
            <Route path="email-classification"  element={<DemoEmailClassificationPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;