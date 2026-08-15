import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const GoogleAuthCallback = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        console.log('GoogleAuthCallback: Processing OAuth callback...');
        
        // Get URL parameters
        const authStatus = searchParams.get('auth');
        const token = searchParams.get('token');
        const userData = searchParams.get('user');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        console.log('GoogleAuthCallback: Parameters:', { 
          authStatus, 
          hasToken: !!token, 
          hasUserData: !!userData, 
          error, 
          errorMessage 
        });

        if (error) {
          console.error('GoogleAuthCallback: OAuth error:', error, errorMessage);
          setStatus('error');
          setMessage(errorMessage || 'Authentication failed');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }

        if (authStatus === 'success' && token && userData) {
          try {
            console.log('GoogleAuthCallback: Processing successful authentication...');
            
            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', userData);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Parse user data
            const parsedUser = JSON.parse(decodeURIComponent(userData));
            console.log('GoogleAuthCallback: Parsed user data:', parsedUser);
            
            // Create user object for the app
            const userToSet = {
              name: `${parsedUser.firstName} ${parsedUser.lastName}`,
              email: parsedUser.email,
              avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.firstName}+${parsedUser.lastName}&background=0D9488&color=fff`
            };
            
            console.log('GoogleAuthCallback: Setting user state:', userToSet);
            
            // Call the onLogin callback from parent
            if (onLogin) {
              onLogin(userToSet);
            }
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting to dashboard...');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            
          } catch (parseError) {
            console.error('GoogleAuthCallback: Error parsing user data:', parseError);
            setStatus('error');
            setMessage('Failed to process user data');
            
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } else {
          console.error('GoogleAuthCallback: Missing required parameters');
          setStatus('error');
          setMessage('Invalid authentication response');
          
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
        
      } catch (error) {
        console.error('GoogleAuthCallback: Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          {status === 'processing' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-6"
              >
                <Loader className="w-16 h-16 text-blue-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Processing Authentication
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Success!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-6"
              >
                <XCircle className="w-16 h-16 text-red-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Authentication Failed
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleAuthCallback;
