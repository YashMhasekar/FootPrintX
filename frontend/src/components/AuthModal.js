import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Shield, 
  CheckCircle,
  X,
  Fingerprint,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const modalRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
      });
      setErrors({});
      setApiError('');
      setIsLogin(true);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Add event listeners for drag scrolling
  useEffect(() => {
    const modal = modalRef.current;
    if (modal && isOpen) {
      // Handle wheel scrolling
      const handleWheelEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const scrollAmount = e.deltaY;
        modal.scrollTop += scrollAmount * 0.5; // Increased sensitivity
      };

      // Handle mouse drag scrolling
      const handleMouseDownEvent = (e) => {
        // Don't enable drag scrolling on interactive elements
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.closest('button') || 
            e.target.closest('input') ||
            e.target.closest('label') ||
            e.target.closest('a')) {
          return;
        }
        setIsDragging(true);
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setStartY(clientY - modal.offsetTop);
        setScrollTop(modal.scrollTop);
        e.preventDefault();
      };

      const handleMouseMoveEvent = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const y = clientY - modal.offsetTop;
        const walk = (y - startY) * 2; // Increased sensitivity
        modal.scrollTop = scrollTop - walk;
      };

      const handleMouseUpEvent = () => {
        setIsDragging(false);
      };

      // Add hover effect for scrollable content
      const handleMouseEnter = () => {
        if (modal.scrollHeight > modal.clientHeight) {
          modal.style.cursor = 'grab';
        }
      };

      const handleMouseLeave = () => {
        if (!isDragging) {
          modal.style.cursor = 'auto';
        }
      };

      // Add event listeners
      modal.addEventListener('wheel', handleWheelEvent, { passive: false });
      modal.addEventListener('mousedown', handleMouseDownEvent);
      modal.addEventListener('mousemove', handleMouseMoveEvent);
      modal.addEventListener('mouseup', handleMouseUpEvent);
      modal.addEventListener('mouseleave', handleMouseUpEvent);
      modal.addEventListener('mouseenter', handleMouseEnter);
      modal.addEventListener('mouseleave', handleMouseLeave);

      // Add touch support for mobile devices
      modal.addEventListener('touchstart', handleMouseDownEvent, { passive: false });
      modal.addEventListener('touchmove', handleMouseMoveEvent, { passive: false });
      modal.addEventListener('touchend', handleMouseUpEvent);

      return () => {
        modal.removeEventListener('wheel', handleWheelEvent);
        modal.removeEventListener('mousedown', handleMouseDownEvent);
        modal.removeEventListener('mousemove', handleMouseMoveEvent);
        modal.removeEventListener('mouseup', handleMouseUpEvent);
        modal.removeEventListener('mouseleave', handleMouseUpEvent);
        modal.removeEventListener('mouseenter', handleMouseEnter);
        modal.removeEventListener('mouseleave', handleMouseLeave);
        modal.removeEventListener('touchstart', handleMouseDownEvent);
        modal.removeEventListener('touchmove', handleMouseMoveEvent);
        modal.removeEventListener('touchend', handleMouseUpEvent);
      };
    }
  }, [isOpen, isDragging, startY, scrollTop]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!isLogin && !formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const response = await apiService.login({
          email: formData.email,
          password: formData.password
        });

        // Format user data for the frontend
        const userData = {
          name: `${response.user.firstName} ${response.user.lastName}`,
          email: response.user.email,
          avatar: response.user.avatar || `https://ui-avatars.com/api/?name=${response.user.firstName}+${response.user.lastName}&background=0D9488&color=fff`
        };
        onLogin(userData);
        onClose();
      } else {
        // Handle registration
        const response = await apiService.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });

        // Format user data for the frontend
        const userData = {
          name: `${response.user.firstName} ${response.user.lastName}`,
          email: response.user.email,
          avatar: response.user.avatar || `https://ui-avatars.com/api/?name=${response.user.firstName}+${response.user.lastName}&background=0D9488&color=fff`
        };
        onLogin(userData);
        onClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setApiError(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setApiError('');

      console.log('Initiating Google OAuth...');
      
      // Get Google OAuth URL
      const { authUrl } = await apiService.getGoogleAuthUrl();
      
      console.log('Received Google OAuth URL:', authUrl);
      
      // Use direct navigation instead of popup for more reliable OAuth
      // This avoids popup blockers and cross-origin issues
      window.location.href = authUrl;

    } catch (error) {
      console.error('Google auth error:', error);
      if (error.message.includes('Google OAuth not configured')) {
        setApiError('Google OAuth is not configured on the server. Please contact support.');
      } else if (error.message.includes('Failed to generate OAuth URL')) {
        setApiError('Failed to generate Google OAuth URL. Please try again.');
      } else {
        setApiError(`Failed to initiate Google authentication: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <X size={20} />
            </button>

            {/* Scrollable Content */}
            <div 
              ref={modalRef}
              className={`flex-1 overflow-y-auto modal-scroll transition-all duration-200 ${
                isDragging ? 'cursor-grabbing' : 'cursor-auto'
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: {
                  display: 'none'
                }
              }}
            >
              <style>{`
                .modal-scroll::-webkit-scrollbar {
                  display: none;
                }
                .modal-scroll {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              {/* Content */}
              <div className="p-8 pb-16" style={{ minHeight: '120vh' }}>
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Fingerprint className="text-white" size={32} />
                      </motion.div>
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="text-white" size={12} />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-600"
                  >
                    {isLogin 
                      ? 'Sign in to your FootprintX account' 
                      : 'Join millions of users protecting their digital privacy'
                    }
                  </motion.p>
                </div>

                {/* API Error Display */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
                  >
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700 text-sm font-medium">{apiError}</span>
                  </motion.div>
                )}

                {/* Toggle Buttons */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                  <motion.button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      isLogin 
                        ? 'bg-white text-blue-600 shadow-lg' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      !isLogin 
                        ? 'bg-white text-blue-600 shadow-lg' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign Up
                  </motion.button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                              errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            }`}
                            placeholder="John"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.firstName && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-1"
                          >
                            {errors.firstName}
                          </motion.p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                              errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            }`}
                            placeholder="Doe"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.lastName && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-1"
                          >
                            {errors.lastName}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholder="+1 (555) 123-4567"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-1"
                        >
                          {errors.phone}
                        </motion.p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="john@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-1"
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </div>
                  )}

                  {!isLogin && (
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <label className="text-sm text-gray-600">
                          I agree to the{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Privacy Policy
                          </a>
                        </label>
                        {errors.agreeToTerms && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-1"
                          >
                            {errors.agreeToTerms}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
                      isLoading 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                      </div>
                    ) : (
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Social Login */}
                <motion.button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={`w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Google Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </motion.button>

                {/* Footer */}
                <div className="text-center mt-8">
                  <p className="text-gray-600">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                      disabled={isLoading}
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>

                {/* Security Badge */}
                <div className="text-center mt-8">
                  <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    <CheckCircle size={16} />
                    <span>256-bit SSL encryption</span>
                  </div>
                </div>

                {/* Extra content to ensure scrolling */}
                <div className="mt-8 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Why Choose FootprintX?</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Advanced AI-powered security analysis</li>
                      <li>• Real-time threat detection</li>
                      <li>• Comprehensive privacy protection</li>
                      <li>• 24/7 security monitoring</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Trusted by Millions</h3>
                    <p className="text-sm text-blue-600">
                      Join over 2 million users who trust FootprintX to protect their digital privacy and security.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Enterprise Grade Security</h3>
                    <p className="text-sm text-purple-600">
                      Bank-level encryption and security protocols ensure your data is always protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal; 